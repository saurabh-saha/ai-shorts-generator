import {Line, Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, createRefArray, sequence, waitFor} from '@revideo/core';
import script from '../../data/mcp.json';
import {FONT, P, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const ROW_Y = [-320, -120, 80];
const AX = -330;
const TX = 330;
const MONO = 'Menlo, Courier New, monospace';

export default makeScene2D('mcp', function* (view) {
  const s = makeScaffold(view, script, 'Guardrails', {badgeY: 370, titleSize: 110});
  const {sfx, dot} = s;

  const agents = createRefArray<Rect>();
  const tools = createRefArray<Rect>();
  const direct = createRefArray<Line>();
  const hubLines = createRefArray<Line>();
  const hub = createRef<Rect>();
  const agent = createRef<Rect>();
  const server = createRef<Rect>();
  const listed = createRefArray<Txt>();
  const msg = createRef<Rect>();
  const msgTxt = createRef<Txt>();
  const resp = createRef<Rect>();
  const respTxt = createRef<Txt>();
  const scale = addChips(view, [
    ["Don't load all 50 tools", colors.danger],
    ['Group or filter by task', colors.token],
    ['Load only what is needed', colors.ok],
  ], -250, 130);
  const safety = addChips(view, [
    ['Authenticate the server', colors.request],
    ['Least-privilege permissions', colors.token],
    ['Validate every result', colors.ok],
  ], -250, 130);

  const pairs: [number, number][] = [];
  for (let a = 0; a < 3; a++) for (let t = 0; t < 3; t++) pairs.push([a, t]);

  view.add(
    <>
      {pairs.map(([a, t]) => (
        <Line ref={direct} points={[[AX + 130, ROW_Y[a]], [TX - 130, ROW_Y[t]]]} stroke={colors.danger}
          lineWidth={4} opacity={0} />
      ))}
      {ROW_Y.map((y, i) => (
        <Line ref={hubLines} points={[[AX + 130, y], [-90, -120]]} stroke={colors.ok} lineWidth={5} opacity={0} />
      ))}
      {ROW_Y.map((y, i) => (
        <Line ref={hubLines} points={[[90, -120], [TX - 130, y]]} stroke={colors.ok} lineWidth={5} opacity={0} />
      ))}
      {ROW_Y.map((y, i) => (
        <Rect ref={agents} width={260} height={90} radius={20} fill={colors.panel} stroke={colors.request}
          lineWidth={5} position={[AX, y]} opacity={0}>
          <Txt fontFamily={FONT} text={`Agent ${i + 1}`} fill={colors.request} fontSize={36} fontWeight={800} />
        </Rect>
      ))}
      {['Search', 'Files', 'Database'].map((n, i) => (
        <Rect ref={tools} width={260} height={90} radius={20} fill={colors.panel} stroke={colors.token}
          lineWidth={5} position={[TX, ROW_Y[i]]} opacity={0}>
          <Txt fontFamily={FONT} text={n} fill={colors.token} fontSize={36} fontWeight={800} />
        </Rect>
      ))}
      <Rect ref={hub} width={180} height={330} radius={26} fill={colors.panel} stroke={colors.ok} lineWidth={6}
        position={[0, -120]} opacity={0}>
        <Txt fontFamily={FONT} text="MCP" fill={colors.ok} fontSize={54} fontWeight={800} />
      </Rect>

      <Rect ref={agent} width={520} height={110} radius={24} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={-470} opacity={0}>
        <Txt fontFamily={FONT} text="Agent (MCP client)" fill={colors.request} fontSize={40} fontWeight={800} />
      </Rect>
      <Rect ref={server} width={800} height={360} radius={28} fill={colors.panel} stroke={colors.ok}
        lineWidth={6} y={-20} opacity={0}>
        <Txt fontFamily={FONT} text="MCP server: code host" fill={colors.ok} fontSize={38} fontWeight={800} y={-145} />
        {['tool: search_code', 'tool: read_file', 'resource: repo files', 'prompt: review template'].map((t, i) => (
          <Txt ref={listed} fontFamily={MONO} text={t} fill={colors.text} fontSize={32} fontWeight={800}
            y={-70 + i * 62} opacity={0} />
        ))}
      </Rect>
      <Rect ref={msg} width={780} height={76} radius={18} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={-340} opacity={0}>
        <Txt ref={msgTxt} fontFamily={MONO} text="" fill={colors.token} fontSize={32} fontWeight={800} />
      </Rect>
      <Rect ref={resp} width={780} height={76} radius={18} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} y={250} opacity={0}>
        <Txt ref={respTxt} fontFamily={MONO} text="" fill={colors.ok} fontSize={32} fontWeight={800} />
      </Rect>
    </>,
  );

  const flash = (r: Rect) => chain(r.scale(1.05, 0.12), r.scale(1, 0.15));
  const agentPt: P = [0, -470 + 60];
  const serverTop: P = [0, -20 - 185];

  function* hook(): ThreadGenerator {
    sfx('whoosh', 0.4);
    yield* all(sequence(0.1, ...agents.map(a => a.opacity(1, 0.3))), sequence(0.1, ...tools.map(t => t.opacity(1, 0.3))));
    yield* sequence(0.15, ...direct.map(l => l.opacity(0.85, 0.2)));
    sfx('alarm', 0.4);
    yield* s.showBadge('3 x 3 = 9 CUSTOM CONNECTIONS', colors.danger);
  }

  function* concept(): ThreadGenerator {
    yield* all(s.hideBadge(), ...direct.map(l => l.opacity(0, 0.4)));
    sfx('whoosh', 0.5);
    yield* hub().opacity(1, 0.4);
    yield* sequence(0.1, ...hubLines.map(l => l.opacity(1, 0.25)));
    sfx('ding', 0.5);
    yield* s.showBadge('3 + 3 = 6: NEW ONES JUST PLUG IN', colors.ok);
  }

  function* discover(): ThreadGenerator {
    yield* all(
      s.hideBadge(), hub().opacity(0, 0.4), ...hubLines.map(l => l.opacity(0, 0.4)),
      ...agents.map(a => a.opacity(0, 0.4)), ...tools.map(t => t.opacity(0, 0.4)),
    );
    sfx('whoosh', 0.5);
    yield* all(agent().opacity(1, 0.4), server().opacity(1, 0.4));
    msgTxt().text('tools/list');
    yield* msg().opacity(1, 0.3);
    sfx('blip', 0.3);
    yield* dot([agentPt, serverTop], colors.token, 0.6);
    yield* waitFor(0.4);
    for (let i = 0; i < listed.length; i++) {
      sfx(`plink${i}`, 0.4);
      yield* listed[i].opacity(1, 0.3);
      yield* waitFor(0.5);
    }
    yield* s.showBadge('DISCOVERED AT RUNTIME', colors.ok);
  }

  function* call(): ThreadGenerator {
    yield* s.hideBadge();
    msgTxt().text('tools/call  search_code("bug")');
    sfx('blip', 0.3);
    yield* dot([agentPt, serverTop], colors.token, 0.6);
    yield flash(server());
    yield* waitFor(0.4);
    respTxt().text('result: 3 matches');
    respTxt().fill(colors.ok);
    resp().stroke(colors.ok);
    sfx('ding', 0.5);
    yield* resp().opacity(1, 0.3);
    yield* waitFor(1.6);
    // A second call fails: the agent gets a structured error it can handle.
    yield* resp().opacity(0, 0.2);
    msgTxt().text('tools/call  read_file("x.py")');
    sfx('blip', 0.3);
    yield* dot([agentPt, serverTop], colors.token, 0.6);
    respTxt().text('error: file not found');
    respTxt().fill(colors.danger);
    resp().stroke(colors.danger);
    sfx('buzz', 0.5);
    yield* resp().opacity(1, 0.3);
    yield* waitFor(0.8);
    yield* s.showBadge('HANDLE ERRORS, DON\'T CRASH', colors.token);
  }

  function* scaleBeat(): ThreadGenerator {
    yield* all(
      s.hideBadge(), agent().opacity(0, 0.4), server().opacity(0, 0.4), msg().opacity(0, 0.4), resp().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    yield* reveal(scale, sfx, [1.5, 1.5, 0]);
  }

  function* safetyBeat(): ThreadGenerator {
    yield* all(...scale.map(c => c.opacity(0, 0.3)));
    sfx('whoosh', 0.5);
    yield* reveal(safety, sfx, [1.4, 1.4, 0]);
  }

  yield* s.run({hook, concept, discover, call, scale: scaleBeat, safety: safetyBeat});
});
