import {makeProject} from '@revideo/core';
import sharding from '../scenes/sharding?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [sharding],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
