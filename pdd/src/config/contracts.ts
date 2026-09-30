import type { Address, Abi } from 'viem'

/**
 * BSC Mainnet (56) — PDDB-quoted production defaults (contracts handoff).
 * Env vars override hardcoded defaults.
 */
const ZERO = '0x0000000000000000000000000000000000000000' as const

function addr(env: string | undefined, fallback: Address): Address {
  if (!env || !/^0x[a-fA-F0-9]{40}$/.test(env)) return fallback
  return env as Address
}

/** Current mainnet vault (金库 + 砍一刀), quote = PDDB */
export const VAULT_MAINNET =
  '0xF36c678bE8cdCD464f933196B333E2c520dCb6A5' as const satisfies Address

/** Flap TOKEN_TAXED_V3 (PDDB quote) — matches vault.token() */
export const TOKEN_MAINNET =
  '0xdE176dA378a1517Fe5d262BA032700C350C27777' as const satisfies Address

/** Flap quote asset — claims pay this ERC20 */
export const QUOTE_PDDB =
  '0x95b0409679b55c31772daa2fb4bee7b125b77521' as const satisfies Address

export const HELPS_REQUIRED = 5
export const CLAIM_BPS = 500 // 5% of vault PDDB
/** Matches vault.minHoldAmount (0.001 token @ 18 decimals) */
export const MIN_HOLD_AMOUNT = 10n ** 15n

export const ADDRESSES = {
  /** Holder-check ERC-20 (Flap tax token) */
  token: addr(import.meta.env.VITE_TOKEN_ADDRESS, TOKEN_MAINNET),
  /** PddBargainVault — receives PDDB sell-tax + invite/help/claim */
  vault: addr(import.meta.env.VITE_VAULT_ADDRESS, VAULT_MAINNET),
  /** Quote ERC20 (PDDB) — claim payout asset */
  quote: addr(import.meta.env.VITE_QUOTE_ADDRESS, QUOTE_PDDB),
  treasury: addr(
    import.meta.env.VITE_TREASURY_ADDRESS ?? import.meta.env.VITE_VAULT_ADDRESS,
    VAULT_MAINNET,
  ),
  bargain: addr(
    import.meta.env.VITE_BARGAIN_ADDRESS ?? import.meta.env.VITE_VAULT_ADDRESS,
    VAULT_MAINNET,
  ),
} as const

export const isContractsLive =
  ADDRESSES.token !== ZERO && ADDRESSES.vault !== ZERO

export const TOKEN_META = {
  symbol: '拼多多',
  name: '真正的拼多多砍一刀',
  flapBoard: 'https://flap.sh/bnb/0xdE176dA378a1517Fe5d262BA032700C350C27777',
  quote: 'PDDB',
  quoteSymbol: 'PDDB',
  buyTax: '0%',
  sellTax: '1%',
  isMockToken: false,
  chainId: 56,
  chainName: 'BSC',
} as const

export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const satisfies Abi

/**
 * PddBargainVault subset used by the dApp.
 * Plain string 口令 on-chain; storage is keccak256(bytes(code)).
 * vaultBalance / claim payouts are PDDB (quote ERC20), not native BNB.
 */
export const vaultAbi = [
  {
    type: 'function',
    name: 'createInvite',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'help',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'codeHashOf',
    stateMutability: 'pure',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'campaignOf',
    stateMutability: 'view',
    inputs: [{ name: 'codeHash', type: 'bytes32' }],
    outputs: [
      { name: 'inviter', type: 'address' },
      { name: 'helpCount', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
      { name: 'claimedAmount', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'latestInvite',
    stateMutability: 'view',
    inputs: [{ name: 'inviter', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'hasHelped',
    stateMutability: 'view',
    inputs: [
      { name: 'codeHash', type: 'bytes32' },
      { name: 'helper', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'vaultBalance',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'vaultQuoteToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'claimableAmount',
    stateMutability: 'view',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'minHoldAmount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'helpsRequired',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claimBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'token',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const satisfies Abi

/** @deprecated alias — prefer vaultAbi */
export const bargainAbi = vaultAbi
