#!/usr/bin/env bash
# Peak-limit the audio of rendered videos (video stream is copied untouched).
#   scripts/master.sh out/idempotency.mp4 [more.mp4 ...]
set -euo pipefail
for f in "$@"; do
  tmp="${f%.mp4}.mastered.mp4"
  ffmpeg -v error -y -i "$f" -c:v copy -af "alimiter=limit=0.89:level=false" -c:a aac -b:a 192k "$tmp"
  mv "$tmp" "$f"
  echo "mastered $f"
done
