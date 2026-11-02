import {makeProject} from '@revideo/core';
import outboxPattern from '../scenes/outbox-pattern?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [outboxPattern],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
