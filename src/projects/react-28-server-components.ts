import {makeProject} from '@revideo/core';
import react28 from '../scenes/react-28-server-components?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react28],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
