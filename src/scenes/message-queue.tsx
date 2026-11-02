import {Audio, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  linear,
  range,
  waitFor,
} from '@revideo/core';
import script from '../../data/message-queue.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const PRODUCER_Y = -560;
const QUEUE_Y = -120;
const WORKER_Y = 430;
const WORKER_X = [-330, 0, 330];
const SLOTS = 6;
const SLOT_GAP = 125;
const BAR_W = 190;

const slotX = (i: number) => (i - (SLOTS - 1) / 2) * SLOT_GAP;

export default makeScene2D('message-queue', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const queue = createRef<Rect>();
  const depth = createRef<Txt>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const slots = createRefArray<Rect>();
  const ids = createRefArray<Txt>();
  const boxes = createRefArray<Rect>();
  const labels = createRefArray<Txt>();
  const bars = createRefArray<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  // Queue contents (message ids, front first).
  const q: number[] = [];
  let nextId = 1;

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={230} height={110} radius={20} fill={colors.panel} y={PRODUCER_Y}>
        <Txt fontFamily={FONT} text="Producer" fill={colors.muted} fontSize={36} />
      </Rect>

      <Rect ref={queue} width={820} height={200} radius={28} fill={colors.panel} stroke={colors.token}
        lineWidth={6} y={QUEUE_Y} opacity={0} scale={0.85}>
        <Txt ref={depth} fontFamily={FONT} text="QUEUE" fill={colors.token} fontSize={36} fontWeight={800} y={-65} />
        {range(SLOTS).map(i => (
          <Rect ref={slots} width={104} height={74} radius={12} fill={colors.empty} x={slotX(i)} y={25}>
            <Txt ref={ids} fontFamily={FONT} text="" fill={colors.bg} fontSize={40} fontWeight={800} />
          </Rect>
        ))}
      </Rect>

      {WORKER_X.map((x, i) => (
        <Rect ref={boxes} width={290} height={200} radius={24} fill={colors.panel}
          position={[x, WORKER_Y]} opacity={i === 1 ? 1 : 0}>
          <Txt ref={labels} fontFamily={FONT} text={i === 1 ? 'Service' : `Worker ${i === 0 ? 2 : 3}`}
            fill={colors.text} fontSize={42} fontWeight={700} y={-25} />
          <Rect width={BAR_W} height={18} radius={9} fill={colors.empty} y={50} />
          <Rect ref={bars} width={0} height={18} radius={9} fill={colors.ok} x={-BAR_W / 2} y={50}
            offset={[-1, 0]} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={50} fontWeight={800}
        y={190} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="DB Sharding" fill={colors.token} fontSize={110} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const producerPt: P = [0, PRODUCER_Y + 60];
  const workerTop = (wi: number): P => [WORKER_X[wi], WORKER_Y - 105];
  const queueFront: P = [slotX(0), QUEUE_Y + 105];

  function setSlots() {
    for (let i = 0; i < SLOTS; i++) {
      const has = i < q.length;
      slots[i].fill(has ? colors.token : colors.empty);
      ids[i].text(has ? String(q[i]) : '');
    }
    depth().text(q.length ? `QUEUE  ·  ${q.length} waiting` : 'QUEUE  ·  empty');
  }

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  // Producer drops a message into the queue and does not wait for it to be processed.
  function* enqueue(): ThreadGenerator {
    const n = q.length;
    if (n >= SLOTS) return;
    sfx('blip', 0.3);
    yield* dot([producerPt, [slotX(n), QUEUE_Y - 105]], colors.request, 0.35);
    q.push(nextId++);
    setSlots();
    sfx(`plink${n % 5}`, 0.45);
  }

  // A worker takes the front message, then works on it.
  function* pull(wi: number): ThreadGenerator {
    if (!q.length) return;
    q.shift();
    setSlots();
    sfx('pop', 0.4);
    yield* dot([queueFront, workerTop(wi)], colors.token, 0.5);
    yield* bars[wi].width(BAR_W, 1.2, linear);
    sfx('ding', 0.4);
    yield* all(
      bars[wi].width(0, 0.15),
      chain(boxes[wi].fill(colors.ok, 0.1), boxes[wi].fill(colors.panel, 0.3)),
    );
  }

  // No queue yet: requests go straight to the one service.
  const direct = () => {
    sfx('blip', 0.25);
    return dot([producerPt, workerTop(1)], colors.request, 0.7);
  };

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 12; i++) {
      yield direct();
      yield* waitFor(0.15);
    }
    sfx('alarm', 0.5);
    yield* boxes[1].fill(colors.danger, 0.4);
  }

  function* problem(): ThreadGenerator {
    yield showBadge('OVERLOADED: REQUESTS LOST', colors.danger);
    sfx('alarm', 0.4);
    for (let i = 0; i < 8; i++) {
      yield direct();
      yield* waitFor(0.25);
    }
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.3), boxes[1].fill(colors.panel, 0.5));
    sfx('whoosh', 0.6);
    labels[1].text('Worker 1');
    setSlots();
    yield* all(queue().opacity(1, 0.6), queue().scale(1, 0.6));
  }

  function* produce(): ThreadGenerator {
    yield showBadge('PRODUCER NEVER WAITS', colors.ok);
    for (let i = 0; i < SLOTS; i++) {
      yield enqueue();
      yield* waitFor(0.5);
    }
  }

  function* consume(): ThreadGenerator {
    yield* showBadge('PULLS AT ITS OWN PACE', colors.token);
    yield* pull(1);
    yield* pull(1);
    // Scale out: more consumers share the queue.
    sfx('whoosh', 0.6);
    yield* showBadge('ADD MORE CONSUMERS', colors.ok);
    yield* all(boxes[0].opacity(1, 0.5), boxes[2].opacity(1, 0.5));
    yield* all(pull(0), chain(waitFor(0.15), pull(1)), chain(waitFor(0.3), pull(2)));
    yield* pull(1);
  }

  function* retry(): ThreadGenerator {
    yield badge().opacity(0, 0.2);
    yield enqueue();
    yield* waitFor(0.5);
    yield enqueue();
    yield* waitFor(0.5);
    // Worker 3 takes a message and crashes while working on it.
    const held = q.shift()!;
    setSlots();
    yield* dot([queueFront, workerTop(2)], colors.token, 0.5);
    yield bars[2].width(BAR_W * 0.5, 0.6, linear);
    yield* waitFor(0.6);
    sfx('alarm', 0.5);
    labels[2].text('CRASHED');
    yield* boxes[2].fill(colors.danger, 0.3);
    yield bars[2].width(0, 0.2);
    // The message goes back to the front of the queue.
    yield* dot([workerTop(2), queueFront], colors.token, 0.6);
    q.unshift(held);
    setSlots();
    sfx('plink0', 0.5);
    yield* showBadge('NOT LOST: RETRIED', colors.token);
    yield* pull(0);
    yield* pull(1);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, problem, concept, produce, consume, retry, close,
  };

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
