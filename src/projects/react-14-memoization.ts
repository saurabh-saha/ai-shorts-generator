import {makeProject} from '@revideo/core';
import react14 from '../scenes/react-14-memoization?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react14],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
