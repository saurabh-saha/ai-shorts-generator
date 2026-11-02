import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, createRef, createRefArray, waitFor} from '@revideo/core';
import script from '../../data/agent-memory.json';
import {FONT, P, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const WIN_Y = -230;
const MSG: [string, string, number][] = [
  ['system: you are a travel agent', colors.muted, 1],
  ['user: plan a trip to Paris', colors.token, 1],
  ['tool: found 12 flights', colors.ok, 2],
  ['user: keep it under $300', colors.token, 1],
  ['tool: found 8 hotels', colors.ok, 2],
  ['agent: here is a shortlist', colors.request, 1],
];
const CAP = 8; // thousands of tokens
const ROW_Y = (i: number) => -165 + i * 68;

export default makeScene2D('agent-memory', function* (view) {
  const s = makeScaffold(view, script, 'Planning', {badgeY: 150});
  const {sfx, dot} = s;

  const win = createRef<Rect>();
  const rows = createRefArray<Rect>();
  const summary = createRef<Rect>();
  const meter = createRef<Rect>();
  const meterTxt = createRef<Txt>();
  const store = createRef<Rect>();
  const fact1 = createRef<Txt>();
  const fact2 = createRef<Txt>();
  const types = addChips(view, [
    ['Facts about the user', colors.request],
    ['Episodes: what worked', colors.token],
    ['Procedures: how to do tasks', colors.ok],
  ], -250, 130);
  const careful = addChips(view, [
    ['Wrong memories mislead', colors.danger],
    ['Stale memories linger', colors.danger],
    ['Decide what to save, and when to forget', colors.ok],
  ], -250, 130, {fontSize: 36});
  let tokens = 0;

  view.add(
    <>
      <Rect ref={win} width={900} height={600} radius={28} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={WIN_Y} opacity={0}>
        <Txt fontFamily={FONT} text="Context window" fill={colors.request} fontSize={38} fontWeight={800} y={-262} />
        {MSG.map(([t, c], i) => (
          <Rect ref={rows} width={820} height={58} radius={12} fill={colors.empty} stroke={c} lineWidth={3}
            y={ROW_Y(i) + 0} opacity={0}>
            <Txt fontFamily={FONT} text={t} fill={c} fontSize={30} fontWeight={700} />
          </Rect>
        ))}
        <Rect ref={summary} width={820} height={58} radius={12} fill={colors.empty} stroke={colors.ok} lineWidth={3}
          y={ROW_Y(0)} opacity={0}>
          <Txt fontFamily={FONT} text="summary of earlier steps" fill={colors.ok} fontSize={30} fontWeight={700} />
        </Rect>
        <Rect width={700} height={22} radius={11} fill={colors.bg} y={248} />
        <Rect ref={meter} width={0} height={22} radius={11} fill={colors.token} x={-350} y={248} offset={[-1, 0]} />
        <Txt ref={meterTxt} fontFamily={FONT} text={`tokens: 0k / ${CAP}k`} fill={colors.muted} fontSize={26}
          fontWeight={700} y={282} />
      </Rect>

      <Rect ref={store} width={820} height={230} radius={28} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={400} opacity={0}>
        <Txt fontFamily={FONT} text="Long-term memory (database)" fill={colors.ok} fontSize={34} fontWeight={800} y={-75} />
        <Txt ref={fact1} fontFamily={FONT} text="" fill={colors.text} fontSize={32} fontWeight={700} y={-10} />
        <Txt ref={fact2} fontFamily={FONT} text="" fill={colors.text} fontSize={32} fontWeight={700} y={50} />
      </Rect>
    </>,
  );

  const setTokens = (k: number, color = colors.token) => {
    tokens = k;
    meterTxt().text(`tokens: ${k}k / ${CAP}k`);
    meter().fill(color);
  };
  const meterTo = (k: number) => meter().width((700 * k) / CAP, 0.35);

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* win().opacity(1, 0.4);
    for (let i = 0; i < 3; i++) {
      sfx(`plink${i}`, 0.5);
      yield* rows[i].opacity(1, 0.3);
      yield* waitFor(0.4);
    }
    yield* waitFor(0.6);
    // A new call starts: the model sees none of it.
    sfx('buzz', 0.5);
    yield* all(...rows.map(r => r.opacity(0, 0.4)));
    yield* s.showBadge('NEW CALL: IT REMEMBERS NOTHING', colors.danger);
  }

  function* short(): ThreadGenerator {
    yield* s.hideBadge();
    for (let i = 0; i < MSG.length; i++) {
      sfx(`plink${i % 5}`, 0.4);
      setTokens(tokens + MSG[i][2] * 1.25 > CAP ? tokens : Math.round((tokens + MSG[i][2] * 1.25) * 10) / 10);
      yield* all(rows[i].opacity(1, 0.25), meterTo(tokens));
      yield* waitFor(0.45);
    }
    yield* s.showBadge('FAST, BUT LIMITED IN SIZE', colors.token);
  }

  function* overflow(): ThreadGenerator {
    yield* s.hideBadge();
    setTokens(7.9, colors.danger);
    yield* meterTo(7.9);
    sfx('alarm', 0.5);
    yield* s.showBadge('CONTEXT FULL', colors.danger);
    yield* waitFor(1.5);
    // Older messages are replaced by a short summary.
    sfx('whoosh', 0.5);
    yield* all(...[0, 1, 2, 3].map(i => rows[i].opacity(0, 0.4)));
    yield* summary().opacity(1, 0.4);
    setTokens(3.5, colors.ok);
    yield* meterTo(3.5);
    yield* s.showBadge('SUMMARIZE OLD MESSAGES', colors.ok);
  }

  function* long(): ThreadGenerator {
    yield* s.hideBadge();
    sfx('whoosh', 0.5);
    yield* store().opacity(1, 0.4);
    // Save a fact.
    sfx('blip', 0.3);
    yield* dot([[0, WIN_Y + 300], [0, 400 - 120]] as P[], colors.ok, 0.6);
    fact1().text('user prefers window seats');
    sfx('plink2', 0.5);
    yield* waitFor(0.8);
    fact2().text('trip: Paris, May 12');
    sfx('plink3', 0.5);
    yield* waitFor(1.2);
    // Later: retrieve the relevant fact into the context.
    sfx('blip', 0.3);
    yield* dot([[0, 400 - 120], [0, WIN_Y + 300]] as P[], colors.token, 0.6);
    sfx('ding', 0.5);
    yield* s.showBadge('SAVE FACTS, RETRIEVE WHEN NEEDED', colors.ok);
  }

  function* typesBeat(): ThreadGenerator {
    yield* all(s.hideBadge(), win().opacity(0, 0.4), store().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    yield* reveal(types, sfx, [1.5, 1.6, 0]);
  }

  function* carefulBeat(): ThreadGenerator {
    yield* all(...types.map(t => t.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* reveal(careful, sfx, [1.8, 1.8, 0]);
  }

  yield* s.run({hook, short, overflow, long, types: typesBeat, careful: carefulBeat});
});
