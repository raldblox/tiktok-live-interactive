// Generates kitten character images from kittens.json with Runway's flagship image model (images only).
//   node tools/gen-kittens.mjs              -> 2 images of every prompt in kittens.json
//   node tools/gen-kittens.mjs mochi 3      -> 3 images of "mochi"
// Saves to concepts/kittens/<name>-<n>.png. Reads the key from runway-key.txt in your user folder.
import RunwayML from '@runwayml/sdk';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

for (const f of ['runway-key.txt', join(homedir(), 'runway-key.txt')]) {
  if (process.env.RUNWAYML_API_SECRET || !existsSync(f)) continue;
  const k = readFileSync(f, 'utf8').trim().replace(/^RUNWAYML_API_SECRET=/, '').trim();
  if (k && !k.includes('paste-your-key')) process.env.RUNWAYML_API_SECRET = k;
}
if (!process.env.RUNWAYML_API_SECRET) { console.log('No API key found in runway-key.txt'); process.exit(1); }

const cfg = JSON.parse(readFileSync('tools/kittens.json', 'utf8'));
const [only, countArg] = process.argv.slice(2);
const names = only ? [only] : Object.keys(cfg.prompts);
const count = Number(countArg) || 2;
const client = new RunwayML();
mkdirSync('concepts/kittens', { recursive: true });

await Promise.all(names.map(async (name) => {
  if (!cfg.prompts[name]) { console.log(`no prompt named "${name}"`); return; }
  try {
    // One request returns all images for this prompt.
    const task = await client.textToImage
      .create({ model: cfg.model, promptText: cfg.prompts[name], ratio: cfg.ratio, quality: cfg.quality, outputCount: count })
      .waitForTaskOutput();
    for (const [i, url] of task.output.entries()) {
      const res = await fetch(url);
      const file = `concepts/kittens/${name}-${i + 1}.png`;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`saved ${file}`);
    }
  } catch (e) {
    console.log(`${name} failed: ${e.message}`);
  }
}));
