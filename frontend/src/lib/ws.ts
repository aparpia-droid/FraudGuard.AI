/**
 * WebSocket client for live transcript streaming.
 * Supports both our backend format ({ line, done }) and
 * extended format ({ type: "transcript", type: "ended" }).
 */

export function connectTranscriptWs(
  sessionId: string,
  onLine: (line: string) => void,
  onDone: () => void,
  onError?: (err: Event) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const wsUrl = `${protocol}//${host}/ws?sessionId=${encodeURIComponent(sessionId)}`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      // Done signal from our backend
      if (data.done === true) {
        onDone()
        return
      }

      // Extended format: bulk transcript
      if (data?.type === 'bulk_transcript' && Array.isArray(data.lines)) {
        for (const line of data.lines) {
          if (typeof line === 'string') onLine(line)
        }
        return
      }

      // Extended format: single line
      if (data?.type === 'transcript' && typeof data.line === 'string') {
        onLine(data.line)
        return
      }

      // Simple format: { line }
      if (typeof data?.line === 'string') {
        onLine(data.line)
        return
      }

      // Extended format: ended
      if (data?.type === 'ended') {
        onDone()
        return
      }
    } catch {
      // ignore malformed
    }
  }

  ws.onclose = () => onDone()
  if (onError) ws.onerror = onError

  return () => ws.close()
}
