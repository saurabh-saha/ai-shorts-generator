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
import script from '../../data/log-compaction.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const PINK = '#f472b6';
const KEY_COLOR: Record<string, string> = {a: colors.request, b: PINK, c: colors.token};
const EVENTS: [string, string][] = [
  ['a', '=1'], ['b', '=1'], ['a', '=2'], ['c', '=1'], ['b', '=2'], ['a', '=3'], ['c', 'null'],
];
const CELL_X = (i: number) => (i - 3) * 130;
const ROW_Y = -100;
const PROD_Y = -470;
const CAVEATS = ['Offsets never change: gaps', 'Runs in the background', 'Old values may linger briefly'];

export default makeScene2D('log-compaction', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const cells = createRefArray<Rect>();
  const table = createRef<Rect>();
  const tableTxt = createRef<Txt>();
  const chips = createRefArray<Rect>();
  const prod = createRef<Rect>();
  const row = createRef<Rect>();
  const rowLabel = createRef<Txt>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={prod} width={420} height={100} radius={22} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={PROD_Y}>
        <Txt fontFamily={FONT} text="Producer" fill={colors.request} fontSize={40} fontWeight={800} />
      </Rect>

      <Rect ref={row} width={980} height={220} radius={24} fill={colors.panel} stroke={colors.empty}
        lineWidth={5} y={ROW_Y}>
        <Txt ref={rowLabel} fontFamily={FONT} text="topic: user-emails  (key = value)" fill={colors.muted}
          fontSize={28} fontWeight={700} y={-88} />
      </Rect>
      {EVENTS.map(([k, v], i) => (
        <Rect ref={cells} width={110} height={104} radius={14} fill={KEY_COLOR[k] + '33'} stroke={KEY_COLOR[k]}
          lineWidth={5} position={[CELL_X(i), ROW_Y + 8]} opacity={0}>
          <Txt fontFamily={FONT} text={k} fill={KEY_COLOR[k]} fontSize={46} fontWeight={800} y={-18} />
          <Txt fontFamily={FONT} text={v} fill={colors.text} fontSize={30} fontWeight={800} y={26} />
          <Txt fontFamily={FONT} text={String(i)} fill={colors.muted} fontSize={22} fontWeight={700} y={78} />
        </Rect>
      ))}

      <Rect ref={table} width={780} height={210} radius={26} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={300} opacity={0}>
        <Txt fontFamily={FONT} text="current state (a table)" fill={colors.ok} fontSize={34} fontWeight={800} y={-62} />
        <Txt ref={tableTxt} fontFamily={FONT} text="-" fill={colors.text} fontSize={54} fontWeight={800} y={26} />
      </Rect>

      {CAVEATS.map((t, i) => (
        <Rect ref={chips} width={860} height={90} radius={20} fill={colors.panel} stroke={colors.token}
          lineWidth={5} y={200 + i * 120} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.token} fontSize={40} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={44} fontWeight={800}
        y={120} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Stream series" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Complete!" fill={colors.token} fontSize={120} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const prodPt: P = [0, PROD_Y + 55];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function* append(i: number): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([prodPt, [CELL_X(i), ROW_Y - 70]], KEY_COLOR[EVENTS[i][0]], 0.4);
    sfx(`plink${i % 5}`, 0.4);
    yield* all(cells[i].opacity(1, 0.15), chain(cells[i].scale(1.12, 0.1), cells[i].scale(1, 0.12)));
  }

  // Mark a record as removed: it flashes red and disappears, leaving a gap.
  function* drop(i: number): ThreadGenerator {
    yield* cells[i].stroke(colors.danger, 0.2);
    yield* cells[i].opacity(0.12, 0.3);
  }

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 6; i++) {
      yield* append(i);
      yield* waitFor(0.25);
    }
    yield* showBadge('KEEP GROWING...', colors.token);
  }

  function* retention(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('RETENTION: DELETE THE OLDEST', colors.danger);
    yield* waitFor(0.8);
    for (let i = 0; i < 4; i++) {
      sfx('buzz', 0.3);
      yield* drop(i);
      yield* waitFor(0.25);
    }
    sfx('alarm', 0.4);
    yield* showBadge('c IS GONE: ITS ONLY RECORD WAS OLD', colors.danger);
  }

  function* compaction(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // Rewind: the same log, before retention ran.
    yield* all(...[0, 1, 2, 3].map(i => cells[i].opacity(1, 0.4)),
      ...[0, 1, 2, 3].map(i => cells[i].stroke(KEY_COLOR[EVENTS[i][0]], 0.4)));
    sfx('whoosh', 0.5);
    yield* showBadge('COMPACTION: KEEP THE LATEST PER KEY', colors.ok);
    yield* waitFor(1);
    // Older values of a, b are removed; c's only value stays.
    for (const i of [0, 1, 2]) {
      sfx('pop', 0.4);
      yield* drop(i);
      yield* waitFor(0.3);
    }
    sfx('ding', 0.5);
    yield* waitFor(0.4);
  }

  function* tombstone(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('TOMBSTONE: c = null', colors.token);
    yield* append(6);
    cells[6].stroke(colors.danger);
    yield* waitFor(1.2);
    // Compaction later removes the key and the tombstone itself.
    sfx('whoosh', 0.5);
    yield* showBadge('COMPACTION REMOVES c ENTIRELY', colors.ok);
    for (const i of [3, 6]) {
      sfx('pop', 0.4);
      yield* drop(i);
      yield* waitFor(0.3);
    }
  }

  function* use(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('whoosh', 0.5);
    yield* table().opacity(1, 0.4);
    // A new consumer replays what is left (b=2, a=3) from the start.
    const state: Record<string, string> = {};
    for (const i of [4, 5]) {
      const [k, v] = EVENTS[i];
      sfx('blip', 0.3);
      yield* cells[i].stroke(colors.ok, 0.2);
      yield* dot([[CELL_X(i), ROW_Y + 60], [0, 300 - 105]], KEY_COLOR[k], 0.6);
      state[k] = v.replace('=', '');
      tableTxt().text(Object.entries(state).map(([kk, vv]) => `${kk} = ${vv}`).join('      '));
      sfx('plink2', 0.5);
      yield* waitFor(0.5);
    }
    yield* showBadge('READ THE TOPIC, REBUILD THE STATE', colors.ok);
  }

  function* caveat(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), table().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    for (let i = 0; i < CAVEATS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* chips[i].opacity(1, 0.3);
      yield* waitFor([1.4, 1.6, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, retention, compaction, tombstone, use, caveat, close,
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
