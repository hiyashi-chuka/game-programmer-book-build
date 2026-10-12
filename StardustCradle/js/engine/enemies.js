// =============================================================
//  enemies.js — 敵キャラクターとAI
// =============================================================
(function () {
  const PB = G.PB;

  // ---------- 敵専用スプライト ----------
  const sc = {};
  function sheetOf(fn, n, w, h) {
    const frames = [];
    for (let f = 0; f < (n || 2); f++) {
      const b = new PB(w || 16, h || 16);
      fn(b, f);
      frames.push(G.outline(b.toCanvas(), '#140c22', true));
    }
    return { down: frames, up: frames, left: frames, right: frames.map((c) => G.flipX(c)) };
  }
  const SPR = {
    rat: () =>
      sheetOf((b, f) => {
        b.ell(8, 11, 6, 3.5, '#8a7a8a');
        b.ell(8, 10, 5, 2.5, '#a898a8');
        b.ell(3, 10, 2.5, 2.5, '#9a8a9a');
        b.set(2, 9, '#ff3050');
        b.set(4, 8, '#e8a0b0');
        b.line(13, 11, 16, 9 + f, '#e8a0b0');
        b.set(5 + f, 14, '#5a4a5a');
        b.set(10 - f, 14, '#5a4a5a');
        b.rect(7, 8, 3, 1, '#c0c8d0');
      }),
    drone: () =>
      sheetOf((b, f) => {
        b.ell(8, 8, 6, 4, '#c8ccd8');
        b.ell(8, 7, 5, 2.5, '#e8ecf4');
        b.rect(5, 8, 6, 2, '#2a2a3a');
        b.set(7, 8, '#ff3050');
        b.set(8, 8, '#ff8090');
        b.rect(1 + f, 3, 4, 1, '#8a8a9a');
        b.rect(11 - f, 3, 4, 1, '#8a8a9a');
        b.rect(3, 4, 1, 2, '#6a6a7a');
        b.rect(12, 4, 1, 2, '#6a6a7a');
        b.set(8, 12, '#4ef0ff');
      }),
    bot: () =>
      sheetOf((b, f) => {
        b.rect(3, 4, 10, 9, '#e8b030');
        b.rect(3, 4, 10, 2, '#f8d060');
        b.rect(4, 7, 8, 3, '#2a2a3a');
        b.set(6, 8, '#4ef0ff');
        b.set(9, 8, '#4ef0ff');
        b.rect(2, 13, 12, 2, '#3a3a48');
        b.set(3 + f * 2, 14, '#6a6a7a');
        b.set(8 + f * 2, 14, '#6a6a7a');
        for (let x = 3; x < 13; x += 2) b.set(x, 12, '#2a2a30');
      }),
    turret: () =>
      sheetOf((b, f) => {
        b.ell(8, 11, 6, 4, '#5a6070');
        b.ell(8, 9, 5, 4, '#8a92a6');
        b.rect(7, 2 + f, 2, 7, '#3a3a48');
        b.set(8, 9, '#ff3050');
      }),
    echo: () =>
      sheetOf((b, f) => {
        b.ell(8, 10 - f, 5, 7, '#bff8ff');
        b.ell(8, 10 - f, 3, 5, '#ffffff');
        b.set(6, 8 - f, '#2a4a8a');
        b.set(10, 8 - f, '#2a4a8a');
        b.set(4, 16, '#bff8ff');
        b.set(12, 15, '#bff8ff');
      }, 2, 16, 20),
    bit: () =>
      sheetOf((b, f) => {
        G.tri(b, [8, 1, 14, 13, 2, 13], '#f0e8d0', 'x');
        G.tri(b, [8, 4, 11, 11, 5, 11], '#d0a030', 'x');
        b.set(8, 8, f ? '#ffffff' : '#ff2848');
      }),
    warden: () =>
      sheetOf((b, f) => {
        b.rect(4, 6, 24, 20, '#6a7088');
        b.rect(4, 6, 24, 3, '#9aa0b8');
        b.rect(8, 10, 16, 6, '#1a1a24');
        b.rect(11 + f * 4, 12, 6, 2, '#ff3050');
        b.rect(0, 10, 4, 12, '#5a6078');
        b.rect(28, 10, 4, 12, '#5a6078');
        b.rect(6, 26, 8, 5, '#3a3a48');
        b.rect(18, 26, 8, 5, '#3a3a48');
        for (let x = 6; x < 26; x += 3) b.set(x, 22, '#e8c040');
      }, 2, 32, 32),
  };
  function spr(kind) {
    if (!sc[kind]) sc[kind] = SPR[kind]();
    return sc[kind];
  }

  // ---------- 敵データ ----------
  // ai: charger drone brawler soldier turret phantom mech + boss系
  const thugSpr = (seed, col) => G.charSheet(G.randomCitizen(seed, { girl: false, old: false, kid: false, over: { top: col || '#3a3a48', outfit: 'jacket', top2: '#c02040', acc: ['bandana'], accCol: col ? G.shade(col, 0.3) : '#c02040', build: 'normal' } }));
  G.ENEMIES = {
    rat: { name: 'スクラップラット', hp: 14, atk: 7, def: 0, exp: 4, money: 3, spd: 1.2, ai: 'charger', spr: () => spr('rat'), w: 10, bodyH: 10, drops: [['scrap', 0.15]] },
    drone: { name: '警備ドローン', hp: 18, atk: 8, def: 1, exp: 6, money: 5, spd: 0.8, ai: 'drone', spr: () => spr('drone'), w: 10, bodyH: 14, float: true, drops: [['scrap', 0.2], ['soda', 0.08]] },
    bot: { name: '暴走整備ボット', hp: 36, atk: 11, def: 3, exp: 12, money: 8, spd: 0.7, ai: 'charger', spr: () => spr('bot'), w: 12, bodyH: 14, drops: [['scrap', 0.35]] },
    turret: { name: '防衛タレット', hp: 40, atk: 10, def: 4, exp: 10, money: 6, spd: 0, ai: 'turret', spr: () => spr('turret'), w: 12, bodyH: 14, heavy: true, drops: [['chip', 0.08]] },
    thug: { name: 'チンピラ', hp: 30, atk: 9, def: 1, exp: 9, money: 14, spd: 0.9, ai: 'brawler', spr: () => thugSpr(11), drops: [['soda', 0.15]] },
    punk: { name: 'ジャッカルズの下っ端', hp: 46, atk: 12, def: 2, exp: 15, money: 20, spd: 1.0, ai: 'brawler', spr: () => thugSpr(23, '#ff5fa2'), drops: [['melonpan', 0.12]] },
    guard: { name: '公安隊員', hp: 52, atk: 13, def: 4, exp: 18, money: 18, spd: 0.9, ai: 'soldier', spr: () => G.charSheet(G.chars.guard.spr), drops: [['energy', 0.12], ['soda', 0.12]] },
    guard2: { name: '公安特務隊員', hp: 80, atk: 18, def: 6, exp: 30, money: 30, spd: 1.0, ai: 'soldier', spr: () => G.charSheet(Object.assign({}, G.chars.guard.spr, { top: '#2a2e44', accCol: '#3a3a4a' })), drops: [['melonpan', 0.15], ['chip', 0.05]] },
    echo: { name: 'エコー体', hp: 60, atk: 17, def: 3, exp: 26, money: 0, spd: 1.0, ai: 'phantom', spr: () => spr('echo'), float: true, glow: '#bff8ff', drops: [['energy', 0.2]] },
    // ボス（生身）
    kyosuke: { name: '鬼塚キョウスケ', hp: 220, atk: 14, def: 3, exp: 80, money: 100, spd: 1.15, ai: 'brawler', boss: true, spr: () => G.charSheet(G.chars.kyosuke.spr), dashAtk: true },
    warden: { name: '監視ロボ〈ウォーデン〉', hp: 520, atk: 18, def: 6, exp: 200, money: 300, spd: 0.6, ai: 'warden', boss: true, heavy: true, spr: () => spr('warden'), w: 26, fh: 10, bodyH: 30, drops: [['chip', 1]] },
    eisen_f: { name: 'アイゼン少佐', hp: 600, atk: 22, def: 8, exp: 260, money: 0, spd: 1.2, ai: 'soldier', boss: true, spr: () => G.charSheet(G.chars.eisen.spr), dashAtk: true },
    // 機体
    guardner: { name: 'ガードナー', hp: 90, atk: 15, def: 2, exp: 30, money: 40, spd: 1.1, ai: 'mech', mech: 'guardner', drops: [['scrap', 0.6], ['repair', 0.1]] },
    guardner2: { name: 'ガードナー指揮官機', hp: 300, atk: 22, def: 6, exp: 90, money: 120, spd: 1.2, ai: 'mech', mech: 'guardner2', boss: true, drops: [['chip', 0.5], ['scrap', 1]] },
    junker: { name: 'ジャンカー', hp: 100, atk: 15, def: 2, exp: 24, money: 30, spd: 1.2, ai: 'mech', mech: 'junker', melee: true, drops: [['scrap', 0.8]] },
    clanA: { name: 'クラン機〈タートル〉', hp: 160, atk: 17, def: 5, exp: 36, money: 50, spd: 1.0, ai: 'mech', mech: 'clanA', drops: [['scrap', 0.7]] },
    clanB: { name: 'クラン機〈ホーネット〉', hp: 130, atk: 19, def: 3, exp: 36, money: 50, spd: 1.5, ai: 'mech', mech: 'clanB', melee: true, drops: [['scrap', 0.7]] },
    jackal: { name: 'ジャッカル', hp: 150, atk: 20, def: 4, exp: 40, money: 60, spd: 1.45, ai: 'mech', mech: 'jackal', melee: true, drops: [['scrap', 0.8], ['chip', 0.1]] },
    salamander: { name: 'サラマンダー（ギル）', hp: 900, atk: 22, def: 5, exp: 300, money: 500, spd: 1.6, ai: 'salamander', mech: 'salamander', boss: true, drops: [['chip', 1]] },
    nocturne: { name: 'ノクターン（ミラージュ）', hp: 1300, atk: 26, def: 7, exp: 500, money: 0, spd: 1.7, ai: 'nocturne', mech: 'nocturne', boss: true },
    bit: { name: 'ビット', hp: 60, atk: 18, def: 3, exp: 10, money: 0, spd: 1.6, ai: 'bit', spr: () => spr('bit'), float: true, w: 10, bodyH: 14 },
    seraph: { name: 'セラフィム（ヘルミナ）', hp: 3200, atk: 28, def: 8, exp: 0, money: 0, spd: 0.8, ai: 'seraph', boss: true, heavy: true, w: 40, fh: 16, bodyH: 60, big: true },
  };

  class Enemy extends G.Ent {
    constructor(type, x, y, o) {
      super();
      o = o || {};
      const d = G.ENEMIES[type];
      if (!d) throw new Error('unknown enemy ' + type);
      this.type = type;
      this.d = d;
      this.isEnemy = true;
      const lv = o.lv || 1;
      const k = 1 + (lv - 1) * 0.18;
      this.name = o.name || d.name;
      this.maxhp = this.hp = Math.floor((o.hp || d.hp) * (o.hp ? 1 : k));
      this.atk = Math.floor(d.atk * k);
      this.def = Math.floor(d.def * (1 + (lv - 1) * 0.12));
      this.exp = Math.floor(d.exp * k);
      this.money = Math.floor(d.money * k);
      this.spd = d.spd * (o.spdMul || 1);
      this.ai = o.ai || d.ai;
      this.boss = o.boss !== undefined ? o.boss : !!d.boss;
      this.heavy = !!d.heavy || this.boss;
      this.x = x;
      this.y = y;
      this.homeX = x;
      this.homeY = y;
      this.id = o.id;
      this.flag = o.flag;
      this.t = G.irand(0, 60);
      this.state = 'idle';
      this.stT = 0;
      this.stunT = 0;
      this.aggro = o.aggro || (d.mech ? 400 : 110);
      if (d.mech) {
        this.isMech = true;
        this.sheet = G.mechSheet(Object.assign({}, G.MECHS[d.mech], o.color || {}));
        this.w = 16;
        this.fh = 10;
        this.bodyH = 34;
      } else if (d.spr) this.sheet = d.spr();
      if (d.w) this.w = d.w;
      if (d.fh) this.fh = d.fh;
      if (d.bodyH) this.bodyH = d.bodyH;
      if (d.float) {
        this.z = 8;
        this.floatT = Math.random() * 6;
      }
      if (type === 'seraph') {
        this.z = 0;
        this.phase = 1;
      }
      this.solid = !d.float && type !== 'seraph';
      this.dir = o.dir || 'down';
      // 巡回ルートと視界（ステルス用）
      if (o.patrol) {
        this.patrol = o.patrol.map(([x, y]) => [x * 16 + 8, y * 16 + 14]);
        this.pi = 0;
        this.ai = 'patrol';
        this.vision = o.vision || 72;
        this.onSpot = o.onSpot;
        this.contact = o.contact !== undefined ? o.contact : false;
        this.invuln = o.invuln !== undefined ? o.invuln : true;
      }
    }
    // 視界内にプレイヤーがいるか（前方±35°、距離vision、壁で遮られる）
    sees(p) {
      const dx = p.x - this.x,
        dy = p.y - this.y,
        d = Math.hypot(dx, dy);
      if (d > this.vision) return false;
      const [fx, fy] = G.DIRS[this.dir];
      const cos = (dx * fx + dy * fy) / (d || 1);
      if (cos < 0.82 && d > 14) return false;
      const steps = Math.ceil(d / 8);
      for (let i = 1; i < steps; i++) {
        const x = this.x + (dx * i) / steps,
          y = this.y - 6 + (dy * i) / steps;
        if (G.field.map.isSolid(Math.floor(x / 16), Math.floor(y / 16))) return false;
      }
      return true;
    }
    get p() {
      return G.field.player;
    }
    dist() {
      return Math.hypot(this.p.x - this.x, this.p.y - this.y);
    }
    toP(sp) {
      const dx = this.p.x - this.x,
        dy = this.p.y - this.y,
        d = Math.hypot(dx, dy) || 1;
      return [(dx / d) * sp, (dy / d) * sp];
    }
    shootAt(speed, o) {
      o = o || {};
      const sx = this.x,
        sy = this.y - this.bodyH * 0.6 - this.z;
      const p = this.p;
      const a = Math.atan2(p.y - p.bodyH / 2 - sy, p.x - sx) + (o.spread || 0);
      G.field.add(new G.Projectile({ x: sx, y: sy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, team: 'enemy', dmg: o.dmg || this.atk, kind: o.kind || 'orb', col: o.col || '#ff5fa2', r: o.r || 3, life: o.life || 120, homing: o.homing, accel: o.accel }));
    }
    shootAng(a, speed, o) {
      o = o || {};
      const sx = o.x !== undefined ? o.x : this.x,
        sy = o.y !== undefined ? o.y : this.y - this.bodyH * 0.6 - this.z;
      G.field.add(new G.Projectile({ x: sx, y: sy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, team: 'enemy', dmg: o.dmg || this.atk, kind: o.kind || 'orb', col: o.col || '#ff5fa2', r: o.r || 3, life: o.life || 150, through: o.through, accel: o.accel, homing: o.homing }));
    }
    go(vx, vy) {
      const moved = this.move(vx, vy);
      if (Math.abs(vx) + Math.abs(vy) > 0.01) this.dir = G.dirFromVec(vx, vy);
      return moved;
    }
    set(st) {
      this.state = st;
      this.stT = 0;
    }
    update() {
      this.updateCommon();
      if (this.path && this.path.length) {
        this.stepPath();
        this.animate(true, this.isMech ? 9 : 8);
        return;
      }
      this.t++;
      this.stT++;
      if (this.floatT !== undefined) {
        this.floatT += 0.07;
        this.z = 8 + Math.sin(this.floatT) * 3;
      }
      let moving = false;
      if (this.stunT > 0) {
        this.stunT--;
        if (G.frame % 8 === 0) G.fx.sparks(this.x, this.y - this.bodyH, 1, '#7af8ff');
      } else if (!G.ev.cutscene && !this.frozen) {
        const fn = AI[this.ai];
        if (fn) moving = fn(this) || false;
      }
      if (!this.d.float && this.sheet && this.sheet.down.length > 2) this.animate(moving || this.forceAnim, this.isMech ? 9 : 8);
      else if (this.sheet) this.frame = Math.floor(this.t / 8) % 2;
      // 接触ダメージ
      if (this.contact !== false && !this.d.float && this.ai !== 'turret' && !G.ev.cutscene) {
        const p = this.p;
        const a = this.body(),
          b = p.body();
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y && this.dist() < (this.w + p.w) / 2 + 4) G.combat.hitPlayer(Math.floor(this.atk * 0.7), this.x, this.y);
      }
    }
    die() {
      if (this.dead) return;
      this.dead = true;
      const b = this.body();
      G.fx.explosion(b.cx, b.cy, this.isMech || this.boss);
      G.audio.se(this.isMech || this.boss ? 'explode' : 'kill');
      if (this.isMech) G.field.shake = 8;
      if (!this.noReward) {
        G.gainExp(this.exp);
        // お金
        let m = this.money;
        while (m > 0) {
          const n = Math.min(m, m > 50 ? 25 : m > 10 ? 5 : 1);
          m -= n;
          G.field.add(new G.Pickup({ x: this.x + G.rand(-8, 8), y: this.y + G.rand(-4, 4), kind: 'money', n, pop: true }));
          if (G.field.ents.length > 300) break;
        }
        for (const [it, ch] of this.d.drops || []) if (Math.random() < ch) G.field.add(new G.Pickup({ x: this.x + G.rand(-8, 8), y: this.y + G.rand(-4, 4), kind: 'item', item: it, n: 1, pop: true }));
        if (!this.isMech && Math.random() < 0.12) G.field.add(new G.Pickup({ x: this.x, y: this.y, kind: 'heal', n: 15, pop: true }));
      }
      G.state.kills++;
      if (this.flag) G.state.flags[this.flag] = true;
      G.field.onEnemyKilled(this);
    }
    draw(c, ox, oy) {
      if (this.d.glow && !this.dead) {
        c.globalCompositeOperation = 'lighter';
        G.glow(c, this.x + ox, this.y - 10 - this.z + oy, 18, G.rgba(this.d.glow, 0.35));
        c.globalCompositeOperation = 'source-over';
      }
      if (this.type === 'seraph') return this.drawSeraph(c, ox, oy);
      if (this.patrol && !this.dead) {
        const [fx, fy] = G.DIRS[this.dir];
        const a0 = Math.atan2(fy, fx);
        c.fillStyle = this.spotted ? 'rgba(255,40,70,0.28)' : 'rgba(255,220,90,0.16)';
        c.beginPath();
        c.moveTo(this.x + ox, this.y - 6 + oy);
        c.arc(this.x + ox, this.y - 6 + oy, this.vision, a0 - 0.6, a0 + 0.6);
        c.closePath();
        c.fill();
      }
      if (this.telegraph > 0) {
        c.globalCompositeOperation = 'lighter';
        G.glow(c, this.x + ox, this.y - this.bodyH / 2 + oy, 22, 'rgba(255,60,90,0.5)');
        c.globalCompositeOperation = 'source-over';
      }
      super.draw(c, ox, oy);
    }
    drawSeraph(c, ox, oy) {
      if (!this.img || this.imgPhase !== this.phase) {
        this.img = G.seraphImg(this.phase);
        this.imgPhase = this.phase;
      }
      const x = Math.round(this.x - this.img.width / 2 + ox),
        y = Math.round(this.y - this.img.height + 6 + Math.sin(this.t * 0.04) * 3 + oy);
      c.globalCompositeOperation = 'lighter';
      G.glow(c, this.x + ox, this.y - 34 + oy, 60, this.phase > 1 ? 'rgba(255,80,120,0.4)' : 'rgba(255,230,150,0.35)');
      c.globalCompositeOperation = 'source-over';
      c.drawImage(this.flashT > 0 ? G.flash(this.img, '#ffffff') : this.img, x, y);
    }
  }
  G.Enemy = Enemy;

  // ---------- AI ----------
  const AI = (G.AI = {});
  AI.patrol = function (e) {
    if (e.spotted) return false;
    if (e.waitT > 0) {
      e.waitT--;
      if (e.waitT % 40 === 0) e.dir = G.pick(['up', 'down', 'left', 'right']);
    } else {
      const [tx, ty] = e.patrol[e.pi];
      const dx = tx - e.x,
        dy = ty - e.y,
        d = Math.hypot(dx, dy);
      const sp = e.spd * 0.7;
      if (d <= sp) {
        e.x = tx;
        e.y = ty;
        e.pi = (e.pi + 1) % e.patrol.length;
        e.waitT = 50;
      } else {
        e.x += (dx / d) * sp;
        e.y += (dy / d) * sp;
        e.dir = G.dirFromVec(dx, dy);
      }
    }
    const p = e.p;
    if (!G.ev.running && p.visible && e.sees(p)) {
      e.spotted = true;
      e.emote = { sym: '!', t: 0, dur: 60 };
      G.audio.se('alarm');
      const cb = e.onSpot || G.field.mapDef().onSpotted;
      if (cb) G.ev.run(() => cb(e));
    }
    return e.waitT <= 0;
  };
  AI.charger = function (e) {
    const d = e.dist();
    if (e.state === 'idle') {
      if (d < e.aggro) e.set('chase');
      else if (e.stT % 90 < 30) {
        e.go(Math.cos(e.t * 0.05) * 0.4, Math.sin(e.t * 0.03) * 0.4);
        return true;
      }
      return false;
    }
    if (e.state === 'chase') {
      const [vx, vy] = e.toP(e.spd);
      e.go(vx, vy);
      if (d < 40 && e.stT > 40 && Math.random() < 0.03) {
        e.set('wind');
        e.telegraph = 14;
      }
      if (d > e.aggro * 2) e.set('idle');
      return true;
    }
    if (e.state === 'wind') {
      e.telegraph--;
      if (e.stT > 14) {
        e.lunge = e.toP(e.spd * 3.2);
        e.set('lunge');
      }
      return false;
    }
    if (e.state === 'lunge') {
      e.go(e.lunge[0], e.lunge[1]);
      if (e.stT > 12) e.set('chase');
      return true;
    }
  };
  AI.drone = function (e) {
    const d = e.dist();
    if (d > e.aggro * 1.6) return false;
    const [vx, vy] = e.toP(e.spd);
    const want = 70;
    const k = d > want + 10 ? 1 : d < want - 10 ? -1 : 0;
    const side = Math.sin(e.t * 0.03) * 0.6;
    e.go(vx * k + -vy * side, vy * k + vx * side);
    if (e.t % 100 === 0 && d < 160) {
      e.telegraph = 0;
      e.shootAt(1.6, { col: '#ff5fa2' });
      G.audio.se('shot');
    }
    return true;
  };
  AI.brawler = function (e) {
    const d = e.dist();
    const p = e.p;
    if (e.state === 'idle') {
      if (d < e.aggro) e.set('chase');
      return false;
    }
    if (e.state === 'chase') {
      const [vx, vy] = e.toP(e.spd * (e.boss && e.hp < e.maxhp / 2 ? 1.35 : 1));
      e.go(vx, vy);
      if (d < 26) {
        e.set('wind');
        e.telegraph = 18;
        e.faceTo(p);
      } else if (e.d.dashAtk && d < 110 && e.stT > 70 && Math.random() < 0.025) {
        e.set('dashwind');
        e.telegraph = 22;
      }
      return true;
    }
    if (e.state === 'wind') {
      e.telegraph--;
      e.frame = 0;
      if (e.stT > (e.boss ? 14 : 20)) {
        e.frame = 3;
        e.forceAnim = false;
        G.fx.slash(e.x, e.y - 8, e.dir, '#ff6070');
        G.audio.se('swing');
        const [vx, vy] = G.DIRS[e.dir];
        const px = e.x + vx * 14,
          py = e.y - 6 + vy * 12;
        const b = p.body();
        if (Math.hypot(G.clamp(px, b.x, b.x + b.w) - px, G.clamp(py, b.y, b.y + b.h) - py) < 16) G.combat.hitPlayer(e.atk, e.x, e.y);
        e.set('recover');
      }
      return false;
    }
    if (e.state === 'recover') {
      e.frame = e.stT < 8 ? 3 : 0;
      if (e.stT > (e.boss ? 24 : 40)) e.set('chase');
      return false;
    }
    if (e.state === 'dashwind') {
      e.telegraph--;
      e.faceTo(p);
      if (e.stT > 22) {
        e.lunge = e.toP(4.2);
        e.set('dash');
        G.audio.se('dash');
      }
      return false;
    }
    if (e.state === 'dash') {
      e.go(e.lunge[0], e.lunge[1]);
      if (G.frame % 2 === 0) G.fx.afterimage(e);
      if (e.stT > 16) e.set('recover');
      return true;
    }
  };
  AI.soldier = function (e) {
    const d = e.dist();
    if (e.state === 'idle') {
      if (d < e.aggro) e.set('chase');
      return false;
    }
    if (e.state === 'chase') {
      const [vx, vy] = e.toP(e.spd);
      if (d > 50) e.go(vx, vy);
      else e.go(-vy * 0.6, vx * 0.6);
      e.faceTo(e.p);
      if (e.stT > 80 && d < 150 && Math.random() < 0.03) {
        e.set('aim');
        e.telegraph = 20;
      } else if (d < 26) {
        e.ai = 'brawler';
        e.set('wind');
        e.telegraph = 16;
        setTimeout(() => (e.ai = 'soldier'), 1200);
      }
      return true;
    }
    if (e.state === 'aim') {
      e.telegraph--;
      e.frame = 3;
      if (e.stT === 20 || (e.boss && (e.stT === 28 || e.stT === 36))) {
        e.shootAt(2.6, { col: '#7af8ff', kind: 'bullet', r: 2 });
        G.audio.se('shot');
      }
      if (e.stT > 44) e.set('chase');
      return false;
    }
    if (e.state === 'wind' || e.state === 'recover' || e.state === 'dashwind' || e.state === 'dash') return AI.brawler(e);
  };
  AI.turret = function (e) {
    const d = e.dist();
    e.faceTo(e.p);
    if (d < 170 && e.t % 120 < 30 && e.t % 10 === 0) {
      e.shootAt(2.2, { col: '#ff8a30', kind: 'bullet' });
      G.audio.se('shot');
    }
    return false;
  };
  AI.phantom = function (e) {
    const d = e.dist();
    if (e.state === 'idle') {
      if (d < e.aggro) e.set('float');
      return false;
    }
    if (e.state === 'float') {
      const [vx, vy] = e.toP(e.spd * 0.6);
      e.go(vx, vy);
      if (e.stT > 100) {
        e.set('fade');
      }
      if (e.stT % 60 === 30) {
        for (let k = -1; k <= 1; k++) e.shootAt(1.4, { col: '#bff8ff', spread: k * 0.3 });
      }
      return true;
    }
    if (e.state === 'fade') {
      e.alpha = Math.max(0.1, 1 - e.stT / 20);
      e.untargetable = true;
      if (e.stT > 20) {
        const p = e.p;
        const a = Math.random() * Math.PI * 2;
        const nx = p.x + Math.cos(a) * 40,
          ny = p.y + Math.sin(a) * 30;
        if (!G.field.map.hitRect(nx - 5, ny - 6, 10, 6)) {
          e.x = nx;
          e.y = ny;
        }
        e.set('appear');
      }
      return false;
    }
    if (e.state === 'appear') {
      e.alpha = Math.min(1, e.stT / 10);
      if (e.stT > 10) {
        e.untargetable = false;
        G.fx.ring(e.x, e.y - 10, 30, '#bff8ff');
        if (e.dist() < 34) G.combat.hitPlayer(e.atk, e.x, e.y);
        e.set('float');
      }
      return false;
    }
  };
  // ---- 機体AI（ストレイフ＆射撃、近接型は斬りかかる） ----
  AI.mech = function (e) {
    const d = e.dist();
    const p = e.p;
    if (e.state === 'idle') {
      if (d < e.aggro) e.set('engage');
      return false;
    }
    const melee = e.d.melee;
    if (e.state === 'engage') {
      const want = melee ? 30 : 110;
      const [vx, vy] = e.toP(e.spd);
      e.strafe = e.strafe || (Math.random() < 0.5 ? 1 : -1);
      if (e.stT % 120 === 0) e.strafe *= -1;
      const k = d > want + 20 ? 1 : d < want - 20 ? -0.8 : 0;
      const moved = e.go(vx * k + -vy * e.strafe * 0.7, vy * k + vx * e.strafe * 0.7);
      if (!moved) e.strafe *= -1;
      e.faceTo(p);
      if (!melee && e.stT > 60 && Math.random() < 0.025) e.set('burst');
      if (melee && d < 44 && e.stT > 30) {
        e.set('slashwind');
        e.telegraph = 16;
      }
      if (e.stT > 90 && Math.random() < 0.012) {
        e.set('boost');
        const a = Math.atan2(p.y - e.y, p.x - e.x) + (melee ? 0 : (Math.random() < 0.5 ? 1 : -1) * 1.2);
        e.bv = [Math.cos(a) * 4.5, Math.sin(a) * 4.5];
        G.audio.se('boost');
      }
      return true;
    }
    if (e.state === 'burst') {
      e.frame = 3;
      e.faceTo(p);
      if (e.stT % 8 === 1 && e.stT < 26) {
        e.shootAt(4.2, { col: '#ff3a8a', kind: 'beam', r: 3 });
        G.audio.se('beam');
      }
      if (e.stT > 40) e.set('engage');
      return false;
    }
    if (e.state === 'boost') {
      e.go(e.bv[0], e.bv[1]);
      if (G.frame % 2 === 0) G.fx.thrust(e.x, e.y - 10);
      if (e.stT > 14) e.set(melee && d < 50 ? 'slashwind' : 'engage');
      return true;
    }
    if (e.state === 'slashwind') {
      e.telegraph = Math.max(0, (e.telegraph || 0) - 1);
      e.faceTo(p);
      e.frame = 0;
      if (e.stT > 16) {
        e.frame = 4;
        const [vx, vy] = G.DIRS[e.dir];
        e.go(vx * 6, vy * 6);
        G.fx.slash(e.x + vx * 18, e.y - 14 + vy * 14, e.dir, '#ff6070', true, 2);
        G.audio.se('saber');
        if (d < 46) G.combat.hitPlayer(Math.floor(e.atk * 1.4), e.x, e.y);
        e.set('recover');
      }
      return false;
    }
    if (e.state === 'recover') {
      if (e.stT > 30) e.set('engage');
      return false;
    }
  };
  AI.bit = function (e) {
    const owner = e.owner;
    if (owner && !owner.dead) {
      e.orbit = (e.orbit || 0) + 0.025;
      const tx = owner.x + Math.cos(e.orbit + e.idx * 1.05) * 80,
        ty = owner.y - 20 + Math.sin(e.orbit + e.idx * 1.05) * 50;
      e.x += (tx - e.x) * 0.05;
      e.y += (ty - e.y) * 0.05;
    } else {
      const [vx, vy] = e.toP(e.spd);
      e.x += vx;
      e.y += vy;
    }
    if (e.t % 110 === e.idx * 15) {
      e.shootAt(2.8, { col: '#ffd25e', kind: 'laser' });
      G.audio.se('lockon');
    }
    return true;
  };
  AI.warden = function (e) {
    const d = e.dist();
    if (e.state === 'idle') {
      if (d < 200) e.set('walk');
      return false;
    }
    const enr = e.hp < e.maxhp / 2;
    if (e.state === 'walk') {
      const [vx, vy] = e.toP(e.spd * (enr ? 1.4 : 1));
      e.go(vx, vy);
      if (e.stT > 90) e.set(G.pick(enr ? ['charge', 'shock', 'spray', 'summon'] : ['charge', 'shock', 'spray']));
      return true;
    }
    if (e.state === 'charge') {
      if (e.stT < 30) {
        e.telegraph = 1;
        e.cv = e.toP(4);
        return false;
      }
      e.telegraph = 0;
      if (!e.go(e.cv[0], e.cv[1]) || e.stT > 60) {
        G.field.shake = 6;
        G.audio.se('explode');
        e.set('walk');
      }
      return true;
    }
    if (e.state === 'shock') {
      if (e.stT === 20) {
        G.fx.ring(e.x, e.y - 6, 90, '#ffd25e');
        G.audio.se('quake');
        G.field.shake = 8;
        for (let a = 0; a < 16; a++) e.shootAng((a / 16) * Math.PI * 2, 1.6, { col: '#ffd25e', y: e.y - 8 });
        if (d < 50) G.combat.hitPlayer(e.atk, e.x, e.y);
      }
      if (e.stT > 50) e.set('walk');
      return false;
    }
    if (e.state === 'spray') {
      if (e.stT % 6 === 0 && e.stT < 60) {
        const a = Math.atan2(e.p.y - e.y, e.p.x - e.x) + Math.sin(e.stT * 0.2) * 0.6;
        e.shootAng(a, 2.4, { col: '#ff3050', kind: 'bullet' });
        G.audio.se('shot');
      }
      if (e.stT > 70) e.set('walk');
      return false;
    }
    if (e.state === 'summon') {
      if (e.stT === 10) for (let k = 0; k < 3; k++) G.field.add(new Enemy('rat', e.x + G.rand(-30, 30), e.y + G.rand(10, 30), { lv: 3 }));
      if (e.stT > 30) e.set('walk');
      return false;
    }
  };
  // ---- ギル：サラマンダー ----
  AI.salamander = function (e) {
    const p = e.p;
    const enr = e.hp < e.maxhp * 0.5;
    if (e.state === 'idle') e.set('move');
    if (e.state === 'move') {
      e.strafe = e.strafe || 1;
      const [vx, vy] = e.toP(e.spd);
      const d = e.dist();
      const k = d > 120 ? 1 : d < 70 ? -1 : 0;
      if (!e.go(vx * k - vy * e.strafe, vy * k + vx * e.strafe)) e.strafe *= -1;
      e.faceTo(p);
      if (e.stT > (enr ? 50 : 80)) e.set(G.pick(['fan', 'rush', 'flame', enr ? 'rush' : 'fan']));
      return true;
    }
    if (e.state === 'fan') {
      e.frame = 3;
      if (e.stT === 15 || (enr && e.stT === 35)) {
        const base = Math.atan2(p.y - e.y, p.x - e.x);
        for (let k = -3; k <= 3; k++) e.shootAng(base + k * 0.22, 2.4, { col: '#ff8a30', kind: 'fire', dmg: e.atk });
        G.audio.se('beam');
      }
      if (e.stT > 50) e.set('move');
      return false;
    }
    if (e.state === 'rush') {
      if (e.stT < 24) {
        e.telegraph = 1;
        e.faceTo(p);
        e.rv = e.toP(5.5);
        return false;
      }
      e.telegraph = 0;
      e.go(e.rv[0], e.rv[1]);
      if (e.stT % 3 === 0) {
        G.fx.thrust(e.x, e.y - 12);
        G.field.add(new G.Projectile({ x: e.x, y: e.y - 8, vx: 0, vy: 0, team: 'enemy', dmg: Math.floor(e.atk * 0.6), kind: 'fire', life: 70, col: '#ff8a30' }));
      }
      if (e.dist() < 30 && !e.hitThis) {
        e.hitThis = true;
        G.combat.hitPlayer(Math.floor(e.atk * 1.5), e.x, e.y);
        G.fx.slash(e.x, e.y - 14, e.dir, '#ff8a30', true, 2);
      }
      if (e.stT > 44) {
        e.hitThis = false;
        e.set('move');
      }
      return true;
    }
    if (e.state === 'flame') {
      e.frame = 3;
      if (e.stT > 10 && e.stT < 70 && e.stT % 4 === 0) {
        const a = Math.atan2(p.y - e.y, p.x - e.x) + Math.sin(e.stT * 0.15) * 0.5;
        e.shootAng(a, 3.2, { col: '#ffd25e', kind: 'fire', life: 50 });
        if (e.stT % 12 === 0) G.audio.se('boost');
      }
      if (e.stT > 80) e.set('move');
      return false;
    }
  };
  // ---- ミラージュ：ノクターン ----
  AI.nocturne = function (e) {
    const p = e.p;
    const enr = e.hp < e.maxhp * 0.5;
    if (e.state === 'idle') e.set('move');
    if (e.state === 'move') {
      e.strafe = e.strafe || 1;
      const [vx, vy] = e.toP(e.spd);
      const d = e.dist();
      const k = d > 140 ? 1 : d < 90 ? -1 : 0;
      if (!e.go(vx * k - vy * e.strafe, vy * k + vx * e.strafe)) e.strafe *= -1;
      e.faceTo(p);
      if (G.frame % 3 === 0) G.fx.afterimage(e);
      if (e.stT > (enr ? 45 : 70)) e.set(G.pick(enr ? ['blink', 'homing', 'clones', 'burst', 'blink'] : ['blink', 'homing', 'burst']));
      return true;
    }
    if (e.state === 'blink') {
      e.alpha = Math.max(0.15, 1 - e.stT / 12);
      e.untargetable = e.stT < 26;
      if (e.stT === 14) {
        const behind = G.DIRS[p.dir];
        const nx = p.x - behind[0] * 50,
          ny = p.y - behind[1] * 40;
        if (!G.field.map.hitRect(nx - 8, ny - 10, 16, 10)) {
          e.x = nx;
          e.y = ny;
        }
        e.faceTo(p);
      }
      if (e.stT > 14) e.alpha = Math.min(1, (e.stT - 14) / 8);
      if (e.stT === 30) {
        e.telegraph = 1;
      }
      if (e.stT === 40) {
        e.telegraph = 0;
        e.frame = 4;
        const [vx, vy] = G.DIRS[e.dir];
        e.go(vx * 10, vy * 10);
        G.fx.slash(e.x + vx * 18, e.y - 14 + vy * 14, e.dir, '#a060ff', true, 2.2);
        G.audio.se('saber');
        if (e.dist() < 56) G.combat.hitPlayer(Math.floor(e.atk * 1.5), e.x, e.y);
      }
      if (e.stT > 56) {
        e.alpha = 1;
        e.untargetable = false;
        e.set('move');
      }
      return false;
    }
    if (e.state === 'homing') {
      e.frame = 3;
      if (e.stT % 10 === 5 && e.stT < 50) {
        const a = Math.atan2(p.y - e.y, p.x - e.x) + G.rand(-1.4, 1.4);
        e.shootAng(a, 2.2, { col: '#b070ff', homing: 0.035, life: 180 });
        G.audio.se('lockon');
      }
      if (e.stT > 70) e.set('move');
      return false;
    }
    if (e.state === 'burst') {
      e.frame = 3;
      if (e.stT % 6 === 0 && e.stT < 36) {
        e.shootAt(5, { col: '#ff2848', kind: 'beam' });
        G.audio.se('beam');
      }
      if (e.stT > 50) e.set('move');
      return false;
    }
    if (e.state === 'clones') {
      if (e.stT === 10 && G.field.enemies().length < 5) {
        for (let k = 0; k < 2; k++) {
          const c = new Enemy('jackal', e.x + (k ? 30 : -30), e.y, { hp: 1, color: { body: '#2a2838', accent: '#8a3af0', eye: '#ff2848' }, name: '幻影' });
          c.alpha = 0.6;
          c.noReward = true;
          c.contact = false;
          G.field.add(c);
          G.fx.ring(c.x, c.y - 16, 30, '#a060ff');
        }
      }
      if (e.stT > 40) e.set('move');
      return false;
    }
  };
  // ---- ヘルミナ：セラフィム ----
  AI.seraph = function (e) {
    const p = e.p;
    const ratio = e.hp / e.maxhp;
    const newPhase = ratio < 0.3 ? 3 : ratio < 0.65 ? 2 : 1;
    if (newPhase !== e.phase) {
      e.phase = newPhase;
      G.field.flash = 10;
      G.audio.se('bigexplode');
      G.field.shake = 12;
      e.set('summon');
      if (e.onPhase) e.onPhase(newPhase);
    }
    // ゆっくり漂う
    const tx = e.homeX + Math.sin(e.t * 0.012) * 90,
      ty = e.homeY + Math.sin(e.t * 0.02) * 20;
    e.x += (tx - e.x) * 0.02;
    e.y += (ty - e.y) * 0.02;
    if (e.state === 'idle') e.set('summon');
    if (e.state === 'summon') {
      if (e.stT === 20) {
        const n = e.phase === 1 ? 4 : 6;
        const cur = G.field.enemies().filter((x) => x.type === 'bit').length;
        for (let k = cur; k < n; k++) {
          const b = new Enemy('bit', e.x, e.y - 30, { lv: 1 + e.phase });
          b.owner = e;
          b.idx = k;
          b.noReward = true;
          G.field.add(b);
        }
        G.audio.se('echo');
      }
      if (e.stT > 50) e.set('ring');
      return;
    }
    if (e.state === 'ring') {
      const waves = e.phase;
      if (e.stT % 40 === 10 && e.stT < 40 * waves) {
        const n = 14 + e.phase * 4;
        const off = e.stT * 0.1;
        for (let a = 0; a < n; a++) e.shootAng((a / n) * Math.PI * 2 + off, 1.5 + e.phase * 0.2, { col: e.phase > 1 ? '#ff7090' : '#ffe890', through: true, life: 260, y: e.y - 34 });
        G.audio.se('beam');
      }
      if (e.stT > 40 * waves + 30) e.set(e.phase >= 2 ? G.pick(['sweep', 'spiral', 'aim']) : G.pick(['aim', 'ring2']));
      return;
    }
    if (e.state === 'ring2') {
      if (e.stT === 20) e.set('ring');
      return;
    }
    if (e.state === 'aim') {
      if (e.stT % 7 === 0 && e.stT < 60) {
        e.shootAt(3.4 + e.phase * 0.3, { col: '#ffd25e', kind: 'beam', spread: G.rand(-0.15, 0.15), y: e.y - 34 });
        G.audio.se('beam');
      }
      if (e.stT > 80) e.set('ring');
      return;
    }
    if (e.state === 'sweep') {
      // 回転レーザー
      if (e.stT > 20 && e.stT < 140 && e.stT % 3 === 0) {
        const a = e.stT * 0.045;
        for (let k = 0; k < (e.phase === 3 ? 3 : 2); k++) e.shootAng(a + (k * Math.PI * 2) / (e.phase === 3 ? 3 : 2), 3, { col: '#ff4070', kind: 'laser', through: true, life: 100, y: e.y - 34 });
      }
      if (e.stT === 20) G.audio.se('charge');
      if (e.stT > 160) e.set('summon');
      return;
    }
    if (e.state === 'spiral') {
      if (e.stT % 4 === 0 && e.stT < 160) {
        const a = e.stT * 0.13;
        e.shootAng(a, 1.8, { col: '#b0f0ff', through: true, life: 240, y: e.y - 34 });
        e.shootAng(-a + Math.PI, 1.8, { col: '#ffb0d0', through: true, life: 240, y: e.y - 34 });
      }
      if (e.stT > 180) e.set('summon');
      return;
    }
  };
})();
