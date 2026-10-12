// =============================================================
//  gfx.js — 描画ヘルパ（テキスト、UIパネル、ドット処理）
// =============================================================
(function () {
  const FONT = '"DotGothic16", "MS Gothic", "Osaka-Mono", monospace';
  G.font = (size, bold) => (bold ? 'bold ' : '') + size + 'px ' + FONT;

  // UIカラー（ジークアクス風：ネオンピンク×シアン×濃紺）
  G.UI = {
    bg: 'rgba(14,10,36,0.92)',
    bg2: 'rgba(30,20,64,0.95)',
    line: '#ff5fa2',
    line2: '#4ef0ff',
    text: '#f4f1ff',
    dim: '#9a94c4',
    gold: '#ffd25e',
    green: '#7dff9a',
    red: '#ff5470',
    sel: 'rgba(255,95,162,0.28)',
  };

  // ---------- テキスト ----------
  G.drawText = function (c, s, x, y, o) {
    o = o || {};
    c.font = G.font(o.size || 10, o.bold);
    c.textAlign = o.align || 'left';
    c.textBaseline = 'top';
    s = String(s);
    if (o.outline) {
      c.fillStyle = o.outline;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) c.fillText(s, x + dx * 0.6, y + dy * 0.6);
    } else if (o.shadow !== false) {
      c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.6)';
      c.fillText(s, x + 0.7, y + 0.7);
    }
    c.fillStyle = o.color || G.UI.text;
    c.fillText(s, x, y);
  };
  G.measure = function (c, s, size) {
    c.font = G.font(size || 10);
    return c.measureText(s).width;
  };
  // 日本語の折り返し（禁則：行頭の句読点を前の行へ）
  G.wrapText = function (c, s, maxW, size) {
    c.font = G.font(size || 10);
    const out = [];
    for (const para of String(s).split('\n')) {
      let line = '';
      for (const ch of para) {
        const test = line + ch;
        if (c.measureText(test).width > maxW && line.length) {
          if ('、。！？」』）…ー'.includes(ch)) {
            line += ch;
            out.push(line);
            line = '';
            continue;
          }
          out.push(line);
          line = ch;
        } else line = test;
      }
      out.push(line);
    }
    return out;
  };

  // ---------- UIパネル ----------
  G.panel = function (c, x, y, w, h, o) {
    o = o || {};
    c.save();
    c.fillStyle = o.bg || G.UI.bg;
    c.fillRect(x + 1, y, w - 2, h);
    c.fillRect(x, y + 1, w, h - 2);
    // 内側のグラデーション
    const g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(120,80,255,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(x + 1, y + 1, w - 2, h - 2);
    // 枠
    c.strokeStyle = o.line || G.UI.line2;
    c.lineWidth = 1;
    c.globalAlpha = 0.9;
    c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    c.globalAlpha = 1;
    // 角のアクセント
    const L = 6;
    c.fillStyle = o.accent || G.UI.line;
    c.fillRect(x, y, L, 2);
    c.fillRect(x, y, 2, L);
    c.fillRect(x + w - L, y + h - 2, L, 2);
    c.fillRect(x + w - 2, y + h - L, 2, L);
    if (o.title) {
      const tw = G.measure(c, o.title, 9) + 12;
      c.fillStyle = o.accent || G.UI.line;
      c.fillRect(x + 8, y - 5, tw, 11);
      G.drawText(c, o.title, x + 14, y - 4, { size: 9, color: '#1a0f2e', shadow: false });
    }
    c.restore();
  };
  G.bar = function (c, x, y, w, h, v, max, col, bgcol) {
    c.fillStyle = bgcol || 'rgba(0,0,0,0.6)';
    c.fillRect(x, y, w, h);
    const r = G.clamp(v / max, 0, 1);
    c.fillStyle = col;
    c.fillRect(x + 1, y + 1, Math.round((w - 2) * r), h - 2);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(x + 1, y + 1, Math.round((w - 2) * r), 1);
  };

  // ---------- 3x5 ピクセルフォント（ワールド内の看板用） ----------
  const PF = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
    9: '111101111001110', '-': '000000111000000', '.': '000000000000010', '!': '010010010000010', ' ': '000000000000000',
    '&': '010101010101011', '?': '110001010000010', ':': '000010000010000', '/': '001001010100100', '+': '000010111010000',
    '*': '101010101000000', "'": '010010000000000', '#': '101111101111101',
  };
  G.pixText = function (c, s, x, y, col, sc) {
    sc = sc || 1;
    c.fillStyle = col;
    let cx = x;
    for (const ch of String(s).toUpperCase()) {
      const g = PF[ch] || PF[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(cx + (i % 3) * sc, y + Math.floor(i / 3) * sc, sc, sc);
      cx += 4 * sc;
    }
    return cx - x;
  };
  G.pixTextW = (s, sc) => String(s).length * 4 * (sc || 1) - (sc || 1);

  // ---------- ドット処理 ----------
  // 文字列配列からスプライト生成。pal: {char: '#hex'}、'.'や' 'は透明
  G.spr = function (rows, pal) {
    const h = rows.length,
      w = Math.max(...rows.map((r) => r.length));
    const cv = G.makeCanvas(w, h);
    const c = cv.ctx;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        const col = pal[ch];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    return cv;
  };
  // 不透明部分の外側に1pxのアウトライン（色付き＝隣の色を暗くした“セルアウト”）
  G.outline = function (src, color, selout) {
    const w = src.width + 2,
      h = src.height + 2;
    const cv = G.makeCanvas(w, h);
    const c = cv.ctx;
    c.drawImage(src, 1, 1);
    const id = c.getImageData(0, 0, w, h);
    const d = id.data;
    const out = c.createImageData(w, h);
    const o = out.data;
    const [or, og, ob] = G.hex2rgb(color || '#1a1028');
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] > 0) {
          o[i] = d[i];
          o[i + 1] = d[i + 1];
          o[i + 2] = d[i + 2];
          o[i + 3] = d[i + 3];
          continue;
        }
        let found = -1;
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const xx = x + dx,
            yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = (yy * w + xx) * 4;
          if (d[j + 3] > 128) {
            found = j;
            break;
          }
        }
        if (found >= 0) {
          if (selout) {
            o[i] = d[found] * 0.3 + or * 0.7;
            o[i + 1] = d[found + 1] * 0.3 + og * 0.7;
            o[i + 2] = d[found + 2] * 0.3 + ob * 0.7;
          } else {
            o[i] = or;
            o[i + 1] = og;
            o[i + 2] = ob;
          }
          o[i + 3] = 255;
        }
      }
    c.putImageData(out, 0, 0);
    return cv;
  };
  G.flipX = function (src) {
    const cv = G.makeCanvas(src.width, src.height);
    cv.ctx.translate(src.width, 0);
    cv.ctx.scale(-1, 1);
    cv.ctx.drawImage(src, 0, 0);
    return cv;
  };
  // 単色シルエット（被ダメージ時の白フラッシュ等）
  G.silhouette = function (src, color) {
    const cv = G.makeCanvas(src.width, src.height);
    const c = cv.ctx;
    c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = color;
    c.fillRect(0, 0, src.width, src.height);
    return cv;
  };
  const silCache = new WeakMap();
  G.flash = function (src, color) {
    let m = silCache.get(src);
    if (!m) {
      m = {};
      silCache.set(src, m);
    }
    if (!m[color]) m[color] = G.silhouette(src, color);
    return m[color];
  };

  // ピクセル単位の描画プリミティブ（生成アート用）
  G.px = function (c, x, y, col) {
    c.fillStyle = col;
    c.fillRect(x, y, 1, 1);
  };
  G.rect = function (c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  G.ellipse = function (c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
      c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  };
  G.line = function (c, x0, y0, x1, y1, col) {
    c.fillStyle = col;
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0),
      dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1,
      sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let k = 0; k < 2000; k++) {
      c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  };
  // ディザ塗り（2色の市松）
  G.dither = function (c, x, y, w, h, col, mode) {
    c.fillStyle = col;
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        const X = x + xx,
          Y = y + yy;
        if (mode === 'sparse' ? X % 2 === 0 && Y % 2 === 0 : (X + Y) % 2 === 0) c.fillRect(X, Y, 1, 1);
      }
  };
  // 放射グラデーションの光
  G.glow = function (c, x, y, r, col, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = a === undefined ? 1 : a;
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalAlpha = 1;
  };
  G.rgba = function (hex, a) {
    const [r, g, b] = G.hex2rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
})();
