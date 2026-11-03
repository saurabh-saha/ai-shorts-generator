import {makeProject} from '@revideo/core';
import js03 from '../scenes/js-03-async-await?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [js03],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
