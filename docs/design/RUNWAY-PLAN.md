# Runway plan: Noct, the chaos cat

**The idea:** one perfect still image of Noct in the apartment. Every clip starts from that same image, so the cat, room and lighting match. The overlay fades between the idle loop and each action, so the cuts don't show.

**The rule that saves credits:** images are cheap and videos are expensive. Get the still perfect first. Test each clip at 5 seconds on the cheaper Turbo model, and only render the final once the test is funny.

---

## Step 1: The hero still (images only, take your time)

Generate at **9:16**:

> Cinematic photoreal still, 9:16. A sleek black cat with glowing amber eyes and a thin dark red collar with a small gold bell sits on a warm wooden floor in a cozy dim apartment at night, lower middle of the frame, facing the camera with a slightly judgmental expression. Behind it, a large arched window with rain and blurred city lights. On the right, a small round wooden side table with a white ceramic mug near the edge. On the left, a potted plant in a terracotta pot and the arm of a worn velvet couch. Warm lamp light from the right, moody, shallow depth of field, 35mm film look. The top half of the frame is calm: dark wall and window only.

**Check before moving on:**
- the cat sits in the **lower middle**
- the top half is quiet, because the overlay panels go there
- the mug is clearly on the table, the plant and couch arm are visible
- the eyes look great, because they're the brand

Also crop a square of the cat's face from this still and use it as the **TikTok profile picture**.

## Step 2: The clips (image-to-video, hero still as the first frame)

Add to every prompt: *"Static locked-off camera. Same room, same lighting. Ends with the cat sitting back in its original spot."*

Make them in this order; the first 5 are enough to go live:

| # | File name | Gift | Motion prompt |
|---|---|---|---|
| 1 | `idle` (10s) | always playing | The cat sits calmly, breathes, slow blink, ears twitch, tail tip flicks. Only the rain on the window moves. |
| 2 | `cup` | Rose | The cat stares into the camera, slowly reaches out a paw and deliberately pushes the mug off the edge of the table; the mug falls to the floor. The cat looks back at the camera, completely unbothered. |
| 3 | `scratch` | Finger Heart | The cat walks to the couch arm on the left and scratches it aggressively with both front paws, fabric fraying, then walks back. |
| 4 | `zoomies` | Doughnut, and the Team Chaos win | The cat suddenly sprints wildly back and forth across the room in a frenzy, skidding on the wooden floor, then stops abruptly and sits back down looking innocent. |
| 5 | `blink` | Heart Me, treat jar | The cat looks straight into the camera and gives a long, slow, loving blink, then another. |
| 6 | `plant` | Perfume | The cat crouches, wiggles its back end, pounces on the potted plant and attacks the leaves, then trots back. |
| 7 | `hiss` | GG | The cat suddenly arches its back, fur puffed up, ears flat, and hisses at an empty corner at absolutely nothing, then relaxes. |
| 8 | `biscuits` | Ice Cream Cone | The cat lies on the rug and kneads it rhythmically with its front paws, eyes half closed, content. |
| 9 | `look` | chat "pspsps" | The cat's ears perk up; it turns and stares straight into the camera with wide curious pupils, leaning closer. |
| 10–13 | `groom`, `yawn`, `tail`, `stare` | random idle life | Licks a paw and washes its face / big dramatic yawn / tail swishing annoyed / stares at the camera without blinking. |

**Dreams.** Make an image first, then animate it slowly as a 10-second loop:

> the same black cat curled up asleep, softly glowing, floating gently inside [a giant sleeping whale's glowing ribcage / a rain cloud / a crystal cave on the moon / beside a campfire on a floating island], dreamy, cinematic

Save these as `whale`, `cloud`, `crystal` and `island`. If Runway offers it, add the hero still as a **character reference** so Noct looks the same.

## Step 3: Drop them in (free)

```bash
node prep-clip.mjs cat Downloads/noct-idle.mp4 idle
node prep-clip.mjs cat Downloads/noct-cup.mp4 cup
node prep-clip.mjs place Downloads/noct-whale.mp4 whale
```

- Use the file names from the tables above.
- `idle` and the dream places become seamless loops. Every other clip plays once.
- Each clip replaces the drawn placeholder for that action automatically. You can go live with only some clips done, and the rest keep using the drawn cat.
- Reload the overlay to see them: in OBS, right-click the source → Refresh.

## What it costs

- **To go live:** 5 clips (idle, cup, scratch, zoomies, blink), plus about 5 short tests.
- **Later:** add 2–3 clips a week. A new action is also a reason to post: *"new gift: make Noct attack the plant"*.

## Making it funnier over time (free)

- Read the damage bill out loud. Take the blame: "who keeps buying Noct roses??"
- Hold a weekly "Chaos vs Nap" final: the losing team's top gifter gets roasted on stream.
- Clip the best cup knocks and post them as TikToks with the gifter's name: "maria_23's cup did not survive". It brings people back to the LIVE.
