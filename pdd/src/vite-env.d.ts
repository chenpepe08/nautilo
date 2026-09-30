/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WC_PROJECT_ID?: string
  readonly VITE_BSC_TESTNET_RPC?: string
  readonly VITE_TOKEN_ADDRESS?: string
  readonly VITE_TREASURY_ADDRESS?: string
  readonly VITE_BARGAIN_ADDRESS?: string
  readonly VITE_POOL_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
