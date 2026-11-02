import {Line, Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, createRefArray, sequence, waitFor} from '@revideo/core';
import script from '../../data/agent-planning.json';
import {FONT, P, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

// Plan nodes: name, x, y.
const NODES: [string, number, number][] = [
  ['Research topic', 0, -380],
  ['Write draft', 0, -230],
  ['Add images', -230, -70],
  ['Proofread', 230, -70],
  ['Publish', 0, 90],
];
const GOAL_Y = -540;
// Edges between node centers (indices; -1 is the goal).
const EDGES: [number, number][] = [[-1, 0], [0, 1], [1, 2], [1, 3], [2, 4], [3, 4]];
const NEW_NODE: P = [330, -305];

const posOf = (i: number): P => (i < 0 ? [0, GOAL_Y] : [NODES[i][1], NODES[i][2]]);

export default makeScene2D('agent-planning', function* (view) {
  const s = makeScaffold(view, script, 'Multi-Agent Systems', {badgeY: 250});
  const {sfx} = s;

  const goal = createRef<Rect>();
  const nodes = createRefArray<Rect>();
  const edges = createRefArray<Line>();
  const extra = createRef<Rect>();
  const styles = addChips(view, [
    ['Plan first, then execute: predictable', colors.ok],
    ['Plan, act, replan: adaptive', colors.token],
  ], -150, 160, {fontSize: 38, h: 110});
  const risks = addChips(view, [
    ['Too rigid', colors.danger],
    ['Too long', colors.danger],
    ['Just wrong', colors.danger],
  ], -330, 115);
  const fix = addChips(view, [['Keep it short. Check each step. Human OK.', colors.ok]], 40, 0, {fontSize: 36});

  const paint = (r: Rect, color: string) => r.stroke(color, 0.25);

  view.add(
    <>
      {EDGES.map(([a, b]) => {
        const [ax, ay] = posOf(a);
        const [bx, by] = posOf(b);
        return <Line ref={edges} points={[[ax, ay + 48], [bx, by - 48]]} stroke={colors.empty} lineWidth={5}
          lineCap="round" opacity={0} />;
      })}
      <Rect ref={goal} width={620} height={100} radius={24} fill={colors.panel} stroke={colors.token}
        lineWidth={6} y={GOAL_Y} opacity={0}>
        <Txt fontFamily={FONT} text="Goal: publish a blog post" fill={colors.token} fontSize={38} fontWeight={800} />
      </Rect>
      {NODES.map(([name, x, y]) => (
        <Rect ref={nodes} width={340} height={90} radius={20} fill={colors.panel} stroke={colors.muted}
          lineWidth={5} position={[x, y]} opacity={0}>
          <Txt fontFamily={FONT} text={name} fill={colors.text} fontSize={34} fontWeight={800} />
        </Rect>
      ))}
      <Rect ref={extra} width={330} height={90} radius={20} fill={colors.panel} stroke={colors.token}
        lineWidth={5} position={NEW_NODE} opacity={0}>
        <Txt fontFamily={FONT} text="Find more sources" fill={colors.token} fontSize={30} fontWeight={800} />
      </Rect>
    </>,
  );

  const done = (i: number) => chain(paint(nodes[i], colors.ok), nodes[i].scale(1.05, 0.1), nodes[i].scale(1, 0.12));

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* goal().opacity(1, 0.4);
    yield* waitFor(1);
    sfx('buzz', 0.4);
    yield* s.showBadge('TOO BIG FOR ONE STEP', colors.danger);
    yield* waitFor(1.2);
    sfx('plink2', 0.5);
    yield* s.showBadge('SO: BREAK IT DOWN', colors.ok);
  }

  function* decompose(): ThreadGenerator {
    yield* s.hideBadge();
    sfx('whoosh', 0.5);
    yield* all(
      sequence(0.3, ...nodes.map(n => n.opacity(1, 0.3))),
      sequence(0.3, ...edges.map(e => e.opacity(1, 0.3))),
    );
    yield* s.showBadge('STEPS + DEPENDENCIES', colors.ok);
    yield* waitFor(0.6);
    // Run it: independent steps go side by side.
    for (const group of [[0], [1], [2, 3], [4]]) {
      sfx('pop', 0.4);
      yield* all(...group.map(i => done(i)));
      yield* waitFor(0.3);
    }
  }

  function* stylesBeat(): ThreadGenerator {
    yield* all(
      s.hideBadge(), goal().opacity(0, 0.4), ...nodes.map(n => n.opacity(0, 0.4)), ...edges.map(e => e.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    yield* reveal(styles, sfx, [2.5, 0]);
  }

  function* replan(): ThreadGenerator {
    yield* all(...styles.map(c => c.opacity(0, 0.3)));
    nodes.forEach(n => n.stroke(colors.muted));
    yield* all(goal().opacity(1, 0.4), ...nodes.map(n => n.opacity(1, 0.4)), ...edges.map(e => e.opacity(1, 0.4)));
    sfx('pop', 0.4);
    yield* done(0);
    yield* waitFor(0.5);
    // The draft fails: not enough sources.
    sfx('alarm', 0.5);
    yield* paint(nodes[1], colors.danger);
    yield* s.showBadge('"WRITE DRAFT" FAILED', colors.danger);
    yield* waitFor(1);
    // The plan is revised with a new step.
    sfx('whoosh', 0.5);
    yield* extra().opacity(1, 0.4);
    yield* s.showBadge('REPLAN: ADD A STEP', colors.token);
    yield* waitFor(0.8);
    sfx('pop', 0.4);
    yield* paint(extra(), colors.ok);
    yield* done(1);
  }

  function* pitfalls(): ThreadGenerator {
    yield* all(
      s.hideBadge(), goal().opacity(0, 0.4), extra().opacity(0, 0.4),
      ...nodes.map(n => n.opacity(0, 0.4)), ...edges.map(e => e.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    yield* reveal(risks, sfx, [1.2, 1.2, 1.2]);
    sfx('ding', 0.5);
    yield* fix[0].opacity(1, 0.4);
  }

  yield* s.run({hook, decompose, styles: stylesBeat, replan, pitfalls});
});
