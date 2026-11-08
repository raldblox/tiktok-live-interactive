// Turns raw Runway downloads into files the overlay can use. Needs ffmpeg.
//
//   node tools/prep-clip.mjs cat   <runway.mp4> <name>   -> public/cat/<name>.mp4    (idle = seamless loop; cup, scratch,
//                                                                            zoomies... = one-shot action clips)
//   node tools/prep-clip.mjs place <runway.mp4> <id>     -> public/places/<id>.mp4   (seamless 1080x1920 loop)
//   node tools/prep-clip.mjs lumo  <runway.mp4> [color]  -> public/lumo/idle.webm    (transparent, keyed from a solid
//                                                                            background; color defaults to 0x00FF00)
//
// Place ids: home, whale, cloud, crystal, island (see travel.json).
import { spawnSync } from 'child_process';
import { mkdirSync } from 'fs';

const [mode, input, arg] = process.argv.slice(2);
if (!mode || !input) {
  console.log('usage: node tools/prep-clip.mjs place <in.mp4> <id>  |  node tools/prep-clip.mjs lumo <in.mp4> [keyColor]');
  process.exit(1);
}

const run = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
};
const duration = () => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input], { encoding: 'utf8' });
  return parseFloat(r.stdout);
};
// Fill a 1080x1920 frame whatever Runway's aspect ratio was.
const fit = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1';

function seamlessLoop(out) {
  const d = duration();
  // Crossfade the clip's end into its own start so the loop point is invisible
  // (works for rain/bubbles/fire, unlike playing the clip backwards).
  const f = Math.min(1.5, d / 4);
  run(['-i', input, '-filter_complex',
    `[0:v]${fit},fps=30,split[a][b];[a]trim=0:${f},setpts=PTS-STARTPTS[head];[b]trim=${f}:${d},setpts=PTS-STARTPTS[body];` +
    `[body][head]xfade=transition=fade:duration=${f}:offset=${(d - 2 * f).toFixed(3)},format=yuv420p[v]`,
    '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out]);
  console.log(`saved ${out} (${(d - f).toFixed(1)}s seamless loop)`);
}

if (mode === 'place') {
  if (!arg) { console.log('give the place id, e.g. whale'); process.exit(1); }
  mkdirSync('public/places', { recursive: true });
  seamlessLoop(`public/places/${arg}.mp4`);
} else if (mode === 'cat') {
  if (!arg) { console.log('give the clip name, e.g. idle, cup, scratch, zoomies'); process.exit(1); }
  mkdirSync('public/cat', { recursive: true });
  if (arg === 'idle') seamlessLoop('public/cat/idle.mp4');
  else {
    run(['-i', input, '-vf', `${fit},fps=30,format=yuv420p`, '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', `public/cat/${arg}.mp4`]);
    console.log(`saved public/cat/${arg}.mp4`);
  }
} else if (mode === 'lumo') {
  mkdirSync('public/lumo', { recursive: true });
  const color = arg || '0x00FF00';
  run(['-i', input, '-vf', `chromakey=${color}:0.16:0.08,despill=type=green,scale=720:-2,format=yuva420p`,
    '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '0', '-crf', '28', 'public/lumo/idle.webm']);
  console.log('saved public/lumo/idle.webm (transparent). The overlay uses it automatically on next load.');
} else {
  console.log('mode must be "cat", "place" or "lumo"');
  process.exit(1);
}
