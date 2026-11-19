import {
  getGenerativeModel,
  InferenceMode,
  type AI,
  type GenerativeModel,
} from 'firebase/ai';

/**
 * Local scoring model: Firebase AI Logic prefers the on-device model
 * (Gemini Nano through the Chrome Prompt API) and only falls back to the
 * cloud model when the device cannot run it. The response's
 * `inferenceSource` tells the UI which one actually answered.
 */
export function createScorer(ai: AI, cloudModel: string): GenerativeModel {
  return getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    onDeviceParams: { createOptions: { expectedOutputs: [{ type: 'text' }] } },
    inCloudParams: { model: cloudModel },
  });
}

/**
 * Explanation model: an explanation is only requested for a flagged message,
 * so this model never runs on the device (long answer, needs the cloud model).
 */
export function createExplainer(ai: AI, cloudModel: string): GenerativeModel {
  return getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: { model: cloudModel },
  });
}
