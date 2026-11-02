import {Audio, Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
} from '@revideo/core';
import script from '../../data/what-is-an-agent.json';
import {FONT, P, makeKit} from '../components/kit';
import {colors} from '../theme';

const PINK = '#f472b6';
const CX = 0;
const CY = 40;
const R = 330;
const LOOP: [string, string, string][] = [
  ['Think', 'the LLM decides', colors.request],
  ['Act', 'calls a tool', colors.token],
  ['Observe', 'reads the result', colors.ok],
];
const loopPos = (i: number): P => {
  const a = (i * 120 * Math.PI) / 180;
  return [CX + R * Math.sin(a), CY - R * Math.cos(a)];
};
const TOOLS: [string, string][] = [
  ['Search the web', colors.request],
  ['Run code', colors.token],
  ['Call an API', PINK],
  ['Read and write files', colors.ok],
];
const STEPS: [string, string][] = [
  ['Search flights', 'found 12 options'],
  ['Compare prices', 'cheapest: $212'],
  ['Pick the cheapest', 'seat 14C is free'],
  ['Book it', 'confirmed'],
];
const RISKS = ['Can loop forever', 'May pick the wrong tool', 'Mistakes compound'];

export default makeScene2D('what-is-an-agent', function* (view) {
  view.fill(colors.bg);

  const caption = createRef<Txt>();
  const badge = createRef<Txt>();
  const prompt = createRef<Rect>();
  const chat = createRef<Rect>();
  const chatTxt = createRef<Txt>();
  const chatTag = createRef<Txt>();
  const agent = createRef<Rect>();
  const agentLines = createRefArray<Txt>();
  const agentTag = createRef<Txt>();
  const goal = createRef<Circle>();
  const nodes = createRefArray<Rect>();
  const toolChips = createRefArray<Rect>();
  const stepRows = createRefArray<Rect>();
  const stepObs = createRefArray<Txt>();
  const riskChips = createRefArray<Rect>();
  const fix = createRef<Rect>();
  const endCard = createRef<Rect>();
  const {sfx, dot, sweep} = makeKit(view);

  const audioSrc = script.audio as string | null;
  if (audioSrc) view.add(<Audio src={audioSrc} play />);

  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={80} fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text={script.subtitle} fill={colors.muted} fontSize={44} y={-720} />

      <Rect ref={prompt} width={760} height={100} radius={22} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={-560} opacity={0}>
        <Txt fontFamily={FONT} text={'"Book me the cheapest flight"'} fill={colors.token} fontSize={38} fontWeight={800} />
      </Rect>

      <Rect ref={chat} width={470} height={520} radius={26} fill={colors.panel} stroke={colors.muted}
        lineWidth={6} position={[-260, -130]} opacity={0}>
        <Txt fontFamily={FONT} text="Chatbot" fill={colors.muted} fontSize={46} fontWeight={800} y={-205} />
        <Txt ref={chatTxt} fontFamily={FONT} text="" fill={colors.text} fontSize={34} fontWeight={600}
          width={410} textWrap textAlign="center" y={-30} />
        <Txt ref={chatTag} fontFamily={FONT} text="ANSWERS" fill={colors.muted} fontSize={40} fontWeight={800}
          y={200} opacity={0} />
      </Rect>
      <Rect ref={agent} width={470} height={520} radius={26} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} position={[260, -130]} opacity={0}>
        <Txt fontFamily={FONT} text="Agent" fill={colors.ok} fontSize={46} fontWeight={800} y={-205} />
        {['search flights', 'compare prices', 'book the ticket'].map((t, i) => (
          <Txt ref={agentLines} fontFamily={FONT} text={t} fill={colors.ok} fontSize={36} fontWeight={800}
            y={-100 + i * 80} opacity={0} />
        ))}
        <Txt ref={agentTag} fontFamily={FONT} text="ACTS" fill={colors.ok} fontSize={40} fontWeight={800}
          y={200} opacity={0} />
      </Rect>

      <Circle ref={goal} size={200} fill={colors.panel} stroke={colors.empty} lineWidth={6}
        position={[CX, CY]} opacity={0}>
        <Txt fontFamily={FONT} text="Goal" fill={colors.muted} fontSize={34} fontWeight={800} y={-22} />
        <Txt fontFamily={FONT} text="cheapest flight" fill={colors.text} fontSize={26} fontWeight={700} y={22} />
      </Circle>
      {LOOP.map(([name, sub, c], i) => (
        <Rect ref={nodes} width={290} height={120} radius={24} fill={colors.panel} stroke={c} lineWidth={6}
          position={loopPos(i)} opacity={0}>
          <Txt fontFamily={FONT} text={name} fill={c} fontSize={42} fontWeight={800} y={-20} />
          <Txt fontFamily={FONT} text={sub} fill={colors.muted} fontSize={28} y={28} />
        </Rect>
      ))}

      {TOOLS.map(([t, c], i) => (
        <Rect ref={toolChips} width={820} height={100} radius={22} fill={colors.panel} stroke={c}
          lineWidth={5} y={-290 + i * 140} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={c} fontSize={44} fontWeight={800} />
        </Rect>
      ))}

      {STEPS.map(([t, obs], i) => (
        <Rect ref={stepRows} width={900} height={110} radius={22} fill={colors.panel} stroke={colors.empty}
          lineWidth={5} y={-290 + i * 150} opacity={0}>
          <Txt fontFamily={FONT} text={`${i + 1}. ${t}`} fill={colors.text} fontSize={38} fontWeight={800}
            offsetX={-1} x={-410} y={-14} />
          <Txt ref={stepObs} fontFamily={FONT} text={obs} fill={colors.ok} fontSize={30} fontWeight={700}
            offsetX={-1} x={-410} y={28} opacity={0} />
        </Rect>
      ))}

      {RISKS.map((t, i) => (
        <Rect ref={riskChips} width={820} height={90} radius={20} fill={colors.panel} stroke={colors.danger}
          lineWidth={5} y={-290 + i * 120} opacity={0}>
          <Txt fontFamily={FONT} text={t} fill={colors.danger} fontSize={42} fontWeight={800} />
        </Rect>
      ))}
      <Rect ref={fix} width={900} height={130} radius={22} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={110} opacity={0}>
        <Txt fontFamily={FONT} text="Fix:" fill={colors.ok} fontSize={34} fontWeight={800} y={-30} />
        <Txt fontFamily={FONT} text="limits  ·  logs  ·  human approval" fill={colors.text} fontSize={38}
          fontWeight={800} y={20} />
      </Rect>

      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.token} fontSize={46} fontWeight={800}
        y={560} opacity={0} />

      <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center"
        fill={colors.text} fontSize={60} fontWeight={800} y={760} opacity={0} />

      <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
        <Txt fontFamily={FONT} text="Next up" fill={colors.muted} fontSize={56} y={-90} />
        <Txt fontFamily={FONT} text="Tool Calling" fill={colors.token} fontSize={104} fontWeight={800} />
        <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
      </Rect>
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }

  const pulse = (r: Rect) => chain(r.scale(1.06, 0.12), r.scale(1, 0.15));

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.4);
    yield* prompt().opacity(1, 0.4);
    yield* all(chat().opacity(1, 0.4), agent().opacity(1, 0.4));
    chatTxt().text('Here are 5 tips for finding cheap flights...');
    yield* waitFor(0.8);
    for (let i = 0; i < agentLines.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* agentLines[i].opacity(1, 0.3);
      yield* waitFor(0.8);
    }
    sfx('ding', 0.5);
    yield* all(chatTag().opacity(1, 0.3), agentTag().opacity(1, 0.3));
  }

  function* loop(): ThreadGenerator {
    yield* all(
      prompt().opacity(0, 0.4), chat().opacity(0, 0.4), agent().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    yield* goal().opacity(1, 0.4);
    yield* all(...nodes.map(n => n.opacity(1, 0.4)));
    yield* showBadge('REPEAT UNTIL THE GOAL IS MET', colors.token);
    // A token travels Think -> Act -> Observe -> Think, twice.
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 3; i++) {
        const next = (i + 1) % 3;
        sfx('blip', 0.3);
        yield pulse(nodes[i]);
        yield* dot([loopPos(i), loopPos(next)], LOOP[next][2], 0.7);
      }
    }
    sfx('ding', 0.5);
    yield* waitFor(0.3);
  }

  function* tools(): ThreadGenerator {
    yield* all(
      badge().opacity(0, 0.2), goal().opacity(0, 0.4), ...nodes.map(n => n.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    for (let i = 0; i < TOOLS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* toolChips[i].opacity(1, 0.3);
      yield* waitFor(0.9);
    }
  }

  function* example(): ThreadGenerator {
    yield* all(...toolChips.map(c => c.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* all(...stepRows.map(s => s.opacity(1, 0.4)));
    for (let i = 0; i < STEPS.length; i++) {
      sfx(`plink${i}`, 0.5);
      yield* stepRows[i].stroke(colors.ok, 0.25);
      yield* stepObs[i].opacity(1, 0.3);
      yield* waitFor(1.2);
    }
    sfx('ding', 0.6);
    yield* showBadge('EACH STEP USES THE LAST RESULT', colors.ok);
  }

  function* limits(): ThreadGenerator {
    yield* all(badge().opacity(0, 0.2), ...stepRows.map(s => s.opacity(0, 0.4)));
    sfx('whoosh', 0.5);
    for (let i = 0; i < RISKS.length; i++) {
      sfx('buzz', 0.4);
      yield* riskChips[i].opacity(1, 0.3);
      yield* waitFor(1.2);
    }
    sfx('ding', 0.6);
    yield* fix().opacity(1, 0.4);
  }

  function* close(): ThreadGenerator {
    sfx('whoosh', 0.6);
    yield* endCard().opacity(1, 0.5);
  }

  const beats: Record<string, () => ThreadGenerator> = {hook, loop, tools, example, limits, close};

  for (const beat of script.beats) {
    caption().text(beat.text);
    const voice = (beat as {voice?: string}).voice;
    if (voice) view.add(<Audio src={voice} play volume={0.85} />);
    caption().opacity(0);
    yield* all(caption().opacity(1, 0.3), beats[beat.id](), waitFor(beat.duration));
    sweep();
  }
});
