import {makeProject} from '@revideo/core';
import rx02 from '../scenes/rx-02-components-tree?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx02],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
