import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/event-sourcing.json';
import {FONT, makeKit} from '../components/kit';
import {colors} from '../theme';

const EVENTS: [string, number][] = [
  ['Deposited +100', 100],
  ['Withdrew -20', -20],
  ['Deposited +40', 40],
  ['Withdrew -30', -30],
  ['Deposited +10', 10],
];
// Balance after each event: 100, 80, 120, 90, 100.
const BALANCE = EVENTS.reduce<number[]>((acc, [, d]) => [...acc, (acc[acc.length - 1] ?? 0) + d], []);
const EVENT_Y = (i: number) => -240 + i * 100;
const BENEFITS = ['Full audit trail', 'Time travel', 'Replay to fix bugs'];
const COSTS = ['More complex', 'Events never change', 'Separate read model'];
const COST_COLOR = [colors.danger, colors.token, colors.request];

export default makeScene2D('event-sourcing', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const bal = createRef<Txt>();
  const logLabel = createRef<Txt>();
  const chips = createRefArray<Rect>();
  const running = createRefArray<Txt>();
  const snap = createRef<Rect>();
  const snapTxt = createRef<Txt>();
  const benefit = createRefArray<Rect>();
  const cost = createRefArray<Rect>();
  const acct = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={acct} width={600} height={150} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={-560}>
        <Txt fontFamily={FONT} text="Account" fill={colors.request} fontSize={36} fontWeight={800} y={-40} />
        <Txt ref={bal} fontFamily={FONT} text="balance: 100" fill={colors.token} fontSize={56} fontWeight={800} y={22} />
      </Rect>

      <Txt ref={logLabel} fontFamily={FONT} text="event log (append-only)" fill={colors.muted} fontSize={30}
        y={-340} opacity={0} />

      {EVENTS.map(([text], i) => (
        <Rect ref={chips} width={640} height={76} radius={16} fill={colors.panel} stroke={colors.empty}
          lineWidth={5} position={[-40, EVENT_Y(i)]} opacity={0}>
          <Txt fontFamily={FONT} text={`E${i + 1}`} fill={colors.muted} fontSize={30} fontWeight={800} x={-270} />
          <Txt fontFamily={FONT} text={text} fill={colors.text} fontSize={36} fontWeight={700} x={-40} />
          <Txt ref={running} fontFamily={FONT} text={`= ${BALANCE[i]}`} fill={colors.token} fontSize={32}
            fontWeight={800} x={245} opacity={0} />
        </Rect>
      ))}

      <Rect ref={snap} width={190} height={96} radius={18} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} position={[430, EVENT_Y(2)]} opacity={0}>
        <Txt fontFamily={FONT} text="snapshot" fill={colors.ok} fontSize={28} fontWeight={800} y={-18} />
        <Txt ref={snapTxt} fontFamily={FONT} text="= 120" fill={colors.token} fontSize={34} fontWeight={800} y={20} />
      </Rect>

      {BENEFITS.map((t, i) => (
        <Rect ref={benefit} width={760} height={76} radius={18} fill={colors.panel} stroke={colors.ok}
          lineWidth={5} y={285 + i * 95} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.ok} fontSize={38} fontWeight={800} />
        </Rect>
      ))}

      {COSTS.map((t, i) => (
        <Rect ref={cost} width={820} height={96} radius={20} fill={colors.panel} stroke={COST_COLOR[i]}
          lineWidth={5} y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={COST_COLOR[i]} fontSize={44} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={260} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="CQRS" fill={colors.token} fontSize={140} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const setBal = (text: string, color = colors.token) => {
    bal().text(text);
    bal().fill(color);
  };

  const pulse = (r: Rect) => chain(r.scale(1.05, 0.12), r.scale(1, 0.15));
  const hi = (i: number, on: boolean) => chips[i].stroke(on ? colors.token : colors.empty, 0.15);

  function* hook(): ThreadGenerator {
    yield* waitFor(1);
    sfx('blip', 0.3);
    setBal('balance: 80', colors.danger);
    yield* pulse(acct());
    yield* waitFor(1);
    sfx('blip', 0.3);
    setBal('balance: 120', colors.danger);
    yield* pulse(acct());
    sfx('buzz', 0.4);
    yield* showBadge('OLD VALUES: GONE', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    setBal('balance: ?', colors.muted);
    sfx('whoosh', 0.5);
    yield* logLabel().opacity(1, 0.3);
    for (let i = 0; i < EVENTS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* all(chips[i].opacity(1, 0.3), pulse(chips[i]));
      yield* waitFor(0.4);
    }
    yield* showBadge('EVERY CHANGE = AN EVENT', colors.ok);
  }

  function* state(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    setBal('balance: 0', colors.muted);
    yield* waitFor(0.5);
    for (let i = 0; i < EVENTS.length; i++) {
      sfx('pop', 0.4);
      yield* hi(i, true);
      running[i].opacity(1);
      setBal(`balance: ${BALANCE[i]}`);
      yield* pulse(acct());
      yield* waitFor(0.5);
      yield* hi(i, false);
    }
    sfx('ding', 0.5);
    yield* showBadge('STATE = REPLAY OF EVENTS', colors.ok);
  }

  function* benefits(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('plink0', 0.5);
    yield* benefit[0].opacity(1, 0.3);
    yield* all(...chips.map(c => c.stroke(colors.ok, 0.3)));
    yield* waitFor(1.5);
    yield* all(...chips.map(c => c.stroke(colors.empty, 0.3)));
    // Time travel: the account as it was after E2.
    sfx('plink1', 0.5);
    yield* benefit[1].opacity(1, 0.3);
    yield* hi(1, true);
    setBal('at E2: 80', colors.token);
    yield* pulse(acct());
    yield* waitFor(2);
    yield* hi(1, false);
    sfx('plink2', 0.5);
    yield* benefit[2].opacity(1, 0.3);
    setBal('balance: 100');
  }

  function* snapshots(): ThreadGenerator {
    yield* all(...benefit.map(b => b.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* all(snap().opacity(1, 0.4), ...[0, 1, 2].map(i => chips[i].opacity(0.3, 0.4)));
    setBal('start from 120', colors.ok);
    yield* pulse(acct());
    yield* waitFor(0.6);
    for (const i of [3, 4]) {
      sfx('pop', 0.4);
      yield* hi(i, true);
      setBal(`balance: ${BALANCE[i]}`);
      yield* pulse(acct());
      yield* waitFor(0.5);
      yield* hi(i, false);
    }
    yield* showBadge('REPLAY ONLY WHAT CAME AFTER', colors.ok);
  }

  function* tradeoff(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      logLabel().opacity(0, 0.3),
      snap().opacity(0, 0.3),
      ...chips.map(c => c.opacity(0, 0.3)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < COSTS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* cost[i].opacity(1, 0.3);
      yield* waitFor([1.8, 2.2, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, concept, state, benefits, snapshots, tradeoff, close,
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
