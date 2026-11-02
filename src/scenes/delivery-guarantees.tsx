import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/delivery-guarantees.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const PROD_Y = -560;
const REC_Y = 170;
const MID_Y = -200;
const FAILURES = ['Message lost', 'Acknowledgment lost', 'Consumer crashes'];
const HOW = ['Idempotent consumers', 'Transactions: output + offset', 'Message IDs for dedupe'];
const CHOOSE: [string, string, string][] = [
  ['Metrics', 'at-most-once', colors.request],
  ['Most systems', 'at-least-once + idempotent', colors.token],
  ['Payments', 'exactly-once effect', colors.ok],
];

export default makeScene2D('delivery-guarantees', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const mode = createRef<Txt>();
  const prodTxt = createRef<Txt>();
  const prod = createRef<Rect>();
  const rec = createRef<Rect>();
  const recList = createRef<Txt>();
  const effects = createRef<Txt>();
  const cross = createRef<Txt>();
  const fail = createRefArray<Rect>();
  const how = createRefArray<Rect>();
  const choose = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  let received: string[] = [];
  let applied = 0;

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={82} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={prod} width={460} height={140} radius={24} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={PROD_Y}>
        <Txt fontFamily={FONT} text="Producer" fill={colors.request} fontSize={42} fontWeight={800} y={-24} />
        <Txt ref={prodTxt} fontFamily={FONT} text="sends message #1" fill={colors.muted} fontSize={30} y={28} />
      </Rect>

      <Txt ref={mode} fontFamily={FONT} text="" fill={colors.token} fontSize={50} fontWeight={800}
        y={-430} opacity={0} />

      <Rect ref={rec} width={600} height={330} radius={28} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={REC_Y}>
        <Txt fontFamily={FONT} text="Consumer" fill={colors.ok} fontSize={42} fontWeight={800} y={-120} />
        <Txt ref={recList} fontFamily={FONT} text="received: -" fill={colors.text} fontSize={36} fontWeight={700} y={-30} />
        <Txt ref={effects} fontFamily={FONT} text="effects applied: 0" fill={colors.token} fontSize={38} fontWeight={800} y={90} />
      </Rect>

      <Txt ref={cross} fontFamily={FONT} text="X" fill={colors.danger} fontSize={110} fontWeight={800}
        y={MID_Y} opacity={0} />

      {FAILURES.map((t, i) => (
        <Rect ref={fail} width={640} height={80} radius={18} fill={colors.panel} stroke={colors.danger}
          lineWidth={5} y={-340 + i * 105} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.danger} fontSize={38} fontWeight={800} />
        </Rect>
      ))}

      {HOW.map((t, i) => (
        <Rect ref={how} width={860} height={90} radius={20} fill={colors.panel} stroke={colors.ok}
          lineWidth={5} y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.ok} fontSize={40} fontWeight={800} />
        </Rect>
      ))}

      {CHOOSE.map(([who, what, c], i) => (
        <Rect ref={choose} width={900} height={130} radius={22} fill={colors.panel} stroke={c}
          lineWidth={5} y={-260 + i * 170} opacity={0}>
          <Txt fontFamily={FONT} text={who} fill={colors.text} fontSize={44} fontWeight={800} y={-24} />
          <Txt fontFamily={FONT} text={what} fill={c} fontSize={34} fontWeight={800} y={28} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={44} fontWeight={800}
        y={470} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Windowing Types" fill={colors.token} fontSize={88} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const prodPt: P = [0, PROD_Y + 80];
  const recTop: P = [0, REC_Y - 175];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function* setMode(text: string, color = colors.token): ThreadGenerator {
    mode().text(text);
    mode().fill(color);
    yield* mode().opacity(1, 0.2);
  }

  function renderReceiver() {
    recList().text(received.length ? `received: ${received.join('  ')}` : 'received: -');
    effects().text(`effects applied: ${applied}`);
    effects().fill(applied > 1 ? colors.danger : colors.token);
  }

  function resetReceiver() {
    received = [];
    applied = 0;
    renderReceiver();
  }

  const flash = (r: Rect, c: string) => chain(r.fill(c, 0.1), r.fill(colors.panel, 0.25));

  // Producer -> consumer. Returns after the consumer has the message.
  function* deliver(id: string, apply = true): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([prodPt, recTop], colors.request, 0.6);
    received.push(id);
    if (apply) applied++;
    renderReceiver();
    sfx('pop', 0.5);
    yield flash(rec(), colors.ok);
  }

  // The message never arrives: the dot dies halfway and an X shows.
  function* loseMessage(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([prodPt, [0, MID_Y]], colors.request, 0.4);
    sfx('buzz', 0.5);
    yield* cross().opacity(1, 0.15);
    yield* waitFor(0.5);
    yield* cross().opacity(0, 0.2);
  }

  // The acknowledgment travels back (or dies halfway).
  function* ack(lost: boolean): ThreadGenerator {
    if (lost) {
      yield* dot([recTop, [0, MID_Y]], colors.ok, 0.4);
      sfx('buzz', 0.5);
      yield* cross().opacity(1, 0.15);
      yield* waitFor(0.5);
      yield* cross().opacity(0, 0.2);
    } else {
      yield* dot([recTop, prodPt], colors.ok, 0.6);
      sfx('ding', 0.4);
    }
  }

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.4);
    for (let i = 0; i < FAILURES.length; i++) {
      sfx('buzz', 0.4);
      yield* fail[i].opacity(1, 0.3);
      yield* waitFor(1.3);
    }
  }

  function* most(): ThreadGenerator {
    yield* all(...fail.map(f => f.opacity(0, 0.3)));
    resetReceiver();
    yield* setMode('AT MOST ONCE');
    prodTxt().text('sends #1, then #2');
    yield* deliver('#1');
    yield* waitFor(0.3);
    yield* loseMessage();
    prodTxt().text('no retry');
    yield* showBadge('MAY LOSE MESSAGES, NEVER DUPLICATES', colors.danger);
  }

  function* least(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    resetReceiver();
    yield* setMode('AT LEAST ONCE');
    prodTxt().text('sends #1');
    yield* deliver('#1');
    yield* ack(true);
    prodTxt().text('no ack: retry #1');
    prodTxt().fill(colors.token);
    yield* waitFor(0.6);
    yield* deliver('#1');
    yield* ack(false);
    prodTxt().fill(colors.muted);
    sfx('alarm', 0.4);
    yield* showBadge('NOTHING LOST, BUT #1 ARRIVED TWICE', colors.danger);
  }

  function* exactly(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    resetReceiver();
    yield* setMode('EXACTLY-ONCE EFFECT', colors.ok);
    prodTxt().text('sends #1');
    yield* deliver('#1');
    yield* ack(true);
    prodTxt().text('no ack: retry #1');
    prodTxt().fill(colors.token);
    yield* waitFor(0.6);
    // The consumer remembers #1 and ignores the duplicate.
    sfx('blip', 0.3);
    yield* dot([prodPt, recTop], colors.request, 0.6);
    recList().text('received: #1  (duplicate ignored)');
    sfx('plink2', 0.5);
    yield* flash(rec(), colors.token);
    yield* ack(false);
    prodTxt().fill(colors.muted);
    yield* showBadge('AT-LEAST-ONCE + DEDUPLICATION', colors.ok);
  }

  function* howBeat(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2), mode().opacity(0, 0.3),
      prod().opacity(0, 0.4), rec().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < HOW.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* how[i].opacity(1, 0.3);
      yield* waitFor([1.6, 1.8, 0][i]);
    }
  }

  function* chooseBeat(): ThreadGenerator {
    yield* all(...how.map(h => h.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    for (let i = 0; i < CHOOSE.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* choose[i].opacity(1, 0.3);
      yield* waitFor([1.8, 2.0, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, most, least, exactly, how: howBeat, choose: chooseBeat, close,
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
