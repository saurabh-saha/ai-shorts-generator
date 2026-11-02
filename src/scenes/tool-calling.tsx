import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, waitFor} from '@revideo/core';
import script from '../../data/tool-calling.json';
import {FONT, P, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const USER_Y = -560;
const LLM_Y = -330;
const APP_Y = -30;
const TOOL_Y = 270;
const MONO = 'Menlo, Courier New, monospace';

export default makeScene2D('tool-calling', function* (view) {
  const s = makeScaffold(view, script, 'The ReAct Loop', {badgeY: 480, endSize: 100});
  const {sfx, dot} = s;

  const user = createRef<Rect>();
  const llm = createRef<Rect>();
  const app = createRef<Rect>();
  const tool = createRef<Rect>();
  const guess = createRef<Txt>();
  const card = createRef<Rect>();
  const callChip = createRef<Rect>();
  const resultChip = createRef<Rect>();
  const answer = createRef<Rect>();
  const chips = addChips(view, [
    ['Clear, specific names', colors.request],
    ['Precise descriptions', colors.token],
    ['Validated arguments', colors.ok],
  ], -250, 130);

  const box = (ref: ReturnType<typeof createRef<Rect>>, y: number, title: string, sub: string, color: string, op = 1) => (
    <Rect ref={ref} width={560} height={130} radius={24} fill={colors.panel} stroke={color} lineWidth={6}
      y={y} opacity={op}>
      <Txt fontFamily={FONT} text={title} fill={color} fontSize={42} fontWeight={800} y={-22} />
      <Txt fontFamily={FONT} text={sub} fill={colors.muted} fontSize={28} y={28} />
    </Rect>
  );

  view.add(
    <>
      <Rect ref={user} width={760} height={100} radius={22} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={USER_Y}>
        <Txt fontFamily={FONT} text={'"What\'s the weather in Paris?"'} fill={colors.token} fontSize={36} fontWeight={800} />
      </Rect>
      {box(llm, LLM_Y, 'LLM', 'writes text', colors.request)}
      {box(app, APP_Y, 'Your code', 'the agent runtime', colors.ok, 0)}
      {box(tool, TOOL_Y, 'Tool', 'weather API', colors.token, 0)}

      <Txt ref={guess} fontFamily={FONT} text={'"Paris is probably mild..."  (a guess)'} fill={colors.muted}
        fontSize={34} fontWeight={700} y={-160} opacity={0} />

      <Rect ref={card} width={900} height={340} radius={26} fill={colors.panel} stroke={colors.request}
        lineWidth={6} y={-60} opacity={0}>
        <Txt fontFamily={FONT} text="tool definition" fill={colors.muted} fontSize={30} fontWeight={700} y={-130} />
        <Txt fontFamily={MONO} text={'name:         get_weather'} fill={colors.token} fontSize={34} fontWeight={800} y={-60} />
        <Txt fontFamily={MONO} text={'description:  current weather'} fill={colors.text} fontSize={32} fontWeight={700} y={0} />
        <Txt fontFamily={MONO} text={'parameters:   city (string)'} fill={colors.ok} fontSize={32} fontWeight={700} y={60} />
        <Txt fontFamily={MONO} text={'              unit (C or F)'} fill={colors.ok} fontSize={32} fontWeight={700} y={110} />
      </Rect>

      <Rect ref={callChip} width={820} height={80} radius={18} fill={colors.panel} stroke={colors.token}
        lineWidth={5} y={-175} opacity={0}>
        <Txt fontFamily={MONO} text={'call: get_weather(city="Paris")'} fill={colors.token} fontSize={32} fontWeight={800} />
      </Rect>
      <Rect ref={resultChip} width={820} height={80} radius={18} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} y={120} opacity={0}>
        <Txt fontFamily={MONO} text={'result: 18C, cloudy'} fill={colors.ok} fontSize={32} fontWeight={800} />
      </Rect>
      <Rect ref={answer} width={780} height={80} radius={18} fill={colors.panel} stroke={colors.ok}
        lineWidth={5} y={-455} opacity={0}>
        <Txt fontFamily={FONT} text={"It's 18C and cloudy in Paris."} fill={colors.ok} fontSize={34} fontWeight={800} />
      </Rect>
    </>,
  );

  const pt = (y: number, dy: number): P => [0, y + dy];
  const flash = (r: Rect) => chain(r.scale(1.05, 0.12), r.scale(1, 0.15));

  function* hook(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([pt(USER_Y, 55), pt(LLM_Y, -70)], colors.token, 0.5);
    yield* guess().opacity(1, 0.4);
    sfx('buzz', 0.4);
    yield* s.showBadge('JUST TEXT: NO LOOKUPS', colors.danger);
  }

  function* define(): ThreadGenerator {
    yield* all(s.hideBadge(), guess().opacity(0, 0.3));
    sfx('whoosh', 0.5);
    yield* card().opacity(1, 0.4);
    sfx('plink2', 0.5);
    yield* s.showBadge('TOOLS ARE DESCRIBED TO THE MODEL', colors.request);
  }

  function* call(): ThreadGenerator {
    yield* all(s.hideBadge(), card().opacity(0, 0.3));
    sfx('whoosh', 0.5);
    yield* all(app().opacity(1, 0.4), tool().opacity(1, 0.4));
    yield* waitFor(0.4);
    sfx('blip', 0.3);
    yield* callChip().opacity(1, 0.3);
    yield* dot([pt(LLM_Y, 65), pt(APP_Y, -65)], colors.token, 0.6);
    yield flash(app());
    yield* s.showBadge('THE MODEL ONLY ASKS', colors.token);
  }

  function* run(): ThreadGenerator {
    yield* s.hideBadge();
    sfx('blip', 0.3);
    yield* dot([pt(APP_Y, 65), pt(TOOL_Y, -65)], colors.token, 0.6);
    yield flash(tool());
    sfx('pop', 0.5);
    yield* waitFor(0.3);
    yield* dot([pt(TOOL_Y, -65), pt(APP_Y, 65)], colors.ok, 0.6);
    yield* resultChip().opacity(1, 0.3);
    sfx('blip', 0.3);
    yield* dot([pt(APP_Y, -65), pt(LLM_Y, 65)], colors.ok, 0.6);
    yield flash(llm());
    yield* s.showBadge('YOUR CODE RUNS THE TOOL', colors.ok);
  }

  function* answerBeat(): ThreadGenerator {
    yield* s.hideBadge();
    sfx('ding', 0.5);
    yield* dot([pt(LLM_Y, -65), pt(USER_Y, 55)], colors.ok, 0.6);
    yield* answer().opacity(1, 0.4);
    yield* s.showBadge('RESULT IN, ANSWER OUT', colors.ok);
  }

  function* design(): ThreadGenerator {
    yield* all(
      s.hideBadge(), user().opacity(0, 0.4), llm().opacity(0, 0.4), app().opacity(0, 0.4), tool().opacity(0, 0.4),
      callChip().opacity(0, 0.4), resultChip().opacity(0, 0.4), answer().opacity(0, 0.4),
    );
    sfx('whoosh', 0.5);
    yield* reveal(chips, sfx, [1.8, 1.8, 0]);
  }

  yield* s.run({hook, define, call, run, answer: answerBeat, design});
});
