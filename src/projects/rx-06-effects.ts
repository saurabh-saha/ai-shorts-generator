import {makeProject} from '@revideo/core';
import rx06 from '../scenes/rx-06-effects?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx06],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
