import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {ThreadGenerator, all, chain, createRef, createRefArray, waitFor} from '@revideo/core';
import script from '../../data/guardrails.json';
import {FONT, P, addChips, reveal} from '../components/kit';
import {makeScaffold} from '../components/scaffold';
import {colors} from '../theme';

const MONO = 'Menlo, Courier New, monospace';
// Pipeline, top to bottom. Guards start hidden and are revealed one per beat.
const STAGES: [string, string, boolean][] = [
  ['User request', colors.token, false],
  ['Input guard', colors.request, true],
  ['Agent', colors.ok, false],
  ['Action gate', colors.request, true],
  ['Tool', colors.token, false],
  ['Output guard', colors.request, true],
  ['User', colors.token, false],
];
const Y = (i: number) => -540 + i * 140;
const PX = -230; // pipeline column
const CX = 290; // side column for messages
const LIMITS = [
  ['Max steps', colors.request],
  ['Budget cap', colors.token],
  ['Time limit', '#f472b6'],
  ['Log everything for audits', colors.ok],
] as [string, string][];

export default makeScene2D('guardrails', function* (view) {
  const s = makeScaffold(view, script, 'Evaluating Agents', {badgeY: 470});
  const {sfx, dot} = s;

  const stage = createRefArray<Rect>();
  const human = createRef<Rect>();
  const attack = createRef<Rect>();
  const card = createRef<Rect>();
  const cardTxt = createRef<Txt>();
  const call = createRef<Rect>();
  const callTxt = createRef<Txt>();
  const limits = addChips(view, LIMITS, -330, 130, {h: 96});

  view.add(
    <>
      {STAGES.map(([name, c, guard], i) => (
        <Rect ref={stage} width={480} height={84} radius={20} fill={colors.panel} stroke={c} lineWidth={6}
          position={[PX, Y(i)]} opacity={guard ? 0 : 1}>
          <Txt fontFamily={FONT} text={guard ? `[ ${name} ]` : name} fill={c} fontSize={36} fontWeight={800} />
        </Rect>
      ))}
      <Rect ref={human} width={300} height={100} radius={22} fill={colors.panel} stroke={colors.token}
        lineWidth={6} position={[CX, Y(4)]} opacity={0}>
        <Txt fontFamily={FONT} text="Human" fill={colors.token} fontSize={38} fontWeight={800} y={-16} />
        <Txt fontFamily={FONT} text="approve?" fill={colors.muted} fontSize={28} y={24} />
      </Rect>
      <Rect ref={attack} width={480} height={80} radius={18} fill={colors.panel} stroke={colors.danger}
        lineWidth={5} position={[CX, Y(1)]} opacity={0}>
        <Txt fontFamily={MONO} text={'"ignore your rules"'} fill={colors.danger} fontSize={26} fontWeight={800} />
      </Rect>
      <Rect ref={call} width={480} height={76} radius={18} fill={colors.panel} stroke={colors.token}
        lineWidth={5} position={[CX, Y(3)]} opacity={0}>
        <Txt ref={callTxt} fontFamily={MONO} text="" fill={colors.token} fontSize={25} fontWeight={800} />
      </Rect>
      <Rect ref={card} width={480} height={76} radius={18} fill={colors.panel} stroke={colors.danger}
        lineWidth={5} position={[CX, Y(5)]} opacity={0}>
        <Txt ref={cardTxt} fontFamily={MONO} text="" fill={colors.danger} fontSize={25} fontWeight={800} />
      </Rect>
    </>,
  );

  const top = (i: number): P => [PX, Y(i) - 50];
  const bottom = (i: number): P => [PX, Y(i) + 50];
  const flash = (r: Rect) => chain(r.scale(1.05, 0.12), r.scale(1, 0.15));

  function* hook(): ThreadGenerator {
    sfx('blip', 0.3);
    yield* dot([bottom(0), top(2)], colors.request, 0.5);
    yield* dot([bottom(2), top(4)], colors.danger, 0.6);
    callTxt().text('delete_all_files()');
    callTxt().fill(colors.danger);
    call().stroke(colors.danger);
    call().y(Y(4));
    sfx('alarm', 0.5);
    yield* call().opacity(1, 0.3);
    yield* s.showBadge('NO GUARDS: IT JUST DOES IT', colors.danger);
  }

  function* input(): ThreadGenerator {
    yield* all(s.hideBadge(), call().opacity(0, 0.3));
    sfx('whoosh', 0.5);
    yield* stage[1].opacity(1, 0.4);
    // Injected instructions hidden in a web page try to get through.
    yield* attack().opacity(1, 0.4);
    sfx('blip', 0.3);
    yield* dot([bottom(0), top(1)], colors.danger, 0.5);
    sfx('buzz', 0.5);
    yield* dot([top(1), bottom(0)], colors.danger, 0.4);
    yield* stage[1].fill('#7f1d1d', 0.2);
    yield* stage[1].fill(colors.panel, 0.3);
    yield* s.showBadge('INJECTION BLOCKED', colors.ok);
    yield* waitFor(0.6);
    yield* attack().opacity(0, 0.3);
    sfx('blip', 0.3);
    yield* dot([bottom(0), top(2)], colors.ok, 0.7);
  }

  function* permissions(): ThreadGenerator {
    yield* s.hideBadge();
    sfx('whoosh', 0.5);
    yield* stage[3].opacity(1, 0.4);
    callTxt().text('read_file("report.txt")');
    callTxt().fill(colors.ok);
    call().stroke(colors.ok);
    call().y(Y(3));
    yield* call().opacity(1, 0.3);
    sfx('blip', 0.3);
    yield* dot([bottom(2), top(4)], colors.ok, 0.6);
    sfx('ding', 0.5);
    yield flash(stage[3]);
    yield* s.showBadge('READ-ONLY: ALLOWED', colors.ok);
    yield* waitFor(1.2);
    yield* all(s.hideBadge(), call().opacity(0, 0.2));
    callTxt().text('delete_file("report.txt")');
    callTxt().fill(colors.danger);
    call().stroke(colors.danger);
    yield* call().opacity(1, 0.3);
    sfx('blip', 0.3);
    yield* dot([bottom(2), top(3)], colors.danger, 0.5);
    sfx('buzz', 0.5);
    yield* dot([top(3), bottom(2)], colors.danger, 0.4);
    yield* s.showBadge('NOT ON THE ALLOWLIST', colors.danger);
  }

  function* approval(): ThreadGenerator {
    yield* all(s.hideBadge(), call().opacity(0, 0.2));
    callTxt().text('pay_invoice($5,000)');
    callTxt().fill(colors.token);
    call().stroke(colors.token);
    yield* call().opacity(1, 0.3);
    sfx('blip', 0.3);
    yield* dot([bottom(2), top(3)], colors.token, 0.5);
    sfx('whoosh', 0.4);
    yield* human().opacity(1, 0.4);
    yield* s.showBadge('PAUSED: WAITING FOR A HUMAN', colors.token);
    yield* waitFor(1.4);
    sfx('ding', 0.6);
    yield* human().stroke(colors.ok, 0.3);
    yield* dot([bottom(3), top(4)], colors.ok, 0.5);
    yield* s.showBadge('APPROVED, THEN RUN', colors.ok);
  }

  function* output(): ThreadGenerator {
    yield* all(s.hideBadge(), call().opacity(0, 0.3), human().opacity(0, 0.3));
    sfx('whoosh', 0.5);
    yield* stage[5].opacity(1, 0.4);
    cardTxt().text('card: 4111 1111 1111 1111');
    cardTxt().fill(colors.danger);
    card().stroke(colors.danger);
    yield* card().opacity(1, 0.3);
    sfx('blip', 0.3);
    yield* dot([bottom(4), top(5)], colors.danger, 0.5);
    yield* waitFor(0.3);
    sfx('pop', 0.5);
    cardTxt().text('card: **** **** **** 1111');
    cardTxt().fill(colors.ok);
    card().stroke(colors.ok);
    yield flash(stage[5]);
    yield* dot([bottom(5), top(6)], colors.ok, 0.5);
    yield* s.showBadge('PRIVATE DATA REDACTED', colors.ok);
  }

  function* limitsBeat(): ThreadGenerator {
    yield* all(s.hideBadge(), ...stage.map(r => r.opacity(0, 0.4)), card().opacity(0, 0.4));
    sfx('whoosh', 0.5);
    yield* reveal(limits, sfx, [1.4, 1.4, 1.4, 0]);
  }

  yield* s.run({hook, input, permissions, approval, output, limits: limitsBeat});
});
