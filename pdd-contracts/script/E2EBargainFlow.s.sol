// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PddBargainVault} from "../src/PddBargainVault.sol";
import {MockPddToken} from "../src/mocks/MockPddToken.sol";

/// @notice On-chain E2E for BSC testnet: fund vault → createInvite → 5 helps → claim 5%.
/// @dev Uses deployer key for inviter; derives helper keys via vm.deriveKey for helping.
contract E2EBargainFlow is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address inviter = vm.addr(pk);
        address vaultAddr = vm.envAddress("VAULT_ADDRESS");
        address tokenAddr = vm.envAddress("TOKEN_ADDRESS");
        string memory code = vm.envOr("INVITE_CODE", string("E2E-KAN-001"));

        PddBargainVault vault = PddBargainVault(payable(vaultAddr));
        MockPddToken token = MockPddToken(tokenAddr);

        // Derive 5 helper EOAs from a fixed mnemonic (test-only, not the deployer key).
        string memory mnemonic =
            "test test test test test test test test test test test junk";
        uint256[5] memory helperPks;
        address[5] memory helpers;
        for (uint256 i = 0; i < 5; i++) {
            helperPks[i] = vm.deriveKey(mnemonic, uint32(i + 1));
            helpers[i] = vm.addr(helperPks[i]);
        }

        // --- Phase 1: fund vault (simulate Flap sell-tax BNB inflow) + gas for helpers ---
        vm.startBroadcast(pk);
        uint256 fundAmount = 0.05 ether;
        (bool funded,) = payable(vaultAddr).call{value: fundAmount}("");
        require(funded, "fund vault failed");
        console2.log("fundedVaultWei", fundAmount);
        console2.log("vaultBalance", vault.vaultBalance());

        for (uint256 i = 0; i < 5; i++) {
            (bool ok,) = payable(helpers[i]).call{value: 0.002 ether}("");
            require(ok, "fund helper failed");
            console2.log("fundedHelper", helpers[i]);
        }

        // Ensure inviter holds token
        uint256 bal = token.balanceOf(inviter);
        console2.log("inviterTokenBal", bal);
        require(bal >= vault.minHoldAmount(), "inviter needs tokens");

        vault.createInvite(code);
        console2.log("inviteCreated", code);
        vm.stopBroadcast();

        // --- Phase 2: 5 helpers redeem ---
        for (uint256 i = 0; i < 5; i++) {
            vm.startBroadcast(helperPks[i]);
            vault.help(code);
            console2.log("helpedBy", helpers[i]);
            vm.stopBroadcast();
        }

        (address cInviter, uint32 helpCount, bool claimedBefore,) =
            vault.campaignOf(vault.codeHashOf(code));
        require(cInviter == inviter, "bad inviter");
        require(helpCount == 5, "need 5 helps");
        require(!claimedBefore, "already claimed");
        console2.log("helpCount", helpCount);

        uint256 vaultBefore = vault.vaultBalance();
        uint256 claimable = vault.claimableAmount(code);
        uint256 expected = (vaultBefore * uint256(vault.claimBps())) / 10_000;
        require(claimable == expected, "claimable mismatch");
        console2.log("claimable", claimable);

        uint256 inviterBefore = inviter.balance;

        // --- Phase 3: claim ---
        vm.startBroadcast(pk);
        vault.claim(code);
        vm.stopBroadcast();

        (,, bool claimed, uint256 claimedAmount) = vault.campaignOf(vault.codeHashOf(code));
        require(claimed, "not marked claimed");
        require(claimedAmount == expected, "claimed amount mismatch");
        require(inviter.balance >= inviterBefore + expected - 0.01 ether, "inviter not paid");
        // gas makes exact balance hard; check vault dropped by claim amount
        require(vault.vaultBalance() == vaultBefore - expected, "vault balance wrong");

        console2.log("PASS claimedAmount", claimedAmount);
        console2.log("PASS vaultAfter", vault.vaultBalance());
        console2.log("PASS inviterDeltaApprox", inviter.balance - inviterBefore);
    }
}
