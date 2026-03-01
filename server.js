require('dotenv').config();
console.log("SERVER BOOTED FROM:", process.cwd());
console.log("SERVER FILE:", __filename);
console.log("ELEVEN KEY PRESENT:", !!process.env.ELEVENLABS_API_KEY, "LEN:", (process.env.ELEVENLABS_API_KEY || "").length);
console.log("ELEVEN KEY PREFIX:", (process.env.ELEVENLABS_API_KEY || "").slice(0, 6));
console.log("GROQ KEY:", process.env.GROQ_API_KEY);

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});


const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require("http");
const WebSocket = require("ws");
const { spawn } = require("child_process");
const prism = require("prism-media");

const app = express();
app.use((req, res, next) => {
  res.setHeader("X-BACKEND-ID", "fraudguard-backend-3000");
  next();
});
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

const AUDIO_DIR = path.join(__dirname, 'audio_cache');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

app.use('/audio', express.static(AUDIO_DIR)); // Twilio will fetch MP3s here

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sessions = {}; // sessionId -> { phoneNumber, stage, transcript }

app.get('/health', (req, res) => res.json({ ok: true }));

app.post("/twilio-stream-status", (req, res) => {
  console.log("📡 STREAM STATUS CALLBACK:", req.body);
  res.sendStatus(200);
});

async function getElevenSignedUrl(agentId) {
  const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
  const resp = await axios.get(url, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    timeout: 15000, // 15s hard timeout so it never hangs silently
    validateStatus: () => true,
  });

  if (resp.status !== 200) {
    throw new Error(`Eleven signed-url failed: ${resp.status} ${JSON.stringify(resp.data)}`);
  }
  if (!resp.data?.signed_url) {
    throw new Error(`Eleven signed-url missing signed_url: ${JSON.stringify(resp.data)}`);
  }
  return resp.data.signed_url;
}

app.all("/voice", (req, res) => {
  const sessionId = req.query.sessionId || uuidv4();

  if (!sessions[sessionId]) {
    sessions[sessionId] = { stage: "GREETING", transcript: [], status: "in_progress" };
  }

  const twiml = new twilio.twiml.VoiceResponse();

  // Optional short audible line before streaming starts
  //twiml.say({ voice: "Polly.Joanna" }, "Welcome.");

  const connect = twiml.connect();

 const streamUrl = `${process.env.WSS_URL}/twilio/stream/${encodeURIComponent(sessionId)}`;
  console.log("STREAM URL SENT TO TWILIO:", streamUrl);

  connect.stream({
    url: streamUrl,
    statusCallback: `${process.env.BASE_URL}/twilio-stream-status`,
    statusCallbackMethod: "POST",
  });

  res.type("text/xml").send(twiml.toString());
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

async function ttsToMp3Url(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`;

  const resp = await axios.post(
    url,
    {
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.85,
        style: 0.35,
        use_speaker_boost: true
      } 
    },
    {
      responseType: 'arraybuffer',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  fs.writeFileSync(filePath, resp.data);

  return `${process.env.BASE_URL}/audio/${fileName}`;
}

app.get('/test-tts', async (req, res) => {
  try {
    const audioUrl = await ttsToMp3Url(
      "Testing ElevenLabs. This should sound realistic."
    );
    res.json({ audioUrl });
  } catch (err) {
  console.error("TTS ERROR status:", err.response?.status);
  console.error("TTS ERROR data:", err.response?.data?.toString?.() || err.response?.data || err.message);
  res.status(500).json({
    error: err.message,
    status: err.response?.status,
    data: err.response?.data?.toString?.() || err.response?.data
  });
}
});

function runFfmpeg(inputBuf, args) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];

    ff.stdout.on("data", (d) => out.push(d));
    ff.stderr.on("data", (d) => err.push(d));

    ff.on("close", (code) => {
      if (code === 0) return resolve(Buffer.concat(out));
      reject(new Error(Buffer.concat(err).toString() || `ffmpeg exit ${code}`));
    });

    ff.stdin.end(inputBuf);
  });
}

// Twilio -> Eleven (mulaw 8k -> PCM s16le 16k)
async function mulaw8kB64_to_pcm16kB64(b64) {
  const input = Buffer.from(b64, "base64");
  const output = await runFfmpeg(input, [
    "-hide_banner", "-loglevel", "error",
    "-f", "mulaw", "-ar", "8000", "-ac", "1", "-i", "pipe:0",
    "-f", "s16le", "-ar", "16000", "-ac", "1", "pipe:1",
  ]);
  return output.toString("base64");
}

// Eleven -> Twilio (PCM s16le 16k -> mulaw 8k)
async function pcm16kB64_to_mulaw8kB64(b64) {
  const input = Buffer.from(b64, "base64");
  const output = await runFfmpeg(input, [
    "-hide_banner", "-loglevel", "error",
    "-f", "s16le", "-ar", "16000", "-ac", "1", "-i", "pipe:0",
    "-f", "mulaw", "-ar", "8000", "-ac", "1", "pipe:1",
  ]);
  return output.toString("base64");
}

async function devCallHandler(req, res){
  console.log("=== HIT /dev-call ===", req.body);

  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });

  const sessionId = uuidv4();
  sessions[sessionId] = {
    phoneNumber,
    stage: "GREETING",
    transcript: [],
    status: "in_progress",
    scenarioId: "default",
    //agentId: process.env.ELEVEN_AGENT_ID_DEFAULT,
    score: null,
  };

  try {
    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${process.env.BASE_URL}/voice?sessionId=${sessionId}`,
      method: "POST",
    });

    console.log("✅ call created:", call.sid);
    return res.json({ ok: true, sessionId, callSid: call.sid });
  } catch (err) {
    // Twilio SDK puts useful stuff on err.status + err.moreInfo + err.code
    console.error("❌ Twilio call create failed");
    console.error("status:", err.status);
    console.error("code:", err.code);
    console.error("message:", err.message);
    console.error("moreInfo:", err.moreInfo);
    console.error("details:", err.details);

    return res.status(500).json({
      error: err.message,
      status: err.status,
      code: err.code,
      moreInfo: err.moreInfo,
      details: err.details,
    });
  }
}

async function sendCodeHandler(req, res) {
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
}

async function verifyCodeHandler(req, res) {
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
        transcript: [],
        status: "in_progress",
        scenarioId: "default",
        //agentId: process.env.ELEVEN_AGENT_ID_DEFAULT,
        score: null,
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
}

// existing routes
app.post('/dev-call', devCallHandler);
app.post('/send-code', sendCodeHandler);
app.post('/verify-code', verifyCodeHandler);

// new /api aliases (this is the fix)
app.post('/api/dev-call', devCallHandler);
app.post('/api/send-code', sendCodeHandler);
app.post('/api/verify-code', verifyCodeHandler);

// ✅ match frontend: POST /api/sessions/start
// scenario -> agent mapping
const SCENARIO_TO_AGENT = {
  social_security: process.env.ELEVEN_AGENT_ID_SOCIAL,
  tech_support: process.env.ELEVEN_AGENT_ID_TECH,
  lottery_giveaway: process.env.ELEVEN_AGENT_ID_LOTTERY,
};

const SCAM_LABELS = {
  social_security: 'Social Security Suspension',
  tech_support: 'Apple Tech Support',
  lottery_giveaway: 'Lottery / Giveaway',
};

app.post("/api/sessions/start", async (req, res) => {
  try {
    const phoneNumber = (req.body.phoneNumber || "").trim();
    const scenarioId = (req.body.scenarioId || "").trim();

    if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });
    if (!scenarioId) return res.status(400).json({ error: "scenarioId required" });

    const sessionId = uuidv4();

    const agentId =
      SCENARIO_TO_AGENT[scenarioId] || process.env.ELEVEN_AGENT_ID_DEFAULT;

    if (!agentId) {
      return res.status(500).json({ error: "Missing agentId for scenario (check .env)" });
    }

    sessions[sessionId] = {
      phoneNumber,
      scenarioId,
      agentId,
      stage: "GREETING",
      transcript: [],
      status: "in_progress",
      score: null,
    };

    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${process.env.BASE_URL}/voice?sessionId=${sessionId}`,
      method: "POST",
    });

    console.log("✅ call created:", call.sid, "scenario:", scenarioId, "agent:", agentId);

    res.json({ sessionId });
  } catch (err) {
    console.error("❌ /api/sessions/start failed:", err?.message || err);
    res.status(500).json({ error: err?.message || "Failed to start session" });
  }
});

// ✅ match frontend: GET /api/sessions/:sessionId
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const s = sessions[sessionId]
  if (!s) return res.status(404).json({ error: 'Session not found' })

  res.json({
    sessionId,
    scenarioId: s.scenarioId || 'default',
    transcript: s.transcript || [],
    score: s.score ?? null,        // ✅ null until scored; object after scoring
    status: s.status ?? 'in_progress',
  })
})

app.post('/api/sessions/:sessionId/score', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];

  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (!session.transcript || session.transcript.length === 0) {
    return res.status(400).json({ error: 'No transcript available yet' });
  }

  // If already scored, return cached result
  if (session.score) return res.json(session.score);

  const label = SCAM_LABELS[session.scenarioId] || 'Unknown';
  const transcriptText = session.transcript.join('\n');

  try {
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are the FraudGuard safety scorer. Analyze ONLY the test subject labeled "You:".

Score starts at 100. Deduct points for:
- Sharing personal info
- Blind compliance
- Agreeing to send money
- Sharing codes/passwords

Add points (max +15) for:
- Questioning the caller
- Refusing to share info
- Saying you'll call official number
- Hanging up early

If critical info was shared, cap at 39.

Return ONLY valid JSON:
{
  "score": 0,
  "tier": "",
  "explanation": ""
}`,
          },
          {
            role: 'user',
            content: `Scenario: ${label}\n\nTranscript:\n${transcriptText}`,
          },
        ],
        temperature: 0.1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    let raw = groqResponse.data?.choices?.[0]?.message?.content || '';
    raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
      if (typeof result.score !== 'number' || !result.tier || !result.explanation) {
        console.error("Scorer JSON missing fields:", result);
        return res.status(502).json({ error: "Malformed JSON from scorer" });
      }
    } catch (e) {
      console.error("Groq returned invalid JSON:", raw);
      return res.status(502).json({ error: "Invalid JSON from scorer" });
    }

    session.score = result;

    broadcastToBrowsers(sessionId, { type: "score", score: result });

    return res.json(result);

  } catch (err) {
    console.error("Scoring error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);

// WebSocket servers (noServer so we can route upgrades ourselves)
const wssTwilio = new WebSocket.Server({ noServer: true, perMessageDeflate: false });
const wssBrowser = new WebSocket.Server({ noServer: true, perMessageDeflate: false });

// Route HTTP -> WS upgrades by path
server.on("upgrade", (req, socket, head) => {
  const pathname = (req.url || "").split("?")[0];

  if (pathname.startsWith("/twilio/stream")) {
    wssTwilio.handleUpgrade(req, socket, head, (ws) => {
      wssTwilio.emit("connection", ws, req);
    });
    return;
  }

  if (pathname === "/ws/transcript") {
    wssBrowser.handleUpgrade(req, socket, head, (ws) => {
      wssBrowser.emit("connection", ws, req);
    });
    return;
  }

  // Unknown WS route
  socket.destroy();
});

// sessionId -> Set of browser sockets
const browserClients = new Map();

function addBrowserClient(sessionId, ws) {
  if (!browserClients.has(sessionId)) browserClients.set(sessionId, new Set());
  browserClients.get(sessionId).add(ws);
}

function removeBrowserClient(sessionId, ws) {
  const set = browserClients.get(sessionId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) browserClients.delete(sessionId);
}

function broadcastToBrowsers(sessionId, payload) {
  const set = browserClients.get(sessionId);
  if (!set) return;
  const msg = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

wssBrowser.on("connection", (ws, req) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = u.searchParams.get("sessionId");

  if (!sessionId) {
    ws.close(1008, "missing sessionId");
    return;
  }

  console.log("✅ Browser WS connected:", sessionId);
  addBrowserClient(sessionId, ws);

  // optional: send existing transcript immediately
  const s = sessions[sessionId];
  if (s?.transcript?.length) {
    ws.send(JSON.stringify({ type: "bulk_transcript", lines: s.transcript }));
  }

  ws.on("close", () => {
    console.log("❌ Browser WS disconnected:", sessionId);
    removeBrowserClient(sessionId, ws);
  });
});

wssTwilio.on("connection", (twilioWs, req) => {
  console.log("RAW Twilio WS req.url:", req.url);

// accept only /twilio/stream/<sessionId>
const m = /^\/twilio\/stream\/([^/?#]+)/.exec(req.url || "");
const sessionId = m ? decodeURIComponent(m[1]) : null;

if (!sessionId) {
  console.log("❌ Missing sessionId in path; closing");
  twilioWs.close();
  return;
}

console.log("✅ Twilio stream sessionId:", sessionId);

  let streamSid = null;
  let elevenWs = null;

  console.log("ELEVEN_AGENT_ID present?", !!process.env.ELEVEN_AGENT_ID, "value:", process.env.ELEVEN_AGENT_ID);
  console.log("ELEVEN_API_KEY present?", !!process.env.ELEVENLABS_API_KEY, "len:", (process.env.ELEVENLABS_API_KEY || "").length);
  console.log("➡️ About to fetch Eleven signed URL...");

 // ---- helpers ----
function parsePcmRate(fmt) {
  // expected like "pcm_16000" or "pcm_44100"
  const m = /^pcm_(\d+)$/.exec(fmt || "");
  return m ? parseInt(m[1], 10) : null;
}

let ffIn = null;   // Twilio mulaw8k -> Eleven PCM
let ffOut = null;  // Eleven PCM -> Twilio mulaw8k

let pcmChunkBytes = 3200; // will update from metadata (100ms)

// Buffer Twilio audio until ffIn exists
let twilioMulawQueue = Buffer.alloc(0);

function startTranscoders({ elevenInRate, elevenOutRate }) {
  // ---- Twilio -> Eleven ----
  ffIn = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "mulaw", "-ar", "8000", "-ac", "1", "-i", "pipe:0",
    "-f", "s16le", "-ar", String(elevenInRate), "-ac", "1", "pipe:1"
  ], { stdio: ["pipe", "pipe", "pipe"] });

  ffIn.stderr.on("data", (d) => console.log("ffmpeg(in) stderr:", d.toString()));

  let pcmBuf = Buffer.alloc(0);

  // 100ms chunks -> bytes = rate * 0.1s * 2 bytes/sample
  pcmChunkBytes = Math.round(elevenInRate * 0.1 * 2);

  ffIn.stdout.on("data", (chunk) => {
    pcmBuf = Buffer.concat([pcmBuf, chunk]);

    while (pcmBuf.length >= pcmChunkBytes) {
      const piece = pcmBuf.subarray(0, pcmChunkBytes);
      pcmBuf = pcmBuf.subarray(pcmChunkBytes);

      if (elevenWs && elevenWs.readyState === WebSocket.OPEN) {
        elevenWs.send(JSON.stringify({ user_audio_chunk: piece.toString("base64") }));
      }
    }
  });

  // Flush any queued Twilio audio we got before init
  if (twilioMulawQueue.length) {
    ffIn.stdin.write(twilioMulawQueue);
    twilioMulawQueue = Buffer.alloc(0);
  }

  // ---- Eleven -> Twilio ----
  ffOut = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "s16le", "-ar", String(elevenOutRate), "-ac", "1", "-i", "pipe:0",
    "-f", "mulaw", "-ar", "8000", "-ac", "1", "pipe:1"
  ], { stdio: ["pipe", "pipe", "pipe"] });

  ffOut.stderr.on("data", (d) => console.log("ffmpeg(out) stderr:", d.toString()));

  let outBuf = Buffer.alloc(0);

  ffOut.stdout.on("data", (chunk) => {
    outBuf = Buffer.concat([outBuf, chunk]);

    // Twilio plays buffered mulaw; 20ms @ 8k = 160 bytes (good practice to frame)
    while (outBuf.length >= 160) {
      const frame = outBuf.subarray(0, 160);
      outBuf = outBuf.subarray(160);

      if (streamSid && twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(
          JSON.stringify({
            event: "media",
            streamSid,
            media: { payload: frame.toString("base64") }
          }),
          { compress: false }
        );
      }
    }
  });

  console.log("✅ Transcoders started:", { elevenInRate, elevenOutRate, pcmChunkBytes });
}

  // --- Twilio message handler ---
  twilioWs.on("message", (data) => {
  let msg;
  try { msg = JSON.parse(data.toString()); } catch { return; }

  // DEBUG: log first few events so we know exactly what Twilio is sending
  if (!twilioWs._seen) twilioWs._seen = 0;
  if (twilioWs._seen < 15) {
    twilioWs._seen++;
    console.log("TWILIO EVENT:", msg.event, Object.keys(msg));
  }

  if (msg.event === "start") {
    streamSid = msg.start?.streamSid;
    const callSid = msg.start?.callSid; // ✅ use this as key
  }

  if (msg.event === "media") {
  const mulawBytes = Buffer.from(msg.media.payload, "base64");

  if (ffIn?.stdin?.writable) {
    ffIn.stdin.write(mulawBytes);
  } else {
    // Eleven metadata not received yet; buffer a bit
    twilioMulawQueue = Buffer.concat([twilioMulawQueue, mulawBytes]);

    // optional safety cap (2 seconds of mulaw = 8000 bytes/sec)
    const cap = 16000;
    if (twilioMulawQueue.length > cap) {
      twilioMulawQueue = twilioMulawQueue.subarray(twilioMulawQueue.length - cap);
    }
  }
  return;
}

  if (msg.event === "stop") {
  console.log("🛑 stop payload:", msg.stop);
  console.log("⏹ Twilio stop");

  // Mark session ended + tell browser UIs
  if (sessionId) {
    if (!sessions[sessionId]) {
      sessions[sessionId] = { stage: "GREETING", transcript: [], status: "ended" };
    } else {
      sessions[sessionId].status = "ended";
    }
    broadcastToBrowsers(sessionId, { type: "ended" });
    // ✅ Auto-trigger scoring AFTER call ends (non-blocking)
setTimeout(() => {
  const s = sessions[sessionId];
  if (!s) return;
  if (s.score) return; // already scored
  if (!s.transcript || s.transcript.length === 0) return; // nothing to score yet

  axios
    .post(`${process.env.BASE_URL}/api/sessions/${sessionId}/score`)
    .catch((e) => console.log("auto-score failed:", e.message));
}, 1200);
  }

  // Shut down transcoding pipelines
  try { ffIn?.stdin?.end(); } catch {}
  try { ffOut?.stdin?.end(); } catch {}
  try { ffIn?.kill("SIGKILL"); } catch {}
  try { ffOut?.kill("SIGKILL"); } catch {}

  return;
}
});

  twilioWs.on("close", () => {
    console.log("❌ Twilio WS disconnected");
    try { elevenWs?.close(); } catch {}
    try { ffIn?.stdin?.end(); } catch {}
    try { ffOut?.stdin?.end(); } catch {}
    try { ffIn?.kill("SIGKILL"); } catch {}
    try { ffOut?.kill("SIGKILL"); } catch {}
  });

  // --- Connect to Eleven ---
  (async () => {
  try {

    const agentId = sessions[sessionId]?.agentId || process.env.ELEVEN_AGENT_ID_DEFAULT;
      console.log("🎭 Using agent for session:", sessionId, agentId);

      const signedUrl = await getElevenSignedUrl(agentId);
    console.log("✅ Got signed URL:", signedUrl.slice(0, 60), "...");

    elevenWs = new WebSocket(signedUrl);

    elevenWs.on("open", () => {
      console.log("✅ Eleven WS connected");
      elevenWs.send(JSON.stringify({
        type: "conversation_initiation_client_data",
        conversation_config_override: {
          agent: {
            language: "en"
          }
        }
      }));
      console.log("✅ Sent Eleven initiation payload");

    });

    elevenWs.on("message", (raw) => {
      let evt;
      try { evt = JSON.parse(raw.toString()); } catch { return; }

      console.log("ELEVEN EVENT:", evt.type);

      if (evt.type === "ping") {
        const id = evt.ping_event?.event_id;
        if (id != null) elevenWs.send(JSON.stringify({ type: "pong", event_id: id }));
        return;
      }

      if (evt.type === "conversation_initiation_metadata") {
        const meta = evt.conversation_initiation_metadata_event;
        const elevenInRate = parsePcmRate(meta?.user_input_audio_format) || 16000;
        const elevenOutRate = parsePcmRate(meta?.agent_output_audio_format) || 16000;

        console.log("Eleven formats:", {
          inFmt: meta?.user_input_audio_format,
          outFmt: meta?.agent_output_audio_format
          });

        // Start/replace transcoders now that we know real formats
        try { ffIn?.kill("SIGKILL"); } catch {}
        try { ffOut?.kill("SIGKILL"); } catch {}
        startTranscoders({ elevenInRate, elevenOutRate });
        return;
      }

      if (evt.type === "user_transcript") {
        const text = evt.user_transcription_event?.user_transcript;
        if (text && sessionId) {
          const line = `You: ${text}`;
          sessions[sessionId].transcript.push(line);
          broadcastToBrowsers(sessionId, { type: "transcript", line });
        }
        return;
      }

      if (evt.type === "agent_response") {
        const text = evt.agent_response_event?.agent_response;
        if (text && sessionId) {
          const line = `Caller: ${text}`;
          sessions[sessionId].transcript.push(line);
          broadcastToBrowsers(sessionId, { type: "transcript", line });
        }
        return;
      }

      if (evt.type === "interruption") {
        if (streamSid && twilioWs.readyState === WebSocket.OPEN) {
          twilioWs.send(
            JSON.stringify({ event: "clear", streamSid }),
            { compress: false }
          );
        }
        return;
      }

      if (evt.type === "audio") {
        const b64 = evt.audio_event?.audio_base_64;
        if (!b64) return;

        const pcm = Buffer.from(b64, "base64");

        if (ffOut?.stdin?.writable) {
          ffOut.stdin.write(pcm);
        } else {
          console.log("⚠️ got Eleven audio before ffOut ready; dropping");
        }
        return;
      }
    });

    elevenWs.on("close", (code, reason) => {
      console.log("❌ Eleven WS disconnected", { code, reason: reason?.toString?.() });
    });

    elevenWs.on("error", (e) => {
      console.log("❌ Eleven WS error:", e.message);
    });
  } catch (err) {
    console.log("❌ Eleven connect failed:", err.response?.status, err.response?.data || err.message);
  }
})();
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});