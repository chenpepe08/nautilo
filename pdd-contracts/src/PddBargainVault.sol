// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPddBargainVault} from "./interfaces/IPddBargainVault.sol";

interface IERC20Balance {
    function balanceOf(address account) external view returns (uint256);
}

/// @title PddBargainVault
/// @notice Treasury that receives Flap sell-tax (quote = native BNB) and runs 砍一刀
///         invite / help / claim: ~5 helps → claim ~5% of current vault balance.
/// @dev Tax wiring (Flap TOKEN_TAXED_V3):
///      - buyTaxRate = 0, sellTaxRate = 100 (1%), mktBps = 10000
///      - beneficiary / funds-recipient = this contract
///      Flap TaxProcessor forwards quote (BNB) here via receive(); we use VaultBaseV3-style
///      balance-delta accounting so ERC20-quote pings also work if quote ever changes.
contract PddBargainVault is IPddBargainVault {
    uint16 public constant BPS_DENOM = 10_000;

    address public owner;
    address public token;
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
    /// @notice Most recent invite codeHash created by an address (UI convenience).
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

    constructor(address token_, address owner_, uint256 minHoldAmount_) {
        if (owner_ == address(0)) revert ZeroAddress();
        owner = owner_;
        token = token_; // may be address(0) until Flap token is known
        helpsRequired = 5;
        claimBps = 500; // 5%
        minHoldAmount = minHoldAmount_;
    }

    // -------------------------------------------------------------------------
    // Flap VaultBaseV3 discovery surface (native quote)
    // -------------------------------------------------------------------------

    function vaultQuoteToken() external pure returns (address) {
        return address(0); // native BNB
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

    /// @dev Minimal UI schema blob for Flap-style discovery. Frontend may ignore this
    ///      and use the documented ABI in docs/pdd-contract-integration.md instead.
    function vaultUISchema() external pure returns (string memory) {
        return "pdd-bargain-v1:createInvite,help,claim,sync,vaultBalance,campaignOf";
    }

    // -------------------------------------------------------------------------
    // Revenue accounting
    // -------------------------------------------------------------------------

    receive() external payable {
        _syncRevenue();
    }

    function sync() external {
        _syncRevenue();
    }

    function vaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function _syncRevenue() internal {
        uint256 bal = address(this).balance;
        if (bal <= accountedQuote) return;
        uint256 newRevenue = bal - accountedQuote;
        accountedQuote = bal;
        emit RevenueRecognized(newRevenue, accountedQuote);
    }

    function _spend(uint256 amount) internal {
        // Rule 3: every outflow must decrement accountedQuote in the same tx.
        uint256 baseline = accountedQuote;
        if (amount > baseline) {
            accountedQuote = 0;
        } else {
            accountedQuote = baseline - amount;
        }
    }

    // -------------------------------------------------------------------------
    // Bargain flow
    // -------------------------------------------------------------------------

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
        if (IERC20Balance(token).balanceOf(msg.sender) < minHoldAmount) {
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

        // Emit a short hint (first 4 chars) for indexers; full code stays off-chain / in calldata.
        string memory hint = _prefix(code, 4);
        emit InviteCreated(hash, msg.sender, hint);
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
        return (address(this).balance * uint256(claimBps)) / uint256(BPS_DENOM);
    }

    function claim(string calldata code) external nonReentrant {
        _syncRevenue();
        bytes32 hash = codeHashOf(code);
        Campaign storage c = _campaigns[hash];
        if (c.inviter == address(0)) revert InviteMissing();
        if (msg.sender != c.inviter) revert NotInviter();
        if (c.claimed) revert AlreadyClaimed();
        if (c.helpCount < helpsRequired) revert NotEnoughHelps(c.helpCount, helpsRequired);

        uint256 bal = address(this).balance;
        uint256 amount = (bal * uint256(claimBps)) / uint256(BPS_DENOM);
        if (amount == 0) revert NothingToClaim();

        c.claimed = true;
        c.claimedAmount = amount;
        _spend(amount);

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Claimed(hash, msg.sender, amount, address(this).balance);
    }

    // -------------------------------------------------------------------------
    // Admin (owner + Flap Guardian-compatible note: owner may transfer)
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Internals
    // -------------------------------------------------------------------------

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
