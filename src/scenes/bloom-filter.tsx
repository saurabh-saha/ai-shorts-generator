import {Audio, Circle, Node, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  range,
  sequence,
  waitFor,
} from '@revideo/core';
import script from '../../data/bloom-filter.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CELLS = 16;
const HASH_COLORS = [colors.request, '#f472b6', '#a78bfa'];
const QUERY_Y = -470;
const cellPos = (i: number): P => [((i % 8) - 3.5) * 108, i < 8 ? -60 : 70];
const PRO_Y = [320, 390, 460];
const PROS = ['No false negatives', 'Tiny memory', 'Skips slow lookups'];

export default makeScene2D('bloom-filter', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const query = createRef<Rect>();
  const qTxt = createRef<Txt>();
  const db = createRef<Rect>();
  const legend = createRef<Node>();
  const cells = createRefArray<Rect>();
  const bitTxt = createRefArray<Txt>();
  const pros = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  const bits: number[] = Array(CELLS).fill(0);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={query} width={640} height={100} radius={22} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={QUERY_Y} opacity={0}>
        <Txt ref={qTxt} fontFamily={FONT} text="" fill={colors.token} fontSize={44} fontWeight={800} />
      </Rect>

      <Rect ref={db} width={620} height={260} radius={28} fill={colors.panel} y={20} opacity={0}>
        <Txt fontFamily={FONT} text="Database" fill={colors.text} fontSize={48} fontWeight={800} y={-35} />
        <Txt fontFamily={FONT} text="billions of usernames" fill={colors.muted} fontSize={34} y={30} />
      </Rect>

      <Node ref={legend} y={-330} opacity={0}>
        {HASH_COLORS.map((c, h) => (
          <Node x={(h - 1) * 190}>
            <Circle size={30} fill={c} x={-40} />
            <Txt fontFamily={FONT} text={`hash ${h + 1}`} fill={colors.text} fontSize={34} fontWeight={700} x={40} />
          </Node>
        ))}
      </Node>

      {range(CELLS).map(i => (
        <Rect ref={cells} width={96} height={96} radius={14} fill={colors.panel} stroke={colors.empty}
          lineWidth={5} position={cellPos(i)} opacity={0}>
          <Txt fontFamily={FONT} text={String(i)} fill={colors.muted} fontSize={20} y={-30} />
          <Txt ref={bitTxt} fontFamily={FONT} text="0" fill={colors.muted} fontSize={46} fontWeight={800} y={8} />
        </Rect>
      ))}

      {PROS.map((t, i) => (
        <Rect ref={pros} width={700} height={56} radius={14} fill={colors.panel} stroke={colors.ok}
          lineWidth={4} y={PRO_Y[i]} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.ok} fontSize={34} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={48} fontWeight={800}
        y={250} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Gossip Protocols" fill={colors.token} fontSize={88} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function* ask(text: string): ThreadGenerator {
    qTxt().text(text);
    yield* query().opacity(1, 0.25);
  }

  // The item is hashed: one dot per hash function flies to its bit position.
  function* hashTo(positions: number[]): ThreadGenerator {
    sfx('blip', 0.35);
    yield* all(...positions.map((p, h) =>
      dot([[0, QUERY_Y + 55], [cellPos(p)[0], cellPos(p)[1] - 60]], HASH_COLORS[h], 0.5)));
  }

  function* setBits(positions: number[]): ThreadGenerator {
    positions.forEach((p, k) => {
      const was = bits[p];
      bits[p] = 1;
      bitTxt[p].text('1');
      bitTxt[p].fill(colors.bg);
      sfx(was ? 'pop' : `plink${k}`, 0.45);
    });
    yield* all(...positions.map(p => chain(cells[p].scale(1.15, 0.12), cells[p].scale(1, 0.15))),
      ...positions.map(p => cells[p].fill(colors.token, 0.25)));
  }

  // Outline each probed bit: green if it is 1, red if it is 0.
  function* mark(positions: number[]): ThreadGenerator {
    yield* all(...positions.map(p => cells[p].stroke(bits[p] ? colors.ok : colors.danger, 0.2)));
  }
  const unmark = (positions: number[]) => all(...positions.map(p => cells[p].stroke(colors.empty, 0.3)));

  function* hook(): ThreadGenerator {
    yield* ask('is "ana" taken?');
    yield* db().opacity(1, 0.4);
    for (let i = 0; i < 2; i++) {
      sfx('blip', 0.3);
      yield* dot([[0, QUERY_Y + 55], [0, 20 - 135]], colors.request, 1.1);
      yield* dot([[0, 20 - 135], [0, QUERY_Y + 55]], colors.ok, 1.1);
    }
    sfx('alarm', 0.4);
    yield* showBadge('SLOW + EXPENSIVE', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), db().opacity(0, 0.4), query().opacity(0, 0.3));
    sfx('whoosh', 0.5);
    yield* all(legend().opacity(1, 0.4), sequence(0.05, ...cells.map(c => c.opacity(1, 0.25))));
    yield* showBadge('DEFINITELY NOT HERE', colors.ok);
    yield* waitFor(1.2);
    sfx('plink2', 0.5);
    yield* showBadge('...OR MAYBE HERE', colors.token);
  }

  function* add(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    for (const [name, pos] of [['ana', [2, 9, 13]], ['raj', [5, 9, 14]]] as [string, number[]][]) {
      yield* ask(`add "${name}"`);
      yield* hashTo(pos);
      yield* setBits(pos);
      yield* waitFor(0.7);
    }
  }

  function* no(): ThreadGenerator {
    const pos = [1, 5, 11];
    yield* ask('is "mei" in the set?');
    yield* hashTo(pos);
    yield* mark(pos);
    sfx('buzz', 0.4);
    yield* showBadge('A BIT IS 0: DEFINITELY NOT', colors.ok);
    yield* waitFor(1);
    yield* unmark(pos);
  }

  function* maybe(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // A real member: every bit is 1.
    let pos = [2, 9, 13];
    yield* ask('is "ana" in the set?');
    yield* hashTo(pos);
    yield* mark(pos);
    sfx('ding', 0.5);
    yield* showBadge('ALL 1: MAYBE', colors.token);
    yield* waitFor(1);
    yield* all(unmark(pos), badge().opacity(0, 0.2));
    // A stranger whose bits happen to all be set by other items.
    pos = [2, 5, 14];
    yield* ask('is "zoe" in the set?');
    yield* hashTo(pos);
    yield* mark(pos);
    sfx('alarm', 0.4);
    yield* showBadge('ALL 1... BUT "zoe" WAS NEVER ADDED', colors.danger);
    yield* waitFor(1);
    yield* unmark(pos);
  }

  function* tradeoff(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      query().opacity(0, 0.3),
      legend().opacity(0, 0.3),
      ...cells.map(c => c.opacity(0.35, 0.3)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < PROS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* pros[i].opacity(1, 0.3);
      yield* waitFor(0.5);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, concept, add, no, maybe, tradeoff, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
