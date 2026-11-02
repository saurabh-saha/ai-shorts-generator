import {makeProject} from '@revideo/core';
import cqrs from '../scenes/cqrs?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [cqrs],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
