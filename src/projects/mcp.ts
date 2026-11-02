import {makeProject} from '@revideo/core';
import mcpShort from '../scenes/mcp?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [mcpShort],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
