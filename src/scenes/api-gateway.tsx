import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/api-gateway.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -560;
const GW_Y = -130;
const SVC_Y = 380;
const X = [-330, 0, 330];
const SERVICES = ['Users', 'Orders', 'Payments'];

export default makeScene2D('api-gateway', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const gateway = createRef<Rect>();
  const calc = createRef<Txt>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const svcs = createRefArray<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      {X.map(x => (
        <Rect width={150} height={110} radius={20} fill={colors.panel} position={[x, CLIENT_Y]}>
          <Txt fontFamily={FONT} text="Client" fill={colors.muted} fontSize={36} />
        </Rect>
      ))}

      <Rect ref={gateway} width={580} height={180} radius={28} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={GW_Y} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="API GATEWAY" fill={colors.request} fontSize={42} fontWeight={800} y={-32} />
        <Txt ref={calc} fontFamily={FONT} text="" fill={colors.token} fontSize={36} y={32} />
      </Rect>

      {X.map((x, i) => (
        <Rect ref={svcs} width={290} height={190} radius={24} fill={colors.panel} position={[x, SVC_Y]}>
          <Txt fontFamily={FONT} text={SERVICES[i]} fill={colors.text} fontSize={42} fontWeight={700} y={-15} />
          <Txt fontFamily={FONT} text="service" fill={colors.muted} fontSize={30} y={40} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={185} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Circuit Breakers" fill={colors.token} fontSize={92} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const clientPt = (i: number): P => [X[i], CLIENT_Y + 60];
  const gwTop: P = [0, GW_Y - 105];
  const gwBottom: P = [0, GW_Y + 105];
  const svcTop = (i: number): P => [X[i], SVC_Y - 105];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (i: number) => chain(svcs[i].fill(colors.ok, 0.1), svcs[i].fill(colors.panel, 0.3));

  // Client -> gateway -> service.
  function* route(ci: number, si: number): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([clientPt(ci), gwTop, svcTop(si)], colors.request, 0.4);
    sfx('pop', 0.45);
    yield* flash(si);
  }

  // Before the gateway: every client calls every service directly.
  const direct = (i: number) => {
    sfx('blip', 0.2);
    return dot([clientPt(i % 3), svcTop(Math.floor(i / 3) % 3)], colors.request, 0.8);
  };

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 9; i++) {
      yield direct(i);
      yield* waitFor(0.3);
    }
  }

  function* problem(): ThreadGenerator {
    yield showBadge('EVERY CLIENT KNOWS EVERY SERVICE', colors.danger);
    sfx('alarm', 0.4);
    for (let i = 0; i < 9; i++) {
      yield direct(i);
      yield* waitFor(0.3);
    }
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.3);
    sfx('whoosh', 0.6);
    yield* all(gateway().opacity(1, 0.6), gateway().scale(1, 0.6));
    calc().text('single front door');
    sfx('plink2', 0.5);
    yield* waitFor(0.8);
    yield* route(1, 1);
  }

  function* routing(): ThreadGenerator {
    const reqs: [number, number, string][] = [
      [0, 0, '/users'],
      [1, 1, '/orders'],
      [2, 2, '/pay'],
      [0, 1, '/orders'],
    ];
    for (const [ci, si, path] of reqs) {
      calc().fill(colors.token);
      calc().text(`${path}  ->  ${SERVICES[si]}`);
      yield* route(ci, si);
      yield* waitFor(0.4);
    }
  }

  function* auth(): ThreadGenerator {
    yield showBadge('AUTH · RATE LIMIT · LOGGING', colors.token);
    // A request without a token is stopped at the gateway.
    calc().fill(colors.danger);
    calc().text('no token: 401');
    sfx('blip', 0.3);
    yield* dot([clientPt(2), gwTop, clientPt(2)], colors.danger, 0.4);
    sfx('buzz', 0.5);
    yield* waitFor(1);
    // A valid one is let through.
    calc().fill(colors.ok);
    calc().text('token OK');
    yield* route(0, 2);
    yield* waitFor(0.6);
  }

  function* aggregate(): ThreadGenerator {
    calc().fill(colors.token);
    calc().text('combine responses');
    yield showBadge('ONE CALL, MANY SERVICES', colors.ok);
    for (let r = 0; r < 2; r++) {
      sfx('blip', 0.3);
      yield* dot([clientPt(1), gwTop], colors.request, 0.35);
      sfx('whoosh', 0.3);
      yield* all(...[0, 1, 2].map(i => dot([gwBottom, svcTop(i)], colors.request, 0.5)));
      yield* all(...[0, 1, 2].map(i => dot([svcTop(i), gwBottom], colors.ok, 0.5)));
      sfx('ding', 0.45);
      yield* dot([gwTop, clientPt(1)], colors.ok, 0.35);
      yield* waitFor(0.5);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, routing, auth, aggregate, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
