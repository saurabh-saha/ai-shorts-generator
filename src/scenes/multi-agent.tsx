import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, createRefArray, linear, waitFor} from '@revideo/core';
import script from '../../data/multi-agent.json';
import {FONT, P, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const PLAN_Y = -470;
const WORK_Y = -40;
const RESULT_Y = 340;
const WORK_X = [-330, 0, 330];
const WORKERS: [string, string][] = [['Researcher', colors.request], ['Coder', colors.token], ['Reviewer', '#f472b6']];
const BAR_W = 230;
const DEAD = '#7f1d1d';

export default makeScene2D('multi-agent', function* (view) {
  const s = makeScaffold(view, script, 'MCP', {badgeY: 150});
  const {sfx, dot} = s;

  const solo = createRef<Rect>();
  const planner = createRef<Rect>();
  const plannerTxt = createRef<Txt>();
  const workers = createRefArray<Rect>();
  const status = createRefArray<Txt>();
  const bars = createRefArray<Rect>();
  const result = createRef<Rect>();
  const resultTxt = createRef<Txt>();
  const state = addChips(view, [
    ['Messages or a shared store', colors.request],
    ['Small, explicit hand-offs', colors.token],
    ['Log every message', colors.ok],
  ], -250, 130);
  const cost = addChips(view, [
    ['More tokens', colors.danger],
    ['More latency', colors.danger],
    ['More ways to fail', colors.danger],
    ['Start with one agent', colors.ok],
  ], -300, 120);
  let finished = 0;

  view.add(
    <>
      <Rect ref={solo} width={700} height={300} radius={28} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={-150} opacity={0}>
        <Txt fontFamily={FONT} text="One agent" fill={colors.request} fontSize={48} fontWeight={800} y={-90} />
        <Txt fontFamily={FONT} text="50 tools" fill={colors.text} fontSize={38} fontWeight={700} y={-20} />
        <Txt fontFamily={FONT} text="giant prompt" fill={colors.text} fontSize={38} fontWeight={700} y={40} />
        <Txt fontFamily={FONT} text="long task" fill={colors.text} fontSize={38} fontWeight={700} y={100} />
      </Rect>

      <Rect ref={planner} width={520} height={130} radius={26} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={PLAN_Y} opacity={0}>
        <Txt fontFamily={FONT} text="Planner" fill={colors.ok} fontSize={44} fontWeight={800} y={-22} />
        <Txt ref={plannerTxt} fontFamily={FONT} text="splits the task" fill={colors.muted} fontSize={28} y={28} />
      </Rect>
      {WORKERS.map(([name, c], i) => (
        <Rect ref={workers} width={300} height={190} radius={24} fill={colors.panel} stroke={c} lineWidth={6}
          position={[WORK_X[i], WORK_Y]} opacity={0}>
          <Txt fontFamily={FONT} text={name} fill={c} fontSize={38} fontWeight={800} y={-55} />
          <Txt ref={status} fontFamily={FONT} text="idle" fill={colors.muted} fontSize={28} fontWeight={700} y={-5} />
          <Rect width={BAR_W} height={14} radius={7} fill={colors.empty} y={45} />
          <Rect ref={bars} width={0} height={14} radius={7} fill={c} x={-BAR_W / 2} y={45} offset={[-1, 0]} />
        </Rect>
      ))}
      <Rect ref={result} width={700} height={150} radius={26} fill={colors.panel} stroke={colors.token}
        lineWidth={6} y={RESULT_Y} opacity={0}>
        <Txt fontFamily={FONT} text="Combined result" fill={colors.token} fontSize={40} fontWeight={800} y={-30} />
        <Txt ref={resultTxt} fontFamily={FONT} text="0 / 3 done" fill={colors.text} fontSize={36} fontWeight={700} y={28} />
      </Rect>
    </>,
  );

  const plannerBottom: P = [0, PLAN_Y + 70];
  const workTop = (i: number): P => [WORK_X[i], WORK_Y - 100];
  const workBottom = (i: number): P => [WORK_X[i], WORK_Y + 100];
  const resultTop: P = [0, RESULT_Y - 80];

  const setStatus = (i: number, text: string, color: string) => {
    status[i].text(text);
    status[i].fill(color);
  };
  const flash = (r: Rect) => chain(r.scale(1.05, 0.12), r.scale(1, 0.15));

  // Each worker works for `secs` seconds (a progress bar), then returns its result.
  function* work(i: number, secs: number): ThreadGenerator {
    setStatus(i, 'working...', colors.token);
    yield* bars[i].width(BAR_W, secs, linear);
    setStatus(i, 'done', colors.ok);
    yield* dot([workBottom(i), resultTop], WORKERS[i][1], 0.6);
    finished++;
    resultTxt().text(`${finished} / 3 done`);
    sfx('pop', 0.4);
    yield flash(result());
  }

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* solo().opacity(1, 0.4);
    yield* waitFor(1.5);
    sfx('alarm', 0.4);
    yield* solo().stroke(colors.danger, 0.4);
    yield* s.showBadge('OVERLOADED AND CONFUSED', colors.danger);
  }

  function* orchestrator(): ThreadGenerator {
    yield* all(s.hideBadge(), solo().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    yield* planner().opacity(1, 0.4);
    yield* all(...workers.map(w => w.opacity(1, 0.4)), result().opacity(1, 0.4));
    sfx('blip', 0.3);
    yield* all(...[0, 1, 2].map(i => dot([plannerBottom, workTop(i)], WORKERS[i][1], 0.6)));
    for (let i = 0; i < 3; i++) setStatus(i, 'subtask received', colors.text);
    sfx('plink2', 0.5);
    yield* s.showBadge('SPLIT  >  DELEGATE  >  COMBINE', colors.ok);
  }

  function* parallel(): ThreadGenerator {
    yield* s.hideBadge();
    finished = 0;
    resultTxt().text('0 / 3 done');
    bars.forEach(b => b.width(0));
    sfx('whoosh', 0.4);
    plannerTxt().text('waiting for all 3');
    yield* all(work(0, 2.2), work(1, 3.2), work(2, 1.6));
    sfx('ding', 0.5);
    yield* s.showBadge('RUN IN PARALLEL', colors.ok);
  }

  function* failure(): ThreadGenerator {
    yield* s.hideBadge();
    finished = 0;
    resultTxt().text('0 / 3 done');
    bars.forEach(b => b.width(0));
    plannerTxt().text('timeout: 3 s');
    sfx('blip', 0.3);
    yield all(work(0, 1.4), work(2, 1.0));
    // The Coder hangs.
    setStatus(1, 'working...', colors.token);
    yield* bars[1].width(BAR_W * 0.4, 1.4, linear);
    yield* waitFor(0.6);
    sfx('alarm', 0.5);
    setStatus(1, 'TIMEOUT', colors.text);
    yield* all(workers[1].fill(DEAD, 0.3), workers[1].stroke(colors.danger, 0.3));
    yield* s.showBadge('TIMEOUT: RETRY OR FALL BACK', colors.danger);
    yield* waitFor(0.8);
    sfx('whoosh', 0.5);
    plannerTxt().text('retry Coder');
    yield* dot([plannerBottom, workTop(1)], colors.token, 0.5);
    yield* all(workers[1].fill(colors.panel, 0.3), workers[1].stroke(WORKERS[1][1], 0.3));
    bars[1].width(0);
    yield* work(1, 1.2);
  }

  function* stateBeat(): ThreadGenerator {
    yield* all(
      s.hideBadge(), planner().opacity(0, 0.4), result().opacity(0, 0.4), ...workers.map(w => w.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    yield* reveal(state, sfx, [1.4, 1.4, 0]);
  }

  function* costBeat(): ThreadGenerator {
    yield* all(...state.map(c => c.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* reveal(cost, sfx, [1.3, 1.3, 1.3, 0]);
  }

  yield* s.run({hook, orchestrator, parallel, failure, state: stateBeat, cost: costBeat});
});
