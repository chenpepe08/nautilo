// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

interface IFlapPortal {
    struct NewTokenV6Params {
        string name;
        string symbol;
        string meta;
        uint8 dexThresh;
        bytes32 salt;
        uint8 migratorType;
        address quoteToken;
        uint256 quoteAmt;
        address beneficiary;
        bytes permitData;
        bytes32 extensionID;
        bytes extensionData;
        uint8 dexId;
        uint8 lpFeeProfile;
        uint16 buyTaxRate;
        uint16 sellTaxRate;
        uint64 taxDuration;
        uint64 antiFarmerDuration;
        uint16 mktBps;
        uint16 deflationBps;
        uint16 dividendBps;
        uint16 lpBps;
        uint256 minimumShareBalance;
        address dividendToken;
        address commissionReceiver;
        uint8 tokenVersion;
    }

    function newTokenV6(NewTokenV6Params calldata params) external payable returns (address token);
}

interface IPddVault {
    function setToken(address token_) external;
    function token() external view returns (address);
}

/// @notice BSC mainnet: launch TOKEN_TAXED_V3 (BNB quote) with vault beneficiary + setToken.
contract LaunchFlapTaxTokenMainnet is Script {
    address constant PORTAL = 0xe2cE6ab80874Fa9Fa2aAE65D277Dd6B8e65C9De0;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bytes32 salt = vm.envBytes32("VANITY_SALT");
        string memory meta = vm.envString("META_CID");
        address vault = vm.envAddress("VAULT_ADDRESS");
        uint256 quoteAmt = vm.envOr("QUOTE_AMT", uint256(0.2 ether));

        IFlapPortal.NewTokenV6Params memory params = IFlapPortal.NewTokenV6Params({
            name: unicode"\u771f\u6b63\u7684\u62fc\u591a\u591a\u780d\u4e00\u5200",
            symbol: unicode"\u62fc\u591a\u591a",
            meta: meta,
            dexThresh: 1, // FOUR_FIFTHS
            salt: salt,
            migratorType: 1, // V2_MIGRATOR
            quoteToken: address(0), // BNB
            quoteAmt: quoteAmt,
            beneficiary: vault,
            permitData: "",
            extensionID: bytes32(0),
            extensionData: "",
            dexId: 0,
            lpFeeProfile: 0,
            buyTaxRate: 0,
            sellTaxRate: 100,
            taxDuration: 365 days,
            antiFarmerDuration: 1 days,
            mktBps: 10_000,
            deflationBps: 0,
            dividendBps: 0,
            lpBps: 0,
            minimumShareBalance: 0,
            dividendToken: address(0),
            commissionReceiver: address(0),
            tokenVersion: 6
        });

        vm.startBroadcast(pk);
        address token = IFlapPortal(PORTAL).newTokenV6{value: quoteAmt}(params);
        console2.log("flapToken", token);
        IPddVault(vault).setToken(token);
        console2.log("vaultToken", IPddVault(vault).token());
        vm.stopBroadcast();
    }
}
