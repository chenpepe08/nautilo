import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { formatEther, zeroHash } from 'viem'
import {
  ADDRESSES,
  CLAIM_BPS,
  HELPS_REQUIRED,
  MIN_HOLD_AMOUNT,
  erc20Abi,
  isContractsLive,
  vaultAbi,
} from '../config/contracts'
import {
  mockClaim,
  mockCreateInvite,
  mockGetProgress,
  mockIsHolder,
  mockRedeemInvite,
} from '../lib/mockBargain'
import {
  generateInviteCode,
  recallInviteCode,
  rememberInviteCode,
} from '../lib/inviteCodes'

export function useBargain() {
  const { address, isConnected } = useAccount()
  const [mockTick, setMockTick] = useState(0)
  const [localCodeTick, setLocalCodeTick] = useState(0)
  const [celebration, setCelebration] = useState<{
    open: boolean
    title: string
    subtitle: string
  }>({ open: false, title: '', subtitle: '' })
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'create' | 'redeem' | 'claim' | null>(
    null,
  )
  const [pendingCode, setPendingCode] = useState<string | null>(null)

  const bumpMock = () => setMockTick((n) => n + 1)

  const rememberedCode = useMemo(() => {
    void localCodeTick
    return recallInviteCode(address)
  }, [address, localCodeTick])

  const { data: onChainBalance, refetch: refetchBalance } = useReadContract({
    address: ADDRESSES.token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isContractsLive && Boolean(address) },
  })

  const { data: minHold } = useReadContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'minHoldAmount',
    query: { enabled: isContractsLive },
  })

  const { data: onChainHelpsRequired } = useReadContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'helpsRequired',
    query: { enabled: isContractsLive },
  })

  const { data: latestHash, refetch: refetchLatest } = useReadContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'latestInvite',
    args: address ? [address] : undefined,
    query: { enabled: isContractsLive && Boolean(address) },
  })

  const hasLatest =
    Boolean(latestHash) && latestHash !== zeroHash && latestHash !== undefined

  const { data: campaign, refetch: refetchCampaign } = useReadContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'campaignOf',
    args: hasLatest && latestHash ? [latestHash] : undefined,
    query: { enabled: isContractsLive && hasLatest },
  })

  const { data: vaultBalance, refetch: refetchVault } = useReadContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'vaultBalance',
    query: { enabled: isContractsLive },
  })

  const { writeContractAsync, data: txHash, reset: resetWrite } = useWriteContract()
  const { isLoading: txPending, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (!txSuccess || !pendingAction) return

    if (pendingAction === 'create' && pendingCode && address) {
      rememberInviteCode(address, pendingCode)
      setLocalCodeTick((n) => n + 1)
      setCelebration({
        open: true,
        title: '口令已生成！',
        subtitle: `口令 ${pendingCode} — 分享给好友帮你砍一刀`,
      })
    } else if (pendingAction === 'redeem') {
      setCelebration({
        open: true,
        title: '砍成功！',
        subtitle: '帮好友砍了一刀，拼多多快乐加倍',
      })
    } else if (pendingAction === 'claim') {
      setCelebration({
        open: true,
        title: '领取成功！',
        subtitle: `已发起领取金库 ${CLAIM_BPS / 100}% BNB 的交易`,
      })
    }

    setPendingAction(null)
    setPendingCode(null)
    resetWrite()
    void refetchLatest()
    void refetchCampaign()
    void refetchVault()
    void refetchBalance()
  }, [
    txSuccess,
    pendingAction,
    pendingCode,
    address,
    resetWrite,
    refetchLatest,
    refetchCampaign,
    refetchVault,
    refetchBalance,
  ])

  const mockProgress = useMemo(() => {
    void mockTick
    return mockGetProgress(address)
  }, [address, mockTick])

  const threshold = minHold ?? MIN_HOLD_AMOUNT
  const isHolder = isContractsLive
    ? Boolean(onChainBalance !== undefined && onChainBalance >= threshold)
    : mockIsHolder(address)

  const helpsRequired = isContractsLive
    ? Number(onChainHelpsRequired ?? BigInt(HELPS_REQUIRED))
    : HELPS_REQUIRED

  const progress = isContractsLive
    ? {
        helps: Number(campaign?.[1] ?? 0n),
        required: helpsRequired,
        claimed: Boolean(campaign?.[2]),
        code: rememberedCode,
        hasOnChainInvite: hasLatest,
        claimedAmount: campaign?.[3] ?? 0n,
      }
    : { ...mockProgress, hasOnChainInvite: Boolean(mockProgress.code), claimedAmount: 0n }

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

    if (rememberedCode && hasLatest) {
      setCelebration({
        open: true,
        title: '口令已存在',
        subtitle: `你的口令是 ${rememberedCode}`,
      })
      return rememberedCode
    }

    const code = generateInviteCode()
    try {
      setPendingAction('create')
      setPendingCode(code)
      await writeContractAsync({
        address: ADDRESSES.vault,
        abi: vaultAbi,
        functionName: 'createInvite',
        args: [code],
      })
      return code
    } catch (e) {
      setPendingAction(null)
      setPendingCode(null)
      setError(e instanceof Error ? e.message : '生成口令失败')
      return null
    }
  }, [address, isHolder, rememberedCode, hasLatest, writeContractAsync])

  const redeemInvite = useCallback(
    async (code: string) => {
      setError(null)
      if (!address) {
        setError('请先连接钱包')
        return false
      }
      const trimmed = code.trim()
      if (!trimmed) {
        setError('请输入口令')
        return false
      }

      if (!isContractsLive) {
        const result = mockRedeemInvite(trimmed, address)
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
        await writeContractAsync({
          address: ADDRESSES.vault,
          abi: vaultAbi,
          functionName: 'help',
          args: [trimmed],
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

    const code = rememberedCode
    if (!code) {
      setError('本地没有保存口令。请用创建口令的浏览器领取，或重新记下口令后再试。')
      return false
    }

    try {
      setPendingAction('claim')
      await writeContractAsync({
        address: ADDRESSES.vault,
        abi: vaultAbi,
        functionName: 'claim',
        args: [code],
      })
      return true
    } catch (e) {
      setPendingAction(null)
      setError(e instanceof Error ? e.message : '领取失败')
      return false
    }
  }, [address, rememberedCode, writeContractAsync])

  const restoreCode = useCallback(
    (code: string) => {
      if (!address) return
      const trimmed = code.trim()
      if (!trimmed) return
      rememberInviteCode(address, trimmed)
      setLocalCodeTick((n) => n + 1)
    },
    [address],
  )

  const dismissCelebration = () => setCelebration((c) => ({ ...c, open: false }))

  const vaultBalanceLabel =
    vaultBalance !== undefined ? `${formatEther(vaultBalance)} BNB` : null

  return {
    address,
    isConnected,
    isHolder,
    isContractsLive,
    isBusy: txPending || pendingAction !== null,
    progress,
    vaultBalance,
    vaultBalanceLabel,
    treasuryBalance: vaultBalance,
    claimBps: CLAIM_BPS,
    helpsRequired,
    error,
    celebration,
    dismissCelebration,
    createInvite,
    redeemInvite,
    claim,
    restoreCode,
    setError,
  }
}
