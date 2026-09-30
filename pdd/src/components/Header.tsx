import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { isContractsLive } from '../config/contracts'
import './Header.css'

export function Header() {
  return (
    <header className="pdd-header">
      <Link to="/" className="pdd-brand">
        <motion.img
          src="/pdd-avatar.png"
          alt="拼多多"
          className="pdd-logo"
          whileHover={{ rotate: [-4, 4, 0], scale: 1.06 }}
          transition={{ duration: 0.35 }}
        />
        <div className="pdd-brand-text">
          <span className="pdd-brand-name">拼多多</span>
          <span className="pdd-brand-tag">砍一刀 · Flap</span>
        </div>
      </Link>

      <nav className="pdd-nav">
        <NavLink to="/" end>
          首页
        </NavLink>
        <NavLink to="/kan">砍一刀</NavLink>
        <NavLink to="/rules">规则</NavLink>
      </nav>

      <div className="pdd-header-actions">
        {!isContractsLive && <span className="pdd-badge-mock">演示模式</span>}
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
        />
      </div>
    </header>
  )
}
