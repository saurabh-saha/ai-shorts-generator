import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, createRefArray, sequence, waitFor} from '@revideo/core';
import script from '../../data/evaluating-agents.json';
import {FONT, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const RUNS: [string, string][] = [['Run 1: worked', colors.ok], ['Run 2: failed', colors.danger], ['Run 3: worked', colors.ok], ['Run 4: failed', colors.danger]];
const TASKS: [string, string][] = [
  ['Book the cheapest flight', 'booked, under $300'],
  ['Summarize a PDF', 'covers every key point'],
  ['Fix a failing test', 'all tests pass'],
  ['Refund an order', 'refund issued once'],
];
const METRICS: [string, string, string][] = [
  ['Success rate', '82%', colors.ok],
  ['Avg steps', '6.4', colors.request],
  ['Cost / task', '$0.12', colors.token],
  ['Latency', '38 s', '#f472b6'],
];
const TRAJ: [string, string, string][] = [
  ['search_flights("PAR")', 'right tool', colors.ok],
  ['search_flights("PAR")', 'repeated call', colors.token],
  ['book_flight(id=999)', 'wrong argument', colors.danger],
  ['answer: "booked!"', 'right answer, wrong path', colors.token],
];
const VERSIONS: [string, number, string][] = [['v1', 62, colors.request], ['v2', 71, colors.request], ['v3', 68, colors.danger], ['v4', 82, colors.ok]];
const MONO = 'Menlo, Courier New, monospace';
const BASE = 130;
const BAR_X = [-300, -100, 100, 300];

export default makeScene2D('evaluating-agents', function* (view) {
  const s = makeScaffold(view, script, '', {badgeY: 470, titleSize: 80});
  const {sfx} = s;

  const runs = createRefArray<Rect>();
  const tasks = createRefArray<Rect>();
  const metrics = createRefArray<Rect>();
  const traj = createRefArray<Rect>();
  const bars = createRefArray<Rect>();
  const barLabels = createRefArray<Txt>();
  const judges = addChips(view, [
    ['LLM judge with a clear rubric', colors.request],
    ['Spot-check against humans', colors.token],
    ['Judges have biases too', colors.danger],
  ], -250, 130, {fontSize: 40});
  const habits = addChips(view, [
    ['Run each task several times', colors.request],
    ['Add every real failure to the set', colors.ok],
  ], 310, 115, {fontSize: 38});

  view.add(
    <>
      {RUNS.map(([t, c], i) => (
        <Rect ref={runs} width={720} height={90} radius={20} fill={colors.panel} stroke={c} lineWidth={5}
          y={-300 + i * 120} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={c} fontSize={42} fontWeight={800} />
        </Rect>
      ))}
      {TASKS.map(([t, ok], i) => (
        <Rect ref={tasks} width={920} height={120} radius={22} fill={colors.panel} stroke={colors.request}
          lineWidth={5} y={-330 + i * 150} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.text} fontSize={38} fontWeight={800} y={-22} />
          <Txt fontFamily={FONT} text={`success = ${ok}`} fill={colors.ok} fontSize={30} fontWeight={700} y={28} />
        </Rect>
      ))}
      {METRICS.map(([name, val, c], i) => (
        <Rect ref={metrics} width={440} height={260} radius={26} fill={colors.panel} stroke={c} lineWidth={6}
          position={[(i % 2 ? 1 : -1) * 235, -230 + Math.floor(i / 2) * 300]} opacity={0}>
          <Txt fontFamily={FONT} text={name} fill={colors.muted} fontSize={34} fontWeight={700} y={-70} />
          <Txt fontFamily={FONT} text={val} fill={c} fontSize={96} fontWeight={800} y={25} />
        </Rect>
      ))}
      {TRAJ.map(([t, note, c], i) => (
        <Rect ref={traj} width={940} height={110} radius={20} fill={colors.panel} stroke={c} lineWidth={5}
          y={-330 + i * 140} opacity={0}>
          <Txt fontFamily={MONO} text={t} fill={colors.text} fontSize={30} fontWeight={800} offsetX={-1} x={-430} y={-14} />
          <Txt fontFamily={FONT} text={note} fill={c} fontSize={30} fontWeight={800} offsetX={-1} x={-430} y={28} />
        </Rect>
      ))}
      {VERSIONS.flatMap(([v, pct, c], i) => [
        <Rect ref={bars} width={130} height={(pct / 100) * 360} radius={12} fill={c + '55'} stroke={c}
          lineWidth={5} position={[BAR_X[i], BASE]} offset={[0, 1]} opacity={0} />,
        <Txt ref={barLabels} fontFamily={FONT} text={`${v}  ${pct}%`} fill={c} fontSize={36} fontWeight={800}
          position={[BAR_X[i], BASE + 40]} opacity={0} />,
      ])}
    </>,
  );

  const pulse = (r: Rect) => chain(r.scale(1.05, 0.12), r.scale(1, 0.15));

  function* hook(): ThreadGenerator {
    for (let i = 0; i < RUNS.length; i++) {
      sfx(i % 2 ? 'buzz' : 'ding', 0.4);
      yield* runs[i].opacity(1, 0.3);
      yield* waitFor(0.9);
    }
    yield* s.showBadge('SAME TASK, DIFFERENT OUTCOMES', colors.token);
  }

  function* testset(): ThreadGenerator {
    yield* all(s.hideBadge(), ...runs.map(r => r.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    for (let i = 0; i < TASKS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* tasks[i].opacity(1, 0.3);
      yield* waitFor(0.7);
    }
  }

  function* metricsBeat(): ThreadGenerator {
    yield* all(...tasks.map(t => t.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    for (let i = 0; i < METRICS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* all(metrics[i].opacity(1, 0.3), pulse(metrics[i]));
      yield* waitFor(0.6);
    }
  }

  function* trajectory(): ThreadGenerator {
    yield* all(...metrics.map(m => m.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    for (let i = 0; i < TRAJ.length; i++) {
      sfx(i === 2 ? 'buzz' : `plink${i}`, 0.5);
      yield* traj[i].opacity(1, 0.3);
      yield* waitFor(1.2);
    }
    yield* s.showBadge('RIGHT ANSWER, WRONG PATH = FRAGILE', colors.token);
  }

  function* judgesBeat(): ThreadGenerator {
    yield* all(s.hideBadge(), ...traj.map(t => t.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* reveal(judges, sfx, [1.4, 1.4, 0]);
  }

  function* regression(): ThreadGenerator {
    yield* all(...judges.map(j => j.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* sequence(0.35, ...bars.map(b => b.opacity(1, 0.3)));
    yield* all(...barLabels.map(l => l.opacity(1, 0.3)));
    yield* waitFor(0.6);
    sfx('buzz', 0.5);
    yield* s.showBadge('v3 DIPPED: REGRESSION CAUGHT', colors.danger);
    yield* waitFor(1.4);
    yield* s.hideBadge();
    yield* reveal(habits, sfx, [1.5, 0]);
  }

  yield* s.run({hook, testset, metrics: metricsBeat, trajectory, judges: judgesBeat, regression});
});
