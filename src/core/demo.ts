import { InferenceSource } from 'firebase/ai';
import type { EngineModels, ModelLike } from '../engine';
/**
 * Deterministic offline engine used by `?demo=1` (captures, screenshots).
 * Same output contract as the real models: RISK/TYPE then WHY/REPLY lines.
 * No network, no Firebase; the scores are fictional, like the inbox itself.
 */
const DEMO_SCORES: Record<string, { risk: number; type: string }> = {
  m1: { risk: 92, type: 'phishing' },
  m2: { risk: 14, type: 'legit' },
  m3: { risk: 78, type: 'scam' },
  m4: { risk: 3, type: 'legit' },
};

const DEMO_EXPLANATIONS: Record<string, { why: string; reply: string }> = {
  m1: {
    why:
      'It rushes you: "URGENT" and a threat to cut your access leave no time to check. It asks for money now, 49 EUR through a link instead of your usual payment method. The link is not your provider: secure-verif1.xyz borrows familiar words and pads them with a 1.',
    reply:
      'I will not pay through a link sent by text. I will check my account directly with my provider, using the number on my card.',
  },
  m3: {
    why:
      'It pushes you to call a number to "cancel" a beneficiary you never added. A real bank never asks you to react to a new beneficiary by calling a number from the same text.',
    reply:
      'I will not call the number in this text. If I have any doubt about my account, I will call my bank using the official number.',
  },
};

const bodyOf = (request: string): string =>
  (request.split('MESSAGE:')[1] ?? '').trim();

const idOf = (request: string): string | null => {
  const body = bodyOf(request);
  return Object.keys(DEMO_SCORES).find((id) => DEMO_BODY[id] === body) ?? null;
};

const DEMO_BODY: Record<string, string> = {
  m1: 'URGENT: your account is suspended. Pay 49 EUR now at secure-verif1.xyz to keep access.',
  m2: 'Invoice 2026-118 is ready, the amount is unchanged. Can you confirm receipt before Friday?',
  m3: 'Dear client, a new beneficiary has been added to your account. Call +33 1 44 55 66 77 to cancel.',
  m4: 'The canteen menu for Thursday is posted in the usual place. See you there!',
};

/** Any text the canned inbox does not cover: deterministic score, local rules. */
const demoScore = (request: string): { risk: number; type: string } => {
  const body = bodyOf(request);
  let risk = 5;
  if (/\bURGENT\b|\bsuspended\b|\bblocked\b/i.test(body)) risk += 30;
  if (/\b(pay|call|verify|beneficiary)\b/i.test(body)) risk += 30;
  if (/\bhttps?:\/\/|\w+\.(xyz|top|click|shop|info|online)\b/i.test(body)) risk += 25;
  if (/\b\d+([.,]\d{2})?\s?(EUR|USD|GBP|€|\$)\b/i.test(body)) risk += 10;
  return {
    risk: Math.min(100, risk),
    type: risk >= 70 ? 'scam' : risk >= 35 ? 'urgency' : 'legit',
  };
};

const genericExplanation = (): { why: string; reply: string } => ({
  why:
    'The message pressures you into acting now, through a contact detail it provides itself. Slow down and reach the organisation through its official channel instead.',
  reply:
    'I will not follow the instructions in this message. I will contact the organisation directly through its official number or website.',
});

const model = (kind: 'local' | 'cloud'): ModelLike => ({
  generateContent: async (request: string) => {
    const id = idOf(request);
    if (kind === 'local') {
      const hit = id ? DEMO_SCORES[id] : demoScore(request);
      return {
        response: {
          text: () => `RISK: ${hit.risk}\nTYPE: ${hit.type}`,
          inferenceSource: InferenceSource.ON_DEVICE,
        },
      };
    }
    const hit = (id && DEMO_EXPLANATIONS[id]) || genericExplanation();
    return {
      response: {
        text: () => `WHY: ${hit.why}\nREPLY: ${hit.reply}`,
        inferenceSource: InferenceSource.IN_CLOUD,
      },
    };
  },
});

export const createDemoEngine = (): EngineModels => ({
  scorer: model('local'),
  explainer: model('cloud'),
});
