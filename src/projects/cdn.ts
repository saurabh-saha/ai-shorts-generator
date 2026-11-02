import {makeProject} from '@revideo/core';
import cdn from '../scenes/cdn?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [cdn],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
