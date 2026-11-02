import {Line, Rect, Txt, View2D, makeScene2D} from '@revideo/2d';
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

type Kit = {sfx: (n: string, v?: number) => void; dot: (p: P[], c: string, t?: number) => ThreadGenerator};
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

const BUILDERS: Record<string, (v: View2D, k: Kit, b: Any) => Visual> = {
  question: buildQuestion, chips: buildChips, flow: buildFlow, code: buildCode, compare: buildCompare, stat: buildStat,
};

export function engineScene(name: string, script: Any, next: string) {
  return makeScene2D(name, function* (view) {
    const titleSize = Math.min(92, Math.floor(1000 / (script.title.length * 0.56)));
    const s = makeScaffold(view, script, next, {badgeY: 520, titleSize});
    const kit: Kit = {sfx: s.sfx, dot: s.dot};
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
