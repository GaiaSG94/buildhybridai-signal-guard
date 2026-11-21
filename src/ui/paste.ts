import { FIRE, PLASTER, arrowPaths, drawPens, fade, loopPath, pen, rectOf } from './relief';
import { esc } from './views';
import { type ScoredMessage } from '../core/types';
import './paste.css';
const SAMPLE = 'Dear client, a new beneficiary has been added to your account. Call +33 1 44 55 66 77 to cancel.';

const STEP_LABEL = [
  'Gemini Nano 4 looks for urgency, calls to action, masked links and padded domains.',
  'Under 70 the result stays here. At 70 or more, the message is sent on for an explanation.',
  'Only for flagged messages: why it is a scam, and a reply you can copy.',
];

const STEP_TITLES = ['Read the message', 'Score it, 0 to 100', 'Explain and draft a reply'];

/** Page Paste, faithful to G-DESIGN/planches/relief/03-paste.html. */
export const renderPastePage = (
  view: HTMLElement,
  pasted: ScoredMessage | null,
  busy: boolean,
): void => {
  view.innerHTML = [
    `<i class="tape" style="left: 90px; transform: rotate(-5deg)"></i>`,
    `<i class="tape" style="left: 700px; transform: rotate(4deg)"></i>`,
    `<article class="sheet" id="psheet">`,
    `<div class="hd"><span>Paste a message</span><span>nothing leaves this device to score it</span></div>`,
    `<h2>Pin any message to the wall.<small>Text from an SMS, an e-mail or a chat. Read by Gemini Nano 4 on this device first.</small></h2>`,
    `<textarea id="paste-text" spellcheck="false" placeholder="Paste a message here…">${
      pasted ? esc(pasted.message.body) : ''
    }</textarea>`,
    `<div class="ft"><button class="btn pri" type="button" id="paste-run" ${busy ? 'disabled' : ''}>${
      busy ? 'Reading…' : 'Read it'
    }</button><button class="btn" type="button" id="paste-clear">Clear</button><small id="pchars">characters</small></div>`,
    `<div class="scan" id="pscan"></div>`,
    `</article>`,
    `<div class="right">`,
    `<p class="kicker" id="pkick">Local risk · waiting</p>`,
    `<div class="relief pscore" id="pscore">00</div>`,
    `<p class="state" id="pstate">&nbsp;</p>`,
    `</div>`,
    `<p class="offline">Offline? <b>Local rules still score the message</b>, with no cloud step. The wall says “offline — local rules only”.</p>`,
    `<div class="steps">`,
    STEP_TITLES.map(
      (title, index) =>
        `<section class="plaque off" id="pstep-${index}"><span class="n">0${index + 1}</span><div class="k"><span>${
          index === 2 ? 'Cloud' : 'On this device'
        }</span><span class="c"></span></div><h3>${title}</h3><p>${STEP_LABEL[index]}</p></section>`,
    ).join(''),
    `</div>`,
    `<svg class="marker" id="pmk" width="1440" height="900"></svg>`,
    `<span class="tag">SIGNAL GUARD · PASTE A MESSAGE · RELIEF · FICTIONAL DEMO</span>`,
  ].join('');
  updateChars(view);
  const score = view.querySelector<HTMLElement>('#pscore');
  if (score) {
    score.style.opacity = busy ? '.45' : '.2';
    score.style.textShadow = PLASTER(26);
  }
};

/** Step plaques: off → live (label) → done (label). */
export const pasteStep = (
  view: HTMLElement,
  index: number,
  state: 'off' | 'live' | 'done',
  label: string,
): void => {
  const step = view.querySelector<HTMLElement>(`#pstep-${index}`);
  if (!step) {
    return;
  }
  step.className = `plaque ${state}`;
  const tag = step.querySelector<HTMLElement>('.k .c');
  if (tag) {
    tag.textContent = label;
  }
};

const updateChars = (view: HTMLElement): void => {
  const field = view.querySelector<HTMLTextAreaElement>('#paste-text');
  const count = view.querySelector<HTMLElement>('#pchars');
  if (field && count) {
    const n = field.value.length;
    count.textContent = `${n} character${n === 1 ? '' : 's'}${
      field.value === SAMPLE ? ' · sample from the demo inbox' : ''
    }`;
  }
};

export const pasteCountChars = (view: HTMLElement): void => updateChars(view);

export const pasteClear = (view: HTMLElement): void => {
  const field = view.querySelector<HTMLTextAreaElement>('#paste-text');
  if (field) {
    field.value = '';
  }
  updateChars(view);
};

export const pasteText = (view: HTMLElement): string =>
  view.querySelector<HTMLTextAreaElement>('#paste-text')?.value.trim() ?? '';

/** Light sweep + half-lit score while the device reads the message. */
export const pasteReading = (view: HTMLElement): void => {
  const score = view.querySelector<HTMLElement>('#pscore');
  const kick = view.querySelector<HTMLElement>('#pkick');
  const state = view.querySelector<HTMLElement>('#pstate');
  const scan = view.querySelector<HTMLElement>('#pscan');
  if (score) {
    score.style.transition = 'none';
    score.style.opacity = '.45';
    score.style.textShadow = PLASTER(26);
  }
  if (kick) {
    kick.textContent = 'Local risk · reading…';
  }
  if (state) {
    state.innerHTML = '&nbsp;';
  }
  if (scan) {
    scan.style.transition = 'none';
    scan.style.top = '-140px';
    window.setTimeout(() => {
      scan.style.transition = 'top 1500ms cubic-bezier(.45,0,.3,1)';
      scan.style.top = '520px';
    }, 80);
  }
  view.querySelector('#pmk')?.replaceChildren();
  view.querySelectorAll('.note').forEach((node) => node.remove());
  pasteStep(view, 0, 'live', 'reading');
  pasteStep(view, 1, 'off', '');
  pasteStep(view, 2, 'off', '');
};

/** The real score rose: the wall turns orange if the message is flagged. */
export const pasteScored = (
  view: HTMLElement,
  frame: HTMLElement,
  scored: ScoredMessage,
  threshold: number,
): void => {
  const score = view.querySelector<HTMLElement>('#pscore');
  const kick = view.querySelector<HTMLElement>('#pkick');
  const flagged = scored.risk >= threshold;
  if (score) {
    score.style.opacity = '1';
    score.style.textShadow = flagged ? FIRE(26) : PLASTER(26);
    score.textContent = String(scored.risk).padStart(2, '0');
  }
  if (kick) {
    kick.textContent = `Local risk · ${scored.type}`;
  }
  const state = view.querySelector<HTMLElement>('#pstate');
  if (state) {
    state.innerHTML = `/ 100 · scored on this device in ${scored.latencyMs} ms<br>${
      flagged
        ? `above the threshold of ${threshold} → <b class="pulse">asking the cloud…</b>`
        : `under the threshold of ${threshold} → stayed on this device`
    }`;
  }
  pasteStep(view, 0, 'done', `${scored.latencyMs} ms`);
  pasteStep(view, 1, 'done', `${scored.risk} ${flagged ? '≥' : '<'} ${threshold}`);
  if (flagged) {
    pasteStep(view, 2, 'live', 'asking');
    cloudPending(view, frame, score);
  } else {
    pasteStep(view, 2, 'off', 'not needed');
  }
};

/** The dashed cloud arrow pulses while the explanation is on its way. */
const cloudPending = (
  view: HTMLElement,
  frame: HTMLElement,
  score: HTMLElement | null,
): void => {
  const svg = view.querySelector<SVGElement>('#pmk');
  if (!svg || !score) {
    return;
  }
  const box = rectOf(frame, score);
  const loop = pen(svg, loopPath(box.x + box.w / 2 + 4, box.y + box.h / 2 + 8, box.w / 2 + 24, box.h / 2 - 22), { width: 2.8 });
  const [shaft, head] = arrowPaths(box.x + box.w + 4, box.y + 70, box.x + box.w + 44, box.y + 6, 18);
  const shaftPen = pen(svg, shaft);
  const headPen = pen(svg, head);
  drawPens([loop, shaftPen, headPen], 0, 0);
  window.setTimeout(() => {
    loop.style.strokeDasharray = '6 7';
    for (const node of [loop, shaftPen, headPen]) {
      node.classList.add('pulse');
    }
  }, 900);
  const note = document.createElement('div');
  note.className = 'note pulse';
  note.innerHTML = 'up to the cloud…<br>explanation + reply';
  note.style.left = `${box.x + box.w + 30}px`;
  note.style.top = `${box.y - 38}px`;
  frame.append(note);
  fade([note], 700);
};
