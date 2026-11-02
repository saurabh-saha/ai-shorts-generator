import {makeProject} from '@revideo/core';
import react02 from '../scenes/react-02-props?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react02],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
