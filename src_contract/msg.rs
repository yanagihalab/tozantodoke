use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    SubmitClimbingInfo {
        mountain: String,
        climb_date: String,
        return_date: String,
    },
    SubmitDescent {
        descent_date: String,
    },
    SubmitSummitProof {
        mountain: String,
        summit_date: String,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ClimbingInfoResponse)]
    GetClimbingInfo { address: String },
}

#[cw_serde]
pub struct ClimbingInfoResponse {
    pub mountain: String,
    pub climb_date: String,
    pub return_date: String,
    pub deposit_amount: u128,
    pub deposit_denom: String,
}
