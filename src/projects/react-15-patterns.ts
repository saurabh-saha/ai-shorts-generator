import {makeProject} from '@revideo/core';
import react15 from '../scenes/react-15-patterns?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react15],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
