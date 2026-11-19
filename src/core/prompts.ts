import type { InboxMessage, RiskType } from './types';

/**
 * On-device prompt: short, single-turn, strict output.
 * No explanation is requested here — that is what keeps the device pass fast.
 */
export function buildLocalPrompt(message: InboxMessage): string {
  return [
    'You score one message for fraud risk. Answer with exactly two lines, no markdown:',
    'RISK: an integer from 0 (harmless) to 100 (certain scam).',
    'TYPE: one of phishing, scam, urgency, legit, other.',
    '',
    `SENDER: ${message.sender} (${message.handle})`,
    `MESSAGE: ${message.body}`,
  ].join('\n');
}

/**
 * Cloud prompt for a flagged message only: explain it, then write a reply that
 * the user can forward as-is to a worried relative (plain words, no jargon).
 */
export function buildCloudPrompt(
  message: InboxMessage,
  risk: number,
  type: RiskType,
): string {
  return [
    'This message was scored as dangerous on the user device.',
    `Local score: ${risk}/100, type: ${type}.`,
    'Answer with exactly two sections, no markdown, no preamble:',
    'WHY: two sentences explaining the trick, in plain language, without jargon.',
    'REPLY: a short calm message the user can send to an elderly relative',
    'explaining what is happening and what to do (do not click, do not pay,',
    'call the official number). Write it so it can be forwarded as-is.',
    '',
    `SENDER: ${message.sender} (${message.handle})`,
    `MESSAGE: ${message.body}`,
  ].join('\n');
}
