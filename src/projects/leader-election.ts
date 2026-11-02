import {makeProject} from '@revideo/core';
import leaderElection from '../scenes/leader-election?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [leaderElection],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
