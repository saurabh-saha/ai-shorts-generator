import {makeProject} from '@revideo/core';
import deliveryGuarantees from '../scenes/delivery-guarantees?scene';

// Vertical 9:16 for YouTube Shorts.
export default makeProject({
  scenes: [deliveryGuarantees],
  settings: {
    shared: {
      size: {x: 1080, y: 1920},
    },
  },
});
