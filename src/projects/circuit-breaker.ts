import {makeProject} from '@revideo/core';
import circuitBreaker from '../scenes/circuit-breaker?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [circuitBreaker],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
