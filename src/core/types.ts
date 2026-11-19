export type RiskType = 'phishing' | 'scam' | 'urgency' | 'legit' | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';

export const RISK_TYPES: readonly RiskType[] = ['phishing', 'scam', 'urgency', 'legit', 'other'];

/** Score at which a message leaves the device for a cloud explanation. */
export const ESCALATION_THRESHOLD = 70;

/** One message of the fictional inbox (no real SMS is ever read). */
export interface InboxMessage {
  id: string;
  sender: string;
  handle: string;
  body: string;
}

/** What the on-device pass returns. */
export interface LocalScore {
  risk: number;
  type: RiskType;
}

/** What the cloud pass returns for a flagged message. */
export interface CloudExplanation {
  why: string;
  reply: string;
}

export interface ScoredMessage {
  message: InboxMessage;
  risk: number;
  type: RiskType;
  level: RiskLevel;
  source: 'on_device' | 'in_cloud';
  latencyMs: number;
  cloudLatencyMs: number | null;
  explanation: CloudExplanation | null;
}

/** Aggregated numbers shown to the user (and reused for the demo). */
export interface RunMetrics {
  scored: number;
  flagged: number;
  local: number;
  cloud: number;
  localShare: number;
  medianLocalMs: number | null;
  medianCloudMs: number | null;
}
