import {makeProject} from '@revideo/core';
import js06 from '../scenes/js-06-bubbling?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js06],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
