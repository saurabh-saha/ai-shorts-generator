import {makeProject} from '@revideo/core';
import idempotency from '../scenes/idempotency?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [idempotency],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
