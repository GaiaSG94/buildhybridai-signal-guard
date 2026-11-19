import { describe, expect, it } from 'vitest';
import { median, summarize } from '../src/core/metrics';
import { findSignals } from '../src/core/signals';
import { DEMO_INBOX } from '../src/core/inbox';
import type { ScoredMessage } from '../src/core/types';

const run = (over: Partial<ScoredMessage> & Pick<ScoredMessage, 'risk'>): ScoredMessage => ({
  message: DEMO_INBOX[0],
  risk: over.risk,
  type: over.type ?? 'other',
  level: over.level ?? 'low',
  source: over.source ?? 'on_device',
  latencyMs: over.latencyMs ?? 100,
  cloudLatencyMs: over.cloudLatencyMs ?? null,
  explanation: over.explanation ?? null,
});

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(3);
    expect(median([])).toBeNull();
  });
});

describe('summarize', () => {
  it('counts flagged messages, sources and the local share', () => {
    const runs = [
      run({ risk: 92, latencyMs: 200, cloudLatencyMs: 1380, explanation: { why: 'x', reply: 'y' } }),
      run({ risk: 14, latencyMs: 150 }),
      run({ risk: 78, latencyMs: 190, cloudLatencyMs: 1210, explanation: { why: 'x', reply: 'y' } }),
      run({ risk: 3, latencyMs: 160 }),
    ];
    const metrics = summarize(runs);
    expect(metrics.scored).toBe(4);
    expect(metrics.flagged).toBe(2);
    expect(metrics.local).toBe(4);
    expect(metrics.cloud).toBe(2);
    expect(metrics.localShare).toBe(100);
    expect(metrics.medianLocalMs).toBe(175);
    expect(metrics.medianCloudMs).toBe(1295);
  });

  it('reports the local share when the device cannot run the model', () => {
    const runs = [
      run({ risk: 90, source: 'in_cloud', latencyMs: 900 }),
      run({ risk: 10, source: 'in_cloud', latencyMs: 800 }),
    ];
    const metrics = summarize(runs);
    expect(metrics.localShare).toBe(0);
    expect(metrics.medianCloudMs).toBeNull();
  });

  it('returns zeroes for an empty scan', () => {
    expect(summarize([])).toEqual({
      scored: 0,
      flagged: 0,
      local: 0,
      cloud: 0,
      localShare: 0,
      medianLocalMs: null,
      medianCloudMs: null,
    });
  });
});

describe('findSignals', () => {
  it('finds urgency, amount, suspicious domain and phone number', () => {
    const signals = findSignals(DEMO_INBOX[0].body);
    expect(signals).toContain('URGENT');
    expect(signals).toContain('49 EUR');
    expect(signals).toContain('secure-verif1.xyz');
  });

  it('finds the spoofed bank callback', () => {
    const signals = findSignals(DEMO_INBOX[2].body);
    expect(signals).toContain('new beneficiary');
    expect(signals.some((signal) => signal.includes('+33 1 44 55 66 77'))).toBe(true);
  });

  it('stays quiet on a harmless message', () => {
    expect(findSignals(DEMO_INBOX[3].body)).toEqual([]);
  });

  it('does not repeat the same fragment', () => {
    const signals = findSignals('URGENT, urgent, URGENT!');
    expect(signals).toHaveLength(1);
  });
});
