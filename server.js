require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const fs = require('fs');
const path = require('path');

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

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

const sessions = {}; // sessionId -> { phoneNumber, stage, transcript }

// Helper function to generate realistic voice using ElevenLabs
async function generateElevenLabsAudio(text, sessionId) {
  try {
    // Use Rachel voice (female) or Adam voice (male) - Rachel is default for natural, conversational tone
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Rachel voice

    console.log(`Generating audio for session ${sessionId}: "${text.substring(0, 50)}..."`);

    const audio = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_monolingual_v1"
    });

    // Save audio file temporarily
    const audioDir = path.join(__dirname, 'temp_audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioPath = path.join(audioDir, `${sessionId}_${Date.now()}.mp3`);
    const chunks = [];

    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(audioPath, buffer);

    console.log(`Audio saved to: ${audioPath}`);
    return audioPath;
  } catch (error) {
    console.error('ElevenLabs error:', error);
    throw error;
  }
}

app.get('/health', (req, res) => res.json({ ok: true }));

// Serve audio files
app.use('/audio', express.static(path.join(__dirname, 'temp_audio')));

// Start a call simulation
app.post('/start-call', async (req, res) => {
  const { phoneNumber, scenarioId, scenarioName } = req.body;

  console.log('Received start-call request');
  console.log('Phone Number:', phoneNumber);
  console.log('Scenario:', scenarioName);

  if (!phoneNumber) {
    return res.status(400).json({ error: "phoneNumber required" });
  }

  try {
    const sessionId = uuidv4();

    sessions[sessionId] = {
      phoneNumber,
      scenarioId,
      scenarioName,
      stage: "GREETING",
      transcript: []
    };

    console.log('Creating session:', sessionId);

    // Check if we should make actual calls
    const shouldMakeCalls = !process.env.BASE_URL.includes('localhost') ||
                           process.env.ENABLE_CALLS_IN_DEV === 'true';

    if (shouldMakeCalls) {
      try {
        // For localhost, we need to use TwiML directly instead of a URL
        const isLocalhost = process.env.BASE_URL.includes('localhost');

        if (isLocalhost) {
          // Create TwiML for the initial message
          const initialMessage = sessions[sessionId].scenarioName === 'Social Security Suspension'
            ? "Hello, this is the Social Security Benefits Review Department. This line is recorded. We detected suspicious activity linked to your benefits. Can I confirm your full name for verification?"
            : "This is an automated call regarding your account. Please stay on the line.";

          const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say voice="Polly.Joanna">${initialMessage}</Say>
              <Gather input="speech" timeout="10" speechTimeout="auto" action="${process.env.BASE_URL}/process-speech?sessionId=${sessionId}" method="POST">
                <Say voice="Polly.Joanna">Please respond now.</Say>
              </Gather>
            </Response>`;

          await client.calls.create({
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            twiml: twimlResponse
          });
          console.log('✓ Call initiated successfully (localhost mode with inline TwiML)');
        } else {
          // Production mode - use webhook URL
          await client.calls.create({
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `${process.env.BASE_URL}/voice?sessionId=${sessionId}`,
            method: "POST",
          });
          console.log('✓ Call initiated successfully (production mode)');
        }
      } catch (callError) {
        console.error('Failed to initiate call:', callError.message);
        // Don't fail the request, just log the error
      }
    } else {
      console.log('⊘ Skipping actual call (ENABLE_CALLS_IN_DEV not set)');
    }

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error starting call:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/send-code', async (req, res) => {
  const { phoneNumber } = req.body;

  console.log('Received send-code request for:', phoneNumber);

  if (!phoneNumber) {
    console.log('Error: phoneNumber missing');
    return res.status(400).json({ error: "phoneNumber required" });
  }

  try {
    console.log('Sending verification code via Twilio...');
    console.log('Service SID:', process.env.TWILIO_VERIFY_SERVICE_SID);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    console.log('Verification sent successfully:', verification.status);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending verification code:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({ error: err.message });
  }
});

app.post('/verify-code', async (req, res) => {
  const { phoneNumber, code } = req.body;

  console.log('Received verify-code request');
  console.log('Phone Number:', phoneNumber);
  console.log('Code:', code);

  if (!phoneNumber || !code) {
    console.log('Error: Missing phoneNumber or code');
    return res.status(400).json({ error: "phoneNumber and code required" });
  }

  try {
    console.log('Checking verification code with Twilio...');
    console.log('Service SID:', process.env.TWILIO_VERIFY_SERVICE_SID);

    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phoneNumber, code });

    console.log('Verification result status:', result.status);

    if (result.status === 'approved') {
      console.log('✓ Verification approved! Creating session...');
      const sessionId = uuidv4();

      sessions[sessionId] = {
        phoneNumber,
        stage: "GREETING",
        transcript: []
      };

      // Only initiate call if BASE_URL is publicly accessible (not localhost)
      if (!process.env.BASE_URL.includes('localhost')) {
        try {
          await client.calls.create({
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `${process.env.BASE_URL}/voice?sessionId=${sessionId}`,
            method: "POST",
          });
          console.log('Call initiated successfully');
        } catch (callError) {
          console.warn('Failed to initiate call (this is OK for localhost):', callError.message);
        }
      } else {
        console.log('Skipping call initiation (localhost BASE_URL)');
      }

      return res.json({ verified: true, sessionId });
    }

    console.log('✗ Verification not approved. Status:', result.status);
    return res.json({ verified: false, status: result.status });

  } catch (err) {
    console.error('Error verifying code:', err.message);
    console.error('Error code:', err.code);
    return res.status(500).json({ error: err.message });
  }
});

app.all('/voice', async (req, res) => {
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

  try {
    // Generate realistic audio with ElevenLabs
    const audioPath = await generateElevenLabsAudio(opening, sessionId);
    const audioFilename = path.basename(audioPath);
    const audioUrl = `${process.env.BASE_URL}/audio/${audioFilename}`;

    // Play the ElevenLabs audio instead of robotic TTS
    twiml.play(audioUrl);
  } catch (error) {
    console.error('Error generating audio:', error);
    // Fallback to Twilio TTS if ElevenLabs fails
    twiml.say({ voice: "Polly.Joanna" }, opening);
  }

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
  console.log("User said:", userText);

  if (sessions[sessionId]) {
    sessions[sessionId].transcript.push({ role: "user", text: userText, ts: Date.now() });
  }

  // Generate contextual scammer response based on conversation history
  const scammerText = generateNextScammerLine(userText, sessions[sessionId]);

  if (sessions[sessionId]) {
    sessions[sessionId].transcript.push({ role: "scammer", text: scammerText, ts: Date.now() });
  }

  console.log("Scammer response:", scammerText);

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    // Generate realistic audio with ElevenLabs
    const audioPath = await generateElevenLabsAudio(scammerText, sessionId);
    const audioFilename = path.basename(audioPath);
    const audioUrl = `${process.env.BASE_URL}/audio/${audioFilename}`;

    // Play the ElevenLabs audio
    twiml.play(audioUrl);
  } catch (error) {
    console.error('Error generating audio:', error);
    // Fallback to Twilio TTS if ElevenLabs fails
    twiml.say({ voice: "Polly.Joanna" }, scammerText);
  }

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

// Enhanced scammer response generation with context awareness
function generateNextScammerLine(userText, session) {
  const t = (userText || "").toLowerCase();
  const transcript = session?.transcript || [];

  // If they resist, reveal simulation and end
  if (t.includes("scam") || t.includes("call back") || t.includes("official number") ||
      t.includes("not interested") || t.includes("hang up")) {
    return "Understood. This was a simulated scam call for cybersecurity training. In real life, never share personal information and always call the official number from a trusted source. Goodbye.";
  }

  // Count how many exchanges have happened
  const exchangeCount = transcript.filter(t => t.role === 'user').length;

  // If user gives name or personal info
  if (t.includes("my name is") || t.includes("i'm") || t.includes("i am") ||
      (t.split(' ').length <= 3 && exchangeCount > 0)) {
    return "Thank you. Now, we need to verify your identity. For security purposes, what's your date of birth? Remember, this is just a training exercise, so please use fake information.";
  }

  // If they give numbers (could be SSN, DOB, etc.)
  if (/\d{2,}/.test(t) || t.includes("nineteen") || t.includes("twenty")) {
    return "Perfect. One last thing - we need to confirm your address for our records. What street do you live on? Again, please use fake information for this training.";
  }

  // If they give location info
  if (t.includes("street") || t.includes("avenue") || t.includes("road") || t.includes("drive") ||
      t.includes("city") || t.includes("live") || t.includes("address")) {
    return "Excellent. Your account will be updated shortly. Before we finish, we detected some unauthorized charges. To secure your account, I'll need the last 4 digits of your credit card. Use fake numbers for training purposes only.";
  }

  // If they're asking questions
  if (t.includes("?") || t.includes("what") || t.includes("why") || t.includes("who") || t.includes("how")) {
    return "I understand your concern. This is a routine security check. We've detected suspicious activity on your account, and we need to verify your information immediately to prevent your benefits from being suspended. Can you confirm your full name for me?";
  }

  // Default response - create urgency
  const urgentResponses = [
    "I need to verify your identity right away. What is your full name? Remember, use fake information for this training.",
    "Time is critical here. If we don't resolve this now, your account will be permanently locked. Can you please provide your name?",
    "I understand, but we really need to move quickly. Your benefits are at risk. What name do you have on file with us?"
  ];

  return urgentResponses[exchangeCount % urgentResponses.length];
}

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
