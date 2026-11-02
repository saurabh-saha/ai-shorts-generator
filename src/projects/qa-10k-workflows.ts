import {makeProject} from '@revideo/core';
import qa10kWorkflows from '../scenes/qa-10k-workflows?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [qa10kWorkflows],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
