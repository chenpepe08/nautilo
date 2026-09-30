const STORAGE_KEY = 'pdd-invite-codes-v1'

type Store = Record<string, string>

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    /* ignore */
  }
  return {}
}

function save(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** Plain 口令 is off-chain; chain only stores keccak256(bytes(code)). */
export function rememberInviteCode(wallet: string, code: string) {
  const store = load()
  store[wallet.toLowerCase()] = code
  save(store)
}

export function recallInviteCode(wallet?: string | null): string | null {
  if (!wallet) return null
  return load()[wallet.toLowerCase()] ?? null
}

export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = '砍'
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}
