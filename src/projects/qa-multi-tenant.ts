import {makeProject} from '@revideo/core';
import qaMultiTenant from '../scenes/qa-multi-tenant?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [qaMultiTenant],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
