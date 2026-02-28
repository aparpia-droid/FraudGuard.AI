/**
 * Session HTTP routes.
 * POST /api/sessions/start — create session, return sessionId
 * GET /api/sessions/:sessionId — return mock transcript + score for now
 */

import { Router, Request, Response } from 'express'
import {
  createSession,
  getSession as getStoredSession,
} from '../sessionStore.js'
import { computeScore, getRiskLabel } from '../scoring.js'

const router = Router()

/** Mock transcript for GET when we don't have real data yet. */
const MOCK_TRANSCRIPT = [
  'Caller: Hello, this is your bank security department.',
  'You: Okay, what is this regarding?',
  'Caller: We need to verify your account. Can you confirm your full SSN?',
  'You: I prefer not to share that.',
]

/** Mock: no sensitive data detected — high score. Later: run Groq (or other NLP) on transcript to detect PII and pass to computeScore. */
const MOCK_DETECTED: import('../scoring.js').SensitiveType[] = []

router.post('/start', (req: Request, res: Response) => {
  const { phoneNumber, scenarioId } = req.body ?? {}
  if (!phoneNumber || !scenarioId) {
    res.status(400).json({ error: 'phoneNumber and scenarioId required' })
    return
  }
  const session = createSession(String(phoneNumber), String(scenarioId))
  res.json({ sessionId: session.sessionId })
})

router.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params
  const session = getStoredSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  // For now: use stored transcript if any, else mock. Score from mock detection.
  // Later: run computeScore on real detected PII from transcript (e.g. via Groq).
  const transcript =
    session.transcript.length > 0 ? session.transcript : MOCK_TRANSCRIPT
  const score = computeScore(MOCK_DETECTED)
  const riskLabel = getRiskLabel(score)
  res.json({
    sessionId: session.sessionId,
    transcript,
    score,
    riskLabel,
  })
})

export default router
