// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPddBargainVault
/// @notice On-chain 砍一刀 (bargain) treasury + invite/claim surface for the PDD Flap token.
interface IPddBargainVault {
    event RevenueRecognized(uint256 amount, uint256 accountedQuote);
    event InviteCreated(bytes32 indexed codeHash, address indexed inviter, string codeHint);
    event Helped(bytes32 indexed codeHash, address indexed helper, uint32 helpCount);
    event Claimed(bytes32 indexed codeHash, address indexed inviter, uint256 amount, uint256 vaultBalanceAfter);
    event TokenUpdated(address indexed oldToken, address indexed newToken);
    event MinHoldUpdated(uint256 oldAmount, uint256 newAmount);
    event ParamsUpdated(uint32 helpsRequired, uint16 claimBps);

    error ZeroAddress();
    error InvalidCode();
    error InviteExists();
    error InviteMissing();
    error NotInviter();
    error AlreadyClaimed();
    error AlreadyHelped();
    error CannotHelpSelf();
    error InsufficientHoldings();
    error NotEnoughHelps(uint32 have, uint32 need);
    error NothingToClaim();
    error TransferFailed();
    error Unauthorized();
    error InvalidParams();

    function token() external view returns (address);
    function accountedQuote() external view returns (uint256);
    function helpsRequired() external view returns (uint32);
    function claimBps() external view returns (uint16);
    function minHoldAmount() external view returns (uint256);

    function createInvite(string calldata code) external;
    function help(string calldata code) external;
    function claim(string calldata code) external;
    function sync() external;

    function codeHashOf(string calldata code) external pure returns (bytes32);
    function vaultBalance() external view returns (uint256);
    function claimableAmount(string calldata code) external view returns (uint256);
    function campaignOf(bytes32 codeHash)
        external
        view
        returns (address inviter, uint32 helpCount, bool claimed, uint256 claimedAmount);
}
