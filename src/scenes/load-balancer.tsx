import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/load-balancer.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -520;
const LB_Y = -130;
const SERVER_Y = 380;
const CLIENT_X = [-300, 0, 300];
const SERVER_X = [-330, 0, 330];
const BAR_W = 200;
const NAMES = ['Server A', 'Server B', 'Server C'];

export default makeScene2D('load-balancer', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const lb = createRef<Rect>();
  const mode = createRef<Txt>();
  const status = createRef<Txt>();
  const endCard = createRef<Rect>();
  const boxes = createRefArray<Rect>();
  const labels = createRefArray<Txt>();
  const bars = createRefArray<Rect>();
  const loads = [0, 0, 0];
  const {sfx, dot, sweep} = makeKit(view);

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

      <Rect ref={lb} width={440} height={160} radius={28} fill={colors.panel}
        stroke={colors.request} lineWidth={6} position={[0, LB_Y]} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="LOAD BALANCER" fill={colors.request} fontSize={40} fontWeight={800} y={-20} />
        <Txt ref={mode} fontFamily={FONT} text="" fill={colors.token} fontSize={34} y={30} />
      </Rect>

      {SERVER_X.map((x, i) => (
        <Rect ref={boxes} width={290} height={200} radius={24} fill={colors.panel}
          position={[x, SERVER_Y]} opacity={i === 1 ? 1 : 0}>
          <Txt ref={labels} fontFamily={FONT} text={i === 1 ? 'Server' : NAMES[i]} fill={colors.text}
            fontSize={42} fontWeight={700} y={-25} />
          <Rect width={BAR_W} height={18} radius={9} fill={colors.empty} y={50} />
          <Rect ref={bars} width={0} height={18} radius={9} fill={colors.token} x={-BAR_W / 2} y={50}
            offset={[-1, 0]} />
        </Rect>
      ))}

      <Txt ref={status} fontFamily={FONT} text="" fill={colors.danger} fontSize={52} fontWeight={800}
        y={200} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Caching" fill={colors.token} fontSize={120} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const clientPt = (ci: number): P => [CLIENT_X[ci], CLIENT_Y + 60];
  const serverTop = (si: number): P => [SERVER_X[si], SERVER_Y - 110];

  // Client -> load balancer -> server; the server flashes and its load bar grows.
  function* send(ci: number, si: number, bump = 0.1): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([clientPt(ci), [0, LB_Y - 85], serverTop(si)], colors.request, 0.45);
    sfx('pop', 0.45);
    loads[si] = Math.min(1, loads[si] + bump);
    yield* all(
      bars[si].width(loads[si] * BAR_W, 0.25),
      chain(boxes[si].fill(colors.ok, 0.1), boxes[si].fill(colors.panel, 0.3)),
    );
  }

  // One server, no balancer: requests go straight to the middle server.
  const direct = (i: number) => {
    sfx('blip', 0.25);
    return dot([clientPt(i % 3), serverTop(1)], colors.request, 0.7);
  };

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 12; i++) {
      yield direct(i);
      yield* waitFor(0.15);
    }
    sfx('alarm', 0.5);
    yield* boxes[1].fill(colors.danger, 0.4);
  }

  function* problem(): ThreadGenerator {
    status().text('SINGLE POINT OF FAILURE');
    sfx('alarm', 0.4);
    yield* status().opacity(1, 0.3);
    for (let i = 0; i < 8; i++) {
      yield direct(i);
      yield* waitFor(0.2);
    }
  }

  function* concept(): ThreadGenerator {
    yield* all(status().opacity(0, 0.3), boxes[1].fill(colors.panel, 0.5));
    sfx('whoosh', 0.6);
    labels[1].text('Server B');
    yield* all(
      lb().opacity(1, 0.6),
      lb().scale(1, 0.6),
      boxes[0].opacity(1, 0.6),
      boxes[2].opacity(1, 0.6),
    );
  }

  function* roundrobin(): ThreadGenerator {
    mode().text('round robin');
    for (let i = 0; i < 6; i++) {
      yield send(i % 3, i % 3);
      yield* waitFor(0.9);
    }
  }

  function* leastconn(): ThreadGenerator {
    mode().text('least connections');
    const target = [0.85, 0.3, 0.6];
    target.forEach((v, i) => (loads[i] = v));
    yield* all(...bars.map((b, i) => b.width(target[i] * BAR_W, 0.5)));
    for (let r = 0; r < 4; r++) {
      const si = loads.indexOf(Math.min(...loads));
      yield send(r % 3, si, 0.2);
      yield* waitFor(1.2);
    }
  }

  function* health(): ThreadGenerator {
    mode().text('health checks');
    sfx('alarm', 0.5);
    labels[2].text('DOWN');
    yield* boxes[2].fill(colors.danger, 0.4);
    const alive = [0, 1];
    for (let i = 0; i < 4; i++) {
      yield send(i % 3, alive[i % 2], 0);
      yield* waitFor(0.9);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, problem, concept, roundrobin, leastconn, health, close,
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
