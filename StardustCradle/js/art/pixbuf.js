// =============================================================
//  pixbuf.js — 手続き生成ドット絵用のピクセルバッファ
// =============================================================
(function () {
  class PB {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.d = new Array(w * h).fill(null);
      this.tag = new Array(w * h).fill(null); // パーツ識別子（陰影処理用）
    }
    in(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
    set(x, y, c, tag) {
      x = Math.round(x);
      y = Math.round(y);
      if (!this.in(x, y)) return;
      const i = y * this.w + x;
      this.d[i] = c;
      if (tag !== undefined) this.tag[i] = tag;
    }
    get(x, y) {
      x = Math.round(x);
      y = Math.round(y);
      if (!this.in(x, y)) return null;
      return this.d[y * this.w + x];
    }
    getTag(x, y) {
      if (!this.in(x, y)) return null;
      return this.tag[y * this.w + x];
    }
    rect(x, y, w, h, c, tag) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c, tag);
    }
    // 述語で塗る
    fill(fn, c, tag) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (fn(x, y)) this.set(x, y, typeof c === 'function' ? c(x, y) : c, tag);
    }
    ell(cx, cy, rx, ry, c, tag, cond) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x - cx) / rx,
            dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1 && (!cond || cond(x, y))) this.set(x, y, typeof c === 'function' ? c(x, y) : c, tag);
        }
    }
    line(x0, y0, x1, y1, c, tag) {
      x0 = Math.round(x0);
      y0 = Math.round(y0);
      x1 = Math.round(x1);
      y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0),
        dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1,
        sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let k = 0; k < 500; k++) {
        this.set(x0, y0, c, tag);
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
    }
    // タグ付きピクセルの色を置換
    recolor(tag, fn) {
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const i = y * this.w + x;
          if (this.tag[i] === tag) {
            const r = fn(x, y, this.d[i]);
            if (r !== undefined) this.d[i] = r;
          }
        }
    }
    // 輪郭（外側に暗色1px、内部の別パーツ境界にも薄く線）
    outlineInner(tagA, tagB, col) {
      const out = [];
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          if (this.getTag(x, y) !== tagA) continue;
          for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (this.getTag(x + dx, y + dy) === tagB) out.push([x, y]);
        }
      out.forEach(([x, y]) => this.set(x, y, col));
    }
    toCanvas(scale) {
      scale = scale || 1;
      const cv = G.makeCanvas(this.w * scale, this.h * scale);
      const c = cv.ctx;
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const col = this.d[y * this.w + x];
          if (!col) continue;
          c.fillStyle = col;
          c.fillRect(x * scale, y * scale, scale, scale);
        }
      return cv;
    }
    flipX() {
      const n = new PB(this.w, this.h);
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          n.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
          n.tag[y * this.w + (this.w - 1 - x)] = this.tag[y * this.w + x];
        }
      return n;
    }
  }
  G.PB = PB;
  // 三角形塗り
  G.tri = function (b, p, col, tag) {
    const [x1, y1, x2, y2, x3, y3] = p;
    const s = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    for (let y = Math.floor(Math.min(y1, y2, y3)); y <= Math.ceil(Math.max(y1, y2, y3)); y++)
      for (let x = Math.floor(Math.min(x1, x2, x3)); x <= Math.ceil(Math.max(x1, x2, x3)); x++) {
        const d1 = s(x, y, x1, y1, x2, y2), d2 = s(x, y, x2, y2, x3, y3), d3 = s(x, y, x3, y3, x1, y1);
        if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) b.set(x, y, col, tag === undefined ? 'hair' : tag);
      }
  };
})();
