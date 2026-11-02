import {makeProject} from '@revideo/core';
import sqlVsNosql from '../scenes/sql-vs-nosql?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [sqlVsNosql],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
