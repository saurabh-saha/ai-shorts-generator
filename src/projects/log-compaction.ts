import {makeProject} from '@revideo/core';
import logCompaction from '../scenes/log-compaction?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [logCompaction],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
