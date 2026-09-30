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

/// @notice Dry-run / launch TOKEN_TAXED_V3 with ERC20 quote (PDDB).
contract LaunchFlapPddbQuote is Script {
    address constant PORTAL = 0xe2cE6ab80874Fa9Fa2aAE65D277Dd6B8e65C9De0;
    address constant PDDB = 0x95b0409679B55C31772daA2fB4bEE7B125B77521;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bytes32 salt = vm.envBytes32("VANITY_SALT");
        string memory meta = vm.envString("META_CID");
        address vault = vm.envAddress("VAULT_ADDRESS");
        uint256 quoteAmt = vm.envOr("QUOTE_AMT", uint256(0)); // 0 = launch only

        IFlapPortal.NewTokenV6Params memory params = IFlapPortal.NewTokenV6Params({
            name: unicode"\u771f\u6b63\u7684\u62fc\u591a\u591a\u780d\u4e00\u5200",
            symbol: unicode"\u62fc\u591a\u591a",
            meta: meta,
            dexThresh: 1,
            salt: salt,
            migratorType: 1,
            quoteToken: PDDB,
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
            dividendToken: PDDB, // Case 2: match quote
            commissionReceiver: address(0),
            tokenVersion: 6
        });

        vm.startBroadcast(pk);
        address token = IFlapPortal(PORTAL).newTokenV6{value: 0}(params);
        console2.log("flapToken", token);
        vm.stopBroadcast();
    }
}
