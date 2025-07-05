mod msg;
mod state;
mod error;

use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Order, Timestamp
};
use crate::msg::{
    InstantiateMsg, ExecuteMsg, QueryMsg, ClimbingInfoResponse, ActiveClimbsResponse,
    AllClimbsResponse, DepositStatusResponse, WarningInfoResponse,
};
use cw_storage_plus::Bound;
use crate::state::{ClimbingInfo, CLIMBING_INFOS, NFTS, NftInfo, WARNINGS, WarningInfo};
use crate::error::ContractError;

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    Ok(Response::new())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    let climber = info.sender;

    match msg {
        ExecuteMsg::SubmitClimbingInfo { 
            mountain, 
            start_date, 
            scheduled_return_date,
            deposit_amount, 
            deposit_denom 
        } => {
            let climbing_key = (
                climber.clone(),
                mountain.clone(),
                start_date.seconds().to_string(),
            );

            if CLIMBING_INFOS.may_load(deps.storage, climbing_key.clone())?.is_some() {
                return Err(ContractError::ClimbingInfoAlreadyExists {});
            }

            let climbing_info = ClimbingInfo {
                climber: climber.clone(),
                mountain,
                start_date,
                scheduled_return_date,
                actual_return_date: None,
                deposit_amount,
                deposit_denom,
                is_climbing: true, 
            };

            CLIMBING_INFOS.save(deps.storage, climbing_key, &climbing_info)?;

            Ok(Response::new().add_attribute("action", "submit_climbing_info"))
        },

        ExecuteMsg::SubmitDescentInfo { mountain, start_date } => {
            let climbing_key = (
                climber.clone(),
                mountain.clone(),
                start_date.seconds().to_string()
            );

            let current_time = env.block.time;

            CLIMBING_INFOS.update(
                deps.storage, 
                climbing_key.clone(), 
                |info| {
                    let mut info = info.ok_or(ContractError::ClimbingInfoNotFound {})?;
                    if info.actual_return_date.is_some() {
                        return Err(ContractError::DepositAlreadyReturned {});
                    }
                    if current_time < info.start_date {
                        return Err(ContractError::InvalidReturnDate {});
                    }

                    info.actual_return_date = Some(current_time);
                    info.is_climbing = false;
                    Ok(info)
                }
            )?;

            let climbing_info = CLIMBING_INFOS.load(deps.storage, climbing_key)?;
            let nft_info = NftInfo {
                climber: climber.clone(),
                mountain: climbing_info.mountain,
                start_date: climbing_info.start_date,
                return_date: current_time,
            };
            NFTS.save(deps.storage, climber.as_ref(), &nft_info)?;

            Ok(Response::new().add_attribute("action", "submit_descent_info_and_mint_nft"))
        },

        ExecuteMsg::SubmitWarningInfo { nft_owner, warning_message } => {
            let nft_info = NFTS.load(deps.storage, nft_owner.as_ref())?;

            if env.block.time.seconds() > nft_info.return_date.plus_seconds(2592000).seconds() {
                return Err(ContractError::WarningSubmissionPeriodExpired {});
            }

            let warning_info = WarningInfo {
                reporter: climber,
                mountain: nft_info.mountain,
                warning_message,
                timestamp: env.block.time,
            };

            WARNINGS.save(deps.storage, nft_owner.as_ref(), &warning_info)?;

            Ok(Response::new().add_attribute("action", "submit_warning_info"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetClimbingInfo { climber } => {
            let climber_addr = deps.api.addr_validate(&climber)?;

            // (Addr, "")から(Addr, "zzzzzzzz")までを範囲検索し、すべての山を含める
            let prefix = CLIMBING_INFOS.prefix_range(
                deps.storage,
                Some(cw_storage_plus::PrefixBound::inclusive((climber_addr.clone(), "".to_string()))),
                Some(cw_storage_plus::PrefixBound::inclusive((climber_addr.clone(), "zzzzzzzz".to_string()))),
                Order::Descending,
            );

            let info = prefix
                .take(1)
                .collect::<StdResult<Vec<_>>>()?
                .into_iter()
                .next()
                .map(|(_start_date_sec, info)| info)  // ← ここを修正（キーは1つの要素のみ）
                .ok_or_else(|| cosmwasm_std::StdError::not_found("ClimbingInfo"))?;


            to_json_binary(&ClimbingInfoResponse {
                climber,
                mountain: info.mountain,
                start_date: info.start_date,
                scheduled_return_date: info.scheduled_return_date,
                actual_return_date: info.actual_return_date,
                deposit_amount: info.deposit_amount.to_string(),
                deposit_denom: info.deposit_denom,
                is_climbing: info.is_climbing,
            })
        }
         QueryMsg::ListActiveClimbs {} => {
            let active_climbs = CLIMBING_INFOS
                .range(deps.storage, None, None, Order::Descending)
                .filter_map(|item| {
                    item.ok().and_then(|((addr, mountain, start_sec), info)| {
                        if info.is_climbing {
                            Some(ClimbingInfoResponse {
                                climber: addr.to_string(),
                                mountain,
                                start_date: Timestamp::from_seconds(start_sec.parse().unwrap_or_default()),
                                scheduled_return_date: info.scheduled_return_date,
                                actual_return_date: info.actual_return_date,
                                deposit_amount: info.deposit_amount.to_string(),
                                deposit_denom: info.deposit_denom,
                                is_climbing: info.is_climbing,
                            })
                        } else { None }
                    })
                })
                .collect();

            to_json_binary(&ActiveClimbsResponse { active_climbs })
        }

        QueryMsg::GetDepositStatus { climber } => {
            let climber_addr = deps.api.addr_validate(&climber)?;

            let start = Some(Bound::inclusive((
                climber_addr.clone(),
                "".to_string(),
                "".to_string(),
            )));
            let end = Some(Bound::inclusive((
                climber_addr.clone(),
                "zzzzzzzz".to_string(),
                "9999999999".to_string(),
            )));

            let latest_info = CLIMBING_INFOS
                .range(deps.storage, start, end, Order::Descending)
                .take(1)
                .map(|item| item.map(|((_addr, _mountain, _start_date), info)| info))
                .collect::<StdResult<Vec<_>>>()?
                .into_iter()
                .next()
                .ok_or_else(|| cosmwasm_std::StdError::not_found("ClimbingInfo"))?;

            to_json_binary(&DepositStatusResponse {
                climber,
                deposit_returned: latest_info.actual_return_date.is_some(),
            })
        }

        // QueryMsg::GetWarningInfoの修正版
        QueryMsg::GetWarningInfo { nft_owner } => {
            let nft_owner_addr = deps.api.addr_validate(&nft_owner)?;
            let warning_info = WARNINGS.may_load(deps.storage, nft_owner_addr.as_ref())?;
            to_json_binary(&WarningInfoResponse { warning_info })
        }

       QueryMsg::ListAllClimbs { start_after, limit } => {
            let limit = limit.unwrap_or(10).min(30) as usize;

            let start_bound = start_after.map(|s| {
                let parts: Vec<&str> = s.split(':').collect();
                Bound::exclusive((
                    deps.api.addr_validate(parts[0]).unwrap(),
                    parts[1].to_string(),
                    parts[2].to_string(),
                ))
            });

            let climbs = CLIMBING_INFOS
                .range(deps.storage, start_bound, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    let ((addr, mountain, start_sec), info) = item?;
                    Ok(ClimbingInfoResponse {
                        climber: addr.to_string(),
                        mountain,
                        start_date: Timestamp::from_seconds(start_sec.parse().unwrap_or_default()),
                        scheduled_return_date: info.scheduled_return_date,
                        actual_return_date: info.actual_return_date,
                        deposit_amount: info.deposit_amount.to_string(),
                        deposit_denom: info.deposit_denom,
                        is_climbing: info.is_climbing,
                    })
                })
                .collect::<StdResult<Vec<_>>>()?;

            to_json_binary(&AllClimbsResponse { climbs })
        }
    }
}
