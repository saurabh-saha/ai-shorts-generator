import {Audio, Line, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  createRef,
  createRefArray,
  sequence,
  waitFor,
} from '@revideo/core';
import script from '../../data/cap-theorem.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -560;
const NODE_Y = 90;
const X = [-300, 300];
const CAP = ['Consistency', 'Availability', 'Partition\ntolerance'];

export default makeScene2D('cap-theorem', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const link = createRef<Line>();
  const cut = createRef<Txt>();
  const nodes = createRefArray<Rect>();
  const vals = createRefArray<Txt>();
  const chips = createRefArray<Rect>();
  const readerTxt = createRef<Txt>();
  const bank = createRef<Rect>();
  const feed = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={300} height={120} radius={22} fill={colors.panel} position={[X[0], CLIENT_Y]}>
        <Txt fontFamily={FONT} text="Writer" fill={colors.muted} fontSize={38} />
      </Rect>
      <Rect width={300} height={140} radius={22} fill={colors.panel} position={[X[1], CLIENT_Y]}>
        <Txt fontFamily={FONT} text="Reader" fill={colors.muted} fontSize={38} y={-22} />
        <Txt ref={readerTxt} fontFamily={FONT} text="" fill={colors.token} fontSize={32} fontWeight={700} y={30} />
      </Rect>

      <Line ref={link} points={[[X[0] + 160, NODE_Y], [X[1] - 160, NODE_Y]]} stroke={colors.ok}
        lineWidth={8} lineCap="round" />
      <Txt ref={cut} fontFamily={FONT} text="X" fill={colors.danger} fontSize={90} fontWeight={800}
        position={[0, NODE_Y]} opacity={0} />

      {X.map((x, i) => (
        <Rect ref={nodes} width={300} height={200} radius={26} fill={colors.panel} stroke={colors.request}
          lineWidth={6} position={[x, NODE_Y]}>
          <Txt fontFamily={FONT} text={`Node ${i === 0 ? 'A' : 'B'}`} fill={colors.request} fontSize={40}
            fontWeight={800} y={-40} />
          <Txt ref={vals} fontFamily={FONT} text="x = 1" fill={colors.token} fontSize={56} fontWeight={800} y={28} />
        </Rect>
      ))}

      {CAP.map((name, i) => (
        <Rect ref={chips} width={300} height={140} radius={22} fill={colors.panel} stroke={colors.empty}
          lineWidth={6} position={[(i - 1) * 330, 440]} opacity={0}>
          <Txt fontFamily={FONT} text={name} fill={colors.text} fontSize={38} fontWeight={800} textAlign="center" />
        </Rect>
      ))}

      <Rect ref={bank} width={450} height={140} radius={22} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} position={[-245, 440]} opacity={0}>
        <Txt fontFamily={FONT} text="BANK" fill={colors.text} fontSize={38} fontWeight={800} y={-22} />
        <Txt fontFamily={FONT} text="chooses consistency" fill={colors.ok} fontSize={30} fontWeight={700} y={30} />
      </Rect>
      <Rect ref={feed} width={450} height={140} radius={22} fill={colors.panel} stroke={colors.token}
        lineWidth={5} position={[245, 440]} opacity={0}>
        <Txt fontFamily={FONT} text="SOCIAL FEED" fill={colors.text} fontSize={38} fontWeight={800} y={-22} />
        <Txt fontFamily={FONT} text="chooses availability" fill={colors.token} fontSize={30} fontWeight={700} y={30} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={48} fontWeight={800}
        y={290} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="DB Indexes" fill={colors.token} fontSize={112} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const writerPt: P = [X[0], CLIENT_Y + 60];
  const readerPt: P = [X[1], CLIENT_Y + 70];
  const nodeTop = (i: number): P => [X[i], NODE_Y - 105];

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function* hook(): ThreadGenerator {
    yield* showBadge('NODES KEEP COPIES IN SYNC', colors.ok);
    for (let i = 0; i < 2; i++) {
      sfx('blip', 0.3);
      yield* dot([[X[0] + 160, NODE_Y], [X[1] - 160, NODE_Y]], colors.ok, 0.6);
      sfx('plink0', 0.4);
      yield* dot([[X[1] - 160, NODE_Y], [X[0] + 160, NODE_Y]], colors.ok, 0.6);
      sfx('plink1', 0.4);
    }
    yield* waitFor(0.4);
    // The link between the nodes breaks.
    sfx('alarm', 0.5);
    yield* all(link().stroke(colors.danger, 0.3), link().opacity(0.4, 0.3), cut().opacity(1, 0.3));
    yield* showBadge('NETWORK PARTITION', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('whoosh', 0.5);
    yield* sequence(0.5, ...chips.map(c => c.opacity(1, 0.4)));
    yield* showBadge('PICK TWO OF THREE', colors.token);
    yield* waitFor(2);
    // Partitions happen, so that one is not a choice.
    sfx('buzz', 0.4);
    yield* chips[2].stroke(colors.danger, 0.4);
    yield* showBadge('NETWORKS FAIL: P IS A MUST', colors.danger);
  }

  function* setup(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), ...chips.map(c => c.opacity(0, 0.4)));
    sfx('blip', 0.3);
    yield* dot([writerPt, nodeTop(0)], colors.request, 0.5);
    vals[0].text('x = 2');
    vals[0].fill(colors.ok);
    sfx('pop', 0.5);
    yield* waitFor(0.6);
    // Replication toward B is blocked at the broken link.
    sfx('blip', 0.3);
    yield* dot([[X[0] + 160, NODE_Y], [-40, NODE_Y]], colors.ok, 0.6);
    sfx('buzz', 0.5);
    yield* showBadge('B MISSED THE UPDATE', colors.danger);
  }

  function* cp(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('blip', 0.3);
    yield* dot([readerPt, nodeTop(1)], colors.request, 0.5);
    // B refuses rather than answer with stale data.
    vals[1].text('error 503');
    vals[1].fill(colors.text);
    yield* nodes[1].fill('#7f1d1d', 0.3);
    sfx('buzz', 0.5);
    yield* dot([nodeTop(1), readerPt], colors.danger, 0.5);
    readerTxt().text('no answer');
    readerTxt().fill(colors.danger);
    yield* showBadge('CP: CONSISTENT, NOT AVAILABLE', colors.token);
  }

  function* ap(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), nodes[1].fill(colors.panel, 0.3));
    vals[1].text('x = 1');
    vals[1].fill(colors.token);
    readerTxt().text('');
    sfx('blip', 0.3);
    yield* dot([readerPt, nodeTop(1)], colors.request, 0.5);
    // B answers with what it has, which is out of date.
    sfx('ding', 0.5);
    yield* dot([nodeTop(1), readerPt], colors.token, 0.5);
    readerTxt().text('got x = 1 (stale)');
    readerTxt().fill(colors.token);
    yield* showBadge('AP: AVAILABLE, MAYBE STALE', colors.token);
  }

  function* choose(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('whoosh', 0.5);
    yield* bank().opacity(1, 0.5);
    sfx('plink2', 0.5);
    yield* waitFor(1);
    yield* feed().opacity(1, 0.5);
    sfx('plink3', 0.5);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, concept, setup, cp, ap, choose, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
