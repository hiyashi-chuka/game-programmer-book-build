// =============================================================
//  maps/c7.js — 第7章「崩れる空」専用マップ
//   c7_shelter  : ミナト区第2地下避難シェルター（町の人たちが避難している）
//   c7_govtower : 総督府タワー（ロビー → 警備フロア〈ステルス〉 → 総督執務室）
//   c7_port     : 宇宙港・第7ドック（防衛戦と発進）
//  イベントは story/ch7.js（G.C7.* を参照）
// =============================================================
(function () {
  const C7 = (G.C7 = G.C7 || {});
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const W2 = G.W2;

  // ---------------------------------------------------------------
  //  小物（c7_ 接頭辞）
  // ---------------------------------------------------------------
  // 地下シェルターの入口（3×1、真ん中が階段）
  G.PROPS.c7_bunker = function () {
    const cv = mk(48, 44);
    const c = cv.ctx;
    G.ellipse(c, 24, 40, 23, 4, 'rgba(20,10,40,0.3)');
    // コンクリの箱
    r(c, 1, 8, 46, 32, '#8a8c96');
    r(c, 1, 8, 46, 3, '#a8aab4');
    r(c, 1, 36, 46, 4, '#6a6c76');
    // 警戒色
    for (let x = 1; x < 47; x += 6) {
      r(c, x, 11, 3, 3, '#ffd25e');
      r(c, x + 3, 11, 3, 3, '#2a2a30');
    }
    // 入口（階段が下へ）
    r(c, 16, 16, 16, 24, '#1a1826');
    for (let y = 0; y < 5; y++) r(c, 17, 20 + y * 4, 14, 2, G.shade('#5a5a68', -y * 0.12));
    r(c, 15, 15, 18, 1, '#5a5c66');
    // SHELTER 看板（緑）
    r(c, 8, 0, 32, 9, '#1a8a4a');
    r(c, 8, 0, 32, 1, '#4ae08a');
    G.pixText(c, 'SHELTER', 24 - G.pixTextW('SHELTER') / 2, 2, '#ffffff');
    // 非常灯
    r(c, 5, 18, 4, 4, '#ff3050');
    r(c, 39, 18, 4, 4, '#ff3050');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -28, solid: [[0, 0, 1, 1], [2, 0, 1, 1]], lights: [{ x: 24, y: -24, r: 30, col: '#4ae08a', a: 0.8 }, { x: 7, y: -8, r: 14, col: '#ff3050', a: 0.7, blink: true }, { x: 41, y: -8, r: 14, col: '#ff3050', a: 0.7, blink: true }] };
  };
  // 簡易ベッド（避難所の段ボールベッド＋毛布）
  G.PROPS.c7_cot = function (o) {
    const cv = mk(16, 30);
    const c = cv.ctx;
    r(c, 1, 26, 15, 3, 'rgba(20,10,40,0.25)');
    r(c, 1, 6, 14, 20, '#c8a878');
    r(c, 1, 6, 14, 2, '#e0c898');
    r(c, 2, 8, 12, 6, '#f0f0f4');
    const col = o.col || G.pick(['#4a7ad0', '#d05a6a', '#5aa06a', '#d0a040', '#8a6ad0']);
    r(c, 2, 13, 12, 12, col);
    r(c, 2, 13, 12, 1, G.shade(col, 0.3));
    for (let y = 16; y < 25; y += 3) r(c, 2, y, 12, 1, G.shade(col, -0.15));
    return { w: 1, h: 2, img: cv, ox: 0, oy: -6, solid: true };
  };
  // 給水タンク・物資の山
  G.PROPS.c7_supplies = function () {
    const cv = mk(32, 28);
    const c = cv.ctx;
    G.ellipse(c, 16, 24, 15, 3, 'rgba(20,10,40,0.3)');
    for (const [x, y, w, h, col] of [[2, 12, 12, 11, '#c8a070'], [14, 12, 14, 11, '#b89060'], [6, 3, 14, 10, '#d8b080'], [20, 4, 8, 8, '#4a8ad0']]) {
      r(c, x, y, w, h, col);
      r(c, x, y, w, 1, G.shade(col, 0.25));
      r(c, x + Math.floor(w / 2) - 1, y, 2, h, G.shade(col, -0.2));
    }
    G.pixText(c, 'H2O', 21, 6, '#ffffff');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -12, solid: true };
  };
  // 大型モニター（壁掛け。chapter7 はヘルミナ／リリィを映す）
  G.PROPS.c7_monitor = function (o) {
    const w = o.w || 4;
    const cv = mk(w * S, 30);
    const c = cv.ctx;
    r(c, 0, 0, w * S, 26, '#1a1a24');
    r(c, 2, 2, w * S - 4, 22, o.col || '#2a1030');
    for (let y = 3; y < 24; y += 2) r(c, 2, y, w * S - 4, 1, 'rgba(255,255,255,0.05)');
    G.pixText(c, o.text || 'ALERT', (w * S) / 2 - G.pixTextW(o.text || 'ALERT') / 2, 10, o.tcol || '#ff3050');
    r(c, (w * S) / 2 - 2, 26, 4, 4, '#3a3a48');
    return { w, h: 1, img: cv, ox: 0, oy: -14, solid: false, flat: false, above: true, lights: [{ x: (w * S) / 2, y: -2, r: 40, col: o.glow || '#ff3050', a: 0.6, flicker: true }] };
  };
  // 総督の机（3×1）
  G.PROPS.c7_govdesk = function () {
    const cv = mk(48, 28);
    const c = cv.ctx;
    r(c, 1, 24, 46, 3, 'rgba(20,10,40,0.3)');
    r(c, 1, 8, 46, 16, '#3a2a24');
    r(c, 1, 8, 46, 3, '#6a4a3a');
    r(c, 4, 13, 40, 1, '#c0a040');
    r(c, 6, 3, 10, 6, '#2a2a3a');
    r(c, 7, 4, 8, 4, '#4ef0ff');
    r(c, 30, 4, 7, 5, '#e8e4d8');
    r(c, 39, 2, 3, 7, '#c0a040');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -8, solid: true, lights: [{ x: 11, y: -2, r: 16, col: '#4ef0ff', a: 0.6 }] };
  };
  // 発進カタパルト（床に描く、2×w）
  G.PROPS.c7_catapult = function (o) {
    const h = o.h || 8;
    const cv = mk(32, h * S);
    const c = cv.ctx;
    r(c, 2, 0, 28, h * S, '#2a2a36');
    r(c, 5, 0, 3, h * S, '#8a90a0');
    r(c, 24, 0, 3, h * S, '#8a90a0');
    for (let y = 4; y < h * S; y += 12) {
      r(c, 12, y, 8, 4, '#4ef0ff');
      r(c, 13, y + 1, 6, 2, '#bff8ff');
    }
    return { w: 2, h, img: cv, ox: 0, oy: 0, solid: false, flat: true, lights: [{ x: 16, y: 8, r: 20, col: '#4ef0ff', a: 0.6, blink: true }, { x: 16, y: h * S - 8, r: 20, col: '#4ef0ff', a: 0.6 }] };
  };
  // 大型隔壁（宇宙側の扉、閉/開）
  G.PROPS.c7_bayDoor = function (o) {
    const w = o.w || 8;
    const cv = mk(w * S, 40);
    const c = cv.ctx;
    r(c, 0, 0, w * S, 40, '#2a2c38');
    if (o.open) {
      r(c, 6, 4, w * S - 12, 34, '#04030c');
      for (let i = 0; i < 40; i++) px(c, 8 + Math.floor(G.hash(i, 1, 9) * (w * S - 16)), 6 + Math.floor(G.hash(i, 2, 9) * 30), i % 5 ? '#ffffff' : '#9ad8ff');
      r(c, 0, 0, 8, 40, '#5a5e70');
      r(c, w * S - 8, 0, 8, 40, '#5a5e70');
    } else {
      r(c, 4, 4, w * S / 2 - 5, 34, '#6a6e80');
      r(c, w * S / 2 + 1, 4, w * S / 2 - 5, 34, '#6a6e80');
      for (let x = 8; x < w * S - 8; x += 12) {
        r(c, x, 30, 6, 6, '#ffd25e');
        r(c, x + 6, 30, 6, 6, '#2a2a30');
      }
      G.pixText(c, 'DOCK 7', (w * S) / 2 - G.pixTextW('DOCK 7', 2) / 2, 12, '#c0c4d0', 2);
    }
    return { w, h: 1, img: cv, ox: 0, oy: -24, solid: true, lights: [{ x: 6, y: -10, r: 18, col: '#ff3050', a: 0.7, blink: true }, { x: w * S - 6, y: -10, r: 18, col: '#ff3050', a: 0.7, blink: true }] };
  };

  // ---------------------------------------------------------------
  //  c7_shelter — ミナト区第2地下避難シェルター（44×24）
  //   出口 (3..4,23) → minato (19,12)
  //   総督府への非常連絡通路 (40..41,2)（ユイと一緒に開く）
  // ---------------------------------------------------------------
  const SH = W2.grid(44, 24, 'w');
  SH.fill(1, 3, 42, 19, 'c');
  SH.fill(3, 22, 2, 2, 'c');
  SH.fill(40, 2, 2, 1, 'c');
  // ベッド列（c7_cot は1×2）
  const cots = [];
  for (const x of [7, 9, 11, 13, 15]) cots.push([x, 4]);
  for (const x of [7, 9, 11, 13, 15]) cots.push([x, 9]);
  for (const x of [26, 28, 30, 32]) cots.push([x, 15]);
  SH.put(1, 3, 'PX').set(42, 21, 'P').set(1, 21, 'Z');
  G.defMap('c7_shelter', G.W1.flatChecks({
    name: '地下避難シェルター',
    area: 'ミナト区第2シェルター',
    bgm: () => (E.flag('c7_broadcast') ? 'home' : 'sad'),
    light: '#b8b0d0',
    lightAlpha: 0.85,
    floor: 'c',
    pal: { wall: '#a8aab8', wallTop: '#2a2838', concrete: '#9a9aa6', baseboard: '#5a5a6a' },
    rows: SH.rows(),
    objects: [
      ...cots.map(([x, y], i) => ({ p: 'c7_cot', x, y, col: ['#4a7ad0', '#d05a6a', '#5aa06a', '#d0a040', '#8a6ad0'][i % 5] })),
      { p: 'c7_monitor', x: 20, y: 2, w: 4, text: 'ALERT', col: '#2a0a14', glow: '#ff3050', show: () => !E.flag('c7_broadcast') },
      { p: 'c7_monitor', x: 20, y: 2, w: 4, text: 'RADIO SD', col: '#1a0a2a', tcol: '#ff5fa2', glow: '#ff5fa2', show: () => E.flag('c7_broadcast') },
      { p: 'c7_supplies', x: 34, y: 4 },
      { p: 'c7_supplies', x: 37, y: 4 },
      { p: 'c7_supplies', x: 34, y: 7 },
      { p: 'stall', x: 22, y: 9, text: 'RAMEN', col: '#c03030' },
      { p: 'rug', x: 4, y: 14, w: 7, h: 5, col: '#e0a040', msg: '子どもたちの遊び場。折り紙と、クレヨンの絵が散らばっている。' },
      { p: 'partition', x: 33, y: 11, w: 3 },
      { p: 'bed', x: 37, y: 12, col: '#f0f0f4', msg: '救護所のベッド。消毒液のにおい。' },
      { p: 'bed', x: 39, y: 12, col: '#f0f0f4' },
      { p: 'shelf', x: 37, y: 17, w: 4, msg: '救急箱と毛布の棚。「ご自由にお使いください　ポン湯」のメモ。' },
      { p: 'c6_shutter', x: 40, y: 2, w: 2, h: 1, show: () => !E.flag('c7_gov_go') },
      { p: 'poster', x: 6, y: 2, col: '#4ae08a', msg: '「落ち着いて行動しましょう　シェルターの収容人数：500名」' },
      { p: 'poster', x: 30, y: 2, col: '#ffd25e', msg: '尋ね人の貼り紙がたくさん。「ミケを探しています」「ゲンさん、無事なら連絡を」……。' },
      { p: 'trash', x: 42, y: 8 },
      { p: 'vending', x: 1, y: 8, col: '#4ae08a' },
    ],
    lights: [
      { x: 10, y: 7, r: 70, col: '#fff0d0', a: 0.4 },
      { x: 30, y: 8, r: 70, col: '#fff0d0', a: 0.4 },
      { x: 8, y: 16, r: 50, col: '#ffd890', a: 0.35 },
      { x: 23, y: 10, r: 30, col: '#ff8040', a: 0.6, flicker: true },
      { x: 38, y: 14, r: 40, col: '#e0f0ff', a: 0.4 },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 床の番号線（避難区画）
      for (let x = 6 * S; x < 17 * S; x += 2 * S) r(c, x, 12 * S + 6, 12, 2, 'rgba(255,210,94,0.5)');
      G.pixText(c, 'A', 5 * S, 3 * S + 4, 'rgba(255,255,255,0.4)', 2);
      G.pixText(c, 'B', 25 * S, 14 * S + 4, 'rgba(255,255,255,0.4)', 2);
    },
    warps: [
      { x: 3, y: 23, w: 2, h: 1, to: 'minato', tx: 19, ty: 12, dir: 'down', se: 'step' },
      { x: 40, y: 2, w: 2, h: 1, to: 'c7_govtower', tx: 20, ty: 41, dir: 'up', se: 'door', cond: () => E.flag('c7_gov_go') },
    ],
  }));

  // ---------------------------------------------------------------
  //  c7_govtower — 総督府タワー（40×44）
  //   入口 (19..20,43) ← シェルターの連絡通路（到着 (20,41)）
  //   ロビー y33..42 ／ 警備フロア y14..30（ステルス）／ 総督執務室 y3..11
  // ---------------------------------------------------------------
  const GT = W2.grid(40, 44, 'w');
  // 執務室
  GT.fill(8, 3, 24, 9, 'r');
  GT.fill(19, 12, 2, 2, 'k');
  // 警備フロア（迷路）
  GT.fill(3, 14, 34, 17, 'l');
  // 内壁（仕切り）
  GT.fill(3, 18, 12, 1, 'w').fill(18, 18, 6, 1, 'w').fill(27, 18, 10, 1, 'w');
  GT.fill(7, 22, 10, 1, 'w').fill(20, 22, 13, 1, 'w');
  GT.fill(3, 26, 9, 1, 'w').fill(15, 26, 12, 1, 'w').fill(30, 26, 7, 1, 'w');
  GT.fill(17, 14, 1, 4, 'w').fill(24, 22, 1, 4, 'w').fill(12, 27, 1, 2, 'w');
  // ロビー
  GT.fill(19, 31, 2, 2, 'k');
  GT.fill(4, 33, 32, 10, 'k');
  GT.fill(19, 43, 2, 1, 'k');
  // 小物
  GT.put(3, 14, 'XX').put(35, 14, 'XX').put(3, 30, 'X').put(36, 30, 'X');
  GT.put(14, 15, 'X').put(29, 20, 'X').put(9, 24, 'X').put(32, 28, 'X');
  GT.put(4, 33, 'P').put(35, 33, 'P').put(4, 42, 'P').put(35, 42, 'P');
  GT.set(6, 40, 'Z');
  GT.put(8, 3, 'P').put(31, 3, 'P');
  G.defMap('c7_govtower', G.W1.flatChecks({
    name: '総督府タワー',
    area: 'コア・シャフト行政区画',
    bgm: () => (E.flag('c7_kazami_done') ? 'tension' : 'chase'),
    light: '#6a5a8a',
    lightAlpha: 1,
    floor: 'l',
    pal: { wall: '#c8c8d8', wallTop: '#1a1830', lino: '#9a9cac', checkA: '#d8d8e0', checkB: '#a8a8b8', carpet: '#7a2a3a', baseboard: '#3a3a4a' },
    rows: GT.rows(),
    objects: [
      { p: 'c7_govdesk', x: 18, y: 5 },
      { p: 'wallwindow', x: 10, y: 2, w: 6, night: true },
      { p: 'wallwindow', x: 24, y: 2, w: 6, night: true },
      { p: 'shelf', x: 9, y: 3, w: 3, col: '#4a3a2a', msg: '書棚。「中立憲章」「コロニー防衛白書」……奥に、ぬいぐるみがひとつ。ユイの字で「おとうさんへ」。' },
      { p: 'shelf', x: 28, y: 3, w: 3, col: '#4a3a2a', msg: '書棚。家族写真が伏せて置いてある。' },
      { p: 'rug', x: 15, y: 7, w: 10, h: 3, col: '#c0a040' },
      { p: 'counter', x: 15, y: 35, w: 10, col: '#3a3a48', top: '#c8c8d8', msg: '受付カウンター。無人。「本日のマザー稼働率：100%」の表示が、赤く点滅している。' },
      { p: 'c7_monitor', x: 16, y: 32, w: 8, text: 'MOTHER', col: '#200810', glow: '#ff3050' },
      { p: 'statue', x: 8, y: 37, msg: '開拓者の像。台座に「中立は、弱さではない」。' },
      { p: 'statue', x: 30, y: 37, msg: '開拓者の像。台座に「空は、みんなのもの」。' },
      { p: 'bench', x: 9, y: 40 },
      { p: 'bench', x: 29, y: 40 },
      { p: 'partition', x: 5, y: 20, w: 3 },
      { p: 'partition', x: 26, y: 15, w: 3 },
      { p: 'partition', x: 28, y: 28, w: 3 },
      { p: 'desk', x: 20, y: 16, book: true },
      { p: 'desk', x: 22, y: 16 },
      { p: 'desk', x: 7, y: 28 },
      { p: 'desk', x: 15, y: 20, book: true },
      { p: 'terminal', x: 33, y: 23, col: '#ff3050', msg: '警備端末。「警備システム：マザー直結モード」……もう人間の命令は受け付けないらしい。' },
    ],
    lights: [
      { x: 20, y: 6, r: 70, col: '#ffd890', a: 0.45 },
      { x: 20, y: 34, r: 60, col: '#ff3050', a: 0.4, flicker: true },
      { x: 20, y: 38, r: 80, col: '#e0e0ff', a: 0.3 },
      ...[6, 14, 22, 30].map((x) => ({ x, y: 16, r: 30, col: '#ff3050', a: 0.4, blink: x % 2 === 0 })),
      ...[6, 14, 22, 30].map((x) => ({ x, y: 24, r: 30, col: '#ff3050', a: 0.35 })),
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 警備フロアの床の赤いライン
      for (let x = 3 * S; x < 37 * S; x += 6) r(c, x, 30 * S + 12, 3, 2, 'rgba(255,48,80,0.4)');
    },
    onSpotted: async () => {
      if (G.C7 && G.C7.spotted) await G.C7.spotted();
    },
    warps: [{ x: 19, y: 43, w: 2, h: 1, to: 'c7_shelter', tx: 40, ty: 4, dir: 'down', se: 'door' }],
  }));

  // ---------------------------------------------------------------
  //  c7_port — 宇宙港・第7ドック（46×32、戦闘と発進）
  //   入口 (22..23,31) → scrapbay (53,46)
  //   宇宙側の隔壁 x15..30,y1（c7_launch で開く）
  //   戦闘：プレイヤー (22,24)、敵は y6..14
  // ---------------------------------------------------------------
  const PT = W2.grid(46, 32, 'W');
  PT.fill(2, 3, 42, 27, 'h');
  PT.fill(22, 30, 2, 2, 'x');
  PT.fill(2, 3, 42, 2, 'x');
  PT.fill(14, 5, 18, 1, 'g');
  G.defMap('c7_port', {
    name: '宇宙港・第7ドック',
    area: 'スペースポート7',
    bgm: 'tension',
    light: '#7a7aa8',
    lightAlpha: 1,
    floor: 'h',
    noParty: false,
    pal: { bigwall: '#3a3c4c' },
    rows: PT.rows(),
    objects: [
      { p: 'c7_bayDoor', x: 15, y: 2, w: 16, show: () => !E.flag('c7_launch') },
      { p: 'c7_bayDoor', x: 15, y: 2, w: 16, open: true, show: () => E.flag('c7_launch') },
      { p: 'c7_catapult', x: 18, y: 6, h: 10 },
      { p: 'c7_catapult', x: 26, y: 6, h: 10 },
      { p: 'container', x: 3, y: 6, col: '#5a5a6a', text: 'PORT', stack: 2 },
      { p: 'container', x: 3, y: 22, col: '#3a6ab0', text: 'C7-00', stack: 1 },
      { p: 'container', x: 40, y: 6, col: '#c04a3a', text: 'FUEL', stack: 1 },
      { p: 'tank', x: 41, y: 22, text: 'H2', col: '#c8d8c8' },
      { p: 'tank', x: 41, y: 25, text: 'O2', col: '#c8ccd8' },
      { p: 'crane', x: 9, y: 4 },
      { p: 'crane', x: 35, y: 4 },
      { p: 'hangar', x: 6, y: 27 },
      { p: 'hangar', x: 37, y: 27 },
      { p: 'barrel', x: 3, y: 27, hazard: true },
      { p: 'barrel', x: 43, y: 19, hazard: true },
    ],
    lights: [
      { x: 23, y: 15, r: 140, col: '#c8d8ff', a: 0.35 },
      ...[4, 12, 34, 42].map((x) => ({ x, y: 4, r: 40, col: '#ffd25e', a: 0.6, blink: true })),
      ...[4, 42].map((x) => ({ x, y: 16, r: 50, col: '#e0e8ff', a: 0.5 })),
      { x: 23, y: 29, r: 40, col: '#ff3050', a: 0.6, flicker: true },
    ],
    decorate(c, m) {
      // 床のガイドライン
      for (let y = 6 * S; y < 29 * S; y += 10) {
        r(c, 10 * S, y, 2, 5, 'rgba(255,210,94,0.4)');
        r(c, 35 * S, y, 2, 5, 'rgba(255,210,94,0.4)');
      }
      G.pixText(c, 'DOCK 7', 23 * S - G.pixTextW('DOCK 7', 3) / 2, 19 * S, 'rgba(255,255,255,0.18)', 3);
      for (let a = 0; a < 220; a++) px(c, Math.round(23 * S + Math.cos(a / 35) * 90), Math.round(20 * S + Math.sin(a / 35) * 50), 'rgba(255,210,94,0.3)');
    },
    warps: [{ x: 22, y: 31, w: 2, h: 1, to: 'scrapbay', tx: 53, ty: 46, dir: 'down', se: 'door' }],
  });
})();
