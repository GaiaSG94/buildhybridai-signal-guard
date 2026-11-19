import { describe, expect, it } from 'vitest';
import {
  clampScore,
  levelOf,
  needsEscalation,
  parseCloudOutput,
  parseLocalOutput,
  readSection,
} from '../src/core/parse';

describe('parseLocalOutput', () => {
  it('reads the score and the type', () => {
    expect(parseLocalOutput('RISK: 92\nTYPE: phishing')).toEqual({ risk: 92, type: 'phishing' });
  });

  it('accepts bullets and lower case markers', () => {
    expect(parseLocalOutput('- risk: 71\n- type: SCAM')).toEqual({ risk: 71, type: 'scam' });
  });

  it('clamps out-of-range scores', () => {
    expect(parseLocalOutput('RISK: 180').risk).toBe(100);
    expect(parseLocalOutput('RISK: -4').risk).toBe(0);
  });

  it('falls back to 0 / other on junk', () => {
    expect(parseLocalOutput('nothing useful here')).toEqual({ risk: 0, type: 'other' });
    expect(parseLocalOutput('RISK: high\nTYPE: not-a-type')).toEqual({ risk: 0, type: 'other' });
  });

  it('does not confuse a missing section with the first line', () => {
    expect(readSection('OVERVIEW: hello', 'WHY')).toBeNull();
  });
});

describe('levelOf', () => {
  it('uses LOW < 35 <= MEDIUM < 70 <= HIGH', () => {
    expect(levelOf(0)).toBe('low');
    expect(levelOf(34)).toBe('low');
    expect(levelOf(35)).toBe('medium');
    expect(levelOf(69)).toBe('medium');
    expect(levelOf(70)).toBe('high');
    expect(levelOf(100)).toBe('high');
  });
});

describe('needsEscalation', () => {
  it('escalates at the threshold only', () => {
    expect(needsEscalation(69)).toBe(false);
    expect(needsEscalation(70)).toBe(true);
    expect(needsEscalation(70, 80)).toBe(false);
    expect(needsEscalation(80, 80)).toBe(true);
  });

  it('clamps before comparing', () => {
    expect(needsEscalation(700)).toBe(true);
    expect(needsEscalation(Number.NaN)).toBe(false);
  });
});

describe('clampScore', () => {
  it('rounds and bounds', () => {
    expect(clampScore(12.6)).toBe(13);
    expect(clampScore(-1)).toBe(0);
    expect(clampScore(101)).toBe(100);
    expect(clampScore(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('parseCloudOutput', () => {
  it('reads both sections', () => {
    const parsed = parseCloudOutput(
      'WHY: The link imitates a bank and asks for a payment.\nREPLY: Do not click, call your bank.',
    );
    expect(parsed.why).toBe('The link imitates a bank and asks for a payment.');
    expect(parsed.reply).toBe('Do not click, call your bank.');
  });

  it('returns empty strings when a section is missing', () => {
    expect(parseCloudOutput('WHY: only the reason.')).toEqual({
      why: 'only the reason.',
      reply: '',
    });
  });
});
