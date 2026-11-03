import {Rect, Txt, View2D} from '@revideo/2d';
import {Audio} from '@revideo/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@revideo/core';
import {FONT, makeKit} from './kit';
import {colors} from '../theme';

type Beat = {id: string; duration: number; text: string; voice?: string};
type Script = {title: string; subtitle?: string; beats: Beat[]};

// Standard chrome shared by the newer Shorts: title, subtitle, badge, caption, end card and the
// beat loop. A scene only supplies its own elements and one generator per beat id.
export function makeScaffold(
  view: View2D,
  script: Script,
  next: string,
  opts: {badgeY?: number; titleSize?: number; endSize?: number} = {},
) {
  const kit = makeKit(view);
  const badge = createRef<Txt>();
  view.fill(colors.bg);
  view.add(
    <>
      <Txt fontFamily={FONT} text={script.title} fill={colors.text} fontSize={opts.titleSize ?? 84}
        fontWeight={800} y={-800} />
      <Txt fontFamily={FONT} text={script.subtitle ?? 'System Design Explained'} fill={colors.muted}
        fontSize={44} y={-720} />
      <Txt ref={badge} fontFamily={FONT} text="" fill={colors.token} fontSize={44} fontWeight={800}
        y={opts.badgeY ?? 540} opacity={0} />
    </>,
  );

  function* showBadge(text: string, color: string): ThreadGenerator {
    badge().text(text);
    badge().fill(color);
    yield* badge().opacity(1, 0.15);
  }
  const hideBadge = () => badge().opacity(0, 0.2);

  // Plays every beat in order. `close` is optional: it defaults to the end card.
  function* run(beats: Record<string, () => ThreadGenerator>): ThreadGenerator {
    const caption = createRef<Txt>();
    const endCard = createRef<Rect>();
    view.add(
      <>
        <Txt ref={caption} fontFamily={FONT} layout width={940} textWrap textAlign="center" fill={colors.text}
          fontSize={60} fontWeight={800} y={760} opacity={0} />
        <Rect ref={endCard} width={1080} height={1920} fill={colors.bg} opacity={0}>
          <Txt fontFamily={FONT} text={next === '' ? 'Series' : 'Next up'} fill={colors.muted} fontSize={56} y={-90} />
          <Txt fontFamily={FONT} text={next === '' ? 'Complete!' : next} fill={colors.token}
            fontSize={opts.endSize ?? Math.min(92, Math.floor(960 / (Math.max(next.length, 8) * 0.56)))} fontWeight={800} />
          <Txt fontFamily={FONT} text="Follow for more" fill={colors.text} fontSize={52} y={110} />
        </Rect>
      </>,
    );
    function* close(): ThreadGenerator {
      kit.sfx('whoosh', 0.25);
      yield* endCard().opacity(1, 0.5);
    }
    for (const beat of script.beats) {
      caption().text(beat.text);
      if (beat.voice) view.add(<Audio src={beat.voice} play volume={0.85} />);
      caption().opacity(0);
      const body = beats[beat.id] ?? (beat.id === 'close' ? close : undefined);
      if (!body) throw new Error(`no beat generator for "${beat.id}"`);
      yield* all(caption().opacity(1, 0.3), body(), waitFor(beat.duration));
      kit.sweep();
    }
  }

  return {...kit, badge, showBadge, hideBadge, run};
}
