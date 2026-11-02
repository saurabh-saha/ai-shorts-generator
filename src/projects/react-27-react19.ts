import {makeProject} from '@revideo/core';
import react27 from '../scenes/react-27-react19?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react27],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
