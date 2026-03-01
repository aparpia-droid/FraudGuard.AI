/**
 * API client for FraudGuard backend.
 * Base URL is relative so Vite proxy forwards /api to the backend.
 */

const BASE = '/api'

export interface StartSessionInput {
  phoneNumber: string
  scenarioId: string
}

export interface StartSessionResponse {
  sessionId: string
}

export async function startSession(
  input: StartSessionInput
): Promise<StartSessionResponse> {
  const res = await fetch(`${BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to start session: ${res.statusText}`)
  return res.json()
}

export interface SessionData {
  sessionId: string
  transcript: string[]
  score: number
  /** Risk label: Green | Yellow | Red */
  riskLabel: string
}

export async function getSession(sessionId: string): Promise<SessionData> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`)
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.statusText}`)
  return res.json()
}
