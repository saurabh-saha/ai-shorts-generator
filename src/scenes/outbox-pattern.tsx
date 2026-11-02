import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  waitFor,
} from '@revideo/core';
import script from '../../data/outbox-pattern.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const SERVICE: P = [0, -540];
const DB_X = -270;
const DB_Y = 60;
const RELAY: P = [270, -90];
const BROKER_X = 270;
const BROKER_Y = 380;
const DEAD_FILL = '#7f1d1d';

export default makeScene2D('outbox-pattern', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const service = createRef<Rect>();
  const serviceTxt = createRef<Txt>();
  const db = createRef<Rect>();
  const ordersRow = createRef<Rect>();
  const ordersTxt = createRef<Txt>();
  const outboxRow = createRef<Rect>();
  const outboxTxt = createRef<Txt>();
  const outboxState = createRef<Txt>();
  const txBox = createRef<Rect>();
  const relay = createRef<Rect>();
  const relayTxt = createRef<Txt>();
  const broker = createRef<Rect>();
  const brokerTxt = createRef<Txt>();
  const chip1 = createRef<Rect>();
  const chip2 = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  let delivered = 0;

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={service} width={420} height={130} radius={24} fill={colors.panel} stroke={colors.request}
        lineWidth={6} position={SERVICE}>
        <Txt fontFamily={FONT} text="Order Service" fill={colors.request} fontSize={42} fontWeight={800} y={-22} />
        <Txt ref={serviceTxt} fontFamily={FONT} text="new order" fill={colors.muted} fontSize={30} y={28} />
      </Rect>

      <Rect ref={db} width={460} height={340} radius={26} fill={colors.panel} stroke={colors.empty}
        lineWidth={6} position={[DB_X, DB_Y]}>
        <Txt fontFamily={FONT} text="Database" fill={colors.text} fontSize={40} fontWeight={800} y={-135} />
        <Rect ref={ordersRow} width={400} height={80} radius={14} fill={colors.empty} y={-45}>
          <Txt fontFamily={FONT} text="orders" fill={colors.muted} fontSize={24} x={-120} y={-22} />
          <Txt ref={ordersTxt} fontFamily={FONT} text="(empty)" fill={colors.muted} fontSize={30} fontWeight={700} y={10} />
        </Rect>
        <Rect ref={outboxRow} width={400} height={80} radius={14} fill={colors.empty} y={55}>
          <Txt fontFamily={FONT} text="outbox" fill={colors.muted} fontSize={24} x={-120} y={-22} />
          <Txt ref={outboxTxt} fontFamily={FONT} text="(empty)" fill={colors.muted} fontSize={30} fontWeight={700} x={-30} y={10} />
          <Txt ref={outboxState} fontFamily={FONT} text="" fill={colors.token} fontSize={26} fontWeight={800} x={135} y={10} />
        </Rect>
        <Rect ref={txBox} width={430} height={230} radius={20} stroke={colors.token} lineWidth={5} y={5} opacity={0} />
      </Rect>

      <Rect ref={relay} width={380} height={130} radius={24} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} position={RELAY} opacity={0}>
        <Txt fontFamily={FONT} text="Relay" fill={colors.ok} fontSize={42} fontWeight={800} y={-22} />
        <Txt ref={relayTxt} fontFamily={FONT} text="polls the outbox" fill={colors.muted} fontSize={28} y={28} />
      </Rect>

      <Rect ref={broker} width={420} height={170} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} position={[BROKER_X, BROKER_Y]}>
        <Txt fontFamily={FONT} text="Message broker" fill={colors.request} fontSize={38} fontWeight={800} y={-30} />
        <Txt ref={brokerTxt} fontFamily={FONT} text="events: 0" fill={colors.text} fontSize={44} fontWeight={800} y={28} />
      </Rect>

      <Rect ref={chip1} width={800} height={90} radius={20} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={-170} opacity={0}>
        <Txt fontFamily={FONT} text="At-least-once delivery" fill={colors.token} fontSize={44} fontWeight={800} />
      </Rect>
      <Rect ref={chip2} width={800} height={90} radius={20} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} y={-40} opacity={0}>
        <Txt fontFamily={FONT} text="Consumers must be idempotent" fill={colors.ok} fontSize={40} fontWeight={800} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={560} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Change Data Capture" fill={colors.token} fontSize={74} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const serviceBottom: P = [SERVICE[0], SERVICE[1] + 75];
  const dbTop: P = [DB_X, DB_Y - 175];
  const outboxRight: P = [DB_X + 235, DB_Y + 55];
  const relayLeft: P = [RELAY[0] - 195, RELAY[1]];
  const relayBottom: P = [RELAY[0], RELAY[1] + 70];
  const brokerTop: P = [BROKER_X, BROKER_Y - 90];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, c: string, back = colors.empty) => chain(r.fill(c, 0.12), r.fill(back, 0.3));

  function setOrder(text: string) {
    ordersTxt().text(text);
    ordersTxt().fill(colors.text);
  }
  function setOutbox(text: string, state: string, color: string) {
    outboxTxt().text(text);
    outboxTxt().fill(colors.text);
    outboxState().text(state);
    outboxState().fill(color);
  }
  function clearDb() {
    ordersTxt().text('(empty)');
    ordersTxt().fill(colors.muted);
    outboxTxt().text('(empty)');
    outboxTxt().fill(colors.muted);
    outboxState().text('');
  }

  function* deliver(label: string): ThreadGenerator {
    yield* dot([relayBottom, brokerTop], colors.token, 0.6);
    delivered++;
    brokerTxt().text(`events: ${delivered}`);
    sfx('pop', 0.5);
    yield* flash(broker(), colors.ok, colors.panel);
    outboxState().text('sent');
    outboxState().fill(colors.ok);
  }

  function* hook(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([serviceBottom, dbTop], colors.request, 0.6);
    setOrder('order #1 saved');
    sfx('pop', 0.5);
    yield* flash(ordersRow(), colors.ok);
    yield* waitFor(0.6);
    // The service now tries to publish, but crashes on the way.
    sfx('blip', 0.3);
    yield dot([serviceBottom, [BROKER_X - 120, -250]], colors.request, 0.9);
    yield* waitFor(0.45);
    sfx('alarm', 0.5);
    serviceTxt().text('CRASH');
    serviceTxt().fill(colors.text);
    yield* all(service().fill(DEAD_FILL, 0.3), service().stroke(colors.danger, 0.3));
  }

  function* problem(): ThreadGenerator {
    yield* showBadge('DUAL WRITE PROBLEM', colors.danger);
    yield* all(broker().stroke(colors.danger, 0.4), brokerTxt().fill(colors.danger, 0.4));
    sfx('buzz', 0.4);
    yield* waitFor(2);
    yield* showBadge('DB: ORDER SAVED.  BROKER: NOTHING.', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // Start over: the service is back and the database is empty.
    clearDb();
    brokerTxt().fill(colors.text);
    delivered = 0;
    brokerTxt().text('events: 0');
    yield* all(service().fill(colors.panel, 0.3), service().stroke(colors.request, 0.3),
      broker().stroke(colors.request, 0.3));
    serviceTxt().text('new order');
    serviceTxt().fill(colors.muted);
    yield* waitFor(0.4);
    sfx('whoosh', 0.5);
    yield* txBox().opacity(1, 0.3);
    yield* showBadge('ONE LOCAL TRANSACTION', colors.token);
    sfx('blip', 0.3);
    yield* dot([serviceBottom, dbTop], colors.request, 0.6);
    setOrder('order #1');
    setOutbox('OrderPlaced #1', 'pending', colors.token);
    sfx('plink1', 0.5);
    sfx('plink3', 0.5);
    yield* all(flash(ordersRow(), colors.ok), flash(outboxRow(), colors.token));
  }

  function* relayBeat(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), txBox().opacity(0, 0.3));
    sfx('whoosh', 0.5);
    yield* relay().opacity(1, 0.5);
    yield* showBadge('RELAY: PUBLISH, THEN MARK SENT', colors.ok);
    sfx('blip', 0.3);
    yield* dot([outboxRight, relayLeft], colors.token, 0.6);
    yield* deliver('#1');
  }

  function* crash(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // A second order: saved together with its outbox row.
    sfx('blip', 0.3);
    yield* dot([serviceBottom, dbTop], colors.request, 0.5);
    setOrder('order #2');
    setOutbox('OrderPlaced #2', 'pending', colors.token);
    sfx('plink1', 0.5);
    yield* all(flash(ordersRow(), colors.ok), flash(outboxRow(), colors.token));
    // The relay picks it up and dies before publishing.
    sfx('blip', 0.3);
    yield* dot([outboxRight, relayLeft], colors.token, 0.5);
    sfx('alarm', 0.5);
    relayTxt().text('DOWN');
    relayTxt().fill(colors.text);
    yield* all(relay().fill(DEAD_FILL, 0.3), relay().stroke(colors.danger, 0.3));
    yield* showBadge('STILL SAFE IN THE OUTBOX', colors.token);
    yield* waitFor(1);
    // It restarts and tries again.
    sfx('whoosh', 0.5);
    relayTxt().text('restarted: retry');
    relayTxt().fill(colors.ok);
    yield* all(relay().fill(colors.panel, 0.3), relay().stroke(colors.ok, 0.3));
    yield* dot([outboxRight, relayLeft], colors.token, 0.5);
    yield* deliver('#2');
    yield* showBadge('NOTHING LOST', colors.ok);
  }

  function* tradeoff(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      service().opacity(0, 0.4),
      db().opacity(0, 0.4),
      relay().opacity(0, 0.4),
      broker().opacity(0, 0.4),
    );
    sfx('plink1', 0.5);
    yield* chip1().opacity(1, 0.3);
    yield* waitFor(1.8);
    sfx('plink3', 0.5);
    yield* chip2().opacity(1, 0.3);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, problem, concept, relay: relayBeat, crash, tradeoff, close,
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
