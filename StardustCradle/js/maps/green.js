// =============================================================
//  maps/green.js — グリーン・ブロック（農業区画, 50×34）
//  ワールド担当 part1。メンテナンス・トンネル入口（5章で開放）は北壁の西寄り (4,3)
// =============================================================
(function () {
  // ---------- このファイル用の追加小物（G.PROPS に追加。エンジンは変更しない） ----------
  const r = G.rect,
    px = G.px;
  const S = 16;

  // 温室（ガラスハウス）。足元 w×h、下2行が正面
  G.PROPS.w_greenhouse = function (o) {
    const w = o.w || 6,
      h = o.h || 4,
      top = 18;
    const W = w * S,
      Hh = h * S + top;
    const cv = G.makeCanvas(W, Hh);
    const c = cv.ctx;
    const rnd = G.srand((o.seed || 1) * 131 + w);
    const wy = top + (h - 2) * S; // 正面の上端
    const frame = '#eef4f0',
      frame2 = '#a8b8b4';
    // 屋根（ガラス・切妻）
    const ridge = top + Math.floor((wy - top) * 0.45);
    r(c, 0, top, W, ridge - top, '#bfe6ea');
    r(c, 0, ridge, W, wy - ridge, '#95ccd8');
    // 透けて見える作物
    for (let i = 0; i < W * 1.5; i++) {
      const x = Math.floor(rnd() * (W - 4)) + 2,
        y = top + 4 + Math.floor(rnd() * (wy - top - 6));
      r(c, x, y, 2, 2, rnd() > 0.85 ? (o.crop || '#e85a4a') : rnd() > 0.5 ? '#5aa860' : '#78c070');
    }
    c.globalAlpha = 0.45;
    r(c, 0, top, W, ridge - top, '#e8fbff');
    c.globalAlpha = 1;
    for (let x = 0; x < W; x += 8) r(c, x, top, 1, wy - top, frame);
    r(c, 0, top, W, 2, frame);
    r(c, 0, ridge - 1, W, 2, '#ffffff');
    r(c, 0, wy - 2, W, 2, frame2);
    r(c, 0, top, 2, wy - top, frame2);
    r(c, W - 2, top, 2, wy - top, frame2);
    // 反射
    for (let k = 0; k < w; k++) G.line(c, k * 16 + 3, ridge - 3, k * 16 + 8, top + 3, 'rgba(255,255,255,0.8)');
    // 正面（ガラス壁）
    const WH = 2 * S;
    r(c, 0, wy, W, WH, '#8cc8d0');
    for (let i = 0; i < W; i += 3) {
      const hh = 6 + Math.floor(rnd() * 12);
      r(c, i, wy + WH - 4 - hh, 2, hh, rnd() > 0.5 ? '#4a9a50' : '#6ab868');
      if (rnd() > 0.7) px(c, i, wy + WH - 4 - hh + 2, o.crop || '#e85a4a');
    }
    c.globalAlpha = 0.35;
    r(c, 0, wy, W, WH, '#e0f8ff');
    c.globalAlpha = 1;
    for (let x = 0; x < W; x += 8) r(c, x, wy, 1, WH, frame);
    r(c, 0, wy, W, 1, frame);
    r(c, 0, wy + 14, W, 1, frame);
    r(c, 0, wy + WH - 3, W, 3, '#7a8a86');
    // 扉
    const dx = (o.door === undefined ? Math.floor(w / 2) : o.door) * S;
    r(c, dx + 1, wy + 13, 14, 19, '#6a7a78');
    r(c, dx + 2, wy + 14, 12, 18, '#bfeaf0');
    r(c, dx + 7, wy + 14, 1, 18, '#6a7a78');
    G.line(c, dx + 3, wy + 26, dx + 6, wy + 17, '#ffffff');
    if (o.sign) {
      const tw = G.pixTextW(o.sign);
      r(c, W / 2 - tw / 2 - 3, wy + 2, tw + 6, 9, '#2a6a4a');
      G.pixText(c, o.sign, W / 2 - tw / 2, wy + 4, '#e8ffe8');
    }
    const lights = [];
    for (let k = 0; k < Math.max(1, Math.floor(w / 3)); k++) lights.push({ x: ((k + 0.5) * W) / Math.max(1, Math.floor(w / 3)), y: wy - top - 6, r: 34, col: '#ff7af0', a: 0.55, night: true });
    return { w, h, img: cv, ox: 0, oy: -top, solid: true, lights };
  };

  // 大型送風機ユニット（壁ぎわ・3×1）
  G.PROPS.w_fan = function (o) {
    const cv = G.makeCanvas(48, 54);
    const c = cv.ctx;
    const col = o.col || '#a4acbc';
    r(c, 1, 50, 46, 4, 'rgba(20,10,40,0.3)');
    r(c, 2, 2, 44, 48, G.shade(col, -0.3));
    r(c, 3, 3, 42, 46, col);
    r(c, 3, 3, 42, 2, G.shade(col, 0.3));
    r(c, 42, 3, 3, 46, G.shade(col, -0.2));
    G.ellipse(c, 24, 24, 19, 19, '#2a2e3a');
    G.ellipse(c, 24, 24, 17, 17, '#3e4456');
    // 羽根（静止画。回転は map の overlay で描く）
    for (let i = 4; i < 42; i += 3) r(c, 7, i, 34, 1, 'rgba(160,170,190,0.35)');
    G.ellipse(c, 24, 24, 4, 4, '#c8ccd8');
    px(c, 24, 24, '#5a5e6e');
    for (let i = 0; i < 46; i += 6) r(c, 1 + i, 45, 3, 4, '#e8c040'), r(c, 4 + i, 45, 3, 4, '#2a2a30');
    G.pixText(c, o.text || 'FAN', 6, 5, '#2a2e3a');
    r(c, 38, 6, 3, 3, '#7dff9a');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -38, solid: true, lights: [{ x: 39, y: -31, r: 8, col: '#7dff9a', a: 0.7, blink: true }] };
  };


  // 畑の作物（床に描くだけ・通行可）
  G.PROPS.w_crop = function (o) {
    const cv = G.makeCanvas(16, 16);
    const c = cv.ctx;
    const k = o.kind || 'cabbage';
    for (let i = 0; i < 2; i++) {
      const x = 4 + i * 8,
        y = 9 + ((i + (o.v || 0)) % 2);
      if (k === 'cabbage') {
        G.ellipse(c, x, y + 1, 3, 2, '#3a7a3a');
        G.ellipse(c, x, y, 3, 2, '#8ad070');
        px(c, x - 1, y - 1, '#c8f0a0');
      } else if (k === 'pumpkin') {
        G.ellipse(c, x, y + 1, 3, 2, '#c05a1a');
        G.ellipse(c, x, y, 3, 2, '#f08a2a');
        px(c, x, y - 3, '#3a7a3a');
      } else if (k === 'carrot') {
        r(c, x - 2, y - 3, 1, 4, '#4aa040');
        r(c, x, y - 4, 1, 5, '#5ab850');
        r(c, x + 2, y - 3, 1, 4, '#4aa040');
        r(c, x - 1, y + 1, 3, 1, '#f07a2a');
      } else {
        r(c, x, y - 3, 1, 4, '#5ab850');
        px(c, x - 1, y - 3, '#7ad070');
        px(c, x + 1, y - 2, '#7ad070');
      }
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };

  // かかし型の農業端末
  G.PROPS.w_scarecrow = function (o) {
    const cv = G.makeCanvas(24, 36);
    const c = cv.ctx;
    const cloth = o.col || '#d06a3a';
    r(c, 6, 33, 12, 3, 'rgba(20,10,40,0.3)');
    r(c, 11, 12, 2, 23, '#8a6a48');
    r(c, 2, 16, 20, 2, '#8a6a48');
    r(c, 6, 15, 12, 10, cloth);
    r(c, 6, 15, 12, 2, G.shade(cloth, 0.25));
    r(c, 2, 16, 5, 5, cloth);
    r(c, 17, 16, 5, 5, cloth);
    px(c, 1, 21, '#e8c060'), px(c, 22, 21, '#e8c060');
    // モニターの顔
    r(c, 6, 5, 12, 10, '#2a2a38');
    r(c, 7, 6, 10, 8, '#0e3a24');
    px(c, 9, 8, '#7dff9a'), px(c, 10, 9, '#7dff9a'), px(c, 8, 9, '#7dff9a');
    px(c, 14, 8, '#7dff9a'), px(c, 15, 9, '#7dff9a'), px(c, 13, 9, '#7dff9a');
    r(c, 10, 11, 4, 1, '#7dff9a');
    // 麦わら帽子
    G.ellipse(c, 12, 5, 10, 2, '#e8c860');
    r(c, 7, 0, 10, 5, '#e8c860');
    r(c, 7, 3, 10, 1, '#c03030');
    return { w: 1, h: 1, img: cv, ox: -4, oy: -20, solid: true, lights: [{ x: 8, y: -10, r: 12, col: '#7dff9a', a: 0.6, flicker: true }] };
  };

  // 果樹（木＋実）
  G.PROPS.w_fruit = function (o) {
    const base = G.prop('tree', { kind: 'green' });
    const cv = G.makeCanvas(base.img.width, base.img.height);
    const c = cv.ctx;
    c.drawImage(base.img, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    const rnd = G.srand((o.seed || 7) * 31);
    const col = o.col || '#ff6a3a';
    let n = 0;
    for (let k = 0; k < 400 && n < 14; k++) {
      const x = 3 + Math.floor(rnd() * (cv.width - 6)),
        y = 3 + Math.floor(rnd() * (cv.height * 0.6));
      const i = (y * cv.width + x) * 4;
      if (d[i + 3] > 0 && d[i + 1] > d[i] + 20) {
        r(c, x, y, 2, 2, col);
        px(c, x, y, G.shade(col, 0.4));
        n++;
      }
    }
    return Object.assign({}, base, { img: cv });
  };

  // メンテナンス・トンネルの隔壁扉（壁に取り付け・3×1）。open:true で開いた状態
  G.PROPS.w_bulkhead = function (o) {
    const cv = G.makeCanvas(48, 44);
    const c = cv.ctx;
    r(c, 0, 0, 48, 44, '#5a5e70');
    r(c, 2, 2, 44, 42, '#3a3e4e');
    for (let i = 0; i < 48; i += 6) r(c, i, 0, 3, 3, '#e8c040');
    r(c, 0, 0, 3, 44, '#e8c040');
    r(c, 45, 0, 3, 44, '#e8c040');
    if (o.open) {
      r(c, 6, 8, 36, 36, '#0c0a18');
      for (let j = 12; j < 44; j += 6) r(c, 10, j, 28, 1, '#2a2e40');
      r(c, 20, 3, 8, 3, '#7dff9a');
    } else {
      r(c, 6, 8, 36, 36, '#7a8094');
      r(c, 6, 8, 36, 2, '#9aa0b4');
      r(c, 23, 8, 2, 36, '#4a4e60');
      for (let j = 14; j < 44; j += 8) r(c, 8, j, 32, 1, '#6a7084');
      r(c, 18, 24, 12, 8, '#2a2a34');
      r(c, 20, 26, 8, 4, '#ff3050');
      for (let i = 8; i < 42; i += 8) G.line(c, i, 38, i + 6, 44, '#e8c040');
      r(c, 20, 3, 8, 3, '#ff3050');
    }
    G.pixText(c, 'MAINT-07', 9, 2 + 0, o.open ? '#7dff9a' : '#ffd25e');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -28, solid: true, lights: [{ x: 24, y: -24, r: 16, col: o.open ? '#7dff9a' : '#ff3050', a: 0.8, blink: !o.open }] };
  };

  // ---------- 地形 ----------
  const W = 50,
    H = 34;
  const g = [];
  for (let y = 0; y < H; y++) g.push(Array(W).fill('.'));
  const fill = (x, y, w, h, ch) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < H && i >= 0 && i < W) g[j][i] = ch;
  };
  const set = (x, y, ch) => {
    if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = ch;
  };
  // 北の構造壁・西の外壁・南の柵・東の柵
  fill(0, 0, W, 4, 'W');
  fill(0, 0, 1, H, 'W');
  fill(0, 33, W, 1, 'F');
  fill(49, 4, 1, 29, 'F');
  // 整備用通路
  fill(1, 4, 48, 1, 'c');
  fill(2, 4, 5, 2, 'x'); // トンネル前
  // 中央の農道（東はアスファルト）
  fill(1, 14, 32, 3, ':');
  fill(33, 14, 17, 3, '-');
  for (let x = 34; x < 50; x++) set(x, 15, '_');
  fill(33, 13, 16, 1, '=');
  fill(33, 17, 16, 1, '=');
  // 用水路（縦）と橋
  fill(30, 5, 2, 28, '~');
  fill(30, 14, 2, 3, 'f');
  fill(30, 24, 2, 2, 'f');
  fill(29, 5, 1, 28, ':');
  fill(32, 5, 1, 28, ':');
  // 用水路（横・南西）
  fill(1, 24, 29, 1, ':');
  fill(33, 24, 16, 2, ':');
  // 畑（北西）
  fill(2, 7, 8, 6, 'o');
  fill(12, 7, 8, 6, 'o');
  fill(11, 5, 1, 9, ':');
  fill(1, 6, 20, 1, ':');
  fill(21, 5, 1, 9, ':');
  // 温室前の通路
  fill(22, 9, 7, 1, ':');
  // 畑（南西）
  fill(2, 18, 10, 5, 'o');
  fill(1, 17, 13, 1, ':');
  fill(12, 17, 1, 7, ':');
  // 南の菜園
  fill(2, 30, 18, 2, 'o');
  fill(1, 29, 28, 1, ':');
  fill(21, 25, 1, 8, ':');
  // ひまわり畑（南東）
  fill(33, 18, 7, 5, ',');
  fill(40, 17, 1, 7, ':');
  // 果樹園の小道
  fill(33, 9, 15, 1, ':');
  fill(40, 5, 1, 8, ':');
  fill(33, 28, 15, 1, ':');
  // 農協前の広場
  fill(14, 22, 15, 2, 'c');
  // 東の入口：バス停まわり
  fill(44, 10, 4, 3, '=');

  // 文字で置ける小物
  for (const x of [35, 40, 45]) set(x, 13, 'L'), set(x, 17, 'L');
  for (const x of [4, 16, 26]) set(x, 13, 'L');
  for (const x of [8, 20]) set(x, 17, 'L');
  set(48, 12, 'Z');
  set(44, 12, 'V');
  for (const [x, y] of [[23, 21], [13, 20], [27, 22], [28, 22]]) set(x, y, 'C');
  for (const [x, y] of [[13, 22], [26, 21]]) set(x, y, 'Q');
  for (const [x, y] of [[1, 32], [10, 32], [20, 32], [24, 32], [28, 32], [34, 32], [41, 32], [47, 32]]) set(x, y, 'J');
  for (const [x, y] of [[23, 32], [27, 30], [25, 27], [24, 31]]) set(x, y, 'b');
  for (const [x, y] of [[47, 5], [47, 7], [48, 9], [47, 21], [46, 23]]) set(x, y, 'T');
  for (const [x, y] of [[45, 22], [37, 16 + 1]]) set(x, y, 'q');

  const rows = g.map((rr) => rr.join(''));

  // ---------- オブジェクト ----------
  const objects = [
    // トンネル入口（5章で開く：フラグ w_tunnel_open を立てて E.reload()）
    { p: 'w_bulkhead', x: 3, y: 3, id: 'w_tunnel_door', show: () => !E.flag('w_tunnel_open') },
    { p: 'w_bulkhead', x: 3, y: 3, open: true, id: 'w_tunnel_door_open', show: () => E.flag('w_tunnel_open') },
    { p: 'sign', x: 7, y: 5, text: 'KEEP OUT', col: '#e8c040', msg: '「関係者以外立入禁止　コロニー公社・第7整備区画」' },
    { p: 'barrel', x: 1, y: 5, hazard: true },
    // 大型送風機
    { p: 'w_fan', x: 13, y: 4, text: 'FAN-01', id: 'w_fan1' },
    { p: 'w_fan', x: 37, y: 4, text: 'FAN-02', id: 'w_fan2' },
    { p: 'pipe', x: 17, y: 3, w: 18, col: '#8a92a6' },
    // 温室
    { p: 'w_greenhouse', x: 22, y: 5, w: 6, h: 4, seed: 1, crop: '#e85a4a', sign: 'TOMATO', msg: 'トマトの温室。コロニーの赤いトマトは、地球のものより甘いらしい。' },
    { p: 'w_greenhouse', x: 22, y: 10, w: 6, h: 4, seed: 2, crop: '#ffd25e', sign: 'LEMON', msg: 'レモンの温室。夜は紫の育成ライトが灯る。' },
    { p: 'w_greenhouse', x: 2, y: 25, w: 5, h: 4, seed: 3, crop: '#ff8fb8', sign: 'BERRY', msg: 'イチゴの温室。「つまみ食いはドローンが見ています」' },
    { p: 'w_greenhouse', x: 8, y: 25, w: 5, h: 4, seed: 4, crop: '#a060e0', sign: 'GRAPE', msg: 'ブドウの温室。' },
    { p: 'w_greenhouse', x: 14, y: 25, w: 6, h: 4, seed: 5, crop: '#7dff9a', sign: 'HERB', msg: 'ハーブの温室。星屑亭のラーメンのネギもここ産だ。' },
    // 農協・タンク
    { p: 'bldg', x: 14, y: 17, w: 9, h: 5, style: 'factory', roof: 'metal', roofCol: '#6a9a6a', wall: '#c8d4b8', sign: 'GREEN CO-OP', signCol: '#2a7a4a', door: 4, doorType: 'shutter', seed: 61 },
    { p: 'tank', x: 24, y: 17, text: 'H2O', col: '#c8d8e8' },
    { p: 'tank', x: 26, y: 17, text: 'N2', col: '#d8d8c8' },
    { p: 'tank', x: 24, y: 19, text: 'CO2', col: '#c8d4c8' },
    { p: 'forklift', x: 24, y: 23 },
    // 農家
    { p: 'bldg', x: 41, y: 18, w: 5, h: 5, style: 'house', roof: 'tile', roofCol: '#a0603a', wall: '#f0e4cc', door: 2, seed: 62 },
    { p: 'bicycle', x: 44, y: 23 },
    // かかし端末
    { p: 'w_scarecrow', x: 5, y: 9, col: '#d06a3a', msg: 'かかし型の農業端末。モニターの顔がニコッと笑っている。「害虫ゼロ・湿度62％・本日も快適です」' },
    { p: 'w_scarecrow', x: 16, y: 10, col: '#3a8ae0', msg: 'かかし型端末。「カラス型ドローン、本日の撃退数：3」' },
    { p: 'w_scarecrow', x: 7, y: 20, col: '#e0c040', msg: 'かかし型端末。頭の帽子は、誰かがかぶせた本物の麦わら帽子だ。' },
    { p: 'w_scarecrow', x: 36, y: 20, col: '#ff5fa2', msg: 'ひまわり畑の端末。「ひまわりはミラーの方向を向きます。マザーより」' },
    // 果樹園（北東）
    ...[[34, 6], [37, 6], [43, 6], [46, 11], [34, 11], [37, 11], [43, 11], [35, 8], [38, 8], [42, 8], [45, 8]].map(([x, y], i) => ({ p: 'w_fruit', x, y, seed: i + 1, col: i % 3 ? '#ff6a3a' : '#ffd25e' })),
    // 果樹園（南東）
    ...[[34, 26], [37, 26], [43, 26], [46, 26], [35, 30], [38, 30], [41, 30], [44, 30], [47, 29], [34, 31]].map(([x, y], i) => ({ p: 'w_fruit', x, y, seed: i + 20, col: i % 2 ? '#e84a6a' : '#ff8a3a' })),
    // 入口
    { p: 'sign', x: 46, y: 12, text: 'BUS', col: '#2a8a5a', msg: '〈グリーン・ブロック前〉バス停。「次のバス：マザーの判断で運行します」' },
    { p: 'bench', x: 45, y: 11 },
    { p: 'sign', x: 47, y: 17, text: 'GREEN', col: '#3a9a4a', msg: 'ようこそ、グリーン・ブロックへ。「コロニーの食卓は、ここから」' },
    { p: 'billboard', x: 36, y: 12, w: 4, text: 'EAT GREEN', col: '#7dff9a' },
    // 南の菜園・用水路
    { p: 'crate', x: 20, y: 30, col: '#c8a060' },
    { p: 'crate', x: 21, y: 31, col: '#c8a060' },
    { p: 'bench', x: 26, y: 26 },
    // 無人販売所・養蜂箱・堆肥
    { p: 'stall', x: 23, y: 26, text: 'VEGGIE', col: '#3a9a4a', msg: '無人販売所。「トマト ¢20　キュウリ ¢15　お金は箱へ。マザーは見ています」' },
    { p: 'crate', x: 26, y: 29, col: '#e8c040', msg: 'ミツバチの巣箱。……中から聞こえるのは、ブーンではなく「ピピピ」。ロボットのミツバチだ。' },
    { p: 'crate', x: 27, y: 29, col: '#e8c040' },
    { p: 'crate', x: 26, y: 31, col: '#e8c040' },
    { p: 'scrap', x: 22, y: 30, msg: '堆肥の山。ほかほかと湯気が出ている。' },
  ];
  // 畑に作物を並べる
  const crops = [
    [2, 7, 8, 6, 'cabbage'],
    [12, 7, 8, 6, 'sprout'],
    [2, 30, 18, 2, 'pumpkin'],
  ];
  for (const [x0, y0, w, h, kind] of crops)
    for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x0 + w; x++) objects.push({ p: 'w_crop', x, y, kind, v: x });
  for (let x = 2; x < 12; x++) for (const y of [18, 20, 22]) objects.push({ p: 'w_crop', x, y, kind: 'carrot', v: x });

  const checks = [
    { x: 3, y: 3, w: 3, h: 2, show: () => !E.flag('w_tunnel_open'), text: 'メンテナンス・トンネル。厳重にロックされている。' },
    { x: 1, y: 3, w: 2, text: 'コロニーの構造壁。この奥には、外壁と内壁のあいだの「層」があるらしい。' },
  ];

  G.defMap('green', G.W1.flatChecks({
    name: 'グリーン・ブロック',
    area: 'クレイドル7・農業区画',
    bgm: () => (G.state.chapter === 7 ? 'tension' : 'town'),
    outdoor: true,
    ambient: 'leaves',
    pal: { grass: '#74c25e', dirt: '#c9a06a', water: '#3a96c8', bigwall: '#8e94a8', concrete: '#b8bcb4' },
    rows,
    objects,
    checks,
    warps: [{ x: 49, y: 14, w: 1, h: 3, to: 'minato', tx: 2, ty: 23, dir: 'right' }],
    lights: [
      { x: 4, y: 4, r: 30, col: '#ff3050', a: 0.4, night: true },
      { x: 47, y: 15, r: 30, col: '#ffe0a0', a: 0.5, night: true },
    ],
    // 送風機の羽根を回す
    overlay: (c, ox, oy, f) => {
      const m = G.field.map;
      for (const id of ['w_fan1', 'w_fan2']) {
        const ob = m.objById(id);
        if (!ob) continue;
        const cx = ob.px + 24 + ox,
          cy = ob.py + 24 + oy;
        if (cx < -40 || cy < -40 || cx > G.W + 40 || cy > G.H + 40) continue;
        const a0 = f * 0.25;
        c.fillStyle = '#c8ccd8';
        for (let k = 0; k < 4; k++) {
          const a = a0 + (k * Math.PI) / 2;
          for (let t = 4; t < 16; t++) {
            const x = Math.round(cx + Math.cos(a) * t),
              y = Math.round(cy + Math.sin(a) * t);
            c.fillRect(x - 1, y - 1, 3, 3);
          }
        }
        c.fillStyle = '#5a5e6e';
        c.fillRect(cx - 1, cy - 1, 2, 2);
        // 手前に立っているキャラは羽根より前に描き直す
        for (const e of G.field.ents)
          if (!e.dead && e.visible !== false && Math.abs(e.x + ox - cx) < 34 && e.y + oy > cy + 10 && e.y + oy < cy + 60) e.draw(c, ox, oy);
      }
      if (G.W1 && G.W1.drawKite) G.W1.drawKite(c, ox, oy, f);
    },
  }));
})();
