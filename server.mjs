// LIVE gift overlay server.
// Usage:  node server.mjs                 -> test mode (use the Control Room to fake gifts)
//         node server.mjs your_username   -> also connects to your TikTok LIVE
// Control Room: http://localhost:7777/studio.html
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs';
import { execFileSync, spawn } from 'child_process';

const PORT = +process.env.PORT || 7777;
const username = process.argv[2];

// The overlay LIVE Studio shows. Point the Link source at /live.html once; change this line to switch overlays.
const LIVE_PAGE = 'zuri.html';   // season 1 was 'latte.html'
const SETTINGS = 'config/zuri.json';

const app = express();
// Only this PC may use the server (the Control Room can change settings).
const local = (addr = '') => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(addr);
app.use((req, res, next) => (local(req.socket.remoteAddress) ? next() : res.status(403).send('local only')));
app.use(express.json({ limit: '1mb' }));
app.get('/live.html', (_req, res) => res.sendFile(LIVE_PAGE, { root: 'public' }));
app.use(express.static('public'));
app.use('/videos', express.static('videos'));
app.use('/character', express.static('character'));
// Season 2 (Zuri): the 1080p stream copies first (season2/upscale.sh), the 720p masters as a fallback.
app.use('/zuri/clips', express.static('season2/videos/final1080', { maxAge: '10m' }));
app.use('/zuri/clips', express.static('season2/videos/final', { maxAge: '10m' }));
app.get('/zuri/anchor.jpg', (_req, res) => res.sendFile('anchor.jpg', { root: 'season2' }));
// /config -> config/config.json, /config?name=zuri -> config/zuri.json
app.get('/config', (req, res) => {
  const name = String(req.query.name || 'config').replace(/[^a-z0-9_-]/gi, '');
  try { res.type('json').send(readFileSync(`config/${name}.json`, 'utf8')); } catch { res.status(404).send('no such config'); }
});

const server = createServer(app);
const wss = new WebSocketServer({ server, verifyClient: ({ req }) => local(req.socket.remoteAddress) });
const broadcast = (msg) => {
  const s = JSON.stringify(msg);
  wss.clients.forEach((c) => c.readyState === 1 && c.send(s));
};
const now = () => new Date().toLocaleTimeString();

// ---------- session stats (shown in the Control Room) ----------
const freshStats = () => ({
  since: Date.now(), viewers: 0, peakViewers: 0, likes: 0, gifts: 0, coins: 0, follows: 0, shares: 0, joins: 0, chats: 0,
  gifters: {}, recentGifts: [], unmatchedGifts: {}, clipPlays: {}, tests: 0,
});
let stats = freshStats();
let overlayState = null, overlayStateAt = 0;
const clients = new Map();   // ws -> { role, page, w, h, dpr }

function countEvent(ev) {
  if (ev.test) stats.tests++;
  if (ev.type === 'gift') {
    const coins = (ev.coins || 1) * (ev.count || 1);
    stats.gifts += ev.count || 1; if (!ev.test) stats.coins += coins;
    const k = ev.user?.id || ev.user?.name || '?';
    const g = stats.gifters[k] || { name: ev.user?.name, coins: 0, gifts: 0 };
    g.coins += coins; g.gifts += ev.count || 1; g.name = ev.user?.name; stats.gifters[k] = g;
    stats.recentGifts.unshift({ at: Date.now(), who: ev.user?.name, gift: ev.gift, count: ev.count || 1, coins, test: !!ev.test });
    stats.recentGifts.length = Math.min(stats.recentGifts.length, 40);
    // Names the overlay doesn't know (e.g. a seasonal gift spelled differently) show up in the Control Room.
    try {
      const cfg = JSON.parse(readFileSync(SETTINGS, 'utf8'));
      const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
      const known = cfg.gifts.some((x) => [x.gift, ...(x.aliases || [])].some((n) => norm(n) === norm(ev.gift)));
      if (!known) stats.unmatchedGifts[ev.gift] = (stats.unmatchedGifts[ev.gift] || 0) + 1;
    } catch {}
  }
  if (ev.type === 'like') stats.likes += ev.count || 1;
  if (ev.type === 'follow') stats.follows++;
  if (ev.type === 'share') stats.shares++;
  if (ev.type === 'join') stats.joins++;
  if (ev.type === 'chat') stats.chats++;
}
const emit = (ev) => { countEvent(ev); broadcast(ev); };

const overlays = () => [...clients.values()].filter((c) => c.role === 'overlay');
app.get('/api/stats', (_req, res) => res.json({
  ...stats, status, overlayState, overlayStateAt, now: Date.now(),
  overlays: overlays().map(({ w, h, dpr, ua }) => ({ w, h, dpr, ua })),
}));
app.post('/api/stats/reset', (_req, res) => { stats = freshStats(); res.json({ ok: true }); });

// Which clips exist, how long each is (for the queue countdowns), and whether it has its 1080p stream copy.
const lenCache = new Map();   // file -> { mtime, seconds }
const clipSeconds = (file) => {
  const m = statSync(file).mtimeMs, hit = lenCache.get(file);
  if (hit && hit.mtime === m) return hit.seconds;
  let seconds = 8;
  try { seconds = +(+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString()).toFixed(2); } catch {}
  lenCache.set(file, { mtime: m, seconds });
  return seconds;
};
app.get('/api/clips', (_req, res) => {
  const dir = 'season2/videos/final', hi = 'season2/videos/final1080';
  const list = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.mp4')).map((f) => {
    const hd = existsSync(`${hi}/${f}`);
    return { name: f.replace(/\.mp4$/, ''), mb: +(statSync(`${dir}/${f}`).size / 1e6).toFixed(1), hd, seconds: clipSeconds(hd ? `${hi}/${f}` : `${dir}/${f}`) };
  }) : [];
  res.json(list);
});

// Settings: the Control Room reads and saves zuri.json; the overlay picks changes up without reloading.
app.get('/api/settings', (_req, res) => res.type('json').send(readFileSync(SETTINGS, 'utf8')));
app.post('/api/settings', (req, res) => {
  const next = req.body;
  if (!next || typeof next !== 'object' || !Array.isArray(next.gifts) || !next.moments || !next.moods) return res.status(400).json({ error: 'not a full settings file' });
  copyFileSync(SETTINGS, SETTINGS.replace('.json', '.backup.json'));
  writeFileSync(SETTINGS, JSON.stringify(next, null, 2));
  console.log(`${now()} settings saved from the Control Room`);
  broadcast({ type: 'config' });
  res.json({ ok: true });
});

// Fake events (Control Room, old control.html) go through the same path as real ones, marked as tests.
app.post('/sim', (req, res) => { emit({ ...req.body, test: true }); res.json({ ok: true }); });
// Commands for the overlay: force a clip, sleep, wake, surprise, reload.
app.post('/api/command', (req, res) => {
  const c = req.body || {};
  if (!['force', 'sleep', 'wake', 'surprise', 'reload', 'reset'].includes(c.type)) return res.status(400).json({ error: 'unknown command' });
  console.log(`${now()} command: ${c.type}${c.clip ? ' ' + c.clip : ''}`);
  broadcast(c); res.json({ ok: true });
});

// ---------- network monitor (Control Room → Network) ----------
// Not live: a real speed test (upload, download, latency) every 5 minutes and on demand.
// Live: never a speed test (it would steal bandwidth from the stream); only how much this PC is sending
// right now (Windows' own counters via `netstat -e`) and a tiny latency check.
const isLive = () => /^connected/.test(status);
const net = { test: null, testing: false, usage: [], ping: [], lastTestAt: 0 };
const SPEED = 'https://speed.cloudflare.com';
async function latencyMs() {
  const t = performance.now();
  try { await (await fetch(`${SPEED}/__down?bytes=0`, { cache: 'no-store' })).arrayBuffer(); } catch { return null; }
  return Math.round(performance.now() - t);
}
async function speedTest() {
  if (net.testing) return net.test;
  net.testing = true; broadcast({ type: 'net', net: netView() });
  try {
    const pings = []; for (let i = 0; i < 5; i++) { const ms = await latencyMs(); if (ms != null) pings.push(ms); }
    // Upload: 256 KB chunks back to back for ~10 s; the speed is what actually got through.
    const chunk = Buffer.alloc(256 * 1024); for (let i = 0; i < chunk.length; i += 512) chunk[i] = (Math.random() * 256) | 0;
    let up = 0;
    { const t0 = performance.now(); let sent = 0;
      while (performance.now() - t0 < 10000) {
        try { await (await fetch(`${SPEED}/__up`, { method: 'POST', body: chunk, signal: AbortSignal.timeout(15000) })).arrayBuffer(); sent += chunk.length; } catch { break; }
      }
      up = sent * 8 / ((performance.now() - t0) / 1000) / 1e6; }
    // Download: up to 10 MB or 15 s.
    let down = 0;
    { const ac = new AbortController(), t0 = performance.now(), to = setTimeout(() => ac.abort(), 15000); let got = 0;
      try { const r = await fetch(`${SPEED}/__down?bytes=10000000`, { signal: ac.signal }); for await (const c of r.body) got += c.length; } catch {}
      clearTimeout(to); down = got * 8 / ((performance.now() - t0) / 1000) / 1e6; }
    const avg = pings.length ? pings.reduce((a, b) => a + b, 0) / pings.length : null;
    const jitter = pings.length > 1 ? Math.max(...pings) - Math.min(...pings) : null;
    net.test = { at: Date.now(), up: +up.toFixed(2), down: +down.toFixed(2), ping: avg && Math.round(avg), jitter };
    net.lastTestAt = Date.now();
    console.log(`${now()} speed test: upload ${net.test.up} Mbps, download ${net.test.down} Mbps, ping ${net.test.ping} ms`);
  } finally { net.testing = false; }
  broadcast({ type: 'net', net: netView() });
  return net.test;
}
// What LIVE Studio should be set to for a given upload speed (stream at ~65% of the line, leaving headroom).
function advise(up) {
  if (!up) return null;
  const kbps = Math.floor(up * 1000 * 0.65 / 100) * 100;
  if (up >= 8) return { verdict: 'go', res: '1080p', fps: 30, kbps: Math.min(kbps, 6000), text: 'Great line. 1080p is safe.' };
  if (up >= 4.5) return { verdict: 'go', res: '1080p', fps: 30, kbps, text: 'Good for 1080p at a moderate bitrate.' };
  if (up >= 2.5) return { verdict: 'go', res: '720p', fps: 30, kbps, text: 'Good for 720p.' };
  if (up >= 1.4) return { verdict: 'caution', res: '720p', fps: 30, kbps: Math.max(800, kbps), text: 'Tight. 720p at a low bitrate; keep other devices off the Wi-Fi.' };
  return { verdict: 'nogo', res: '540p', fps: 30, kbps: Math.max(500, kbps), text: 'Too slow for a smooth LIVE. Fix the connection first.' };
}
function netView() {
  const recent = net.usage.slice(-10), sendingNow = recent.length ? recent.reduce((a, b) => a + b.up, 0) / recent.length : 0;
  const pings = net.ping.slice(-6).filter((x) => x != null), ping = pings.length ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : null;
  const a = advise(net.test?.up);
  let verdict = a?.verdict || 'unknown', note = a?.text || 'No speed test yet.';
  if (ping != null && ping > 250) { verdict = verdict === 'go' ? 'caution' : verdict; note += ` High latency (${ping} ms).`; }
  // Live: the stream is using most of the measured line → it will lag.
  if (isLive() && net.test?.up && sendingNow > net.test.up * 0.85) { verdict = 'nogo'; note = `Your stream is using ${sendingNow.toFixed(1)} of ${net.test.up} Mbps: the line is full, viewers will see lag. Lower the bitrate in LIVE Studio.`; }
  return { live: isLive(), testing: net.testing, test: net.test, advice: a, verdict, note, sendingNow: +sendingNow.toFixed(2), ping,
    usage: net.usage.slice(-120), nextTestIn: isLive() ? null : Math.max(0, Math.round((net.lastTestAt + 5 * 60000 - Date.now()) / 1000)) };
}
// Usage sampler: what the real network adapters (Wi-Fi / Ethernet) send and receive, every 3 s.
// One long-running `typeperf`; virtual adapters (Hyper-V, WSL, Docker) are left out.
function startUsageSampler() {
  const tp = spawn('typeperf', ['\\Network Interface(*)\\Bytes Sent/sec', '\\Network Interface(*)\\Bytes Received/sec', '-si', '3'], { windowsHide: true });
  let header = null, buf = '';
  tp.stdout.on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('"')) continue;
      const cols = line.slice(1, -1).split('","');
      if (!header) { header = cols; continue; }
      let up = 0, down = 0;
      cols.forEach((v, k) => {
        const name = (header[k] || '').toLowerCase();
        if (!name.includes('network interface') || /hyper-v|virtual|vethernet|isatap|teredo|loopback|wan miniport/.test(name)) return;
        const bps = +v * 8 / 1e6; if (!isFinite(bps)) return;
        if (name.endsWith('bytes sent/sec')) up += bps; else if (name.endsWith('bytes received/sec')) down += bps;
      });
      net.usage.push({ t: Date.now(), up: +up.toFixed(3), down: +down.toFixed(3) });
      if (net.usage.length > 400) net.usage.splice(0, net.usage.length - 400);
    }
  });
  tp.on('exit', () => setTimeout(startUsageSampler, 5000));   // keep it running
}
startUsageSampler();
setInterval(async () => { net.ping.push(await latencyMs()); if (net.ping.length > 60) net.ping.shift(); broadcast({ type: 'net', net: netView() }); }, 10000);
// Automatic speed test every 5 minutes, only while not live.
setInterval(() => { if (!isLive() && !net.testing && Date.now() - net.lastTestAt > 5 * 60000) speedTest(); }, 15000);
setTimeout(() => { if (!isLive()) speedTest(); }, 4000);
app.get('/api/net', (_req, res) => res.json(netView()));
app.post('/api/net/test', async (req, res) => {
  if (isLive() && !req.body?.force) return res.status(409).json({ error: 'You are live: a speed test would slow your stream. Live usage is monitored instead.' });
  res.json({ ok: true, test: await speedTest(), view: netView() });
});

let status = username ? `connecting to @${username}...` : 'test mode (no TikTok connection)';
wss.on('connection', (ws) => {
  clients.set(ws, { role: '?' });
  ws.send(JSON.stringify({ type: 'status', text: status }));
  ws.on('close', () => clients.delete(ws));
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    const me = clients.get(ws);
    if (m.type === 'hello') {
      Object.assign(me, { role: m.role || 'overlay', page: m.page, w: m.w, h: m.h, dpr: m.dpr, ua: m.ua });
      console.log(`${m.role || 'overlay'} connected: ${m.page} ${m.w}x${m.h} @${m.dpr}x  ${m.ua}`);
      if (me.role === 'overlay' && overlays().length > 1) console.log(`NOTE: ${overlays().length} overlays are open; LIVE Studio's is the one that counts (close extra browser tabs showing live.html)`);
      if (me.role === 'overlay' && /TikTokLIVEStudio/i.test(m.ua || '') && (m.w < 1000 || m.h < 1800)) console.log(`WARNING: LIVE Studio shows the overlay at ${m.w}x${m.h}. Set the Link source to 1080x1920 or it looks blurry.`);
    }
    if (me.role !== 'overlay') return;    // only the real overlay reports what's on stream
    // When LIVE Studio's overlay is connected, it is the only one that counts; stray browser copies are ignored.
    const isStudio = (c) => /TikTokLIVEStudio/i.test(c.ua || '');
    if (!isStudio(me) && overlays().some(isStudio)) return;
    if (m.type === 'clip') {
      stats.clipPlays[m.name] = (stats.clipPlays[m.name] || 0) + 1;
      console.log(`${now()} playing: ${m.name}${m.mood ? ` [${m.mood}]` : ''}${m.queued ? ` (${m.queued} queued)` : ''}`);
      broadcast({ type: 'clipStarted', clip: m.name, at: Date.now() });
    }
    if (m.type === 'state') { overlayState = m; overlayStateAt = Date.now(); broadcast({ type: 'state', state: m }); }
    if (m.type === 'mood') console.log(`${now()} mood -> ${m.name}`);
    if (m.type === 'audio') console.log(`${now()} sound: ${m.ok ? 'playing' : 'BLOCKED by the host (no sound on stream)'}`);
    if (m.type === 'error') console.log(`${now()} overlay problem: ${m.text}`);
  });
});
const setStatus = (text) => { status = text; console.log(`${now()} ${text}`); broadcast({ type: 'status', text }); };

const user = (d) => {
  const u = d.user || d;
  return {
    name: u.nickname || u.uniqueId || 'someone',
    id: u.uniqueId || u.nickname || '',
    pic: u.profilePictureUrl || u.profilePicture?.url?.[0] || u.profilePicture?.urls?.[0] || '',
  };
};

if (username) {
  const { TikTokLiveConnection } = await import('tiktok-live-connector');
  // enableExtendedGiftInfo must stay off: it fetches the gift list through Euler Stream's paid endpoint and
  // makes the whole connection fail ("requires a Business plan"). Gift messages carry the name anyway.
  const conn = new TikTokLiveConnection(username, { enableExtendedGiftInfo: false });

  conn.on('gift', (d) => {
    const g = d.giftDetails || d.extendedGiftInfo || {};
    const giftType = d.giftType ?? g.giftType;
    // Streakable gifts (like Rose) fire repeatedly while the combo runs; only count the final one.
    if (giftType === 1 && !d.repeatEnd) return;
    const name = d.giftName || g.giftName || g.name || d.gift?.name || `gift#${d.giftId}`;
    if (name.startsWith('gift#')) console.log(`${now()} gift without a name, fields: ${Object.keys(d).join(', ')}`);
    console.log(`${now()} gift: "${name}" x${d.repeatCount || 1} from ${user(d).name}`);
    emit({ type: 'gift', user: user(d), gift: name, count: d.repeatCount || 1, coins: d.diamondCount ?? g.diamondCount ?? 1 });
  });
  conn.on('like', (d) => emit({ type: 'like', user: user(d), count: d.likeCount || 1 }));
  conn.on('chat', (d) => emit({ type: 'chat', user: user(d), text: d.comment || '' }));
  conn.on('follow', (d) => emit({ type: 'follow', user: user(d) }));
  conn.on('share', (d) => emit({ type: 'share', user: user(d) }));
  conn.on('member', (d) => emit({ type: 'join', user: user(d) }));
  conn.on('roomUser', (d) => { stats.viewers = d.viewerCount || 0; stats.peakViewers = Math.max(stats.peakViewers, stats.viewers); });

  // Stay connected for the whole LIVE: retry when not live yet, after a drop, and after the stream ends.
  let connecting = false, retryT = null;
  const retry = (s) => { clearTimeout(retryT); retryT = setTimeout(tryConnect, s * 1000); };
  const tryConnect = async () => {
    if (connecting) return;
    connecting = true;
    try { const s = await conn.connect(); setStatus(`connected to @${username} (room ${s.roomId})`); }
    catch (e) { setStatus(`not live yet / failed: ${e.message}. Retrying in 15s...`); retry(15); }
    finally { connecting = false; }
  };
  conn.on('streamEnd', () => { setStatus('stream ended. Waiting for you to go live again...'); retry(30); });
  conn.on('disconnected', () => { setStatus('disconnected from TikTok. Reconnecting in 10s...'); retry(10); });
  tryConnect();
}

server.listen(PORT, () => {
  console.log(`LIVE Studio Link:  http://localhost:${PORT}/live.html  (now ${LIVE_PAGE})`);
  console.log(`Control Room:      http://localhost:${PORT}/studio.html`);
  console.log(status);
});
