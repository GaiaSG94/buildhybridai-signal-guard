import './ui/style.css';
import { loadConfig } from './config';
import { DEMO_INBOX, messageFromText } from './core/inbox';
import { needsEscalation } from './core/parse';
import { SessionLog } from './core/session';
import { ESCALATION_THRESHOLD, type ScoredMessage } from './core/types';
import { createEngine, explainMessage, runInbox, scoreMessage, type EngineModels } from './engine';
import { createDemoEngine } from './core/demo';
import { initFirebase } from './firebase';
import { setRoom } from './ui/relief';
import {
  drawScribbles,
  playScan,
  queryApp,
  renderHeader,
  renderInbox,
  renderPlates,
  setNotice,
  showView,
  type AppElements,
} from './ui/views';
import { renderMessagePage } from './ui/message';
import {
  pasteClear,
  pasteCountChars,
  pasteReading,
  pasteScored,
  pasteText,
  renderPastePage,
} from './ui/paste';
import { renderDashboard } from './ui/dashboard';

const THRESHOLD = ESCALATION_THRESHOLD;

interface State {
  slots: (ScoredMessage | null)[];
  pasted: ScoredMessage | null;
  busy: boolean;
}

interface Ctx {
  elements: AppElements;
  engine: EngineModels | null;
  state: State;
  session: SessionLog;
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const notify = (ctx: Ctx, text: string | null): void => setNotice(ctx.elements, text);

const fit = (elements: AppElements): void => {
  const scale = Math.min(window.innerWidth / 1440, window.innerHeight / 900, 1);
  elements.stage.style.transform = `scale(${scale})`;
};

type ViewName = 'inbox' | 'message' | 'paste' | 'dashboard';

/** Each page sets its room the way its planche does (lamps + floor line). */
const ROOMS: Record<ViewName, { lamps: readonly number[]; floor: number }> = {
  inbox: { lamps: [245, 575, 905, 1235], floor: 660 },
  message: { lamps: [290, 700, 1000, 1300], floor: 700 },
  paste: { lamps: [240, 640, 1150], floor: 700 },
  dashboard: { lamps: [245, 575, 905, 1235], floor: 700 },
};

const viewOf = (hash: string): ViewName => {
  if (hash.startsWith('#/message/')) {
    return 'message';
  }
  if (hash === '#/dashboard') {
    return 'dashboard';
  }
  return hash === '#/paste' ? 'paste' : 'inbox';
};

const applyRoom = (elements: AppElements, view: ViewName): void => {
  const room = ROOMS[view];
  setRoom(elements, room.lamps, room.floor);
};

const routeView = (ctx: Ctx): void => {
  const hash = window.location.hash || '#/inbox';
  applyRoom(ctx.elements, viewOf(hash));
  if (hash.startsWith('#/message/')) {
    const id = hash.slice('#/message/'.length);
    const scored = ctx.state.slots.find((slot) => slot?.message.id === id)
      ?? (ctx.state.pasted?.message.id === id ? ctx.state.pasted : null);
    if (!scored) {
      window.location.hash = '#/inbox';
      return;
    }
    const position = Math.max(1, DEMO_INBOX.findIndex((message) => message.id === id) + 1);
    const origin = ctx.state.slots.some((slot) => slot?.message.id === id) ? 'Inbox' : 'Paste';
    renderMessagePage(ctx.elements.views.message, ctx.elements.frame, scored, THRESHOLD, position, origin);
    showView(ctx.elements, 'message');
    return;
  }
  if (hash === '#/paste') {
    renderPastePage(ctx.elements.views.paste, ctx.state.pasted, ctx.state.busy);
    showView(ctx.elements, 'paste');
    return;
  }
  if (hash === '#/dashboard') {
    renderDashboard(ctx.elements.views.dashboard, ctx.session.stats(THRESHOLD));
    showView(ctx.elements, 'dashboard');
    return;
  }
  showView(ctx.elements, 'inbox');
};

const onScored = (ctx: Ctx) => (scored: ScoredMessage, index: number, total: number): void => {
  ctx.state.slots[index] = scored;
  ctx.session.record(scored);
  renderPlates(ctx.elements, ctx.state.slots);
  notify(ctx, `Scoring ${index + 1}/${total}…`);
};

const scanInbox = async (ctx: Ctx): Promise<void> => {
  if (!ctx.engine || ctx.state.busy) {
    return;
  }
  const { elements, engine, state } = ctx;
  state.busy = true;
  state.slots = DEMO_INBOX.map(() => null);
  elements.scan.disabled = true;
  elements.replay.hidden = true;
  notify(ctx, null);
  renderInbox(elements, state.slots);
  renderHeader(elements, state.slots, THRESHOLD);
  try {
    await runInbox(engine, DEMO_INBOX, { threshold: THRESHOLD, onScored: onScored(ctx) });
    renderInbox(elements, state.slots);
    drawScribbles(elements, state.slots);
    const metrics = renderHeader(elements, state.slots, THRESHOLD);
    playScan(elements);
    notify(
      ctx,
      `Done: ${metrics.local} local analyses, ${metrics.cloud} cloud calls (${metrics.localShare}% of scores computed on device).`,
    );
  } catch (error) {
    notify(ctx, `Scoring failed: ${describe(error)}`);
  } finally {
    state.busy = false;
    elements.scan.disabled = false;
    elements.replay.hidden = false;
  }
};

const scorePasted = async (ctx: Ctx, text: string): Promise<void> => {
  if (!ctx.engine || ctx.state.busy) {
    return;
  }
  const { elements, engine, state } = ctx;
  state.busy = true;
  renderPastePage(elements.views.paste, state.pasted, true);
  pasteReading(elements.views.paste);
  try {
    let scored = await scoreMessage(engine, messageFromText(text));
    state.pasted = scored;
    ctx.session.record(scored);
    pasteScored(elements.views.paste, elements.frame, scored, THRESHOLD);
    if (needsEscalation(scored.risk, THRESHOLD)) {
      scored = await explainMessage(engine, scored);
      state.pasted = scored;
      ctx.session.record(scored);
      notify(
        ctx,
        `Scored ${scored.risk}/100 on device, explained in cloud (${scored.cloudLatencyMs} ms).`,
      );
      window.location.hash = '#/message/pasted';
      return;
    }
    notify(ctx, `Scored ${scored.risk}/100 on device, stayed there.`);
  } catch (error) {
    notify(ctx, `Scoring failed: ${describe(error)}`);
    renderPastePage(elements.views.paste, state.pasted, false);
  } finally {
    state.busy = false;
  }
};

const copyReply = (ctx: Ctx): void => {
  const text = document.getElementById('reply')?.textContent ?? '';
  if (!text) {
    return;
  }
  void navigator.clipboard.writeText(text).then(
    () => notify(ctx, 'Reply copied.'),
    () => notify(ctx, 'Copy failed: select the text manually.'),
  );
};

const onPasteClick = (ctx: Ctx): void => {
  const text = pasteText(ctx.elements.views.paste);
  if (!text) {
    notify(ctx, 'Paste a message first.');
    return;
  }
  notify(ctx, null);
  void scorePasted(ctx, text);
};

const handleClick = (ctx: Ctx, event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  const plate = target.closest<HTMLElement>('[data-message]');
  if (plate) {
    window.location.hash = `#/message/${plate.dataset['message']}`;
    return;
  }
  if (target.closest('[data-copy]')) {
    copyReply(ctx);
    return;
  }
  if (target.closest('#paste-run')) {
    onPasteClick(ctx);
  }
  if (target.closest('#paste-clear')) {
    pasteClear(ctx.elements.views.paste);
  }
};

function boot(): void {
  const elements = queryApp();
  const config = loadConfig();
  const bundle = initFirebase(config);
  const demo = new URLSearchParams(window.location.search).has('demo');
  const ctx: Ctx = {
    elements,
    engine: demo ? createDemoEngine() : bundle ? createEngine(bundle.ai, config.cloudModel) : null,
    state: { slots: DEMO_INBOX.map(() => null), pasted: null, busy: false },
    session: new SessionLog(),
  };

  fit(elements);
  window.addEventListener('resize', () => fit(elements));
  if (!ctx.engine) {
    notify(ctx, demo ? 'Demo engine failed to load.' : 'Firebase is not configured: copy .env.example to .env.local.');
    elements.scan.disabled = true;
  } else if (demo) {
    notify(ctx, 'Demo mode: deterministic offline scores, no network.');
  }

  renderInbox(elements, ctx.state.slots);
  renderHeader(elements, ctx.state.slots, THRESHOLD);
  window.addEventListener('hashchange', () => routeView(ctx));
  routeView(ctx);

  elements.scan.addEventListener('click', () => void scanInbox(ctx));
  elements.replay.addEventListener('click', () => playScan(elements));
  elements.frame.addEventListener('click', (event) => handleClick(ctx, event));
  elements.frame.addEventListener('input', () => pasteCountChars(elements.views.paste));
  document.fonts.ready.then(() => {
    if (ctx.state.slots.some((slot) => slot !== null)) {
      playScan(elements);
    }
  });
}

if (document.getElementById('stage')) {
  boot();
}
