import { markedBody, domainOf } from '../core/marks';
import { type ScoredMessage } from '../core/types';
import { esc } from './views';
import {
  FIRE,
  PLASTER,
  arrowPaths,
  boxPath,
  drawPens,
  fade,
  loopPath,
  pen,
  rectOf,
  rise,
  wavePath,
} from './relief';
import './message.css';

const latency = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;

/** Cloud "why" split into numbered reasons (one sentence each). */
const reasons = (why: string): string[] =>
  why
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const domainRelief = (body: string): string => {
  const info = domainOf(body);
  if (!info) {
    return '';
  }
  const digits = esc(info.padded ?? '');
  const [before, after] = digits
    ? esc(info.domain).split(new RegExp(`(${digits})`))
    : [esc(info.domain), ''];
  const padded = digits && after ? `<span>${after}</span>` : '';
  return [
    `<div class="exhibit" id="exhibit">`,
    `<p class="kicker">Exhibit · link domain${digits ? ' · padded' : ''}</p>`,
    `<div class="dom-relief" id="domrel">${before}${padded}</div>`,
    `</div>`,
  ].join('');
};

const floorSet = (scored: ScoredMessage, flagged: boolean): string => {
  const whyList =
    flagged && scored.explanation?.why
      ? `<ol>${reasons(scored.explanation.why)
          .map((reason) => `<li><span>${esc(reason)}</span></li>`)
          .join('')}</ol>`
      : `<p class="plain">${flagged
          ? 'The cloud explanation did not come back. The local score still stands.'
          : 'This message stayed on the device: no cloud call was made.'}</p>`;
  const reply = scored.explanation?.reply;
  return [
    `<div class="floorset">`,
    `<section class="plaque why"><div class="k"><span>Why this is ${
      flagged ? 'a scam' : 'fine'
    }</span><span class="${flagged ? 'c' : ''}">${
      flagged ? `cloud · ${latency(scored.cloudLatencyMs ?? scored.latencyMs)}` : 'local pass only'
    }</span></div>${whyList}</section>`,
    `<section class="plaque reply"><div class="k"><span>Suggested reply</span><span class="${reply ? 'c' : ''}">${
      reply ? 'cloud' : 'nothing to forward'
    }</span></div>${
      reply
        ? `<blockquote id="reply">${esc(reply)}</blockquote><div class="acts"><button class="btn acc" type="button" data-copy>Copy reply</button><small>or just don’t answer</small></div>`
        : `<p class="plain">Nothing to forward: this message is not flagged.</p>`
    }</section>`,
    `</div>`,
  ].join('');
};

/** Page Message, faithful to G-DESIGN/planches/relief/02-message.html. */
export const renderMessagePage = (
  view: HTMLElement,
  frame: HTMLElement,
  scored: ScoredMessage,
  threshold: number,
  position: number,
  origin: string,
): void => {
  const flagged = scored.risk >= threshold;
  const { html } = markedBody(scored.message.body);
  view.innerHTML = messageHtml(scored, threshold, position, origin, html, flagged);
  playMessage(view, frame, scored, flagged);
};

const messageHtml = (
  scored: ScoredMessage,
  threshold: number,
  position: number,
  origin: string,
  body: string,
  flagged: boolean,
): string =>
  [
    `<a class="back" href="#/inbox">← ${esc(origin)} / ${position} of 04</a>`,
    `<div class="left">`,
    `<p class="kicker">Local risk · ${esc(scored.type)}</p>`,
    `<div class="relief score ${flagged ? 'hot' : ''}" id="mscore">${String(scored.risk).padStart(2, '0')}</div>`,
    `<p class="meta">/ 100 · scored on this device in ${latency(scored.latencyMs)}<br>${
      flagged
        ? `above the threshold of ${threshold} → <b>sent to the cloud, ${latency(scored.cloudLatencyMs ?? 0)}</b>`
        : `under the threshold of ${threshold} → stayed on this device, no cloud call`
    }</p>`,
    `</div>`,
    `<article class="sheet">`,
    `<div class="hd"><span>Exhibit · ${origin === 'Inbox' ? 'message' : 'pasted message'} ${position}</span><span>received · demo inbox</span></div>`,
    `<h2>${esc(scored.message.sender)}<span>${esc(scored.message.handle)}</span></h2>`,
    `<p class="msg">${body}</p>`,
    `<div class="ft"><span>marks: signals found by Gemini Nano 4, on this device</span><span>LOCAL ${latency(scored.latencyMs)}</span></div>`,
    `</article>`,
    domainRelief(scored.message.body),
    floorSet(scored, flagged),
    `<svg class="marker" id="mmk" width="1440" height="900"></svg>`,
    `<span class="tag">SIGNAL GUARD · MESSAGE · RELIEF · FICTIONAL DEMO</span>`,
  ].join('');

/** The signature moment: the score rises, the felt marks draw themselves. */
const playMessage = (
  view: HTMLElement,
  frame: HTMLElement,
  scored: ScoredMessage,
  flagged: boolean,
): void => {
  const svg = view.querySelector<SVGElement>('#mmk');
  const score = view.querySelector<HTMLElement>('#mscore');
  if (!svg || !score) {
    return;
  }
  view.querySelectorAll('.note').forEach((node) => node.remove());
  score.style.textShadow = flagged ? FIRE(28) : PLASTER(28);
  const domRelief = view.querySelector<HTMLElement>('#domrel');
  if (domRelief) {
    domRelief.style.textShadow = PLASTER(10);
    const digit = domRelief.querySelector('span');
    if (digit) {
      (digit as HTMLElement).style.textShadow = FIRE(10);
    }
  }
  rise(score, scored.risk, 150);
  const pens: SVGPathElement[] = [];
  const notes: Element[] = [];

  const box = rectOf(frame, score);
  pens.push(pen(svg, loopPath(box.x + box.w / 2 + 4, box.y + box.h / 2 + 12, box.w / 2 + 20, box.h / 2 - 56), { width: 2.8 }));
  if (flagged) {
    const [shaft, head] = arrowPaths(box.x + box.w / 2 - 40, box.y + box.h + 86, 170, 716, -40);
    pens.push(pen(svg, shaft), pen(svg, head));
  }

  view.querySelectorAll<HTMLElement>('.mk').forEach((mark) => {
    const r = rectOf(frame, mark);
    const kind = mark.dataset['k'];
    if (kind === 'loop') {
      pens.push(pen(svg, loopPath(r.x + r.w / 2, r.y + r.h / 2 + 2, r.w / 2 + 14, r.h / 2 + 2)));
    } else if (kind === 'wave') {
      pens.push(pen(svg, wavePath(r.x, r.y + r.h - 2, r.w)));
    } else {
      pens.push(pen(svg, boxPath(r.x, r.y + 6, r.w, r.h - 12)));
    }
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = mark.dataset['n'] ?? '';
    if (kind === 'box') {
      note.style.left = `${r.x + r.w + 22}px`;
      note.style.top = `${r.y + r.h + 16}px`;
    } else {
      const width = kind === 'wave' ? 92 : 78;
      note.style.left = `${r.x - 22 - width}px`;
      note.style.top = `${r.y + r.h / 2 - 10}px`;
      note.style.width = `${width}px`;
      note.style.textAlign = 'right';
    }
    frame.append(note);
    notes.push(note);
  });

  const digit = domRelief?.querySelector('span');
  if (digit) {
    const r = rectOf(frame, digit);
    pens.push(pen(svg, loopPath(r.x + r.w / 2 + 3, r.y + r.h / 2 + 4, r.w / 2 + 16, r.h / 2 + 6)));
    const note = document.createElement('div');
    note.className = 'note';
    note.innerHTML = 'the digit pads a look-alike<br>verification domain';
    note.style.left = `${r.x + r.w + 30}px`;
    note.style.top = `${r.y - 14}px`;
    frame.append(note);
    notes.push(note);
  }

  drawPens(pens, 1150, 200);
  fade(notes, 1500, 260);
  fade([...view.querySelectorAll('.floorset .plaque')], 1600, 200);
};
