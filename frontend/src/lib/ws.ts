/**
 * WebSocket client for live transcript streaming.
 * Connects with sessionId; server sends transcript lines then a done signal.
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
      if (data.done === true) {
        onDone()
        return
      }
      if (typeof data.line === 'string') onLine(data.line)
    } catch {
      // ignore malformed
    }
  }

  ws.onclose = () => onDone()
  if (onError) ws.onerror = onError

  return () => ws.close()
}
