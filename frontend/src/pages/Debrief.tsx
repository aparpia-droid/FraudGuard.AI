import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, type SessionData } from '../lib/api'
import PageContainer from '../ui/PageContainer'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

type BadgeVariant = 'green' | 'yellow' | 'red' | 'neutral'

function tierVariant(tier: string | null): BadgeVariant {
  if (tier === 'Safe') return 'green'
  if (tier === 'Caution') return 'yellow'
  if (tier === 'Vulnerable') return 'red'
  if (tier === 'High Risk') return 'red'
  return 'neutral'
}

/** Keywords that suggest risky disclosure */
const RISKY_PATTERNS = /ssn|social security|account number|routing|dob|date of birth|birth date|password|pin\b/i

/** Tips by risk tier (matches PRD tiers) */
const TIPS: Record<string, string[]> = {
  Safe: [
    'Verify by calling the number on your card or statement.',
    "Legitimate callers won't pressure you to act immediately.",
    'Banks and IRS rarely initiate contact by phone for sensitive matters.',
  ],
  Caution: [
    'Be cautious sharing any personal details over unsolicited calls.',
    'Hang up and call back using a number from official documents.',
    "Don't confirm or deny anything; let them send written notice.",
  ],
  Vulnerable: [
    'Never share SSN, DOB, or account numbers over the phone.',
    "Banks won't ask for full account numbers; scammers will.",
    "Hang up immediately if pressured — real institutions won't do this.",
  ],
  'High Risk': [
    'Never share SSN, DOB, or account numbers over the phone.',
    "Banks won't ask for full account numbers; scammers will.",
    "Hang up immediately if pressured — real institutions won't do this.",
    'Report suspected scams to FTC at reportfraud.ftc.gov.',
  ],
}

function getTips(tier: string | null): string[] {
  if (tier && TIPS[tier]) return TIPS[tier]
  return TIPS['High Risk']
}

/** Highlight risky transcript lines */
function isRiskyLine(line: string): boolean {
  return RISKY_PATTERNS.test(line)
}

/** Parse line into speaker + text */
function parseLine(line: string): { speaker: string; text: string } {
  const m = line.match(/^(Caller|You):\s*(.*)$/i)
  if (m) return { speaker: m[1], text: m[2] }
  return { speaker: '', text: line }
}

export default function Debrief() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function load() {
      try {
        const result = await getSession(sessionId!)
        if (cancelled) return

        // If session isn't scored yet, retry a few times
        if (result.score === null && retries < 5) {
          setTimeout(() => setRetries((r) => r + 1), 1500)
          return
        }

        setData(result)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionId, retries])

  if (!sessionId) return <PageContainer><p>Missing session</p></PageContainer>
  if (error) return <PageContainer><p style={{ color: '#000' }}>{error}</p></PageContainer>
  if (!data) return <PageContainer><p>Loading debrief...</p></PageContainer>

  const tips = getTips(data.tier)

  return (
    <PageContainer>
      <h1>Debrief</h1>
      <p className="muted" style={{ marginBottom: 40 }}>
        Your vulnerability score and what to improve.
      </p>

      <div style={{ marginBottom: 40 }}>
        <h2 className="section-title">Vulnerability score</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Badge variant={tierVariant(data.tier)}>
            {data.score ?? '?'}/100
          </Badge>
          <span style={{ fontWeight: 500 }}>{data.tier ?? 'Pending'}</span>
        </div>
        {data.explanation && (
          <pre style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            {data.explanation}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2 className="section-title">Transcript</h2>
        <Card>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {data.transcript.length === 0 ? (
              <p className="muted">No transcript</p>
            ) : (
              data.transcript.map((line, i) => {
                const { speaker, text } = parseLine(line)
                const risky = isRiskyLine(line)
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: 12,
                      padding: risky ? '8px 12px' : undefined,
                      background: risky ? '#f0f0f0' : undefined,
                      borderRadius: risky ? 'var(--radius)' : undefined,
                      borderLeft: risky ? '2px solid #000' : undefined,
                    }}
                  >
                    {speaker && (
                      <span
                        style={{
                          fontWeight: 600,
                          color: speaker === 'Caller' ? 'var(--text-muted)' : 'var(--accent)',
                          marginRight: 8,
                        }}
                      >
                        {speaker}:
                      </span>
                    )}
                    {text}
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2 className="section-title">Tips</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {tips.map((tip, i) => (
            <li key={i} style={{ marginBottom: 12 }}>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <Button primary onClick={() => navigate('/')}>
        Try another scenario
      </Button>
    </PageContainer>
  )
}
