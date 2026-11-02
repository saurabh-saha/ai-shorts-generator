import {makeProject} from '@revideo/core';
import eventSourcing from '../scenes/event-sourcing?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [eventSourcing],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
