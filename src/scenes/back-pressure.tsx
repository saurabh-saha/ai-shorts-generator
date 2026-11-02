import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  createRefArray,
  range,
  waitFor,
} from '@revideo/core';
import script from '../../data/back-pressure.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const PROD_Y = -540;
const BUF_Y = -130;
const CONS_Y = 280;
const CAP = 10;
const STRATEGIES: [string, string][] = [
  ['Slow the producer', colors.ok],
  ['Bound the buffer', colors.token],
  ['Drop on purpose', colors.danger],
];
const EXAMPLES = ['Kafka: consumers pull', 'Reactive Streams: request(n)', 'TCP: window size'];

export default makeScene2D('back-pressure', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const prod = createRef<Rect>();
  const prodRate = createRef<Txt>();
  const buf = createRef<Rect>();
  const bufTxt = createRef<Txt>();
  const cells = createRefArray<Rect>();
  const cons = createRef<Rect>();
  const consRate = createRef<Txt>();
  const strat = createRefArray<Rect>();
  const exam = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  let n = 0; // items in the buffer

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={prod} width={460} height={150} radius={24} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={PROD_Y}>
        <Txt fontFamily={FONT} text="Producer" fill={colors.request} fontSize={42} fontWeight={800} y={-28} />
        <Txt ref={prodRate} fontFamily={FONT} text="10 / sec" fill={colors.token} fontSize={38} fontWeight={800} y={28} />
      </Rect>

      <Rect ref={buf} width={600} height={190} radius={26} fill={colors.panel} stroke={colors.empty}
        lineWidth={6} y={BUF_Y}>
        <Txt fontFamily={FONT} text="Buffer" fill={colors.text} fontSize={38} fontWeight={800} y={-62} />
        {range(CAP).map(i => (
          <Rect ref={cells} width={44} height={44} radius={8} fill={colors.empty} x={(i - 4.5) * 54} y={0} />
        ))}
        <Txt ref={bufTxt} fontFamily={FONT} text={`buffer: 0/${CAP}`} fill={colors.text} fontSize={32}
          fontWeight={700} y={62} />
      </Rect>

      <Rect ref={cons} width={460} height={150} radius={24} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={CONS_Y}>
        <Txt fontFamily={FONT} text="Consumer" fill={colors.ok} fontSize={42} fontWeight={800} y={-28} />
        <Txt ref={consRate} fontFamily={FONT} text="2 / sec" fill={colors.token} fontSize={38} fontWeight={800} y={28} />
      </Rect>

      {STRATEGIES.map(([t, c], i) => (
        <Rect ref={strat} width={800} height={90} radius={20} fill={colors.panel} stroke={c} lineWidth={5}
          y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={c} fontSize={44} fontWeight={800} />
        </Rect>
      ))}
      {EXAMPLES.map((t, i) => (
        <Rect ref={exam} width={860} height={90} radius={20} fill={colors.panel} stroke={colors.request}
          lineWidth={5} y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.request} fontSize={40} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={470} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Delivery Guarantees" fill={colors.token} fontSize={76} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const prodPt: P = [0, PROD_Y + 80];
  const bufTop: P = [0, BUF_Y - 100];
  const bufBottom: P = [0, BUF_Y + 100];
  const consPt: P = [0, CONS_Y - 80];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function setBuf() {
    cells.forEach((c, i) => c.fill(i < n ? colors.token : colors.empty));
    bufTxt().text(`buffer: ${n}/${CAP}`);
    bufTxt().fill(n >= CAP ? colors.danger : colors.text);
    buf().stroke(n >= CAP ? colors.danger : colors.empty);
  }

  // The producer sends one item; if the buffer is full it is dropped.
  function* produce(t = 0.3): ThreadGenerator {
    sfx('blip', 0.2);
    yield* dot([prodPt, bufTop], colors.request, t);
    if (n < CAP) {
      n++;
      setBuf();
    } else {
      sfx('buzz', 0.3);
      yield* dot([bufTop, [260, -300]], colors.danger, 0.3);
    }
  }

  // The consumer takes one item out of the buffer.
  function* consumeOne(): ThreadGenerator {
    if (n === 0) return;
    n--;
    setBuf();
    sfx('pop', 0.3);
    yield* dot([bufBottom, consPt], colors.ok, 0.3);
  }

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 12; i++) {
      yield* produce();
      if (i % 3 === 2) yield consumeOne();
      yield* waitFor(0.12);
    }
  }

  function* overflow(): ThreadGenerator {
    for (let i = 0; i < 6; i++) {
      yield* produce();
      yield* waitFor(0.15);
    }
    sfx('alarm', 0.5);
    yield* showBadge('BUFFER FULL: CRASH OR DROP DATA', colors.danger);
    yield* waitFor(0.6);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    n = 6;
    setBuf();
    // The consumer signals the producer to slow down.
    sfx('whoosh', 0.5);
    yield* showBadge('BACK PRESSURE: SLOW DOWN', colors.token);
    yield* dot([[190, CONS_Y - 80], [190, PROD_Y + 80]], colors.token, 1.0);
    prodRate().text('2 / sec');
    prodRate().fill(colors.ok);
    sfx('ding', 0.5);
    // Now the two sides run at the same speed and the buffer stays steady.
    for (let i = 0; i < 4; i++) {
      yield* produce(0.35);
      yield consumeOne();
      yield* waitFor(0.5);
    }
  }

  function* strategies(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      prod().opacity(0, 0.4), buf().opacity(0, 0.4), cons().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < STRATEGIES.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* strat[i].opacity(1, 0.3);
      yield* waitFor([2.2, 2.4, 0][i]);
    }
  }

  function* pull(): ThreadGenerator {
    yield* all(...strat.map(s => s.opacity(0, 0.3)));
    n = 0;
    setBuf();
    yield* all(prod().opacity(1, 0.4), cons().opacity(1, 0.4));
    prodRate().text('waits for requests');
    prodRate().fill(colors.muted);
    consRate().text('ready for 2 more');
    consRate().fill(colors.ok);
    yield* showBadge('PULL: ASK WHEN READY', colors.ok);
    for (let r = 0; r < 2; r++) {
      // The consumer asks for two items, then the producer sends exactly two.
      sfx('whoosh', 0.3);
      yield* dot([consPt, prodPt], colors.token, 0.8);
      for (let k = 0; k < 2; k++) {
        sfx('blip', 0.3);
        yield* dot([prodPt, consPt], colors.request, 0.8);
        yield* waitFor(0.15);
      }
      sfx('ding', 0.4);
      yield* waitFor(0.5);
    }
  }

  function* examples(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), prod().opacity(0, 0.4), cons().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    for (let i = 0; i < EXAMPLES.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* exam[i].opacity(1, 0.3);
      yield* waitFor([1.2, 1.5, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, overflow, concept, strategies, pull, examples, close,
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
