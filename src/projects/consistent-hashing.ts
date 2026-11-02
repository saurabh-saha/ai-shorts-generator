import {makeProject} from '@revideo/core';
import consistentHashing from '../scenes/consistent-hashing?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [consistentHashing],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
