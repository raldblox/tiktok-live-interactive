// Generates the character concept images with the Runway API (images only).
//   1. Create an API key at dev.runwayml.com and paste it into runway-key.txt (or .env as RUNWAYML_API_SECRET=key)
//   2. node --env-file=.env tools/gen-concepts.mjs            -> 3 images each for A, B, C
//      node --env-file=.env tools/gen-concepts.mjs A 4        -> 4 images of concept A only
// Images are saved to concepts/<letter>-<n>.png
import RunwayML from '@runwayml/sdk';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// The key can also live in runway-key.txt, here or in your user folder (just the key, or RUNWAYML_API_SECRET=key).
for (const f of ['runway-key.txt', join(homedir(), 'runway-key.txt')]) {
  if (process.env.RUNWAYML_API_SECRET || !existsSync(f)) continue;
  const k = readFileSync(f, 'utf8').trim().replace(/^RUNWAYML_API_SECRET=/, '').trim();
  if (k && !k.includes('paste-your-key')) process.env.RUNWAYML_API_SECRET = k;
}
if (!process.env.RUNWAYML_API_SECRET) {
  console.log('No API key found. Put RUNWAYML_API_SECRET=... in a .env file and run with: node --env-file=.env tools/gen-concepts.mjs');
  process.exit(1);
}

const STYLE = 'A real cat with true feline anatomy: cat head with muzzle, cat nose and whiskers, fully covered in fur, four legs and paws, sitting like a cat. Not anthropomorphic, no human face, no human body. Stylized 3D game cinematic, legendary skin splash art quality, ultra detailed fur strands, subsurface scattering, volumetric lighting, glowing particle VFX, soft rim light, rich depth, Unreal Engine 5 render, masterpiece. No text, no watermark.';
const CONCEPTS = {
  A: 'An elegant, graceful magical cat sitting on a moonlit cliff, long silver-white fur fading to lavender tips, faint glowing constellation markings along her back, a floating crescent-moon circlet hovering above her head, a long flowing tail made of starry nebula mist, large opal-violet eyes, moonstone pendant on a fine silver chain, starfield sky.',
  B: 'An elegant, graceful magical cat sitting on a floating stone among drifting lanterns, cream fur with rose-gold and coral tips, a tail ending in soft spirit-flame wisps shedding glowing petals, a golden lotus ornament on her forehead, warm amber eyes, twilight sky.',
  C: 'An elegant, graceful magical cat sitting on a still jade lake at dawn, pale jade-white fur, mist flowing from her paws and tail like curling water, jade and pearl ornaments, teal eyes with ripple reflections, soft fog.',
};

// Photoreal film concepts: real breeds, real places, real camera language. Each overrides STYLE.
const PHOTO = 'Photograph, a candid frame from a feature film. Shot on ARRI Alexa 65 with a vintage anamorphic lens at f/1.8, natural motivated lighting, shallow depth of field, gentle film grain, cinematic color grade, 8K, every individual fur strand and whisker resolved, true-to-life cat anatomy and proportions, realistic wet eye reflections, natural relaxed pose. Not CGI, not 3D render, not illustration, no text, no watermark.';
const PHOTO_CONCEPTS = {
  D: 'A silver long-haired Siberian cat with pale blue eyes sitting on a rain-streaked windowsill of a small Tokyo apartment at night, neon signs and city lights blurred into bokeh through the wet glass, a warm desk lamp lighting one side of her face, steam rising from a mug beside her.',
  E: 'A sleek black cat with deep amber eyes sitting on the zinc rooftop of an old European apartment building at blue hour, chimneys and warm lit windows behind her, soft mist over the city, last light of dusk catching the edge of her fur.',
  F: 'A cream-white long-haired Ragdoll cat with sapphire eyes sitting on the wooden veranda of a traditional Japanese ryokan in winter, heavy snow falling softly over a garden with stone lanterns, warm paper-screen light glowing behind her, a few snowflakes on her fur.',
};
for (const [k, v] of Object.entries(PHOTO_CONCEPTS)) CONCEPTS[k] = v;
const styleFor = (letter) => (PHOTO_CONCEPTS[letter] ? PHOTO : STYLE);

const [only, countArg] = process.argv.slice(2);
const letters = only ? [only.toUpperCase()] : Object.keys(CONCEPTS);
const count = Number(countArg) || 3;
const client = new RunwayML();
mkdirSync('concepts', { recursive: true });

for (const letter of letters) {
  for (let i = 1; i <= count; i++) {
    const promptText = `${CONCEPTS[letter]} ${styleFor(letter)}`;
    process.stdout.write(`${letter}-${i}: generating... `);
    try {
      const task = await client.textToImage
        .create({ model: 'gen4_image', promptText, ratio: '1080:1920' })
        .waitForTaskOutput();
      const res = await fetch(task.output[0]);
      const file = `concepts/${letter}-${i}.png`;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`saved ${file}`);
    } catch (e) {
      console.log(`failed: ${e.message}`);
    }
  }
}
