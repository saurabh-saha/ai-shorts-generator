import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  waitFor,
} from '@revideo/core';
import script from '../../data/cqrs.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -580;
const HANDLER_Y = -170;
const DB_Y = 220;
const X_CMD = -290;
const X_QRY = 290;

export default makeScene2D('cqrs', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const single = createRef<Rect>();
  const cmd = createRef<Rect>();
  const cmdSub = createRef<Txt>();
  const qry = createRef<Rect>();
  const wdb = createRef<Rect>();
  const wCount = createRef<Txt>();
  const rdb = createRef<Rect>();
  const rCount = createRef<Txt>();
  const eventsLabel = createRef<Txt>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  let orders = 0; // orders in the write model
  let shown = 0; // orders visible in the read model

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={110} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={320} height={110} radius={22} fill={colors.panel} y={CLIENT_Y}>
        <Txt fontFamily={FONT} text="Client" fill={colors.muted} fontSize={40} />
      </Rect>

      <Rect ref={single} width={600} height={220} radius={28} fill={colors.panel} y={DB_Y}>
        <Txt fontFamily={FONT} text="One database" fill={colors.text} fontSize={46} fontWeight={800} y={-30} />
        <Txt fontFamily={FONT} text="writes + reads" fill={colors.muted} fontSize={34} y={30} />
      </Rect>

      <Rect ref={cmd} width={400} height={170} radius={26} fill={colors.panel} stroke={colors.token}
        lineWidth={6} position={[X_CMD, HANDLER_Y]} opacity={0}>
        <Txt fontFamily={FONT} text="Command side" fill={colors.token} fontSize={38} fontWeight={800} y={-30} />
        <Txt ref={cmdSub} fontFamily={FONT} text="validate + rules" fill={colors.muted} fontSize={30} y={28} />
      </Rect>
      <Rect ref={qry} width={400} height={170} radius={26} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} position={[X_QRY, HANDLER_Y]} opacity={0}>
        <Txt fontFamily={FONT} text="Query side" fill={colors.ok} fontSize={38} fontWeight={800} y={-30} />
        <Txt fontFamily={FONT} text="just read" fill={colors.muted} fontSize={30} y={28} />
      </Rect>

      <Rect ref={wdb} width={400} height={190} radius={26} fill={colors.panel} stroke={colors.token}
        lineWidth={6} position={[X_CMD, DB_Y]} opacity={0}>
        <Txt fontFamily={FONT} text="Write model" fill={colors.token} fontSize={38} fontWeight={800} y={-45} />
        <Txt ref={wCount} fontFamily={FONT} text="orders: 0" fill={colors.text} fontSize={44} fontWeight={800} y={15} />
        <Txt fontFamily={FONT} text="normalized" fill={colors.muted} fontSize={28} y={62} />
      </Rect>
      <Rect ref={rdb} width={400} height={190} radius={26} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} position={[X_QRY, DB_Y]} opacity={0}>
        <Txt fontFamily={FONT} text="Read model" fill={colors.ok} fontSize={38} fontWeight={800} y={-45} />
        <Txt ref={rCount} fontFamily={FONT} text="orders: 0" fill={colors.text} fontSize={44} fontWeight={800} y={15} />
        <Txt fontFamily={FONT} text="ready-made views" fill={colors.muted} fontSize={28} y={62} />
      </Rect>
      <Txt ref={eventsLabel} fontFamily={FONT} text="events" fill={colors.token} fontSize={34} fontWeight={800}
        y={DB_Y - 45} opacity={0} />

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={430} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Outbox Pattern" fill={colors.token} fontSize={92} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const clientPt: P = [0, CLIENT_Y + 60];
  const handlerTop = (x: number): P => [x, HANDLER_Y - 90];
  const handlerBottom = (x: number): P => [x, HANDLER_Y + 90];
  const dbTop = (x: number): P => [x, DB_Y - 100];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, c: string) => chain(r.fill(c, 0.12), r.fill(colors.panel, 0.3));

  // Both kinds of traffic hit the one database.
  function* hook(): ThreadGenerator {
    for (let i = 0; i < 12; i++) {
      sfx('blip', 0.2);
      yield dot([clientPt, [0, DB_Y - 115]], i % 2 ? colors.ok : colors.token, 0.7);
      yield* waitFor(0.2);
    }
    sfx('alarm', 0.5);
    yield* single().fill('#7f1d1d', 0.4);
    yield* showBadge('ONE MODEL FOR EVERYTHING', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), single().opacity(0, 0.4));
    sfx('whoosh', 0.6);
    yield* all(cmd().opacity(1, 0.5), qry().opacity(1, 0.5), wdb().opacity(1, 0.5), rdb().opacity(1, 0.5));
    sfx('plink2', 0.5);
    yield* showBadge('COMMANDS  |  QUERIES', colors.token);
  }

  function* commands(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('COMMAND: PlaceOrder', colors.token);
    sfx('blip', 0.3);
    yield* dot([clientPt, handlerTop(X_CMD)], colors.token, 0.5);
    cmdSub().text('validating...');
    cmdSub().fill(colors.token);
    yield* waitFor(0.8);
    cmdSub().text('valid');
    cmdSub().fill(colors.ok);
    sfx('ding', 0.5);
    yield* dot([handlerBottom(X_CMD), dbTop(X_CMD)], colors.ok, 0.5);
    orders++;
    wCount().text(`orders: ${orders}`);
    sfx('pop', 0.5);
    yield* flash(wdb(), colors.ok);
  }

  // The write model publishes an event; the read model applies it after `t` seconds.
  function* publish(t = 0.8): ThreadGenerator {
    yield eventsLabel().opacity(1, 0.2);
    sfx('whoosh', 0.3);
    yield* dot([[X_CMD + 205, DB_Y], [X_QRY - 205, DB_Y]], colors.token, t);
    shown = orders;
    rCount().text(`orders: ${shown}`);
    sfx('pop', 0.5);
    yield* flash(rdb(), colors.ok);
  }

  function* sync(): ThreadGenerator {
    yield* showBadge('EVENT UPDATES THE READ MODEL', colors.token);
    yield* publish();
  }

  function* queries(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('QUERY: FAST, NO JOINS', colors.ok);
    for (let i = 0; i < 3; i++) {
      sfx('blip', 0.3);
      yield* dot([clientPt, handlerTop(X_QRY)], colors.request, 0.4);
      yield* dot([handlerBottom(X_QRY), dbTop(X_QRY)], colors.request, 0.4);
      sfx('ding', 0.4);
      yield* dot([dbTop(X_QRY), clientPt], colors.ok, 0.7);
      yield* waitFor(0.3);
    }
    yield* showBadge('SCALE READS + WRITES SEPARATELY', colors.ok);
  }

  function* tradeoff(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // A new command lands; its event is slow to reach the read model.
    sfx('blip', 0.3);
    yield* dot([clientPt, handlerTop(X_CMD)], colors.token, 0.4);
    yield* dot([handlerBottom(X_CMD), dbTop(X_CMD)], colors.ok, 0.4);
    orders++;
    wCount().text(`orders: ${orders}`);
    yield flash(wdb(), colors.ok);
    yield publish(2.2);
    yield* waitFor(0.6);
    // A query during the lag sees the old data.
    sfx('blip', 0.3);
    yield* dot([clientPt, handlerTop(X_QRY)], colors.request, 0.4);
    yield* dot([handlerBottom(X_QRY), dbTop(X_QRY)], colors.request, 0.4);
    sfx('buzz', 0.4);
    yield* showBadge('STALE FOR A MOMENT: EVENTUALLY CONSISTENT', colors.token);
    yield* waitFor(2);
    yield* showBadge('TWO MODELS TO RUN', colors.danger);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, concept, commands, sync, queries, tradeoff, close,
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
