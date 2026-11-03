import {makeProject} from '@revideo/core';
import rx01 from '../scenes/rx-01-screen-is-data?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx01],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
