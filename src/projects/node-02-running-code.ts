import {makeProject} from '@revideo/core';
import node02 from '../scenes/node-02-running-code?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [node02],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
