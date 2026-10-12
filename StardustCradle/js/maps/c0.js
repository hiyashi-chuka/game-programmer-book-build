// =============================================================
//  maps/c0.js — 序章「空のない空」用のマップ・小物・人物
//   c0_sim : AFシミュレーター〈VR-7〉の仮想空間（チュートリアル戦闘用）
//   人物（G.mob）・アイテム・訓練用フレームの定義
// =============================================================
(function () {
  const r = G.rect,
    px = G.px;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;

  // ---------------------------------------------------------------
  //  アイテム・機体
  // ---------------------------------------------------------------
  G.addItem('c0_rusk', { name: 'パンの耳ラスク', kind: 'use', hp: 30, price: 0, desc: '購買のおばちゃんがくれたおまけ。HPを30回復。' });
  // シミュレーター用の訓練フレーム（見た目のみ。性能はポンコツ号準拠）
  G.MECHS.c0_trainer = { name: '訓練フレーム〈VR-01〉', body: '#bfe8ff', accent: '#3a4ad0', accent2: '#ff5fa2', frame: '#4a5a8a', eye: '#7dff9a', head: 'visor', build: 'worker', stripes: true };

  // ---------------------------------------------------------------
  //  人物
  // ---------------------------------------------------------------
  G.mob('c0_daisuke', '工場のダイスケ', 501, { girl: false, old: false, over: { outfit: 'jumpsuit', top: '#5a7a9a', bottom: '#3a4a5a', acc: ['cap'], accCol: '#e08a30', build: 'big', beard: '#3a2a20' } });
  G.mob('c0_ume', '常連のウメばあちゃん', 502, { girl: true, old: true, over: { outfit: 'coat', top: '#a07aa0', acc: ['scarf'], accCol: '#ffd25e' } });
  G.mob('c0_mom', '買い物帰りのお母さん', 521, { girl: true, old: false, over: { outfit: 'coat', top: '#e08aa0' } });
  G.mob('c0_kid', '男の子のショウ', 522, { kid: true, girl: false, over: { top: '#4ac0e0', outfit: 'tshirt', bstyle: 'shorts' } });
  G.mob('c0_courier', '配達員のケンジ', 523, { girl: false, over: { outfit: 'jumpsuit', top: '#3ac0b0', bottom: '#2a4a4a', acc: ['cap'], accCol: '#ffd25e' } });
  G.mob('c0_otherjk', '他校の女子', 524, { girl: true, over: { top: '#c0d0f0', top2: '#e04a6a', outfit: 'uniform', bstyle: 'skirt' } });
  G.mob('c0_oldman', '散歩中のおじいさん', 525, { old: true, girl: false, over: { outfit: 'coat', top: '#6a7a5a', acc: ['cap'], accCol: '#4a4a3a' } });
  if (G.W2 && G.W2.student) {
    G.W2.student('c0_st1', '腹ペコ男子', 531, false, { style: 'buzz', hair: '#2a2a3a' });
    G.W2.student('c0_st2', 'メロンパン命の女子', 532, true, { style: 'twin', hair: '#c86a3a' });
    G.W2.student('c0_st3', '野球部の3年', 533, false, { style: 'spiky', hair: '#3a2a20', build: 'big' });
    G.W2.student('c0_st4', '1年の男子', 534, false, { style: 'messy', hair: '#5a4a8a' });
    G.W2.student('c0_st5', '購買マニアの女子', 535, true, { style: 'long', hair: '#e8b860', acc: ['glasses'], accCol: '#3a3a48' });
  }

  // ---------------------------------------------------------------
  //  小物：ホログラムの障害物
  // ---------------------------------------------------------------
  P.c0_holo = function (o) {
    const w = o.w || 1;
    const W = w * 16;
    const cv = mk(W, 30),
      c = cv.ctx;
    const col = o.col || '#4ef0ff';
    r(c, 1, 26, W - 2, 3, 'rgba(78,240,255,0.25)');
    r(c, 0, 4, W, 22, G.rgba(col, 0.28));
    r(c, 0, 4, W, 1, col);
    r(c, 0, 25, W, 1, col);
    r(c, 0, 4, 1, 22, col);
    r(c, W - 1, 4, 1, 22, col);
    for (let y = 7; y < 25; y += 3) r(c, 1, y, W - 2, 1, G.rgba(col, 0.18));
    r(c, 2, 6, W - 4, 2, 'rgba(255,255,255,0.35)');
    return { w, h: 1, img: cv, ox: 0, oy: -14, solid: true, lights: [{ x: W / 2, y: 2, r: 22, col, a: 0.5 }] };
  };
  // VR空間の床マーカー（スタート地点）
  P.c0_pad = function () {
    const cv = mk(48, 32),
      c = cv.ctx;
    G.ellipse(c, 24, 16, 22, 10, 'rgba(255,95,162,0.18)');
    G.ellipse(c, 24, 16, 16, 6, 'rgba(255,95,162,0.25)');
    G.pixText(c, 'START', 14, 13, '#ffd0e8');
    return { w: 3, h: 2, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };

  // ---------------------------------------------------------------
  //  AFシミュレーター〈VR-7〉 c0_sim（36×24）
  // ---------------------------------------------------------------
  const SG = G.W2.grid(36, 24, ' ');
  SG.fill(2, 2, 32, 20, 'a');
  G.defMap('c0_sim', {
    name: 'AFシミュレーター〈VR-7〉',
    area: '神経同調型・仮想訓練空間',
    bgm: 'space',
    light: '#c0b8ff',
    lightAlpha: 0.7,
    bg: '#04030c',
    ambient: 'echo',
    noParty: true,
    rows: SG.rows(),
    objects: [
      { p: 'c0_pad', x: 17, y: 17 },
      { p: 'c0_holo', x: 8, y: 7, w: 2 },
      { p: 'c0_holo', x: 26, y: 7, w: 2 },
      { p: 'c0_holo', x: 8, y: 15, w: 2, col: '#ff5fa2' },
      { p: 'c0_holo', x: 26, y: 15, w: 2, col: '#ff5fa2' },
      { p: 'c0_holo', x: 17, y: 11, w: 2, col: '#7dff9a' },
    ],
    decorate(c, m) {
      // 光るグリッドと外周
      for (let y = 2; y < 22; y++)
        for (let x = 2; x < 34; x++) {
          const X = x * 16,
            Y = y * 16;
          r(c, X, Y, 16, 1, 'rgba(78,240,255,0.10)');
          r(c, X, Y, 1, 16, 'rgba(78,240,255,0.10)');
          if ((x + y) % 7 === 0) px(c, X + 8, Y + 8, 'rgba(255,95,162,0.6)');
        }
      r(c, 2 * 16, 2 * 16, 32 * 16, 2, '#4ef0ff');
      r(c, 2 * 16, 22 * 16 - 2, 32 * 16, 2, '#ff5fa2');
      r(c, 2 * 16, 2 * 16, 2, 20 * 16, '#4ef0ff');
      r(c, 34 * 16 - 2, 2 * 16, 2, 20 * 16, '#ff5fa2');
      // 外の虚空に浮かぶデータの粒
      for (let i = 0; i < 220; i++) {
        const x = Math.floor(G.hash(i, 3, 70) * 36 * 16),
          y = Math.floor(G.hash(i, 4, 70) * 24 * 16);
        if (m.cell(x >> 4, y >> 4) !== ' ') continue;
        px(c, x, y, i % 5 ? 'rgba(120,140,255,0.5)' : '#ff9ac8');
      }
    },
    post(c, ox, oy, f) {
      // 走査線とHUD
      c.fillStyle = 'rgba(120,200,255,0.05)';
      for (let y = (f >> 1) % 4; y < G.H; y += 4) c.fillRect(0, y, G.W, 1);
      if (Math.floor(f / 40) % 2 === 0) G.pixText(c, 'VR-7  SIMULATION', G.W - 78, G.H - 10, '#7af8ff');
      if (f % 180 < 4) {
        c.fillStyle = 'rgba(255,95,162,0.35)';
        c.fillRect(0, (f * 37) % G.H, G.W, 2);
      }
    },
    lights: [
      { x: 18, y: 4, r: 90, col: '#4ef0ff', a: 0.35 },
      { x: 18, y: 19, r: 90, col: '#ff5fa2', a: 0.35 },
    ],
  });
})();
