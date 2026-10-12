// =============================================================
//  portraits.js — 会話用バストアップ（64x64、表情差分）生成
// =============================================================
// 表情: normal smile grin angry sad surprise serious think shy cry
(function () {
  const PB = G.PB;
  const W = 64;

  // 髪型ごとの前髪ストランド [中心x, 先端y, 半幅]
  const PH = {
    short: { base: 19, strands: [[17, 30, 5], [23, 33, 5], [29, 31, 4], [35, 34, 5], [41, 31, 5], [47, 28, 4]], side: 40 },
    spiky: { base: 18, strands: [[17, 32, 4], [22, 35, 4], [28, 31, 4], [34, 36, 4], [40, 32, 4], [46, 30, 4]], side: 38, spikes: [[14, 18, 4, 4, 22, 10], [22, 12, 20, -1, 30, 8], [30, 9, 36, -2, 38, 8], [38, 10, 50, 0, 46, 16], [46, 16, 60, 10, 50, 24]] },
    messy: { base: 19, strands: [[16, 33, 5], [22, 29, 4], [27, 35, 5], [33, 31, 4], [39, 36, 5], [45, 30, 5], [49, 34, 3]], side: 42, spikes: [[12, 26, 4, 30, 14, 34], [52, 24, 60, 30, 50, 34], [28, 8, 32, 1, 36, 8]] },
    bob: { base: 22, strands: [[18, 31, 6], [26, 32, 6], [34, 32, 6], [42, 31, 6], [48, 30, 5]], side: 50, wide: 2, blunt: true },
    long: { base: 20, strands: [[17, 31, 5], [23, 34, 5], [30, 32, 4], [36, 35, 5], [42, 31, 5], [47, 29, 4]], side: 60, back: 64, wide: 1 },
    ponytail: { base: 19, strands: [[18, 30, 5], [25, 33, 5], [32, 30, 4], [38, 33, 5], [45, 29, 5]], side: 44, pony: true },
    twin: { base: 20, strands: [[17, 31, 5], [23, 34, 5], [30, 32, 4], [36, 35, 5], [42, 31, 5], [47, 29, 4]], side: 46, twin: true },
    buzz: { base: 17, strands: [], side: 30, buzz: true },
    bald: { base: 0, strands: [], side: 36, bald: true },
    bun: { base: 18, strands: [[19, 26, 6], [27, 24, 6], [43, 27, 6], [47, 30, 4]], side: 42, bun: true },
    slick: { base: 17, strands: [[40, 26, 6], [46, 28, 4]], side: 36 },
    pixie: { base: 20, strands: [[16, 33, 4], [21, 36, 4], [27, 32, 4], [32, 37, 4], [38, 33, 4], [43, 36, 4], [48, 31, 3]], side: 44 },
    hime: { base: 26, strands: [[17, 29, 3], [23, 29, 4], [29, 29, 4], [35, 29, 4], [41, 29, 4], [47, 29, 3]], side: 54, back: 64, wide: 2, blunt: true },
    wild: { base: 19, strands: [[16, 35, 5], [22, 31, 5], [28, 37, 5], [35, 32, 5], [41, 37, 5], [47, 32, 5]], side: 56, back: 60, wide: 3, spikes: [[10, 30, 0, 22, 12, 18], [54, 30, 63, 22, 52, 18], [16, 14, 8, 4, 26, 8], [40, 8, 56, 4, 50, 16]] },
    puff: { base: 17, strands: [], side: 36, puff: true },
    side: { base: 19, strands: [[17, 30, 5], [23, 32, 5], [30, 30, 4], [37, 40, 7], [43, 42, 6], [48, 38, 4]], side: 44 },
  };

  function colors(P) {
    const c = {};
    c.skin = P.skin || '#f6d3b3';
    c.skinS = G.shade(c.skin, -0.16);
    c.skinS2 = G.shade(c.skin, -0.3);
    c.skinH = G.shade(c.skin, 0.25);
    c.hair = P.hair || '#2b2140';
    c.hairS = G.shade(c.hair, -0.32);
    c.hairH = G.shade(c.hair, 0.4);
    c.hairL = G.shade(c.hair, -0.55);
    c.iris = P.iris || G.shade(P.eye || '#5a3a90', 0.15);
    c.irisD = G.shade(c.iris, -0.45);
    c.irisL = G.shade(c.iris, 0.35);
    c.lash = P.lash || G.shade(c.hair, -0.6);
    c.top = P.top || '#3a4a8a';
    c.topS = G.shade(c.top, -0.3);
    c.topH = G.shade(c.top, 0.2);
    c.top2 = P.top2 || '#f0eef8';
    c.top2S = G.shade(c.top2, -0.2);
    c.tie = P.tie || '#e04070';
    c.acc = P.accCol || '#202028';
    c.mouth = G.shade(c.skin, -0.5);
    return c;
  }

  function draw(P, ex) {
    const b = new PB(W, W);
    const C = colors(P);
    const H = PH[P.style] || PH.short;
    const fem = !!P.lashes;
    const old = !!P.old;
    const faceHW = (y) => {
      if (y < 20) return 0;
      const top = P.jaw === 'wide' ? 16 : 15;
      if (y <= 39) return top;
      const t = (y - 39) / (P.jaw === 'wide' ? 15 : 13.5);
      return Math.max(0, top * Math.sqrt(Math.max(0, 1 - t * t)) + (P.jaw === 'wide' ? 1.5 : 0));
    };
    const inFace = (x, y) => y >= 20 && y <= 53 && Math.abs(x - 31.5) <= faceHW(y);
    const inSkull = (x, y) => ((x - 31.5) / 17) ** 2 + ((y - 27) / 18) ** 2 <= 1;
    const inCap = (x, y) => ((x - 31.5) / (18.5 + (H.wide || 0))) ** 2 + ((y - 25.5) / 19) ** 2 <= 1;

    // ---------- 後ろ髪 ----------
    if (!H.bald && !H.buzz) {
      if (H.back) {
        b.fill((x, y) => {
          if (y < 14 || y > H.back) return false;
          const hw = 19 + (H.wide || 0) + Math.min(3, (y - 30) * 0.12);
          return Math.abs(x - 31.5) <= hw && (y < 40 || Math.abs(x - 31.5) >= 9 || y < 46);
        }, (x, y) => (Math.abs(x - 31.5) > 17 + (H.wide || 0) ? C.hairS : G.shade(C.hair, -0.12)), 'hairB');
      }
      if (H.pony) {
        b.fill((x, y) => {
          const t = (y - 14) / 40;
          if (t < 0 || t > 1) return false;
          const cx = 50 + t * 6,
            hw = 7 * Math.sin(Math.PI * Math.min(1, t * 1.3 + 0.15));
          return Math.abs(x - cx) <= hw;
        }, (x, y) => (x > 54 ? C.hairS : C.hair), 'hairB');
      }
      if (H.twin) {
        for (const side of [-1, 1]) {
          b.fill((x, y) => {
            const t = (y - 18) / 46;
            if (t < 0 || t > 1) return false;
            const cx = 31.5 + side * (22 + t * 5),
              hw = 6.5 * Math.sin(Math.PI * Math.min(1, t * 1.2 + 0.12));
            return Math.abs(x - cx) <= hw;
          }, (x, y) => ((x - 31.5) * side > 26 ? C.hairS : C.hair), 'hairB');
        }
      }
      if (H.puff) b.ell(31.5, 22, 26, 22, (x, y) => (y < 14 && x < 30 ? C.hairH : (x + y) % 5 === 0 ? C.hairS : C.hair), 'hairB');
    }

    // ---------- 首・服 ----------
    // 首
    b.fill((x, y) => y >= 46 && y <= 58 && Math.abs(x - 31.5) <= 6, (x, y) => (y < 54 ? C.skinS2 : C.skinS), 'neck');
    // 肩
    const outfit = P.outfit || 'tshirt';
    const shW = (y) => 13 + (y - 54) * 2.6 + (P.build === 'big' ? 4 : P.build === 'small' || P.build === 'slim' ? -2 : 0);
    b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= Math.min(31, shW(y)), (x, y) => {
      const d = x - 31.5;
      if (d > shW(y) - 3) return C.topS;
      if (d < -shW(y) + 2) return C.topH;
      return C.top;
    }, 'cloth');
    const collar = () => {
      if (outfit === 'uniform' || outfit === 'suit') {
        // シャツのV
        b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= Math.max(0, 8 - (y - 54) * 1.1), C.top2, 'cloth');
        b.fill((x, y) => y >= 55 && Math.abs(x - 31.5) <= 1.2, C.tie, 'cloth');
        if (P.ribbon) b.fill((x, y) => y >= 55 && y <= 58 && Math.abs(x - 31.5) <= 5 - Math.abs(y - 56.5), C.tie, 'cloth');
        // 襟の線
        b.line(23, 54, 31, 63, C.topS);
        b.line(40, 54, 32, 63, C.topS);
      } else if (outfit === 'sailor') {
        b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= shW(y) - 1 && y <= 58 + Math.abs(x - 31.5) * 0.1, C.top2, 'cloth');
        b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= Math.max(0, 7 - (y - 54) * 0.9), C.top, 'cloth');
        b.fill((x, y) => y === 57 && Math.abs(x - 31.5) > 9 && Math.abs(x - 31.5) <= shW(y) - 2, C.tie, 'cloth');
        b.fill((x, y) => y >= 58 && y <= 61 && Math.abs(x - 31.5) <= 5 - Math.abs(y - 59.5), C.tie, 'cloth');
      } else if (outfit === 'jacket' || outfit === 'coat' || outfit === 'labcoat') {
        b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= 7 + (y - 54) * 0.3, outfit === 'labcoat' ? '#d8dce8' : C.top2, 'cloth');
        b.line(24, 54, 28, 63, C.topS);
        b.line(39, 54, 35, 63, C.topS);
        if (P.tie) b.fill((x, y) => y >= 55 && Math.abs(x - 31.5) <= 1.2, C.tie, 'cloth');
      } else if (outfit === 'hoodie') {
        b.fill((x, y) => y >= 51 && y <= 57 && Math.abs(x - 31.5) <= 15 - (y - 51) * 0.3 && Math.abs(x - 31.5) >= 6 - (y - 51) * 0.6, C.topS, 'cloth');
        b.set(28, 58, C.top2);
        b.set(28, 59, C.top2);
        b.set(28, 60, C.top2);
        b.set(35, 58, C.top2);
        b.set(35, 59, C.top2);
        b.set(35, 60, C.top2);
      } else if (outfit === 'jumpsuit' || outfit === 'military') {
        b.fill((x, y) => y >= 51 && y <= 55 && Math.abs(x - 31.5) <= 9 && Math.abs(x - 31.5) >= 5, outfit === 'military' ? C.topS : C.top2, 'cloth');
        b.fill((x, y) => y >= 55 && Math.abs(x - 31.5) <= 0.6, C.topS, 'cloth');
        if (outfit === 'military') {
          b.rect(44, 57, 4, 2, '#e8c050');
          b.rect(15, 56, 7, 2, C.top2);
          b.rect(42, 56, 7, 2, C.top2);
        } else b.rect(40, 58, 5, 3, C.top2);
      } else if (outfit === 'apron') {
        b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= 4 - (y - 54) * 0.3, C.skinS);
        b.line(22, 56, 24, 63, C.top2);
        b.line(41, 56, 39, 63, C.top2);
        b.rect(26, 60, 12, 4, C.top2);
      } else if (outfit === 'tank') {
        b.fill((x, y) => y >= 54 && Math.abs(x - 31.5) <= 9 && Math.abs(x - 31.5) >= 0, (x, y) => C.skinS, 'cloth');
        b.fill((x, y) => y >= 58 && Math.abs(x - 31.5) <= 9, C.top, 'cloth');
      } else if (outfit === 'dress') {
        b.fill((x, y) => y >= 54 && y <= 57 && Math.abs(x - 31.5) <= 9 - (y - 54), C.skinS);
        b.fill((x, y) => y === 58 && Math.abs(x - 31.5) <= 6, C.top2);
      } else {
        // Tシャツ
        b.fill((x, y) => y >= 54 && y <= 56 && Math.abs(x - 31.5) <= 7 - (y - 54) * 1.5, C.skinS);
        b.fill((x, y) => (y === 54 || y === 55) && Math.abs(x - 31.5) <= 8 && Math.abs(x - 31.5) >= 7 - (y - 54) * 1.5, C.topS);
        if (P.top2 && P.logo !== false) {
          b.rect(36, 59, 6, 4, C.top2);
          b.rect(37, 60, 4, 2, C.top);
        }
      }
    };
    collar();

    // ---------- 顔 ----------
    b.fill(inFace, C.skin, 'skin');
    // 頭蓋（髪で隠れる部分）
    b.fill((x, y) => inSkull(x, y) && y < 30, C.skin, 'skin');
    // 耳
    for (const s of [-1, 1]) {
      b.ell(31.5 + s * 16, 37, 2.2, 4, C.skin, 'skin');
      b.set(31.5 + s * 16.5, 37, C.skinS);
      b.set(31.5 + s * 16.5, 38, C.skinS);
    }
    // 顔の影（右側と顎下）
    b.fill((x, y) => b.getTag(x, y) === 'skin' && x - 31.5 > faceHW(y) - 3 && y > 32, C.skinS);
    b.fill((x, y) => b.getTag(x, y) === 'skin' && y >= 50, C.skinS);
    if (P.age === 'old' || old) {
      // しわ
      b.line(20, 44, 22, 47, C.skinS);
      b.line(43, 44, 41, 47, C.skinS);
    }

    // ---------- 目 ----------
    const EY = P.eyeY || 31;
    const eyes = [[24, -1], [39, 1]];
    const lid = { normal: 0, smile: 0, grin: 0, angry: 2, sad: 1, surprise: -1, serious: 2, think: 1, shy: 1, cry: 1 }[ex] || 0;
    const closed = ex === 'smile' || ex === 'grin' || (ex === 'cry' && P.closeOnCry);
    for (const [cx, side] of eyes) {
      if (P.hideEye === side) continue;
      if (closed) {
        // ^ ^
        for (let k = -4; k <= 4; k++) {
          const yy = EY + 4 - Math.round(2.4 * Math.cos((k / 4) * 1.2));
          b.set(cx + k, yy, C.lash);
          b.set(cx + k, yy + 1, C.lash);
        }
        if (fem) b.set(cx + side * 5, EY + 4, C.lash);
        continue;
      }
      const ew = fem ? 4 : 3.6;
      const top = EY + Math.max(0, lid);
      // 白目
      b.fill((x, y) => y >= top + 1 && y <= EY + 8 && Math.abs(x - cx) <= ew - (y === EY + 8 ? 1 : 0), (x, y) => (y <= top + 1 ? '#d8d4ec' : '#ffffff'), 'eye');
      // 虹彩
      const irx = ex === 'surprise' ? 2.2 : 2.8,
        iry = ex === 'surprise' ? 2.8 : 3.8;
      const icy = EY + 4.6;
      b.fill((x, y) => ((x - cx) / irx) ** 2 + ((y - icy) / iry) ** 2 <= 1 && y >= top + 1 && y <= EY + 8, (x, y) => (y <= icy - 1.5 ? C.irisD : y >= icy + 1.5 ? C.irisL : C.iris), 'eye');
      // 瞳孔
      if (!P.blankEyes) {
        b.set(cx, Math.round(icy), C.irisD);
        b.set(cx + (side > 0 ? -1 : 0) + (side < 0 ? 0 : 0), Math.round(icy) - 1, C.irisD);
      }
      // ハイライト
      if (!P.blankEyes && ex !== 'serious') {
        b.set(cx - 2, Math.round(icy) - 2, '#ffffff');
        b.set(cx - 1, Math.round(icy) - 2, '#ffffff');
        b.set(cx - 2, Math.round(icy) - 1, '#ffffff');
        b.set(cx + 1, Math.round(icy) + 2, '#ffffff');
      }
      // 上まつげ
      for (let k = -Math.ceil(ew); k <= Math.ceil(ew); k++) {
        let yy = top + (Math.abs(k) >= 3 ? 1 : 0);
        if (ex === 'angry') yy += Math.round((-k * side + 4) / 4) - 1;
        if (ex === 'sad' || ex === 'cry') yy += Math.round((k * side + 4) / 5) - 1;
        b.set(cx + k, yy, C.lash);
        if (fem || Math.abs(k) < 3) b.set(cx + k, yy + 1, C.lash);
      }
      if (fem) {
        b.set(cx + side * 5, top + 1, C.lash);
        b.set(cx + side * 5, top, C.lash);
        b.set(cx + side * 6, top, C.lash);
      }
      // 下まつげ
      for (let k = -2; k <= 2; k++) b.set(cx + k, EY + 9, G.shade(C.lash, 0.35));
      if (ex === 'cry' || P.tears) {
        b.set(cx + 2, EY + 10, '#9fe8ff');
        b.set(cx + 2, EY + 11, '#9fe8ff');
        b.set(cx + 3, EY + 12, '#c8f4ff');
      }
    }
    // 眉
    const browY = EY - 4 - (ex === 'surprise' ? 2 : 0);
    for (const [cx, side] of eyes) {
      if (P.noBrows) break;
      for (let k = -4; k <= 3; k++) {
        const kk = k * side;
        let yy = browY + (Math.abs(k) > 2 ? 1 : 0);
        if (ex === 'angry' || ex === 'serious') yy = browY + Math.round(((-kk + 4) / 8) * (ex === 'angry' ? 3 : 1.6));
        if (ex === 'sad' || ex === 'cry' || ex === 'shy') yy = browY + Math.round(((kk + 4) / 8) * 3) - 1;
        b.set(cx + kk, yy, G.shade(C.hair, -0.35));
        if (P.thickBrows) b.set(cx + kk, yy + 1, G.shade(C.hair, -0.35));
      }
    }
    // 鼻
    b.set(33, EY + 12, C.skinS2);
    b.set(32, EY + 13, C.skinS);
    // 頬
    if (P.blush || ex === 'shy') {
      for (const cx of [21, 42]) for (let k = -2; k <= 2; k += 2) b.set(cx + k, EY + 11, ex === 'shy' ? '#f07890' : '#f4a0b0'), b.set(cx + k + 1, EY + 12, ex === 'shy' ? '#f07890' : '#f4a0b0');
    }
    // 口
    const my = EY + 16;
    const M = C.mouth;
    if (ex === 'smile') {
      b.set(29, my - 1, M);
      for (let x = 30; x <= 34; x++) b.set(x, my, M);
      b.set(35, my - 1, M);
    } else if (ex === 'grin') {
      for (let x = 28; x <= 35; x++) b.set(x, my - 1, M);
      b.fill((x, y) => y >= my && y <= my + 3 && Math.abs(x - 31.5) <= 3.5 - (y - my) * 0.9, (x, y) => (y >= my + 2 ? '#e86078' : '#5a1828'));
      b.rect(29, my, 6, 1, '#ffffff');
    } else if (ex === 'surprise') {
      b.ell(31.5, my + 1, 2, 2.4, '#5a1828');
      b.set(31, my + 2, '#e86078');
      b.set(32, my + 2, '#e86078');
    } else if (ex === 'angry') {
      b.fill((x, y) => y >= my && y <= my + 2 && Math.abs(x - 31.5) <= 3 - (y - my) * 0.5, '#5a1828');
      b.rect(29, my, 6, 1, '#ffffff');
      b.set(28, my + 1, M);
      b.set(35, my + 1, M);
    } else if (ex === 'sad' || ex === 'cry') {
      b.set(29, my + 1, M);
      for (let x = 30; x <= 33; x++) b.set(x, my, M);
      b.set(34, my + 1, M);
    } else if (ex === 'think') {
      for (let x = 31; x <= 34; x++) b.set(x, my, M);
      b.set(30, my + 1, M);
    } else if (ex === 'serious') {
      for (let x = 30; x <= 33; x++) b.set(x, my, M);
    } else {
      for (let x = 30; x <= 33; x++) b.set(x, my, M);
      if (fem) b.set(31, my + 1, G.shade(C.skin, -0.25));
    }
    if (P.beard) {
      b.fill((x, y) => inFace(x, y) && y >= EY + 13 && (y > my + 1 || y < my - 1 || Math.abs(x - 31.5) > 4), (x, y) => ((x + y) % 3 === 0 ? G.shade(P.beard, -0.2) : P.beard), 'beard');
    }
    if (P.scar) {
      b.line(40, 38, 46, 46, G.shade(C.skin, -0.35));
    }

    // ---------- 前髪 ----------
    if (H.bald) {
      // 側頭部のみ
      b.fill((x, y) => inCap(x, y) && y >= 28 && y <= 40 && Math.abs(x - 31.5) >= 14, C.hair, 'hair');
      b.ell(26, 16, 4, 2, C.skinH);
    } else if (H.buzz) {
      b.fill((x, y) => inCap(x, y) && y <= 21 + (Math.abs(x - 31.5) > 14 ? 10 : 0), (x, y) => ((x * 3 + y * 7) % 5 === 0 ? C.hairS : C.hair), 'hair');
    } else {
      const bang = (x) => {
        let y = H.base;
        for (const [sx, sd, sw] of H.strands) {
          const d = Math.abs(x - sx);
          if (d < sw) y = Math.max(y, H.blunt ? sd : sd - (d / sw) * (sd - H.base));
        }
        return y;
      };
      b.fill((x, y) => inCap(x, y) && y <= bang(x), C.hair, 'hair');
      // 横髪（顔の両脇）
      const sideW = 4 + (H.wide || 0);
      b.fill((x, y) => {
        const d = Math.abs(x - 31.5);
        if (y < 18 || y > H.side) return false;
        const t = (y - 18) / (H.side - 18);
        const inner = 15 - sideW + t * 2.5;
        const outer = 18.5 + (H.wide || 0) - (y > 44 ? (y - 44) * 0.15 : 0);
        const tip = y > H.side - 6 ? (y - (H.side - 6)) * 0.6 : 0;
        return d >= inner + tip && d <= outer - tip * 0.3;
      }, (x, y) => (Math.abs(x - 31.5) > 17 ? C.hairS : C.hair), 'hair');
      if (H.spikes) for (const s of H.spikes) tri(b, s, C.hair);
      if (H.bun) {
        b.ell(31.5, 7, 8, 6.5, C.hair, 'hair');
        b.ell(29, 5, 3, 1.5, C.hairH);
      }
      // 前髪の影を肌に
      b.fill((x, y) => b.getTag(x, y) === 'skin' && (b.getTag(x, y - 1) === 'hair' || b.getTag(x, y - 2) === 'hair'), C.skinS);
      // 天使の輪
      b.fill((x, y) => {
        if (b.getTag(x, y) !== 'hair') return false;
        const r = Math.hypot((x - 31.5) / 1.05, y - 30);
        return r > 15 && r < 17.2 && y < 22 && (x * 7 + y) % 9 !== 0 && Math.abs(x - 26) < 12;
      }, C.hairH);
      // 毛先の暗色
      b.fill((x, y) => b.getTag(x, y) === 'hair' && b.getTag(x, y + 1) !== 'hair' && b.get(x, y) !== C.hairH, C.hairS);
      // 束の筋
      for (const [sx, sd] of H.strands) {
        for (let y = Math.max(H.base - 2, sd - 9); y < sd - 3; y++) if (b.getTag(sx + 2, y) === 'hair' && b.get(sx + 2, y) !== C.hairH) b.set(sx + 2, y, C.hairS);
      }
      if (P.mesh) {
        b.fill((x, y) => b.getTag(x, y) === 'hair' && ((x >= 17 && x <= 20) || (x >= 44 && x <= 46 && y > 22)), P.mesh);
      }
      if (P.ahoge) {
        b.line(32, 8, 36, 1, C.hair);
        b.line(33, 8, 37, 2, C.hair);
        b.line(36, 1, 40, 3, C.hair);
      }
    }

    // ---------- アクセサリ ----------
    const A = C.acc;
    for (const a of P.acc || []) {
      if (a === 'glasses' || a === 'roundglasses') {
        for (const [cx] of eyes) {
          const x0 = cx - 6,
            x1 = cx + 6,
            y0 = EY - 1,
            y1 = EY + 10;
          for (let x = x0; x <= x1; x++) {
            b.set(x, y0, A);
            b.set(x, y1, A);
          }
          for (let y = y0; y <= y1; y++) {
            b.set(x0, y, A);
            b.set(x1, y, A);
          }
          b.line(x0 + 2, y0 + 2, x0 + 4, y0 + 2, '#ffffff');
        }
        b.line(30, EY, 33, EY, A);
        b.line(12, EY + 1, 18, EY, A);
        b.line(45, EY, 51, EY + 1, A);
      }
      if (a === 'sunglasses') {
        for (const [cx] of eyes) b.fill((x, y) => y >= EY && y <= EY + 7 && Math.abs(x - cx) <= 6 - (y > EY + 5 ? 1 : 0), (x, y) => (y < EY + 3 ? '#3a2850' : '#1a1028'));
        b.line(30, EY + 1, 33, EY + 1, A);
        b.line(19, EY + 1, 21, EY + 1, '#ff79c6');
        b.line(35, EY + 1, 37, EY + 1, '#79e6ff');
      }
      if (a === 'headphones') {
        b.fill((x, y) => {
          const r = Math.hypot((x - 31.5) / 1.12, y - 28);
          return r >= 20 && r <= 22.5 && y < 26;
        }, A, 'acc');
        for (const s of [-1, 1]) {
          b.fill((x, y) => Math.abs(x - (31.5 + s * 20)) <= 3.5 && y >= 28 && y <= 42, (x, y) => (Math.abs(y - 35) < 3 && s > 0 ? '#ff5fa2' : A), 'acc');
          b.fill((x, y) => Math.abs(x - (31.5 + s * 23)) <= 0.6 && y >= 31 && y <= 39, '#ff5fa2');
        }
      }
      if (a === 'cap') {
        b.fill((x, y) => inCap(x, y) && y <= 19, (x, y) => (y < 10 && x < 30 ? G.shade(A, 0.25) : A), 'acc');
        b.fill((x, y) => y >= 18 && y <= 21 && Math.abs(x - 28) <= 20 - (y - 18) * 1.5, G.shade(A, -0.3), 'acc');
        b.ell(31.5, 11, 3, 2.5, '#ffffff');
      }
      if (a === 'goggles') {
        b.fill((x, y) => y >= 14 && y <= 16 && inCap(x, y + 2), G.shade(A, -0.35));
        for (const cx of [24, 39]) {
          b.ell(cx, 15, 6, 4.5, G.shade(A, -0.2));
          b.ell(cx, 15, 4.5, 3, '#7fe6ff');
          b.set(cx - 2, 13, '#ffffff');
          b.set(cx - 1, 13, '#ffffff');
          b.set(cx - 2, 14, '#ffffff');
        }
      }
      if (a === 'mask') {
        b.fill((x, y) => inFace(x, y) && y >= EY - 8 && y <= EY + 10 + Math.max(0, 6 - Math.abs(x - 31.5)) * 0.5, (x, y) => (x - 31.5 > 8 ? G.shade(A, -0.2) : x < 22 ? G.shade(A, 0.25) : A), 'acc');
        b.fill((x, y) => inSkull(x, y) && y > 18 && y < EY - 6 && Math.abs(x - 31.5) < 15, A, 'acc');
        for (const [cx, side] of eyes) {
          for (let k = -4; k <= 4; k++) {
            b.set(cx + k, EY + 4 + Math.round((k * side) / 4), '#ff2848');
            b.set(cx + k, EY + 5 + Math.round((k * side) / 4), '#ff98a8');
          }
        }
        b.line(31, EY - 8, 31, EY + 12, G.shade(A, -0.4));
      }
      if (a === 'monocle') {
        const [cx] = eyes[1];
        b.fill((x, y) => {
          const r = Math.hypot(x - cx, y - (EY + 4));
          return r >= 6 && r <= 7.2;
        }, '#e8c050');
        b.line(cx + 5, EY + 9, cx + 9, 63, '#e8c050');
      }
      if (a === 'eyepatch') {
        const [cx] = eyes[1];
        b.ell(cx, EY + 4, 6, 5.5, A);
        b.line(14, EY - 6, 50, EY + 4, A);
      }
      if (a === 'ribbon') {
        const cx = 46,
          cy = 12;
        tri(b, [cx, cy, cx + 9, cy - 6, cx + 9, cy + 6], A);
        tri(b, [cx, cy, cx - 9, cy - 6, cx - 9, cy + 6], A);
        b.ell(cx, cy, 2, 2, G.shade(A, -0.3));
      }
      if (a === 'scarf') {
        b.fill((x, y) => y >= 50 && y <= 57 && Math.abs(x - 31.5) <= 13 + (y - 50) * 0.5, (x, y) => ((x + y) % 6 < 3 ? A : G.shade(A, -0.2)), 'acc');
        b.fill((x, y) => y >= 56 && y <= 63 && x >= 36 && x <= 42 - (y - 56) * 0.2, G.shade(A, -0.15), 'acc');
      }
      if (a === 'helmet') {
        b.fill((x, y) => inCap(x, y + 2) && y <= 30, (x, y) => (y < 14 && x < 30 ? G.shade(A, 0.3) : A), 'acc');
        b.fill((x, y) => y >= 22 && y <= 26 && Math.abs(x - 31.5) <= 17, '#8ff0ff');
        b.fill((x, y) => y === 23 && Math.abs(x - 24) <= 4, '#ffffff');
      }
      if (a === 'bandana') {
        b.fill((x, y) => y >= 15 && y <= 19 && inCap(x, y), (x, y) => ((x + y) % 4 ? A : G.shade(A, 0.3)), 'acc');
        tri(b, [48, 18, 58, 14, 56, 26], A);
      }
      if (a === 'antenna') {
        b.line(38, 8, 44, -2, '#c0c8d8');
        b.ell(44, 1, 2, 2, '#ff5fa2');
      }
      if (a === 'earring') {
        b.set(15, 42, '#ffd25e');
        b.set(15, 43, '#ff5fa2');
        b.set(48, 42, '#ffd25e');
        b.set(48, 43, '#ff5fa2');
      }
      if (a === 'bandaid') {
        b.rect(40, EY + 11, 5, 2, '#f8c8a0');
        b.set(42, EY + 11, '#e0a080');
      }
      if (a === 'hairpin') {
        b.rect(16, 22, 5, 2, '#ffd25e');
        b.rect(17, 25, 5, 2, '#4ef0ff');
      }
    }
    if (P.custom) P.custom(b, ex, C);
    return b;
  }

  function tri(b, p, col) {
    const [x1, y1, x2, y2, x3, y3] = p;
    const minX = Math.floor(Math.min(x1, x2, x3)),
      maxX = Math.ceil(Math.max(x1, x2, x3));
    const minY = Math.floor(Math.min(y1, y2, y3)),
      maxY = Math.ceil(Math.max(y1, y2, y3));
    const s = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const d1 = s(x, y, x1, y1, x2, y2),
          d2 = s(x, y, x2, y2, x3, y3),
          d3 = s(x, y, x3, y3, x1, y1);
        const neg = d1 < 0 || d2 < 0 || d3 < 0,
          pos = d1 > 0 || d2 > 0 || d3 > 0;
        if (!(neg && pos)) b.set(x, y, col, 'hair');
      }
  }

  // ---------- 特殊ポートレート ----------
  const SPECIAL = {
    // キューブ（立方体ヘルパーロボ）
    cube(b, ex) {
      const body = '#e8ecf4',
        side = '#a8b0c8',
        top = '#ffffff';
      b.fill((x, y) => x >= 14 && x <= 46 && y >= 20 && y <= 54, body);
      b.fill((x, y) => x > 46 && x <= 54 && y >= 14 + (54 - x) * 0 && y >= 20 - (x - 46) * 0.75 && y <= 54 - (x - 46) * 0.75, side);
      b.fill((x, y) => y >= 14 && y < 20 && x >= 14 + (20 - y) * 1.33 && x <= 54 - (y - 14) * 0, top);
      // 画面の顔
      b.fill((x, y) => x >= 18 && x <= 42 && y >= 25 && y <= 48, '#1a2440');
      const eyeC = ex === 'angry' ? '#ff5470' : ex === 'sad' ? '#7fb8ff' : '#4ef0ff';
      if (ex === 'smile' || ex === 'grin') {
        for (const cx of [25, 35]) for (let k = -2; k <= 2; k++) b.set(cx + k, 33 - (2 - Math.abs(k)), eyeC);
      } else if (ex === 'surprise') {
        for (const cx of [25, 35]) b.ell(cx, 33, 3, 3, eyeC), b.ell(cx, 33, 1.5, 1.5, '#1a2440');
      } else {
        for (const cx of [25, 35]) b.rect(cx - 2, 30, 4, 5, eyeC);
      }
      for (let x = 27; x <= 33; x++) b.set(x, 41 + (ex === 'sad' ? (x === 27 || x === 33 ? 0 : -0) : 0), G.shade(eyeC, -0.2));
      b.line(30, 14, 30, 6, '#a8b0c8');
      b.ell(30, 5, 2.5, 2.5, '#ff5fa2');
      b.rect(14, 54, 33, 2, side);
    },
    // ロボット猫ネジ
    neji(b, ex) {
      const body = '#b8c0d0',
        dark = '#6a7088';
      b.ell(32, 38, 18, 16, body);
      G.tri(b, [16, 30, 18, 10, 30, 24], body);
      G.tri(b, [48, 30, 46, 10, 34, 24], body);
      G.tri(b, [19, 26, 20, 15, 27, 23], '#ff8fb8');
      G.tri(b, [45, 26, 44, 15, 37, 23], '#ff8fb8');
      for (const cx of [25, 39]) {
        if (ex === 'smile') for (let k = -3; k <= 3; k++) b.set(cx + k, 37 - (3 - Math.abs(k)) / 1.5, '#1a1028');
        else {
          b.ell(cx, 37, 4, 4, '#ffd25e');
          b.rect(cx - 0.5, 34, 1, 7, '#1a1028');
        }
      }
      b.set(31, 43, '#ff5fa2');
      b.set(32, 43, '#ff5fa2');
      b.line(29, 45, 31, 46, dark);
      b.line(33, 46, 35, 45, dark);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b.line(32 + s * 8, 43 + k * 2, 32 + s * 20, 41 + k * 3, dark);
      b.fill((x, y) => y > 52 && Math.abs(x - 32) < 16, dark);
      b.rect(28, 50, 8, 4, '#e8c050');
    },
    // 管理AIマザー
    mother(b, ex) {
      b.fill((x, y) => true, (x, y) => ((x + y) % 4 === 0 ? '#0a1028' : '#0e1838'));
      for (let r = 26; r > 0; r -= 1) {
        const t = r / 26;
        const col = ex === 'angry' ? G.mix('#ff2040', '#200008', t) : G.mix('#ffffff', '#102860', t);
        b.ell(32, 32, r, r, (x, y) => (Math.hypot(x - 32, y - 32) > r - 1.5 && r % 4 === 0 ? G.shade(col, 0.3) : col));
      }
      b.ell(32, 32, 7, 7, ex === 'angry' ? '#ff6070' : '#bff8ff');
      b.ell(32, 32, 3, 3, '#ffffff');
      for (let a = 0; a < 12; a++) {
        const an = (a / 12) * Math.PI * 2;
        b.set(32 + Math.cos(an) * 29, 32 + Math.sin(an) * 29, ex === 'angry' ? '#ff2040' : '#4ef0ff');
      }
    },
    // ラジオ（DJリリィの番組ロゴ）
    radio(b) {
      b.fill(() => true, '#1a1030');
      b.rect(10, 22, 44, 30, '#ff5fa2');
      b.rect(12, 24, 40, 26, '#2a1848');
      b.ell(22, 37, 8, 8, '#4ef0ff');
      b.ell(22, 37, 4, 4, '#1a1030');
      b.rect(34, 28, 14, 3, '#ffd25e');
      b.rect(34, 34, 14, 2, '#ff79c6');
      b.rect(34, 39, 10, 2, '#ff79c6');
      b.rect(34, 44, 14, 2, '#ff79c6');
      b.line(20, 22, 44, 8, '#c0c8d8');
      b.ell(44, 8, 2, 2, '#ff5470');
    },
  };

  const cache = new Map();
  G.portrait = function (P, ex) {
    ex = ex || 'normal';
    if (!P._pkey) P._pkey = JSON.stringify(P, (k, v) => (typeof v === 'function' ? v.toString().length : v));
    const key = P._pkey + '|' + ex;
    if (cache.has(key)) return cache.get(key);
    let b;
    if (P.special) {
      b = new PB(W, W);
      SPECIAL[P.special](b, ex);
    } else b = draw(P, ex);
    const cv = G.outline(b.toCanvas(), P.outline || '#1c1230', true);
    cache.set(key, cv);
    return cv;
  };
})();
