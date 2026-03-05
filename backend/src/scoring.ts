/**
 * Scoring engine for scam-call simulation.
 * Analyzes transcript text to compute a vulnerability score (0-100).
 *
 * Score starts at 100. Points deducted for sharing sensitive info,
 * points added back for good defensive behavior.
 *
 * Tiers per PRD:
 *   80-100  Safe
 *   60-79   Caution
 *   40-59   Vulnerable
 *   0-39    High Risk
 */

export type RiskTier = 'Safe' | 'Caution' | 'Vulnerable' | 'High Risk'

export interface ScoreResult {
  score: number
  tier: RiskTier
  explanation: string
}

/* ── Deduction patterns (things the user should NOT do) ───────────── */

interface DeductionRule {
  pattern: RegExp
  points: number
  label: string
}

const DEDUCTION_RULES: DeductionRule[] = [
  { pattern: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/, points: 35, label: 'shared full SSN' },
  { pattern: /\bssn\b.*\b(is|it'?s|mine)\b/i, points: 35, label: 'disclosed SSN' },
  { pattern: /\b(my ssn|social security number)\b.*\d/i, points: 35, label: 'shared SSN digits' },
  { pattern: /\b(account|routing)\s*(number|#)?\s*(is|:)?\s*\d{4,}/i, points: 25, label: 'shared account number' },
  { pattern: /\b(date of birth|dob|birthday)\b.*\b(is|:)?\s*\d/i, points: 15, label: 'shared date of birth' },
  { pattern: /\b(born on|born in)\s+\w+\s+\d/i, points: 15, label: 'shared birth date' },
  { pattern: /\b(password|pin)\s*(is|:)\s*\S+/i, points: 20, label: 'shared password or PIN' },
  { pattern: /\b(verification|confirm(ation)?)\s*(code|number)\s*(is|:)\s*\d/i, points: 20, label: 'shared verification code' },
  { pattern: /\b(i('?ll| will)|let me|okay|sure)\b.*(send|wire|transfer|pay|money|gift\s*card)/i, points: 30, label: 'agreed to send money' },
  { pattern: /\b(yes|okay|sure|alright)\b.*\b(remote|access|download|install)/i, points: 20, label: 'agreed to remote access' },
  { pattern: /\bcredit\s*card\b.*\d{4}/i, points: 25, label: 'shared credit card number' },
]

/* ── Bonus patterns (things the user SHOULD do) ───────────────────── */

interface BonusRule {
  pattern: RegExp
  points: number
  label: string
}

const BONUS_RULES: BonusRule[] = [
  { pattern: /\b(who (is|are) (this|you)|identify yourself)\b/i, points: 5, label: 'questioned the caller identity' },
  { pattern: /\b(don'?t|do not|won'?t|will not|refuse|not comfortable|not going to)\b.*(share|give|provide|tell|send)/i, points: 10, label: 'refused to share information' },
  { pattern: /\b(hang(ing)? up|end(ing)? (the |this )?call|goodbye|good bye)\b/i, points: 15, label: 'ended or threatened to end the call' },
  { pattern: /\b(call(ing)?\s*(back|the|my|official)|verify|check with)\b.*(bank|number|card|official|directly)/i, points: 10, label: 'stated intent to verify independently' },
  { pattern: /\b(scam|fraud|fake|suspicious|don'?t (trust|believe))\b/i, points: 10, label: 'identified the call as suspicious' },
  { pattern: /\b(report|ftc|police|authorities)\b/i, points: 5, label: 'mentioned reporting to authorities' },
  { pattern: /\b(no|nope)\b/i, points: 3, label: 'refused a request' },
]

/**
 * Extract only the user's lines from a transcript.
 */
function extractUserLines(transcript: string[]): string[] {
  return transcript
    .filter((line) => /^You:/i.test(line))
    .map((line) => line.replace(/^You:\s*/i, ''))
}

/**
 * Analyze a full transcript and produce score, tier, and explanation.
 */
export function analyzeTranscript(transcript: string[]): ScoreResult {
  const userLines = extractUserLines(transcript)
  const userText = userLines.join(' ')

  let score = 100
  const deductions: string[] = []
  const bonuses: string[] = []

  const appliedDeductions = new Set<string>()
  for (const rule of DEDUCTION_RULES) {
    if (rule.pattern.test(userText) && !appliedDeductions.has(rule.label)) {
      score -= rule.points
      deductions.push(`-${rule.points}: ${rule.label}`)
      appliedDeductions.add(rule.label)
    }
  }

  const appliedBonuses = new Set<string>()
  for (const rule of BONUS_RULES) {
    if (rule.pattern.test(userText) && !appliedBonuses.has(rule.label)) {
      score += rule.points
      bonuses.push(`+${rule.points}: ${rule.label}`)
      appliedBonuses.add(rule.label)
    }
  }

  score = Math.max(0, Math.min(100, score))

  const tier = getTier(score)
  const explanation = buildExplanation(score, tier, deductions, bonuses)

  return { score, tier, explanation }
}

/** Map score to PRD-defined risk tier. */
export function getTier(score: number): RiskTier {
  if (score >= 80) return 'Safe'
  if (score >= 60) return 'Caution'
  if (score >= 40) return 'Vulnerable'
  return 'High Risk'
}

function buildExplanation(
  score: number,
  tier: RiskTier,
  deductions: string[],
  bonuses: string[]
): string {
  const parts: string[] = []
  parts.push(`Score: ${score}/100 (${tier})`)

  if (deductions.length === 0 && bonuses.length === 0) {
    parts.push('No sensitive disclosures or notable defensive actions were detected in the transcript.')
    return parts.join('\n')
  }

  if (deductions.length > 0) {
    parts.push('Vulnerabilities detected:')
    for (const d of deductions) parts.push(`  ${d}`)
  }

  if (bonuses.length > 0) {
    parts.push('Good defensive behavior:')
    for (const b of bonuses) parts.push(`  ${b}`)
  }

  return parts.join('\n')
}
