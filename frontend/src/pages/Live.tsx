import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { connectTranscriptWs } from '../lib/ws'
import PageContainer from '../ui/PageContainer'
import Card from '../ui/Card'
import Button from '../ui/Button'

const REDIRECT_AFTER_MS = 10_000

/** Parse "Caller: text" or "You: text" into speaker + text */
function parseLine(line: string): { speaker: string; text: string } {
  const callerMatch = line.match(/^Caller:\s*(.*)$/i)
  if (callerMatch) return { speaker: 'Caller', text: callerMatch[1] }
  const youMatch = line.match(/^You:\s*(.*)$/i)
  if (youMatch) return { speaker: 'You', text: youMatch[1] }
  return { speaker: '', text: line }
}

export default function Live() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [autoscroll, setAutoscroll] = useState(true)
  const [typing, setTyping] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId) return
    setTyping(true)
    let typingTimer: ReturnType<typeof setTimeout>
    const disconnect = connectTranscriptWs(
      sessionId,
      (line) => {
        setTyping(false)
        clearTimeout(typingTimer)
        setLines((prev) => [...prev, line])
        typingTimer = setTimeout(() => setTyping(true), 1400)
      },
      () => setError('Connection error')
    )
    return () => {
      clearTimeout(typingTimer)
      disconnect()
    }
  }, [sessionId])

  useEffect(() => {
    if (autoscroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines, autoscroll, typing])

  useEffect(() => {
    if (!sessionId) return
    const t = setTimeout(() => {
      navigate(`/debrief/${sessionId}`)
    }, REDIRECT_AFTER_MS)
    return () => clearTimeout(t)
  }, [sessionId, navigate])

  if (!sessionId) return <PageContainer><p>Missing session</p></PageContainer>

  return (
    <PageContainer>
      <h1>Live call</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: error ? '#666' : '#000',
            animation: error ? undefined : 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <span className="muted">
          {error ? 'Disconnected' : 'Call in progress'}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Button
            onClick={() => setAutoscroll(!autoscroll)}
          >
            {autoscroll ? 'Autoscroll on' : 'Autoscroll off'}
          </Button>
        </div>
      </div>

      <Card>
        <h2 className="section-title">Transcript</h2>
        <div
          ref={containerRef}
          style={{
            maxHeight: 360,
            overflowY: 'auto',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {lines.length === 0 && !error && (
            <p className="muted">Waiting for transcript…</p>
          )}
          {error && (
            <p style={{ color: '#000' }}>{error}</p>
          )}
          {lines.map((line, i) => {
            const { speaker, text } = parseLine(line)
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                {speaker && (
                  <span
                    style={{
                      display: 'inline-block',
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
          })}
          {typing && (
            <span className="muted" style={{ display: 'inline-block', marginTop: 8 }}>
              Typing…
            </span>
          )}
        </div>
      </Card>

    </PageContainer>
  )
}
