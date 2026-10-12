// =============================================================
//  mechs.js — アームド・フレーム（ロボット）スプライト生成
// =============================================================
// P: { body, body2, accent, accent2, eye, head:'v'|'mono'|'visor'|'horn'|'cat'|'crest', build:'worker'|'slim'|'heavy'|'spiky',
//      wings:'#col', backpack:true, stripes:true }
(function () {
  const PB = G.PB;
  const MW = 32,
    MH = 38;

  function drawMech(P, dir, frame) {
    const b = new PB(MW, MH);
    const B = P.body || '#e8e8f0',
      BS = G.shade(B, -0.28),
      BH = G.shade(B, 0.22),
      BD = G.shade(B, -0.5);
    const A = P.accent || '#3a6ad0',
      AS = G.shade(A, -0.3);
    const A2 = P.accent2 || '#ff3050';
    const F = P.frame || '#4a4a5a',
      FS = G.shade(F, -0.3);
    const EYE = P.eye || '#4ef0ff';
    const build = P.build || 'slim';
    const heavy = build === 'heavy' || build === 'worker';
    const walkL = frame === 1,
      walkR = frame === 2,
      shoot = frame === 3,
      slash = frame === 4;
    const bob = walkL || walkR ? 1 : 0;

    // 共通寸法
    const cx = 16;
    const headY = 3 + bob;
    const torsoY = 11 + bob,
      torsoH = heavy ? 10 : 9;
    const tw = heavy ? 8 : 6; // 胴の半幅
    const waistY = torsoY + torsoH;
    const legTop = waistY + 2;

    const box = (x, y, w, h, c, tag, shadeR) => {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++) {
          let col = c;
          if (shadeR !== false) {
            if (xx === x + w - 1) col = G.shade(c, -0.28);
            else if (yy === y) col = G.shade(c, 0.2);
            else if (yy === y + h - 1) col = G.shade(c, -0.22);
          }
          b.set(xx, yy, col, tag);
        }
    };

    // ---- 背部（後ろ向きで見える／横向きで少し） ----
    if (P.wings && dir !== 'down') {
      const wc = P.wings;
      for (const s of dir === 'up' ? [-1, 1] : [1]) {
        for (let k = 0; k < 4; k++) {
          const x0 = cx + s * (6 + k * 2),
            y0 = torsoY - 4 + k * 2;
          b.line(x0, y0, x0 + s * 6, y0 - 6 + k, k % 2 ? wc : G.shade(wc, 0.4), 'wing');
        }
      }
    }
    if (dir === 'down' && P.wings) {
      for (const s of [-1, 1]) {
        b.line(cx + s * 9, torsoY - 1, cx + s * 14, torsoY - 7, P.wings, 'wing');
        b.line(cx + s * 10, torsoY + 1, cx + s * 15, torsoY - 3, G.shade(P.wings, 0.4), 'wing');
      }
    }

    // ---- 脚 ----
    const leg = (x, lift, w) => {
      const y0 = legTop - lift;
      const lh = MH - 4 - y0;
      box(x, y0, w, lh - 2, F, 'leg');
      // 装甲（すね）
      box(x, y0 + 2, w, Math.max(4, lh - 6), B, 'leg');
      b.set(x + 1, y0 + 3, BH);
      if (P.stripes) b.set(x + 1, y0 + lh - 5, '#2a2a30');
      // 足
      box(x - 1, MH - 5 - lift, w + 2, 3, BS, 'foot');
      b.set(x - 1, MH - 5 - lift, B);
      b.set(x, MH - 5 - lift, B);
    };
    if (dir === 'down' || dir === 'up') {
      const lw = heavy ? 5 : 4;
      leg(cx - 1 - lw - (heavy ? 0 : 0), walkL ? 2 : 0, lw);
      leg(cx + 1 + (heavy ? 0 : 0), walkR ? 2 : 0, lw);
    } else {
      if (walkL) {
        leg(cx + 1, 0, 4);
        leg(cx - 6, 2, 4);
      } else if (walkR) {
        leg(cx - 5, 0, 4);
        leg(cx + 1, 2, 4);
      } else {
        leg(cx - 4, 0, 4);
        leg(cx, 0, 4);
      }
    }

    // ---- 腰 ----
    box(cx - tw + 1, waistY, tw * 2 - 2, 3, F, 'waist');
    if (dir === 'down') {
      box(cx - tw, waistY, 4, 4, B, 'skirt');
      box(cx + tw - 4, waistY, 4, 4, B, 'skirt');
      box(cx - 2, waistY, 4, 3, A, 'skirt');
    } else if (dir === 'up') {
      box(cx - tw, waistY, tw * 2, 3, BS, 'skirt');
    } else box(cx - 3, waistY, 6, 4, B, 'skirt');

    // ---- 胴 ----
    if (dir === 'left') {
      box(cx - tw + 1, torsoY, tw * 2 - 1, torsoH, B, 'torso');
      box(cx - tw + 1, torsoY + 2, 3, 4, A, 'torso');
      if (P.backpack !== false) box(cx + tw - 1, torsoY + 1, 4, torsoH - 2, BS, 'pack');
      b.set(cx + tw + 2, torsoY + torsoH - 1, '#ff9a40');
    } else {
      box(cx - tw, torsoY, tw * 2, torsoH, B, 'torso');
      if (dir === 'down') {
        // 胸部（コクピットハッチ・ダクト）
        box(cx - tw + 1, torsoY + 1, tw - 1, 4, A, 'chest');
        box(cx + 1, torsoY + 1, tw - 2, 4, A, 'chest');
        b.set(cx - 2, torsoY + 2, A2);
        b.set(cx + 2, torsoY + 2, A2);
        for (let x = cx - 3; x <= cx + 2; x += 2) b.set(x, torsoY + 6, BD);
        if (build === 'worker') {
          // 作業用の丸いキャノピー
          b.ell(cx - 0.5, torsoY + 4, 3.2, 2.6, '#7ad8f0', 'canopy');
          b.set(cx - 2, torsoY + 3, '#e0faff');
          b.set(cx - 1, torsoY + 3, '#e0faff');
        }
        if (P.stripes) for (let x = cx - tw; x < cx + tw; x++) if ((x + torsoY) % 4 < 2) b.set(x, torsoY + torsoH - 2, '#2a2a30');
      } else {
        // バックパック
        if (P.backpack !== false) {
          box(cx - tw + 1, torsoY + 1, tw * 2 - 2, torsoH - 2, BS, 'pack');
          box(cx - 4, torsoY + torsoH - 3, 3, 3, FS, 'pack');
          box(cx + 1, torsoY + torsoH - 3, 3, 3, FS, 'pack');
          b.set(cx - 3, torsoY + torsoH, '#ff9a40');
          b.set(cx + 2, torsoY + torsoH, '#ff9a40');
        }
      }
    }

    // ---- 肩・腕 ----
    const shoulder = (x, y, w, h) => {
      box(x, y, w, h, B, 'shoulder');
      b.set(x + 1, y + 1, BH);
      if (P.shoulderAccent) for (let xx = x; xx < x + w; xx++) b.set(xx, y + h - 1, A);
      if (P.spikes) b.set(x + Math.floor(w / 2), y - 1, B), b.set(x + Math.floor(w / 2), y - 2, BH);
    };
    const arm = (x, y, len, w) => {
      box(x, y, w, len, F, 'arm');
      box(x, y + 2, w, Math.max(2, len - 4), B, 'arm');
      box(x, y + len, w, 3, FS, 'fist');
    };
    const sw = heavy ? 6 : 5,
      sh = heavy ? 6 : 5;
    if (dir === 'down' || dir === 'up') {
      const aw = heavy ? 4 : 3;
      const lo = walkL ? -1 : walkR ? 1 : 0;
      const lx = cx - tw - aw,
        rx = cx + tw;
      if ((shoot || slash) && dir === 'down') {
        arm(lx, torsoY + 3, 7, aw);
        // 右腕を前へ（武器を構える）
        box(rx, torsoY + 3, aw, 9, F, 'arm');
        box(rx, torsoY + 5, aw, 6, B, 'arm');
        box(rx - 1, torsoY + 12, aw + 1, 3, FS, 'fist');
      } else if ((shoot || slash) && dir === 'up') {
        arm(lx, torsoY + 3, 7, aw);
        box(rx, torsoY - 4, aw, 8, B, 'arm');
        box(rx, torsoY - 6, aw, 2, FS, 'fist');
      } else {
        arm(lx, torsoY + 3 + lo, 7, aw);
        arm(rx, torsoY + 3 - lo, 7, aw);
      }
      shoulder(cx - tw - sw + 1, torsoY - 1, sw, sh);
      shoulder(cx + tw - 1, torsoY - 1, sw, sh);
    } else {
      // 横向き：手前の腕
      if (shoot || slash) {
        box(cx - 12, torsoY + 4, 12, 3, B, 'arm');
        box(cx - 14, torsoY + 3, 3, 4, FS, 'fist');
      } else {
        const ax = walkL ? cx - 3 : walkR ? cx + 1 : cx - 1;
        arm(ax, torsoY + 3, 7, 4);
      }
      shoulder(cx - 4, torsoY - 1, sw + 2, sh);
    }

    // ---- 頭 ----
    const hw = heavy ? 4 : 3;
    if (dir === 'left') {
      box(cx - hw - 1, headY, hw * 2 + 1, 7, B, 'head');
      box(cx - hw - 2, headY + 3, 3, 3, FS, 'head');
    } else box(cx - hw, headY, hw * 2, 7, B, 'head');
    // 首
    box(cx - 2, headY + 7, 4, 2, F, 'neck');
    const head = P.head || 'v';
    if (dir === 'down') {
      if (head === 'v' || head === 'crest') {
        // デュアルアイ＋Vアンテナ
        b.set(cx - 2, headY + 3, EYE, 'eye');
        b.set(cx + 1, headY + 3, EYE, 'eye');
        b.set(cx - 1, headY + 3, BD);
        b.set(cx, headY + 3, BD);
        b.set(cx - 1, headY + 5, A2);
        b.set(cx, headY + 5, A2);
        const vc = P.vcol || '#ffd25e';
        b.line(cx - 1, headY + 1, cx - 6, headY - 3, vc, 'vfin');
        b.line(cx, headY + 1, cx + 5, headY - 3, vc, 'vfin');
        b.set(cx - 1, headY, A2);
        b.set(cx, headY, A2);
        if (head === 'crest') {
          b.set(cx - 1, headY - 1, vc);
          b.set(cx, headY - 2, vc);
        }
      } else if (head === 'mono') {
        for (let x = cx - hw; x < cx + hw; x++) b.set(x, headY + 3, BD);
        b.set(cx - 1, headY + 3, EYE, 'eye');
        b.set(cx, headY + 3, G.shade(EYE, 0.4), 'eye');
        // とさか/動力パイプ
        b.set(cx - hw, headY + 5, F);
        b.set(cx + hw - 1, headY + 5, F);
        if (P.horn) {
          b.line(cx, headY, cx, headY - 4, A, 'horn');
          b.set(cx - 1, headY - 1, A);
        }
      } else if (head === 'visor') {
        for (let x = cx - hw + 1; x < cx + hw - 1; x++) b.set(x, headY + 3, EYE, 'eye'), b.set(x, headY + 2, G.shade(EYE, -0.3));
        b.set(cx - hw + 1, headY + 3, G.shade(EYE, 0.5));
        b.set(cx + hw - 1, headY + 1, '#2a2a30');
        b.line(cx + hw - 1, headY, cx + hw + 1, headY - 3, '#8a8a9a');
      } else if (head === 'cat') {
        b.set(cx - 2, headY + 3, EYE, 'eye');
        b.set(cx + 1, headY + 3, EYE, 'eye');
        b.line(cx - hw, headY, cx - hw - 1, headY - 3, B, 'ear');
        b.line(cx - hw + 1, headY, cx - hw, headY - 3, BH, 'ear');
        b.line(cx + hw - 1, headY, cx + hw, headY - 3, B, 'ear');
        b.line(cx + hw - 2, headY, cx + hw - 1, headY - 3, BH, 'ear');
        b.set(cx - 1, headY + 5, A2);
        b.set(cx, headY + 5, A2);
      } else if (head === 'horn') {
        b.set(cx - 2, headY + 3, EYE, 'eye');
        b.set(cx + 1, headY + 3, EYE, 'eye');
        b.line(cx - 2, headY, cx - 4, headY - 4, A2, 'horn');
        b.line(cx + 1, headY, cx + 3, headY - 4, A2, 'horn');
        b.line(cx - 3, headY, cx - 5, headY - 3, A2);
      }
    } else if (dir === 'up') {
      b.set(cx - 1, headY + 2, BS);
      b.set(cx, headY + 2, BS);
      if (head === 'v' || head === 'crest') {
        const vc = P.vcol || '#ffd25e';
        b.line(cx - 1, headY + 1, cx - 6, headY - 3, vc, 'vfin');
        b.line(cx, headY + 1, cx + 5, headY - 3, vc, 'vfin');
      }
      if (head === 'cat') {
        b.line(cx - hw, headY, cx - hw - 1, headY - 3, B);
        b.line(cx + hw - 1, headY, cx + hw, headY - 3, B);
      }
      if (head === 'horn' || P.horn) b.line(cx, headY, cx, headY - 4, A2);
    } else {
      if (head === 'mono' || head === 'visor') {
        b.set(cx - hw - 1, headY + 3, EYE, 'eye');
        b.set(cx - hw, headY + 3, G.shade(EYE, -0.2), 'eye');
      } else {
        b.set(cx - hw, headY + 3, EYE, 'eye');
        b.set(cx - hw - 1, headY + 3, EYE, 'eye');
      }
      if (head === 'v' || head === 'crest') b.line(cx - 2, headY + 1, cx - 7, headY - 3, P.vcol || '#ffd25e', 'vfin');
      if (head === 'cat') b.line(cx, headY, cx + 1, headY - 3, B);
      if (head === 'horn' || P.horn) b.line(cx - 1, headY, cx - 3, headY - 4, A2);
    }
    return b;
  }

  const cache = new Map();
  G.mechSheet = function (P) {
    const key = JSON.stringify(P);
    if (cache.has(key)) return cache.get(key);
    const sheet = {};
    for (const dir of ['down', 'up', 'left']) {
      sheet[dir] = [0, 1, 2, 3, 4].map((f) => G.outline(drawMech(P, dir, f).toCanvas(), P.outline || '#140c22', true));
    }
    sheet.right = sheet.left.map((c) => G.flipX(c));
    cache.set(key, sheet);
    return sheet;
  };

  // ---- 機体データ ----
  G.MECHS = {
    ponkotsu: { name: 'ポンコツ号', body: '#e8b030', accent: '#3a3a48', accent2: '#ff5050', frame: '#5a5a6a', eye: '#7ad8f0', head: 'visor', build: 'worker', stripes: true },
    harukaze: { name: 'ハルカゼ', body: '#f0f0f6', accent: '#3a6ad0', accent2: '#ff4050', frame: '#4a4a5a', eye: '#4ef0ff', head: 'v', vcol: '#ff9a30', build: 'slim', shoulderAccent: true },
    harukaze2: { name: 'ハルカゼ改', body: '#f8f8ff', accent: '#2a4ad0', accent2: '#ff3050', frame: '#3a3a50', eye: '#4ef0ff', head: 'crest', vcol: '#ffd25e', build: 'slim', shoulderAccent: true, wings: '#ff9ac8' },
    rose: { name: 'ローズハウンド', body: '#ff7fb0', accent: '#2a2238', accent2: '#4ef0ff', frame: '#3a3048', eye: '#4ef0ff', head: 'cat', build: 'slim', shoulderAccent: true },
    zephyr: { name: 'ゼフィール', body: '#f4f6ff', accent: '#2a4ac0', accent2: '#ff2848', frame: '#5a6080', eye: '#7dff9a', head: 'crest', vcol: '#ffd25e', build: 'slim', wings: '#8ff8ff' },
    guardner: { name: 'ガードナー', body: '#7a8aa8', accent: '#4a5a7a', accent2: '#ffd25e', frame: '#3a4058', eye: '#ff3a8a', head: 'mono', build: 'heavy', shoulderAccent: true },
    guardner2: { name: 'ガードナー指揮官機', body: '#5a6a90', accent: '#ffd25e', accent2: '#ffd25e', frame: '#2a3048', eye: '#ff3a8a', head: 'mono', horn: true, build: 'heavy', shoulderAccent: true },
    salamander: { name: 'サラマンダー', body: '#e0303a', accent: '#1a1a24', accent2: '#ffd25e', frame: '#3a2028', eye: '#ffd25e', head: 'horn', build: 'spiky', spikes: true, shoulderAccent: true },
    nocturne: { name: 'ノクターン', body: '#2a2838', accent: '#8a3af0', accent2: '#ff2848', frame: '#141420', eye: '#ff2848', head: 'mono', horn: true, build: 'slim', wings: '#8a3af0', shoulderAccent: true },
    junker: { name: 'ジャンカー', body: '#8a9a6a', accent: '#5a4a3a', accent2: '#ff8a30', frame: '#4a4a40', eye: '#ffb030', head: 'visor', build: 'worker', stripes: false },
    clanA: { name: 'クラン機', body: '#4ad0a0', accent: '#1a3a4a', accent2: '#ffd25e', frame: '#2a3a40', eye: '#ffd25e', head: 'mono', build: 'heavy' },
    clanB: { name: 'クラン機', body: '#a070e0', accent: '#2a1a40', accent2: '#4ef0ff', frame: '#2a2040', eye: '#4ef0ff', head: 'horn', build: 'slim' },
    jackal: { name: 'ジャッカル', body: '#3a3a48', accent: '#ff5fa2', accent2: '#4ef0ff', frame: '#1a1a24', eye: '#ff5fa2', head: 'cat', build: 'slim', shoulderAccent: true },
    seraph_bit: { name: 'ビット', body: '#f0e8d0', accent: '#d0a030', accent2: '#ff2848', frame: '#8a7a50', eye: '#ffd25e', head: 'mono', build: 'slim' },
  };

  // ---- ボス：セラフィム（大型 64x64） ----
  G.seraphImg = function (phase) {
    const b = new PB(72, 72);
    const B = '#f4ecd8',
      BS = '#c8b890',
      A = '#d0a030',
      R = '#ff2848';
    // 光輪
    b.fill((x, y) => {
      const d = Math.hypot(x - 36, y - 26);
      return d > 25 && d < 27.5;
    }, phase > 1 ? '#ff7090' : '#ffe890');
    // 翼（6枚）
    for (let k = 0; k < 3; k++)
      for (const s of [-1, 1]) {
        const x0 = 36 + s * 10,
          y0 = 24 + k * 6;
        for (let t = 0; t < 18; t++) {
          const x = x0 + s * t * 1.3,
            y = y0 - t * (0.9 - k * 0.35);
          b.rect(Math.round(x), Math.round(y), 2, 4 - (t > 12 ? 1 : 0), t % 3 ? B : BS);
        }
      }
    // 胴体
    b.ell(36, 34, 11, 14, B);
    b.ell(36, 34, 7, 10, BS);
    b.ell(36, 31, 4, 4, phase > 1 ? R : '#7ad8f0');
    b.set(35, 30, '#ffffff');
    // 頭
    b.ell(36, 15, 6, 6, B);
    b.rect(31, 15, 10, 2, '#1a1028');
    b.rect(33, 15, 2, 1, R);
    b.rect(37, 15, 2, 1, R);
    G.tri(b, [36, 4, 33, 10, 39, 10], A);
    // 下半身（スカート状）
    G.tri(b, [24, 44, 48, 44, 36, 66], B);
    G.tri(b, [28, 46, 44, 46, 36, 62], BS);
    b.rect(35, 46, 2, 16, A);
    return G.outline(b.toCanvas(), '#140c22', true);
  };
})();
