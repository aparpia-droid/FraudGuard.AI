import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../lib/api'
import Input from '../ui/Input'

const SCENARIOS = [
  { id: 'social_security', label: 'Social Security', description: 'Caller claims your SSN is suspended or there’s a problem with your benefits.' },
  { id: 'tech_support', label: 'Tech Support', description: 'Someone says your computer has a virus or needs remote access.' },
  { id: 'lottery_giveaway', label: 'Lottery / Giveaway', description: 'You’ve “won” a prize and need to pay fees or give personal details to claim it.' },
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
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-title">FraudGuard.AI</h1>
        <p className="home-subtitle">
          Get a realistic scam call in 60 seconds.
        </p>
        <p className="home-trust-row">
          No login • We discard your number • 60 seconds
        </p>

        <div className="home-section">
          <Input
            label="Phone number"
            type="tel"
            value={phoneNumber}
            onChange={setPhoneNumber}
            placeholder="+1 234 567 8900"
            className="home-phone-wrap"
          />
          <p className="home-phone-helper">
            We use your number only to place the call. It’s discarded when the call ends.
          </p>
        </div>

        <div className="home-section">
          <h2 className="home-section-title">Scenario</h2>
          <div className="home-scenario-grid">
            {SCENARIOS.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setScenarioId(s.id)}
                onClick={() => setScenarioId(s.id)}
                className={`home-scenario-card ${scenarioId === s.id ? 'selected' : ''}`}
              >
                <span className="home-scenario-check" aria-hidden>✓</span>
                <p className="home-scenario-title">{s.label}</p>
                <p className="home-scenario-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>
        )}

        <div className="home-cta-wrap">
          <button
            type="button"
            className="home-cta"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Starting…' : 'Start training call'}
          </button>
          <p className="home-cta-helper">
            Your phone will ring in ~10 seconds.
          </p>
        </div>
      </div>
    </div>
  )
}
