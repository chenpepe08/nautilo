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

/// @notice Launch Flap TOKEN_TAXED_V3 on BSC testnet with vault as beneficiary, then setToken.
contract LaunchFlapTaxToken is Script {
    address constant PORTAL = 0x5bEacaF7ABCbB3aB280e80D007FD31fcE26510e9;
    address constant VAULT = 0xe5079825A0536a1d4A2FCd9e0d4E4ed587E780b7;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bytes32 salt = vm.envBytes32("VANITY_SALT");
        string memory meta = vm.envString("META_CID");
        uint256 quoteAmt = vm.envOr("QUOTE_AMT", uint256(0.01 ether));

        IFlapPortal.NewTokenV6Params memory params = IFlapPortal.NewTokenV6Params({
            name: unicode"\u771f\u6b63\u7684\u62fc\u591a\u591a\u780d\u4e00\u5200",
            symbol: unicode"\u62fc\u591a\u591a",
            meta: meta,
            dexThresh: 1, // FOUR_FIFTHS
            salt: salt,
            migratorType: 1, // V2_MIGRATOR (required for tax tokens)
            quoteToken: address(0), // BNB
            quoteAmt: quoteAmt,
            beneficiary: VAULT,
            permitData: "",
            extensionID: bytes32(0),
            extensionData: "",
            dexId: 0, // DEX0
            lpFeeProfile: 0, // STANDARD
            buyTaxRate: 0,
            sellTaxRate: 100, // 1%
            taxDuration: 365 days,
            antiFarmerDuration: 1 days,
            mktBps: 10_000,
            deflationBps: 0,
            dividendBps: 0,
            lpBps: 0,
            minimumShareBalance: 0,
            dividendToken: address(0),
            commissionReceiver: address(0),
            tokenVersion: 6 // TOKEN_TAXED_V3
        });

        vm.startBroadcast(pk);
        address token = IFlapPortal(PORTAL).newTokenV6{value: quoteAmt}(params);
        console2.log("flapToken", token);
        IPddVault(VAULT).setToken(token);
        console2.log("vaultToken", IPddVault(VAULT).token());
        vm.stopBroadcast();
    }
}
