import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  range,
  waitFor,
} from '@revideo/core';
import script from '../../data/change-data-capture.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const DB_Y = -540;
const LOG_Y = -330;
const CDC_Y = -120;
const STREAM_Y = 100;
const CONS_Y = 360;
const CONS_X = [-300, 0, 300];
const CONS_NAMES = ['Search', 'Cache', 'Analytics'];
const CHANGES: [string, string][] = [
  ['INSERT', colors.ok],
  ['UPDATE', colors.token],
  ['DELETE', colors.danger],
  ['UPDATE', colors.token],
];
const BENEFITS = ['No app code changes', 'Captures deletes', 'Powers outbox relays'];
const chipX = (i: number) => (i - 1.5) * 215;

export default makeScene2D('change-data-capture', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const db = createRef<Rect>();
  const logBox = createRef<Rect>();
  const logChips = createRefArray<Rect>();
  const cdc = createRef<Rect>();
  const stream = createRef<Rect>();
  const streamChips = createRefArray<Rect>();
  const cons = createRefArray<Rect>();
  const consState = createRefArray<Txt>();
  const benefit = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  const chip = (refs: ReturnType<typeof createRefArray<Rect>>, text: string, color: string, i: number, y: number) => (
    <Rect ref={refs} width={200} height={56} radius={12} fill={colors.panel} stroke={color} lineWidth={4}
      position={[chipX(i), y]} opacity={0}>
      <Txt fontFamily={FONT} text={text} fill={color} fontSize={28} fontWeight={800} />
    </Rect>
  );

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={82} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={db} width={460} height={140} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={DB_Y}>
        <Txt fontFamily={FONT} text="Database" fill={colors.request} fontSize={44} fontWeight={800} y={-18} />
        <Txt fontFamily={FONT} text="orders table" fill={colors.muted} fontSize={30} y={28} />
      </Rect>

      <Rect ref={logBox} width={920} height={130} radius={22} fill={colors.panel} stroke={colors.empty}
        lineWidth={5} y={LOG_Y} opacity={0}>
        <Txt fontFamily={FONT} text="transaction log (WAL)" fill={colors.muted} fontSize={26} fontWeight={700} y={-42} />
        {CHANGES.map(([t, c], i) => chip(logChips, t, c, i, 20))}
      </Rect>

      <Rect ref={cdc} width={460} height={130} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={CDC_Y} opacity={0}>
        <Txt fontFamily={FONT} text="CDC connector" fill={colors.request} fontSize={40} fontWeight={800} y={-18} />
        <Txt fontFamily={FONT} text="reads the log" fill={colors.muted} fontSize={28} y={28} />
      </Rect>

      <Rect ref={stream} width={920} height={130} radius={22} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} y={STREAM_Y} opacity={0}>
        <Txt fontFamily={FONT} text="event stream" fill={colors.ok} fontSize={26} fontWeight={700} y={-42} />
        {CHANGES.map(([t, c], i) => chip(streamChips, t.toLowerCase(), c, i, 20))}
      </Rect>

      {CONS_X.map((x, i) => (
        <Rect ref={cons} width={270} height={140} radius={22} fill={colors.panel} stroke={colors.empty}
          lineWidth={6} position={[x, CONS_Y]}>
          <Txt fontFamily={FONT} text={CONS_NAMES[i]} fill={colors.text} fontSize={36} fontWeight={800} y={-24} />
          <Txt ref={consState} fontFamily={FONT} text="?" fill={colors.muted} fontSize={30} fontWeight={700} y={28} />
        </Rect>
      ))}

      {BENEFITS.map((t, i) => (
        <Rect ref={benefit} width={800} height={90} radius={20} fill={colors.panel} stroke={colors.ok}
          lineWidth={5} y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.ok} fontSize={42} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={44} fontWeight={800}
        y={540} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Stream Processing" fill={colors.token} fontSize={80} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const dbBottom: P = [0, DB_Y + 75];
  const logTop: P = [0, LOG_Y - 70];
  const logBottom: P = [0, LOG_Y + 70];
  const cdcTop: P = [0, CDC_Y - 70];
  const cdcBottom: P = [0, CDC_Y + 70];
  const streamTop: P = [0, STREAM_Y - 70];
  const streamBottom: P = [0, STREAM_Y + 70];
  const consTop = (i: number): P => [CONS_X[i], CONS_Y - 75];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, c: string, back = colors.panel) => chain(r.fill(c, 0.12), r.fill(back, 0.3));

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.4);
    yield* showBadge('HOW DO THEY FIND OUT?', colors.token);
    yield* flash(db(), colors.token);
  }

  function* polling(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    for (let r = 0; r < 2; r++) {
      sfx('blip', 0.3);
      yield* all(...[0, 1, 2].map(i => dot([consTop(i), dbBottom], colors.request, 0.8)));
      yield* all(...[0, 1, 2].map(i => dot([dbBottom, consTop(i)], colors.muted, 0.8)));
      yield* waitFor(0.3);
    }
    sfx('alarm', 0.4);
    yield* db().fill('#7f1d1d', 0.4);
    yield* showBadge('POLLING: SLOW, HEAVY, MISSES DELETES', colors.danger);
  }

  function* log(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), db().fill(colors.panel, 0.4));
    sfx('whoosh', 0.5);
    yield* logBox().opacity(1, 0.4);
    for (let i = 0; i < CHANGES.length; i++) {
      sfx('blip', 0.3);
      yield* dot([dbBottom, logTop], CHANGES[i][1], 0.4);
      sfx(`plink${i}`, 0.5);
      yield* logChips[i].opacity(1, 0.25);
      yield* waitFor(0.3);
    }
    yield* showBadge('EVERY CHANGE IS LOGGED FIRST', colors.token);
  }

  function* cdcBeat(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('whoosh', 0.5);
    yield* all(cdc().opacity(1, 0.4), stream().opacity(1, 0.4));
    yield* showBadge('READ THE LOG, EMIT EVENTS IN ORDER', colors.request);
    for (let i = 0; i < CHANGES.length; i++) {
      sfx('blip', 0.3);
      yield* dot([logBottom, cdcTop], CHANGES[i][1], 0.35);
      yield* dot([cdcBottom, streamTop], CHANGES[i][1], 0.35);
      sfx(`plink${i}`, 0.5);
      yield* streamChips[i].opacity(1, 0.25);
      yield* waitFor(0.3);
    }
  }

  function* fanout(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('NEAR REAL TIME', colors.ok);
    for (let r = 0; r < 2; r++) {
      sfx('blip', 0.3);
      yield* all(...[0, 1, 2].map(i => dot([streamBottom, consTop(i)], colors.ok, 0.5)));
      yield* all(...[0, 1, 2].map(i => {
        consState[i].text('in sync');
        consState[i].fill(colors.ok);
        cons[i].stroke(colors.ok);
        return flash(cons[i], colors.ok);
      }));
      sfx('ding', 0.4);
      yield* waitFor(1);
    }
  }

  function* benefits(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      db().opacity(0, 0.4), logBox().opacity(0, 0.4), cdc().opacity(0, 0.4), stream().opacity(0, 0.4),
      ...cons.map(c => c.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < BENEFITS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* benefit[i].opacity(1, 0.3);
      yield* waitFor([1.5, 1.8, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, polling, log, cdc: cdcBeat, fanout, benefits, close,
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
