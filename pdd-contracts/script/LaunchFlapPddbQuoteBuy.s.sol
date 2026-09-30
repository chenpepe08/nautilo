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

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IRouter {
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable;
}

/// @notice Buy PDDB with BNB, approve Portal, launch TOKEN_TAXED_V3 quoted in PDDB, setToken.
contract LaunchFlapPddbQuoteBuy is Script {
    address constant PORTAL = 0xe2cE6ab80874Fa9Fa2aAE65D277Dd6B8e65C9De0;
    address constant PDDB = 0x95b0409679B55C31772daA2fB4bEE7B125B77521;
    address constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address constant PCS_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        bytes32 salt = vm.envBytes32("VANITY_SALT");
        string memory meta = vm.envString("META_CID");
        address vault = vm.envAddress("VAULT_ADDRESS");
        uint256 bnbForPddb = vm.envOr("BNB_FOR_PDDB", uint256(0.05 ether));
        // After swap, use nearly all acquired PDDB as Flap initial buy (leave 0 dust).
        uint256 minPddbOut = vm.envOr("MIN_PDDB_OUT", uint256(1));

        vm.startBroadcast(pk);

        // 1) Acquire PDDB via PCS (slippage-safe min out)
        address[] memory path = new address[](2);
        path[0] = WBNB;
        path[1] = PDDB;
        IRouter(PCS_ROUTER).swapExactETHForTokensSupportingFeeOnTransferTokens{value: bnbForPddb}(
            minPddbOut, path, deployer, block.timestamp + 600
        );
        uint256 pddbBal = IERC20(PDDB).balanceOf(deployer);
        console2.log("pddbAcquired", pddbBal);
        require(pddbBal > 0, "no PDDB");

        // Use 95% of acquired PDDB for initial buy; keep dust
        uint256 quoteAmt = (pddbBal * 95) / 100;
        require(IERC20(PDDB).approve(PORTAL, quoteAmt), "approve failed");
        console2.log("quoteAmt", quoteAmt);

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
            dividendToken: PDDB,
            commissionReceiver: address(0),
            tokenVersion: 6
        });

        address token = IFlapPortal(PORTAL).newTokenV6{value: 0}(params);
        console2.log("flapToken", token);
        IPddVault(vault).setToken(token);
        console2.log("vaultToken", IPddVault(vault).token());
        console2.log("deployerFlapBal", IERC20(token).balanceOf(deployer));

        vm.stopBroadcast();
    }
}
