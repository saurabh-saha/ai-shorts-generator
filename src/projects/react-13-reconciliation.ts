import {makeProject} from '@revideo/core';
import react13 from '../scenes/react-13-reconciliation?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react13],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
