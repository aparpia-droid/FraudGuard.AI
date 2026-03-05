/**
 * Session HTTP routes.
 * POST /api/sessions/start — create session, place call, return sessionId
 * GET  /api/sessions/:sessionId — return transcript + score
 * POST /api/sessions/:sessionId/score — trigger scoring and return result
 */

import { Router, Request, Response } from 'express'
import {
  createSession,
  getSession as getStoredSession,
  updateSession,
} from '../sessionStore.js'
import { analyzeTranscript } from '../scoring.js'
import { placeOutboundCall } from '../twilio.js'

const router = Router()

/** Validate phone number: must be 10+ digits after stripping non-digits. */
function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

const VALID_SCENARIOS = ['social_security', 'tech_support', 'lottery_giveaway']

router.post('/start', async (req: Request, res: Response) => {
  const { phoneNumber, scenarioId } = req.body ?? {}

  if (!phoneNumber || !scenarioId) {
    res.status(400).json({ error: 'phoneNumber and scenarioId required' })
    return
  }

  if (!isValidPhone(String(phoneNumber))) {
    res.status(400).json({ error: 'Invalid phone number. Enter at least 10 digits.' })
    return
  }

  if (!VALID_SCENARIOS.includes(String(scenarioId))) {
    res.status(400).json({ error: `Invalid scenario. Choose one of: ${VALID_SCENARIOS.join(', ')}` })
    return
  }

  const session = createSession(String(phoneNumber), String(scenarioId))

  // Normalize phone for Twilio E.164
  const digits = String(phoneNumber).replace(/\D/g, '')
  const to =
    digits.length === 10
      ? `+1${digits}`
      : digits.length === 11 && digits.startsWith('1')
        ? `+${digits}`
        : String(phoneNumber)

  const callSid = await placeOutboundCall(to, session.sessionId)
  if (callSid) {
    updateSession(session.sessionId, { callSid })
  }

  res.json({
    sessionId: session.sessionId,
    callPlaced: Boolean(callSid),
  })
})

router.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params
  const session = getStoredSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  // Auto-score if completed and not yet scored
  if (session.status === 'completed' && !session.scoreResult && session.transcript.length > 0) {
    const result = analyzeTranscript(session.transcript)
    updateSession(sessionId, { scoreResult: result })
  }

  const sr = session.scoreResult
  res.json({
    sessionId: session.sessionId,
    status: session.status,
    transcript: session.transcript,
    score: sr?.score ?? null,
    tier: sr?.tier ?? null,
    explanation: sr?.explanation ?? null,
  })
})

/** Explicit scoring endpoint per PRD. */
router.post('/:sessionId/score', (req: Request, res: Response) => {
  const { sessionId } = req.params
  const session = getStoredSession(sessionId)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  if (session.transcript.length === 0) {
    res.status(400).json({ error: 'No transcript to score' })
    return
  }

  const result = analyzeTranscript(session.transcript)
  updateSession(sessionId, { scoreResult: result })

  res.json({
    score: result.score,
    tier: result.tier,
    explanation: result.explanation,
  })
})

export default router
