import {makeProject} from '@revideo/core';
import react18 from '../scenes/react-18-routing?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react18],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
