import type { Address, Abi } from 'viem'

/**
 * Contract addresses — swap placeholders when contracts worker publishes
 * BSC testnet deployments. Env vars win over hardcoded defaults.
 *
 * Zero address ⇒ UI runs in local mock mode (demo flows without chain calls).
 */
const ZERO = '0x0000000000000000000000000000000000000000' as const

function addr(env: string | undefined, fallback: Address = ZERO): Address {
  if (!env || !/^0x[a-fA-F0-9]{40}$/.test(env)) return fallback
  return env as Address
}

export const HELPS_REQUIRED = 5
export const CLAIM_BPS = 500 // 5% of treasury

export const ADDRESSES = {
  /** Project token (拼多多 / 真正的拼多多砍一刀) */
  token: addr(import.meta.env.VITE_TOKEN_ADDRESS),
  /** Tax / vault treasury */
  treasury: addr(import.meta.env.VITE_TREASURY_ADDRESS),
  /** Bargain invite + claim logic */
  bargain: addr(import.meta.env.VITE_BARGAIN_ADDRESS),
  /** Reported Flap pool (verify on network) */
  pool: addr(
    import.meta.env.VITE_POOL_ADDRESS,
    '0x95b0409679b55c31772daa2fb4bee7b125b77521',
  ),
} as const

export const isContractsLive =
  ADDRESSES.token !== ZERO &&
  ADDRESSES.treasury !== ZERO &&
  ADDRESSES.bargain !== ZERO

export const TOKEN_META = {
  symbol: '拼多多',
  name: '真正的拼多多砍一刀',
  flapBoard: 'https://testnet.flap.sh/board?lang=zh',
} as const

/** Minimal ERC-20 surface for holder gate */
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
 * Bargain contract stub ABI — align with contracts worker when published.
 * Expected semantics:
 *  - createInvite() → bytes32 code (only token holders)
 *  - redeemInvite(bytes32) → helper chops for inviter
 *  - getInvite(bytes32) → inviter, helps, claimed
 *  - getProgress(address) → helps toward HELPS_REQUIRED
 *  - claim() → pull CLAIM_BPS of treasury to inviter
 *  - treasuryBalance() → vault balance in native/token units
 */
export const bargainAbi = [
  {
    type: 'function',
    name: 'createInvite',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'code', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'redeemInvite',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getInvite',
    stateMutability: 'view',
    inputs: [{ name: 'code', type: 'bytes32' }],
    outputs: [
      { name: 'inviter', type: 'address' },
      { name: 'helps', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getProgress',
    stateMutability: 'view',
    inputs: [{ name: 'inviter', type: 'address' }],
    outputs: [
      { name: 'helps', type: 'uint256' },
      { name: 'required', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
      { name: 'code', type: 'bytes32' },
    ],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'treasuryBalance',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const satisfies Abi
