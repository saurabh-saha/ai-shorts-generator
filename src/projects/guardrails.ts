import {makeProject} from '@revideo/core';
import guardrails from '../scenes/guardrails?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [guardrails],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
