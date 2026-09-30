import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Celebration } from '../components/Celebration'
import { useBargain } from '../hooks/useBargain'
import { ADDRESSES, TOKEN_META } from '../config/contracts'
import './Kan.css'

export function KanPage() {
  const {
    isConnected,
    isHolder,
    isContractsLive,
    isBusy,
    progress,
    error,
    celebration,
    dismissCelebration,
    createInvite,
    redeemInvite,
    claim,
    restoreCode,
    setError,
    helpsRequired,
    claimBps,
    vaultBalanceLabel,
  } = useBargain()

  const [redeemCode, setRedeemCode] = useState('')
  const [restoreInput, setRestoreInput] = useState('')
  const [copied, setCopied] = useState(false)

  const pct = Math.min(100, Math.round((progress.helps / helpsRequired) * 100))
  const canClaim = progress.helps >= helpsRequired && !progress.claimed && Boolean(progress.code)

  const onCopy = async () => {
    if (!progress.code) return
    await navigator.clipboard.writeText(progress.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="kan">
      <Celebration
        open={celebration.open}
        title={celebration.title}
        subtitle={celebration.subtitle}
        onClose={dismissCelebration}
      />

      <header className="kan-hero">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          砍一刀
        </motion.h1>
        <p>
          生成口令拉好友 · 满 {helpsRequired} 刀领金库 {claimBps / 100}% BNB
        </p>
        {vaultBalanceLabel && (
          <p className="kan-vault-bal">金库余额 · {vaultBalanceLabel}</p>
        )}
      </header>

      {!isConnected && (
        <div className="kan-gate">
          <img src="/pdd-avatar.png" alt="" width={72} height={72} />
          <h2>先连接钱包</h2>
          <p>
            {TOKEN_META.chainName} · 持有 {TOKEN_META.symbol} 可生成口令
          </p>
          <ConnectButton label="连接钱包" />
        </div>
      )}

      {isConnected && (
        <div className="kan-grid">
          <section className="kan-panel">
            <h2>我的口令</h2>
            {!isHolder ? (
              <div className="kan-warn">
                <p>
                  当前钱包未达到持币门槛（需持有「{TOKEN_META.symbol}」）。请先在 Flap
                  请先在 Flap BNB 池购买后再生成口令（买税 {TOKEN_META.buyTax} · 卖税{' '}
                  {TOKEN_META.sellTax} 入金库）。
                </p>
                <a
                  className="pdd-btn pdd-btn-primary"
                  href={TOKEN_META.flapBoard}
                  target="_blank"
                  rel="noreferrer"
                >
                  去 Flap 买币
                </a>
                <Link to="/rules" className="kan-link">
                  查看规则
                </Link>
              </div>
            ) : progress.code ? (
              <div className="kan-code-box">
                <span className="kan-code-label">专属口令</span>
                <motion.code
                  key={progress.code}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="kan-code"
                >
                  {progress.code}
                </motion.code>
                <div className="kan-code-actions">
                  <button type="button" className="pdd-btn pdd-btn-primary" onClick={onCopy}>
                    {copied ? '已复制' : '复制口令'}
                  </button>
                </div>
              </div>
            ) : progress.hasOnChainInvite ? (
              <div className="kan-restore">
                <p>链上已有邀请，但本机未保存明文口令。请粘贴你创建时记下的口令以继续领取。</p>
                <label className="kan-field">
                  <span>恢复口令</span>
                  <input
                    value={restoreInput}
                    onChange={(e) => setRestoreInput(e.target.value)}
                    placeholder="粘贴你的口令"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className="pdd-btn pdd-btn-primary"
                  onClick={() => restoreCode(restoreInput)}
                >
                  恢复
                </button>
              </div>
            ) : (
              <div className="kan-create">
                <p>持币资格已确认，点击生成你的砍一刀口令。</p>
                <button
                  type="button"
                  className="pdd-btn pdd-btn-primary pdd-btn-lg"
                  disabled={isBusy}
                  onClick={() => void createInvite()}
                >
                  {isBusy ? '生成中…' : '生成口令'}
                </button>
              </div>
            )}

            <div className="kan-progress">
              <div className="kan-progress-head">
                <strong>帮砍进度</strong>
                <span>
                  {progress.helps} / {helpsRequired}
                </span>
              </div>
              <div
                className="kan-bar"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  className="kan-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                />
              </div>
              <div className="kan-knives" aria-hidden>
                {Array.from({ length: helpsRequired }).map((_, i) => (
                  <span key={i} className={i < progress.helps ? 'on' : ''}>
                    刀
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="pdd-btn pdd-btn-claim"
              disabled={!canClaim || isBusy}
              onClick={() => void claim()}
            >
              {progress.claimed
                ? '已领取'
                : canClaim
                  ? `领取金库 ${claimBps / 100}% BNB`
                  : `再砍 ${Math.max(0, helpsRequired - progress.helps)} 刀可领`}
            </button>
          </section>

          <section className="kan-panel kan-panel-accent">
            <h2>帮好友砍</h2>
            <p className="kan-hint">粘贴好友口令，确认后即「砍成功」</p>
            <label className="kan-field">
              <span>口令</span>
              <input
                value={redeemCode}
                onChange={(e) => {
                  setRedeemCode(e.target.value)
                  setError(null)
                }}
                placeholder="例如：砍A1B2C3D4"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="pdd-btn pdd-btn-primary pdd-btn-lg"
              disabled={isBusy || !redeemCode.trim()}
              onClick={() => void redeemInvite(redeemCode)}
            >
              {isBusy ? '砍刀中…' : '帮砍一刀'}
            </button>
          </section>
        </div>
      )}

      {error && (
        <motion.div
          className="kan-error"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <p className="kan-mode">
        {isContractsLive
          ? `BSC 主网 · Flap 代币 ${ADDRESSES.token.slice(0, 8)}… · Vault ${ADDRESSES.vault.slice(0, 8)}…`
          : '演示模式：口令存于本机，合约地址到位后自动切真实交易'}
      </p>
    </div>
  )
}
