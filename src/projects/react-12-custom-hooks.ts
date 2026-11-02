import {makeProject} from '@revideo/core';
import react12 from '../scenes/react-12-custom-hooks?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react12],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
