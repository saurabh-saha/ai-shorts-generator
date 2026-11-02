import {makeProject} from '@revideo/core';
import qaPlannerWorkers from '../scenes/qa-planner-workers?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [qaPlannerWorkers],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
