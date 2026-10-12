// =============================================================
//  maps/school.js — 第三中学校（校庭・廊下・2年B組・職員室・屋上）
//  ワールド担当（part 2）。共有ヘルパー G.W2 もここで定義する。
// =============================================================
(function () {
  const W2 = (G.W2 = G.W2 || {});
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);

  // ---------------------------------------------------------------
  //  共有ヘルパー
  // ---------------------------------------------------------------
  // 文字グリッドを組み立てて rows を作る
  W2.grid = function (w, h, ch) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(ch));
    const o = {
      g,
      w,
      h,
      fill(x, y, ww, hh, c) {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && i >= 0 && i < w) g[j][i] = c;
        return o;
      },
      set(x, y, c) {
        if (g[y] && x >= 0 && x < w) g[y][x] = c;
        return o;
      },
      get(x, y) {
        return g[y] ? g[y][x] : undefined;
      },
      // 文字列を横に書く（'?' はそのまま）
      put(x, y, s) {
        for (let i = 0; i < s.length; i++) if (s[i] !== '?') o.set(x + i, y, s[i]);
        return o;
      },
      box(x, y, ww, hh, c) {
        o.fill(x, y, ww, 1, c).fill(x, y + hh - 1, ww, 1, c).fill(x, y, 1, hh, c).fill(x + ww - 1, y, 1, hh, c);
        return o;
      },
      rows() {
        return g.map((rr) => rr.join(''));
      },
    };
    return o;
  };
  // セリフ：文字列 / 配列 / {章:…} を受け取って順に話す
  W2.lines = function (who, v) {
    return async function () {
      let t = typeof v === 'function' ? v() : v;
      if (t && typeof t === 'object' && !Array.isArray(t)) t = G.byCh(t);
      if (!t) return;
      for (const s of [].concat(t)) await E.say(who, s);
    };
  };
  W2.town = () => !E.flag('w_evac');
  // 第三中の制服の生徒
  const UNI = { top: '#2a3460', top2: '#f4f2fb', bottom: '#22263e', outfit: 'uniform', tie: '#ff4f6a', shoes: '#f0f0f8' };
  W2.student = function (id, name, seed, girl, over) {
    return G.mob(id, name, seed, { girl: !!girl, old: false, kid: false, over: Object.assign({}, UNI, girl ? { bstyle: 'skirt', socks: '#f4f2fb', tie: '#ff4f6a' } : { bstyle: 'pants' }, over || {}) });
  };
  // 時間帯（屋内でも外の時間に合わせる）
  W2.indoorTime = () => (G.state.time === 'night' ? 'night' : G.state.time === 'evening' ? 'evening' : 'day');

  // 星屑メモリー：初めて拾ったらクエスト開始
  W2.memEvents = function (list) {
    return list.map(([x, y]) => ({
      x,
      y,
      cond: () => !E.questState('memories'),
      run: async () => {
        await E.wait(12);
        E.quest('memories');
      },
    }));
  };
  W2.memEnter = async function () {
    if ((G.state.memories || 0) > 0 && !E.questState('memories')) E.quest('memories');
  };
  // 七不思議（mimi_scoop）の噂を聞く。聞けたら true
  W2.rumor = async function (n, who, text) {
    if (E.questState('mimi_scoop') !== 'active' || E.flag('w2_rumor' + n)) return false;
    await E.say(who, text);
    E.set('w2_rumor' + n);
    const got = [1, 2, 3, 4].filter((i) => E.flag('w2_rumor' + i)).length;
    G.audio.se('get');
    E.toast('七不思議のネタをメモした（' + got + '/4）', '#ffd25e');
    return true;
  };

  // 屋内の壁を「2段の壁面」に見せる＋壁に貼った小物を描き直す＋窓
  W2.paintWalls = function (c, m) {
    const pal = m.pal || {};
    const face = pal.wall || '#e8dcc8';
    const isW = (x, y) => m.cell(x, y) === 'w';
    const nonWall = (x, y) => {
      const t = m.cell(x, y);
      return t && G.TILES[t] && !G.TILES[t].solid;
    };
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        if (!isW(x, y) || !isW(x, y + 1) || !nonWall(x, y + 2)) continue;
        if (y > 0 && !isW(x, y - 1)) continue;
        const X = x * S,
          Y = y * S;
        r(c, X, Y, S, S, face);
        for (let i = 0; i < S; i += 4) r(c, X + i, Y, 1, S, G.shade(face, -0.05));
        r(c, X, Y + 15, S, 2, face); // 下の壁面とつなげる
        r(c, X, Y + 6, S, 1, G.shade(face, -0.1)); // 腰の見切り
        r(c, X, Y, S, 2, G.shade(face, -0.25));
        if (!isW(x - 1, y + 1) || !nonWall(x - 1, y + 2)) r(c, X, Y, 1, 32, G.shade(face, -0.2));
        if (!isW(x + 1, y + 1) || !nonWall(x + 1, y + 2)) r(c, X + 15, Y, 1, 32, G.shade(face, -0.3));
      }
    // 窓（外の景色・時間帯で変わる）
    (m.def.wins || []).forEach(([x, y, w]) => W2.drawWin(c, x * S, y * S + 2, w * S, 24));
    // 壁の上の平置き小物を描き直す（壁塗りで消えるため）
    (m.def.objects || []).forEach((o) => {
      if (!o.wall) return;
      if (o.show && !o.show()) return;
      const opts = Object.assign({}, o);
      ['p', 'x', 'y', 'to', 'tx', 'ty', 'dir', 'id', 'talk', 'msg', 'show', 'nosolid'].forEach((k) => delete opts[k]);
      const d = G.prop(o.p, opts);
      if (d) c.drawImage(d.img, o.x * S + d.ox, o.y * S + d.oy);
    });
  };
  // 大きな窓（コロニーの空：向こう側の街が見える）
  W2.drawWin = function (c, X, Y, w, h) {
    const t = G.state.time;
    const sky = t === 'night' ? ['#0e0c2a', '#1c1840'] : t === 'evening' ? ['#ff9a6a', '#ffcf9a'] : t === 'morning' ? ['#9ad4f4', '#d8f0ff'] : ['#7ec4f0', '#bfe6ff'];
    r(c, X, Y, w, h, '#9aa0b4');
    r(c, X + 1, Y + 1, w - 2, h - 2, '#f2f2f6');
    r(c, X + 2, Y + 2, w - 4, h - 4, sky[0]);
    r(c, X + 2, Y + 2 + Math.floor((h - 4) / 2), w - 4, Math.ceil((h - 4) / 2), sky[1]);
    // 空に浮かぶ「向こう側の街」
    for (let i = X + 3; i < X + w - 3; i += 2) {
      const hh = 1 + Math.floor(G.hash(i, Y, 7) * 3);
      r(c, i, Y + 3, 2, hh, t === 'night' ? '#2a2850' : t === 'evening' ? '#c87a6a' : '#8ab0c8');
      if (t === 'night' && G.hash(i, Y, 9) > 0.6) px(c, i, Y + 3 + hh - 1, '#ffd890');
    }
    // 校庭の木
    for (let i = X + 3; i < X + w - 3; i += 5) G.ellipse(c, i + 2, Y + h - 5, 3, 2, t === 'night' ? '#1a3028' : '#5aa858');
    for (let i = X + S; i < X + w; i += S) r(c, i - 1, Y + 1, 2, h - 2, '#f2f2f6');
    r(c, X + 1, Y + Math.floor(h / 2), w - 2, 1, '#f2f2f6');
    G.line(c, X + 4, Y + h - 6, X + 9, Y + 4, 'rgba(255,255,255,0.5)');
    r(c, X, Y + h - 1, w, 2, '#8a8ea0');
  };

  // ---------------------------------------------------------------
  //  カスタム小物（w2_ 接頭辞）
  // ---------------------------------------------------------------
  const P = G.PROPS;
  // 校門（6×1：両端が門柱）
  P.w2_gate = function (o) {
    const W = 96,
      cv = mk(W, 64),
      c = cv.ctx;
    for (const x0 of [0, 80]) {
      r(c, x0 + 1, 60, 16, 4, 'rgba(20,10,40,0.3)');
      r(c, x0 + 1, 18, 14, 44, '#b8b4ac');
      r(c, x0 + 1, 18, 3, 44, '#d4d0c8');
      r(c, x0 + 12, 18, 3, 44, '#8a8680');
      r(c, x0, 14, 16, 5, '#8a8680');
      r(c, x0, 14, 16, 1, '#d8d4cc');
    }
    // 校名の表札（縦書き風の板）
    r(c, 4, 24, 8, 30, '#f4f0e4');
    r(c, 4, 24, 8, 1, '#ffffff');
    for (let j = 0; j < 6; j++) r(c, 6, 27 + j * 4, 4, 2, '#2a2a3a');
    // アーチ
    r(c, 8, 4, 80, 11, '#3a4a7a');
    r(c, 8, 4, 80, 1, '#6a7ab0');
    r(c, 8, 14, 80, 1, '#1a2240');
    G.pixText(c, 'NO.3 JUNIOR HIGH', 48 - G.pixTextW('NO.3 JUNIOR HIGH') / 2, 7, '#ffd25e');
    // 開いた門扉（右の柱の手前にたたまれている）
    for (let i = 0; i < 4; i++) r(c, 66 + i * 3, 40, 1, 20, '#7a8090');
    r(c, 64, 40, 16, 2, '#9aa0b0');
    r(c, 64, 58, 16, 2, '#6a7080');
    return { w: 6, h: 1, img: cv, ox: 0, oy: -48, solid: [[0, 0, 1, 1], [5, 0, 1, 1]] };
  };
  // 飼育小屋（3×2）
  P.w2_hutch = function () {
    const cv = mk(48, 52),
      c = cv.ctx;
    r(c, 2, 48, 46, 4, 'rgba(20,10,40,0.3)');
    // 屋根
    r(c, 0, 4, 48, 12, '#4a8a6a');
    for (let i = 0; i < 48; i += 4) r(c, i, 4, 1, 12, '#3a6a52');
    r(c, 0, 4, 48, 2, '#6ab08a');
    r(c, 0, 15, 48, 2, '#2a4a3a');
    // 木枠と金網
    r(c, 1, 17, 46, 33, '#a07040');
    r(c, 4, 19, 40, 26, '#e8d8b0');
    for (let i = 4; i < 44; i += 3) G.line(c, i, 19, i + 3, 44, 'rgba(120,130,150,0.8)');
    for (let i = 4; i < 44; i += 3) G.line(c, i + 3, 19, i, 44, 'rgba(150,160,180,0.8)');
    // ウサギ
    for (const [x, y, col] of [[12, 36, '#ffffff'], [28, 38, '#e8c8a0'], [36, 34, '#ffffff']]) {
      G.ellipse(c, x, y, 4, 3, col);
      r(c, x - 3, y - 6, 1, 4, col);
      r(c, x - 1, y - 6, 1, 4, col);
      px(c, x - 3, y - 1, '#e04a6a');
    }
    r(c, 18, 41, 6, 2, '#ff8a3a');
    r(c, 1, 45, 46, 5, '#8a5a30');
    r(c, 4, 46, 14, 3, '#f0f0e8');
    G.pixText(c, 'PYON', 5, 46, '#c03a3a');
    return { w: 3, h: 2, img: cv, ox: 0, oy: -20, solid: true };
  };
  // バスケットゴール
  P.w2_hoop = function (o) {
    const cv = mk(16, 52),
      c = cv.ctx;
    r(c, 3, 48, 10, 4, 'rgba(20,10,40,0.3)');
    r(c, 7, 14, 3, 37, '#5a6070');
    r(c, 7, 14, 1, 37, '#8a90a0');
    r(c, 0, 2, 16, 12, '#f4f4f8');
    r(c, 1, 3, 14, 10, '#ffffff');
    r(c, 5, 6, 6, 5, '#e05a3a');
    r(c, 6, 7, 4, 3, '#ffffff');
    r(c, 3, 13, 10, 2, '#ff7a3a');
    for (let i = 0; i < 4; i++) G.line(c, 4 + i * 3, 15, 5 + i * 2, 20, '#e8e8f0');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -36, solid: true };
  };
  // サッカーゴール（3×1）
  P.w2_goal = function (o) {
    const cv = mk(48, 30),
      c = cv.ctx;
    r(c, 2, 26, 44, 4, 'rgba(20,10,40,0.2)');
    for (let i = 4; i < 44; i += 3) G.line(c, i, 6, i, 26, 'rgba(230,230,240,0.7)');
    for (let j = 8; j < 26; j += 3) r(c, 2, j, 44, 1, 'rgba(230,230,240,0.55)');
    r(c, 0, 2, 48, 3, '#f4f4f8');
    r(c, 0, 2, 3, 26, '#f4f4f8');
    r(c, 45, 2, 3, 26, '#f4f4f8');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -14, solid: [[0, 0, 1, 1], [2, 0, 1, 1]] };
  };
  // 教室の引き戸（壁の2段ぶん）
  P.w2_door = function (o) {
    const cv = mk(16, 32),
      c = cv.ctx;
    const col = o.col || '#c89a68';
    r(c, 0, 2, 16, 30, '#5a4a40');
    r(c, 1, 3, 14, 29, col);
    r(c, 8, 3, 1, 29, G.shade(col, -0.35));
    r(c, 2, 6, 5, 8, '#9ad0f0');
    r(c, 9, 6, 5, 8, '#9ad0f0');
    px(c, 3, 7, '#e8f6ff');
    px(c, 10, 7, '#e8f6ff');
    r(c, 6, 18, 1, 4, '#4a3a30');
    r(c, 10, 18, 1, 4, '#4a3a30');
    r(c, 1, 29, 14, 3, G.shade(col, -0.25));
    // 表札
    if (o.label) {
      r(c, 0, 0, 16, 7, '#f6f6f2');
      r(c, 0, 6, 16, 1, '#8a8a98');
      G.pixText(c, o.label, 8 - Math.floor(G.pixTextW(o.label) / 2), 1, o.labelCol || '#2a3460');
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  // 黒板（壁2段ぶん）
  P.w2_blackboard = function (o) {
    const w = o.w || 6,
      W = w * S;
    const cv = mk(W, 28),
      c = cv.ctx;
    const white = o.white;
    r(c, 0, 0, W, 26, '#8a6a40');
    r(c, 2, 2, W - 4, 21, white ? '#f4f6f8' : '#2f5a46');
    for (let i = 0; i < 6; i++) {
      const x = 6 + Math.floor(G.hash(i, w, 3) * (W - 24)),
        y = 5 + Math.floor(G.hash(w, i, 4) * 12);
      G.line(c, x, y, x + 6 + i * 2, y + (i % 2), white ? '#3a6ad0' : '#d8e8e0');
    }
    if (o.text) G.pixText(c, o.text, 6, 4, white ? '#e04a4a' : '#f0f0e8');
    if (o.text2) G.pixText(c, o.text2, W - 6 - G.pixTextW(o.text2), 4, white ? '#2a2a3a' : '#ffd8e8');
    if (!white) {
      // 相合傘…ではなくAFの落書き
      const ax = W - 26;
      r(c, ax + 4, 12, 6, 6, '#d8e8e0');
      r(c, ax + 5, 13, 4, 2, '#2f5a46');
      r(c, ax + 2, 18, 10, 1, '#d8e8e0');
      r(c, ax + 6, 10, 2, 2, '#ffd8e8');
    }
    r(c, 2, 23, W - 4, 3, '#a07a4a');
    r(c, 8, 22, 4, 1, '#ffffff');
    r(c, 14, 22, 3, 1, '#ffd25e');
    r(c, 19, 22, 3, 1, '#ff8fb8');
    return { w, h: 1, img: cv, ox: 0, oy: 2, solid: false, flat: true };
  };
  // 掲示板（壁）
  P.w2_board = function (o) {
    const w = o.w || 2,
      W = w * S;
    const cv = mk(W, 22),
      c = cv.ctx;
    r(c, 0, 0, W, 22, '#7a5a3a');
    r(c, 1, 1, W - 2, 20, '#c8a070');
    for (let i = 0; i < w * 3; i++) {
      const x = 2 + Math.floor(G.hash(i, w, 1) * (W - 10)),
        y = 2 + Math.floor(G.hash(w, i, 2) * 10);
      const col = ['#ffffff', '#ffe8a0', '#ffd0e0', '#d0f0ff'][i % 4];
      r(c, x, y, 7, 8, col);
      r(c, x + 1, y + 2, 5, 1, '#9a9aa8');
      r(c, x + 1, y + 4, 4, 1, '#9a9aa8');
      px(c, x + 3, y, '#e04a4a');
    }
    if (o.text) {
      r(c, 2, 14, G.pixTextW(o.text) + 4, 7, '#2a3460');
      G.pixText(c, o.text, 4, 15, '#ffd25e');
    }
    return { w, h: 1, img: cv, ox: 0, oy: 4, solid: false, flat: true };
  };
  // 壁の掛け時計
  P.w2_clock = function (o) {
    const cv = mk(16, 16),
      c = cv.ctx;
    G.ellipse(c, 8, 8, 6, 6, '#3a3a48');
    G.ellipse(c, 8, 8, 5, 5, '#ffffff');
    r(c, 8, 4, 1, 4, '#2a2a3a');
    r(c, 8, 8, 3, 1, '#e04a4a');
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  // 階段（上り）
  P.w2_stairsup = function (o) {
    const w = o.w || 2,
      W = w * S;
    const cv = mk(W, 32),
      c = cv.ctx;
    r(c, 0, 0, W, 32, '#4a4a5a');
    for (let j = 0; j < 6; j++) {
      const y = 2 + j * 5;
      r(c, 1, y, W - 2, 5, G.shade('#c8c4bc', -0.05 * (5 - j)));
      r(c, 1, y, W - 2, 1, '#eeeae4');
      r(c, 1, y + 4, W - 2, 1, '#8a8680');
    }
    r(c, 0, 0, 2, 32, '#8a90a0');
    r(c, W - 2, 0, 2, 32, '#8a90a0');
    G.pixText(c, 'ROOF', W / 2 - 7, 1, '#ffd25e');
    return { w, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  // 屋上の塔屋（階段室）4×2・扉は (2,1)
  P.w2_stairhouse = function () {
    const W = 64,
      cv = mk(W, 64),
      c = cv.ctx;
    r(c, 2, 60, 62, 4, 'rgba(20,10,40,0.3)');
    // 屋根
    r(c, 0, 4, W, 26, '#9a9aaa');
    r(c, 2, 6, W - 4, 22, '#c4c4d0');
    for (let i = 2; i < W - 2; i += 8) r(c, i, 6, 1, 22, '#b4b4c0');
    r(c, 0, 4, W, 2, '#e0e0ea');
    r(c, 40, 10, 14, 9, '#e8e8ee');
    r(c, 40, 18, 14, 1, '#a8a8b8');
    G.ellipse(c, 45, 14, 3, 3, '#9aa0b0');
    // 壁
    r(c, 0, 30, W, 32, '#d4d4dc');
    r(c, 0, 30, W, 2, '#8a8a9a');
    for (let k = 0; k < 10; k++) px(c, Math.floor(G.hash(k, 1, 3) * W), 34 + Math.floor(G.hash(k, 2, 3) * 24), '#c4c4cc');
    r(c, 0, 60, W, 2, '#9a9aa8');
    // 鉄の扉
    r(c, 33, 38, 14, 24, '#4a5a7a');
    r(c, 34, 39, 12, 23, '#6a7a9a');
    r(c, 36, 41, 8, 6, '#9ad0f0');
    px(c, 44, 52, '#e8c050');
    // 非常口サイン
    r(c, 34, 33, 12, 4, '#2a9a5a');
    G.pixText(c, 'EXIT', 33, 32, '#e8fff0');
    // 小窓・配管
    r(c, 8, 38, 10, 8, '#6a7080');
    r(c, 9, 39, 8, 6, '#8ac8f0');
    r(c, 22, 30, 2, 32, '#8a92a6');
    return { w: 4, h: 2, img: cv, ox: 0, oy: -32, solid: [[0, 0, 4, 1], [0, 1, 2, 1], [3, 1, 1, 1]], lights: [{ x: 40, y: 3, r: 14, col: '#3aff8a', a: 0.6 }] };
  };
  // 望遠鏡（天文部）
  P.w2_scope = function () {
    const cv = mk(16, 30),
      c = cv.ctx;
    r(c, 3, 27, 10, 3, 'rgba(20,10,40,0.3)');
    G.line(c, 8, 16, 3, 28, '#5a5a6a');
    G.line(c, 8, 16, 13, 28, '#5a5a6a');
    G.line(c, 8, 16, 8, 28, '#7a7a8a');
    for (let i = 0; i < 4; i++) r(c, 2 + i * 2, 12 - i * 3, 9, 4, i ? '#f0f0f4' : '#3a6ad0');
    r(c, 11, 2, 4, 4, '#3a3a48');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -14, solid: true };
  };
  // 屋上の室外機
  P.w2_ac = function () {
    const cv = mk(32, 22),
      c = cv.ctx;
    r(c, 1, 18, 30, 4, 'rgba(20,10,40,0.3)');
    r(c, 1, 2, 30, 17, '#e4e6ee');
    r(c, 1, 2, 30, 2, '#ffffff');
    r(c, 1, 17, 30, 2, '#a0a4b4');
    for (const cx of [9, 23]) {
      G.ellipse(c, cx, 10, 6, 6, '#9aa0b0');
      G.ellipse(c, cx, 10, 5, 5, '#6a7080');
      r(c, cx - 5, 10, 11, 1, '#9aa0b0');
      r(c, cx, 5, 1, 11, '#9aa0b0');
    }
    return { w: 2, h: 1, img: cv, ox: 0, oy: -6, solid: true };
  };
  // コーヒーメーカー付きの棚（職員室）
  P.w2_coffee = function () {
    const cv = mk(32, 30),
      c = cv.ctx;
    r(c, 0, 12, 32, 18, '#8a6a4a');
    r(c, 0, 12, 32, 3, '#c8b090');
    r(c, 3, 0, 10, 13, '#2a2a34');
    r(c, 4, 2, 8, 4, '#4a4a58');
    r(c, 5, 8, 6, 5, '#7a4a2a');
    px(c, 10, 3, '#ff3050');
    r(c, 16, 6, 5, 6, '#f0f0f0');
    r(c, 22, 7, 5, 5, '#ffd25e');
    r(c, 22, 6, 5, 1, '#e8a050');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -14, solid: true, steam: [8, -12] };
  };
  // ドーナツの箱（机の上用・小さい）
  P.w2_donutbox = function () {
    const cv = mk(16, 12),
      c = cv.ctx;
    r(c, 1, 3, 14, 8, '#ff8fb8');
    r(c, 1, 3, 14, 2, '#ffc0d8');
    G.pixText(c, 'D', 6, 5, '#ffffff');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -26, solid: false, flat: false };
  };
  // カメラ三脚（新聞部）
  P.w2_tripod = function () {
    const cv = mk(16, 28),
      c = cv.ctx;
    r(c, 3, 25, 10, 3, 'rgba(20,10,40,0.3)');
    G.line(c, 8, 12, 3, 26, '#3a3a48');
    G.line(c, 8, 12, 13, 26, '#3a3a48');
    G.line(c, 8, 12, 8, 26, '#5a5a6a');
    r(c, 3, 4, 10, 8, '#2a2a34');
    r(c, 6, 2, 4, 2, '#2a2a34');
    G.ellipse(c, 8, 8, 3, 3, '#5a7ab0');
    px(c, 7, 7, '#ffffff');
    px(c, 11, 5, '#ff3050');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -12, solid: true };
  };

  // ---------------------------------------------------------------
  //  校庭 school_yard（46×40）
  // ---------------------------------------------------------------
  const Y = W2.grid(46, 40, '.');
  Y.fill(0, 0, 46, 1, 'F').fill(0, 0, 1, 38, 'F').fill(45, 0, 1, 38, 'F');
  Y.fill(0, 38, 46, 1, 'B').fill(20, 38, 6, 1, '=').fill(0, 39, 46, 1, '=');
  Y.fill(1, 1, 6, 9, 'c'); // 駐輪場
  Y.fill(1, 10, 44, 3, '+'); // 昇降口前の広場
  Y.fill(20, 13, 6, 25, '='); // 校門への道
  // トラック（スタジアム型）
  const TR = { cx: 9.5, y1: 21, y2: 28, R: 7.8, r: 5.2 };
  const segD = (x, y) => {
    const yy = Math.max(TR.y1, Math.min(TR.y2, y));
    return Math.hypot(x - TR.cx, y - yy);
  };
  for (let y = 12; y <= 37; y++)
    for (let x = 1; x <= 18; x++) {
      // タイルのどこかがトラックにかかっていれば土にする（輪郭は decorate でなめらかに塗る）
      let hit = false;
      for (const [ox, oy] of [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9], [0.5, 0.5]]) {
        const d = segD(x + ox, y + oy);
        if (d <= TR.R && d >= TR.r) hit = true;
      }
      if (hit) Y.set(x, y, ':');
    }
  Y.fill(28, 14, 16, 9, 'c'); // バスケットコート
  Y.fill(28, 26, 9, 5, 'o'); // 学級菜園
  Y.fill(37, 26, 1, 5, ':');
  Y.fill(27, 33, 18, 4, 'c'); // 自転車置き場（東）
  Y.fill(1, 37, 17, 1, 'H').fill(28, 37, 17, 1, 'H');
  Y.fill(44, 13, 1, 9, 'H');
  // 桜並木と街灯
  [14, 18, 22, 26, 30, 34].forEach((yy, i) => {
    Y.set(19, yy, 'Y').set(26, yy, i % 2 ? 'Y' : 'Y');
  });
  [16, 24, 32].forEach((yy) => Y.set(18, yy, 'L').set(27, yy, 'L'));
  Y.set(1, 13, 'Y').set(17, 13, 'Y').set(1, 36, 'Y').set(17, 36, 'Y');
  Y.set(26, 36, 'V').set(27, 36, 'V').set(28, 32, 'j');
  Y.set(7, 2, 'j').set(6, 9, 'L').set(39, 9, 'L').set(1, 10, 'q').set(44, 10, 'q');
  Y.set(44, 24, 'q').set(44, 26, 'Y').set(44, 31, 'q').set(27, 24, 'b').set(43, 24, 'b');
  Y.set(18, 11, 'P').set(27, 11, 'P');

  const yardTalk = W2.lines;
  G.mob('w2_gen', '用務員のゲンさん', 101, { old: true, girl: false, over: { top: '#5a7a5a', outfit: 'jumpsuit', bottom: '#5a7a5a', acc: ['cap'], accCol: '#3a5a3a' } });
  W2.student('w2_hayate', '陸上部のハヤテ', 102, false, { outfit: 'tshirt', top: '#f0f0f8', top2: '#3a6ad0', bstyle: 'shorts', bottom: '#3a6ad0', acc: ['bandana'], accCol: '#ff4f6a' });
  W2.student('w2_hana', '園芸部のハナ', 103, true, { acc: ['cap'], accCol: '#f0e0a0' });
  W2.student('w2_daichi', 'バスケ部のダイチ', 104, false, { outfit: 'tank', top: '#e0803a', bottom: '#2a2a40', bstyle: 'shorts', build: 'tall' });
  W2.student('w2_kouhai1', '1年生のソラ', 105, false, { build: 'small' });
  W2.student('w2_kick', 'サッカー部のケンジ', 107, false, { outfit: 'tshirt', top: '#40a070', top2: '#ffffff', bstyle: 'shorts', bottom: '#2a2a40', style: 'buzz' });
  W2.student('w2_kouhai2', '1年生のウミ', 106, true, { build: 'small' });

  G.defMap('school_yard', {
    name: '第三中学校',
    area: '校庭',
    bgm: 'school',
    outdoor: true,
    ambient: 'petals',
    floor: '.',
    pal: { brickwall: '#b06a58', concrete: '#c4c2c8' },
    rows: Y.rows(),
    objects: [
      { p: 'bldg', x: 8, y: 2, w: 30, h: 8, style: 'school', door: 14, doorType: 'glass', to: 'school_hall', tx: 23, ty: 15, dir: 'up', seed: 3, antenna: true },
      { p: 'bldg', x: 39, y: 3, w: 5, h: 4, style: 'garage', roof: 'metal', roofCol: '#7a8aa0', wall: '#c8ccd8', sign: 'GYM', signCol: '#c03a3a', door: 2, msg: '体育倉庫だ。カギがかかっている。中からボールの空気が抜ける音がした……気がする。' },
      { p: 'w2_hutch', x: 39, y: 27, msg: '飼育小屋。ウサギの「ピョン吉」が、もぐもぐと人工ニンジンを食べている。' },
      { p: 'w2_gate', x: 20, y: 38 },
      { p: 'w2_hoop', x: 28, y: 18 },
      { p: 'w2_hoop', x: 43, y: 18 },
      { p: 'w2_goal', x: 8, y: 16 },
      { p: 'w2_goal', x: 8, y: 32 },
      { p: 'flowerbed', x: 8, y: 10, w: 12 },
      { p: 'flowerbed', x: 26, y: 10, w: 12 },
      { p: 'flowerbed', x: 28, y: 31, w: 4 },
      { p: 'flowerbed', x: 33, y: 31, w: 4 },
      { p: 'bench', x: 30, y: 24, msg: '「バスケ部 ベンチ」と書いてある。座ると少しきしむ。' },
      { p: 'bench', x: 36, y: 24 },
      { p: 'bench', x: 10, y: 12, msg: '昇降口前のベンチ。昼休みは取り合いになるらしい。' },
      { p: 'sign', x: 5, y: 2, text: 'BIKE', col: '#3a6ad0' },
      { p: 'sign', x: 38, y: 32, text: 'BIKE', col: '#3a6ad0' },
      { p: 'sign', x: 37, y: 25, text: 'FARM', col: '#4a8a3a', msg: '「2年B組 学級菜園　水やり当番：ポンタ」' },
      { p: 'sign', x: 18, y: 36, text: 'TRACK', col: '#c03a3a', msg: '「トラック1周200m。走る時は反時計回り」' },
      ...[2, 3, 4, 5].flatMap((x) => [3, 5, 7].map((y) => ({ p: 'bicycle', x, y, col: ['#3a7ad0', '#e04a4a', '#40a070', '#f0f0f0', '#ffd25e', '#ff5fa2'][(x * 3 + y) % 6] }))),
      ...[30, 31, 32, 33, 34, 35, 36, 37].map((x, i) => ({ p: 'bicycle', x, y: 34, col: ['#e04a4a', '#3a7ad0', '#ffd25e', '#40a070', '#f0f0f0', '#ff5fa2', '#7a5ae0', '#3a3a48'][i] })),
      { p: 'tires', x: 44, y: 8 },
      { p: 'crate', x: 43, y: 8, col: '#c8a070' },
    ],
    decorate(c, m) {
      // トラックをなめらかに塗る
      const grassB = '#6cb85a';
      for (let y = 12 * 16; y < 38 * 16; y++)
        for (let x = 16; x < 19 * 16; x++) {
          if (m.cell(x >> 4, y >> 4) !== ':') continue;
          const yy = Math.max(TR.y1 * 16, Math.min(TR.y2 * 16, y));
          const d = Math.hypot(x + 0.5 - TR.cx * 16, y + 0.5 - yy) / 16;
          const h = G.hash(x, y, 77);
          if (d <= TR.R && d >= TR.r) px(c, x, y, h > 0.92 ? '#d8a07a' : h < 0.08 ? '#a86a48' : '#c4865c');
          else px(c, x, y, h > 0.85 ? G.shade(grassB, 0.18) : h < 0.2 ? G.shade(grassB, -0.18) : grassB);
          if (Math.abs(d - TR.R) < 0.07 || Math.abs(d - TR.r) < 0.07) px(c, x, y, '#9a6040');
        }
      // サッカーのライン
      const fx = TR.cx * 16,
        fy0 = (TR.y1 - TR.r + 0.6) * 16,
        fy1 = (TR.y2 + TR.r - 0.6) * 16;
      r(c, Math.round(fx - 50), Math.round((fy0 + fy1) / 2), 100, 1, 'rgba(255,255,255,0.7)');
      for (let a = 0; a < 80; a++) px(c, Math.round(fx + Math.cos(a / 12.7) * 20), Math.round((fy0 + fy1) / 2 + Math.sin(a / 12.7) * 20), 'rgba(255,255,255,0.7)');
      for (const by of [fy0, fy1 - 40]) {
        r(c, Math.round(fx - 30), Math.round(by), 60, 1, 'rgba(255,255,255,0.7)');
        r(c, Math.round(fx - 30), Math.round(by + 40), 60, 1, 'rgba(255,255,255,0.7)');
        r(c, Math.round(fx - 30), Math.round(by), 1, 40, 'rgba(255,255,255,0.7)');
        r(c, Math.round(fx + 30), Math.round(by), 1, 41, 'rgba(255,255,255,0.7)');
      }
      // 学級菜園の作物
      for (let ty = 26; ty <= 30; ty++)
        for (let tx = 28; tx <= 36; tx++) {
          const X = tx * 16,
            Yp = ty * 16;
          r(c, X, Yp + 5, 16, 3, '#5a3a24');
          r(c, X, Yp + 13, 16, 3, '#5a3a24');
          const kind = (tx >> 1) % 3;
          for (let i = 0; i < 2; i++) {
            const cx = X + 4 + i * 8,
              cy = Yp + 4;
            r(c, cx - 2, cy - 1, 5, 3, '#3a8a40');
            px(c, cx, cy - 2, '#5ab050');
            if (kind === 0) px(c, cx + 1, cy, '#e04a3a');
            else if (kind === 1) r(c, cx, cy - 3, 1, 3, '#7ac860');
            else px(c, cx - 1, cy + 1, '#ffd25e');
            r(c, cx - 2, cy + 7, 5, 3, '#3a8a40');
            px(c, cx, cy + 6, '#5ab050');
          }
        }
      // トラックのライン
      const cx = TR.cx * 16;
      for (let y = 13 * 16; y < 37 * 16; y++)
        for (let x = 16; x < 19 * 16; x++) {
          const yy = Math.max(TR.y1 * 16, Math.min(TR.y2 * 16, y));
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - yy) / 16;
          for (const L of [TR.R - 0.15, TR.R - 0.95, TR.R - 1.75, TR.r + 0.15]) if (Math.abs(d - L) < 0.04) px(c, x, y, 'rgba(255,255,255,0.85)');
        }
      // スタートライン
      r(c, Math.round((TR.cx + TR.r) * 16), 24 * 16 + 8, Math.round((TR.R - TR.r) * 16), 2, '#ffffff');
      for (let i = 0; i < 3; i++) G.pixText(c, String(i + 1), Math.round((TR.cx + TR.r + 0.3 + i * 0.8) * 16), 24 * 16 + 12, '#ffffff');
      // コートのライン
      const X0 = 28 * 16 + 4,
        Y0 = 14 * 16 + 4,
        W = 16 * 16 - 8,
        H = 9 * 16 - 8;
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      r(c, X0, Y0, W, 1, '#ffffff');
      r(c, X0, Y0 + H, W, 1, '#ffffff');
      r(c, X0, Y0, 1, H, '#ffffff');
      r(c, X0 + W, Y0, 1, H + 1, '#ffffff');
      r(c, X0 + W / 2, Y0, 1, H, '#ffffff');
      for (let a = 0; a < 64; a++) px(c, Math.round(X0 + W / 2 + Math.cos(a / 10.2) * 18), Math.round(Y0 + H / 2 + Math.sin(a / 10.2) * 18), '#ffffff');
      for (const kx of [X0, X0 + W - 40]) {
        r(c, kx, Y0 + H / 2 - 20, 40, 1, '#ffffff');
        r(c, kx, Y0 + H / 2 + 20, 40, 1, '#ffffff');
        r(c, kx === X0 ? kx + 40 : kx, Y0 + H / 2 - 20, 1, 41, '#ffffff');
      }
      // 校門の外の歩道の縁石
      r(c, 0, 39 * 16 + 13, 46 * 16, 3, '#8a8494');
    },
    npcs: [
      {
        id: 'w2_gen', char: 'w2_gen', x: 27, y: 37, dir: 'left', move: 'look', show: W2.town,
        talk: async () => {
          if (await W2.rumor(4, 'w2_gen', '七不思議？　……ワシが知っとるのは「体育倉庫のひとりでに弾むボール」じゃな。夜中にポーン、ポーンと音がする。開けても誰もおらん。……回転のせいじゃと思うがの。')) return;
          await W2.lines('w2_gen', {
            0: ['おはよう、遅刻ギリギリ組。桜の花びらがまた舞っとる。', 'コロニーの桜は年に4回咲くんじゃ。掃除する身にもなってほしいのう。'],
            1: 'ゆうべの揺れで、花壇のレンガがずれとった。「回転調整」ねえ……ワシが若い頃は、そんなもん一度もなかったがの。',
            2: '転校生が来たんじゃと？　白い髪の。ほう、ワシのホウキを不思議そうに見とったわい。',
            3: 'ジャンク・デュエル？　最近の子はロボットで殴り合うのが流行りか。ワシらはベーゴマじゃった。',
            4: '文化祭の準備で、ゴミの量が3倍じゃ！　……まあ、にぎやかなのは嫌いじゃないがの。',
            5: '門限が早くなって、放課後の校庭がさびしいのう。公安の車がやたら通る。',
            6: '黒い機体の噂？　おまえさんら、危ないことに首をつっこむんじゃないぞ。……いや、もう遅いか。',
            8: '空がまた明るくなったら、真っ先に桜の掃除じゃ。……それが楽しみなんて、ワシもヤキが回ったのう。',
            9: 'ほれ、見てみい。花びらが舞っとる。ニセモノの空でも、春は春じゃ。',
          })();
        },
      },
      {
        id: 'w2_hayate', char: 'w2_hayate', x: 5, y: 14, dir: 'right', move: 'pace', range: 3, show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_hayate', {
          0: ['おっ、カナタ！　朝練サボりか？　オレはもうトラック30周したぜ！', 'コロニーは回ってるから、反時計回りに走ると0.3秒速いんだ。……たぶん。'],
          1: '昨日の揺れ、走ってたらコケたんだよ！　自己ベストのチャンスだったのに……コロニーめ。',
          2: '転校生のニコって子、体育の50m走で寝てたぞ。スタートの合図で寝るやつ、初めて見た。',
          3: 'ジャンク・デュエル見てきた！　機体のブースト、あれ陸上のスタートと同じだな。前傾姿勢が大事！',
          4: '文化祭の後夜祭リレー、2年B組のアンカーはオレだ！　カナタ、第3走者たのむぞ。',
          5: '外出制限で、夕方の練習ができない。……だから朝4時から走ってる。',
          6: '最近、走ってても空がなんか重い気がするんだ。……気のせいだよな？',
          8: 'みんなが戻ってきたら、全校マラソン大会やろうぜ！　コロニー1周32km！',
          9: '本物の空の下でも走ってみたいな。風ってやつ、向かい風でもいいからさ。',
        }),
      },
      {
        id: 'w2_hana', char: 'w2_hana', x: 32, y: 30, dir: 'up', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_hana', {
          0: ['あ、えっと……学級菜園のトマト、見に来たの？', '人工太陽だと甘くならないって言われるけど、ちゃんと話しかけると甘くなるんだよ。……ほんとだよ？'],
          1: '揺れのあと、トマトが一個だけ落ちちゃった。……ごめんね、トマトさん。',
          2: 'ニコちゃんが、トマトを丸かじりしてた。……おいしそうに食べてくれたから、許します。',
          3: 'ジャンクパーツで、自動水やり機を作ってみたの。ポンタくんに手伝ってもらったんだ。',
          4: '文化祭のラーメンに、菜園のネギを使ってくれるんだって！　うれしいな。',
          5: '夜に水やりに来られなくなったから、水やり機が大活躍してる。',
          6: '最近、葉っぱの元気がないの。……空のせいかな。',
          8: '暗い間も、ちゃんと芽は出てたよ。植物って、強いね。',
          9: 'ほら、新しい芽。……わたしたちも、きっと大丈夫だよね。',
        }),
      },
      {
        id: 'w2_daichi', char: 'w2_daichi', x: 35, y: 19, dir: 'left', move: 'wander', range: 2, show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_daichi', {
          0: ['低重力ダンクの練習中！　コロニーのはしっこ寄りだと、ちょっとだけ高く跳べるんだぜ。', 'ここは真ん中だからダメだけどな！'],
          1: '揺れた瞬間にシュート打ったら、入ったんだ！　……カウントされなかったけど。',
          2: 'あの転校生、ボール渡したら抱きしめて寝た。……なんなんだ。',
          3: 'デュエルの機体の動き、フェイントがバスケみたいでさ。ギルってやつのクロスオーバー、すげえぞ。',
          4: '文化祭でフリースロー大会やるんだ。景品はメロンパン！',
          5: '部活が短縮で、体がなまる……。',
          6: 'ボールが変な方向に曲がるんだ。……回転、おかしくないか？',
          8: 'やっとボールがまっすぐ飛ぶ！　空、ありがとな！',
          9: 'おまえらがコロニー救ったってマジ？　……じゃあ今度、1on1で勝負な。',
        }),
      },
      {
        id: 'w2_kick', char: 'w2_kick', x: 11, y: 22, dir: 'left', move: 'wander', range: 3, show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_kick', {
          0: ['リフティング記録、今日こそ100回！……コロニーの回転で、ボールがちょっと右に流れるんだよ。', 'だから左足を多めに使う。これ、コロニー育ちの常識な。'],
          1: '昨日の揺れでボールが変な曲がり方した。……新しい魔球にできないかな。',
          3: 'デュエルの機体でサッカーしたら、絶対おもしろいって！　ドクって人に頼めない？',
          4: '文化祭のPK大会、キーパーはバルガス先生なんだって。……絶対入らない。',
          6: 'ボールが……落ちてこない？　いや、ちょっと遅いだけか。……こわ。',
          8: '帰ってきたら、またボール蹴ろうぜ！　約束な！',
          9: 'リフティング100回、ついに達成！　……コロニーが元気になったからかな？',
        }),
      },
      {
        id: 'w2_kouhai1', char: 'w2_kouhai1', x: 14, y: 11, dir: 'right', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_kouhai1', {
          0: 'せ、先輩！　シミュレーター学年1位の春瀬先輩ですよね！？　サインください！',
          2: 'うわさの転校生、2年B組なんですよね？　いいなあ……。',
          3: '先輩、ジャンク・デュエルに出てるってほんとですか！？　……誰にも言いません！',
          4: '1年生は文化祭で、お化け屋敷やるんです。先輩、来てくださいね！',
          5: 'ウミが「夜の校舎で白い影を見た」って言うんです……。',
          7: null,
          8: '先輩たちがコロニーを救ったって、ミミ先輩の号外で読みました！',
          9: '将来、ぼくもAFに乗ります！　先輩みたいに！',
        }),
      },
      {
        id: 'w2_kouhai2', char: 'w2_kouhai2', x: 15, y: 11, dir: 'left', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_kouhai2', {
          0: 'ソラったら、また春瀬先輩の話ばっかり。……ルウ先輩の方がかっこいいもん。',
          2: 'あの白い髪の先輩、目がきれいだった……星みたいな色。',
          4: 'お化け屋敷の幽霊役、わたしなんです。ふふふ……。',
          5: 'ほんとに見たんだって！　夜の校舎の窓に、白い影……。',
          8: 'ルウ先輩が助けてくれたって聞きました！　やっぱりかっこいい！',
          9: 'わたし、ルウ先輩みたいにスケボー始めました！',
        }),
      },
    ],
    items: [{ x: 44, y: 3, item: 'memory', id: 'mem_11' }],
    events: W2.memEvents([[44, 3]]),
    warps: [{ x: 21, y: 39, w: 4, h: 1, to: 'minato', tx: 35, ty: 2, dir: 'down' }],
    onEnter: W2.memEnter,
  });

  // ---------------------------------------------------------------
  //  廊下 school_hall（50×17）
  // ---------------------------------------------------------------
  const H = W2.grid(50, 17, 'w');
  H.fill(1, 3, 48, 6, 'l'); // 廊下
  H.fill(21, 9, 6, 2, 'l'); // 昇降口への開口
  H.fill(19, 11, 10, 5, 'c'); // 昇降口
  H.fill(23, 16, 2, 1, 'c'); // 出口
  H.fill(42, 9, 1, 2, 'f'); // 新聞部の入口
  H.fill(9, 9, 1, 2, 'l'); // 図書室の入口
  H.fill(1, 11, 17, 5, 'r'); // 図書室
  H.fill(36, 11, 12, 5, 'f'); // 新聞部
  H.set(48, 3, 'V').set(1, 8, 'P').set(18, 8, 'P').set(29, 8, 'P').set(40, 8, 'Z').set(28, 3, 'j');
  H.set(19, 11, 'P').set(28, 11, 'P').set(47, 15, 'P').set(36, 15, 'j');
  const hallDoors = [
    [8, '2-A', null, '2年A組。中から「静かにー！」という声が聞こえる。……入るのはやめておこう。'],
    [14, '2-B', 'classroom'],
    [20, '2-C', null, '2年C組。黒板に「C組 文化祭 優勝！」と気の早い文字が見える。'],
    [30, 'TCH', 'staffroom'],
    [36, 'PRN', null, '校長室。重厚な扉だ。ノックする勇気はない。'],
    [41, '+', null, '保健室。「先生は職員室です」の札がかかっている。'],
  ];
  W2.student('w2_fuki', '風紀委員のシズカ', 111, true, { acc: ['glasses'], accCol: '#3a3a48', style: 'ponytail', hair: '#3a2a3a' });
  G.mob('w2_obachan', '購買のおばちゃん', 112, { girl: true, old: true, over: { outfit: 'apron', top: '#f0a0b0', top2: '#ffffff', acc: ['bandana'], accCol: '#ffffff' } });
  W2.student('w2_senpai', '3年のマサムネ先輩', 113, false, { build: 'tall', style: 'slick', hair: '#2a2a3a' });
  W2.student('w2_kei', '新聞部部長のケイ', 114, false, { acc: ['glasses'], accCol: '#c0a040', style: 'messy' });
  W2.student('w2_runner', '遅刻常習犯のテツ', 115, false, { style: 'spiky', hair: '#e08a30' });
  G.mob('w2_shisho', '司書のフミ先生', 116, { girl: true, old: true, over: { outfit: 'coat', top: '#8a6a9a', acc: ['glasses'], accCol: '#c0a040', style: 'bun' } });
  W2.student('w2_bookworm', '読書家のシオリ', 117, true, { style: 'hime', hair: '#3a2a48', acc: ['glasses'], accCol: '#5a3aa0' });

  G.defMap('school_hall', {
    name: '第三中学校',
    area: '1F 廊下',
    bgm: 'school',
    time: W2.indoorTime,
    floor: 'l',
    pal: { wall: '#ece6d8', wallTop: '#4a4060', lino: '#a8bcc0', concrete: '#c8c4c0', wood: '#c89a68', baseboard: '#7a8aa0', carpet: '#4a5a8a' },
    rows: H.rows(),
    solids: [[14, 2, 1, 1, 0], [30, 2, 1, 1, 0], [2, 2, 2, 1, 0]],
    wins: [[4, 1, 3], [10, 1, 3], [44, 1, 4]],
    objects: [
      ...hallDoors.map(([x, label]) => ({ p: 'w2_door', x, y: 1, label, labelCol: label === '+' ? '#e04a4a' : '#2a3460', wall: true })),
      { p: 'w2_stairsup', x: 2, y: 1, w: 2, wall: true },
      { p: 'w2_board', x: 23, y: 1, w: 4, text: 'NEWS', wall: true },
      { p: 'w2_board', x: 16, y: 1, w: 2, wall: true },
      { p: 'w2_clock', x: 26, y: 1, wall: true },
      { p: 'poster', x: 12, y: 2, col: '#ff5fa2', wall: true },
      { p: 'poster', x: 18, y: 2, col: '#4ef0ff', wall: true },
      { p: 'poster', x: 33, y: 2, col: '#ffd25e', wall: true },
      { p: 'poster', x: 39, y: 2, col: '#7dff9a', wall: true },
      { p: 'w2_board', x: 32, y: 1, w: 3, text: 'AF', wall: true },
      { p: 'locker', x: 2, y: 8, w: 6 },
      // 図書室
      { p: 'shelf', x: 1, y: 11, w: 6, msg: '「コロニー建設史」「軌道戦争全記録」……難しそうな本ばかりだ。' },
      { p: 'shelf', x: 12, y: 11, w: 6, msg: '「はじめてのAF整備」「宇宙のなりたち」。貸出カードにポンタの名前がびっしり。' },
      { p: 'shelf', x: 1, y: 15, w: 4, msg: 'マンガコーナー。「星屑ロマンス」の最新刊だけ、なぜか貸出中が続いている。' },
      { p: 'shelf', x: 14, y: 15, w: 4, msg: '「本物の空の図鑑」。地球の空の写真集だ。ページのすみが、何度もめくられてすり切れている。' },
      { p: 'table', x: 6, y: 13, w: 6, h: 1, col: '#a07a4a' },
      { p: 'poster', x: 3, y: 10, col: '#4ef0ff', wall: true },
      { p: 'poster', x: 14, y: 10, col: '#ffd25e', wall: true },
      { p: 'w2_clock', x: 11, y: 10, wall: true },
      { p: 'locker', x: 31, y: 8, w: 6 },
      { p: 'bench', x: 12, y: 8, msg: '廊下のベンチ。「走るな」と油性ペンで書いてある。……バルガス先生の字だ。' },
      { p: 'counter', x: 44, y: 4, w: 4, col: '#c08a58', top: '#f4e8d0' },
      { p: 'shelf', x: 37, y: 3, w: 2, msg: 'トロフィー棚。「コロニー中学AFシミュレーター大会 準優勝」……優勝はどこだったんだろう。' },
      // 昇降口
      { p: 'locker', x: 20, y: 12, w: 2 },
      { p: 'locker', x: 20, y: 14, w: 2 },
      { p: 'locker', x: 26, y: 12, w: 2 },
      { p: 'locker', x: 26, y: 14, w: 2 },
      { p: 'rug', x: 22, y: 14, w: 4, h: 2, col: '#5a6a8a' },
      // 新聞部
      { p: 'poster', x: 37, y: 10, col: '#4ef0ff', wall: true },
      { p: 'w2_clock', x: 39, y: 10, wall: true },
      { p: 'poster', x: 41, y: 10, col: '#ff5fa2', wall: true },
      { p: 'poster', x: 44, y: 10, col: '#ffd25e', wall: true },
      { p: 'shelf', x: 45, y: 11, w: 3, msg: '過去の「第三中新聞」がぎっしり。見出し「購買のメロンパン、ついに値上げか!?」' },
      { p: 'table', x: 38, y: 13, w: 3, h: 1, col: '#a07a4a', items: true },
      { p: 'desk', x: 44, y: 13, book: true },
      { p: 'w2_tripod', x: 46, y: 13 },
      { p: 'terminal', x: 36, y: 11, col: '#ffd25e', msg: '新聞部のパソコン。画面に「七不思議・取材メモ（未完）」というファイルが開いている。' },
      { p: 'rug', x: 40, y: 14, w: 4, h: 1, col: '#c04a5a' },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 購買の看板
      r(c, 44 * 16 + 4, 1 * 16 + 3, 56, 11, '#c03a3a');
      r(c, 44 * 16 + 4, 1 * 16 + 3, 56, 1, '#ff7070');
      G.pixText(c, 'BAKERY', 44 * 16 + 20, 1 * 16 + 6, '#ffffff');
      // 出口のマット
      r(c, 23 * 16, 16 * 16, 32, 16, '#3a3a48');
      for (let i = 0; i < 32; i += 3) r(c, 23 * 16 + i, 16 * 16 + 2, 1, 12, '#5a5a6a');
    },
    npcs: [
      {
        id: 'w2_obachan', char: 'w2_obachan', x: 45, y: 3, dir: 'down', move: 'still', show: () => G.state.chapter !== 7,
        talk: async () => {
          const r0 = await E.ask('w2_obachan', G.byCh({ 0: 'はいよ、いらっしゃい！　今日のメロンパンは焼きたてだよ！', 3: 'デュエルの子たちが買い占めていくんだよ、メロンパン。あんたも早く買いな！', 4: '文化祭価格！……と言いたいとこだけど、いつもの値段だよ。', 8: 'こんな時こそ、甘いもん食べて元気出しな！', 9: 'あんたたち、また来てくれてうれしいよ。おまけしとくね！' }), ['買う', 'やめる'], { cancel: 1 });
          if (r0 === 0) await E.shop(['melonpan', 'soda', 'candy'], '第三中 購買');
          else await E.say('w2_obachan', 'またおいで。メロンパンは逃げないけど、売り切れはするからね！');
        },
      },
      {
        id: 'w2_fuki', char: 'w2_fuki', x: 10, y: 5, dir: 'right', move: 'pace', range: 3, show: () => W2.town() && G.state.chapter !== 9,
        talk: W2.lines('w2_fuki', {
          0: ['そこ！　廊下は走らない！……あ、歩いてた？　ならよし。', '水無月さんのスケボーは、今月だけで没収17回目よ。……毎回取り返されるけど。'],
          1: '公安の人が「不審者を見なかったか」って聞きに来たの。廊下で不審な行動をしてたのは、春瀬くんくらいね。',
          2: '転校生のニコさん、上履きを左右逆にはいてたわ。……注意したら、両方左になってた。どういうこと？',
          3: '校内でのロボット賭博は禁止です！　……で、昨日の試合、どっちが勝ったの？',
          4: '文化祭期間中も風紀は乱しません！　……コスプレは、まあ、許可します。',
          5: '外出制限の時間を守りなさいよ。……公安の人、最近ちょっと怖いもの。',
          6: '春瀬くん、最近ずっと怖い顔してる。……風紀委員として、笑顔を推奨します。',
          8: '帰ってきたら、全員そろって遅刻しないこと。……約束よ。',
        }),
      },
      {
        id: 'w2_senpai', char: 'w2_senpai', x: 9, y: 7, dir: 'down', move: 'still', show: W2.town,
        talk: W2.lines('w2_senpai', {
          0: ['……ロッカーが開かない。暗証番号を忘れた。3年間、毎日同じ番号なのに。', '0085……いや、0058だったか……。'],
          1: 'ゆうべの揺れで、ロッカーの中身が全部崩れた。……開かなかったのが幸いだった。',
          2: '受験勉強の合間に、転校生の噂を聞いた。……白い髪？　受験には関係ないな。',
          3: '……オレも昔、ジャンク・デュエルに出たことがある。初戦で負けて、それきりだ。キョウスケには内緒な。',
          4: '3年最後の文化祭か。……まあ、ロッカーが開いたら参加してやってもいい。',
          5: '夜の自習室が使えないのは痛い。……公安め。',
          6: 'ついにロッカーが開いた。番号は「0000」だった。……3年間、なにやってたんだオレは。',
          8: '受験より大事なものがあるって、おまえらを見てると思うよ。',
          9: '卒業したら、外の世界を見に行く。……本物の空ってやつをな。',
        }),
      },
      {
        id: 'w2_runner', char: 'w2_runner', x: 25, y: 6, dir: 'down', move: 'wander', range: 3, speed: 0.9, show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_runner', {
          0: 'はぁ、はぁ……セーフ！　え？　もう3時間目？　……アウトじゃん。',
          1: '遅刻の理由？「コロニーが揺れたから」。先生、半分信じてくれた。',
          2: '転校生も遅刻常習犯らしいな！　仲間ができてうれしいぜ！……寝坊じゃなくて「寝てた」らしいけど。',
          3: 'アリーナで夜ふかししたら、ガチで寝坊した。でもギルの試合はそれだけの価値がある！',
          4: '文化祭の準備で朝早く来いって？　……遅刻する自信しかない。',
          5: '外出制限のおかげで夜ふかしできない。……結果、遅刻ゼロ。皮肉だよな。',
          8: 'みんなが帰ってくるまで、毎朝ちゃんと来てるぜ。……誰も信じないけど。',
          9: '皆勤賞まであと1日！……あ、今日もう遅刻してた。',
        }),
      },
      {
        id: 'w2_shisho', char: 'w2_shisho', x: 13, y: 13, dir: 'left', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_shisho', {
          0: ['図書室では、お静かに。……あら、春瀬くん。お父さまが寄贈してくださったAFの本、まだ大事に置いてありますよ。', '返却期限は守ってくださいね。……あなたのおばあさまも、昔は延滞の常習犯でした。'],
          2: '白い髪の転校生さん、地球の空の写真集をずっと眺めていたわ。……貸出カードの名前の欄に、星のマークを描いて。',
          3: '最近「違法改造の手引き」という本のリクエストが多くて。……図書室には置きません。',
          5: '閉館が早まって、本を抱えて帰る子が増えたわ。……本は、どんな夜にも明かりになりますから。',
          7: null,
          8: '本の中の空は、決して落ちません。……でも、あなたたちが守った空を、早く見たいわね。',
          9: '「ほんとうの空」という本を、新しく入れようかしら。……あなたたちの話を、誰かが書いてくれたらね。',
        }),
      },
      {
        id: 'w2_bookworm', char: 'w2_bookworm', x: 8, y: 14, dir: 'up', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_bookworm', {
          0: ['……しっ。今いいところなの。主人公が、本物の空に初めて出るシーン。', '……コロニーの外には、風が吹いてるんだって。どんな感じなんだろう。'],
          2: 'ニコちゃんに本を読んであげたら、途中で寝ちゃった。……でも、寝言で続きを言ってたの。',
          3: '今は「機械じかけの騎士」シリーズを読んでる。……現実のほうが、物語みたいになってきたけど。',
          4: '文化祭の古本市、わたしの推し本を全部並べたの。……売れなくても、いいの。',
          6: '物語なら、こういう時、誰かが立ち上がるのよね。……春瀬くん、あなたかもね。',
          8: '最後のページは、まだ書かれてない。……だから、きっと大丈夫。',
        }),
      },
      {
        id: 'w2_kei', char: 'w2_kei', x: 44, y: 12, dir: 'down', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_kei', {
          0: ['新聞部へようこそ。部長のケイだ。部員は2人……いや、1.5人だ。', 'ミミが入部してくれるまで、オレ一人で号外を刷ってた。'],
          2: 'ミミがやる気満々でね。「七不思議特集」を組むらしい。……締め切りは守ってほしいんだが。',
          3: 'デュエルの賭け率を記事にしたら、職員室に呼ばれた。報道の自由はどこへ行った。',
          4: '文化祭特別号、5000部刷る。コロニーの人口からすれば、少ないくらいだ。',
          5: '公安から「取材を控えるように」と通達が来た。……控えるつもりはない。',
          6: '黒い機体の写真？　あるにはある。ブレブレだけどな。',
          8: '号外の見出しは決めてある。「第三中2年B組、コロニーを救う」。',
          9: '卒業までに、ミミに部長を譲る。……いい記者になるよ、あいつは。',
        }),
      },
    ],
    checks: [
      ...hallDoors.filter((d) => !d[2]).map(([x, , , msg]) => ({ x, y: 2, text: msg })),
      { x: 9, y: 10, text: '図書室。「私語厳禁」の札がかかっている。' },
      { x: 26, y: 2, text: '掲示板の時計。少しだけ進んでいる。……遅刻防止のためらしい。' },
      { x: 23, y: 2, w: 3, text: () => G.byCh({ 0: '掲示板「AFシミュレーター校内大会 結果：1位 春瀬カナタ　2位 水無月ルウ」', 2: '掲示板「転入生のお知らせ：2年B組 ニコさん」……写真の横にラクガキで猫耳が描いてある。', 3: '掲示板「深夜の外出は控えましょう（とくにアンダーシェル方面）」', 4: '掲示板「文化祭まであと3日！　2年B組・星屑亭 出張店」', 5: '掲示板「公安局からのお知らせ：19時以降の外出制限について」', 7: '掲示板「緊急避難所：第三中体育館」', 9: '掲示板「おかえりなさい、2年B組！」……誰かが寄せ書きをしている。' }) },
    ],
    warps: [
      { x: 14, y: 2, to: 'classroom', tx: 20, ty: 14, dir: 'up', se: 'door' },
      { x: 30, y: 2, to: 'staffroom', tx: 18, ty: 12, dir: 'up', se: 'door' },
      { x: 2, y: 2, w: 2, to: 'rooftop', tx: 6, ty: 9, dir: 'down', se: 'step' },
      { x: 23, y: 16, w: 2, to: 'school_yard', tx: 22, ty: 10, dir: 'down', se: 'door' },
    ],
  });

  // ---------------------------------------------------------------
  //  2年B組 classroom（24×16）
  // ---------------------------------------------------------------
  const CR = W2.grid(24, 16, 'w');
  CR.fill(1, 3, 22, 12, 'f').set(20, 15, 'f');
  const deskX = [3, 6, 9, 14, 17, 20],
    deskY = [6, 8, 10, 12];
  deskY.forEach((y, j) => deskX.forEach((x, i) => CR.set(x, y, (i + j) % 3 === 0 ? 'd' : 'D')));
  CR.set(1, 3, 'P').set(22, 3, 'P').set(22, 13, 'j');
  W2.student('w2_takashi', 'お調子者のタカシ', 121, false, { style: 'spiky', hair: '#c86a3a', acc: ['cap'], accCol: '#ff4f6a' });
  W2.student('w2_saki', '絵描きのサキ', 122, true, { style: 'bob', hair: '#2a2a40', acc: ['ribbon'], accCol: '#7dff9a' });
  W2.student('w2_tsubasa', '双子の兄ツバサ', 123, false, { style: 'messy', hair: '#5a8ad0' });
  W2.student('w2_tsubame', '双子の妹ツバメ', 123, true, { style: 'twin', hair: '#5a8ad0' });
  W2.student('w2_rinka', 'AFオタクのリンカ', 125, true, { style: 'ponytail', hair: '#4a3a2a', acc: ['glasses'], accCol: '#ff5fa2' });
  W2.student('w2_mayu', 'うわさ好きのマユ', 126, true, { style: 'long', hair: '#e8b860', acc: ['ribbon'], accCol: '#ff8fb8' });
  const inClass = () => W2.town() && G.state.time !== 'night' && G.state.chapter !== 9;
  G.defMap('classroom', {
    name: '2年B組',
    bgm: 'school',
    time: W2.indoorTime,
    floor: 'f',
    pal: { wall: '#f0eadc', wallTop: '#4a4060', wood: '#c8986a', baseboard: '#8a6a4a' },
    rows: CR.rows(),
    wins: [[1, 1, 5], [18, 1, 5]],
    objects: [
      { p: 'w2_blackboard', x: 7, y: 1, w: 10, text: '2-B', text2: 'DUTY:PONTA', wall: true },
      { p: 'w2_clock', x: 6, y: 1, wall: true },
      { p: 'poster', x: 17, y: 2, col: '#7dff9a', wall: true },
      { p: 'table', x: 10, y: 4, w: 3, h: 1, col: '#9a7048', msg: '教卓。出席簿に「春瀬：遅刻（3回目）」と書いてある。' },
      { p: 'table', x: 2, y: 4, w: 2, h: 1, col: '#9aa0b0', items: true, msg: '先生の机。プリントの山の上に、食べかけのドーナツが置いてある。' },
      { p: 'tv', x: 19, y: 3, msg: 'テレビ。〈マザー〉の「今日のコロニー気象」が流れている。「本日の人工降雨はありません」' },
      { p: 'locker', x: 1, y: 14, w: 6 },
      { p: 'locker', x: 10, y: 14, w: 7 },
      { p: 'shelf', x: 7, y: 14, w: 2, msg: '学級文庫。「AF大図鑑 第7版」「宇宙のはなし」「少女マンガ 星屑ロマンス 全12巻」' },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 後ろの黒板（掲示）
    },
    npcs: [
      {
        id: 'w2_takashi', char: 'w2_takashi', x: 9, y: 9, dir: 'up', move: 'still', show: inClass,
        talk: W2.lines('w2_takashi', {
          0: ['よっ、学年1位！　今日もシミュレーターで「父のスパナ」とか言って泣くのか？', '……冗談だって！　ほら、オレのモノマネ見る？「廊下を走るな！走るなら全力で走れ！」'],
          1: '昨日の揺れ、オレが「宇宙怪獣だー！」って叫んだら、クラス中ドン引きしてた。……ウケると思ったのに。',
          2: '転校生のニコちゃんに一発ギャグ見せたら、真顔で「……それは、なに？」って聞かれた。オレの芸人人生、終わった。',
          3: 'カナタ、デュエル出てるってマジ？　オレのギャグを機体のスピーカーで流してくれよ！　相手の戦意を削げるぜ！',
          4: '文化祭の呼び込み担当はオレだ！「星屑亭のラーメン、うまさが光速を超えたー！」……どう？',
          5: '最近、みんな笑わないんだよな。……だからオレ、毎日ギャグを3倍にしてる。',
          6: 'カナタ、顔が怖いぞ。……ほら、変顔。笑えよ。笑っとけって。',
          8: 'おまえらが帰ってきたら、オレの新ネタ100連発な。覚悟しとけ！',
        }),
      },
      {
        id: 'w2_saki', char: 'w2_saki', x: 3, y: 11, dir: 'up', move: 'still', show: inClass,
        talk: async () => {
          await W2.lines('w2_saki', {
            0: ['あ……。こ、これ？　ノートの落書き……見ないで……。', '……窓から見える「向こう側の街」を描いてるの。逆さまの街って、きれいだから。'],
            1: '揺れたとき、線がずれちゃった……。でも、なんだか空が動いたみたいで、ちょっと好き。',
            2: 'ニコちゃんが、わたしの絵をじっと見て「これ、ほんとの空？」って。……ちがうよ、って言えなかった。',
            3: 'ジャンク・デュエルの機体、描いてみたの。……ハルカゼ、っていうの？　かっこいいね。',
            4: '文化祭の看板、わたしが描くことになったの。……がんばる。',
            5: 'ニコちゃんの席が空いてるの、さびしいな……。',
            6: '黒い機体の絵、描こうとしたけど……なんだか、悲しい色しか出なかった。',
            8: '暗い空の絵ばっかり描いてた。……でも、明日は朝の絵を描くよ。',
          })();
        },
      },
      {
        id: 'w2_tsubasa', char: 'w2_tsubasa', x: 14, y: 7, dir: 'right', move: 'still', show: inClass,
        talk: W2.lines('w2_tsubasa', {
          0: ['オレがツバサ。隣がツバメ。……どっちが兄か？　オレだ。3分早く生まれた。', 'ツバメは「3分なんて誤差」って言うけどな。'],
          2: '転校生がオレとツバメを見て「……コピー？」って言った。ちがう、双子だ。',
          3: 'ツバメとデュエルの賭けをしてる。オレはギル、ツバメはスターダスト。……負けそう。',
          4: '文化祭のステージで双子漫才やる。ネタはツバメが書いた。オレはツッコミ担当らしい。',
          6: 'ツバメが最近、夜中に起きて空を見てる。……オレも見てるけど。',
          8: '避難所で、ずっとツバメと手をつないでた。……誰にも言うなよ。',
        }),
      },
      {
        id: 'w2_tsubame', char: 'w2_tsubame', x: 17, y: 7, dir: 'left', move: 'still', show: inClass,
        talk: W2.lines('w2_tsubame', {
          0: ['わたしがツバメ。兄のツバサは、3分早く生まれたことを毎日自慢してくるの。', '3分なんて、カップラーメンができるくらいの差よね。'],
          2: '「コピー」って言われて、ツバサがちょっと落ち込んでた。……かわいいとこあるのよ。',
          3: '賭けはスターダストに全部。……だって、カナタくんたちが負けるとこ、想像できないもん。',
          4: '漫才のネタ、ツバサがボケた方が絶対ウケるのに。……本人は気づいてない。',
          6: '夜、空の向こうに光が見えたの。……ツバサには内緒。心配させたくないから。',
          8: 'ツバサが避難所で泣きそうだったから、手をつないであげたの。……感謝しなさいよね。',
        }),
      },
      {
        id: 'w2_rinka', char: 'w2_rinka', x: 20, y: 11, dir: 'up', move: 'still', show: inClass,
        talk: W2.lines('w2_rinka', {
          0: ['カナタくん！　昨日のシミュレーター、最後のバレルロール！　あれ、軌道戦争のエース「星屑」の機動だよね！？', '……え、知らない？　伝説のパイロットなのに！　あたしの推しなのに！'],
          1: 'ゆうべの揺れ、AFの起動振動に似てた。……地下で何か動いてない？　いや、オタクの妄想だけど！',
          2: 'ポンタくんと、AFのスペックで3時間語り合ったの。ニコちゃんは途中で寝てた。',
          3: 'ハルカゼ……！　旧式ワークフレームのフレームに、あの出力……！　ドクって人、天才なの！？　会わせて！',
          4: '文化祭でAFの模型展示やるの！　1/100ハルカゼ、徹夜で作った！',
          5: '公安の新型ガードナー、モノアイの配置が変わってる。……あたし、なんでこんなの気づいちゃうんだろ。',
          6: '黒い機体の映像見た……。あの機動、どこかで……。「星屑」の動きにも似てる……でも、もっと悲しい。',
          8: 'ゼフィール……あんな機体、どのデータベースにもない。……でも、今はそれでいい。帰ってきてね。',
        }),
      },
      {
        id: 'w2_mayu', char: 'w2_mayu', x: 6, y: 13, dir: 'right', move: 'still', show: inClass,
        talk: W2.lines('w2_mayu', {
          0: ['ねえねえ聞いた？　バルガス先生、昔は「赤い悪魔」って呼ばれてたんだって！', '……甘いもの食べすぎて、顔が赤かったかららしいよ。'],
          1: 'ねえ聞いた？　夜中にスクラップ・ベイの方で、公安の機体が何機も飛んでたって！',
          2: 'ねえ聞いた？　転校生のニコちゃん、カナタくんの家に住んでるって！　……え、ほんとなの！？',
          3: 'ねえ聞いた？　アンダーシェルで、中学生のクランが勝ちまくってるって！　……まさかね？',
          4: 'ねえ聞いた？　ユイちゃん、最近お父さんとケンカしてるって。……あ、これは内緒ね。',
          5: 'ねえ聞いた？　……ううん、今はうわさ話する気分じゃないの。ニコちゃん、無事だといいな。',
          6: 'ねえ聞いた？　黒い機体のパイロット、仮面の下は……ううん、やめとく。こわいもん。',
          8: 'ねえ聞いた？　……2年B組が、コロニーを救いに行ったって。これは、うわさじゃないよね。',
        }),
      },
    ],
    items: [{ x: 22, y: 4, item: 'memory', id: 'mem_13' }],
    events: W2.memEvents([[22, 4]]),
    warps: [{ x: 20, y: 15, to: 'school_hall', tx: 14, ty: 3, dir: 'down', se: 'door' }],
    onEnter: W2.memEnter,
  });

  // ---------------------------------------------------------------
  //  職員室 staffroom（22×14）
  // ---------------------------------------------------------------
  const SR = W2.grid(22, 14, 'w');
  SR.fill(1, 3, 20, 10, 'l').set(18, 13, 'l');
  SR.set(1, 12, 'P').set(20, 3, 'P').set(12, 3, 'X').set(13, 3, 'X').set(20, 12, 'j').set(9, 3, 'E');
  G.mob('w2_kyoto', '教頭のハマダ先生', 131, { old: true, girl: false, over: { outfit: 'suit', top: '#5a5a6a', bottom: '#4a4a5a', acc: ['glasses'], accCol: '#c0c0d0' } });
  G.mob('w2_hoken', '保健のヒメノ先生', 132, { girl: true, old: false, kid: false, over: { outfit: 'labcoat', top: '#f4f4f8', top2: '#ff8fb8', bottom: '#4a4a6a', bstyle: 'skirt' } });
  G.mob('w2_rika', '理科のミドリ先生', 133, { girl: true, old: false, kid: false, over: { outfit: 'labcoat', top: '#e8f0e8', top2: '#40a070', bottom: '#2a3a2a', acc: ['glasses'], accCol: '#40a070', style: 'bun' } });
  G.defMap('staffroom', {
    name: '職員室',
    bgm: 'school',
    time: W2.indoorTime,
    floor: 'l',
    pal: { wall: '#e8e4dc', wallTop: '#3e3a52', lino: '#b4b8c4', baseboard: '#6a7088' },
    rows: SR.rows(),
    wins: [[14, 1, 6]],
    objects: [
      { p: 'w2_blackboard', x: 2, y: 1, w: 6, white: true, text: 'MTG 4PM', text2: 'FEST', wall: true },
      { p: 'w2_clock', x: 9, y: 1, wall: true },
      { p: 'w2_board', x: 10, y: 1, w: 3, wall: true },
      { p: 'w2_coffee', x: 1, y: 3, msg: 'コーヒーメーカー。横に「砂糖は1人3本まで（バルガス先生へ）」の貼り紙。' },
      { p: 'fridge', x: 3, y: 3, msg: '冷蔵庫。名前の書かれたプリンが6個。全部「バルガス」と書いてある。' },
      { p: 'shelf', x: 4, y: 3, w: 4, msg: '指導要領と、なぜかAFの整備マニュアルが並んでいる。' },
      { p: 'table', x: 3, y: 6, w: 4, h: 2, col: '#8a90a4', items: true },
      { p: 'table', x: 3, y: 10, w: 4, h: 2, col: '#8a90a4', items: true },
      { p: 'table', x: 9, y: 6, w: 4, h: 2, col: '#8a90a4', items: true },
      { p: 'table', x: 9, y: 10, w: 4, h: 2, col: '#8a90a4', items: true, msg: '採点中のテスト。「問3：コロニーの自転周期を答えよ」……カナタの答案は空欄だ。' },
      { p: 'table', x: 15, y: 6, w: 3, h: 2, col: '#7a5a3a', msg: 'バルガス先生の机。教育書の下に、ドーナツ屋のスタンプカードが隠してある。あと1個でコンプリートだ。' },
      { p: 'w2_donutbox', x: 16, y: 8 },
      { p: 'partition', x: 15, y: 10, w: 4 },
      { p: 'rug', x: 15, y: 11, w: 4, h: 1, col: '#5a6a8a' },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
    },
    npcs: [
      {
        id: 'w2_kyoto', char: 'w2_kyoto', x: 7, y: 8, dir: 'down', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_kyoto', {
          0: ['春瀬くん。遅刻はこれで今学期12回目ですな。', '……おばあさまのラーメン屋の手伝い？　それは感心……いや、遅刻は遅刻です。'],
          1: '公安から「生徒の夜間外出に注意を」と通達が来ましてな。……なにかあったのでしょうかねえ。',
          2: '転入生の書類……ふむ、春瀬さんのおばあさまの保証。……まあ、トメさんが言うなら間違いないでしょう。',
          3: '最近、生徒の間で「賭けごと」がはやっているとか。……春瀬くん、知りませんな？',
          4: '文化祭の予算が足りません。……ラーメン屋台の材料費、本当にこの額で？',
          5: '公安の立ち入りが増えました。学校は子どもの場所なのですがねえ……。',
          6: '春瀬くん。……何をしているかは聞きません。ただ、無事に戻ってくること。いいですな。',
          8: '避難所の体育館は、私たち教師が守ります。君たちは、君たちのすべきことを。',
        }),
      },
      {
        id: 'w2_hoken', char: 'w2_hoken', x: 12, y: 12, dir: 'up', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: async () => {
          await W2.lines('w2_hoken', {
            0: 'あら、ケガ？　スパナで指を挟んだ？　……はい、ばんそうこう。気をつけてね。',
            2: 'ニコさん、保健室のベッドで3時間寝てたわ。……健康診断の結果、ちょっと不思議な数値が出たの。秘密よ？',
            3: 'その打ち身、ロボットにぶつかった跡みたいね。……聞かないでおくわ。',
            5: '最近、頭痛を訴える生徒が多いの。……空気のせいかしら。',
            8: '帰ってきたら、全員の健康診断よ。逃がさないから。',
          })();
          E.heal();
          G.audio.se('heal');
          E.toast('HP・ENが回復した', '#7dff9a');
        },
      },
      {
        id: 'w2_rika', char: 'w2_rika', x: 1, y: 8, dir: 'right', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_rika', {
          0: ['理科の小テストの採点中よ。……「コロニーの重力は回転による遠心力」。正解者、クラスで3人。', 'ユイさんと、ポンタくんと……あとはニコ……あら、まだ転校してないわね。'],
          1: 'ゆうべの揺れ、回転軸のブレにしては周期が変。……個人的に計算してるの。誰にも言わないでね。',
          2: '転校生のニコさん、星の名前を全部知ってたの。コロニー生まれじゃ、本物の星なんて見たことないはずなのに。',
          3: '機体のエネルギー効率について質問に来た生徒がいたわ。……理科に興味を持つのはいいことね。理由はともかく。',
          5: 'コロニーの回転数のデータ、公開されなくなったの。……隠すってことは、何かあるのよ。',
          6: '計算が合ったわ。……回転、遅くなってる。春瀬くん、これは先生の独り言よ。',
          8: '回転数、正常値に戻りつつある。……あなたたち、やったのね。',
        }),
      },
    ],
    warps: [{ x: 18, y: 13, to: 'school_hall', tx: 30, ty: 3, dir: 'down', se: 'door' }],
  });

  // ---------------------------------------------------------------
  //  屋上 rooftop（34×26）
  // ---------------------------------------------------------------
  const RT = W2.grid(36, 18, ' ');
  RT.fill(2, 6, 32, 12, 'c').box(2, 6, 32, 12, 'F');
  RT.set(3, 16, 'P').set(32, 16, 'P').set(32, 10, 'P').set(15, 7, 'P').set(9, 11, 'j');
  let skyCache = {};
  function skyImage(t) {
    if (skyCache[t]) return skyCache[t];
    const W = 640,
      Hh = 160;
    const cv = mk(W, Hh),
      c = cv.ctx;
    const N = t === 'night',
      Ev = t === 'evening';
    const sky = N ? ['#141238', '#0a0a24'] : Ev ? ['#ffb08a', '#ff8a7a'] : t === 'morning' ? ['#cce8f8', '#a8d8f4'] : ['#bfe2fa', '#7ec0ee'];
    for (let y = 0; y < Hh; y++) r(c, 0, y, W, 1, y < 70 ? sky[0] : sky[1]);
    for (let y = 66; y < 74; y += 1) G.dither(c, 0, y, W, 1, sky[1], y % 2 ? 'sparse' : '');
    // 向こう側の陸（逆さまの街）：区画・公園・運河・ビル
    const land = N ? '#1a2234' : Ev ? '#b88070' : '#8ab098';
    r(c, 0, 0, W, 30, land);
    for (let bx = 0; bx < W; bx += 24) {
      const kind = G.hash(bx, 1, 11);
      const col = kind < 0.3 ? (N ? '#1e3028' : Ev ? '#a08a60' : '#6aa070') : N ? '#262c44' : Ev ? '#c89080' : '#a8b8c0';
      r(c, bx + 1, 2, 22, 24, col);
      if (kind >= 0.3)
        for (let i = 0; i < 6; i++) {
          const x = bx + 2 + Math.floor(G.hash(bx, i, 12) * 18),
            y = 3 + Math.floor(G.hash(i, bx, 13) * 18);
          r(c, x, y, 3, 3, N ? (G.hash(x, y, 1) > 0.5 ? '#ffd890' : '#3a4058') : Ev ? '#e0a890' : '#d8e0e8');
        }
      else for (let i = 0; i < 5; i++) G.ellipse(c, bx + 4 + i * 4, 8 + (i % 2) * 8, 2, 2, N ? '#2a4030' : '#4a8a50');
    }
    r(c, 0, 12, W, 2, N ? '#3a4a8a' : '#9ad0f0'); // 運河
    for (let x = 0; x < W; x += 24) r(c, x, 0, 1, 30, N ? '#141a28' : G.shade(land, -0.15)); // 道路
    // ぶら下がって見える高層ビル
    for (let x = 0; x < W; x += 5) {
      const h = Math.floor(G.hash(x, 3, 14) * 26);
      if (h < 8) continue;
      const col = N ? '#222a40' : Ev ? '#d09a88' : G.pick(['#b8c8d8', '#a8bccc', '#c8d4e0']);
      r(c, x, 30, 4, h, col);
      r(c, x + 3, 30, 1, h, G.shade(col, -0.15));
      for (let y = 32; y < 30 + h - 2; y += 3) if (G.hash(x, y, 15) > (N ? 0.5 : 0.7)) px(c, x + 1, y, N ? '#ffd890' : '#e8f4ff');
    }
    // かすみ
    for (let y = 30; y < 64; y++) G.dither(c, 0, y, W, 1, N ? 'rgba(20,18,56,0.5)' : 'rgba(255,255,255,0.18)', y % 2 ? 'sparse' : '');
    if (N) for (let i = 0; i < 70; i++) px(c, Math.floor(G.hash(i, 3, 7) * W), 70 + Math.floor(G.hash(i, 4, 8) * 90), i % 5 ? '#6a7ad0' : '#ffffff');
    else
      for (let i = 0; i < 8; i++) {
        const cx = Math.floor(G.hash(i, 5, 9) * W),
          cy = 76 + Math.floor(G.hash(i, 6, 9) * 70);
        G.ellipse(c, cx, cy, 24, 4, 'rgba(255,255,255,0.65)');
        G.ellipse(c, cx + 9, cy - 3, 12, 4, 'rgba(255,255,255,0.8)');
      }
    skyCache[t] = cv;
    return cv;
  }
  W2.student('w2_tenmon', '天文部のホシオ', 141, false, { acc: ['glasses'], accCol: '#3a3a48', style: 'messy', hair: '#3a3048' });
  W2.student('w2_napper', '昼寝の達人ネムリ', 142, true, { style: 'long', hair: '#9a7ae0' });
  W2.student('w2_guitar', '軽音部のカケル', 143, false, { style: 'spiky', hair: '#2a2a3a', acc: ['headphones'], accCol: '#ff5fa2' });
  G.defMap('rooftop', {
    name: '第三中学校',
    area: '屋上',
    bgm: 'school',
    outdoor: true,
    ambient: 'petals',
    floor: 'c',
    pal: { concrete: '#b8b8c4' },
    rows: RT.rows(),
    parallax(c, cam, frame) {
      const img = skyImage(G.state.time || 'day');
      const ox = -Math.round(cam.x * 0.3) % 160;
      c.drawImage(img, ox - 160, -Math.round(cam.y * 0.2));
      c.drawImage(img, ox - 160 + 640, -Math.round(cam.y * 0.2));
    },
    objects: [
      { p: 'w2_stairhouse', x: 4, y: 7 },
      { p: 'tank', x: 25, y: 7, text: 'H2O', col: '#d8dce8', msg: '給水塔。「立入禁止」と書いてあるが、はしごの段がすり減っている。' },
      { p: 'tank', x: 28, y: 7, text: 'NO.3', col: '#c8ccd8' },
      { p: 'w2_ac', x: 10, y: 7 },
      { p: 'w2_ac', x: 19, y: 7 },
      { p: 'pipe', x: 24, y: 10, w: 7, col: '#8a92a6' },
      { p: 'bench', x: 12, y: 13, msg: '屋上のベンチ。見上げると、空いっぱいに「向こう側の街」が広がっている。' },
      { p: 'bench', x: 21, y: 13, msg: 'ベンチの裏に「本物の空が見たい ルウ」と小さく彫ってある。' },
      { p: 'bench', x: 16, y: 15 },
      { p: 'flowerbed', x: 4, y: 16, w: 6 },
      { p: 'flowerbed', x: 25, y: 16, w: 6 },
      { p: 'w2_scope', x: 28, y: 13, msg: '天文部の望遠鏡。のぞくと……向こう側の街の、洗濯物がよく見える。' },
      { p: 'vending', x: 3, y: 10, col: '#3a7ad0' },
    ],
    npcs: [
      {
        id: 'w2_tenmon', char: 'w2_tenmon', x: 27, y: 14, dir: 'right', move: 'still', show: W2.town,
        talk: async () => {
          if (await W2.rumor(1, 'w2_tenmon', '七不思議？　あるよ、とっておきが。……向こう側の街に、真夜中でも1つだけ消えない窓があるんだ。毎晩、同じ場所。誰が住んでるのか、ぼくは3年間観測してる。')) return;
          await W2.lines('w2_tenmon', {
            0: ['天文部、部員1名。……コロニーで天文部って変だと思うだろ？', 'でも見上げれば、空いっぱいに街がある。ぼくはあれを「観測」してるんだ。'],
            1: 'ゆうべ、向こう側の街の明かりが一斉に揺れた。……コロニー全体が、身震いしたみたいに。',
            2: '転校生の子が、望遠鏡で「外」を見たいって言ったんだ。外は見えないよって言ったら、さびしそうな顔をしてた。',
            3: '観測日誌によると、最近ミラー窓の開閉が0.4秒ずれてる。……誰も気にしないけど。',
            4: '文化祭で天体観測会をやるんだ。……見るのは「向こう側の街」だけど。',
            5: 'ミラーの角度が毎日ちがう。……空が、何かを隠してるみたいだ。',
            6: '空の真ん中、コア・シャフトのあたりで、時々青い光が見える。……星、みたいな。',
            7: '空が……閉じていく。観測、しなきゃ。最後まで。',
            8: '暗い空でも、観測はやめない。ぼくは信じてる。朝は来るって。',
            9: '……あの消えない窓。今朝、初めて消えたんだ。たぶん、住んでた人がやっと眠れたんだと思う。',
          })();
        },
      },
      {
        id: 'w2_napper', char: 'w2_napper', x: 7, y: 14, dir: 'down', move: 'still', show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_napper', {
          0: ['……すぅ……すぅ……。', '……あと5分……コロニーがもう1回転するまで……。'],
          1: '……揺れて起きた。最悪。……おやすみ。',
          2: '……転校生の子と、昼寝の極意について語り合った。……あの子、才能ある。……すぅ。',
          4: '……文化祭？　……仮眠室をやりたいって言ったら、却下された。',
          5: '……最近、夢で星の声が聞こえる。……変な夢。……すぅ。',
          8: '……夜が長すぎて、もう眠れない。……早く朝が来てほしい。',
          9: '……朝って、いいね。……すぅ。',
        }),
      },
      {
        id: 'w2_guitar', char: 'w2_guitar', x: 22, y: 12, dir: 'left', move: 'still', show: () => W2.town() && G.state.chapter >= 1,
        talk: W2.lines('w2_guitar', {
          1: ['屋上は、オレの練習スタジオ。……観客はカラスロボだけ。', 'レディオ・スターダストでDJリリィに曲をかけてもらうのが夢なんだ。'],
          2: '新曲のタイトルは「白い髪の少女」。……モデル？　いや、別に。',
          3: 'デュエル会場の入場曲、オレに作らせてくれないかな。スターダストのテーマ、もう考えてあるんだ。',
          4: '文化祭のステージで、1曲だけ演奏させてもらえることになった！',
          5: 'リリィの放送が、最近ちょっと切ないんだ。……コード進行が、マイナーばっかりでさ。',
          6: 'この空に届く歌って、どんなだろうな。',
          8: '避難所で歌ったら、みんなが少しだけ笑ってくれた。……音楽って、すごいな。',
          9: 'リリィにデモテープ送ったんだ！　返事はまだだけど、きっと届いてる。',
        }),
      },
    ],
    items: [{ x: 32, y: 7, item: 'memory', id: 'mem_12' }],
    events: W2.memEvents([[32, 7]]),
    warps: [{ x: 6, y: 8, to: 'school_hall', tx: 3, ty: 3, dir: 'down', se: 'door' }],
    onEnter: W2.memEnter,
  });
})();
