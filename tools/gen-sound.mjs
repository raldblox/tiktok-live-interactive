// Generates Latte's sounds (lo-fi bed, room ambience, one effect per clip) with Runway's ElevenLabs sound model.
//   node tools/gen-sound.mjs yawn               -> one sound (prints its real credit cost)
//   node tools/gen-sound.mjs lofi,ambience      -> several
//   node tools/gen-sound.mjs all                -> everything in sounds.json
//   node tools/gen-sound.mjs fetch <taskId> <name>  -> download an already-finished task (no new charge)
// Saves to public/sounds/<name>.mp3. Task IDs are logged to public/sounds/tasks.log.
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

const cfg = JSON.parse(readFileSync('tools/sounds.json', 'utf8'));
const client = new RunwayML();
mkdirSync(cfg.outDir, { recursive: true });

const save = async (name, outUrl) => {
  const file = `${cfg.outDir}/${name}.mp3`;
  writeFileSync(file, Buffer.from(await (await fetch(outUrl)).arrayBuffer()));
  console.log(`saved ${file}`);
};

if (process.argv[2] === 'fetch') {
  const [, , , id, name] = process.argv;
  const t = await client.tasks.retrieve(id);
  if (t.status !== 'SUCCEEDED') { console.log(`task ${id} is ${t.status}`); process.exit(1); }
  await save(name, t.output[0]);
  process.exit(0);
}

const arg = process.argv[2];
if (!arg) { console.log('usage: node tools/gen-sound.mjs <name[,name]|all>'); process.exit(1); }
const names = arg === 'all' ? Object.keys(cfg.sounds) : arg.split(',');

let total = 0;
for (const name of names) {
  const s = cfg.sounds[name];
  if (!s) { console.log(`no sound named "${name}"`); continue; }
  try {
    const started = await client.soundEffect.create({ model: cfg.model, promptText: s.prompt, duration: s.seconds, loop: !!s.loop });
    total += started.estimatedCost?.credits ?? 0;
    appendFileSync(`${cfg.outDir}/tasks.log`, `${new Date().toISOString()} ${name} ${started.id}\n`);
    console.log(`${name}: task ${started.id} started (max ${started.estimatedCost?.credits ?? '?'} credits)`);
    const t = await client.tasks.retrieve(started.id).waitForTaskOutput({ timeout: null });
    await save(name, t.output[0]);
  } catch (e) {
    console.log(`${name} failed: ${e.message}`);
  }
}
console.log(`Total charged up to ${total} credits`);
