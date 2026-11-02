import {defineConfig} from 'vite';
import motionCanvasModule from '@revideo/vite-plugin';

// The plugin is CommonJS; under native ESM the default import is the whole
// module object, so unwrap `.default` when present.
const motionCanvas: typeof motionCanvasModule =
  (motionCanvasModule as any).default ?? motionCanvasModule;

export default defineConfig({
  plugins: [motionCanvas({project: './src/projects/*.ts'})],
});
