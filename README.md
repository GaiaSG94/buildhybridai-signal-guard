# Signal Guard

Suspicious messages, explained in plain words — and only the suspicious ones
ever leave your device.

Signal Guard is a web app built on **Firebase AI Logic hybrid inference**. Every
message is scored **on the device** (Gemini Nano through the Chrome Prompt API)
with a short, strict prompt. Only when the local score crosses **70/100** does
the message go up to the cloud model, which explains the trick and writes a calm
reply the user can forward to a worried relative.

## Why it matters

Scam messages mostly reach people who are less able to judge them. Two things go
wrong with the usual advice: it is too generic ("be careful"), and the tools that
could help send everything to a server. Signal Guard keeps the first pass local —
so the inbox never leaves the machine — and spends cloud inference only on the
messages that were already flagged. The reply is written to be forwarded as-is:
plain language, no jargon, no app to install.

## How Firebase AI Logic is used

- `getAI(app, { backend: new GoogleAIBackend() })` — Firebase AI Logic is
  initialised at runtime (`src/firebase.ts`) on the **Gemini Developer API free
  tier** (Spark plan, no payment method). `AgentPlatformBackend` (ex-Vertex AI)
  is supported by the code but requires a Blaze billing account, so it is not the
  default.
- `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, onDeviceParams,
  inCloudParams })` — **hybrid inference** for scoring (`src/models.ts`): the SDK
  prefers Gemini Nano and falls back to the cloud model when the device cannot
  run it. `response.inferenceSource` drives the LOCAL / CLOUD badge, so the UI
  never lies about where a given message was scored.
- `getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD })` — the
  explanation pass, called **only** for a flagged message (`src/engine.ts`).
- `initializeAppCheck(...)` — App Check protects every cloud call
  (`src/firebase.ts`), with the debug provider for local development.

## Quickstart

```bash
npm ci
cp .env.example .env.local   # fill with your Firebase project values
npm run dev
```

Environment variables are documented in `.env.example`. Never commit real values.
For local development set `VITE_APPCHECK_DEBUG=1` so App Check uses the debug
provider. The app needs Chrome 139+ with the built-in model available
(`chrome://on-device-internals`) to score locally; without it the SDK falls back
to the cloud and the badge shows `CLOUD`.

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Unit tests (vitest) for the parsers, the metrics and the signal detection |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve the production build |

## Architecture

```
src/
  core/inbox.ts     the fictional inbox (never a real SMS)
  core/parse.ts     pure parsers: RISK/TYPE, WHY/REPLY, levels, escalation
  core/prompts.ts   the two prompts (short local pass, cloud explanation)
  core/signals.ts   deterministic markers underlined in the UI
  core/metrics.ts   medians and local share, computed from real runs
  core/types.ts     shared types
  firebase.ts       Firebase + App Check + Firebase AI Logic bootstrap
  models.ts         hybrid scorer (prefer on-device) + cloud explainer
  engine.ts         score -> escalate if >= 70 -> explain
  ui/               Relief design system: room, relief numbers, plates, sheets
tests/              vitest unit tests (no network)
```

The visual language is the locked **Relief** design (`G-DESIGN/STYLE.md`,
planches `G-DESIGN/planches/relief/`): a white room lit from the ceiling, scores
sculpted on the wall, plates on the floor. Colour is data — the orange
`#ee4f24` only appears for a score ≥ 70 or for a trip to the cloud. Fonts are
embedded (OFL), so the rendering is identical offline.

## Demo script (3 minutes)

1. Press **Score the inbox**: four fictional messages are scored **on the
   device**. The relief numbers fill in, the audit line counts local analyses
   versus cloud calls.
2. Two messages cross 70: their plates get a circle, an arrow up and a note
   (`up to the cloud · 1.38 s · explained`). The other two get a grey tick and
   `stayed here`.
3. Open a flagged plate: the local score, the flagged fragments, the cloud
   explanation and a reply written to be forwarded to a relative. **Copy the
   reply**.
4. Open **Paste a message**, paste a real scam you received: it is scored on the
   device, and only escalates if it deserves it.
5. Point at the audit line: `4 local analyses · 2 cloud calls · 50% stayed on
   device` — measured, not estimated.

## Measurements

The numbers quoted in the demo come from the audit line, which is computed from
the actual runs (`src/core/metrics.ts`): median local latency, median cloud
latency, number of local analyses, number of cloud calls and the share of
messages that never left the device. Nothing is hard-coded.

## Limitations

- The on-device model requires a Chromium browser with the built-in model
  available; otherwise the SDK falls back to the cloud and the badge says so.
- The inbox is fictional and hard-coded on purpose: the app never reads a real
  SMS inbox, so no personal data can reach a model by accident.
- The risk score is an estimate from a small model, shown as such. It is a second
  opinion, not a verdict.
- The suggested reply is generated text: the user is expected to read it before
  forwarding it.

## Built with

TypeScript, Vite, vitest, Firebase (AI Logic, App Check).
