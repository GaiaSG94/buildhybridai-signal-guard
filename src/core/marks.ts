/** Marker kinds, one felt-tip gesture each (see G-DESIGN/planches/relief/02). */
export type MarkKind = 'loop' | 'wave' | 'box';

export interface Mark {
  at: number;
  text: string;
  kind: MarkKind;
}

const MARK_PATTERNS: readonly { re: RegExp; kind: MarkKind }[] = [
  { re: /\bURGENT\b|\bsuspended\b|\bblocked\b|\baccount (is )?(closed|limited)\b/gi, kind: 'loop' },
  {
    re: /\bverify your (account|identity)\b|\bpay \d+([.,]\d{2})?\s?(EUR|USD|GBP|\u20ac|\$)\b|\bnew beneficiary\b|\bcall \+\d[\d\s.-]+\b/gi,
    kind: 'wave',
  },
  { re: /\b[\w-]+\.(xyz|top|click|shop|info|online)\b|\bhttps?:\/\/\S+/gi, kind: 'box' },
];

/** Fragments to circle (urgency), underline with a wave (action) or box (link). */
export function findMarks(body: string): Mark[] {
  const found: Mark[] = [];
  for (const { re, kind } of MARK_PATTERNS) {
    const regex = new RegExp(re.source, re.flags);
    for (const match of body.matchAll(regex)) {
      if (match.index === undefined) {
        continue;
      }
      found.push({ at: match.index, text: match[0], kind });
    }
  }
  return found
    .sort((a, b) => a.at - b.at)
    .filter((mark, index, all) => {
      const first = all.findIndex((other) => other.kind === mark.kind);
      return first === index;
    });
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Padded domain of a message, or null: "secure-verif1.xyz" plus the padded part. */
export function domainOf(body: string): { domain: string; padded: string | null } | null {
  const mark = findMarks(body).find((item) => item.kind === 'box');
  if (!mark) {
    return null;
  }
  const domain = mark.text.replace(/^https?:\/\//, '').split(/[/?#]/)[0].toLowerCase();
  const label = domain.split('.').slice(0, -1).join('.');
  const digit = label.match(/\d/);
  return { domain, padded: digit ? digit[0] : null };
}

/** Message body with the marked fragments wrapped, for the pinned exhibit sheet. */
export function markedBody(
  body: string,
): { html: string; marks: Mark[] } {
  const marks = findMarks(body);
  let html = body;
  for (const mark of [...marks].sort((a, b) => b.at - a.at)) {
    const pattern = new RegExp(escapeRegExp(mark.text));
    html = html.replace(
      pattern,
      `<span class="mk" data-k="${mark.kind}" data-n="${noteFor(mark)}">${mark.text}</span>`,
    );
  }
  return { html, marks };
}

const noteFor = (mark: Mark): string => {
  if (mark.kind === 'loop') {
    return 'urgency';
  }
  if (mark.kind === 'wave') {
    return 'call to action';
  }
  return 'padded domain';
};
