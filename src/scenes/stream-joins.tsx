import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/stream-joins.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const SRC_Y = -540;
const PROC_Y = -100;
const OUT_Y = 330;
const PINK = '#f472b6';
const KEY_COLOR: Record<string, string> = {u7: colors.request, u3: colors.token, u12: PINK};
const GOTCHAS = ['Joins keep state in memory', 'Late or out-of-order events', 'Skewed keys overload one node'];
const GOTCHA_COLOR = [colors.token, colors.danger, colors.request];

export default makeScene2D('stream-joins', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const leftBox = createRef<Rect>();
  const rightBox = createRef<Rect>();
  const leftName = createRef<Txt>();
  const rightName = createRef<Txt>();
  const rightSub = createRef<Txt>();
  const proc = createRef<Rect>();
  const procTitle = createRef<Txt>();
  const procWindow = createRef<Txt>();
  const bufLeft = createRef<Txt>();
  const bufRight = createRef<Txt>();
  const out = createRef<Rect>();
  const outList = createRef<Txt>();
  const chips = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  let clicks: string[] = [];
  let outLines: string[] = [];

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={leftBox} width={420} height={130} radius={24} fill={colors.panel} stroke={colors.request} lineWidth={6}
        position={[-270, SRC_Y]}>
        <Txt ref={leftName} fontFamily={FONT} text="Click stream" fill={colors.request} fontSize={38} fontWeight={800} />
      </Rect>
      <Rect ref={rightBox} width={420} height={130} radius={24} fill={colors.panel} stroke={colors.ok} lineWidth={6}
        position={[270, SRC_Y]}>
        <Txt ref={rightName} fontFamily={FONT} text="Purchase stream" fill={colors.ok} fontSize={38}
          fontWeight={800} y={-18} />
        <Txt ref={rightSub} fontFamily={FONT} text="" fill={colors.muted} fontSize={26} fontWeight={700} y={32} />
      </Rect>

      <Rect ref={proc} width={640} height={270} radius={28} fill={colors.panel} stroke={colors.token}
        lineWidth={6} y={PROC_Y}>
        <Txt ref={procTitle} fontFamily={FONT} text="Stream join" fill={colors.token} fontSize={44}
          fontWeight={800} y={-95} />
        <Txt ref={procWindow} fontFamily={FONT} text="window: 5 min" fill={colors.muted} fontSize={32}
          fontWeight={700} y={-42} />
        <Txt ref={bufLeft} fontFamily={FONT} text="clicks:  -" fill={colors.request} fontSize={36}
          fontWeight={800} y={18} />
        <Txt ref={bufRight} fontFamily={FONT} text="purchases:  -" fill={colors.ok} fontSize={36}
          fontWeight={800} y={72} />
      </Rect>

      <Rect ref={out} width={640} height={200} radius={28} fill={colors.panel} stroke={colors.empty}
        lineWidth={6} y={OUT_Y}>
        <Txt fontFamily={FONT} text="Joined output" fill={colors.text} fontSize={38} fontWeight={800} y={-65} />
        <Txt ref={outList} fontFamily={FONT} text="-" fill={colors.text} fontSize={34} fontWeight={700} y={20} />
      </Rect>

      {GOTCHAS.map((t, i) => (
        <Rect ref={chips} width={860} height={100} radius={22} fill={colors.panel} stroke={GOTCHA_COLOR[i]}
          lineWidth={5} y={-250 + i * 140} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={GOTCHA_COLOR[i]} fontSize={42} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={44} fontWeight={800}
        y={500} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Log Compaction" fill={colors.token} fontSize={92} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const leftPt: P = [-270, SRC_Y + 65];
  const rightPt: P = [270, SRC_Y + 65];
  const procLeft: P = [-150, PROC_Y - 140];
  const procRight: P = [150, PROC_Y - 140];
  const procBottom: P = [0, PROC_Y + 140];
  const outTop: P = [0, OUT_Y - 105];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, c: string) => chain(r.fill(c, 0.1), r.fill(colors.panel, 0.25));
  const renderBuf = () => bufLeft().text(`clicks:  ${clicks.length ? clicks.join('  ') : '-'}`);
  const renderOut = () => outList().text(outLines.length ? outLines.join('\n') : '-');

  // A click arrives and waits in the buffer for its purchase.
  function* click(key: string): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([leftPt, procLeft], KEY_COLOR[key], 0.5);
    clicks.push(key);
    renderBuf();
    sfx('plink1', 0.4);
    yield flash(proc(), colors.token);
  }

  // A purchase arrives; it joins if its click is still buffered.
  function* purchase(key: string): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([rightPt, procRight], KEY_COLOR[key], 0.5);
    if (clicks.includes(key)) {
      clicks = clicks.filter(k => k !== key);
      renderBuf();
      sfx('ding', 0.5);
      yield* dot([procBottom, outTop], KEY_COLOR[key], 0.5);
      outLines.push(`${key}: click + purchase`);
      renderOut();
      yield flash(out(), colors.ok);
    } else {
      sfx('buzz', 0.4);
      yield* dot([procRight, rightPt], colors.danger, 0.5);
    }
  }

  function* hook(): ThreadGenerator {
    yield* click('u7');
    yield* waitFor(1.2);
    yield* click('u3');
    yield* waitFor(0.8);
    yield* showBadge('THEIR PURCHASES AREN\'T HERE YET', colors.token);
  }

  function* join(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('MATCH BY KEY, WITHIN THE WINDOW', colors.ok);
    yield* waitFor(1.2);
    yield* purchase('u7');
    yield* waitFor(1.2);
    yield* purchase('u3');
  }

  function* expire(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* click('u12');
    yield* waitFor(0.8);
    // The window runs out before a purchase shows up.
    sfx('alarm', 0.4);
    procWindow().text('window closed');
    procWindow().fill(colors.danger);
    clicks = clicks.filter(k => k !== 'u12');
    renderBuf();
    yield* showBadge('u12 EXPIRED AND DROPPED', colors.danger);
    yield* waitFor(1);
    // The purchase finally arrives, too late.
    yield* purchase('u12');
    yield* showBadge('TOO LATE: NO JOIN', colors.danger);
  }

  function* table(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    outLines = [];
    renderOut();
    clicks = [];
    renderBuf();
    leftName().text('Orders stream');
    rightName().text('Users table');
    rightSub().text('u7 Ana  ·  u3 Raj  ·  u12 Mei');
    procTitle().text('Enrich');
    procWindow().text('latest value');
    procWindow().fill(colors.muted);
    bufLeft().text('orders:  -');
    bufRight().text('lookup:  -');
    sfx('whoosh', 0.5);
    yield* showBadge('LOOK UP THE LATEST VALUE', colors.ok);
    for (const [key, name] of [['u7', 'Ana'], ['u3', 'Raj']]) {
      sfx('blip', 0.3);
      yield* dot([leftPt, procLeft], KEY_COLOR[key], 0.5);
      bufLeft().text(`orders:  ${key}`);
      // Ask the table for the customer, then continue with the answer.
      yield* dot([procRight, rightPt], colors.token, 0.4);
      sfx('plink1', 0.4);
      yield* dot([rightPt, procRight], colors.ok, 0.4);
      bufRight().text(`lookup:  ${name}`);
      sfx('ding', 0.5);
      yield* dot([procBottom, outTop], KEY_COLOR[key], 0.5);
      outLines.push(`order ${key} + ${name}`);
      renderOut();
      yield flash(out(), colors.ok);
      yield* waitFor(0.3);
    }
  }

  function* gotchas(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2), proc().opacity(0, 0.4), out().opacity(0, 0.4),
      leftBox().opacity(0, 0.4), rightBox().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < GOTCHAS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* chips[i].opacity(1, 0.3);
      yield* waitFor([1.6, 1.8, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, join, expire, table, gotchas, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
