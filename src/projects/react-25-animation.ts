import {makeProject} from '@revideo/core';
import react25 from '../scenes/react-25-animation?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react25],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
