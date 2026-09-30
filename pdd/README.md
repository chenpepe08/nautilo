# 拼多多砍一刀 — Frontend

Isolated Vite + React + wagmi/viem + RainbowKit dApp for `pdd.aiflaps.com`.
Lives under `/pdd` so it does not wire into the Nautilo monorepo build graph.

## Local demo

```bash
cd pdd
cp .env.example .env   # optional
npm install
npm run dev
```

Open the printed local URL. Without contract addresses the UI runs in **演示模式**
(localStorage invites) so you can exercise generate / redeem / claim flows.

## Build

```bash
cd pdd
npm run build
npm run preview
```

Static output: `pdd/dist/`.

## Contract swap

Set env (or edit `src/config/contracts.ts`):

- `VITE_TOKEN_ADDRESS`
- `VITE_TREASURY_ADDRESS`
- `VITE_BARGAIN_ADDRESS`
- `VITE_POOL_ADDRESS` (optional)
- `VITE_WC_PROJECT_ID` (WalletConnect Cloud id for production wallets)

When all three core addresses are non-zero, mock mode turns off and the app
calls the stub ABI in `src/config/contracts.ts`. Align ABI with the contracts
worker before testnet E2E.

## Deploy

See `scripts/deploy.sh` (loads SSH creds from Project store `secrets.env`, never commit).
