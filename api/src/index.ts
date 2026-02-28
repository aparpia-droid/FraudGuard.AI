/**
 * FraudGuard API — Express server with CORS, session routes, Twilio placeholder, WebSocket.
 * Port from env (default 8080). Load env via dotenv.
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import sessionsRouter from './routes/sessions.js'
import twilioRouter from './routes/twilio.js'
import { handleWsConnection } from './routes/ws.js'

const PORT = Number(process.env.PORT) || 8080
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: WEB_ORIGIN }))
app.use(express.json())

app.use('/api/sessions', sessionsRouter)
app.use('/api/twilio', twilioRouter)

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (ws, req) => {
  handleWsConnection(ws, req.url ?? '')
})

server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
  console.log(`WebSocket on ws://localhost:${PORT}/ws`)
})
