#!/usr/bin/env bash
# Voice -> render (one retry) -> master audio -> contact sheet:  scripts/build-short.sh <topic>
set -u
cd "$(dirname "$0")/.."
topic=$1
npm run voice -- "$topic" 2>&1 | tail -12
ok=0
for try in 1 2; do
  out=$(npm run render -- "$topic" 2>&1 || true)
  if echo "$out" | grep -q '^Rendered'; then ok=1; break; fi
  echo "render attempt $try failed"; echo "$out" | grep -iE 'error' | head -3
done
[ "$ok" = 1 ] || { echo "RENDER FAILED"; exit 1; }
./scripts/master.sh "out/$topic.mp4"
python3 scripts/contact-sheet.py "$topic"
