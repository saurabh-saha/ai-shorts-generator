import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, createRef, createRefArray, waitFor} from '@revideo/core';
import script from '../../data/react-loop.json';
import {FONT, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const MONO = 'Menlo, Courier New, monospace';
const MAX_STEPS = 10;
const TRACE: [string, string][] = [
  ['Question: do I need a coat in Paris?', colors.text],
  ['Thought: I should check the weather.', colors.request],
  ['Action: get_weather("Paris")', colors.token],
  ['Observation: 9C, rain', colors.ok],
  ['Thought: cold and wet. I can answer.', colors.request],
  ['Answer: yes, take a coat + umbrella.', colors.ok],
];

export default makeScene2D('react-loop', function* (view) {
  const s = makeScaffold(view, script, 'Agent Memory', {badgeY: 480});
  const {sfx} = s;

  const panel = createRef<Rect>();
  const lines = createRefArray<Txt>();
  const steps = createRef<Txt>();
  const why = addChips(view, [['Plans before it acts', colors.request], ['A readable trace to debug', colors.ok]], 410, 115);
  const bad = addChips(view, [
    ['Repeats the same action', colors.danger],
    ['Invents tool results', colors.danger],
    ['Never decides to stop', colors.danger],
  ], -330, 120);
  const fix = addChips(view, [['Detect repeats. Cap the steps.', colors.ok]], 60, 0);

  view.add(
    <>
      <Rect ref={panel} width={960} height={620} radius={26} fill={colors.panel} stroke={colors.empty}
        lineWidth={6} y={-150} opacity={0}>
        {TRACE.map(([t, c], i) => (
          <Txt ref={lines} fontFamily={MONO} text={t} fill={c} fontSize={32} fontWeight={800}
            offsetX={-1} x={-430} y={-240 + i * 96} opacity={0} />
        ))}
      </Rect>
      <Txt ref={steps} fontFamily={FONT} text={`step 0 / ${MAX_STEPS}`} fill={colors.muted} fontSize={46}
        fontWeight={800} y={290} opacity={0} />
    </>,
  );

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* panel().opacity(1, 0.4);
    yield* lines[0].opacity(1, 0.4);
    yield* steps().opacity(1, 0.4);
    yield* waitFor(0.6);
    yield* s.showBadge('REASON + ACT', colors.token);
  }

  function* trace(): ThreadGenerator {
    yield* s.hideBadge();
    const stepAfter: Record<number, number> = {2: 1, 3: 1, 4: 2, 5: 2};
    for (let i = 1; i < TRACE.length; i++) {
      sfx(`plink${i % 5}`, 0.5);
      yield* lines[i].opacity(1, 0.3);
      if (i === 2) steps().text(`step 1 / ${MAX_STEPS}`);
      if (i === 5) steps().text(`step 2 / ${MAX_STEPS}`);
      yield* waitFor(0.9);
    }
    void stepAfter;
    sfx('ding', 0.5);
    yield* s.showBadge('THINK  >  ACT  >  OBSERVE', colors.ok);
  }

  function* why_(): ThreadGenerator {
    yield* all(s.hideBadge(), panel().opacity(0.3, 0.4), ...lines.map(l => l.opacity(0.3, 0.4)));
    sfx('whoosh', 0.5);
    yield* reveal(why, sfx, [1.8, 0]);
  }

  function* stop(): ThreadGenerator {
    yield* all(...why.map(w => w.opacity(0, 0.3)));
    steps().fill(colors.token);
    steps().y(120);
    for (let n = 3; n <= MAX_STEPS; n++) {
      sfx('blip', 0.25);
      steps().text(`step ${n} / ${MAX_STEPS}`);
      yield* waitFor(0.45);
    }
    steps().fill(colors.danger);
    sfx('alarm', 0.5);
    yield* s.showBadge('STEP LIMIT: STOP', colors.danger);
  }

  function* failures(): ThreadGenerator {
    yield* all(s.hideBadge(), panel().opacity(0, 0.4), steps().opacity(0, 0.4), ...lines.map(l => l.opacity(0, 0.4)));
    sfx('whoosh', 0.5);
    yield* reveal(bad, sfx, [1.5, 1.5, 1.2]);
    sfx('ding', 0.5);
    yield* fix[0].opacity(1, 0.4);
  }

  yield* s.run({hook, trace, why: why_, stop, failures});
});
