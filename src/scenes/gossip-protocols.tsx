import {Audio, Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
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
import script from '../../data/gossip-protocols.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const N = 8;
const CX = 0;
const CY = 40;
const R = 340;
const INFORMED_FILL = '#3b3210';
const DEAD_FILL = '#7f1d1d';
const PROPS = ['No central coordinator', 'Survives node failures', 'Scales to thousands', 'Eventually consistent'];
const USED = ['Cassandra', 'Consul', 'Many more...'];

const pos = (i: number): P => {
  const a = ((i * 360) / N) * (Math.PI / 180);
  return [CX + R * Math.sin(a), CY - R * Math.cos(a)];
};

export default makeScene2D('gossip-protocols', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const count = createRef<Txt>();
  const round = createRef<Txt>();
  const nodes = createRefArray<Circle>();
  const props = createRefArray<Rect>();
  const used = createRefArray<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  const informed = new Set<number>([0]);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={88} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Txt ref={count} fontFamily={FONT} text="informed: 1 / 8" fill={colors.token} fontSize={52} fontWeight={800}
        position={[CX, CY - 20]} opacity={0} />
      <Txt ref={round} fontFamily={FONT} text="" fill={colors.muted} fontSize={40} fontWeight={700}
        position={[CX, CY + 45]} opacity={0} />

      {range(N).map(i => (
        <Circle ref={nodes} size={130} fill={i === 0 ? INFORMED_FILL : colors.panel}
          stroke={i === 0 ? colors.token : colors.ok} lineWidth={7} position={pos(i)} opacity={0}>
          <Txt fontFamily={FONT} text={`N${i + 1}`} fill={colors.text} fontSize={38} fontWeight={800} />
        </Circle>
      ))}

      {PROPS.map((t, i) => (
        <Rect ref={props} width={820} height={90} radius={20} fill={colors.panel}
          stroke={i === 3 ? colors.token : colors.ok} lineWidth={5} y={-200 + i * 120} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={i === 3 ? colors.token : colors.ok} fontSize={44} fontWeight={800} />
        </Rect>
      ))}
      {USED.map((t, i) => (
        <Rect ref={used} width={620} height={100} radius={20} fill={colors.panel} stroke={colors.request}
          lineWidth={5} y={-150 + i * 140} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.request} fontSize={48} fontWeight={800} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={560} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Two-Phase Commit" fill={colors.token} fontSize={84} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function updateCount() {
    count().text(`informed: ${informed.size} / ${N}`);
  }

  const flash = (i: number) => chain(nodes[i].scale(1.2, 0.12), nodes[i].scale(1, 0.18));
  const msg = (a: number, b: number, color: string, t = 0.7) => dot([pos(a), pos(b)], color, t);

  // A node learns the news.
  function* inform(i: number): ThreadGenerator {
    informed.add(i);
    updateCount();
    sfx('plink' + (i % 5), 0.4);
    yield* all(nodes[i].fill(INFORMED_FILL, 0.2), nodes[i].stroke(colors.token, 0.2), flash(i));
  }

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* sequence(0.08, ...nodes.map(n => n.opacity(1, 0.3)));
    yield* showBadge('N1 HAS NEWS', colors.token);
  }

  function* central(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // N1 tries to tell every other node itself.
    sfx('blip', 0.35);
    yield* all(...range(N - 1).map(k => msg(0, k + 1, colors.request, 1.0)));
    yield* showBadge('BOTTLENECK', colors.danger);
    yield* waitFor(0.8);
    sfx('alarm', 0.5);
    yield* all(nodes[0].fill(DEAD_FILL, 0.3), nodes[0].stroke(colors.danger, 0.3));
    yield* showBadge('SINGLE POINT OF FAILURE', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* all(nodes[0].fill(INFORMED_FILL, 0.3), nodes[0].stroke(colors.token, 0.3));
    yield* showBadge('PICK A RANDOM PEER', colors.request);
    const pairs: [number, number][] = [[0, 2], [3, 6], [5, 1], [7, 4], [2, 6], [1, 3]];
    for (const [a, b] of pairs) {
      sfx('blip', 0.3);
      yield* msg(a, b, colors.request, 0.5);
      yield* flash(b);
    }
  }

  function* spread(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    updateCount();
    yield* all(count().opacity(1, 0.3), round().opacity(1, 0.3));
    const rounds: [number, number][][] = [
      [[0, 3]],
      [[0, 5], [3, 6]],
      [[0, 1], [3, 2], [5, 7], [6, 4]],
    ];
    for (let r = 0; r < rounds.length; r++) {
      round().text(`round ${r + 1}`);
      sfx('blip', 0.35);
      yield* all(...rounds[r].map(([a, b]) => msg(a, b, colors.token, 0.7)));
      yield* all(...rounds[r].map(([, b]) => inform(b)));
      yield* waitFor(0.6);
    }
    sfx('ding', 0.6);
    yield* showBadge('EVERYONE KNOWS', colors.ok);
  }

  function* propsBeat(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2),
      count().opacity(0, 0.3),
      round().opacity(0, 0.3),
      ...nodes.map(n => n.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < PROPS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* props[i].opacity(1, 0.3);
      yield* waitFor(0.5);
    }
  }

  function* usedBeat(): ThreadGenerator {
    yield* all(...props.map(p => p.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    for (let i = 0; i < USED.length; i++) {
      sfx(`plink${i + 1}`, 0.5);
      yield* used[i].opacity(1, 0.3);
      yield* waitFor(0.4);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, central, concept, spread, props: propsBeat, used: usedBeat, close,
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
