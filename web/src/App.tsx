import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Live from './pages/Live'
import Debrief from './pages/Debrief'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/live/:sessionId" element={<Live />} />
        <Route path="/debrief/:sessionId" element={<Debrief />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
