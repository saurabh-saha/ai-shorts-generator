import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  linear,
  waitFor,
} from '@revideo/core';
import script from '../../data/circuit-breaker.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const SVC_Y = -540;
const BR_Y = -90;
const DEP_Y = 400;
const BAR_W = 240;
const THRESHOLD = 3;

export default makeScene2D('circuit-breaker', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const svc = createRef<Rect>();
  const threads = createRef<Rect>();
  const breaker = createRef<Rect>();
  const state = createRef<Txt>();
  const counter = createRef<Txt>();
  const dep = createRef<Rect>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={svc} width={380} height={150} radius={24} fill={colors.panel} y={SVC_Y}>
        <Txt fontFamily={FONT} text="Your Service" fill={colors.text} fontSize={40} fontWeight={700} y={-22} />
        <Rect width={BAR_W} height={16} radius={8} fill={colors.empty} y={38} />
        <Rect ref={threads} width={0} height={16} radius={8} fill={colors.token} x={-BAR_W / 2} y={38}
          offset={[-1, 0]} />
      </Rect>

      <Rect ref={breaker} width={580} height={210} radius={28} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={BR_Y} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="CIRCUIT BREAKER" fill={colors.muted} fontSize={34} fontWeight={800} y={-65} />
        <Txt ref={state} fontFamily={FONT} text="CLOSED" fill={colors.ok} fontSize={54} fontWeight={800} y={-5} />
        <Txt ref={counter} fontFamily={FONT} text={`failures 0 / ${THRESHOLD}`} fill={colors.muted}
          fontSize={34} y={62} />
      </Rect>

      <Rect ref={dep} width={400} height={190} radius={24} fill={colors.panel} y={DEP_Y}>
        <Txt fontFamily={FONT} text="Payment API" fill={colors.text} fontSize={46} fontWeight={700} y={-15} />
        <Txt fontFamily={FONT} text="dependency" fill={colors.muted} fontSize={30} y={40} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={48} fontWeight={800}
        y={190} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Idempotency" fill={colors.token} fontSize={108} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const svcPt: P = [0, SVC_Y + 90];
  const brTop: P = [0, BR_Y - 115];
  const depTop: P = [0, DEP_Y - 105];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function setState(name: string, color: string) {
    state().text(name);
    state().fill(color);
    breaker().stroke(color);
  }

  // Direct call (no breaker yet). A failing dependency answers with a red dot.
  function* roundtrip(ok: boolean): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([svcPt, depTop], colors.request, 0.6);
    yield* dot([depTop, svcPt], ok ? colors.ok : colors.danger, 0.6);
  }

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 8; i++) {
      if (i === 2) {
        sfx('alarm', 0.5);
        yield dep().fill(colors.danger, 0.4);
      }
      yield roundtrip(i < 2);
      yield* waitFor(0.45);
    }
  }

  function* problem(): ThreadGenerator {
    yield showBadge('WAITING ON TIMEOUTS', colors.danger);
    yield threads().width(BAR_W, 4, linear);
    for (let i = 0; i < 10; i++) {
      yield roundtrip(false);
      yield* waitFor(0.35);
    }
    sfx('alarm', 0.5);
    threads().fill(colors.danger);
    yield* all(svc().fill(colors.danger, 0.4), badge().opacity(0, 0.2));
    yield* showBadge('FAILURE SPREADS', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.3),
      svc().fill(colors.panel, 0.5),
      threads().width(0, 0.5),
    );
    threads().fill(colors.token);
    sfx('whoosh', 0.6);
    yield* all(breaker().opacity(1, 0.6), breaker().scale(1, 0.6));
    sfx('plink2', 0.5);
  }

  function* open(): ThreadGenerator {
    // Three failures in a row trip the breaker.
    for (let n = 1; n <= THRESHOLD; n++) {
      sfx('blip', 0.25);
      yield* dot([svcPt, brTop, depTop], colors.request, 0.3);
      yield* dot([depTop, svcPt], colors.danger, 0.3);
      sfx('buzz', 0.4);
      counter().text(`failures ${n} / ${THRESHOLD}`);
      counter().fill(colors.danger);
      yield* waitFor(0.2);
    }
    sfx('alarm', 0.5);
    setState('OPEN', colors.danger);
    yield all(dep().opacity(0.35, 0.4), showBadge('FAIL FAST', colors.danger));
    yield* waitFor(0.6);
    // Calls are rejected instantly and answered with a fallback.
    for (let i = 0; i < 3; i++) {
      sfx('blip', 0.25);
      yield* dot([svcPt, brTop], colors.danger, 0.2);
      yield* dot([brTop, svcPt], colors.token, 0.2);
      yield* waitFor(0.4);
    }
    yield* showBadge('FALLBACK: CACHED DATA', colors.token);
  }

  function* halfopen(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // The dependency has recovered while the breaker was cooling down.
    yield* all(dep().opacity(1, 0.4), dep().fill(colors.panel, 0.4));
    counter().fill(colors.muted);
    counter().text('cooling down...');
    yield* waitFor(1.5);
    setState('HALF-OPEN', colors.token);
    counter().text('one test request');
    sfx('plink1', 0.5);
    yield* waitFor(0.5);
    yield* dot([svcPt, brTop, depTop], colors.token, 0.35);
    yield* dot([depTop, svcPt], colors.ok, 0.35);
    sfx('ding', 0.5);
    setState('CLOSED', colors.ok);
    counter().text(`failures 0 / ${THRESHOLD}`);
    yield* showBadge('RECOVERED', colors.ok);
    yield* waitFor(0.4);
    for (let i = 0; i < 3; i++) {
      yield* dot([svcPt, brTop, depTop], colors.request, 0.3);
      yield* dot([depTop, svcPt], colors.ok, 0.3);
      yield* waitFor(0.3);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, open, halfopen, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
