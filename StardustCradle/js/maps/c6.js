// =============================================================
//  maps/c6.js — 第6章「ミラージュ」専用マップ
//   c6_sim     : AFシミュレーターの仮想空間（ゲーセン〈ギャラクシー〉のレジェンド・モード）
//   c6_yard    : 旧第2研究所・外構（夜。ノクターンとの決闘場）
//   c6_ruins1  : 旧第2研究所 1F（停電した廃墟・ブレーカー3つ）
//   c6_ruins2  : 旧第2研究所 B1（プロジェクト・エコーの旧実験棟・ジンの部屋）
//  イベントは story/ch6.js（G.C6.* のフックを呼ぶ）
// =============================================================
(function () {
  const C6 = (G.C6 = G.C6 || {});
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const W2 = G.W2;

  // ---------------------------------------------------------------
  //  このファイル専用の小物（G.PROPS に c6_ 接頭辞で追加）
  // ---------------------------------------------------------------
  // 崩れた天井・コンクリ片＋鉄筋（2×1）
  G.PROPS.c6_rubble = function (o) {
    const w = o.w || 2;
    const cv = mk(w * S, 26);
    const c = cv.ctx;
    const rnd = G.srand((o.seed || 3) * 77);
    G.ellipse(c, (w * S) / 2, 22, w * 8 - 1, 3, 'rgba(20,10,40,0.32)');
    for (let i = 0; i < 9 * w; i++) {
      const x = 1 + Math.floor(rnd() * (w * S - 9)),
        y = 6 + Math.floor(rnd() * 12);
      const ww = 4 + Math.floor(rnd() * 7),
        hh = 3 + Math.floor(rnd() * 4);
      const col = ['#8a8690', '#a4a0a8', '#6e6a76', '#b4b0b8', '#7a7480'][Math.floor(rnd() * 5)];
      r(c, x, y, ww, hh, col);
      r(c, x, y, ww, 1, G.shade(col, 0.25));
      r(c, x, y + hh - 1, ww, 1, G.shade(col, -0.3));
    }
    for (let i = 0; i < w + 1; i++) {
      const x = 3 + Math.floor(rnd() * (w * S - 6));
      G.line(c, x, 2 + Math.floor(rnd() * 4), x + Math.floor(rnd() * 9) - 4, 16, '#a0603a');
    }
    return { w, h: 1, img: cv, ox: 0, oy: -8, solid: o.solid === false ? false : true };
  };
  // 破れたフェンスの門（グリーン・ブロック南端）
  G.PROPS.c6_gate = function () {
    const cv = mk(48, 34);
    const c = cv.ctx;
    // 支柱
    r(c, 1, 2, 3, 30, '#6a6e7e');
    r(c, 44, 2, 3, 30, '#6a6e7e');
    r(c, 1, 2, 1, 30, '#9aa0b0');
    // 開いたフェンス扉（斜め）
    for (let i = 0; i < 8; i++) G.line(c, 4 + i * 2, 6 + i, 4 + i * 2, 28 + i * 0.4, '#8a90a0');
    G.line(c, 4, 6, 18, 13, '#9aa0b0');
    G.line(c, 4, 28, 18, 31, '#9aa0b0');
    for (let i = 0; i < 6; i++) G.line(c, 44 - i * 2, 8 + i, 44 - i * 2, 28, '#7a8090');
    // 立入禁止の札
    r(c, 18, 4, 14, 9, '#ffd25e');
    r(c, 18, 4, 14, 1, '#fff0a0');
    G.pixText(c, 'KEEP', 19, 6, '#2a2a30');
    r(c, 30, 12, 6, 2, '#ffd25e');
    // 規制テープ（ちぎれている）
    for (let x = 4; x < 20; x += 4) r(c, x, 18 + (x % 8 ? 1 : 0), 3, 2, x % 8 ? '#ffd25e' : '#2a2a30');
    for (let x = 30; x < 44; x += 4) r(c, x, 20 + (x % 8 ? 0 : 1), 3, 2, x % 8 ? '#2a2a30' : '#ffd25e');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -18, solid: [[0, 0, 1, 1], [2, 0, 1, 1]] };
  };
  // 防火シャッター（w×h マス・停電中は閉じている）
  G.PROPS.c6_shutter = function (o) {
    const w = o.w || 1,
      h = o.h || 1;
    const cv = mk(w * S, h * S + 10);
    const c = cv.ctx;
    r(c, 0, 0, w * S, h * S + 10, '#4a4a5a');
    for (let y = 2; y < h * S + 8; y += 4) {
      r(c, 1, y, w * S - 2, 3, '#7a7e8e');
      r(c, 1, y, w * S - 2, 1, '#9aa0b0');
    }
    r(c, 0, 0, 2, h * S + 10, '#2a2a36');
    r(c, w * S - 2, 0, 2, h * S + 10, '#2a2a36');
    for (let x = 2; x < w * S - 4; x += 8) r(c, x, h * S + 4, 4, 3, '#ffd25e');
    return { w, h, img: cv, ox: 0, oy: -10, solid: true, lights: [{ x: (w * S) / 2, y: -4, r: 14, col: '#ff3050', a: 0.6, blink: true }] };
  };
  // 廃墟になった建物（bldg を描いてから、窓明かりを消してひび・板・ツタを重ねる）
  G.PROPS.c6_ruinbldg = function (o) {
    const d = G.PROPS.bldg(Object.assign({}, o));
    const cv = mk(d.img.width, d.img.height);
    const c = cv.ctx;
    c.drawImage(d.img, 0, 0);
    const W = d.img.width,
      H = d.img.height;
    const rnd = G.srand((o.seed || 7) * 131);
    // 全体をくすませる
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(24,20,44,0.42)';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    // ひび割れ
    for (let i = 0; i < 18; i++) {
      let x = Math.floor(rnd() * W),
        y = Math.floor(H * 0.35 + rnd() * H * 0.55);
      for (let k = 0; k < 5; k++) {
        const nx = x + Math.floor(rnd() * 9) - 4,
          ny = y + 3 + Math.floor(rnd() * 4);
        G.line(c, x, y, nx, ny, 'rgba(16,12,24,0.7)');
        x = nx;
        y = ny;
      }
    }
    // 板でふさがれた窓・割れた窓
    for (let i = 0; i < 14; i++) {
      const x = 2 + Math.floor(rnd() * (W - 14)),
        y = Math.floor(H * 0.4 + rnd() * H * 0.45);
      if (rnd() < 0.5) {
        r(c, x, y, 12, 3, '#6a5040');
        r(c, x, y, 12, 1, '#8a6a50');
      } else r(c, x + 2, y, 6, 6, '#14101e');
    }
    // ツタ
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rnd() * W);
      const len = 6 + Math.floor(rnd() * 30);
      for (let k = 0; k < len; k++) px(c, x + Math.round(Math.sin(k * 0.6) * 2), H - 4 - k, k % 3 ? '#3a6a3a' : '#5a9a50');
    }
    return Object.assign({}, d, { img: cv, lights: [] });
  };
  // 配電盤（ブレーカー）。on で緑ランプ
  G.PROPS.c6_breaker = function (o) {
    const cv = mk(16, 26);
    const c = cv.ctx;
    r(c, 2, 22, 12, 3, 'rgba(20,10,40,0.3)');
    r(c, 2, 2, 12, 21, '#5a6070');
    r(c, 3, 3, 10, 19, '#7a8090');
    r(c, 3, 3, 10, 1, '#a0a6b6');
    r(c, 5, 6, 6, 8, '#2a2a36');
    r(c, 7, o.on ? 7 : 10, 2, 3, o.on ? '#7dff9a' : '#c0c4d0');
    r(c, 5, 16, 2, 2, o.on ? '#7dff9a' : '#ff3050');
    r(c, 9, 16, 2, 2, '#ffd25e');
    G.pixText(c, 'B', 7, 18, '#1a1a24');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -10, solid: true, lights: [{ x: 6, y: 6, r: 12, col: o.on ? '#7dff9a' : '#ff3050', a: 0.8, flicker: !o.on }] };
  };
  // エコーの壁（ニコにしか見えない光の膜。共鳴すると消える）
  G.PROPS.c6_echowall = function (o) {
    const h = o.h || 3;
    const cv = mk(16, h * S + 10);
    const c = cv.ctx;
    for (let y = 0; y < h * S + 10; y++) {
      const a = 0.25 + 0.2 * Math.sin(y * 0.4);
      r(c, 3, y, 10, 1, `rgba(191,248,255,${a.toFixed(2)})`);
      if (y % 6 === 0) r(c, 5 + (y % 4), y, 3, 1, 'rgba(255,192,224,0.7)');
    }
    r(c, 7, 0, 2, h * S + 10, 'rgba(255,255,255,0.5)');
    return { w: 1, h, img: cv, ox: 0, oy: -8, solid: true, lights: [{ x: 8, y: (h * S) / 2, r: 36, col: '#bff8ff', a: 0.7, flicker: true }] };
  };
  // 倒れたAFの残骸（3×2）
  G.PROPS.c6_wreck = function (o) {
    const cv = mk(48, 36);
    const c = cv.ctx;
    const col = o.col || '#5a6070';
    G.ellipse(c, 24, 30, 23, 5, 'rgba(20,10,40,0.35)');
    // 胴体
    r(c, 10, 12, 22, 16, col);
    r(c, 10, 12, 22, 2, G.shade(col, 0.25));
    r(c, 14, 16, 8, 6, '#1a1a24');
    px(c, 16, 18, '#ff3050');
    // 頭（転がっている）
    G.ellipse(c, 38, 22, 6, 5, G.shade(col, 0.1));
    r(c, 35, 21, 6, 2, '#1a1a24');
    // 腕・脚
    r(c, 2, 20, 10, 5, G.shade(col, -0.15));
    r(c, 30, 26, 14, 4, G.shade(col, -0.2));
    // ツタ
    for (let i = 0; i < 14; i++) px(c, 10 + ((i * 7) % 24), 12 + ((i * 5) % 14), i % 2 ? '#4a8a4a' : '#6aa860');
    // 星のマーキング（かすれ）
    px(c, 26, 15, '#c0a040');
    px(c, 25, 16, '#c0a040');
    px(c, 27, 16, '#c0a040');
    px(c, 26, 17, '#c0a040');
    return { w: 3, h: 2, img: cv, ox: 0, oy: -4, solid: true };
  };
  // 古い机（ジンの机）
  G.PROPS.c6_desk = function () {
    const cv = mk(32, 26);
    const c = cv.ctx;
    r(c, 1, 22, 30, 3, 'rgba(20,10,40,0.3)');
    r(c, 1, 8, 30, 14, '#6a4a34');
    r(c, 1, 8, 30, 3, '#8a6a4a');
    r(c, 3, 13, 10, 7, '#5a3a28');
    r(c, 7, 16, 2, 1, '#c0a040');
    // 書類・マグカップ・写真立て
    r(c, 16, 4, 9, 6, '#e8e4d8');
    r(c, 17, 5, 7, 1, '#9a9488');
    r(c, 17, 7, 5, 1, '#9a9488');
    r(c, 4, 4, 4, 5, '#c0c4d0');
    r(c, 26, 2, 4, 7, '#a07a4a');
    r(c, 27, 3, 2, 4, '#7ab0e0');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -8, solid: true };
  };

  // ---------------------------------------------------------------
  //  c6_sim — シミュレーターの仮想空間（32×20、戦闘専用）
  // ---------------------------------------------------------------
  const SIM = W2.grid(32, 20, 'W');
  SIM.fill(2, 3, 28, 15, 'g');
  G.defMap('c6_sim', {
    name: 'SIMULATION',
    area: 'レジェンド・モード',
    bgm: 'mech',
    light: '#5a64b8',
    lightAlpha: 1,
    ambient: 'echo',
    floor: 'g',
    noParty: true,
    bg: '#04061a',
    pal: { metal: '#1a2448', bigwall: '#0c1430' },
    rows: SIM.rows(),
    lights: [
      { x: 16, y: 10, r: 120, col: '#4ef0ff', a: 0.35 },
      ...[3, 9, 15, 21, 27].map((x) => ({ x, y: 3, r: 30, col: '#4ef0ff', a: 0.6, flicker: true })),
      ...[3, 9, 15, 21, 27].map((x) => ({ x, y: 17, r: 30, col: '#ff5fa2', a: 0.5, flicker: true })),
    ],
    decorate(c, m) {
      // 仮想空間のワイヤーフレーム
      for (let x = 2 * S; x <= 30 * S; x += S) r(c, x, 3 * S, 1, 15 * S, 'rgba(78,240,255,0.22)');
      for (let y = 3 * S; y <= 18 * S; y += S) r(c, 2 * S, y, 28 * S, 1, 'rgba(78,240,255,0.22)');
      // 外周（データの霧）
      r(c, 0, 0, 32 * S, 3 * S, '#060a24');
      r(c, 0, 18 * S, 32 * S, 2 * S, '#060a24');
      r(c, 0, 0, 2 * S, 20 * S, '#060a24');
      r(c, 30 * S, 0, 2 * S, 20 * S, '#060a24');
      for (let i = 0; i < 140; i++) {
        const x = Math.floor(G.hash(i, 3, 61) * 32 * S),
          y = Math.floor(G.hash(i, 4, 61) * 20 * S);
        if (x > 2 * S && x < 30 * S && y > 3 * S && y < 18 * S) continue;
        px(c, x, y, G.hash(i, 5, 61) < 0.5 ? '#4ef0ff' : '#2a4a8a');
      }
      G.pixText(c, 'LEGEND MODE', 16 * S - G.pixTextW('LEGEND MODE', 2) / 2, S + 6, '#4ef0ff', 2);
      G.pixText(c, 'GHOST: J.H', 16 * S - G.pixTextW('GHOST: J.H') / 2, 10 * S + 4, 'rgba(78,240,255,0.35)');
    },
  });

  // ---------------------------------------------------------------
  //  c6_yard — 旧第2研究所・外構（48×32）
  //   西の入口 x=0,y=14..16 → green (39,31)
  //   研究所の扉 (24,10) → c6_ruins1 (19,21)
  //   決闘のエプロン x6..41,y12..27（プレイヤー (24,24)、ノクターン (24,15)）
  // ---------------------------------------------------------------
  const YD = W2.grid(48, 32, '"');
  YD.fill(0, 0, 48, 2, 'F').fill(0, 30, 48, 2, 'F').fill(0, 0, 1, 32, 'F').fill(47, 0, 1, 32, 'F');
  YD.fill(1, 2, 46, 10, '.');
  YD.fill(12, 2, 24, 10, 'c'); // 研究所の足元
  YD.fill(6, 12, 36, 16, 'c'); // エプロン
  YD.fill(0, 14, 8, 3, ':'); // 西の入口
  YD.fill(22, 11, 5, 1, 'c');
  // 草のパッチ（エプロンのひび割れから）
  [[8, 13], [9, 13], [40, 14], [40, 15], [7, 26], [8, 26], [33, 26], [12, 20], [38, 22], [20, 26], [30, 13]].forEach(([x, y]) => YD.set(x, y, '"'));
  YD.fill(1, 28, 46, 2, '"');
  YD.set(3, 12, 'Z');
  // 外灯（壊れかけ）
  [[10, 12], [38, 12], [10, 27], [38, 27]].forEach(([x, y]) => YD.set(x, y, 'L'));
  G.defMap('c6_yard', {
    name: '旧第2研究所',
    area: 'グリーン・ブロック南・立入禁止区域',
    bgm: () => (E.flag('c6_jin_freed') ? 'sad' : 'tension'),
    outdoor: true,
    time: 'night',
    ambient: 'leaves',
    floor: 'c',
    pal: { grass: '#4a7a4a', concrete: '#8a8a94' },
    rows: YD.rows(),
    objects: [
      { p: 'c6_ruinbldg', x: 13, y: 2, w: 22, h: 9, style: 'tower', wallH: 4, roof: 'flat', roofCol: '#4a4a58', wall: '#8a8e9c', sign: 'LAB-2', signCol: '#3a3a48', signText: '#c0c4d0', door: 11, doorType: 'glass', to: 'c6_ruins1', tx: 19, ty: 21, dir: 'up', seed: 13 },
      { p: 'c6_ruinbldg', x: 38, y: 3, w: 8, h: 6, style: 'garage', wallH: 2, roof: 'metal', roofCol: '#5a5a66', wall: '#7a7466', door: -1, sign: 'AF-2', signCol: '#5a3a2a', signText: '#ffd25e', seed: 4, msg: '旧AF格納庫。シャッターは錆びついて開かない。' },
      { p: 'c6_wreck', x: 2, y: 4, msg: '倒れたワークフレームの残骸。肩に、かすれた星のマークがある。' },
      { p: 'c6_wreck', x: 42, y: 22, col: '#4a5060', msg: 'ツタに覆われた試作機の残骸。コクピットはからっぽだ。' },
      { p: 'scrap', x: 6, y: 6, seed: 31 },
      { p: 'scrap', x: 40, y: 10, seed: 32 },
      { p: 'container', x: 1, y: 22, col: '#5a6a7a', text: 'LAB', stack: 1 },
      { p: 'container', x: 42, y: 17, col: '#7a4a3a', text: 'C2-9', stack: 1 },
      { p: 'barrel', x: 4, y: 20, hazard: true },
      { p: 'barrel', x: 5, y: 21 },
      { p: 'c6_rubble', x: 15, y: 11, w: 3, seed: 4 },
      { p: 'c6_rubble', x: 29, y: 11, w: 3, seed: 9 },
      { p: 'sign', x: 21, y: 11, text: 'LAB', col: '#3a3a48', msg: '「コロニー総合研究所 第2研究棟」……その上に、赤いスプレーで「閉鎖」と書かれている。' },
      { p: 'tree', x: 2, y: 9, kind: 'dark' },
      { p: 'tree', x: 44, y: 12, kind: 'dark' },
      { p: 'tree', x: 3, y: 27, kind: 'dark' },
      { p: 'tree', x: 44, y: 27, kind: 'dark' },
      { p: 'bush', x: 8, y: 9 },
      { p: 'bush', x: 37, y: 11 },
    ],
    lights: [
      { x: 24, y: 9, r: 30, col: '#ff3050', a: 0.5, flicker: true },
      { x: 10, y: 12, r: 46, col: '#ffe0b0', a: 0.6, flicker: true },
      { x: 38, y: 12, r: 46, col: '#ffe0b0', a: 0.4, flicker: true },
      // 演習場の投光器（決闘の舞台）
      { x: 14, y: 16, r: 110, col: '#c8d0ff', a: 0.35 },
      { x: 34, y: 16, r: 110, col: '#c8d0ff', a: 0.35 },
      { x: 24, y: 24, r: 110, col: '#c8d0ff', a: 0.3 },
    ],
    decorate(c, m) {
      // ひび割れ・焦げ跡・白線
      for (let i = 0; i < 70; i++) {
        const x = 6 * S + Math.floor(G.hash(i, 7, 21) * 36 * S),
          y = 12 * S + Math.floor(G.hash(i, 8, 21) * 16 * S);
        const k = G.hash(i, 9, 21);
        if (k < 0.5) {
          G.line(c, x, y, x + 6 + Math.floor(k * 10), y + 3, 'rgba(40,36,48,0.45)');
          G.line(c, x + 6, y + 3, x + 9, y + 8, 'rgba(40,36,48,0.35)');
        } else if (k < 0.65) G.ellipse(c, x, y, 10, 4, 'rgba(30,20,20,0.3)');
        else if (k < 0.8) px(c, x, y, '#4a7a4a');
      }
      // 演習場の白線（消えかけ）
      r(c, 8 * S, 12 * S + 4, 32 * S, 2, 'rgba(240,240,240,0.25)');
      r(c, 8 * S, 27 * S + 10, 32 * S, 2, 'rgba(240,240,240,0.25)');
      for (let a = 0; a < 160; a++) px(c, Math.round(24 * S + 8 + Math.cos(a / 25.4) * 70), Math.round(20 * S + Math.sin(a / 25.4) * 40), 'rgba(240,240,240,0.22)');
    },
    warps: [{ x: 0, y: 14, w: 1, h: 3, to: 'green', tx: 39, ty: 31, dir: 'up' }],
  });

  // ---------------------------------------------------------------
  //  c6_ruins1 — 旧第2研究所 1F（40×24・暗い）
  //   出口 (19..20,23) → c6_yard (24,11)
  //   廊下 y8..10。西棟の防火シャッター (6,7)（ブレーカー3つで開く）→ 西棟 x2..11,y2..6、階段 (3,3) → c6_ruins2
  //   ブレーカー：サーバー室 (3,13)、東オフィス (36,13)、北倉庫 (25,3)
  // ---------------------------------------------------------------
  const R1 = W2.grid(40, 24, 'w');
  R1.fill(2, 8, 36, 3, 'l'); // 廊下
  R1.fill(15, 11, 10, 11, 'l'); // ロビー
  R1.fill(19, 22, 2, 2, 'l'); // 玄関
  R1.fill(2, 13, 10, 8, 'm'); // サーバー室
  R1.fill(6, 11, 2, 2, 'm');
  R1.fill(28, 13, 10, 8, 'f'); // 東オフィス
  R1.fill(31, 11, 2, 2, 'l');
  R1.fill(17, 2, 10, 5, 'm'); // 北倉庫
  R1.fill(21, 7, 2, 1, 'l');
  R1.fill(2, 2, 10, 5, 'l'); // 西棟
  R1.fill(6, 7, 1, 1, 'l');
  R1.set(3, 2, 'l');
  // 小物
  R1.put(28, 13, 'dD?dD??dD').put(28, 16, '???????').put(33, 18, 'E');
  R1.put(9, 14, 'X').put(9, 16, 'X').put(9, 18, 'X').put(2, 20, 'XX');
  R1.put(17, 2, 'CC').put(17, 3, 'C').put(26, 5, 'Q');
  R1.set(16, 20, 'Z');
  R1.put(15, 11, 'P').put(24, 11, 'P');
  R1.put(9, 2, 'ii').put(2, 6, 'E');
  G.defMap('c6_ruins1', G.W1.flatChecks({
    name: '旧第2研究所 1F',
    area: '停電中',
    bgm: 'dungeon',
    light: '#34304e',
    lightAlpha: 1,
    ambient: 'dust',
    floor: 'l',
    pal: { wall: '#9a98a8', wallTop: '#1e1a2c', lino: '#7a7a88', metal: '#5a5e70', wood: '#6a5040', baseboard: '#3a3a48' },
    rows: R1.rows(),
    objects: [
      { p: 'counter', x: 17, y: 13, w: 6, col: '#4a4a58', top: '#8a8a98', msg: '受付カウンター。来客名簿が開いたまま。最後の記入は5年前の日付だ。' },
      { p: 'c6_rubble', x: 15, y: 16, w: 2, seed: 2 },
      { p: 'c6_rubble', x: 23, y: 18, w: 2, seed: 5 },
      { p: 'c6_rubble', x: 30, y: 9, w: 2, seed: 7 },
      { p: 'c6_rubble', x: 6, y: 10, w: 1, seed: 8, solid: false },
      { p: 'plant', x: 21, y: 20 },
      { p: 'poster', x: 18, y: 11, col: '#4ef0ff', msg: '色あせたポスター。「明日の空を、科学の力で。――コロニー総合研究所」' },
      { p: 'poster', x: 33, y: 7, col: '#ff5fa2', msg: '「廊下を走るな」の貼り紙。……どこかで聞いたセリフだ。' },
      { p: 'c6_shutter', id: 'c6_shutter', x: 6, y: 7, show: () => !E.flag('c6_power') },
      { p: 'c6_breaker', x: 3, y: 13, show: () => !E.flag('c6_brk1') },
      { p: 'c6_breaker', x: 3, y: 13, on: true, show: () => E.flag('c6_brk1') },
      { p: 'c6_breaker', x: 36, y: 13, show: () => !E.flag('c6_brk2') },
      { p: 'c6_breaker', x: 36, y: 13, on: true, show: () => E.flag('c6_brk2') },
      { p: 'c6_breaker', x: 25, y: 3, show: () => !E.flag('c6_brk3') },
      { p: 'c6_breaker', x: 25, y: 3, on: true, show: () => E.flag('c6_brk3') },
      { p: 'stairs', x: 3, y: 3 },
      { p: 'locker', x: 4, y: 2, w: 3, msg: 'ロッカー。白衣が一着だけ残っている。名札は破り取られていた。' },
      { p: 'shelf', x: 19, y: 2, w: 3, kind: 'parts', msg: '備品棚。「ECHO」と書かれた箱がいくつも積まれている。中身は空だ。' },
    ],
    lights: [
      { x: 19, y: 12, r: 26, col: '#ff3050', a: 0.6, blink: true },
      { x: 6, y: 8, r: 22, col: '#ff3050', a: 0.5, flicker: true },
      { x: 30, y: 9, r: 22, col: '#ff3050', a: 0.5, flicker: true },
      { x: 33, y: 18, r: 22, col: '#7dff9a', a: 0.5 },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 床のひび・水たまり
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(G.hash(i, 1, 33) * 40 * S),
          y = Math.floor(G.hash(i, 2, 33) * 24 * S);
        const t = m.cell(x >> 4, y >> 4);
        if (!t || G.TILES[t].solid) continue;
        const k = G.hash(i, 3, 33);
        if (k < 0.5) G.line(c, x, y, x + 7, y + 3, 'rgba(30,26,40,0.4)');
        else if (k < 0.7) G.ellipse(c, x, y, 7, 2, 'rgba(90,110,160,0.35)');
        else px(c, x, y, '#5a5a6a');
      }
    },
    checks: [],
    warps: [
      { x: 19, y: 23, w: 2, h: 1, to: 'c6_yard', tx: 24, ty: 12, dir: 'down', se: 'door' },
      { x: 3, y: 3, to: 'c6_ruins2', tx: 4, ty: 5, dir: 'down', se: 'step', cond: () => E.flag('c6_power') },
    ],
  }));

  // ---------------------------------------------------------------
  //  c6_ruins2 — 旧第2研究所 B1・エコー実験棟（44×28・さらに暗い）
  //   到着 (4,5)（階段 (4,3) → c6_ruins1 (3,4)）
  //   カプセル・ホール x10..32,y8..20／エコーの壁 x=34,y12..14
  //   ジンの部屋 x35..42,y8..20（机 (38,10)）
  // ---------------------------------------------------------------
  const R2 = W2.grid(44, 28, 'w');
  R2.fill(2, 3, 6, 5, 'm'); // 階段ホール
  R2.fill(4, 8, 2, 4, 'g'); // 通路
  R2.fill(2, 12, 8, 4, 'm'); // 前室
  R2.fill(10, 8, 24, 13, 'l'); // カプセル・ホール
  R2.fill(9, 13, 1, 2, 'g');
  R2.fill(34, 12, 1, 3, 'g'); // エコーの壁の通路
  R2.fill(35, 8, 8, 13, 'f'); // ジンの部屋
  R2.fill(14, 21, 4, 4, 'g'); // 南の観測室への通路
  R2.fill(10, 22, 14, 4, 'm'); // 南の観測室
  // カプセル列
  R2.put(12, 9, 'I?I?i?I?i?I?I?i?I').put(12, 18, 'i?I?I?i?I?I?i?I?i');
  R2.put(2, 15, 'E').put(7, 12, 'X').put(8, 12, 'X');
  R2.put(10, 25, 'XXX').put(20, 22, 'E').put(21, 22, 'E').put(23, 25, 'X');
  R2.set(2, 7, 'Z');
  G.defMap('c6_ruins2', G.W1.flatChecks({
    name: '旧第2研究所 B1',
    area: 'プロジェクト・エコー旧実験棟',
    bgm: 'dungeon',
    light: '#262240',
    lightAlpha: 1,
    ambient: 'echo',
    floor: 'm',
    pal: { wall: '#8a88a0', wallTop: '#14101e', lino: '#6a7088', metal: '#4a4e62', wood: '#5a4a3a', baseboard: '#2a2a38' },
    rows: R2.rows(),
    objects: [
      { p: 'stairs', x: 4, y: 3 },
      { p: 'c6_echowall', id: 'c6_echowall', x: 34, y: 12, h: 3, show: () => !E.flag('c6_wall_open') },
      { p: 'c6_desk', x: 38, y: 10 },
      { p: 'shelf', x: 36, y: 8, w: 2, col: '#5a4030', msg: '本棚。「AF制御理論」「ステラ感応の基礎」……それに、ボロボロの『機動騎兵ガンボール』第1巻。' },
      { p: 'shelf', x: 40, y: 8, w: 2, col: '#5a4030', msg: '設計図の束。どれにも、隅っこに小さく「H」のサインがある。' },
      { p: 'bed', x: 41, y: 14, col: '#4a5a7a', msg: '仮眠用の簡易ベッド。毛布が、たたまれたまま残っている。' },
      { p: 'poster', x: 39, y: 7, col: '#ffd25e', msg: '子どもの描いた絵が貼ってある。ロボットと、男の人と、小さな男の子。「とうさん」の文字。' },
      { p: 'rug', x: 36, y: 15, w: 4, h: 3, col: '#4a3a5a' },
      { p: 'c6_rubble', x: 26, y: 13, w: 2, seed: 11 },
      { p: 'c6_rubble', x: 12, y: 14, w: 2, seed: 12 },
      { p: 'c6_rubble', x: 3, y: 9, w: 1, seed: 13, solid: false },
      { p: 'terminal', x: 16, y: 22, col: '#bff8ff', msg: '観測端末。「被験体の同調率：記録なし」……データはほとんど消されている。' },
    ],
    lights: [
      ...[12, 16, 20, 24, 28].map((x) => ({ x, y: 10, r: 26, col: '#bff8ff', a: 0.55, flicker: true })),
      ...[14, 18, 22, 26].map((x) => ({ x, y: 18, r: 24, col: '#bff8ff', a: 0.45, flicker: true })),
      { x: 39, y: 11, r: 34, col: '#ffd890', a: 0.5 },
      { x: 4, y: 4, r: 24, col: '#ff3050', a: 0.5, blink: true },
      { x: 20, y: 23, r: 30, col: '#bff8ff', a: 0.4 },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 床を這うケーブル
      for (let i = 0; i < 6; i++) {
        let x = 10 * S + i * 64,
          y = 9 * S;
        for (let k = 0; k < 18; k++) {
          const nx = x + Math.round((G.hash(i, k, 7) - 0.5) * 10),
            ny = y + 10;
          G.line(c, x, y, nx, ny, 'rgba(20,16,30,0.6)');
          x = nx;
          y = ny;
          if (y > 20 * S) break;
        }
      }
      // ホール中央の円（共鳴装置の跡）
      for (let a = 0; a < 200; a++) px(c, Math.round(21 * S + 8 + Math.cos(a / 31.8) * 52), Math.round(14 * S + Math.sin(a / 31.8) * 30), 'rgba(191,248,255,0.35)');
    },
    warps: [{ x: 4, y: 3, to: 'c6_ruins1', tx: 3, ty: 4, dir: 'down', se: 'step' }],
  }));
})();
