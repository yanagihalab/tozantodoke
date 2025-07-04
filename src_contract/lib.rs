use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, BankMsg, Coin
};
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ClimbingInfoResponse};
use crate::state::{ClimbingInfo, CLIMBING_INFOS, SUMMIT_PROOFS};

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::SubmitClimbingInfo { mountain, climb_date, return_date } => {
            let deposit = &info.funds[0];
            CLIMBING_INFOS.save(
                deps.storage,
                &info.sender,
                &ClimbingInfo {
                    mountain,
                    climb_date,
                    return_date,
                    deposit_amount: deposit.amount.u128(),
                    deposit_denom: deposit.denom.clone(),
                    returned: false,
                },
            )?;
            Ok(Response::default())
        },
        ExecuteMsg::SubmitDescent { descent_date: _ } => {
            let mut climbing_info = CLIMBING_INFOS.load(deps.storage, &info.sender)?;
            climbing_info.returned = true;
            CLIMBING_INFOS.save(deps.storage, &info.sender, &climbing_info)?;

            let refund_msg = BankMsg::Send {
                to_address: info.sender.to_string(),
                amount: vec![Coin {
                    denom: climbing_info.deposit_denom,
                    amount: climbing_info.deposit_amount.into(),
                }],
            };
            Ok(Response::new().add_message(refund_msg))
        },
        ExecuteMsg::SubmitSummitProof { mountain, summit_date } => {
            let mut proofs = SUMMIT_PROOFS.may_load(deps.storage, &info.sender)?.unwrap_or_default();
            proofs.push(crate::state::SummitProof { mountain, summit_date });
            SUMMIT_PROOFS.save(deps.storage, &info.sender, &proofs)?;
            Ok(Response::default())
        },
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetClimbingInfo { address } => {
            let addr = deps.api.addr_validate(&address)?;
            let climbing_info = CLIMBING_INFOS.load(deps.storage, &addr)?;
            let resp = ClimbingInfoResponse {
                mountain: climbing_info.mountain,
                climb_date: climbing_info.climb_date,
                return_date: climbing_info.return_date,
                deposit_amount: climbing_info.deposit_amount,
                deposit_denom: climbing_info.deposit_denom,
            };
            Ok(to_binary(&resp)?)
        }
    }
}
