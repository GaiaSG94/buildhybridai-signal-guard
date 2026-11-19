import { ESCALATION_THRESHOLD, type RunMetrics, type ScoredMessage } from './types';

/** Median of a list of durations, or null when the list is empty. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

/**
 * Numbers the demo quotes: how many messages stayed on the device, how many
 * were escalated, and the latency actually observed on each path.
 */
export function summarize(
  runs: readonly ScoredMessage[],
  threshold: number = ESCALATION_THRESHOLD,
): RunMetrics {
  const local = runs.filter((run) => run.source === 'on_device');
  const cloud = runs.filter((run) => run.explanation !== null || run.source === 'in_cloud');
  const flagged = runs.filter((run) => run.risk >= threshold).length;
  return {
    scored: runs.length,
    flagged,
    local: local.length,
    cloud: cloud.length,
    localShare: runs.length === 0 ? 0 : Math.round((local.length / runs.length) * 100),
    medianLocalMs: median(local.map((run) => run.latencyMs)),
    medianCloudMs: median(
      cloud.map((run) => run.cloudLatencyMs ?? 0).filter((value) => value > 0),
    ),
  };
}
