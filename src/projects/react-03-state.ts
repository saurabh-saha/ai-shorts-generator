import {makeProject} from '@revideo/core';
import react03 from '../scenes/react-03-state?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react03],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
