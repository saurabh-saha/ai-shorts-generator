import {makeProject} from '@revideo/core';
import dbIndexes from '../scenes/db-indexes?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [dbIndexes],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
