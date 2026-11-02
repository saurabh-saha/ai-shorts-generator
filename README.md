# AI Shorts Generator

Programmatic 1080x1920 (YouTube Shorts) explainers, narrated and animated from a JSON script. The first series covers system design (rate limiter, load balancer, caching, message queue, DB sharding, consistent hashing, CDN, API gateway, circuit breaker, idempotency). Built with [Revideo](https://github.com/redotvideo/revideo) (open source).

```bash
npm install
npm run dev        # live preview editor
npm run render     # -> out/rate-limiter.mp4
```

## Layout
- `data/<topic>.json`: the script. Each beat has `id`, `text` (caption) and `duration` (seconds). Set `audio` to e.g. `/audio/rate-limiter.wav` once you've recorded your voice (file goes in `public/audio/`).
- `src/scenes/<topic>.tsx`: one function per beat id, so animation is keyed to the script.
- `src/components/`: reusable parts (`StickFigure`). Add Server, Queue, Cache, etc. here.
- `src/theme.ts`: shared colors, so every video matches.
- `scripts/align.py`: Whisper word timestamps from your recording.

## New topic
1. Copy `data/rate-limiter.json` and `src/scenes/rate-limiter.tsx`, rename, edit beats.
2. Register the scene in `src/project.ts`.
3. `npm run render -- <topic>`
