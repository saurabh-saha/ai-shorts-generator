import {makeProject} from '@revideo/core';
import agentPlanning from '../scenes/agent-planning?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [agentPlanning],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
