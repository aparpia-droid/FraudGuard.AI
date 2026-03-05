#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
ORIGIN="http://127.0.0.1:${PORT}"

echo "Starting cloudflared tunnel to ${ORIGIN}..."
# Start cloudflared in background and capture logs
LOG="$(mktemp)"
cloudflared tunnel --url "${ORIGIN}" --protocol http2 > "${LOG}" 2>&1 &
CF_PID=$!

cleanup() {
  echo ""
  echo "Stopping cloudflared (pid ${CF_PID})..."
  kill "${CF_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Waiting for tunnel URL..."
# Wait until the URL appears
for i in {1..60}; do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "${LOG}" | tail -n 1 || true)"
  if [[ -n "${URL}" ]]; then
    break
  fi
  sleep 0.25
done

if [[ -z "${URL}" ]]; then
  echo "ERROR: Could not find tunnel URL. cloudflared output:"
  tail -n 200 "${LOG}"
  exit 1
fi

HOST="${URL#https://}"
export BASE_URL="${URL}"
export WSS_URL="wss://${HOST}"
export PORT="${PORT}"

echo "✅ Tunnel URL: ${BASE_URL}"
echo "✅ WSS URL:    ${WSS_URL}"
echo ""
echo "Starting backend..."
node server.js