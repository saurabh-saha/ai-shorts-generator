import {makeProject} from '@revideo/core';
import evalAgents from '../scenes/evaluating-agents?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [evalAgents],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
