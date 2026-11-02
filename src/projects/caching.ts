import {makeProject} from '@revideo/core';
import caching from '../scenes/caching?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [caching],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
