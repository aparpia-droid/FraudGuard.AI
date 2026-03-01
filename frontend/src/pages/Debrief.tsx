import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSession, type SessionData } from '../lib/api'

function riskColor(label: string): string {
  if (label === 'Green') return 'green'
  if (label === 'Yellow') return 'orange'
  if (label === 'Red') return 'crimson'
  return 'inherit'
}

export default function Debrief() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [data, setData] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [sessionId])

  if (!sessionId) return <p>Missing session</p>
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  if (!data) return <p>Loading…</p>

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1>Debrief</h1>
      <p>Session: {data.sessionId}</p>
      <p>
        <strong>Score:</strong> {data.score}
      </p>
      <p>
        <strong>Risk:</strong>{' '}
        <span style={{ color: riskColor(data.riskLabel), fontWeight: 'bold' }}>
          {data.riskLabel}
        </span>
      </p>
      <h2>Transcript</h2>
      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {data.transcript.length === 0
          ? 'No transcript'
          : data.transcript.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
      </div>
    </div>
  )
}
