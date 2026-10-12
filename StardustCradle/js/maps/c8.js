// =============================================================
//  maps/c8.js — 第8章「星の歌」のマップ
//   c8_space1  L4宙域・コロニー外壁（機体・宇宙）
//   c8_mirror1 ソーラーミラー施設・B区画（生身）
//   c8_mirror2 ミラー制御中枢（生身）
//   c8_space2  中心軸・ベイゲート前（機体・宇宙）
//   c8_core    中心核・スターシードの間（機体・最終決戦）
//  ストーリーのイベントは js/story/ch8.js が G.addToMap で追加する。
// =============================================================
(function () {
  const grid = (w, h, ch) => G.W2.grid(w, h, ch);
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;

  // ---------------------------------------------------------------
  //  カスタム小物（接頭辞 c8_）
  // ---------------------------------------------------------------
  // 宙に浮かぶ割れたミラーの破片
  P.c8_shard = function (o) {
    const cv = mk(40, 44),
      c = cv.ctx;
    const k = o.k || 0;
    const pts = k % 2 ? [[4, 6], [34, 0], [38, 30], [10, 40]] : [[2, 14], [26, 2], [38, 22], [14, 42]];
    c.fillStyle = '#3a4060';
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
    c.fillStyle = '#7a8ab8';
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x * 0.92 + 2, y * 0.92 + 2) : c.moveTo(x * 0.92 + 2, y * 0.92 + 2)));
    c.closePath();
    c.fill();
    // 映り込み
    G.line(c, 10, 30, 26, 10, '#c8d8ff');
    G.line(c, 12, 34, 30, 12, '#9aaad8');
    G.line(c, pts[0][0], pts[0][1], pts[1][0], pts[1][1], '#e8f0ff');
    return { w: 2, h: 1, img: cv, ox: -4, oy: -28, solid: true };
  };
  // 航行灯（点滅）
  P.c8_beacon = function (o) {
    const cv = mk(16, 24),
      c = cv.ctx;
    r(c, 7, 6, 2, 16, '#5a6078');
    r(c, 5, 20, 6, 3, '#3a3e50');
    r(c, 6, 2, 4, 4, o.col || '#ff3050');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -8, solid: false, lights: [{ x: 8, y: -4, r: 18, col: o.col || '#ff3050', a: 0.9, blink: true }] };
  };
  // シャッター（閉）
  P.c8_shutter = function (o) {
    const w = o.w || 2,
      W = w * S;
    const cv = mk(W, 30),
      c = cv.ctx;
    r(c, 0, 0, W, 30, '#2a2e40');
    r(c, 1, 2, W - 2, 26, '#6a7088');
    for (let y = 4; y < 28; y += 4) r(c, 1, y, W - 2, 1, '#4a5068');
    r(c, 1, 2, W - 2, 1, '#9aa0b8');
    for (let x = 0; x < W; x += 8) {
      r(c, x, 24, 4, 4, '#ffd25e');
      r(c, x + 4, 24, 4, 4, '#2a2a30');
    }
    r(c, W / 2 - 3, 10, 6, 4, '#ff3050');
    return { w, h: 1, img: cv, ox: 0, oy: -14, solid: true, lights: [{ x: W / 2, y: -2, r: 14, col: '#ff3050', a: 0.7, blink: true }] };
  };
  // マザーにロックされた大扉
  P.c8_gate = function (o) {
    const w = o.w || 3,
      W = w * S;
    const cv = mk(W, 44),
      c = cv.ctx;
    r(c, 0, 0, W, 44, '#1a1c2a');
    r(c, 2, 2, W - 4, 42, '#4a4e68');
    r(c, 4, 6, W / 2 - 5, 36, '#7a7e98');
    r(c, W / 2 + 1, 6, W / 2 - 5, 36, '#7a7e98');
    r(c, W / 2 - 1, 6, 2, 36, '#1a1c2a');
    for (let y = 10; y < 40; y += 6) {
      r(c, 4, y, W / 2 - 5, 1, '#6a6e88');
      r(c, W / 2 + 1, y, W / 2 - 5, 1, '#6a6e88');
    }
    // マザーの紋章（目）
    G.ellipse(c, W / 2, 20, 9, 6, '#2a1830');
    G.ellipse(c, W / 2, 20, 6, 4, '#ff3a8a');
    G.ellipse(c, W / 2, 20, 2, 2, '#ffe0f0');
    G.pixText(c, 'MOTHER', W / 2 - 11, 31, '#ffb0d0');
    return { w, h: 1, img: cv, ox: 0, oy: -28, solid: true, lights: [{ x: W / 2, y: -8, r: 26, col: '#ff3a8a', a: 0.8, flicker: true }] };
  };
  // レーザー障壁
  P.c8_barrier = function (o) {
    const w = o.w || 4,
      W = w * S;
    const cv = mk(W, 30),
      c = cv.ctx;
    r(c, 0, 4, 4, 26, '#3a3e50');
    r(c, W - 4, 4, 4, 26, '#3a3e50');
    r(c, 1, 2, 2, 4, '#ff5fa2');
    r(c, W - 3, 2, 2, 4, '#ff5fa2');
    for (let y = 8; y < 28; y += 5) {
      r(c, 4, y, W - 8, 1, '#ff5fa2');
      r(c, 4, y + 1, W - 8, 1, 'rgba(255,160,210,0.6)');
    }
    return { w, h: 1, img: cv, ox: 0, oy: -14, solid: true, lights: [{ x: W / 2, y: 2, r: 30, col: '#ff5fa2', a: 0.8, flicker: true }] };
  };
  // 制御コンソール（大）
  P.c8_console = function (o) {
    const w = o.w || 6,
      W = w * S;
    const cv = mk(W, 40),
      c = cv.ctx;
    r(c, 0, 18, W, 22, '#2a2e40');
    r(c, 0, 18, W, 2, '#5a6080');
    r(c, 2, 22, W - 4, 4, '#3a3e58');
    for (let x = 6; x < W - 6; x += 6) r(c, x, 23, 3, 2, ['#4ef0ff', '#ffd25e', '#ff5fa2', '#7dff9a'][(x / 6) % 4]);
    // 画面
    for (let i = 0; i < w; i += 2) {
      const x = i * S + 4;
      r(c, x, 0, 24, 18, '#1a1c2a');
      r(c, x + 2, 2, 20, 14, i % 4 ? '#103040' : '#301030');
      for (let k = 0; k < 4; k++) r(c, x + 4, 4 + k * 3, 6 + ((i * 7 + k * 5) % 12), 1, i % 4 ? '#4ef0ff' : '#ff3a8a');
    }
    return { w, h: 1, img: cv, ox: 0, oy: -24, solid: true, lights: [{ x: W / 2, y: -12, r: 50, col: '#4ef0ff', a: 0.7, flicker: true }] };
  };
  // 中心核のベイゲート（円形）
  P.c8_coregate = function (o) {
    const cv = mk(56, 88),
      c = cv.ctx;
    G.ellipse(c, 28, 44, 27, 42, '#2a2e44');
    G.ellipse(c, 28, 44, 23, 37, '#5a6080');
    G.ellipse(c, 28, 44, 18, 30, o.open ? '#0a0820' : '#8a90a8');
    if (!o.open) {
      for (let a = 0; a < 6; a++) {
        const an = (a / 6) * Math.PI * 2;
        G.line(c, 28, 44, 28 + Math.cos(an) * 17, 44 + Math.sin(an) * 28, '#4a5068');
      }
      G.ellipse(c, 28, 44, 5, 5, '#ff3a8a');
    } else {
      G.ellipse(c, 28, 44, 12, 20, '#2a2a6a');
      G.ellipse(c, 28, 44, 6, 10, '#9ae8ff');
    }
    return { w: 3, h: 1, img: cv, ox: -4, oy: -72, solid: false, lights: [{ x: 24, y: -28, r: 46, col: o.open ? '#9ae8ff' : '#ff3a8a', a: 0.8, flicker: true }] };
  };
  // 無重力で漂う小物（ゆっくり上下する影つき）
  P.c8_float = function (o) {
    const cv = mk(16, 26),
      c = cv.ctx;
    G.ellipse(c, 8, 24, 6, 2, 'rgba(20,10,40,0.3)');
    const col = o.col || '#c08040';
    r(c, 2, 2, 12, 12, col);
    r(c, 2, 2, 12, 2, G.shade(col, 0.3));
    r(c, 2, 12, 12, 2, G.shade(col, -0.3));
    G.line(c, 3, 3, 13, 13, G.shade(col, -0.2));
    return { w: 1, h: 1, img: cv, ox: 0, oy: -12, solid: true };
  };
  // ホロ表示のコロニー模型（観測デッキ）
  P.c8_holo = function () {
    const cv = mk(48, 40),
      c = cv.ctx;
    G.ellipse(c, 24, 34, 18, 4, '#2a2e44');
    G.ellipse(c, 24, 33, 14, 3, '#4ef0ff');
    c.globalAlpha = 0.55;
    r(c, 10, 8, 28, 10, '#4ef0ff');
    G.ellipse(c, 10, 13, 3, 5, '#9ae8ff');
    G.ellipse(c, 38, 13, 3, 5, '#2a6a8a');
    for (let x = 12; x < 36; x += 4) r(c, x, 9, 2, 8, '#1a3a5a');
    c.globalAlpha = 1;
    return { w: 3, h: 1, img: cv, ox: 0, oy: -24, solid: true, lights: [{ x: 24, y: -10, r: 34, col: '#4ef0ff', a: 0.7, flicker: true }] };
  };

  // ---------------------------------------------------------------
  //  カスタムCG（接頭辞 c8_）
  // ---------------------------------------------------------------
  // ゼフィールの光の羽 vs ビットの群れ
  G.CG.c8_wings = function (c, t) {
    const W = G.W,
      H = G.H;
    G.CG.space(c, t);
    c.globalCompositeOperation = 'lighter';
    G.glow(c, W / 2, H / 2 - 10, 150, 'rgba(140,250,255,0.35)');
    // 光の羽
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (i - 5.5) * 0.22 + Math.sin(t * 0.03 + i) * 0.03;
      const len = 110 + (i % 3) * 18;
      c.strokeStyle = `rgba(160,250,255,${0.25 + 0.05 * (i % 4)})`;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(W / 2, H / 2 - 20);
      c.lineTo(W / 2 + Math.cos(a) * len * 1.4, H / 2 - 20 + Math.sin(a) * len * 0.7);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    // ビットの群れ（黄色い光点）
    for (let i = 0; i < 70; i++) {
      const a = i * 2.39 + t * 0.006 * (i % 2 ? 1 : -1);
      const rr = 120 + ((i * 37) % 120);
      const x = W / 2 + Math.cos(a) * rr * 1.3,
        y = H / 2 + Math.sin(a) * rr * 0.6;
      c.fillStyle = '#ffd25e';
      c.fillRect(Math.round(x), Math.round(y), 2, 2);
      if (i % 9 === Math.floor(t / 6) % 9) {
        c.strokeStyle = 'rgba(255,210,94,0.5)';
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(W / 2, H / 2 - 20);
        c.stroke();
      }
    }
    const m = G.mechSheet(G.MECHS.zephyr).down[0];
    const sc = 3;
    c.drawImage(m, Math.round(W / 2 - (m.width * sc) / 2), Math.round(H / 2 - 20 - m.height * sc * 0.6), m.width * sc, m.height * sc);
  };
  // セラフィム起動
  G.CG.c8_seraph = function (c, t) {
    const W = G.W,
      H = G.H;
    c.fillStyle = '#05031a';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) G.glow(c, W / 2, H / 2, 60 + i * 36 + Math.sin(t * 0.05 + i) * 6, `rgba(255,${200 - i * 20},${150 + i * 10},0.12)`);
    c.globalCompositeOperation = 'source-over';
    const img = G.seraphImg(1);
    const sc = 2.6;
    const y = H / 2 - (img.height * sc) / 2 + Math.sin(t * 0.04) * 4;
    c.drawImage(img, Math.round(W / 2 - (img.width * sc) / 2), Math.round(y), img.width * sc, img.height * sc);
    // 6基のビット
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + t * 0.01;
      const x = W / 2 + Math.cos(a) * 170,
        yy = H / 2 + Math.sin(a) * 80;
      c.globalCompositeOperation = 'lighter';
      G.glow(c, x, yy, 14, 'rgba(255,210,94,0.6)');
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#fff2c0';
      c.fillRect(Math.round(x) - 2, Math.round(yy) - 2, 4, 4);
    }
  };

  // 8章の敵は経験値を多めに（Lv27→32 を想定）
  const onKill = (e) => {
    if (!e.noReward && G.state.chapter === 8) G.gainExp(Math.floor(e.exp * 0.8));
  };

  // 宇宙マップの共通設定
  const SPACE_PAL = { bigwall: '#6a7088', metal: '#7a8098' };

  // ---------------------------------------------------------------
  //  c8_space1 — L4宙域・コロニー外壁（96×34）
  // ---------------------------------------------------------------
  const S1 = grid(96, 34, '*');
  S1.fill(0, 0, 96, 1, ' ').fill(0, 33, 96, 1, ' ').fill(0, 0, 1, 34, ' ').fill(95, 0, 1, 34, ' ');
  // 宇宙港の桟橋
  S1.fill(1, 11, 11, 13, 'h').fill(11, 11, 1, 13, 'x').fill(1, 17, 10, 1, 'g');
  // コロニー外壁（下）
  S1.fill(1, 28, 94, 5, 'h').fill(1, 28, 94, 1, 'm');
  S1.fill(20, 29, 3, 1, 'x').fill(48, 29, 3, 1, 'x').fill(74, 29, 3, 1, 'x');
  // 外壁のフィン（障害物）
  S1.fill(24, 26, 2, 2, 'W').fill(39, 25, 2, 3, 'W').fill(58, 26, 2, 2, 'W');
  // ミラー施設（右）
  S1.fill(78, 1, 17, 22, 'W');
  S1.fill(84, 19, 4, 4, 'm').fill(84, 22, 4, 1, 'x');
  [79, 80, 81, 82, 89, 90, 91, 92, 93].forEach((x) => S1.set(x, 22, 'O'));
  S1.fill(78, 23, 17, 2, 'h').fill(80, 25, 13, 1, 'm');
  // セーブ用の足場
  S1.fill(67, 19, 8, 6, 'h').fill(67, 24, 8, 1, 'm');
  S1.set(70, 20, 'Z');
  S1.set(2, 12, 'L').set(10, 12, 'L');
  G.defMap('c8_space1', {
    onKill,
    name: 'L4宙域',
    area: 'コロニー外壁',
    bgm: 'space',
    space: true,
    mech: true,
    floor: 'h',
    bg: '#04030f',
    pal: SPACE_PAL,
    rows: S1.rows(),
    objects: [
      { p: 'c8_beacon', x: 1, y: 22, col: '#4ef0ff' },
      { p: 'c8_beacon', x: 10, y: 22, col: '#4ef0ff' },
      { p: 'container', x: 2, y: 13, col: '#3a6ad0', text: 'C7' },
      { p: 'crane', x: 3, y: 22 },
      { p: 'c8_shard', x: 27, y: 4, k: 0, msg: 'ミラーの破片が漂っている。ヘルミナがミラーを閉じたとき、ねじ切れたんだ……。' },
      { p: 'c8_shard', x: 34, y: 19, k: 1 },
      { p: 'c8_shard', x: 52, y: 6, k: 1 },
      { p: 'c8_shard', x: 63, y: 23, k: 0 },
      { p: 'container', x: 44, y: 3, col: '#c03a3a', text: 'CARGO' },
      { p: 'container', x: 31, y: 23, col: '#5a6a5a' },
      { p: 'scrap', x: 47, y: 18 },
      { p: 'scrap', x: 72, y: 9 },
      { p: 'c8_beacon', x: 68, y: 19, col: '#ffd25e' },
      { p: 'c8_beacon', x: 74, y: 19, col: '#ffd25e' },
      { p: 'c8_beacon', x: 83, y: 23, col: '#7dff9a' },
      { p: 'c8_beacon', x: 88, y: 23, col: '#7dff9a' },
      { p: 'sign', x: 82, y: 24, text: 'MIRROR-B', col: '#2a3a6a', msg: '「ソーラーミラー施設 B区画　ドッキングポート」' },
    ],
    checks: [{ x: 1, y: 13, w: 3, text: 'コンテナに「クレイドル7 宇宙港　S.C.0075 以降使用禁止」の刻印。……10年ぶりの出港だ。' }],
    enemies: [
      { type: 'drone', x: 27, y: 9, lv: 12, id: 'c8s1_d1' },
      { type: 'drone', x: 31, y: 14, lv: 12, id: 'c8s1_d2' },
      { type: 'drone', x: 36, y: 7, lv: 12, id: 'c8s1_d3' },
      { type: 'drone', x: 41, y: 17, lv: 13, id: 'c8s1_d4' },
      { type: 'drone', x: 45, y: 11, lv: 13, id: 'c8s1_d5' },
      { type: 'turret', x: 30, y: 29, lv: 12, id: 'c8s1_t1' },
      { type: 'turret', x: 44, y: 29, lv: 12, id: 'c8s1_t2' },
      { type: 'turret', x: 62, y: 29, lv: 13, id: 'c8s1_t3' },
      { type: 'guardner', x: 60, y: 9, lv: 13, id: 'c8s1_g1', aggro: 190, name: '無人ガードナー' },
      { type: 'guardner', x: 64, y: 15, lv: 13, id: 'c8s1_g2', aggro: 190, name: '無人ガードナー' },
      { type: 'guardner', x: 70, y: 6, lv: 13, id: 'c8s1_g3', aggro: 190, name: '無人ガードナー' },
      { type: 'bit', x: 76, y: 14, lv: 13, id: 'c8s1_b1', aggro: 160 },
    ],
    items: [
      { x: 44, y: 6, item: 'repair', n: 1, id: 'c8s1_i1' },
      { x: 33, y: 26, item: 'energy', n: 2, id: 'c8s1_i2' },
      { x: 92, y: 26, item: 'repair2', n: 1, id: 'c8s1_i3' },
    ],
  });

  // ---------------------------------------------------------------
  //  c8_mirror1 — ソーラーミラー施設・B区画（60×40、生身）
  // ---------------------------------------------------------------
  const M1 = grid(60, 40, 'w');
  // ハンガー
  M1.fill(2, 27, 19, 10, 'm').fill(2, 27, 19, 1, 'x').fill(2, 35, 19, 2, 'g');
  // 北への通路
  M1.fill(9, 12, 2, 15, 'g');
  // スイッチ室
  M1.fill(12, 15, 7, 7, 'm').fill(11, 20, 1, 2, 'g');
  // 無重力ホール
  M1.fill(6, 3, 35, 10, 'g').fill(12, 5, 6, 4, 'm').fill(26, 6, 7, 4, 'm');
  [8, 9, 10, 11, 12, 18, 19, 20, 21, 22, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38].forEach((x) => M1.set(x, 2, 'O'));
  // ギルの通路
  M1.fill(41, 6, 7, 4, 'g');
  // 観測デッキ
  M1.fill(48, 3, 11, 9, 'm');
  for (let x = 49; x <= 57; x++) M1.set(x, 2, 'O');
  // 南への通路・大扉・前室
  M1.fill(52, 12, 3, 10, 'g');
  M1.fill(48, 22, 11, 7, 'm');
  // 漂う小物・セーブ
  M1.set(19, 28, 'Z').set(57, 23, 'Z');
  M1.set(14, 9, 'C').set(15, 9, 'C').set(22, 4, 'Q').set(30, 11, 'C').set(36, 4, 'Q').set(37, 4, 'C').set(7, 11, 'X').set(40, 3, 'X');
  M1.set(17, 16, 'E');
  G.defMap('c8_mirror1', {
    onKill,
    name: 'ソーラーミラー施設',
    area: 'B区画',
    bgm: 'dungeon',
    light: '#7a78b0',
    lightAlpha: 0.85,
    ambient: 'dust',
    floor: 'm',
    pal: { wall: '#5a6080', wallTop: '#1c2034', metal: '#6a7090', baseboard: '#3a3e58' },
    rows: M1.rows(),
    objects: [
      { p: 'hangar', x: 3, y: 34 },
      { p: 'hangar', x: 7, y: 34 },
      { p: 'hangar', x: 12, y: 34 },
      { p: 'hangar', x: 16, y: 34 },
      { p: 'c8_shutter', x: 9, y: 19, w: 2, id: 'c8_m1_shutter', show: () => !E.flag('c8_m1_sw') },
      { p: 'c8_gate', x: 52, y: 21, w: 3, id: 'c8_m1_gate', show: () => !E.flag('c8_door_open') },
      { p: 'c8_holo', x: 52, y: 7, msg: 'コロニーのホロ模型。3枚のミラーが、すべて「閉」を示して赤く点滅している。' },
      { p: 'hatch', x: 53, y: 26, glow: true },
      { p: 'c8_float', x: 20, y: 7, col: '#8a6a4a' },
      { p: 'c8_float', x: 33, y: 8, col: '#5a6a8a' },
      { p: 'c8_float', x: 27, y: 4, col: '#c03a3a' },
      { p: 'pipe', x: 2, y: 25, w: 6, col: '#5a6080' },
      { p: 'shelf', x: 13, y: 26, w: 3, kind: 'parts', msg: '補修部品の棚。宇宙服用のテープがずらりと並んでいる。' },
      { p: 'poster', x: 44, y: 5, col: '#ffd25e', msg: '「無重力区画：手すりから手を離すな」' },
    ],
    lights: [
      { x: 10, y: 30, r: 60, col: '#9ab0ff', a: 0.6 },
      { x: 23, y: 7, r: 70, col: '#bff8ff', a: 0.5 },
      { x: 53, y: 6, r: 70, col: '#9ab0ff', a: 0.6 },
      { x: 53, y: 25, r: 50, col: '#ffd25e', a: 0.5 },
    ],
    checks: [
      { x: 2, y: 28, w: 2, h: 5, text: 'エアロックの扉。向こうは真空だ。……ルウ「開けたら一発で外までぶっ飛ぶよ。やめときな」' },
    ],
    enemies: [
      { type: 'turret', x: 14, y: 16, lv: 13, id: 'c8m1_t1' },
      { type: 'turret', x: 16, y: 20, lv: 13, id: 'c8m1_t2' },
      { type: 'drone', x: 15, y: 18, lv: 13, id: 'c8m1_d1' },
      { type: 'drone', x: 10, y: 14, lv: 13, id: 'c8m1_d2' },
      { type: 'echo', x: 16, y: 6, lv: 13, id: 'c8m1_e1' },
      { type: 'echo', x: 24, y: 9, lv: 13, id: 'c8m1_e2' },
      { type: 'echo', x: 31, y: 5, lv: 13, id: 'c8m1_e3' },
      { type: 'echo', x: 37, y: 10, lv: 14, id: 'c8m1_e4' },
      { type: 'bot', x: 55, y: 10, lv: 13, id: 'c8m1_b1' },
    ],
    items: [
      { x: 18, y: 20, item: 'melonpan', n: 2, id: 'c8m1_i1' },
      { x: 39, y: 11, item: 'energy', n: 2, id: 'c8m1_i2' },
      { x: 58, y: 3, item: 'chip', n: 2, id: 'c8m1_chip' },
    ],
  });

  // ---------------------------------------------------------------
  //  c8_mirror2 — ミラー制御中枢（44×34、生身）
  // ---------------------------------------------------------------
  const M2 = grid(44, 34, 'w');
  M2.fill(16, 3, 12, 6, 'm');
  M2.fill(10, 5, 6, 2, 'g').fill(2, 3, 9, 10, 'm');
  M2.fill(28, 5, 6, 2, 'g').fill(33, 3, 9, 10, 'm');
  M2.fill(20, 9, 4, 6, 'g');
  M2.fill(6, 15, 32, 15, 'm').fill(10, 18, 24, 1, 'g').fill(10, 18, 1, 6, 'g').fill(33, 18, 1, 6, 'g');
  for (let x = 8; x <= 36; x += 4) M2.set(x, 14, 'O');
  M2.set(3, 4, 'E').set(40, 4, 'E').set(26, 4, 'Z');
  M2.set(2, 12, 'X').set(3, 12, 'X').set(40, 12, 'X').set(41, 12, 'X');
  G.defMap('c8_mirror2', {
    onKill,
    name: 'ソーラーミラー施設',
    area: 'ミラー制御中枢',
    bgm: 'dungeon',
    light: '#6a6aa8',
    lightAlpha: 0.85,
    ambient: 'echo',
    floor: 'm',
    pal: { wall: '#4a5070', wallTop: '#181a2c', metal: '#5a6080', baseboard: '#2a2e48' },
    rows: M2.rows(),
    objects: [
      { p: 'hatch', x: 21, y: 4, glow: true },
      { p: 'c8_barrier', x: 20, y: 11, w: 4, id: 'c8_m2_bar', show: () => !E.flag('c8_m2_bar') },
      { p: 'c8_console', x: 19, y: 26, w: 6, id: 'c8_console' },
      { p: 'server', x: 8, y: 26 },
      { p: 'server', x: 9, y: 26 },
      { p: 'server', x: 34, y: 26 },
      { p: 'server', x: 35, y: 26 },
      { p: 'capsule', x: 7, y: 16, empty: true, msg: '空の培養カプセル。プレートに「ECHO-07」。……ニコの番号だ。' },
      { p: 'capsule', x: 36, y: 16, empty: true, msg: '空の培養カプセル。プレートに「ECHO-12」。……シグの記録にあった番号だ。' },
      { p: 'pipe', x: 12, y: 15, w: 6, col: '#4a5070' },
      { p: 'pipe', x: 26, y: 15, w: 6, col: '#4a5070' },
    ],
    lights: [
      { x: 6, y: 7, r: 50, col: '#ff5fa2', a: 0.5 },
      { x: 37, y: 7, r: 50, col: '#4ef0ff', a: 0.5 },
      { x: 22, y: 22, r: 90, col: '#9ae8ff', a: 0.6 },
    ],
    enemies: [
      { type: 'turret', x: 6, y: 10, lv: 13, id: 'c8m2_t1' },
      { type: 'turret', x: 9, y: 4, lv: 13, id: 'c8m2_t2' },
      { type: 'echo', x: 5, y: 8, lv: 14, id: 'c8m2_e1' },
      { type: 'turret', x: 37, y: 10, lv: 13, id: 'c8m2_t3' },
      { type: 'turret', x: 34, y: 4, lv: 13, id: 'c8m2_t4' },
      { type: 'echo', x: 38, y: 8, lv: 14, id: 'c8m2_e2' },
      { type: 'bot', x: 36, y: 6, lv: 13, id: 'c8m2_b1' },
    ],
    items: [
      { x: 2, y: 3, item: 'repair2', n: 1, id: 'c8m2_i1' },
      { x: 41, y: 3, item: 'ramen', n: 1, id: 'c8m2_i2' },
    ],
  });

  // ---------------------------------------------------------------
  //  c8_space2 — 中心軸・ベイゲート前（72×36）
  // ---------------------------------------------------------------
  const S2 = grid(72, 36, '*');
  S2.fill(0, 0, 72, 1, ' ').fill(0, 35, 72, 1, ' ').fill(0, 0, 1, 36, ' ').fill(71, 0, 1, 36, ' ');
  S2.fill(1, 14, 8, 9, 'h').fill(8, 14, 1, 9, 'x');
  // エンドキャップ（中心軸の先端）
  S2.fill(60, 1, 11, 34, 'W');
  S2.fill(60, 15, 3, 5, 'm');
  S2.fill(50, 12, 10, 11, 'h').fill(50, 12, 10, 1, 'm').fill(58, 15, 2, 5, 'g');
  S2.set(52, 13, 'Z');
  // 漂うプラットフォーム
  S2.fill(22, 3, 5, 3, 'h').fill(36, 28, 6, 3, 'h').fill(40, 6, 4, 3, 'h');
  G.defMap('c8_space2', {
    onKill,
    name: '中心軸',
    area: 'ベイゲート前',
    bgm: 'space',
    space: true,
    mech: true,
    floor: 'h',
    bg: '#04030f',
    pal: SPACE_PAL,
    rows: S2.rows(),
    objects: [
      { p: 'c8_coregate', x: 60, y: 19, id: 'c8_coregate', show: () => !E.flag('c8_gate_open') },
      { p: 'c8_coregate', x: 60, y: 19, open: true, show: () => E.flag('c8_gate_open') },
      { p: 'c8_beacon', x: 50, y: 22, col: '#ff3a8a' },
      { p: 'c8_beacon', x: 59, y: 22, col: '#ff3a8a' },
      { p: 'c8_beacon', x: 1, y: 22, col: '#4ef0ff' },
      { p: 'c8_shard', x: 15, y: 6, k: 1 },
      { p: 'c8_shard', x: 18, y: 27, k: 0 },
      { p: 'c8_shard', x: 31, y: 15, k: 0 },
      { p: 'c8_shard', x: 46, y: 9, k: 1 },
      { p: 'c8_shard', x: 44, y: 25, k: 1 },
      { p: 'scrap', x: 23, y: 3 },
      { p: 'container', x: 37, y: 28, col: '#3a3a48', text: 'ECHO' },
    ],
    checks: [{ x: 60, y: 15, w: 3, h: 5, show: () => !E.flag('c8_gate_open'), text: '中心核のベイゲート。マザーの紋章が赤く光っている。……ミラー施設からロックは外したはずだ。' }],
    enemies: [
      { type: 'guardner', x: 38, y: 10, lv: 14, id: 'c8s2_g1', aggro: 180, name: '無人ガードナー' },
      { type: 'guardner', x: 42, y: 22, lv: 14, id: 'c8s2_g2', aggro: 180, name: '無人ガードナー' },
      { type: 'drone', x: 30, y: 7, lv: 14, id: 'c8s2_d1' },
      { type: 'drone', x: 33, y: 27, lv: 14, id: 'c8s2_d2' },
      { type: 'drone', x: 46, y: 17, lv: 14, id: 'c8s2_d3' },
    ],
    items: [
      { x: 24, y: 4, item: 'repair2', n: 1, id: 'c8s2_i1' },
      { x: 40, y: 29, item: 'energy', n: 3, id: 'c8s2_i2' },
    ],
  });

  // ---------------------------------------------------------------
  //  c8_core — 中心核・スターシードの間（36×26）
  // ---------------------------------------------------------------
  const CO = grid(36, 26, '*');
  CO.fill(0, 0, 36, 1, ' ').fill(0, 25, 36, 1, ' ').fill(0, 0, 1, 26, ' ').fill(35, 0, 1, 26, ' ');
  CO.fill(13, 19, 10, 6, 'm').fill(13, 19, 10, 1, 'x');
  CO.fill(14, 4, 8, 4, 'm').fill(14, 7, 8, 1, 'g');
  // 中心核の背景（回る光の輪）
  function coreParallax(c, cam, t) {
    const W = G.W,
      H = G.H;
    c.fillStyle = '#05031a';
    c.fillRect(0, 0, W, H);
    const cx = 18 * 16 - cam.x,
      cy = 5 * 16 - cam.y;
    const calm = E.flag('c8_calm');
    const tint = calm ? '160,240,255' : '255,140,200';
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) G.glow(c, cx, cy, 90 + i * 60, `rgba(${tint},0.07)`);
    // 回る光の輪
    c.lineWidth = 1;
    for (let k = 0; k < 7; k++) {
      const rr = 60 + k * 34;
      c.strokeStyle = `rgba(${k % 2 ? '160,240,255' : tint},${0.18 - k * 0.015})`;
      c.beginPath();
      c.ellipse(cx, cy + 20, rr * 1.4, rr * 0.55, Math.sin(t * 0.002 + k) * 0.2, 0, Math.PI * 2);
      c.stroke();
    }
    // 光の筋
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + t * 0.002 * (i % 2 ? 1 : -1);
      c.strokeStyle = `rgba(${tint},0.06)`;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a) * 600, cy + Math.sin(a) * 400);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    // 舞う光の粒
    for (let i = 0; i < 70; i++) {
      const a = i * 2.4 + t * 0.004 * (i % 3 ? 1 : -1);
      const rr = 30 + ((i * 23 + t * 0.4) % 260);
      c.fillStyle = i % 4 ? 'rgba(190,248,255,0.8)' : 'rgba(255,170,210,0.8)';
      c.fillRect(Math.round(cx + Math.cos(a) * rr * 1.5), Math.round(cy + Math.sin(a) * rr * 0.7), 1, 1);
    }
  }
  G.defMap('c8_core', {
    onKill,
    name: '中心核',
    area: 'スターシードの間',
    bgm: 'space',
    space: true,
    mech: true,
    floor: 'm',
    bg: '#05031a',
    pal: { metal: '#6a6a9a' },
    ambient: 'echo',
    parallax: coreParallax,
    rows: CO.rows(),
    objects: [
      { p: 'starseed', x: 17, y: 5, id: 'c8_starseed', show: () => !E.flag('c9_seed_closed') },
      { p: 'c8_beacon', x: 13, y: 24, col: '#9ae8ff' },
      { p: 'c8_beacon', x: 22, y: 24, col: '#9ae8ff' },
      { p: 'c8_beacon', x: 14, y: 4, col: '#ff9ac8' },
      { p: 'c8_beacon', x: 21, y: 4, col: '#ff9ac8' },
    ],
    lights: [{ x: 18, y: 4, r: 120, col: '#9ae8ff', a: 0.7, flicker: true }],
  });
})();
