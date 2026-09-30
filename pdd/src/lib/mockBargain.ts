import { HELPS_REQUIRED } from '../config/contracts'

const STORAGE_KEY = 'pdd-kan-mock-v1'

export type MockInvite = {
  code: string
  inviter: string
  helps: number
  helpers: string[]
  claimed: boolean
}

type MockState = {
  invitesByWallet: Record<string, string>
  invites: Record<string, MockInvite>
}

function load(): MockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockState
  } catch {
    /* ignore */
  }
  return { invitesByWallet: {}, invites: {} }
}

function save(state: MockState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function shortCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = '拼'
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export function mockGetProgress(wallet?: string) {
  if (!wallet) {
    return { helps: 0, required: HELPS_REQUIRED, claimed: false, code: null as string | null }
  }
  const state = load()
  const code = state.invitesByWallet[wallet.toLowerCase()]
  if (!code) {
    return { helps: 0, required: HELPS_REQUIRED, claimed: false, code: null as string | null }
  }
  const invite = state.invites[code]
  return {
    helps: invite?.helps ?? 0,
    required: HELPS_REQUIRED,
    claimed: invite?.claimed ?? false,
    code,
  }
}

export function mockCreateInvite(wallet: string): string {
  const key = wallet.toLowerCase()
  const state = load()
  const existing = state.invitesByWallet[key]
  if (existing) return existing

  const code = shortCode()
  state.invitesByWallet[key] = code
  state.invites[code] = {
    code,
    inviter: wallet,
    helps: 0,
    helpers: [],
    claimed: false,
  }
  save(state)
  return code
}

export function mockRedeemInvite(code: string, helper: string): {
  ok: boolean
  message: string
  invite?: MockInvite
} {
  const state = load()
  const invite = state.invites[code.trim()]
  if (!invite) return { ok: false, message: '口令不存在，请检查后重试' }
  if (invite.claimed) return { ok: false, message: '该口令已领取奖励，无法再砍' }
  if (invite.inviter.toLowerCase() === helper.toLowerCase()) {
    return { ok: false, message: '不能给自己砍一刀哦' }
  }
  if (invite.helpers.some((h) => h.toLowerCase() === helper.toLowerCase())) {
    return { ok: false, message: '你已经帮砍过这刀了' }
  }
  if (invite.helps >= HELPS_REQUIRED) {
    return { ok: false, message: '这刀已经砍满啦' }
  }

  invite.helps += 1
  invite.helpers.push(helper)
  save(state)
  return { ok: true, message: '砍成功！', invite }
}

export function mockClaim(wallet: string): { ok: boolean; message: string } {
  const progress = mockGetProgress(wallet)
  if (!progress.code) return { ok: false, message: '还没有生成口令' }
  if (progress.helps < HELPS_REQUIRED) {
    return { ok: false, message: `还需 ${HELPS_REQUIRED - progress.helps} 位好友帮砍` }
  }
  if (progress.claimed) return { ok: false, message: '已经领取过了' }

  const state = load()
  const invite = state.invites[progress.code]
  if (!invite) return { ok: false, message: '口令数据丢失' }
  invite.claimed = true
  save(state)
  return { ok: true, message: '领取成功！（演示模式，未真实转账）' }
}

/** Demo holder gate: any connected wallet counts as holder in mock mode. */
export function mockIsHolder(_wallet?: string): boolean {
  return Boolean(_wallet)
}
