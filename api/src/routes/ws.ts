/**
 * WebSocket server for live transcript streaming.
 * Client connects with ?sessionId=xxx. Server emits mock transcript lines every 2s.
 * Later: stream real-time STT (e.g. Groq) and ElevenLabs voice agent responses here.
 */

import { WebSocket } from 'ws'
import { getSession, appendTranscript } from '../sessionStore.js'

const MOCK_LINES = [
  'Caller: Hello, this is your bank security department.',
  'You: What is this regarding?',
  'Caller: We need to verify your account.',
  'You: I can call the number on my card.',
  'Caller: This is the number on your card. Please confirm your DOB.',
]

const INTERVAL_MS = 2000

export function handleWsConnection(ws: WebSocket, url: string): void {
  const sessionId = new URL(url, 'http://localhost').searchParams.get(
    'sessionId'
  )
  if (!sessionId || !getSession(sessionId)) {
    ws.close(4000, 'Invalid or unknown sessionId')
    return
  }

  let index = 0
  const timer = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      clearInterval(timer)
      return
    }
    const line = MOCK_LINES[index % MOCK_LINES.length]
    index += 1
    appendTranscript(sessionId, line)
    ws.send(JSON.stringify({ line }))
  }, INTERVAL_MS)

  ws.on('close', () => clearInterval(timer))
}
