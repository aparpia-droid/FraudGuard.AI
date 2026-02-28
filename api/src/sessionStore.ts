/**
 * In-memory session store. Not persistent — for development only.
 * Later: replace with DB (e.g. Redis/Postgres) when needed.
 */

export interface Session {
  sessionId: string
  phoneNumber: string
  scenarioId: string
  /** Accumulated transcript lines (optional; filled by WebSocket or later by STT). */
  transcript: string[]
}

const store = new Map<string, Session>()

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Generate a short random session ID like "session_ab12cd". */
export function generateSessionId(): string {
  let id = 'session_'
  for (let i = 0; i < 6; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return id
}

export function createSession(
  phoneNumber: string,
  scenarioId: string
): Session {
  const sessionId = generateSessionId()
  const session: Session = {
    sessionId,
    phoneNumber,
    scenarioId,
    transcript: [],
  }
  store.set(sessionId, session)
  return session
}

export function getSession(sessionId: string): Session | undefined {
  return store.get(sessionId)
}

export function appendTranscript(sessionId: string, line: string): void {
  const s = store.get(sessionId)
  if (s) s.transcript.push(line)
}
