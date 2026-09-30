# PDD Bargain Vault — Design

## Goal
On-chain treasury (金库) that receives Flap sell-tax (quote = BNB) and runs 砍一刀 invite → help → claim.

## Contracts
| Contract | Role |
|---|---|
| `PddBargainVault` | Treasury + bargain logic (single contract) |
| `MockPddToken` | Testnet-only ERC20 for holder gate until Flap tax token exists |

## Economics (product)
- Buy tax: **0%**
- Sell tax: **1%** → Flap TaxProcessor → **beneficiary = vault** (`mktBps = 10000`)
- Claim: after **5** unique helps → inviter claims **5%** of current vault BNB balance

## Invite design (secure + practical)
1. Holder (`token.balanceOf >= minHoldAmount`) calls `createInvite(code)` with a 4–64 char string.
2. On-chain stores `keccak256(bytes(code))` → campaign; plain code is only in calldata / user share channel.
3. Invitee calls `help(code)` once per campaign (not self). UI shows success on tx confirm.
4. Inviter calls `claim(code)` when `helpCount >= 5`; pays `balance * claimBps / 10000`.

No off-chain code DB required. Optional indexer can watch `InviteCreated` / `Helped` / `Claimed`.

## Flap vault surface
Implements discovery helpers Flap expects for a funds-recipient contract:
- `receive()` + `sync()` with VaultBaseV3-style `accountedQuote` balance-delta
- `description()`, `vaultQuoteToken()` → `address(0)`, `vaultSpecVersion()` → `"v3"`

Full VaultFactory / VaultPortal launch path is optional; simplest wiring is Portal `newTokenV6` with `beneficiary = vault`.

## Network policy
- **BSC testnet (97) only** until user explicitly authorizes mainnet.
- Brief pool hint `0x95b0…7521` is a **mainnet** ERC20 (`PDDB` / “PDD Holdings Inc”), **not** a Flap tax token and **not** on testnet — do not use it as the product token.
