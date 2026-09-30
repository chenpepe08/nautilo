import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'
import { http } from 'wagmi'

const projectId = import.meta.env.VITE_WC_PROJECT_ID || 'pdd-kan-demo-project'

const mainnetRpc =
  import.meta.env.VITE_BSC_RPC || 'https://bsc-dataseed.binance.org'

/** Production: BSC mainnet only */
export const wagmiConfig = getDefaultConfig({
  appName: '拼多多砍一刀',
  projectId,
  chains: [bsc],
  transports: {
    [bsc.id]: http(mainnetRpc),
  },
  ssr: false,
})

export const ACTIVE_CHAIN = bsc
