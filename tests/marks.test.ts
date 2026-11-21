import { describe, expect, it } from 'vitest';
import { domainOf, findMarks, markedBody } from '../src/core/marks';
import { DEMO_INBOX } from '../src/core/inbox';

describe('findMarks', () => {
  it('classifies the phishing demo message into the three gestures', () => {
    const marks = findMarks(DEMO_INBOX[0].body);
    expect(marks.map((mark) => mark.kind)).toEqual(['loop', 'wave', 'box']);
    expect(marks.map((mark) => mark.text)).toEqual([
      'URGENT',
      'Pay 49 EUR',
      'secure-verif1.xyz',
    ]);
  });

  it('keeps one mark per gesture, in reading order', () => {
    const marks = findMarks(DEMO_INBOX[2].body);
    expect(marks.map((mark) => mark.kind)).toEqual(['wave']);
    expect(marks[0].text.toLowerCase()).toContain('beneficiary');
  });

  it('returns nothing for a calm message', () => {
    expect(findMarks(DEMO_INBOX[3].body)).toEqual([]);
  });

  it('boxes an http link too', () => {
    const marks = findMarks('check http://example.top now');
    expect(marks.some((mark) => mark.kind === 'box')).toBe(true);
  });
});

describe('domainOf', () => {
  it('finds the padded digit of a look-alike domain', () => {
    expect(domainOf(DEMO_INBOX[0].body)).toEqual({ domain: 'secure-verif1.xyz', padded: '1' });
  });

  it('returns null without a link', () => {
    expect(domainOf(DEMO_INBOX[3].body)).toBeNull();
  });
});

describe('markedBody', () => {
  it('wraps every mark in a span carrying its gesture', () => {
    const { html } = markedBody(DEMO_INBOX[0].body);
    expect(html).toContain('data-k="loop"');
    expect(html).toContain('data-k="wave"');
    expect(html).toContain('data-k="box"');
    expect(html).not.toContain('undefined');
  });
});
