import { summarize } from '../core/metrics';
import { findSignals } from '../core/signals';
import { ESCALATION_THRESHOLD, type RunMetrics, type ScoredMessage } from '../core/types';
import {
  PLASTER,
  FIRE,
  drawPens,
  fade,
  loopPath,
  pen,
  rise,
  tickPath,
} from './relief';

const COLUMNS = [245, 575, 905, 1235] as const;

export interface AppElements {
  stage: HTMLElement;
  frame: HTMLElement;
  notice: HTMLElement;
  audit: HTMLElement;
  title: HTMLElement;
  wallText: HTMLElement;
  nums: HTMLElement;
  plaques: HTMLElement;
  notes: HTMLElement;
  scribble: SVGSVGElement;
  scan: HTMLButtonElement;
  replay: HTMLButtonElement;
  views: { inbox: HTMLElement; message: HTMLElement; paste: HTMLElement };
  navLinks: HTMLAnchorElement[];
}

const byId = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`missing element #${id}`);
  }
  return node as T;
};

export function queryApp(): AppElements {
  return {
    stage: byId('stage'),
    frame: byId('frame'),
    notice: byId('notice'),
    audit: byId('audit'),
    title: byId('title'),
    wallText: byId('wall-text'),
    nums: byId('nums'),
    plaques: byId('plaques'),
    notes: byId('notes'),
    scribble: document.getElementById('scribble') as unknown as SVGSVGElement,
    scan: byId<HTMLButtonElement>('scan'),
    replay: byId<HTMLButtonElement>('replay'),
    views: { inbox: byId('view-inbox'), message: byId('view-message'), paste: byId('view-paste') },
    navLinks: [...document.querySelectorAll<HTMLAnchorElement>('nav a')],
  };
}

export const esc = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Escape a body and underline the fragments the local pass reacted to. */
export function highlight(body: string): string {
  let out = esc(body);
  for (const signal of findSignals(body)) {
    const safe = esc(signal);
    out = out.split(safe).join(`<u>${safe}</u>`);
  }
  return out;
}

export function setNotice(elements: AppElements, message: string | null): void {
  elements.notice.hidden = message === null;
  elements.notice.textContent = message ?? '';
}

function faceStyle(risk: number | null): string {
  if (risk === null) {
    return `color:#ebe9e4;text-shadow:${PLASTER()}`;
  }
  if (risk >= ESCALATION_THRESHOLD) {
    return `color:#f2582b;text-shadow:${FIRE()}`;
  }
  if (risk >= 35) {
    return `color:rgba(242,88,43,.55);text-shadow:${PLASTER()}`;
  }
  return `color:#f4f3ef;text-shadow:${PLASTER()}`;
}

const latencyText = (ms: number | null, fallback: string): string =>
  ms === null ? fallback : ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;

/** Plates only: used during a scan, so numbers stay hidden until the end. */
export function renderPlates(
  elements: AppElements,
  slots: readonly (ScoredMessage | null)[],
): void {
  elements.plaques.replaceChildren();
  slots.forEach((scored, index) => {
    const column = COLUMNS[index] ?? COLUMNS[COLUMNS.length - 1];
    const plate = document.createElement(scored ? 'button' : 'div');
    plate.className = 'plaque';
    if (scored) {
      (plate as HTMLButtonElement).type = 'button';
      plate.setAttribute('data-message', scored.message.id);
      plate.setAttribute('aria-label', `Open message from ${scored.message.sender}`);
    }
    plate.style.left = `${column - 145}px`;
    plate.innerHTML = plateHtml(scored, index);
    elements.plaques.append(plate);
  });
}

/** Full inbox: one relief number and one plate per column. */
export function renderInbox(
  elements: AppElements,
  slots: readonly (ScoredMessage | null)[],
): void {
  elements.nums.replaceChildren();
  elements.notes.replaceChildren();
  elements.scribble.replaceChildren();

  slots.forEach((scored, index) => {
    const column = COLUMNS[index] ?? COLUMNS[COLUMNS.length - 1];
    const number = document.createElement('div');
    number.className = 'num';
    number.style.left = `${column - 165}px`;
    number.innerHTML = `<span class="v" data-risk="${scored?.risk ?? 0}" style="${faceStyle(scored ? scored.risk : null)}">${
      scored ? String(scored.risk).padStart(2, '0') : '--'
    }</span>`;
    elements.nums.append(number);
  });
  renderPlates(elements, slots);
}

function plateHtml(scored: ScoredMessage | null, index: number): string {
  const number = `0${index + 1}`;
  if (!scored) {
    return [
      `<div class="k"><span>${number} · NOT SCORED</span><span>--</span></div>`,
      `<h3>Waiting<span>not scored yet</span></h3>`,
      `<p>Press <b>Score the inbox</b>: every message is scored on this device first.</p>`,
      `<div class="rt"><span>no inference yet</span><span>--</span></div>`,
    ].join('');
  }
  const cloud = scored.cloudLatencyMs !== null;
  return [
    `<div class="k"><span>${number} · ${scored.type.toUpperCase()}</span><span class="lv ${scored.level}">${scored.level}</span></div>`,
    `<h3>${esc(scored.message.sender)}<span>${esc(scored.message.handle)}</span></h3>`,
    `<p>${highlight(scored.message.body)}</p>`,
    `<div class="rt"><span>${scored.source === 'on_device' ? 'local' : 'cloud'} ${latencyText(scored.latencyMs, '-')}</span>${
      cloud ? `<span class="c">cloud ${latencyText(scored.cloudLatencyMs, '-')}</span>` : '<span>stayed here</span>'
    }</div>`,
  ].join('');
}

/** Marker scribbles: a circle and an arrow up for the flagged messages. */
export function drawScribbles(elements: AppElements, slots: readonly (ScoredMessage | null)[]): void {
  elements.notes.replaceChildren();
  elements.scribble.replaceChildren();
  slots.forEach((scored, index) => {
    if (!scored) {
      return;
    }
    const column = COLUMNS[index] ?? COLUMNS[COLUMNS.length - 1];
    if (scored.risk >= ESCALATION_THRESHOLD) {
      pen(elements.scribble, loopPath(column + 8, 407, 150, 108));
      const fromX = column + 112;
      const fromY = 309;
      pen(
        elements.scribble,
        `M${fromX} ${fromY}C${fromX + 30} ${fromY - 30} ${fromX + 16} ${fromY - 70} ${fromX + 46} ${fromY - 100}`,
        { width: 2.4 },
      );
      pen(
        elements.scribble,
        `${fromX + 29} ${fromY - 95}L${fromX + 47} ${fromY - 102}L${fromX + 50} ${fromY - 83}`,
        { width: 2.4 },
      );
      const note = document.createElement('div');
      note.className = 'note';
      note.style.left = `${fromX + 58}px`;
      note.style.top = `${fromY - 124}px`;
      note.innerHTML = `up to the cloud<br>${latencyText(scored.cloudLatencyMs, 'explained')} · explained`;
      elements.notes.append(note);
    } else {
      pen(elements.scribble, tickPath(column + 96, 321), {
        color: '#2a2a2a',
        opacity: 0.55,
        width: 2.2,
      });
    }
  });
}

/** Count the relief numbers up and draw the scribbles (the demo's signature moment). */
export function playScan(elements: AppElements): void {
  const numbers = [...elements.nums.querySelectorAll<HTMLElement>('.num .v')];
  numbers.forEach((node, index) => {
    const target = Number(node.getAttribute('data-risk') ?? '0');
    if (target === 0 && node.textContent === '--') {
      return;
    }
    rise(node, target, 150 + index * 170);
  });

  drawPens([...elements.scribble.querySelectorAll('path')], 1300, 160);
  fade([...elements.notes.querySelectorAll('.note')], 2000, 400);
}

export function renderHeader(
  elements: AppElements,
  slots: readonly (ScoredMessage | null)[],
  threshold: number,
): RunMetrics {
  const scored = slots.filter((slot): slot is ScoredMessage => slot !== null);
  const metrics = summarize(scored, threshold);
  elements.title.innerHTML = `${slots.length} messages on the wall. <b>${metrics.flagged}</b> went up for an explanation.`;
  elements.wallText.textContent = `LOCAL RISK · SCORED ON THIS DEVICE · CLOUD ONLY ABOVE ${threshold}`;
  elements.audit.hidden = scored.length === 0;
  elements.audit.innerHTML = [
    `${metrics.scored} scored · <b>${metrics.flagged} flagged</b>`,
    `${metrics.local} local analyses · ${metrics.cloud} cloud calls`,
    `median local ${latencyText(metrics.medianLocalMs, '-')}`,
    `median cloud ${latencyText(metrics.medianCloudMs, '-')}`,
    `${metrics.localShare}% of scores computed on device`,
  ].join(' · ');
  return metrics;
}

export function showView(elements: AppElements, view: 'inbox' | 'message' | 'paste'): void {
  elements.views.inbox.hidden = view !== 'inbox';
  elements.views.message.hidden = view !== 'message';
  elements.views.paste.hidden = view !== 'paste';
  elements.scan.hidden = view !== 'inbox';
  elements.replay.hidden = view !== 'inbox';
  for (const link of elements.navLinks) {
    link.classList.toggle('on', link.dataset['view'] === view);
  }
}

function resultHtml(scored: ScoredMessage, threshold: number): string {
  const flagged = scored.risk >= threshold;
  const explanation = scored.explanation;
  const signals = findSignals(scored.message.body);
  const why = explanation && explanation.why
    ? esc(explanation.why)
    : flagged
      ? 'The cloud explanation did not come back. The local score still stands.'
      : 'This message stayed on the device: no cloud call was made.';
  return [
    `<div class="meta"><span>${scored.source === 'on_device' ? 'scored on device' : 'scored in cloud'}</span>`,
    `<span>${latencyText(scored.latencyMs, '-')}</span>`,
    `<span class="lv ${scored.level}">${scored.level} · ${scored.type}</span>`,
    scored.cloudLatencyMs !== null ? `<span class="c">cloud ${latencyText(scored.cloudLatencyMs, '-')}</span>` : '<span>no cloud call</span>',
    `</div>`,
    `<div class="scale"><i class="${flagged ? 'hot' : ''}" style="width:${scored.risk}%"></i><b style="left:${threshold}%"></b></div>`,
    `<p class="body">${highlight(scored.message.body)}</p>`,
    `<h3>What the device flagged</h3>`,
    signals.length > 0
      ? `<p class="txt">${signals.map((signal) => esc(signal)).join(' · ')}</p>`
      : '<p class="nothing">No suspicious fragment matched on the device.</p>',
    `<h3>Why it is dangerous</h3>`,
    `<p class="txt">${why}</p>`,
    `<h3>A reply you can forward</h3>`,
    explanation && explanation.reply
      ? `<div class="reply" id="reply">${esc(explanation.reply)}</div>`
      : `<p class="nothing">${flagged ? 'No reply came back from the cloud.' : 'Nothing to forward: this message is not flagged.'}</p>`,
  ].join('');
}

export function renderPaste(
  elements: AppElements,
  scored: ScoredMessage | null,
  threshold: number,
  busy: boolean,
): void {
  const result = scored ? resultHtml(scored, threshold) : '';
  elements.views.paste.innerHTML = [
    `<div class="sheet">`,
    `<p class="kicker">PASTE A MESSAGE · SCORED ON THIS DEVICE FIRST</p>`,
    `<h2>Does this message smell wrong?</h2>`,
    `<textarea id="paste-text" placeholder="Paste an SMS, an email or a DM here. It is scored on this device; only a flagged message goes up for an explanation.">${scored ? esc(scored.message.body) : ''}</textarea>`,
    `<div class="row">`,
    `<button class="btn pri" type="button" id="paste-run" ${busy ? 'disabled' : ''}>${busy ? 'Scoring…' : 'Score on this device'}</button>`,
    `</div>`,
    result,
    scored?.explanation?.reply ? `<div class="row"><button class="btn" type="button" data-copy>Copy the reply</button></div>` : '',
    `</div>`,
  ].join('');
}
