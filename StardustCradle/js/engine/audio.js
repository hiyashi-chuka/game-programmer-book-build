// =============================================================
//  audio.js — 自前シンセサイザ + MMLシーケンサ + 効果音
// =============================================================
(function () {
  const A = (G.audio = {});
  let ctx = null;
  let master, comp, musicBus, musicFilter, sfxBus, delayIn, reverbIn, noiseBuf;
  const waves = {};
  A.musicVol = 0.55;
  A.sfxVol = 0.6;
  A.ready = false;

  // ---------- 初期化 ----------
  A.init = function () {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    A.ctx = ctx;

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    master = ctx.createGain();
    master.gain.value = 0.9;
    comp.connect(master);
    master.connect(ctx.destination);

    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 20000;
    musicFilter.Q.value = 0.5;
    musicBus = ctx.createGain();
    musicBus.gain.value = A.musicVol;
    musicBus.connect(musicFilter);
    musicFilter.connect(comp);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = A.sfxVol;
    sfxBus.connect(comp);

    // ディレイ（ピンポン風）
    delayIn = ctx.createGain();
    const dl = ctx.createDelay(1.5),
      dr = ctx.createDelay(1.5);
    dl.delayTime.value = 0.3;
    dr.delayTime.value = 0.45;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 2600;
    const pl = ctx.createStereoPanner(),
      pr = ctx.createStereoPanner();
    pl.pan.value = -0.6;
    pr.pan.value = 0.6;
    delayIn.connect(dl);
    dl.connect(dlp);
    dlp.connect(fb);
    fb.connect(dr);
    dr.connect(dl);
    dl.connect(pl);
    dr.connect(pr);
    const dOut = ctx.createGain();
    dOut.gain.value = 0.55;
    pl.connect(dOut);
    pr.connect(dOut);
    dOut.connect(musicBus);
    A.delayNodes = { dl, dr };

    // リバーブ（生成インパルス）
    reverbIn = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(2.8, 2.2);
    const rOut = ctx.createGain();
    rOut.gain.value = 0.5;
    reverbIn.connect(conv);
    conv.connect(rOut);
    rOut.connect(musicBus);

    // ノイズバッファ
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // パルス波
    waves.pulse50 = 'square';
    waves.pulse25 = makePulse(0.25);
    waves.pulse12 = makePulse(0.125);
    waves.organ = makeHarm([1, 0.6, 0.3, 0.5, 0.1, 0.25, 0, 0.15]);
    waves.soft = makeHarm([1, 0.25, 0.1, 0.05]);

    A.ready = true;
    if (A._pendingBgm) {
      const p = A._pendingBgm;
      A._pendingBgm = null;
      A.bgm(p);
    }
  };

  function makeImpulse(sec, decay) {
    const rate = ctx.sampleRate,
      len = Math.floor(rate * sec);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function makePulse(duty) {
    const n = 64,
      re = new Float32Array(n),
      im = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      re[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
      im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
    }
    return ctx.createPeriodicWave(re, im);
  }
  function makeHarm(arr) {
    const re = new Float32Array(arr.length + 1),
      im = new Float32Array(arr.length + 1);
    arr.forEach((v, i) => (im[i + 1] = v));
    return ctx.createPeriodicWave(re, im);
  }
  function setOsc(o, type) {
    if (type === 'sine' || type === 'square' || type === 'sawtooth' || type === 'triangle') o.type = type;
    else if (waves[type] === 'square') o.type = 'square';
    else if (waves[type]) o.setPeriodicWave(waves[type]);
    else o.type = 'square';
  }
  let distCurve = null;
  function getDist() {
    if (distCurve) return distCurve;
    const n = 1024;
    distCurve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / n) * 2 - 1;
      distCurve[i] = Math.tanh(x * 6) * 0.8;
    }
    return distCurve;
  }

  // ---------- 音色定義 ----------
  // osc: 波形 or 配列(ユニゾン)、detune: セント、filter: 固定カットオフ or {base,env,decay}
  const INST = (A.INST = {
    sq50: { osc: 'pulse50', a: 0.003, d: 0.08, s: 0.7, r: 0.04, vol: 0.13 },
    sq25: { osc: 'pulse25', a: 0.003, d: 0.08, s: 0.7, r: 0.04, vol: 0.14 },
    sq12: { osc: 'pulse12', a: 0.003, d: 0.08, s: 0.7, r: 0.04, vol: 0.15 },
    tri: { osc: 'triangle', a: 0.003, d: 0.05, s: 0.9, r: 0.05, vol: 0.33 },
    sine: { osc: 'sine', a: 0.01, d: 0.1, s: 0.8, r: 0.15, vol: 0.28 },
    saw: { osc: 'sawtooth', a: 0.004, d: 0.1, s: 0.7, r: 0.08, filter: 2400, vol: 0.12 },
    lead: { osc: ['sawtooth', 'pulse25'], detune: [-7, 7], a: 0.01, d: 0.15, s: 0.75, r: 0.12, filter: 3400, vib: [5.5, 14, 0.18], delay: 0.28, verb: 0.15, vol: 0.1 },
    softlead: { osc: ['soft', 'triangle'], detune: [-5, 5], a: 0.02, d: 0.2, s: 0.8, r: 0.2, vib: [5, 10, 0.25], delay: 0.3, verb: 0.3, vol: 0.18 },
    pad: { osc: ['sawtooth', 'sawtooth', 'pulse25'], detune: [-12, 12, 0], a: 0.35, d: 0.5, s: 0.85, r: 0.9, filter: 1500, verb: 0.55, vol: 0.05 },
    strings: { osc: ['sawtooth', 'sawtooth', 'sawtooth'], detune: [-14, 0, 14], a: 0.18, d: 0.3, s: 0.9, r: 0.5, filter: 2300, vib: [5, 6, 0.3], verb: 0.45, vol: 0.055 },
    choir: { osc: ['triangle', 'soft', 'triangle'], detune: [-10, 0, 10], a: 0.4, d: 0.4, s: 0.9, r: 0.8, vib: [4.5, 9, 0.2], verb: 0.7, vol: 0.12 },
    bass: { osc: 'sawtooth', a: 0.003, d: 0.2, s: 0.5, r: 0.06, filter: { base: 220, env: 1400, decay: 0.16, q: 7 }, vol: 0.24 },
    slap: { osc: ['sawtooth', 'pulse25'], detune: [0, 2], a: 0.002, d: 0.14, s: 0.35, r: 0.05, filter: { base: 300, env: 3200, decay: 0.08, q: 9 }, vol: 0.2 },
    subbass: { osc: 'sine', a: 0.005, d: 0.1, s: 0.9, r: 0.08, vol: 0.42 },
    sqbass: { osc: 'pulse25', a: 0.003, d: 0.1, s: 0.8, r: 0.04, filter: 1800, vol: 0.16 },
    pluck: { osc: 'sawtooth', a: 0.002, d: 0.28, s: 0.0, r: 0.1, filter: { base: 500, env: 3800, decay: 0.12, q: 4 }, delay: 0.3, vol: 0.13 },
    arp: { osc: 'pulse25', a: 0.002, d: 0.12, s: 0.25, r: 0.06, delay: 0.35, vol: 0.09 },
    ep: { osc: 'sine', fm: [1, 2.2, 0.7], a: 0.002, d: 1.1, s: 0.22, r: 0.35, verb: 0.3, delay: 0.12, vol: 0.2 },
    bell: { osc: 'sine', fm: [3.5, 4, 0.9], a: 0.002, d: 1.4, s: 0.0, r: 0.5, verb: 0.45, delay: 0.25, vol: 0.13 },
    piano: { osc: ['triangle', 'sine'], detune: [0, 1200], fm: [2, 1.2, 0.4], a: 0.002, d: 1.6, s: 0.1, r: 0.4, verb: 0.35, vol: 0.16 },
    organ: { osc: 'organ', a: 0.01, d: 0.1, s: 0.9, r: 0.08, verb: 0.2, vol: 0.11 },
    gtr: { osc: ['sawtooth', 'sawtooth'], detune: [-9, 9], a: 0.004, d: 0.3, s: 0.7, r: 0.1, dist: true, filter: 2800, vol: 0.06 },
    gtrlead: { osc: ['sawtooth', 'pulse25'], detune: [-5, 5], a: 0.005, d: 0.3, s: 0.8, r: 0.15, dist: true, filter: 3600, vib: [6, 22, 0.22], delay: 0.25, verb: 0.15, vol: 0.055 },
    brass: { osc: ['sawtooth', 'sawtooth'], detune: [-6, 6], a: 0.04, d: 0.2, s: 0.8, r: 0.12, filter: { base: 800, env: 2400, decay: 0.25, q: 2 }, verb: 0.2, vol: 0.1 },
    flute: { osc: 'sine', a: 0.05, d: 0.1, s: 0.85, r: 0.15, vib: [5, 12, 0.2], noise: 0.04, verb: 0.35, delay: 0.15, vol: 0.22 },
  });

  // ---------- ノート再生 ----------
  const NOTE_BASE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function mtof(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
  A.mtof = mtof;

  function playNote(instName, midi, t, dur, vol, pan, dest) {
    const I = INST[instName] || INST.sq50;
    const freq = mtof(midi);
    const out = ctx.createGain();
    const peak = I.vol * vol;
    const a = I.a,
      d = I.d,
      s = I.s,
      r = I.r;
    const end = t + Math.max(dur, a + 0.01);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(peak, t + a);
    out.gain.setTargetAtTime(peak * s + 0.0001, t + a, d / 3 + 0.001);
    // end時点の値は減衰曲線から近似して繋ぐ
    const sustainVal = Math.max(0.0001, peak * (s + (1 - s) * Math.exp(-(dur - a) / (d / 3 + 0.001))));
    out.gain.setValueAtTime(sustainVal, end);
    out.gain.exponentialRampToValueAtTime(0.0001, end + r);

    let node = out;
    let panner = null;
    if (pan) {
      panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      out.connect(panner);
      node = panner;
    }
    node.connect(dest || musicBus);
    if (I.delay) {
      const g = ctx.createGain();
      g.gain.value = I.delay;
      node.connect(g);
      g.connect(delayIn);
    }
    if (I.verb) {
      const g = ctx.createGain();
      g.gain.value = I.verb;
      node.connect(g);
      g.connect(reverbIn);
    }

    let chainIn = out;
    if (I.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      if (typeof I.filter === 'number') {
        f.frequency.value = I.filter;
        f.Q.value = 0.8;
      } else {
        f.Q.value = I.filter.q || 1;
        f.frequency.setValueAtTime(I.filter.base + I.filter.env, t);
        f.frequency.exponentialRampToValueAtTime(Math.max(40, I.filter.base), t + I.filter.decay);
      }
      f.connect(chainIn);
      chainIn = f;
    }
    if (I.dist) {
      const sh = ctx.createWaveShaper();
      sh.curve = getDist();
      sh.oversample = '2x';
      sh.connect(chainIn);
      chainIn = sh;
    }
    const oscs = Array.isArray(I.osc) ? I.osc : [I.osc];
    const det = I.detune || [];
    const stopT = end + r + 0.05;
    oscs.forEach((type, i) => {
      const o = ctx.createOscillator();
      setOsc(o, type);
      o.frequency.value = freq;
      o.detune.value = det[i] || 0;
      if (I.vib) {
        const lfo = ctx.createOscillator(),
          lg = ctx.createGain();
        lfo.frequency.value = I.vib[0];
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(I.vib[1], t + I.vib[2] + 0.05);
        lfo.connect(lg);
        lg.connect(o.detune);
        lfo.start(t);
        lfo.stop(stopT);
      }
      if (I.fm) {
        const m = ctx.createOscillator(),
          mg = ctx.createGain();
        m.frequency.value = freq * I.fm[0];
        mg.gain.setValueAtTime(freq * I.fm[1], t);
        mg.gain.exponentialRampToValueAtTime(freq * 0.05 + 0.01, t + I.fm[2]);
        m.connect(mg);
        mg.connect(o.frequency);
        m.start(t);
        m.stop(stopT);
      }
      const og = ctx.createGain();
      og.gain.value = 1 / Math.sqrt(oscs.length);
      o.connect(og);
      og.connect(chainIn);
      o.start(t);
      o.stop(stopT);
    });
    if (I.noise) {
      const n = ctx.createBufferSource();
      n.buffer = noiseBuf;
      const ng = ctx.createGain();
      ng.gain.value = I.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq * 2;
      n.connect(bp);
      bp.connect(ng);
      ng.connect(chainIn);
      n.start(t);
      n.stop(stopT);
    }
  }

  // ---------- ドラム ----------
  function drum(kind, t, vol, dest) {
    dest = dest || musicBus;
    const g = ctx.createGain();
    g.connect(dest);
    if (kind === 'k') {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.9 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.4);
      // クリック
      const n = ctx.createBufferSource();
      n.buffer = noiseBuf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.25 * vol, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      n.connect(ng);
      ng.connect(dest);
      n.start(t);
      n.stop(t + 0.03);
    } else if (kind === 's' || kind === 'x') {
      const n = ctx.createBufferSource();
      n.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = kind === 's' ? 'highpass' : 'bandpass';
      bp.frequency.value = kind === 's' ? 1200 : 1500;
      bp.Q.value = kind === 'x' ? 1.5 : 0.7;
      g.gain.setValueAtTime(0.5 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 's' ? 0.2 : 0.16));
      n.connect(bp);
      bp.connect(g);
      n.start(t);
      n.stop(t + 0.25);
      if (kind === 's') {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.5 * vol, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(og);
        og.connect(dest);
        o.start(t);
        o.stop(t + 0.12);
      } else {
        // クラップの多重アタック
        g.gain.setValueAtTime(0.5 * vol, t + 0.01);
        g.gain.setValueAtTime(0.2 * vol, t + 0.015);
        g.gain.setValueAtTime(0.5 * vol, t + 0.022);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      }
      const rv = ctx.createGain();
      rv.gain.value = 0.25;
      g.connect(rv);
      rv.connect(reverbIn);
    } else if (kind === 'h' || kind === 'o' || kind === 'c') {
      const n = ctx.createBufferSource();
      n.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = kind === 'c' ? 4500 : 7500;
      const len = kind === 'h' ? 0.045 : kind === 'o' ? 0.28 : 1.3;
      g.gain.setValueAtTime((kind === 'c' ? 0.35 : 0.22) * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      n.connect(hp);
      hp.connect(g);
      n.start(t);
      n.stop(t + len + 0.05);
      if (kind === 'c') {
        const rv = ctx.createGain();
        rv.gain.value = 0.3;
        g.connect(rv);
        rv.connect(reverbIn);
      }
    } else if (kind === 't' || kind === 'm') {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const f0 = kind === 't' ? 130 : 190;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.25);
      g.gain.setValueAtTime(0.6 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.35);
    } else if (kind === 'b') {
      // シェイカー
      const n = ctx.createBufferSource();
      n.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 5500;
      bp.Q.value = 2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.18 * vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      n.connect(bp);
      bp.connect(g);
      n.start(t);
      n.stop(t + 0.1);
    }
  }

  // ---------- MMLパーサ ----------
  // 返り値: {events:[{t,dur,notes:[midi]|drum:'k',vol}], len}
  A.parseMML = function (src, isDrum) {
    let i = 0;
    const s = src.replace(/;[^\n]*/g, '');
    let octave = 4,
      defLen = 8,
      vol = 12,
      gate = 7 / 8;
    let t = 0;
    const events = [];
    const loopStack = [];
    let lastEv = null;

    function peek() {
      return s[i];
    }
    function readNum() {
      let m = /^-?\d+/.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length;
      return parseInt(m[0], 10);
    }
    function readLen() {
      let n = readNum();
      let beats = 4 / (n || defLen);
      let add = beats;
      while (s[i] === '.') {
        add /= 2;
        beats += add;
        i++;
      }
      // タイ ^ による長さ加算 (c4^8)
      while (s[i] === '^') {
        i++;
        const n2 = readNum();
        let b2 = 4 / (n2 || defLen),
          a2 = b2;
        while (s[i] === '.') {
          a2 /= 2;
          b2 += a2;
          i++;
        }
        beats += b2;
      }
      return beats;
    }
    function readPitch(ch, oct) {
      let m = NOTE_BASE[ch];
      while (s[i] === '+' || s[i] === '#' || s[i] === '-') {
        m += s[i] === '-' ? -1 : 1;
        i++;
      }
      return (oct + 1) * 12 + m;
    }

    while (i < s.length) {
      const c = s[i].toLowerCase();
      i++;
      if (' \n\t\r|'.includes(c)) continue;
      if (isDrum && 'ksxhoctmb'.includes(c)) {
        const L = readLen();
        events.push({ t, dur: L, drum: c, vol: vol / 15 });
        t += L;
        continue;
      }
      if (c === 'o') octave = readNum();
      else if (c === '>') octave++;
      else if (c === '<') octave--;
      else if (c === 'l') {
        let n = readNum();
        defLen = n;
        while (s[i] === '.') i++;
      } else if (c === 'v') vol = readNum();
      else if (c === 'q') gate = readNum() / 8;
      else if (c === 't') readNum();
      else if (c === '[') loopStack.push({ start: i, count: null, evStart: events.length, tStart: t });
      else if (c === ']') {
        const n = readNum() || 2;
        const L = loopStack.pop();
        // 展開：既に1回分のイベントがあるので残りを複製
        const seg = events.slice(L.evStart);
        const segLen = t - L.tStart;
        for (let k = 1; k < n; k++) {
          seg.forEach((e) => events.push(Object.assign({}, e, { t: e.t + segLen * k })));
        }
        t += segLen * (n - 1);
      } else if (c === '&') {
        // 直前のノートを次のノートとつなげる
        if (lastEv) lastEv.tie = true;
      } else if (c === 'r') {
        const L = readLen();
        t += L;
        lastEv = null;
      } else if (c === '{') {
        // 和音
        const notes = [];
        let oc = octave;
        while (i < s.length && s[i] !== '}') {
          const cc = s[i].toLowerCase();
          i++;
          if (cc === '>') oc++;
          else if (cc === '<') oc--;
          else if (NOTE_BASE[cc] !== undefined) notes.push(readPitch(cc, oc));
        }
        i++;
        const L = readLen();
        lastEv = { t, dur: L * gate, notes, vol: vol / 15 };
        events.push(lastEv);
        t += L;
      } else if (!isDrum && NOTE_BASE[c] !== undefined) {
        const midi = readPitch(c, octave);
        const L = readLen();
        if (lastEv && lastEv.tie && lastEv.notes && lastEv.notes[0] === midi) {
          lastEv.dur = t + L * gate - lastEv.t;
          lastEv.tie = false;
        } else {
          lastEv = { t, dur: L * gate, notes: [midi], vol: vol / 15 };
          events.push(lastEv);
        }
        t += L;
      }
    }
    events.sort((a, b) => a.t - b.t);
    return { events, len: t };
  };

  // ---------- BGMシーケンサ ----------
  let cur = null; // {id, song, start, tracks, gain, timer}
  A.songs = A.songs || {};

  function compile(song) {
    if (song._compiled) return song._compiled;
    const tracks = song.ch.map((ch) => {
      const p = A.parseMML(ch.mml, ch.inst === 'drum');
      return Object.assign({}, ch, p);
    });
    let len = song.len || Math.max(...tracks.map((t) => t.len));
    song._compiled = { tracks, len };
    return song._compiled;
  }

  A.bgm = function (id, opt) {
    opt = opt || {};
    if (!ctx || !A.ready) {
      A._pendingBgm = id;
      A.curId = id;
      return;
    }
    if (cur && cur.id === id && !opt.restart) return;
    A.stopBgm(opt.fade === undefined ? 0.6 : opt.fade);
    A.curId = id;
    if (!id) return;
    const song = A.songs[id];
    if (!song) {
      console.warn('no song', id);
      return;
    }
    const comp = compile(song);
    const g = ctx.createGain();
    g.gain.value = song.vol || 1;
    g.connect(musicBus);
    const spb = 60 / song.tempo;
    const start = ctx.currentTime + 0.12;
    const st = { id, song, comp, gain: g, start, spb, idx: comp.tracks.map(() => 0), loopN: comp.tracks.map(() => 0), stopped: false };
    cur = st;
    st.timer = setInterval(() => schedule(st), 30);
    schedule(st);
  };

  function schedule(st) {
    if (st.stopped) return;
    const ahead = ctx.currentTime + 0.25;
    const L = st.comp.len;
    st.comp.tracks.forEach((tr, ti) => {
      if (!tr.events.length) return;
      let guard = 0;
      while (guard++ < 200) {
        const ev = tr.events[st.idx[ti]];
        if (!ev) break; // ループしない曲が終わった
        const time = st.start + (ev.t + st.loopN[ti] * L) * st.spb;
        if (time > ahead) break;
        if (time >= ctx.currentTime - 0.05) {
          const v = ev.vol * (tr.vol === undefined ? 1 : tr.vol);
          if (ev.drum) drum(ev.drum, time, v, st.gain);
          else ev.notes.forEach((n) => playNote(tr.inst, n + (tr.trans || 0), time, ev.dur * st.spb, v, tr.pan || 0, st.gain));
        }
        st.idx[ti]++;
        if (st.idx[ti] >= tr.events.length) {
          st.idx[ti] = 0;
          st.loopN[ti]++;
          if (st.song.loop === false) {
            st.idx[ti] = tr.events.length;
            break;
          }
        }
      }
    });
  }

  A.stopBgm = function (fade) {
    if (!cur) return;
    const st = cur;
    cur = null;
    st.stopped = true;
    clearInterval(st.timer);
    const t = ctx.currentTime;
    st.gain.gain.cancelScheduledValues(t);
    st.gain.gain.setValueAtTime(st.gain.gain.value, t);
    st.gain.gain.linearRampToValueAtTime(0.0001, t + (fade || 0.05));
    setTimeout(() => st.gain.disconnect(), ((fade || 0.05) + 0.5) * 1000);
  };

  A.muffle = function (on) {
    if (!ctx) return;
    const t = ctx.currentTime;
    musicFilter.frequency.cancelScheduledValues(t);
    musicFilter.frequency.setTargetAtTime(on ? 900 : 20000, t, 0.08);
  };
  A.setMusicVol = function (v) {
    A.musicVol = v;
    if (musicBus) musicBus.gain.value = v;
  };
  A.setSfxVol = function (v) {
    A.sfxVol = v;
    if (sfxBus) sfxBus.gain.value = v;
  };

  // ---------- 効果音 ----------
  function tone(type, f0, f1, dur, vol, opts) {
    opts = opts || {};
    const t = ctx.currentTime + (opts.delay || 0);
    const o = ctx.createOscillator();
    setOsc(o, type);
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    let n = g;
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      g.connect(f);
      n = f;
    }
    n.connect(sfxBus);
    if (opts.echo) {
      const e = ctx.createGain();
      e.gain.value = opts.echo;
      n.connect(e);
      e.connect(delayIn);
    }
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, ftype, freq, opts) {
    opts = opts || {};
    const t = ctx.currentTime + (opts.delay || 0);
    const n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = ftype || 'lowpass';
    f.frequency.setValueAtTime(freq || 2000, t);
    if (opts.f1) f.frequency.exponentialRampToValueAtTime(opts.f1, t + dur);
    f.Q.value = opts.q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f);
    f.connect(g);
    g.connect(sfxBus);
    n.start(t, Math.random() * 0.5);
    n.stop(t + dur + 0.02);
  }

  const SE = {
    cursor: () => tone('pulse25', 1320, 1320, 0.04, 0.12),
    ok: () => {
      tone('pulse25', 990, 990, 0.05, 0.13);
      tone('pulse25', 1480, 1480, 0.08, 0.13, { delay: 0.05 });
    },
    cancel: () => tone('pulse25', 700, 420, 0.09, 0.13),
    buzz: () => tone('square', 140, 120, 0.15, 0.12),
    swing: () => noise(0.12, 0.35, 'bandpass', 900, { f1: 3000, q: 1.2 }),
    hit: () => {
      noise(0.12, 0.5, 'lowpass', 2500, { f1: 300 });
      tone('square', 220, 70, 0.1, 0.18);
    },
    hurt: () => {
      tone('sawtooth', 400, 90, 0.22, 0.2, { filter: 1800 });
      noise(0.1, 0.3, 'lowpass', 1500);
    },
    kill: () => {
      noise(0.35, 0.45, 'lowpass', 3000, { f1: 120 });
      tone('square', 300, 40, 0.3, 0.15);
    },
    dash: () => noise(0.18, 0.3, 'highpass', 800, { f1: 4000 }),
    pickup: () => {
      tone('pulse25', 1046, 1046, 0.06, 0.12);
      tone('pulse25', 1568, 1568, 0.1, 0.12, { delay: 0.06 });
    },
    coin: () => {
      tone('pulse50', 1975, 1975, 0.05, 0.1);
      tone('pulse50', 2637, 2637, 0.18, 0.1, { delay: 0.05 });
    },
    door: () => {
      noise(0.25, 0.25, 'bandpass', 600, { f1: 1500, q: 3 });
      tone('sine', 300, 500, 0.2, 0.08);
    },
    step: () => noise(0.03, 0.08, 'lowpass', 900),
    mechstep: () => {
      tone('sine', 90, 40, 0.15, 0.3);
      noise(0.08, 0.15, 'lowpass', 500);
    },
    beam: () => {
      tone('sawtooth', 1800, 300, 0.22, 0.12, { filter: 4000, echo: 0.2 });
      tone('sine', 900, 1800, 0.12, 0.1);
    },
    shot: () => {
      tone('square', 900, 200, 0.08, 0.1);
      noise(0.05, 0.15, 'highpass', 3000);
    },
    saber: () => {
      tone('sawtooth', 200, 900, 0.18, 0.12, { filter: 2500 });
      noise(0.18, 0.25, 'bandpass', 1200, { f1: 4000, q: 2 });
    },
    boost: () => noise(0.35, 0.3, 'bandpass', 500, { f1: 2500, q: 1.5 }),
    explode: () => {
      noise(0.9, 0.7, 'lowpass', 1800, { f1: 60 });
      tone('sine', 120, 30, 0.6, 0.4);
    },
    bigexplode: () => {
      noise(1.8, 0.9, 'lowpass', 2500, { f1: 40 });
      tone('sine', 90, 20, 1.4, 0.5);
      noise(0.6, 0.4, 'highpass', 3000, { delay: 0.1 });
    },
    levelup: () => {
      [523, 659, 784, 1046, 1318].forEach((f, k) => tone('pulse25', f, f, 0.14, 0.12, { delay: k * 0.07, echo: 0.3 }));
    },
    heal: () => {
      [784, 988, 1175, 1568].forEach((f, k) => tone('sine', f, f, 0.2, 0.12, { delay: k * 0.06, echo: 0.3 }));
    },
    alarm: () => {
      tone('square', 880, 660, 0.25, 0.12);
      tone('square', 880, 660, 0.25, 0.12, { delay: 0.3 });
    },
    quake: () => {
      noise(1.5, 0.6, 'lowpass', 200, { f1: 60 });
      tone('sine', 50, 35, 1.4, 0.4);
    },
    echo: () => {
      [1318, 1760, 2093, 2637].forEach((f, k) => tone('sine', f, f * 1.01, 0.8, 0.07, { delay: k * 0.12, echo: 0.6 }));
    },
    save: () => {
      [784, 1046, 1318].forEach((f, k) => tone('triangle', f, f, 0.18, 0.2, { delay: k * 0.08 }));
    },
    lockon: () => tone('pulse12', 2400, 2400, 0.05, 0.08),
    charge: () => tone('sawtooth', 200, 1600, 0.6, 0.08, { filter: 3000 }),
    shield: () => tone('sine', 400, 1200, 0.3, 0.15, { echo: 0.3 }),
    item: () => {
      [659, 784, 988, 1318].forEach((f, k) => tone('pulse50', f, f, 0.1, 0.09, { delay: k * 0.05 }));
    },
    get: () => {
      [523, 659, 784, 1046].forEach((f, k) => tone('pulse25', f, f, k === 3 ? 0.5 : 0.12, 0.12, { delay: k * 0.1, echo: 0.3 }));
    },
    boot: () => {
      tone('sawtooth', 60, 600, 1.0, 0.12, { filter: 2000 });
      [440, 660, 880].forEach((f, k) => tone('pulse25', f, f, 0.12, 0.1, { delay: 0.9 + k * 0.1 }));
    },
    talk: () => {},
  };
  A.se = function (name) {
    if (!ctx || !A.ready) return;
    const f = SE[name];
    if (f) f();
  };
  // 会話ブリップ（キャラごとに声の高さ）
  A.blip = function (pitch, type) {
    if (!ctx || !A.ready) return;
    tone(type || 'pulse25', pitch, pitch * 0.97, 0.035, 0.05, { filter: 3500 });
  };
  // 単発メロディ（ジングル）
  A.jingle = function (mml, inst, tempo) {
    if (!ctx || !A.ready) return;
    const p = A.parseMML(mml, false);
    const spb = 60 / (tempo || 140);
    const t0 = ctx.currentTime + 0.05;
    p.events.forEach((e) => e.notes.forEach((n) => playNote(inst || 'sq25', n, t0 + e.t * spb, e.dur * spb, e.vol, 0, sfxBus)));
  };
})();
