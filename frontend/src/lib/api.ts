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
  callPlaced: boolean
}

export async function startSession(
  input: StartSessionInput
): Promise<StartSessionResponse> {
  const res = await fetch(`${BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Failed to start session: ${res.statusText}`)
  }
  return res.json()
}

export interface SessionData {
  sessionId: string
  status: 'pending' | 'in_progress' | 'completed'
  transcript: string[]
  score: number | null
  /** Risk tier: Safe | Caution | Vulnerable | High Risk */
  tier: string | null
  explanation: string | null
}

export async function getSession(sessionId: string): Promise<SessionData> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`)
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.statusText}`)
  return res.json()
}

export async function scoreSession(
  sessionId: string
): Promise<{ score: number; tier: string; explanation: string }> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/score`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Failed to score session: ${res.statusText}`)
  return res.json()
}
