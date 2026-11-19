import { InferenceSource, type AI, type GenerativeModel } from 'firebase/ai';
import { levelOf, needsEscalation, parseCloudOutput, parseLocalOutput } from './core/parse';
import { buildCloudPrompt, buildLocalPrompt } from './core/prompts';
import {
  ESCALATION_THRESHOLD,
  type InboxMessage,
  type ScoredMessage,
} from './core/types';
import { createExplainer, createScorer } from './models';

export interface EngineModels {
  scorer: GenerativeModel;
  explainer: GenerativeModel;
}

export function createEngine(ai: AI, cloudModel: string): EngineModels {
  return {
    scorer: createScorer(ai, cloudModel),
    explainer: createExplainer(ai, cloudModel),
  };
}

/** Score one message; the badge shows where the model actually ran. */
export async function scoreMessage(
  models: EngineModels,
  message: InboxMessage,
): Promise<ScoredMessage> {
  const started = performance.now();
  const result = await models.scorer.generateContent(buildLocalPrompt(message));
  const latencyMs = Math.round(performance.now() - started);
  const { risk, type } = parseLocalOutput(result.response.text());
  return {
    message,
    risk,
    type,
    level: levelOf(risk),
    source: result.response.inferenceSource === InferenceSource.IN_CLOUD ? 'in_cloud' : 'on_device',
    latencyMs,
    cloudLatencyMs: null,
    explanation: null,
  };
}

/** Ask the cloud why the message is dangerous, and what to reply. */
export async function explainMessage(
  models: EngineModels,
  scored: ScoredMessage,
): Promise<ScoredMessage> {
  const started = performance.now();
  const result = await models.explainer.generateContent(
    buildCloudPrompt(scored.message, scored.risk, scored.type),
  );
  const cloudLatencyMs = Math.round(performance.now() - started);
  return {
    ...scored,
    cloudLatencyMs,
    explanation: parseCloudOutput(result.response.text()),
  };
}

export interface RunOptions {
  threshold?: number;
  /** Called after each message, so the UI can fill one gauge at a time. */
  onScored?: (scored: ScoredMessage, index: number, total: number) => void;
}

/**
 * Score a list of messages, escalate the dangerous ones, and return everything
 * the UI needs (scores, sources, latencies, explanations).
 */
export async function runInbox(
  models: EngineModels,
  messages: readonly InboxMessage[],
  options: RunOptions = {},
): Promise<ScoredMessage[]> {
  const threshold = options.threshold ?? ESCALATION_THRESHOLD;
  const out: ScoredMessage[] = [];
  for (const [index, message] of messages.entries()) {
    let scored = await scoreMessage(models, message);
    if (needsEscalation(scored.risk, threshold)) {
      scored = await explainMessage(models, scored);
    }
    out.push(scored);
    options.onScored?.(scored, index, messages.length);
  }
  return out;
}
