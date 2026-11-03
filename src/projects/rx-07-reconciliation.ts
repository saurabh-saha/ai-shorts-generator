import {makeProject} from '@revideo/core';
import rx07 from '../scenes/rx-07-reconciliation?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx07],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
