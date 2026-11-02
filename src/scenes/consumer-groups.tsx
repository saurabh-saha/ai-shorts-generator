import {Audio, Node, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/consumer-groups.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const PART_Y = -440;
const PART_X = [-330, 0, 330];
const G1_X = [-345, -115, 115, 345];
const G2_X = [-330, 0, 330];
const OWNER_COLOR = [colors.request, colors.ok, colors.token, '#f472b6'];
const DEAD_FILL = '#7f1d1d';

export default makeScene2D('consumer-groups', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const parts = createRefArray<Rect>();
  const g1 = createRef<Node>();
  const g1Label = createRef<Txt>();
  const g1Cons = createRefArray<Rect>();
  const g1Txt = createRefArray<Txt>();
  const g2 = createRef<Node>();
  const g2Cons = createRefArray<Rect>();
  const g2Txt = createRefArray<Txt>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);
  let owners = [0, 0, 0]; // which consumer of group 1 owns each partition

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      {PART_X.map((x, i) => (
        <Rect ref={parts} width={280} height={130} radius={22} fill={colors.panel} stroke={OWNER_COLOR[0]}
          lineWidth={6} position={[x, PART_Y]} opacity={0}>
          <Txt fontFamily={FONT} text={`Partition ${i}`} fill={colors.text} fontSize={36} fontWeight={800} y={-18} />
          <Txt fontFamily={FONT} text="topic: orders" fill={colors.muted} fontSize={26} y={28} />
        </Rect>
      ))}

      <Node ref={g1} y={120}>
        <Txt ref={g1Label} fontFamily={FONT} text="consumer group: billing" fill={colors.muted} fontSize={34}
          fontWeight={700} y={-110} opacity={0} />
        {G1_X.map((x, i) => (
          <Rect ref={g1Cons} width={208} height={130} radius={22} fill={colors.panel} stroke={OWNER_COLOR[i]}
            lineWidth={6} position={[x, 0]} opacity={0}>
            <Txt fontFamily={FONT} text={`C${i + 1}`} fill={OWNER_COLOR[i]} fontSize={40} fontWeight={800} y={-24} />
            <Txt ref={g1Txt} fontFamily={FONT} text="" fill={colors.muted} fontSize={25} fontWeight={700} y={28} />
          </Rect>
        ))}
      </Node>

      <Node ref={g2} y={420} opacity={0}>
        <Txt fontFamily={FONT} text="consumer group: analytics" fill={colors.muted} fontSize={34}
          fontWeight={700} y={-110} />
        {G2_X.map((x, i) => (
          <Rect ref={g2Cons} width={270} height={130} radius={22} fill={colors.panel} stroke={colors.request}
            lineWidth={6} position={[x, 0]}>
            <Txt fontFamily={FONT} text={`D${i + 1}`} fill={colors.request} fontSize={40} fontWeight={800} y={-24} />
            <Txt ref={g2Txt} fontFamily={FONT} text={`reads: P${i}`} fill={colors.muted} fontSize={28} fontWeight={700} y={28} />
          </Rect>
        ))}
      </Node>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={44} fontWeight={800}
        y={570} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Delivery Guarantees" fill={colors.token} fontSize={76} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const partBottom = (p: number): P => [PART_X[p], PART_Y + 75];
  const g1Top = (c: number): P => [G1_X[c], g1().y() - 70];
  const g2Top = (c: number): P => [G2_X[c], g2().y() - 70];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect, c: string) => chain(r.fill(c, 0.1), r.fill(colors.panel, 0.25));

  // Show who reads what: partitions take their owner's color, consumers list their partitions.
  function applyOwners(next: number[], dead: number[] = []) {
    owners = next;
    parts.forEach((p, i) => p.stroke(OWNER_COLOR[owners[i]]));
    G1_X.forEach((_, c) => {
      if (dead.includes(c)) return;
      const mine = owners.map((o, p) => (o === c ? `P${p}` : '')).filter(Boolean);
      g1Txt[c].text(mine.length ? `reads: ${mine.join(',')}` : 'idle');
      g1Txt[c].fill(mine.length ? colors.text : colors.muted);
    });
  }

  // One event travels from each partition to the consumer that owns it.
  function* flowG1(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* all(...[0, 1, 2].map(p => dot([partBottom(p), g1Top(owners[p])], OWNER_COLOR[owners[p]], 0.5)));
    sfx('pop', 0.4);
    yield* all(...[...new Set(owners)].map(c => flash(g1Cons[c], OWNER_COLOR[c])));
  }

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* all(...parts.map(p => p.opacity(1, 0.4)), g1Cons[0].opacity(1, 0.4));
    applyOwners([0, 0, 0]);
    for (let i = 0; i < 4; i++) {
      yield* flowG1();
      yield* waitFor(0.1);
    }
    sfx('alarm', 0.4);
    yield* g1Cons[0].fill(DEAD_FILL, 0.4);
    yield* showBadge('ONE CONSUMER: TOO SLOW', colors.danger);
  }

  function* group(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), g1Cons[0].fill(colors.panel, 0.4), g1Label().opacity(1, 0.4));
    yield* waitFor(0.4);
    // C2 joins: the group rebalances.
    sfx('whoosh', 0.5);
    yield* g1Cons[1].opacity(1, 0.4);
    yield* showBadge('REBALANCE', colors.token);
    applyOwners([0, 0, 1]);
    yield* flowG1();
    yield* waitFor(0.5);
    // C3 joins: one partition each.
    sfx('whoosh', 0.5);
    yield* g1Cons[2].opacity(1, 0.4);
    applyOwners([0, 1, 2]);
    yield* flowG1();
    yield* showBadge('ONE PARTITION PER CONSUMER', colors.ok);
  }

  function* scale(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('whoosh', 0.5);
    yield* g1Cons[3].opacity(1, 0.4);
    applyOwners([0, 1, 2]);
    yield* showBadge('4 CONSUMERS, 3 PARTITIONS: C4 IS IDLE', colors.token);
    for (let i = 0; i < 2; i++) {
      yield* flowG1();
      yield* waitFor(0.4);
    }
  }

  function* rebalance(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // C2 crashes.
    sfx('alarm', 0.5);
    g1Txt[1].text('DOWN');
    g1Txt[1].fill(colors.text);
    yield* all(g1Cons[1].fill(DEAD_FILL, 0.3), g1Cons[1].stroke(colors.danger, 0.3));
    yield* showBadge('CONSUMER C2 CRASHED', colors.danger);
    yield* waitFor(1.2);
    // The idle C4 picks up its partition and resumes from the committed offset.
    sfx('whoosh', 0.5);
    applyOwners([0, 3, 2], [1]);
    yield* badge().opacity(0, 0.15);
    yield* showBadge('P1 -> C4: RESUMES FROM COMMITTED OFFSET', colors.token);
    yield* waitFor(0.4);
    yield* flowG1();
  }

  function* groupsBeat(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // Heal the group so the second group's story is clear.
    g1Txt[1].text('reads: P1');
    applyOwners([0, 1, 2]);
    yield* all(
      g1Cons[1].fill(colors.panel, 0.3), g1Cons[1].stroke(OWNER_COLOR[1], 0.3),
      g1Cons[3].opacity(0, 0.3),
      g1().y(-30, 0.6),
    );
    sfx('whoosh', 0.5);
    g2().y(280);
    yield* g2().opacity(1, 0.5);
    yield* showBadge('EACH GROUP GETS EVERY EVENT', colors.ok);
    for (let i = 0; i < 2; i++) {
      sfx('blip', 0.3);
      yield* all(
        ...[0, 1, 2].map(p => dot([partBottom(p), g1Top(owners[p])], OWNER_COLOR[owners[p]], 0.6)),
        ...[0, 1, 2].map(p => dot([partBottom(p), g2Top(p)], colors.request, 0.8)),
      );
      sfx('pop', 0.4);
      yield* waitFor(0.6);
    }
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, group, scale, rebalance, groups: groupsBeat, close,
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
