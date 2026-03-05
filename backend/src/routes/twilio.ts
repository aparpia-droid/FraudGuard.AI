/**
 * Twilio webhook placeholder. Voice webhook for incoming calls.
 * Returns simple TwiML saying "This is a test scam call".
 * Full voice AI: plug in ElevenLabs (voice) + Groq (LLM/STT) here later.
 */

import { Router, Request, Response } from 'express'

const router = Router()

router.post('/voice', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined
  // Later: use sessionId to fetch scenario, stream ElevenLabs + Groq
  res.type('application/xml')
  res.send(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Response><Say>This is a test scam call.</Say></Response>'
  )
})

export default router
