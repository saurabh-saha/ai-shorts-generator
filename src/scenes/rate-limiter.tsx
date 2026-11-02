import {Audio, Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  createRefArray,
  easeInOutCubic,
  range,
  sequence,
  waitFor,
} from '@revideo/core';
import script from '../../data/rate-limiter.json';
import {makeStickFigure} from '../components/StickFigure';
import {colors} from '../theme';

type P = [number, number];

const FONT = 'Inter, Helvetica Neue, Arial, sans-serif';

const CLIENT_Y = -500;
const LIMITER: P = [0, -60];
const SERVER: P = [0, 430];
const CLIENT_X = [-300, 0, 300];

export default makeScene2D('rate-limiter', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const server = createRef<Rect>();
  const limiter = createRef<Rect>();
  const status = createRef<Txt>();
  const endCard = createRef<Rect>();
  const tokens = createRefArray<Circle>();
  const bouncer = makeStickFigure();

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      {CLIENT_X.map(x => (
        <Rect width={150} height={110} radius={20} fill={colors.panel} position={[x, CLIENT_Y]}>
          <Txt fontFamily={FONT} text="Client" fill={colors.muted} fontSize={36} />
        </Rect>
      ))}

      <Rect ref={limiter} width={620} height={260} radius={28} fill={colors.panel}
        stroke={colors.token} lineWidth={6} position={LIMITER} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="RATE LIMITER" fill={colors.token} fontSize={40} fontWeight={800} y={-85} />
        {range(5).map(i => (
          <Circle ref={tokens} size={72} x={(i - 2) * 110} y={20} fill={colors.empty} />
        ))}
        <Txt fontFamily={FONT} text="tokens" fill={colors.muted} fontSize={32} y={95} />
      </Rect>

      <Rect ref={server} width={480} height={220} radius={28} fill={colors.panel} position={SERVER}>
        <Txt fontFamily={FONT} text="API Server" fill={colors.text} fontSize={48} fontWeight={700} />
      </Rect>

      <Txt fontFamily={FONT} ref={status} text="" fill={colors.danger} fontSize={64} fontWeight={800}
        y={185} opacity={0} />

      <Txt fontFamily={FONT} ref={caption} layout width={940} textWrap textAlign="center" fill={colors.text}
        fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Sliding Window" fill={colors.token} fontSize={110} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  bouncer.root().position([450, -80]).opacity(0);
  view.add(bouncer.node);

  // Dots still in flight when a beat ends get cancelled; sweep them between beats.
  const live = new Set<Circle>();

  // Fire-and-forget sound effect at the current moment of the timeline.
  function sfx(name: string, volume = 0.6) {
    view.add(<Audio src={`/sfx/${name}.wav`} play volume={volume} />);
  }

  // A request dot travelling client -> (optional via) -> target, then vanishing.
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
  const flood = (i: number) => {
    sfx('blip', 0.25);
    return dot([[CLIENT_X[i % 3], CLIENT_Y + 60], [0, SERVER[1] - 110]], colors.request, 0.7);
  };

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 14; i++) {
      yield flood(i);
      yield* waitFor(0.15);
    }
    sfx('alarm', 0.5);
    yield* server().fill(colors.danger, 0.4);
    yield* waitFor(0.5);
  }

  function* problem(): ThreadGenerator {
    sfx('alarm', 0.4);
    status().text('OVERLOADED');
    yield* status().opacity(1, 0.3);
    for (let i = 0; i < 12; i++) {
      yield flood(0);
      yield* waitFor(0.15);
    }
  }

  function* concept(): ThreadGenerator {
    yield* all(status().opacity(0, 0.3), server().fill(colors.panel, 0.5));
    sfx('whoosh', 0.6);
    yield* all(limiter().opacity(1, 0.6), limiter().scale(1, 0.6), bouncer.root().opacity(1, 0.6));
  }

  function* bucket(): ThreadGenerator {
    yield* sequence(
      0.5,
      ...tokens.map(function* (t, i) {
        sfx(`plink${i}`, 0.6);
        yield* t.fill(colors.token, 0.3);
      }),
    );
  }

  function* decide(): ThreadGenerator {
    // Five requests pass, each spending a token.
    for (let i = 0; i < 5; i++) {
      const cx = CLIENT_X[i % 3];
      yield dot([[cx, CLIENT_Y + 60], [cx, LIMITER[1]], [0, SERVER[1] - 110]], colors.ok, 0.5);
      yield* waitFor(0.45);
      sfx('pop', 0.5);
      sfx('spend', 0.4);
      yield* tokens[4 - i].fill(colors.empty, 0.2);
    }
    yield* waitFor(0.6);
    // Bucket is empty: the sixth request is rejected.
    yield bouncer.arm().rotation(120, 0.25);
    yield dot([[0, CLIENT_Y + 60], [0, LIMITER[1] - 130], [0, CLIENT_Y + 60]], colors.danger, 0.6);
    yield* waitFor(0.6); // dot reaches the limiter and bounces
    sfx('buzz', 0.6);
    yield* waitFor(0.6);
    status().text('429 Too Many Requests');
    yield* status().opacity(1, 0.3);
    yield* waitFor(1);
    // Refill: a token comes back.
    sfx('ding', 0.5);
    yield* all(status().opacity(0, 0.3), bouncer.arm().rotation(-20, 0.3), tokens[0].fill(colors.token, 0.5));
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, bucket, decide, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    live.forEach(c => c.remove());
    live.clear();
  }
});
