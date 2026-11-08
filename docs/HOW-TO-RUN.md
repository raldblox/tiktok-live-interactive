# Running Zuri's LIVE

## Start
1. Double-click **`Start Zuri.bat`** in the project folder (the first time, it asks for your TikTok username and remembers it in `tiktok-user.txt`). Keep its black window open the whole LIVE.
2. The **Control Room** opens in your browser: http://localhost:7777/studio.html
3. TikTok LIVE Studio: the Link source points at **http://localhost:7777/live.html**, size **1080×1920**, audio **ON** (already set up; nothing to change).
4. Go live. The **TikTok** pill in the Control Room turns green within about 15 seconds. If the connection drops, the server reconnects on its own.

## The Control Room
- **Network (top right):** check it says **Good to go live** before you go live, and set LIVE Studio to the resolution, fps and bitrate it recommends. While you're live it stops testing (tests would slow the stream) and shows how much of your line the stream uses.
- **Top pills:** TikTok connection, Overlay (LIVE Studio is running it, and at what size), Sound.
- **Director (left):** what's playing now with a countdown, the gift queue (costlier first, same gifts merged) with a countdown for each, her mood, the sleep timer and the next surprise.
- **Fire a gift:** type a viewer name (or 🎲 for a random one) and click any gift. Test events are marked "test" and never count as coins.
- **Viewers:** fake likes (including the rain milestone), "pspsps", joins, follows and shares.
- **Direct control:** Sleep now, Wake up, Surprise now, Reload overlay, and **Play a clip next** (any clip).
- **This session (right):** viewers, peak, coins, gifts, likes, top gifters, recent gifts, how often each clip played.
- **Warnings (yellow box):** a blurry Link source size, extra overlay tabs open, blocked sound, and gift names that TikTok sent but no reaction knows about. Add a misspelled seasonal name as an alias.
- **Settings** (press **Save**; the overlay updates live, and the old file is kept as `config/zuri.backup.json`):
  - *Idle moments:* weight per moment per mood, with the real % shown in gold.
  - *Sleep & moods:* seconds of no interaction before she sleeps (default 60), mood timings.
  - *Surprises:* on/off, how often, weight and cooldown per moment (mirror, window; the nine tails is very rare, at most once per 90 minutes).
  - *Gifts:* TikTok name, which clip it plays, Big (jumps the queue), aliases, card text.
  - *Likes & sound:* like milestones, music, sleep and clip volumes.

## How she behaves
- **Awake:** idle moments (chat, paw-wash, slow blink, cloak glitch), weighted by mood.
- **Sleep:** after 60 s with no likes, chats or gifts she curls up and sleeps on a loop. A gift, "pspsps", a follow or a burst of likes wakes her right away; then the reaction plays.
- **Surprises:** only while awake, never right after a real gift, never shown as a viewer's gift.
- **Gifts:** Rose, Ice Cream Cone, Pumpkin, Lightning Bolt, Overreact, Perfume (mirror), Witchy Kitty, Twinkling Star, Money Gun, Galaxy, Fox Legend. Every 300 likes: window. Every 50 likes: slow blink.

## Quality
- Clips stream from `season2/videos/final1080/` (upscaled to 1080×1920). After adding a new clip to `season2/videos/final/`, run `sh season2/upscale.sh`.
- In LIVE Studio choose 1080p and the highest bitrate your upload allows.
