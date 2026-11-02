import {makeProject} from '@revideo/core';
import qaMcp50Tools from '../scenes/qa-mcp-50-tools?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [qaMcp50Tools],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
