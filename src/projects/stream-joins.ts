import {makeProject} from '@revideo/core';
import streamJoins from '../scenes/stream-joins?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [streamJoins],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
