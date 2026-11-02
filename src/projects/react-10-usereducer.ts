import {makeProject} from '@revideo/core';
import react10 from '../scenes/react-10-usereducer?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react10],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
