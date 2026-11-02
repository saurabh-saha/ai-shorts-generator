import {makeProject} from '@revideo/core';
import react09 from '../scenes/react-09-refs?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react09],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
