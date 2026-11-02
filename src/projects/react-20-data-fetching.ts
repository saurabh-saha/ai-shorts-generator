import {makeProject} from '@revideo/core';
import react20 from '../scenes/react-20-data-fetching?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react20],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
