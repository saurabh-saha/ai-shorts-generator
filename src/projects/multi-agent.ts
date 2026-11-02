import {makeProject} from '@revideo/core';
import multiAgent from '../scenes/multi-agent?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [multiAgent],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
