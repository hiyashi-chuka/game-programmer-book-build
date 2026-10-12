// =============================================================
//  cg.js — イベントCG（手続き生成のドット絵一枚絵）
// =============================================================
(function () {
  const W = G.W,
    H = G.H;
  const cache = {};
  const CG = (G.CG = {});

  // ---------- コロニー内部（円筒を軸方向に見通す） ----------
  function colonyView(variant) {
    const key = 'colony_' + variant;
    if (cache[key]) return cache[key];
    const cv = G.makeCanvas(W, H);
    const c = cv.ctx;
    const img = c.createImageData(W, H);
    const d = img.data;
    const cx = W / 2,
      cy = H * 0.44;
    const night = variant === 'night' || variant === 'dark';
    const dusk = variant === 'dusk';
    const dark = variant === 'dark';
    const fog = dark ? [24, 12, 36] : night ? [36, 34, 90] : dusk ? [255, 186, 150] : [205, 228, 255];
    const sky1 = night ? [8, 8, 34] : dusk ? [250, 130, 120] : [110, 180, 250];
    const sky2 = night ? [36, 26, 86] : dusk ? [255, 214, 170] : [215, 242, 255];
    const dither = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const K = 5200; // 奥行き係数
    const DB = 0.55; // 奥行き方向のブロック密度
    const SEC = Math.PI / 3;
    // 陸の色（ブロック単位）
    function landCol(bu, bv, si, fu, fv) {
      const h = G.hash(bu, bv, si);
      const avenue = bu % 6 === 0;
      const road = fu < 0.12 || fv < 0.12 || avenue;
      const riverU = 21; // 中央の運河
      if (Math.abs(bu - riverU) <= 0) return night ? [26, 44, 100] : dusk ? [200, 140, 160] : [70, 140, 215];
      if (road) {
        if (night) return G.hash(bu, bv, 9) > 0.55 ? [255, 196, 120] : [70, 62, 110];
        return avenue ? [196, 190, 200] : [176, 172, 184];
      }
      if (h < 0.22) return night ? [20, 44, 44] : [96, 176, 92]; // 公園
      if (h < 0.3) return night ? [28, 30, 60] : [210, 120, 110]; // 赤い屋根
      if (night) {
        if (G.hash(bu * 3 + Math.floor(fu * 3), bv * 3 + Math.floor(fv * 3), 7) > 0.62) return G.hash(bu, bv, 8) > 0.85 ? [255, 120, 200] : [255, 222, 150];
        return [30, 28, 62];
      }
      const tone = 150 + Math.floor(h * 70);
      const lit = fu < 0.5 ? 14 : -10; // 屋根の陰影
      return [tone + lit, tone - 6 + lit, tone + 12 + lit];
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const dx = x - cx,
          dy = (y - cy) * 1.12;
        const r = Math.hypot(dx, dy);
        let th = Math.atan2(dy, dx);
        if (th < 0) th += Math.PI * 2;
        const z = K / Math.max(r, 1);
        const fogK = 1 - Math.exp(-z * 0.0045);
        const sec = (th - SEC + Math.PI * 4) % (Math.PI * 2);
        const si = Math.floor(sec / SEC);
        const u = (sec % SEC) / SEC;
        const bth = dither[(y % 4) * 4 + (x % 4)] / 16;
        let col;
        if (r < 8) col = night ? [210, 225, 255] : [255, 255, 245];
        else if (si % 2 === 0) {
          const bu = u * 42,
            bv = z * DB;
          const fu = bu - Math.floor(bu),
            fv = bv - Math.floor(bv);
          // ブロックの画面上の大きさ（小さすぎると平均色）
          const pxPerBlock = (r * r) / (K * DB);
          col = landCol(Math.floor(bu), Math.floor(bv), si, fu, fv);
          if (pxPerBlock < 3) {
            const avg = night ? [44, 40, 80] : dusk ? [200, 160, 160] : [158, 168, 170];
            const t = 1 - pxPerBlock / 3;
            col = col.map((v, i) => v + (avg[i] - v) * t);
          }
          const edge = Math.min(u, 1 - u);
          if (!night && edge < 0.05) col = col.map((v) => Math.min(255, v + 26));
          if (edge < 0.012) col = night ? [60, 60, 96] : [130, 136, 160];
        } else {
          const g = Math.abs(u - 0.5) * 2;
          col = sky1.map((v, i) => v + (sky2[i] - v) * (1 - g * g));
          if (night && G.hash(x, y, 77) > 0.982) col = [255, 255, 255];
          if (!night && Math.abs(u - 0.5) < 0.05) col = col.map((v) => Math.min(255, v + 22));
          // 窓の桟（奥行き方向に一定間隔）
          const rib = (z * 0.012) % 1;
          if (Math.abs(u - 0.5) > 0.46 || rib < 0.05) col = night ? [46, 46, 78] : dusk ? [200, 150, 160] : [150, 166, 196];
        }
        const fk = Math.min(1, fogK + bth * 0.05);
        col = col.map((v, i) => v + (fog[i] - v) * fk * (dark ? 0.55 : 0.9));
        const q = 10;
        const i4 = (y * W + x) * 4;
        d[i4] = Math.round(col[0] / q + bth - 0.5) * q;
        d[i4 + 1] = Math.round(col[1] / q + bth - 0.5) * q;
        d[i4 + 2] = Math.round(col[2] / q + bth - 0.5) * q;
        d[i4 + 3] = 255;
      }
    c.putImageData(img, 0, 0);
    // 中心（遠端キャップ）の光
    c.globalCompositeOperation = 'lighter';
    G.glow(c, cx, cy, 70, night ? 'rgba(140,160,255,0.25)' : dusk ? 'rgba(255,200,150,0.35)' : 'rgba(255,255,230,0.4)');
    c.globalCompositeOperation = 'source-over';
    cache[key] = cv;
    return cv;
  }
  function clouds(c, t, cx, cy, night) {
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + t * 0.0006 * (i % 2 ? 1 : -1);
      const rr = 30 + (i * 13) % 50;
      const x = cx + Math.cos(a) * rr * 1.4,
        y = cy + Math.sin(a) * rr * 0.9;
      c.globalAlpha = night ? 0.12 : 0.35;
      G.ellipse(c, Math.round(x), Math.round(y), 14 + (i % 3) * 5, 4 + (i % 2) * 2, night ? '#8080c0' : '#ffffff');
      G.ellipse(c, Math.round(x + 8), Math.round(y - 2), 9, 4, night ? '#8080c0' : '#ffffff');
    }
    c.globalAlpha = 1;
  }
  // 屋上の手すり＋2人のシルエット
  function rooftop(c, night) {
    const base = H - 46;
    c.fillStyle = night ? '#120c24' : '#3a3050';
    c.fillRect(0, base + 18, W, 30);
    c.fillStyle = night ? '#1a1430' : '#4a4060';
    c.fillRect(0, base + 18, W, 2);
    // フェンス
    c.fillStyle = night ? '#2a2440' : '#6a6080';
    c.fillRect(0, base - 22, W, 2);
    for (let x = 0; x < W; x += 6) c.fillRect(x, base - 22, 1, 40);
    c.globalAlpha = 0.35;
    for (let x = -40; x < W; x += 6) {
      G.line(c, x, base - 20, x + 40, base + 18, night ? '#2a2440' : '#6a6080');
      G.line(c, x + 40, base - 20, x, base + 18, night ? '#2a2440' : '#6a6080');
    }
    c.globalAlpha = 1;
    // 2人（並んで座る）
    const sil = night ? '#0a0614' : '#1c1430';
    const kid = (x, hair) => {
      G.ellipse(c, x, base - 4, 7, 7, sil);
      c.fillStyle = sil;
      c.fillRect(x - 7, base + 2, 14, 16);
      c.fillRect(x - 9, base + 14, 18, 6);
      if (hair === 'spiky') for (let k = -6; k <= 6; k += 3) c.fillRect(x + k, base - 13 + Math.abs(k) / 3, 2, 4);
      if (hair === 'phones') {
        c.fillRect(x - 9, base - 6, 3, 6);
        c.fillStyle = '#ff5fa2';
        c.fillRect(x - 9, base - 5, 1, 3);
      }
    };
    kid(W / 2 - 20, 'spiky');
    kid(W / 2 + 16, 'phones');
    // ルウのスケボー
    c.fillStyle = sil;
    c.fillRect(W / 2 + 30, base + 16, 22, 2);
    c.fillStyle = '#ff5fa2';
    c.fillRect(W / 2 + 32, base + 18, 3, 2);
    c.fillRect(W / 2 + 46, base + 18, 3, 2);
  }

  CG.colony = (c, t) => {
    c.drawImage(colonyView('day'), 0, 0);
    clouds(c, t, W / 2, H * 0.44, false);
  };
  CG.colony_dusk = (c, t) => {
    c.drawImage(colonyView('dusk'), 0, 0);
    clouds(c, t, W / 2, H * 0.44, false);
  };
  CG.colony_night = (c, t) => {
    c.drawImage(colonyView('night'), 0, 0);
    clouds(c, t, W / 2, H * 0.44, true);
    twinkle(c, t);
  };
  CG.colony_dark = (c, t) => {
    c.drawImage(colonyView('dark'), 0, 0);
    // 警報の赤
    c.fillStyle = `rgba(255,30,60,${0.1 + 0.08 * Math.sin(t * 0.08)})`;
    c.fillRect(0, 0, W, H);
  };
  CG.rooftop = (c, t) => {
    c.drawImage(colonyView('dusk'), 0, 0);
    clouds(c, t, W / 2, H * 0.44, false);
    rooftop(c, false);
  };
  CG.rooftop_night = (c, t) => {
    c.drawImage(colonyView('night'), 0, 0);
    twinkle(c, t);
    rooftop(c, true);
  };
  CG.title = (c, t) => {
    c.drawImage(colonyView('dusk'), 0, 0);
    clouds(c, t, W / 2, H * 0.44, false);
    rooftop(c, false);
  };
  function twinkle(c, t) {
    for (let i = 0; i < 40; i++) {
      if ((t + i * 37) % 90 < 45) continue;
      const x = Math.floor(G.hash(i, 5, 1) * W),
        y = Math.floor(G.hash(i, 6, 1) * H * 0.8);
      c.fillStyle = i % 3 ? '#ffe0a0' : '#ff8ac8';
      c.fillRect(x, y, 1, 1);
    }
  }

  // ---------- 宇宙・コロニー外観 ----------
  function starfield(seed) {
    const key = 'stars' + seed;
    if (cache[key]) return cache[key];
    const cv = G.makeCanvas(W, H);
    const c = cv.ctx;
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#05041a');
    g.addColorStop(1, '#120830');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // 星雲
    for (let i = 0; i < 8; i++) G.glow(c, G.hash(i, seed, 1) * W, G.hash(i, seed, 2) * H, 60 + G.hash(i, seed, 3) * 80, i % 2 ? 'rgba(160,60,200,0.12)' : 'rgba(60,120,220,0.12)');
    for (let i = 0; i < 400; i++) {
      const h = G.hash(i, seed, 4);
      c.fillStyle = h > 0.97 ? '#ffffff' : h > 0.85 ? '#c8d8ff' : h > 0.7 ? '#ffd8e8' : '#6a6aa0';
      c.fillRect(Math.floor(G.hash(i, seed, 5) * W), Math.floor(G.hash(i, seed, 6) * H), 1, 1);
    }
    cache[key] = cv;
    return cv;
  }
  function colonyExterior(c, t, x, y, scale, dark) {
    // 斜めに浮かぶ円筒
    c.save();
    c.translate(x, y);
    c.rotate(-0.38);
    const L = 300 * scale,
      R = 34 * scale;
    for (let i = 0; i < L; i++) {
      const k = i / L;
      const sh = 0.55 + 0.45 * Math.sin(k * 3.1);
      for (let j = -R; j <= R; j++) {
        const n = j / R;
        const light = Math.max(0, -n * 0.6 + 0.5) * sh;
        // 縦の帯：陸(灰)と窓(青)
        const band = Math.floor(((Math.asin(G.clamp(n, -1, 1)) / Math.PI + 0.5) * 6)) % 2;
        let col = band ? [70, 110, 180] : [150, 150, 170];
        if (dark && band) col = [20, 30, 60];
        const v = col.map((q) => Math.min(255, Math.round((q * (0.35 + light)) / 10) * 10));
        c.fillStyle = `rgb(${v[0]},${v[1]},${v[2]})`;
        c.fillRect(i - L / 2, j, 1, 1);
      }
    }
    // ミラー（3枚）
    for (const s of [-1, 0, 1]) {
      c.fillStyle = 'rgba(190,220,255,0.28)';
      c.beginPath();
      c.moveTo(-L / 2 + 10, s * R * 0.8);
      c.lineTo(L / 2 - 10, s * R * 0.8);
      c.lineTo(L / 2 + 20 * scale, s * R * 1.9);
      c.lineTo(-L / 2 + 30 * scale, s * R * 1.9);
      c.fill();
    }
    // 端のキャップと港
    c.fillStyle = '#8a8aa0';
    c.fillRect(-L / 2 - 6, -R, 6, R * 2);
    c.fillStyle = '#ffd25e';
    if (Math.floor(t / 20) % 2) c.fillRect(-L / 2 - 8, -2, 3, 3);
    c.restore();
  }
  CG.space = (c, t) => {
    c.drawImage(starfield(1), 0, 0);
  };
  CG.colony_out = (c, t) => {
    c.drawImage(starfield(2), 0, 0);
    // 地球
    G.ellipse(c, 60, 230, 80, 80, '#1a3a80');
    G.ellipse(c, 50, 220, 70, 70, '#2a5ab0');
    G.ellipse(c, 30, 200, 20, 12, '#4a9a5a');
    G.ellipse(c, 70, 240, 25, 10, '#4a9a5a');
    c.fillStyle = 'rgba(160,220,255,0.25)';
    G.ellipse(c, 60, 230, 82, 82, 'rgba(160,220,255,0.15)');
    colonyExterior(c, t, W / 2 + 30, H / 2 - 10, 1, false);
  };
  CG.colony_out_dark = (c, t) => {
    c.drawImage(starfield(2), 0, 0);
    colonyExterior(c, t, W / 2 + 30, H / 2 - 10, 1, true);
    c.fillStyle = `rgba(255,30,60,${0.08 + 0.05 * Math.sin(t * 0.1)})`;
    c.fillRect(0, 0, W, H);
  };

  // ---------- ネオン街 ----------
  CG.neon = (c, t) => {
    c.fillStyle = '#0c0820';
    c.fillRect(0, 0, W, H);
    const rnd = G.srand(5);
    for (let layer = 0; layer < 3; layer++) {
      let x = -20;
      while (x < W) {
        const w = 30 + Math.floor(rnd() * 50),
          h = 60 + Math.floor(rnd() * 120) + layer * 30;
        const col = ['#1a1238', '#22184a', '#2a1e58'][layer];
        c.fillStyle = col;
        c.fillRect(x, H - h, w, h);
        for (let wy = H - h + 6; wy < H - 10; wy += 8)
          for (let wx = x + 4; wx < x + w - 4; wx += 6)
            if (rnd() > 0.55) {
              c.fillStyle = rnd() > 0.85 ? '#ff79c6' : rnd() > 0.5 ? '#ffd890' : '#4ef0ff';
              c.fillRect(wx, wy, 2, 3);
            }
        if (layer === 2 && rnd() > 0.4) {
          const nc = G.pick(['#ff5fa2', '#4ef0ff', '#ffd25e', '#a070ff']);
          const flick = Math.sin(t * 0.2 + x) > -0.9;
          c.fillStyle = flick ? nc : '#3a2a4a';
          c.fillRect(x + 6, H - h + 10, 4, 36);
          if (flick) G.glow(c, x + 8, H - h + 28, 26, G.rgba(nc, 0.35));
        }
        x += w + 2;
      }
    }
    // 雨
    c.fillStyle = 'rgba(180,200,255,0.35)';
    for (let i = 0; i < 80; i++) {
      const x = (i * 53 + t * 3) % W,
        y = (i * 97 + t * 7) % H;
      c.fillRect(x, y, 1, 5);
    }
  };

  // ---------- アリーナ ----------
  CG.arena = (c, t) => {
    c.fillStyle = '#0a0618';
    c.fillRect(0, 0, W, H);
    // 観客席
    for (let row = 0; row < 6; row++) {
      const y = 40 + row * 14;
      for (let x = 0; x < W; x += 7) {
        const h = G.hash(x, row, 3);
        const jump = Math.sin(t * 0.3 + x * 0.5 + row) > 0.6 ? -2 : 0;
        c.fillStyle = row % 2 ? '#1c1434' : '#241a40';
        G.ellipse(c, x + 3, y + jump, 3, 3, c.fillStyle);
        c.fillRect(x, y + 3 + jump, 7, 8);
        if (h > 0.92) {
          c.fillStyle = G.pick(['#ff5fa2', '#4ef0ff', '#ffd25e']);
          c.fillRect(x + 2, y - 6 + jump, 2, 4);
        }
      }
    }
    // フィールド
    c.fillStyle = '#2a2440';
    c.fillRect(0, 130, W, H - 130);
    for (let x = 0; x < W; x += 24) {
      c.fillStyle = '#3a2a6a';
      c.fillRect(x, 130, 1, H);
    }
    c.fillStyle = '#ff5fa2';
    c.fillRect(0, 130, W, 2);
    // スポットライト
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const a = Math.sin(t * 0.02 + i * 1.7) * 0.6;
      const sx = 60 + i * 120;
      c.fillStyle = i % 2 ? 'rgba(255,95,162,0.12)' : 'rgba(78,240,255,0.12)';
      c.beginPath();
      c.moveTo(sx, 0);
      c.lineTo(sx + 160 * a - 30, H);
      c.lineTo(sx + 160 * a + 30, H);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // 大型ビジョン
    c.fillStyle = '#1a1028';
    c.fillRect(W / 2 - 70, 6, 140, 28);
    c.fillStyle = '#ff5fa2';
    c.fillRect(W / 2 - 70, 6, 140, 1);
    G.pixText(c, 'JUNK DUEL', W / 2 - G.pixTextW('JUNK DUEL', 2) / 2, 14, Math.floor(t / 15) % 2 ? '#ffd25e' : '#4ef0ff', 2);
    // 機体シルエット2体
    const m1 = G.mechSheet(G.MECHS.harukaze).right[Math.floor(t / 10) % 3];
    const m2 = G.mechSheet(G.MECHS.salamander).left[Math.floor(t / 10) % 3];
    c.drawImage(m1, 120, 150, 68, 76);
    c.drawImage(m2, 290, 150, 68, 76);
  };

  // ---------- 白い機体（ゼフィール登場） ----------
  CG.zephyr = (c, t) => {
    c.drawImage(colonyView('night'), 0, 0);
    c.fillStyle = 'rgba(10,8,30,0.55)';
    c.fillRect(0, 0, W, H);
    // 背後の光輪
    c.globalCompositeOperation = 'lighter';
    G.glow(c, W / 2, 110, 120, 'rgba(140,250,255,0.3)');
    c.globalCompositeOperation = 'source-over';
    const m = G.mechSheet(G.MECHS.zephyr).down[0];
    c.imageSmoothingEnabled = false;
    c.drawImage(m, W / 2 - 68, 40, 136, 152);
    // 光の羽の粒子
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + t * 0.01;
      const r = 70 + ((t * 0.5 + i * 13) % 50);
      c.fillStyle = i % 2 ? '#8ff8ff' : '#ffffff';
      c.fillRect(W / 2 + Math.cos(a) * r, 110 + Math.sin(a) * r * 0.6, 1, 1);
    }
    // スクラップの地面
    c.fillStyle = '#1a1424';
    c.fillRect(0, 200, W, 70);
    for (let x = 0; x < W; x += 9) {
      c.fillStyle = '#2a2236';
      c.fillRect(x, 196 + (G.hash(x, 1, 2) * 8) | 0, 8, 6);
    }
  };

  // ---------- スターシード ----------
  CG.starseed = (c, t) => {
    c.fillStyle = '#04030f';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) G.glow(c, W / 2, H / 2, 40 + i * 30 + Math.sin(t * 0.05 + i) * 6, `rgba(${120 + i * 20},${200 - i * 10},255,0.12)`);
    c.globalCompositeOperation = 'source-over';
    const s = G.prop('starseed', {});
    c.drawImage(s.img, W / 2 - 64, H / 2 - 80, 128, 160);
    for (let i = 0; i < 60; i++) {
      const a = (i * 2.4 + t * 0.01 * (i % 3 ? 1 : -1)) % (Math.PI * 2);
      const r = 40 + ((i * 17 + t) % 160);
      c.fillStyle = i % 4 ? '#bff8ff' : '#ff9ac8';
      c.fillRect(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r * 0.7, 1, 1);
    }
  };
  // ---------- 研究所の記憶（セピア） ----------
  CG.memory = (c, t) => {
    c.fillStyle = '#2a2018';
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 80;
      const cap = G.prop('capsule', {});
      c.drawImage(G.flash(cap.img, '#c8a070'), x, 90, 48, 88);
    }
    c.fillStyle = 'rgba(255,220,160,0.08)';
    for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    if (G.frame % 40 < 2) {
      c.fillStyle = 'rgba(255,255,255,0.1)';
      c.fillRect(0, 0, W, H);
    }
  };
  // ---------- 朝（ミラーが開く） ----------
  CG.dawn = (c, t) => {
    c.drawImage(colonyView('day'), 0, 0);
    const k = Math.min(1, t / 300);
    c.fillStyle = `rgba(20,20,60,${0.8 * (1 - k)})`;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    G.glow(c, W / 2, H * 0.46, 40 + k * 200, `rgba(255,230,180,${0.4 * k})`);
    c.globalCompositeOperation = 'source-over';
    clouds(c, t, W / 2, H * 0.44, false);
    rooftop(c, false);
  };
  // ---------- ラジオ局 ----------
  CG.radio = (c, t) => {
    c.fillStyle = '#140a24';
    c.fillRect(0, 0, W, H);
    // 機材
    c.fillStyle = '#2a1a40';
    c.fillRect(40, 120, 400, 90);
    c.fillStyle = '#3a2458';
    c.fillRect(40, 120, 400, 4);
    for (let i = 0; i < 24; i++) {
      const lv = Math.abs(Math.sin(t * 0.15 + i * 0.6)) * 30 + Math.abs(Math.sin(t * 0.07 + i)) * 10;
      for (let k = 0; k < lv; k += 3) {
        c.fillStyle = k > 30 ? '#ff3050' : k > 18 ? '#ffd25e' : '#4ef0ff';
        c.fillRect(70 + i * 14, 196 - k, 10, 2);
      }
    }
    // ターンテーブル
    for (const x of [100, 380]) {
      G.ellipse(c, x, 150, 26, 12, '#0a0614');
      G.ellipse(c, x, 150, 4, 2, '#ff5fa2');
      const a = t * 0.1;
      c.fillStyle = '#4a3a6a';
      c.fillRect(x + Math.cos(a) * 18, 150 + Math.sin(a) * 8, 2, 1);
    }
    // ON AIR ランプ
    const on = Math.floor(t / 30) % 2 === 0;
    c.fillStyle = on ? '#ff3050' : '#5a1828';
    c.fillRect(W / 2 - 40, 20, 80, 22);
    G.pixText(c, 'ON AIR', W / 2 - G.pixTextW('ON AIR', 2) / 2, 26, on ? '#ffffff' : '#a06070', 2);
    if (on) G.glow(c, W / 2, 31, 60, 'rgba(255,48,80,0.25)');
    // マイク
    c.fillStyle = '#8a8aa0';
    c.fillRect(W / 2 - 1, 60, 3, 60);
    G.ellipse(c, W / 2, 56, 8, 10, '#5a5a70');
    G.ellipse(c, W / 2 - 2, 52, 3, 4, '#8a8aa0');
    // 窓の外のネオン
    for (let i = 0; i < 20; i++) {
      c.fillStyle = G.pick(['#ff5fa2', '#4ef0ff', '#ffd890']);
      c.fillRect(Math.floor(G.hash(i, 1, 4) * W), 70 + Math.floor(G.hash(i, 2, 4) * 40), 2, 2);
    }
  };
  CG.black = (c) => {
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
  };
  CG.white = (c) => {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, W, H);
  };

  G.drawCG = function (c, cg) {
    cg.t++;
    const f = CG[cg.id] || CG.black;
    f(c, cg.t);
    // フェードイン
    if (cg.t < 20) {
      c.fillStyle = `rgba(0,0,0,${1 - cg.t / 20})`;
      c.fillRect(0, 0, W, H);
    }
  };
  // 起動時に重いCGを事前生成
  G.prewarmCG = function () {
    ['day', 'dusk', 'night'].forEach((v) => colonyView(v));
  };
})();
