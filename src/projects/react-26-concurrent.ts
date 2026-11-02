import {makeProject} from '@revideo/core';
import react26 from '../scenes/react-26-concurrent?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react26],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
