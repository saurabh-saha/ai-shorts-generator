import {Audio, Circle, View2D} from '@revideo/2d';
import {ThreadGenerator, createRef, easeInOutCubic} from '@revideo/core';

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
