import {makeProject} from '@revideo/core';
import gossipProtocols from '../scenes/gossip-protocols?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [gossipProtocols],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
