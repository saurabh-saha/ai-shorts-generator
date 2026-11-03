import {makeProject} from '@revideo/core';
import rx04 from '../scenes/rx-04-how-react-draws?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [rx04],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
