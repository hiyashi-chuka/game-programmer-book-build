// =============================================================
//  entity.js — エンティティ（プレイヤー・NPC・弾・パーティクル）
// =============================================================
(function () {
  const DIRV = G.DIRS;

  // ---------- 基本エンティティ ----------
  class Ent {
    constructor(o) {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.z = 0;
      this.dir = 'down';
      this.w = 10; // 足元当たり幅
      this.fh = 6; // 足元当たり高さ
      this.bodyH = 20;
      this.solid = true;
      this.frame = 0;
      this.animT = 0;
      this.moving = false;
      this.flashT = 0;
      this.invT = 0;
      this.dead = false;
      this.visible = true;
      this.alpha = 1;
      this.kx = 0;
      this.ky = 0;
      Object.assign(this, o || {});
    }
    get tx() {
      return Math.floor(this.x / 16);
    }
    get ty() {
      return Math.floor((this.y - 2) / 16);
    }
    footRect(x, y) {
      return [x - this.w / 2, y - this.fh, this.w, this.fh];
    }
    body() {
      return { x: this.x - this.w / 2 - 2, y: this.y - this.bodyH, w: this.w + 4, h: this.bodyH, cx: this.x, cy: this.y - this.bodyH / 2 };
    }
    blocked(nx, ny) {
      const f = G.field;
      if (!f) return false;
      const [rx, ry, rw, rh] = this.footRect(nx, ny);
      if (this.noclip) return false;
      if (f.map.hitRect(rx, ry, rw, rh)) return true;
      for (const e of f.ents) {
        if (e === this || !e.solid || e.dead || !e.visible || e.ghost) continue;
        if (this.isPlayer && e.isFollower) continue;
        if (this.isFollower && (e.isPlayer || e.isFollower)) continue;
        if (this.isProjectile) continue;
        const [ex, ey, ew, eh] = e.footRect(e.x, e.y);
        if (rx < ex + ew && rx + rw > ex && ry < ey + eh && ry + rh > ey) {
          // 既に重なっている場合は離れる方向を許可
          const [cx, cy, cw, ch] = this.footRect(this.x, this.y);
          if (cx < ex + ew && cx + cw > ex && cy < ey + eh && cy + ch > ey) continue;
          return true;
        }
      }
      return false;
    }
    // 軸ごとに移動し、角で引っかからないよう滑らせる
    move(dx, dy) {
      let moved = false;
      if (dx) {
        const step = Math.sign(dx);
        let rem = Math.abs(dx);
        while (rem > 0) {
          const s = Math.min(1, rem) * step;
          if (!this.blocked(this.x + s, this.y)) {
            this.x += s;
            moved = true;
          } else if (!dy) {
            // 角滑り
            for (const n of [1, -1, 2, -2, 3, -3, 4, -4]) {
              if (!this.blocked(this.x, this.y + n) && !this.blocked(this.x + s, this.y + n)) {
                this.y += Math.sign(n) * 0.75;
                moved = true;
                break;
              }
            }
            break;
          } else break;
          rem -= 1;
        }
      }
      if (dy) {
        const step = Math.sign(dy);
        let rem = Math.abs(dy);
        while (rem > 0) {
          const s = Math.min(1, rem) * step;
          if (!this.blocked(this.x, this.y + s)) {
            this.y += s;
            moved = true;
          } else if (!dx) {
            for (const n of [1, -1, 2, -2, 3, -3, 4, -4]) {
              if (!this.blocked(this.x + n, this.y) && !this.blocked(this.x + n, this.y + s)) {
                this.x += Math.sign(n) * 0.75;
                moved = true;
                break;
              }
            }
            break;
          } else break;
          rem -= 1;
        }
      }
      return moved;
    }
    animate(moving, rate) {
      if (moving) {
        this.animT++;
        const seq = [1, 0, 2, 0];
        this.frame = seq[Math.floor(this.animT / (rate || 8)) % 4];
      } else {
        this.animT = 0;
        if (this.frame !== 3 && this.frame !== 4) this.frame = 0;
      }
    }
    updateCommon() {
      if (this.flashT > 0) this.flashT--;
      if (this.invT > 0) this.invT--;
      // ノックバック
      if (Math.abs(this.kx) > 0.05 || Math.abs(this.ky) > 0.05) {
        this.move(this.kx, this.ky);
        this.kx *= 0.78;
        this.ky *= 0.78;
      }
    }
    drawShadow(c, ox, oy) {
      const s = this.isMech ? 12 : this.shadowW || 6;
      c.fillStyle = 'rgba(20,10,40,0.3)';
      c.fillRect(Math.round(this.x - s + ox), Math.round(this.y - 1 + oy), s * 2, 2);
      c.fillRect(Math.round(this.x - s + 2 + ox), Math.round(this.y - 2 + oy), s * 2 - 4, 4);
    }
    sprite() {
      if (!this.sheet) return null;
      const arr = this.sheet[this.dir] || this.sheet.down;
      return arr[Math.min(this.frame, arr.length - 1)];
    }
    draw(c, ox, oy) {
      if (!this.visible) return;
      const img = this.sprite();
      if (this.shadow !== false && this.z < 40) this.drawShadow(c, ox, oy);
      if (!img) return;
      const dx = Math.round(this.x - img.width / 2 + ox),
        dy = Math.round(this.y - img.height + 1 - this.z + oy + (this.drawOffY || 0));
      if (this.invT > 0 && Math.floor(this.invT / 3) % 2 === 0 && !this.flashT) return;
      c.globalAlpha = this.alpha;
      c.drawImage(this.flashT > 0 ? G.flash(img, this.flashCol || '#ffffff') : img, dx, dy);
      c.globalAlpha = 1;
      if (this.emote) this.drawEmote(c, ox, oy, img);
    }
    drawEmote(c, ox, oy, img) {
      const e = this.emote;
      e.t++;
      if (e.t > (e.dur || 70)) {
        this.emote = null;
        return;
      }
      const bx = Math.round(this.x + ox - 6),
        by = Math.round(this.y - img.height - 12 - this.z + oy - (e.t < 6 ? 6 - e.t : 0));
      c.fillStyle = '#1c1230';
      c.fillRect(bx - 1, by - 1, 14, 12);
      c.fillStyle = '#ffffff';
      c.fillRect(bx, by, 12, 10);
      c.fillRect(bx + 4, by + 10, 3, 2);
      const sym = e.sym;
      const col = { '!': '#ff3050', '?': '#3a6ad0', '♪': '#ff5fa2', '…': '#5a5a6a', '♥': '#ff5fa2', '💢': '#ff3050', '!?': '#ff8a30' }[sym] || '#2a2a3a';
      c.fillStyle = col;
      if (sym === '!') {
        c.fillRect(bx + 5, by + 2, 2, 4);
        c.fillRect(bx + 5, by + 7, 2, 1);
      } else if (sym === '?') {
        c.fillRect(bx + 4, by + 2, 4, 1);
        c.fillRect(bx + 7, by + 3, 1, 2);
        c.fillRect(bx + 5, by + 5, 2, 1);
        c.fillRect(bx + 5, by + 7, 2, 1);
      } else if (sym === '…') {
        for (let i = 0; i < 3; i++) c.fillRect(bx + 2 + i * 3, by + 5, 2, 1);
      } else if (sym === '♪') {
        c.fillRect(bx + 6, by + 2, 1, 5);
        c.fillRect(bx + 4, by + 6, 3, 2);
        c.fillRect(bx + 7, by + 2, 2, 1);
      } else if (sym === '♥') {
        c.fillRect(bx + 3, by + 3, 2, 2);
        c.fillRect(bx + 7, by + 3, 2, 2);
        c.fillRect(bx + 3, by + 4, 6, 2);
        c.fillRect(bx + 4, by + 6, 4, 1);
        c.fillRect(bx + 5, by + 7, 2, 1);
      } else if (sym === '💢') {
        c.fillRect(bx + 3, by + 2, 2, 2);
        c.fillRect(bx + 7, by + 2, 2, 2);
        c.fillRect(bx + 3, by + 6, 2, 2);
        c.fillRect(bx + 7, by + 6, 2, 2);
      } else {
        c.fillRect(bx + 3, by + 2, 2, 4);
        c.fillRect(bx + 3, by + 7, 2, 1);
        c.fillRect(bx + 7, by + 2, 2, 4);
        c.fillRect(bx + 7, by + 7, 2, 1);
      }
    }
    // スクリプト移動（E.move）
    stepPath() {
      if (!this.path || !this.path.length) return false;
      const [tx, ty] = this.path[0];
      const dx = tx - this.x,
        dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      const sp = this.pathSpeed || 1.2;
      if (d <= sp) {
        this.x = tx;
        this.y = ty;
        this.path.shift();
      } else {
        this.x += (dx / d) * sp;
        this.y += (dy / d) * sp;
        this.dir = G.dirFromVec(dx, dy);
      }
      return true;
    }
    face(dir) {
      this.dir = dir;
    }
    faceTo(e) {
      this.dir = G.dirFromVec(e.x - this.x, e.y - this.y);
    }
  }
  G.Ent = Ent;

  // ---------- NPC ----------
  class NPC extends Ent {
    constructor(def) {
      super();
      this.def = def;
      this.id = def.id;
      this.charId = def.char;
      const ch = G.chars[def.char] || G.chars.sys;
      this.sheet = def.mech ? G.mechSheet(G.MECHS[def.mech] || def.mechP) : ch.spr.special ? G.specialSheet(ch.spr.special) : G.charSheet(def.spr || ch.spr);
      if (def.mech) {
        this.isMech = true;
        this.w = 16;
        this.fh = 10;
        this.bodyH = 34;
      }
      this.x = def.x * 16 + 8;
      this.y = def.y * 16 + 14;
      this.homeX = this.x;
      this.homeY = this.y;
      this.dir = def.dir || 'down';
      this.speed = def.speed || 0.6;
      this.path = [];
      this.waitT = G.irand(30, 120);
      this.talk = def.talk;
      this.solid = def.solid !== false;
      this.ghost = !!def.ghost;
      if (def.z) this.z = def.z;
      if (def.float) this.floatT = Math.random() * 6;
    }
    update() {
      this.updateCommon();
      let moving = false;
      if (this.path.length) {
        const [tx, ty] = this.path[0];
        const dx = tx - this.x,
          dy = ty - this.y;
        const d = Math.hypot(dx, dy);
        const sp = this.pathSpeed || this.speed * 1.4;
        if (d <= sp) {
          this.x = tx;
          this.y = ty;
          this.path.shift();
          if (!this.path.length && this.onArrive) {
            const f = this.onArrive;
            this.onArrive = null;
            f();
          }
        } else {
          this.x += (dx / d) * sp;
          this.y += (dy / d) * sp;
          this.dir = G.dirFromVec(dx, dy);
          moving = true;
        }
      } else if (!G.ev.running || this.def.moveDuringEvents) {
        const mv = this.def.move;
        if (mv === 'wander' || mv === 'pace') {
          if (this.waitT > 0) this.waitT--;
          else if (!this.wdir) {
            if (mv === 'pace') this.wdir = this.wdir2 === 'left' ? 'right' : 'left';
            else this.wdir = G.pick(['up', 'down', 'left', 'right']);
            this.wdir2 = this.wdir;
            this.wT = G.irand(20, 60);
          }
          if (this.wdir) {
            const [vx, vy] = DIRV[this.wdir];
            const nx = this.x + vx * this.speed,
              ny = this.y + vy * this.speed;
            const far = Math.hypot(nx - this.homeX, ny - this.homeY) > (this.def.range || 2) * 16;
            if (far || this.nearPlayer() || !this.move(vx * this.speed, vy * this.speed)) {
              this.wdir = null;
              this.waitT = G.irand(40, 140);
            } else {
              this.dir = this.wdir;
              moving = true;
            }
            if (--this.wT <= 0) {
              this.wdir = null;
              this.waitT = G.irand(40, 160);
            }
          }
        } else if (mv === 'look') {
          if (--this.waitT <= 0) {
            this.dir = G.pick(['up', 'down', 'left', 'right']);
            this.waitT = G.irand(60, 200);
          }
        }
      }
      if (this.floatT !== undefined) {
        this.floatT += 0.08;
        this.z = 6 + Math.sin(this.floatT) * 2;
      }
      this.animate(moving, this.isMech ? 10 : 8);
    }
    nearPlayer() {
      const p = G.field && G.field.player;
      return p && Math.hypot(p.x - this.x, p.y - this.y) < 20;
    }
  }
  G.NPC = NPC;

  // ---------- 仲間（後ろをついてくる） ----------
  class Follower extends Ent {
    constructor(charId, idx) {
      super();
      this.charId = charId;
      this.id = 'f_' + charId;
      this.idx = idx;
      const ch = G.chars[charId];
      this.sheet = ch.spr.special ? G.specialSheet(ch.spr.special) : G.charSheet(ch.spr);
      this.isFollower = true;
      this.solid = false;
      this.atkCd = 60;
    }
    update() {
      this.updateCommon();
      if (this.path && this.path.length) {
        this.stepPath();
        this.animate(true);
        return;
      }
      if (this.pinned) {
        this.animate(false);
        return;
      }
      const p = G.field.player;
      const trail = G.field.trail;
      const k = Math.min(trail.length - 1, (this.idx + 1) * 14);
      let moving = false;
      if (this.chase && !this.chase.dead && !G.ev.running) {
        // 近くの敵に攻撃（ルウなど）
        const e = this.chase;
        const dx = e.x - this.x,
          dy = e.y - this.y,
          d = Math.hypot(dx, dy);
        if (d > 14) {
          this.x += (dx / d) * 1.8;
          this.y += (dy / d) * 1.8;
          this.dir = G.dirFromVec(dx, dy);
          moving = true;
        } else if (this.atkCd <= 0) {
          this.frame = 3;
          this.atkT = 10;
          G.combat.hitEnemy(e, Math.max(1, Math.floor(G.stats().atk * 0.5)), this.x, this.y, { kb: 2 });
          G.fx.slash(this.x, this.y - 8, this.dir, '#ff9ac8');
          this.atkCd = 70;
          if (Math.random() < 0.5) this.chase = null;
        }
        if (Math.hypot(this.x - p.x, this.y - p.y) > 120) this.chase = null;
      } else if (k >= 0 && trail[k]) {
        const [tx, ty, td] = trail[k];
        const dx = tx - this.x,
          dy = ty - this.y,
          d = Math.hypot(dx, dy);
        if (d > 0.5) {
          const sp = Math.min(d, Math.max(1.2, d * 0.25));
          this.x += (dx / d) * sp;
          this.y += (dy / d) * sp;
          this.dir = G.dirFromVec(dx, dy);
          moving = true;
        } else if (!p.moving) this.dir = td;
      }
      if (this.atkCd > 0) this.atkCd--;
      if (this.atkT > 0) {
        this.atkT--;
        this.frame = 3;
      } else this.animate(moving);
      // 戦闘参加
      if (this.fighter && !this.chase && this.atkCd <= 0 && G.field.enemies().length) {
        let best = null,
          bd = 90;
        for (const e of G.field.enemies()) {
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d < bd && !e.isMech) {
            bd = d;
            best = e;
          }
        }
        this.chase = best;
      }
    }
  }
  G.Follower = Follower;

  // ---------- 特殊スプライト（キューブ、ネジ等） ----------
  const spCache = {};
  G.specialSheet = function (kind) {
    if (spCache[kind]) return spCache[kind];
    const mk = (fn) => {
      const frames = [0, 1, 2, 3].map((f) => {
        const b = new G.PB(16, 24);
        fn(b, f);
        return G.outline(b.toCanvas(), '#1c1230', true);
      });
      return frames;
    };
    let sheet;
    if (kind === 'cube') {
      const f = (b, fr) => {
        const bob = fr === 1 || fr === 2 ? 1 : 0;
        b.rect(3, 9 - bob, 10, 10, '#e8ecf4');
        b.rect(3, 9 - bob, 10, 2, '#ffffff');
        b.rect(11, 9 - bob, 2, 10, '#a8b0c8');
        b.rect(4, 12 - bob, 7, 5, '#1a2440');
        b.set(5, 14 - bob, '#4ef0ff');
        b.set(8, 14 - bob, '#4ef0ff');
        b.set(7, 8 - bob, '#a8b0c8');
        b.set(7, 7 - bob, '#a8b0c8');
        b.set(7, 6 - bob, '#ff5fa2');
        b.rect(5, 21, 6, 1, '#4ef0ff');
      };
      const fs = mk(f);
      sheet = { down: fs, up: fs, left: fs, right: fs };
    } else if (kind === 'neji') {
      const f = (b, fr) => {
        const step = fr === 1 ? 1 : fr === 2 ? -1 : 0;
        b.ell(8, 17, 5, 4, '#b8c0d0');
        b.ell(8, 12, 4.5, 4, '#b8c0d0');
        b.set(5, 7, '#b8c0d0');
        b.set(4, 8, '#b8c0d0');
        b.set(11, 7, '#b8c0d0');
        b.set(12, 8, '#b8c0d0');
        b.set(6, 12, '#ffd25e');
        b.set(10, 12, '#ffd25e');
        b.set(8, 14, '#ff5fa2');
        b.rect(5 + step, 21, 2, 2, '#6a7088');
        b.rect(10 - step, 21, 2, 2, '#6a7088');
        b.line(13, 17, 15, 12, '#6a7088');
        b.rect(7, 16, 3, 1, '#e8c050');
      };
      const fs = mk(f);
      sheet = { down: fs, up: fs, left: fs, right: fs.map((c) => G.flipX(c)) };
    } else if (kind === 'mother' || kind === 'radio') {
      const f = (b, fr) => {
        b.ell(8, 12, 6, 6, '#102860');
        b.ell(8, 12, 4, 4, '#4ef0ff');
        b.ell(8, 12, 2, 2, '#ffffff');
      };
      const fs = mk(f);
      sheet = { down: fs, up: fs, left: fs, right: fs };
    }
    spCache[kind] = sheet;
    return sheet;
  };

  // ---------- プレイヤー ----------
  class Player extends Ent {
    constructor() {
      super();
      this.isPlayer = true;
      this.id = 'player';
      this.charId = 'kanata';
      this.atkT = 0;
      this.combo = 0;
      this.comboQ = false;
      this.dashT = 0;
      this.dashCd = 0;
      this.shotCd = 0;
      this.skillCd = 0;
      this.setMech(false);
    }
    setChar(id) {
      this.charId = id;
      if (!this.isMech) this.sheet = G.charSheet(G.chars[id].spr);
    }
    setMech(on, mechId) {
      this.isMech = !!on;
      if (on) {
        const id = mechId || G.state.mech.id;
        this.mechId = id;
        this.sheet = G.mechSheet(G.MECHS[id.replace(/2$/, '')] || G.MECHS.ponkotsu);
        this.w = 16;
        this.fh = 10;
        this.bodyH = 34;
        const ms = G.mechStats();
        if (G.state.mech.hp == null || G.state.mech.hp > ms.maxhp) G.state.mech.hp = ms.maxhp;
        this.en = ms.maxen;
      } else {
        this.sheet = G.charSheet(G.chars[this.charId || 'kanata'].spr);
        this.w = 10;
        this.fh = 6;
        this.bodyH = 20;
      }
    }
    get hp() {
      return this.isMech ? G.state.mech.hp : G.state.hp;
    }
    set hp(v) {
      if (this.isMech) G.state.mech.hp = v;
      else G.state.hp = v;
    }
    get maxhp() {
      return this.isMech ? G.mechStats().maxhp : G.stats().maxhp;
    }
    get enVal() {
      return this.isMech ? this.en : G.state.en;
    }
    set enVal(v) {
      if (this.isMech) this.en = v;
      else G.state.en = v;
    }
    get maxen() {
      return this.isMech ? G.mechStats().maxen : G.stats().maxen;
    }
    frontPoint(dist) {
      const [vx, vy] = DIRV[this.dir];
      return [this.x + vx * dist, this.y - 4 + vy * dist];
    }
    update() {
      this.updateCommon();
      if (this.path && this.path.length) {
        this.stepPath();
        this.animate(true, this.isMech ? 9 : 8);
        this.moving = true;
        return;
      }
      const f = G.field;
      const I = G.input;
      const locked = (G.ev.running && !(f.battle && f.battle.active)) || G.ui.blocking() || f.transition || f.downing;
      if (this.dashCd > 0) this.dashCd--;
      if (this.shotCd > 0) this.shotCd--;
      if (this.skillCd > 0) this.skillCd--;
      // EN自然回復
      if (this.isMech) {
        if (this.dashT <= 0) this.en = Math.min(this.maxen, this.en + 0.3);
      } else if (G.frame % 20 === 0 && G.state.en < G.stats().maxen && f.inCombat()) G.state.en = Math.min(G.stats().maxen, G.state.en + 1);
      else if (G.frame % 6 === 0 && G.state.en < G.stats().maxen && !f.inCombat()) G.state.en++;

      let moving = false;
      if (this.dashT > 0) {
        this.dashT--;
        const [vx, vy] = this.dashV;
        this.move(vx, vy);
        moving = true;
        if (G.frame % 2 === 0) G.fx.afterimage(this);
        if (this.isMech && G.frame % 2 === 0) G.fx.thrust(this.x - vx * 3, this.y - 10 - vy * 3);
      } else if (this.atkT > 0) {
        this.atkT--;
        this.updateAttack();
        if (I.pressed('ok')) this.comboQ = true;
        if (this.atkT === 0) {
          this.frame = 0;
          if (this.comboQ && this.combo < 3 && !locked) {
            this.comboQ = false;
            this.startAttack();
          } else this.combo = 0;
        }
      } else if (!locked) {
        const [ax, ay] = I.axis();
        const st = this.isMech ? G.mechStats() : G.stats();
        let sp = st.spd * (this.isMech ? 1 : 1);
        if (ax || ay) {
          const n = ax && ay ? Math.SQRT1_2 : 1;
          if (!this.aimLock) this.dir = ay && !ax ? (ay < 0 ? 'up' : 'down') : ax && !ay ? (ax < 0 ? 'left' : 'right') : this.dir === 'up' || this.dir === 'down' ? (ay < 0 ? 'up' : 'down') : ax < 0 ? 'left' : 'right';
          moving = this.move(ax * sp * n, ay * sp * n);
          if (!moving) moving = true;
        }
        if (I.pressed('ok')) {
          if (!f.tryInteract()) this.startAttack();
        }
        if (this.isMech && I.down('ok') && this.shotCd <= 0 && this.atkT <= 0 && !I.pressed('ok') && this.holdShot) this.shoot();
        this.holdShot = I.down('ok');
        if (I.pressed('cancel')) this.dash();
        if (I.pressed('skill')) this.skill();
      }
      if (this.aimT > 0) {
        this.aimT--;
        this.frame = 3;
      } else if (this.atkT <= 0) this.animate(moving, this.isMech ? 9 : 8);
      this.moving = moving;
      if (moving && this.isMech && this.frame !== this._lastF && (this.frame === 1 || this.frame === 2)) {
        G.audio.se('mechstep');
        G.fx.dust(this.x, this.y);
        if (!G.field.mapDef().space) G.field.shake = Math.max(G.field.shake, 1);
      }
      this._lastF = this.frame;
    }
    startAttack() {
      if (this.isMech) {
        this.shoot();
        return;
      }
      this.combo++;
      this.atkT = 16;
      this.hitDone = new Set();
      this.frame = 3;
      G.audio.se('swing');
      const col = this.combo === 3 ? '#ffd25e' : '#e8f4ff';
      G.fx.slash(this.x, this.y - 8, this.dir, col, this.combo === 3);
    }
    updateAttack() {
      if (this.isMech) return;
      const t = 16 - this.atkT;
      if (t >= 2 && t <= 8) {
        const [px, py] = this.frontPoint(13);
        const st = G.stats();
        const mult = this.combo === 3 ? 1.6 : 1;
        for (const e of G.field.enemies()) {
          if (this.hitDone.has(e)) continue;
          const b = e.body();
          const ex = G.clamp(px, b.x, b.x + b.w),
            ey = G.clamp(py, b.y, b.y + b.h);
          if (Math.hypot(ex - px, ey - py) < 16) {
            this.hitDone.add(e);
            G.combat.hitEnemy(e, Math.floor(st.atk * mult * G.rand(0.9, 1.15)), this.x, this.y, { kb: this.combo === 3 ? 5 : 2.5 });
          }
        }
        // 破壊可能オブジェクト
        G.field.hitBreakables(px, py, 14);
      }
    }
    dash() {
      if (this.dashCd > 0) return;
      let [ax, ay] = G.input.axis();
      if (!ax && !ay) [ax, ay] = DIRV[this.dir];
      const n = ax && ay ? Math.SQRT1_2 : 1;
      if (this.isMech) {
        if (this.en < 12) {
          G.audio.se('buzz');
          return;
        }
        this.en -= 12;
        this.dashV = [ax * n * 5.2, ay * n * 5.2];
        this.dashT = 14;
        this.dashCd = 22;
        this.invT = Math.max(this.invT, 10);
        G.audio.se('boost');
      } else {
        this.dashV = [ax * n * 3.6, ay * n * 3.6];
        this.dashT = 10;
        this.dashCd = 28;
        this.invT = Math.max(this.invT, 8);
        G.audio.se('dash');
      }
      this.atkT = 0;
      this.combo = 0;
    }
    nearestEnemy(range) {
      let best = null,
        bd = range;
      for (const e of G.field.enemies()) {
        if (e.untargetable) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      return best;
    }
    shoot() {
      if (this.shotCd > 0) return;
      if (this.en < 3) {
        G.audio.se('buzz');
        this.shotCd = 20;
        return;
      }
      this.en -= 3;
      this.shotCd = 10;
      const t = this.nearestEnemy(230);
      let ang;
      if (t) {
        const b = t.body();
        ang = Math.atan2(b.cy - (this.y - 22), t.x - this.x);
        this.dir = G.dirFromVec(Math.cos(ang), Math.sin(ang));
      } else {
        const [vx, vy] = DIRV[this.dir];
        ang = Math.atan2(vy, vx);
      }
      const ms = G.mechStats();
      const sx = this.x + Math.cos(ang) * 14,
        sy = this.y - 22 + Math.sin(ang) * 10;
      G.field.add(new Projectile({ x: sx, y: sy, vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7, team: 'player', dmg: ms.beam, kind: 'beam', col: this.mechId === 'ponkotsu' ? '#ffd25e' : '#7af8ff', life: 45 }));
      G.fx.muzzle(sx, sy, '#bff8ff');
      G.audio.se(this.mechId === 'ponkotsu' ? 'shot' : 'beam');
      this.aimT = 8;
      this.frame = 3;
    }
    skill() {
      if (this.isMech) {
        // 近接（ヒートスパナ / ビームサーベル）
        if (this.skillCd > 0) return;
        const ms = G.mechStats();
        const od = G.state.skills.includes('overdrive') && this.en >= this.maxen - 1;
        this.skillCd = od ? 50 : 26;
        this.frame = 4;
        this.aimT = 14;
        const t = this.nearestEnemy(70);
        if (t) this.dir = G.dirFromVec(t.x - this.x, t.y - this.y);
        G.audio.se('saber');
        if (od) {
          this.en = 0;
          G.fx.ring(this.x, this.y - 18, 70, '#ff5fa2');
          G.field.flash = 6;
          for (const e of G.field.enemies()) if (Math.hypot(e.x - this.x, e.y - this.y) < 80) G.combat.hitEnemy(e, Math.floor(ms.atk * 3.2), this.x, this.y, { kb: 8 });
          return;
        }
        // 前方へ踏み込み
        const [vx, vy] = DIRV[this.dir];
        this.dashV = [vx * 3, vy * 3];
        this.dashT = 6;
        const [px, py] = [this.x + vx * 24, this.y - 18 + vy * 18];
        G.fx.slash(px - vx * 6, py + 8, this.dir, this.mechId === 'ponkotsu' ? '#ff8a30' : '#ff79c6', true, 2);
        setTimeout(() => {}, 0);
        for (const e of G.field.enemies()) {
          const b = e.body();
          if (Math.hypot(G.clamp(px, b.x, b.x + b.w) - px, G.clamp(py, b.y, b.y + b.h) - py) < 30) G.combat.hitEnemy(e, Math.floor(ms.atk * G.rand(0.95, 1.15)), this.x, this.y, { kb: 6 });
        }
        return;
      }
      if (!G.state.skills.includes('spark')) return;
      if (G.state.skills.includes('echo') && G.input.down('up') && G.input.down('down')) return;
      if (G.state.en < 8 || this.skillCd > 0) {
        G.audio.se('buzz');
        return;
      }
      G.state.en -= 8;
      this.skillCd = 30;
      G.audio.se('charge');
      G.fx.ring(this.x, this.y - 8, 44, '#7af8ff');
      G.fx.sparks(this.x, this.y - 8, 16, '#bff8ff');
      const st = G.stats();
      for (const e of G.field.enemies()) if (Math.hypot(e.x - this.x, e.y - this.y) < 46) G.combat.hitEnemy(e, Math.floor(st.atk * 1.3), this.x, this.y, { kb: 4, stun: 40 });
      // エコー・シールド（スパーク時に一定確率で発動ではなく、習得後は無敵時間を付与）
      if (G.state.skills.includes('echo')) {
        this.invT = 50;
        G.fx.ring(this.x, this.y - 8, 30, '#ff9ac8');
      }
    }
  }
  G.Player = Player;

  // ---------- 弾 ----------
  class Projectile extends Ent {
    constructor(o) {
      super(o);
      this.isProjectile = true;
      this.solid = false;
      this.life = o.life || 90;
      this.r = o.r || (o.kind === 'orb' ? 4 : 3);
      this.shadow = false;
      this.trail = [];
    }
    update() {
      this.trail.push([this.x, this.y]);
      if (this.trail.length > 6) this.trail.shift();
      if (this.homing && this.team === 'enemy') {
        const p = G.field.player;
        const a = Math.atan2(p.y - 18 - this.y, p.x - this.x),
          cur = Math.atan2(this.vy, this.vx);
        let da = a - cur;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const na = cur + G.clamp(da, -this.homing, this.homing),
          sp = Math.hypot(this.vx, this.vy);
        this.vx = Math.cos(na) * sp;
        this.vy = Math.sin(na) * sp;
      }
      if (this.accel) {
        this.vx *= this.accel;
        this.vy *= this.accel;
      }
      this.x += this.vx;
      this.y += this.vy;
      if (--this.life <= 0) this.dead = true;
      const f = G.field;
      if (!this.through && f.map.isSolid(Math.floor(this.x / 16), Math.floor((this.y + (this.team === 'player' ? 18 : 12)) / 16)) && !f.mapDef().space) {
        this.dead = true;
        G.fx.sparks(this.x, this.y, 4, this.col);
        return;
      }
      if (this.team === 'player') {
        for (const e of f.enemies()) {
          const b = e.body();
          if (this.x > b.x - this.r && this.x < b.x + b.w + this.r && this.y > b.y - this.r && this.y < b.y + b.h + this.r) {
            G.combat.hitEnemy(e, this.dmg, this.x - this.vx * 3, this.y - this.vy * 3, { kb: 2, proj: true });
            G.fx.sparks(this.x, this.y, 6, this.col);
            if (!this.pierce) {
              this.dead = true;
              return;
            }
          }
        }
      } else {
        const p = f.player;
        const b = p.body();
        if (this.x > b.x - this.r && this.x < b.x + b.w + this.r && this.y > b.y - this.r && this.y < b.y + b.h + this.r) {
          if (G.combat.hitPlayer(this.dmg, this.x - this.vx * 3, this.y - this.vy * 3)) {
            G.fx.sparks(this.x, this.y, 5, this.col);
            this.dead = true;
          }
        }
        // 味方NPC機体（ゼフィールなど）
        for (const a of f.allies) {
          if (a.dead) continue;
          const ab = a.body();
          if (this.x > ab.x && this.x < ab.x + ab.w && this.y > ab.y && this.y < ab.y + ab.h) {
            a.flashT = 4;
            this.dead = true;
          }
        }
      }
    }
    draw(c, ox, oy) {
      const x = Math.round(this.x + ox),
        y = Math.round(this.y + oy);
      const col = this.col || '#ffd25e';
      c.globalCompositeOperation = 'lighter';
      if (this.kind === 'beam') {
        for (let i = 0; i < this.trail.length; i++) {
          const [tx, ty] = this.trail[i];
          c.fillStyle = G.rgba(col, 0.15 + i * 0.1);
          c.fillRect(Math.round(tx + ox) - 1, Math.round(ty + oy) - 1, 3, 3);
        }
        G.glow(c, x, y, 10, G.rgba(col, 0.6));
        c.fillStyle = '#ffffff';
        c.fillRect(x - 2, y - 1, 4, 3);
        c.fillRect(x - 1, y - 2, 3, 5);
      } else if (this.kind === 'orb' || this.kind === 'bullet') {
        G.glow(c, x, y, this.r * 3, G.rgba(col, 0.5));
        c.fillStyle = col;
        c.fillRect(x - this.r + 1, y - this.r + 1, this.r * 2 - 1, this.r * 2 - 1);
        c.fillStyle = '#ffffff';
        c.fillRect(x - 1, y - 1, 2, 2);
      } else if (this.kind === 'fire') {
        G.glow(c, x, y, 9, 'rgba(255,120,40,0.6)');
        c.fillStyle = '#ffd25e';
        c.fillRect(x - 2, y - 2, 4, 4);
      } else if (this.kind === 'laser') {
        c.strokeStyle = G.rgba(col, 0.8);
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x - this.vx * 3, y - this.vy * 3);
        c.lineTo(x, y);
        c.stroke();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
    }
  }
  G.Projectile = Projectile;

  // ---------- 拾えるもの ----------
  class Pickup extends Ent {
    constructor(o) {
      super(o);
      this.solid = false;
      this.shadow = false;
      this.t = 0;
      this.vz = o.pop ? 2.4 : 0;
      this.life = o.life || (o.persistent ? Infinity : 900);
    }
    update() {
      this.t++;
      if (this.vz || this.z > 0) {
        this.z += this.vz;
        this.vz -= 0.2;
        if (this.z <= 0) {
          this.z = 0;
          this.vz = Math.abs(this.vz) > 0.8 ? -this.vz * 0.4 : 0;
        }
      }
      if (--this.life <= 0) this.dead = true;
      const p = G.field.player;
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (this.kind === 'money' || this.kind === 'heal') {
        if (d < 40 && this.t > 20) {
          this.x += ((p.x - this.x) / d) * 2.5;
          this.y += ((p.y - this.y) / d) * 2.5;
        }
      }
      if (d < 10 && this.t > 15) this.collect();
    }
    collect() {
      this.dead = true;
      if (this.kind === 'money') {
        G.state.money += this.n;
        G.audio.se('coin');
        G.fx.text(this.x, this.y - 12, '+' + this.n + 'C', '#ffd25e');
      } else if (this.kind === 'heal') {
        const p = G.field.player;
        p.hp = Math.min(p.maxhp, p.hp + this.n);
        G.audio.se('heal');
        G.fx.text(this.x, this.y - 12, '+' + this.n, '#7dff9a');
      } else if (this.kind === 'item') {
        G.addItemCount(this.item, this.n || 1);
        G.audio.se('pickup');
        G.ui.toast(G.ITEMS[this.item].name + (this.n > 1 ? ' ×' + this.n : '') + ' を手に入れた', '#7af8ff');
        if (this.flag) G.state.flags[this.flag] = true;
      }
    }
    draw(c, ox, oy) {
      const x = Math.round(this.x + ox),
        y = Math.round(this.y + oy - this.z - 4 + Math.sin(this.t * 0.1) * 1.5);
      if (this.life < 120 && Math.floor(this.life / 4) % 2) return;
      c.fillStyle = 'rgba(20,10,40,0.3)';
      c.fillRect(x - 3, Math.round(this.y + oy - 1), 6, 2);
      if (this.kind === 'money') {
        c.fillStyle = '#b08020';
        c.fillRect(x - 3, y - 3, 6, 6);
        c.fillStyle = '#ffd25e';
        c.fillRect(x - 2, y - 3, 4, 6);
        c.fillRect(x - 3, y - 2, 6, 4);
        c.fillStyle = '#fff4c0';
        c.fillRect(x - 1, y - 2, 1, 2);
      } else if (this.kind === 'heal') {
        c.fillStyle = '#ff5070';
        c.fillRect(x - 3, y - 1, 6, 2);
        c.fillRect(x - 1, y - 3, 2, 6);
      } else {
        // キラキラ（アイテム）
        const t = this.t;
        c.globalCompositeOperation = 'lighter';
        G.glow(c, x, y, 8, 'rgba(120,240,255,0.5)');
        c.fillStyle = '#ffffff';
        const s = 2 + Math.floor((t / 6) % 3);
        c.fillRect(x - s, y, s * 2 + 1, 1);
        c.fillRect(x, y - s, 1, s * 2 + 1);
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = this.item === 'memory' ? '#ff79c6' : '#7af8ff';
        c.fillRect(x - 1, y - 1, 3, 3);
      }
    }
  }
  G.Pickup = Pickup;
})();
