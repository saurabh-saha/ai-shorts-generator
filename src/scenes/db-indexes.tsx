import {Audio, Line, Rect, Txt, makeScene2D} from '@revideo/2d';
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
import script from '../../data/db-indexes.json';
import {FONT, makeKit} from '../components/kit';
import {colors} from '../theme';

const ROWS = 12;
const TARGET = 9; // the row the query is looking for
const ROW_Y = (i: number) => -400 + i * 60;

// B-tree layout: root -> 3 branches -> 6 leaves, keyed by alphabetical ranges.
const ROOT: [number, number] = [0, -380];
const BRANCH_X = [-340, 0, 340];
const BRANCH_Y = -170;
const LEAF_X = [-410, -270, -70, 70, 270, 410];
const LEAF_Y = 50;
const BRANCH_LABEL = ['a-h', 'i-p', 'q-z'];
const LEAF_LABEL = ['a-c', 'd-h', 'i-l', 'm-p', 'q-t', 'u-z'];

export default makeScene2D('db-indexes', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const info = createRef<Txt>();
  const query = createRef<Rect>();
  const root = createRef<Rect>();
  const rows = createRefArray<Rect>();
  const branches = createRefArray<Rect>();
  const leaves = createRefArray<Rect>();
  const edges = createRefArray<Line>();
  const rule1 = createRef<Rect>();
  const rule2 = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  const node = (label: string, w = 150) => (
    <Txt fontFamily={FONT} text={label} fill={colors.text} fontSize={34} fontWeight={800} />
  );

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={query} width={900} height={110} radius={22} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={-590} opacity={0}>
        <Txt fontFamily={FONT} text="SELECT * FROM users" fill={colors.muted} fontSize={30} y={-26} />
        <Txt fontFamily={FONT} text="WHERE email = 'ana@x.com'" fill={colors.token} fontSize={44} fontWeight={800} y={22} />
      </Rect>

      {range(ROWS).map(i => (
        <Rect ref={rows} width={620} height={50} radius={12} fill={colors.panel} y={ROW_Y(i)} opacity={0}>
          <Txt fontFamily={FONT} fill={i === TARGET ? colors.text : colors.muted} fontSize={30}
            fontWeight={i === TARGET ? 800 : 500}
            text={i === TARGET ? `row ${i + 1}   ana@x.com` : `row ${i + 1}   user${i + 1}@mail.com`} />
        </Rect>
      ))}

      {/* B-tree */}
      {BRANCH_X.map((x, i) => (
        <Line ref={edges} points={[[ROOT[0], ROOT[1] + 40], [x, BRANCH_Y - 40]]} stroke={colors.empty}
          lineWidth={6} opacity={0} />
      ))}
      {LEAF_X.map((x, i) => (
        <Line ref={edges} points={[[BRANCH_X[Math.floor(i / 2)], BRANCH_Y + 40], [x, LEAF_Y - 40]]}
          stroke={colors.empty} lineWidth={6} opacity={0} />
      ))}
      <Rect ref={root} width={240} height={80} radius={18} fill={colors.panel} stroke={colors.request}
        lineWidth={5} position={ROOT} opacity={0}>
        {node('ROOT  a-z')}
      </Rect>
      {BRANCH_X.map((x, i) => (
        <Rect ref={branches} width={200} height={80} radius={18} fill={colors.panel} stroke={colors.request}
          lineWidth={5} position={[x, BRANCH_Y]} opacity={0}>
          {node(BRANCH_LABEL[i])}
        </Rect>
      ))}
      {LEAF_X.map((x, i) => (
        <Rect ref={leaves} width={130} height={80} radius={18} fill={colors.panel} stroke={colors.ok}
          lineWidth={5} position={[x, LEAF_Y]} opacity={0}>
          {node(LEAF_LABEL[i])}
        </Rect>
      ))}

      <Txt ref={info} fontFamily={FONT} text="" fill={colors.token} fontSize={50} fontWeight={800}
        y={330} opacity={0} />

      <Rect ref={rule1} width={780} height={150} radius={24} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={-90} opacity={0}>
        <Txt fontFamily={FONT} text="INDEX" fill={colors.ok} fontSize={44} fontWeight={800} y={-30} />
        <Txt fontFamily={FONT} text="columns in WHERE / JOIN" fill={colors.text} fontSize={36} y={30} />
      </Rect>
      <Rect ref={rule2} width={780} height={150} radius={24} fill={colors.panel} stroke={colors.empty}
        lineWidth={6} y={110} opacity={0}>
        <Txt fontFamily={FONT} text="SKIP" fill={colors.muted} fontSize={44} fontWeight={800} y={-30} />
        <Txt fontFamily={FONT} text="rarely queried columns" fill={colors.muted} fontSize={36} y={30} />
      </Rect>

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="SQL vs NoSQL" fill={colors.token} fontSize={100} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const treeNodes = () => [root(), ...branches, ...leaves];

  function* say(text: string, color: string): ThreadGenerator {
    info().text(text);
    info().fill(color);
    yield* info().opacity(1, 0.15);
  }

  const flash = (n: Rect, color: string) => chain(n.fill(color, 0.15), n.fill(colors.panel, 0.3));

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.4);
    yield* query().opacity(1, 0.4);
    yield* sequence(0.1, ...rows.map(r => r.opacity(1, 0.25)));
    yield* say('10,000,000 rows', colors.token);
  }

  function* scan(): ThreadGenerator {
    for (let i = 0; i <= TARGET; i++) {
      info().text(`rows checked: ${i + 1}`);
      info().fill(colors.danger);
      sfx('blip', 0.2);
      yield* rows[i].fill(i === TARGET ? colors.ok : '#1e3a5f', 0.1);
      if (i === TARGET) sfx('ding', 0.5);
      yield* waitFor(0.4);
    }
    yield* waitFor(0.5);
    yield* say('...up to 10,000,000 checks', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(info().opacity(0, 0.2), ...rows.map(r => r.opacity(0, 0.4)));
    sfx('whoosh', 0.5);
    yield* all(...edges.map(e => e.opacity(1, 0.4)));
    yield* root().opacity(1, 0.4);
    yield* all(...branches.map(b => b.opacity(1, 0.4)));
    yield* all(...leaves.map(l => l.opacity(1, 0.4)));
    sfx('plink2', 0.5);
  }

  function* lookup(): ThreadGenerator {
    yield* waitFor(1);
    const path: [Rect, string][] = [
      [root(), 'step 1: root'],
      [branches[0], 'step 2: a-h branch'],
      [leaves[0], 'step 3: leaf'],
    ];
    for (const [n, text] of path) {
      sfx('pop', 0.5);
      yield say(text, colors.token);
      yield* n.fill(n === leaves[0] ? colors.ok : colors.request, 0.3);
      yield* waitFor(1);
    }
    sfx('ding', 0.5);
    yield* say('found in 3 steps', colors.ok);
  }

  function* cost(): ThreadGenerator {
    yield all(...treeNodes().map(n => n.fill(colors.panel, 0.3)));
    yield* say('EXTRA STORAGE', colors.token);
    sfx('plink1', 0.5);
    yield* waitFor(2);
    // A write has to touch the index on its way to the leaf.
    yield* say('EVERY WRITE UPDATES THE INDEX', colors.danger);
    for (let r = 0; r < 2; r++) {
      for (const n of [root(), branches[1], leaves[3]]) {
        sfx('blip', 0.3);
        yield* flash(n, colors.danger);
      }
      yield* waitFor(0.4);
    }
    sfx('buzz', 0.4);
  }

  function* rule(): ThreadGenerator {
    yield* all(info().opacity(0, 0.2), ...edges.map(e => e.opacity(0, 0.4)),
      ...treeNodes().map(n => n.opacity(0, 0.4)), query().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    yield* rule1().opacity(1, 0.5);
    sfx('plink3', 0.5);
    yield* waitFor(0.6);
    yield* rule2().opacity(1, 0.5);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, scan, concept, lookup, cost, rule, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
