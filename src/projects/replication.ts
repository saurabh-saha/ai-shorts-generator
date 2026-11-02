import {makeProject} from '@revideo/core';
import replication from '../scenes/replication?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [replication],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
