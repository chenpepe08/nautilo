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
          <a
            href="https://flap.sh/bnb/0xe4cb08439C9F9FA1B46a101DF5215A1Ee8B27777"
            target="_blank"
            rel="noreferrer"
          >
            Flap BNB 池
          </a>
          <span>pdd.aiflaps.com</span>
        </footer>
      </div>
    </BrowserRouter>
  )
}
