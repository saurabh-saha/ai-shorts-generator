import {makeProject} from '@revideo/core';
import react06 from '../scenes/react-06-lists?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react06],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
