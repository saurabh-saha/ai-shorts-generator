import {makeProject} from '@revideo/core';
import react30 from '../scenes/react-30-native?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react30],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
