// Generates Latte's video clips with Seedance 2.5, starting AND ending on the idle anchor frame.
//   node tools/gen-video.mjs loop 480p              -> one clip, prints the credit cost first
//   node tools/gen-video.mjs loop,feather 480p      -> several clips
//   node tools/gen-video.mjs fetch <taskId> <name>  -> download an already-finished task (no new charge)
// Every task ID is logged to videos/tasks.log as soon as it starts.
// Saves to videos/<clip>-<res>.mp4. Reads the key from runway-key.txt in your user folder.
// Season 2:  CLIPS=season2/clips.json node tools/gen-video.mjs blink,chat 720p
//   (that config sets its own anchor, outDir, audio: true and a shared "world" block for every prompt)
import RunwayML from '@runwayml/sdk';
import { mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

for (const f of ['runway-key.txt', join(homedir(), 'runway-key.txt')]) {
  if (process.env.RUNWAYML_API_SECRET || !existsSync(f)) continue;
  const k = readFileSync(f, 'utf8').trim().replace(/^RUNWAYML_API_SECRET=/, '').trim();
  if (k && !k.includes('paste-your-key')) process.env.RUNWAYML_API_SECRET = k;
}
if (!process.env.RUNWAYML_API_SECRET) { console.log('No API key found in runway-key.txt'); process.exit(1); }

const client = new RunwayML();
const cfg = JSON.parse(readFileSync(process.env.CLIPS || 'tools/clips.json', 'utf8'));
const outDir = cfg.outDir || 'videos';
mkdirSync(outDir, { recursive: true });

// Recover a finished task by ID without paying again:  node tools/gen-video.mjs fetch <taskId> <clip-name>
if (process.argv[2] === 'fetch') {
  const [, , , id, name = 'recovered'] = process.argv;
  const t = await client.tasks.retrieve(id);
  if (t.status !== 'SUCCEEDED') { console.log(`task ${id} is ${t.status}`); process.exit(1); }
  const file = `${outDir}/${name}.mp4`;
  writeFileSync(file, Buffer.from(await (await fetch(t.output[0])).arrayBuffer()));
  console.log(`saved ${file}`);
  process.exit(0);
}

const [namesArg, res = '480p'] = process.argv.slice(2);
if (!namesArg || !cfg.ratios[res]) { console.log('usage: node tools/gen-video.mjs <clip[,clip]> <480p|720p|1080p>'); process.exit(1); }
const names = namesArg.split(',');
// Keyframes: every clip starts and ends on the anchor unless it names its own "first"/"last" image
// (the leave-on modes: enter = anchor -> mode pose, loop = mode pose -> mode pose, exit = mode pose -> anchor).
const frame = (f) => `data:image/jpeg;base64,${readFileSync(f || cfg.anchor).toString('base64')}`;

const cost = (s) => Math.max(cfg.minCredits, s * cfg.creditsPerSecond[res]);
const total = names.reduce((t, n) => t + cost(cfg.clips[n]?.seconds ?? 0), 0);
console.log(`Estimated cost: ${total} credits for ${names.join(', ')} at ${res}`);
const balance = async () => (await client.organization.retrieve()).creditBalance;
const before = await balance();
console.log(`Credit balance before: ${before}`);

// Runway allows only 2 Seedance renders at a time on this account, so run at most 2 at once.
const MAX_AT_ONCE = 2;
const queue = [...names];
const work = async (name) => {
  const clip = cfg.clips[name];
  if (!clip) { console.log(`no clip named "${name}"`); return; }
  try {
    const started = await client.imageToVideo.create({
      model: cfg.model,
      promptImage: [{ uri: frame(clip.first), position: 'first' }, { uri: frame(clip.last), position: 'last' }],
      promptText: [clip.prompt, clip.world ?? cfg.world, clip.style ?? cfg.style].filter(Boolean).join(' '),
      ratio: cfg.ratios[res],
      duration: clip.seconds,
      audio: cfg.audio ?? false,
    });
    // Log the task ID right away, so a slow render can always be recovered with "fetch".
    appendFileSync(`${outDir}/tasks.log`, `${new Date().toISOString()} ${name} ${res} ${started.id}
`);
    console.log(`${name}: task ${started.id} started (API estimate: ${started.estimatedCost?.credits ?? '?'} credits)`);
    const task = await client.tasks.retrieve(started.id).waitForTaskOutput({ timeout: null });
    const file = `${outDir}/${name}-${res}.mp4`;
    writeFileSync(file, Buffer.from(await (await fetch(task.output[0])).arrayBuffer()));
    console.log(`saved ${file}`);
  } catch (e) {
    console.log(`${name} failed: ${e.message}`);
  }
};
await Promise.all(Array.from({ length: MAX_AT_ONCE }, async () => {
  while (queue.length) await work(queue.shift());
}));
const after = await balance();
console.log(`Credit balance after: ${after} (this run cost ${before - after} credits)`);
