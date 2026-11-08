// Generates Latte's scenes, using her master image as a reference so she stays the same kitten.
//   node tools/gen-scenes.mjs              -> 2 images of every scene in character/latte.json
//   node tools/gen-scenes.mjs cafe 3       -> 3 images of the café scene
// Saves to scenes/<name>-<n>.png. Reads the key from runway-key.txt in your user folder.
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

const cfg = JSON.parse(readFileSync('character/latte.json', 'utf8'));
// A scene is either a prompt string or { prompt, ref } to use a different reference image.
const refUri = (file) => `data:image/jpeg;base64,${readFileSync(file).toString('base64')}`;
const [only, countArg] = process.argv.slice(2);
const names = only ? [only] : Object.keys(cfg.scenes).filter((n) => typeof cfg.scenes[n] === 'string');
const count = Number(countArg) || 2;
const client = new RunwayML();
mkdirSync('scenes', { recursive: true });

await Promise.all(names.map(async (name) => {
  if (!cfg.scenes[name]) { console.log(`no scene named "${name}"`); return; }
  try {
    const task = await client.textToImage.create({
      model: cfg.model, ratio: cfg.ratio, quality: cfg.quality, outputCount: count,
      promptText: `${cfg.scenes[name].prompt ?? cfg.scenes[name]} ${cfg.lock}`,
      referenceImages: [{ uri: refUri(cfg.scenes[name].ref ?? cfg.reference.file), tag: cfg.reference.tag }],
    }).waitForTaskOutput();
    for (const [i, url] of task.output.entries()) {
      const res = await fetch(url);
      const file = `scenes/${name}-${i + 1}.png`;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`saved ${file}`);
    }
  } catch (e) {
    console.log(`${name} failed: ${e.message}`);
  }
}));
