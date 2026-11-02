import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/two-phase-commit.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const COORD_Y = -470;
const PART_Y = 120;
const PART_X = [-340, 0, 340];
const NAMES = ['Orders DB', 'Payments DB', 'Inventory DB'];
const DEAD_FILL = '#7f1d1d';

export default makeScene2D('two-phase-commit', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const phase = createRef<Txt>();
  const badge = createRef<Txt>();
  const coord = createRef<Rect>();
  const coordTxt = createRef<Txt>();
  const parts = createRefArray<Rect>();
  const states = createRefArray<Txt>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={86} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={coord} width={460} height={170} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={COORD_Y}>
        <Txt fontFamily={FONT} text="Coordinator" fill={colors.request} fontSize={44} fontWeight={800} y={-30} />
        <Txt ref={coordTxt} fontFamily={FONT} text="new order" fill={colors.muted} fontSize={34} fontWeight={700} y={30} />
      </Rect>

      <Txt ref={phase} fontFamily={FONT} text="" fill={colors.token} fontSize={52} fontWeight={800}
        y={-230} opacity={0} />

      {PART_X.map((x, i) => (
        <Rect ref={parts} width={310} height={220} radius={26} fill={colors.panel} stroke={colors.empty}
          lineWidth={6} position={[x, PART_Y]}>
          <Txt fontFamily={FONT} text={NAMES[i]} fill={colors.text} fontSize={36} fontWeight={800} y={-50} />
          <Txt ref={states} fontFamily={FONT} text="idle" fill={colors.muted} fontSize={32} fontWeight={700} y={25} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={340} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Saga Pattern" fill={colors.token} fontSize={104} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const coordPt: P = [0, COORD_Y + 95];
  const partTop = (i: number): P => [PART_X[i], PART_Y - 115];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function* showPhase(text: string, color: string): ThreadGenerator {
    phase().text(text);
    phase().fill(color);
    yield* phase().opacity(1, 0.15);
  }

  function setState(i: number, text: string, color: string) {
    states[i].text(text);
    states[i].fill(color);
    parts[i].stroke(color);
  }

  const resetAll = () => {
    PART_X.forEach((_, i) => setState(i, 'idle', colors.muted));
    parts.forEach(p => p.stroke(colors.empty));
  };

  // Coordinator -> every participant (or back), all at once.
  const toAll = (color: string, t = 0.5) =>
    all(...PART_X.map((_, i) => dot([coordPt, partTop(i)], color, t)));
  const fromAll = (colorOf: (i: number) => string, t = 0.5) =>
    all(...PART_X.map((_, i) => dot([partTop(i), coordPt], colorOf(i), t)));

  function* hook(): ThreadGenerator {
    sfx('blip', 0.35);
    yield* toAll(colors.request, 0.6);
    setState(0, 'updated', colors.ok);
    setState(1, 'updated', colors.ok);
    sfx('pop', 0.4);
    yield* waitFor(0.6);
    sfx('buzz', 0.5);
    setState(2, 'FAILED', colors.danger);
    yield* showBadge('HALF DONE: INCONSISTENT', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    resetAll();
    sfx('whoosh', 0.5);
    yield* showBadge('ALL SUCCEED OR ALL FAIL', colors.ok);
  }

  // Phase 1: ask everyone to prepare; `votes` says who votes yes.
  function* prepare(votes: boolean[]): ThreadGenerator {
    yield* showPhase('PHASE 1: PREPARE', colors.token);
    coordTxt().text('can you commit?');
    coordTxt().fill(colors.token);
    sfx('blip', 0.35);
    yield* toAll(colors.request);
    PART_X.forEach((_, i) => setState(i, votes[i] ? 'prepared' : 'NO: cannot', votes[i] ? colors.token : colors.danger));
    sfx('plink1', 0.5);
    yield* waitFor(0.4);
    yield* fromAll(i => (votes[i] ? colors.ok : colors.danger));
    const yes = votes.filter(Boolean).length;
    coordTxt().text(yes === votes.length ? `votes: ${yes}/${votes.length} YES` : `votes: ${yes} YES, ${votes.length - yes} NO`);
    coordTxt().fill(yes === votes.length ? colors.ok : colors.danger);
    sfx(yes === votes.length ? 'ding' : 'buzz', 0.5);
    yield* waitFor(0.4);
  }

  function* prepareBeat(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* prepare([true, true, true]);
  }

  function* commit(): ThreadGenerator {
    yield* showPhase('PHASE 2: COMMIT', colors.ok);
    sfx('blip', 0.35);
    yield* toAll(colors.ok);
    PART_X.forEach((_, i) => setState(i, 'COMMITTED', colors.ok));
    sfx('ding', 0.6);
    yield* all(...parts.map(p => chain(p.scale(1.06, 0.12), p.scale(1, 0.18))));
    yield* showBadge('COMMITTED EVERYWHERE', colors.ok);
  }

  function* abort(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), phase().opacity(0, 0.2));
    resetAll();
    coordTxt().text('new order');
    coordTxt().fill(colors.muted);
    yield* waitFor(0.4);
    yield* prepare([true, true, false]);
    yield* showPhase('PHASE 2: ABORT', colors.danger);
    sfx('blip', 0.35);
    yield* toAll(colors.danger);
    PART_X.forEach((_, i) => setState(i, 'rolled back', colors.danger));
    yield* showBadge('ALL OR NOTHING', colors.token);
  }

  function* block(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), phase().opacity(0, 0.2));
    resetAll();
    coordTxt().text('new order');
    coordTxt().fill(colors.muted);
    yield* waitFor(0.3);
    yield* prepare([true, true, true]);
    // The coordinator dies before it can send phase 2.
    sfx('alarm', 0.5);
    coordTxt().text('DOWN');
    coordTxt().fill(colors.text);
    yield* all(coord().fill(DEAD_FILL, 0.4), coord().stroke(colors.danger, 0.4));
    PART_X.forEach((_, i) => setState(i, 'waiting, locked', colors.token));
    yield* showBadge('BLOCKED UNTIL IT RECOVERS', colors.danger);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, concept, prepare: prepareBeat, commit, abort, block, close,
  };

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
