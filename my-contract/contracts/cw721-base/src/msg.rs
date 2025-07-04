use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Timestamp;

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    SubmitClimbingInfo {
        mountain: String,
        start_date: Timestamp,
        deposit_amount: u128,
        deposit_denom: String,
    },
    SubmitDescentInfo {
        return_date: Timestamp,
    },
    SubmitWarningInfo {
        nft_owner: String,
        warning_message: String,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ClimbingInfoResponse)]
    GetClimbingInfo { climber: String },

    #[returns(ActiveClimbsResponse)]
    ListActiveClimbs {},

    #[returns(AllClimbsResponse)]
    ListAllClimbs { start_after: Option<String>, limit: Option<u32> },

    #[returns(DepositStatusResponse)]
    GetDepositStatus { climber: String },

    #[returns(WarningInfoResponse)]
    GetWarningInfo { nft_owner: String },
}

#[cw_serde]
pub struct ClimbingInfoResponse {
    pub climber: String,
    pub mountain: String,
    pub start_date: Timestamp,
    pub return_date: Option<Timestamp>,
    pub deposit_amount: String,
    pub deposit_denom: String,
}

#[cw_serde]
pub struct ActiveClimbsResponse {
    pub active_climbs: Vec<ClimbingInfoResponse>,
}

#[cw_serde]
pub struct AllClimbsResponse {
    pub climbs: Vec<ClimbingInfoResponse>,
}

#[cw_serde]
pub struct DepositStatusResponse {
    pub climber: String,
    pub deposit_returned: bool,
}

#[cw_serde]
pub struct WarningInfoResponse {
    pub warning_info: Option<crate::state::WarningInfo>, // ここをstate.rsから参照
}
