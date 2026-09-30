// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PddBargainVault} from "../src/PddBargainVault.sol";
import {MockPddToken} from "../src/mocks/MockPddToken.sol";

/// @notice Deploy PddBargainVault to BSC testnet.
/// @dev Loads DEPLOYER_PRIVATE_KEY from env (never commit). Optional TOKEN_ADDRESS;
///      if unset, deploys MockPddToken for holder-gate testing until Flap token exists.
contract DeployPddVault is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address token = vm.envOr("TOKEN_ADDRESS", address(0));
        uint256 minHold = vm.envOr("MIN_HOLD_AMOUNT", uint256(1e15)); // 0.001 token default
        bool deployMock = vm.envOr("DEPLOY_MOCK_TOKEN", true);

        vm.startBroadcast(pk);

        if (token == address(0) && deployMock) {
            MockPddToken mock = new MockPddToken();
            mock.mint(deployer, 1_000_000 ether);
            token = address(mock);
            console2.log("MockPddToken", token);
        }

        address quote = vm.envOr("QUOTE_TOKEN", address(0));
        PddBargainVault vault = new PddBargainVault(token, deployer, minHold, quote);
        console2.log("PddBargainVault", address(vault));
        console2.log("owner", deployer);
        console2.log("token", token);
        console2.log("minHold", minHold);

        vm.stopBroadcast();
    }
}
