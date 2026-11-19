import {
  ESCALATION_THRESHOLD,
  RISK_TYPES,
  type CloudExplanation,
  type LocalScore,
  type RiskLevel,
  type RiskType,
} from './types';

/** LOW < 35 <= MEDIUM < 70 <= HIGH (same scale as the Android build). */
export function levelOf(risk: number): RiskLevel {
  if (risk >= ESCALATION_THRESHOLD) {
    return 'high';
  }
  if (risk >= 35) {
    return 'medium';
  }
  return 'low';
}

/** Clamp any model output to an integer 0-100 (NaN and junk become 0). */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function needsEscalation(risk: number, threshold: number = ESCALATION_THRESHOLD): boolean {
  return clampScore(risk) >= threshold;
}

/**
 * Value of a `MARKER: value` line, or null when the line is absent.
 * The model is asked for one line per marker, so this stays strict on purpose.
 */
export function readSection(raw: string, marker: string): string | null {
  const prefix = `${marker.toUpperCase()}:`;
  for (const line of raw.split('\n')) {
    const clean = line.trim().replace(/^[-*]\s*/, '');
    if (clean.toUpperCase().startsWith(prefix)) {
      return clean.slice(prefix.length).trim();
    }
  }
  return null;
}

export function parseLocalOutput(raw: string): LocalScore {
  const riskText = readSection(raw, 'RISK') ?? '';
  const risk = clampScore(Number.parseInt(riskText.replace(/[^0-9-]/g, ''), 10));
  const typeText = (readSection(raw, 'TYPE') ?? 'other').toLowerCase();
  const type = (RISK_TYPES as readonly string[]).includes(typeText)
    ? (typeText as RiskType)
    : 'other';
  return { risk, type };
}

export function parseCloudOutput(raw: string): CloudExplanation {
  return {
    why: (readSection(raw, 'WHY') ?? '').trim(),
    reply: (readSection(raw, 'REPLY') ?? '').trim(),
  };
}
