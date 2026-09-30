import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { RulesPage } from './pages/RulesPage'
import { KanPage } from './pages/KanPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="pdd-shell">
        <Header />
        <main className="pdd-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/kan" element={<KanPage />} />
            <Route path="/rules" element={<RulesPage />} />
          </Routes>
        </main>
        <footer className="pdd-footer">
          <span>拼多多 · 真正的拼多多砍一刀</span>
          <a href="https://testnet.flap.sh/board?lang=zh" target="_blank" rel="noreferrer">
            Flap 测试网
          </a>
          <span>pdd.aiflaps.com</span>
        </footer>
      </div>
    </BrowserRouter>
  )
}
