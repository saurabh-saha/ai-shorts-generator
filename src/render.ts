import {renderVideo} from '@revideo/renderer';

const name = process.argv[2] ?? 'rate-limiter';

const file = await renderVideo({
  projectFile: `./src/projects/${name}.ts`,
  settings: {
    outFile: `${name}.mp4`,
    outDir: './out',
    logProgress: true,
  },
});

console.log(`Rendered ${file}`);
