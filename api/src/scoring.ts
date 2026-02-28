/**
 * Simple scoring for scam-call simulation.
 * Start at 100; deduct points when user reveals sensitive data.
 * Later: can plug in NLP/LLM (e.g. Groq) to detect PII in transcript.
 */

export type SensitiveType = 'full_ssn' | 'dob' | 'account_number'

const DEDUCTIONS: Record<SensitiveType, number> = {
  full_ssn: 35,
  dob: 15,
  account_number: 25,
}

const MAX_SCORE = 100

/**
 * Compute score from 100, deducting for each sensitive type detected.
 * @param detected — list of sensitive data types found in the transcript
 */
export function computeScore(detected: SensitiveType[]): number {
  let score = MAX_SCORE
  for (const type of detected) {
    score -= DEDUCTIONS[type] ?? 0
  }
  return Math.max(0, score)
}

/** Map score to risk label for debrief UI. */
export function getRiskLabel(score: number): 'Green' | 'Yellow' | 'Red' {
  if (score >= 70) return 'Green'
  if (score >= 40) return 'Yellow'
  return 'Red'
}
