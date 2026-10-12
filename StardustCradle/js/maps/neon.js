// =============================================================
//  maps/neon.js — ネオン通り・ゲーセン〈ギャラクシー〉・レディオ・スターダスト
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
  // 屋上の看板（足元は建物の最下段に置き、up で持ち上げる）
  P.w2_roofsign = function (o) {
    const w = o.w || 4,
      W = w * S;
    const up = o.up || 40;
    const col = o.col || '#ff5fa2';
    const cv = mk(W, 48 + up),
      c = cv.ctx;
    r(c, 6, 28, 2, 20, '#3a3a4a');
    r(c, W - 8, 28, 2, 20, '#3a3a4a');
    r(c, 6, 36, W - 12, 1, '#3a3a4a');
    r(c, 0, 2, W, 27, '#120e22');
    r(c, 1, 3, W - 2, 25, G.shade(col, -0.65));
    for (let j = 4; j < 27; j += 2) r(c, 1, j, W - 2, 1, G.shade(col, -0.55));
    const t = o.text || 'CRADLE 7';
    const sc = G.pixTextW(t, 2) < W - 8 ? 2 : 1;
    G.pixText(c, t, Math.round((W - G.pixTextW(t, sc)) / 2), 15 - (5 * sc) / 2, col, sc);
    if (o.text2) G.pixText(c, o.text2, Math.round((W - G.pixTextW(o.text2)) / 2), 22, '#ffffff');
    r(c, 0, 2, W, 1, col);
    r(c, 0, 28, W, 1, col);
    return { w, h: 1, img: cv, ox: 0, oy: 16 - cv.height, solid: false, lights: [{ x: W / 2, y: 16 - cv.height + 15, r: w * 11, col, a: 0.8, flicker: true }] };
  };
  // 電波塔（ラジオ局の屋上）
  P.w2_mast = function (o) {
    const H = o.h || 100,
      up = o.up || 0;
    const cv = mk(48, H + up),
      c = cv.ctx;
    const col = '#c8ccd8';
    for (let y = 0; y < H; y += 8) {
      const k = y / H,
        hw = 4 + Math.floor(k * 14);
      r(c, 24 - hw, y, 1, 8, col);
      r(c, 24 + hw, y, 1, 8, col);
      G.line(c, 24 - hw, y, 24 + hw, y + 8, '#8a8ea0');
      G.line(c, 24 + hw, y, 24 - hw, y + 8, '#8a8ea0');
      r(c, 24 - hw, y, hw * 2 + 1, 1, y % 16 ? col : '#e04a4a');
    }
    // パラボラ
    G.ellipse(c, 15, 30, 6, 7, '#e8e8f0');
    G.ellipse(c, 14, 30, 4, 5, '#b8bcc8');
    G.ellipse(c, 34, 50, 5, 6, '#e8e8f0');
    r(c, 23, 0, 3, 4, '#ff3050');
    const oy = 16 - H - up;
    return { w: 1, h: 1, img: cv, ox: -16, oy, solid: false, lights: [{ x: 8, y: oy + 2, r: 14, col: '#ff3050', a: 0.9, blink: true }, { x: 8, y: oy + H / 2, r: 10, col: '#ff3050', a: 0.7, blink: true }] };
  };
  // AFシミュレーターのポッド（2×2）
  P.w2_pod = function (o) {
    const col = o.col || '#4ef0ff';
    const cv = mk(32, 46),
      c = cv.ctx;
    r(c, 1, 42, 31, 4, 'rgba(0,0,0,0.4)');
    G.ellipse(c, 16, 26, 15, 17, '#2a2840');
    G.ellipse(c, 16, 25, 14, 16, '#e8eaf2');
    G.ellipse(c, 16, 24, 12, 13, '#c8ccd8');
    // キャノピー
    G.ellipse(c, 16, 20, 9, 8, G.shade(col, -0.55));
    G.ellipse(c, 16, 19, 7, 6, G.shade(col, -0.3));
    r(c, 12, 15, 4, 2, '#ffffff');
    r(c, 2, 34, 28, 4, col);
    r(c, 4, 38, 24, 4, '#3a3858');
    G.pixText(c, 'SIM', 10, 39, col);
    return { w: 2, h: 2, img: cv, ox: 0, oy: 32 - 46, solid: true, lights: [{ x: 16, y: 20, r: 26, col, a: 0.7, flicker: true }] };
  };
  // UFOキャッチャー
  P.w2_ufo = function (o) {
    const col = o.col || '#ff5fa2';
    const cv = mk(16, 34),
      c = cv.ctx;
    r(c, 1, 30, 15, 4, 'rgba(0,0,0,0.4)');
    r(c, 1, 0, 14, 4, col);
    r(c, 1, 4, 14, 16, '#9ad0f0');
    r(c, 2, 5, 12, 14, '#1a2040');
    r(c, 7, 5, 1, 5, '#c8ccd8');
    r(c, 5, 10, 5, 2, '#e8c050');
    for (let i = 0; i < 4; i++) G.ellipse(c, 4 + i * 3, 17, 2, 2, ['#ffd25e', '#7dff9a', '#ff8fb8', '#4ef0ff'][i]);
    r(c, 1, 20, 14, 11, G.shade(col, -0.4));
    r(c, 3, 22, 10, 3, '#2a2440');
    px(c, 5, 23, '#ff3050');
    r(c, 9, 23, 3, 1, '#ffd25e');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -18, solid: true, lights: [{ x: 8, y: -8, r: 16, col, a: 0.7, flicker: true }] };
  };
  // プリクラ機（2×2）
  P.w2_photobooth = function () {
    const cv = mk(32, 48),
      c = cv.ctx;
    r(c, 1, 44, 31, 4, 'rgba(0,0,0,0.4)');
    r(c, 0, 4, 32, 42, '#ff8fb8');
    r(c, 0, 4, 32, 3, '#ffc0d8');
    r(c, 3, 10, 26, 6, '#ffffff');
    G.pixText(c, 'PHOTO', 6, 11, '#ff5fa2');
    for (let i = 0; i < 6; i++) r(c, 4 + i * 4, 18, 3, 26, i % 2 ? '#c0407a' : '#e05a9a');
    for (let i = 0; i < 5; i++) px(c, 3 + i * 6, 6, '#ffffff');
    return { w: 2, h: 2, img: cv, ox: 0, oy: 32 - 48, solid: true, lights: [{ x: 16, y: 0, r: 24, col: '#ff8fb8', a: 0.6 }] };
  };
  // ミキサー卓（4×1）
  P.w2_mixer = function (o) {
    const w = o.w || 4,
      W = w * S;
    const cv = mk(W, 28),
      c = cv.ctx;
    r(c, 0, 24, W, 4, 'rgba(0,0,0,0.4)');
    r(c, 0, 8, W, 17, '#2a2436');
    r(c, 0, 8, W, 2, '#4a4458');
    r(c, 2, 2, W - 4, 9, '#3a3448');
    for (let i = 4; i < W - 4; i += 3) {
      r(c, i, 3, 1, 7, '#1a1424');
      r(c, i - 1, 4 + Math.floor(G.hash(i, 1, 2) * 5), 3, 1, '#e8e8f0');
    }
    // ターンテーブル
    for (const tx of [10, W - 10]) {
      G.ellipse(c, tx, 16, 7, 4, '#141018');
      G.ellipse(c, tx, 16, 5, 3, '#2a2236');
      px(c, tx, 16, '#ff5fa2');
    }
    for (let i = 0; i < 8; i++) px(c, W / 2 - 8 + i * 2, 14, ['#7dff9a', '#7dff9a', '#ffd25e', '#ff3050'][i % 4]);
    return { w, h: 1, img: cv, ox: 0, oy: -10, solid: true, lights: [{ x: W / 2, y: 4, r: 22, col: '#ff5fa2', a: 0.6, flicker: true }] };
  };
  // マイクスタンド
  P.w2_mic = function () {
    const cv = mk(16, 30),
      c = cv.ctx;
    r(c, 4, 27, 8, 3, 'rgba(0,0,0,0.4)');
    r(c, 7, 8, 2, 20, '#5a5a6a');
    r(c, 4, 27, 8, 2, '#3a3a48');
    G.line(c, 8, 8, 12, 4, '#5a5a6a');
    G.ellipse(c, 12, 3, 3, 3, '#8a8a9a');
    G.ellipse(c, 12, 3, 2, 2, '#c0c0d0');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -14, solid: true };
  };
  // レコード棚
  P.w2_records = function (o) {
    const w = o.w || 2,
      W = w * S;
    const cv = mk(W, 34),
      c = cv.ctx;
    r(c, 0, 0, W, 34, '#1a1424');
    r(c, 1, 1, W - 2, 32, '#3a2a3a');
    for (let j = 0; j < 3; j++) {
      const y = 2 + j * 10;
      r(c, 1, y + 8, W - 2, 2, '#5a4a5a');
      for (let i = 2; i < W - 2; i += 2) r(c, i, y + 1, 2, 7, ['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a', '#e8e8f0', '#a060ff', '#ff8040', '#2a2a3a'][Math.floor(G.hash(i, j, w) * 8)]);
    }
    return { w, h: 1, img: cv, ox: 0, oy: -18, solid: true };
  };
  // ソファ
  P.w2_sofa = function (o) {
    const w = o.w || 3,
      W = w * S;
    const col = o.col || '#7a3a6a';
    const cv = mk(W, 26),
      c = cv.ctx;
    r(c, 1, 22, W - 2, 4, 'rgba(0,0,0,0.35)');
    r(c, 0, 2, W, 12, G.shade(col, -0.15));
    r(c, 0, 2, W, 2, G.shade(col, 0.2));
    r(c, 0, 12, W, 10, col);
    r(c, 0, 12, W, 1, G.shade(col, 0.3));
    for (let i = S; i < W; i += S) r(c, i, 13, 1, 8, G.shade(col, -0.3));
    r(c, 0, 6, 4, 16, G.shade(col, -0.25));
    r(c, W - 4, 6, 4, 16, G.shade(col, -0.25));
    r(c, 6, 8, 8, 6, '#ffd25e');
    return { w, h: 1, img: cv, ox: 0, oy: -8, solid: true };
  };
  // ON AIR ランプ（壁）
  P.w2_onair = function () {
    const cv = mk(32, 12),
      c = cv.ctx;
    r(c, 0, 0, 32, 12, '#1a1018');
    r(c, 1, 1, 30, 10, '#e02040');
    G.pixText(c, 'ON AIR', 4, 4, '#ffe0e8');
    return { w: 2, h: 1, img: cv, ox: 0, oy: 4, solid: false, flat: true, lights: [{ x: 16, y: 10, r: 26, col: '#ff3050', a: 0.8, flicker: true }] };
  };
  // 壁のネオン管（屋内・色付き）
  P.w2_neonbar = function (o) {
    const w = o.w || 3,
      W = w * S;
    const col = o.col || '#ff5fa2';
    const cv = mk(W, 16),
      c = cv.ctx;
    r(c, 2, 6, W - 4, 2, col);
    r(c, 2, 5, W - 4, 1, G.shade(col, 0.4));
    if (o.text) G.pixText(c, o.text, Math.round((W - G.pixTextW(o.text)) / 2), 9, col);
    return { w, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true, lights: [{ x: W / 2, y: 8, r: Math.max(24, W / 2), col, a: 0.75, flicker: true }] };
  };
  // 占いロボのブース（2×1）
  P.w2_fortune = function () {
    const cv = mk(32, 48),
      c = cv.ctx;
    r(c, 1, 44, 31, 4, 'rgba(0,0,0,0.4)');
    r(c, 0, 8, 32, 38, '#5a2a6a');
    r(c, 0, 8, 32, 3, '#a05ac0');
    r(c, 3, 13, 26, 20, '#1a0a24');
    // ロボの顔
    G.ellipse(c, 16, 22, 8, 7, '#c8ccd8');
    r(c, 11, 20, 3, 3, '#4ef0ff');
    r(c, 18, 20, 3, 3, '#4ef0ff');
    r(c, 13, 25, 6, 1, '#3a3a48');
    r(c, 15, 12, 2, 4, '#c8ccd8');
    px(c, 15, 11, '#ff3050');
    // 水晶玉
    G.ellipse(c, 16, 37, 5, 4, '#a0e0ff');
    px(c, 14, 35, '#ffffff');
    r(c, 2, 2, 28, 7, '#ffd25e');
    G.pixText(c, 'FORTUNE', 3, 3, '#5a2a6a');
    return { w: 2, h: 1, img: cv, ox: 0, oy: 16 - 48, solid: true, lights: [{ x: 16, y: -12, r: 26, col: '#a05ac0', a: 0.8, flicker: true }, { x: 16, y: 6, r: 14, col: '#4ef0ff', a: 0.7 }] };
  };
  // ゴミ置き場のコンテナ（3×1）
  P.w2_dumpster = function (o) {
    const col = o.col || '#3a6a4a';
    const cv = mk(48, 30),
      c = cv.ctx;
    r(c, 2, 26, 46, 4, 'rgba(0,0,0,0.4)');
    r(c, 1, 8, 46, 19, col);
    r(c, 1, 8, 46, 2, G.shade(col, 0.25));
    for (let i = 4; i < 46; i += 6) r(c, i, 11, 1, 14, G.shade(col, -0.25));
    r(c, 0, 4, 48, 5, G.shade(col, -0.3));
    r(c, 6, 1, 10, 4, '#d0d0d8');
    r(c, 30, 2, 8, 3, '#8a5a3a');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -14, solid: true };
  };

  // ---------------------------------------------------------------
  //  ネオン通り neon（64×34）
  // ---------------------------------------------------------------
  const N = W2.grid(64, 34, ' ');
  N.fill(0, 12, 64, 9, 'n'); // 歩道＋通り
  N.fill(0, 14, 64, 5, '-').fill(0, 16, 64, 1, '_');
  N.fill(14, 14, 2, 5, 'z').fill(39, 14, 2, 5, 'z');
  N.fill(0, 26, 63, 7, 'c'); // 路地裏
  N.fill(0, 33, 64, 1, 'W').fill(63, 12, 1, 22, 'W');
  // 北側の建物のすき間（行き止まりの路地）
  N.fill(7, 6, 2, 6, 'n').fill(19, 6, 2, 6, 'n').fill(34, 7, 2, 5, 'n').fill(50, 5, 2, 7, 'n');
  // 南側の通路
  N.fill(7, 21, 2, 5, 'n').fill(31, 21, 2, 5, 'n').fill(52, 21, 2, 5, 'n');
  // 小物
  N.set(7, 7, 'C').set(8, 7, 'C').set(8, 8, 'Q').set(7, 10, 'j');
  N.set(19, 9, 'V').set(20, 9, 'V').set(19, 6, 'C');
  N.set(50, 6, 'Q').set(51, 6, 'C').set(51, 7, 'C').set(50, 10, 'j');
  [3, 22, 33, 45, 60].forEach((x) => N.set(x, 20, 'L'));
  N.set(1, 12, 'L').set(62, 12, 'L');
  N.set(10, 20, 'V').set(11, 20, 'V').set(48, 20, 'V').set(2, 20, 'Z');
  N.set(30, 20, 'j').set(55, 20, 'y');
  // 路地裏の散らかり
  [[1, 26, 'C'], [2, 26, 'C'], [1, 27, 'Q'], [12, 26, 'j'], [13, 26, 'j'], [18, 26, 'Q'], [24, 26, 'C'], [25, 26, 'C'], [24, 27, 'C'], [36, 26, 'j'], [42, 26, 'Q'], [43, 26, 'Q'], [47, 26, 'C'], [57, 26, 'j'], [61, 26, 'C'], [61, 27, 'C'], [62, 26, 'Q'], [5, 32, 'C'], [6, 32, 'Q'], [16, 32, 'j'], [27, 32, 'C'], [28, 32, 'C'], [34, 32, 'G'], [46, 32, 'Q'], [53, 32, 'C'], [58, 32, 'G'], [62, 32, 'C'], [62, 31, 'C'], [62, 30, 'Q']].forEach(([x, y, ch]) => N.set(x, y, ch));

  // 建物の足元は床にしておく（扉タイルが歩けるように）
  [[0, 7, 6], [9, 10, 8], [21, 7, 7], [28, 6, 6], [36, 7, 6], [43, 7, 7], [52, 10, 9]].forEach(([x, w, h]) => N.fill(x, 12 - h, w, h, 'n'));
  N.fill(0, 21, 63, 5, 'n');
  const nbld = (x, w, h, o) => Object.assign({ p: 'bldg', x, y: 12 - h, w, h, style: 'neon', neon: true }, o);
  const sbld = (x, w, o) => Object.assign({ p: 'bldg', x, y: 21, w, h: 5, style: 'neon', neon: true, roofCol: '#4a4460' }, o);
  const stallTalk = (who, opener, goods, title) => async () => {
    const k = await E.ask(who, typeof opener === 'function' ? opener() : opener, ['買う', 'やめる'], { cancel: 1 });
    if (k === 0) await E.shop(goods, title);
  };
  G.mob('w2_tako', 'たこ焼き屋のゲンジ', 201, { old: true, girl: false, over: { outfit: 'apron', top: '#3a3a48', top2: '#f0f0f0', acc: ['bandana'], accCol: '#e04a4a' } });
  G.mob('w2_candy', 'キャンディ屋のポップ', 202, { girl: true, old: false, kid: false, over: { outfit: 'dress', top: '#ff8fb8', top2: '#ffffff', hair: '#7dff9a', style: 'twin', acc: ['ribbon'], accCol: '#4ef0ff' } });
  G.mob('w2_donut', 'ドーナツ屋のマルコ', 203, { girl: false, old: false, kid: false, over: { outfit: 'apron', top: '#ffd25e', top2: '#ff8fb8', build: 'big', beard: '#5a3a2a' } });
  G.mob('w2_onigiri', 'おにぎり屋のサチ', 204, { girl: true, old: true, over: { outfit: 'apron', top: '#4a6a9a', top2: '#ffffff', acc: ['bandana'], accCol: '#ffffff' } });
  G.mob('w2_musician', '流しのジロー', 205, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#2a2a3a', top2: '#ff5fa2', acc: ['sunglasses'], accCol: '#141418', style: 'slick', hair: '#1a1a24' } });
  G.mob('w2_uranai', '占いロボ ハチベエ', 206, { girl: false, old: false, kid: false, voice: 1100, over: { skin: '#b8c0d8', hair: '#8a92a6', style: 'buzz', outfit: 'jumpsuit', top: '#a05ac0', bottom: '#5a2a6a', acc: ['antenna'], accCol: '#ff3050', iris: '#4ef0ff' } });
  G.mob('w2_punk1', 'ジャッカルズのモヒ', 207, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#c02030', top2: '#1a1a1a', style: 'spiky', hair: '#ffd25e', acc: ['sunglasses'], accCol: '#141418' } });
  G.mob('w2_punk2', 'ジャッカルズのチビ', 208, { girl: true, old: false, kid: false, over: { outfit: 'jacket', top: '#c02030', top2: '#1a1a1a', style: 'pixie', hair: '#ff5fa2', build: 'small' } });
  G.mob('w2_salary', 'くたびれた会社員', 209, { girl: false, old: false, kid: false, over: { outfit: 'suit', top: '#4a4a5a', top2: '#f0f0f0', tie: '#3a8ae0', acc: ['glasses'], accCol: '#c0c0d0' } });
  G.mob('w2_tourist', '観光客のエマ', 210, { girl: true, old: false, kid: false, over: { outfit: 'tshirt', top: '#ffd25e', acc: ['cap'], accCol: '#3a7ad0', bstyle: 'shorts' } });
  G.mob('w2_info', '路地裏の情報屋ネズミ', 211, { girl: false, old: false, kid: true, over: { outfit: 'hoodie', top: '#4a4a5a', top2: '#7a7a8a', style: 'messy', hair: '#8a7a6a' } });
  G.mob('w2_obaa', '夜の散歩のキヨばあ', 213, { girl: true, old: true, over: { outfit: 'coat', top: '#a05a7a', acc: ['scarf'], accCol: '#ffd25e' } });
  G.mob('w2_courier', '配達少年ビン', 214, { girl: false, old: false, kid: true, over: { outfit: 'jacket', top: '#ffd25e', top2: '#2a2a3a', acc: ['cap'], accCol: '#e04a4a' } });
  G.mob('w2_cleaner', '清掃ロボの番人ガンジ', 212, { girl: false, old: true, over: { outfit: 'jumpsuit', top: '#e08a30', bottom: '#4a4a5a', acc: ['helmet'], accCol: '#ffd25e' } });

  W2.stall_tako = stallTalk('w2_tako', () => G.byCh({ 0: 'へいらっしゃい！　コロニー名物、合成ダコのたこ焼きだ！　……本物のタコ？　見たことねえな！', 5: '外出制限の前に食ってきな！　腹が減っては、なんとやらだ。', 8: 'こんな夜こそ、熱々のたこ焼きだ！　お代はいらねえ……とは言えねえが、安くしとくぜ！' }), ['onigiri', 'soda'], 'たこ焼き〈ゲンジ〉');
  W2.stall_candy = stallTalk('w2_candy', () => G.byCh({ 0: 'いらっしゃーい☆　光るネオンキャンディ、なめると舌が光るよ！', 2: '白い髪の女の子が、キャンディを10本も買ってったの！　かわいかった〜☆', 9: 'ニコちゃん、今日も来てくれたよ！　常連さん第1号☆' }), ['candy', 'soda', 'energy'], 'ネオンキャンディ〈ポップ〉');
  W2.stall_donut0 = stallTalk('w2_donut', () => G.byCh({ 0: 'ハロー！　マルコのドーナツ、宇宙一ふわふわ！　限定の「ネオン・リング」は1日10個だけね！', 5: '限定ドーナツ？　材料が届かなくて、作れない日もあるんだ……。', 9: '新作「ほんとうの空ドーナツ」！　青いアイシングがポイントさ！' }), ['melonpan', 'candy', 'soda'], 'マルコのドーナツ');
  W2.stall_onigiri = stallTalk('w2_onigiri', () => G.byCh({ 0: 'おにぎりあるよ。具はシャケ……の味がする何か。おいしいのは保証するよ。', 3: 'デュエル帰りの子たちがよく買っていくのさ。腹ペコの機体乗りには、米が一番！', 7: 'こんな時でも店は開けるよ。避難する人の腹を満たすのが、あたしの仕事さ。' }), ['onigiri', 'soda', 'energy'], 'おにぎり〈サチ〉');
  W2.stall_donut = async function () {
    if (W2.donutQuest && (await W2.donutQuest())) return;
    await W2.stall_donut0();
  };
  W2.uranai = async function () {
          if (await W2.rumor(2, 'w2_uranai', 'ピピ……七不思議ノ データ ヲ 検索。……「ネオン通リノ 占イロボハ 未来ノ 日付ヲ 口ニスル」。……ソレ、ワタシ デス。S.C.0091。……ナゼカ 時々 ソノ数字ガ 出力 サレマス。')) return;
          await W2.lines('w2_uranai', {
            0: ['ピピピ！　ヨウコソ、迷エル子羊。今日ノ アナタノ 運勢ハ……「大吉。タダシ 遅刻ニ 注意」。', 'ラッキーアイテムハ「スパナ」デス。……イツモ 持ッテマスネ。'],
            1: 'ピピ……地面ガ 揺レルト 占イガ ブレマス。……今日ノ 運勢ハ「白イ影ニ 出会ウ」。',
            2: 'アナタノ 家ニ 新シイ 星ガ 来タト 出テイマス。……大事ニ シテクダサイ。',
            3: '運勢……「赤イ炎ト 戦ウ」。ラッキーカラーハ ピンク。ラッキーアイテムハ 修理キット。',
            4: '今日ノ 運勢ハ……「祭リノ後ニ 嵐」。……エラー。モウ一度……「嵐」。',
            5: 'ピピ……占イ結果ガ 暗クテ 出力デキマセン。……キャンディ ヲ ドウゾ。',
            6: 'アナタハ モウスグ 「懐カシイ 誰カ」ニ 会イマス。……ピピ……涙ノ データヲ 検出。',
            7: 'ピピピ……全テノ 占イガ 同ジ 結果ヲ 示シテイマス。「アナタ次第」。',
            8: '運勢……「星ノ歌ガ 聞コエル」。ワタシニモ、聞コエマス。',
            9: '今日ノ 運勢ハ 大吉。明日モ 大吉。……ワタシ、壊レテマセンヨ？',
          })();
        };
  G.defMap('neon', {
    name: 'ネオン通り',
    bgm: 'neon',
    time: 'night',
    ambient: 'neon',
    floor: 'n',
    bg: '#07051a',
    pal: { road: '#2a2640', concrete: '#3e3a50', bigwall: '#4a4460', walk: '#4a4258' },
    rows: N.rows(),
    parallax(c, cam, frame) {
      if (!W2._neonSky) {
        const W = 720,
          Hh = 200;
        const cv = mk(W, Hh),
          cc = cv.ctx;
        for (let y = 0; y < Hh; y++) r(cc, 0, y, W, 1, G.shade('#0c0824', Math.min(0.5, y / 400)));
        for (let i = 0; i < 90; i++) px(cc, Math.floor(G.hash(i, 1, 3) * W), Math.floor(G.hash(i, 2, 3) * 60), i % 6 ? '#3a3a7a' : '#ffd890');
        for (let x = 0; x < W; x += 6) {
          const h = 30 + Math.floor(G.hash(x, 4, 5) * 70);
          const col = G.pick(['#1a1434', '#20183c', '#161230']);
          r(cc, x, Hh - h, 6, h, col);
          for (let y = Hh - h + 3; y < Hh; y += 4) if (G.hash(x, y, 6) > 0.72) r(cc, x + 1 + (y % 3), y, 2, 1, G.pick(['#ff5fa2', '#4ef0ff', '#ffd890', '#a060ff']));
        }
        for (let k = 0; k < 6; k++) {
          const bx = Math.floor(G.hash(k, 7, 8) * (W - 40)),
            by = 90 + Math.floor(G.hash(k, 9, 8) * 50);
          const col = ['#ff5fa2', '#4ef0ff', '#ffd25e'][k % 3];
          r(cc, bx, by, 30, 12, G.shade(col, -0.6));
          r(cc, bx, by, 30, 1, col);
          r(cc, bx, by + 11, 30, 1, col);
        }
        W2._neonSky = cv;
      }
      const ox = -Math.round(cam.x * 0.25) % 720;
      c.drawImage(W2._neonSky, ox, -Math.round(cam.y * 0.3));
      c.drawImage(W2._neonSky, ox + 720, -Math.round(cam.y * 0.3));
    },
    objects: [
      // 北側
      nbld(0, 7, 6, { sign: 'CAFE', signCol: '#1a1030', signText: '#4ef0ff', neonTube: '#4ef0ff', door: 3, wall: '#3a3a5a', msg: '夜カフェ〈ルナ〉。窓ぎわの席で、カップルが向こう側の街の夜景を見ている。……満席だ。' }),
      nbld(9, 10, 8, { sign: 'GALAXY', signScale: 2, signCol: '#1a1030', signText: '#ff5fa2', neonTube: '#ff5fa2', door: 5, wall: '#2e2648', to: 'arcade', tx: 14, ty: 15, dir: 'up', antenna: true }),
      nbld(21, 7, 7, { sign: 'KARAOKE', signCol: '#1a1030', signText: '#ffd25e', neonTube: '#a060ff', door: 3, wall: '#3a2c50', msg: 'カラオケ〈スターボックス〉。「ただいま全室満室　待ち時間：2時間」' }),
      nbld(28, 6, 6, { style: 'shop', wall: '#4a2a2a', sign: 'NOODLE', signCol: '#c03a3a', awning: '#c03a3a', doorType: 'noren', norenText: 'MEN', norenCol: '#c03a3a', door: 3, msg: 'ラーメン〈銀河軒〉。「星屑亭には負けん！」と書いた紙が貼ってある。……ばあちゃんへの対抗心らしい。' }),
      nbld(36, 7, 6, { sign: 'RECORDS', signCol: '#101a14', signText: '#7dff9a', neonTube: '#7dff9a', door: 3, wall: '#2a3a3a', msg: 'レコード屋〈グルーヴ・オービット〉。店の奥から、古いシティポップが流れてくる。' }),
      nbld(43, 7, 7, { style: 'shop', wall: '#e8dcc8', sign: 'DINER', signCol: '#c03a3a', signText: '#ffffff', awning: '#4ef0ff', door: 3, vending: 6, msg: 'ダイナー〈ムーンボウル〉。24時間営業。看板メニューは「重力ゼロ・パンケーキ」。' }),
      nbld(52, 10, 9, { style: 'tower', wall: '#4a4268', wallH: 4, sign: 'RADIO STARDUST', signCol: '#140c20', signText: '#ff5fa2', neon: true, neonTube: '#4ef0ff', door: 4, doorType: 'neon', to: 'radio_booth', tx: 9, ty: 10, dir: 'up' }),
      { p: 'w2_mast', x: 58, y: 11, h: 80, up: 96 },
      { p: 'neonsign', x: 6, y: 11, text: 'BAR', col: '#4ef0ff', nosolid: true },
      { p: 'neonsign', x: 20, y: 11, text: 'GAME', col: '#ff5fa2' },
      { p: 'neonsign', x: 27, y: 11, text: 'POP', col: '#ffd25e' },
      { p: 'neonsign', x: 42, y: 11, text: 'HIFI', col: '#7dff9a' },
      { p: 'neonsign', x: 51, y: 11, text: 'ON AIR', col: '#ff3050' },
      { p: 'w2_fortune', x: 34, y: 9, talk: async () => await W2.uranai() },
      // 屋台（北の歩道）
      { p: 'stall', x: 3, y: 13, text: 'TAKOYAKI', col: '#c03a3a', talk: async () => await W2.stall_tako() },
      { p: 'stall', x: 16, y: 13, text: 'CANDY', col: '#ff5fa2', talk: async () => await W2.stall_candy() },
      { p: 'stall', x: 25, y: 13, text: 'DONUT', col: '#d0902a', talk: async () => await W2.stall_donut() },
      { p: 'stall', x: 47, y: 13, text: 'ONIGIRI', col: '#4a6a9a', talk: async () => await W2.stall_onigiri() },
      // 南側（裏口は路地裏向き）
      sbld(0, 7, { sign: 'MANGA', signCol: '#141020', signText: '#ffd25e', door: 3, msg: '漫画喫茶〈コミック・ネビュラ〉の裏口。「関係者以外立入禁止」' }),
      sbld(9, 12, { sign: 'BOWLING', signCol: '#141020', signText: '#4ef0ff', door: 5, msg: 'ボウリング場〈ストライク・ムーン〉の裏口。ピンの倒れる音が響いてくる。' }),
      sbld(21, 10, { sign: 'STUDIO', signCol: '#141020', signText: '#ff5fa2', door: 5, msg: 'ダンススタジオの裏口。床を踏み鳴らす音が、ネオン通りのBGMと混ざっている。' }),
      sbld(33, 12, { sign: 'LAUNDRY', signCol: '#141020', signText: '#7dff9a', door: 6, msg: 'コインランドリーの裏口。あたたかい風と、せっけんの匂い。' }),
      sbld(45, 7, { sign: 'PARTS', signCol: '#141020', signText: '#ffd25e', door: 3, msg: '中古パーツ屋の裏口。「ジャンクパーツ高価買取」の貼り紙。……ドクの店の方が高く買ってくれる。' }),
      sbld(54, 9, { sign: 'SHOP 24', signCol: '#141020', signText: '#4ef0ff', door: 4, msg: '24時間ストアの搬入口。段ボールが山積みだ。' }),
      { p: 'w2_roofsign', x: 10, y: 25, w: 5, up: 32, text: 'COLA', text2: 'COLONY FIZZ', col: '#ff5fa2' },
      { p: 'w2_roofsign', x: 22, y: 25, w: 6, up: 32, text: 'AF LEAGUE', text2: 'JUNK DUEL', col: '#4ef0ff' },
      { p: 'w2_roofsign', x: 35, y: 25, w: 5, up: 32, text: 'MOTHER', text2: 'WE CARE 4 U', col: '#ffd25e' },
      { p: 'w2_roofsign', x: 55, y: 25, w: 5, up: 32, text: '88.5', text2: 'RADIO SD', col: '#a060ff' },
      { p: 'neonsign', x: 6, y: 20, text: 'EAT', col: '#ff5fa2' },
      { p: 'neonsign', x: 20, y: 20, text: 'BOWL', col: '#4ef0ff' },
      { p: 'neonsign', x: 44, y: 20, text: 'WASH', col: '#7dff9a' },
      { p: 'neonsign', x: 53, y: 20, text: '24H', col: '#ffd25e' },
      { p: 'car', x: 33, y: 18, col: '#ff5fa2' },
      { p: 'car', x: 57, y: 14, col: '#3a3a5a' },
      { p: 'car', x: 21, y: 14, col: '#4ef0ff' },
      // 路地裏
      { p: 'w2_dumpster', x: 19, y: 26, col: '#3a6a4a' },
      { p: 'w2_dumpster', x: 33, y: 26, col: '#4a5a8a' },
      { p: 'pipe', x: 20, y: 32, w: 6, col: '#6a6a7a' },
      { p: 'pipe', x: 48, y: 32, w: 4, col: '#7a6a5a' },
      { p: 'crate', x: 30, y: 30, col: '#8a6a4a' },
      { p: 'barrel', x: 9, y: 30, hazard: true },
      { p: 'bicycle', x: 44, y: 29, col: '#ff5fa2' },
      { p: 'sign', x: 60, y: 29, text: 'NO ENTRY', col: '#c03a3a', msg: '「この先　私有地」……木箱が積み上がっている。' },
    ],
    lights: [
      { x: 14, y: 13, r: 60, col: '#ff5fa2', a: 0.35 },
      { x: 4, y: 16, r: 50, col: '#4ef0ff', a: 0.25 },
      { x: 24, y: 16, r: 50, col: '#a060ff', a: 0.3 },
      { x: 33, y: 16, r: 50, col: '#ff8050', a: 0.25 },
      { x: 39, y: 16, r: 50, col: '#7dff9a', a: 0.25 },
      { x: 46, y: 16, r: 50, col: '#4ef0ff', a: 0.3 },
      { x: 56, y: 15, r: 70, col: '#ff5fa2', a: 0.35 },
      { x: 12, y: 29, r: 40, col: '#7dff9a', a: 0.3, flicker: true },
      { x: 34, y: 29, r: 46, col: '#ff5fa2', a: 0.3, flicker: true },
      { x: 52, y: 29, r: 40, col: '#4ef0ff', a: 0.3, flicker: true },
      { x: 3, y: 29, r: 30, col: '#ffd25e', a: 0.4, flicker: true },
    ],
    decorate(c, m) {
      // 濡れた路面のネオンの映り込み
      const refl = [[14, '#ff5fa2'], [24, '#a060ff'], [39, '#7dff9a'], [46, '#4ef0ff'], [56, '#ff5fa2'], [4, '#4ef0ff']];
      for (const [x, col] of refl)
        for (let k = 0; k < 14; k++) {
          const yy = 14 * 16 + 4 + k * 5;
          r(c, x * 16 + 2 + ((k * 7) % 9), yy, 6 + (k % 3) * 3, 1, G.rgba(col, 0.35 - k * 0.02));
        }
      // 路地裏の壁の落書き
      const gx = [[3, '#ff5fa2', 'SD'], [17, '#4ef0ff', 'JACKALS'], [27, '#ffd25e', 'NIKO?'], [42, '#7dff9a', 'FREE SKY'], [56, '#a060ff', 'GIL #1']];
      for (const [x, col, t] of gx) {
        G.pixText(c, t, x * 16 + 2, 33 * 16 + 4, col, 1);
        r(c, x * 16, 33 * 16 + 11, G.pixTextW(t) + 4, 1, G.rgba(col, 0.6));
      }
      // 水たまり
      for (const [x, y] of [[5, 29], [22, 30], [33, 28], [50, 31], [58, 28]]) {
        G.ellipse(c, x * 16 + 8, y * 16 + 8, 10, 3, 'rgba(70,90,160,0.55)');
        G.ellipse(c, x * 16 + 6, y * 16 + 7, 4, 1, 'rgba(255,95,162,0.5)');
      }
    },
    npcs: [
      { id: 'w2_tako', char: 'w2_tako', x: 4, y: 12, dir: 'down', move: 'still', noFace: true, talk: async () => await W2.stall_tako() },
      { id: 'w2_candy', char: 'w2_candy', x: 17, y: 12, dir: 'down', move: 'still', show: W2.town, talk: async () => await W2.stall_candy() },
      { id: 'w2_donut', char: 'w2_donut', x: 26, y: 12, dir: 'down', move: 'still', show: W2.town, talk: async () => await W2.stall_donut() },
      { id: 'w2_onigiri', char: 'w2_onigiri', x: 48, y: 12, dir: 'down', move: 'still', talk: async () => await W2.stall_onigiri() },
      {
        id: 'w2_musician', char: 'w2_musician', x: 26, y: 19, dir: 'down', move: 'still', show: W2.town,
        talk: async () => {
          G.audio.se('ok');
          await W2.lines('w2_musician', {
            0: ['♪ネオンの海を〜泳ぐ魚は〜空を知らない〜♪', '……おっと、聴いてくれてサンキュー。投げ銭は気持ちでいいぜ。'],
            1: '♪揺れる街〜揺れる心〜♪……ゆうべの揺れで、ギターの弦が切れちまった。',
            2: '新曲のテーマは「迷子の星」。……最近、そんな子を見たって噂を聞いてね。',
            3: '♪鉄の拳で〜明日をつかめ〜♪……デュエルの入場曲、オレに作らせてくれねえかな。',
            4: '文化祭のステージ？　中学生に混ざって歌っていいなら、喜んで。',
            5: '外出制限でお客が減った。……でも、歌うのはやめねえ。誰かが聴いてるかもしれないからな。',
            6: '♪仮面の下で〜泣いてる誰か〜♪……なんでこんな歌詞が浮かんだんだろうな。',
            8: '♪暗い空でも〜歌は届く〜♪　……リリィの放送、聴いたか？　オレ、泣いちまったよ。',
            9: '♪おはよう、ほんとうの空〜♪……新曲だ。おまえらのために作った。',
          })();
        },
      },
      {
        id: 'w2_punk1', char: 'w2_punk1', x: 11, y: 14, dir: 'right', move: 'still', show: () => W2.town() && G.state.chapter >= 1 && G.state.chapter <= 6,
        talk: W2.lines('w2_punk1', {
          1: ['あぁん？　ここはネオン・ジャッカルズのシマだぜ。……中学生はさっさと帰んな。', '……ゲーセンは誰でも入っていい。ギルさんがそう決めてるからな。'],
          2: '公安の連中がうろついてやがる。……オレらのせいじゃねえからな！',
          3: 'スターダスト？　ハッ、ギルさんに勝てるもんかよ。……でもまあ、根性は認めてやる。',
          4: 'ギルさんが「文化祭に行く」ってソワソワしてんだ。……オレも行っていいかな。',
          5: 'ギルさんが言ってた。「ガキどもを守れ」ってな。……だから、ここで見張ってんだよ。',
          6: '黒い機体の噂？　ギルさんでも勝てねえかもって……いや、そんなはずねえ！',
        }),
      },
      {
        id: 'w2_punk2', char: 'w2_punk2', x: 12, y: 15, dir: 'up', move: 'still', show: () => W2.town() && G.state.chapter >= 1 && G.state.chapter <= 6,
        talk: W2.lines('w2_punk2', {
          1: 'あたしはチビじゃない！　……あ、名前？　チビです。',
          2: 'ゲーセンのAFシミュで、あたし店内2位なんだから！　1位はカナタってやつ。……誰それ。',
          3: 'あんたがカナタ！？　シミュのスコア、どうやったらあんな数字出るのよ！　教えなさいよ！',
          4: 'ジャッカルズでも文化祭やりたいって言ったら、モヒがお化け役やるって。……似合いすぎ。',
          5: '夜のネオン通り、人がいなくて寂しいね。……ギルさんも最近、元気ない。',
          6: 'ギルさんが新しいブレード研いでる。……あんたたちのために、だって。',
        }),
      },
      {
        id: 'w2_salary', char: 'w2_salary', x: 36, y: 17, dir: 'left', move: 'wander', range: 3, show: W2.town,
        talk: W2.lines('w2_salary', {
          0: ['はぁ……今日も残業。〈マザー〉の管理データ入力、終わらないんだよなあ。', '君たちは中学生？　……いいなあ。今が一番いい時だよ。'],
          1: '会社で「揺れの件は口外しないように」って言われた。……言うなって言われると、言いたくなるよね。',
          2: '最近、回転データの入力値がおかしいんだ。誤差の範囲……って上司は言うけど。',
          3: '仕事帰りにジャンク・デュエルを見るのが、唯一の楽しみさ。スターダストってクランを応援してる！',
          5: '会社のデータ、一部が「機密」になった。……僕はただの入力係なのに。',
          6: '辞表を書いたんだ。……出す勇気はまだないけど。',
          7: null,
          8: '会社のデータ、全部リリィの放送に流してやった。……クビ？　知ったことか。',
          9: '会社、辞めたよ。今はダイナーでパンケーキ焼いてる。……案外、向いてるみたいだ。',
        }),
      },
      {
        id: 'w2_tourist', char: 'w2_tourist', x: 49, y: 17, dir: 'up', move: 'wander', range: 2, show: () => W2.town() && G.state.chapter !== 5 && G.state.chapter !== 6,
        talk: W2.lines('w2_tourist', {
          0: ['ハイ！　わたし、L5コロニーから観光に来たの！　ネオン通り、写真で見るよりずっと素敵！', 'クレイドル7って、空に街が浮いてるのね。……わたしのコロニーは、窓から地球が見えるのよ。'],
          1: '揺れた！？　これがクレイドル7名物の……え、名物じゃないの？',
          3: 'ジャンク・デュエル、観光ガイドに「非公式名所」って載ってたわ！',
          4: '文化祭のラーメン、おいしかった！　ガイドブックに書いておくわね！',
          8: '帰りの便が止まってるの。……でも不思議ね、ちっとも怖くないわ。この街の人たち、強いもの。',
          9: 'もう少しだけ、滞在を延ばすことにしたの。……この街の「ほんとうの空」、見てみたくて。',
        }),
      },
      {
        id: 'w2_obaa', char: 'w2_obaa', x: 8, y: 17, dir: 'right', move: 'wander', range: 3, show: W2.town,
        talk: W2.lines('w2_obaa', {
          0: ['夜の散歩はいいねえ。ネオンが星のかわりさ。', 'わたしの若い頃はね、このあたりは全部、宇宙港の倉庫だったんだよ。'],
          1: '揺れたねえ。……昔、戦争の頃にもこんな揺れがあった。いやだねえ。',
          2: '白い髪の子を見たよ。キャンディ屋の前で、目をまんまるにしてた。かわいいねえ。',
          3: '孫がロボットの喧嘩に夢中でね。……わたしも観に行こうかしら。',
          5: '夜の散歩が禁止だなんて。……でも、ばあさんは言うことを聞かないものさ。',
          8: '暗い夜には慣れっこさ。わたしたちは、戦争の夜も越えてきたからね。',
          9: '朝の散歩に切りかえたのさ。……本物みたいな、いい朝だねえ。',
        }),
      },
      {
        id: 'w2_courier', char: 'w2_courier', x: 44, y: 15, dir: 'left', move: 'pace', range: 4, speed: 1.0, show: W2.town,
        talk: W2.lines('w2_courier', {
          0: ['配達中！　ネオン通りの裏道は全部覚えてるんだ。', '星屑亭の出前持ちのカナタって人、ライバルだと思ってる！'],
          1: '公安の検問で、配達が10分遅れた！　……ラーメンがのびる！',
          3: 'アンダーシェルにも配達してるよ。ロボットの喧嘩の観客、みんな腹ペコなんだ。',
          5: '外出制限でも、配達は止めない。待ってる人がいるからね。',
          7: '避難所に水を配ってる！　こんな時こそ、配達少年の出番さ！',
          9: '配達ルート、空のほうまで伸ばしたいなあ。',
        }),
      },
      {
        id: 'w2_info', char: 'w2_info', x: 50, y: 29, dir: 'left', move: 'still', show: W2.town,
        talk: W2.lines('w2_info', {
          0: ['よう、表通りの子。ここは路地裏だぜ。……情報が欲しけりゃ、キャンディ1本。', '……冗談だよ。タダで教えてやる。ゲーセンのAFシミュ、裏コマンドがあるらしいぜ。'],
          1: '公安の機体が、スクラップ・ベイの方に何機も向かってた。……何を探してるんだろうな。',
          2: '公安が「白い髪の少女」を探してる。……オレは何も見てない。何も聞いてない。な？',
          3: 'アンダーシェルの受付はスクラップ・ベイの古いエレベーターの下だ。……まあ、もう知ってるか。',
          4: '公安の装甲車が学校の近くに停まってた。……気をつけな。',
          5: '路地裏は今、一番安全な場所さ。公安も、こんな汚いとこには来ない。',
          6: '黒い機体のパイロット、研究所から出てくるのを見たやつがいる。……情報料は、もういらねえよ。',
          8: 'オレみたいなガキでも、避難所の案内くらいはできる。……おまえらに負けてらんねえからな。',
          9: '情報屋は廃業だ。……今度、学校ってとこに行ってみようと思ってる。',
        }),
      },
      {
        id: 'w2_cleaner', char: 'w2_cleaner', x: 29, y: 28, dir: 'down', move: 'pace', range: 3, show: W2.town,
        talk: W2.lines('w2_cleaner', {
          0: ['路地裏の掃除は、ワシの仕事じゃ。……昔はジャンク屋でな、ドクとは腐れ縁よ。', 'この辺の木箱には、昔の落とし物がまだ眠っとる。カセットテープとかな。'],
          3: 'デュエル帰りの若いのが、ここでたむろしとる。ゴミは持ち帰れと言うとるのに。',
          5: '夜の巡回が増えて、掃除がはかどらんわい。',
          8: 'ネオンが消えた街なんぞ、見とうなかった。……早く灯りを戻しておくれ。',
          9: 'ネオンが戻った。……ワシの仕事もな。ありがたいことじゃ。',
        }),
      },
    ],
    items: [{ x: 62, y: 28, item: 'memory', id: 'mem_14' }],
    events: W2.memEvents([[62, 28]]),
    warps: [{ x: 0, y: 15, w: 1, h: 3, to: 'minato', tx: 69, ty: 23, dir: 'left' }],
    onEnter: W2.memEnter,
  });

  // ---------------------------------------------------------------
  //  ゲーセン〈ギャラクシー〉 arcade（30×18）
  // ---------------------------------------------------------------
  const AR = W2.grid(30, 18, 'w');
  AR.fill(1, 3, 28, 14, 'k').fill(14, 17, 2, 1, 'k');
  [3, 4, 5, 6, 7, 8, 9].forEach((x) => {
    AR.set(x, 5, 'U').set(x, 10, 'U').set(x, 15, 'U');
  });
  AR.set(1, 3, 'V').set(28, 16, 'j').set(1, 16, 'P').set(12, 16, 'j');
  G.mob('w2_king', '格ゲー王ダイゴロウ', 221, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#3a3a5a', top2: '#ffd25e', build: 'big', acc: ['headphones'], accCol: '#ffd25e', style: 'buzz' } });
  G.mob('w2_simkid', 'シミュ少年ハルト', 222, { girl: false, kid: true, over: { outfit: 'hoodie', top: '#4ef0ff', top2: '#2a2a3a', acc: ['goggles'], accCol: '#ff8a30' } });
  G.mob('w2_prize', '景品係のアカリ', 223, { girl: true, old: false, kid: false, over: { outfit: 'jacket', top: '#ff5fa2', top2: '#1a1a2a', style: 'ponytail', hair: '#4ef0ff' } });
  G.mob('w2_ufogirl', 'UFOキャッチャーの鬼ナナ', 224, { girl: true, old: false, kid: false, over: { outfit: 'dress', top: '#a060ff', top2: '#ffffff', style: 'twin', hair: '#ffd25e', acc: ['ribbon'], accCol: '#ff5fa2' } });
  G.mob('w2_manager', 'ゲーセン店長ゴトウ', 225, { girl: false, old: true, over: { outfit: 'suit', top: '#2a2a3a', top2: '#ff5fa2', tie: '#ff5fa2', acc: ['sunglasses'], accCol: '#141418', style: 'slick' } });
  G.mob('w2_rhythm', 'ダンスゲームのリズ', 226, { girl: true, old: false, kid: false, over: { outfit: 'tank', top: '#7dff9a', bottom: '#2a2a40', bstyle: 'shorts', style: 'ponytail', hair: '#ff8040', acc: ['headphones'], accCol: '#ffffff' } });
  G.defMap('arcade', {
    name: 'ゲーセン〈ギャラクシー〉',
    bgm: 'neon',
    floor: 'k',
    light: '#4a3c7a',
    lightAlpha: 1,
    ambient: 'neon',
    pal: { wall: '#2e2848', wallTop: '#120e22', checkA: '#3a3060', checkB: '#1c1834', baseboard: '#ff5fa2' },
    rows: AR.rows(),
    objects: [
      ...[3, 4, 5, 6, 7, 8, 9].map((x, i) => ({ p: 'arcade', x, y: 4, col: ['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a', '#ff5fa2', '#a060ff', '#4ef0ff'][i] })),
      ...[3, 4, 5, 6, 7, 8, 9].map((x, i) => ({ p: 'arcade', x, y: 9, col: ['#ffd25e', '#7dff9a', '#ff5fa2', '#4ef0ff', '#a060ff', '#ffd25e', '#ff5fa2'][i] })),
      ...[3, 4, 5, 6, 7, 8, 9].map((x, i) => ({ p: 'arcade', x, y: 14, col: ['#4ef0ff', '#ff5fa2', '#7dff9a', '#ffd25e', '#4ef0ff', '#ff8040', '#a060ff'][i] })),
      { p: 'w2_pod', x: 12, y: 4, col: '#4ef0ff', msg: 'AFシミュレーター〈ギャラクシー・パイロット〉。ランキング1位「KANATA」、2位「RUU」、3位「CHIBI」。' },
      { p: 'w2_pod', x: 15, y: 4, col: '#ff5fa2', msg: 'AFシミュレーター。「対戦相手を待っています……」' },
      { p: 'w2_pod', x: 18, y: 4, col: '#7dff9a', msg: 'AFシミュレーター。座席に「ハルト専用」と書いた紙が貼ってある。' },
      { p: 'w2_pod', x: 12, y: 8, col: '#ffd25e' },
      { p: 'w2_pod', x: 15, y: 8, col: '#a060ff' },
      { p: 'w2_pod', x: 18, y: 8, col: '#4ef0ff', msg: 'AFシミュレーター。画面に「STARDUST CRADLE」というタイトルが流れている。' },
      { p: 'shelf', x: 22, y: 3, w: 6, col: '#5a3a6a', msg: '景品棚。ロボット猫のぬいぐるみ、光るヨーヨー、そして「ハルカゼ」のプラモデル……！？' },
      { p: 'counter', x: 22, y: 6, w: 5, col: '#3a2a4a', top: '#ff8fb8' },
      { p: 'w2_ufo', x: 21, y: 10, col: '#ff5fa2', msg: 'UFOキャッチャー。アームが弱い。……ものすごく弱い。' },
      { p: 'w2_ufo', x: 23, y: 10, col: '#4ef0ff', msg: 'UFOキャッチャー。中身は「ネジ」のぬいぐるみ。ドクが見たら怒りそうだ。' },
      { p: 'w2_ufo', x: 25, y: 10, col: '#ffd25e' },
      { p: 'w2_ufo', x: 27, y: 10, col: '#7dff9a' },
      { p: 'w2_photobooth', x: 21, y: 13, msg: 'プリクラ機。落書きコーナーに「スターダスト結成記念」の文字が残っている。' },
      { p: 'w2_photobooth', x: 24, y: 13 },
      { p: 'w2_neonbar', x: 3, y: 1, w: 7, col: '#ff5fa2', text: 'VIDEO GAMES' },
      { p: 'w2_neonbar', x: 12, y: 1, w: 8, col: '#4ef0ff', text: 'AF SIMULATOR' },
      { p: 'w2_neonbar', x: 22, y: 1, w: 6, col: '#ffd25e', text: 'PRIZE' },
      { p: 'poster', x: 10, y: 2, col: '#ff5fa2' },
      { p: 'poster', x: 11, y: 2, col: '#4ef0ff' },
      { p: 'poster', x: 20, y: 2, col: '#ffd25e' },
      { p: 'poster', x: 28, y: 2, col: '#7dff9a' },
      { p: 'rug', x: 13, y: 12, w: 6, h: 3, col: '#3a2a5a' },
    ],
    lights: [
      { x: 6, y: 7, r: 60, col: '#ff5fa2', a: 0.35, flicker: true },
      { x: 6, y: 12, r: 60, col: '#4ef0ff', a: 0.3, flicker: true },
      { x: 15, y: 11, r: 70, col: '#a060ff', a: 0.35 },
      { x: 24, y: 8, r: 60, col: '#ffd25e', a: 0.3 },
      { x: 24, y: 15, r: 50, col: '#ff8fb8', a: 0.35 },
      { x: 14, y: 16, r: 40, col: '#ffffff', a: 0.3 },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // ダンスゲームの床（光るパネル）
      const cols = ['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a'];
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++) {
          const X = (14 + i) * 16 + 2,
            Y = (12 + j) * 16 + 2;
          r(c, X, Y, 12, 12, (i + j) % 2 ? '#1a1430' : G.shade(cols[(i + j * 3) % 4], -0.35));
          if ((i + j) % 2 === 0) r(c, X + 4, Y + 4, 4, 4, cols[(i * 2 + j) % 4]);
        }
      // 出入口のマット
      r(c, 14 * 16, 17 * 16, 32, 16, '#ff5fa2');
      r(c, 14 * 16 + 2, 17 * 16 + 2, 28, 12, '#1a1428');
    },
    npcs: [
      {
        id: 'w2_king', char: 'w2_king', x: 5, y: 5, dir: 'up', move: 'still', show: W2.town,
        talk: W2.lines('w2_king', {
          0: ['……ふん。格ゲー〈スペース・ファイターII〉で、オレに勝てるやつはいない。', 'AFシミュ？　あんなのは、ボタンを押すだけの遊びだ。……スコアで負けたから言ってるわけじゃないぞ。'],
          2: '白い髪の子が、オレの隣に座って画面をじっと見てた。……オレのコンボ、見切られてる気がした。',
          3: 'リアルのロボバトル？　オレは画面の中で十分だ。……でも、録画は全部見てる。',
          4: '文化祭のゲーム大会、出てやってもいい。……優勝賞品がメロンパン1年分ならな。',
          5: '外出制限で、連コインできる時間が減った。……人生最大の危機だ。',
          8: 'こんな時でも、オレはここでレバーを握る。それがオレの戦い方だ。……おまえらも、負けんなよ。',
          9: 'おまえらの戦い、ゲームにしたら売れるぞ。……タイトルは「星屑のクレイドル」でどうだ。',
        }),
      },
      {
        id: 'w2_simkid', char: 'w2_simkid', x: 19, y: 6, dir: 'up', move: 'still', show: W2.town,
        talk: W2.lines('w2_simkid', {
          0: ['ランキング1位の「KANATA」って、どんな人なんだろう……。毎日ここで、そのスコアを追いかけてるんだ。', '……え、お兄さんがKANATA！？　ほ、ほんとに！？'],
          1: 'KANATAさん！　昨日、スコア3点だけ近づいたよ！　……3点だけ、だけど。',
          3: 'ジャンク・デュエルの映像を見て研究してる！　ハルカゼのブースト旋回、シミュで再現できないかな。',
          4: '文化祭でシミュの出張大会があるんだって！　KANATAさんと対戦できる！？',
          6: '黒い機体の動き、シミュの「伝説のエース」データとそっくりなんだ。……偶然かな。',
          8: 'ぼくもいつか、本物の機体で空を飛ぶ。KANATAさんみたいに、誰かを守るために。',
          9: 'ついにランキング1位！　……KANATAさん、最近来ないからだけど。',
        }),
      },
      {
        id: 'w2_prize', char: 'w2_prize', x: 24, y: 5, dir: 'down', move: 'still', show: () => G.state.chapter !== 7,
        talk: async () => {
          const k = await E.ask('w2_prize', G.byCh({ 0: 'いらっしゃいませ〜！　メダルの交換はこちら！……メダルがない？　じゃあ現金でもいいよ、特別ね。', 3: 'デュエルの人気で、景品のロボ系グッズが売り切れ続出なの！', 9: 'おかえり〜！　今日はサービスしちゃう！' }), ['景品を見る', 'やめる'], { cancel: 1 });
          if (k === 0) await E.shop(['candy', 'energy', 'soda'], '景品カウンター');
        },
      },
      {
        id: 'w2_ufogirl', char: 'w2_ufogirl', x: 23, y: 11, dir: 'up', move: 'still', show: W2.town,
        talk: W2.lines('w2_ufogirl', {
          0: ['……話しかけないで。今、アームの角度を計算してるの。', '……取れた！　これで「ネジぬいぐるみ」コンプリート。37個目。'],
          2: '白い髪の子に、ネジのぬいぐるみをあげたの。……すごく喜んでた。あの子、なんだか放っておけない。',
          3: 'アームの強さは、コロニーの回転と同じ。わずかなズレを読めば、必ず取れるの。',
          5: 'このぬいぐるみたち、避難所の子どもたちに配ろうかな。',
          8: 'ぬいぐるみ、全部配ってきた。……あたしの部屋、急に広くなっちゃった。',
          9: '新しいぬいぐるみ「キューブ」が入荷したの。……全部取るわよ。',
        }),
      },
      {
        id: 'w2_manager', char: 'w2_manager', x: 2, y: 12, dir: 'right', move: 'pace', range: 2, show: W2.town,
        talk: W2.lines('w2_manager', {
          0: ['〈ギャラクシー〉へようこそ。店長のゴトウだ。……中学生は夜10時までだぞ。', 'このAFシミュ、元は軍の訓練用でな。払い下げを安く買ったんだ。……中身は、たぶん本物だ。'],
          1: '公安が「シミュの記録を見せろ」と来た。……プライバシーは守ったぞ。客の名前は全部「KANATA」にしといた。',
          3: 'ジャッカルズの連中もうちの常連さ。ギルはああ見えて、ゲームは下手なんだ。',
          5: '営業時間短縮のお達しだ。……ゲーセンの灯りが消えたら、街は終わりだと思うんだがな。',
          8: '停電でも、非常電源で1台だけ動かしてる。……子どもたちの笑い声が、何よりの燃料だ。',
          9: 'シミュの新しいステージ、作ったんだ。名前は「ほんとうの空」。……まあ、遊んでみな。',
        }),
      },
      {
        id: 'w2_rhythm', char: 'w2_rhythm', x: 15, y: 13, dir: 'down', move: 'still', show: W2.town,
        talk: W2.lines('w2_rhythm', {
          0: ['ワン、ツー、ステップ！　ダンスゲーム〈ネオン・ビート〉、パーフェクト連続中！', '止まると死ぬの。マグロと一緒。'],
          3: 'デュエルの機体のステップ、ダンスと同じリズムなの。ハルカゼは8ビート、サラマンダーは16ビート！',
          5: '最近、床がちょっと傾いてる気がする……。ステップがずれるの。',
          8: '踊ってないと、不安に負けそうで。……一緒に踊る？',
          9: '新曲「ほんとうの空」、パーフェクト出したよ！',
        }),
      },
    ],
    checks: [{ x: 22, y: 6, w: 5, run: async () => { const n = E.get('w2_prize'); if (n) await n.talk(n); } }],
    items: [{ x: 28, y: 15, item: 'memory', id: 'mem_15' }],
    events: W2.memEvents([[28, 15]]),
    warps: [{ x: 14, y: 17, w: 2, to: 'neon', tx: 14, ty: 12, dir: 'down', se: 'door' }],
    onEnter: W2.memEnter,
  });

  // ---------------------------------------------------------------
  //  レディオ・スターダスト radio_booth（22×14）
  // ---------------------------------------------------------------
  const RB = W2.grid(18, 12, 'w');
  RB.fill(1, 3, 16, 8, 'r').set(9, 11, 'r');
  RB.set(14, 3, 'X').set(15, 3, 'X').set(16, 3, 'X').set(16, 10, 'P').set(12, 10, 'j').set(16, 7, 'C').set(16, 8, 'C').set(5, 3, 'E');
  G.mob('w2_ad', '音響係のテツオ', 231, { girl: false, old: false, kid: false, over: { outfit: 'hoodie', top: '#3a3a4a', top2: '#4ef0ff', acc: ['headphones'], accCol: '#4ef0ff', style: 'messy', hair: '#5a3a2a' } });
  P.w2_speaker = function () {
    const cv = mk(16, 26),
      c = cv.ctx;
    r(c, 2, 23, 13, 3, 'rgba(0,0,0,0.4)');
    r(c, 2, 0, 12, 24, '#1a1420');
    r(c, 3, 1, 10, 22, '#2a2232');
    G.ellipse(c, 8, 7, 3, 3, '#4a4058');
    G.ellipse(c, 8, 16, 4, 4, '#4a4058');
    px(c, 8, 16, '#ff5fa2');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -10, solid: true };
  };
  P.w2_cables = function (o) {
    const w = o.w || 3,
      cv = mk(w * S, 16),
      c = cv.ctx;
    for (let k = 0; k < 3; k++) {
      const col = ['#1a1420', '#ff5fa2', '#3a8ae0'][k];
      let y = 4 + k * 4;
      for (let x = 0; x < w * S; x++) {
        y += Math.round(Math.sin((x + k * 9) / 6) * 0.6);
        px(c, x, Math.max(1, Math.min(14, y)), col);
      }
    }
    return { w, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  G.defMap('radio_booth', {
    name: 'レディオ・スターダスト',
    bgm: 'radio',
    light: '#6a5a92',
    lightAlpha: 1,
    floor: 'r',
    pal: { wall: '#3a2a4a', wallTop: '#140c1e', carpet: '#4a2a4a', baseboard: '#1a1020' },
    rows: RB.rows(),
    objects: [
      { p: 'w2_neonbar', x: 1, y: 1, w: 5, col: '#ff5fa2', text: 'RADIO SD' },
      { p: 'w2_onair', x: 7, y: 1, wall: true },
      { p: 'w2_neonbar', x: 10, y: 1, w: 4, col: '#4ef0ff', text: '88.5' },
      { p: 'poster', x: 6, y: 2, col: '#ff5fa2' },
      { p: 'poster', x: 9, y: 2, col: '#4ef0ff' },
      { p: 'poster', x: 14, y: 2, col: '#ffd25e' },
      { p: 'poster', x: 15, y: 2, col: '#7dff9a' },
      { p: 'w2_records', x: 1, y: 3, w: 4, msg: 'レコード棚。手書きのラベルに「リクエストの多い曲」「眠れない夜に」「ルウへ」……。' },
      { p: 'w2_speaker', x: 6, y: 3 },
      { p: 'w2_speaker', x: 11, y: 3 },
      { p: 'w2_records', x: 12, y: 3, w: 2, msg: '古いカセットテープの棚。1本分、ぽっかりすき間が空いている。' },
      { p: 'w2_mic', x: 8, y: 3, msg: 'リリィのマイク。ステッカーがびっしり貼ってある。' },
      { p: 'w2_mixer', x: 6, y: 4, w: 4, msg: 'ミキサー卓。たくさんのつまみとスライダー。勝手にさわったら、リリィに怒られそうだ。' },
      { p: 'tv', x: 12, y: 5, msg: 'モニター。コロニーの各区画の映像が、ぐるぐると切り替わっている。……公安の回線を拝借しているらしい。' },
      { p: 'w2_sofa', x: 1, y: 8, w: 3, col: '#7a3a6a', msg: '使い込まれたソファ。リリィの仮眠用らしい。毛布とヘッドホンが置いてある。' },
      { p: 'table', x: 1, y: 6, w: 2, h: 1, col: '#3a2a3a', items: true, msg: '食べかけのカップ麺と、リスナーからのハガキの山。「ラジオのおかげで眠れました」' },
      { p: 'w2_records', x: 13, y: 8, w: 3, msg: 'リスナーからの手紙の箱。「リリィさん、顔を見せて！」「ルウより：今週も聴いてるよ」' },
      { p: 'w2_cables', x: 6, y: 5, w: 4 },
      { p: 'rug', x: 5, y: 6, w: 6, h: 3, col: '#2a1a3a' },
    ],
    lights: [
      { x: 8, y: 4, r: 50, col: '#ff5fa2', a: 0.45, flicker: true },
      { x: 13, y: 5, r: 40, col: '#6a9ae0', a: 0.45, flicker: true },
      { x: 2, y: 8, r: 40, col: '#ffd890', a: 0.4 },
      { x: 15, y: 4, r: 30, col: '#4ef0ff', a: 0.35, flicker: true },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      r(c, 9 * 16, 11 * 16, 16, 16, '#1a1020');
    },
    npcs: [
      {
        id: 'w2_ad', char: 'w2_ad', x: 15, y: 6, dir: 'left', move: 'still', show: W2.town,
        talk: W2.lines('w2_ad', {
          0: ['……ここは関係者以外立入禁止。……って、もう入ってるし。', '海賊放送だから、送信機はあっちこっちのアンテナに相乗りしてる。……内緒な。'],
          1: 'リリィさん、毎晩コロニーの噂を集めてる。昨日の揺れのことも、何か知ってるみたいだ。',
          3: 'デュエルの実況、オレが中継回線を組んでる。スターダスト戦の視聴率、すごいんだぜ。',
          5: '公安の電波妨害がきつい。……でも、リリィさんの声は止めさせない。',
          7: '全区画に一斉放送！？　送信機、焼き切れるかもしれない。……やってやるよ！',
          9: '送信機、全部新品にしてもらった。……コロニー公認の放送局、になっちまうのかな。',
        }),
      },
    ],
    items: [{ x: 1, y: 10, item: 'memory', id: 'mem_16' }],
    events: W2.memEvents([[1, 10]]),
    warps: [{ x: 9, y: 11, to: 'neon', tx: 56, ty: 12, dir: 'down', se: 'door' }],
    onEnter: W2.memEnter,
  });
})();
