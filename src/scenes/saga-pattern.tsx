import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  sequence,
  waitFor,
} from '@revideo/core';
import script from '../../data/saga-pattern.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const STEP_X = -130;
const STEP_Y = [-470, -270, -70, 130];
const STEPS: [string, string][] = [
  ['Order service', 'create order'],
  ['Payment service', 'charge card'],
  ['Inventory service', 'reserve stock'],
  ['Shipping service', 'ship package'],
];
const UNDO = ['cancel order', 'refund card', 'release stock'];
const TRADE = ['No distributed locks', 'Scales well', 'Eventually consistent', 'Events or an orchestrator'];
const TRADE_COLOR = [colors.ok, colors.ok, colors.token, colors.request];

export default makeScene2D('saga-pattern', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const boxes = createRefArray<Rect>();
  const status = createRefArray<Txt>();
  const undo = createRefArray<Rect>();
  const trade = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      {STEPS.map(([name, action], i) => (
        <Rect ref={boxes} width={560} height={130} radius={24} fill={colors.panel} stroke={colors.empty}
          lineWidth={6} position={[STEP_X, STEP_Y[i]]} opacity={0}>
          <Txt fontFamily={FONT} text={`${i + 1}. ${name}`} fill={colors.text} fontSize={36} fontWeight={800}
            x={-40} y={-24} />
          <Txt fontFamily={FONT} text={action} fill={colors.muted} fontSize={30} x={-40} y={26} />
          <Txt ref={status} fontFamily={FONT} text="pending" fill={colors.muted} fontSize={28} fontWeight={700}
            x={190} />
        </Rect>
      ))}

      {UNDO.map((t, i) => (
        <Rect ref={undo} width={300} height={90} radius={20} fill={colors.panel} stroke={colors.token}
          lineWidth={5} position={[370, STEP_Y[i]]} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.token} fontSize={32} fontWeight={800} />
        </Rect>
      ))}

      {TRADE.map((t, i) => (
        <Rect ref={trade} width={820} height={90} radius={20} fill={colors.panel} stroke={TRADE_COLOR[i]}
          lineWidth={5} y={-330 + i * 120} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={TRADE_COLOR[i]} fontSize={42} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={330} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Event Sourcing" fill={colors.token} fontSize={92} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const below = (i: number): P => [STEP_X, STEP_Y[i] + 70];
  const above = (i: number): P => [STEP_X, STEP_Y[i] - 70];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function setStep(i: number, text: string, color: string) {
    status[i].text(text);
    status[i].fill(color);
    boxes[i].stroke(color);
  }

  const resetSteps = () => STEPS.forEach((_, i) => {
    setStep(i, 'pending', colors.muted);
    boxes[i].stroke(colors.empty);
  });

  // Run steps 1..n in order: each one finishes, then triggers the next (a dot flows down).
  function* runSteps(upTo: number): ThreadGenerator {
    for (let i = 0; i < upTo; i++) {
      setStep(i, 'done', colors.ok);
      sfx(`plink${i}`, 0.5);
      yield* chain(boxes[i].scale(1.04, 0.12), boxes[i].scale(1, 0.15));
      if (i < STEPS.length - 1) {
        sfx('blip', 0.3);
        yield* dot([below(i), above(i + 1)], colors.request, 0.45);
      }
    }
  }

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* sequence(0.1, ...boxes.map(b => b.opacity(1, 0.3)));
    STEPS.forEach((_, i) => setStep(i, 'locked', colors.token));
    sfx('alarm', 0.4);
    yield* showBadge('2PC: LOCKS + CAN BLOCK', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    resetSteps();
    yield* showBadge('LOCAL TRANSACTIONS, IN SEQUENCE', colors.request);
    yield* waitFor(1);
    yield* runSteps(STEPS.length);
    sfx('ding', 0.5);
    yield* showBadge('ALL STEPS DONE', colors.ok);
  }

  function* fail(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    resetSteps();
    yield* runSteps(3);
    sfx('buzz', 0.5);
    setStep(3, 'FAILED', colors.danger);
    yield* showBadge('STEP 4 FAILED: NO GLOBAL ROLLBACK', colors.danger);
  }

  function* comp(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('UNDO IN REVERSE ORDER', colors.token);
    for (let i = 2; i >= 0; i--) {
      sfx('blip', 0.3);
      yield* dot([above(i + 1), below(i)], colors.token, 0.45);
      sfx(`plink${i}`, 0.5);
      setStep(i, 'undone', colors.token);
      yield* all(undo[i].opacity(1, 0.3), chain(boxes[i].scale(1.04, 0.12), boxes[i].scale(1, 0.15)));
      yield* waitFor(0.6);
    }
  }

  function* tradeoff(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      ...boxes.map(b => b.opacity(0, 0.4)),
      ...undo.map(u => u.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < TRADE.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* trade[i].opacity(1, 0.3);
      yield* waitFor([2.2, 2.8, 3.0, 0][i]); // paced to the narration
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, concept, fail, comp, tradeoff, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
