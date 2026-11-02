import {makeProject} from '@revideo/core';
import rateLimiter from '../scenes/rate-limiter?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rateLimiter],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
