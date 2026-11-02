import {makeProject} from '@revideo/core';
import bloomFilter from '../scenes/bloom-filter?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [bloomFilter],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
