import {Circle, Line, Node, Rect, Txt, View2D, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, waitFor} from '@revideo/core';
import {FONT, P, addChips, reveal} from './kit';
import {makeScaffold} from './scaffold';
import {colors} from '../theme';

// A JSON-driven scene: each beat names a `visual` (question, chips, flow, code, compare, stat) and
// supplies its items. Items appear paced to the beat's length, so narration and visuals stay in step.
const MONO = 'Menlo, Courier New, monospace';
const PALETTE: Record<string, string> = {
  blue: colors.request, green: colors.ok, yellow: colors.token, red: colors.danger,
  pink: '#f472b6', muted: colors.muted, text: colors.text,
};
const col = (n?: string) => PALETTE[n ?? 'blue'] ?? n ?? colors.request;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Kit = {sfx: (n: string, v?: number) => void; dot: (p: P[], c: string, t?: number) => ThreadGenerator; badge: (t: string, c: string) => ThreadGenerator};
type Visual = {show: (budget: number) => ThreadGenerator; hide: () => ThreadGenerator};
type Any = any; // beat JSON is loosely typed on purpose

function heading(view: View2D, text: string | undefined, els: Any[]) {
  if (!text) return () => waitFor(0);
  const r = createRef<Txt>();
  view.add(<Txt ref={r} fontFamily={FONT} text={text} fill={colors.muted} fontSize={44} fontWeight={800}
    y={-470} opacity={0} />);
  els.push(r());
  return () => r().opacity(1, 0.3);
}
const hider = (els: Any[]) => () => all(...els.map(e => e.opacity(0, 0.3)));

function buildQuestion(view: View2D, kit: Kit, beat: Any): Visual {
  const box = createRef<Rect>();
  view.add(
    <Rect ref={box} width={940} height={460} radius={30} fill={colors.panel} stroke={colors.token} lineWidth={6}
      y={-100} opacity={0}>
      <Txt fontFamily={FONT} text="INTERVIEW QUESTION" fill={colors.token} fontSize={38} fontWeight={800} y={-170} />
      <Txt fontFamily={FONT} text={beat.items[0]} fill={colors.text} fontSize={46} fontWeight={800}
        width={840} textWrap textAlign="center" y={20} />
    </Rect>,
  );
  return {
    show: function* () { kit.sfx('whoosh', 0.5); yield* box().opacity(1, 0.5); },
    hide: hider([box()]),
  };
}

function buildChips(view: View2D, kit: Kit, beat: Any): Visual {
  const items: [string, string][] = beat.items.map(([t, c]: [string, string]) => [t, col(c)]);
  const n = items.length;
  const step = n <= 4 ? 135 : 112;
  const chips = addChips(view, items, -50 - ((n - 1) * step) / 2, step, {fontSize: 40, h: 96});
  const els: Any[] = [...chips];
  const showHead = heading(view, beat.heading, els);
  return {
    show: function* (budget: number) {
      yield* showHead();
      kit.sfx('whoosh', 0.4);
      const w = clamp((budget - 0.3 * n) / n, 0.4, 2.6);
      yield* reveal(chips, kit.sfx, Array(n).fill(w));
    },
    hide: hider(els),
  };
}

function buildFlow(view: View2D, kit: Kit, beat: Any): Visual {
  const nodes: [string, string, string][] = beat.items.map(([t, c, s]: [string, string, string]) => [t, col(c), s ?? '']);
  const n = nodes.length;
  const step = 150;
  const y0 = -50 - ((n - 1) * step) / 2;
  const boxes: Rect[] = [];
  const els: Any[] = [];
  nodes.forEach(([t, c, sub], i) => {
    const r = createRef<Rect>();
    view.add(
      <Rect ref={r} width={640} height={104} radius={22} fill={colors.panel} stroke={c} lineWidth={6}
        y={y0 + i * step} opacity={0}>
        <Txt fontFamily={FONT} text={t} fill={c} fontSize={40} fontWeight={800} y={sub ? -18 : 0} />
        {sub ? <Txt fontFamily={FONT} text={sub} fill={colors.muted} fontSize={28} y={26} /> : null}
      </Rect>,
    );
    boxes.push(r());
    els.push(r());
  });
  const showHead = heading(view, beat.heading, els);
  const pt = (i: number, dy: number): P => [0, y0 + i * step + dy];
  return {
    show: function* (budget: number) {
      yield* showHead();
      kit.sfx('whoosh', 0.4);
      for (let i = 0; i < n; i++) {
        kit.sfx(`plink${i % 5}`, 0.4);
        yield* boxes[i].opacity(1, 0.3);
        yield* waitFor(0.1);
      }
      const passTime = (n - 1) * 0.75;
      const passes = Math.max(1, Math.min(2, Math.floor((budget - n * 0.4 - 0.4) / passTime)));
      for (let p = 0; p < passes; p++) {
        for (let i = 0; i < n - 1; i++) {
          kit.sfx('blip', 0.3);
          yield chain(boxes[i].scale(1.05, 0.1), boxes[i].scale(1, 0.12));
          yield* kit.dot([pt(i, 55), pt(i + 1, -55)], nodes[i + 1][1], 0.55);
          yield* waitFor(0.15);
        }
        yield* chain(boxes[n - 1].scale(1.05, 0.1), boxes[n - 1].scale(1, 0.12));
      }
    },
    hide: hider(els),
  };
}

function buildCode(view: View2D, kit: Kit, beat: Any): Visual {
  const lines: [string, string][] = beat.items.map(([t, c]: [string, string]) => [t, col(c ?? 'text')]);
  const n = lines.length;
  const lh = 62;
  const h = n * lh + 70;
  const panel = createRef<Rect>();
  const txts: Txt[] = [];
  view.add(
    <Rect ref={panel} width={960} height={h} radius={26} fill={colors.panel} stroke={colors.empty} lineWidth={6}
      y={-80} opacity={0}>
      {lines.map(([t, c], i) => {
        const r = createRef<Txt>();
        const node = <Txt ref={r} fontFamily={MONO} text={t} fill={c} fontSize={29} fontWeight={800} offsetX={-1}
          x={-440} y={-h / 2 + 52 + i * lh} opacity={0} />;
        txts.push(r());
        return node;
      })}
    </Rect>,
  );
  const els: Any[] = [panel(), ...txts];
  const showHead = heading(view, beat.heading, els);
  return {
    show: function* (budget: number) {
      yield* showHead();
      kit.sfx('whoosh', 0.4);
      yield* panel().opacity(1, 0.3);
      const w = clamp((budget - 0.3 - 0.25 * n) / n, 0.3, 2.2);
      for (let i = 0; i < n; i++) {
        kit.sfx(`plink${i % 5}`, 0.35);
        yield* txts[i].opacity(1, 0.25);
        yield* waitFor(w);
      }
    },
    hide: hider(els),
  };
}

function buildCompare(view: View2D, kit: Kit, beat: Any): Visual {
  const sides = [beat.left, beat.right];
  const els: Any[] = [];
  const groups: Rect[][] = [[], []];
  const panels: Rect[] = [];
  sides.forEach((side: Any, k: number) => {
    const c = col(side.color);
    const x = (k ? 1 : -1) * 262;
    const p = createRef<Rect>();
    view.add(
      <Rect ref={p} width={500} height={620} radius={28} fill={colors.panel} stroke={c} lineWidth={6}
        position={[x, -40]} opacity={0}>
        <Txt fontFamily={FONT} text={side.title} fill={c} fontSize={44} fontWeight={800} y={-250} />
      </Rect>,
    );
    panels.push(p());
    els.push(p());
    side.items.forEach((t: string, i: number) => {
      const r = createRef<Rect>();
      view.add(
        <Rect ref={r} width={440} height={86} radius={18} fill={colors.bg} stroke={c} lineWidth={3}
          position={[x, -40 - 150 + i * 104]} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.text} fontSize={30} fontWeight={700} width={410} textWrap textAlign="center" />
        </Rect>,
      );
      groups[k].push(r());
      els.push(r());
    });
  });
  const showHead = heading(view, beat.heading, els);
  return {
    show: function* (budget: number) {
      yield* showHead();
      const total = groups[0].length + groups[1].length;
      const w = clamp((budget - 0.6 - 0.25 * total) / total, 0.3, 1.5);
      for (let k = 0; k < 2; k++) {
        kit.sfx('whoosh', 0.3);
        yield* panels[k].opacity(1, 0.3);
        for (let i = 0; i < groups[k].length; i++) {
          kit.sfx(`plink${(i + k) % 5}`, 0.35);
          yield* groups[k][i].opacity(1, 0.25);
          yield* waitFor(w);
        }
      }
    },
    hide: hider(els),
  };
}

function buildStat(view: View2D, kit: Kit, beat: Any): Visual {
  const cards: Rect[] = [];
  const els: Any[] = [];
  beat.items.forEach(([label, value, c]: [string, string, string], i: number) => {
    const color = col(c);
    const r = createRef<Rect>();
    view.add(
      <Rect ref={r} width={440} height={250} radius={26} fill={colors.panel} stroke={color} lineWidth={6}
        position={[(i % 2 ? 1 : -1) * 235, -190 + Math.floor(i / 2) * 290]} opacity={0}>
        <Txt fontFamily={FONT} text={label} fill={colors.muted} fontSize={34} fontWeight={700} y={-70} />
        <Txt fontFamily={FONT} text={value} fill={color} fontSize={76} fontWeight={800} y={25} />
      </Rect>,
    );
    cards.push(r());
    els.push(r());
  });
  const showHead = heading(view, beat.heading, els);
  return {
    show: function* (budget: number) {
      yield* showHead();
      kit.sfx('whoosh', 0.4);
      const w = clamp((budget - 0.3 * cards.length) / cards.length, 0.4, 2);
      for (let i = 0; i < cards.length; i++) {
        kit.sfx(`plink${i % 5}`, 0.45);
        yield* all(cards[i].opacity(1, 0.3), chain(cards[i].scale(1.05, 0.12), cards[i].scale(1, 0.15)));
        yield* waitFor(w);
      }
    },
    hide: hider(els),
  };
}


// ---- stage: a small animation DSL --------------------------------------------------------------
// beat.actors: boxes, nodes, labels, links, cell rows (arrays / stacks / queues), code panels, consoles.
// beat.steps: show, hide, send, flash, text, stroke, fill, move, moveto, swap, line, log, badge, wait, pulse.
// Targets are "id" or "id:index" (a single cell).
function buildStage(view: View2D, kit: Kit, beat: Any): Visual {
  type A = {kind: string; el: Any; w: number; h: number; box?: Any; txt?: Txt; sub?: Txt; cells: Rect[]; cellTxt: Txt[];
    size: number; gap: number; dir: string; n: number; hl?: Rect; lines: Txt[]; lh: number; logs: Txt[]; logN: number};
  const Z: number = beat.zoom ?? 1.15;
  const rootRef = createRef<Node>();
  view.add(<Node ref={rootRef} scale={Z} />);
  const root = rootRef();
  const specs: Any[] = beat.actors;
  const byId: Record<string, Any> = {};
  specs.forEach(sp => (byId[sp.id] = sp));
  const actors: Record<string, A> = {};
  const els: Any[] = [];

  const cellOff = (sp: Any, i: number): [number, number] => {
    const size = sp.size ?? 90, gap = sp.gap ?? 10, n = (sp.values ?? []).length;
    const d = (i - (n - 1) / 2) * (size + gap);
    return sp.dir === 'v' ? [0, d] : [d, 0];
  };
  const initPos = (spec: string): [number, number] => {
    const [id, idx] = spec.split(':');
    const sp = byId[id];
    if (idx === undefined) return [sp.x ?? 0, sp.y ?? 0];
    const [dx, dy] = cellOff(sp, +idx);
    return [(sp.x ?? 0) + dx, (sp.y ?? 0) + dy];
  };

  for (const sp of specs) {
    const kind = sp.kind ?? 'box';
    const c = col(sp.color);
    const a: A = {kind, el: null, w: sp.w ?? 300, h: sp.h ?? 110, cells: [], cellTxt: [], size: sp.size ?? 90,
      gap: sp.gap ?? 10, dir: sp.dir ?? 'h', n: (sp.values ?? []).length, lines: [], lh: 50, logs: [], logN: 0};
    actors[sp.id] = a;
    const x = sp.x ?? 0, y = sp.y ?? 0;
    if (kind === 'link') {
      const ln = createRef<Line>();
      root.add(<Line ref={ln} points={[initPos(sp.from), initPos(sp.to)]} stroke={c} lineWidth={5}
        lineDash={sp.dashed ? [14, 12] : undefined} opacity={0} />);
      a.el = ln();
      els.push(ln());
      continue;
    }
    const nd = createRef<Node>();
    const bx = createRef<Any>();
    const tx = createRef<Txt>();
    const sb = createRef<Txt>();
    if (kind === 'box') {
      root.add(
        <Node ref={nd} position={[x, y]} opacity={0}>
          <Rect ref={bx} width={a.w} height={a.h} radius={22} fill={colors.panel} stroke={c} lineWidth={6}>
            <Txt ref={tx} fontFamily={FONT} text={sp.text ?? ''} fill={c} fontSize={sp.fs ?? 38} fontWeight={800}
              y={sp.sub ? -20 : 0} />
            {sp.sub ? <Txt ref={sb} fontFamily={FONT} text={sp.sub} fill={colors.muted} fontSize={26} y={26} /> : null}
          </Rect>
        </Node>,
      );
    } else if (kind === 'node') {
      const r = sp.r ?? 60;
      root.add(
        <Node ref={nd} position={[x, y]} opacity={0}>
          <Circle ref={bx} size={r * 2} fill={colors.panel} stroke={c} lineWidth={6}>
            <Txt ref={tx} fontFamily={FONT} text={sp.text ?? ''} fill={colors.text} fontSize={sp.fs ?? 40} fontWeight={800} />
          </Circle>
        </Node>,
      );
    } else if (kind === 'label') {
      root.add(
        <Node ref={nd} position={[x, y]} opacity={0}>
          <Txt ref={tx} fontFamily={FONT} text={sp.text ?? ''} fill={c} fontSize={sp.fs ?? 34} fontWeight={800} />
        </Node>,
      );
    } else if (kind === 'cells') {
      const cells: Any[] = [];
      (sp.values as Any[]).forEach((v, i) => {
        const r = createRef<Rect>();
        const t = createRef<Txt>();
        const [dx, dy] = cellOff(sp, i);
        cells.push(
          <Rect ref={r} width={a.size} height={a.size} radius={14} fill={colors.panel} stroke={c} lineWidth={5}
            position={[dx, dy]}>
            <Txt ref={t} fontFamily={FONT} text={String(v)} fill={colors.text} fontSize={sp.fs ?? 36} fontWeight={800} />
          </Rect>,
        );
        a.cells.push(r());
        a.cellTxt.push(t());
        if (sp.index) {
          cells.push(
            <Txt fontFamily={FONT} text={String(i)} fill={colors.muted} fontSize={24} fontWeight={700}
              position={[dx, dy + a.size / 2 + 22]} />,
          );
        }
      });
      const titleY = sp.dir === 'v' ? -((a.n * (a.size + a.gap)) / 2 + 28) : -(a.size / 2 + 34);
      root.add(
        <Node ref={nd} position={[x, y]} opacity={0}>
          {sp.title ? <Txt fontFamily={FONT} text={sp.title} fill={colors.muted} fontSize={30} fontWeight={800} y={titleY} /> : null}
          {cells}
        </Node>,
      );
    } else if (kind === 'code') {
      const lines: [string, string][] = sp.lines.map(([t, cc]: [string, string]) => [t, col(cc ?? 'text')]);
      const h = lines.length * a.lh + 50;
      const hl = createRef<Rect>();
      const lineEls: Any[] = lines.map(([t, cc], i) => {
        const r = createRef<Txt>();
        const el = <Txt ref={r} fontFamily={MONO} text={t} fill={cc} fontSize={sp.fs ?? 28} fontWeight={800}
          offsetX={-1} x={-a.w / 2 + 24} y={-h / 2 + 25 + a.lh / 2 + i * a.lh} />;
        a.lines.push(r());
        return el;
      });
      a.h = h;
      root.add(
        <Node ref={nd} position={[x, y]} opacity={0}>
          <Rect ref={bx} width={a.w} height={h} radius={24} fill={colors.panel} stroke={colors.empty} lineWidth={6}>
            <Rect ref={hl} width={a.w - 24} height={a.lh - 4} radius={10} fill={colors.request + '40'} opacity={0}
              y={-h / 2 + 25 + a.lh / 2} />
            {lineEls}
          </Rect>
        </Node>,
      );
      a.hl = hl();
    } else if (kind === 'console') {
      const max = sp.max ?? 6;
      const logEls: Any[] = [];
      for (let i = 0; i < max; i++) {
        const r = createRef<Txt>();
        logEls.push(<Txt ref={r} fontFamily={MONO} text="" fill={colors.ok} fontSize={30} fontWeight={800} offsetX={-1}
          x={-a.w / 2 + 24} y={-a.h / 2 + 70 + i * 46} opacity={0} />);
        a.logs.push(r());
      }
      root.add(
        <Node ref={nd} position={[x, y]} opacity={0}>
          <Rect ref={bx} width={a.w} height={a.h} radius={24} fill={colors.bg} stroke={colors.ok} lineWidth={5}>
            <Txt fontFamily={FONT} text={sp.title ?? 'output'} fill={colors.muted} fontSize={26} fontWeight={700}
              y={-a.h / 2 + 28} />
            {logEls}
          </Rect>
        </Node>,
      );
    }
    a.el = nd();
    a.box = bx();
    a.txt = tx();
    a.sub = sb();
    els.push(nd());
  }

  const posOf = (spec: string): P => {
    const [id, idx] = spec.split(':');
    const a = actors[id];
    const base = a.el.position();
    if (idx === undefined) return [base.x * Z, base.y * Z];
    const [dx, dy] = cellOff(byId[id], +idx);
    return [(base.x + dx) * Z, (base.y + dy) * Z];
  };
  const cellOf = (spec: string) => {
    const [id, idx] = spec.split(':');
    return idx === undefined ? null : {rect: actors[id].cells[+idx], txt: actors[id].cellTxt[+idx]};
  };
  const shape = (spec: string): Any => {
    const c = cellOf(spec);
    return c ? c.rect : actors[spec.split(':')[0]].box;
  };

  const durOf = (st: Any): number => {
    const t = st.t;
    switch (st.do) {
      case 'show': case 'hide': return 0.5;
      case 'send': return (t ?? 0.6) + 0.1;
      case 'flash': case 'line': case 'log': case 'badge': case 'pulse': return 0.4;
      case 'swap': return 0.6;
      case 'move': case 'moveto': return (t ?? 0.5) + 0.05;
      case 'wait': return t ?? 0.5;
      default: return 0.25;
    }
  };

  function* exec(st: Any): ThreadGenerator {
    switch (st.do) {
      case 'show': {
        kit.sfx('whoosh', 0.3);
        yield* all(...st.ids.map((i: string) => actors[i].el.opacity(1, 0.4)));
        break;
      }
      case 'hide': yield* all(...st.ids.map((i: string) => actors[i].el.opacity(0, 0.35))); break;
      case 'send':
        kit.sfx('blip', 0.3);
        yield* kit.dot([posOf(st.from), posOf(st.to)], col(st.color ?? 'blue'), st.t ?? 0.6);
        break;
      case 'flash': {
        const sh = shape(st.id);
        kit.sfx('plink1', 0.35);
        const c = col(st.color ?? 'green');
        yield* all(chain(sh.fill(c, 0.12), sh.fill(colors.panel, 0.25)), chain(sh.scale(1.1, 0.12), sh.scale(1, 0.15)));
        break;
      }
      case 'pulse':
        yield* all(...st.ids.map((i: string) => chain(shape(i).scale(1.1, 0.15), shape(i).scale(1, 0.2))));
        break;
      case 'text': {
        const cell = cellOf(st.id);
        const t = cell ? cell.txt : actors[st.id].txt;
        t!.text(String(st.text));
        if (st.color) t!.fill(col(st.color));
        break;
      }
      case 'sub': actors[st.id].sub!.text(String(st.text)); break;
      case 'stroke': shape(st.id).stroke(col(st.color)); break;
      case 'fill': yield* shape(st.id).fill(col(st.color), 0.25); break;
      case 'move': yield* actors[st.id].el.position([st.x, st.y], st.t ?? 0.5); break;
      case 'moveto': {
        const [px, py] = posOf(st.to);
        yield* actors[st.id].el.position([px + (st.dx ?? 0), py + (st.dy ?? 0)], st.t ?? 0.5);
        break;
      }
      case 'swap': {
        const [id, ai] = st.a.split(':');
        const [, bi] = st.b.split(':');
        const A_ = actors[id];
        const ta = A_.cellTxt[+ai], tb = A_.cellTxt[+bi];
        const va = ta.text(), vb = tb.text();
        kit.sfx('pop', 0.4);
        ta.text(vb);
        tb.text(va);
        yield* all(
          chain(A_.cells[+ai].fill(colors.token, 0.15), A_.cells[+ai].fill(colors.panel, 0.25)),
          chain(A_.cells[+bi].fill(colors.token, 0.15), A_.cells[+bi].fill(colors.panel, 0.25)),
        );
        break;
      }
      case 'line': {
        const a = actors[st.id];
        kit.sfx('plink' + (st.i % 5), 0.3);
        const y = -a.h / 2 + 25 + a.lh / 2 + st.i * a.lh;
        a.hl!.opacity(1);
        yield* a.hl!.y(y, 0.25);
        break;
      }
      case 'log': {
        const a = actors[st.id];
        kit.sfx('pop', 0.4);
        a.logs[a.logN].text(String(st.text));
        if (st.color) a.logs[a.logN].fill(col(st.color));
        yield* a.logs[a.logN].opacity(1, 0.2);
        a.logN++;
        break;
      }
      case 'badge': yield* kit.badge(st.text, col(st.color ?? 'green')); break;
      case 'wait': yield* waitFor(st.t ?? 0.5); break;
      default: break;
    }
  }

  const showHead = heading(view, beat.heading, els);
  return {
    show: function* (budget: number) {
      yield* showHead();
      const steps: Any[] = beat.steps;
      const total = steps.reduce((sum: number, st: Any) => sum + durOf(st), 0);
      const pad = clamp((budget - total) / steps.length, 0, 1.2);
      for (const st of steps) {
        yield* exec(st);
        if (pad > 0.05 && st.do !== 'text' && st.do !== 'sub' && st.do !== 'stroke') yield* waitFor(pad);
      }
    },
    hide: hider(els),
  };
}

const BUILDERS: Record<string, (v: View2D, k: Kit, b: Any) => Visual> = {
  question: buildQuestion, chips: buildChips, flow: buildFlow, code: buildCode, compare: buildCompare, stat: buildStat, stage: buildStage,
};

export function engineScene(name: string, script: Any, next: string) {
  return makeScene2D(name, function* (view) {
    const titleSize = Math.min(92, Math.floor(1000 / (script.title.length * 0.56)));
    const s = makeScaffold(view, script, next, {badgeY: 520, titleSize});
    const kit: Kit = {sfx: s.sfx, dot: s.dot, badge: s.showBadge};
    const visuals: Record<string, Visual> = {};
    for (const beat of script.beats) {
      if (beat.visual) visuals[beat.id] = BUILDERS[beat.visual](view, kit, beat);
    }
    let prev: Visual | null = null;
    const bodies: Record<string, () => ThreadGenerator> = {};
    for (const beat of script.beats) {
      const v = visuals[beat.id];
      if (!v) continue;
      bodies[beat.id] = function* () {
        yield* all(s.hideBadge(), prev ? prev.hide() : waitFor(0));
        prev = v;
        yield* v.show(beat.duration - 0.6 - (beat.badge ? 1 : 0));
        if (beat.badge) yield* s.showBadge(beat.badge, col(beat.badgeColor ?? 'green'));
      };
    }
    yield* s.run(bodies);
  });
}

// Unused import guard for Line (kept for future arrow drawing).
void Line;
