import {makeProject} from '@revideo/core';
import react07 from '../scenes/react-07-useeffect?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react07],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
