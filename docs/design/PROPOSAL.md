# Season 2 proposal: start over, done right

**Status:** nothing generated yet. This is the plan to approve first.

**Rules for this build:**
- One image at a time, never sample sets.
- Final quality only.
- Every video generated **with sound on**.

---

## 1. What we learned from season 1 (and the fix for each)

| Mistake | Fix this time |
|---|---|
| The room made no physical sense: the neon sign floated where a wall corner should be, and mirror, desk and window didn't connect | Build the **empty room first** as a real floor plan with a visible corner, then put the cat in it |
| Everything happened on one bed, so she could never *go* anywhere | The room has **4 reachable zones** placed for future animations (window seat, mirror, cat tree, home cushion) |
| A plain breed with no "wow" or story | One of the **world's rarest, most expensive cats**: a reason to stop scrolling |
| Mug steam that made no sense | **No hot drinks in the room.** Nothing that could steam |
| A feather wand lying on the bed in every frame | **No feather wand or loose toys in the base image.** Clean floor and pouf |
| Rain looked like water on the inside of the glass | Rain is described only as falling **outside, far away**; we never mention the glass being wet |
| Objects faded away (the bills on the bed) | **Rule:** anything that appears must leave the frame, be eaten, or be taken away by the off-screen hand |
| The outfit was baked into her reference photo | The identity reference is the cat only, with no clothes and no accessories except a thin collar |
| Cheap test renders wasted credits | Final 720p only, with the prompt reviewed carefully before spending |
| Silent clips, then separately generated sounds that clashed | **Native sound on every clip** (Seedance generates audio matched to the motion), plus the lo-fi bed you liked |
| Viewers left within seconds | **Hooks:** greet joiners by name, instant reactions to likes, a clear "tap to play" prompt (section 7) |

---

## 2. The cat: Savannah F1 (chosen)
- **What she is:** a first-generation cross between a serval and a domestic cat. The most famous "most expensive cat", often sold for $10,000–$20,000.
- **Look to lock:**
  - a slim, long-legged young female, about 6 months old
  - a warm golden coat with **bold black oval spots**
  - **huge tall ears** with white "eye spots" on the backs
  - black "tear lines" from her eyes
  - amber-gold eyes
  - a ringed tail with a black tip
  - a thin cognac-leather collar with a tiny gold tag
- **Personality:** a wild little queen. Athletic, curious, loves heights and watching everything; cheeky, not cuddly-sweet.
- **Name:** **Zuri** (Swahili for "beautiful"). Easy to say, fits her savanna roots. Open to change.
- **Consistency risk:** spots are hard for AI to keep identical. The identity image becomes the reference for every generation, and every prompt says "the exact same spot pattern as the reference". Small spot drift is acceptable; changes to her face or ears are not.

## 3. The room: Zuri's custom-built cat suite
**Everything is made for her.** This isn't a human apartment with cat stuff added: it's a luxury suite designed around one cat, with custom walnut furniture at her scale and her name on it. **One camera, never moving.** Vertical 9:16, at her eye level, looking into the **corner** of the suite at night.

```
            LEFT WALL                    |        CORNER         |              RIGHT WALL
  [ cat-height mirror cabinet ]  [neon "Zuri"]  [ built-in climbing wall + lookout pod ]  [ big window + custom window perch ]
                    \_________ round jute rug + custom walnut throne bed "ZURI" (HOME SPOT, center front) _________/
```

| Zone | Custom piece | What it's for |
|---|---|---|
| **A. Home throne** | Center foreground on a round jute rug: a low **walnut cat throne bed** sized for her, a cream bouclé cushion, **"ZURI" in small brass letters** on the front edge | The **anchor pose**: she sits here facing the camera. Every clip starts and ends here |
| **B. Window perch** | Right wall: a built-in **walnut window perch** with a cushioned lounger and a two-step ramp from the floor, under a large black-framed window. A small planter of **cat grass** sits at one end | She hops up to watch the night city and the rain outside |
| **C. Mirror cabinet** | Left wall: a low walnut cabinet with a **wide mirror at her eye height** (built for a cat, not a person) | She stalks over, studies her reflection, paws it once |
| **D. Climbing wall** | **In the corner:** a built-in system of staggered walnut steps, a sisal-wrapped pillar, a curved canvas hammock, and at the top a round **lookout pod** with a porthole | She bounds up, lounges in the hammock or sits in the pod surveying her kingdom, then leaps down |
| **E. Cat TV** | An **Apple HomeView** in rose pink (released Oct 2026): a 7-inch square touchscreen floating on a domed aluminum base, on the mirror cabinet, showing a savanna sunset | Used by the GG gift and future "cat TV" moments |
| **Easter egg** | A small gold-framed oil painting of a Savannah cat on the left wall, with a tiny, barely visible signature **"Reaper Pro Max"** in its corner | Our hidden maker's mark: only sharp-eyed viewers spot it |
| Luxury details | Sculptural brass floor lamp, fluted travertine side table with a crystal bowl, white orchids, art books, cognac leather cat carrier, olive tree, monstera | Shows she's a rich, pampered cat, with no brand logos |
| Neon sign | Flat **on the left wall**, above the mirror cabinet | "Zuri" in warm amber script |
| Style | Warm walnut, rattan, jute, cream bouclé, brass details, terracotta pots, big leafy plants (monstera, olive tree) | Safari-luxe, matches her golden spotted coat |
| Lights | A warm paper floor lamp, the amber neon glow, cool city light through the window | Night mood with real light sources |

**Framing rules:**
- The **top third stays calm** (wall, upper window frame and the top shelves only), because the overlay sits there.
- All zones are **fully inside the frame**, with clear floor between them so leaps and walks make physical sense.
- **Nothing hot, nothing wet** inside the room.
- **No feather wand and no loose toys** in the base image. Rug, pouf and floor stay clear. Any toy only enters a clip from off-screen and leaves again.

## 4. Idle moments (no gifts)

Every clip starts and ends on the anchor (Zuri on the pouf), with native sound. Durations are in seconds.

| # | Moment | Zone | s | What happens | Sound |
|---|---|---|---|---|---|
| 1 | Slow blink | Home | 5 | She breathes, gives two slow blinks at the camera (cat for "I love you"), one ear flicks | Soft purr |
| 2 | Paw-wash | Home | 7 | She licks a paw and washes her face and ear | Gentle licking |
| 3 | Big stretch | Home | 6 | She stands, does a long front stretch with her toes spread, then sits again | Soft breathy yawn |
| 4 | Reading chat | Home | 6 | She leans toward the camera with curious eyes, tilts her head left then right | Curious little "mrrp?" |
| 5 | Rain watch | Window | 10 | She hops onto the window seat, watches the rain with her tail swaying, then hops back | Rain outside, a happy chirp |
| 6 | Mirror princess | Mirror | 10 | She walks to the mirror, tilts her head at her reflection, taps the glass once, then struts back | Soft paw tap, a pleased trill |
| 7 | Queen of the wall | Climbing wall | 10 | She bounds up the floating shelves to the top, surveys the room like a leopard on a branch, then leaps down and returns | Soft paw thumps on wood, a landing |
| 8 | Making biscuits | Home | 6 | She kneads the velvet pouf with her front paws, eyes half closed | Purring |

**Mood-based moments** (these extend your existing mood system):

| # | Moment | Mood | s | What happens |
|---|---|---|---|---|
| 9 | Dozing off | Sleepy | 8 | Her head slowly nods, her eyes close, she jolts awake and looks around, embarrassed |
| 10 | Ignored sigh | Ignored | 8 | She lies down with her chin on her paws, looks up at the camera with big sad eyes, sighs, then sits back up |
| 11 | Bird at window | Excited | 8 | She spots a bird outside the window, chatters at it with a twitching tail, it flies off, she returns |

---

## 5. Gift actions

| Gift | Coins | Action | s | Loop-safe because |
|---|---|---|---|---|
| **Rose** | 1 | A hand offers a rose. She sniffs it and rubs her cheek on it lovingly, then the hand takes it back | 6 | The hand removes it |
| **GG** | 1 | Her cat TV lights up "GG" with confetti on screen. She trots over, taps the screen with a paw, does a proud sit, struts back | 8 | Only the screen changes, and it returns to normal |
| **Overreact** | small | Soap-opera shock: jaw drops, she flops dramatically onto the rug, peeks with one eye, gets up offended | 7 | Only she moves |
| **Money Gun** | 500 | Loose bills spray across the room from off-screen. She leaps and catches one mid-air in her mouth, then trots off-screen-right and comes back without it, proud | 8 | The bill leaves the frame with her; the rest fly out of frame |
| **Galaxy** | 1000 | The room fills with stars from a galaxy projector, her eyes reflect the stars, a shooting star crosses, she leaps up to swat at it, the stars fade | 8 | The light returns to normal |

**Optional extras later:**
- **Doughnut:** a hand gives her a treat and she eats it (gone because she ate it).
- **Finger Heart:** a nose "boop" right up to the lens.

**Please check the exact gift names in your gift panel**, especially "Overreact".

---

## 5b. Video plan (anchor approved)

**The rain is a character too.** The anchor shows pouring rain over the city, so it has to behave like real rain in **every** clip, not only the window one.

**Rain rules (one fixed block pasted into every clip prompt):**
1. Heavy rain keeps falling outside the window for the whole clip: the same density, direction and speed from the first frame to the last. It never pauses, speeds up or freezes.
2. The rain stays outside: the pane looks clean and dry from the inside, and the city lights blur softly behind the falling rain. *(Season 1 lesson: never mention drops or water on the glass.)*
3. The room stays dry and warm. Only the cool window light moves a little with the rain.
4. **Sound:** a steady, muffled heavy-rain hiss through the glass, the same level in every clip, under the cat sounds.

**Why this also makes the loops seamless:** rain is random motion with no "position", so the first and last frames still match the anchor. Nothing in the rain has to "come back".

**Where the rain matters most:**
- **Rain watch:** she hops onto the window perch and tracks the falling rain with her eyes and head. Her breath lightly fogs a small spot on the glass, which fades before she leaves. Her tail sways, she chirps at it, then hops back to the throne.
- **Thunder (new mood moment, idea):** a lightning flash briefly lights the room, a low thunder roll follows a second later (light first, sound after, like real weather). Her ears flatten, she crouches low on the cushion, then slowly relaxes. It's loop-safe because only light and her pose change.

**Cloak (new sci-fi moment, 8s, about 240 credits).** The mirror clip showed that the mirror reflects Zuri but not the back of the HomeView. We turn that into lore: her cat TV is so advanced it can **cloak**.
- She turns to look at the display. It ripples like heat haze, glitches once and goes invisible, leaving only a faint shimmer outline.
- She startles (ears back, eyes wide), then glances at the camera as if asking "did you see that?"
- Behind her back it shimmers back into place. She looks again, huffs suspiciously and settles.
- Sound: a soft electric shimmer. It's loop-safe because the display is back exactly as before.
- Use it as a rare idle moment (weight 1) and in the "bored" mood. It could later become a gift reaction.

**Starter set** (720p, with sound, all anchor-to-anchor, rendered **2 at a time** and reviewed one by one):

| Clip | s | Rain role |
|---|---|---|
| Slow blink | 5 | background rain and hiss |
| Paw-wash | 7 | background |
| Reading chat | 6 | background |
| Rain watch | 10 | the star: she watches it up close |
| Mirror princess | 10 | rain reflected in the mirror too |
| Rose (gift) | 6 | background |
| Overreact (gift) | 7 | background |
| **Total** | **51** | **about 1,530 credits** at 30 credits per second (sound may cost extra; the first clip's real price is reported before the rest run) |

**Sound seams:** each clip generates its own rain sound, so levels can jump between clips. Every clip gets loudness-normalized with short audio fades at both ends, and I listen to the clips back to back before they go live.

## 6. Sound

- **Every clip generated with Seedance sound on**, so the purrs, paws, chirps and rain match the motion exactly.
- **The lo-fi bed you liked** keeps playing under everything.
- Clip sound is mixed lower than the music, and I measure every clip's loudness before it goes live.

---

## 7. Keeping viewers (the real problem in your first LIVE)

1. **Greet joiners by name:** "maria_23 joined, Zuri noticed you 👀", and she does her reading-chat look for the first few joiners. *(Needs one server restart.)*
2. **Instant like reactions:** hearts on every tap, and every 50 likes she does a slow blink at the camera.
3. **A clear call to action at the top:** "Tap ❤️ to make Zuri play · type pspsps".
4. **More variety:** 11 idle moments instead of 5, across 4 zones, so it never feels like a loop.
5. **Before going live:** post 2–3 short clips of Zuri's best moments ("the rarest cat in the world reacts to…") and go live at the same time each day.

---

## 8. Order of work: one image at a time

| Step | What | Approve before next? |
|---|---|---|
| 1 | **Zuri identity image:** young Savannah F1, golden coat with bold black spots, huge ears, cognac collar, plain studio backdrop | yes |
| 2 | **The empty room**, laid out exactly as in section 3, with no cat | yes |
| 3 | **Anchor frame:** Zuri on the pouf in that room (using images 1 + 2 as references) | yes |
| 4 | Idle moments 1–8 at 720p with sound, **2 at a time**, each reviewed | per batch |
| 5 | Gift actions at 720p with sound | per batch |
| 6 | Mood moments 9–11 | optional |
| 7 | Rebuild the overlay, update the gift menu image, add the hooks | — |

## 9. Credits (honest math)

- **Video:** 720p, 30 credits per second. I'll confirm whether sound changes the price on the first clip; the API reports it before it renders.

| Set | Seconds | Credits |
|---|---|---|
| Idle 1–8 | 60 | ~1,800 |
| 5 gifts | 37 | ~1,110 |
| Mood moments | 24 | ~720 |
| **All** | | **~3,630** |

- **Images:** 3, a small cost next to video.
- **Your remaining season-1 budget is ~1,540**, so this needs a **new budget**. A sensible start that fits about 1,600:
  - the 3 images
  - idle moments 1, 2, 4, 5, 6 (34s, about 1,020)
  - Rose and Overreact (13s, about 390)

  Go live with that, then add the rest from what earns.
- **Season 1 files stay as they are** (Latte keeps working) until Zuri is ready.
