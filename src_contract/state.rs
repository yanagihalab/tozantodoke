use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::Map;

#[cw_serde]
pub struct ClimbingInfo {
    pub mountain: String,
    pub climb_date: String,
    pub return_date: String,
    pub deposit_amount: u128,
    pub deposit_denom: String,
    pub returned: bool,
}

#[cw_serde]
pub struct SummitProof {
    pub mountain: String,
    pub summit_date: String,
}

pub const CLIMBING_INFOS: Map<&Addr, ClimbingInfo> = Map::new("climbing_infos");
pub const SUMMIT_PROOFS: Map<&Addr, Vec<SummitProof>> = Map::new("summit_proofs");
