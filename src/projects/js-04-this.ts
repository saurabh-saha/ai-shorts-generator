import {makeProject} from '@revideo/core';
import js04 from '../scenes/js-04-this?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js04],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
