import './ui/style.css';
import { loadConfig } from './config';
import { DEMO_INBOX, messageFromText } from './core/inbox';
import { needsEscalation } from './core/parse';
import { ESCALATION_THRESHOLD, type ScoredMessage } from './core/types';
import { createEngine, explainMessage, runInbox, scoreMessage, type EngineModels } from './engine';
import { initFirebase } from './firebase';
import {
  drawScribbles,
  playScan,
  queryApp,
  renderHeader,
  renderInbox,
  renderMessage,
  renderPaste,
  renderPlates,
  setNotice,
  showView,
  type AppElements,
} from './ui/views';

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
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const notify = (ctx: Ctx, text: string | null): void => setNotice(ctx.elements, text);

const fit = (elements: AppElements): void => {
  const scale = Math.min(window.innerWidth / 1440, window.innerHeight / 900, 1);
  elements.stage.style.transform = `scale(${scale})`;
};

const routeView = (ctx: Ctx): void => {
  const hash = window.location.hash || '#/inbox';
  if (hash.startsWith('#/message/')) {
    const id = hash.slice('#/message/'.length);
    const scored = ctx.state.slots.find((slot) => slot?.message.id === id)
      ?? (ctx.state.pasted?.message.id === id ? ctx.state.pasted : null);
    if (!scored) {
      window.location.hash = '#/inbox';
      return;
    }
    const position = Math.max(1, DEMO_INBOX.findIndex((message) => message.id === id) + 1);
    renderMessage(ctx.elements, scored, THRESHOLD, position);
    showView(ctx.elements, 'message');
    return;
  }
  if (hash === '#/paste') {
    renderPaste(ctx.elements, ctx.state.pasted, THRESHOLD, ctx.state.busy);
    showView(ctx.elements, 'paste');
    return;
  }
  showView(ctx.elements, 'inbox');
};

const onScored = (ctx: Ctx) => (scored: ScoredMessage, index: number, total: number): void => {
  ctx.state.slots[index] = scored;
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
  renderPaste(elements, state.pasted, THRESHOLD, true);
  try {
    let scored = await scoreMessage(engine, messageFromText(text));
    if (needsEscalation(scored.risk, THRESHOLD)) {
      scored = await explainMessage(engine, scored);
    }
    state.pasted = scored;
    renderPaste(elements, scored, THRESHOLD, false);
    notify(
      ctx,
      scored.cloudLatencyMs === null
        ? `Scored ${scored.risk}/100 on device, stayed there.`
        : `Scored ${scored.risk}/100 on device, explained in cloud (${scored.cloudLatencyMs} ms).`,
    );
  } catch (error) {
    notify(ctx, `Scoring failed: ${describe(error)}`);
    renderPaste(elements, state.pasted, THRESHOLD, false);
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
  const field = document.getElementById('paste-text') as HTMLTextAreaElement | null;
  const text = field?.value.trim() ?? '';
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
};

function boot(): void {
  const elements = queryApp();
  const config = loadConfig();
  const bundle = initFirebase(config);
  const ctx: Ctx = {
    elements,
    engine: bundle ? createEngine(bundle.ai, config.cloudModel) : null,
    state: { slots: DEMO_INBOX.map(() => null), pasted: null, busy: false },
  };

  fit(elements);
  window.addEventListener('resize', () => fit(elements));
  if (!ctx.engine) {
    notify(ctx, 'Firebase is not configured: copy .env.example to .env.local.');
    elements.scan.disabled = true;
  }

  renderInbox(elements, ctx.state.slots);
  renderHeader(elements, ctx.state.slots, THRESHOLD);
  window.addEventListener('hashchange', () => routeView(ctx));
  routeView(ctx);

  elements.scan.addEventListener('click', () => void scanInbox(ctx));
  elements.replay.addEventListener('click', () => playScan(elements));
  elements.frame.addEventListener('click', (event) => handleClick(ctx, event));
  document.fonts.ready.then(() => {
    if (ctx.state.slots.some((slot) => slot !== null)) {
      playScan(elements);
    }
  });
}

if (document.getElementById('stage')) {
  boot();
}
