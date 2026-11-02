import {Audio, Circle, Rect, Txt, View2D} from '@revideo/2d';
import {ThreadGenerator, createRef, easeInOutCubic, waitFor} from '@revideo/core';
import {colors} from '../theme';

export type P = [number, number];
export const FONT = 'Inter, Helvetica Neue, Arial, sans-serif';

// Helpers shared by scenes: sound effects and travelling request dots.
export function makeKit(view: View2D) {
  // Dots still in flight when a beat ends get cancelled; sweep them between beats.
  const live = new Set<Circle>();

  // Fire-and-forget sound effect at the current moment of the timeline.
  function sfx(name: string, volume = 0.6) {
    view.add(<Audio src={`/sfx/${name}.wav`} play volume={volume} />);
  }

  // A request dot travelling along `path`, then vanishing.
  function* dot(path: P[], color: string, t = 0.5): ThreadGenerator {
    const d = createRef<Circle>();
    view.add(<Circle ref={d} size={36} fill={color} position={path[0]} />);
    live.add(d());
    for (const p of path.slice(1)) {
      yield* d().position(p, t, easeInOutCubic);
    }
    d().remove();
    live.delete(d());
  }

  function sweep() {
    live.forEach(c => c.remove());
    live.clear();
  }

  return {sfx, dot, sweep};
}

// A stack of outlined chips ([text, color]) that start hidden; reveal them with `reveal`.
export function addChips(
  view: View2D,
  items: [string, string][],
  y0: number,
  step: number,
  opts: {w?: number; h?: number; fontSize?: number} = {},
) {
  const refs: Rect[] = [];
  items.forEach(([text, color], i) => {
    const r = createRef<Rect>();
    view.add(
      <Rect ref={r} width={opts.w ?? 860} height={opts.h ?? 90} radius={20} fill={colors.panel} stroke={color}
        lineWidth={5} y={y0 + i * step} opacity={0}>
        <Txt fontFamily={FONT} text={text} fill={color} fontSize={opts.fontSize ?? 42} fontWeight={800} />
      </Rect>,
    );
    refs.push(r());
  });
  return refs;
}

// Fade chips in one by one, waiting `waits[i]` seconds after each (default 1s).
export function* reveal(chips: Rect[], sfx: (n: string, v?: number) => void, waits: number[] = []): ThreadGenerator {
  for (let i = 0; i < chips.length; i++) {
    sfx(`plink${i % 5}`, 0.5);
    yield* chips[i].opacity(1, 0.3);
    yield* waitFor(waits[i] ?? 1);
  }
}
