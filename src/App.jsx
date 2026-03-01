import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CallSimulator from './pages/CallSimulator';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/call-simulator" element={<CallSimulator />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
