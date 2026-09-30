# PDD Bargain Vault (砍一刀)

BSC **testnet** treasury + bargain contracts for the PDD × Flap project.

## Deployed

### BSC Mainnet (chainId 56) — production

| Contract | Address |
|---|---|
| PddBargainVault | `0xd75125f7e4dfE2aE12E87d05770Dcf2Ad91B04E5` |
| Flap Tax Token V3 (拼多多) | `0xe4cb08439C9F9FA1B46a101DF5215A1Ee8B27777` |

Board: https://flap.sh/bnb/0xe4cb08439C9F9FA1B46a101DF5215A1Ee8B27777  
See `deployments/bsc-mainnet.json`.

### BSC Testnet (chainId 97)

| Contract | Address |
|---|---|
| PddBargainVault | `0xe5079825A0536a1d4A2FCd9e0d4E4ed587E780b7` |
| Flap Tax Token V3 | `0x188AC6595a0de45f247358b42eA317edC79f7777` |

See `deployments/bsc-testnet.json` and Project store `docs/contracts-handoff.md`.

## Quick start

```bash
cd pdd-contracts
forge test -vv
```

Deploy (testnet only; load key from local env — never commit):

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export BSC_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
forge script script/DeployPddVault.s.sol:DeployPddVault --rpc-url $BSC_TESTNET_RPC_URL --broadcast --legacy
```

On-chain E2E:

```bash
export VAULT_ADDRESS=0xe5079825A0536a1d4A2FCd9e0d4E4ed587E780b7
export TOKEN_ADDRESS=0x1513eA7Bc3dbFB0890C71f9c7325987E8aD126d4
export INVITE_CODE=E2E-KAN-demo
bash script/e2e-bsc-testnet.sh
```

## Design

See [DESIGN.md](./DESIGN.md). **No mainnet deploy** until explicitly authorized.
