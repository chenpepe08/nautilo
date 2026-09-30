# PDD Bargain Vault — Design

## Goal
On-chain treasury (金库) that receives Flap sell-tax in the launch quote asset and runs 砍一刀 invite → help → claim.

## Contracts
| Contract | Role |
|---|---|
| `PddBargainVault` | Treasury + bargain logic (single contract; `quoteToken` immutable) |
| `MockPddToken` | Testnet-only ERC20 for holder gate until Flap tax token exists |

## Economics (product)
- Buy tax: **0%**
- Sell tax: **1%** → Flap TaxProcessor → **beneficiary = vault** (`mktBps = 10000`)
- Mainnet quote: **PDDB** `0x95b0…7521` (not native BNB)
- Claim: after **5** unique helps → inviter claims **5%** of current vault quote balance (PDDB on mainnet)

## Invite design (secure + practical)
1. Holder (`token.balanceOf >= minHoldAmount`) calls `createInvite(code)` with a 4–64 char string.
2. On-chain stores `keccak256(bytes(code))` → campaign; plain code is only in calldata / user share channel.
3. Invitee calls `help(code)` once per campaign (not self). UI shows success on tx confirm.
4. Inviter calls `claim(code)` when `helpCount >= 5`; pays `balance * claimBps / 10000`.

No off-chain code DB required. Optional indexer can watch `InviteCreated` / `Helped` / `Claimed`.

## Flap vault surface
Implements discovery helpers Flap expects for a funds-recipient contract:
- `receive()` + `sync()` with VaultBaseV3-style `accountedQuote` balance-delta
- `description()`, `vaultQuoteToken()` → constructor quote (PDDB on mainnet; `address(0)` = native BNB), `vaultSpecVersion()` → `"v3"`

Full VaultFactory / VaultPortal launch path is optional; simplest wiring is Portal `newTokenV6` with `beneficiary = vault` and matching `quoteToken`.

## Network / quote policy
- User 底池 hint `0x95b0…7521` is mainnet ERC20 **PDDB** — used as Flap `quoteToken` for the production TOKEN_TAXED_V3.
- PCS WBNB/PDDB pair `0x6E57…e9a7` is only for acquiring PDDB for the initial buy; it is not the Flap quote id.
- First BNB-quoted mainnet token `0xe4cb…7777` / vault `0xd751…04E5` are **superseded**.
