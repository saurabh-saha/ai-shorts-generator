import {makeProject} from '@revideo/core';
import react11 from '../scenes/react-11-usecontext?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react11],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
