import {makeProject} from '@revideo/core';
import whatIsAnAgent from '../scenes/what-is-an-agent?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [whatIsAnAgent],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
