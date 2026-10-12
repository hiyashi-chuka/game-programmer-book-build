// =============================================================
//  maps/c5.js — 第5章「無重力の迷宮」専用マップ・小物
//   c5_tunnel1（整備トンネル上層）→ c5_tunnel2（下層・ウォーデン）→ c5_core（無重力の中心軸・ステルス）
//   → c5_lab（第七研究棟）→ c5_dock（貨物ドック・機体戦）
// =============================================================
(function () {
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;
  const H = G.C45;

  // ---------------------------------------------------------------
  //  小物（c5_ 接頭辞）
  // ---------------------------------------------------------------
  // バルブ（壁ぎわの圧力弁）open:true で開いた状態
  P.c5_valve = function (o) {
    const cv = mk(16, 28),
      c = cv.ctx;
    r(c, 2, 24, 12, 4, 'rgba(20,10,40,0.35)');
    r(c, 6, 10, 4, 16, '#6a7088');
    r(c, 6, 10, 1, 16, '#9aa0b8');
    r(c, 4, 22, 8, 4, '#4a5068');
    const col = o.open ? '#4ef08a' : '#ff3050';
    G.ellipse(c, 8, 7, 7, 3, '#3a3a48');
    G.ellipse(c, 8, 6, 6, 3, col);
    G.ellipse(c, 8, 6, 2, 1, '#2a2a34');
    if (o.open) r(c, 2, 6, 12, 1, G.shade(col, 0.4));
    else r(c, 7, 1, 2, 10, G.shade(col, 0.4));
    r(c, 9, 14, 4, 3, '#2a2a34');
    px(c, 10, 15, col);
    return { w: 1, h: 1, img: cv, ox: 0, oy: -12, solid: true, lights: [{ x: 8, y: -6, r: 14, col, a: 0.7 }] };
  };
  // レバー（壁ぎわのスイッチ）on:true
  P.c5_lever = function (o) {
    const cv = mk(16, 26),
      c = cv.ctx;
    r(c, 2, 22, 12, 4, 'rgba(20,10,40,0.35)');
    r(c, 2, 6, 12, 18, '#4a5068');
    r(c, 2, 6, 12, 2, '#7a80a0');
    r(c, 4, 9, 8, 10, '#2a2a34');
    const col = o.on ? '#4ef08a' : '#ffd25e';
    if (o.on) {
      G.line(c, 8, 16, 11, 11, '#c8ccd8');
      G.ellipse(c, 11, 11, 2, 2, col);
    } else {
      G.line(c, 8, 12, 5, 17, '#c8ccd8');
      G.ellipse(c, 5, 17, 2, 2, col);
    }
    r(c, 4, 2, 8, 3, o.on ? '#1a4a2a' : '#4a3a1a');
    px(c, 7, 3, col);
    px(c, 8, 3, col);
    return { w: 1, h: 1, img: cv, ox: 0, oy: -10, solid: true, lights: [{ x: 8, y: -6, r: 12, col, a: 0.6 }] };
  };
  // 防火シャッター（#タイルの上に描く・判定はタイル側）
  P.c5_shutter = function (o) {
    const h = o.h || 4;
    const cv = mk(32, h * S + 10),
      c = cv.ctx;
    r(c, 0, 0, 32, h * S + 10, '#3a3e4e');
    r(c, 2, 2, 28, h * S + 6, '#7a8094');
    for (let j = 6; j < h * S + 6; j += 6) r(c, 2, j, 28, 1, '#5a6074');
    for (let j = 0; j < h * S + 10; j += 8) {
      r(c, 0, j, 2, 4, '#e8c040');
      r(c, 30, j + 4, 2, 4, '#e8c040');
    }
    r(c, 10, Math.floor((h * S) / 2) - 2, 12, 8, '#2a2a34');
    G.pixText(c, o.text || 'LOCK', 16 - G.pixTextW(o.text || 'LOCK') / 2, Math.floor((h * S) / 2), '#ff3050');
    return { w: 2, h, img: cv, ox: 0, oy: -10, solid: false, lights: [{ x: 16, y: -6, r: 16, col: '#ff3050', a: 0.7, blink: true }] };
  };
  // 床の蒸気口（判定なし・湯気は map.overlay で）
  P.c5_vent = function () {
    const cv = mk(16, 16),
      c = cv.ctx;
    r(c, 1, 1, 14, 14, '#2a2a34');
    for (let i = 3; i < 14; i += 3) r(c, 2, i, 12, 1, '#5a5a6a');
    r(c, 1, 1, 14, 1, '#ff8a30');
    r(c, 1, 14, 14, 1, '#ff8a30');
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  // エレベーター扉（2×1）open:true
  P.c5_lift = function (o) {
    const cv = mk(32, 44),
      c = cv.ctx;
    r(c, 0, 0, 32, 44, '#3a3e4e');
    r(c, 2, 4, 28, 40, o.open ? '#0e0c1a' : '#8a90a8');
    if (!o.open) {
      r(c, 15, 4, 2, 40, '#4a4e60');
      for (let j = 10; j < 44; j += 8) r(c, 3, j, 26, 1, '#6a7088');
    } else for (let j = 8; j < 44; j += 6) r(c, 4, j, 24, 1, '#1a1a2a');
    r(c, 8, 0, 16, 3, '#2a2a34');
    G.pixText(c, 'LIFT', 16 - G.pixTextW('LIFT') / 2, 0, o.open ? '#7dff9a' : '#ffd25e');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -28, solid: false, lights: [{ x: 16, y: -26, r: 16, col: o.open ? '#7dff9a' : '#ff3050', a: 0.7 }] };
  };
  // ロッカー（1×1、調べられる）
  P.c5_locker = function (o) {
    const cv = mk(16, 30),
      c = cv.ctx;
    r(c, 1, 26, 14, 4, 'rgba(20,10,40,0.3)');
    r(c, 1, 0, 14, 28, o.col || '#5a6a8a');
    r(c, 2, 1, 12, 26, G.shade(o.col || '#5a6a8a', 0.15));
    r(c, 7, 1, 1, 26, '#3a4a6a');
    for (let j = 4; j < 10; j += 2) r(c, 3, j, 3, 1, '#3a4a6a');
    px(c, 6, 15, '#e8e8f0');
    if (o.open) r(c, 9, 1, 5, 26, '#1a1a24');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -14, solid: true };
  };
  // 研究所の大型カプセル（ニコ）empty:true / glow
  P.c5_pod = function (o) {
    const cv = mk(32, 56),
      c = cv.ctx;
    r(c, 2, 50, 28, 6, 'rgba(20,10,40,0.35)');
    r(c, 2, 44, 28, 10, '#4a4e60');
    r(c, 2, 44, 28, 2, '#8a90a8');
    r(c, 4, 6, 24, 38, o.empty ? '#1a2a3a' : '#3ac8e0');
    r(c, 4, 6, 6, 38, 'rgba(255,255,255,0.25)');
    for (let i = 0; i < 8; i++) px(c, 10 + ((i * 7) % 14), 40 - i * 4, '#dffcff');
    if (!o.empty) {
      r(c, 13, 16, 6, 6, '#fbe6d8');
      r(c, 12, 13, 8, 4, '#eef2ff');
      r(c, 12, 22, 8, 14, '#e8f0f8');
      px(c, 14, 18, '#205070');
      px(c, 17, 18, '#205070');
    }
    r(c, 2, 0, 28, 7, '#4a4e60');
    r(c, 2, 0, 28, 2, '#8a90a8');
    for (let i = 4; i < 28; i += 6) px(c, 2 + i, 4, '#ffd25e');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -40, solid: true, lights: [{ x: 16, y: -20, r: 40, col: o.empty ? '#4a6a8a' : '#4ef0ff', a: 0.9, flicker: !o.empty }] };
  };
  // ガラス越しの観測窓（壁）
  P.c5_window = function (o) {
    const w = o.w || 3,
      W = w * S;
    const cv = mk(W, 26),
      c = cv.ctx;
    r(c, 0, 0, W, 26, '#5a6074');
    r(c, 2, 2, W - 4, 22, '#06051a');
    for (let i = 0; i < w * 4; i++) px(c, 3 + Math.floor(G.hash(i, w, 3) * (W - 6)), 3 + Math.floor(G.hash(w, i, 4) * 20), i % 3 ? '#6a7ad0' : '#ffffff');
    G.glow(c, W / 2, 13, 10, 'rgba(180,240,255,0.4)');
    for (let i = 16; i < W; i += 16) r(c, i - 1, 2, 2, 22, '#5a6074');
    return { w, h: 1, img: cv, ox: 0, oy: 2, solid: false, flat: true };
  };

  // ---------------------------------------------------------------
  //  共通：蒸気口の当たり判定と湯気（overlay で毎フレーム）
  // ---------------------------------------------------------------
  const ventOn = () => Math.floor(G.frame / 100) % 2 === 0;
  H.ventOverlay = function (list) {
    return (c, ox, oy, f) => {
      const on = ventOn();
      if (on && f % 5 === 0) for (const [x, y] of list) G.fx.steam(x * S + 8 + G.rand(-4, 4), y * S + 10);
      if (!on && f % 30 === 0) for (const [x, y] of list) G.fx.steam(x * S + 8, y * S + 12);
      if (!on || G.ev.running || G.ui.blocking() || G.field.battle) return;
      const p = G.field.player;
      if (list.some(([x, y]) => x === p.tx && y === p.ty)) {
        if (G.combat.hitPlayer(18 + G.state.lv, p.x, p.y + 10)) G.ui.toast('高温の蒸気だ！ タイミングを見て通ろう', '#ff8a30');
      }
    };
  };
  // 奈落（void）を暗い深淵として塗る
  function paintAbyss(c, m, col) {
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        if (m.cell(x, y) !== ' ') continue;
        r(c, x * S, y * S, S, S, col || '#07060f');
        const up = m.cell(x, y - 1);
        if (up && up !== ' ') {
          r(c, x * S, y * S, S, 6, '#2a2a3a');
          r(c, x * S, y * S + 6, S, 4, '#16141f');
        }
        if (G.hash(x, y, 31) > 0.86) px(c, x * S + Math.floor(G.hash(y, x, 32) * 14), y * S + Math.floor(G.hash(x, y, 33) * 14), G.hash(x, y, 34) > 0.5 ? '#ff8a30' : '#4ef0ff');
      }
  }

  // ---------------------------------------------------------------
  //  c5_tunnel1 — メンテナンス・トンネル 上層（48×30）
  //   入口 (6,28) ↔ green (4,5)。到着 (6,26)。
  //   左右2つのバルブを開くと、東のシャッター(32..33,8..11)が開く。ハッチ (44,4) → c5_tunnel2
  // ---------------------------------------------------------------
  const T1 = H.grid(48, 30, 'w');
  T1.fill(2, 20, 10, 8, 'm').set(6, 28, 'm'); // A：入口
  T1.fill(5, 12, 3, 8, 'g'); // A→B
  T1.fill(2, 8, 30, 4, 'm'); // B：東西の大通路
  T1.fill(2, 2, 9, 5, 'm').fill(4, 7, 2, 1, 'g'); // V1：西のバルブ室
  T1.fill(26, 12, 3, 6, 'g'); // B→V2
  T1.fill(20, 18, 16, 8, 'm'); // V2：南東のポンプ室
  T1.fill(21, 24, 14, 1, '~'); // 冷却水路
  T1.fill(32, 8, 2, 4, '#'); // シャッター
  T1.fill(34, 8, 4, 4, 'm'); // シャッター奥
  T1.fill(38, 2, 9, 13, 'm'); // D：ハッチ室
  T1.fill(30, 8, 2, 4, 'x').fill(5, 19, 3, 1, 'x').fill(2, 27, 10, 1, 'x').fill(38, 2, 9, 1, 'x');
  T1.fill(12, 9, 14, 2, 'g');
  T1.set(39, 3, 'Z');
  const T1_VENTS = [[5, 14], [6, 14], [7, 14], [5, 17], [6, 17], [7, 17], [4, 7], [5, 7], [27, 15], [26, 15], [28, 15]];
  G.defMap('c5_tunnel1', {
    name: 'メンテナンス・トンネル',
    area: '第7整備区画・上層',
    bgm: 'dungeon',
    light: '#3a3a5c',
    lightAlpha: 0.9,
    ambient: 'dust',
    floor: 'm',
    bg: '#06050c',
    pal: { wall: '#4a5064', wallTop: '#1c1c28', metal: '#6a7088', baseboard: '#2a2e3e', block: '#22222e', water: '#2a6a8a' },
    rows: T1.rows(),
    objects: [
      ...T1_VENTS.map(([x, y]) => ({ p: 'c5_vent', x, y })),
      { p: 'c5_valve', x: 9, y: 3, id: 'c5_v1', show: () => !E.flag('c5_v1') },
      { p: 'c5_valve', x: 9, y: 3, id: 'c5_v1o', open: true, show: () => E.flag('c5_v1') },
      { p: 'c5_valve', x: 34, y: 19, id: 'c5_v2', show: () => !E.flag('c5_v2') },
      { p: 'c5_valve', x: 34, y: 19, id: 'c5_v2o', open: true, show: () => E.flag('c5_v2') },
      { p: 'c5_shutter', x: 32, y: 8, h: 4, id: 'c5_sh1', text: 'P-07', show: () => !E.flag('c5_t1_open') },
      { p: 'hatch', x: 44, y: 4, glow: true },
      { p: 'pipe', x: 2, y: 7, w: 2, col: '#7a6a5a' },
      { p: 'pipe', x: 12, y: 7, w: 18, col: '#6a7a8a' },
      { p: 'pipe', x: 21, y: 17, w: 5, col: '#8a6a4a' },
      { p: 'pipe', x: 38, y: 15, w: 9, col: '#6a7a8a' },
      { p: 'tank', x: 2, y: 2, text: 'H2O', col: '#8a9ab0' },
      { p: 'tank', x: 21, y: 19, text: 'CO2', col: '#9a9a8a' },
      { p: 'tank', x: 31, y: 21, text: 'N2', col: '#8a9ab0' },
      { p: 'barrel', x: 3, y: 21, hazard: true },
      { p: 'barrel', x: 10, y: 25, hazard: true },
      { p: 'crate', x: 10, y: 21 },
      { p: 'crate', x: 9, y: 21 },
      { p: 'crate', x: 2, y: 11 },
      { p: 'crate', x: 18, y: 8 },
      { p: 'server', x: 45, y: 8 },
      { p: 'server', x: 46, y: 8 },
      { p: 'terminal', x: 42, y: 2, col: '#7dff9a' },
      { p: 'crate', x: 38, y: 13 },
      { p: 'barrel', x: 46, y: 13, hazard: true },
      { p: 'sign', x: 8, y: 20, text: 'B7', col: '#e8c040', msg: '「第7整備区画 B7 → コア・シャフト貨物線　※無許可の立入を禁ず　コロニー公社」' },
    ],
    enemies: [
      { type: 'rat', x: 12, y: 10, lv: 6, id: 'c5_t1_r1' },
      { type: 'rat', x: 20, y: 9, lv: 6, id: 'c5_t1_r2' },
      { type: 'rat', x: 24, y: 10, lv: 6, id: 'c5_t1_r3' },
      { type: 'drone', x: 6, y: 4, lv: 6, id: 'c5_t1_d1' },
      { type: 'drone', x: 4, y: 3, lv: 6, id: 'c5_t1_d2' },
      { type: 'bot', x: 25, y: 20, lv: 6, id: 'c5_t1_b1' },
      { type: 'bot', x: 30, y: 22, lv: 6, id: 'c5_t1_b2' },
      { type: 'bot', x: 28, y: 19, lv: 6, id: 'c5_t1_b3' },
      { type: 'rat', x: 42, y: 11, lv: 6, id: 'c5_t1_r4' },
      { type: 'rat', x: 40, y: 7, lv: 6, id: 'c5_t1_r5' },
    ],
    items: [
      { x: 3, y: 5, item: 'repair', id: 'c5_t1_i1' },
      { x: 34, y: 25 - 2, item: 'energy', id: 'c5_t1_i2' },
      { x: 46, y: 3, item: 'chip', id: 'c5_t1_i3' },
    ],
    lights: [
      { x: 6, y: 22, r: 50, col: '#ffd890', a: 0.6 },
      { x: 6, y: 15, r: 34, col: '#ff8a30', a: 0.5, flicker: true },
      { x: 10, y: 9, r: 44, col: '#9ab8ff', a: 0.5 },
      { x: 22, y: 9, r: 44, col: '#9ab8ff', a: 0.5 },
      { x: 6, y: 4, r: 40, col: '#7dff9a', a: 0.4 },
      { x: 27, y: 21, r: 50, col: '#4ef0ff', a: 0.4 },
      { x: 42, y: 8, r: 56, col: '#ffd890', a: 0.5 },
    ],
    warps: [
      { x: 6, y: 28, to: 'green', tx: 4, ty: 5, dir: 'down' },
      { x: 44, y: 4, to: 'c5_tunnel2', tx: 5, ty: 5, dir: 'down', se: 'step' },
    ],
    overlay: H.ventOverlay(T1_VENTS),
  });

  // ---------------------------------------------------------------
  //  c5_tunnel2 — メンテナンス・トンネル 下層（50×34）
  //   ハッチ (3,3) → c5_tunnel1 (44,6)。到着 (5,5)。
  //   警備室のロッカーにカードキー、レバーで橋 (6..7,9..14) が伸びる。
  //   カードキーのゲート (31..32,17..20)。奥がウォーデンの部屋、リフト (40..41,8) → c5_core
  // ---------------------------------------------------------------
  const T2 = H.grid(50, 34, 'w');
  T2.fill(2, 2, 10, 7, 'm'); // S：降り口
  T2.fill(12, 4, 1, 2, 'm'); // S→O
  T2.fill(13, 2, 9, 7, 'l'); // O：警備室
  T2.fill(2, 9, 20, 6, ' '); // 奈落
  T2.fill(22, 9, 1, 6, 'w');
  T2.fill(2, 15, 29, 8, 'm'); // M：タレット通路
  T2.fill(4, 17, 25, 4, 'g');
  T2.fill(31, 17, 2, 4, '#'); // カードキーのゲート
  T2.fill(33, 10, 16, 21, 'm'); // W：ウォーデンの部屋
  T2.fill(37, 15, 8, 10, 'g');
  T2.fill(33, 10, 16, 1, 'x').fill(33, 30, 16, 1, 'x');
  T2.fill(40, 8, 2, 2, 'm'); // リフト前
  T2.set(10, 3, 'Z').set(29, 16, 'Z');
  G.defMap('c5_tunnel2', {
    name: 'メンテナンス・トンネル',
    area: '第7整備区画・下層',
    bgm: 'dungeon',
    light: '#34345a',
    lightAlpha: 0.9,
    ambient: 'dust',
    floor: 'm',
    bg: '#06050c',
    pal: { wall: '#454b60', wallTop: '#1a1a26', metal: '#666c84', lino: '#8a94a8', baseboard: '#2a2e3e', block: '#22222e' },
    rows: T2.rows(),
    decorate: (c, m) => paintAbyss(c, m),
    objects: [
      { p: 'hatch', x: 3, y: 3, glow: true },
      { p: 'bench', x: 7, y: 7 },
      { p: 'crate', x: 2, y: 7 },
      { p: 'barrel', x: 11, y: 7, hazard: true },
      { p: 'c5_locker', x: 14, y: 2, col: '#5a6a8a', msg: '警備員のロッカー。中には古い制服と、湿気たせんべい。' },
      { p: 'c5_locker', x: 15, y: 2, col: '#5a6a8a', id: 'c5_lk', show: () => !E.flag('c5_keycard') },
      { p: 'c5_locker', x: 15, y: 2, col: '#5a6a8a', open: true, show: () => E.flag('c5_keycard') },
      { p: 'c5_locker', x: 16, y: 2, col: '#5a6a8a', msg: 'ロッカーの扉に、子どもの描いた絵が貼ってある。「パパ　おしごと　がんばって」' },
      { p: 'table', x: 17, y: 5, w: 2, h: 1, col: '#6a6a7a', items: true, msg: '警備日誌。「第七研究棟への物資搬入、今月三度目。中身は知らされていない。……最近、夜中に子どもの歌が聞こえる気がする」' },
      { p: 'terminal', x: 20, y: 2, col: '#ffd25e' },
      { p: 'c5_lever', x: 21, y: 7, id: 'c5_lv', show: () => !E.flag('c5_bridge') },
      { p: 'c5_lever', x: 21, y: 7, on: true, show: () => E.flag('c5_bridge') },
      { p: 'c5_shutter', x: 31, y: 17, h: 4, id: 'c5_gate', text: 'CARD', show: () => !E.flag('c5_gate_open') },
      { p: 'crate', x: 9, y: 18 },
      { p: 'crate', x: 9, y: 19 },
      { p: 'crate', x: 16, y: 20 },
      { p: 'crate', x: 17, y: 20 },
      { p: 'crate', x: 23, y: 17 },
      { p: 'crate', x: 23, y: 18 },
      { p: 'barrel', x: 2, y: 21, hazard: true },
      { p: 'pipe', x: 2, y: 22, w: 8, col: '#6a7a8a' },
      { p: 'c5_lift', x: 40, y: 8, id: 'c5_lift', show: () => !E.flag('c5_warden_down') },
      { p: 'c5_lift', x: 40, y: 8, open: true, show: () => E.flag('c5_warden_down') },
      { p: 'tank', x: 34, y: 11, text: 'O2', col: '#8a9ab0' },
      { p: 'tank', x: 46, y: 11, text: 'O2', col: '#8a9ab0' },
      { p: 'server', x: 34, y: 27 },
      { p: 'server', x: 35, y: 27 },
      { p: 'server', x: 47, y: 27 },
    ],
    enemies: [
      { type: 'bot', x: 16, y: 6, lv: 6, id: 'c5_t2_b1' },
      { type: 'bot', x: 19, y: 4, lv: 6, id: 'c5_t2_b2' },
      { type: 'turret', x: 12, y: 16, lv: 7, id: 'c5_t2_t1' },
      { type: 'turret', x: 20, y: 21, lv: 7, id: 'c5_t2_t2' },
      { type: 'turret', x: 26, y: 15, lv: 7, id: 'c5_t2_t3' },
      { type: 'drone', x: 14, y: 19, lv: 7, id: 'c5_t2_d1' },
      { type: 'drone', x: 25, y: 20, lv: 7, id: 'c5_t2_d2' },
      { type: 'rat', x: 5, y: 20, lv: 7, id: 'c5_t2_r1' },
    ],
    items: [
      { x: 2, y: 16, item: 'repair', id: 'c5_t2_i1' },
      { x: 28, y: 22, item: 'melonpan', id: 'c5_t2_i2' },
      { x: 13, y: 8, item: 'energy', id: 'c5_t2_i3' },
    ],
    lights: [
      { x: 6, y: 4, r: 50, col: '#ffd890', a: 0.6 },
      { x: 17, y: 4, r: 50, col: '#ffe0b0', a: 0.6 },
      { x: 6, y: 18, r: 44, col: '#9ab8ff', a: 0.5 },
      { x: 18, y: 18, r: 44, col: '#ff8a30', a: 0.4, flicker: true },
      { x: 27, y: 18, r: 44, col: '#9ab8ff', a: 0.5 },
      { x: 40, y: 13, r: 60, col: '#ff3050', a: 0.4, flicker: true },
      { x: 40, y: 22, r: 70, col: '#9ab8ff', a: 0.4 },
      { x: 12, y: 12, r: 60, col: '#4ef0ff', a: 0.15 },
    ],
    warps: [
      { x: 3, y: 3, to: 'c5_tunnel1', tx: 44, ty: 6, dir: 'down', se: 'step' },
      { x: 40, y: 8, w: 2, to: 'c5_core', tx: 5, ty: 15, dir: 'right', se: 'door', cond: () => E.flag('c5_warden_down'), blocked: async () => await E.say(null, 'リフトの扉は固く閉ざされている。……部屋の奥で、何かの駆動音がする。') },
    ],
  });

  // ---------------------------------------------------------------
  //  c5_core — コア・シャフト（無重力区画, 58×30）
  //   P0 到着 (5,15) ／ リフト (4,12) → c5_tunnel2 (40,10)
  //   P1（x21..33）巡回1：縦、巡回2：横 ／ W2 チェックポイント (35,14) ／ P2（x41..55）
  //   研究棟の扉 (57,14..15) → c5_lab (2,11)
  // ---------------------------------------------------------------
  const CO = H.grid(58, 30, ' ');
  CO.fill(2, 12, 7, 7, 'h'); // P0
  CO.fill(9, 14, 12, 2, 'g'); // W1
  CO.fill(21, 5, 13, 20, 'h'); // P1
  CO.fill(34, 14, 7, 2, 'g'); // W2
  CO.fill(41, 4, 15, 22, 'h'); // P2
  CO.fill(56, 14, 2, 2, 'g'); // 研究棟へ
  CO.fill(21, 5, 13, 1, 'x').fill(41, 4, 15, 1, 'x').fill(2, 12, 7, 1, 'x');
  for (const x of [44, 45, 46, 48, 49, 50, 52, 53, 54]) CO.set(x, 12, 'X');
  for (const x of [44, 45, 46, 48, 49, 50, 52, 53, 54]) CO.set(x, 17, 'X');
  CO.set(4, 17, 'Z');
  // 遠景：深い縦穴と回転するリング、底でかすかに光る「何か」
  function coreParallax(c, cam, f) {
    const g = c.createRadialGradient(G.W / 2, G.H / 2, 8, G.W / 2, G.H / 2, G.W * 0.75);
    g.addColorStop(0, '#24306a');
    g.addColorStop(0.5, '#0e1230');
    g.addColorStop(1, '#03030a');
    c.fillStyle = g;
    c.fillRect(0, 0, G.W, G.H);
    const cx = G.W / 2 - cam.x * 0.04 + 100,
      cy = G.H / 2 - cam.y * 0.04 + 20;
    for (let i = 0; i < 7; i++) {
      const rr = 18 + i * 34 + ((f * 0.15) % 34);
      const a = 0.35 - i * 0.045;
      if (a <= 0) continue;
      c.fillStyle = `rgba(130,170,255,${a})`;
      const n = 40 + i * 14;
      for (let k = 0; k < n; k++) {
        const t = (k / n) * Math.PI * 2 + f * 0.002 * (i % 2 ? 1 : -1);
        c.fillRect(Math.round(cx + Math.cos(t) * rr * 1.7), Math.round(cy + Math.sin(t) * rr * 0.55), 2, 1);
      }
    }
    for (let i = 0; i < 70; i++) {
      const sp = 0.15 + (i % 4) * 0.08;
      const x = ((((G.hash(i, 1, 5) * 1200 - cam.x * sp + f * 0.04 * ((i % 3) - 1)) % 1200) + 1200) % 1200) - 300;
      const y = ((((G.hash(i, 2, 5) * 700 - cam.y * sp + f * 0.03) % 700) + 700) % 700) - 200;
      c.fillStyle = i % 5 ? 'rgba(120,150,220,0.6)' : 'rgba(255,220,160,0.8)';
      c.fillRect(Math.round(x), Math.round(y), i % 7 ? 1 : 2, i % 7 ? 1 : 2);
    }
    // 遠くの構造材
    for (let i = 0; i < 6; i++) {
      const x = ((((i * 211 - cam.x * 0.25) % 700) + 700) % 700) - 100;
      c.fillStyle = 'rgba(40,50,90,0.7)';
      c.fillRect(Math.round(x), 0, 6, G.H);
      c.fillStyle = 'rgba(90,110,170,0.4)';
      c.fillRect(Math.round(x), 0, 1, G.H);
    }
  }
  G.C45.coreParallax = coreParallax;
  G.defMap('c5_core', {
    name: 'コア・シャフト',
    area: '回転軸・無重力区画',
    bgm: () => (E.flag('c5_alarm') ? 'chase' : 'space'),
    light: '#2a3058',
    lightAlpha: 1,
    time: () => (E.flag('c5_alarm') ? 'alarm' : 'custom'),
    ambient: 'echo',
    floor: 'h',
    pal: { metal: '#6a7090', block: '#1a1a2a' },
    rows: CO.rows(),
    parallax: coreParallax,
    post: (c, ox, oy, f) => {
      c.globalCompositeOperation = 'lighter';
      const cx = G.W / 2 - G.field.cam.x * 0.04 + 100,
        cy = G.H / 2 - G.field.cam.y * 0.04 + 20;
      G.glow(c, cx, cy, 46 + Math.sin(f * 0.03) * 6, 'rgba(160,240,255,0.22)');
      G.glow(c, cx, cy, 14, 'rgba(255,255,255,0.35)');
      c.globalCompositeOperation = 'source-over';
    },
    objects: [
      { p: 'c5_lift', x: 3, y: 12, open: true },
      { p: 'crate', x: 8, y: 12 },
      { p: 'container', x: 23, y: 11, col: '#4a5a7a', text: 'C7' },
      { p: 'container', x: 29, y: 17, col: '#7a4a4a', text: 'LAB' },
      { p: 'container', x: 23, y: 20, col: '#4a6a5a', text: 'O2' },
      { p: 'crate', x: 31, y: 8 },
      { p: 'crate', x: 22, y: 7 },
      { p: 'crate', x: 32, y: 22 },
      { p: 'terminal', x: 42, y: 5, col: '#4ef0ff', msg: '中心軸の管制端末。「回転軸ベアリング温度：上昇傾向。マザーによる自動調整中」' },
      { p: 'sign', x: 55, y: 13, text: 'LAB 7', col: '#4ef0ff', msg: '「第七研究棟　関係者以外立入禁止　――コロニー総合研究所」' },
      { p: 'crate', x: 43, y: 22 },
      { p: 'crate', x: 53, y: 23 },
      { p: 'tank', x: 51, y: 20, text: 'N2', col: '#8a9ab0' },
    ],
    enemies: [
      { type: 'guard2', x: 27, y: 9, lv: 7, patrol: [[27, 8], [27, 21]], vision: 76, dir: 'down', show: () => !E.flag('c5_alarm') },
      { type: 'guard2', x: 22, y: 9, lv: 7, patrol: [[22, 9], [32, 9]], vision: 70, dir: 'right', show: () => !E.flag('c5_alarm') },
      { type: 'guard2', x: 43, y: 11, lv: 7, patrol: [[43, 11], [54, 11]], vision: 76, dir: 'right', show: () => !E.flag('c5_alarm') },
      { type: 'guard2', x: 47, y: 23, lv: 7, patrol: [[47, 23], [47, 16], [51, 16], [51, 23]], vision: 72, dir: 'up', show: () => !E.flag('c5_alarm') },
      { type: 'drone', x: 37, y: 10, lv: 7, patrol: [[37, 10], [37, 19]], vision: 60, dir: 'down', show: () => !E.flag('c5_alarm') },
    ],
    lights: [
      { x: 5, y: 15, r: 60, col: '#9ab8ff', a: 0.7 },
      { x: 14, y: 14, r: 40, col: '#4ef0ff', a: 0.5 },
      { x: 25, y: 8, r: 56, col: '#c8d8ff', a: 0.55 },
      { x: 30, y: 14, r: 56, col: '#c8d8ff', a: 0.55 },
      { x: 25, y: 21, r: 56, col: '#c8d8ff', a: 0.55 },
      { x: 37, y: 14, r: 40, col: '#4ef0ff', a: 0.5 },
      { x: 45, y: 7, r: 60, col: '#c8d8ff', a: 0.55 },
      { x: 52, y: 14, r: 60, col: '#c8d8ff', a: 0.55 },
      { x: 46, y: 21, r: 60, col: '#c8d8ff', a: 0.55 },
      { x: 56, y: 14, r: 40, col: '#4ef0ff', a: 0.7 },
    ],
    warps: [
      { x: 3, y: 12, w: 2, to: 'c5_tunnel2', tx: 40, ty: 10, dir: 'down', se: 'door' },
      { x: 57, y: 14, h: 2, to: 'c5_lab', tx: 2, ty: 11, dir: 'right', se: 'door' },
    ],
  });

  // ---------------------------------------------------------------
  //  c5_lab — 第七研究棟（58×22）
  //   西口 (0,10..11) → c5_core (55,14)。到着 (2,11)
  //   研究室 x9..33／ニコのカプセル (28..29,10)／東の隔壁 (34..35,9..11)／東通路 → c5_dock
  // ---------------------------------------------------------------
  const LB = H.grid(58, 22, 'w');
  LB.fill(1, 9, 8, 4, 'm').fill(0, 10, 1, 2, 'm'); // 西の通路
  LB.fill(9, 3, 25, 17, 'l'); // 研究室
  LB.fill(9, 3, 25, 1, 'm');
  LB.fill(20, 8, 12, 6, 'm'); // 中央の台座
  LB.fill(34, 9, 2, 3, '#'); // 東の隔壁
  LB.fill(36, 8, 21, 5, 'm').fill(57, 9, 1, 3, 'm'); // 東の通路
  LB.fill(36, 8, 21, 1, 'x').fill(36, 12, 21, 1, 'x');
  for (const x of [12, 16, 24]) LB.set(x, 5, 'i');
  for (const x of [12, 16, 20, 24]) LB.set(x, 17, 'i');
  LB.set(20, 5, 'i');
  for (const y of [4, 5, 6]) LB.set(32, y, 'X').set(33, y, 'X');
  for (const y of [15, 16, 17]) LB.set(32, y, 'X').set(33, y, 'X');
  G.defMap('c5_lab', {
    name: '第七研究棟',
    area: 'PROJECT ECHO',
    bgm: () => (E.flag('c5_alarm') ? 'chase' : 'dungeon'),
    light: '#5a6488',
    lightAlpha: 0.85,
    time: () => (E.flag('c5_alarm') ? 'alarm' : 'custom'),
    ambient: 'echo',
    floor: 'l',
    pal: { wall: '#c8ccd8', wallTop: '#2a2a3e', lino: '#d4dae6', metal: '#7a8098', baseboard: '#8a90a8', block: '#2a2a38' },
    rows: LB.rows(),
    objects: [
      { p: 'c5_window', x: 13, y: 1, w: 4 },
      { p: 'c5_window', x: 22, y: 1, w: 4 },
      { p: 'c5_pod', x: 28, y: 10, id: 'c5_pod', show: () => !E.flag('c5_niko_free') },
      { p: 'c5_pod', x: 28, y: 10, empty: true, show: () => E.flag('c5_niko_free') },
      { p: 'terminal', x: 11, y: 9, col: '#4ef0ff', id: 'c5_rec1' },
      { p: 'terminal', x: 18, y: 12, col: '#ff5fa2', id: 'c5_rec2' },
      { p: 'terminal', x: 26, y: 15, col: '#ffd25e', id: 'c5_rec3' },
      { p: 'terminal', x: 14, y: 14, col: '#7dff9a', id: 'c5_rec4' },
      { p: 'terminal', x: 30, y: 11, col: '#4ef0ff', msg: 'カプセルの制御端末。画面に「被験体E-07　鎮静レベル3　共鳴率 87%」' },
      { p: 'c5_shutter', x: 34, y: 9, h: 3, id: 'c5_labdoor', text: 'E-W', show: () => !E.flag('c5_niko_free') },
      { p: 'table', x: 9, y: 15, w: 2, h: 1, col: '#e8ecf4', items: true, msg: '実験机。カルテが散らばっている。「共鳴試験　第214回　被験体は泣き続けた。中止を進言する――却下」' },
      { p: 'shelf', x: 9, y: 3, w: 2, col: '#8a90a8', msg: '薬品棚。ラベルはすべて番号で、名前は書かれていない。' },
      { p: 'plant', x: 9, y: 19 },
      { p: 'hatch', x: 44, y: 10, glow: true },
      { p: 'crate', x: 50, y: 9 },
      { p: 'crate', x: 51, y: 11 },
    ],
    lights: [
      { x: 14, y: 6, r: 60, col: '#e8f0ff', a: 0.5 },
      { x: 26, y: 6, r: 60, col: '#e8f0ff', a: 0.5 },
      { x: 14, y: 16, r: 60, col: '#e8f0ff', a: 0.5 },
      { x: 26, y: 16, r: 60, col: '#e8f0ff', a: 0.5 },
      { x: 4, y: 10, r: 44, col: '#9ab8ff', a: 0.6 },
      { x: 42, y: 10, r: 50, col: '#ff3050', a: 0.4, flicker: true },
      { x: 52, y: 10, r: 50, col: '#ff3050', a: 0.4, flicker: true },
    ],
    warps: [
      { x: 0, y: 10, h: 2, to: 'c5_core', tx: 55, ty: 14, dir: 'left', se: 'door', cond: () => !E.flag('c5_alarm'), blocked: async () => await E.say('ruu', '戻り道はもう公安でいっぱいだって！　東の通路から抜けるよ！') },
      { x: 57, y: 9, h: 3, to: 'c5_dock', tx: 3, ty: 14, dir: 'right', se: 'door' },
    ],
  });

  // ---------------------------------------------------------------
  //  c5_dock — コア・シャフト貨物ドック（機体戦, 40×26）
  //   到着 (3,14)
  // ---------------------------------------------------------------
  const DK = H.grid(40, 26, 'h');
  DK.fill(0, 0, 40, 3, 'w').fill(0, 25, 40, 1, 'W').fill(0, 0, 1, 26, 'W').fill(39, 0, 1, 26, 'W');
  for (let x = 3; x < 38; x += 5) DK.set(x, 2, 'O').set(x + 1, 2, 'O').set(x + 2, 2, 'O');
  DK.fill(1, 3, 38, 1, 'x').fill(1, 24, 38, 1, 'x');
  DK.fill(1, 12, 1, 5, 'm');
  G.defMap('c5_dock', {
    name: '貨物ドック',
    area: 'コア・シャフト',
    bgm: () => (E.flag('c5_dock_done') ? 'space' : 'chase'),
    light: '#5a6080',
    lightAlpha: 0.8,
    ambient: 'echo',
    floor: 'h',
    pal: { wall: '#4a5068', wallTop: '#1a1a26', bigwall: '#3a3e52', metal: '#7a8098' },
    rows: DK.rows(),
    objects: [
      { p: 'container', x: 6, y: 5, col: '#3a6ad0', text: 'C7', stack: 2 },
      { p: 'container', x: 31, y: 5, col: '#c04a3a', text: 'FARM' },
      { p: 'container', x: 31, y: 20, col: '#4a8a5a', text: 'GREEN' },
      { p: 'container', x: 6, y: 20, col: '#7a7a8a', text: 'LIFT' },
      { p: 'crane', x: 18, y: 4 },
      { p: 'hangar', x: 14, y: 21 },
      { p: 'hangar', x: 22, y: 21 },
      { p: 'barrel', x: 36, y: 12, hazard: true },
      { p: 'barrel', x: 36, y: 13, hazard: true },
    ],
    lights: [
      { x: 10, y: 10, r: 70, col: '#c8d8ff', a: 0.5 },
      { x: 28, y: 10, r: 70, col: '#c8d8ff', a: 0.5 },
      { x: 19, y: 18, r: 70, col: '#c8d8ff', a: 0.5 },
      { x: 19, y: 5, r: 50, col: '#ff3050', a: 0.4, flicker: true },
    ],
    warps: [],
  });
})();
