require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sessions = {}; // sessionId -> { phoneNumber, stage, transcript }

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/send-code', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });

  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ error: "phoneNumber and code required" });
  }

  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phoneNumber, code });

    if (result.status === 'approved') {
      const sessionId = uuidv4();

      sessions[sessionId] = {
        phoneNumber,
        stage: "GREETING",
        transcript: []
      };


      await client.calls.create({
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${process.env.BASE_URL}/voice?sessionId=${sessionId}`,
        method: "POST",
      });

      return res.json({ verified: true, sessionId });
    }

    return res.json({ verified: false, status: result.status });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.all('/voice', (req, res) => {
  const sessionId = req.query.sessionId;

  const twiml = new twilio.twiml.VoiceResponse();

  // First line (scammer opening)
  const opening =
    "Hello, this is the Social Security Benefits Review Department. This line is recorded. " +
    "We detected suspicious activity linked to your benefits. Can I confirm your full name for verification?";

  if (sessions[sessionId]) {
    sessions[sessionId].transcript.push({ role: "scammer", text: opening, ts: Date.now() });
    sessions[sessionId].stage = "INFO_EXTRACTION";
  }

  twiml.say({ voice: "Polly.Joanna" }, opening);

  // Listen for user speech, then send it to /process-speech
  twiml.gather({
    input: "speech dtmf",
    timeout: 10,
    speechTimeout: "auto",
    action: `${process.env.BASE_URL}/process-speech?sessionId=${encodeURIComponent(sessionId)}`,
    method: "POST",
  });

  twiml.redirect(
    { method: "POST" },
    `${process.env.BASE_URL}/voice?sessionId=${encodeURIComponent(sessionId)}`
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

app.all('/process-speech', async (req, res) => {
  const sessionId = req.query.sessionId;
  const userText = req.body.SpeechResult || req.body.Digits || "";

  console.log("process-speech session:", sessionId);
  console.log("SpeechResult:", req.body.SpeechResult);
  console.log("Digits:", req.body.Digits);

  if (sessions[sessionId]) {
    sessions[sessionId].transcript.push({ role: "user", text: userText, ts: Date.now() });
  }

  // For now: simple “state machine-ish” response (no LLM yet)
  const scammerText = generateNextScammerLine(userText, sessions[sessionId]?.stage);

  if (sessions[sessionId]) {
    sessions[sessionId].transcript.push({ role: "scammer", text: scammerText, ts: Date.now() });
  }

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ voice: "Polly.Joanna" }, scammerText);

  // Listen again
  twiml.gather({
    input: "speech dtmf",
    timeout: 10,
    speechTimeout: "auto",
    action: `${process.env.BASE_URL}/process-speech?sessionId=${encodeURIComponent(sessionId)}`,
    method: "POST",
  });

  twiml.redirect(
    { method: "POST" },
    `${process.env.BASE_URL}/voice?sessionId=${encodeURIComponent(sessionId)}`
  );
  
  res.type("text/xml");
  res.send(twiml.toString());
});

// Very simple placeholder logic (replace later with ElevenLabs + LLM)
function generateNextScammerLine(userText, stage) {
  const t = (userText || "").toLowerCase();

  // If they resist, reveal simulation and end (per your rules)
  if (t.includes("scam") || t.includes("call back") || t.includes("official number")) {
    return "Understood. This was a simulated scam call for cybersecurity training. In real life, never share personal information and always call the official number from a trusted source. Goodbye.";
  }

  // Keep it short and pushy
  return "I understand. This will only take ninety seconds. For training purposes, use fake details only. What city and state should I put on the file?";
}

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
