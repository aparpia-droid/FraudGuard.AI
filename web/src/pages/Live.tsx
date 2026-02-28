import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { connectTranscriptWs } from '../lib/ws'

const REDIRECT_AFTER_MS = 10_000

export default function Live() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const disconnect = connectTranscriptWs(
      sessionId,
      (line) => setLines((prev) => [...prev, line]),
      () => setError('WebSocket error')
    )
    return disconnect
  }, [sessionId])

  // Auto-redirect to debrief after 10 seconds
  useEffect(() => {
    if (!sessionId) return
    const t = setTimeout(() => {
      navigate(`/debrief/${sessionId}`)
    }, REDIRECT_AFTER_MS)
    return () => clearTimeout(t)
  }, [sessionId, navigate])

  if (!sessionId) return <p>Missing session</p>

  return (
    <div style={{ padding: 24 }}>
      <h1>Live transcript</h1>
      <p>Session: {sessionId}. Redirecting to debrief in 10 seconds.</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {lines.length === 0 && !error ? 'Waiting for transcript…' : null}
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  )
}
