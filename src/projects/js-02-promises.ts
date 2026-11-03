import {makeProject} from '@revideo/core';
import js02 from '../scenes/js-02-promises?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js02],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
