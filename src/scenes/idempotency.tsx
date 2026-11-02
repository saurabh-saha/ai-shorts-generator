import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  waitFor,
} from '@revideo/core';
import script from '../../data/idempotency.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -570;
const SERVER_Y = -100;
const DB_Y = 400;

export default makeScene2D('idempotency', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const keyTxt = createRef<Txt>();
  const seen = createRef<Txt>();
  const charges = createRef<Txt>();
  const badge = createRef<Txt>();
  const safe = createRef<Rect>();
  const unsafe = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={340} height={130} radius={22} fill={colors.panel} y={CLIENT_Y}>
        <Txt fontFamily={FONT} text="Client" fill={colors.muted} fontSize={38} y={-22} />
        <Txt ref={keyTxt} fontFamily={FONT} text="" fill={colors.token} fontSize={32} fontWeight={700} y={30} />
      </Rect>

      <Rect width={580} height={230} radius={28} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={SERVER_Y}>
        <Txt fontFamily={FONT} text="Payment Server" fill={colors.request} fontSize={42} fontWeight={800} y={-40} />
        <Txt ref={seen} fontFamily={FONT} text="seen keys: none" fill={colors.muted} fontSize={34} y={35} />
      </Rect>

      <Rect width={460} height={200} radius={24} fill={colors.panel} y={DB_Y}>
        <Txt fontFamily={FONT} text="Payments DB" fill={colors.text} fontSize={42} fontWeight={700} y={-30} />
        <Txt ref={charges} fontFamily={FONT} text="charged: 0x" fill={colors.ok} fontSize={46} fontWeight={800} y={35} />
      </Rect>

      <Rect ref={safe} width={450} height={130} radius={22} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} position={[-245, 190]} opacity={0}>
        <Txt fontFamily={FONT} text="SET status = paid" fill={colors.text} fontSize={34} fontWeight={700} y={-20} />
        <Txt fontFamily={FONT} text="safe to repeat" fill={colors.ok} fontSize={32} fontWeight={800} y={28} />
      </Rect>
      <Rect ref={unsafe} width={450} height={130} radius={22} fill={colors.panel} stroke={colors.danger}
        lineWidth={5} position={[245, 190]} opacity={0}>
        <Txt fontFamily={FONT} text="ADD $10 to balance" fill={colors.text} fontSize={34} fontWeight={700} y={-20} />
        <Txt fontFamily={FONT} text="repeat = double" fill={colors.danger} fontSize={32} fontWeight={800} y={28} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={52} fontWeight={800}
        y={190} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="CAP Theorem" fill={colors.token} fontSize={110} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const clientPt: P = [0, CLIENT_Y + 75];
  const serverTop: P = [0, SERVER_Y - 120];
  const serverBottom: P = [0, SERVER_Y + 120];
  const dbTop: P = [0, DB_Y - 105];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function setCharges(n: number, color: string) {
    charges().text(`charged: ${n}x`);
    charges().fill(color);
  }

  // Client -> server -> database: a charge is recorded.
  function* sendCharge(n: number, color: string): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([clientPt, serverTop], colors.request, 0.45);
    yield* dot([serverBottom, dbTop], colors.request, 0.4);
    sfx('pop', 0.45);
    setCharges(n, color);
  }

  // The response is lost on its way back: the client never sees it.
  function* lostResponse(): ThreadGenerator {
    yield* dot([serverTop, [0, -400]], colors.danger, 0.4);
    sfx('buzz', 0.4);
    yield* showBadge('RESPONSE LOST: TIMEOUT', colors.danger);
    yield* waitFor(0.6);
  }

  function* hook(): ThreadGenerator {
    yield* sendCharge(1, colors.ok);
    yield* lostResponse();
    yield* showBadge('CLIENT RETRIES...', colors.token);
    yield* waitFor(0.4);
    yield* sendCharge(2, colors.danger);
    sfx('alarm', 0.5);
    yield* showBadge('CHARGED TWICE!', colors.danger);
  }

  function* problem(): ThreadGenerator {
    yield* showBadge('RETRIES EVERYWHERE', colors.danger);
    for (let n = 3; n <= 5; n++) {
      yield* sendCharge(n, colors.danger);
      yield* waitFor(0.6);
    }
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.3);
    setCharges(0, colors.ok);
    sfx('whoosh', 0.5);
    yield* safe().opacity(1, 0.5);
    sfx('plink2', 0.5);
    yield* waitFor(1.2);
    yield* unsafe().opacity(1, 0.5);
    sfx('buzz', 0.4);
  }

  function* key(): ThreadGenerator {
    yield* all(safe().opacity(0, 0.3), unsafe().opacity(0, 0.3));
    keyTxt().text('key: abc123');
    sfx('plink3', 0.5);
    yield* waitFor(0.8);
    // First request carries the key; the server stores it and processes the charge.
    sfx('blip', 0.25);
    yield* dot([clientPt, serverTop], colors.token, 0.45);
    seen().text('seen keys: abc123');
    seen().fill(colors.token);
    yield* dot([serverBottom, dbTop], colors.token, 0.4);
    sfx('pop', 0.45);
    setCharges(1, colors.ok);
  }

  function* dedupe(): ThreadGenerator {
    yield* lostResponse();
    yield* showBadge('CLIENT RETRIES: SAME KEY', colors.token);
    yield* waitFor(0.4);
    // The retry reaches the server but never touches the database.
    sfx('blip', 0.25);
    yield* dot([clientPt, serverTop], colors.token, 0.45);
    sfx('ding', 0.5);
    yield* showBadge('ALREADY SEEN: SAVED RESPONSE', colors.token);
    yield* dot([serverTop, clientPt], colors.ok, 0.45);
    yield* waitFor(0.6);
    yield* showBadge('CHARGED EXACTLY ONCE', colors.ok);
    sfx('plink4', 0.5);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, key, dedupe, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.8} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
