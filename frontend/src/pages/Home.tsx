import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../lib/api'

const SCENARIOS = [
  { id: 'irs_imposter', label: 'IRS Imposter' },
  { id: 'bank_fraud', label: 'Bank Fraud' },
  { id: 'tech_support', label: 'Tech Support Scam' },
  { id: 'grandparent', label: 'Grandparent Scam' },
]

export default function Home() {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setError(null)
    setLoading(true)
    try {
      const { sessionId } = await startSession({ phoneNumber, scenarioId })
      navigate(`/live/${sessionId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>FraudGuard.AI</h1>
      <p>Start a simulated scam call session.</p>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Phone number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Scenario</label>
        <select
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p style={{ color: 'crimson', marginBottom: 12 }}>{error}</p>
      )}
      <button
        onClick={handleStart}
        disabled={loading}
        style={{ padding: '10px 20px' }}
      >
        {loading ? 'Starting…' : 'Start'}
      </button>
    </div>
  )
}
