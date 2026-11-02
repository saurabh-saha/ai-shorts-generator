import {Audio, Line, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/replication.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const CLIENT_Y = -560;
const LEADER: P = [0, -120];
const FOLLOWER_X = [-300, 300];
const FOLLOWER_Y = 280;

export default makeScene2D('replication', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const readerTxt = createRef<Txt>();
  const leader = createRef<Rect>();
  const leaderLabel = createRef<Txt>();
  const leaderVal = createRef<Txt>();
  const followers = createRefArray<Rect>();
  const fLabels = createRefArray<Txt>();
  const fVals = createRefArray<Txt>();
  const links = createRefArray<Line>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={96} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Rect width={300} height={120} radius={22} fill={colors.panel} position={[-300, CLIENT_Y]}>
        <Txt fontFamily={FONT} text="Writer" fill={colors.muted} fontSize={38} />
      </Rect>
      <Rect width={300} height={140} radius={22} fill={colors.panel} position={[300, CLIENT_Y]}>
        <Txt fontFamily={FONT} text="Reader" fill={colors.muted} fontSize={38} y={-22} />
        <Txt ref={readerTxt} fontFamily={FONT} text="" fill={colors.token} fontSize={28} fontWeight={700} y={30} />
      </Rect>

      {FOLLOWER_X.map(x => (
        <Line ref={links} points={[[0, LEADER[1] + 100], [x, FOLLOWER_Y - 100]]} stroke={colors.empty}
          lineWidth={6} opacity={0} />
      ))}

      <Rect ref={leader} width={360} height={200} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} position={LEADER}>
        <Txt ref={leaderLabel} fontFamily={FONT} text="Database" fill={colors.request} fontSize={42}
          fontWeight={800} y={-40} />
        <Txt ref={leaderVal} fontFamily={FONT} text="x = 1" fill={colors.token} fontSize={56} fontWeight={800} y={28} />
      </Rect>

      {FOLLOWER_X.map((x, i) => (
        <Rect ref={followers} width={340} height={200} radius={26} fill={colors.panel} stroke={colors.ok}
          lineWidth={6} position={[x, FOLLOWER_Y]} opacity={0} scale={0.85}>
          <Txt ref={fLabels} fontFamily={FONT} text={`Follower ${i + 1}`} fill={colors.ok} fontSize={38}
            fontWeight={800} y={-40} />
          <Txt ref={fVals} fontFamily={FONT} text="x = 1" fill={colors.token} fontSize={56} fontWeight={800} y={28} />
        </Rect>
      ))}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={46} fontWeight={800}
        y={80} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Leader Election" fill={colors.token} fontSize={90} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  const writerPt: P = [-300, CLIENT_Y + 60];
  const readerPt: P = [300, CLIENT_Y + 70];
  const leaderTop: P = [LEADER[0], LEADER[1] - 105];
  const leaderBottom: P = [LEADER[0], LEADER[1] + 105];
  const followerTop = (i: number): P => [FOLLOWER_X[i], FOLLOWER_Y - 105];
  // Where the writer sends data: the leader, or a promoted follower after failover.
  let writeTarget: P = leaderTop;

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const flash = (r: Rect) => chain(r.fill(colors.ok, 0.1), r.fill(colors.panel, 0.3));

  function* hook(): ThreadGenerator {
    for (let i = 0; i < 8; i++) {
      sfx('blip', 0.25);
      yield dot([i % 2 ? readerPt : writerPt, leaderTop], colors.request, 0.7);
      yield* waitFor(0.3);
    }
    sfx('alarm', 0.5);
    leaderVal().text('DOWN');
    leaderVal().fill(colors.text);
    yield* leader().fill('#7f1d1d', 0.4);
    yield* showBadge('ONE SERVER = ONE FAILURE', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.3), leader().fill(colors.panel, 0.5));
    leaderVal().text('x = 1');
    leaderVal().fill(colors.token);
    leaderLabel().text('Leader');
    sfx('whoosh', 0.6);
    yield* all(
      ...followers.map(f => all(f.opacity(1, 0.6), f.scale(1, 0.6))),
      ...links.map(l => l.opacity(1, 0.6)),
    );
    sfx('plink2', 0.5);
  }

  // The leader sends a change to a follower; the follower then shows the new value.
  function* replicate(i: number, value: string, t = 0.6): ThreadGenerator {
    yield* dot([leaderBottom, followerTop(i)], colors.ok, t);
    fVals[i].text(`x = ${value}`);
    fVals[i].fill(colors.ok);
    sfx('pop', 0.4);
    yield* flash(followers[i]);
  }

  function* writes(): ThreadGenerator {
    yield* showBadge('WRITES GO TO THE LEADER', colors.request);
    sfx('blip', 0.3);
    yield* dot([writerPt, writeTarget], colors.request, 0.5);
    leaderVal().text('x = 2');
    leaderVal().fill(colors.ok);
    sfx('plink0', 0.5);
    yield* waitFor(0.5);
    yield* showBadge('...THEN COPIED TO FOLLOWERS', colors.ok);
    yield* all(replicate(0, '2'), replicate(1, '2'));
  }

  function* reads(): ThreadGenerator {
    yield* showBadge('READS SPREAD ACROSS FOLLOWERS', colors.ok);
    yield leader().opacity(0.5, 0.3);
    for (let i = 0; i < 4; i++) {
      const f = i % 2;
      sfx('blip', 0.3);
      yield* dot([readerPt, followerTop(f)], colors.request, 0.5);
      yield flash(followers[f]);
      sfx('ding', 0.4);
      yield* dot([followerTop(f), readerPt], colors.ok, 0.5);
      yield* waitFor(0.3);
    }
  }

  function* lag(): ThreadGenerator {
    yield all(leader().opacity(1, 0.3), badge().opacity(0, 0.2));
    // A new write lands on the leader; Follower 2 receives it slowly.
    sfx('blip', 0.3);
    yield* dot([writerPt, writeTarget], colors.request, 0.5);
    leaderVal().text('x = 3');
    sfx('plink0', 0.5);
    yield* showBadge('REPLICATION LAG', colors.token);
    yield replicate(0, '3', 0.5);
    yield replicate(1, '3', 2.4);
    yield* waitFor(0.8);
    // A read on the slow follower returns the old value.
    sfx('blip', 0.3);
    yield* dot([readerPt, followerTop(1)], colors.request, 0.5);
    sfx('buzz', 0.4);
    yield* dot([followerTop(1), readerPt], colors.token, 0.5);
    readerTxt().text('got x = 2 (stale)');
    yield* showBadge('STALE READ', colors.danger);
    yield* waitFor(1);
  }

  function* failover(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), readerTxt().opacity(0, 0.2));
    sfx('alarm', 0.5);
    leaderVal().text('DOWN');
    leaderVal().fill(colors.text);
    yield* leader().fill('#7f1d1d', 0.4);
    yield* showBadge('LEADER DOWN', colors.danger);
    yield* waitFor(1.2);
    // Follower 1 takes over.
    sfx('whoosh', 0.5);
    fLabels[0].text('Leader');
    fLabels[0].fill(colors.request);
    yield* followers[0].stroke(colors.request, 0.4);
    leaderLabel().text('Old leader');
    leaderLabel().fill(colors.muted);
    writeTarget = followerTop(0);
    yield* showBadge('FOLLOWER PROMOTED', colors.ok);
    yield* waitFor(0.8);
    sfx('blip', 0.3);
    yield* dot([writerPt, writeTarget], colors.request, 0.5);
    sfx('ding', 0.5);
    fVals[0].text('x = 4');
    yield* flash(followers[0]);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, concept, writes, reads, lag, failover, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
