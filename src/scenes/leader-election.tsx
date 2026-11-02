import {Audio, Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  linear,
  waitFor,
} from '@revideo/core';
import script from '../../data/leader-election.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const N = 5;
const CX = 0;
const CY = 60;
const R = 330;
const LEADER_FILL = '#3b3210';
const DEAD_FILL = '#7f1d1d';
const BAR_W = 110;

const pos = (i: number): P => {
  const a = ((i * 360) / N) * (Math.PI / 180);
  return [CX + R * Math.sin(a), CY - R * Math.cos(a)];
};

export default makeScene2D('leader-election', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const term = createRef<Txt>();
  const votes = createRef<Txt>();
  const badge = createRef<Txt>();
  const endCard = createRef<Rect>();
  const nodes = createRefArray<Circle>();
  const roles = createRefArray<Txt>();
  const bars = createRefArray<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={92} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text="System Design Explained" fill={colors.muted} fontSize={44} y={-720} />

      <Txt ref={term} fontFamily={FONT} text="term 1" fill={colors.token} fontSize={64} fontWeight={800}
        position={[CX, CY - 20]} />
      <Txt ref={votes} fontFamily={FONT} text="" fill={colors.request} fontSize={44} fontWeight={800}
        position={[CX, CY + 50]} />

      {Array.from({length: N}, (_, i) => [
          <Circle ref={nodes} size={160} fill={i === 0 ? LEADER_FILL : colors.panel}
            stroke={i === 0 ? colors.token : colors.ok} lineWidth={7} position={pos(i)} opacity={0}>
            <Txt fontFamily={FONT} text={`N${i + 1}`} fill={colors.text} fontSize={46} fontWeight={800} y={-18} />
            <Txt ref={roles} fontFamily={FONT} text={i === 0 ? 'LEADER' : 'follower'}
              fill={i === 0 ? colors.token : colors.muted} fontSize={26} fontWeight={700} y={30} />
          </Circle>,
          <Rect ref={bars} width={0} height={10} radius={5} fill={colors.token}
            position={[pos(i)[0] - BAR_W / 2, pos(i)[1] + 100]} offset={[-1, 0]} opacity={0} />,
      ]).flat()}

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.danger} fontSize={48} fontWeight={800}
        y={560} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Distributed Locks" fill={colors.token} fontSize={86} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  function setRole(i: number, role: string, color: string, fill = colors.panel) {
    roles[i].text(role);
    roles[i].fill(color);
    nodes[i].stroke(color);
    nodes[i].fill(fill);
  }

  const flash = (i: number) => chain(nodes[i].scale(1.2, 0.15), nodes[i].scale(1, 0.2));

  // A message travels between two nodes.
  const msg = (from: number, to: number, color: string, t = 0.6) => dot([pos(from), pos(to)], color, t);

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.5);
    yield* all(...nodes.map(n => n.opacity(1, 0.5)));
    sfx('plink2', 0.5);
    yield* showBadge('ONE LEADER, FOUR FOLLOWERS', colors.token);
  }

  function* heartbeat(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('HEARTBEAT', colors.ok);
    for (let r = 0; r < 3; r++) {
      sfx('blip', 0.35);
      yield* all(...[1, 2, 3, 4].map(i => msg(0, i, colors.ok)));
      sfx('plink1', 0.3);
      yield* all(...[1, 2, 3, 4].map(i => flash(i)));
      yield* waitFor(0.6);
    }
  }

  function* failure(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    sfx('alarm', 0.5);
    setRole(0, 'DOWN', colors.danger, DEAD_FILL);
    yield* showBadge('LEADER CRASHED: NO HEARTBEAT', colors.danger);
    yield* waitFor(1.2);
    // Each follower runs an election timer; N3's is the shortest.
    yield* showBadge('ELECTION TIMERS RUNNING', colors.token);
    yield* all(...[1, 2, 3, 4].map(i => all(
      bars[i].opacity(1, 0.2),
      bars[i].width(i === 2 ? BAR_W : BAR_W * (0.45 + i * 0.1), 1.8, linear),
    )));
    sfx('buzz', 0.5);
    yield* all(...[1, 3, 4].map(i => bars[i].opacity(0, 0.3)), flash(2));
  }

  function* vote(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), bars[2].opacity(0, 0.3));
    // N3 times out first: it becomes a candidate in term 2.
    setRole(2, 'candidate', colors.request);
    term().text('term 2');
    sfx('plink3', 0.5);
    votes().text('votes: 1 / 5');
    yield* showBadge('N3 ASKS FOR VOTES', colors.request);
    sfx('blip', 0.35);
    yield* all(...[1, 3, 4].map(i => msg(2, i, colors.request)));
    // N2, N4, N5 vote for it (the crashed N1 cannot).
    let n = 1;
    for (const i of [1, 3, 4]) {
      sfx('pop', 0.4);
      yield* msg(i, 2, colors.ok, 0.5);
      n++;
      votes().text(`votes: ${n} / 5`);
      yield* waitFor(0.3);
    }
  }

  function* majority(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    yield* showBadge('3 OF 5 IS A MAJORITY', colors.token);
    yield* waitFor(1.5);
    sfx('ding', 0.6);
    setRole(2, 'LEADER', colors.token, LEADER_FILL);
    votes().text('');
    yield* flash(2);
    for (const i of [1, 3, 4]) setRole(i, 'follower', colors.ok);
    yield* showBadge('NEW LEADER: N3', colors.ok);
    sfx('blip', 0.35);
    yield* all(...[1, 3, 4].map(i => msg(2, i, colors.ok)));
    yield* all(...[1, 3, 4].map(i => flash(i)));
  }

  function* termBeat(): ThreadGenerator {
    yield* badge().opacity(0, 0.2);
    // The old leader comes back still believing it is the leader of term 1.
    sfx('whoosh', 0.5);
    setRole(0, 'LEADER?  term 1', colors.danger);
    yield* showBadge('OLD LEADER RETURNS', colors.danger);
    yield* waitFor(1.2);
    sfx('blip', 0.35);
    yield* msg(2, 0, colors.ok);
    sfx('ding', 0.5);
    setRole(0, 'follower', colors.ok);
    yield* flash(0);
    yield* showBadge('TERM 2 > TERM 1: STEPS DOWN', colors.ok);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {
    hook, heartbeat, failure, vote, majority, term: termBeat, close,
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
