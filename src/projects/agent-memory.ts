import {makeProject} from '@revideo/core';
import agentMemory from '../scenes/agent-memory?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [agentMemory],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
