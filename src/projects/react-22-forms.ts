import {makeProject} from '@revideo/core';
import react22 from '../scenes/react-22-forms?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react22],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
