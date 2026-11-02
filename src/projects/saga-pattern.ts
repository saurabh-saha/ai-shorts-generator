import {makeProject} from '@revideo/core';
import sagaPattern from '../scenes/saga-pattern?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [sagaPattern],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
