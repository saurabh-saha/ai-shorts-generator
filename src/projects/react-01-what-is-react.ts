import {makeProject} from '@revideo/core';
import react01 from '../scenes/react-01-what-is-react?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react01],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
