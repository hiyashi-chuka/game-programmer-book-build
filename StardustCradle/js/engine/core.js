// =============================================================
//  core.js — 名前空間・ループ・入力・ユーティリティ
// =============================================================
window.G = window.G || {};
(function () {
  G.W = 480;
  G.H = 270;
  G.TS = 16;
  G.frame = 0;
  G.debug = /debug/.test(location.search);

  // ---------- 乱数・数学 ----------
  G.rand = (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  G.irand = (a, b) => Math.floor(G.rand(a, b + 1));
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  G.hash = (x, y, s) => {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
    h = ((h ^ (h >>> 13)) * 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // シード付き乱数
  G.srand = function (seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  };
  G.DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  G.dirFromVec = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
  G.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // 章ごとに変わる値：G.byCh({0:'序章のセリフ', 3:'3章以降のセリフ'})
  G.byCh = function (obj) {
    const ch = G.state ? G.state.chapter : 0;
    let best = null;
    for (const k of Object.keys(obj).map(Number).sort((a, b) => a - b)) if (k <= ch) best = obj[k];
    return best;
  };

  // ---------- 色 ----------
  G.hex2rgb = function (h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  G.rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => G.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  G.shade = function (hex, amt) {
    // amt: -1..1 (負=暗く、正=明るく)。暗部はわずかに青紫へ、明部は黄へ寄せる（ドット絵の色相シフト）
    const [r, g, b] = G.hex2rgb(hex);
    if (amt < 0) {
      const k = 1 + amt;
      return G.rgb2hex(r * k + 18 * -amt, g * k + 4 * -amt, b * k + 40 * -amt);
    }
    return G.rgb2hex(r + (255 - r) * amt + 10 * amt, g + (255 - g) * amt + 6 * amt, b + (255 - b) * amt * 0.85);
  };
  G.mix = function (a, b, t) {
    const A = G.hex2rgb(a),
      B = G.hex2rgb(b);
    return G.rgb2hex(G.lerp(A[0], B[0], t), G.lerp(A[1], B[1], t), G.lerp(A[2], B[2], t));
  };

  // ---------- キャンバス ----------
  G.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    c.ctx = x;
    return c;
  };

  G.initCanvas = function () {
    G.canvas = document.getElementById('screen');
    G.ctx = G.canvas.getContext('2d');
    G.buf = G.makeCanvas(G.W, G.H);
    G.bctx = G.buf.ctx;
    G.resize();
    window.addEventListener('resize', G.resize);
  };
  G.resize = function () {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    let s = Math.min(vw / G.W, vh / G.H);
    // 2倍以上なら整数倍にスナップしてドットを揃える
    const sd = s * dpr;
    let sReal = sd >= 2 ? Math.floor(sd) : sd;
    G.scale = sReal; // 実ピクセル/仮想ピクセル
    G.canvas.width = Math.round(G.W * sReal);
    G.canvas.height = Math.round(G.H * sReal);
    G.canvas.style.width = G.canvas.width / dpr + 'px';
    G.canvas.style.height = G.canvas.height / dpr + 'px';
    G.ctx.imageSmoothingEnabled = false;
  };

  // ---------- 入力 ----------
  const keyMap = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Space: 'ok', Enter: 'ok',
    KeyX: 'cancel', ShiftLeft: 'cancel', ShiftRight: 'cancel', Backspace: 'cancel',
    KeyC: 'skill',
    Escape: 'menu', KeyQ: 'menu', Tab: 'menu',
    KeyF: 'fast',
  };
  const I = (G.input = { held: {}, pressedSet: {}, touch: {} });
  const bufferPress = {};
  window.addEventListener('keydown', (e) => {
    const a = keyMap[e.code];
    if (G.audio) G.audio.init();
    if (!a) return;
    e.preventDefault();
    if (!I.held[a]) bufferPress[a] = true;
    I.held[a] = true;
    I.lastDevice = 'key';
  });
  window.addEventListener('keyup', (e) => {
    const a = keyMap[e.code];
    if (!a) return;
    I.held[a] = false;
  });
  window.addEventListener('blur', () => {
    for (const k in I.held) I.held[k] = false;
  });
  // ゲームパッド
  let padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    if (!p) return;
    const ax = p.axes[0] || 0,
      ay = p.axes[1] || 0;
    const b = (i) => p.buttons[i] && p.buttons[i].pressed;
    const st = {
      up: ay < -0.4 || b(12),
      down: ay > 0.4 || b(13),
      left: ax < -0.4 || b(14),
      right: ax > 0.4 || b(15),
      ok: b(0),
      cancel: b(1),
      skill: b(2) || b(3),
      menu: b(9) || b(8),
    };
    for (const k in st) {
      if (st[k] && !padPrev[k]) {
        bufferPress[k] = true;
        if (G.audio) G.audio.init();
      }
      if (st[k] !== padPrev[k]) I.held[k] = st[k];
    }
    padPrev = st;
  }
  I.update = function () {
    pollPad();
    I.pressedSet = Object.assign({}, bufferPress);
    for (const k in bufferPress) delete bufferPress[k];
    // タッチ
    for (const k in I.touch) {
      if (I.touch[k] && !I._touchPrev?.[k]) I.pressedSet[k] = true;
    }
    I._touchPrev = Object.assign({}, I.touch);
  };
  I.down = (a) => !!(I.held[a] || I.touch[a]);
  I.pressed = (a) => !!I.pressedSet[a];
  I.consume = (a) => {
    delete I.pressedSet[a];
  };
  I.clear = () => {
    I.pressedSet = {};
  };
  I.axis = function () {
    let x = 0,
      y = 0;
    if (I.down('left')) x -= 1;
    if (I.down('right')) x += 1;
    if (I.down('up')) y -= 1;
    if (I.down('down')) y += 1;
    return [x, y];
  };

  // タッチ操作（スマホ用の仮想パッド）
  G.initTouch = function () {
    const tc = document.getElementById('touch');
    if (!tc) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;
    tc.style.display = 'block';
    tc.querySelectorAll('[data-k]').forEach((el) => {
      const k = el.dataset.k;
      const on = (e) => {
        e.preventDefault();
        if (G.audio) G.audio.init();
        I.touch[k] = true;
        el.classList.add('on');
      };
      const off = (e) => {
        e.preventDefault();
        I.touch[k] = false;
        el.classList.remove('on');
      };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('touchcancel', off, { passive: false });
    });
    // 十字キー（スティック）
    const pad = document.getElementById('tpad');
    if (pad) {
      const upd = (e) => {
        e.preventDefault();
        if (G.audio) G.audio.init();
        const t = e.targetTouches[0];
        I.touch.up = I.touch.down = I.touch.left = I.touch.right = false;
        if (!t) return;
        const r = pad.getBoundingClientRect();
        const dx = t.clientX - (r.left + r.width / 2),
          dy = t.clientY - (r.top + r.height / 2);
        const dz = r.width * 0.15;
        if (dx < -dz) I.touch.left = true;
        if (dx > dz) I.touch.right = true;
        if (dy < -dz) I.touch.up = true;
        if (dy > dz) I.touch.down = true;
      };
      pad.addEventListener('touchstart', upd, { passive: false });
      pad.addEventListener('touchmove', upd, { passive: false });
      pad.addEventListener('touchend', upd, { passive: false });
    }
  };

  // ---------- シーン管理 ----------
  // シーンは {update(), draw(ctx)}。G.scene が現在のシーン
  G.setScene = function (s) {
    if (G.scene && G.scene.exit) G.scene.exit();
    G.scene = s;
    if (s.enter) s.enter();
  };

  // ---------- メインループ ----------
  let acc = 0,
    last = 0;
  const STEP = 1000 / 60;
  G.timeScale = 1;
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!last) last = ts;
    let dt = ts - last;
    last = ts;
    if (dt > 250) dt = 250;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      acc -= STEP;
      n++;
      tick();
      if (I.down('fast') && G.debug) {
        tick();
        tick();
      }
    }
    if (n > 0) render();
  }
  function tick() {
    I.update();
    G.frame++;
    if (G.scene && G.scene.update) G.scene.update();
    G.tasks.update();
  }
  function render() {
    const c = G.bctx;
    if (G.scene && G.scene.draw) G.scene.draw(c);
    G.ctx.imageSmoothingEnabled = false;
    G.ctx.drawImage(G.buf, 0, 0, G.canvas.width, G.canvas.height);
    if (G.scene && G.scene.drawHi) {
      G.ctx.save();
      G.ctx.scale(G.scale, G.scale);
      G.scene.drawHi(G.ctx);
      G.ctx.restore();
    }
  }
  G.start = function () {
    requestAnimationFrame(loop);
  };

  // ---------- フレーム待ちタスク（スクリプト用） ----------
  // Promiseベースで「nフレーム待つ」「条件まで待つ」を実現
  G.tasks = {
    list: [],
    update() {
      const l = this.list;
      this.list = [];
      for (const t of l) {
        if (t.fn()) t.resolve();
        else this.list.push(t);
      }
    },
    until(fn) {
      return new Promise((resolve) => this.list.push({ fn, resolve }));
    },
  };
  G.waitFrames = function (n) {
    let c = 0;
    return G.tasks.until(() => ++c >= n);
  };
  G.waitPress = function (key) {
    return G.tasks.until(() => I.pressed(key || 'ok'));
  };
})();
