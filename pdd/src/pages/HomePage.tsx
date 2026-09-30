import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TOKEN_META, HELPS_REQUIRED, CLAIM_BPS } from '../config/contracts'
import './Home.css'

export function HomePage() {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden />
        <motion.img
          src="/pdd-avatar.png"
          alt="拼多多"
          className="home-hero-logo"
          initial={{ y: 24, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        />
        <motion.h1
          className="home-hero-brand"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          拼多多
        </motion.h1>
        <motion.p
          className="home-hero-line"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          真正的拼多多砍一刀 — 好友帮砍，金库分红
        </motion.p>
        <motion.div
          className="home-hero-cta"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <Link to="/kan" className="pdd-btn pdd-btn-primary pdd-btn-lg">
            立刻砍一刀
          </Link>
          <Link to="/rules" className="pdd-btn pdd-btn-ghost pdd-btn-lg">
            查看规则
          </Link>
        </motion.div>
      </section>

      <section className="home-flow">
        <h2>四步开砍</h2>
        <p className="section-lead">买币 → 口令 → 帮砍 → 领金库</p>
        <ol className="flow-steps">
          {[
            { t: '买入代币', d: `在 Flap 购买「${TOKEN_META.symbol}」获得资格` },
            { t: '生成口令', d: '持币钱包连接站点，一键生成砍一刀口令' },
            { t: '好友帮砍', d: '好友粘贴口令，屏幕亮起「砍成功」' },
            { t: '领取奖励', d: `约 ${HELPS_REQUIRED} 次成功后，领取金库 ${CLAIM_BPS / 100}%` },
          ].map((step, i) => (
            <motion.li
              key={step.t}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="flow-num">{i + 1}</span>
              <div>
                <strong>{step.t}</strong>
                <p>{step.d}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="home-promo">
        <div className="home-promo-inner">
          <img src="/pdd-avatar.png" alt="" width={56} height={56} />
          <div>
            <h2>代币：{TOKEN_META.name}</h2>
            <p>
              符号 <strong>{TOKEN_META.symbol}</strong> · 买税 0% · 卖税 1% 入金库 · BSC 测试网先行
            </p>
          </div>
          <a
            className="pdd-btn pdd-btn-primary"
            href={TOKEN_META.flapBoard}
            target="_blank"
            rel="noreferrer"
          >
            去 Flap 买币
          </a>
        </div>
      </section>
    </div>
  )
}
