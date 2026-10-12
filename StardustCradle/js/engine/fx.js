// =============================================================
//  fx.js — パーティクル・エフェクト / 戦闘処理
// =============================================================
(function () {
  const FX = (G.fx = { list: [], ghosts: [] });
  FX.clear = function () {
    FX.list = [];
    FX.ghosts = [];
  };
  FX.add = function (p) {
    p.life = p.life || 30;
    p.max = p.life;
    if (FX.list.length < 600) FX.list.push(p);
    return p;
  };
  FX.update = function () {
    for (const p of FX.list) {
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      if (p.grav) p.vy += p.grav;
      if (p.drag) {
        p.vx *= p.drag;
        p.vy *= p.drag;
      }
      if (p.update) p.update(p);
      p.life--;
    }
    FX.list = FX.list.filter((p) => p.life > 0);
    for (const g of FX.ghosts) g.life--;
    FX.ghosts = FX.ghosts.filter((g) => g.life > 0);
  };
  FX.drawGhosts = function (c, ox, oy) {
    for (const g of FX.ghosts) {
      c.globalAlpha = (g.life / g.max) * 0.5;
      c.drawImage(G.flash(g.img, g.col), Math.round(g.x + ox), Math.round(g.y + oy));
    }
    c.globalAlpha = 1;
  };
  FX.draw = function (c, ox, oy) {
    for (const p of FX.list) {
      const t = p.life / p.max;
      const x = Math.round(p.x + ox),
        y = Math.round(p.y + oy);
      if (p.type === 'text') {
        const yy = y - (1 - t) * 14;
        const w = G.pixTextW(p.text, p.sc || 1);
        G.pixText(c, p.text, x - w / 2 + 1, yy + 1, '#1a1028', p.sc || 1);
        G.pixText(c, p.text, x - w / 2, yy, p.col, p.sc || 1);
        continue;
      }
      if (p.glow) c.globalCompositeOperation = 'lighter';
      c.globalAlpha = p.fade === false ? 1 : Math.min(1, t * 1.5);
      if (p.type === 'arc') {
        // 斬撃の弧（ピクセル）
        const prog = 1 - t;
        const a0 = p.ang - p.span / 2,
          a1 = p.ang - p.span / 2 + p.span * Math.min(1, prog * 2.2);
        c.fillStyle = p.col;
        for (let a = a0; a <= a1; a += 0.06) {
          const fade = (a - a0) / (a1 - a0 + 0.001);
          for (let k = 0; k < p.thick * fade + 1; k++) {
            const rr = p.r - k;
            c.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.8), 1, 1);
          }
        }
      } else if (p.type === 'ring') {
        const rr = p.r * (1 - t * t);
        c.strokeStyle = p.col;
        c.lineWidth = 2 * t + 0.5;
        c.beginPath();
        c.ellipse(x, y, rr, rr * 0.7, 0, 0, Math.PI * 2);
        c.stroke();
      } else if (p.type === 'glowball') {
        G.glow(c, x, y, p.size * (0.5 + t), G.rgba(p.col, 0.8 * t));
      } else if (p.type === 'smoke') {
        const s = Math.round(p.size * (1.5 - t));
        c.fillStyle = p.col;
        c.globalAlpha = t * (p.alpha || 0.5);
        c.fillRect(x - s, y - s, s * 2, s * 2);
        c.fillRect(x - s - 1, y - s + 1, s * 2 + 2, s * 2 - 2);
      } else if (p.type === 'petal') {
        c.fillStyle = p.col;
        const ph = Math.sin(p.life * 0.15 + p.seed);
        c.fillRect(x, y, ph > 0 ? 2 : 1, 1);
        c.fillRect(x + (ph > 0 ? 0 : 1), y + 1, 1, 1);
      } else if (p.type === 'line') {
        c.strokeStyle = p.col;
        c.lineWidth = p.size || 1;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(Math.round(p.x2 + ox), Math.round(p.y2 + oy));
        c.stroke();
      } else {
        const s = p.size || 1;
        c.fillStyle = p.col;
        c.fillRect(x - (s >> 1), y - (s >> 1), s, s);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
  };

  // ---- ヘルパ ----
  const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  FX.slash = function (x, y, dir, col, big, scale) {
    scale = scale || 1;
    FX.add({ type: 'arc', x, y, ang: ANG[dir], span: big ? 3.4 : 2.4, r: (big ? 17 : 14) * scale, thick: (big ? 5 : 3) * scale, col, life: 9, glow: true, fade: false });
  };
  FX.sparks = function (x, y, n, col) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        s = G.rand(0.8, 3);
      FX.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, grav: 0.08, drag: 0.92, col: Math.random() < 0.4 ? '#ffffff' : col || '#ffd25e', size: Math.random() < 0.3 ? 2 : 1, life: G.irand(10, 22), glow: true });
    }
  };
  FX.ring = function (x, y, r, col) {
    FX.add({ type: 'ring', x, y, r, col, life: 18, glow: true });
  };
  FX.dust = function (x, y) {
    for (let i = 0; i < 4; i++) FX.add({ type: 'smoke', x: x + G.rand(-8, 8), y: y - 1, vx: G.rand(-0.5, 0.5), vy: G.rand(-0.5, -0.1), size: 2, col: '#d8d0c8', alpha: 0.5, life: 20 });
  };
  FX.thrust = function (x, y) {
    FX.add({ type: 'glowball', x, y, vx: G.rand(-0.3, 0.3), vy: G.rand(-0.3, 0.3), size: 8, col: '#4ef0ff', life: 10, glow: true });
    FX.add({ x, y, vx: G.rand(-1, 1), vy: G.rand(-1, 1), col: '#bff8ff', size: 2, life: 8, glow: true });
  };
  FX.muzzle = function (x, y, col) {
    FX.add({ type: 'glowball', x, y, size: 12, col: col || '#ffffff', life: 6, glow: true });
  };
  FX.afterimage = function (e) {
    const img = e.sprite();
    if (!img) return;
    FX.ghosts.push({ img, x: e.x - img.width / 2, y: e.y - img.height + 1 - e.z, life: 12, max: 12, col: e.isMech ? '#4ef0ff' : '#ff9ac8' });
  };
  FX.text = function (x, y, text, col, sc) {
    FX.add({ type: 'text', x, y, text: String(text), col: col || '#ffffff', life: 40, sc, vy: -0.2 });
  };
  FX.explosion = function (x, y, big) {
    const n = big ? 40 : 18;
    FX.add({ type: 'glowball', x, y, size: big ? 50 : 24, col: '#ffd25e', life: 16, glow: true });
    FX.ring(x, y, big ? 60 : 28, '#ff8a30');
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        s = G.rand(0.5, big ? 4 : 2.5);
      FX.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 0.9, col: G.pick(['#ffd25e', '#ff8a30', '#ff5040', '#ffffff']), size: G.irand(1, 3), life: G.irand(14, 30), glow: true });
      FX.add({ type: 'smoke', x: x + G.rand(-6, 6), y: y + G.rand(-6, 6), vx: Math.cos(a) * s * 0.4, vy: Math.sin(a) * s * 0.4 - 0.3, size: big ? 5 : 3, col: '#4a4058', alpha: 0.6, life: G.irand(30, 50) });
    }
    for (let i = 0; i < (big ? 10 : 4); i++) FX.add({ x, y, vx: G.rand(-3, 3), vy: G.rand(-4, -1), grav: 0.15, col: '#5a6070', size: 2, life: 40 });
  };
  FX.steam = function (x, y) {
    FX.add({ type: 'smoke', x: x + G.rand(-2, 2), y, vx: G.rand(-0.1, 0.1), vy: -0.35, size: 2, col: '#ffffff', alpha: 0.35, life: 50 });
  };
  FX.petals = function (cam, col) {
    FX.add({ type: 'petal', x: cam.x + G.rand(0, G.W + 60) - 30, y: cam.y - 10, vx: G.rand(-0.6, -0.1), vy: G.rand(0.3, 0.7), col: col || '#ffc0d4', life: 400, seed: Math.random() * 9, update: (p) => (p.vx += Math.sin(p.life * 0.05) * 0.01) });
  };
  FX.dustMote = function (cam, col) {
    FX.add({ x: cam.x + G.rand(0, G.W), y: cam.y + G.rand(0, G.H), vx: G.rand(-0.15, 0.15), vy: G.rand(-0.2, -0.05), col: col || 'rgba(255,255,255,0.6)', size: 1, life: 160, glow: true });
  };
  FX.holo = function (x, y) {
    FX.add({ x: x + G.rand(-5, 5), y, vx: 0, vy: -0.4, col: '#7af8ff', size: 1, life: 30, glow: true });
  };

  // =============================================================
  //  戦闘処理
  // =============================================================
  const CB = (G.combat = {});
  CB.hitEnemy = function (e, dmg, sx, sy, o) {
    o = o || {};
    if (e.dead || e.invuln) return;
    const real = Math.max(1, Math.round(dmg - (e.def || 0) * (o.pierceDef ? 0.3 : 1)));
    e.hp -= real;
    e.flashT = 5;
    if (o.stun) e.stunT = o.stun;
    if (!e.heavy) {
      const a = Math.atan2(e.y - sy, e.x - sx);
      const kb = (o.kb || 2) * (e.kbMul || 1);
      e.kx = Math.cos(a) * kb;
      e.ky = Math.sin(a) * kb;
    }
    const b = e.body();
    FX.text(e.x + G.rand(-4, 4), b.y - 2, real, real >= 30 ? '#ffd25e' : '#ffffff', real >= 60 ? 2 : 1);
    FX.sparks(b.cx, b.cy, e.isMech ? 8 : 5, e.isMech ? '#ffd25e' : '#ffffff');
    G.audio.se('hit');
    G.field.hitstop = Math.max(G.field.hitstop, e.isMech ? 3 : 2);
    if (e.onHurt) e.onHurt(real);
    if (e.hp <= 0) e.die();
  };
  CB.hitPlayer = function (dmg, sx, sy, o) {
    const f = G.field;
    const p = f.player;
    if (p.invT > 0 || p.dashT > 0 || f.godMode || G.ev.cutscene) return false;
    const def = p.isMech ? G.mechStats().def : G.stats().def;
    const real = Math.max(1, Math.round(dmg * G.rand(0.9, 1.1) - def));
    p.hp = Math.max(0, p.hp - real);
    p.invT = p.isMech ? 36 : 50;
    p.flashT = 6;
    p.flashCol = '#ff5070';
    const a = Math.atan2(p.y - sy, p.x - sx);
    p.kx = Math.cos(a) * (p.isMech ? 3 : 4);
    p.ky = Math.sin(a) * (p.isMech ? 3 : 4);
    p.atkT = 0;
    FX.text(p.x, p.y - p.bodyH - 4, real, '#ff5070');
    f.shake = Math.max(f.shake, p.isMech ? 6 : 4);
    f.damageFlash = 8;
    G.audio.se('hurt');
    if (p.hp <= 0) f.playerDown();
    return true;
  };
})();
