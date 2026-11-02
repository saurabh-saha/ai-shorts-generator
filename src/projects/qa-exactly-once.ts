import {makeProject} from '@revideo/core';
import qaExactlyOnce from '../scenes/qa-exactly-once?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [qaExactlyOnce],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
