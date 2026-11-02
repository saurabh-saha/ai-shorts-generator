import {makeProject} from '@revideo/core';
import consumerGroups from '../scenes/consumer-groups?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [consumerGroups],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
