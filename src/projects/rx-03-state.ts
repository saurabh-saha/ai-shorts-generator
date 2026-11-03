import {makeProject} from '@revideo/core';
import rx03 from '../scenes/rx-03-state?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx03],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
