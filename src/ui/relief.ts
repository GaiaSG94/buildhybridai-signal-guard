/**
 * Shared Relief kit (see G-DESIGN/STYLE.md): extrusion, marker strokes,
 * number rise, and the room (ceiling lamps + floor line) each planche sets.
 */
const NS = 'http://www.w3.org/2000/svg';

/** Stacked shadows: lit from the ceiling, then the cast shadow on the wall. */
export function extrude(
  side1: readonly number[],
  side2: readonly number[],
  depth = 22,
): string {
  const layers: string[] = [];
  for (let i = 1; i <= depth; i += 1) {
    const k = i / depth;
    const color = side1.map((v, j) => Math.round(v + (side2[j] - v) * k));
    layers.push(`${(i * 0.35).toFixed(2)}px ${(i * 0.9).toFixed(2)}px 0 rgb(${color.join(',')})`);
  }
  layers.push(
    `${(depth * 0.35 + 4).toFixed(2)}px ${(depth * 0.9 + 16).toFixed(2)}px 22px rgba(60,52,40,.28)`,
    `${(depth * 0.35 + 14).toFixed(2)}px ${(depth * 0.9 + 46).toFixed(2)}px 60px rgba(60,52,40,.20)`,
  );
  return layers.join(',');
}

export const PLASTER = (depth = 22): string => extrude([226, 224, 218], [178, 174, 166], depth);
export const FIRE = (depth = 22): string => extrude([214, 64, 26], [140, 36, 12], depth);

/** Boxes in relief (bars, panels fixed to the wall) — planche kit `box()`. */
export function reliefBox(
  node: HTMLElement,
  options: {
    face?: string;
    side?: string;
    bottom?: string;
    depth?: number;
  } = {},
): void {
  const { face = '#f4f3ef', side = '#cfcbc3', bottom = '#b9b5ac', depth = 14 } = options;
  node.style.background = face;
  const layers = Array.from({ length: depth }, (_, i) => {
    const k = (i + 1) * 0.35;
    const y = (i + 1) * 0.9;
    const color = i < depth - 1 ? side : bottom;
    return `${k.toFixed(2)}px ${y.toFixed(2)}px 0 ${color}`;
  });
  layers.push(
    `${(depth * 0.35 + 6).toFixed(2)}px ${(depth * 0.9 + 18).toFixed(2)}px 24px rgba(60,52,40,.25)`,
  );
  node.style.boxShadow = layers.join(',');
}

/* seeded jitter, so the felt strokes look hand-drawn and stay deterministic */
let seed = 5;
const random = (): number => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const jitter = (amount: number): number => (random() - 0.5) * 2 * amount;

/** The circling marker around a relief number or a marked word. */
export function loopPath(cx: number, cy: number, rx: number, ry: number): string {
  let d = '';
  const start = -2.2;
  for (let i = 0; i <= 56; i += 1) {
    const t = start + (i / 56) * (Math.PI * 2 + 0.7);
    const k = 1 + jitter(0.03);
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(t) * rx * k).toFixed(1)} ${(cy + Math.sin(t) * ry * k + i * 0.12).toFixed(1)}`;
  }
  return d;
}

/** The wavy marker under a call to action. */
export function wavePath(x: number, y: number, width: number): string {
  let d = `M${x - 4} ${y}`;
  for (let i = 0; i <= width + 8; i += 4) {
    d += `L${(x - 4 + i).toFixed(1)} ${(y + Math.sin(i / 5) * 2.6 + jitter(0.5)).toFixed(1)}`;
  }
  return d;
}

/** The rectangular marker around a domain. */
export function boxPath(x: number, y: number, w: number, h: number): string {
  const left = x - 6;
  const top = y - 4;
  const width = w + 12;
  const height = h + 8;
  const o = (): number => jitter(1.6);
  return [
    `M${left - 5} ${top + o()}L${left + width + 4} ${top + o()}`,
    `M${left + width + o()} ${top - 5}L${left + width + o()} ${top + height + 4}`,
    `M${left + width + 5} ${top + height + o()}L${left - 4} ${top + height + o()}`,
    `M${left + o()} ${top + height + 5}L${left + o()} ${top - 4}`,
  ].join(' ');
}

/** The grey tick for calm messages. */
export const tickPath = (x: number, y: number): string => `M${x} ${y}l9 11l22 -27`;

/** Curved marker arrow between two points (returned as two strokes). */
export function arrowPaths(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bend = 24,
): [string, string] {
  const mx = (x1 + x2) / 2 + bend;
  const my = (y1 + y2) / 2;
  const angle = Math.atan2(y2 - my, x2 - mx);
  const head = 13;
  return [
    `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`,
    `M${x2 - head * Math.cos(angle - 0.5)} ${y2 - head * Math.sin(angle - 0.5)}L${x2} ${y2}L${x2 - head * Math.cos(angle + 0.5)} ${y2 - head * Math.sin(angle + 0.5)}`,
  ];
}

export interface PenOptions {
  width?: number;
  color?: string;
  opacity?: number;
}

export function pen(svg: SVGElement, d: string, options: PenOptions = {}): SVGPathElement {
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', options.color ?? '#ee4f24');
  path.setAttribute('stroke-width', String(options.width ?? 2.6));
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  if (options.opacity !== undefined) {
    path.setAttribute('opacity', String(options.opacity));
  }
  svg.append(path);
  return path;
}

/** Draw every stroke of the svg with the felt-tip timing of STYLE.md §7. */
export function drawPens(paths: readonly SVGPathElement[], base = 1200, step = 160): void {
  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.transition = 'none';
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    window.setTimeout(() => {
      path.style.transition = 'stroke-dashoffset 600ms cubic-bezier(.5,0,.3,1)';
      path.style.strokeDashoffset = '0';
    }, base + index * step);
  });
}

/** The number rises into its relief and counts up (STYLE.md §7). */
export function rise(node: HTMLElement, target: number, delay = 0, pad = 2, dur = 900): void {
  node.style.transition = 'none';
  node.style.transform = 'translateY(14px)';
  node.style.opacity = '0';
  window.setTimeout(() => {
    node.style.transition = `transform ${dur}ms cubic-bezier(.2,.8,.2,1), opacity 600ms`;
    node.style.transform = 'none';
    node.style.opacity = '1';
    const started = performance.now();
    const tick = (): void => {
      const progress = Math.min(1, (performance.now() - started) / dur);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased)).padStart(pad, '0');
      if (progress < 1) {
        window.setTimeout(tick, 16);
      }
    };
    tick();
  }, delay);
}

export function fade(nodes: readonly Element[], base: number, step = 300): void {
  nodes.forEach((node, index) => {
    const el = node as HTMLElement;
    el.style.transition = 'none';
    el.style.opacity = '0';
    window.setTimeout(() => {
      el.style.transition = 'opacity 400ms';
      el.style.opacity = '1';
    }, base + index * step);
  });
}

export interface Elements {
  stage: HTMLElement;
  frame: HTMLElement;
}

/** Element position in frame coordinates (the stage is scaled to fit). */
export function rectOf(frame: HTMLElement, element: Element): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const frameBox = frame.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const k = frameBox.width / 1440;
  return {
    x: (box.left - frameBox.left) / k,
    y: (box.top - frameBox.top) / k,
    w: box.width / k,
    h: box.height / k,
  };
}

/** Attach the room to the frame for a given set of lamps and floor line. */
export function setRoom(
  elements: Elements,
  lamps: readonly number[],
  floor: number,
): void {
  elements.frame.style.setProperty('--floor', `${floor}px`);
  const wall = elements.frame.querySelector<HTMLElement>('.wall');
  if (wall) {
    wall.style.background = `${lamps
      .map((x) => `radial-gradient(260px 420px at ${x}px -40px,rgba(255,255,255,.93),rgba(255,255,255,0) 70%)`)
      .join(',')},linear-gradient(180deg,#e6e4df 0%,#dcdad4 70%,#d0cdc6 100%)`;
  }
  const nodes = [...elements.frame.querySelectorAll<HTMLElement>('.lamp')];
  nodes.forEach((lamp, index) => {
    if (index < lamps.length) {
      lamp.style.left = `${lamps[index]}px`;
      lamp.hidden = false;
    } else {
      lamp.hidden = true;
    }
  });
}
