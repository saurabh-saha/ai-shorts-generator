import {makeProject} from '@revideo/core';
import capTheorem from '../scenes/cap-theorem?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [capTheorem],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
