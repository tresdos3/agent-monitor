#!/usr/bin/env bash
# Hybrid LAB verifier: static checks + fixture baseline + API assertions + best-effort TUI harness.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE="$ROOT/agent-monitor-fixtures"
SESSION="agent-monitor-lab-$$"
PASS=0
FAIL=0
WARN=0

ok()   { echo "PASS: $1"; PASS=$((PASS + 1)); }
bad()  { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "WARN: $1"; WARN=$((WARN + 1)); }

cleanup() { tmux kill-session -t "$SESSION" 2>/dev/null || true; }
trap cleanup EXIT

echo "=== Agent Monitor LAB verifier ==="
echo "root:    $ROOT"
echo "fixture: $FIXTURE"

# --- toolchain ---
echo
echo "--- toolchain ---"
NODE_VERSION="$(node --version)"
OC_VERSION="$(opencode --version)"
echo "node: $NODE_VERSION"
echo "host: $OC_VERSION"
if node -e 'process.exit(parseInt(process.versions.node) >= 26 ? 0 : 1)'; then ok "node >= 26"; else bad "node >= 26 required"; fi
if [[ "$OC_VERSION" == *"2.4.1"* ]]; then ok "host v2.4.1"; else warn "host version differs: $OC_VERSION"; fi

# --- static config ---
echo
echo "--- static config ---"
if [[ -f "$FIXTURE/.opencode/opencode.json" ]]; then ok "fixture project config exists"; else bad "fixture project config missing"; fi
AGENT_COUNT="$(find "$FIXTURE/.opencode/agents" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$AGENT_COUNT" == "5" ]]; then ok "five agent definitions present"; else bad "expected five agent definitions, found $AGENT_COUNT"; fi
if command -v jq >/dev/null && jq -e . "$FIXTURE/.opencode/opencode.json" >/dev/null 2>&1; then ok "fixture config is valid JSON"; else warn "jq unavailable or config JSON invalid"; fi
if grep -q '"plugins": \["\.\./\.\./"\]' "$FIXTURE/.opencode/opencode.json"; then ok "fixture uses relative plugin path"; else warn "fixture plugin path is not ../../"; fi

# --- fixture baseline ---
echo
echo "--- fixture baseline ---"
FIXTURE_TEST="$(cd "$FIXTURE" && npm test 2>&1)"
if echo "$FIXTURE_TEST" | grep -q "1 failed"; then ok "fixture npm test has intentional failure"; else bad "fixture npm test missing expected failure"; fi
if echo "$FIXTURE_TEST" | grep -q "3 passed"; then ok "fixture npm test has 3 passing tests"; else warn "fixture passing count differs from 3"; fi
PASS_ONLY="$(cd "$FIXTURE" && npm run test:pass 2>&1)"
if echo "$PASS_ONLY" | grep -q "2 passed"; then ok "fixture test:pass works"; else bad "fixture test:pass did not pass"; fi

# --- fixture git state ---
echo
echo "--- fixture git state ---"
GIT_STATUS="$(cd "$FIXTURE" && git status --short 2>/dev/null || true)"
for pattern in "^ D docs/old-notes.md" "^ M src/api.ts" "?? src/generated.ts"; do
  if echo "$GIT_STATUS" | grep -q "$pattern"; then ok "fixture git state: $pattern"; else warn "fixture git state missing: $pattern"; fi
done

# --- API assertions ---
echo
echo "--- API assertions ---"
SESSION_JSON="$(cd "$FIXTURE" && opencode api get "/api/session?directory=$FIXTURE&limit=100" 2>/dev/null || true)"
if [[ -n "$SESSION_JSON" ]] && command -v jq >/dev/null; then
  ROOTS="$(echo "$SESSION_JSON" | jq -r '[.data[] | select(has("parentID") | not)] | length' 2>/dev/null || echo 0)"
  CHILDREN="$(echo "$SESSION_JSON" | jq -r '[.data[] | select(has("parentID"))] | length' 2>/dev/null || echo 0)"
  if [[ "$CHILDREN" -gt 0 ]]; then ok "API reports child sessions ($CHILDREN)"; else warn "no child sessions in API yet"; fi
  if [[ "$ROOTS" -gt 0 ]]; then ok "API reports root sessions ($ROOTS)"; else warn "no sessions in API yet"; fi
  OUTCOMES="$(echo "$SESSION_JSON" | jq -r '[.data[] | .outcome] | unique | join(",")' 2>/dev/null || echo '')"
  echo "observed outcomes: ${OUTCOMES:-none}"
else
  warn "could not query API or jq unavailable"
fi

# --- TUI harness (best effort) ---
echo
echo "--- TUI harness ---"
if command -v tmux >/dev/null; then
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  tmux new-session -d -s "$SESSION" -x 140 -y 44 "cd '$FIXTURE' && opencode"
  sleep 8
  CAP="$(tmux capture-pane -p -t "$SESSION" 2>/dev/null || true)"
  if echo "$CAP" | grep -qiE "agent monitor|MONITOR [0-9]"; then ok "TUI status/sidebar rendered"; else warn "TUI status/sidebar not detected in pane capture"; fi

  tmux send-keys -t "$SESSION" C-g
  sleep 2
  CAP="$(tmux capture-pane -p -t "$SESSION" 2>/dev/null || true)"
  if echo "$CAP" | grep -q "AGENT MONITOR"; then ok "TUI panel opened with Ctrl+G"; else warn "TUI panel not detected after Ctrl+G"; fi

  for key in 1 2 3 4; do
    tmux send-keys -t "$SESSION" "$key"
    sleep 2
    CAP="$(tmux capture-pane -p -t "$SESSION" 2>/dev/null || true)"
    case "$key" in
      1) NEEDLE="AGENTS" ;;
      2) NEEDLE="TIMELINE" ;;
      3) NEEDLE="VERIFICATION SUMMARY" ;;
      4) NEEDLE="TOKEN METRICS" ;;
    esac
    if echo "$CAP" | grep -qi "$NEEDLE"; then ok "TUI tab $key shows $NEEDLE"; else warn "TUI tab $key did not show $NEEDLE"; fi
  done

  tmux send-keys -t "$SESSION" Escape
  sleep 1
  echo
  echo "TUI PANE SNAPSHOT (last captured view):"
  echo "----------------------------------------"
  tmux capture-pane -p -t "$SESSION" 2>/dev/null | tail -30 || true
  echo "----------------------------------------"
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  ok "TUI harness completed (text-level only)"
else
  warn "tmux unavailable — skipped TUI harness"
fi

echo
echo "--- MANUAL STEPS REQUIRED ---"
echo "1. cd '$FIXTURE' && opencode"
echo "2. Run delegation prompt from agent-monitor-fixtures/TEST_LAB.md scenario 1."
echo "3. Ctrl+G and visually verify colors and state transitions."
echo "4. Run scenario 2 and decide the permission prompt yourself (no auto-approve)."
echo "5. If completed agents stay green, record it in docs/BUG-agent-state-stale.md."

echo
echo "=== SUMMARY: $PASS passed, $FAIL failed, $WARN warnings ==="
[[ "$FAIL" -gt 0 ]] && exit 1
exit 0
