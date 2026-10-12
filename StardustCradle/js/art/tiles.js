// =============================================================
//  tiles.js — 地面タイル（16x16）の手続き生成
// =============================================================
// 各タイル: {solid, draw(c, px, py, tx, ty, map, v)}  v=セルごとの乱数
(function () {
  const T = (G.TILES = {});
  const r = G.rect;
  const px = G.px;
  const S = 16;

  function speckle(c, x, y, v, cols, n, seed) {
    for (let i = 0; i < n; i++) {
      const h = G.hash(x + i * 7, y + i * 13, seed || 1);
      const hx = Math.floor(G.hash(i, x + y, v * 1000) * S),
        hy = Math.floor(h * S);
      px(c, x + hx, y + hy, cols[i % cols.length]);
    }
  }
  const same = (map, tx, ty, chars) => chars.includes(map.cell(tx, ty));

  // ---- 草 ----
  function grass(c, x, y, tx, ty, map, v, flowers) {
    const P = map.pal || {};
    const base = P.grass || '#6cb85a',
      dk = G.shade(base, -0.18),
      lt = G.shade(base, 0.18);
    r(c, x, y, S, S, base);
    // 濃淡のまだら
    for (let i = 0; i < 18; i++) {
      const hx = Math.floor(G.hash(tx * 3 + i, ty * 5, 11) * S),
        hy = Math.floor(G.hash(tx + i * 2, ty * 7 + i, 12) * S);
      px(c, x + hx, y + hy, i % 3 ? dk : lt);
    }
    // 草の束 (V字)
    const n = 2 + Math.floor(v * 3);
    for (let i = 0; i < n; i++) {
      const hx = 2 + Math.floor(G.hash(tx, ty, 20 + i) * 12),
        hy = 3 + Math.floor(G.hash(ty, tx, 30 + i) * 11);
      px(c, x + hx, y + hy, dk);
      px(c, x + hx - 1, y + hy - 1, dk);
      px(c, x + hx + 1, y + hy - 1, dk);
      px(c, x + hx, y + hy - 1, lt);
    }
    if (flowers || v > 0.93) {
      const fc = ['#fff4f8', '#ffd25e', '#ff8fb8', '#9fd8ff'];
      const k = flowers ? 4 : 1;
      for (let i = 0; i < k; i++) {
        const hx = 2 + Math.floor(G.hash(tx, ty, 40 + i) * 12),
          hy = 2 + Math.floor(G.hash(ty, tx, 50 + i) * 12);
        const col = fc[Math.floor(G.hash(tx, ty, 60 + i) * fc.length)];
        px(c, x + hx, y + hy, col);
        px(c, x + hx - 1, y + hy, G.shade(col, -0.15));
        px(c, x + hx + 1, y + hy, G.shade(col, -0.15));
        px(c, x + hx, y + hy - 1, G.shade(col, -0.15));
        px(c, x + hx, y + hy + 1, dk);
      }
    }
  }
  // 草の縁取り（隣が草でない場合に、草のフチを少し張り出す）
  function grassEdge(c, x, y, tx, ty, map) {
    const P = map.pal || {};
    const base = P.grass || '#6cb85a',
      dk = G.shade(base, -0.3);
    const isG = (a, b) => '.,"'.includes(map.cell(a, b));
    if (!isG(tx, ty + 1)) for (let i = 0; i < S; i++) if ((i + tx) % 3) px(c, x + i, y + S - 1, dk);
    if (!isG(tx, ty - 1)) for (let i = 0; i < S; i++) px(c, x + i, y, G.shade(base, 0.12));
  }
  T['.'] = { name: 'grass', draw: (c, x, y, tx, ty, m, v) => (grass(c, x, y, tx, ty, m, v), grassEdge(c, x, y, tx, ty, m)) };
  T[','] = { name: 'flowers', draw: (c, x, y, tx, ty, m, v) => (grass(c, x, y, tx, ty, m, v, true), grassEdge(c, x, y, tx, ty, m)) };
  T['"'] = {
    name: 'tallgrass',
    draw(c, x, y, tx, ty, m, v) {
      grass(c, x, y, tx, ty, m, v);
      const base = (m.pal && m.pal.grass) || '#6cb85a';
      for (let i = 0; i < 7; i++) {
        const hx = 1 + Math.floor(G.hash(tx, ty, 70 + i) * 14),
          hy = 6 + Math.floor(G.hash(tx, ty, 80 + i) * 9);
        for (let k = 0; k < 5; k++) px(c, x + hx + (k > 2 ? 1 : 0), y + hy - k, k < 2 ? G.shade(base, -0.3) : G.shade(base, 0.1 + k * 0.05));
      }
    },
  };

  // ---- 土・砂 ----
  T[':'] = {
    name: 'dirt',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.dirt) || '#c9a06a';
      r(c, x, y, S, S, b);
      speckle(c, x, y, v, [G.shade(b, -0.15), G.shade(b, 0.12), G.shade(b, -0.25)], 14, tx * 31 + ty);
      // 小石
      if (v > 0.6) {
        const hx = Math.floor(v * 97) % 12 + 2,
          hy = Math.floor(v * 53) % 12 + 2;
        r(c, x + hx, y + hy, 2, 1, '#a8a0a0');
        px(c, x + hx, y + hy + 1, '#7a7080');
      }
      // 草地との境界をぼかす
      const isG = (a, b) => '.,"'.includes(m.cell(a, b));
      const gcol = (m.pal && m.pal.grass) || '#6cb85a';
      if (isG(tx, ty - 1)) for (let i = 0; i < S; i++) if (G.hash(tx * 16 + i, ty, 3) > 0.4) px(c, x + i, y, gcol);
      if (isG(tx - 1, ty)) for (let i = 0; i < S; i++) if (G.hash(tx, ty * 16 + i, 4) > 0.5) px(c, x, y + i, gcol);
      if (isG(tx + 1, ty)) for (let i = 0; i < S; i++) if (G.hash(tx, ty * 16 + i, 5) > 0.5) px(c, x + S - 1, y + i, gcol);
    },
  };
  T['s'] = {
    name: 'scrapground',
    draw(c, x, y, tx, ty, m, v) {
      const b = '#a08a6c';
      r(c, x, y, S, S, b);
      speckle(c, x, y, v, ['#8a7458', '#b8a080', '#6a5a48', '#7a8090'], 20, tx * 7 + ty * 3);
      if (v > 0.7) {
        // ボルトやネジ
        const hx = 3 + Math.floor(v * 37) % 10,
          hy = 3 + Math.floor(v * 71) % 10;
        r(c, x + hx, y + hy, 3, 1, '#9aa0b0');
        px(c, x + hx + 1, y + hy - 1, '#c8ccd8');
      }
      if (v < 0.12) {
        // オイル染み
        G.ellipse(c, x + 8, y + 9, 4, 2, '#5a4a3c');
        px(c, x + 6, y + 8, '#7a6aa0');
      }
    },
  };
  T['o'] = {
    name: 'farm',
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#7a5638');
      for (let i = 0; i < 4; i++) {
        r(c, x, y + i * 4, S, 2, '#8e6644');
        r(c, x, y + i * 4 + 2, S, 1, '#5e4028');
      }
      speckle(c, x, y, v, ['#9a7450', '#6a4a30'], 6, tx + ty * 9);
    },
  };

  // ---- 舗装 ----
  T['='] = {
    name: 'sidewalk',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.walk) || '#d2c9bb';
      r(c, x, y, S, S, b);
      const ln = G.shade(b, -0.14),
        hl = G.shade(b, 0.1);
      // 8x8 の石畳
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          const ox = x + i * 8,
            oy = y + j * 8;
          r(c, ox, oy + 7, 8, 1, ln);
          r(c, ox + 7, oy, 1, 8, ln);
          r(c, ox, oy, 7, 1, hl);
          if (G.hash(tx * 2 + i, ty * 2 + j, 9) > 0.7) r(c, ox + 2, oy + 2, 3, 3, G.shade(b, -0.05));
        }
      if (v > 0.9) px(c, x + 5, y + 11, G.shade(b, -0.3));
      // 縁石（道路と接する側）
      if (same(m, tx, ty + 1, '-_|z')) {
        r(c, x, y + 14, S, 2, '#b8b0a4');
        r(c, x, y + 15, S, 1, '#8a8478');
      }
      if (same(m, tx, ty - 1, '-_|z')) {
        r(c, x, y, S, 1, '#ece4d8');
        r(c, x, y + 1, S, 1, '#b8b0a4');
      }
    },
  };
  function asphalt(c, x, y, tx, ty, m, v) {
    const b = (m.pal && m.pal.road) || '#4c4c5c';
    r(c, x, y, S, S, b);
    speckle(c, x, y, v, [G.shade(b, 0.1), G.shade(b, -0.12), G.shade(b, 0.18)], 16, tx * 13 + ty * 17);
    if (v > 0.95) {
      // ひび
      G.line(c, x + 3, y + 4, x + 7, y + 8, G.shade(b, -0.25));
      G.line(c, x + 7, y + 8, x + 6, y + 12, G.shade(b, -0.25));
    }
    if (same(m, tx, ty - 1, '=')) r(c, x, y, S, 1, G.shade(b, -0.3));
  }
  T['-'] = { name: 'road', draw: asphalt };
  T['_'] = {
    name: 'roadline',
    draw(c, x, y, tx, ty, m, v) {
      asphalt(c, x, y, tx, ty, m, v);
      r(c, x + 2, y + 7, 10, 2, '#e8c050');
      r(c, x + 2, y + 7, 10, 1, '#f8dc78');
    },
  };
  T['|'] = {
    name: 'roadlineV',
    draw(c, x, y, tx, ty, m, v) {
      asphalt(c, x, y, tx, ty, m, v);
      r(c, x + 7, y + 2, 2, 10, '#e8c050');
    },
  };
  T['z'] = {
    name: 'crosswalk',
    draw(c, x, y, tx, ty, m, v) {
      asphalt(c, x, y, tx, ty, m, v);
      const vert = same(m, tx - 1, ty, 'z') || same(m, tx + 1, ty, 'z');
      if (vert) for (let i = 0; i < 2; i++) r(c, x + 2 + i * 8, y + 1, 4, 14, '#ecece4');
      else for (let i = 0; i < 2; i++) r(c, x + 1, y + 2 + i * 8, 14, 4, '#ecece4');
    },
  };
  T['+'] = {
    name: 'brick',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.brick) || '#c8765a';
      r(c, x, y, S, S, G.shade(b, -0.22));
      for (let j = 0; j < 4; j++)
        for (let i = -1; i < 3; i++) {
          const ox = x + i * 8 + (j % 2 ? 4 : 0),
            oy = y + j * 4;
          const cc = G.hash(tx * 4 + i, ty * 4 + j, 3) > 0.5 ? b : G.shade(b, 0.08);
          const x0 = Math.max(ox, x),
            x1 = Math.min(ox + 7, x + S);
          if (x1 > x0) {
            r(c, x0, oy, x1 - x0, 3, cc);
            r(c, x0, oy, x1 - x0, 1, G.shade(cc, 0.12));
          }
        }
    },
  };
  T['c'] = {
    name: 'concrete',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.concrete) || '#b4b4bc';
      r(c, x, y, S, S, b);
      speckle(c, x, y, v, [G.shade(b, -0.08), G.shade(b, 0.08)], 10, tx * 5 + ty);
      if (tx % 3 === 0) r(c, x, y, 1, S, G.shade(b, -0.15));
      if (ty % 3 === 0) r(c, x, y, S, 1, G.shade(b, -0.15));
    },
  };

  // ---- 屋内床 ----
  T['f'] = {
    name: 'wood',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.wood) || '#c08a58';
      r(c, x, y, S, S, b);
      for (let j = 0; j < 4; j++) {
        const oy = y + j * 4;
        r(c, x, oy + 3, S, 1, G.shade(b, -0.22));
        r(c, x, oy, S, 1, G.shade(b, 0.1));
        const cut = Math.floor(G.hash(tx, ty * 4 + j, 7) * 14) + 1;
        r(c, x + cut, oy, 1, 3, G.shade(b, -0.18));
        if (G.hash(tx, ty * 4 + j, 8) > 0.7) r(c, x + (cut + 6) % 15, oy + 1, 2, 1, G.shade(b, -0.08));
      }
    },
  };
  T['t'] = {
    name: 'tatami',
    draw(c, x, y, tx, ty, m, v) {
      const b = '#cfc683';
      r(c, x, y, S, S, b);
      for (let j = 0; j < S; j += 2) r(c, x, y + j, S, 1, '#bdb470');
      const horiz = (tx + ty) % 2 === 0;
      if (horiz) r(c, x, y, S, 2, '#3a5a46');
      else r(c, x, y, 2, S, '#3a5a46');
    },
  };
  T['k'] = {
    name: 'checker',
    draw(c, x, y, tx, ty, m, v) {
      const a = (m.pal && m.pal.checkA) || '#ecebf2',
        b2 = (m.pal && m.pal.checkB) || '#3a3a50';
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) r(c, x + i * 8, y + j * 8, 8, 8, (i + j) % 2 ? b2 : a);
      r(c, x, y, S, 1, 'rgba(255,255,255,0.12)');
    },
  };
  T['l'] = {
    name: 'linoleum',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.lino) || '#a8c0b0';
      r(c, x, y, S, S, b);
      r(c, x, y + 15, S, 1, G.shade(b, -0.1));
      r(c, x + 15, y, 1, S, G.shade(b, -0.1));
      if (v > 0.8) r(c, x + 3, y + 3, 4, 1, G.shade(b, 0.15));
    },
  };
  T['p'] = {
    name: 'tile',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.tile) || '#bfe0ea';
      r(c, x, y, S, S, G.shade(b, -0.12));
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) r(c, x + i * 4, y + j * 4, 3, 3, (i + j + tx) % 5 === 0 ? G.shade(b, 0.12) : b);
    },
  };
  T['r'] = {
    name: 'carpet',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.carpet) || '#a83a50';
      r(c, x, y, S, S, b);
      for (let j = 0; j < S; j += 4) for (let i = (j / 4) % 2 ? 2 : 0; i < S; i += 4) px(c, x + i, y + j, G.shade(b, 0.12));
      if (!same(m, tx, ty - 1, 'r')) r(c, x, y, S, 2, '#e8c050');
      if (!same(m, tx, ty + 1, 'r')) r(c, x, y + 14, S, 2, '#e8c050');
      if (!same(m, tx - 1, ty, 'r')) r(c, x, y, 2, S, '#e8c050');
      if (!same(m, tx + 1, ty, 'r')) r(c, x + 14, y, 2, S, '#e8c050');
    },
  };

  // ---- 金属・工業 ----
  T['m'] = {
    name: 'metal',
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.metal) || '#8890a6';
      r(c, x, y, S, S, b);
      r(c, x, y, S, 1, G.shade(b, 0.2));
      r(c, x, y, 1, S, G.shade(b, 0.12));
      r(c, x, y + 15, S, 1, G.shade(b, -0.3));
      r(c, x + 15, y, 1, S, G.shade(b, -0.25));
      for (const [a, bb] of [[2, 2], [13, 2], [2, 13], [13, 13]]) {
        px(c, x + a, y + bb, G.shade(b, 0.35));
        px(c, x + a + 1, y + bb + 1, G.shade(b, -0.3));
      }
      // 滑り止めパターン
      if ((tx + ty) % 2 === 0) for (let i = 4; i < 12; i += 3) for (let j = 4; j < 12; j += 3) px(c, x + i, y + j, G.shade(b, -0.12)), px(c, x + i + 1, y + j + 1, G.shade(b, 0.1));
    },
  };
  T['g'] = {
    name: 'grating',
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#1e2230');
      // 下の配管がうっすら
      if (tx % 4 === 1) r(c, x + 4, y, 3, S, '#3a3040');
      for (let i = 0; i < S; i += 4) {
        r(c, x + i, y, 1, S, '#6a7288');
        r(c, x, y + i, S, 1, '#6a7288');
        px(c, x + i, y + i, '#9aa2b8');
      }
      r(c, x, y, S, 1, '#8a92a8');
    },
  };
  T['x'] = {
    name: 'hazard',
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#e8c040');
      for (let i = -S; i < S; i += 8)
        for (let k = 0; k < 4; k++) G.line(c, x + Math.max(0, i + k), y + Math.max(0, -(i + k)), x + Math.min(S - 1, i + k + S - 1), y + Math.min(S - 1, S - 1 - (i + k)), '#2a2a30');
      r(c, x, y, S, 1, '#f8dc78');
    },
  };
  T['a'] = {
    name: 'arena',
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#2a2440');
      r(c, x, y, S, 1, '#3a3458');
      r(c, x, y, 1, S, '#3a3458');
      if (tx % 4 === 0) r(c, x, y, 1, S, '#5a3a8a');
      if (ty % 4 === 0) r(c, x, y, S, 1, '#5a3a8a');
      if (v > 0.85) {
        px(c, x + 5, y + 6, '#4a4070');
        px(c, x + 6, y + 6, '#4a4070');
      }
    },
  };
  T['h'] = {
    name: 'hull',
    draw(c, x, y, tx, ty, m, v) {
      const b = '#9aa0b4';
      r(c, x, y, S, S, b);
      r(c, x, y, S, 1, '#c0c6d8');
      r(c, x, y + 15, S, 1, '#5a6078');
      r(c, x + 15, y, 1, S, '#6a7088');
      if ((tx * 7 + ty * 3) % 5 === 0) r(c, x + 3, y + 3, 10, 10, '#8a90a4');
      if (v > 0.9) r(c, x + 4, y + 6, 8, 2, '#e8c040');
      px(c, x + 2, y + 2, '#5a6078');
      px(c, x + 13, y + 13, '#5a6078');
    },
  };
  T['*'] = {
    name: 'space',
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#06051a');
      for (let i = 0; i < 3; i++) {
        const h = G.hash(tx, ty, 90 + i);
        if (h > 0.55) px(c, x + Math.floor(G.hash(ty, tx, 91 + i) * S), y + Math.floor(h * 31) % S, h > 0.9 ? '#ffffff' : h > 0.75 ? '#9ab0ff' : '#4a4880');
      }
    },
  };
  T['n'] = {
    name: 'neonfloor',
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#241e3a');
      speckle(c, x, y, v, ['#2e2848', '#1c1830'], 10, tx + ty * 3);
      if (ty % 2 === 0 && tx % 2 === 0) px(c, x + 8, y + 8, '#ff5fa2');
      r(c, x, y + 15, S, 1, '#1a1428');
    },
  };

  // ---- 壁・障害物（solid） ----
  // 屋内壁：下が壁でなければ「壁面」、そうでなければ「天面」
  T['w'] = {
    name: 'wall',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      const top = (m.pal && m.pal.wallTop) || '#3a3048';
      const face = (m.pal && m.pal.wall) || '#e8dcc8';
      const below = m.cell(tx, ty + 1);
      if (below !== 'w' && below !== null && below !== ' ') {
        // 壁面（壁紙）
        r(c, x, y, S, S, face);
        for (let i = 0; i < S; i += 4) r(c, x + i, y + 1, 1, 12, G.shade(face, -0.05));
        r(c, x, y, S, 1, G.shade(face, 0.15));
        r(c, x, y + 12, S, 4, (m.pal && m.pal.baseboard) || G.shade(face, -0.35));
        r(c, x, y + 12, S, 1, G.shade((m.pal && m.pal.baseboard) || G.shade(face, -0.35), 0.2));
      } else {
        r(c, x, y, S, S, top);
        speckle(c, x, y, v, [G.shade(top, 0.06)], 4, tx + ty);
        // 天面の縁
        const n = (a, b) => m.cell(a, b);
        if (n(tx, ty - 1) !== 'w') r(c, x, y, S, 1, G.shade(top, 0.25));
        if (n(tx - 1, ty) !== 'w') r(c, x, y, 1, S, G.shade(top, 0.2));
        if (n(tx + 1, ty) !== 'w') r(c, x + 15, y, 1, S, G.shade(top, -0.3));
      }
    },
  };
  // 屋外の擁壁/コロニー外壁
  T['W'] = {
    name: 'bigwall',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      const face = (m.pal && m.pal.bigwall) || '#8a8aa0';
      const below = m.cell(tx, ty + 1);
      if (below !== 'W' && below !== null) {
        r(c, x, y, S, S, face);
        for (let j = 0; j < S; j += 8) r(c, x, y + j, S, 1, G.shade(face, -0.18));
        r(c, x + (ty % 2 ? 0 : 8), y, 1, S, G.shade(face, -0.18));
        r(c, x, y + 14, S, 2, G.shade(face, -0.35));
        if (v > 0.8) {
          r(c, x + 4, y + 4, 2, 6, '#5a5a70');
          px(c, x + 4, y + 9, '#3a8a5a');
        }
      } else {
        const top = G.shade(face, -0.45);
        r(c, x, y, S, S, top);
        speckle(c, x, y, v, [G.shade(top, 0.1)], 5, tx * 3 + ty);
        if (m.cell(tx, ty - 1) !== 'W') r(c, x, y, S, 2, G.shade(face, 0.2));
      }
    },
  };
  T['#'] = {
    name: 'block',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, (m.pal && m.pal.block) || '#1a1626');
    },
  };
  T[' '] = { name: 'void', solid: true, draw(c, x, y) {} };
  T['~'] = {
    name: 'water',
    solid: true,
    water: true,
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.water) || '#3a86c8';
      r(c, x, y, S, S, b);
      for (let i = 0; i < 3; i++) {
        const hx = Math.floor(G.hash(tx, ty, 100 + i) * 12),
          hy = Math.floor(G.hash(ty, tx, 110 + i) * 14);
        r(c, x + hx, y + hy, 4, 1, G.shade(b, 0.22));
      }
      speckle(c, x, y, v, [G.shade(b, -0.08)], 8, tx * 11 + ty);
      // 岸（上が陸）→ 護岸の壁と影
      const up = m.cell(tx, ty - 1);
      if (up !== '~' && up !== null) {
        r(c, x, y, S, 5, '#8a8494');
        r(c, x, y, S, 1, '#b8b2c0');
        for (let i = 0; i < S; i += 5) r(c, x + i, y + 1, 1, 4, '#6a6478');
        r(c, x, y + 5, S, 2, G.shade(b, -0.3));
      }
      const L = m.cell(tx - 1, ty),
        R = m.cell(tx + 1, ty),
        D = m.cell(tx, ty + 1);
      if (L !== '~' && L !== null) r(c, x, y, 2, S, '#7a7488');
      if (R !== '~' && R !== null) r(c, x + 14, y, 2, S, '#7a7488');
      if (D !== '~' && D !== null) r(c, x, y + 14, S, 2, '#6a6478');
    },
  };
  T['F'] = {
    name: 'fence',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      const fl = m.under && m.under(tx, ty);
      (T[fl] || T['c']).draw(c, x, y, tx, ty, m, v);
      // 金網
      r(c, x, y + 1, S, 1, '#9aa0b0');
      r(c, x, y + 13, S, 1, '#6a7080');
      for (let i = 0; i < S; i += 3) {
        G.line(c, x + i, y + 2, x + i + 3, y + 12, 'rgba(160,170,190,0.85)');
        G.line(c, x + i + 3, y + 2, x + i, y + 12, 'rgba(120,130,150,0.85)');
      }
      if (tx % 3 === 0) r(c, x, y, 2, 15, '#7a8090');
      r(c, x, y + 14, S, 2, 'rgba(0,0,0,0.2)');
    },
  };
  T['R'] = {
    name: 'railing',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      const fl = m.under && m.under(tx, ty);
      (T[fl] || T['=']).draw(c, x, y, tx, ty, m, v);
      r(c, x, y + 4, S, 2, '#d0d4e0');
      r(c, x, y + 5, S, 1, '#8a90a4');
      r(c, x, y + 10, S, 1, '#b0b4c4');
      for (let i = 1; i < S; i += 5) r(c, x + i, y + 4, 1, 10, '#a0a6b8');
      r(c, x, y + 14, S, 1, 'rgba(0,0,0,0.25)');
    },
  };
  T['B'] = {
    name: 'brickwall',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      const b = (m.pal && m.pal.brickwall) || '#a85a48';
      r(c, x, y, S, S, G.shade(b, -0.25));
      for (let j = 0; j < 4; j++)
        for (let i = -1; i < 3; i++) {
          const ox = x + i * 8 + (j % 2 ? 4 : 0),
            oy = y + 4 + j * 3;
          const x0 = Math.max(ox, x),
            x1 = Math.min(ox + 7, x + S);
          if (x1 > x0 && oy < y + S) r(c, x0, oy, x1 - x0, 2, G.hash(tx * 3 + i, ty + j, 2) > 0.5 ? b : G.shade(b, 0.1));
        }
      r(c, x, y, S, 4, '#c8c0b8');
      r(c, x, y, S, 1, '#e8e0d8');
      r(c, x, y + 3, S, 1, '#9a948c');
    },
  };
  T['H'] = {
    name: 'hedge',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      const fl = m.under && m.under(tx, ty);
      (T[fl] || T['.']).draw(c, x, y, tx, ty, m, v);
      const g = '#3f8a46';
      r(c, x, y + 2, S, 12, g);
      for (let i = 0; i < 26; i++) {
        const hx = Math.floor(G.hash(tx, ty, 120 + i) * 16),
          hy = 2 + Math.floor(G.hash(ty, tx, 130 + i) * 11);
        px(c, x + hx, y + hy, i % 2 ? '#5aa858' : '#2f6e3a');
      }
      r(c, x, y + 2, S, 1, '#6ec06a');
      r(c, x, y + 14, S, 2, 'rgba(0,0,0,0.3)');
      if (m.cell(tx - 1, ty) !== 'H') r(c, x, y + 3, 1, 10, '#2f6e3a');
      if (m.cell(tx + 1, ty) !== 'H') r(c, x + 15, y + 3, 1, 10, '#2f6e3a');
    },
  };
  // 窓（屋内の大窓：宇宙が見える）
  T['O'] = {
    name: 'window',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      r(c, x, y, S, S, '#2a2440');
      r(c, x + 1, y + 1, 14, 12, '#0a0a24');
      for (let i = 0; i < 4; i++) {
        const h = G.hash(tx, ty, 200 + i);
        if (h > 0.4) px(c, x + 2 + Math.floor(h * 11), y + 2 + Math.floor(G.hash(ty, tx, 210 + i) * 10), h > 0.8 ? '#ffffff' : '#8aa0ff');
      }
      r(c, x + 1, y + 1, 14, 1, '#4a4a7a');
      r(c, x, y + 13, S, 3, '#5a5470');
      r(c, x, y + 13, S, 1, '#8a84a0');
      if (m.cell(tx + 1, ty) === 'O') r(c, x + 15, y + 1, 1, 12, '#3a3458');
    },
  };
  // 黒板・掲示（壁面）
  T['K'] = {
    name: 'blackboard',
    solid: true,
    draw(c, x, y, tx, ty, m, v) {
      T['w'].draw(c, x, y, tx, ty, Object.assign(Object.create(m), { cell: (a, b) => (b === ty + 1 && a === tx ? 'f' : m.cell(a, b)) }), v);
      r(c, x, y + 1, S, 11, '#2f5a46');
      r(c, x, y + 1, S, 1, '#8a6a40');
      r(c, x, y + 11, S, 1, '#8a6a40');
      if (v > 0.4) G.line(c, x + 2, y + 4 + Math.floor(v * 4), x + 12, y + 4 + Math.floor(v * 5), '#d8e8e0');
      if (v > 0.7) G.line(c, x + 3, y + 8, x + 9, y + 8, '#f0d0e0');
    },
  };

  G.TILE_SOLID = (ch) => !!(T[ch] && T[ch].solid);
})();
