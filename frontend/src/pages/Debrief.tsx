import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, type SessionData } from '../lib/api'
import PageContainer from '../ui/PageContainer'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

function scoreVariant(label: string): 'green' | 'yellow' | 'red' {
  if (label === 'Green') return 'green'
  if (label === 'Yellow') return 'yellow'
  return 'red'
}

function riskLabelFromScore(score: number): 'Green' | 'Yellow' | 'Red' {
  if (score >= 85) return 'Green'
  if (score >= 60) return 'Yellow'
  return 'Red'
}

/** Keywords that suggest risky disclosure */
const RISKY_PATTERNS =
  /ssn|social security|account number|routing|dob|date of birth|birth date|password|pin\b/i

/** Tips by risk level */
const TIPS: Record<string, string[]> = {
  Green: [
    'Verify by calling the number on your card or statement.',
    "Legitimate callers won't pressure you to act immediately.",
    'Banks and IRS rarely initiate contact by phone for sensitive matters.',
  ],
  Yellow: [
    'Be cautious sharing any personal details over unsolicited calls.',
    'Hang up and call back using a number from official documents.',
    "Don't confirm or deny anything; let them send written notice.",
  ],
  Red: [
    'Never share SSN, DOB, or account numbers over the phone.',
    "Banks won't ask for full account numbers; scammers will.",
    'Hang up immediately if pressured—real institutions won’t do this.',
    'Report suspected scams to FTC at reportfraud.ftc.gov.',
  ],
}

function getTips(riskLabel: string): string[] {
  return TIPS[riskLabel] ?? TIPS.Red
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

  // Poll until score exists (backend auto-scores shortly after call ends)
  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let timer: number | undefined

    const load = async () => {
      try {
        const s = await getSession(sessionId)
        if (cancelled) return
        setData(s)

        // keep polling until backend has produced a score
        if (!s.score) {
          timer = window.setTimeout(load, 1200)
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load')
      }
    }

    load()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [sessionId])

  if (!sessionId) return <PageContainer><p>Missing session</p></PageContainer>
  if (error) return <PageContainer><p style={{ color: '#000' }}>{error}</p></PageContainer>
  if (!data) return <PageContainer><p>Loading…</p></PageContainer>

  const numericScore = data.score?.score ?? null
  const riskLabel =
    numericScore == null ? 'Yellow' : riskLabelFromScore(numericScore)

  const tips = getTips(riskLabel)

  return (
    <PageContainer>
      <h1>Debrief</h1>
      <p className="muted" style={{ marginBottom: 40 }}>
        Your vulnerability score and what to improve.
      </p>

      <div style={{ marginBottom: 40 }}>
        <h2 className="section-title">Vulnerability score</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Badge variant={scoreVariant(riskLabel)}>
            {numericScore == null ? 'Scoring…' : `${numericScore}/100`}
          </Badge>
          <span style={{ fontWeight: 500 }}>
            {numericScore == null ? 'Finalizing results' : `${riskLabel} risk`}
          </span>
        </div>

        {data.score?.tier && (
          <p className="muted" style={{ marginBottom: 8 }}>
            Tier: <strong>{data.score.tier}</strong>
          </p>
        )}

        {data.score?.explanation && (
          <p className="muted">{data.score.explanation}</p>
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