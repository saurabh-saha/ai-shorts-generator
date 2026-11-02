import {makeProject} from '@revideo/core';
import changeDataCapture from '../scenes/change-data-capture?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [changeDataCapture],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
