import {makeProject} from '@revideo/core';
import loadBalancer from '../scenes/load-balancer?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [loadBalancer],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
