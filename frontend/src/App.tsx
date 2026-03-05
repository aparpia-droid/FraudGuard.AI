import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Live from './pages/Live'
import Debrief from './pages/Debrief'

function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <Link to="/" className="site-logo-link" aria-label="FraudGuard.AI home">
          <img src="/logo.png" alt="FraudGuard.AI" className="site-logo" />
        </Link>
      </header>
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live/:sessionId" element={<Live />} />
          <Route path="/debrief/:sessionId" element={<Debrief />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
