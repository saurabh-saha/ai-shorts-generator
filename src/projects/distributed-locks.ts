import {makeProject} from '@revideo/core';
import distributedLocks from '../scenes/distributed-locks?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [distributedLocks],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
