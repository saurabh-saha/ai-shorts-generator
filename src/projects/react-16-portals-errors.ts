import {makeProject} from '@revideo/core';
import react16 from '../scenes/react-16-portals-errors?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react16],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
