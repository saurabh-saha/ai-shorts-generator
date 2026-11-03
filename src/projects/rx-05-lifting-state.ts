import {makeProject} from '@revideo/core';
import rx05 from '../scenes/rx-05-lifting-state?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx05],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
