import {makeProject} from '@revideo/core';
import react17 from '../scenes/react-17-suspense?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react17],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
