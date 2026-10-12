// =============================================================
//  chars.js — キャラクタースプライト（16x24 ちびキャラ）生成
// =============================================================
// パラメータ例:
// { skin:'#f6d3b3', hair:'#2b2140', style:'short', mesh:'#ff6fae', eye:'#3a2050',
//   top:'#26305a', top2:'#ffffff', tie:'#ff4f8b', outfit:'uniform', bottom:'#1f2238',
//   bstyle:'pants', shoes:'#e8e8f0', build:'normal', acc:['glasses'], accCol:'#...' , blush:true }
(function () {
  const PB = G.PB;

  // 髪型：fringe=前髪の下端(頭頂からの行, x=2..13)、side=横髪の長さ、back=後ろ髪(体の後ろ)の下端y
  const HAIR = {
    short: { fringe: [4, 4, 5, 4, 4, 5, 5, 4, 4, 5, 4, 4], side: 6 },
    spiky: { fringe: [5, 4, 5, 3, 5, 4, 5, 3, 5, 4, 5, 4], side: 5, spikes: true },
    messy: { fringe: [4, 5, 4, 6, 4, 5, 3, 5, 6, 4, 5, 4], side: 7, tufts: true },
    bob: { fringe: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], side: 9, wide: true },
    long: { fringe: [4, 5, 5, 4, 5, 6, 5, 4, 5, 5, 4, 4], side: 10, back: 18, wide: true },
    ponytail: { fringe: [4, 5, 4, 5, 5, 4, 5, 5, 4, 5, 4, 4], side: 6, tail: 'pony' },
    twin: { fringe: [4, 5, 5, 4, 5, 6, 5, 4, 5, 5, 4, 4], side: 7, tail: 'twin' },
    buzz: { fringe: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], side: 4 },
    bald: { fringe: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], side: 6, bald: true },
    bun: { fringe: [3, 4, 4, 3, 3, 3, 3, 3, 3, 4, 4, 3], side: 6, bun: true },
    slick: { fringe: [3, 3, 3, 2, 2, 2, 2, 2, 2, 3, 3, 3], side: 6 },
    pixie: { fringe: [5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 4], side: 8, tufts: true },
    hime: { fringe: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], side: 10, back: 19, wide: true },
    wild: { fringe: [5, 6, 4, 6, 5, 4, 6, 5, 4, 6, 5, 6], side: 9, back: 15, spikes: true, wide: true },
    puff: { fringe: [3, 3, 4, 3, 3, 3, 3, 3, 3, 4, 3, 3], side: 7, puff: true, wide: true },
    side: { fringe: [6, 6, 6, 5, 5, 4, 4, 3, 3, 3, 3, 3], side: 8 }, // 片目隠れ
  };
  G.HAIR_STYLES = Object.keys(HAIR);

  function cols(P) {
    const c = {};
    c.skin = P.skin || '#f6d3b3';
    c.skinS = G.shade(c.skin, -0.18);
    c.hair = P.hair || '#2b2140';
    c.hairS = G.shade(c.hair, -0.3);
    c.hairH = G.shade(c.hair, 0.35);
    c.mesh = P.mesh;
    c.eye = P.eye || '#2a1838';
    c.top = P.top || '#3a4a8a';
    c.topS = G.shade(c.top, -0.28);
    c.topH = G.shade(c.top, 0.18);
    c.top2 = P.top2 || '#f0eef8';
    c.tie = P.tie || '#e04070';
    c.bot = P.bottom || '#2a2a40';
    c.botS = G.shade(c.bot, -0.28);
    c.shoe = P.shoes || '#3a3040';
    c.shoeS = G.shade(c.shoe, -0.3);
    c.acc = P.accCol || '#202028';
    return c;
  }

  // 1フレーム描画。dir: down/up/left、frame: 0立ち 1歩きA 2歩きB 3アクション
  function drawFrame(P, dir, frame) {
    const b = new PB(16, 24);
    const C = cols(P);
    const H = HAIR[P.style] || HAIR.short;
    const build = P.build || 'normal';
    const hy = build === 'small' ? 3 : build === 'tall' || build === 'big' ? 0 : 1;
    const tTop = hy + 11,
      tBot = 18;
    let tx0 = 4,
      tx1 = 11;
    if (build === 'big') {
      tx0 = 3;
      tx1 = 12;
    }
    if (build === 'slim' || build === 'small') {
      tx0 = 5;
      tx1 = 10;
    }
    if (dir === 'left') {
      tx0 = build === 'big' ? 4 : 5;
      tx1 = build === 'big' ? 11 : 10;
    }
    const cy = hy + 5.5;
    const inHead = (x, y) => ((x - 7.5) / 6) ** 2 + ((y - cy) / 5.4) ** 2 <= 1;
    const inCap = (x, y) => ((x - 7.5) / 6.6) ** 2 + ((y - cy + 0.4) / 5.9) ** 2 <= 1;
    const walkL = frame === 1,
      walkR = frame === 2,
      act = frame === 3;

    // ---- 後ろ髪（体より奥） ----
    const backHair = () => {
      if (H.back && dir !== 'up') {
        const x0 = dir === 'left' ? 7 : 2,
          x1 = dir === 'left' ? 12 : 13;
        b.fill((x, y) => y >= hy + 4 && y <= H.back && x >= x0 && x <= x1 && (dir === 'left' || x <= 3 || x >= 12), (x, y) => (x === x0 || x === x1 ? C.hairS : C.hair), 'hair');
      }
      if (H.tail === 'twin' && dir !== 'up') {
        const tl = (x0) => b.fill((x, y) => x >= x0 && x <= x0 + 2 && y >= hy + 3 && y <= hy + 14 - Math.abs(x - x0 - 1), (x, y) => (y > hy + 11 ? C.hairS : C.hair), 'hair');
        if (dir === 'down') {
          tl(-0);
          tl(13);
        } else tl(12);
      }
      if (H.tail === 'pony' && dir === 'left') {
        b.fill((x, y) => x >= 12 && x <= 15 && y >= hy + 3 && y <= hy + 10 - (x - 12), C.hair, 'hair');
      }
    };
    if (dir !== 'up') backHair();

    // ---- 脚 ----
    const legTop = 19;
    const drawLeg = (x0, w, lift, isFront) => {
      const yOff = lift ? -1 : 0;
      const legCol = P.bstyle === 'pants' || !P.bstyle ? C.bot : C.skin;
      const legColS = P.bstyle === 'pants' || !P.bstyle ? C.botS : C.skinS;
      for (let y = legTop + yOff; y <= 21 + yOff; y++)
        for (let x = x0; x < x0 + w; x++) {
          let col = x === x0 + w - 1 ? legColS : legCol;
          if (P.bstyle === 'shorts' && y === legTop + yOff) col = C.bot;
          if (P.socks && y >= 21 + yOff) col = P.socks;
          b.set(x, y, col, 'leg');
        }
      for (let y = 22 + yOff; y <= 23 + yOff; y++)
        for (let x = x0; x < x0 + w + (dir === 'left' && isFront ? 0 : 0); x++) b.set(x, y, y === 23 + yOff ? C.shoeS : C.shoe, 'shoe');
      if (dir === 'left') b.set(x0 - 1, 23 + yOff, C.shoeS, 'shoe');
    };
    if (dir === 'down' || dir === 'up') {
      drawLeg(5, 3, walkL, false);
      drawLeg(8, 3, walkR, false);
      if (dir === 'up') {
        // 後ろ向きは靴の裏が見えるよう少し暗く
      }
    } else {
      if (walkL) {
        drawLeg(9, 2, false, false);
        drawLeg(5, 2, true, true);
      } else if (walkR) {
        drawLeg(5, 2, false, false);
        drawLeg(9, 2, true, true);
      } else {
        drawLeg(6, 3, false, true);
      }
    }

    // ---- 胴体 ----
    const outfit = P.outfit || 'tshirt';
    let tBot2 = tBot;
    if (outfit === 'coat' || outfit === 'labcoat') tBot2 = 20;
    for (let y = tTop; y <= tBot2; y++)
      for (let x = tx0; x <= tx1; x++) {
        let col = C.top;
        if (x === tx1) col = C.topS;
        if (y === tBot2) col = C.topS;
        if (x === tx0 && dir !== 'left') col = C.topH;
        b.set(x, y, col, 'body');
      }
    // 肩を丸く
    b.set(tx0, tTop, null);
    b.set(tx1, tTop, null);
    // スカート・ワンピース
    if (P.bstyle === 'skirt' || outfit === 'dress') {
      const sc = outfit === 'dress' ? C.top : C.bot;
      for (let y = 18; y <= 20; y++) {
        const ex = y - 18;
        for (let x = tx0 - (dir === 'left' ? 0 : ex > 0 ? 1 : 0); x <= tx1 + (ex > 0 ? 1 : 0); x++) {
          let col = (x + y) % 3 === 0 && y > 18 ? G.shade(sc, -0.25) : sc;
          if (y === 20) col = G.shade(sc, -0.3);
          b.set(x, y, col, 'body');
        }
      }
    }
    // 衣装のディテール
    const mid = dir === 'left' ? 7 : 7;
    if (dir === 'down') {
      if (outfit === 'uniform') {
        // ブレザー＋白シャツ＋ネクタイ/リボン
        b.set(7, tTop, C.top2);
        b.set(8, tTop, C.top2);
        b.set(7, tTop + 1, C.tie);
        b.set(8, tTop + 1, C.tie);
        b.set(7, tTop + 2, C.tie);
        b.set(6, tTop, C.top2);
        b.set(9, tTop, C.top2);
        b.set(tx0 + 1, tTop + 4, C.topS);
        b.set(tx1 - 1, tTop + 4, C.topS);
      } else if (outfit === 'sailor') {
        for (let x = tx0; x <= tx1; x++) b.set(x, tTop, C.top2);
        b.set(7, tTop + 1, C.top2);
        b.set(8, tTop + 1, C.top2);
        b.set(7, tTop + 2, C.tie);
        b.set(8, tTop + 2, C.tie);
        b.set(6, tTop + 2, C.tie);
        b.set(9, tTop + 2, C.tie);
      } else if (outfit === 'jacket' || outfit === 'coat' || outfit === 'labcoat') {
        for (let y = tTop; y <= tBot2 - 1; y++) {
          b.set(7, y, C.top2);
          b.set(8, y, outfit === 'labcoat' ? C.top2 : G.shade(C.top2, -0.15));
        }
        b.set(6, tTop + 1, C.topS);
        b.set(9, tTop + 1, C.topS);
        if (P.tie) {
          b.set(7, tTop + 1, C.tie);
          b.set(7, tTop + 2, C.tie);
          b.set(8, tTop + 1, C.tie);
        }
      } else if (outfit === 'hoodie') {
        b.set(6, tTop + 1, C.top2);
        b.set(9, tTop + 1, C.top2);
        b.set(6, tTop + 2, C.top2);
        b.set(9, tTop + 2, C.top2);
        for (let x = tx0 + 1; x <= tx1 - 1; x++) b.set(x, tBot - 2, C.topS);
        b.set(7, tTop, C.topS);
        b.set(8, tTop, C.topS);
      } else if (outfit === 'jumpsuit') {
        for (let y = tTop; y <= tBot; y++) b.set(7, y, C.topS);
        for (let x = tx0; x <= tx1; x++) b.set(x, tBot - 2, C.top2);
        b.set(5, tTop + 2, C.top2);
      } else if (outfit === 'apron') {
        b.rect(5, tTop + 1, 6, tBot - tTop + 2, C.top2, 'body');
        b.set(5, tTop + 1, null);
        b.set(10, tTop + 1, null);
        b.set(5, tTop + 1, C.top);
        b.set(10, tTop + 1, C.top);
        for (let y = tTop + 1; y <= tBot + 1; y++) b.set(10, y, G.shade(C.top2, -0.15));
      } else if (outfit === 'suit') {
        b.set(7, tTop, C.top2);
        b.set(8, tTop, C.top2);
        b.set(7, tTop + 1, C.tie);
        b.set(7, tTop + 2, C.tie);
        b.set(7, tTop + 3, C.tie);
        b.set(8, tTop + 1, C.top2);
        b.set(6, tTop + 1, C.topS);
        b.set(9, tTop + 2, C.topS);
      } else if (outfit === 'military') {
        b.set(tx0, tTop + 1, C.top2);
        b.set(tx0 + 1, tTop, C.top2);
        b.set(tx1, tTop + 1, C.top2);
        b.set(tx1 - 1, tTop, C.top2);
        b.set(6, tTop + 2, '#e8c050');
        b.set(9, tTop + 2, '#e8c050');
        b.set(6, tTop + 4, '#e8c050');
        b.set(9, tTop + 4, '#e8c050');
        for (let x = tx0; x <= tx1; x++) b.set(x, tBot - 1, C.topS);
      } else if (outfit === 'tank') {
        b.set(tx0, tTop + 1, C.skin);
        b.set(tx1, tTop + 1, C.skin);
        b.set(7, tTop, C.skin);
        b.set(8, tTop, C.skin);
      } else if (outfit === 'tshirt') {
        b.set(7, tTop, C.skinS);
        b.set(8, tTop, C.skinS);
        if (P.top2 && P.logo !== false) {
          b.set(7, tTop + 2, C.top2);
          b.set(8, tTop + 2, C.top2);
          b.set(7, tTop + 3, C.top2);
        }
      } else if (outfit === 'dress') {
        b.set(7, tTop, C.top2);
        b.set(8, tTop, C.top2);
      }
      if (P.belt) for (let x = tx0; x <= tx1; x++) b.set(x, tBot, P.belt);
    } else if (dir === 'up') {
      if (outfit === 'sailor') for (let y = tTop; y <= tTop + 2; y++) for (let x = tx0 + 1; x <= tx1 - 1; x++) b.set(x, y, y === tTop + 2 ? G.shade(C.top2, -0.2) : C.top2);
      if (outfit === 'hoodie') for (let x = 5; x <= 10; x++) b.set(x, tTop, C.topS), b.set(x, tTop + 1, C.topS);
      if (outfit === 'apron') for (let x = 6; x <= 9; x++) b.set(x, tTop + 4, C.top2);
      if (P.belt) for (let x = tx0; x <= tx1; x++) b.set(x, tBot, P.belt);
    } else {
      if (outfit === 'jacket' || outfit === 'coat' || outfit === 'labcoat' || outfit === 'uniform' || outfit === 'suit') {
        b.set(tx0, tTop + 1, C.top2);
        b.set(tx0, tTop + 2, outfit === 'suit' || outfit === 'uniform' ? C.tie : C.top2);
      }
      if (outfit === 'apron') for (let y = tTop + 1; y <= tBot + 1; y++) b.set(tx0, y, C.top2), b.set(tx0 + 1, y, C.top2);
      if (outfit === 'sailor') {
        for (let x = tx0 + 2; x <= tx1; x++) b.set(x, tTop, C.top2);
        b.set(tx0, tTop + 1, C.tie);
      }
      if (P.belt) for (let x = tx0; x <= tx1; x++) b.set(x, tBot, P.belt);
    }

    // ---- 腕 ----
    const sleeveCol = outfit === 'tank' ? C.skin : C.top;
    const shortSleeve = outfit === 'tshirt' || outfit === 'tank' || P.shortSleeve;
    const arm = (x, y0, len, handDY, front) => {
      for (let y = y0; y < y0 + len; y++) {
        const col = shortSleeve && y > y0 + 1 ? C.skin : y === y0 + len - 1 ? C.topS : sleeveCol;
        b.set(x, y, col, 'arm');
      }
      b.set(x, y0 + len + (handDY || 0), C.skin, 'hand');
      if (handDY > 0) b.set(x, y0 + len, shortSleeve ? C.skin : C.topS, 'arm');
    };
    if (dir === 'down' || dir === 'up') {
      const L = tBot - tTop - 1;
      const lOff = walkL ? -1 : walkR ? 1 : 0;
      if (act && dir === 'down') {
        arm(tx0 - 1, tTop + 1, L - 1, 0);
        for (let y = tTop + 1; y <= tTop + L + 2; y++) b.set(tx1 + 1, y, sleeveCol, 'arm');
        b.set(tx1 + 1, tTop + L + 3, C.skin, 'hand');
      } else if (act && dir === 'up') {
        arm(tx0 - 1, tTop + 1, L - 1, 0);
        for (let y = tTop - 3; y <= tTop + 1; y++) b.set(tx1 + 1, y, sleeveCol, 'arm');
        b.set(tx1 + 1, tTop - 4, C.skin, 'hand');
      } else {
        arm(tx0 - 1, tTop + 1, L + lOff, 0);
        arm(tx1 + 1, tTop + 1, L - lOff, 0);
      }
    } else {
      const L = tBot - tTop - 2;
      if (act) {
        for (let x = tx0 - 4; x <= tx0 + 1; x++) b.set(x, tTop + 2, sleeveCol, 'arm');
        b.set(tx0 - 5, tTop + 2, C.skin, 'hand');
        b.set(tx0 - 5, tTop + 3, C.skin, 'hand');
      } else {
        const ax = walkL ? 6 : walkR ? 9 : 8;
        for (let y = tTop + 1; y <= tTop + L; y++) {
          const xx = ax + (walkL ? -Math.floor((y - tTop) / 3) : walkR ? Math.floor((y - tTop) / 3) : 0);
          b.set(xx, y, shortSleeve && y > tTop + 2 ? C.skin : sleeveCol, 'arm');
          b.set(xx + 1, y, shortSleeve && y > tTop + 2 ? C.skinS : C.topS, 'arm');
        }
        const hx = ax + (walkL ? -2 : walkR ? 2 : 0);
        b.set(hx, tTop + L + 1, C.skin, 'hand');
        b.set(hx + 1, tTop + L + 1, C.skinS, 'hand');
      }
    }

    // ---- 頭 ----
    b.fill(inHead, (x, y) => (dir === 'left' && x >= 11 ? C.skinS : C.skin), 'skin');
    // 首
    b.set(7, tTop, b.get(7, tTop) || C.skinS);
    // 顔
    if (dir === 'down') {
      const ey = hy + 6;
      const eyeL = 5,
        eyeR = 10;
      if (P.eyesClosed) {
        b.set(eyeL, ey + 1, C.eye);
        b.set(eyeR, ey + 1, C.eye);
        b.set(eyeL - 1, ey + 1, C.eye);
        b.set(eyeR + 1, ey + 1, C.eye);
      } else {
        b.set(eyeL, ey, C.eye, 'eye');
        b.set(eyeR, ey, C.eye, 'eye');
        b.set(eyeL, ey + 1, P.iris || G.shade(C.eye, 0.25), 'eye');
        b.set(eyeR, ey + 1, P.iris || G.shade(C.eye, 0.25), 'eye');
        if (P.lashes) {
          b.set(eyeL - 1, ey, C.eye);
          b.set(eyeR + 1, ey, C.eye);
        }
      }
      if (P.blush) {
        b.set(eyeL - 1, ey + 2, '#f49aa8');
        b.set(eyeR + 1, ey + 2, '#f49aa8');
      }
      if (P.beard) {
        b.fill((x, y) => inHead(x, y) && y >= hy + 8 && x >= 4 && x <= 11, P.beard);
      }
      if (P.mouth) b.set(7, hy + 9, C.skinS), b.set(8, hy + 9, C.skinS);
    } else if (dir === 'left') {
      const ey = hy + 6;
      if (P.eyesClosed) {
        b.set(3, ey + 1, C.eye);
        b.set(4, ey + 1, C.eye);
      } else {
        b.set(3, ey, C.eye, 'eye');
        b.set(3, ey + 1, P.iris || G.shade(C.eye, 0.25), 'eye');
        if (P.lashes) b.set(4, ey, C.eye);
      }
      if (P.blush) b.set(4, ey + 2, '#f49aa8');
      b.set(1, hy + 7, C.skin);
      if (P.beard) b.fill((x, y) => inHead(x, y) && y >= hy + 8 && x <= 8, P.beard);
    }

    // ---- 髪 ----
    if (!H.bald || true) {
      const hairCol = (x, y) => {
        // ハイライト（天使の輪）
        if (dir !== 'up' && y === hy + 2 && x >= 4 && x <= 7) return C.hairH;
        if (dir === 'up' && y === hy + 3 && x >= 5 && x <= 10) return C.hairH;
        if (C.mesh && dir === 'down' && (x === 4 || x === 5) && y >= hy) return C.mesh;
        if (C.mesh && dir === 'left' && (x === 3 || x === 4) && y >= hy) return C.mesh;
        if (C.mesh && dir === 'up' && (x === 10 || x === 11)) return C.mesh;
        return C.hair;
      };
      if (H.bald) {
        // サイドだけ
        const sideRows = (x0) => b.fill((x, y) => x >= x0 && x <= x0 + 1 && y >= hy + 4 && y <= hy + 7, C.hair, 'hair');
        if (dir === 'down') {
          sideRows(2);
          sideRows(12);
        } else if (dir === 'up') b.fill((x, y) => inCap(x, y) && y >= hy + 5 && y <= hy + 8, C.hair, 'hair');
        else b.fill((x, y) => x >= 8 && x <= 12 && y >= hy + 4 && y <= hy + 8 && inCap(x, y), C.hair, 'hair');
        // 頭頂の光沢
        b.set(6, hy + 1, G.shade(C.skin, 0.3));
        b.set(7, hy + 1, G.shade(C.skin, 0.3));
      } else if (dir === 'down') {
        b.fill((x, y) => {
          if (!inCap(x, y) && !(H.wide && (x === 1 || x === 14) && y >= hy + 3)) return false;
          const fx = G.clamp(x - 2, 0, 11);
          const fr = H.fringe[fx];
          if (y <= hy + fr) return true;
          if ((x <= 2 || x >= 13) && y <= hy + H.side) return true;
          if (H.wide && (x <= 1 || x >= 14) && y <= hy + H.side) return true;
          return false;
        }, hairCol, 'hair');
        // 前髪の影
        for (let x = 3; x <= 12; x++) {
          const fr = H.fringe[x - 2];
          const y = hy + fr + 1;
          if (b.getTag(x, y) === 'skin' && fr > 0) b.set(x, y, C.skinS);
        }
        // 毛先を暗く
        b.recolor('hair', (x, y, c) => {
          if (c === C.mesh || c === C.hairH) return;
          if (b.getTag(x, y + 1) !== 'hair' && y > hy + 3) return C.hairS;
        });
      } else if (dir === 'up') {
        b.fill((x, y) => inCap(x, y) && y <= hy + 9, hairCol, 'hair');
        b.fill((x, y) => (x <= 2 || x >= 13) && y >= hy + 3 && y <= hy + H.side, C.hair, 'hair');
        if (H.wide) b.fill((x, y) => (x === 1 || x === 14) && y >= hy + 3 && y <= hy + H.side, C.hairS, 'hair');
        b.recolor('hair', (x, y, c) => (b.getTag(x, y + 1) !== 'hair' && c !== C.mesh ? C.hairS : undefined));
      } else {
        b.fill((x, y) => {
          if (!inCap(x, y) && !(H.wide && x === 14 && y >= hy + 3)) return false;
          if (x >= 8) return y <= hy + Math.max(8, H.side);
          const fx = G.clamp(x - 2 + 5, 0, 11);
          return y <= hy + Math.min(H.fringe[fx], 5) || (x >= 7 && y <= hy + 6);
        }, hairCol, 'hair');
        b.recolor('hair', (x, y, c) => (b.getTag(x, y + 1) !== 'hair' && c !== C.mesh && c !== C.hairH ? C.hairS : undefined));
        // 耳
        if (H.side <= 7) b.set(8, hy + 6, C.skinS);
      }
      // 追加パーツ
      if (H.spikes) {
        const sp = dir === 'left' ? [8, 10, 12, 13] : [3, 6, 9, 12];
        sp.forEach((x, k) => {
          b.set(x, hy - 1 + (k % 2), C.hair, 'hair');
          b.set(x + 1, hy, C.hair, 'hair');
        });
        if (dir === 'left') {
          b.set(14, hy + 3, C.hair, 'hair');
          b.set(15, hy + 4, C.hairS, 'hair');
          b.set(14, hy + 6, C.hairS, 'hair');
        }
      }
      if (H.tufts && dir !== 'up') {
        b.set(dir === 'left' ? 13 : 1, hy + 4, C.hair, 'hair');
        if (dir === 'down') b.set(14, hy + 5, C.hair, 'hair');
        b.set(dir === 'left' ? 9 : 10, hy - 1, C.hair, 'hair');
      }
      if (H.bun) {
        b.ell(dir === 'left' ? 9.5 : 7.5, hy - 0.5, 2.6, 2, C.hair, 'hair');
        b.set(dir === 'left' ? 9 : 7, hy - 2, C.hairH);
      }
      if (H.puff) {
        b.ell(7.5, hy + 3, 7.6, 5.4, (x, y) => (y < hy + 1 && x < 8 ? C.hairH : C.hair), 'hair', (x, y) => !(dir === 'down' && y > hy + 3 && x > 2 && x < 13) && !(dir === 'left' && y > hy + 3 && x < 7));
      }
      if (H.tail === 'pony' && dir === 'up') b.fill((x, y) => x >= 6 && x <= 9 && y >= hy + 8 && y <= hy + 14 - Math.abs(x - 7.5), C.hair, 'hair');
      if (H.tail === 'twin' && dir === 'up') {
        b.fill((x, y) => (x <= 2 || x >= 13) && y >= hy + 3 && y <= hy + 14, (x, y) => (y > hy + 11 ? C.hairS : C.hair), 'hair');
      }
      if (H.back && dir === 'up') {
        b.fill((x, y) => x >= 3 && x <= 12 && y >= hy + 6 && y <= H.back, (x, y) => (x === 3 || x === 12 || y === H.back ? C.hairS : C.hair), 'hair');
      }
      if (P.ahoge && dir !== 'up') {
        b.set(8, hy - 1, C.hair, 'hair');
        b.set(9, hy - 2, C.hair, 'hair');
      }
    }

    // ---- アクセサリ ----
    const acc = P.acc || [];
    const A = C.acc;
    for (const a of acc) {
      if (a === 'glasses' && dir !== 'up') {
        const ey = hy + 6;
        if (dir === 'down') {
          b.rect(4, ey, 3, 2, null);
          b.rect(9, ey, 3, 2, null);
          for (const ex of [4, 9]) {
            b.set(ex, ey, A);
            b.set(ex + 1, ey, A);
            b.set(ex + 2, ey, A);
            b.set(ex, ey + 1, A);
            b.set(ex + 2, ey + 1, A);
            b.set(ex + 1, ey + 1, '#bfe8ff');
          }
          b.set(5, ey + 1, C.eye);
          b.set(10, ey + 1, C.eye);
          b.set(7, ey, A);
          b.set(8, ey, A);
        } else {
          b.set(2, ey, A);
          b.set(3, ey, A);
          b.set(4, ey, A);
          b.set(2, ey + 1, A);
          b.set(4, ey + 1, A);
          b.set(3, ey + 1, C.eye);
          for (let x = 5; x <= 8; x++) b.set(x, ey, A);
        }
      }
      if (a === 'sunglasses' && dir !== 'up') {
        const ey = hy + 6;
        if (dir === 'down') {
          b.rect(3, ey, 4, 2, A);
          b.rect(9, ey, 4, 2, A);
          b.rect(7, ey, 2, 1, A);
          b.set(4, ey, '#ff79c6');
          b.set(10, ey, '#79e6ff');
        } else {
          b.rect(2, ey, 3, 2, A);
          b.rect(5, ey, 4, 1, A);
        }
      }
      if (a === 'cap') {
        const capC = A;
        if (dir === 'down') {
          b.fill((x, y) => inCap(x, y) && y <= hy + 3, capC, 'acc');
          b.rect(3, hy + 4, 10, 1, G.shade(capC, -0.3), 'acc');
          b.set(7, hy + 1, '#ffffff');
        } else if (dir === 'up') {
          b.fill((x, y) => inCap(x, y) && y <= hy + 4, capC, 'acc');
          b.rect(6, hy + 5, 4, 1, G.shade(capC, -0.3));
        } else {
          b.fill((x, y) => inCap(x, y) && y <= hy + 3, capC, 'acc');
          b.rect(0, hy + 4, 6, 1, G.shade(capC, -0.3), 'acc');
        }
      }
      if (a === 'headphones') {
        const hc = A;
        if (dir === 'down') {
          for (let x = 3; x <= 12; x++) b.set(x, hy + (x < 5 || x > 10 ? 1 : 0), hc);
          b.rect(1, hy + 5, 2, 3, hc);
          b.rect(13, hy + 5, 2, 3, hc);
          b.set(1, hy + 5, '#ff5fa2');
          b.set(14, hy + 5, '#ff5fa2');
        } else if (dir === 'up') {
          for (let x = 3; x <= 12; x++) b.set(x, hy + 1, hc);
          b.rect(1, hy + 5, 2, 3, hc);
          b.rect(13, hy + 5, 2, 3, hc);
        } else {
          for (let y = hy; y <= hy + 5; y++) b.set(8, y, hc);
          b.rect(7, hy + 5, 3, 3, hc);
          b.set(8, hy + 6, '#ff5fa2');
        }
      }
      if (a === 'goggles') {
        const gc = A;
        if (dir === 'down') {
          for (let x = 2; x <= 13; x++) b.set(x, hy + 3, G.shade(gc, -0.3));
          b.rect(4, hy + 2, 3, 2, '#7fe6ff');
          b.rect(9, hy + 2, 3, 2, '#7fe6ff');
          b.set(4, hy + 2, '#ffffff');
          b.set(9, hy + 2, '#ffffff');
        } else if (dir === 'up') {
          for (let x = 2; x <= 13; x++) b.set(x, hy + 4, G.shade(gc, -0.3));
        } else {
          for (let x = 2; x <= 12; x++) b.set(x, hy + 3, G.shade(gc, -0.3));
          b.rect(2, hy + 2, 3, 2, '#7fe6ff');
        }
      }
      if (a === 'mask' && dir !== 'up') {
        // 仮面（ミラージュ）
        const mc = A;
        if (dir === 'down') {
          b.fill((x, y) => inHead(x, y) && y >= hy + 4 && y <= hy + 8, mc, 'acc');
          b.rect(4, hy + 6, 3, 1, '#ff3050');
          b.rect(9, hy + 6, 3, 1, '#ff3050');
        } else {
          b.fill((x, y) => inHead(x, y) && y >= hy + 4 && y <= hy + 8 && x <= 8, mc, 'acc');
          b.rect(2, hy + 6, 3, 1, '#ff3050');
        }
      }
      if (a === 'monocle' && dir === 'down') {
        b.set(10, hy + 5, '#e8c050');
        b.set(11, hy + 6, '#e8c050');
        b.set(11, hy + 7, '#e8c050');
        b.set(9, hy + 7, '#e8c050');
        b.set(10, hy + 8, '#e8c050');
        b.set(11, hy + 9, '#e8c050');
      }
      if (a === 'eyepatch' && dir !== 'up') {
        if (dir === 'down') {
          b.rect(9, hy + 5, 3, 3, A);
          for (let x = 2; x <= 13; x++) if (x < 9 || x > 11) b.set(x, hy + 4, A);
        }
      }
      if (a === 'ribbon') {
        const rc = A;
        const rx = dir === 'left' ? 10 : 11;
        b.set(rx, hy, rc);
        b.set(rx + 1, hy - 1, rc);
        b.set(rx + 2, hy, rc);
        b.set(rx + 1, hy + 1, rc);
        b.set(rx - 1, hy - 1, rc);
        b.set(rx + 1, hy, G.shade(rc, -0.3));
      }
      if (a === 'scarf') {
        const sc = A;
        for (let x = tx0; x <= tx1; x++) b.set(x, tTop, sc);
        for (let x = tx0; x <= tx1; x++) b.set(x, tTop + 1, x % 2 ? sc : G.shade(sc, -0.2));
        if (dir === 'left') {
          b.set(tx1 + 1, tTop + 1, sc);
          b.set(tx1 + 2, tTop + 2, sc);
          b.set(tx1 + 3, tTop + 2, G.shade(sc, -0.2));
        } else if (dir === 'down') {
          b.set(tx0 + 1, tTop + 2, sc);
          b.set(tx0 + 1, tTop + 3, sc);
        }
      }
      if (a === 'helmet') {
        const hc = A;
        b.fill((x, y) => inCap(x, y) && y <= hy + 5, (x, y) => (y === hy + 2 && x < 8 ? G.shade(hc, 0.3) : hc), 'acc');
        if (dir === 'down') b.rect(3, hy + 5, 10, 1, '#8ff0ff');
        if (dir === 'left') b.rect(1, hy + 5, 5, 1, '#8ff0ff');
      }
      if (a === 'bandana') {
        if (dir === 'down') for (let x = 2; x <= 13; x++) b.set(x, hy + 3, A), b.set(x, hy + 2, x % 3 ? A : G.shade(A, 0.3));
        if (dir === 'left') {
          for (let x = 2; x <= 13; x++) b.set(x, hy + 3, A);
          b.set(14, hy + 4, A);
          b.set(15, hy + 5, A);
        }
        if (dir === 'up') {
          for (let x = 2; x <= 13; x++) b.set(x, hy + 3, A);
          b.set(7, hy + 4, A);
          b.set(8, hy + 5, A);
        }
      }
      if (a === 'antenna') {
        b.set(dir === 'left' ? 9 : 7, hy - 1, '#c0c8d8');
        b.set(dir === 'left' ? 9 : 7, hy - 2, '#c0c8d8');
        b.set(dir === 'left' ? 9 : 7, hy - 3, '#ff5fa2');
      }
      if (a === 'wrench' && dir === 'left') {
        // 腰のスパナ
        b.set(10, 17, '#a8b0c0');
        b.set(11, 18, '#a8b0c0');
        b.set(11, 17, '#a8b0c0');
      }
    }
    if (P.custom) P.custom(b, dir, frame, { hy, tTop, tx0, tx1, C });
    return b;
  }

  // ---- スプライトシート生成（キャッシュ付き） ----
  const cache = new Map();
  G.charSheet = function (P) {
    const key = P._key || (P._key = JSON.stringify(P, (k, v) => (typeof v === 'function' ? v.toString().length : v)));
    if (cache.has(key)) return cache.get(key);
    const sheet = {};
    for (const dir of ['down', 'up', 'left']) {
      sheet[dir] = [0, 1, 2, 3].map((f) => {
        const pb = drawFrame(P, dir, f);
        return G.outline(pb.toCanvas(), P.outline || '#1c1230', true);
      });
    }
    sheet.right = sheet.left.map((c) => G.flipX(c));
    cache.set(key, sheet);
    return sheet;
  };

  // ---- 町の人ランダム生成 ----
  const SKINS = ['#f8dcc0', '#f1c9a5', '#e0ac85', '#c98e64', '#a86d48', '#7d4e33', '#ffe3cf'];
  const HAIRS = ['#2b2140', '#4a2f22', '#7a4a2a', '#c48a3a', '#e8d070', '#d8d8e0', '#8a8aa0', '#b03050', '#3a6ad0', '#1a1a20', '#e07040', '#6040a0', '#40a080'];
  const CLOTH = ['#3a6ad0', '#d04060', '#40a070', '#e0a030', '#8050c0', '#30a0b0', '#e06090', '#606880', '#a05030', '#f0f0f0', '#303040', '#70b040', '#ff8a50'];
  G.randomCitizen = function (seed, opt) {
    const r = G.srand(seed * 9973 + 17);
    const pk = (a) => a[Math.floor(r() * a.length)];
    opt = opt || {};
    const girl = opt.girl !== undefined ? opt.girl : r() < 0.5;
    const old = opt.old !== undefined ? opt.old : r() < 0.15;
    const kid = !old && (opt.kid !== undefined ? opt.kid : r() < 0.18);
    const P = {
      skin: pk(SKINS),
      hair: old ? pk(['#d8d8e0', '#a0a0b0', '#f0f0f0']) : pk(HAIRS),
      style: girl ? pk(['bob', 'long', 'ponytail', 'twin', 'bun', 'pixie', 'hime']) : old ? pk(['bald', 'slick', 'buzz']) : pk(['short', 'spiky', 'messy', 'buzz', 'slick']),
      top: pk(CLOTH),
      top2: pk(['#f0eef8', '#ffd25e', '#202030', '#ff79c6']),
      outfit: pk(['tshirt', 'tshirt', 'jacket', 'hoodie', 'coat', 'jumpsuit', 'tank', girl ? 'dress' : 'suit']),
      bottom: pk(['#2a2a40', '#3a4a70', '#5a4030', '#202020', '#707088', '#a03050']),
      bstyle: girl ? pk(['skirt', 'pants', 'shorts']) : pk(['pants', 'pants', 'shorts']),
      shoes: pk(['#3a3040', '#f0f0f0', '#a03030', '#202020', '#c08040']),
      build: kid ? 'small' : pk(['normal', 'normal', 'tall', 'big', 'slim']),
      lashes: girl,
      blush: girl && r() < 0.5,
    };
    if (r() < 0.15) P.acc = [pk(['glasses', 'cap', 'headphones', 'sunglasses', 'bandana', 'scarf'])];
    if (P.acc) P.accCol = pk(['#202028', '#d04060', '#3a6ad0', '#f0f0f0', '#e0a030']);
    if (!girl && !kid && r() < 0.15) P.beard = G.shade(P.hair, -0.1);
    return Object.assign(P, opt.over || {});
  };
})();
