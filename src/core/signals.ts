/**
 * Deterministic markers used by the UI to underline the exact words the local
 * pass reacted to. Pure text matching: no network, no model, no surprise.
 */
const PATTERNS: readonly RegExp[] = [
  /\bURGENT\b/gi,
  /\bsuspended\b/gi,
  /\bblocked\b/gi,
  /\bverify your (account|identity)\b/gi,
  /\bpay \d+([.,]\d{2})?\s?(EUR|USD|GBP|\u20ac|\$)\b/gi,
  /\b\d+([.,]\d{2})?\s?(EUR|USD|GBP|\u20ac|\$)\b/gi,
  /\b[\w-]+\.(xyz|top|click|shop|info|online)\b/gi,
  /\bhttps?:\/\/\S+/gi,
  /\+\d{1,3}[\s.-]?(\d{2,3}[\s.-]?){3,4}\d{2}\b/g,
  /\bnew beneficiary\b/gi,
  /\bcall \+\d[\d\s.-]+\b/gi,
  /\baccount (is )?(closed|limited)\b/gi,
];

/** Substrings to highlight, in reading order, without duplicates. */
export function findSignals(body: string): string[] {
  const found: { at: number; text: string }[] = [];
  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    for (const match of body.matchAll(regex)) {
      if (match.index === undefined) {
        continue;
      }
      found.push({ at: match.index, text: match[0] });
    }
  }
  const seen = new Set<string>();
  return found
    .sort((a, b) => a.at - b.at)
    .filter((item) => {
      const key = item.text.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((item) => item.text);
}
