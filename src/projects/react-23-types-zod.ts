import {makeProject} from '@revideo/core';
import react23 from '../scenes/react-23-types-zod?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react23],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
