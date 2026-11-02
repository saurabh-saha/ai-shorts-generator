import {makeProject} from '@revideo/core';
import streamProcessing from '../scenes/stream-processing?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [streamProcessing],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
