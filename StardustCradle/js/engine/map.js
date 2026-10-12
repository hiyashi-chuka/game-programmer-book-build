// =============================================================
//  map.js — マップ定義・パース・地面描画・当たり判定
// =============================================================
(function () {
  G.MAPS = {};
  G.defMap = function (id, def) {
    def.id = id;
    G.MAPS[id] = def;
    return def;
  };
  // 他のファイルからマップにNPC・イベント等を追加する（章ごとの差分）
  // ext: {npcs, events, checks, warps, objects, enemies, items, lights, onEnter}
  G.MAP_EXT = {};
  G.addToMap = function (id, ext) {
    (G.MAP_EXT[id] = G.MAP_EXT[id] || []).push(ext);
  };
  const LISTS = ['npcs', 'events', 'checks', 'warps', 'objects', 'enemies', 'items', 'lights'];

  // マップの文字 → 小物（デフォルト）
  G.PROP_CHARS = {
    T: ['tree', {}],
    Y: ['tree', { kind: 'sakura' }],
    A: ['tree', { kind: 'autumn' }],
    J: ['tree', { kind: 'dark' }],
    b: ['bush', {}],
    q: ['bush', { kind: 'flower' }],
    L: ['lamp', {}],
    V: ['vending', {}],
    D: ['desk', {}],
    d: ['desk', { book: true }],
    C: ['crate', {}],
    Q: ['barrel', {}],
    P: ['plant', {}],
    E: ['terminal', {}],
    X: ['server', {}],
    U: ['stool', {}],
    j: ['trash', {}],
    y: ['hydrant', {}],
    G: ['tires', {}],
    M: ['mailbox', {}],
    Z: ['save', {}],
    I: ['capsule', {}],
    i: ['capsule', { empty: true }],
  };

  class GameMap {
    constructor(def) {
      this.def = def;
      this.id = def.id;
      this.name = def.name || '';
      this.pal = def.pal || {};
      const rows = def.rows || ['.'];
      this.h = rows.length;
      this.w = Math.max(...rows.map((r) => r.length));
      this.grid = rows.map((r) => r.padEnd(this.w, def.pad || ' ').split(''));
      this.seed = [...this.id].reduce((a, c) => a + c.charCodeAt(0), 0);
      this.objs = [];
      this.solid = new Uint8Array(this.w * this.h);
      this.propChars = Object.assign({}, G.PROP_CHARS, def.props || {});
      this.floorDefault = def.floor || '.';
      // 本体＋拡張をまとめる
      const exts = G.MAP_EXT[def.id] || [];
      for (const k of LISTS) this[k] = (def[k] || []).concat(...exts.map((e) => e[k] || []));
      const defWarps = this.warps,
        defLights = this.lights;
      this.warps = [];
      this.lights = [];
      defWarps.forEach((w) => this.warps.push(Object.assign({ w: 1, h: 1 }, w)));
      defLights.forEach((l) => this.lights.push({ x: l.x * 16 + 8, y: l.y * 16 + 8, r: l.r || 40, col: l.col || '#ffe0a0', a: l.a || 0.8, flicker: l.flicker, night: l.night }));
      this.enterHooks = [def.onEnter].concat(exts.map((e) => e.onEnter)).filter(Boolean);
      this.edits = G.state.flags['_tiles_' + def.id] || {};
      for (const k in this.edits) {
        const [x, y] = k.split(',').map(Number);
        if (this.grid[y]) this.grid[y][x] = this.edits[k];
      }

      // 小物文字を床に置き換えつつ配置
      const pending = [];
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const ch = this.grid[y][x];
          if (G.TILES[ch]) continue;
          const pc = this.propChars[ch];
          if (pc) pending.push([x, y, pc]);
          this.grid[y][x] = null; // 後で床を決める
        }
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) if (this.grid[y][x] === null) this.grid[y][x] = this.guessFloor(x, y);
      pending.forEach(([x, y, pc]) => this.addObj(Object.assign({ p: pc[0], x, y }, pc[1])));
      this.objects.forEach((o) => this.addObj(o));
      if (def.onLoad) def.onLoad(this);
      this.computeSolid();
      this.renderGround();
      // 水面アニメ用
      this.waterCells = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.grid[y][x] === '~') this.waterCells.push([x, y]);
    }
    cell(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
      return this.grid[y][x];
    }
    guessFloor(x, y) {
      const isFloor = (c) => c && G.TILES[c] && !G.TILES[c].solid;
      for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1], [-2, 0], [2, 0]]) {
        const yy = y + dy,
          xx = x + dx;
        if (yy < 0 || yy >= this.h || xx < 0 || xx >= this.w) continue;
        const c = this.grid[yy][xx];
        if (isFloor(c)) return c;
      }
      return this.floorDefault;
    }
    // フェンス等の下に敷く床
    under(x, y) {
      for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
        const c = this.cell(x + dx, y + dy);
        if (c && G.TILES[c] && !G.TILES[c].solid) return c;
      }
      return this.floorDefault;
    }
    addObj(o) {
      const opts = Object.assign({}, o);
      ['p', 'x', 'y', 'to', 'tx', 'ty', 'dir', 'id', 'talk', 'msg', 'show', 'nosolid'].forEach((k) => delete opts[k]);
      const data = G.prop(o.p, opts);
      if (!data) return;
      const ob = {
        type: o.p,
        tx: o.x,
        ty: o.y,
        data,
        def: o,
        px: o.x * 16 + data.ox,
        py: o.y * 16 + data.oy,
        sortY: data.flat ? -99999 : (o.y + data.h) * 16 - 1,
        id: o.id,
      };
      if (o.show && !o.show()) return;
      this.objs.push(ob);
      (data.lights || []).forEach((l) => this.lights.push(Object.assign({}, l, { x: o.x * 16 + l.x, y: o.y * 16 + l.y })));
      if (data.bldg && o.to) {
        this.warps.push({ x: o.x + data.door, y: o.y + data.h - 1, w: 1, h: 1, to: o.to, tx: o.tx, ty: o.ty, dir: o.dir || 'up', se: 'door', door: true });
      }
      return ob;
    }
    computeSolid() {
      const S = this.solid;
      S.fill(0);
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const t = G.TILES[this.grid[y][x]];
          if (t && t.solid && !(this.def.space && this.grid[y][x] === '*')) S[y * this.w + x] = 1;
        }
      for (const ob of this.objs) {
        const d = ob.data;
        if (ob.def.nosolid || !d.solid) continue;
        if (d.solid === true) {
          for (let y = 0; y < d.h; y++)
            for (let x = 0; x < d.w; x++) {
              if (d.bldg && x === d.door && y === d.h - 1 && ob.def.door !== -1) continue;
              this.setSolid(ob.tx + x, ob.ty + y, 1);
            }
        } else
          d.solid.forEach(([x0, y0, w, h]) => {
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.setSolid(ob.tx + x0 + x, ob.ty + y0 + y, 1);
          });
      }
      (this.def.solids || []).forEach(([x0, y0, w, h, v]) => {
        for (let y = 0; y < (h || 1); y++) for (let x = 0; x < (w || 1); x++) this.setSolid(x0 + x, y0 + y, v === undefined ? 1 : v);
      });
    }
    setSolid(x, y, v) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.solid[y * this.w + x] = v;
    }
    isSolid(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
      return this.solid[ty * this.w + tx] === 1;
    }
    // ピクセル矩形が壁に当たるか
    hitRect(x, y, w, h) {
      const x0 = Math.floor(x / 16),
        y0 = Math.floor(y / 16),
        x1 = Math.floor((x + w - 0.01) / 16),
        y1 = Math.floor((y + h - 0.01) / 16);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.isSolid(tx, ty)) return true;
      return false;
    }
    renderGround() {
      const cv = G.makeCanvas(this.w * 16, this.h * 16);
      const c = cv.ctx;
      if (this.def.bg && !this.def.space) {
        c.fillStyle = this.def.bg;
        c.fillRect(0, 0, cv.width, cv.height);
      }
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const ch = this.grid[y][x];
          const t = G.TILES[ch];
          if (t) t.draw(c, x * 16, y * 16, x, y, this, G.hash(x, y, this.seed));
        }
      // 平置きの小物（ラグ・ポスター等）は地面に焼き込む
      for (const ob of this.objs) if (ob.data.flat && !ob.data.lights?.length && !ob.data.above) c.drawImage(ob.data.img, ob.px, ob.py);
      this.objs = this.objs.filter((ob) => !(ob.data.flat && !ob.data.lights?.length && !ob.data.above));
      // 壁沿いのAO（柔らかい影）
      c.fillStyle = 'rgba(20,10,40,0.18)';
      for (let y = 1; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const t = G.TILES[this.grid[y][x]];
          const up = G.TILES[this.grid[y - 1][x]];
          if (t && !t.solid && up && up.solid && this.grid[y - 1][x] !== ' ' && this.grid[y - 1][x] !== '~') c.fillRect(x * 16, y * 16, 16, 3);
        }
      if (this.def.decorate) this.def.decorate(c, this);
      this.ground = cv;
    }
    objById(id) {
      return this.objs.find((o) => o.id === id);
    }
  }
  G.GameMap = GameMap;
})();
