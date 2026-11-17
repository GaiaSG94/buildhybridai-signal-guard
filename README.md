# Signal Guard

Your inbox, scored on the phone.

Signal Guard runs a **fictional demo inbox** where every message gets a risk
score **on the device** (Gemini Nano through the ML Kit Prompt API, wired via
Firebase AI Logic) — no network, no message leaving the phone. Only the
messages flagged as clearly dangerous are sent to the **cloud model**, which
explains the red flags and suggests a reply.

Every row shows where the inference ran (`⚡ LOCAL` for the score, `☁ CLOUD`
for the explanation), the latency and the risk level.

## Why it matters

Sending your private messages to a cloud filter to detect scams is a privacy
paradox. Signal Guard puts the cheap first pass (a risk score) on the device
and pays for the cloud only when a human explanation is worth it.

## How Firebase AI Logic is used

- `FirebaseAI.getInstance(backend = GenerativeBackend.googleAI())` — Firebase
  AI Logic client SDK (`com.google.firebase:firebase-ai`), Gemini Developer
  API backend (free tier, no billing account).
- Two model instances (`engine/SignalEngine.kt`):
  - `OnDeviceConfig(mode = InferenceMode.ONLY_ON_DEVICE)` — the local risk
    score (answers `RISK:` / `TYPE:`);
  - `OnDeviceConfig(mode = InferenceMode.ONLY_IN_CLOUD)` — the explanation
    pass (answers `WHY:` / `REPLY:`), only for scores ≥ 70.
- `firebase-ai-ondevice` brings the Prompt API from ML Kit (AICore).
- App Check protects every cloud call (debug provider in debug builds).

## Build and run

```bash
cp <your project>/google-services.json app/google-services.json
./gradlew assembleDebug      # APK in app/build/outputs/apk/debug/
./gradlew testDebugUnitTest  # unit tests
```

`google-services.json` is git-ignored: the Google Services Gradle plugin is
only applied when the file exists, so the repo builds and the tests run
without a Firebase project.

## On-device requirements

- Android 8.0 (API 26)+, foreground only, single-turn text (≤ 4000 tokens);
  only English and Korean have been validated for on-device inference.
- Device from the [supported Prompt API list](https://developers.google.com/ml-kit/genai#prompt-device);
  otherwise the local score falls back and the status line says so.

## Demo script (3 minutes)

1. Launch the app: four fictional messages, nothing scored yet.
2. Press **Score the inbox**: gauges fill in, each row shows `⚡ LOCAL` with
   the latency; the status line counts the flagged messages.
3. The phishing and spoofed-bank rows show `☁ CLOUD` with the red-flag
   explanation and a suggested reply.
4. Show that the two benign rows never left the device (`⚡ LOCAL` only).

## Limitations

- On-device inference is experimental in the Firebase AI Logic SDK (no SLA).
- The demo inbox is fictional and hard-coded on purpose (no real SMS, no PII).
- The risk score is an estimate from the model, shown as such.

## Built with

Kotlin, Android (Views, Material 3), Firebase AI Logic (on-device + cloud),
ML Kit Prompt API, Gradle, JUnit.
