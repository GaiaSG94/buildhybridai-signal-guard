import { describe, expect, it } from 'vitest';
import { SessionLog } from '../src/core/session';
import type { ScoredMessage } from '../src/core/types';

const entry = (risk: number, latencyMs = 180, cloudLatencyMs: number | null = null): ScoredMessage => ({
  message: { id: risk >= 70 && cloudLatencyMs ? 'm1' : 'm2', sender: 'x', handle: 'y', body: 'body' },
  risk,
  type: 'other',
  level: risk >= 70 ? 'high' : risk >= 35 ? 'medium' : 'low',
  source: 'on_device',
  latencyMs,
  cloudLatencyMs,
  explanation: cloudLatencyMs ? { why: 'why', reply: 'reply' } : null,
});

describe('SessionLog', () => {
  it('starts empty and stays honest', () => {
    const log = new SessionLog();
    const stats = log.stats();
    expect(stats.total).toBe(0);
    expect(stats.cloud).toBe(0);
    expect(stats.stayed).toBe(0);
    expect(stats.medianLocalMs).toBeNull();
    expect(stats.reports).toEqual([]);
  });

  it('counts cloud calls, stays and levels from real entries', () => {
    const log = new SessionLog();
    [10, 20, 40, 50, 80, 90, 5, 15].forEach((risk, i) =>
      log.record(entry(risk, 100 + i, risk >= 70 ? 1300 : null)),
    );
    log.record(entry(75, 200, 1210));
    const stats = log.stats();
    expect(stats.total).toBe(9);
    expect(stats.cloud).toBe(3);
    expect(stats.stayed).toBe(6);
    expect(stats.levels).toEqual({ low: 4, medium: 2, high: 3 });
    expect(stats.medianLocalMs).toBe(104);
    expect(stats.reports.map((report) => report.risk)).toEqual([75, 90, 80]);
  });

  it('caps reports at three, most recent first', () => {
    const log = new SessionLog();
    for (let i = 0; i < 6; i += 1) {
      log.record(entry(70 + i, 100, 1200));
    }
    expect(log.stats(70, 3).reports.map((report) => report.risk)).toEqual([75, 74, 73]);
  });

  it('exposes every entry for further reuse', () => {
    const log = new SessionLog();
    log.record(entry(1));
    expect(log.all).toHaveLength(1);
  });
});
