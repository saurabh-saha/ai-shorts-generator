import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  createRefArray,
  range,
  waitFor,
} from '@revideo/core';
import script from '../../data/kafka-basics.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const COLS = 8;
const ROW_Y = [-120, 60, 240];
const cellX = (c: number) => (c - (COLS - 1) / 2) * 112;
const PROD_Y = -560;
const CHIPS = ['Replicated across brokers', 'Retention: 7 days', 'Not deleted when read'];
const KEY_COLORS: Record<string, string> = {u7: colors.request, u12: '#f472b6', u3: colors.token};
// hash(key) % 3: which partition each key lands in.
const KEY_PARTITION: Record<string, number> = {u7: 1, u12: 2, u3: 0};

export default makeScene2D('kafka-basics', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const keyLabel = createRef<Txt>();
  const rowLabels = createRefArray<Txt>();
  const rows = createRefArray<Rect>();
  const cells = createRefArray<Rect>();
  const cellTxt = createRefArray<Txt>();
  const offs = createRefArray<Txt>();
  const pillA = createRef<Rect>();
  const pillB = createRef<Rect>();
  const chips = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  const lens = [0, 0, 0];

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  const ROW_LABEL = ['P0', 'topic: orders', 'P2'];

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={420} height={110} radius={22} fill={colors.panel} stroke={colors.request} lineWidth={6} y={PROD_Y}>
        <Txt fontFamily={FONT} text="Producer" fill={colors.request} fontSize={42} fontWeight={800} />
      </Rect>
      <Txt ref={keyLabel} fontFamily={FONT} text="" fill={colors.token} fontSize={36} fontWeight={800}
        y={PROD_Y + 90} opacity={0} />

      {range(3).map(r => (
        <Rect ref={rows} width={960} height={130} radius={20} fill={colors.panel} stroke={colors.empty}
          lineWidth={5} y={ROW_Y[r]} opacity={r === 1 ? 1 : 0}>
          <Txt ref={rowLabels} fontFamily={FONT} text={ROW_LABEL[r]} fill={colors.muted} fontSize={26}
            fontWeight={800} x={-380} y={-48} />
        </Rect>
      ))}
      {range(3).flatMap(r =>
        range(COLS).map(c => (
          <Rect ref={cells} width={100} height={64} radius={10} fill={colors.empty}
            position={[cellX(c), ROW_Y[r] + 8]} opacity={r === 1 ? 1 : 0}>
            <Txt ref={cellTxt} fontFamily={FONT} text="" fill={colors.bg} fontSize={32} fontWeight={800} />
          </Rect>
        )),
      )}
      {range(COLS).map(c => (
        <Txt ref={offs} fontFamily={FONT} text={String(c)} fill={colors.muted} fontSize={26} fontWeight={700}
          position={[cellX(c), ROW_Y[1] + 80]} opacity={0} />
      ))}

      <Rect ref={pillA} width={150} height={50} radius={14} fill={colors.panel} stroke={colors.ok} lineWidth={4}
        position={[cellX(3), ROW_Y[1] + 135]} opacity={0}>
        <Txt fontFamily={FONT} text="A" fill={colors.ok} fontSize={30} fontWeight={800} />
      </Rect>
      <Rect ref={pillB} width={150} height={50} radius={14} fill={colors.panel} stroke={colors.token} lineWidth={4}
        position={[cellX(5), ROW_Y[1] + 195]} opacity={0}>
        <Txt fontFamily={FONT} text="B" fill={colors.token} fontSize={30} fontWeight={800} />
      </Rect>

      {CHIPS.map((t, i) => (
        <Rect ref={chips} width={820} height={90} radius={20} fill={colors.panel} stroke={colors.ok}
          lineWidth={5} y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.ok} fontSize={42} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={470} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Consumer Groups" fill={colors.token} fontSize={88} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const prodPt: P = [0, PROD_Y + 60];
  const cellIdx = (r: number, c: number) => r * COLS + c;

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  // The producer appends an event to partition (row) `r`.
  function* append(r: number, label: string, color: string, t = 0.5): ThreadGenerator {
    const c = lens[r];
    sfx('blip', 0.25);
    yield* dot([prodPt, [cellX(c), ROW_Y[r] - 60]], color, t);
    cells[cellIdx(r, c)].fill(color);
    cellTxt[cellIdx(r, c)].text(label);
    lens[r]++;
    sfx(`plink${c % 5}`, 0.4);
    yield* cells[cellIdx(r, c)].scale(1.12, 0.1).to(1, 0.12);
  }

  function* hook(): ThreadGenerator {
    for (const e of ['E1', 'E2', 'E3', 'E4']) {
      yield* append(1, e, colors.token);
      yield* waitFor(0.1);
    }
    yield* showBadge('A DISTRIBUTED LOG', colors.token);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    for (const e of ['E5', 'E6']) {
      yield* append(1, e, colors.token);
      yield* waitFor(0.1);
    }
    sfx('whoosh', 0.4);
    yield* all(...offs.map(o => o.opacity(1, 0.3)));
    yield* showBadge('EVERY EVENT HAS AN OFFSET', colors.ok);
  }

  function* read(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('whoosh', 0.4);
    yield* all(pillA().opacity(1, 0.3), pillB().opacity(1, 0.3));
    yield* showBadge("READING DOESN'T DELETE ANYTHING", colors.ok);
    yield* waitFor(0.8);
    // Each consumer moves forward at its own pace.
    for (const [pill, to, c] of [[pillA(), 4, colors.ok], [pillA(), 5, colors.ok], [pillB(), 6, colors.token]] as [Rect, number, string][]) {
      sfx('pop', 0.4);
      yield* pill.x(cellX(to), 0.5);
      yield* cells[cellIdx(1, to - 1)].stroke(c, 0.2).to(colors.empty, 0.3);
      yield* waitFor(0.4);
    }
  }

  function* partitions(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), pillA().opacity(0, 0.3), pillB().opacity(0, 0.3),
      ...offs.map(o => o.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    rowLabels[0].text('P0 · broker 1');
    rowLabels[1].text('P1 · broker 2');
    rowLabels[2].text('P2 · broker 3');
    yield* all(
      rows[0].opacity(1, 0.5), rows[2].opacity(1, 0.5),
      ...range(COLS).map(c => cells[cellIdx(0, c)].opacity(1, 0.5)),
      ...range(COLS).map(c => cells[cellIdx(2, c)].opacity(1, 0.5)),
    );
    sfx('plink2', 0.5);
    yield* showBadge('EACH PARTITION: ITS OWN ORDERED LOG', colors.token);
  }

  function* keys(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // Fresh start: clear the log so each event shows where its key sends it.
    yield* all(...cells.map(c => c.fill(colors.empty, 0.3)));
    cellTxt.forEach(t => t.text(''));
    lens[0] = lens[1] = lens[2] = 0;
    for (const k of ['u7', 'u12', 'u3', 'u7', 'u12']) {
      const p = KEY_PARTITION[k];
      keyLabel().text(`key ${k}  ->  partition ${p}`);
      keyLabel().fill(KEY_COLORS[k]);
      yield* keyLabel().opacity(1, 0.1);
      yield* append(p, k, KEY_COLORS[k], 0.45);
      yield* waitFor(0.15);
    }
    yield* keyLabel().opacity(0, 0.2);
    yield* showBadge('ORDER IS GUARANTEED PER PARTITION', colors.ok);
  }

  function* durable(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      ...rows.map(r => r.opacity(0, 0.4)),
      ...cells.map(c => c.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < CHIPS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* chips[i].opacity(1, 0.3);
      yield* waitFor([1.6, 1.8, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, concept, read, partitions, keys, durable, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
