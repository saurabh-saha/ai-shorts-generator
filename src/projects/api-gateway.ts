import {makeProject} from '@revideo/core';
import apiGateway from '../scenes/api-gateway?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [apiGateway],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
