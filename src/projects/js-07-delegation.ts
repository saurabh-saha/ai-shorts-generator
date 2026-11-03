import {makeProject} from '@revideo/core';
import js07 from '../scenes/js-07-delegation?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js07],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
