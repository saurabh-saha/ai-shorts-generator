import {makeProject} from '@revideo/core';
import kafkaBasics from '../scenes/kafka-basics?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [kafkaBasics],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
