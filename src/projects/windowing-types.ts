import {makeProject} from '@revideo/core';
import windowingTypes from '../scenes/windowing-types?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [windowingTypes],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
