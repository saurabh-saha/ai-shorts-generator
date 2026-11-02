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
import script from '../../data/caching.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -560;
const CACHE_Y = -90;
const DB_Y = 430;
const SLOT_W = 110;

export default makeScene2D('caching', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const cache = createRef<Rect>();
  const db = createRef<Rect>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const slots = createRefArray<Rect>();
  const letters = createRefArray<Txt>();
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

      <Rect ref={cache} width={560} height={270} radius={28} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={CACHE_Y} opacity={0} scale={0.85}>
        <Txt fontFamily={FONT} text="CACHE" fill={colors.ok} fontSize={40} fontWeight={800} y={-95} />
        {range(4).map(i => (
          <Rect ref={slots} width={96} height={72} radius={12} fill={colors.empty}
            x={(i - 1.5) * SLOT_W} y={5}>
            <Txt ref={letters} fontFamily={FONT} text="" fill={colors.bg} fontSize={44} fontWeight={800} />
          </Rect>
        ))}
        <Txt fontFamily={FONT} text="fast: 5 ms" fill={colors.ok} fontSize={34} y={95} />
      </Rect>

      <Rect ref={db} width={440} height={210} radius={28} fill={colors.panel} y={DB_Y}>
        <Txt fontFamily={FONT} text="Database" fill={colors.text} fontSize={48} fontWeight={700} y={-25} />
        <Txt fontFamily={FONT} text="slow: 200 ms" fill={colors.danger} fontSize={36} y={45} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={54} fontWeight={800}
        y={215} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Message Queues" fill={colors.token} fontSize={100} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const clientPt: P = [0, CLIENT_Y + 60];
  const cacheTop: P = [0, CACHE_Y - 140];
  const cacheBottom: P = [0, CACHE_Y + 140];
  const dbTop: P = [0, DB_Y - 115];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function* putItem(i: number, letter: string): ThreadGenerator {
    letters[i].text(letter);
    sfx(`plink${i}`, 0.6);
    yield* slots[i].fill(colors.token, 0.25);
  }

  function* clearItem(i: number): ThreadGenerator {
    yield* slots[i].fill(colors.empty, 0.3);
    letters[i].text('');
  }

  // Requests going straight to the database (no cache yet).
  const direct = () => {
    sfx('blip', 0.25);
    return dot([clientPt, dbTop], colors.request, 0.7);
  };

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 12; i++) {
      yield direct();
      yield* waitFor(0.15);
    }
    sfx('alarm', 0.5);
    yield* db().fill(colors.danger, 0.4);
  }

  function* problem(): ThreadGenerator {
    yield showBadge('EVERY REQUEST = 200 ms', colors.danger);
    sfx('alarm', 0.4);
    for (let i = 0; i < 8; i++) {
      yield direct();
      yield* waitFor(0.25);
    }
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.3), db().fill(colors.panel, 0.5));
    sfx('whoosh', 0.6);
    yield* all(cache().opacity(1, 0.6), cache().scale(1, 0.6));
  }

  function* miss(): ThreadGenerator {
    yield* dot([clientPt, cacheTop], colors.request, 0.45);
    sfx('buzz', 0.4);
    yield* showBadge('CACHE MISS', colors.danger);
    yield* dot([cacheBottom, dbTop], colors.request, 0.6);
    sfx('pop', 0.5);
    yield* db().fill(colors.ok, 0.1);
    yield db().fill(colors.panel, 0.4);
    // The answer travels back and is stored in the cache.
    yield* dot([dbTop, cacheBottom], colors.token, 0.6);
    yield* putItem(0, 'A');
    yield* dot([cacheTop, clientPt], colors.ok, 0.45);
  }

  function* hit(): ThreadGenerator {
    yield db().opacity(0.35, 0.4);
    for (let i = 0; i < 4; i++) {
      yield* dot([clientPt, cacheTop], colors.request, 0.3);
      sfx('ding', 0.45);
      yield* showBadge('CACHE HIT  5 ms', colors.ok);
      yield* all(
        dot([cacheTop, clientPt], colors.ok, 0.3),
        chain(slots[0].fill(colors.ok, 0.1), slots[0].fill(colors.token, 0.3)),
      );
      yield* waitFor(1.0);
    }
  }

  function* evict(): ThreadGenerator {
    yield all(db().opacity(1, 0.3), badge().opacity(0, 0.2));
    // Fill the remaining slots.
    yield* waitFor(0.3);
    yield* putItem(1, 'B');
    yield* putItem(2, 'C');
    yield* putItem(3, 'D');
    yield* showBadge('CACHE FULL', colors.token);
    yield* waitFor(1);
    // A new item arrives: the least recently used (A) is evicted.
    yield* dot([clientPt, cacheTop], colors.request, 0.4);
    yield* showBadge('EVICT OLDEST (LRU)', colors.danger);
    sfx('buzz', 0.4);
    yield* slots[0].fill(colors.danger, 0.3);
    yield* clearItem(0);
    yield* putItem(0, 'E');
    yield* waitFor(1.5);
    // Entries also expire after their TTL.
    yield* showBadge('EXPIRED (TTL)', colors.muted);
    sfx('spend', 0.5);
    yield* clearItem(2);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, miss, hit, evict, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
