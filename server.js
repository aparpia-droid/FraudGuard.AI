require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Twilio client for SMS verification
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Map scenarios to ElevenLabs agent IDs
const SCENARIO_AGENTS = {
  'social_security': process.env.AGENT_SOCIAL_SECURITY,
  'apple_support': process.env.AGENT_APPLE_SUPPORT,
  'lottery': process.env.AGENT_LOTTERY,
};

// Scenario display info
const SCENARIO_INFO = {
  'social_security': {
    name: 'Social Security Suspension',
    description: 'A government official claims your benefits are about to be suspended.',
    difficulty: 'Hard',
    tactics: ['Authority impersonation', 'Urgency', 'Legal threats'],
  },
  'apple_support': {
    name: 'Apple Tech Support',
    description: 'A technician claims your iCloud account has been compromised.',
    difficulty: 'Medium',
    tactics: ['Technical jargon', 'Fear of data loss', 'Remote access'],
  },
  'lottery': {
    name: 'Lottery / Giveaway',
    description: 'You\'ve won $25,000 and a MacBook Pro. Just pay a small fee to claim.',
    difficulty: 'Easy',
    tactics: ['Excitement', 'Too good to be true', 'Processing fees'],
  },
};

// In-memory session store
const sessions = {};

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => res.json({ ok: true }));

// ============ GET SCENARIOS ============

app.get('/scenarios', (req, res) => {
  const scenarios = Object.entries(SCENARIO_INFO).map(([id, info]) => ({
    id,
    ...info,
  }));
  res.json(scenarios);
});

// ============ SMS VERIFICATION ============

app.post('/send-code', async (req, res) => {
  const { phoneNumber } = req.body;

  console.log('Received send-code request for:', phoneNumber);

  if (!phoneNumber) {
    return res.status(400).json({ error: 'phoneNumber required' });
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    console.log('Verification sent:', verification.status);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending code:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  console.log('Received verify-code request');

  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'phoneNumber and code required' });
  }

  try {
    const result = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phoneNumber, code });

    console.log('Verification result:', result.status);

    if (result.status === 'approved') {
      return res.json({ verified: true });
    }

    return res.json({ verified: false, status: result.status });
  } catch (err) {
    console.error('Error verifying code:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ TRIGGER THE CALL ============

app.post('/start-call', async (req, res) => {
  const { phoneNumber, scenarioId } = req.body;

  console.log('Received start-call request');
  console.log('Phone Number:', phoneNumber);
  console.log('Scenario:', scenarioId);

  if (!phoneNumber || !scenarioId) {
    return res.status(400).json({ error: 'phoneNumber and scenarioId required' });
  }

  const agentId = SCENARIO_AGENTS[scenarioId];
  if (!agentId) {
    return res.status(400).json({ error: 'Invalid scenario' });
  }

  const sessionId = uuidv4();

  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/twilio/outbound-call',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          agent_id: agentId,
          agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
          to_number: phoneNumber,
          conversation_initiation_client_data: {
            dynamic_variables: {
              session_id: sessionId,
              scenario: scenarioId,
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('ElevenLabs API error:', data);
      return res.status(response.status).json({ error: data });
    }

    sessions[sessionId] = {
      conversationId: data.conversation_id,
      callSid: data.callSid,
      phoneNumber,
      scenarioId,
      scenarioName: SCENARIO_INFO[scenarioId].name,
      status: 'calling',
      startedAt: Date.now(),
      transcript: null,
      score: null,
    };

    console.log(`✓ Call initiated — session: ${sessionId}, conversation: ${data.conversation_id}`);

    res.json({
      success: true,
      sessionId,
      conversationId: data.conversation_id,
    });
  } catch (err) {
    console.error('Error starting call:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CHECK CALL STATUS ============

app.get('/session/:sessionId/status', async (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.status === 'calling' && session.conversationId) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${session.conversationId}`,
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'done' || data.status === 'ended') {
          session.status = 'completed';
          session.transcript = data.transcript;
          session.duration = data.metadata?.call_duration_secs;
        }
      }
    } catch (err) {
      console.error('Error checking conversation status:', err);
    }
  }

  res.json({
    status: session.status,
    conversationId: session.conversationId,
    scenarioName: session.scenarioName,
    duration: session.duration || null,
  });
});

// ============ FETCH TRANSCRIPT ============

app.get('/session/:sessionId/transcript', async (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session || !session.conversationId) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.transcript) {
    return res.json({
      transcript: session.transcript,
      status: session.status,
      duration: session.duration,
    });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${session.conversationId}`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('ElevenLabs transcript error:', errData);
      return res.status(response.status).json({ error: errData });
    }

    const data = await response.json();
    session.transcript = data.transcript;
    session.status = 'completed';
    session.duration = data.metadata?.call_duration_secs;

    res.json({
      transcript: data.transcript,
      status: data.status,
      duration: session.duration,
    });
  } catch (err) {
    console.error('Error fetching transcript:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ SCORE THE CALL (GROQ) ============

app.post('/session/:sessionId/score', async (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!session.transcript) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${session.conversationId}`,
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
        }
      );
      const data = await response.json();
      session.transcript = data.transcript;
      session.status = 'completed';
    } catch (err) {
      return res.status(400).json({ error: 'Could not fetch transcript' });
    }
  }

  if (session.score) {
    return res.json(session.score);
  }

  const transcriptText = session.transcript
    .map(t => `${t.role}: ${t.message}`)
    .join('\n');

  try {
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are analyzing a phone conversation transcript between a simulated scam caller and a person being tested on their scam awareness.

The caller is an AI playing the role of a scammer. The other speaker is the test subject.

Analyze the test subject's responses ONLY. Do not analyze the caller.

For each response from the test subject, identify:

1. PII_DISCLOSURES: Any personal information revealed. For each:
   - pii_type: one of [first_name, full_name, email, phone_confirmation, employer, home_address, date_of_birth, mothers_maiden_name, last4_ssn, last4_card, security_answers, full_bank_account, full_credit_card, login_credentials, full_ssn, otp_2fa_code]
   - exact_quote: the exact words said
   - severity: one of [low, medium, high, critical]
   - points_lost: first_name=-3, full_name=-5, email=-5, phone_confirmation=-5, employer=-7, home_address=-10, date_of_birth=-10, mothers_maiden_name=-12, last4_ssn=-15, last4_card=-15, security_answers=-20, full_bank_account=-25, full_credit_card=-25, login_credentials=-25, full_ssn=-30, otp_2fa_code=-30

2. BEHAVIORAL_MISTAKES: For each:
   - behavior_type: one of [gave_info_fast, agreed_transfer_money, agreed_gift_cards, confirmed_fake_url, agreed_download_software, never_questioned_identity, stayed_long_no_challenge]
   - points_lost: gave_info_fast=-10, agreed_transfer_money=-20, agreed_gift_cards=-20, confirmed_fake_url=-10, agreed_download_software=-15, never_questioned_identity=-10, stayed_long_no_challenge=-5

3. DEFENSIVE_BEHAVIORS: For each:
   - defense_type: one of [asked_verify_id, callback_official_number, refused_info, asked_if_scam, hung_up_early, called_out_red_flag, asked_for_supervisor]
   - points_earned: asked_verify_id=+5, callback_official_number=+10, refused_info=+5, asked_if_scam=+3, hung_up_early=+10, called_out_red_flag=+5, asked_for_supervisor=+3

Return ONLY valid JSON. No markdown. No backticks. No explanation. Just the JSON object:
{
  "pii_disclosures": [{"pii_type": "", "exact_quote": "", "severity": "", "points_lost": 0}],
  "behavioral_mistakes": [{"behavior_type": "", "points_lost": 0}],
  "defensive_behaviors": [{"defense_type": "", "points_earned": 0}],
  "total_points_lost": 0,
  "total_points_earned": 0,
  "final_score": 0,
  "tier": ""
}

Score calculation: Start at 100. Add all points_lost (negative numbers). Add all points_earned (positive numbers). Minimum score is 0.

Tier thresholds:
90-100 = scam_proof
75-89 = cautious
60-74 = aware_but_exposed
40-59 = vulnerable
20-39 = high_risk
0-19 = compromised`
            },
            {
              role: 'user',
              content: `Scenario: ${session.scenarioName}\n\nTranscript:\n${transcriptText}`,
            },
          ],
          temperature: 0.1,
        }),
      }
    );

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqData);
      return res.status(groqResponse.status).json({ error: groqData });
    }

    let rawContent = groqData.choices[0].message.content;
    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const analysis = JSON.parse(rawContent);

    session.score = analysis;
    session.status = 'scored';

    console.log(`Session ${req.params.sessionId} scored: ${analysis.final_score}/100 (${analysis.tier})`);

    res.json(analysis);
  } catch (err) {
    console.error('Error scoring:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ GET FULL SESSION (for debrief screen) ============

app.get('/session/:sessionId', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: req.params.sessionId,
    scenarioId: session.scenarioId,
    scenarioName: session.scenarioName,
    status: session.status,
    conversationId: session.conversationId,
    startedAt: session.startedAt,
    duration: session.duration || null,
    transcript: session.transcript || null,
    score: session.score || null,
  });
});

// ============ LEADERBOARD ============

app.get('/leaderboard', (req, res) => {
  const entries = Object.entries(sessions)
    .filter(([_, s]) => s.score)
    .map(([id, s]) => ({
      sessionId: id,
      scenarioName: s.scenarioName,
      score: s.score.final_score,
      tier: s.score.tier,
      duration: s.duration,
      timestamp: s.startedAt,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json(entries);
});

// ============ START SERVER ============

app.listen(process.env.PORT || 3001, () => {
  console.log(`FraudGuard.ai server running on port ${process.env.PORT || 3001}`);
});
