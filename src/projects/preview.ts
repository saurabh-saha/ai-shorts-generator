import {makeProject} from '@revideo/core';
import preview from '../scenes/preview?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [preview],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
