/**
 * Twilio client for placing outbound calls.
 * When credentials are set, places a real call to the user's phone.
 * Later: plug in ElevenLabs + Groq for voice AI in the webhook.
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER
const baseUrl = process.env.PUBLIC_BASE_URL

export function canPlaceCall(): boolean {
  return Boolean(accountSid && authToken && fromNumber && baseUrl)
}

export async function placeOutboundCall(
  to: string,
  sessionId: string
): Promise<string | null> {
  if (!canPlaceCall()) return null

  try {
    const { default: twilio } = await import('twilio')
    const client = twilio(accountSid, authToken)
    const voiceUrl = `${(baseUrl ?? '').replace(/\/$/, '')}/api/twilio/voice?sessionId=${sessionId}`

    const call = await client.calls.create({
      to,
      from: fromNumber!,
      url: voiceUrl,
    })
    return call.sid
  } catch (err) {
    console.error('[twilio] Failed to place call:', err)
    return null
  }
}
