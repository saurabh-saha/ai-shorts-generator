import {makeProject} from '@revideo/core';
import toolCalling from '../scenes/tool-calling?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [toolCalling],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
