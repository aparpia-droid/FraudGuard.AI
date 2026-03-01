/**
 * API client for FraudGuard backend.
 * Base URL is relative so Vite proxy forwards /api to the backend.
 */

const BASE = '/api'

async function throwIfNotOk(res: Response) {
  if (res.ok) return

  let msg = res.statusText
  try {
    const data = await res.json()
    msg = data?.error ?? data?.message ?? msg
  } catch {
    // ignore JSON parse errors
  }

  throw new Error(msg || `Request failed (${res.status})`)
}

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
  await throwIfNotOk(res)
  return res.json()
}

// ✅ New scoring shape
export interface ScoreResult {
  score: number
  tier: string
  explanation: string
}

// ✅ Matches backend GET /api/sessions/:sessionId
export interface SessionData {
  sessionId: string
  scenarioId: string
  transcript: string[]
  score: ScoreResult | null
  status: string
}

export async function getSession(sessionId: string): Promise<SessionData> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`)
  await throwIfNotOk(res)
  return res.json()
}

// Optional manual trigger (useful for testing)
export async function scoreSession(sessionId: string): Promise<ScoreResult> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/score`, { method: 'POST' })
  await throwIfNotOk(res)
  return res.json()
}

// UI helpers (optional)
export function gradeFromScore(s: number): string {
  if (s >= 90) return 'A'
  if (s >= 80) return 'B'
  if (s >= 70) return 'C'
  if (s >= 60) return 'D'
  return 'F'
}

export function riskLabelFromScore(s: number): 'Green' | 'Yellow' | 'Red' {
  if (s >= 85) return 'Green'
  if (s >= 60) return 'Yellow'
  return 'Red'
}