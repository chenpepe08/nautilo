import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import {
  ADDRESSES,
  CLAIM_BPS,
  HELPS_REQUIRED,
  bargainAbi,
  erc20Abi,
  isContractsLive,
} from '../config/contracts'
import {
  mockClaim,
  mockCreateInvite,
  mockGetProgress,
  mockIsHolder,
  mockRedeemInvite,
} from '../lib/mockBargain'

function bytes32ToCode(value: `0x${string}` | undefined): string | null {
  if (!value || value === '0x' + '0'.repeat(64)) return null
  try {
    const hex = value.slice(2)
    let s = ''
    for (let i = 0; i < hex.length; i += 2) {
      const c = parseInt(hex.slice(i, i + 2), 16)
      if (c === 0) break
      s += String.fromCharCode(c)
    }
    return s || value.slice(0, 10) + '…'
  } catch {
    return value.slice(0, 10) + '…'
  }
}

export function useBargain() {
  const { address, isConnected } = useAccount()
  const [mockTick, setMockTick] = useState(0)
  const [celebration, setCelebration] = useState<{
    open: boolean
    title: string
    subtitle: string
  }>({ open: false, title: '', subtitle: '' })
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'create' | 'redeem' | 'claim' | null>(null)

  const bumpMock = () => setMockTick((n) => n + 1)

  const { data: onChainBalance } = useReadContract({
    address: ADDRESSES.token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isContractsLive && Boolean(address) },
  })

  const { data: onChainProgress } = useReadContract({
    address: ADDRESSES.bargain,
    abi: bargainAbi,
    functionName: 'getProgress',
    args: address ? [address] : undefined,
    query: { enabled: isContractsLive && Boolean(address) },
  })

  const { data: treasuryBalance } = useReadContract({
    address: ADDRESSES.bargain,
    abi: bargainAbi,
    functionName: 'treasuryBalance',
    query: { enabled: isContractsLive },
  })

  const { writeContractAsync, data: txHash, reset: resetWrite } = useWriteContract()
  const { isLoading: txPending, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (txSuccess && pendingAction) {
      if (pendingAction === 'redeem') {
        setCelebration({
          open: true,
          title: '砍成功！',
          subtitle: '帮好友砍了一刀，拼多多快乐加倍 🎉',
        })
      } else if (pendingAction === 'claim') {
        setCelebration({
          open: true,
          title: '领取成功！',
          subtitle: `已发起领取金库 ${CLAIM_BPS / 100}% 的交易`,
        })
      }
      setPendingAction(null)
      resetWrite()
    }
  }, [txSuccess, pendingAction, resetWrite])

  const mockProgress = useMemo(() => {
    void mockTick
    return mockGetProgress(address)
  }, [address, mockTick])

  const isHolder = isContractsLive
    ? Boolean(onChainBalance && onChainBalance > 0n)
    : mockIsHolder(address)

  const progress = isContractsLive
    ? {
        helps: Number(onChainProgress?.[0] ?? 0n),
        required: Number(onChainProgress?.[1] ?? BigInt(HELPS_REQUIRED)),
        claimed: Boolean(onChainProgress?.[2]),
        code: bytes32ToCode(onChainProgress?.[3] as `0x${string}` | undefined),
      }
    : mockProgress

  const createInvite = useCallback(async () => {
    setError(null)
    if (!address) {
      setError('请先连接钱包')
      return null
    }
    if (!isHolder) {
      setError('需要先持有 / 购买项目代币才能生成口令')
      return null
    }

    if (!isContractsLive) {
      const code = mockCreateInvite(address)
      bumpMock()
      setCelebration({
        open: true,
        title: '口令已生成！',
        subtitle: '分享给好友，让他们来帮你砍一刀',
      })
      return code
    }

    try {
      setPendingAction('create')
      await writeContractAsync({
        address: ADDRESSES.bargain,
        abi: bargainAbi,
        functionName: 'createInvite',
      })
      return null
    } catch (e) {
      setPendingAction(null)
      setError(e instanceof Error ? e.message : '生成口令失败')
      return null
    }
  }, [address, isHolder, writeContractAsync])

  const redeemInvite = useCallback(
    async (code: string) => {
      setError(null)
      if (!address) {
        setError('请先连接钱包')
        return false
      }
      if (!code.trim()) {
        setError('请输入口令')
        return false
      }

      if (!isContractsLive) {
        const result = mockRedeemInvite(code.trim(), address)
        if (!result.ok) {
          setError(result.message)
          return false
        }
        bumpMock()
        setCelebration({
          open: true,
          title: '砍成功！',
          subtitle: `已帮好友砍到 ${result.invite?.helps}/${HELPS_REQUIRED} 刀`,
        })
        return true
      }

      try {
        setPendingAction('redeem')
        // Encode human code as bytes32 (pad UTF-8 bytes)
        const encoder = new TextEncoder()
        const bytes = encoder.encode(code.trim())
        const hex =
          '0x' +
          Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .padEnd(64, '0')
        await writeContractAsync({
          address: ADDRESSES.bargain,
          abi: bargainAbi,
          functionName: 'redeemInvite',
          args: [hex as `0x${string}`],
        })
        return true
      } catch (e) {
        setPendingAction(null)
        setError(e instanceof Error ? e.message : '帮砍失败')
        return false
      }
    },
    [address, writeContractAsync],
  )

  const claim = useCallback(async () => {
    setError(null)
    if (!address) {
      setError('请先连接钱包')
      return false
    }

    if (!isContractsLive) {
      const result = mockClaim(address)
      if (!result.ok) {
        setError(result.message)
        return false
      }
      bumpMock()
      setCelebration({
        open: true,
        title: '领取成功！',
        subtitle: result.message,
      })
      return true
    }

    try {
      setPendingAction('claim')
      await writeContractAsync({
        address: ADDRESSES.bargain,
        abi: bargainAbi,
        functionName: 'claim',
      })
      return true
    } catch (e) {
      setPendingAction(null)
      setError(e instanceof Error ? e.message : '领取失败')
      return false
    }
  }, [address, writeContractAsync])

  const dismissCelebration = () => setCelebration((c) => ({ ...c, open: false }))

  return {
    address,
    isConnected,
    isHolder,
    isContractsLive,
    isBusy: txPending || pendingAction !== null,
    progress,
    treasuryBalance,
    claimBps: CLAIM_BPS,
    helpsRequired: HELPS_REQUIRED,
    error,
    celebration,
    dismissCelebration,
    createInvite,
    redeemInvite,
    claim,
    setError,
  }
}
