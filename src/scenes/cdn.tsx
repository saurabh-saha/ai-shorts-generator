import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/cdn.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const ORIGIN_Y = -500;
const EDGE_Y = 0;
const USER_Y = 440;
const X = [-330, 0, 330];

export default makeScene2D('cdn', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const origin = createRef<Rect>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const edges = createRefArray<Rect>();
  const copies = createRefArray<Rect>();
  const users = createRefArray<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={origin} width={460} height={170} radius={28} fill={colors.panel} y={ORIGIN_Y}>
        <Txt fontFamily={FONT} text="Origin Server" fill={colors.text} fontSize={44} fontWeight={700} y={-18} />
        <Txt fontFamily={FONT} text="far away" fill={colors.muted} fontSize={32} y={35} />
      </Rect>

      {X.map((x, i) => (
        <Rect ref={edges} width={290} height={160} radius={24} fill={colors.panel} stroke={colors.ok}
          lineWidth={6} position={[x, EDGE_Y]} opacity={0} scale={0.85}>
          <Txt fontFamily={FONT} text={`Edge ${i + 1}`} fill={colors.ok} fontSize={38} fontWeight={800} y={-30} />
          <Rect ref={copies} width={110} height={44} radius={10} fill={colors.empty} y={35} />
        </Rect>
      ))}

      {X.map((x, i) => (
        <Rect ref={users} width={190} height={100} radius={20} fill={colors.panel} position={[x, USER_Y]}
          opacity={i === 1 ? 1 : 0}>
          <Txt fontFamily={FONT} text="User" fill={colors.muted} fontSize={36} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={52} fontWeight={800}
        y={225} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="API Gateway" fill={colors.token} fontSize={106} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const userTop = (i: number): P => [X[i], USER_Y - 60];
  const edgeBottom = (i: number): P => [X[i], EDGE_Y + 90];
  const edgeTop = (i: number): P => [X[i], EDGE_Y - 90];
  const originBottom = (i: number): P => [X[i] * 0.4, ORIGIN_Y + 100];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: ReturnType<typeof createRef<Rect>> | Rect, c: string, back: string) =>
    chain((r as Rect).fill(c, 0.1), (r as Rect).fill(back, 0.3));

  // Without a CDN a request makes the long trip to the origin (slow dot) and back.
  function* longTrip(i: number): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([userTop(i), originBottom(i)], colors.request, 1.1);
    sfx('pop', 0.4);
    yield* dot([originBottom(i), userTop(i)], colors.ok, 1.1);
  }

  function* hook(): ThreadGenerator {
    yield* longTrip(1);
    yield* showBadge('250 ms', colors.danger);
    sfx('alarm', 0.35);
    yield* longTrip(1);
    yield* waitFor(0.3);
  }

  function* problem(): ThreadGenerator {
    yield* all(users[0].opacity(1, 0.4), users[2].opacity(1, 0.4));
    yield showBadge('EVERYONE HITS THE ORIGIN', colors.danger);
    for (let i = 0; i < 9; i++) {
      sfx('blip', 0.2);
      yield dot([userTop(i % 3), originBottom(i % 3)], colors.request, 0.9);
      yield* waitFor(0.25);
    }
    sfx('alarm', 0.5);
    yield* origin().fill(colors.danger, 0.4);
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.3), origin().fill(colors.panel, 0.5));
    sfx('whoosh', 0.6);
    yield* all(...edges.map(e => all(e.opacity(1, 0.6), e.scale(1, 0.6))));
    sfx('plink2', 0.5);
  }

  function* miss(): ThreadGenerator {
    yield* dot([userTop(0), edgeBottom(0)], colors.request, 0.3);
    sfx('buzz', 0.4);
    yield* showBadge('CACHE MISS', colors.danger);
    yield* dot([edgeTop(0), originBottom(0)], colors.request, 0.9);
    sfx('pop', 0.5);
    yield* origin().fill(colors.ok, 0.1);
    yield origin().fill(colors.panel, 0.4);
    yield* dot([originBottom(0), edgeTop(0)], colors.token, 0.9);
    sfx('plink0', 0.6);
    yield* copies[0].fill(colors.token, 0.3);
    yield* dot([edgeBottom(0), userTop(0)], colors.ok, 0.3);
  }

  function* hit(): ThreadGenerator {
    yield origin().opacity(0.35, 0.4);
    for (let i = 0; i < 3; i++) {
      yield* dot([userTop(0), edgeBottom(0)], colors.request, 0.25);
      sfx('ding', 0.45);
      yield* showBadge('CACHE HIT  20 ms', colors.ok);
      yield* all(
        dot([edgeBottom(0), userTop(0)], colors.ok, 0.25),
        flash(edges[0], colors.ok, colors.panel),
      );
      yield* waitFor(1.0);
    }
  }

  function* spike(): ThreadGenerator {
    yield origin().opacity(1, 0.3);
    // Every edge now holds a copy.
    yield* all(...[1, 2].map(i => chain(waitFor(i * 0.2), copies[i].fill(colors.token, 0.3))));
    sfx('plink3', 0.5);
    yield showBadge('ORIGIN: CALM', colors.ok);
    for (let i = 0; i < 12; i++) {
      sfx('blip', 0.2);
      yield dot([userTop(i % 3), edgeBottom(i % 3)], colors.request, 0.3);
      yield* waitFor(0.2);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, miss, hit, spike, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
