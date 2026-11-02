import {makeProject} from '@revideo/core';
import node03 from '../scenes/node-03-event-loop?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [node03],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
