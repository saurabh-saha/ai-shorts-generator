import {makeProject} from '@revideo/core';
import node01 from '../scenes/node-01-what-is-node?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [node01],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
