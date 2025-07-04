mod msg;
mod state;
mod error;

use cosmwasm_std::{entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Order};
use crate::msg::{InstantiateMsg, ExecuteMsg, QueryMsg, ClimbingInfoResponse, ActiveClimbsResponse, AllClimbsResponse, DepositStatusResponse, WarningInfoResponse};
use crate::state::{ClimbingInfo, CLIMBING_INFOS, NFTS, NftInfo, WARNINGS, WarningInfo};
use crate::error::ContractError;
use cw_storage_plus::Bound;

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
        ExecuteMsg::SubmitClimbingInfo { mountain, start_date, deposit_amount, deposit_denom } => {
            if CLIMBING_INFOS.may_load(deps.storage, climber.as_ref())?.is_some() {
                return Err(ContractError::ClimbingInfoAlreadyExists {});
            }

            let climbing_info = ClimbingInfo {
                climber: climber.clone(),
                mountain,
                start_date,
                return_date: None,
                deposit_amount,
                deposit_denom,
            };

            CLIMBING_INFOS.save(deps.storage, climber.as_ref(), &climbing_info)?;
            Ok(Response::new().add_attribute("action", "submit_climbing_info"))
        },

        ExecuteMsg::SubmitDescentInfo { return_date } => {
            CLIMBING_INFOS.update(deps.storage, climber.as_ref(), |info| {
                let mut info = info.ok_or(ContractError::ClimbingInfoNotFound {})?;
                if info.return_date.is_some() {
                    return Err(ContractError::DepositAlreadyReturned {});
                }
                if return_date < info.start_date {
                    return Err(ContractError::InvalidReturnDate {});
                }

                info.return_date = Some(return_date);
                Ok(info)
            })?;

            let climbing_info = CLIMBING_INFOS.load(deps.storage, climber.as_ref())?;
            let nft_info = NftInfo {
                climber: climber.clone(),
                mountain: climbing_info.mountain,
                start_date: climbing_info.start_date,
                return_date,
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
            let info = CLIMBING_INFOS.load(deps.storage, climber_addr.as_ref())?;
            to_json_binary(&ClimbingInfoResponse {
                climber,
                mountain: info.mountain,
                start_date: info.start_date,
                return_date: info.return_date,
                deposit_amount: info.deposit_amount.to_string(),
                deposit_denom: info.deposit_denom,
            })
        }
        QueryMsg::ListActiveClimbs {} => {
            let active_climbs: StdResult<Vec<_>> = CLIMBING_INFOS
                .range(deps.storage, None, None, Order::Ascending)
                .filter_map(|item| {
                    let (_, info) = item.ok()?;
                    if info.return_date.is_none() {
                        Some(Ok(ClimbingInfoResponse {
                            climber: info.climber.to_string(),
                            mountain: info.mountain,
                            start_date: info.start_date,
                            return_date: info.return_date,
                            deposit_amount: info.deposit_amount.to_string(),
                            deposit_denom: info.deposit_denom,
                        }))
                    } else {
                        None
                    }
                })
                .collect();

            to_json_binary(&ActiveClimbsResponse { active_climbs: active_climbs? })
        }
        QueryMsg::ListAllClimbs { start_after, limit } => {
            let limit = limit.unwrap_or(10).min(30) as usize;
            let start = start_after.as_deref().map(Bound::exclusive);
            let climbs: StdResult<Vec<_>> = CLIMBING_INFOS
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| {
                    item.map(|(_, info)| ClimbingInfoResponse {
                        climber: info.climber.to_string(),
                        mountain: info.mountain,
                        start_date: info.start_date,
                        return_date: info.return_date,
                        deposit_amount: info.deposit_amount.to_string(),
                        deposit_denom: info.deposit_denom,
                    })
                })
                .collect();

            to_json_binary(&AllClimbsResponse { climbs: climbs? })
        }
        QueryMsg::GetDepositStatus { climber } => {
            let climber_addr = deps.api.addr_validate(&climber)?;
            let info = CLIMBING_INFOS.load(deps.storage, climber_addr.as_ref())?;
            to_json_binary(&DepositStatusResponse {
                climber,
                deposit_returned: info.return_date.is_some(),
            })
        }
        QueryMsg::GetWarningInfo { nft_owner } => {
            let warning_info = WARNINGS.may_load(deps.storage, nft_owner.as_ref())?;
            to_json_binary(&WarningInfoResponse { warning_info })
        }
    }
}
