// =============================================================
//  maps/c4.js — 第4章「文化祭と公安」専用マップ・小物
//   c4_haunted（3年A組・お化け屋敷）／ c4_cafe（喫茶〈赤い悪魔〉）／ c4_chase（追跡・夜の運河通り）
//   共有ヘルパー G.C45（4・5章で共用：小物の差し替え、仲間の一時退避など）
// =============================================================
(function () {
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;

  // ---------------------------------------------------------------
  //  4・5章 共有ヘルパー
  // ---------------------------------------------------------------
  const H = (G.C45 = G.C45 || {});
  // 文字グリッド
  H.grid = function (w, h, ch) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(ch));
    const o = {
      g,
      fill(x, y, ww, hh, c) {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && i >= 0 && i < w) g[j][i] = c;
        return o;
      },
      set(x, y, c) {
        if (g[y] && x >= 0 && x < w) g[y][x] = c;
        return o;
      },
      rows: () => g.map((rr) => rr.join('')),
    };
    return o;
  };
  // マップ上の小物を、その場で別の見た目に差し替える（リロードなし）
  H.swap = function (id, type, opts, light) {
    const m = G.field.map;
    const ob = m.objById(id);
    if (!ob) return;
    const d = G.prop(type, opts || {});
    if (!d) return;
    ob.data = d;
    ob.type = type;
    ob.px = ob.tx * S + d.ox;
    ob.py = ob.ty * S + d.oy;
    ob.sortY = d.flat ? -99999 : (ob.ty + d.h) * S - 1;
    if (light) m.lights.push({ x: ob.tx * S + 8 + (light.dx || 0), y: ob.ty * S + (light.dy || 0), r: light.r || 30, col: light.col || '#ffe0a0', a: light.a || 0.8, flicker: light.flicker });
    m.computeSolid();
  };
  // 小物をマップから取り除く
  H.removeObj = function (id) {
    const m = G.field.map;
    m.objs = m.objs.filter((o) => o.id !== id);
    m.computeSolid();
  };
  // 仲間（追従キャラ）を一時的に外し、場面用のNPCを置く
  H.stash = function () {
    H._party = G.state.party.slice();
    E.party([]);
  };
  H.unstash = function (list) {
    E.party(list || H._party || []);
  };
  H.actors = function (list) {
    for (const [id, char, x, y, dir] of list) {
      if (E.get(id)) E.remove(id);
      E.npc({ id, char, x, y, dir: dir || 'down', move: 'still' });
    }
  };
  H.clear = function (ids) {
    for (const id of ids) E.remove(id);
  };
  // 一時的なトースト付きの経験値
  H.reward = function (exp, money) {
    if (exp) {
      E.exp(exp);
      E.toast('経験値 ' + exp + ' を獲得', '#7dff9a');
    }
    if (money) E.money(money);
  };

  // ---------------------------------------------------------------
  //  小物（c4_ 接頭辞）
  // ---------------------------------------------------------------
  // ろうそく（燭台）lit:true で火がつく
  P.c4_candle = function (o) {
    const cv = mk(16, 30),
      c = cv.ctx;
    r(c, 3, 26, 10, 4, 'rgba(20,10,40,0.35)');
    r(c, 6, 14, 4, 13, '#6a5a4a');
    r(c, 3, 25, 10, 3, '#5a4a3a');
    r(c, 4, 13, 8, 2, '#8a7a5a');
    r(c, 6, 6, 4, 8, '#f0e8d8');
    r(c, 6, 6, 1, 8, '#ffffff');
    px(c, 8, 5, '#2a2a2a');
    if (o.lit) {
      r(c, 7, 1, 2, 4, '#ffd25e');
      px(c, 7, 0, '#ff8a30');
      px(c, 8, 2, '#ffffff');
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: -14, solid: true, lights: o.lit ? [{ x: 8, y: -12, r: 34, col: '#ffa040', a: 0.9, flicker: true }] : [] };
  };
  // 大きな姿見（お化け屋敷）
  P.c4_mirror = function (o) {
    const cv = mk(16, 32),
      c = cv.ctx;
    r(c, 1, 0, 14, 31, '#5a3a2a');
    r(c, 2, 1, 12, 29, '#8a6a3a');
    r(c, 3, 2, 10, 27, '#3a4a6a');
    r(c, 3, 2, 10, 27, 'rgba(160,200,255,0.25)');
    G.line(c, 4, 20, 10, 4, 'rgba(255,255,255,0.4)');
    if (o.ghost) {
      r(c, 6, 8, 4, 4, '#eef2ff');
      r(c, 5, 12, 6, 10, '#d8e4f8');
      px(c, 7, 9, '#4ef0ff');
      px(c, 8, 9, '#4ef0ff');
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: -16, solid: false };
  };
  // 立て看板（画板）painted:true で完成
  P.c4_board = function (o) {
    const cv = mk(48, 40),
      c = cv.ctx;
    r(c, 4, 36, 40, 4, 'rgba(20,10,40,0.3)');
    r(c, 6, 20, 2, 18, '#7a5a3a');
    r(c, 40, 20, 2, 18, '#7a5a3a');
    r(c, 1, 2, 46, 24, '#8a6a40');
    r(c, 3, 4, 42, 20, o.painted ? '#c03030' : '#f4efe4');
    if (o.painted) {
      r(c, 3, 4, 42, 2, '#ff6a50');
      G.pixText(c, 'HOSHIKUZU', 24 - G.pixTextW('HOSHIKUZU') / 2, 7, '#ffd25e');
      G.pixText(c, 'RAMEN', 24 - G.pixTextW('RAMEN', 1) / 2, 15, '#ffffff');
      // どんぶりの絵
      G.ellipse(c, 38, 18, 4, 2, '#ffffff');
      G.ellipse(c, 10, 18, 3, 2, '#ffffff');
    } else {
      for (let i = 0; i < 4; i++) G.line(c, 8 + i * 9, 10 + (i % 2) * 4, 13 + i * 9, 12, '#c8c0b0');
      r(c, 30, 24, 6, 3, '#ff5fa2');
      r(c, 36, 24, 6, 3, '#4ef0ff');
    }
    return { w: 3, h: 1, img: cv, ox: 0, oy: -24, solid: true };
  };
  // 提灯の列（上から吊るす・判定なし）
  P.c4_chochin = function (o) {
    const w = o.w || 4,
      W = w * S;
    const cv = mk(W, 30),
      c = cv.ctx;
    const cols = o.cols || ['#ff5040', '#ffd25e', '#ff8fb8', '#4ef0ff'];
    for (let x = 0; x < W; x++) {
      const y = 4 + Math.round(Math.sin((x / W) * Math.PI) * 6);
      px(c, x, y, '#3a3a48');
    }
    const lights = [];
    for (let i = 0; i < w; i++) {
      const x = i * S + 6,
        y = 6 + Math.round(Math.sin(((x + 2) / W) * Math.PI) * 6);
      const col = cols[i % cols.length];
      r(c, x, y, 5, 7, col);
      r(c, x, y, 5, 1, '#2a2a2a');
      r(c, x, y + 6, 5, 1, '#2a2a2a');
      px(c, x + 1, y + 2, '#ffffff');
      lights.push({ x: x + 2, y: y - 24, r: 16, col, a: 0.7, flicker: true });
    }
    return { w, h: 1, img: cv, ox: 0, oy: -28, solid: false, lights };
  };
  // ステージ（屋上ライブ）
  P.c4_stage = function (o) {
    const w = o.w || 6,
      W = w * S;
    const cv = mk(W, 40),
      c = cv.ctx;
    r(c, 0, 14, W, 26, '#3a2a48');
    r(c, 0, 14, W, 3, '#ff5fa2');
    r(c, 0, 37, W, 3, '#1a1428');
    for (let i = 4; i < W; i += 12) r(c, i, 20, 6, 14, '#2a1e38');
    // スピーカー
    for (const sx of [2, W - 14]) {
      r(c, sx, 0, 12, 16, '#1a1a24');
      G.ellipse(c, sx + 6, 6, 4, 4, '#3a3a48');
      G.ellipse(c, sx + 6, 12, 2, 2, '#3a3a48');
    }
    G.pixText(c, o.text || 'LIVE', W / 2 - G.pixTextW(o.text || 'LIVE') / 2, 24, '#ffd25e');
    return { w, h: 1, img: cv, ox: 0, oy: -24, solid: false, flat: false, lights: [{ x: 8, y: -20, r: 30, col: '#ff5fa2', a: 0.6, flicker: true }, { x: W - 8, y: -20, r: 30, col: '#4ef0ff', a: 0.6, flicker: true }] };
  };
  // 公安の装甲車（3×1）
  P.c4_van = function (o) {
    const cv = mk(48, 34),
      c = cv.ctx;
    r(c, 2, 30, 44, 4, 'rgba(20,10,40,0.35)');
    r(c, 2, 8, 44, 22, '#3a4660');
    r(c, 2, 8, 44, 3, '#5a6a8a');
    r(c, 2, 26, 44, 4, '#22283a');
    r(c, 6, 12, 14, 7, '#1a2030');
    r(c, 30, 12, 12, 7, '#1a2030');
    r(c, 22, 14, 6, 10, '#ffd25e');
    G.pixText(c, 'SEC', 24 - 6, 20, '#22283a');
    r(c, 18, 4, 12, 4, '#2a2a3a');
    r(c, 18, 4, 6, 3, '#ff3050');
    r(c, 24, 4, 6, 3, '#3a7aff');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -18, solid: true, lights: [{ x: 21, y: -14, r: 26, col: '#ff3050', a: 0.9, blink: true }, { x: 27, y: -14, r: 26, col: '#3a7aff', a: 0.9 }] };
  };

  // ---------------------------------------------------------------
  //  c4_haunted — 3年A組・お化け屋敷（22×15）
  //   入口 (2,14) ↔ school_hall (8,3)。出口 (0,2..3) → school_hall (9,3)
  //   蛇行するレーン：lane0 y11-12 → lane1 y8-9 → lane2 y5-6 → lane3 y2-3
  // ---------------------------------------------------------------
  const HG = H.grid(22, 15, 'w');
  HG.fill(1, 2, 20, 2, 'f').fill(1, 5, 20, 2, 'f').fill(1, 8, 20, 2, 'f').fill(1, 11, 20, 2, 'f');
  HG.fill(1, 4, 17, 1, '#').fill(1, 7, 20, 1, '#').fill(1, 10, 17, 1, '#');
  HG.fill(1, 7, 3, 1, 'f'); // lane1 → lane2（左）
  HG.fill(18, 4, 3, 1, 'f'); // lane2 → lane3（右）
  HG.fill(18, 10, 3, 1, 'f'); // lane0 → lane1（右）
  HG.set(2, 13, 'f').set(2, 14, 'f'); // 入口
  HG.set(0, 2, 'f').set(0, 3, 'f'); // 出口
  HG.set(6, 2, '#').set(6, 3, '#'); // 最後の暗幕（ろうそく3本で開く）
  G.mob('c4_yurei', '幽霊役のウミ', 106, { girl: true, kid: false, over: { top: '#f4f4fa', top2: '#e0e4f0', outfit: 'dress', bottom: '#f4f4fa', hair: '#141420', style: 'long', skin: '#e8eef8' } });
  G.mob('c4_zombie', 'ゾンビ役の3年生', 431, { girl: false, over: { top: '#5a7a5a', outfit: 'tshirt', skin: '#9ac0a0', hair: '#2a3a2a', style: 'messy' } });
  G.defMap('c4_haunted', {
    name: '3年A組 お化け屋敷',
    area: '〈恐怖！ 無重力病棟〉',
    bgm: 'tension',
    light: '#1c1430',
    lightAlpha: 0.95,
    ambient: 'dust',
    floor: 'f',
    noHud: false,
    pal: { wall: '#2a2236', wallTop: '#120c1a', wood: '#4a3a3a', baseboard: '#1a1420', block: '#100a16' },
    rows: HG.rows(),
    objects: [
      { p: 'c4_candle', x: 12, y: 12, id: 'c4_cd1', show: () => !E.flag('c4_cd1'), msg: '' },
      { p: 'c4_candle', x: 12, y: 12, id: 'c4_cd1b', lit: true, show: () => E.flag('c4_cd1') },
      { p: 'c4_candle', x: 3, y: 9, id: 'c4_cd2', show: () => !E.flag('c4_cd2') },
      { p: 'c4_candle', x: 3, y: 9, id: 'c4_cd2b', lit: true, show: () => E.flag('c4_cd2') },
      { p: 'c4_candle', x: 15, y: 6, id: 'c4_cd3', show: () => !E.flag('c4_cd3') },
      { p: 'c4_candle', x: 15, y: 6, id: 'c4_cd3b', lit: true, show: () => E.flag('c4_cd3') },
      { p: 'c4_mirror', x: 9, y: 4, id: 'c4_mirror' },
      { p: 'capsule', x: 18, y: 12, empty: true, msg: '「培養槽」と書かれたダンボール製のカプセル。中に人体模型が入っている。' },
      { p: 'bed', x: 7, y: 8, col: '#5a5a6a', msg: 'ボロボロのベッド。シーツに赤いペンキで「たすけて」。……ペンキ、まだ乾いてない。' },
      { p: 'desk', x: 1, y: 5, msg: '診察机。カルテに「患者No.7 症状：無重力酔い（重症）」と書いてある。' },
      { p: 'server', x: 19, y: 2, msg: 'ダンボールの機械。「ピコピコ」と書いた紙が貼ってある。' },
      { p: 'plant', x: 20, y: 9 },
      { p: 'stairs', x: 2, y: 13 },
    ],
    checks: [
      { x: 6, y: 2, h: 2, show: () => !E.flag('c4_hh_gate'), text: '分厚い暗幕が垂れている。貼り紙：「3つのろうそくに火をともせば、道は開かれん……」' },
    ],
    lights: [
      { x: 2, y: 12, r: 26, col: '#ff3050', a: 0.5, flicker: true },
      { x: 19, y: 9, r: 22, col: '#7dff9a', a: 0.4, flicker: true },
      { x: 1, y: 3, r: 26, col: '#ffffff', a: 0.4 },
    ],
    warps: [
      { x: 2, y: 14, to: 'school_hall', tx: 8, ty: 3, dir: 'down', se: 'door' },
      { x: 0, y: 2, h: 2, to: 'school_hall', tx: 9, ty: 4, dir: 'down', se: 'door', cond: () => E.flag('c4_hh_gate') },
    ],
  });

  // ---------------------------------------------------------------
  //  c4_cafe — 喫茶〈赤い悪魔〉（2年C組の教室を借りた先生たちの喫茶店, 18×12）
  //   出口 (9,11) → school_hall (20,3)
  // ---------------------------------------------------------------
  const CG = H.grid(18, 12, 'w');
  CG.fill(1, 2, 16, 9, 'k').set(9, 11, 'k');
  G.defMap('c4_cafe', {
    name: '喫茶〈赤い悪魔〉',
    area: '先生たちの出し物',
    bgm: 'festival',
    light: '#fff0e0',
    lightAlpha: 0.6,
    floor: 'k',
    pal: { wall: '#f0dcc8', wallTop: '#5a2a30', checkA: '#f4ece0', checkB: '#c84a4a', baseboard: '#7a3a3a' },
    rows: CG.rows(),
    objects: [
      { p: 'counter', x: 10, y: 4, w: 6, col: '#7a3a2a', top: '#f4e0c8' },
      { p: 'w2_coffee', x: 13, y: 2, msg: 'コーヒーメーカー。横に「砂糖：無制限（本日のみ）」の貼り紙。' },
      { p: 'fridge', x: 15, y: 2, msg: 'ケーキ用の冷蔵庫。ドーナツが整然と……いや、ぎっしり詰まっている。' },
      { p: 'shelf', x: 10, y: 2, w: 2, col: '#7a3a2a', msg: 'カップの棚。いちばん大きなマグカップに「VARGAS」の文字。' },
      { p: 'table', x: 2, y: 4, w: 2, h: 1, col: '#ffffff', items: true },
      { p: 'table', x: 2, y: 7, w: 2, h: 1, col: '#ffffff', items: true },
      { p: 'table', x: 6, y: 7, w: 2, h: 1, col: '#ffffff', items: true },
      { p: 'stool', x: 1, y: 4 },
      { p: 'stool', x: 4, y: 4 },
      { p: 'stool', x: 1, y: 7 },
      { p: 'stool', x: 5, y: 7 },
      { p: 'stool', x: 8, y: 7 },
      { p: 'plant', x: 16, y: 9 },
      { p: 'plant', x: 1, y: 9 },
      { p: 'poster', x: 3, y: 1, col: '#c84a4a', msg: '手書きのメニュー。「赤い悪魔ブレンド ¢80」「地獄のドーナツ ¢60」「先生の本気パフェ ¢150」' },
      { p: 'poster', x: 6, y: 1, col: '#ffd25e', msg: '古い写真。若いバルガス先生が、同盟軍のAFの前で敬礼している。今より髪が多い。' },
      { p: 'rug', x: 8, y: 9, w: 3, h: 2, col: '#8a2a3a' },
    ],
    lights: [
      { x: 12, y: 3, r: 40, col: '#ffd8a0', a: 0.6 },
      { x: 4, y: 7, r: 40, col: '#ffe8c0', a: 0.5 },
    ],
    warps: [{ x: 9, y: 11, to: 'school_hall', tx: 20, ty: 3, dir: 'down', se: 'door' }],
  });
  G.W1 && G.W1.flatChecks && G.W1.flatChecks(G.MAPS.c4_cafe);

  // ---------------------------------------------------------------
  //  c4_chase — 夜の運河通り（機体戦用, 44×22）
  // ---------------------------------------------------------------
  const RG = H.grid(44, 22, '-');
  RG.fill(0, 0, 44, 4, 'W').fill(0, 4, 44, 1, '=').fill(0, 16, 44, 1, '=');
  RG.fill(0, 17, 44, 1, 'R').fill(0, 18, 44, 3, '~').fill(0, 21, 44, 1, 'W');
  for (let x = 0; x < 44; x++) RG.set(x, 10, x % 4 < 2 ? '_' : '-');
  for (const x of [3, 11, 19, 27, 35, 42]) RG.set(x, 4, 'L').set(x, 16, 'L');
  G.defMap('c4_chase', {
    name: 'ミナト区・運河通り',
    area: '夜',
    bgm: 'chase',
    outdoor: true,
    time: 'night',
    mech: true,
    floor: '-',
    pal: { bigwall: '#3a3a58', walk: '#6a6478', road: '#2e2c3c' },
    rows: RG.rows(),
    objects: [
      { p: 'billboard', x: 6, y: 3, w: 5, text: 'CRADLE 7', col: '#4ef0ff' },
      { p: 'billboard', x: 22, y: 3, w: 6, text: 'NO.3 FEST', col: '#ff5fa2' },
      { p: 'billboard', x: 34, y: 3, w: 4, text: 'MOTHER', col: '#7dff9a' },
      { p: 'container', x: 14, y: 5, col: '#3a6ad0', text: 'C7' },
      { p: 'container', x: 30, y: 13, col: '#c04a3a', text: 'SCRAP' },
      { p: 'car', x: 2, y: 12, col: '#e04a4a' },
      { p: 'car', x: 38, y: 6, col: '#f0f0f0' },
    ],
    lights: [
      { x: 8, y: 19, r: 40, col: '#4ef0ff', a: 0.3 },
      { x: 30, y: 19, r: 40, col: '#ff5fa2', a: 0.3 },
    ],
  });
})();
