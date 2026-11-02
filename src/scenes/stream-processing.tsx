import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  sequence,
  waitFor,
} from '@revideo/core';
import script from '../../data/stream-processing.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const SOURCE_Y = -540;
const STORE_Y = -170;
const PROC_Y = 250;
const WIN_Y = -60;
const WIN_X = [-330, 0, 330];
const WIN_TITLES = ['0:00 - 1:00', '1:00 - 2:00', '2:00 - 3:00'];
const TOOLS = ['Kafka Streams', 'Apache Flink', 'Spark Streaming'];
const DEAD_FILL = '#7f1d1d';

export default makeScene2D('stream-processing', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const storeBox = createRef<Rect>();
  const storeTxt = createRef<Txt>();
  const clock = createRef<Txt>();
  const proc = createRef<Rect>();
  const procName = createRef<Txt>();
  const procStatus = createRef<Txt>();
  const ckpt = createRef<Txt>();
  const wins = createRefArray<Rect>();
  const winCount = createRefArray<Txt>();
  const winState = createRefArray<Txt>();
  const tools = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  const counts = [0, 0, 0];

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={88} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={440} height={110} radius={22} fill={colors.panel} stroke={colors.request} lineWidth={6} y={SOURCE_Y}>
        <Txt fontFamily={FONT} text="Event source" fill={colors.request} fontSize={40} fontWeight={800} />
      </Rect>

      <Rect ref={storeBox} width={500} height={160} radius={26} fill={colors.panel} stroke={colors.empty}
        lineWidth={6} y={STORE_Y}>
        <Txt fontFamily={FONT} text="Storage" fill={colors.text} fontSize={42} fontWeight={800} y={-28} />
        <Txt ref={storeTxt} fontFamily={FONT} text="stored: 0" fill={colors.token} fontSize={40} fontWeight={800} y={32} />
      </Rect>
      <Txt ref={clock} fontFamily={FONT} text="" fill={colors.muted} fontSize={44} fontWeight={800}
        y={STORE_Y + 150} opacity={0} />

      <Rect ref={proc} width={600} height={230} radius={28} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={PROC_Y}>
        <Txt ref={procName} fontFamily={FONT} text="Batch job" fill={colors.ok} fontSize={44} fontWeight={800} y={-60} />
        <Txt ref={procStatus} fontFamily={FONT} text="sleeping..." fill={colors.muted} fontSize={42} fontWeight={800} y={5} />
        <Txt ref={ckpt} fontFamily={FONT} text="" fill={colors.ok} fontSize={30} fontWeight={700} y={65} />
      </Rect>

      {WIN_X.map((x, i) => (
        <Rect ref={wins} width={300} height={230} radius={22} fill={colors.panel} stroke={colors.empty}
          lineWidth={6} position={[x, WIN_Y]} opacity={0}>
          <Txt fontFamily={FONT} text={WIN_TITLES[i]} fill={colors.muted} fontSize={28} fontWeight={700} y={-80} />
          <Txt ref={winCount} fontFamily={FONT} text="0" fill={colors.token} fontSize={80} fontWeight={800} y={-5} />
          <Txt ref={winState} fontFamily={FONT} text="open" fill={colors.ok} fontSize={30} fontWeight={800} y={75} />
        </Rect>
      ))}

      {TOOLS.map((t, i) => (
        <Rect ref={tools} width={760} height={90} radius={20} fill={colors.panel} stroke={colors.request}
          lineWidth={5} y={-250 + i * 130} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.request} fontSize={46} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={44} fontWeight={800}
        y={500} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Back Pressure" fill={colors.token} fontSize={96} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const sourcePt: P = [0, SOURCE_Y + 60];
  const storeTop: P = [0, STORE_Y - 85];
  const storeBottom: P = [0, STORE_Y + 85];
  const procTop: P = [0, PROC_Y - 120];
  const winTop = (i: number): P => [WIN_X[i], WIN_Y - 120];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, c: string) => chain(r.fill(c, 0.1), r.fill(colors.panel, 0.25));

  function* addToWindow(i: number, color = colors.request, t = 0.25): ThreadGenerator {
    sfx('blip', 0.25);
    yield* dot([sourcePt, winTop(i)], color, t);
    counts[i]++;
    winCount[i].text(String(counts[i]));
    sfx('pop', 0.4);
    yield flash(wins[i], colors.ok);
  }

  function* hook(): ThreadGenerator {
    // Events pile up in storage all day...
    for (let n = 1; n <= 8; n++) {
      sfx('blip', 0.2);
      yield* dot([sourcePt, storeTop], colors.request, 0.3);
      storeTxt().text(`stored: ${n}`);
      yield* waitFor(0.15);
    }
    clock().text('waiting for midnight...');
    yield* clock().opacity(1, 0.3);
    yield* waitFor(1.2);
    // ...then one big job runs.
    sfx('whoosh', 0.5);
    clock().text('00:00');
    clock().fill(colors.token);
    procStatus().text('crunching...');
    procStatus().fill(colors.token);
    yield* all(...range8().map(k => chain(waitFor(k * 0.06), dot([storeBottom, procTop], colors.token, 0.6))));
    sfx('alarm', 0.4);
    yield* showBadge('RESULTS: HOURS LATER', colors.danger);
  }
  const range8 = () => Array.from({length: 8}, (_, k) => k);

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), storeBox().opacity(0, 0.4), clock().opacity(0, 0.3));
    procName().text('Stream processor');
    procStatus().text('count: 0');
    procStatus().fill(colors.ok);
    sfx('whoosh', 0.5);
    yield* showBadge('EACH EVENT, AS IT ARRIVES', colors.ok);
    for (let n = 1; n <= 6; n++) {
      sfx('blip', 0.3);
      yield* dot([sourcePt, procTop], colors.request, 0.35);
      procStatus().text(`count: ${n}`);
      sfx('pop', 0.4);
      yield flash(proc(), colors.ok);
      yield* waitFor(0.1);
    }
    yield* waitFor(0.6); // let the last flash finish before the beat ends
  }

  function* windows(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), proc().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    yield* sequence(0.15, ...wins.map(w => w.opacity(1, 0.3)));
    yield* showBadge('CLICKS PER MINUTE', colors.token);
    for (const i of [0, 0, 0, 1, 1, 1, 1, 2, 2]) {
      yield* addToWindow(i);
      yield* waitFor(0.1);
    }
    yield* waitFor(0.6); // let the last flash finish before the beat ends
  }

  function* late(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // Windows 1 and 2 are complete: the watermark has passed them.
    sfx('plink1', 0.5);
    for (const i of [0, 1]) {
      winState[i].text('closed');
      winState[i].fill(colors.muted);
      wins[i].stroke(colors.muted);
    }
    yield* showBadge('WATERMARK PASSED WINDOWS 1 + 2', colors.token);
    yield* waitFor(1.5);
    // A late event that belongs to window 1 still arrives.
    sfx('blip', 0.3);
    yield* showBadge('A LATE EVENT ARRIVES', colors.danger);
    yield* dot([sourcePt, winTop(0)], colors.token, 0.7);
    counts[0]++;
    winCount[0].text(String(counts[0]));
    winState[0].text('updated (late)');
    winState[0].fill(colors.token);
    sfx('ding', 0.5);
    yield* flash(wins[0], colors.token);
    yield* showBadge('EVENT TIME, NOT ARRIVAL TIME', colors.ok);
  }

  function* state(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), ...wins.map(w => w.opacity(0, 0.4)));
    proc().opacity(1);
    proc().fill(colors.panel);
    proc().stroke(colors.ok);
    procName().text('Stream processor');
    procStatus().text('count: 40');
    procStatus().fill(colors.ok);
    ckpt().text('checkpoint: 40');
    ckpt().fill(colors.ok);
    sfx('plink0', 0.5);
    yield* waitFor(0.6);
    for (const n of [41, 42]) {
      sfx('blip', 0.3);
      yield* dot([sourcePt, procTop], colors.request, 0.4);
      procStatus().text(`count: ${n}`);
      yield* flash(proc(), colors.ok);
    }
    yield* waitFor(0.4);
    sfx('alarm', 0.5);
    procStatus().text('DOWN');
    procStatus().fill(colors.text);
    ckpt().text('checkpoint: 40');
    yield* all(proc().fill(DEAD_FILL, 0.3), proc().stroke(colors.danger, 0.3));
    yield* showBadge('CRASH AT COUNT 42', colors.danger);
    yield* waitFor(1);
    // Restart from the checkpoint and replay only what came after it.
    sfx('whoosh', 0.5);
    procStatus().text('restored: 40');
    procStatus().fill(colors.token);
    yield* all(proc().fill(colors.panel, 0.3), proc().stroke(colors.ok, 0.3));
    yield* showBadge('REPLAY FROM THE CHECKPOINT', colors.token);
    for (const n of [41, 42]) {
      sfx('blip', 0.3);
      yield* dot([sourcePt, procTop], colors.token, 0.4);
      procStatus().text(`count: ${n}`);
      procStatus().fill(colors.ok);
      yield* flash(proc(), colors.ok);
    }
    sfx('ding', 0.5);
    yield* showBadge('NO LOSS, NO DOUBLE COUNT', colors.ok);
  }

  function* toolsBeat(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), proc().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    for (let i = 0; i < TOOLS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* tools[i].opacity(1, 0.3);
      yield* waitFor(0.8);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, concept, windows, late, state, tools: toolsBeat, close,
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
