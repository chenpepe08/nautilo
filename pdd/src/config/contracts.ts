import type { Address, Abi } from 'viem'

/**
 * BSC testnet (97) addresses from contracts handoff.
 * Env vars override hardcoded defaults.
 */
const ZERO = '0x0000000000000000000000000000000000000000' as const

function addr(env: string | undefined, fallback: Address): Address {
  if (!env || !/^0x[a-fA-F0-9]{40}$/.test(env)) return fallback
  return env as Address
}

/** BSC testnet vault (金库 + 砍一刀) — same contract for treasury & bargain */
export const VAULT_TESTNET =
  '0xe5079825A0536a1d4A2FCd9e0d4E4ed587E780b7' as const satisfies Address

/** Flap TOKEN_TAXED_V3 — matches vault.token() after setToken */
export const TOKEN_TESTNET =
  '0x188AC6595a0de45f247358b42eA317edC79f7777' as const satisfies Address

/** Legacy MockPddToken — superseded; keep for reference only */
export const MOCK_TOKEN_LEGACY =
  '0x1513eA7Bc3dbFB0890C71f9c7325987E8aD126d4' as const satisfies Address

export const HELPS_REQUIRED = 5
export const CLAIM_BPS = 500 // 5% of vault BNB
/** Matches vault.minHoldAmount (0.001 token @ 18 decimals) */
export const MIN_HOLD_AMOUNT = 10n ** 15n

export const ADDRESSES = {
  /** Holder-check ERC-20 (Flap tax token) */
  token: addr(import.meta.env.VITE_TOKEN_ADDRESS, TOKEN_TESTNET),
  /** PddBargainVault — receives BNB tax + invite/help/claim */
  vault: addr(import.meta.env.VITE_VAULT_ADDRESS, VAULT_TESTNET),
  /** Aliases for older UI labels / env names */
  treasury: addr(
    import.meta.env.VITE_TREASURY_ADDRESS ?? import.meta.env.VITE_VAULT_ADDRESS,
    VAULT_TESTNET,
  ),
  bargain: addr(
    import.meta.env.VITE_BARGAIN_ADDRESS ?? import.meta.env.VITE_VAULT_ADDRESS,
    VAULT_TESTNET,
  ),
} as const

export const isContractsLive =
  ADDRESSES.token !== ZERO && ADDRESSES.vault !== ZERO

export const TOKEN_META = {
  symbol: '拼多多',
  name: '真正的拼多多砍一刀',
  flapBoard:
    'https://testnet.flap.sh/bnb/0x188AC6595a0de45f247358b42eA317edC79f7777?lang=zh',
  quote: 'BNB',
  buyTax: '0%',
  sellTax: '1%',
  isMockToken: false,
  chainId: 97,
  chainName: 'BSC Testnet',
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
