import {Audio, Node, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  createRefArray,
  sequence,
  waitFor,
} from '@revideo/core';
import script from '../../data/sql-vs-nosql.json';
import {FONT, makeKit} from '../components/kit';
import {colors} from '../theme';

const PANEL_Y = -150;
const PANEL_X = [-270, 270];
const HILITE = '#1e4e8c'; // readable highlight: text stays visible
const MONO = 'Menlo, Courier New, monospace';
const SQL_PROS = ['ACID transactions', 'Powerful JOINs', 'Strict schema'];
const NO_PROS = ['Scales out easily', 'Flexible shape', 'Fast writes'];
const CHIP_Y = [350, 415, 480];

type Line = [string, string];
const DOC1: Line[] = [
  ['{', colors.muted],
  ['  "name": "Ana",', colors.text],
  ['  "orders": [10, 12],', colors.text],
  ['  "prefs": {"dark": true}', colors.token],
  ['}', colors.muted],
];
const DOC2: Line[] = [
  ['{', colors.muted],
  ['  "name": "Raj",', colors.text],
  ['  "orders": [11],', colors.text],
  ['  "phone": "98xxx"', colors.token],
  ['}', colors.muted],
];

export default makeScene2D('sql-vs-nosql', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const info = createRef<Txt>();
  const sqlPanel = createRef<Rect>();
  const noPanel = createRef<Rect>();
  const sqlBody = createRef<Node>();
  const noBody = createRef<Node>();
  const urows = createRefArray<Rect>();
  const orows = createRefArray<Rect>();
  const sqlChips = createRefArray<Rect>();
  const noChips = createRefArray<Rect>();
  const verdictSql = createRef<Rect>();
  const verdictNo = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  const tableRow = (ref: ReturnType<typeof createRefArray<Rect>> | null, text: string, y: number, header = false) => (
    <Rect ref={ref ?? undefined} width={420} height={44} radius={10} fill={header ? colors.empty : colors.panel} y={y}>
      <Txt fontFamily={FONT} text={text} fill={header ? colors.text : colors.muted} fontSize={28}
        fontWeight={header ? 800 : 500} />
    </Rect>
  );

  const docCard = (lines: Line[], y: number) => (
    <Rect width={430} height={290} radius={16} fill={colors.panel} stroke={colors.empty} lineWidth={4} y={y}>
      {lines.map(([text, color], i) => (
        <Txt fontFamily={MONO} text={text} fill={color} fontSize={27} fontWeight={700}
          textAlign="left" offsetX={-1} x={-190} y={(i - 2) * 50} />
      ))}
    </Rect>
  );

  const chip = (refs: ReturnType<typeof createRefArray<Rect>>, text: string, i: number, x: number, color: string) => (
    <Rect ref={refs} width={480} height={56} radius={14} fill={colors.panel} stroke={color} lineWidth={4}
      position={[x, CHIP_Y[i]]} opacity={0}>
      <Txt fontFamily={FONT} text={text} fill={color} fontSize={32} fontWeight={800} />
    </Rect>
  );

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={sqlPanel} width={500} height={880} radius={30} fill={colors.bg} stroke={colors.request}
        lineWidth={6} position={[PANEL_X[0], PANEL_Y]} opacity={0}>
        <Txt fontFamily={FONT} text="SQL" fill={colors.request} fontSize={64} fontWeight={800} y={-385} />
        <Node ref={sqlBody} opacity={0}>
          <Txt fontFamily={FONT} text="users" fill={colors.muted} fontSize={28} y={-325} />
          {tableRow(null, 'id  ·  name', -280, true)}
          {tableRow(urows, '1  ·  Ana', -232)}
          {tableRow(urows, '2  ·  Raj', -184)}
          {tableRow(urows, '3  ·  Mei', -136)}
          <Txt fontFamily={FONT} text="orders" fill={colors.muted} fontSize={28} y={-60} />
          {tableRow(null, 'id  ·  user_id', -15, true)}
          {tableRow(orows, '10  ·  1', 33)}
          {tableRow(orows, '11  ·  2', 81)}
          {tableRow(orows, '12  ·  1', 129)}
          <Txt fontFamily={FONT} text="fixed columns" fill={colors.muted} fontSize={28} y={215} />
        </Node>
      </Rect>

      <Rect ref={noPanel} width={500} height={880} radius={30} fill={colors.bg} stroke={colors.ok}
        lineWidth={6} position={[PANEL_X[1], PANEL_Y]} opacity={0}>
        <Txt fontFamily={FONT} text="NoSQL" fill={colors.ok} fontSize={64} fontWeight={800} y={-385} />
        <Node ref={noBody} opacity={0}>
          {docCard(DOC1, -190)}
          {docCard(DOC2, 130)}
          <Txt fontFamily={FONT} text="each document its own shape" fill={colors.muted} fontSize={26} y={310} />
        </Node>
      </Rect>

      {SQL_PROS.map((t, i) => chip(sqlChips, t, i, PANEL_X[0], colors.request))}
      {NO_PROS.map((t, i) => chip(noChips, t, i, PANEL_X[1], colors.ok))}

      <Rect ref={verdictSql} width={480} height={110} radius={18} fill={colors.panel} stroke={colors.request}
        lineWidth={5} position={[PANEL_X[0], 400]} opacity={0}>
        <Txt fontFamily={FONT} text="Payments, orders" fill={colors.request} fontSize={34} fontWeight={800} />
      </Rect>
      <Rect ref={verdictNo} width={480} height={110} radius={18} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} position={[PANEL_X[1], 400]} opacity={0}>
        <Txt fontFamily={FONT} text="Feeds, logs, scale" fill={colors.ok} fontSize={34} fontWeight={800} />
      </Rect>

      <Txt ref={info} fontFamily={FONT} text="" fill={colors.token} fontSize={46} fontWeight={800}
        y={350} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Replication" fill={colors.token} fontSize={104} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* say(text: string, color: string): ThreadGenerator {
    info().text(text);
    info().fill(color);
    yield* info().opacity(1, 0.15);
  }

  const focus = (sql: boolean, no: boolean) =>
    all(sqlPanel().opacity(sql ? 1 : 0.3, 0.3), noPanel().opacity(no ? 1 : 0.3, 0.3));

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* sqlPanel().opacity(1, 0.5);
    sfx('plink0', 0.5);
    yield* noPanel().opacity(1, 0.5);
    sfx('plink2', 0.5);
    yield* say('WHICH ONE?', colors.token);
  }

  function* sql(): ThreadGenerator {
    yield all(info().opacity(0, 0.2), focus(true, false));
    yield* sqlBody().opacity(1, 0.5);
    yield* waitFor(2.5);
    // A JOIN: Ana's user row matches her orders.
    yield* say('JOIN ON user_id', colors.request);
    sfx('pop', 0.5);
    yield* urows[0].fill(HILITE, 0.3);
    for (const i of [0, 2]) {
      sfx('plink1', 0.4);
      yield* orows[i].fill(HILITE, 0.3);
      yield* waitFor(0.4);
    }
  }

  function* nosql(): ThreadGenerator {
    yield all(info().opacity(0, 0.2), focus(false, true));
    yield* noBody().opacity(1, 0.5);
    sfx('plink3', 0.5);
    yield* waitFor(2.5);
    yield* say('NO FIXED SCHEMA', colors.ok);
    sfx('ding', 0.5);
  }

  function* sqlpros(): ThreadGenerator {
    yield all(info().opacity(0, 0.2), focus(true, false), sqlBody().opacity(0.25, 0.3));
    for (let i = 0; i < SQL_PROS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* sqlChips[i].opacity(1, 0.3);
      yield* waitFor(0.5);
    }
  }

  function* nosqlpros(): ThreadGenerator {
    yield all(focus(false, true), noBody().opacity(0.25, 0.3), ...sqlChips.map(c => c.opacity(0.3, 0.3)));
    for (let i = 0; i < NO_PROS.length; i++) {
      sfx(`plink${i + 1}`, 0.5);
      yield* noChips[i].opacity(1, 0.3);
      yield* waitFor(0.5);
    }
  }

  function* choose(): ThreadGenerator {
    yield* all(
      focus(true, true),
      ...sqlChips.map(c => c.opacity(0, 0.3)),
      ...noChips.map(c => c.opacity(0, 0.3)),
    );
    sfx('whoosh', 0.5);
    yield* verdictSql().opacity(1, 0.4);
    sfx('plink2', 0.5);
    yield* verdictNo().opacity(1, 0.4);
    yield* waitFor(2);
    sfx('ding', 0.5);
    info().y(540);
    yield* say('MANY SYSTEMS USE BOTH', colors.token);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, sql, nosql, sqlpros, nosqlpros, choose, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
