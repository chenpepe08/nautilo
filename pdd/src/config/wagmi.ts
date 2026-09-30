import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bscTestnet, bsc } from 'wagmi/chains'
import { http } from 'wagmi'

const projectId = import.meta.env.VITE_WC_PROJECT_ID || 'pdd-kan-demo-project'

const testnetRpc =
  import.meta.env.VITE_BSC_TESTNET_RPC ||
  'https://data-seed-prebsc-1-s1.binance.org:8545'

/**
 * Phase 1: BSC testnet only in the wallet modal.
 * Mainnet chain is declared for a later flip — do not enable until user orders.
 */
export const wagmiConfig = getDefaultConfig({
  appName: '拼多多砍一刀',
  projectId,
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(testnetRpc),
    [bsc.id]: http(),
  },
  ssr: false,
})

export const ACTIVE_CHAIN = bscTestnet
