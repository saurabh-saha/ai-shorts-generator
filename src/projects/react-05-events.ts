import {makeProject} from '@revideo/core';
import react05 from '../scenes/react-05-events?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react05],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
