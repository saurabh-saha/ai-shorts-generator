import {makeProject} from '@revideo/core';
import reactLoop from '../scenes/react-loop?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [reactLoop],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
