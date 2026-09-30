// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPddBargainVault} from "./interfaces/IPddBargainVault.sol";

interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title PddBargainVault
/// @notice Treasury that receives Flap sell-tax in native BNB or an ERC20 quote,
///         and runs 砍一刀 invite / help / claim (~5 helps → ~5% of vault).
/// @dev quoteToken_ = address(0) → native BNB; otherwise ERC20 quote (e.g. PDDB).
contract PddBargainVault is IPddBargainVault {
    uint16 public constant BPS_DENOM = 10_000;

    address public owner;
    address public token;
    /// @notice Flap quote currency: address(0) = native BNB, else ERC20.
    address public immutable quoteToken;
    uint256 public accountedQuote;
    uint32 public helpsRequired;
    uint16 public claimBps;
    uint256 public minHoldAmount;

    struct Campaign {
        address inviter;
        uint32 helpCount;
        bool claimed;
        uint256 claimedAmount;
    }

    mapping(bytes32 => Campaign) private _campaigns;
    mapping(bytes32 => mapping(address => bool)) public hasHelped;
    mapping(address => bytes32) public latestInvite;

    bool private _locked;

    modifier nonReentrant() {
        require(!_locked, "REENTRANCY");
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address token_, address owner_, uint256 minHoldAmount_, address quoteToken_) {
        if (owner_ == address(0)) revert ZeroAddress();
        owner = owner_;
        token = token_;
        quoteToken = quoteToken_;
        helpsRequired = 5;
        claimBps = 500;
        minHoldAmount = minHoldAmount_;
    }

    function vaultQuoteToken() external view returns (address) {
        return quoteToken;
    }

    function vaultSpecVersion() external pure returns (string memory) {
        return "v3";
    }

    function description() external view returns (string memory) {
        return string.concat(
            unicode"PDD Bargain Vault (\u780d\u4e00\u5200). Balance: ",
            _uToString(vaultBalance()),
            " wei. Helps required: ",
            _uToString(helpsRequired),
            ". Claim: ",
            _uToString(claimBps),
            " bps of vault."
        );
    }

    function vaultUISchema() external pure returns (string memory) {
        return "pdd-bargain-v1:createInvite,help,claim,sync,vaultBalance,campaignOf";
    }

    receive() external payable {
        _syncRevenue();
    }

    function sync() external {
        _syncRevenue();
    }

    function vaultBalance() public view returns (uint256) {
        if (quoteToken == address(0)) {
            return address(this).balance;
        }
        return IERC20Minimal(quoteToken).balanceOf(address(this));
    }

    function _syncRevenue() internal {
        uint256 bal = vaultBalance();
        if (bal <= accountedQuote) return;
        uint256 newRevenue = bal - accountedQuote;
        accountedQuote = bal;
        emit RevenueRecognized(newRevenue, accountedQuote);
    }

    function _spend(uint256 amount) internal {
        uint256 baseline = accountedQuote;
        if (amount > baseline) {
            accountedQuote = 0;
        } else {
            accountedQuote = baseline - amount;
        }
    }

    function _pay(address to, uint256 amount) internal {
        if (quoteToken == address(0)) {
            (bool ok,) = payable(to).call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            bool ok = IERC20Minimal(quoteToken).transfer(to, amount);
            if (!ok) revert TransferFailed();
        }
    }

    function codeHashOf(string calldata code) public pure returns (bytes32) {
        bytes memory raw = bytes(code);
        if (raw.length < 4 || raw.length > 64) revert InvalidCode();
        return keccak256(raw);
    }

    function campaignOf(bytes32 codeHash)
        external
        view
        returns (address inviter, uint32 helpCount, bool claimed, uint256 claimedAmount)
    {
        Campaign storage c = _campaigns[codeHash];
        return (c.inviter, c.helpCount, c.claimed, c.claimedAmount);
    }

    function createInvite(string calldata code) external {
        _syncRevenue();
        if (token == address(0)) revert ZeroAddress();
        if (IERC20Minimal(token).balanceOf(msg.sender) < minHoldAmount) {
            revert InsufficientHoldings();
        }

        bytes32 hash = codeHashOf(code);
        if (_campaigns[hash].inviter != address(0)) revert InviteExists();

        _campaigns[hash] = Campaign({
            inviter: msg.sender,
            helpCount: 0,
            claimed: false,
            claimedAmount: 0
        });
        latestInvite[msg.sender] = hash;
        emit InviteCreated(hash, msg.sender, _prefix(code, 4));
    }

    function help(string calldata code) external {
        bytes32 hash = codeHashOf(code);
        Campaign storage c = _campaigns[hash];
        if (c.inviter == address(0)) revert InviteMissing();
        if (c.claimed) revert AlreadyClaimed();
        if (msg.sender == c.inviter) revert CannotHelpSelf();
        if (hasHelped[hash][msg.sender]) revert AlreadyHelped();

        hasHelped[hash][msg.sender] = true;
        unchecked {
            c.helpCount += 1;
        }
        emit Helped(hash, msg.sender, c.helpCount);
    }

    function claimableAmount(string calldata code) external view returns (uint256) {
        bytes32 hash = codeHashOf(code);
        Campaign storage c = _campaigns[hash];
        if (c.inviter == address(0) || c.claimed || c.helpCount < helpsRequired) {
            return 0;
        }
        return (vaultBalance() * uint256(claimBps)) / uint256(BPS_DENOM);
    }

    function claim(string calldata code) external nonReentrant {
        _syncRevenue();
        bytes32 hash = codeHashOf(code);
        Campaign storage c = _campaigns[hash];
        if (c.inviter == address(0)) revert InviteMissing();
        if (msg.sender != c.inviter) revert NotInviter();
        if (c.claimed) revert AlreadyClaimed();
        if (c.helpCount < helpsRequired) revert NotEnoughHelps(c.helpCount, helpsRequired);

        uint256 bal = vaultBalance();
        uint256 amount = (bal * uint256(claimBps)) / uint256(BPS_DENOM);
        if (amount == 0) revert NothingToClaim();

        c.claimed = true;
        c.claimedAmount = amount;
        _spend(amount);
        _pay(msg.sender, amount);

        emit Claimed(hash, msg.sender, amount, vaultBalance());
    }

    function setToken(address token_) external onlyOwner {
        if (token_ == address(0)) revert ZeroAddress();
        address old = token;
        token = token_;
        emit TokenUpdated(old, token_);
    }

    function setMinHoldAmount(uint256 amount) external onlyOwner {
        uint256 old = minHoldAmount;
        minHoldAmount = amount;
        emit MinHoldUpdated(old, amount);
    }

    function setParams(uint32 helpsRequired_, uint16 claimBps_) external onlyOwner {
        if (helpsRequired_ == 0 || claimBps_ == 0 || claimBps_ > 2_000) revert InvalidParams();
        helpsRequired = helpsRequired_;
        claimBps = claimBps_;
        emit ParamsUpdated(helpsRequired_, claimBps_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    function _prefix(string calldata code, uint256 n) internal pure returns (string memory) {
        bytes memory raw = bytes(code);
        if (raw.length < n) n = raw.length;
        bytes memory out = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = raw[i];
        }
        return string(out);
    }

    function _uToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
