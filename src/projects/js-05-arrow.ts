import {makeProject} from '@revideo/core';
import js05 from '../scenes/js-05-arrow?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js05],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
