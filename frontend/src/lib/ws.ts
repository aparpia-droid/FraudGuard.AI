/**
 * WebSocket client for live transcript streaming.
 * Server emits:
 *  - { type: "transcript", line: string }
 *  - { type: "bulk_transcript", lines: string[] } (optional)
 *  - { type: "ended" } (call finished)
 */

export function connectTranscriptWs(
  sessionId: string,
  onLine: (line: string) => void,
  onError?: (err: Event) => void,
  onEnded?: () => void,
  onScore?: (score: { score: number; tier: string; explanation: string }) => void
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  // ✅ match backend path
  const wsUrl = `${protocol}//${host}/ws/transcript?sessionId=${encodeURIComponent(sessionId)}`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      // optional: server can send all previous lines at once
      if (data?.type === 'bulk_transcript' && Array.isArray(data.lines)) {
        for (const line of data.lines) {
          if (typeof line === 'string') onLine(line)
        }
        return
      }

      // new format
      if (data?.type === 'transcript' && typeof data.line === 'string') {
        onLine(data.line)
        return
      }

      // backward compatible format (your old server)
      if (typeof data?.line === 'string') {
        onLine(data.line)
        return
      }

      // score result pushed from server
      if (
      data?.type === 'score' &&
      data.score &&
      typeof data.score.score === 'number'
    ) {
      onScore?.(data.score)
      return
    }

    // call ended signal
    if (data?.type === 'ended') {
      onEnded?.()
      return
    }
    } catch {
      // ignore malformed
    }
  }

  if (onError) ws.onerror = onError

  return () => ws.close()
}