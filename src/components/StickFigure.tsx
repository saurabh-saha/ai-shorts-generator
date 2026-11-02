import {Circle, Line, Node} from '@revideo/2d';
import {createRef} from '@revideo/core';

// Reusable stick figure. Origin is the neck; the arm pivots at the shoulder
// so `arm().rotation(...)` swings it. Reuse across every video.
export function makeStickFigure(color = '#f8fafc') {
  const root = createRef<Node>();
  const arm = createRef<Node>();

  const node = (
    <Node ref={root}>
      <Circle y={-35} size={70} stroke={color} lineWidth={8} />
      <Line points={[[0, 0], [0, 110]]} stroke={color} lineWidth={8} lineCap="round" />
      <Line points={[[0, 110], [-32, 180]]} stroke={color} lineWidth={8} lineCap="round" />
      <Line points={[[0, 110], [32, 180]]} stroke={color} lineWidth={8} lineCap="round" />
      <Line points={[[0, 30], [-50, 80]]} stroke={color} lineWidth={8} lineCap="round" />
      <Node ref={arm} position={[0, 30]} rotation={-20}>
        <Line points={[[0, 0], [0, 70]]} stroke={color} lineWidth={8} lineCap="round" />
      </Node>
    </Node>
  );

  return {node, root, arm};
}
