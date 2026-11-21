import { findSignals } from '../core/signals';
import { type SessionStats } from '../core/session';
import { type ScoredMessage } from '../core/types';
import { FIRE, PLASTER, drawPens, fade, loopPath, pen, rectOf, reliefBox, rise, tickPath } from './relief';
import { esc } from './views';
import './dashboard.css';

const duration = (ms: number | null): string => {
  if (ms === null) {
    return '-';
  }
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
};

const report = (entry: ScoredMessage | undefined, index: number): string => {
  if (!entry) {
    return `<section class="plaque report"><span class="sc">--</span><div class="k"><span>Report · waiting</span><span class="c">—</span></div><h3>Awaiting a flagged message</h3><p>Run the inbox or paste a message: every flagged analysis pins its cloud explanation here.</p></section>`;
  }
  const signals = findSignals(entry.message.body).slice(0, 2).map(esc).join(' · ');
  const origin = entry.message.id === 'pasted' ? 'pasted' : `inbox ${String(index + 1).padStart(2, '0')}`;
  return [
    `<section class="plaque report"><span class="sc">${entry.risk}</span>`,
    `<div class="k"><span>Report · ${origin}</span><span class="c">cloud ${duration(entry.cloudLatencyMs)}</span></div>`,
    `<h3>${esc(entry.message.sender)}<span>${esc(entry.message.handle)}</span></h3>`,
    `<p>${entry.explanation?.why ? esc(entry.explanation.why) : signals || 'Flagged locally; the cloud explanation is on its way.'}</p>`,
    `</section>`,
  ].join('');
};

/** Dashboard page, faithful to G-DESIGN/planches/relief/04-dashboard.html. */
export const renderDashboard = (view: HTMLElement, stats: SessionStats): void => {
  const values = [stats.total, stats.cloud, stats.stayed, stats.medianLocalMs ?? 0];
  view.innerHTML = [
    `<div class="dashboard-head"><p class="kicker">${
      stats.total > 0 ? 'This session · live values' : 'This session · no analyses yet — run Score the inbox'
    }</p></div>`,
    statMarkup(values),
    `<div class="dist"><p class="kicker">Local risk levels · ${stats.total} analyses</p>${barMarkup(stats)}</div>`,
    `<div class="reports">${stats.reports.map((entry, i) => report(entry, i)).join('') || report(undefined, 0)}</div>`,
    `<svg class="dashboard-marker" id="dmark" width="1440" height="900"></svg>`,
    `<span class="tag">SIGNAL GUARD · DASHBOARD · RELIEF · FICTIONAL DEMO</span>`,
  ].join('');
  animateDashboard(view, stats, values);
};

const LABELS: readonly [string, string, 'plaster' | 'fire' | 'ms'][] = [
  ['local analyses', 'on this device', 'plaster'],
  ['cloud calls', 'only at 70 +', 'fire'],
  ['messages that never', 'left this device', 'plaster'],
  ['median local score time', 'cloud ≈ 1.3 s when needed', 'ms'],
];

const statMarkup = (values: number[]): string =>
  values
    .map((value, index) => {
      const [label, sub, kind] = LABELS[index];
      const relief = index === 3 ? String(value) : String(value).padStart(2, '0');
      return `<div class="stat stat-${index}" data-v="${value}"><div class="relief ${
        kind === 'fire' ? 'hot' : ''
      }" data-target="${value}">${relief}${kind === 'ms' ? '<small>ms</small>' : ''}</div><span class="u">${
        kind === 'fire' ? `<b>${label}</b><br>${sub}` : `${label}<br>${sub}`
      }</span></div>`;
    })
    .join('');

const barMarkup = (stats: SessionStats): string => {
  const rows: [string, string, number, boolean][] = [
    ['Low', '0 – 34', stats.levels.low, false],
    ['Medium', '35 – 69', stats.levels.medium, false],
    ['High', '70 – 100 · cloud', stats.levels.high, true],
  ];
  return rows
    .map(
      ([name, range, count, hot]) =>
        `<div class="bar-row ${hot ? 'hot' : ''}" data-n="${count}"><span class="lb">${name}<small>${range}</small></span><div class="track"><i class="bar"></i></div><span class="v">${count}</span></div>`,
    )
    .join('');
};

const animateDashboard = (view: HTMLElement, stats: SessionStats, values: number[]): void => {
  const nodes = [...view.querySelectorAll<HTMLElement>('.stat .relief')];
  nodes.forEach((node, index) => {
    node.style.textShadow = index === 1 ? FIRE(20) : PLASTER(20);
    rise(node, values[index], 150 + index * 170, index === 3 ? 1 : 2);
  });
  const max = Math.max(stats.total, 1);
  view.querySelectorAll<HTMLElement>('.bar-row').forEach((row, index) => {
    const bar = row.querySelector<HTMLElement>('.bar');
    if (!bar) {
      return;
    }
    const hot = row.classList.contains('hot');
    reliefBox(bar, hot
      ? { face: '#f2582b', side: '#c4441c', bottom: '#8c240c', depth: 12 }
      : { face: '#f4f3ef', side: '#d3cfc7', bottom: '#b5b1a8', depth: 12 });
    bar.style.transition = 'none';
    bar.style.width = '0px';
    window.setTimeout(() => {
      bar.style.transition = 'width 1000ms cubic-bezier(.2,.8,.2,1)';
      bar.style.width = `${(Number(row.dataset['n'] ?? 0) / max) * 100}%`;
    }, 600 + index * 180);
  });
  drawDashboardMarks(view, stats);
};

/** Felt marks: circle the cloud calls, dot the medium bar, tick what stayed. */
const drawDashboardMarks = (view: HTMLElement, stats: SessionStats): void => {
  const svg = view.querySelector<SVGSVGElement>('#dmark');
  const frame = view.closest<HTMLElement>('#frame');
  if (!svg || !frame || stats.total === 0) {
    return;
  }
  const paths: SVGPathElement[] = [];
  const notes: Element[] = [];
  const addNote = (text: string, box: { x: number; y: number; w: number; h: number }, dx: number, dy: number): void => {
    const note = document.createElement('div');
    note.className = 'note';
    note.innerHTML = text;
    note.style.left = `${box.x + box.w + dx}px`;
    note.style.top = `${box.y + dy}px`;
    frame.append(note);
    notes.push(note);
  };

  const cloud = view.querySelector<HTMLElement>('.stat-1 .relief');
  if (cloud && stats.cloud > 0) {
    const r = rectOf(frame, cloud);
    paths.push(pen(svg, loopPath(r.x + r.w / 2 + 4, r.y + r.h / 2 + 2, r.w / 2 + 10, r.h / 2 - 20)));
    addNote(`${stats.cloud} of ${stats.total}<br>went up`, r, 24, 18);
  }
  const stayed = view.querySelector<HTMLElement>('.stat-2 .relief');
  if (stayed && stats.stayed > 0) {
    const r = rectOf(frame, stayed);
    paths.push(pen(svg, tickPath(r.x + r.w - 30, r.y + 40), { color: '#2a2a2a', opacity: 0.55, width: 2.4 }));
  }
  const rows = view.querySelectorAll<HTMLElement>('.bar-row');
  const medium = rows[1]?.querySelector<HTMLElement>('.bar');
  if (medium && stats.levels.medium > 0) {
    const r = rectOf(frame, medium);
    const dotted = pen(svg, loopPath(r.x + r.w / 2 + 6, r.y + r.h / 2, r.w / 2 + 26, r.h / 2 + 12), { width: 2 });
    paths.push(dotted);
    window.setTimeout(() => {
      dotted.style.strokeDasharray = '5 6';
    }, 2800);
    addNote('medium: kept on device,<br>worth a second look', r, 40, 6);
  }
  drawPens(paths, 2150, 250);
  fade(notes, 2600, 300);
};
