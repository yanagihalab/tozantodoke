use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Timestamp};
use cw_storage_plus::Map;

#[cw_serde]
pub struct ClimbingInfo {
    pub climber: Addr,
    pub mountain: String,
    pub start_date: Timestamp,
    pub return_date: Option<Timestamp>,
    pub deposit_amount: u128,
    pub deposit_denom: String,
}

#[cw_serde]
pub struct NftInfo {
    pub climber: Addr,
    pub mountain: String,
    pub start_date: Timestamp,
    pub return_date: Timestamp,
}

#[cw_serde]
pub struct WarningInfo {
    pub reporter: Addr,
    pub mountain: String,
    pub warning_message: String,
    pub timestamp: Timestamp,
}

// ストレージ定義
pub const CLIMBING_INFOS: Map<&str, ClimbingInfo> = Map::new("climbing_infos");
pub const NFTS: Map<&str, NftInfo> = Map::new("nfts");
pub const WARNINGS: Map<&str, WarningInfo> = Map::new("warnings");
