// =============================================================
//  maps/scrapbay.js — スクラップ・ベイ・ドクのガレージ・廃材置き場
// =============================================================
(function () {
  const W2 = G.W2;
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;

  // ---------------------------------------------------------------
  //  カスタム小物
  // ---------------------------------------------------------------
  // 宇宙港の大ゲート（建物の正面に重ねる。open で開いた絵）
  P.w2_portgate = function (o) {
    const w = o.w || 8,
      W = w * S;
    const cv = mk(W, 76),
      c = cv.ctx;
    // 枠
    r(c, 0, 0, W, 76, '#3a3e4e');
    r(c, 3, 3, W - 6, 73, '#5a6070');
    r(c, 0, 0, W, 3, '#8a90a0');
    // 警戒色の縁
    for (let i = 0; i < W; i += 8) {
      r(c, i, 3, 4, 5, '#ffd25e');
      r(c, i + 4, 3, 4, 5, '#2a2a30');
    }
    if (o.open) {
      r(c, 6, 10, W - 12, 66, '#07051a');
      for (let i = 0; i < 30; i++) px(c, 8 + Math.floor(G.hash(i, 1, 2) * (W - 16)), 12 + Math.floor(G.hash(i, 2, 2) * 50), i % 4 ? '#6a7ad0' : '#ffffff');
      r(c, 6, 66, W - 12, 10, '#4a4e60');
      for (let i = 6; i < W - 6; i += 10) r(c, i, 70, 5, 2, '#4ef0ff');
    } else {
      // 2枚の扉
      for (const [x0, x1] of [[6, W / 2 - 1], [W / 2 + 1, W - 6]]) {
        r(c, x0, 10, x1 - x0, 66, '#7a8094');
        for (let y = 14; y < 74; y += 6) r(c, x0, y, x1 - x0, 1, '#6a7084');
        r(c, x0, 10, x1 - x0, 2, '#9aa0b4');
      }
      r(c, W / 2 - 1, 10, 2, 66, '#2a2a34');
      // 封鎖テープ
      G.line(c, 6, 30, W - 6, 50, '#ffd25e');
      G.line(c, 6, 31, W - 6, 51, '#ffd25e');
      G.line(c, 6, 50, W - 6, 30, '#ffd25e');
      G.line(c, 6, 51, W - 6, 31, '#ffd25e');
      r(c, W / 2 - 22, 36, 44, 9, '#c02030');
      G.pixText(c, 'SEALED', W / 2 - 11, 38, '#ffffff');
    }
    r(c, 10, 14, 6, 6, '#ff3050');
    r(c, W - 16, 14, 6, 6, '#ff3050');
    const col = o.open ? '#4ef0ff' : '#ff3050';
    return { w, h: 1, img: cv, ox: 0, oy: 16 - 76, solid: false, lights: [{ x: 13, y: 16 - 76 + 17, r: 22, col, a: 0.9, blink: !o.open }, { x: W - 13, y: 16 - 76 + 17, r: 22, col, a: 0.9, blink: !o.open }] };
  };
  // 作業台（万力・工具）
  P.w2_workbench = function (o) {
    const w = o.w || 3,
      W = w * S;
    const cv = mk(W, 30),
      c = cv.ctx;
    r(c, 1, 26, W - 1, 4, 'rgba(0,0,0,0.3)');
    r(c, 0, 10, W, 6, '#a07040');
    r(c, 0, 10, W, 1, '#c89060');
    r(c, 0, 16, W, 10, '#5a4030');
    r(c, 2, 16, 2, 10, '#3a2a20');
    r(c, W - 4, 16, 2, 10, '#3a2a20');
    // 工具
    r(c, 4, 6, 8, 4, '#5a6070');
    r(c, 6, 2, 4, 4, '#7a8090');
    G.line(c, 16, 9, 24, 6, '#c0c0d0');
    r(c, 26, 7, 5, 3, '#e04a4a');
    r(c, W - 12, 4, 8, 6, '#3a3a48');
    r(c, W - 11, 5, 6, 3, '#4ef0ff');
    // 背面の工具板
    r(c, 2, 0, W - 4, 2, '#6a5a4a');
    return { w, h: 1, img: cv, ox: 0, oy: -14, solid: true, lights: [{ x: W - 8, y: -7, r: 12, col: '#4ef0ff', a: 0.5, flicker: true }] };
  };
  // 天井クレーンのフック（飾り）
  P.w2_hook = function (o) {
    const cv = mk(16, 48),
      c = cv.ctx;
    r(c, 7, 0, 2, 34, '#5a5a6a');
    r(c, 4, 34, 8, 4, '#ffd25e');
    G.line(c, 8, 38, 11, 44, '#8a8a9a');
    G.line(c, 11, 44, 6, 45, '#8a8a9a');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -40, solid: false };
  };
  // 監視小屋（2×1）
  P.w2_booth = function () {
    const cv = mk(32, 44),
      c = cv.ctx;
    r(c, 1, 40, 31, 4, 'rgba(0,0,0,0.3)');
    r(c, 0, 4, 32, 8, '#3a6ab0');
    r(c, 0, 4, 32, 2, '#6a9ae0');
    r(c, 1, 12, 30, 30, '#d8dce4');
    r(c, 3, 15, 26, 10, '#6ab4e8');
    r(c, 15, 15, 1, 10, '#d8dce4');
    r(c, 1, 38, 30, 4, '#9aa0b0');
    r(c, 10, 28, 12, 4, '#ffd25e');
    G.pixText(c, 'PORT', 9, 28, '#2a2a3a');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -28, solid: true, lights: [{ x: 16, y: -8, r: 18, col: '#ffe8b0', a: 0.5, night: true }] };
  };

  // ---------------------------------------------------------------
  //  スクラップ・ベイ scrapbay（70×50）
  // ---------------------------------------------------------------
  const SB = W2.grid(70, 50, 's');
  SB.fill(0, 0, 70, 1, 'F').fill(0, 0, 1, 50, 'F').fill(69, 0, 1, 50, 'F').fill(0, 49, 70, 1, 'F');
  SB.fill(29, 0, 4, 45, '-'); // 南北の道
  SB.fill(1, 22, 68, 4, '-').fill(69, 22, 1, 4, '-'); // 東西の道（東端は廃材置き場へ）
  SB.fill(29, 45, 35, 3, '-'); // 宇宙港ゲート前
  SB.fill(28, 48, 37, 1, 'c');
  SB.fill(4, 11, 15, 4, 'c'); // ドクのガレージ前
  SB.fill(47, 14, 12, 3, 'c'); // エレベーター前
  SB.fill(33, 1, 3, 4, 'c');
  // 歩道の縁（区画の境の小物）
  SB.set(34, 2, 'Z').set(28, 1, 'L').set(33, 1, 'L').set(28, 21, 'L').set(33, 21, 'L').set(28, 26, 'L').set(33, 26, 'L').set(28, 44, 'L').set(64, 45, 'L').set(68, 21, 'L');
  // 散らかり（タイヤ・ドラム缶・木箱）
  const clutter = [
    [4, 11, 'G'], [5, 11, 'G'], [4, 12, 'G'], [17, 11, 'Q'], [18, 11, 'Q'], [18, 12, 'C'], [2, 3, 'G'], [2, 4, 'G'], [3, 3, 'Q'], [24, 2, 'C'], [25, 2, 'C'], [25, 3, 'C'], [26, 18, 'G'], [27, 18, 'Q'],
    [35, 13, 'Q'], [36, 13, 'Q'], [35, 14, 'C'], [46, 18, 'G'], [47, 18, 'G'], [60, 15, 'C'], [61, 15, 'C'], [62, 15, 'Q'], [66, 2, 'G'], [67, 2, 'G'], [67, 3, 'Q'], [42, 19, 'Q'],
    [35, 28, 'G'], [36, 28, 'G'], [43, 31, 'Q'], [44, 31, 'Q'], [56, 30, 'C'], [57, 30, 'C'], [66, 28, 'G'], [67, 28, 'G'], [67, 29, 'Q'], [34, 40, 'Q'], [35, 40, 'Q'], [40, 43, 'C'], [41, 43, 'C'], [66, 41, 'G'], [67, 41, 'Q'], [66, 47, 'C'], [67, 47, 'C'], [67, 46, 'Q'],
    [1, 26, 'Q'], [2, 26, 'Q'], [26, 26, 'G'], [27, 26, 'G'],
  ];
  clutter.forEach(([x, y, ch]) => SB.set(x, y, ch));

  // コンテナの迷路（南西）: 1=コンテナ
  const maze = ['110111', '101101', '011011', '110110', '101101', '111011', '011110'];
  const mazeObjs = [];
  const tags = ['C7-12', 'JUNK', 'AF-PARTS', 'C7-88', 'DOC', 'FRAGILE', 'C7-03', 'NO.9', 'SCRAP', 'C7-47', 'RECYCLE', 'C7-71'];
  const mcols = ['#c04a3a', '#3a6ab0', '#3a9a6a', '#d0902a', '#7a5aa0', '#4a8aa0', '#a05a3a'];
  maze.forEach((row, j) =>
    [...row].forEach((v, i) => {
      if (v !== '1') return;
      const x = 2 + i * 4,
        y = 27 + j * 3;
      mazeObjs.push({ p: 'container', x, y, col: mcols[(i * 3 + j * 5) % mcols.length], text: tags[(i + j * 6) % tags.length], stack: (i + j) % 3 === 0 ? 2 : 1, seed: i + j * 7 });
    })
  );
  // 迷路の中のすきま埋め
  [[5, 29, 'Q'], [13, 32, 'G'], [21, 35, 'C'], [9, 38, 'Q'], [17, 41, 'C'], [25, 44, 'G'], [1, 41, 'C'], [1, 42, 'C'], [25, 30, 'Q'], [13, 47, 'G'], [21, 47, 'Q']].forEach(([x, y, ch]) => SB.set(x, y, ch));

  G.mob('w2_foreman', '現場監督のダイモン', 301, { girl: false, old: false, kid: false, over: { outfit: 'jumpsuit', top: '#e08a30', bottom: '#4a4a5a', acc: ['helmet'], accCol: '#ffd25e', build: 'big', beard: '#3a2a20' } });
  G.mob('w2_craneop', 'クレーン乗りのミサキ', 302, { girl: true, old: false, kid: false, over: { outfit: 'jumpsuit', top: '#3a6ab0', bottom: '#3a6ab0', acc: ['goggles'], accCol: '#ffd25e', style: 'ponytail', hair: '#c86a3a' } });
  G.mob('w2_jii', 'ガラクタ拾いのテツジ', 303, { girl: false, old: true, over: { outfit: 'coat', top: '#6a5a4a', acc: ['cap'], accCol: '#5a4a3a', beard: '#d8d8e0' } });
  G.mob('w2_scav', 'くず鉄集めのリク', 304, { girl: false, old: false, kid: true, over: { outfit: 'tank', top: '#7a8a6a', bottom: '#4a4a40', bstyle: 'shorts', acc: ['bandana'], accCol: '#e04a4a' } });
  G.mob('w2_portguard', '宇宙港の警備員ノボル', 305, { girl: false, old: false, kid: false, over: { outfit: 'military', top: '#5a6a5a', top2: '#c0c8b0', bottom: '#3a4a3a', acc: ['cap'], accCol: '#3a4a3a' } });
  G.mob('w2_bouncer', 'エレベーター番のゴウ', 306, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#1a1a24', top2: '#ff5fa2', build: 'big', acc: ['sunglasses'], accCol: '#141418', style: 'buzz', hair: '#2a2a2a' } });
  G.mob('w2_driver', 'フォークリフト乗りのカズ', 307, { girl: false, old: false, kid: false, over: { outfit: 'jumpsuit', top: '#ffd25e', bottom: '#4a4a5a', acc: ['cap'], accCol: '#e04a4a' } });
  G.mob('w2_welder', '溶接工のアヤメ', 308, { girl: true, old: false, kid: false, over: { outfit: 'jumpsuit', top: '#5a5a6a', bottom: '#5a5a6a', acc: ['goggles'], accCol: '#3a3a48', style: 'bun', hair: '#2a2a3a' } });

  const scrapNight = () => G.state.chapter === 1 || G.state.chapter === 7;
  G.defMap('scrapbay', {
    name: 'スクラップ・ベイ',
    bgm: 'scrap',
    outdoor: true,
    ambient: 'dust',
    floor: 's',
    pal: { road: '#5a5660', concrete: '#9a98a0', bigwall: '#7a7e8e' },
    rows: SB.rows(),
    objects: [
      // ドクのガレージ
      { p: 'bldg', x: 6, y: 4, w: 10, h: 7, style: 'garage', wallH: 2, roof: 'metal', roofCol: '#8a7a6a', wall: '#a89a88', sign: "DOC'S GARAGE", signCol: '#c03a3a', signText: '#ffd25e', door: 5, doorType: 'shutter', to: 'doc_garage', tx: 12, ty: 14, dir: 'up', neon: true, seed: 5 },
      { p: 'sign', x: 16, y: 12, text: 'BUY/SELL', col: '#c03a3a', msg: '「ジャンク買います・売ります　修理なんでも　ドク」' },
      { p: 'scrap', x: 18, y: 5, seed: 1 },
      { p: 'scrap', x: 21, y: 8, seed: 2 },
      { p: 'crane', x: 20, y: 2 },
      { p: 'bldg', x: 20, y: 14, w: 5, h: 3, style: 'garage', roof: 'metal', roofCol: '#6a7a6a', wall: '#c8c4b0', sign: 'OFFICE', signCol: '#3a5a3a', door: 2, msg: '現場事務所。ホワイトボードに「本日の入荷：AFの腕×3、謎の箱×1」' },
      { p: 'forklift', x: 2, y: 17 },
      { p: 'barrel', x: 5, y: 17, hazard: true },
      { p: 'container', x: 9, y: 16, col: '#3a6ab0', text: 'DOC', stack: 1 },
      { p: 'tank', x: 14, y: 17, text: 'FUEL', col: '#d8b040' },
      // エレベーター（アンダーシェル行き）
      { p: 'bldg', x: 50, y: 8, w: 7, h: 6, style: 'factory', wallH: 2, roof: 'metal', roofCol: '#5a5a70', wall: '#6a6a80', sign: 'LIFT B7', signCol: '#140c20', signText: '#ff5fa2', neon: true, neonTube: '#ff5fa2', door: 3, doorType: 'shutter', to: 'shell_lobby', tx: 4, ty: 5, dir: 'down', antenna: true },
      { p: 'neonsign', x: 49, y: 13, text: 'DUEL', col: '#ff5fa2' },
      { p: 'neonsign', x: 57, y: 13, text: 'B7', col: '#4ef0ff' },
      { p: 'container', x: 37, y: 3, col: '#c04a3a', text: 'C7-21', stack: 2 },
      { p: 'container', x: 41, y: 3, col: '#3a9a6a', text: 'AF-PARTS', stack: 1 },
      { p: 'container', x: 37, y: 7, col: '#d0902a', text: 'JUNK', stack: 1 },
      { p: 'container', x: 41, y: 8, col: '#7a5aa0', text: 'C7-56', stack: 2 },
      { p: 'container', x: 61, y: 4, col: '#4a8aa0', text: 'C7-90', stack: 1 },
      { p: 'container', x: 61, y: 8, col: '#c04a3a', text: 'HEAVY', stack: 2 },
      { p: 'tank', x: 45, y: 4, text: 'O2', col: '#c8ccd8' },
      { p: 'tank', x: 45, y: 8, text: 'H2', col: '#c8d8c8' },
      { p: 'crane', x: 64, y: 12 },
      { p: 'scrap', x: 38, y: 16, seed: 3 },
      { p: 'scrap', x: 64, y: 17, seed: 4 },
      { p: 'forklift', x: 43, y: 14 },
      // 南東：廃材の山とクレーン
      { p: 'crane', x: 38, y: 30 },
      { p: 'crane', x: 59, y: 28 },
      { p: 'scrap', x: 40, y: 27, seed: 5 },
      { p: 'scrap', x: 46, y: 27, seed: 6 },
      { p: 'scrap', x: 49, y: 29, seed: 7 },
      { p: 'scrap', x: 52, y: 27, seed: 8 },
      { p: 'scrap', x: 63, y: 30, seed: 9 },
      { p: 'scrap', x: 36, y: 34, seed: 10 },
      { p: 'scrap', x: 39, y: 37, seed: 11 },
      { p: 'container', x: 64, y: 34, col: '#5a5a6a', text: 'PORT', stack: 2 },
      { p: 'container', x: 64, y: 38, col: '#3a6ab0', text: 'C7-00', stack: 1 },
      { p: 'forklift', x: 54, y: 31 },
      { p: 'pipe', x: 34, y: 43, w: 5, col: '#8a7a6a' },
      { p: 'w2_booth', x: 40, y: 41, msg: '宇宙港の監視小屋。「関係者以外立入禁止」……中では警備員が居眠りしている。' },
      // 宇宙港（閉鎖）
      { p: 'bldg', x: 44, y: 34, w: 20, h: 11, style: 'factory', roof: 'metal', roofCol: '#6a7088', wall: '#8a90a4', wallH: 4, sign: 'SPACEPORT 7', signCol: '#2a3a6a', signText: '#ffffff', signX: 3, door: -1, seed: 9 },
      { p: 'w2_portgate', x: 50, y: 44, w: 8, show: () => !E.flag('c8_port_open') },
      { p: 'w2_portgate', x: 50, y: 44, w: 8, open: true, show: () => E.flag('c8_port_open') },
      ...mazeObjs,
    ],
    decorate(c, m) {
      // 油じみ・ボルト・タイヤの跡
      for (let i = 0; i < 160; i++) {
        const x = Math.floor(G.hash(i, 11, 3) * 70 * 16),
          y = Math.floor(G.hash(i, 12, 3) * 50 * 16);
        if (m.cell(x >> 4, y >> 4) !== 's') continue;
        const k = G.hash(i, 13, 3);
        if (k < 0.3) G.ellipse(c, x, y, 5 + Math.floor(k * 20), 2 + Math.floor(k * 6), 'rgba(40,34,44,0.28)');
        else if (k < 0.65) {
          r(c, x, y, 3, 2, G.pick(['#8a92a6', '#a86a4a', '#c0a040', '#5a6070']));
          px(c, x, y, '#d0d4e0');
        } else if (k < 0.8) {
          G.line(c, x, y, x + 5, y + 2, '#7a7e8e');
        } else {
          for (let j = 0; j < 4; j++) px(c, x + j * 3, y + (j % 2), '#6a6474');
        }
      }
      // 道のタイヤ跡と白線
      for (let y = 0; y < 45 * 16; y += 12) r(c, 29 * 16 + 30, y, 4, 6, 'rgba(240,240,240,0.5)');
      for (let x = 16; x < 69 * 16; x += 12) r(c, x, 23 * 16 + 30, 6, 3, 'rgba(240,240,240,0.5)');
      r(c, 29 * 16, 0, 2, 45 * 16, 'rgba(255,210,94,0.35)');
      r(c, 33 * 16 - 2, 0, 2, 45 * 16, 'rgba(255,210,94,0.35)');
      // ゲート前の停止線と警戒色
      for (let x = 50 * 16; x < 58 * 16; x += 8) {
        r(c, x, 45 * 16 + 2, 4, 4, '#ffd25e');
        r(c, x + 4, 45 * 16 + 2, 4, 4, '#2a2a30');
      }
    },
    npcs: [
      {
        id: 'w2_foreman', char: 'w2_foreman', x: 26, y: 20, dir: 'down', move: 'still', show: () => W2.town() && !scrapNight(),
        talk: W2.lines('w2_foreman', {
          0: ['おう、坊主。ここはスクラップ・ベイ、コロニーのゴミが最後に流れ着く場所だ。', 'ゴミっつってもな、宝の山よ。軍の払い下げ、事故った船のパーツ……目利きしだいだ。'],
          2: '公安の連中が「入荷記録を見せろ」だとよ。記録？　そんな上品なもん、うちにはねえ。',
          3: 'ドクのとこの坊主か！　機体の改造用のジャンクなら、そこらじゅうに転がってる。拾っていいぞ。',
          4: '宇宙港からの荷が止まってる。……上の方で、何かあったらしい。',
          5: '夜間作業禁止令だとよ。ゴミは夜に溜まるってのに。',
          6: '妙な機体の残骸が流れてきた。黒く焼けた装甲……あんなの、見たことねえ。',
          8: '重機は全部、避難所の補強に回した。……ゴミ屋にだって、意地はある。',
          9: '宇宙港が開いたら、ここも忙しくなる。……本物の空から、ゴミが降ってくるのを待ってるぜ。',
        }),
      },
      {
        id: 'w2_craneop', char: 'w2_craneop', x: 39, y: 32, dir: 'up', move: 'still', show: () => W2.town() && !scrapNight(),
        talk: W2.lines('w2_craneop', {
          0: ['このクレーンの操縦、AFより難しいんだから。……まあ、AFには乗ったことないけど。', '上から見ると、スクラップ・ベイって星座みたいなんだよ。ガラクタの星座。'],
          1: '夜中に白い機体が飛んでくのを見たの。……夢じゃないよね？',
          3: 'あんたの機体、クレーンで吊ってあげようか？　……冗談。でもいつか、乗せてね。',
          5: 'クレーンの上から、公安の装甲車が並んでるのが見える。……いやな景色。',
          6: '空の向こうで、黒いものが光った。……あれ、なんだったんだろう。',
          8: 'クレーンで瓦礫をどけてる。……あたしにできる、精一杯。',
          9: '朝日に照らされたガラクタの山、意外ときれいなんだよ。見ていきな。',
        }),
      },
      {
        id: 'w2_jii', char: 'w2_jii', x: 35, y: 37, dir: 'left', move: 'still', show: W2.town,
        talk: async () => {
          if (await W2.rumor(3, 'w2_jii', '七不思議か……とっておきがあるぞ。閉ざされた宇宙港ゲートの向こうからな、夜になると歌が聞こえるんじゃ。女の子の声でな……。ゲートは10年、一度も開いとらんのに。')) return;
          await W2.lines('w2_jii', {
            0: ['ワシはテツジ。このベイで50年ガラクタを拾っとる。', '宇宙港のゲートはな、戦争が終わってからずっと閉まったままじゃ。……何を閉じ込めとるのかのう。'],
            1: 'ゆうべ、ゲートの向こうで何かが光った。……ワシはなんにも見とらんぞ。',
            2: '白い髪の子か……。宇宙港の方から、裸足で走ってきたのを見たような……。いや、年寄りの見間違いじゃ。',
            3: 'アリーナで勝ったそうじゃな。ドクの奴、うれしそうに自慢しとったぞ。',
            5: 'ゲートの前に、公安の見張りが増えた。……ますます怪しいのう。',
            6: 'ゲートの向こうの歌がな、最近は泣いとるように聞こえるんじゃ。',
            8: 'ゲートが開く時が来たんじゃな。……行ってこい。ワシの代わりに、外を見てきておくれ。',
            9: 'ゲートが開いて、10年ぶりの外の光じゃ。……長生きはするもんじゃのう。',
          })();
        },
      },
      {
        id: 'w2_scav', char: 'w2_scav', x: 22, y: 12, dir: 'left', move: 'wander', range: 3, show: () => W2.town() && G.state.time !== 'night',
        talk: W2.lines('w2_scav', {
          0: ['オレはリク！　くず鉄を集めて、ドクのじいさんに売ってるんだ。', '1キロで5クレジット。……いつか自分の機体を組むのが夢なんだ！'],
          1: 'ドクのじいさん、最近なんかソワソワしてる。誰かを待ってるみたい。',
          2: 'あんたの機体、ポンコツ号っていうんだろ？　……名前、もうちょっと何とかならなかったの？',
          3: 'ハルカゼ！？　かっけえ！　オレの集めたネジも使われてるかな！？',
          5: 'ガラクタ拾いも夜は禁止。……昼に倍拾えばいいだけさ！',
          8: '避難所で、拾った部品でラジオを作ったんだ。リリィの放送、みんなで聴いてる！',
          9: 'ドクが弟子にしてくれるって！　……ネジの世話係からだけど。',
        }),
      },
      {
        id: 'w2_portguard', char: 'w2_portguard', x: 42, y: 42, dir: 'down', move: 'still', show: () => W2.town() && G.state.chapter < 8,
        talk: W2.lines('w2_portguard', {
          0: ['……ふぁ。あ、いや、寝てない。宇宙港は閉鎖中だ。近づかないように。', 'この10年、ゲートが開いたのを見たことはない。……給料泥棒ってやつだな、オレは。'],
          1: '昨夜、公安の機体がここを通った。ゲートの向こうに用があったらしい。……オレには何も知らされてない。',
          2: '「白い髪の少女を見たら通報しろ」……だってさ。見たら、まず毛布を貸すけどな。',
          5: '公安から、ゲートの警備を強化しろと命令が来た。……オレ一人で、どうしろと。',
          6: 'ゲートの向こうから、低い振動が伝わってくる。……あそこ、本当にただの宇宙港か？',
          7: '避難命令？　……オレはここを離れない。誰かがゲートを守らないと。',
        }),
      },
      {
        id: 'w2_bouncer', char: 'w2_bouncer', x: 55, y: 15, dir: 'down', move: 'still', show: () => G.state.chapter >= 3 && W2.town(),
        talk: W2.lines('w2_bouncer', {
          3: ['このエレベーターは地下7階、アンダーシェル行きだ。……合言葉？　いらねえよ、うちは誰でも歓迎だ。', 'ただし、負けて泣くなよ。……ってのが合言葉みてえなもんだ。'],
          4: 'スターダストの坊主たちか。上じゃ文化祭だって？　……アリーナも負けずに盛り上がってるぜ。',
          5: '公安の目が厳しくなった。エレベーターは時間を変えて動かしてる。……下は安全だ。',
          6: 'ギルが最近、毎晩一人で練習してる。……あんたらのせいだぜ。いい意味でな。',
          8: 'アンダーシェルは避難所にもなってる。地下は揺れに強いんだ。',
          9: 'デュエルの新シーズンが始まる。……チャンピオンの席、空けて待ってるぜ。',
        }),
      },
      {
        id: 'w2_bouncer0', char: 'w2_bouncer', x: 55, y: 15, dir: 'down', move: 'still', show: () => G.state.chapter < 3,
        talk: W2.lines('w2_bouncer', {
          0: ['……ここは貨物用エレベーターだ。子どもの遊び場じゃない。', '……地下に何があるか？　知らないほうがいいこともある。'],
          1: '公安がうろついてる夜に、子どもがこんなとこで何してる。……帰んな。',
          2: '地下で何をやってるか、か。……あと少し大人になったら教えてやるよ。いや、オレも子どもの頃に下りたけどな。',
        }),
      },
      {
        id: 'w2_driver', char: 'w2_driver', x: 45, y: 15, dir: 'left', move: 'still', show: () => W2.town() && !scrapNight(),
        talk: W2.lines('w2_driver', {
          0: ['フォークリフトでコンテナを積んで20年。目をつぶっても積めるぜ。……やらないけどな。', 'コンテナの迷路？　ああ、南西のあれな。わざとああしてるんだ。泥棒よけさ。……迷子になるのは主に俺だけどな。'],
          2: '迷路のコンテナの中で、ネジ……いや、ドクの猫を見かけたって話だ。あいつ、狭いとこが好きなんだよな。',
          3: '地下のアリーナに機体を運んでるのは、実は俺だ。……内緒だぞ。',
          5: '荷が来ない。フォークリフトがさびる……。',
          8: 'コンテナを並べて、避難所の壁にした。迷路づくりの腕が役に立ったぜ。',
          9: '宇宙港が開いたら、コンテナが山ほど来る。……腕が鳴るぜ。',
        }),
      },
      {
        id: 'w2_welder', char: 'w2_welder', x: 49, y: 32, dir: 'up', move: 'still', show: () => W2.town() && !scrapNight(),
        talk: async () => {
          G.audio.se('beam');
          await W2.lines('w2_welder', {
            0: ['……っと、溶接中。火花に近づかないで。', 'ガラクタをつなげて、何か作るのが好きなの。今作ってるのは……秘密。'],
            2: '作ってるもの？　……ネコ型の自動掃除ロボ。ドクのネジに対抗して。',
            3: 'アリーナの機体の装甲、私が溶接したのもあるのよ。ジャッカルズのとか。',
            4: '文化祭用に、光る看板を溶接してあげた。2年B組の「星屑亭」ってやつ。',
            6: '黒い装甲の破片、溶けないの。どんな温度でも。……この世界の金属じゃない、みたい。',
            8: '避難所の扉、全部私が補強した。……泣いてる暇なんて、ないから。',
            9: 'ネコ型ロボ、完成したの。名前は「ボルト」。ネジとお友達になれるかな。',
          })();
        },
      },
    ],
    checks: [
      { x: 50, y: 44, w: 8, show: () => !E.flag('c8_port_open'), text: () => G.byCh({ 0: '宇宙港ゲート7。「関係者以外立入禁止　S.C.0075 封鎖」。巨大な扉は、びくともしない。', 5: '宇宙港ゲート7。封鎖テープの上から、公安の新しい封印が貼られている。', 8: '宇宙港ゲート7。……この向こうに、外の宇宙がある。', 9: '宇宙港ゲート7。' }) },
      { x: 39, y: 37, w: 2, h: 2, run: async () => await E.say(null, '廃材の山。……古いAFの頭部が埋もれている。モノアイが、こちらを見ている気がする。') },
    ],
    items: [
      { x: 1, y: 48, item: 'memory', id: 'mem_17' },
      { x: 68, y: 44, item: 'memory', id: 'mem_18' },
    ],
    events: W2.memEvents([[1, 48], [68, 44]]),
    warps: [
      { x: 29, y: 0, w: 4, h: 1, to: 'minato', tx: 35, ty: 45, dir: 'up' },
      { x: 69, y: 22, w: 1, h: 4, to: 'scrap_field', tx: 2, ty: 13, dir: 'right' },
    ],
    onEnter: W2.memEnter,
  });

  // ---------------------------------------------------------------
  //  ドクのガレージ doc_garage（26×16）
  // ---------------------------------------------------------------
  const DG = W2.grid(26, 16, 'w');
  DG.fill(1, 3, 24, 12, 'm').fill(12, 15, 2, 1, 'm');
  DG.fill(2, 5, 9, 4, 'x'); // 整備区画の警戒線
  DG.set(1, 3, 'G').set(1, 4, 'G').set(24, 14, 'Q').set(23, 14, 'Q').set(1, 14, 'C').set(2, 14, 'C').set(1, 13, 'C').set(11, 3, 'Q').set(24, 6, 'P').set(18, 14, 'j');
  G.defMap('doc_garage', {
    name: 'ドクのガレージ',
    bgm: 'scrap',
    time: W2.indoorTime,
    ambient: 'sparks',
    floor: 'm',
    pal: { wall: '#9a8a7a', wallTop: '#2a2430', metal: '#7a808e', baseboard: '#4a3a30' },
    rows: DG.rows(),
    objects: [
      { p: 'w2_neonbar', x: 2, y: 1, w: 6, col: '#ffd25e', text: "DOC'S GARAGE" },
      { p: 'poster', x: 9, y: 2, col: '#ffd25e' },
      { p: 'poster', x: 10, y: 2, col: '#ff5fa2' },
      { p: 'w2_board', x: 19, y: 1, w: 3, text: 'TODO', wall: true },
      { p: 'w2_clock', x: 23, y: 1, wall: true },
      { p: 'hangar', x: 3, y: 7, msg: '機体の整備フレーム。ケーブルが何本も機体につながっている。' },
      { p: 'hangar', x: 7, y: 7, msg: '2番ハンガー。今は空いている。床に「ジン専用」と古いペンキで書いてある。' },
      { p: 'w2_hook', x: 8, y: 5 },
      { p: 'shelf', x: 12, y: 3, w: 4, kind: 'parts', msg: 'パーツ棚。ジャイロ、アクチュエータ、謎の配線。ラベルはすべてドクの字で「たぶん使える」。' },
      { p: 'shelf', x: 16, y: 3, w: 3, kind: 'parts', msg: 'パーツ棚。「ネジ（猫ではない）」と書かれた引き出しがある。' },
      { p: 'w2_workbench', x: 13, y: 7, w: 4, msg: '作業台。設計図の端に「カナタへ」と小さくメモがある。' },
      { p: 'terminal', x: 17, y: 7, col: '#7dff9a', msg: '診断端末。「機体同調率：測定中……」' },
      { p: 'server', x: 19, y: 3 },
      { p: 'bed', x: 23, y: 3, col: '#8a6a4a', msg: 'ドクの簡易ベッド。枕元に古い写真立て。若い頃のドクと、トメばあちゃん……と、知らない男の人。' },
      { p: 'w2_sofa', x: 19, y: 11, w: 3, col: '#6a5a3a', msg: 'すり切れたソファ。ネジの毛（？）がついている。' },
      { p: 'tv', x: 20, y: 9, msg: '古いブラウン管テレビ。ジャンク・デュエルの中継が流れている。' },
      { p: 'barrel', x: 11, y: 12, hazard: true },
      { p: 'tires', x: 10, y: 13 },
      { p: 'crate', x: 15, y: 13, col: '#8a6a4a' },
      { p: 'crate', x: 16, y: 13, col: '#a07a4a' },
      { p: 'rug', x: 19, y: 12, w: 4, h: 2, col: '#6a4a3a' },
    ],
    lights: [
      { x: 5, y: 6, r: 60, col: '#ffe0b0', a: 0.5 },
      { x: 15, y: 6, r: 40, col: '#ffd890', a: 0.5 },
      { x: 21, y: 10, r: 36, col: '#6a9ae0', a: 0.4, flicker: true },
      { x: 12, y: 13, r: 30, col: '#ffd890', a: 0.3 },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // シャッターのレール
      r(c, 12 * 16, 15 * 16, 32, 16, '#3a3a48');
      for (let i = 0; i < 32; i += 4) r(c, 12 * 16 + i, 15 * 16 + 2, 2, 12, '#5a5a6a');
      // 床のオイル汚れ
      for (const [x, y, rx] of [[5, 10, 12], [15, 10, 8], [9, 12, 6]]) G.ellipse(c, x * 16, y * 16, rx, Math.ceil(rx / 3), 'rgba(30,26,40,0.35)');
    },
    npcs: [],
    items: [],
    warps: [{ x: 12, y: 15, w: 2, to: 'scrapbay', tx: 11, ty: 11, dir: 'down', se: 'door' }],
  });

  // ---------------------------------------------------------------
  //  廃材置き場 scrap_field（40×28）— 機体戦用の広場
  // ---------------------------------------------------------------
  const SF = W2.grid(40, 28, 's');
  SF.fill(0, 0, 40, 1, 'F').fill(0, 27, 40, 1, 'F').fill(0, 0, 1, 28, 'F').fill(39, 0, 1, 28, 'F');
  SF.fill(0, 12, 1, 4, '-').fill(1, 12, 3, 4, '-');
  [[2, 2, 'G'], [3, 2, 'Q'], [36, 2, 'C'], [37, 2, 'C'], [37, 3, 'Q'], [2, 25, 'G'], [3, 25, 'G'], [37, 25, 'Q'], [36, 25, 'C'], [20, 1, 'Q'], [21, 1, 'C'], [1, 8, 'Q'], [38, 14, 'G'], [38, 15, 'G']].forEach(([x, y, ch]) => SF.set(x, y, ch));
  G.defMap('scrap_field', {
    name: '廃材置き場',
    bgm: 'scrap',
    outdoor: true,
    ambient: 'dust',
    floor: 's',
    pal: { road: '#5a5660' },
    rows: SF.rows(),
    objects: [
      { p: 'scrap', x: 6, y: 3, seed: 21 },
      { p: 'scrap', x: 31, y: 4, seed: 22 },
      { p: 'container', x: 13, y: 1, col: '#c04a3a', text: 'C7-31', stack: 2 },
      { p: 'container', x: 25, y: 1, col: '#3a6ab0', text: 'JUNK', stack: 1 },
      { p: 'scrap', x: 34, y: 20, seed: 23 },
      { p: 'scrap', x: 4, y: 21, seed: 24 },
      { p: 'container', x: 16, y: 25, col: '#d0902a', text: 'C7-62', stack: 1 },
      { p: 'crane', x: 35, y: 10 },
      { p: 'tires', x: 11, y: 24 },
      { p: 'barrel', x: 28, y: 24, hazard: true },
    ],
    decorate(c, m) {
      // 機体の足跡と焦げ跡
      for (let i = 0; i < 18; i++) {
        const x = 80 + Math.floor(G.hash(i, 1, 4) * 480),
          y = 60 + Math.floor(G.hash(i, 2, 4) * 320);
        r(c, x, y, 6, 9, 'rgba(40,36,48,0.25)');
        r(c, x + 9, y + 14, 6, 9, 'rgba(40,36,48,0.25)');
      }
      for (const [x, y] of [[180, 160], [420, 250], [300, 120]]) G.ellipse(c, x, y, 18, 8, 'rgba(30,20,20,0.3)');
    },
    items: [{ x: 38, y: 26, item: 'memory', id: 'mem_19' }],
    events: W2.memEvents([[38, 26]]),
    warps: [{ x: 0, y: 12, w: 1, h: 4, to: 'scrapbay', tx: 67, ty: 23, dir: 'left' }],
    onEnter: W2.memEnter,
  });
})();
