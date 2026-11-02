import {Audio, Circle, Line, Rect, Txt, makeScene2D} from '@revideo/2d';
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
import script from '../../data/windowing-types.json';
import {FONT, makeKit} from '../components/kit';
import {colors} from '../theme';

const PINK = '#f472b6';
const EVENTS = [1, 2, 4, 6, 7, 11, 12, 13]; // event times on the timeline
const X = (t: number) => -450 + t * 60;
const EVENT_Y = 0;
const ROW_A = -240;
const ROW_B = -135;
const WIN_H = 84;
const TUMBLE: [number, number][] = [[0, 5], [5, 10], [10, 15]];
const TUMBLE_COLOR = [colors.request, colors.ok, colors.token];
const CHOOSE: [string, string][] = [
  ['Tumbling', 'simple reports'],
  ['Sliding', 'moving averages'],
  ['Session', 'user behavior'],
];
const CHOOSE_COLOR = [colors.request, PINK, colors.ok];

export default makeScene2D('windowing-types', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const mode = createRef<Txt>();
  const info = createRef<Txt>();
  const axis = createRef<Line>();
  const ticks = createRefArray<Txt>();
  const evs = createRefArray<Circle>();
  const tw = createRefArray<Rect>();
  const twCount = createRefArray<Txt>();
  const sa = createRef<Rect>();
  const saCount = createRef<Txt>();
  const sb = createRef<Rect>();
  const sbCount = createRef<Txt>();
  const s1 = createRef<Rect>();
  const s1Count = createRef<Txt>();
  const s2 = createRef<Rect>();
  const s2Count = createRef<Txt>();
  const gap = createRef<Txt>();
  const chips = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  const windowRect = (
    ref: ReturnType<typeof createRef<Rect>>,
    cnt: ReturnType<typeof createRef<Txt>>,
    from: number,
    to: number,
    y: number,
    color: string,
    label: string,
  ) => (
    <Rect ref={ref} width={(to - from) * 60 - 8} height={WIN_H} radius={14} fill={color + '33'} stroke={color}
      lineWidth={5} position={[X(from) + 4, y]} offset={[-1, 0]} opacity={0}>
      <Txt fontFamily={FONT} text={label} fill={colors.muted} fontSize={22} fontWeight={700} x={14} y={-26}
        offsetX={-1} />
      <Txt ref={cnt} fontFamily={FONT} text="0" fill={color} fontSize={44} fontWeight={800} y={8} />
    </Rect>
  );

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={88} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Txt ref={mode} fontFamily={FONT} text="" fill={colors.token} fontSize={64} fontWeight={800}
        y={-420} opacity={0} />

      {/* Tumbling windows */}
      {TUMBLE.map(([a, b], i) => windowRect(tw, twCount, a, b, ROW_A, TUMBLE_COLOR[i], `${a}-${b}`))}
      {/* Sliding windows: size 10, step 5 */}
      {windowRect(sa, saCount, 0, 10, ROW_A, colors.request, '0-10')}
      {windowRect(sb, sbCount, 5, 15, ROW_B, PINK, '5-15')}
      {/* Session windows: start tiny, grow with activity */}
      <Rect ref={s1} width={0} height={WIN_H} radius={14} fill={colors.ok + '33'} stroke={colors.ok}
        lineWidth={5} position={[X(1) - 26, ROW_A]} offset={[-1, 0]} opacity={0}>
        <Txt ref={s1Count} fontFamily={FONT} text="0" fill={colors.ok} fontSize={44} fontWeight={800} y={8} />
      </Rect>
      <Rect ref={s2} width={0} height={WIN_H} radius={14} fill={colors.token + '33'} stroke={colors.token}
        lineWidth={5} position={[X(11) - 26, ROW_A]} offset={[-1, 0]} opacity={0}>
        <Txt ref={s2Count} fontFamily={FONT} text="0" fill={colors.token} fontSize={44} fontWeight={800} y={8} />
      </Rect>
      <Txt ref={gap} fontFamily={FONT} text="gap: inactivity" fill={colors.danger} fontSize={30} fontWeight={800}
        position={[X(9), EVENT_Y - 50]} opacity={0} />

      {/* Timeline */}
      <Line ref={axis} points={[[-470, 50], [470, 50]]} stroke={colors.muted} lineWidth={6} lineCap="round"
        opacity={0} />
      {[0, 5, 10, 15].map(t => (
        <Txt ref={ticks} fontFamily={FONT} text={String(t)} fill={colors.muted} fontSize={30} fontWeight={700}
          position={[X(t), 95]} opacity={0} />
      ))}
      {EVENTS.map(t => (
        <Circle ref={evs} size={36} fill={colors.request} position={[X(t), EVENT_Y]} opacity={0} />
      ))}

      <Txt ref={info} fontFamily={FONT} text="" fill={colors.muted} fontSize={42} fontWeight={700}
        y={250} opacity={0} />

      {CHOOSE.map(([a, b], i) => (
        <Rect ref={chips} width={820} height={120} radius={22} fill={colors.panel} stroke={CHOOSE_COLOR[i]}
          lineWidth={5} y={-250 + i * 160} opacity={0}>
          <Txt fontFamily={FONT} text={a} fill={CHOOSE_COLOR[i]} fontSize={46} fontWeight={800} y={-22} />
          <Txt fontFamily={FONT} text={b} fill={colors.text} fontSize={34} fontWeight={700} y={28} />
        </Rect>
      ))}

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Stream Joins" fill={colors.token} fontSize={100} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* say(text: string, color = colors.muted): ThreadGenerator {
    info().text(text);
    info().fill(color);
    yield* info().opacity(1, 0.2);
  }

  function* setMode(text: string, color: string): ThreadGenerator {
    mode().text(text);
    mode().fill(color);
    yield* mode().opacity(1, 0.2);
  }

  // An event is counted by a window: it flashes in that window's color.
  const count = (i: number, color: string) =>
    all(evs[i].fill(color, 0.12), chain(evs[i].scale(1.5, 0.12), evs[i].scale(1, 0.15)));
  const resetEvents = () => all(...evs.map(e => e.fill(colors.request, 0.25)));
  const inRange = (a: number, b: number) => EVENTS.map((t, i) => (t >= a && t < b ? i : -1)).filter(i => i >= 0);

  function* hook(): ThreadGenerator {
    yield* all(axis().opacity(1, 0.4), ...ticks.map(t => t.opacity(1, 0.4)));
    yield* sequence(0.25, ...evs.map(e => e.opacity(1, 0.2)));
    sfx('plink2', 0.5);
    yield* say('events on a never-ending stream');
  }

  function* tumbling(): ThreadGenerator {
    yield* all(info().opacity(0, 0.2), setMode('TUMBLING', colors.request));
    yield* say('size 5, no overlap', colors.request);
    for (let w = 0; w < TUMBLE.length; w++) {
      const [a, b] = TUMBLE[w];
      sfx('whoosh', 0.3);
      yield* tw[w].opacity(1, 0.3);
      let n = 0;
      for (const i of inRange(a, b)) {
        sfx('pop', 0.4);
        n++;
        twCount[w].text(String(n));
        yield* count(i, TUMBLE_COLOR[w]);
        yield* waitFor(0.1);
      }
    }
    yield* waitFor(0.4);
  }

  function* sliding(): ThreadGenerator {
    yield* all(
      info().opacity(0, 0.2),
      ...tw.map(t => t.opacity(0, 0.3)),
      resetEvents(),
    );
    yield* setMode('SLIDING', PINK);
    yield* say('size 10, step 5: windows overlap', PINK);
    sfx('whoosh', 0.3);
    yield* sa().opacity(1, 0.3);
    let n = 0;
    for (const i of inRange(0, 10)) {
      sfx('pop', 0.4);
      n++;
      saCount().text(String(n));
      yield* count(i, colors.request);
      yield* waitFor(0.1);
    }
    sfx('whoosh', 0.3);
    yield* sb().opacity(1, 0.3);
    n = 0;
    for (const i of inRange(5, 15)) {
      sfx(EVENTS[i] < 10 ? 'ding' : 'pop', 0.4); // the first two are counted a second time
      n++;
      sbCount().text(String(n));
      yield* count(i, PINK);
      yield* waitFor(0.1);
    }
    yield* say('events at 6 and 7 count in BOTH windows', PINK);
    yield* waitFor(0.4);
  }

  function* session(): ThreadGenerator {
    yield* all(
      info().opacity(0, 0.2),
      sa().opacity(0, 0.3), sb().opacity(0, 0.3),
      resetEvents(),
    );
    yield* setMode('SESSION', colors.ok);
    yield* say('window ends after a gap of 3', colors.ok);
    // Session 1 grows while events keep arriving.
    s1().opacity(1);
    let n = 0;
    for (const i of inRange(0, 9)) {
      sfx('pop', 0.4);
      n++;
      s1Count().text(String(n));
      yield all(count(i, colors.ok), s1().width(X(EVENTS[i]) - X(1) + 52, 0.3));
      yield* waitFor(0.4);
    }
    // Then nothing happens for a while: the session closes.
    sfx('buzz', 0.4);
    yield* gap().opacity(1, 0.3);
    yield* waitFor(1);
    yield* gap().opacity(0, 0.3);
    // New activity opens session 2.
    s2().opacity(1);
    n = 0;
    for (const i of inRange(10, 20)) {
      sfx('pop', 0.4);
      n++;
      s2Count().text(String(n));
      yield all(count(i, colors.token), s2().width(X(EVENTS[i]) - X(11) + 52, 0.3));
      yield* waitFor(0.4);
    }
  }

  function* chooseBeat(): ThreadGenerator {
    yield* all(
      info().opacity(0, 0.2), mode().opacity(0, 0.3), axis().opacity(0, 0.4), gap().opacity(0, 0.2),
      ...ticks.map(t => t.opacity(0, 0.4)), ...evs.map(e => e.opacity(0, 0.4)),
      s1().opacity(0, 0.4), s2().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < CHOOSE.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* chips[i].opacity(1, 0.3);
      yield* waitFor([1.4, 1.6, 0][i]);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, tumbling, sliding, session, choose: chooseBeat, close,
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
