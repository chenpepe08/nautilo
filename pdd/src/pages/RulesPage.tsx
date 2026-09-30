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
          连接钱包后，需持有项目代币 <strong>{TOKEN_META.name}</strong>（符号{' '}
          <strong>{TOKEN_META.symbol}</strong>，余额达到合约门槛）才能点击「生成口令」。未持币用户仍可粘贴他人口令帮砍。
        </p>
        <p>
          卖出税率 <strong>1%</strong> 进入金库合约；买入税 <strong>0%</strong>。正式税币将在{' '}
          <a href={TOKEN_META.flapBoard} target="_blank" rel="noreferrer">
            Flap 测试网
          </a>{' '}
          发射，金库受益地址为 Vault。当前测试阶段可用 Mock「拼多多」代币验证流程。
        </p>
      </section>

      <section>
        <h2>2. 生成口令</h2>
        <p>
          持币用户在「砍一刀」页生成专属明文口令并分享给好友。链上仅存口令哈希；请自行备份明文以便领取。
        </p>
      </section>

      <section>
        <h2>3. 好友帮砍</h2>
        <p>
          好友打开本站，粘贴口令并连接钱包确认后，界面展示「砍成功」。每位地址对同一口令只能帮砍一次；不能给自己砍。
        </p>
      </section>

      <section>
        <h2>4. 进度与领取</h2>
        <p>
          累计 <strong>{HELPS_REQUIRED}</strong> 次成功帮砍后，口令发起人可领取金库当前{' '}
          <strong>BNB</strong> 余额的 <strong>{CLAIM_BPS / 100}%</strong>。领取以链上交易为准。
        </p>
      </section>

      <section>
        <h2>5. 网络与风险</h2>
        <ul>
          <li>当前阶段：BSC 测试网（chainId 97）。主网需另行明确授权后切换。</li>
          <li>加密资产有风险，请自行判断；切勿泄露助记词 / 私钥。</li>
        </ul>
      </section>

      <section className="rules-addrs">
        <h2>6. 测试网合约地址</h2>
        <dl>
          <dt>Token（Mock，待换 Flap）</dt>
          <dd>
            <code>{ADDRESSES.token}</code>
          </dd>
          <dt>Vault（金库 + 砍一刀）</dt>
          <dd>
            <code>{ADDRESSES.vault}</code>
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
