use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Climbing Info Already Exists")]
    ClimbingInfoAlreadyExists {},

    #[error("Climbing Info Not Found")]
    ClimbingInfoNotFound {},

    #[error("Deposit Not Found")]
    DepositNotFound {},

    #[error("Deposit Already Returned")]
    DepositAlreadyReturned {},

    #[error("Invalid Return Date")]
    InvalidReturnDate {},

    #[error("Warning submission period has expired")]
    WarningSubmissionPeriodExpired {},

    #[error("Invalid Input: {msg}")]
    InvalidInput { msg: String },
}
