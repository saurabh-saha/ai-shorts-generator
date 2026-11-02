import {makeProject} from '@revideo/core';
import react08 from '../scenes/react-08-no-effect?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react08],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
