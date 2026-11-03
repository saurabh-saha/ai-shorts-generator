import {makeProject} from '@revideo/core';
import js01 from '../scenes/js-01-event-loop?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js01],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
