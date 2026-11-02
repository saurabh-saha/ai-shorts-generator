import {makeProject} from '@revideo/core';
import react19 from '../scenes/react-19-state-mgmt?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react19],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
