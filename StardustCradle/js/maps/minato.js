// =============================================================
//  maps/minato.js — ミナト区（72×48）／銭湯〈ポン湯〉／スターマート
//  ワールド担当 part1。町の人・サブクエストは story/side_w1.js
// =============================================================
(function () {
  // ---------- 地形ビルダー ----------
  const W = 72,
    H = 48;
  const g = [];
  for (let y = 0; y < H; y++) g.push(Array(W).fill('='));
  const fill = (x, y, w, h, ch) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < H && i >= 0 && i < W) g[j][i] = ch;
  };
  const put = (x, y, s) => {
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ' && x + i < W) g[y][x + i] = s[i];
  };
  const set = (x, y, ch) => {
    if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = ch;
  };

  // --- 大通り（南北）：北＝第三中、南＝スクラップ・ベイ ---
  fill(34, 0, 4, 48, '-');
  for (let y = 0; y < 48; y++) if (y < 20 || y > 26) set(36, y, '|');
  // --- 商店街通り（東西）：西＝グリーン・ブロック、東＝ネオン通り ---
  fill(0, 22, 72, 3, '-');
  for (let x = 0; x < 72; x++) if (x < 32 || x > 39) set(x, 23, '_');
  // 横断歩道
  fill(34, 21, 4, 1, 'z');
  fill(34, 25, 4, 1, 'z');
  fill(33, 22, 1, 3, 'z');
  fill(38, 22, 1, 3, 'z');
  // --- 北西の住宅路地 ---
  fill(0, 8, 34, 2, '-');
  fill(0, 7, 1, 4, 'B');
  // 北側の並木（大通りぞい）
  fill(32, 0, 1, 21, '.');
  fill(39, 0, 1, 7, '.');
  fill(32, 7, 1, 1, '=');
  fill(32, 10, 1, 1, '=');
  // 店の裏庭（北西）
  fill(0, 11, 32, 4, '.');
  fill(6, 11, 2, 10, '='); // 抜け道
  // --- 運河 ---
  fill(0, 31, 72, 1, 'R');
  fill(0, 32, 72, 3, '~');
  fill(0, 35, 72, 1, 'R');
  // 大通りの橋
  fill(33, 31, 1, 5, '=');
  fill(38, 31, 1, 5, '=');
  fill(34, 31, 4, 5, '-');
  for (let y = 31; y <= 35; y++) set(36, y, '|');
  fill(32, 32, 1, 3, 'R');
  fill(39, 32, 1, 3, 'R');
  // 歩道橋（レンガ）
  for (const bx of [14, 58]) {
    fill(bx, 31, 2, 5, '+');
    fill(bx - 1, 32, 1, 3, 'R');
    fill(bx + 2, 32, 1, 3, 'R');
  }
  // --- 南の路地 ---
  fill(0, 44, 72, 2, '-');
  fill(0, 47, 72, 1, 'H');
  fill(34, 47, 4, 1, '-');
  fill(0, 43, 1, 4, 'B');
  fill(71, 43, 1, 4, 'B');
  // 運河ぞい南の緑地帯
  // --- 北東：交番まわりと公園 ---
  fill(40, 8, 6, 8, '=');
  fill(46, 8, 26, 13, '.');
  fill(46, 8, 1, 13, 'H');
  fill(46, 8, 26, 1, 'H');
  fill(46, 20, 26, 1, 'H');
  fill(71, 8, 1, 13, 'H');
  fill(46, 13, 1, 3, ':'); // 西口
  fill(56, 20, 4, 1, ':'); // 南口
  fill(55, 8, 2, 1, ':'); // 北口
  // 広場（レンガ）
  fill(54, 12, 10, 6, '+');
  fill(56, 9, 6, 3, '+');
  fill(56, 18, 4, 2, ':');
  fill(47, 13, 7, 3, ':');
  fill(64, 14, 3, 2, ':');
  fill(55, 9, 1, 1, ':');
  // 花畑
  fill(56, 11, 1, 1, ',');
  fill(61, 11, 1, 1, ',');
  fill(48, 9, 4, 2, ',');
  fill(66, 9, 4, 1, ',');
  // 池
  fill(48, 16, 5, 3, '~');
  // 砂場（遊び場）
  fill(65, 15, 5, 4, ':');
  // --- 南東：工事中の空き地（AF置き場） ---
  fill(39, 37, 9, 6, 'c');
  fill(39, 37, 9, 1, 'F');
  fill(39, 37, 1, 6, 'F');
  fill(47, 37, 1, 6, 'F');
  fill(41, 41, 5, 2, 'x');
  // 西端・東端の植え込み
  set(0, 21, 'B');
  set(0, 25, 'B');
  set(71, 21, 'B');
  set(71, 25, 'B');

  // ---------- 小物を地形に ----------
  // 北の並木（桜）
  for (const y of [1, 3, 5]) set(32, y, 'Y'), set(39, y, 'Y');
  for (const y of [12, 16]) set(32, y, 'Y');
  // 街灯（Lは歩道に）
  for (const x of [3, 15, 27]) set(x, 7, 'L');
  for (const x of [10, 22]) set(x, 10, 'L');
  for (const x of [2, 9, 18, 26, 31]) set(x, 21, 'L');
  for (const x of [40, 49, 55, 63, 70]) set(x, 21, 'L');
  for (const x of [4, 12, 21, 29, 41, 50, 62, 69]) set(x, 25, 'L');
  for (const x of [3, 11, 19, 27, 44, 50, 54, 65]) set(x, 30, 'L');
  for (const x of [4, 12, 20, 28, 44, 52, 62, 69]) set(x, 36, 'L');
  for (const x of [3, 14, 25, 50, 60, 68]) set(x, 43, 'L');
  for (const y of [13, 29, 39]) set(33, y, 'L'), set(38, y, 'L');
  for (const x of [44, 52, 61, 70]) set(x, 7, 'L');
  // 公園の木
  for (const [x, y] of [[47, 9], [52, 9], [53, 11], [47, 11], [50, 12], [63, 9], [64, 11], [69, 9], [70, 11], [68, 13], [70, 17], [62, 18], [64, 19], [53, 19], [47, 19], [51, 15]]) set(x, y, 'Y');
  for (const [x, y] of [[66, 12], [70, 14]]) set(x, y, 'T');
  // 生け垣の中の植え込み
  for (const [x, y] of [[54, 18], [61, 18], [53, 12], [64, 12]]) set(x, y, 'q');
  // 裏庭（北西）の木・植え込み
  for (const [x, y] of [[1, 11], [4, 12], [9, 11], [16, 12], [19, 11], [24, 11], [28, 12], [31, 11], [21, 13], [13, 12]]) set(x, y, 'T');
  for (const [x, y] of [[2, 13], [5, 11], [10, 12], [17, 14], [26, 13], [30, 14], [23, 14]]) set(x, y, 'b');
  for (const [x, y] of [[12, 11], [14, 13], [27, 11]]) set(x, y, 'q');
  // 抜け道の自販機
  set(7, 12, 'V');
  set(6, 16, 'j');
  // 交番前
  set(45, 13, 'V');
  // 南の路地の木
  for (const x of [6, 19, 29, 44, 55, 66]) set(x, 46, 'T');
  for (const x of [1, 10, 22, 48, 59, 70]) set(x, 46, 'b');
  // 運河南の植え込み
  for (const x of [8, 24, 48, 66]) set(x, 36, 'b');
  // ゴミ箱・消火栓・ポスト
  for (const [x, y] of [[13, 21], [22, 21], [44, 21], [60, 25], [24, 30], [9, 43], [56, 43], [31, 7]]) set(x, y, 'j');
  for (const [x, y] of [[16, 25], [52, 21], [9, 30], [46, 30], [21, 43], [65, 43]]) set(x, y, 'y');
  for (const [x, y] of [[20, 21], [47, 7], [5, 43]]) set(x, y, 'M');
  // 南東：AF置き場の資材
  for (const [x, y] of [[40, 38], [40, 39], [46, 38]]) set(x, y, 'C');
  for (const [x, y] of [[46, 41], [40, 41]]) set(x, y, 'Q');
  set(46, 40, 'G');
  // セーブ端末（交番の横）
  set(44, 14, 'Z');

  const rows = g.map((r) => r.join(''));

  // ---------- 建物 ----------
  const objects = [];
  const checks = [];
  // b(x,y,w,h,opt, doorMsg)
  function bld(x, y, w, h, o, msg) {
    const ob = Object.assign({ p: 'bldg', x, y, w, h }, o);
    objects.push(ob);
    if (msg && o.door !== -1) {
      const dx = o.door === undefined ? Math.floor(w / 2) : o.door;
      checks.push({ x: x + dx, y: y + h - 1, text: msg });
    }
    return ob;
  }
  // 北の住宅（北西）
  bld(0, 0, 5, 7, { style: 'house', roof: 'tile', roofCol: '#c0504a', seed: 3 }, '「佐倉」の表札。玄関先に三輪車が置いてある。');
  bld(6, 0, 6, 7, { style: 'apartment', seed: 4, wall: '#e0d8ec', door: 2 }, '〈コーポみなと〉。郵便受けからチラシがはみ出している。');
  bld(12, 0, 5, 7, { style: 'house', roof: 'tile', roofCol: '#4a8a6a', seed: 5 }, '「木下」の表札。中から三味線の音が聞こえる。');
  bld(18, 0, 4, 7, { style: 'house', roof: 'tile', roofCol: '#4a6ab0', seed: 6, wall: '#f4ead8' }, '「空き家・入居者募集」の貼り紙。');
  bld(22, 0, 6, 7, { style: 'apartment', seed: 7, wall: '#d4e0e8', door: 4 }, '〈メゾン・ルナ〉。誰かが階段で歌の練習をしている。');
  bld(28, 0, 4, 7, { style: 'house', roof: 'tile', roofCol: '#8a5aa0', seed: 8 }, '「鈴木」の表札。犬のロボットが番をしている。');
  // 北の住宅（北東）
  bld(40, 0, 6, 7, { style: 'apartment', seed: 11, wall: '#e8dcd0', door: 1 }, '〈ハイツ・ミラー〉。ベランダに観葉植物がずらりと並ぶ。');
  bld(46, 0, 6, 7, { style: 'shop', wall: '#f4f6fa', sign: 'CLINIC', signCol: '#3a8ae0', doorType: 'glass', seed: 12 }, '〈ミナト診療所〉。「本日の診察は終了しました」の札。');
  bld(53, 0, 9, 7, { style: 'apartment', seed: 13, wall: '#d8d4e4', sign: 'CRADLE HEIGHTS', signCol: '#5a4a8a', antenna: true }, '〈クレイドル・ハイツ〉。オートロックだ。');
  bld(62, 0, 5, 7, { style: 'house', roof: 'tile', roofCol: '#c06a3a', seed: 14 }, '「早乙女」の表札。占いの看板が出ている……。');
  bld(67, 0, 5, 7, { style: 'apartment', seed: 15, wall: '#e8e0c8', door: 2 }, '〈ひまわり荘〉。古いけど手入れが行き届いている。');

  // 商店街・北側
  bld(0, 15, 6, 6, { style: 'shop', sign: 'BAKERY', signCol: '#c06a2a', awning: '#f08a30', door: 3, seed: 21 }, '〈ベーカリー・こむぎ〉。焼きたてのメロンパンの匂い！ ……今日はもう売り切れらしい。');
  bld(8, 14, 7, 7, {
    style: 'house', roof: 'tile', roofCol: '#2e3a6a', wall: '#f2e6cc', sign: 'RAMEN', signCol: '#c03030', signScale: 2,
    doorType: 'noren', norenText: 'RA', norenCol: '#c03030', door: 3, seed: 22, to: 'hoshikuzu', tx: 7, ty: 10, dir: 'up',
  });
  bld(15, 16, 6, 5, { style: 'shop', sign: 'CAFE', signCol: '#2a8a80', awning: '#3ac0b0', door: 2, seed: 23 }, '〈喫茶ミラーボール〉。「準備中」の札。マスターがコーヒー豆を挽いている。');
  bld(21, 15, 5, 6, { style: 'shop', sign: 'BOOKS', signCol: '#5a3aa0', door: 2, seed: 24, wall: '#ece4f0' }, '〈本の虫〉。今週の「月刊AFマガジン」が平積みされている。');
  bld(26, 15, 6, 6, { style: 'shop', sign: 'HOBBY', signCol: '#ff5fa2', neonTube: '#4ef0ff', neon: true, door: 3, seed: 25, wall: '#3a3450' }, '〈模型のホシノ〉。ショーウィンドウにアームド・フレームのプラモデル。白い機体の新作が「入荷未定」……。');
  // 交番・コンビニ
  bld(40, 10, 5, 4, { style: 'house', roof: 'flat', wall: '#f4f4fa', sign: 'KOBAN', signCol: '#2a3a7a', door: 2, seed: 31, doorType: 'glass' }, null);
  bld(40, 16, 6, 5, {
    style: 'shop', wall: '#f6f8fc', sign: 'STARMART', signCol: '#2a9a6a', awning: '#2ab07a', door: 2, seed: 32, neonTube: '#7dffb0',
    to: 'konbini', tx: 6, ty: 9, dir: 'up',
  });
  // 商店街・南側（運河の遊歩道を向いている）
  bld(0, 26, 5, 4, { style: 'shop', sign: 'LAUNDRY', signCol: '#3a6ad0', door: 2, seed: 41, wall: '#e4ecf4' }, '〈コインランドリー〉。乾燥機がゴウンゴウンと回っている。');
  bld(5, 26, 5, 4, { style: 'house', roof: 'tile', roofCol: '#a04a3a', sign: 'DAGASHI', signCol: '#e05a2a', awning: '#ffb030', door: 2, seed: 42 }, '〈駄菓子のまるや〉。ネオンキャンディが10円！ ……は昔の話らしい。');
  bld(12, 26, 6, 4, { style: 'shop', sign: 'FLOWERS', signCol: '#d04a8a', awning: '#ff8fb8', door: 2, seed: 43 }, '〈フラワー・ガーデン〉。コロニー産のバラが並んでいる。');
  bld(18, 26, 6, 4, { style: 'shop', sign: 'BARBER', signCol: '#c03040', door: 3, seed: 44, wall: '#f0f0f8' }, '〈理容ムーン〉。「ミラー窓ヘア、はじめました」');
  bld(26, 26, 6, 4, { style: 'neon', sign: 'MUSIC', signCol: '#7a5ae0', neon: true, door: 2, seed: 45, neonTube: '#ff5fa2' }, '〈レコード・オービット〉。店内からシティポップが流れてくる。');
  bld(39, 26, 6, 4, { style: 'garage', sign: 'PARTS', signCol: '#e08a30', door: 3, seed: 46, doorType: 'glass', wall: '#b8b8c8' }, null);
  bld(47, 26, 6, 4, { style: 'shop', sign: 'DINER', signCol: '#e04a4a', awning: '#e04a4a', door: 2, seed: 47, neon: true }, '〈ダイナー・ムーンベース〉。「本日のおすすめ：重力ハンバーグ」');
  bld(53, 26, 5, 4, { style: 'house', roof: 'tile', roofCol: '#4a6ab0', sign: 'TAILOR', signCol: '#3a3a5a', door: 2, seed: 48 }, '〈仕立て屋クロス〉。ショーウィンドウに古い同盟軍のフライトジャケット。');
  bld(61, 26, 6, 4, { style: 'shop', sign: 'BIKES', signCol: '#2a8ad0', door: 2, seed: 49, wall: '#e8f0f4' }, '〈サイクル・スピン〉。ホバースクーターは予約3か月待ち。');
  bld(67, 26, 5, 4, { style: 'house', roof: 'tile', roofCol: '#6a8a4a', door: 2, seed: 50 }, '「権藤」の表札。');
  // 南の並び
  bld(0, 37, 6, 6, { style: 'apartment', seed: 51, wall: '#e8d8d0', door: 2 }, '〈運河荘〉。窓から運河がよく見えそうだ。');
  bld(6, 37, 9, 6, {
    style: 'house', roof: 'tile', roofCol: '#3a6ab0', wall: '#f4ecd8', sign: 'PON-YU', signCol: '#2a6ac0', signScale: 2,
    doorType: 'noren', norenText: 'YU', norenCol: '#2a6ac0', door: 4, seed: 52, to: 'ponyu', tx: 8, ty: 12, dir: 'up',
  });
  bld(17, 37, 7, 6, { style: 'apartment', seed: 53, wall: '#dcd8e8', door: 3 }, '〈グランドール運河〉。ゴミ出しのルールが細かく貼ってある。');
  bld(24, 37, 4, 6, { style: 'house', roof: 'tile', roofCol: '#c0504a', seed: 54 }, '「水野」の表札。');
  bld(29, 37, 3, 6, { style: 'house', roof: 'tile', roofCol: '#8a5aa0', seed: 55, door: 1 }, '小さな家。「猫います」の札。');
  bld(48, 37, 7, 6, { style: 'garage', sign: 'GARAGE', signCol: '#5a5a6a', door: 3, seed: 56 }, '〈タナベ自動車〉。シャッターの奥でホバーカーが分解されている。');
  bld(55, 37, 7, 6, { style: 'apartment', seed: 57, wall: '#e4dcc8', door: 2 }, '〈ステラ・コート〉。');
  bld(62, 37, 4, 6, { style: 'house', roof: 'tile', roofCol: '#4a8a6a', seed: 58 }, '「田辺」の表札。');
  bld(66, 37, 6, 6, { style: 'apartment', seed: 59, wall: '#d8e4d8', door: 3 }, '〈みどり荘〉。ベランダに大量の鉢植え。');

  // ---------- その他の小物 ----------
  objects.push(
    // 公園
    { p: 'fountain', x: 57, y: 14 },
    { p: 'statue', x: 58, y: 10, msg: '軌道戦争慰霊碑。「星の海に散った、すべての人々へ」……花が絶えず供えられている。' },
    { p: 'flowerbed', x: 56, y: 10, w: 2 },
    { p: 'flowerbed', x: 60, y: 10, w: 2 },
    { p: 'bench', x: 54, y: 16, msg: '古いベンチ。「カナタ参上」と彫ってある。……小学生の時の自分だ。' },
    { p: 'bench', x: 62, y: 16 },
    { p: 'bench', x: 55, y: 12 },
    { p: 'bench', x: 61, y: 12 },
    { p: 'bench', x: 48, y: 12 },
    { p: 'tires', x: 67, y: 11 },
    { p: 'tires', x: 69, y: 12 },
    { p: 'sign', x: 58, y: 19, text: 'PARK', col: '#3a8a4a', msg: '「ミナト中央公園」——ボール遊びは決められた場所で。ドローンの飛行禁止。' },
    { p: 'stall', x: 63, y: 13, text: 'TAIYAKI', col: '#e05a2a' },
    { p: 'trash', x: 60, y: 17 },
    { p: 'lamp', x: 54, y: 14 },
    { p: 'lamp', x: 63, y: 17 },
    { p: 'lamp', x: 49, y: 10 },
    { p: 'lamp', x: 66, y: 16 },
    { p: 'vending', x: 47, y: 17, col: '#3a8ae0' },
    // 交番前
    { p: 'billboard', x: 40, y: 8, w: 6, text: 'CRADLE 7', col: '#4ef0ff' },
    { p: 'bicycle', x: 41, y: 15 },
    { p: 'bicycle', x: 42, y: 15 },
    { p: 'sign', x: 43, y: 15, text: 'P', col: '#3a6ad0' },
    // 商店街
    { p: 'vending', x: 14, y: 21, col: '#e04a4a' },
    { p: 'vending', x: 46, y: 21, col: '#ff5fa2' },
    { p: 'sign', x: 7, y: 21, text: 'SALE', col: '#e04a4a', neon: true },
    { p: 'neonsign', x: 32, y: 19, text: 'BAR', col: '#ff5fa2' },
    { p: 'bench', x: 27, y: 25, msg: 'バス停のベンチ。「ネオン通り経由・第三中学校前 行き」' },
    { p: 'sign', x: 30, y: 25, text: 'BUS', col: '#2a8a5a', msg: '〈ミナト商店街〉バス停。時刻表には「マザーの判断で運行します」と書いてある。' },
    { p: 'sign', x: 1, y: 21, text: 'GREEN', col: '#3a9a4a', msg: '← グリーン・ブロック（農業区画）' },
    { p: 'sign', x: 70, y: 21, text: 'NEON', col: '#ff5fa2', neon: true, msg: 'ネオン通り →　「夜ふかしはほどほどに。」' },
    { p: 'sign', x: 33, y: 1, text: 'SCHOOL', col: '#3a6ad0', msg: '↑ 第三中学校　（通学路・桜並木）' },
    { p: 'sign', x: 38, y: 46, text: 'SCRAP', col: '#a07030', msg: '↓ スクラップ・ベイ（廃品区画）　「大型機械に注意」' },
    { p: 'car', x: 20, y: 24, col: '#e04a4a' },
    { p: 'car', x: 50, y: 22, col: '#4ac0e0' },
    { p: 'car', x: 9, y: 8, col: '#f0f0f0' },
    { p: 'car', x: 60, y: 44, col: '#ffd25e' },
    { p: 'car', x: 15, y: 45, col: '#7a5ae0' },
    { p: 'bicycle', x: 5, y: 21 },
    { p: 'bicycle', x: 24, y: 21 },
    { p: 'bicycle', x: 66, y: 21 },
    { p: 'bicycle', x: 11, y: 30 },
    { p: 'flowerbed', x: 59, y: 21, w: 3 },
    { p: 'flowerbed', x: 2, y: 25, w: 2 },
    { p: 'flowerbed', x: 22, y: 25, w: 3 },
    { p: 'flowerbed', x: 43, y: 25, w: 3 },
    { p: 'flowerbed', x: 64, y: 25, w: 3 },
    { p: 'tree', x: 8, y: 25, kind: 'green' },
    { p: 'tree', x: 25, y: 25, kind: 'green' },
    { p: 'tree', x: 47, y: 25, kind: 'green' },
    { p: 'tree', x: 57, y: 25, kind: 'green' },
    { p: 'tree', x: 67, y: 25, kind: 'green' },
    // 運河ぞい
    { p: 'bench', x: 5, y: 30 },
    { p: 'bench', x: 22, y: 30 },
    { p: 'bench', x: 66, y: 30 },
    { p: 'bench', x: 16, y: 36 },
    { p: 'bench', x: 40, y: 36 },
    { p: 'bench', x: 56, y: 36 },
    { p: 'stall', x: 29, y: 36, text: 'ODEN', col: '#e04a4a' },
    { p: 'tree', x: 2, y: 36, kind: 'sakura' },
    { p: 'tree', x: 10, y: 36, kind: 'sakura' },
    { p: 'tree', x: 26, y: 36, kind: 'sakura' },
    { p: 'tree', x: 46, y: 36, kind: 'sakura' },
    { p: 'tree', x: 64, y: 36, kind: 'sakura' },
    { p: 'tree', x: 70, y: 36, kind: 'sakura' },
    { p: 'tree', x: 31, y: 30, kind: 'sakura' },
    { p: 'tree', x: 40, y: 30, kind: 'sakura' },
    { p: 'tree', x: 68, y: 30, kind: 'sakura' },
    { p: 'vending', x: 60, y: 30, col: '#7a5ae0' },
    { p: 'sign', x: 17, y: 30, text: 'CANAL', col: '#3a86c8', msg: '「ミナト運河」——遊泳禁止。コロニーの水はぜんぶ循環しています。' },
    // 南の路地
    { p: 'vending', x: 16, y: 43, col: '#e04a4a' },
    { p: 'vending', x: 31, y: 43, col: '#3ac0b0' },
    { p: 'bicycle', x: 12, y: 43 },
    { p: 'bicycle', x: 28, y: 43 },
    { p: 'trash', x: 54, y: 43 },
    // AF置き場
    { p: 'container', x: 42, y: 38, col: '#d06a3a', text: 'CR7' },
    { p: 'sign', x: 47, y: 43, text: 'DANGER', col: '#e8c040', msg: '「工事中・立入注意」——ワークフレーム作業中。' },
    { p: 'hangar', x: 43, y: 41 }
  );

  // 交番・パーツ屋はチェックで（扉は飾り）
  checks.push({ x: 42, y: 13, text: '交番。「パトロール中」の札がかかっている。中にお巡りさんの湯のみが置きっぱなし。' });

  G.defMap('minato', {
    name: 'ミナト区',
    area: 'クレイドル7・第3陸',
    bgm: () => (G.state.chapter === 7 ? 'tension' : 'town'),
    outdoor: true,
    ambient: 'petals',
    pal: { grass: '#6cbc5a', walk: '#d6cdbf', water: '#3a8ed0' },
    rows,
    objects,
    checks,
    warps: [
      { x: 34, y: 0, w: 4, h: 1, to: 'school_yard', tx: 22, ty: 37, dir: 'up' },
      { x: 71, y: 22, w: 1, h: 3, to: 'neon', tx: 2, ty: 16, dir: 'right' },
      { x: 34, y: 47, w: 4, h: 1, to: 'scrapbay', tx: 30, ty: 2, dir: 'down' },
      { x: 0, y: 22, w: 1, h: 3, to: 'green', tx: 47, ty: 15, dir: 'left' },
    ],
    npcs: [],
    lights: [
      { x: 11, y: 19, r: 30, col: '#ffb060', a: 0.7, night: true },
      { x: 58, y: 11, r: 26, col: '#bfe0ff', a: 0.5, night: true },
    ],
  });
})();
