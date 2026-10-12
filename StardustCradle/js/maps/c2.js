// =============================================================
//  maps/c2.js — 第2章「星屑亭の居候」専用マップ
//   c2_hidamari_out : 児童養護施設〈ひだまり園〉の前庭（ミナト区・北西の路地の奥）
//   c2_hidamari     : ひだまり園の中（食堂・プレイルーム）
//   c2_gymback      : 第三中・体育倉庫裏（キョウスケ戦）
// =============================================================
(function () {
  const W2 = G.W2;
  const r = G.rect,
    px = G.px;

  // ---------- 小物：洗濯物のロープ（平置き・夜は少し光る） ----------
  if (!G.PROPS.c2_laundry)
    G.PROPS.c2_laundry = function (o) {
      const w = o.w || 3;
      const cv = G.makeCanvas(w * 16, 30);
      const c = cv.ctx;
      r(c, 1, 4, 2, 26, '#8a7a6a');
      r(c, w * 16 - 3, 4, 2, 26, '#8a7a6a');
      r(c, 2, 6, w * 16 - 4, 1, '#d8d0c0');
      const cols = ['#ff8fb8', '#4ef0ff', '#ffd25e', '#7dff9a', '#ffffff', '#ff9a6a'];
      for (let x = 6, i = 0; x < w * 16 - 8; x += 7, i++) {
        const col = cols[(i + (o.seed || 0)) % cols.length];
        r(c, x, 7, 5, i % 2 ? 6 : 8, col);
        r(c, x, 7, 5, 1, G.shade(col, -0.25));
        if (i % 3 === 0) r(c, x + 1, 9, 3, 1, G.shade(col, 0.3));
      }
      return { w, h: 1, img: cv, ox: 0, oy: -14, solid: false };
    };
  // ---------- 小物：子どもの絵（壁に貼る・平置き） ----------
  if (!G.PROPS.c2_drawing)
    G.PROPS.c2_drawing = function (o) {
      const cv = G.makeCanvas(16, 16);
      const c = cv.ctx;
      r(c, 2, 2, 12, 10, '#fffaf0');
      r(c, 2, 2, 12, 1, '#e0d8c8');
      const k = o.kind || 0;
      if (k === 0) {
        // 星空と家
        r(c, 3, 3, 10, 5, '#2a3a7a');
        px(c, 5, 4, '#ffd25e'), px(c, 9, 5, '#ffd25e'), px(c, 11, 3, '#ffffff');
        r(c, 5, 8, 6, 3, '#ff9a6a');
      } else if (k === 1) {
        // 三人の棒人間
        for (let i = 0; i < 3; i++) {
          G.ellipse(c, 5 + i * 3, 5, 1, 1, ['#ff5fa2', '#4a2e2a', '#eef2ff'][i]);
          r(c, 5 + i * 3, 6, 1, 4, '#3a3a48');
        }
        r(c, 3, 10, 10, 1, '#7dff9a');
      } else if (k === 2) {
        // 青い空と太陽（本物の空）
        r(c, 3, 3, 10, 8, '#7ec4f0');
        G.ellipse(c, 10, 5, 2, 2, '#ffd25e');
        r(c, 3, 9, 10, 2, '#5ab050');
      } else {
        // ロボット
        r(c, 6, 4, 4, 3, '#e8b030');
        r(c, 5, 7, 6, 4, '#e8b030');
        px(c, 7, 5, '#4ef0ff'), px(c, 8, 5, '#4ef0ff');
      }
      r(c, 7, 1, 2, 2, ['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a'][k % 4]);
      return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
    };
  // ---------- 小物：スプレーの落書き（壁・平置き） ----------
  if (!G.PROPS.c2_graffiti)
    G.PROPS.c2_graffiti = function (o) {
      const w = o.w || 3;
      const cv = G.makeCanvas(w * 16, 16);
      const c = cv.ctx;
      const col = o.col || '#ff5fa2';
      const t = o.text || 'ONIZUKA';
      G.pixText(c, t, Math.max(1, (w * 16 - G.pixTextW(t)) / 2) + 1, 6, 'rgba(0,0,0,0.35)');
      G.pixText(c, t, Math.max(1, (w * 16 - G.pixTextW(t)) / 2), 5, col);
      for (let i = 0; i < 6; i++) px(c, G.irand(2, w * 16 - 2), G.irand(11, 15), col);
      return { w, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
    };

  // =============================================================
  //  ひだまり園・前庭 c2_hidamari_out（30×20）
  //   東端 x=29,y=11..12 → ミナト区 (3,8)。建物の扉 (14,7) → c2_hidamari (10,12)
  //   非常はしご (21,5..7)：屋根へ（ルウ編）
  // =============================================================
  const O = W2.grid(30, 20, '.');
  O.fill(0, 0, 30, 1, 'H').fill(0, 19, 30, 1, 'H').fill(0, 0, 1, 20, 'H').fill(29, 0, 1, 20, 'H');
  O.fill(14, 8, 2, 4, ':').fill(14, 11, 16, 2, ':'); // 玄関からの小道
  O.fill(2, 12, 6, 4, ':'); // 砂場
  O.fill(22, 14, 5, 3, ','); // 花壇
  O.fill(3, 2, 3, 3, 'o'); // 家庭菜園
  [[2, 12], [3, 12]].forEach(([x, y]) => O.set(x, y, 'G'));
  [[1, 7], [2, 17], [5, 18], [24, 2], [27, 4], [27, 17], [12, 17]].forEach(([x, y]) => O.set(x, y, 'T'));
  [[25, 9], [8, 16]].forEach(([x, y]) => O.set(x, y, 'Y'));
  [[7, 8], [8, 8], [19, 8], [20, 8]].forEach(([x, y]) => O.set(x, y, 'q'));
  O.set(13, 10, 'L').set(23, 10, 'L').set(27, 10, 'M').set(17, 16, 'b').set(18, 16, 'b');
  O.fill(29, 11, 1, 2, ':');

  G.defMap('c2_hidamari_out', {
    name: 'ひだまり園',
    area: 'ミナト区・北西の路地の奥',
    bgm: () => (G.state.chapter === 2 ? 'sad' : 'home'),
    outdoor: true,
    ambient: 'petals',
    floor: '.',
    pal: { grass: '#6cb85a', dirt: '#c8a070' },
    rows: O.rows(),
    objects: [
      {
        p: 'bldg', x: 7, y: 1, w: 14, h: 7, style: 'house', roof: 'tile', roofCol: '#e0844a', wall: '#fff0d8', wallH: 2,
        sign: 'HIDAMARI', signCol: '#e07a3a', door: 7, doorType: 'wood', seed: 61, to: 'c2_hidamari', tx: 10, ty: 12, dir: 'up',
      },
      { p: 'pipe', x: 21, y: 5, w: 3, vertical: true, col: '#9a8a7a', msg: '屋根へのぼる非常はしご。子どもが登らないように、いちばん下の段にだけ南京錠がかかっている……けど、ルウは昔から関係なく登っていた。' },
      { p: 'c2_laundry', x: 9, y: 13, w: 4, seed: 1, msg: '洗濯物。小さな靴下が、ずらりと並んでいる。' },
      { p: 'bench', x: 10, y: 15, msg: '園庭のベンチ。背もたれに、油性ペンで「るう」と書いてある。……ずいぶん昔の字だ。' },
      { p: 'flowerbed', x: 8, y: 9, w: 3 },
      { p: 'flowerbed', x: 16, y: 9, w: 3 },
      { p: 'sign', x: 28, y: 13, text: 'HIDAMARI', col: '#e07a3a', msg: '「児童養護施設 ひだまり園」——子どもたちの笑顔を、みんなで守りましょう。' },
      { p: 'bicycle', x: 22, y: 9, col: '#ff8fb8' },
      { p: 'bicycle', x: 21, y: 9, col: '#4ef0ff' },
      { p: 'tires', x: 6, y: 14 },
      { p: 'sign', x: 6, y: 2, text: 'FARM', col: '#4a8a3a', msg: '「ひだまり菜園　にんじん・トマト　ぬかないでね」……字がところどころ反対になっている。' },
    ],
    checks: [{ x: 2, y: 12, w: 6, h: 4, text: '砂場。だれかが作りかけの「コロニー」が、まるい山になって残っている。' }],
    lights: [
      { x: 10, y: 6, r: 34, col: '#ffd090', a: 0.7, night: true },
      { x: 17, y: 6, r: 34, col: '#ffd090', a: 0.7, night: true },
      { x: 14, y: 7, r: 24, col: '#ffe0b0', a: 0.6, night: true },
    ],
    warps: [{ x: 29, y: 11, w: 1, h: 2, to: 'minato', tx: 3, ty: 8, dir: 'right', cond: () => !E.flag('c2_ruu_mode') }],
  });

  // =============================================================
  //  ひだまり園・中 c2_hidamari（22×14）
  //   出口 (10..11,13) → c2_hidamari_out (14,9)
  // =============================================================
  const I = W2.grid(22, 14, 'w');
  I.fill(1, 2, 20, 11, 'f').fill(10, 13, 2, 1, 'f');
  I.fill(1, 2, 5, 3, 'p'); // 台所
  [6, 7, 8, 9, 10, 11].forEach((x) => I.set(x, 4, 'U').set(x, 8, 'U'));
  I.set(20, 12, 'P').set(1, 12, 'P').set(13, 2, 'P');

  G.defMap('c2_hidamari', {
    name: 'ひだまり園',
    area: '食堂・プレイルーム',
    bgm: () => (G.state.chapter === 2 ? 'sad' : 'home'),
    light: '#f6e2c8',
    lightAlpha: 0.75,
    floor: 'f',
    pal: { wall: '#fbe8d0', wallTop: '#4a3040', wood: '#d8a878', tile: '#e8e0d0', baseboard: '#c07a50' },
    rows: I.rows(),
    objects: [
      { p: 'stove', x: 1, y: 2, msg: '大きな鍋。今夜はカレーだったらしい。……ルウの好物の、甘口。' },
      { p: 'fridge', x: 3, y: 2, msg: '冷蔵庫に、子どもたちの名前が書かれたプリンが並んでいる。「るう」の分も、まだある。' },
      { p: 'counter', x: 1, y: 5, w: 5, col: '#c08a58', top: '#f4e8d0' },
      { p: 'table', x: 6, y: 5, w: 6, h: 2, col: '#c89060', items: true },
      { p: 'wallwindow', x: 7, y: 1, w: 3, night: true, msg: '窓の外、空の向こう側の街の灯りが、星みたいにまたたいている。' },
      { p: 'c2_drawing', x: 11, y: 1, kind: 0, msg: '子どもの絵。夜空に星がいっぱい。「ほんとうのそら」と書いてある。' },
      { p: 'c2_drawing', x: 12, y: 1, kind: 1, msg: '子どもの絵。ピンクの髪の女の子と、小さな子が二人。「るうねえちゃん　だいすき」' },
      { p: 'c2_drawing', x: 14, y: 1, kind: 2, msg: '子どもの絵。青い空と、まるい太陽。……誰も、本物を見たことがないのに。' },
      { p: 'c2_drawing', x: 15, y: 1, kind: 3, msg: '子どもの絵。黄色いロボット。「つよい！」と大きく書いてある。' },
      { p: 'shelf', x: 16, y: 2, w: 2, msg: '絵本と、おもちゃの棚。いちばん上に、色あせたカセットテープ。ラベルには「ララバイ」と、丸っこい字。' },
      { p: 'tv', x: 18, y: 2, msg: '古いテレビ。アンテナに、アルミホイルが巻いてある。' },
      { p: 'rug', x: 14, y: 7, w: 6, h: 4, col: '#ff9a6a' },
      { p: 'bed', x: 1, y: 8, col: '#ff8fb8', msg: 'お昼寝用のベッド。ぬいぐるみが三つ、仲良く並んでいる。' },
      { p: 'bed', x: 3, y: 8, col: '#4ef0ff' },
      { p: 'locker', x: 3, y: 12, w: 4, msg: '下駄箱。小さな靴がぎっしり。いちばん端は、今も「るう」の名札のまま空いている。' },
      { p: 'locker', x: 13, y: 12, w: 4 },
      { p: 'plant', x: 20, y: 6 },
      { p: 'stairs', x: 20, y: 3, msg: '2階は子どもたちの寝室。……もう、みんな寝る時間だ。' },
    ],
    lights: [
      { x: 8, y: 5, r: 50, col: '#ffe0b0', a: 0.6 },
      { x: 17, y: 8, r: 46, col: '#ffd0a0', a: 0.5 },
      { x: 3, y: 3, r: 30, col: '#ffc890', a: 0.5 },
    ],
    warps: [{ x: 10, y: 13, w: 2, h: 1, to: 'c2_hidamari_out', tx: 14, ty: 9, dir: 'down', se: 'door' }],
  });

  // =============================================================
  //  第三中・体育倉庫裏 c2_gymback（24×14）
  //   出口 (10..12,13) → school_yard (44,9)
  // =============================================================
  const B = W2.grid(24, 14, 'c');
  B.fill(0, 0, 24, 2, 'W').fill(0, 0, 1, 14, 'F').fill(23, 0, 1, 14, 'F').fill(0, 13, 24, 1, 'F').fill(10, 13, 3, 1, 'c');
  B.fill(0, 0, 24, 2, 'W');
  [[1, 2, 'Q'], [2, 2, 'Q'], [1, 3, 'C'], [21, 2, 'G'], [22, 2, 'G'], [22, 3, 'G'], [22, 11, 'C'], [21, 12, 'C'], [22, 12, 'Q'], [1, 12, 'j'], [6, 2, 'D'], [7, 2, 'D'], [16, 2, 'j']].forEach(([x, y, ch]) => B.set(x, y, ch));
  B.fill(3, 5, 4, 3, ':').fill(15, 8, 5, 3, ':');

  G.defMap('c2_gymback', {
    name: '体育倉庫裏',
    area: '第三中学校',
    bgm: 'tension',
    outdoor: true,
    floor: 'c',
    ambient: 'leaves',
    pal: { concrete: '#a8a4ac', bigwall: '#8a6a60', dirt: '#9a8060' },
    rows: B.rows(),
    objects: [
      { p: 'c2_graffiti', x: 3, y: 1, w: 4, text: 'ONIZUKA', col: '#ff5fa2', msg: '壁にスプレーの落書き。「ONIZUKA」……キョウスケの名字だ。' },
      { p: 'c2_graffiti', x: 13, y: 1, w: 4, text: '3-C NO1', col: '#ffd25e' },
      { p: 'c2_graffiti', x: 18, y: 1, w: 3, text: 'BEAT', col: '#4ef0ff' },
      { p: 'bench', x: 9, y: 3, msg: '壊れかけのベンチ。座面に焼け焦げのあと。' },
      { p: 'sign', x: 12, y: 2, text: 'KEEP OUT', col: '#e04a4a', msg: '「生徒立入禁止」の札。……の上から、「番長以外」と書き足してある。' },
    ],
    lights: [{ x: 12, y: 3, r: 30, col: '#ffb070', a: 0.5 }],
    warps: [{ x: 10, y: 13, w: 3, h: 1, to: 'school_yard', tx: 44, ty: 9, dir: 'down' }],
  });
})();
