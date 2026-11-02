import {makeProject} from '@revideo/core';
import react21 from '../scenes/react-21-graphql?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [react21],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
