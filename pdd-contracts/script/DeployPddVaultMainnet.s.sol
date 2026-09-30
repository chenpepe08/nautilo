// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PddBargainVault} from "../src/PddBargainVault.sol";

/// @notice Deploy PddBargainVault on BSC mainnet (token set later via setToken).
contract DeployPddVaultMainnet is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        uint256 minHold = vm.envOr("MIN_HOLD_AMOUNT", uint256(1e15));
        address quote = vm.envOr("QUOTE_TOKEN", address(0));

        vm.startBroadcast(pk);
        // token=address(0) until Flap token launches; createInvite blocked until setToken
        PddBargainVault vault = new PddBargainVault(address(0), deployer, minHold, quote);
        console2.log("PddBargainVault", address(vault));
        console2.log("owner", deployer);
        console2.log("minHold", minHold);
        console2.log("quoteToken", quote);
        vm.stopBroadcast();
    }
}
