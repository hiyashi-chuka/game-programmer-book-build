// =============================================================
//  props.js — 建物・小物（オブジェクト）の手続き生成
// =============================================================
// G.PROPS[type](opts) → { w,h (足元タイル数), img, ox, oy (描画オフセット px),
//   solid: true|false|[[x,y,w,h]...](タイル単位), lights:[{x,y,r,col,a,flicker}], top? }
(function () {
  const P = (G.PROPS = {});
  const r = G.rect,
    px = G.px;
  const S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const cache = new Map();
  G.prop = function (type, o) {
    o = o || {};
    const key = type + JSON.stringify(o);
    if (cache.has(key)) return cache.get(key);
    const f = P[type];
    if (!f) {
      console.warn('unknown prop', type);
      return null;
    }
    // 生成を決定的にする（毎回同じ見た目になるよう乱数を固定）
    const saved = Math.random;
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    Math.random = G.srand(h >>> 0);
    let res;
    try {
      res = f(o);
    } finally {
      Math.random = saved;
    }
    cache.set(key, res);
    return res;
  };

  // ---------- 共通パーツ ----------
  function shadowEllipse(c, cx, cy, rx, ry, a) {
    c.fillStyle = `rgba(20,10,40,${a || 0.28})`;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01)));
      c.fillRect(cx - w, cy + y, w * 2, 1);
    }
  }
  function window1(c, x, y, w, h, o) {
    o = o || {};
    const frame = o.frame || '#f0f0f4';
    r(c, x - 1, y - 1, w + 2, h + 2, G.shade(frame, -0.35));
    r(c, x, y, w, h, frame);
    const gl = o.glass || '#6ab4e8';
    r(c, x + 1, y + 1, w - 2, h - 2, gl);
    // 空の映り込み
    r(c, x + 1, y + 1, w - 2, 1, G.shade(gl, 0.35));
    G.line(c, x + 2, y + h - 3, x + Math.min(w - 3, 5), y + 2, G.shade(gl, 0.45));
    if (o.curtain) {
      r(c, x + 1, y + 1, 2, h - 2, o.curtain);
      r(c, x + w - 3, y + 1, 2, h - 2, o.curtain);
    }
    if (o.cross) {
      r(c, x + Math.floor(w / 2), y + 1, 1, h - 2, frame);
    }
    if (o.sill) r(c, x - 1, y + h, w + 2, 1, G.shade(frame, -0.2));
    if (o.plant) {
      r(c, x, y + h + 1, w, 2, '#a05a3a');
      for (let i = 0; i < w; i += 2) px(c, x + i, y + h - 1 + (i % 3 ? 0 : -1), '#4aa050');
    }
  }
  function stripes(c, x, y, w, h, a, b, sw) {
    for (let i = 0; i < w; i++) r(c, x + i, y, 1, h, Math.floor(i / (sw || 3)) % 2 ? b : a);
  }
  function awning(c, x, y, w, col) {
    const col2 = '#f8f4ee';
    stripes(c, x, y, w, 6, col, col2, 4);
    r(c, x, y, w, 1, G.shade(col, 0.2));
    r(c, x, y + 5, w, 1, G.shade(col, -0.25));
    for (let i = 0; i < w; i += 4) {
      r(c, x + i, y + 6, 3, 1, Math.floor(i / 4) % 2 ? col2 : col);
      px(c, x + i + 1, y + 7, Math.floor(i / 4) % 2 ? col2 : col);
    }
    r(c, x, y + 8, w, 2, 'rgba(20,10,40,0.25)');
  }
  function signBoard(c, x, y, text, col, tcol, sc) {
    sc = sc || 1;
    const tw = G.pixTextW(text, sc);
    const w = tw + 6,
      h = 5 * sc + 5;
    r(c, x - w / 2, y, w, h, G.shade(col, -0.4));
    r(c, x - w / 2 + 1, y + 1, w - 2, h - 2, col);
    r(c, x - w / 2 + 1, y + 1, w - 2, 1, G.shade(col, 0.25));
    G.pixText(c, text, Math.round(x - tw / 2), y + 3, tcol || '#ffffff', sc);
    return { w, h };
  }

  // ---------- 建物 ----------
  // o: {w,h,style:'house'|'shop'|'apartment'|'school'|'factory'|'neon'|'tower'|'garage',
  //     roof:'flat'|'tile'|'metal', roofCol, wall, wallH, door:x(タイル), doorType, sign, signCol, awning, neon, seed}
  P.bldg = function (o) {
    const w = o.w || 4,
      h = o.h || 4;
    const style = o.style || 'house';
    const wallH = o.wallH || (style === 'apartment' ? Math.min(h - 1, 3) : style === 'school' || style === 'tower' ? Math.min(h - 1, 4) : 2);
    const W = w * S,
      Hp = h * S,
      top = 18;
    const cv = mk(W, Hp + top);
    const c = cv.ctx;
    const rnd = G.srand((o.seed || 1) * 7919 + w * 31 + h);
    const roofH = (h - wallH) * S;
    const wy = top + roofH; // 壁面の上端
    const wall = o.wall || { house: '#efe4d0', shop: '#f2ece0', apartment: '#d8d4e4', school: '#f4f2ec', factory: '#9aa2b0', neon: '#3a3450', tower: '#c8d0e0', garage: '#a8a8b8' }[style];
    const roof = o.roof || (style === 'house' ? 'tile' : style === 'factory' || style === 'garage' ? 'metal' : 'flat');
    const roofCol = o.roofCol || (roof === 'tile' ? G.pick(['#c0504a', '#4a6ab0', '#4a8a6a', '#8a5aa0']) : roof === 'metal' ? '#8a92a6' : '#bab6c4');
    const lights = [];

    // --- 屋根 ---
    if (roof === 'tile') {
      r(c, 0, top, W, roofH, roofCol);
      const rows = Math.floor(roofH / 4);
      for (let j = 0; j < rows; j++) {
        const yy = top + j * 4;
        const shadeK = j < rows / 2 ? 0.08 - j * 0.01 : -0.06 - (j - rows / 2) * 0.02;
        r(c, 0, yy, W, 4, G.shade(roofCol, shadeK));
        r(c, 0, yy + 3, W, 1, G.shade(roofCol, -0.3));
        for (let i = (j % 2) * 3; i < W; i += 6) r(c, i, yy, 1, 3, G.shade(roofCol, -0.2));
      }
      // 棟
      const ridge = top + Math.floor(roofH * 0.42);
      r(c, 0, ridge, W, 3, G.shade(roofCol, -0.4));
      r(c, 0, ridge, W, 1, G.shade(roofCol, 0.2));
      // 軒
      r(c, 0, wy - 2, W, 2, G.shade(roofCol, -0.5));
      // 両端の破風
      r(c, 0, top, 2, roofH, G.shade(roofCol, -0.35));
      r(c, W - 2, top, 2, roofH, G.shade(roofCol, -0.45));
      if (rnd() > 0.4 && w >= 3) {
        // 煙突/アンテナ
        const ax = 8 + Math.floor(rnd() * (W - 20));
        r(c, ax, top - 8, 5, 12, '#8a7a7a');
        r(c, ax, top - 8, 5, 2, '#5a4a4a');
      }
    } else if (roof === 'metal') {
      r(c, 0, top, W, roofH, roofCol);
      for (let i = 0; i < W; i += 3) r(c, i, top, 1, roofH, G.shade(roofCol, -0.18));
      for (let i = 1; i < W; i += 3) r(c, i, top, 1, roofH, G.shade(roofCol, 0.1));
      r(c, 0, top, W, 2, G.shade(roofCol, 0.25));
      r(c, 0, wy - 2, W, 2, G.shade(roofCol, -0.4));
      if (rnd() > 0.5) {
        r(c, W - 20, top + 4, 12, 8, '#6a7088');
        r(c, W - 19, top + 5, 10, 2, '#8a90a8');
      }
      // サビ
      for (let k = 0; k < 6; k++) r(c, Math.floor(rnd() * W), top + Math.floor(rnd() * roofH), 2, 3, '#a86a4a');
    } else {
      // 陸屋根（日本の都市風：室外機・給水塔・手すり）
      r(c, 0, top, W, roofH, G.shade(roofCol, -0.25));
      r(c, 2, top + 2, W - 4, roofH - 3, roofCol);
      for (let j = top + 2; j < top + roofH - 1; j += 8) r(c, 2, j, W - 4, 1, G.shade(roofCol, -0.08));
      for (let i = 2; i < W - 2; i += 8) r(c, i, top + 2, 1, roofH - 3, G.shade(roofCol, -0.08));
      r(c, 0, top, W, 2, G.shade(roofCol, 0.25));
      r(c, 2, top + 2, W - 4, 2, G.shade(roofCol, -0.15));
      r(c, 0, wy - 1, W, 1, G.shade(roofCol, -0.45));
      // 屋上の設備
      const nItems = Math.max(1, Math.floor(w / 2));
      for (let k = 0; k < nItems; k++) {
        const t = rnd();
        const ix = 4 + Math.floor(rnd() * Math.max(1, W - 24)),
          iy = top + 4 + Math.floor(rnd() * Math.max(1, roofH - 16));
        if (t < 0.45) {
          // 室外機
          r(c, ix, iy + 9, 12, 2, 'rgba(20,10,40,0.25)');
          r(c, ix, iy, 12, 9, '#e8e8ee');
          r(c, ix, iy + 8, 12, 1, '#a8a8b8');
          G.ellipse(c, ix + 4, iy + 4, 3, 3, '#9a9aaa');
          px(c, ix + 4, iy + 4, '#5a5a6a');
          r(c, ix + 9, iy + 2, 2, 5, '#c0c0cc');
        } else if (t < 0.65 && roofH > 24) {
          // 給水塔
          r(c, ix + 2, iy + 14, 14, 3, 'rgba(20,10,40,0.25)');
          r(c, ix + 3, iy + 6, 1, 9, '#6a6a7a');
          r(c, ix + 14, iy + 6, 1, 9, '#6a6a7a');
          r(c, ix + 1, iy - 4, 16, 11, '#d8dce8');
          r(c, ix + 1, iy - 4, 16, 2, '#f0f2f8');
          r(c, ix + 13, iy - 2, 4, 9, '#b0b4c4');
        } else if (t < 0.8) {
          // 換気口
          r(c, ix, iy + 5, 6, 2, 'rgba(20,10,40,0.25)');
          r(c, ix, iy, 6, 5, '#8a8a9a');
          r(c, ix - 1, iy - 1, 8, 2, '#b0b0c0');
        } else {
          // プランター
          r(c, ix, iy + 2, 14, 4, '#a0603a');
          for (let i = 0; i < 14; i += 2) px(c, ix + i, iy + 1 - (i % 4 ? 0 : 1), '#4aa050'), px(c, ix + i + 1, iy + 1, '#6ac060');
        }
      }
      if (o.antenna || rnd() > 0.7) {
        const ax = W - 10;
        r(c, ax, top - 14, 1, 18, '#7a7a8a');
        r(c, ax - 4, top - 12, 9, 1, '#7a7a8a');
        r(c, ax - 3, top - 8, 7, 1, '#7a7a8a');
        px(c, ax, top - 15, '#ff3050');
        lights.push({ x: ax, y: top - 15 - top, r: 6, col: '#ff3050', a: 0.7, blink: true });
      }
      if (o.heli) {
        G.ellipse(c, W / 2, top + roofH / 2, 10, 7, '#5a5a6a');
        G.pixText(c, 'H', W / 2 - 1, top + roofH / 2 - 2, '#f0f0f0');
      }
    }

    // --- 壁面 ---
    const WH = wallH * S;
    r(c, 0, wy, W, WH, wall);
    r(c, 0, wy, W, 2, G.shade(wall, -0.35)); // 軒下の影
    r(c, W - 2, wy, 2, WH, G.shade(wall, -0.15));
    r(c, 0, wy + WH - 2, W, 2, G.shade(wall, -0.3));
    // 壁の質感
    if (style === 'factory' || style === 'garage') {
      for (let i = 0; i < W; i += 4) r(c, i, wy + 2, 1, WH - 4, G.shade(wall, -0.12));
    } else if (style === 'neon') {
      for (let j = wy + 4; j < wy + WH - 2; j += 4) r(c, 0, j, W, 1, G.shade(wall, -0.15));
    } else {
      for (let k = 0; k < W / 6; k++) px(c, Math.floor(rnd() * W), wy + 3 + Math.floor(rnd() * (WH - 6)), G.shade(wall, -0.06));
    }
    const doorX = o.door === undefined ? Math.floor(w / 2) : o.door;
    const doorPx = doorX * S;
    // 階ごとの窓
    const floors = wallH;
    for (let f = 0; f < floors; f++) {
      const fy = wy + f * S;
      const ground = f === floors - 1;
      if (f > 0) r(c, 0, fy, W, 1, G.shade(wall, -0.1));
      for (let tx = 0; tx < w; tx++) {
        if (ground && Math.abs(tx - doorX) < 1) continue;
        const x0 = tx * S;
        if (ground && (style === 'shop' || style === 'neon') && o.showWindow !== false) {
          // ショーウィンドウ
          window1(c, x0 + 2, fy + 3, 12, 10, { frame: style === 'neon' ? '#5a5070' : '#8a8a98', glass: style === 'neon' ? '#2a2850' : '#7ac0e8' });
          if (style === 'shop') for (let k = 0; k < 3; k++) r(c, x0 + 4 + k * 3, fy + 10, 2, 2, G.pick(['#ff8fb8', '#ffd25e', '#7ae0a0', '#f08a50']));
          lights.push({ x: x0 + 8, y: fy + 8 - top, r: 14, col: '#ffd890', a: 0.5, night: true });
        } else if (ground && (style === 'factory' || style === 'garage')) {
          if (tx % 2 === 0) window1(c, x0 + 3, fy + 3, 10, 6, { frame: '#6a7080', glass: '#5a8ab0' });
        } else if (!ground || style !== 'school' || tx % 2 === 0) {
          const ww = style === 'school' ? 12 : 10,
            wh = style === 'apartment' ? 9 : 8;
          const cur = rnd() > 0.5 ? G.pick(['#f0a0b0', '#a0c0f0', '#f0e0a0', '#c0f0c0', '#e8e0f8']) : null;
          window1(c, x0 + (S - ww) / 2, fy + 3, ww, wh, { frame: style === 'neon' ? '#5a5070' : '#f4f4f8', glass: style === 'neon' ? '#2a2850' : '#6ab4e8', curtain: cur, cross: style !== 'apartment', sill: true, plant: style === 'house' && rnd() > 0.6 });
          if (rnd() > 0.35) lights.push({ x: x0 + 8, y: fy + 7 - top, r: 10, col: G.pick(['#ffd890', '#ffe8b0', '#b0e0ff']), a: 0.45, night: true });
          if (style === 'apartment' && !ground) {
            // ベランダ
            r(c, x0 + 1, fy + 12, 14, 1, '#b0b4c4');
            for (let i = 1; i < 15; i += 2) px(c, x0 + i, fy + 13, '#9094a8');
            r(c, x0 + 1, fy + 14, 14, 1, '#8a8ea0');
            if (rnd() > 0.7) r(c, x0 + 4, fy + 9, 6, 3, G.pick(['#f0f0f0', '#a0c0f0', '#f0a0b0'])); // 洗濯物
          }
        }
      }
    }
    // 学校の時計
    if (style === 'school') {
      const cx = W / 2,
        cy = wy + 8;
      G.ellipse(c, cx, cy, 6, 6, '#5a5a6a');
      G.ellipse(c, cx, cy, 5, 5, '#ffffff');
      r(c, cx, cy - 4, 1, 4, '#2a2a3a');
      r(c, cx, cy, 3, 1, '#2a2a3a');
    }
    // --- 扉 ---
    const dy = wy + WH - 15;
    const dt = o.doorType || (style === 'shop' ? 'glass' : style === 'factory' || style === 'garage' ? 'shutter' : style === 'neon' ? 'neon' : 'wood');
    if (o.door !== -1) {
      if (dt === 'shutter') {
        r(c, doorPx - 4, dy - 1, S + 8, 15, '#5a6070');
        for (let j = 0; j < 14; j += 2) r(c, doorPx - 3, dy + j, S + 6, 1, '#8a90a0');
        r(c, doorPx - 3, dy + 9, S + 6, 5, '#1a1a24');
      } else if (dt === 'glass') {
        r(c, doorPx + 1, dy - 1, 14, 16, '#6a6a78');
        r(c, doorPx + 2, dy, 12, 15, '#9ad0f0');
        r(c, doorPx + 7, dy, 1, 15, '#6a6a78');
        G.line(c, doorPx + 3, dy + 10, doorPx + 6, dy + 2, '#d8f0ff');
      } else if (dt === 'noren') {
        // のれん（ラーメン屋）
        r(c, doorPx + 1, dy - 1, 14, 16, '#3a2a2a');
        r(c, doorPx + 2, dy, 12, 15, '#5a3a30');
        const nc = o.norenCol || '#2a3a7a';
        for (let i = 0; i < 3; i++) r(c, doorPx - 1 + i * 6, dy - 2, 5, 9, nc);
        G.pixText(c, o.norenText || 'RA', doorPx + 3, dy + 1, '#ffffff');
        lights.push({ x: doorPx + 8, y: dy + 8 - top, r: 16, col: '#ffc070', a: 0.6, night: true });
      } else if (dt === 'neon') {
        r(c, doorPx + 1, dy - 1, 14, 16, '#ff5fa2');
        r(c, doorPx + 2, dy, 12, 15, '#1a1428');
        r(c, doorPx + 2, dy + 1, 12, 1, '#ff5fa2');
        lights.push({ x: doorPx + 8, y: dy + 6 - top, r: 18, col: '#ff5fa2', a: 0.7 });
      } else {
        r(c, doorPx + 2, dy - 1, 12, 16, G.shade(o.doorCol || '#8a5a3a', -0.35));
        r(c, doorPx + 3, dy, 10, 15, o.doorCol || '#8a5a3a');
        r(c, doorPx + 4, dy + 2, 8, 5, G.shade(o.doorCol || '#8a5a3a', 0.12));
        r(c, doorPx + 4, dy + 9, 8, 4, G.shade(o.doorCol || '#8a5a3a', 0.12));
        px(c, doorPx + 11, dy + 8, '#e8c050');
      }
      // 玄関マット/ステップ
      r(c, doorPx + 1, wy + WH - 1, 14, 1, G.shade(wall, -0.45));
    }
    // --- ひさし・看板 ---
    if (o.awning) awning(c, Math.max(0, doorPx - 16), dy - 10, Math.min(W, 48), o.awning);
    if (o.sign) {
      const sy = o.awning ? dy - 22 : wy + (wallH > 2 ? S * (wallH - 2) : 1) + 2;
      const sc = o.signScale || 1;
      const sb = signBoard(c, o.signX !== undefined ? o.signX * S + 8 : W / 2, sy, o.sign, o.signCol || '#2a3a7a', o.signText || '#ffffff', sc);
      if (o.neon || style === 'neon') lights.push({ x: o.signX !== undefined ? o.signX * S + 8 : W / 2, y: sy + sb.h / 2 - top, r: 26, col: o.signText || o.signCol || '#ff5fa2', a: 0.85, flicker: true });
    }
    if (o.neonTube) {
      // 壁面のネオン管
      const nc = o.neonTube;
      r(c, 4, wy + 3, W - 8, 1, nc);
      r(c, 4, wy + 3, 1, 6, nc);
      r(c, W - 5, wy + 3, 1, 6, nc);
      lights.push({ x: W / 2, y: wy + 3 - top, r: W / 2, col: nc, a: 0.6, line: true });
    }
    if (o.vending) {
      // 店先の自販機
      const vx = (o.vending - 0) * S + 2;
      drawVending(c, vx, wy + WH - 24 + 1, '#e04a4a');
      lights.push({ x: vx + 6, y: wy + WH - 14 - top, r: 14, col: '#c0f0ff', a: 0.6 });
    }
    return { w, h, img: cv, ox: 0, oy: -top, solid: true, lights, door: doorX, bldg: true };
  };

  // ---------- 自然物 ----------
  function canopy(c, cx, cy, rad, cols, seed) {
    const rnd = G.srand(seed);
    const blobs = [];
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2,
        d = rnd() * rad * 0.55;
      blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, rad * (0.45 + rnd() * 0.25)]);
    }
    blobs.push([cx, cy, rad * 0.7]);
    // 影色→ベース→ハイライトの順に重ねる
    blobs.forEach(([x, y, rr]) => G.ellipse(c, Math.round(x + 1), Math.round(y + 2), Math.round(rr), Math.round(rr * 0.9), cols[0]));
    blobs.forEach(([x, y, rr]) => G.ellipse(c, Math.round(x), Math.round(y), Math.round(rr - 1), Math.round(rr * 0.9 - 1), cols[1]));
    blobs.forEach(([x, y, rr]) => G.ellipse(c, Math.round(x - rr * 0.25), Math.round(y - rr * 0.3), Math.round(rr * 0.5), Math.round(rr * 0.4), cols[2]));
    // 葉のテクスチャ
    for (let i = 0; i < rad * 6; i++) {
      const a = rnd() * Math.PI * 2,
        d = rnd() * rad;
      const x = Math.round(cx + Math.cos(a) * d),
        y = Math.round(cy + Math.sin(a) * d * 0.85);
      const cur = c.getImageData(x, y, 1, 1).data;
      if (cur[3] > 0) px(c, x, y, i % 3 ? cols[0] : cols[3] || cols[2]);
    }
  }
  P.tree = function (o) {
    const kind = o.kind || 'green';
    const cv = mk(40, 48);
    const c = cv.ctx;
    shadowEllipse(c, 20, 44, 13, 3, 0.3);
    r(c, 18, 28, 5, 16, '#7a5038');
    r(c, 18, 28, 2, 16, '#9a6a48');
    r(c, 22, 28, 1, 16, '#5a3828');
    r(c, 16, 42, 9, 2, '#6a4430');
    const cols = {
      green: ['#2f6e3a', '#4a9a4a', '#7cc864', '#3a8040'],
      sakura: ['#d0708a', '#f0a0b8', '#ffd4e0', '#e088a0'],
      autumn: ['#a04a2a', '#d8783a', '#f8b060', '#c0602a'],
      dark: ['#1f4a3a', '#2f6a4a', '#4a9a64', '#2a5a40'],
      neon: ['#3a2a6a', '#5a3aa0', '#4ef0ff', '#ff5fa2'],
    }[kind];
    canopy(c, 20, 18, 15, cols, (o.seed || 3) * 13);
    if (kind === 'sakura') for (let i = 0; i < 6; i++) px(c, 8 + ((i * 7) % 26), 36 + (i % 3) * 3, '#ffc0d0');
    return { w: 1, h: 1, img: cv, ox: -12, oy: -32, solid: true, sway: true };
  };
  P.bush = function (o) {
    const cv = mk(20, 18);
    const c = cv.ctx;
    shadowEllipse(c, 10, 15, 9, 2, 0.25);
    const cols = o.kind === 'flower' ? ['#2f6e3a', '#4a9a4a', '#7cc864', '#ff8fb8'] : ['#2f6e3a', '#4a9a4a', '#7cc864', '#3a8040'];
    canopy(c, 10, 9, 8, cols, (o.seed || 1) * 7);
    if (o.kind === 'flower') for (let i = 0; i < 5; i++) px(c, 4 + ((i * 5) % 12), 4 + ((i * 3) % 8), i % 2 ? '#ff8fb8' : '#ffffff');
    return { w: 1, h: 1, img: cv, ox: -2, oy: -4, solid: true };
  };
  P.flowerbed = function (o) {
    const w = o.w || 2;
    const cv = mk(w * S, 16);
    const c = cv.ctx;
    r(c, 0, 4, w * S, 12, '#8a8a98');
    r(c, 1, 5, w * S - 2, 9, '#6a4a30');
    r(c, 0, 4, w * S, 1, '#b0b0c0');
    for (let i = 0; i < w * 6; i++) {
      const x = 2 + ((i * 5) % (w * S - 4)),
        y = 3 + ((i * 7) % 8);
      px(c, x, y + 2, '#3a8040');
      px(c, x, y + 1, G.pick(['#ff8fb8', '#ffd25e', '#ffffff', '#9fd8ff', '#ff6070']));
    }
    return { w, h: 1, img: cv, ox: 0, oy: 0, solid: true };
  };

  // ---------- 街の小物 ----------
  P.lamp = function (o) {
    const cv = mk(16, 48);
    const c = cv.ctx;
    shadowEllipse(c, 8, 45, 5, 2);
    r(c, 7, 8, 2, 38, '#4a4a5a');
    r(c, 7, 8, 1, 38, '#7a7a8a');
    r(c, 5, 43, 6, 3, '#3a3a48');
    // ランプ部
    r(c, 3, 4, 10, 4, '#3a3a48');
    r(c, 4, 8, 8, 2, '#fff4c0');
    r(c, 4, 3, 8, 1, '#5a5a6a');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -32, solid: true, lights: [{ x: 8, y: -22, r: 34, col: o.col || '#ffe0a0', a: 0.75, night: true, cone: true }] };
  };
  function drawVending(c, x, y, col) {
    r(c, x, y, 13, 23, G.shade(col, -0.3));
    r(c, x + 1, y + 1, 11, 21, col);
    r(c, x + 2, y + 2, 9, 9, '#c8f0ff');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) r(c, x + 3 + i * 3, y + 3 + j * 4, 2, 3, G.pick(['#ff5050', '#50a0ff', '#ffd040', '#50d080', '#ffffff']));
    r(c, x + 2, y + 13, 9, 1, '#2a2a3a');
    r(c, x + 3, y + 17, 7, 3, '#1a1a24');
    r(c, x + 9, y + 13, 2, 3, '#e8e8f0');
  }
  P.vending = function (o) {
    const cv = mk(16, 28);
    const c = cv.ctx;
    r(c, 1, 25, 15, 3, 'rgba(20,10,40,0.3)');
    drawVending(c, 1, 2, o.col || G.pick(['#e04a4a', '#3a7ad0', '#40a070', '#f0f0f0']));
    return { w: 1, h: 1, img: cv, ox: 0, oy: -12, solid: true, lights: [{ x: 8, y: -4, r: 18, col: '#c0f0ff', a: 0.7 }] };
  };
  P.bench = function (o) {
    const cv = mk(32, 20);
    const c = cv.ctx;
    r(c, 2, 17, 28, 3, 'rgba(20,10,40,0.25)');
    r(c, 3, 10, 2, 8, '#4a4a5a');
    r(c, 27, 10, 2, 8, '#4a4a5a');
    r(c, 1, 3, 30, 3, '#b0703a');
    r(c, 1, 3, 30, 1, '#d09060');
    r(c, 1, 9, 30, 4, '#c0804a');
    r(c, 1, 9, 30, 1, '#e0a070');
    r(c, 1, 12, 30, 1, '#8a5030');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -4, solid: true };
  };
  P.trash = function (o) {
    const cv = mk(16, 20);
    const c = cv.ctx;
    r(c, 2, 17, 12, 3, 'rgba(20,10,40,0.3)');
    r(c, 3, 5, 10, 13, '#3a8a5a');
    r(c, 3, 5, 2, 13, '#5aaa7a');
    r(c, 2, 3, 12, 3, '#2a6a4a');
    r(c, 6, 9, 4, 4, '#f0f0f0');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -4, solid: true };
  };
  P.hydrant = function () {
    const cv = mk(16, 18);
    const c = cv.ctx;
    r(c, 4, 15, 8, 3, 'rgba(20,10,40,0.3)');
    r(c, 5, 5, 6, 11, '#d83a3a');
    r(c, 3, 8, 10, 3, '#b02a2a');
    r(c, 5, 3, 6, 3, '#f05a5a');
    r(c, 6, 6, 1, 8, '#f07070');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -2, solid: true };
  };
  P.mailbox = function () {
    const cv = mk(16, 24);
    const c = cv.ctx;
    r(c, 3, 21, 10, 3, 'rgba(20,10,40,0.3)');
    r(c, 7, 12, 2, 10, '#5a5a6a');
    r(c, 3, 2, 10, 11, '#e04040');
    r(c, 3, 2, 10, 2, '#f06060');
    r(c, 5, 6, 6, 1, '#2a1a1a');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -8, solid: true };
  };
  P.bicycle = function (o) {
    const cv = mk(24, 16);
    const c = cv.ctx;
    const col = o.col || '#3a7ad0';
    for (const cx of [5, 18]) {
      G.ellipse(c, cx, 10, 4, 4, '#2a2a34');
      G.ellipse(c, cx, 10, 3, 3, 'rgba(0,0,0,0)');
      c.clearRect(cx - 2, 8, 5, 5);
    }
    G.line(c, 5, 10, 11, 5, col);
    G.line(c, 11, 5, 18, 10, col);
    G.line(c, 11, 5, 9, 10, col);
    G.line(c, 9, 10, 5, 10, col);
    r(c, 9, 3, 4, 1, '#2a2a34');
    r(c, 16, 2, 4, 1, '#2a2a34');
    G.line(c, 17, 3, 18, 10, '#8a8a9a');
    return { w: 1, h: 1, img: cv, ox: -4, oy: 0, solid: false };
  };
  P.sign = function (o) {
    const cv = mk(32, 32);
    const c = cv.ctx;
    r(c, 15, 14, 2, 18, '#5a5a6a');
    signBoard(c, 16, 2, o.text || 'INFO', o.col || '#2a6ad0', '#ffffff');
    return { w: 1, h: 1, img: cv, ox: -8, oy: -16, solid: true, lights: o.neon ? [{ x: 8, y: -10, r: 20, col: o.col, a: 0.7, flicker: true }] : [] };
  };
  P.billboard = function (o) {
    // ホロ看板（大型）
    const w = o.w || 3;
    const cv = mk(w * S, 48);
    const c = cv.ctx;
    r(c, 6, 30, 2, 18, '#4a4a5a');
    r(c, w * S - 8, 30, 2, 18, '#4a4a5a');
    const col = o.col || '#ff5fa2';
    r(c, 0, 4, w * S, 26, '#1a1428');
    r(c, 1, 5, w * S - 2, 24, G.shade(col, -0.6));
    for (let j = 6; j < 28; j += 2) r(c, 1, j, w * S - 2, 1, G.shade(col, -0.5));
    const t = o.text || 'CRADLE 7';
    const sc = G.pixTextW(t, 2) < w * S - 6 ? 2 : 1;
    G.pixText(c, t, Math.round((w * S - G.pixTextW(t, sc)) / 2), 17 - (5 * sc) / 2, col, sc);
    r(c, 0, 4, w * S, 1, col);
    r(c, 0, 29, w * S, 1, col);
    return { w, h: 1, img: cv, ox: 0, oy: -32, solid: true, lights: [{ x: (w * S) / 2, y: -15, r: w * 12, col, a: 0.8, flicker: true }] };
  };
  P.car = function (o) {
    // ホバーカー（横向き）
    const col = o.col || G.pick(['#e04a4a', '#3a7ad0', '#f0f0f0', '#ffd25e', '#40a070']);
    const cv = mk(48, 28);
    const c = cv.ctx;
    r(c, 4, 22, 40, 4, 'rgba(20,10,40,0.35)');
    r(c, 6, 20, 36, 2, '#4ef0ff');
    r(c, 3, 10, 42, 10, col);
    r(c, 3, 10, 42, 2, G.shade(col, 0.25));
    r(c, 3, 18, 42, 2, G.shade(col, -0.35));
    r(c, 12, 3, 22, 8, G.shade(col, -0.1));
    r(c, 14, 4, 8, 6, '#9ad0f0');
    r(c, 24, 4, 8, 6, '#9ad0f0');
    r(c, 14, 4, 8, 1, '#d8f0ff');
    r(c, 43, 12, 2, 3, '#fff4c0');
    r(c, 3, 12, 2, 3, '#ff5050');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -12, solid: true, lights: [{ x: 46, y: -1, r: 14, col: '#fff4c0', a: 0.5, night: true }] };
  };
  P.stall = function (o) {
    // 屋台（提灯つき）
    const W = 48;
    const cv = mk(W, 44);
    const c = cv.ctx;
    const col = o.col || '#c03a3a';
    r(c, 2, 40, W - 4, 4, 'rgba(20,10,40,0.3)');
    r(c, 4, 14, 2, 28, '#6a4a30');
    r(c, W - 6, 14, 2, 28, '#6a4a30');
    // 屋根
    stripes(c, 0, 6, W, 9, col, '#f8f0e0', 6);
    r(c, 0, 6, W, 1, G.shade(col, 0.3));
    r(c, 0, 14, W, 2, G.shade(col, -0.4));
    // カウンター
    r(c, 2, 26, W - 4, 14, '#8a5a3a');
    r(c, 2, 26, W - 4, 3, '#b07a4a');
    r(c, 2, 39, W - 4, 1, '#5a3a20');
    G.pixText(c, o.text || 'FOOD', 6, 31, '#ffd25e');
    // 鍋と湯気
    r(c, 30, 20, 10, 6, '#7a7a8a');
    r(c, 30, 20, 10, 1, '#b0b0c0');
    // 提灯
    for (const lx of [8, W - 10]) {
      r(c, lx, 15, 4, 6, '#ff6040');
      r(c, lx, 15, 4, 1, '#2a2a2a');
      r(c, lx, 20, 4, 1, '#2a2a2a');
      px(c, lx + 1, 17, '#ffd080');
    }
    return { w: 3, h: 1, img: cv, ox: 0, oy: -28, solid: true, steam: [35, -10], lights: [{ x: 10, y: -10, r: 18, col: '#ff8050', a: 0.8, flicker: true }, { x: W - 8, y: -10, r: 18, col: '#ff8050', a: 0.8, flicker: true }] };
  };
  P.fountain = function (o) {
    const cv = mk(48, 44);
    const c = cv.ctx;
    G.ellipse(c, 24, 30, 23, 12, '#8a8a9a');
    G.ellipse(c, 24, 29, 21, 10, '#b0b0c0');
    G.ellipse(c, 24, 30, 18, 8, '#4a9ad8');
    G.ellipse(c, 24, 30, 14, 5, '#5aaae8');
    r(c, 21, 10, 6, 20, '#c0c0d0');
    r(c, 21, 10, 2, 20, '#e0e0ec');
    G.ellipse(c, 24, 10, 7, 3, '#b0b0c0');
    G.ellipse(c, 24, 9, 5, 2, '#5aaae8');
    return { w: 3, h: 2, img: cv, ox: 0, oy: -12, solid: true, fountain: [24, 4] };
  };
  P.statue = function (o) {
    // 戦没者慰霊碑・AF像
    const cv = mk(32, 56);
    const c = cv.ctx;
    r(c, 2, 40, 28, 14, '#8a8a9a');
    r(c, 2, 40, 28, 2, '#b0b0c0');
    r(c, 4, 44, 24, 6, '#7a7a8a');
    G.pixText(c, 'S.C.75', 5, 45, '#d0d0e0');
    // 像（ロボのシルエット）
    r(c, 11, 10, 10, 14, '#a8a090');
    r(c, 13, 3, 6, 7, '#a8a090');
    r(c, 8, 12, 3, 12, '#a8a090');
    r(c, 21, 12, 3, 12, '#a8a090');
    r(c, 12, 24, 3, 16, '#a8a090');
    r(c, 17, 24, 3, 16, '#a8a090');
    r(c, 11, 10, 2, 14, '#c8c0b0');
    px(c, 16, 6, '#ff5060');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -40, solid: true };
  };

  // ---------- スクラップ・工業 ----------
  P.container = function (o) {
    const col = o.col || G.pick(['#c04a3a', '#3a6ab0', '#3a9a6a', '#d0902a', '#7a5aa0']);
    const w = 3;
    const stack = o.stack || 1;
    const cv = mk(w * S, 20 + stack * 18);
    const c = cv.ctx;
    for (let k = 0; k < stack; k++) {
      const y = 2 + (stack - 1 - k) * 18;
      const cc = k === 0 ? col : G.shade(G.pick(['#c04a3a', '#3a6ab0', '#3a9a6a', '#d0902a']), 0);
      r(c, 0, y, w * S, 18 + (k === 0 ? 14 : 0), cc);
      for (let i = 2; i < w * S; i += 3) r(c, i, y + 2, 1, 14, G.shade(cc, -0.2));
      r(c, 0, y, w * S, 2, G.shade(cc, 0.25));
      r(c, 0, y + 16, w * S, 2, G.shade(cc, -0.35));
      if (k === 0) {
        r(c, 0, y + 18, w * S, 12, G.shade(cc, -0.15));
        for (let i = 2; i < w * S; i += 3) r(c, i, y + 18, 1, 12, G.shade(cc, -0.3));
        G.pixText(c, o.text || 'C7-' + ((o.seed || 1) * 37) % 100, 4, y + 21, '#f0f0f0');
      }
    }
    return { w, h: 2, img: cv, ox: 0, oy: 32 - cv.height, solid: true };
  };
  P.scrap = function (o) {
    const cv = mk(32, 30);
    const c = cv.ctx;
    const rnd = G.srand((o.seed || 5) * 101);
    shadowEllipse(c, 16, 26, 15, 3, 0.35);
    for (let i = 0; i < 26; i++) {
      const x = 3 + Math.floor(rnd() * 24),
        y = 8 + Math.floor(rnd() * 16) + Math.abs(x - 16) * 0.3;
      const w = 3 + Math.floor(rnd() * 7),
        h = 2 + Math.floor(rnd() * 4);
      const col = G.pick(['#7a8090', '#9aa0b0', '#a86a4a', '#5a6070', '#c0a040', '#4a6a8a', '#8a5a4a']);
      r(c, x, y, w, h, col);
      r(c, x, y, w, 1, G.shade(col, 0.25));
    }
    // パイプやタイヤ
    G.ellipse(c, 9, 20, 4, 3, '#2a2a30');
    G.ellipse(c, 9, 20, 2, 1, '#4a4a50');
    G.line(c, 18, 6, 27, 12, '#b0b4c4');
    G.line(c, 18, 7, 27, 13, '#7a7e8e');
    return { w: 2, h: 2, img: cv, ox: 0, oy: 2, solid: true };
  };
  P.crate = function (o) {
    const cv = mk(16, 20);
    const c = cv.ctx;
    r(c, 1, 17, 15, 3, 'rgba(20,10,40,0.3)');
    const col = o.col || '#b08050';
    r(c, 1, 2, 14, 15, col);
    r(c, 1, 2, 14, 2, G.shade(col, 0.25));
    r(c, 1, 16, 14, 1, G.shade(col, -0.4));
    G.line(c, 2, 5, 13, 15, G.shade(col, -0.25));
    G.line(c, 13, 5, 2, 15, G.shade(col, -0.25));
    r(c, 1, 2, 1, 15, G.shade(col, -0.3));
    r(c, 14, 2, 1, 15, G.shade(col, -0.3));
    return { w: 1, h: 1, img: cv, ox: 0, oy: -4, solid: true };
  };
  P.barrel = function (o) {
    const col = o.col || G.pick(['#3a6ab0', '#c04a3a', '#d0a02a', '#4a8a5a']);
    const cv = mk(16, 20);
    const c = cv.ctx;
    r(c, 2, 17, 13, 3, 'rgba(20,10,40,0.3)');
    r(c, 3, 3, 10, 15, col);
    r(c, 3, 3, 3, 15, G.shade(col, 0.2));
    r(c, 11, 3, 2, 15, G.shade(col, -0.3));
    r(c, 3, 7, 10, 1, G.shade(col, -0.35));
    r(c, 3, 13, 10, 1, G.shade(col, -0.35));
    G.ellipse(c, 8, 3, 5, 1, G.shade(col, -0.15));
    if (o.hazard) {
      r(c, 6, 9, 4, 3, '#ffd25e');
      px(c, 8, 10, '#2a2a2a');
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: -4, solid: true };
  };
  P.tires = function () {
    const cv = mk(16, 20);
    const c = cv.ctx;
    for (let k = 0; k < 3; k++) {
      G.ellipse(c, 8, 15 - k * 5, 7, 3, '#2a2a30');
      G.ellipse(c, 8, 14 - k * 5, 6, 2, '#3a3a40');
      G.ellipse(c, 8, 14 - k * 5, 3, 1, '#1a1a20');
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: -4, solid: true };
  };
  P.pipe = function (o) {
    const w = o.w || 3,
      vert = !!o.vertical;
    const cv = mk(vert ? 16 : w * S, vert ? w * S : 16);
    const c = cv.ctx;
    const col = o.col || '#8a92a6';
    if (vert) {
      r(c, 3, 0, 10, w * S, col);
      r(c, 4, 0, 2, w * S, G.shade(col, 0.3));
      r(c, 11, 0, 2, w * S, G.shade(col, -0.35));
      for (let j = 8; j < w * S; j += 16) r(c, 2, j, 12, 2, G.shade(col, -0.2));
    } else {
      r(c, 0, 3, w * S, 10, col);
      r(c, 0, 4, w * S, 2, G.shade(col, 0.3));
      r(c, 0, 11, w * S, 2, G.shade(col, -0.35));
      for (let i = 8; i < w * S; i += 16) r(c, i, 2, 2, 12, G.shade(col, -0.2));
      r(c, 0, 13, w * S, 3, 'rgba(20,10,40,0.25)');
    }
    return { w: vert ? 1 : w, h: vert ? w : 1, img: cv, ox: 0, oy: 0, solid: true };
  };
  P.tank = function (o) {
    const col = o.col || '#c8ccd8';
    const cv = mk(32, 44);
    const c = cv.ctx;
    shadowEllipse(c, 16, 40, 15, 3, 0.35);
    r(c, 2, 10, 28, 30, col);
    r(c, 2, 10, 6, 30, G.shade(col, 0.2));
    r(c, 24, 10, 6, 30, G.shade(col, -0.25));
    G.ellipse(c, 16, 10, 14, 5, G.shade(col, 0.1));
    G.ellipse(c, 16, 10, 10, 3, G.shade(col, -0.1));
    for (let j = 16; j < 40; j += 8) r(c, 2, j, 28, 1, G.shade(col, -0.15));
    G.pixText(c, o.text || 'O2', 10, 22, '#3a6ab0');
    return { w: 2, h: 2, img: cv, ox: 0, oy: -12, solid: true };
  };
  P.crane = function (o) {
    const cv = mk(48, 96);
    const c = cv.ctx;
    const col = '#e8b030';
    r(c, 18, 20, 4, 72, col);
    r(c, 26, 20, 4, 72, col);
    for (let j = 22; j < 90; j += 8) {
      G.line(c, 21, j, 26, j + 7, G.shade(col, -0.3));
      G.line(c, 26, j, 21, j + 7, G.shade(col, -0.3));
    }
    r(c, 0, 14, 48, 6, col);
    r(c, 0, 14, 48, 1, G.shade(col, 0.3));
    r(c, 30, 8, 10, 8, '#3a3a48');
    r(c, 32, 9, 6, 4, '#9ad0f0');
    r(c, 4, 20, 1, 30, '#2a2a30');
    r(c, 1, 50, 7, 4, '#5a5a6a');
    r(c, 14, 88, 20, 6, '#5a5a6a');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -80, solid: [[1, 0, 1, 1]], lights: [{ x: 35, y: -84, r: 8, col: '#ff3050', a: 0.8, blink: true }] };
  };
  P.forklift = function () {
    const cv = mk(32, 28);
    const c = cv.ctx;
    r(c, 2, 24, 28, 4, 'rgba(20,10,40,0.3)');
    r(c, 8, 10, 18, 12, '#e8b030');
    r(c, 8, 10, 18, 2, '#f8d060');
    r(c, 12, 2, 12, 9, '#3a3a48');
    r(c, 14, 4, 8, 5, '#9ad0f0');
    r(c, 2, 4, 2, 18, '#5a5a6a');
    r(c, 0, 20, 8, 2, '#8a8a9a');
    G.ellipse(c, 12, 22, 3, 3, '#1a1a20');
    G.ellipse(c, 23, 22, 3, 3, '#1a1a20');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -12, solid: true };
  };
  P.terminal = function (o) {
    // 端末・コンソール
    const col = o.col || '#4ef0ff';
    const cv = mk(16, 26);
    const c = cv.ctx;
    r(c, 1, 22, 15, 4, 'rgba(20,10,40,0.3)');
    r(c, 2, 8, 12, 15, '#4a4a5a');
    r(c, 2, 8, 12, 2, '#6a6a7a');
    r(c, 1, 0, 14, 10, '#2a2a38');
    r(c, 2, 1, 12, 8, G.shade(col, -0.6));
    for (let j = 2; j < 8; j += 2) r(c, 3, j, 4 + ((j * 3) % 7), 1, col);
    r(c, 3, 13, 10, 3, '#3a3a48');
    for (let i = 0; i < 4; i++) px(c, 4 + i * 2, 14, i % 2 ? '#ff5fa2' : '#ffd25e');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -10, solid: true, lights: [{ x: 8, y: -6, r: 16, col, a: 0.7, flicker: true }] };
  };
  P.server = function (o) {
    const cv = mk(16, 32);
    const c = cv.ctx;
    r(c, 1, 29, 15, 3, 'rgba(20,10,40,0.3)');
    r(c, 1, 0, 14, 30, '#2a2a38');
    r(c, 1, 0, 14, 1, '#4a4a5a');
    for (let j = 2; j < 28; j += 4) {
      r(c, 2, j, 12, 3, '#1a1a24');
      px(c, 3, j + 1, G.pick(['#4ef0ff', '#7dff9a', '#ff5fa2']));
      px(c, 5, j + 1, G.pick(['#4ef0ff', '#7dff9a', '#1a1a24']));
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: -16, solid: true, lights: [{ x: 8, y: -4, r: 12, col: '#4ef0ff', a: 0.5, flicker: true }] };
  };
  P.capsule = function (o) {
    // 研究所のカプセル（培養槽）
    const cv = mk(24, 44);
    const c = cv.ctx;
    shadowEllipse(c, 12, 41, 11, 3, 0.35);
    r(c, 2, 34, 20, 8, '#5a5a6a');
    r(c, 2, 34, 20, 2, '#8a8a9a');
    r(c, 3, 6, 18, 28, o.empty ? '#2a4a5a' : '#3ac0c8');
    r(c, 3, 6, 4, 28, 'rgba(255,255,255,0.25)');
    for (let i = 0; i < 6; i++) px(c, 8 + ((i * 5) % 10), 30 - i * 4, '#bff8ff');
    if (!o.empty) {
      r(c, 10, 14, 4, 4, '#f0d0c0');
      r(c, 9, 18, 6, 10, '#d0e8f0');
    }
    r(c, 2, 2, 20, 5, '#5a5a6a');
    r(c, 2, 2, 20, 1, '#8a8a9a');
    return { w: 1, h: 1, img: cv, ox: -4, oy: -28, solid: true, lights: [{ x: 8, y: -12, r: 22, col: '#4ef0ff', a: 0.7 }] };
  };
  P.starseed = function () {
    const cv = mk(64, 80);
    const c = cv.ctx;
    G.glow(c, 32, 40, 32, 'rgba(180,240,255,0.6)');
    const pts = [[32, 2], [50, 26], [44, 64], [32, 76], [20, 64], [14, 26]];
    c.fillStyle = '#9ae8ff';
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.fill();
    c.fillStyle = '#e8fbff';
    c.beginPath();
    c.moveTo(32, 2);
    c.lineTo(50, 26);
    c.lineTo(32, 40);
    c.lineTo(14, 26);
    c.fill();
    c.fillStyle = '#5ab0e8';
    c.beginPath();
    c.moveTo(32, 40);
    c.lineTo(50, 26);
    c.lineTo(44, 64);
    c.lineTo(32, 76);
    c.fill();
    G.line(c, 32, 2, 32, 76, '#ffffff');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -64, solid: true, lights: [{ x: 32, y: -24, r: 70, col: '#9ae8ff', a: 0.9, flicker: true }] };
  };

  // ---------- 屋内家具 ----------
  P.desk = function (o) {
    const cv = mk(16, 22);
    const c = cv.ctx;
    r(c, 1, 19, 15, 3, 'rgba(20,10,40,0.25)');
    r(c, 2, 10, 1, 10, '#6a6a7a');
    r(c, 13, 10, 1, 10, '#6a6a7a');
    r(c, 1, 4, 14, 7, '#d8b080');
    r(c, 1, 4, 14, 1, '#f0d0a0');
    r(c, 1, 10, 14, 2, '#a8805a');
    // 椅子
    r(c, 4, 14, 8, 2, '#c09060');
    r(c, 4, 16, 1, 4, '#6a6a7a');
    r(c, 11, 16, 1, 4, '#6a6a7a');
    if (o.book) r(c, 4, 5, 5, 3, G.pick(['#e05050', '#5080e0', '#50b070']));
    return { w: 1, h: 1, img: cv, ox: 0, oy: -6, solid: true };
  };
  P.table = function (o) {
    const w = o.w || 2,
      h = o.h || 1;
    const cv = mk(w * S, h * S + 8);
    const c = cv.ctx;
    const col = o.col || '#b07a4a';
    r(c, 1, h * S + 4, w * S - 2, 4, 'rgba(20,10,40,0.25)');
    r(c, 1, 2, w * S - 2, h * S - 2, col);
    r(c, 1, 2, w * S - 2, 1, G.shade(col, 0.25));
    r(c, 1, h * S, w * S - 2, 3, G.shade(col, -0.3));
    r(c, 2, h * S + 3, 2, 4, G.shade(col, -0.4));
    r(c, w * S - 4, h * S + 3, 2, 4, G.shade(col, -0.4));
    if (o.items) {
      for (let i = 0; i < w * 2; i++) {
        const ix = 4 + i * 7,
          iy = 4 + (i % 2) * 4;
        if (ix > w * S - 6) break;
        G.ellipse(c, ix, iy + 1, 2, 1, '#f0f0f0');
        px(c, ix, iy, G.pick(['#e8c050', '#e05050', '#70b050']));
      }
    }
    return { w, h, img: cv, ox: 0, oy: -2, solid: true };
  };
  P.counter = function (o) {
    const w = o.w || 3;
    const cv = mk(w * S, 24);
    const c = cv.ctx;
    const col = o.col || '#8a5a3a';
    r(c, 0, 4, w * S, 20, G.shade(col, -0.2));
    r(c, 0, 4, w * S, 5, o.top || '#d8c8b0');
    r(c, 0, 4, w * S, 1, '#f0e8d8');
    for (let i = 6; i < w * S; i += 12) r(c, i, 11, 1, 12, G.shade(col, -0.4));
    if (o.items !== false)
      for (let i = 0; i < w; i++) {
        const t = G.hash(i, w, 3);
        if (t > 0.5) {
          r(c, i * S + 4, 0, 6, 5, '#f0f0f0');
          r(c, i * S + 5, 1, 4, 2, t > 0.75 ? '#e8a050' : '#c86040');
        }
      }
    return { w, h: 1, img: cv, ox: 0, oy: -8, solid: true };
  };
  P.stool = function () {
    const cv = mk(16, 16);
    const c = cv.ctx;
    r(c, 4, 13, 8, 2, 'rgba(20,10,40,0.25)');
    r(c, 7, 6, 2, 8, '#5a5a6a');
    G.ellipse(c, 8, 5, 5, 2, '#d04a4a');
    G.ellipse(c, 8, 4, 4, 1, '#f06a6a');
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false };
  };
  P.stove = function () {
    // 厨房（寸胴鍋つき）
    const cv = mk(32, 30);
    const c = cv.ctx;
    r(c, 0, 8, 32, 22, '#9aa0b0');
    r(c, 0, 8, 32, 4, '#c8ccd8');
    r(c, 0, 26, 32, 4, '#6a7080');
    r(c, 3, 2, 12, 10, '#b0b4c4');
    r(c, 3, 2, 12, 2, '#e0e4f0');
    r(c, 18, 4, 11, 7, '#3a3a48');
    r(c, 19, 5, 9, 2, '#e8a050');
    G.ellipse(c, 9, 11, 5, 1, '#ff6030');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -14, solid: true, steam: [9, -14], lights: [{ x: 9, y: -4, r: 14, col: '#ff8040', a: 0.6, flicker: true }] };
  };
  P.fridge = function () {
    const cv = mk(16, 32);
    const c = cv.ctx;
    r(c, 1, 0, 14, 32, '#e8ecf4');
    r(c, 1, 0, 14, 1, '#ffffff');
    r(c, 13, 0, 2, 32, '#b0b4c4');
    r(c, 1, 12, 14, 1, '#a0a4b4');
    r(c, 11, 4, 1, 5, '#8a8e9e');
    r(c, 11, 15, 1, 8, '#8a8e9e');
    r(c, 3, 3, 3, 3, '#ff8fb8');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -16, solid: true };
  };
  P.shelf = function (o) {
    const w = o.w || 2;
    const cv = mk(w * S, 34);
    const c = cv.ctx;
    const col = o.col || '#8a5a3a';
    r(c, 0, 0, w * S, 34, G.shade(col, -0.3));
    r(c, 1, 1, w * S - 2, 32, col);
    for (let j = 0; j < 3; j++) {
      const y = 2 + j * 10;
      r(c, 1, y + 8, w * S - 2, 2, G.shade(col, 0.2));
      for (let i = 2; i < w * S - 3; i += 3) {
        const hh = 4 + Math.floor(G.hash(i, j, w) * 4);
        r(c, i, y + 8 - hh, 2, hh, o.kind === 'parts' ? G.pick(['#8a92a6', '#c0a040', '#5a6070', '#a86a4a']) : G.pick(['#e05050', '#5080e0', '#50b070', '#e0c050', '#a060c0', '#f0f0f0']));
      }
    }
    return { w, h: 1, img: cv, ox: 0, oy: -18, solid: true };
  };
  P.locker = function (o) {
    const w = o.w || 2;
    const cv = mk(w * S, 32);
    const c = cv.ctx;
    for (let i = 0; i < w * 2; i++) {
      const x = i * 8;
      r(c, x, 0, 8, 32, '#7a8ab0');
      r(c, x, 0, 1, 32, '#9aaad0');
      r(c, x + 7, 0, 1, 32, '#5a6a90');
      for (let j = 3; j < 10; j += 2) r(c, x + 2, j, 4, 1, '#5a6a90');
      px(c, x + 5, 16, '#d0d8e8');
    }
    return { w, h: 1, img: cv, ox: 0, oy: -16, solid: true };
  };
  P.bed = function (o) {
    const col = o.col || '#5a8ad0';
    const cv = mk(16, 34);
    const c = cv.ctx;
    r(c, 0, 0, 16, 34, '#8a5a3a');
    r(c, 1, 2, 14, 30, '#f0f0f8');
    r(c, 2, 3, 12, 6, '#ffffff');
    r(c, 1, 12, 14, 20, col);
    r(c, 1, 12, 14, 2, G.shade(col, 0.3));
    for (let j = 16; j < 32; j += 4) r(c, 1, j, 14, 1, G.shade(col, -0.15));
    return { w: 1, h: 2, img: cv, ox: 0, oy: -2, solid: true };
  };
  P.tv = function () {
    const cv = mk(32, 26);
    const c = cv.ctx;
    r(c, 2, 16, 28, 10, '#6a4a30');
    r(c, 2, 16, 28, 2, '#8a6a48');
    r(c, 4, 0, 24, 16, '#1a1a24');
    r(c, 5, 1, 22, 13, '#3a6ab0');
    r(c, 5, 1, 22, 4, '#6a9ae0');
    r(c, 8, 7, 6, 5, '#ff5fa2');
    return { w: 2, h: 1, img: cv, ox: 0, oy: -10, solid: true, lights: [{ x: 16, y: -2, r: 20, col: '#6a9ae0', a: 0.5, flicker: true }] };
  };
  P.plant = function () {
    const cv = mk(16, 24);
    const c = cv.ctx;
    r(c, 3, 21, 10, 3, 'rgba(20,10,40,0.25)');
    r(c, 4, 15, 8, 7, '#c0603a');
    r(c, 4, 15, 8, 1, '#e08050');
    canopy(c, 8, 9, 6, ['#2f6e3a', '#4a9a4a', '#7cc864', '#3a8040'], 11);
    return { w: 1, h: 1, img: cv, ox: 0, oy: -8, solid: true };
  };
  P.arcade = function (o) {
    const col = o.col || G.pick(['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a']);
    const cv = mk(16, 32);
    const c = cv.ctx;
    r(c, 1, 29, 15, 3, 'rgba(20,10,40,0.3)');
    r(c, 1, 0, 14, 30, '#2a2440');
    r(c, 1, 0, 14, 4, col);
    r(c, 3, 6, 10, 9, '#0a0a1a');
    r(c, 4, 7, 8, 7, G.shade(col, -0.5));
    r(c, 5, 9, 3, 2, col);
    r(c, 1, 16, 14, 5, '#3a3458');
    px(c, 4, 18, '#ff3050');
    px(c, 9, 18, '#ffd25e');
    px(c, 11, 18, '#4ef0ff');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -16, solid: true, lights: [{ x: 8, y: -6, r: 16, col, a: 0.7, flicker: true }] };
  };
  P.bath = function () {
    const cv = mk(64, 40);
    const c = cv.ctx;
    r(c, 0, 0, 64, 40, '#e0e8f0');
    r(c, 3, 3, 58, 32, '#5ab0e0');
    r(c, 3, 3, 58, 3, '#3a90c0');
    for (let i = 0; i < 6; i++) r(c, 8 + i * 9, 12 + (i % 2) * 8, 5, 1, '#8ad0f8');
    r(c, 0, 36, 64, 4, '#b0b8c8');
    return { w: 4, h: 2, img: cv, ox: 0, oy: -8, solid: true, steam: [32, -6] };
  };
  P.poster = function (o) {
    // 壁に貼る（solidなし・壁タイルの上に置く）
    const cv = mk(12, 14);
    const c = cv.ctx;
    const col = o.col || G.pick(['#ff5fa2', '#4ef0ff', '#ffd25e']);
    r(c, 0, 0, 12, 14, '#f0f0f0');
    r(c, 1, 1, 10, 12, G.shade(col, -0.3));
    r(c, 2, 2, 8, 6, col);
    r(c, 2, 9, 8, 1, '#ffffff');
    r(c, 2, 11, 5, 1, '#ffffff');
    return { w: 1, h: 1, img: cv, ox: 2, oy: 1, solid: false, flat: true };
  };
  P.rug = function (o) {
    const w = o.w || 3,
      h = o.h || 2;
    const cv = mk(w * S, h * S);
    const c = cv.ctx;
    const col = o.col || '#c04a5a';
    r(c, 2, 2, w * S - 4, h * S - 4, col);
    r(c, 4, 4, w * S - 8, h * S - 8, G.shade(col, 0.15));
    r(c, 6, 6, w * S - 12, h * S - 12, col);
    return { w, h, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  P.stairs = function (o) {
    const cv = mk(16, 16);
    const c = cv.ctx;
    for (let j = 0; j < 4; j++) {
      r(c, 0, j * 4, 16, 4, G.shade('#a08060', -j * 0.1));
      r(c, 0, j * 4, 16, 1, '#c8a880');
    }
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true };
  };
  P.hatch = function (o) {
    // 床のハッチ・エレベーター
    const cv = mk(16, 16);
    const c = cv.ctx;
    r(c, 1, 1, 14, 14, '#3a3a48');
    r(c, 2, 2, 12, 12, '#5a6070');
    for (let i = 3; i < 14; i += 3) r(c, 3, i, 10, 1, '#4a5060');
    r(c, 1, 1, 14, 1, '#e8c040');
    r(c, 1, 14, 14, 1, '#e8c040');
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true, lights: o.glow ? [{ x: 8, y: 8, r: 14, col: '#e8c040', a: 0.5 }] : [] };
  };
  P.save = function () {
    // セーブポイント（コロニー公衆端末：ホログラム）
    const cv = mk(16, 30);
    const c = cv.ctx;
    G.ellipse(c, 8, 27, 7, 2, '#3a3458');
    G.ellipse(c, 8, 26, 6, 1, '#4ef0ff');
    r(c, 6, 18, 4, 9, '#5a5a7a');
    r(c, 6, 18, 1, 9, '#8a8aaa');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -14, solid: true, holo: true, lights: [{ x: 8, y: -8, r: 22, col: '#4ef0ff', a: 0.8, flicker: true }] };
  };
  P.wallwindow = function (o) {
    // 屋内の壁に掛ける窓（外のコロニーの景色）
    const w = o.w || 2;
    const cv = mk(w * S, 14);
    const c = cv.ctx;
    r(c, 0, 0, w * S, 14, '#f0f0f4');
    r(c, 1, 1, w * S - 2, 12, o.night ? '#1a1838' : '#8ac8f0');
    if (!o.night) {
      // 向こう側の街（コロニーの空に浮かぶ）
      for (let i = 2; i < w * S - 2; i += 3) r(c, i, 5 + ((i * 7) % 4), 2, 4, '#9ab0c8');
      r(c, 1, 9, w * S - 2, 4, '#7ab070');
    } else for (let i = 2; i < w * S - 2; i += 4) px(c, i, 4 + ((i * 3) % 6), '#ffd890');
    for (let i = S; i < w * S; i += S) r(c, i, 0, 1, 14, '#f0f0f4');
    r(c, 0, 13, w * S, 1, '#b0b0c0');
    return { w, h: 1, img: cv, ox: 0, oy: 1, solid: false, flat: true };
  };
  P.noren = function (o) {
    const cv = mk(16, 12);
    const c = cv.ctx;
    const col = o.col || '#2a3a7a';
    for (let i = 0; i < 3; i++) r(c, i * 5 + 1, 0, 4, 12, col);
    G.pixText(c, 'RA', 3, 3, '#ffffff');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -2, solid: false, flat: true, above: true };
  };
  P.partition = function (o) {
    const w = o.w || 1;
    const cv = mk(w * S, 26);
    const c = cv.ctx;
    r(c, 0, 0, w * S, 24, '#c8ccd8');
    r(c, 0, 0, w * S, 2, '#e8ecf4');
    r(c, 0, 22, w * S, 2, '#8a8ea0');
    return { w, h: 1, img: cv, ox: 0, oy: -10, solid: true };
  };
  P.hangar = function (o) {
    // ハンガーの機体固定フレーム
    const cv = mk(48, 64);
    const c = cv.ctx;
    r(c, 0, 0, 4, 64, '#6a7088');
    r(c, 44, 0, 4, 64, '#6a7088');
    r(c, 0, 0, 48, 4, '#6a7088');
    for (let j = 8; j < 60; j += 12) r(c, 0, j, 48, 2, '#8a90a8');
    r(c, 4, 60, 40, 4, '#e8c040');
    return { w: 3, h: 1, img: cv, ox: 0, oy: -48, solid: [[0, 0, 1, 1], [2, 0, 1, 1]] };
  };
  P.neonsign = function (o) {
    // 縦型のネオン看板
    const col = o.col || '#ff5fa2';
    const t = o.text || 'BAR';
    const cv = mk(12, 8 + t.length * 7);
    const c = cv.ctx;
    r(c, 0, 0, 12, cv.height, '#1a1428');
    r(c, 0, 0, 12, 1, col);
    r(c, 0, cv.height - 1, 12, 1, col);
    for (let i = 0; i < t.length; i++) G.pixText(c, t[i], 5, 4 + i * 7, col);
    return { w: 1, h: 1, img: cv, ox: 2, oy: -cv.height + 6, solid: false, flat: false, lights: [{ x: 8, y: -cv.height / 2 + 6, r: 20, col, a: 0.9, flicker: true }] };
  };
})();
