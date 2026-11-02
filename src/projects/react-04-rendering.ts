import {makeProject} from '@revideo/core';
import react04 from '../scenes/react-04-rendering?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react04],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
