// Generates ONE image at a time for season 2 (images are expensive, so never batches).
//   node tools/gen-image.mjs identity                  -> season2/identity.png
//   node tools/gen-image.mjs room                      -> season2/room.png
// Prompts, and optional reference images, live in season2/zuri.json:
//   "anchor": { "prompt": "...", "refs": [{ "file": "season2/identity.png", "tag": "zuri" }] }
// Re-running a name keeps the previous result as <name>-prev.png. Reads the key from runway-key.txt.
import RunwayML from '@runwayml/sdk';
import { writeFileSync, readFileSync, existsSync, renameSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

for (const f of ['runway-key.txt', join(homedir(), 'runway-key.txt')]) {
  if (process.env.RUNWAYML_API_SECRET || !existsSync(f)) continue;
  const k = readFileSync(f, 'utf8').trim().replace(/^RUNWAYML_API_SECRET=/, '').trim();
  if (k && !k.includes('paste-your-key')) process.env.RUNWAYML_API_SECRET = k;
}
if (!process.env.RUNWAYML_API_SECRET) { console.log('No API key found in runway-key.txt'); process.exit(1); }

const cfg = JSON.parse(readFileSync('season2/zuri.json', 'utf8'));
const name = process.argv[2];
const spec = cfg.images[name];
if (!spec) { console.log(`usage: node tools/gen-image.mjs <${Object.keys(cfg.images).join('|')}>`); process.exit(1); }

// References must be under 5 MB, so send a 1080px JPEG copy of each.
const refUri = (file) => {
  const small = file.replace(/\.png$/i, '-ref.jpg');
  // Always rebuild the small copy so a re-generated source image is never stale.
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', file, '-vf', 'scale=1080:-2', '-q:v', '3', small]);
  return `data:image/jpeg;base64,${readFileSync(small).toString('base64')}`;
};

const client = new RunwayML();
const started = await client.textToImage.create({
  model: cfg.model, ratio: cfg.ratio, quality: cfg.quality, outputCount: 1,
  promptText: spec.prompt,
  ...(spec.refs ? { referenceImages: spec.refs.map((r) => ({ uri: refUri(r.file), tag: r.tag })) } : {}),
});
console.log(`${name}: task ${started.id} started (max ${started.estimatedCost?.credits ?? '?'} credits)`);
appendFileSync('season2/tasks.log', `${new Date().toISOString()} ${name} ${started.id} ${started.estimatedCost?.credits ?? '?'}\n`);
const task = await client.tasks.retrieve(started.id).waitForTaskOutput({ timeout: null });
const out = `season2/${spec.out || name}.png`;
if (existsSync(out)) renameSync(out, out.replace(/.png$/, '-prev.png'));
writeFileSync(out, Buffer.from(await (await fetch(task.output[0])).arrayBuffer()));
console.log(`saved ${out}`);
