/**
 * WebSocket client for live transcript streaming.
 * Connects with sessionId; server will emit mock transcript lines.
 * Later: will stream real-time STT (e.g. Groq) and/or ElevenLabs responses.
 */

export function connectTranscriptWs(
  sessionId: string,
  onLine: (line: string) => void,
  onError?: (err: Event) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const wsUrl = `${protocol}//${host}/ws?sessionId=${encodeURIComponent(sessionId)}`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (typeof data.line === 'string') onLine(data.line)
    } catch {
      // ignore malformed
    }
  }

  if (onError) ws.onerror = onError

  return () => ws.close()
}
