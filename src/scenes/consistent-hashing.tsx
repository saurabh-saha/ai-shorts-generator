import {Audio, Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  easeInOutCubic,
  map,
  range,
  sequence,
  tween,
  waitFor,
} from '@revideo/core';
import script from '../../data/consistent-hashing.json';
import {FONT, makeKit} from '../components/kit';
import {colors} from '../theme';

// One color per server, shared by the row view and the ring view.
const PALETTE = [colors.request, colors.ok, colors.token, '#f472b6'];
const NAMES = ['A', 'B', 'C', 'D'];

// Row view (modulo hashing).
const KEY_COUNT = 12;
const CHIP_Y = [-330, -240];
const SERVER_ROW_Y = 200;
const ROW_X3 = [-300, 0, 300];
const ROW_X4 = [-390, -130, 130, 390];

// Ring view.
const CX = 0;
const CY = 80;
const R = 330;
const pos = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + R * Math.sin(a), CY - R * Math.cos(a)];
};

const KEY_ANGLES = [10, 45, 70, 100, 130, 160, 195, 225, 250, 285, 320, 350];

// Ring members: three servers, one added later (D), and virtual nodes of each.
type Node = {name: string; color: number; angle: number; virtual: boolean};
const NODES: Node[] = [
  {name: 'A', color: 0, angle: 20, virtual: false},
  {name: 'B', color: 1, angle: 140, virtual: false},
  {name: 'C', color: 2, angle: 260, virtual: false},
  {name: 'D', color: 3, angle: 85, virtual: false},
  {name: 'A', color: 0, angle: 215, virtual: true},
  {name: 'B', color: 1, angle: 300, virtual: true},
  {name: 'C', color: 2, angle: 60, virtual: true},
  {name: 'D', color: 3, angle: 330, virtual: true},
];

export default makeScene2D('consistent-hashing', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const ring = createRef<Circle>();
  const chips = createRefArray<Rect>();
  const serverBoxes = createRefArray<Rect>();
  const nodeDots = createRefArray<Circle>();
  const keyDots = createRefArray<Circle>();
  const {sfx, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      {/* Row view: keys as chips, servers as boxes. */}
      {range(KEY_COUNT).map(k => (
        <Rect ref={chips} width={96} height={64} radius={14} fill={PALETTE[k % 3]} opacity={0}
          position={[((k % 6) - 2.5) * 130, CHIP_Y[Math.floor(k / 6)]]}>
          <Txt fontFamily={FONT} text={String(k)} fill={colors.bg} fontSize={36} fontWeight={800} />
        </Rect>
      ))}
      {range(4).map(i => (
        <Rect ref={serverBoxes} width={220} height={130} radius={22} fill={colors.panel}
          stroke={PALETTE[i]} lineWidth={6} position={[i < 3 ? ROW_X3[i] : ROW_X4[3], SERVER_ROW_Y]}
          opacity={i < 3 ? 1 : 0}>
          <Txt fontFamily={FONT} text={`Server ${i}`} fill={colors.text} fontSize={38} fontWeight={700} />
        </Rect>
      ))}

      {/* Ring view. */}
      <Circle ref={ring} size={R * 2} position={[CX, CY]} stroke={colors.empty} lineWidth={8} opacity={0} />
      {KEY_ANGLES.map(a => (
        <Circle ref={keyDots} size={30} fill={colors.muted} position={pos(a)} opacity={0} />
      ))}
      {NODES.map(n => (
        <Circle ref={nodeDots} size={n.virtual ? 54 : 78} fill={PALETTE[n.color]} position={pos(n.angle)} opacity={0}>
          <Txt fontFamily={FONT} text={n.name} fill={colors.bg} fontSize={n.virtual ? 28 : 42} fontWeight={800} />
        </Circle>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={50} fontWeight={800}
        y={575} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="CDNs" fill={colors.token} fontSize={130} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  // ---- Ring logic: a key belongs to the first active node clockwise from it. ----
  const active = NODES.map(() => false);
  const ownerOf = (angle: number): number => {
    let best = -1;
    let bestDist = 1e9;
    NODES.forEach((n, i) => {
      if (!active[i]) return;
      const d = (n.angle - angle + 360) % 360; // clockwise distance
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };
  let keyOwner: number[] = [];

  // Recolor every key by its owner and pulse the ones that changed owner.
  function* recolor(): ThreadGenerator {
    const next = KEY_ANGLES.map(a => NODES[ownerOf(a)].color);
    const changed = next.map((c, i) => keyOwner.length > 0 && c !== keyOwner[i]);
    keyOwner = next;
    yield* all(
      ...keyDots.map((k, i) => k.fill(PALETTE[next[i]], 0.4)),
      ...keyDots.map((k, i) =>
        changed[i] ? chain(k.scale(2, 0.2), k.scale(1, 0.25)) : waitFor(0),
      ),
    );
  }

  // A white marker travels clockwise from a key to its server.
  function* travel(keyIdx: number): ThreadGenerator {
    const from = KEY_ANGLES[keyIdx];
    const ni = ownerOf(from);
    let to = NODES[ni].angle;
    if (to < from) to += 360;
    const m = createRef<Circle>();
    view.add(<Circle ref={m} size={26} fill={colors.text} position={pos(from)} />);
    yield* keyDots[keyIdx].scale(1.8, 0.25);
    yield* tween(1.1, v => m().position(pos(map(from, to, easeInOutCubic(v)))));
    sfx('pop', 0.5);
    yield* all(chain(nodeDots[ni].scale(1.25, 0.15), nodeDots[ni].scale(1, 0.2)), keyDots[keyIdx].scale(1, 0.25));
    m().remove();
  }

  // ---- Beats ----
  function* hook(): ThreadGenerator {
    yield* sequence(0.1, ...chips.map(c => c.opacity(1, 0.3)));
    yield* showBadge('server = key % 3', colors.token);
  }

  function* problem(): ThreadGenerator {
    // A fourth server joins: the key -> server mapping is recomputed with % 4.
    sfx('whoosh', 0.5);
    yield* all(
      ...[0, 1, 2].map(i => serverBoxes[i].position([ROW_X4[i], SERVER_ROW_Y], 0.6)),
      serverBoxes[3].opacity(1, 0.6),
    );
    yield* showBadge('server = key % 4', colors.token);
    yield* waitFor(0.8);
    let moved = 0;
    const pulses = chips.map((c, k) => {
      const changed = k % 3 !== k % 4;
      if (changed) moved++;
      return all(c.fill(PALETTE[k % 4], 0.5), changed ? chain(c.scale(1.35, 0.25), c.scale(1, 0.25)) : waitFor(0));
    });
    sfx('alarm', 0.5);
    yield* all(...pulses);
    yield* showBadge(`${moved} OF ${KEY_COUNT} KEYS MOVED`, colors.danger);
  }

  function* concept(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* all(
      badge().opacity(0, 0.4),
      ...chips.map(c => c.opacity(0, 0.4)),
      ...serverBoxes.map(s => s.opacity(0, 0.4)),
    );
    // Servers A, B, C go on the ring, then the keys.
    yield* ring().opacity(1, 0.4);
    [0, 1, 2].forEach(i => (active[i] = true));
    yield* all(...[0, 1, 2].map(i => nodeDots[i].opacity(1, 0.4)));
    yield* all(...keyDots.map(k => k.opacity(1, 0.4)));
    yield* recolor();
    sfx('plink2', 0.5);
  }

  function* lookup(): ThreadGenerator {
    yield showBadge('FIRST SERVER CLOCKWISE', colors.token);
    for (const k of [1, 9, 5]) {
      yield* travel(k);
      yield* waitFor(0.5);
    }
  }

  function* add(): ThreadGenerator {
    yield* showBadge('ADD SERVER D', colors.ok);
    sfx('whoosh', 0.5);
    active[3] = true;
    yield* nodeDots[3].opacity(1, 0.5);
    sfx('plink4', 0.5);
    const before = keyOwner.slice();
    yield* recolor();
    const moved = keyOwner.filter((c, i) => c !== before[i]).length;
    yield* showBadge(`ONLY ${moved} OF ${KEY_COUNT} KEYS MOVED`, colors.ok);
  }

  function* vnodes(): ThreadGenerator {
    yield* showBadge('VIRTUAL NODES: EVEN LOAD', colors.token);
    for (let i = 4; i < NODES.length; i++) {
      active[i] = true;
      sfx(`plink${i - 4}`, 0.4);
      yield* nodeDots[i].opacity(1, 0.3);
    }
    yield* recolor();
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, problem, concept, lookup, add, vnodes, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={1} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
