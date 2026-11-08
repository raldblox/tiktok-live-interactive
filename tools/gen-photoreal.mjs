// Candid, film-still photoreal cat concepts with Runway's gemini_image3_pro (images only).
//   node tools/gen-photoreal.mjs          -> one image each of D2, E2, F2
//   node tools/gen-photoreal.mjs E2 3     -> three images of E2
// Reads the API key the same way as gen-concepts.mjs (runway-key.txt in your user folder).
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

// What makes it read as real footage: candid action, off-center framing, real film stock, small imperfections.
const LOOK = 'A still frame from a feature film, 35mm, Kodak Vision3 500T film stock, natural motivated light, documentary realism, shallow depth of field, soft film grain, slight imperfections, off-center composition, the cat is not posing and not looking at the camera. True-to-life cat anatomy, every fur strand and whisker resolved, realistic wet eye reflections. Not CGI, not 3D, not illustration, no text, no watermark.';
const SHOTS = {
  D2: 'A silver long-haired Siberian cat on the windowsill of a small cluttered Tokyo apartment at night, seen from slightly behind and to the side, gazing out at the rain; neon signs and city lights blur into bokeh through the wet glass, a warm desk lamp rim-lights her fur, a half-drunk coffee, headphones and paperback books on the desk, her tail tip caught mid-flick with slight motion blur.',
  E2: 'A sleek black cat caught mid-step walking along the edge of an old zinc rooftop in a European city at blue hour, looking away toward the warm lit windows, low camera angle, light drizzle making the zinc glisten, chimneys and mist behind her, wind lifting the fur on her back, telephoto compression.',
  F2: 'A cream-white long-haired Ragdoll cat on the wooden veranda of a traditional Japanese ryokan in winter, one paw raised batting at a falling snowflake, seen from inside the room through a half-open shoji door with the blurred paper edge in the foreground, warm interior light spilling onto the snowy garden, stone lanterns softly glowing.',
};

const [only, countArg] = process.argv.slice(2);
const keys = only ? [only.toUpperCase()] : Object.keys(SHOTS);
const count = Number(countArg) || 1;
const client = new RunwayML();
mkdirSync('concepts', { recursive: true });

for (const key of keys) {
  for (let i = 1; i <= count; i++) {
    process.stdout.write(`${key}-${i}: generating... `);
    try {
      const task = await client.textToImage
        .create({ model: 'gemini_image3_pro', promptText: `${SHOTS[key]} ${LOOK}`, ratio: '1536:2752' })
        .waitForTaskOutput();
      const res = await fetch(task.output[0]);
      const file = `concepts/${key}-${i}.png`;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`saved ${file}`);
    } catch (e) {
      console.log(`failed: ${e.message}`);
    }
  }
}
