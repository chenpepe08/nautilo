// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PddBargainVault} from "../src/PddBargainVault.sol";
import {IPddBargainVault} from "../src/interfaces/IPddBargainVault.sol";
import {MockPddToken} from "../src/mocks/MockPddToken.sol";

contract PddBargainVaultTest is Test {
    PddBargainVault vault;
    MockPddToken token;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address dave = makeAddr("dave");
    address eve = makeAddr("eve");
    address frank = makeAddr("frank");

    uint256 constant MIN_HOLD = 1 ether;

    function setUp() public {
        token = new MockPddToken();
        vault = new PddBargainVault(address(token), owner, MIN_HOLD);

        token.mint(alice, 10 ether);
        // Seed treasury as if Flap sell-tax arrived.
        vm.deal(address(vault), 100 ether);
        vault.sync();
    }

    function test_createInvite_requiresHoldings() public {
        vm.prank(bob);
        vm.expectRevert(IPddBargainVault.InsufficientHoldings.selector);
        vault.createInvite("CODE1");
    }

    function test_helpAndClaim_fivePercent() public {
        string memory code = unicode"\u780d\u4e00\u628aABC"; // 砍一把ABC
        vm.prank(alice);
        vault.createInvite(code);

        address[5] memory helpers = [bob, carol, dave, eve, frank];
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(helpers[i]);
            vault.help(code);
        }

        uint256 beforeBal = alice.balance;
        uint256 vaultBefore = address(vault).balance;
        vm.prank(alice);
        vault.claim(code);

        assertEq(alice.balance - beforeBal, vaultBefore / 20); // 5%
        assertEq(address(vault).balance, vaultBefore - vaultBefore / 20);

        (address inviter, uint32 helps, bool claimed, uint256 claimedAmount) =
            vault.campaignOf(vault.codeHashOf(code));
        assertEq(inviter, alice);
        assertEq(helps, 5);
        assertTrue(claimed);
        assertEq(claimedAmount, vaultBefore / 20);
    }

    function test_cannotHelpTwiceOrSelf() public {
        vm.prank(alice);
        vault.createInvite("CODEX");

        vm.prank(alice);
        vm.expectRevert(IPddBargainVault.CannotHelpSelf.selector);
        vault.help("CODEX");

        vm.prank(bob);
        vault.help("CODEX");
        vm.prank(bob);
        vm.expectRevert(IPddBargainVault.AlreadyHelped.selector);
        vault.help("CODEX");
    }

    function test_claimBeforeFiveReverts() public {
        vm.prank(alice);
        vault.createInvite("EARLY");
        vm.prank(bob);
        vault.help("EARLY");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IPddBargainVault.NotEnoughHelps.selector, uint32(1), uint32(5)));
        vault.claim("EARLY");
    }

    function test_receiveRecognizesRevenue() public {
        uint256 accounted = vault.accountedQuote();
        (bool ok,) = address(vault).call{value: 3 ether}("");
        assertTrue(ok);
        assertEq(vault.accountedQuote(), accounted + 3 ether);
    }

    function test_duplicateCodeReverts() public {
        vm.prank(alice);
        vault.createInvite("SAME");
        token.mint(bob, MIN_HOLD);
        vm.prank(bob);
        vm.expectRevert(IPddBargainVault.InviteExists.selector);
        vault.createInvite("SAME");
    }
}
