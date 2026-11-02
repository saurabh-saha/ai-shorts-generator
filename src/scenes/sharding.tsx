import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  linear,
  waitFor,
} from '@revideo/core';
import script from '../../data/sharding.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -560;
const ROUTER_Y = -150;
const SHARD_Y = 380;
const SHARD_X = [-330, 0, 330];
const BAR_W = 200;

export default makeScene2D('sharding', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const router = createRef<Rect>();
  const calc = createRef<Txt>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const boxes = createRefArray<Rect>();
  const labels = createRefArray<Txt>();
  const bars = createRefArray<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={190} height={110} radius={20} fill={colors.panel} y={CLIENT_Y}>
        <Txt fontFamily={FONT} text="Client" fill={colors.muted} fontSize={36} />
      </Rect>

      <Rect ref={router} width={520} height={170} radius={28} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={ROUTER_Y} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="ROUTER" fill={colors.request} fontSize={40} fontWeight={800} y={-30} />
        <Txt ref={calc} fontFamily={FONT} text="" fill={colors.token} fontSize={34} y={30} />
      </Rect>

      {SHARD_X.map((x, i) => (
        <Rect ref={boxes} width={290} height={200} radius={24} fill={colors.panel}
          position={[x, SHARD_Y]} opacity={i === 1 ? 1 : 0}>
          <Txt ref={labels} fontFamily={FONT} text={i === 1 ? 'Database' : `Shard ${i}`} fill={colors.text}
            fontSize={42} fontWeight={700} y={-25} />
          <Rect width={BAR_W} height={18} radius={9} fill={colors.empty} y={50} />
          <Rect ref={bars} width={0} height={18} radius={9} fill={colors.token} x={-BAR_W / 2} y={50}
            offset={[-1, 0]} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={50} fontWeight={800}
        y={190} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Consistent Hashing" fill={colors.token} fontSize={84} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const clientPt: P = [0, CLIENT_Y + 60];
  const routerTop: P = [0, ROUTER_Y - 100];
  const routerBottom: P = [0, ROUTER_Y + 100];
  const shardTop = (i: number): P => [SHARD_X[i], SHARD_Y - 110];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (i: number) =>
    chain(boxes[i].fill(colors.ok, 0.1), boxes[i].fill(colors.panel, 0.3));

  // Client -> router -> shard `si`; the shard flashes when it gets the request.
  function* route(si: number): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([clientPt, routerTop, shardTop(si)], colors.request, 0.4);
    sfx('pop', 0.45);
    yield* flash(si);
  }

  // Before sharding: everything goes straight to the one database.
  const direct = () => {
    sfx('blip', 0.25);
    return dot([clientPt, shardTop(1)], colors.request, 0.7);
  };

  function* hook(): ThreadGenerator {
    yield bars[1].width(BAR_W, 3.2, linear);
    for (let i = 0; i < 14; i++) {
      yield direct();
      yield* waitFor(0.2);
    }
    sfx('alarm', 0.5);
    yield* all(boxes[1].fill(colors.danger, 0.4), bars[1].fill(colors.danger, 0.4));
  }

  function* problem(): ThreadGenerator {
    yield showBadge('ONE MACHINE = ONE LIMIT', colors.danger);
    sfx('alarm', 0.4);
    for (let i = 0; i < 8; i++) {
      yield direct();
      yield* waitFor(0.25);
    }
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.3), boxes[1].fill(colors.panel, 0.5), bars[1].fill(colors.token, 0.5));
    sfx('whoosh', 0.6);
    labels[1].text('Shard 1');
    yield* all(
      router().opacity(1, 0.6),
      router().scale(1, 0.6),
      boxes[0].opacity(1, 0.6),
      boxes[2].opacity(1, 0.6),
    );
    // The data is spread evenly: each shard holds a third.
    sfx('plink2', 0.5);
    yield* all(...bars.map(b => b.width(BAR_W / 3, 1)));
  }

  function* shardkey(): ThreadGenerator {
    for (const id of [7, 12, 14, 21, 9]) {
      calc().text(`user ${id}:  ${id} % 3 = ${id % 3}`);
      yield* route(id % 3);
      yield* waitFor(0.3);
    }
  }

  function* hotspot(): ThreadGenerator {
    calc().text('key = signup date');
    yield all(boxes[0].opacity(0.4, 0.3), boxes[1].opacity(0.4, 0.3));
    yield showBadge('HOT SHARD', colors.danger);
    yield bars[2].width(BAR_W, 2.4, linear);
    for (let i = 0; i < 8; i++) {
      yield route(2);
      yield* waitFor(0.3);
    }
    sfx('alarm', 0.5);
    yield* all(boxes[2].fill(colors.danger, 0.4), bars[2].fill(colors.danger, 0.4));
  }

  function* tradeoff(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      boxes[0].opacity(1, 0.3),
      boxes[1].opacity(1, 0.3),
      boxes[2].fill(colors.panel, 0.3),
      bars[2].fill(colors.token, 0.3),
      bars[2].width(BAR_W / 3, 0.3),
    );
    calc().text('query: all users');
    yield* showBadge('CROSS-SHARD QUERY', colors.token);
    for (let r = 0; r < 2; r++) {
      sfx('blip', 0.3);
      yield* dot([clientPt, routerTop], colors.request, 0.35);
      // Fan out to every shard...
      sfx('whoosh', 0.3);
      yield* all(...[0, 1, 2].map(i => dot([routerBottom, shardTop(i)], colors.request, 0.5)));
      // ...then gather the answers back.
      yield* all(...[0, 1, 2].map(i => dot([shardTop(i), routerBottom], colors.ok, 0.5)));
      sfx('ding', 0.4);
      yield* dot([routerTop, clientPt], colors.ok, 0.35);
      yield* waitFor(0.5);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, problem, concept, shardkey, hotspot, tradeoff, close,
  };

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
