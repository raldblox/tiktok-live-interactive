// Soundscape engine.
// Every sound name (e.g. "rain") plays public/sounds/<name>.mp3 if that file exists,
// otherwise a built-in generated version so everything works before you have real recordings.
const Sound = (() => {
  let ac, master, fx;
  const files = {};      // name -> AudioBuffer from sounds/<name>.mp3
  const noiseBufs = {};
  const hooks = {};      // visual sync, e.g. hooks.thunder = () => flash()
  let ambient = null;    // { out, handles }
  const layers = {};     // name -> { out, handles, timer, endsAt }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function noise(color) {
    if (noiseBufs[color]) return noiseBufs[color];
    const len = ac.sampleRate * 4, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'white') d[i] = w;
      else if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    }
    return (noiseBufs[color] = b);
  }
  const gainNode = (v) => { const g = ac.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q = 1) => { const n = ac.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  function loopNoise(h, color) { const s = ac.createBufferSource(); s.buffer = noise(color); s.loop = true; s.start(0, Math.random() * 3); h.nodes.push(s); return s; }
  function lfo(h, rate, depth, param) { const o = ac.createOscillator(); o.frequency.value = rate; const g = gainNode(depth); o.connect(g).connect(param); o.start(); h.nodes.push(o); }
  function repeat(h, minMs, maxMs, fn) {
    const tick = () => { if (h.stopped) return; fn(); setTimeout(tick, rnd(minMs, maxMs)); };
    setTimeout(tick, rnd(0, maxMs));
  }

  // A single enveloped tone. glide: [[freq, secondsFromStart], ...]
  function tone(dest, freq, { type = 'sine', attack = 0.01, decay = 1, vol = 0.2, glide = [], when = 0 } = {}) {
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    glide.forEach(([f, dt]) => o.frequency.exponentialRampToValueAtTime(f, t + dt));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    o.connect(g).connect(dest); o.start(t); o.stop(t + attack + decay + 0.05);
  }
  function burst(dest, { color = 'white', dur = 0.05, vol = 0.3, f = 2000, q = 1, type = 'bandpass', attack = 0.002, when = 0 } = {}) {
    const t = ac.currentTime + when, s = ac.createBufferSource(), fl = filt(type, f, q), g = ac.createGain();
    s.buffer = noise(color);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    s.connect(fl).connect(g).connect(dest); s.start(t, Math.random() * 3, attack + dur + 0.1);
  }

  const PENTA_HIGH = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349.3];
  const PENTA_MID = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

  // ---------- generated soundscapes ----------
  const gens = {
    home(out, h) {
      const pad = gainNode(0.05), lp = filt('lowpass', 900);
      [130.81, 196, 261.63, 329.63].forEach((f) => {
        [-4, 4].forEach((det) => { const o = ac.createOscillator(); o.frequency.value = f; o.detune.value = det; o.connect(pad); o.start(); h.nodes.push(o); });
      });
      pad.connect(lp).connect(out);
      lfo(h, 0.07, 0.02, pad.gain);
      loopNoise(h, 'brown').connect(filt('lowpass', 400)).connect(gainNode(0.08)).connect(out);
      repeat(h, 3500, 9000, () => tone(fx, pick(PENTA_MID) * 2, { vol: 0.03, decay: 3 }));
    },
    whale(out, h) {
      const body = gainNode(0.45);
      loopNoise(h, 'brown').connect(filt('lowpass', 250)).connect(body).connect(out);
      lfo(h, 0.07, 0.25, body.gain);
      const song = filt('lowpass', 900); song.connect(out); song.connect(fx);
      repeat(h, 7000, 14000, () => {
        const f = rnd(150, 220);
        tone(song, f, { vol: 0.14, attack: 0.9, decay: 3.2, glide: [[f * 2.1, 1.6], [f * 1.3, 3.6]] });
      });
      repeat(h, 400, 2200, () => { const f = rnd(300, 700); tone(out, f, { vol: 0.05, decay: 0.08, glide: [[f * 3, 0.07]] }); });
    },
    rain(out, h) {
      loopNoise(h, 'pink').connect(filt('highpass', 400)).connect(filt('lowpass', 6000)).connect(gainNode(0.28)).connect(out);
      repeat(h, 15, 70, () => burst(out, { dur: 0.012, f: rnd(2500, 7000), q: 3, vol: rnd(0.03, 0.12) }));
    },
    wind(out, h) {
      const bp = filt('bandpass', 500, 0.8), g = gainNode(0.25);
      loopNoise(h, 'brown').connect(bp).connect(g).connect(out);
      lfo(h, 0.08, 300, bp.frequency);
      lfo(h, 0.13, 0.12, g.gain);
    },
    crystal(out, h) {
      loopNoise(h, 'brown').connect(filt('lowpass', 200)).connect(gainNode(0.15)).connect(out);
      repeat(h, 600, 2500, () => {
        const f = pick(PENTA_HIGH);
        tone(fx, f, { vol: 0.06, decay: 4 });
        tone(out, f / 2, { type: 'triangle', vol: 0.02, decay: 3 });
      });
      repeat(h, 1500, 4000, () => tone(fx, 1200, { vol: 0.08, decay: 0.12, glide: [[2400, 0.05]] }));
    },
    fire(out, h) {
      loopNoise(h, 'brown').connect(filt('lowpass', 600)).connect(gainNode(0.3)).connect(out);
      repeat(h, 30, 250, () => burst(out, { dur: rnd(0.006, 0.03), f: rnd(1500, 5000), q: 0.7, vol: rnd(0.05, 0.35) }));
    },
    crickets(out, h) {
      repeat(h, 600, 1400, () => {
        const f = rnd(4200, 4700), n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) tone(out, f, { vol: 0.025, attack: 0.005, decay: 0.03, when: i * 0.05 });
      });
    },
    thunder(out, h) {
      repeat(h, 8000, 18000, () => {
        hooks.thunder && hooks.thunder();
        burst(out, { color: 'white', f: 1000, dur: 0.3, vol: 0.15 });
        burst(out, { color: 'brown', type: 'lowpass', f: 300, attack: 0.3, dur: rnd(4, 6), vol: 0.9 });
      });
    },
    heartbeat(out, h) {
      repeat(h, 950, 1050, () => {
        tone(out, 60, { vol: 0.5, decay: 0.15, glide: [[40, 0.15]] });
        tone(out, 55, { vol: 0.35, decay: 0.15, glide: [[38, 0.15]], when: 0.22 });
      });
    },
    // Low rumble pulsing ~25 times a second, like a cat on your chest.
    purr(out, h) {
      const g = gainNode(0.25);
      loopNoise(h, 'brown').connect(filt('lowpass', 140)).connect(g).connect(out);
      lfo(h, 24, 0.22, g.gain);
    },
  };

  // Short cat-ish voice: a sawtooth through two formant filters with a pitch glide.
  function catVoice(points, { vol = 0.25, dur = 0.7, harsh = false } = {}) {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), mix = gainNode(1);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(points[0][0], t);
    points.slice(1).forEach(([f, dt]) => o.frequency.exponentialRampToValueAtTime(f, t + dt));
    const vib = ac.createOscillator(), vg = gainNode(harsh ? 40 : 14); vib.frequency.value = harsh ? 30 : 6; vib.connect(vg).connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.1);
    [[750, 6], [1300, 8], [2600, 10]].forEach(([f, q]) => o.connect(filt('bandpass', f, q)).connect(mix));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    mix.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  const oneshots = {
    chime() { [0, 1, 2, 4].forEach((k, i) => tone(fx, PENTA_HIGH[k], { vol: 0.09, decay: 2.5, when: i * 0.09 })); },
    bubbles() { for (let i = 0; i < 9; i++) { const f = rnd(300, 800); tone(master, f, { vol: 0.08, decay: 0.08, glide: [[f * 3, 0.07]], when: rnd(0, 0.7) }); } },
    whoosh() {
      const s = ac.createBufferSource(), bp = filt('bandpass', 300, 1.2), g = ac.createGain(), t = ac.currentTime;
      s.buffer = noise('pink');
      bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 0.9); bp.frequency.exponentialRampToValueAtTime(200, t + 1.8);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + 2);
    },
    arrive() { [0, 2, 4].forEach((k, i) => tone(fx, PENTA_MID[k], { vol: 0.08, attack: 0.3, decay: 3, when: i * 0.15 })); },
    wave() { tone(fx, 880, { vol: 0.05, decay: 0.6, glide: [[1320, 0.15]] }); },
    heart() { tone(fx, 1318.5, { vol: 0.05, decay: 0.8 }); },
    fanfare() { [0, 2, 4, 5, 6].forEach((k, i) => tone(fx, PENTA_HIGH[k], { vol: 0.1, decay: 2, when: i * 0.12 })); },
    // ---- cat comedy ----
    meow() { const f = rnd(420, 520); catVoice([[f, 0], [f * 1.7, 0.18], [f * 0.9, 0.6]], { dur: 0.7 }); },
    angry() { catVoice([[380, 0], [620, 0.25], [300, 0.9]], { dur: 1, vol: 0.3, harsh: true }); },
    hiss() { burst(master, { color: 'white', type: 'highpass', f: 2500, q: 0.5, attack: 0.05, dur: 0.9, vol: 0.35 }); },
    crash() {
      burst(master, { color: 'white', type: 'highpass', f: 2000, dur: 0.35, vol: 0.6 });
      burst(master, { color: 'brown', type: 'lowpass', f: 300, dur: 0.25, vol: 0.7 });
      for (let i = 0; i < 9; i++) tone(fx, rnd(2500, 6500), { vol: 0.05, decay: rnd(0.2, 0.7), when: rnd(0.02, 0.5) });
    },
    thud() { tone(master, 90, { vol: 0.6, decay: 0.25, glide: [[45, 0.25]] }); burst(master, { color: 'brown', type: 'lowpass', f: 200, dur: 0.2, vol: 0.5 }); },
    scratch() { for (let i = 0; i < 7; i++) burst(master, { color: 'pink', f: rnd(1200, 2400), q: 2, attack: 0.02, dur: 0.09, vol: 0.45, when: i * 0.12 }); },
    zoom() {
      for (let i = 0; i < 4; i++) {
        const t = ac.currentTime + i * 0.45, s = ac.createBufferSource(), bp = filt('bandpass', 400, 2), g = ac.createGain();
        s.buffer = noise('pink');
        bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2500, t + 0.25); bp.frequency.exponentialRampToValueAtTime(300, t + 0.45);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + 0.5);
      }
    },
    boing() { tone(master, 180, { type: 'triangle', vol: 0.3, decay: 0.45, glide: [[620, 0.12], [300, 0.4]] }); },
    purr() { const g = gainNode(0); const h = { nodes: [] }; loopNoise(h, 'brown').connect(filt('lowpass', 140)).connect(g).connect(master); lfo(h, 24, 0.25, g.gain); setTimeout(() => h.nodes.forEach((n) => { try { n.stop(); } catch {} }), 2500); },
    register() { tone(fx, 2093, { vol: 0.08, decay: 0.5 }); tone(fx, 2637, { vol: 0.08, decay: 0.7, when: 0.08 }); },
    snore() { burst(master, { color: 'brown', type: 'lowpass', f: 400, attack: 0.6, dur: 0.8, vol: 0.35 }); },
  };

  // Builds a running sound (file loop or generator) into a fresh gain node.
  function start(name, vol = 1) {
    const out = gainNode(0), h = { nodes: [], stopped: false };
    out.connect(master);
    if (files[name]) {
      const s = ac.createBufferSource(); s.buffer = files[name]; s.loop = true; s.connect(out); s.start(); h.nodes.push(s);
    } else if (gens[name]) gens[name](out, h);
    out.gain.setTargetAtTime(vol, ac.currentTime, 0.8);
    return { out, h };
  }
  function stop(snd, fade = 0.8) {
    snd.h.stopped = true;
    snd.out.gain.setTargetAtTime(0, ac.currentTime, fade);
    setTimeout(() => { snd.h.nodes.forEach((n) => { try { n.stop(); } catch {} }); snd.out.disconnect(); }, fade * 6000);
  }

  return {
    hooks,
    async init(volume, names) {
      ac = new AudioContext();
      master = gainNode(volume);
      const comp = ac.createDynamicsCompressor();
      master.connect(comp).connect(ac.destination);
      // Shared echo for chimes and calls
      fx = gainNode(1);
      const d = ac.createDelay(1); d.delayTime.value = 0.35;
      const fb = gainNode(0.45), lp = filt('lowpass', 3000);
      fx.connect(master); fx.connect(d); d.connect(lp).connect(fb).connect(d); lp.connect(master);
      await Promise.all(names.map(async (n) => {
        try {
          const r = await fetch(`sounds/${n}.mp3`);
          if (r.ok) files[n] = await ac.decodeAudioData(await r.arrayBuffer());
        } catch {}
      }));
    },
    get locked() { return !ac || ac.state !== 'running'; },
    unlock() { return ac && ac.resume(); },
    ambient(names) {
      if (ambient) ambient.forEach((s) => stop(s, 1));
      ambient = names.map((n) => start(n));
    },
    layer(name, seconds) {
      const now = Date.now();
      let l = layers[name];
      if (!l) { l = layers[name] = { ...start(name), endsAt: now }; }
      l.endsAt = Math.max(l.endsAt, now) + seconds * 1000;  // repeated gifts stack time
      clearTimeout(l.timer);
      l.timer = setTimeout(() => { stop(l); delete layers[name]; }, l.endsAt - now);
    },
    activeLayers() { return Object.entries(layers).map(([name, l]) => ({ name, left: Math.max(0, Math.round((l.endsAt - Date.now()) / 1000)) })); },
    oneshot(name) {
      if (files[name]) { const s = ac.createBufferSource(); s.buffer = files[name]; s.connect(master); s.start(); return; }
      oneshots[name] && oneshots[name]();
    },
  };
})();
