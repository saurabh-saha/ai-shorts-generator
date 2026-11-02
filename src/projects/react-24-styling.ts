import {makeProject} from '@revideo/core';
import react24 from '../scenes/react-24-styling?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react24],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
