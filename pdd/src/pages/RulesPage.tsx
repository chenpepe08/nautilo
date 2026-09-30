import { Link } from 'react-router-dom'
import { CLAIM_BPS, HELPS_REQUIRED, TOKEN_META, ADDRESSES } from '../config/contracts'
import './Rules.css'

export function RulesPage() {
  return (
    <article className="rules">
      <header className="rules-hero">
        <img src="/pdd-avatar.png" alt="" width={64} height={64} />
        <h1>砍一刀规则</h1>
        <p>拼多多模式：买币有资格，口令找好友，满刀分金库。</p>
      </header>

      <section>
        <h2>1. 参与资格</h2>
        <p>
          连接钱包后，需已购买 / 持有项目代币 <strong>{TOKEN_META.name}</strong>（符号{' '}
          <strong>{TOKEN_META.symbol}</strong>）才能点击「生成口令」。未持币用户仍可粘贴他人口令帮砍。
        </p>
        <p>
          可在{' '}
          <a href={TOKEN_META.flapBoard} target="_blank" rel="noreferrer">
            Flap 测试网
          </a>{' '}
          购买。卖出税率 1% 进入金库合约；买入税 0%。
        </p>
      </section>

      <section>
        <h2>2. 生成口令</h2>
        <p>
          持币用户在「砍一刀」页生成专属口令，分享给好友。同一钱包同一时期对应一口令（链上正式版以合约为准）。
        </p>
      </section>

      <section>
        <h2>3. 好友帮砍</h2>
        <p>
          好友打开本站，粘贴口令并连接钱包确认后，界面展示「砍成功」庆祝效果。每位好友对同一口令通常只能帮砍一次；不能给自己砍。
        </p>
      </section>

      <section>
        <h2>4. 进度与领取</h2>
        <p>
          累计约 <strong>{HELPS_REQUIRED}</strong> 次成功帮砍后，口令发起人可点击领取，获得金库当前余额的{' '}
          <strong>{CLAIM_BPS / 100}%</strong>（拼多多模式）。领取成功与否以链上交易结果为准；演示模式仅模拟 UI。
        </p>
      </section>

      <section>
        <h2>5. 网络与风险</h2>
        <ul>
          <li>当前阶段：BSC 测试网。主网需另行明确授权后切换。</li>
          <li>合约未部署前站点为演示模式，不会发生真实转账。</li>
          <li>加密资产有风险，请自行判断；切勿泄露助记词 / 私钥。</li>
        </ul>
      </section>

      <section className="rules-addrs">
        <h2>6. 地址占位（待合约工位发布）</h2>
        <dl>
          <dt>Token</dt>
          <dd>
            <code>{ADDRESSES.token}</code>
          </dd>
          <dt>Treasury</dt>
          <dd>
            <code>{ADDRESSES.treasury}</code>
          </dd>
          <dt>Bargain</dt>
          <dd>
            <code>{ADDRESSES.bargain}</code>
          </dd>
          <dt>Pool（参考）</dt>
          <dd>
            <code>{ADDRESSES.pool}</code>
          </dd>
        </dl>
      </section>

      <p className="rules-cta">
        <Link to="/kan" className="pdd-btn pdd-btn-primary">
          去砍一刀
        </Link>
      </p>
    </article>
  )
}
