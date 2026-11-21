import { levelOf } from './parse';
import { median } from './metrics';
import { ESCALATION_THRESHOLD, type RiskLevel, type ScoredMessage } from './types';

/** Everything the Dashboard page shows, computed from the session's analyses. */
export interface SessionStats {
  total: number;
  cloud: number;
  stayed: number;
  medianLocalMs: number | null;
  levels: Record<RiskLevel, number>;
  /** Most recent flagged messages, capped for the three report plaques. */
  reports: ScoredMessage[];
}

/** Every analysis of the session, in order. Pure data, no DOM. */
export class SessionLog {
  private entries: ScoredMessage[] = [];

  record(scored: ScoredMessage): void {
    this.entries.push(scored);
  }

  get all(): readonly ScoredMessage[] {
    return this.entries;
  }

  stats(threshold: number = ESCALATION_THRESHOLD, maxReports = 3): SessionStats {
    const levels: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
    for (const entry of this.entries) {
      levels[levelOf(entry.risk)] += 1;
    }
    const cloud = this.entries.filter((entry) => entry.cloudLatencyMs !== null);
    const flagged = this.entries.filter((entry) => entry.risk >= threshold);
    return {
      total: this.entries.length,
      cloud: cloud.length,
      stayed: this.entries.length - cloud.length,
      medianLocalMs: median(this.entries.map((entry) => entry.latencyMs)),
      levels,
      reports: flagged.slice(-maxReports).reverse(),
    };
  }
}
