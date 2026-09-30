// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PddBargainVault} from "../src/PddBargainVault.sol";

/// @notice Wire vault to a real Flap tax token after launch.
/// @dev TOKEN_ADDRESS must be the Flap TOKEN_TAXED_V3 whose beneficiary = vault.
contract SetVaultToken is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address vaultAddr = vm.envAddress("VAULT_ADDRESS");
        address token = vm.envAddress("TOKEN_ADDRESS");

        vm.startBroadcast(pk);
        PddBargainVault(payable(vaultAddr)).setToken(token);
        vm.stopBroadcast();

        console2.log("vault", vaultAddr);
        console2.log("token set to", token);
    }
}
