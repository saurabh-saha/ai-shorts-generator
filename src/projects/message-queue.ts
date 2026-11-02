import {makeProject} from '@revideo/core';
import messageQueue from '../scenes/message-queue?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [messageQueue],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
