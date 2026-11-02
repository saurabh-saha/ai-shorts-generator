import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  linear,
  waitFor,
} from '@revideo/core';
import script from '../../data/distributed-locks.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const WORKER_Y = -500;
const WORKER_X = [-300, 300];
const LOCK_Y = -110;
const DB_Y = 390;
const BAR_W = 300;

export default makeScene2D('distributed-locks', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const lock = createRef<Rect>();
  const holder = createRef<Txt>();
  const ttlBar = createRef<Rect>();
  const db = createRef<Rect>();
  const dbVal = createRef<Txt>();
  const dbTok = createRef<Txt>();
  const wA = createRef<Rect>();
  const wB = createRef<Rect>();
  const aTxt = createRef<Txt>();
  const bTxt = createRef<Txt>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  const worker = (ref: ReturnType<typeof createRef<Rect>>, txt: ReturnType<typeof createRef<Txt>>, name: string, x: number) => (
    <Rect ref={ref} width={330} height={150} radius={24} fill={colors.panel} stroke={colors.empty}
      lineWidth={6} position={[x, WORKER_Y]}>
      <Txt fontFamily={FONT} text={`Server ${name}`} fill={colors.text} fontSize={40} fontWeight={800} y={-28} />
      <Txt ref={txt} fontFamily={FONT} text="" fill={colors.token} fontSize={34} fontWeight={700} y={32} />
    </Rect>
  );

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      {worker(wA, aTxt, 'A', WORKER_X[0])}
      {worker(wB, bTxt, 'B', WORKER_X[1])}

      <Rect ref={lock} width={440} height={200} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={LOCK_Y} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="Lock service" fill={colors.request} fontSize={40} fontWeight={800} y={-50} />
        <Txt ref={holder} fontFamily={FONT} text="holder: none" fill={colors.muted} fontSize={34} fontWeight={700} y={5} />
        <Rect width={BAR_W} height={14} radius={7} fill={colors.empty} y={60} />
        <Rect ref={ttlBar} width={0} height={14} radius={7} fill={colors.token} x={-BAR_W / 2} y={60}
          offset={[-1, 0]} />
      </Rect>

      <Rect ref={db} width={460} height={220} radius={26} fill={colors.panel} y={DB_Y}>
        <Txt fontFamily={FONT} text="Database" fill={colors.text} fontSize={42} fontWeight={800} y={-60} />
        <Txt ref={dbVal} fontFamily={FONT} text="x = 10" fill={colors.token} fontSize={60} fontWeight={800} y={5} />
        <Txt ref={dbTok} fontFamily={FONT} text="" fill={colors.muted} fontSize={30} fontWeight={700} y={70} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={48} fontWeight={800}
        y={170} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Bloom Filters" fill={colors.token} fontSize={100} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const workerPt = (i: number): P => [WORKER_X[i], WORKER_Y + 85];
  const lockPt = (i: number): P => [i === 0 ? -120 : 120, LOCK_Y - 105];
  const dbTop: P = [0, DB_Y - 115];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, color: string) => chain(r.fill(color, 0.12), r.fill(colors.panel, 0.3));

  function setHolder(text: string, color: string) {
    holder().text(text);
    holder().fill(color);
  }

  // Server `i` reads the current value from the database.
  function* read(i: number, txt: Txt, value: number): ThreadGenerator {
    yield* dot([dbTop, workerPt(i)], colors.ok, 0.6);
    txt.text(`read ${value}`);
    txt.fill(colors.token);
  }

  // Server `i` writes `value` to the database (optionally with a fencing token).
  function* write(i: number, value: number, color = colors.ok): ThreadGenerator {
    yield* dot([workerPt(i), dbTop], colors.request, 0.6);
    dbVal().text(`x = ${value}`);
    dbVal().fill(color);
    sfx('pop', 0.5);
    yield* flash(db(), colors.ok);
  }

  function* hook(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* all(read(0, aTxt(), 10), read(1, bTxt(), 10));
    sfx('plink1', 0.5);
    yield* showBadge('BOTH READ 10', colors.token);
  }

  function* problem(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    aTxt().text('add 5 = 15');
    bTxt().text('add 2 = 12');
    yield* waitFor(1);
    sfx('blip', 0.3);
    yield* write(0, 15);
    yield* waitFor(0.6);
    sfx('blip', 0.3);
    yield* write(1, 12, colors.danger);
    sfx('alarm', 0.5);
    yield* showBadge('LOST UPDATE: SHOULD BE 17', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.3));
    // Start over with the lock in place.
    dbVal().text('x = 10');
    dbVal().fill(colors.token);
    aTxt().text('');
    bTxt().text('');
    sfx('whoosh', 0.6);
    yield* all(lock().opacity(1, 0.6), lock().scale(1, 0.6));
    sfx('plink2', 0.5);
  }

  function* acquire(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([workerPt(0), lockPt(0)], colors.request, 0.4);
    setHolder('holder: A', colors.ok);
    sfx('ding', 0.5);
    aTxt().text('GOT THE LOCK');
    aTxt().fill(colors.ok);
    yield* wA().stroke(colors.ok, 0.3);
    yield* waitFor(1);
    sfx('blip', 0.3);
    yield* dot([workerPt(1), lockPt(1)], colors.request, 0.4);
    sfx('buzz', 0.5);
    yield* dot([lockPt(1), workerPt(1)], colors.danger, 0.4);
    bTxt().text('WAITING...');
    bTxt().fill(colors.danger);
    yield* showBadge('ONE AT A TIME', colors.token);
  }

  function* release(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* read(0, aTxt(), 10);
    yield* write(0, 15);
    // A releases; B takes the lock.
    sfx('plink0', 0.5);
    setHolder('holder: none', colors.muted);
    aTxt().text('released');
    aTxt().fill(colors.muted);
    yield* wA().stroke(colors.empty, 0.3);
    yield* waitFor(0.5);
    yield* dot([workerPt(1), lockPt(1)], colors.request, 0.4);
    setHolder('holder: B', colors.ok);
    sfx('ding', 0.5);
    yield* wB().stroke(colors.ok, 0.3);
    yield* read(1, bTxt(), 15);
    bTxt().fill(colors.ok);
    yield* write(1, 17);
    yield* showBadge('CORRECT: 17', colors.ok);
  }

  function* ttl(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // Reset for a new round: A takes the lock with token 1, then stalls.
    aTxt().text('');
    bTxt().text('');
    yield* all(wA().stroke(colors.empty, 0.2), wB().stroke(colors.empty, 0.2));
    sfx('blip', 0.3);
    yield* dot([workerPt(0), lockPt(0)], colors.request, 0.4);
    setHolder('holder: A  (token 1)', colors.ok);
    sfx('ding', 0.5);
    yield* wA().stroke(colors.ok, 0.3);
    aTxt().text('zzz... paused');
    aTxt().fill(colors.muted);
    // The lock's time-to-live runs down while A is stuck.
    yield* showBadge('LOCK TTL RUNNING', colors.token);
    yield* ttlBar().width(BAR_W, 2.8, linear);
    sfx('buzz', 0.5);
    setHolder('EXPIRED', colors.danger);
    yield* showBadge('LOCK EXPIRED', colors.danger);
    yield* waitFor(0.6);
    // B grabs the lock with token 2 and writes.
    ttlBar().width(0);
    yield* dot([workerPt(1), lockPt(1)], colors.request, 0.4);
    setHolder('holder: B  (token 2)', colors.ok);
    sfx('ding', 0.5);
    yield* wB().stroke(colors.ok, 0.3);
    yield* write(1, 20);
    dbTok().text('last token: 2');
  }

  function* fence(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // A wakes up, still believing it holds the lock, and writes with token 1.
    sfx('whoosh', 0.4);
    aTxt().text('wakes up: write (token 1)');
    aTxt().fill(colors.token);
    yield* waitFor(1);
    sfx('blip', 0.3);
    yield* dot([workerPt(0), dbTop], colors.request, 0.6);
    sfx('buzz', 0.6);
    yield* all(
      db().fill('#7f1d1d', 0.2),
      dot([dbTop, workerPt(0)], colors.danger, 0.6),
    );
    yield* db().fill(colors.panel, 0.4);
    aTxt().text('REJECTED');
    aTxt().fill(colors.danger);
    yield* showBadge('STALE TOKEN 1 < 2: REJECTED', colors.ok);
    sfx('plink3', 0.5);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, problem, concept, acquire, release, ttl, fence, close,
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
