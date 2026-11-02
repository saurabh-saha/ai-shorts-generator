import {makeProject} from '@revideo/core';
import backPressure from '../scenes/back-pressure?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [backPressure],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
