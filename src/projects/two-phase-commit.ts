import {makeProject} from '@revideo/core';
import twoPhaseCommit from '../scenes/two-phase-commit?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [twoPhaseCommit],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
