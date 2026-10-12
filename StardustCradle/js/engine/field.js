// =============================================================
//  field.js — フィールドシーン（マップ・カメラ・ライティング・戦闘）
// =============================================================
(function () {
  const F = (G.field = {
    map: null,
    ents: [],
    allies: [],
    player: null,
    followers: [],
    trail: [],
    cam: { x: 0, y: 0, tx: null, ty: null },
    shake: 0,
    hitstop: 0,
    flash: 0,
    damageFlash: 0,
    fade: 0,
    fadeCol: '#000000',
    tint: null,
    letterbox: 0,
    banner: null,
    battle: null,
    cg: null,
  });
  const LIGHT = G.makeCanvas(G.W, G.H);

  F.mapDef = () => (F.map ? F.map.def : {});
  F.enemies = () => F.ents.filter((e) => e.isEnemy && !e.dead);
  F.inCombat = () => F.enemies().some((e) => e.state !== 'idle');
  F.add = function (e) {
    F.ents.push(e);
    return e;
  };
  F.get = function (id) {
    if (id === 'player') return F.player;
    return F.ents.find((e) => e.id === id && !e.dead) || F.allies.find((e) => e.id === id);
  };

  // ---------- マップ読み込み ----------
  F.load = function (id, tx, ty, dir, opt) {
    opt = opt || {};
    const def = G.MAPS[id];
    if (!def) throw new Error('map not found: ' + id);
    F.map = new G.GameMap(def);
    F.ents = [];
    F.allies = [];
    G.fx.clear();
    if (!F.player) F.player = new G.Player();
    const p = F.player;
    p.setMech(opt.mech !== undefined ? opt.mech : !!def.mech, opt.mechId);
    p.x = tx * 16 + 8;
    p.y = ty * 16 + 14;
    p.dir = dir || p.dir || 'down';
    p.kx = p.ky = 0;
    p.dashT = 0;
    p.atkT = 0;
    p.invT = 30;
    // 壁の中に置かれたら近くの歩ける場所へ
    if (F.map.isSolid(tx, ty)) {
      let found = false;
      for (let r = 1; r < 8 && !found; r++)
        for (let dy = -r; dy <= r && !found; dy++)
          for (let dx = -r; dx <= r && !found; dx++)
            if (!F.map.isSolid(tx + dx, ty + dy)) {
              p.x = (tx + dx) * 16 + 8;
              p.y = (ty + dy) * 16 + 14;
              found = true;
            }
      if (G.debug || found) console.warn('player start on solid tile', id, tx, ty);
    }
    F.ents.push(p);
    // 仲間
    F.followers = [];
    if (!p.isMech && !def.noParty && !opt.noParty)
      G.state.party.forEach((cid, i) => {
        const fo = new G.Follower(cid, i);
        fo.x = p.x;
        fo.y = p.y;
        fo.dir = p.dir;
        fo.fighter = cid === 'ruu' || cid === 'kyosuke' || cid === 'sig';
        F.followers.push(fo);
        F.ents.push(fo);
      });
    F.trail = [];
    for (let i = 0; i < 80; i++) F.trail.push([p.x, p.y, p.dir]);
    // NPC
    F.map.npcs.forEach((n) => {
      if (n.show && !n.show()) return;
      F.ents.push(new G.NPC(n));
    });
    // 敵
    if (!opt.noEnemies)
      F.map.enemies.forEach((e) => {
        if (e.show && !e.show()) return;
        if (e.id && G.state.flags['k_' + e.id]) return;
        const en = new G.Enemy(e.type, e.x * 16 + 8, e.y * 16 + 14, e);
        if (e.id) en.flag = 'k_' + e.id;
        F.ents.push(en);
      });
    // 落ちているアイテム
    F.map.items.forEach((it) => {
      const fl = 'item_' + id + '_' + (it.id || it.x + '_' + it.y);
      if (G.state.flags[fl]) return;
      if (it.show && !it.show()) return;
      F.ents.push(new G.Pickup({ x: it.x * 16 + 8, y: it.y * 16 + 12, kind: 'item', item: it.item, n: it.n || 1, flag: fl, persistent: true, onPick: it.onPick }));
    });
    F.lastTile = [p.tx, p.ty];
    F.arrivalTile = [p.tx, p.ty];
    F.camSnap();
    if (!opt.keepBgm && def.bgm !== undefined) G.audio.bgm(typeof def.bgm === 'function' ? def.bgm() : def.bgm);
    if (!opt.silent) {
      F.banner = def.name ? { text: def.name, sub: def.area || '', t: 0 } : null;
      if (!F.battle) F.checkpoint();
    }
    G.state.map = id;
  };
  F.checkpoint = function () {
    const p = F.player;
    F.cp = JSON.stringify(Object.assign({}, G.state, { map: F.map.id, x: p.tx, y: p.ty, dir: p.dir }));
  };
  F.restoreCheckpoint = function () {
    if (!F.cp) return;
    G.state = Object.assign(G.newState(), JSON.parse(F.cp));
    const st = G.stats();
    G.state.hp = Math.max(G.state.hp, Math.floor(st.maxhp * 0.6));
    F.load(G.state.map, G.state.x, G.state.y, G.state.dir);
    G.ev.runMapEnter();
  };

  // ---------- カメラ ----------
  F.camTarget = function () {
    const p = F.player;
    let x = p.x - G.W / 2,
      y = p.y - 12 - G.H / 2;
    if (F.cam.fx !== undefined && F.cam.fx !== null) {
      x = F.cam.fx - G.W / 2;
      y = F.cam.fy - G.H / 2;
    } else if (F.battle && F.battle.active) {
      // ボス戦ではカメラをボス側に寄せる
      const boss = F.ents.find((e) => e.isEnemy && e.boss && !e.dead);
      if (boss) {
        x += G.clamp((boss.x - p.x) * 0.35, -120, 120);
        y += G.clamp((boss.y - 30 - p.y) * 0.35, -70, 70);
      }
    }
    const mw = F.map.w * 16,
      mh = F.map.h * 16;
    x = mw <= G.W ? (mw - G.W) / 2 : G.clamp(x, 0, mw - G.W);
    y = mh <= G.H ? (mh - G.H) / 2 : G.clamp(y, 0, mh - G.H);
    return [x, y];
  };
  F.camSnap = function () {
    const [x, y] = F.camTarget();
    F.cam.x = x;
    F.cam.y = y;
  };

  // ---------- 更新 ----------
  F.update = function () {
    G.state.play++;
    G.ui.update();
    if (G.ui.paused()) return;
    if (F.hitstop > 0) {
      F.hitstop--;
      return;
    }
    if (!G.ui.blocking() && (!G.ev.running || (F.battle && F.battle.active)) && !F.transition && G.input.pressed('menu')) {
      G.ui.openMenu();
      return;
    }
    for (const e of F.ents) if (!e.dead) e.update();
    for (const a of F.allies) if (!a.dead) a.update();
    F.ents = F.ents.filter((e) => !e.dead || e.isPlayer);
    const p = F.player;
    // 足跡（仲間用）
    const last = F.trail[0];
    if (Math.hypot(last[0] - p.x, last[1] - p.y) > 1) {
      F.trail.unshift([p.x, p.y, p.dir]);
      if (F.trail.length > 90) F.trail.pop();
    }
    // タイル移動チェック
    const tx = p.tx,
      ty = p.ty;
    if (tx !== F.lastTile[0] || ty !== F.lastTile[1]) {
      F.lastTile = [tx, ty];
      if (F.arrivalTile && (tx !== F.arrivalTile[0] || ty !== F.arrivalTile[1])) F.arrivalTile = null;
      if (!G.ev.running && !F.battle) F.onStep(tx, ty);
    }
    // カメラ
    const [cx, cy] = F.camTarget();
    F.cam.x += (cx - F.cam.x) * (F.cam.fx != null ? 0.06 : 0.16);
    F.cam.y += (cy - F.cam.y) * (F.cam.fx != null ? 0.06 : 0.16);
    if (Math.abs(cx - F.cam.x) < 0.3) F.cam.x = cx;
    if (Math.abs(cy - F.cam.y) < 0.3) F.cam.y = cy;
    if (F.shake > 0) F.shake *= 0.86;
    if (F.shake < 0.3) F.shake = 0;
    if (F.flash > 0) F.flash--;
    if (F.damageFlash > 0) F.damageFlash--;
    G.fx.update();
    F.ambient();
    if (F.banner) F.banner.t++;
    if (F.battle) F.checkBattle();
  };

  F.onStep = function (tx, ty) {
    const def = F.mapDef();
    // ワープ
    if (!F.arrivalTile)
      for (const w of F.map.warps) {
        if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) {
          if (w.show && !w.show()) continue;
          if (w.cond && !w.cond()) {
            if (w.blocked) G.ev.run(w.blocked);
            continue;
          }
          G.ev.run(async () => {
            if (w.se || w.door) G.audio.se(w.se || 'door');
            await G.ev.warp(w.to, w.tx, w.ty, w.dir);
          });
          return;
        }
      }
    // ステップイベント
    for (const ev of F.map.events) {
      const w = ev.w || 1,
        h = ev.h || 1;
      if (tx >= ev.x && tx < ev.x + w && ty >= ev.y && ty < ev.y + h) {
        if (ev.once && G.state.flags[ev.once]) continue;
        if (ev.cond && !ev.cond()) continue;
        if (ev.once) G.state.flags[ev.once] = true;
        G.ev.run(ev.run);
        return;
      }
    }
  };

  F.tryInteract = function () {
    const p = F.player;
    const [fx, fy] = p.frontPoint(12);
    // NPC
    let best = null,
      bd = 15;
    for (const e of F.ents) {
      if (!(e instanceof G.NPC) || !e.talk || !e.visible) continue;
      const d = Math.hypot(e.x - fx, e.y - 4 - fy);
      if (d < bd + (e.isMech ? 10 : 0)) {
        bd = d;
        best = e;
      }
    }
    // カウンター越し：正面のタイルが壁/台なら、もう1マス先のNPCにも話しかけられる
    if (!best) {
      const [fx2, fy2] = p.frontPoint(28);
      const [fx1, fy1] = p.frontPoint(14);
      if (F.map.isSolid(Math.floor(fx1 / 16), Math.floor((fy1 + 2) / 16)))
        for (const e of F.ents) {
          if (!(e instanceof G.NPC) || !e.talk || !e.visible) continue;
          if (Math.hypot(e.x - fx2, e.y - 4 - fy2) < 15) best = e;
        }
    }
    if (best) {
      const npc = best;
      G.ev.run(async () => {
        const old = npc.dir;
        if (!npc.def.noFace) npc.faceTo(p);
        await npc.talk(npc);
        if (npc.def.move === 'still' && !npc.def.keepFace) npc.dir = npc.def.dir || old;
      });
      return true;
    }
    const tx = Math.floor(fx / 16),
      ty = Math.floor((fy + 2) / 16);
    const def = F.mapDef();
    for (const ck of F.map.checks) {
      const w = ck.w || 1,
        h = ck.h || 1;
      if (tx >= ck.x && tx < ck.x + w && ty >= ck.y && ty < ck.y + h) {
        if (ck.show && !ck.show()) continue;
        G.ev.run(ck.run || (async () => await G.ev.say(null, typeof ck.text === 'function' ? ck.text() : ck.text)));
        return true;
      }
    }
    for (const ob of F.map.objs) {
      const d = ob.def;
      if (!d.talk && !d.msg && ob.type !== 'save') continue;
      if (tx >= ob.tx && tx < ob.tx + ob.data.w && ty >= ob.ty && ty < ob.ty + ob.data.h) {
        if (ob.type === 'save' && !d.talk) G.ev.run(() => G.ev.savePoint());
        else G.ev.run(d.talk || (async () => await G.ev.say(null, d.msg)));
        return true;
      }
    }
    return false;
  };
  F.hitBreakables = function () {};

  // ---------- 環境パーティクル ----------
  F.ambient = function () {
    const def = F.mapDef();
    const a = def.ambient;
    if (!a) return;
    if (a === 'petals' && G.frame % 14 === 0) G.fx.petals(F.cam);
    if (a === 'leaves' && G.frame % 24 === 0) G.fx.petals(F.cam, G.pick(['#7cc864', '#e0a040']));
    if (a === 'dust' && G.frame % 10 === 0) G.fx.dustMote(F.cam);
    if (a === 'neon' && G.frame % 12 === 0) G.fx.dustMote(F.cam, G.pick(['#ff5fa2', '#4ef0ff']));
    if (a === 'sparks' && G.frame % 30 === 0) G.fx.sparks(F.cam.x + G.rand(0, G.W), F.cam.y + G.rand(0, G.H * 0.6), 6, '#ffd25e');
    if (a === 'echo' && G.frame % 8 === 0) G.fx.dustMote(F.cam, G.pick(['#bff8ff', '#ffc0e0']));
    if (a === 'snow' && G.frame % 4 === 0) G.fx.add({ x: F.cam.x + G.rand(0, G.W + 40), y: F.cam.y - 4, vx: -0.3, vy: G.rand(0.4, 0.9), col: '#ffffff', size: 1, life: 400 });
    // 小物の湯気・ホログラム
    if (G.frame % 10 === 0)
      for (const ob of F.map.objs) {
        if (ob.data.steam) G.fx.steam(ob.tx * 16 + ob.data.steam[0], ob.ty * 16 + ob.data.steam[1]);
        if (ob.data.holo) G.fx.holo(ob.tx * 16 + 8, ob.ty * 16 - 4);
        if (ob.data.fountain && G.frame % 20 === 0)
          for (let i = 0; i < 4; i++) G.fx.add({ x: ob.tx * 16 + ob.data.fountain[0], y: ob.ty * 16 + ob.data.fountain[1] - 12, vx: G.rand(-0.8, 0.8), vy: G.rand(-1.6, -0.8), grav: 0.08, col: '#bfe8ff', size: 1, life: 30 });
      }
  };

  // ---------- 時間帯 ----------
  const TIME = {
    morning: { amb: '#ffeedd', lights: false, over: 'rgba(255,200,150,0.06)' },
    day: { amb: null, lights: false },
    evening: { amb: '#ffb48a', lights: true, over: 'rgba(255,120,80,0.10)', la: 0.5 },
    night: { amb: '#3c3a7c', lights: true, la: 1 },
    dark: { amb: '#24203e', lights: true, la: 1 },
    alarm: { amb: '#7a2a4a', lights: true, la: 1 },
  };
  F.timeOf = function () {
    const def = F.mapDef();
    if (def.time) return typeof def.time === 'function' ? def.time() : def.time;
    if (def.outdoor) return G.state.time;
    return def.light ? 'custom' : 'day';
  };

  // ---------- 描画 ----------
  F.draw = function (c) {
    const def = F.mapDef();
    let sx = 0,
      sy = 0;
    if (F.shake > 0) {
      sx = G.rand(-F.shake, F.shake);
      sy = G.rand(-F.shake, F.shake);
    }
    const ox = -Math.round(F.cam.x + sx),
      oy = -Math.round(F.cam.y + sy);
    c.fillStyle = def.bg || '#0a0818';
    c.fillRect(0, 0, G.W, G.H);
    if (def.parallax) def.parallax(c, F.cam, G.frame);
    else if (def.space) G.PARALLAX.space(c, F.cam, G.frame);
    c.drawImage(F.map.ground, ox, oy);
    // 水面のきらめき
    if (F.map.waterCells.length) {
      c.fillStyle = 'rgba(255,255,255,0.45)';
      for (const [x, y] of F.map.waterCells) {
        const px = x * 16 + ox,
          py = y * 16 + oy;
        if (px < -16 || py < -16 || px > G.W || py > G.H) continue;
        const ph = (G.frame * 0.04 + x * 0.7 + y * 1.3) % 6;
        if (ph < 2) c.fillRect(px + ((x * 7 + Math.floor(G.frame / 20)) % 12), py + 8 + ((y * 5) % 6), 3, 1);
      }
    }
    // 影（ゴースト）
    G.fx.drawGhosts(c, ox, oy);
    // Yソート描画
    const list = [];
    for (const ob of F.map.objs) {
      const x = ob.px + ox,
        y = ob.py + oy;
      if (x > G.W + 8 || y > G.H + 8 || x + ob.data.img.width < -8 || y + ob.data.img.height < -8) continue;
      list.push({ y: ob.sortY, ob });
    }
    for (const e of F.ents) list.push({ y: e.y, e });
    for (const e of F.allies) list.push({ y: e.y, e });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.ob) {
        const ob = it.ob;
        let x = ob.px + ox;
        if (ob.data.sway) {
          // 木の揺れ（上半分だけずらす表現は省略し、ごく僅かに）
        }
        c.drawImage(ob.data.img, x, ob.py + oy);
      } else it.e.draw(c, ox, oy);
    }
    if (def.overlay) def.overlay(c, ox, oy, G.frame);
    G.fx.draw(c, ox, oy);
    // ライティング
    F.drawLighting(c, ox, oy);
    if (def.post) def.post(c, ox, oy, G.frame);
    // カットシーンの上下黒帯
    const lbT = G.ev.cutscene ? 1 : 0;
    F.letterbox += (lbT - F.letterbox) * 0.15;
    if (F.letterbox > 0.01) {
      const h = Math.round(F.letterbox * 18);
      c.fillStyle = '#000';
      c.fillRect(0, 0, G.W, h);
      c.fillRect(0, G.H - h, G.W, h);
    }
    // 被ダメージの赤
    if (F.damageFlash > 0) {
      const g = c.createRadialGradient(G.W / 2, G.H / 2, G.H * 0.3, G.W / 2, G.H / 2, G.W * 0.7);
      g.addColorStop(0, 'rgba(255,0,40,0)');
      g.addColorStop(1, `rgba(255,0,40,${F.damageFlash / 20})`);
      c.fillStyle = g;
      c.fillRect(0, 0, G.W, G.H);
    }
    if (F.tint) {
      c.fillStyle = F.tint;
      c.fillRect(0, 0, G.W, G.H);
    }
    if (F.flash > 0) {
      c.fillStyle = `rgba(255,255,255,${Math.min(1, F.flash / 8)})`;
      c.fillRect(0, 0, G.W, G.H);
    }
    // ボスHPバー（低解像度）
    const boss = F.enemies().find((e) => e.boss);
    if (boss && !G.ev.cutscene) {
      const w = 220,
        x = (G.W - w) / 2,
        y = G.H - 18;
      c.fillStyle = 'rgba(10,6,24,0.8)';
      c.fillRect(x - 2, y - 2, w + 4, 9);
      G.bar(c, x, y, w, 5, boss.hp, boss.maxhp, boss.hp / boss.maxhp < 0.3 ? '#ff3050' : '#ff8a30');
    }
    if (F.cg) G.drawCG(c, F.cg);
    if (F.fade > 0) {
      c.globalAlpha = Math.min(1, F.fade);
      c.fillStyle = F.fadeCol;
      c.fillRect(0, 0, G.W, G.H);
      c.globalAlpha = 1;
    }
    G.ui.draw(c);
  };

  F.drawLighting = function (c, ox, oy) {
    const def = F.mapDef();
    const tm = F.timeOf();
    let amb, lightsOn, la;
    if (tm === 'custom') {
      amb = def.light;
      lightsOn = true;
      la = def.lightAlpha || 0.8;
    } else {
      const T = TIME[tm] || TIME.day;
      amb = T.amb;
      lightsOn = T.lights;
      la = T.la || 0.6;
      if (T.over) {
        c.fillStyle = T.over;
        c.fillRect(0, 0, G.W, G.H);
      }
    }
    if (!amb) {
      // 昼でもネオン類はうっすら光る
      c.globalCompositeOperation = 'lighter';
      for (const l of F.map.lights) {
        if (l.night) continue;
        const x = l.x + ox,
          y = l.y + oy;
        if (x < -l.r || y < -l.r || x > G.W + l.r || y > G.H + l.r) continue;
        G.glow(c, x, y, l.r * 0.5, G.rgba(l.col, 0.18));
      }
      c.globalCompositeOperation = 'source-over';
      return;
    }
    const lc = LIGHT.ctx;
    lc.globalCompositeOperation = 'source-over';
    lc.fillStyle = amb;
    lc.fillRect(0, 0, G.W, G.H);
    if (lightsOn) {
      lc.globalCompositeOperation = 'lighter';
      const t = G.frame;
      for (const l of F.map.lights) {
        const x = l.x + ox,
          y = l.y + oy;
        if (x < -l.r || y < -l.r || x > G.W + l.r || y > G.H + l.r) continue;
        let a = (l.a || 0.8) * la;
        if (l.flicker) a *= 0.85 + 0.15 * Math.sin(t * 0.3 + l.x) * (Math.random() < 0.02 ? 0 : 1);
        if (l.blink && Math.floor(t / 30) % 2) continue;
        G.glow(lc, x, y, l.r, G.rgba(l.col, a));
        if (l.cone) G.glow(lc, x, y + l.r * 0.9, l.r * 0.8, G.rgba(l.col, a * 0.6));
      }
      // プレイヤーと弾の光
      const p = F.player;
      G.glow(lc, p.x + ox, p.y - 10 + oy, p.isMech ? 60 : 44, 'rgba(255,240,220,0.45)');
      for (const e of F.ents) {
        if (e.isProjectile) G.glow(lc, e.x + ox, e.y + oy, 22, G.rgba(e.col || '#ffffff', 0.6));
        else if (e.d && e.d.glow) G.glow(lc, e.x + ox, e.y - 10 + oy, 30, G.rgba(e.d.glow, 0.5));
      }
      for (const fx of G.fx.list) if (fx.type === 'glowball') G.glow(lc, fx.x + ox, fx.y + oy, fx.size * 1.5, G.rgba(fx.col, 0.6 * (fx.life / fx.max)));
    }
    c.globalCompositeOperation = 'multiply';
    c.drawImage(LIGHT, 0, 0);
    c.globalCompositeOperation = 'source-over';
    // ネオンのブルーム
    if (lightsOn) {
      c.globalCompositeOperation = 'lighter';
      for (const l of F.map.lights) {
        if (l.night && !l.flicker) continue;
        const x = l.x + ox,
          y = l.y + oy;
        if (x < -l.r || y < -l.r || x > G.W + l.r || y > G.H + l.r) continue;
        G.glow(c, x, y, l.r * 0.6, G.rgba(l.col, 0.22 * la));
      }
      c.globalCompositeOperation = 'source-over';
    }
  };

  // ---------- 高解像度レイヤー（文字・HUD） ----------
  F.drawHi = function (c) {
    const showHud = !G.ev.cutscene && !F.cg && !G.ui.hideHud && F.fade < 0.5 && !F.mapDef().noHud;
    if (showHud) F.drawHud(c);
    // マップ名バナー
    if (F.banner && F.banner.t < 200 && !F.cg) {
      const t = F.banner.t;
      const a = t < 20 ? t / 20 : t > 160 ? (200 - t) / 40 : 1;
      c.globalAlpha = a;
      const w = Math.max(140, G.measure(c, F.banner.text, 13) + 50);
      const x = G.W / 2 - w / 2,
        y = 34;
      c.fillStyle = 'rgba(12,8,30,0.75)';
      c.fillRect(x, y, w, 26);
      c.fillStyle = G.UI.line;
      c.fillRect(x, y, w, 1);
      c.fillStyle = G.UI.line2;
      c.fillRect(x, y + 25, w, 1);
      G.drawText(c, F.banner.text, G.W / 2, y + 6, { size: 13, align: 'center' });
      c.globalAlpha = 1;
    }
    if (F.battle && F.battle.bannerT !== undefined) {
      const t = F.battle.bannerT++;
      if (t < 110) {
        const a = t < 10 ? t / 10 : t > 90 ? (110 - t) / 20 : 1;
        c.globalAlpha = a;
        c.fillStyle = 'rgba(10,6,24,0.7)';
        c.fillRect(0, G.H / 2 - 22, G.W, 44);
        c.fillStyle = F.battle.bannerCol || G.UI.line;
        c.fillRect(0, G.H / 2 - 22, G.W, 2);
        c.fillRect(0, G.H / 2 + 20, G.W, 2);
        const slide = t < 12 ? (12 - t) * 20 : 0;
        G.drawText(c, F.battle.bannerText, G.W / 2 + slide, G.H / 2 - 15, { size: 22, align: 'center', bold: true, color: '#ffffff' });
        if (F.battle.bannerSub) G.drawText(c, F.battle.bannerSub, G.W / 2 - slide, G.H / 2 + 8, { size: 9, align: 'center', color: G.UI.line2 });
        c.globalAlpha = 1;
      }
    }
    if (F.cg && F.cg.caption) G.drawCGCaption(c, F.cg);
    G.ui.drawHi(c);
    if (G.settings.crt) F.drawCRT(c);
  };
  F.drawHud = function (c) {
    const p = F.player;
    const s = G.state;
    const mech = p.isMech;
    G.panel(c, 4, 4, 128, 34, { accent: mech ? G.UI.line2 : G.UI.line });
    const name = mech ? (G.MECHS[p.mechId] || {}).name || '機体' : G.chars[p.charId].name;
    G.drawText(c, name, 10, 7, { size: 9, color: mech ? G.UI.line2 : '#ffffff' });
    G.drawText(c, 'Lv' + s.lv, 126, 7, { size: 9, align: 'right', color: G.UI.gold });
    G.drawText(c, mech ? 'AR' : 'HP', 10, 18, { size: 7, color: G.UI.dim });
    G.bar(c, 22, 19, 104, 6, p.hp, p.maxhp, p.hp / p.maxhp < 0.3 ? '#ff3050' : mech ? '#4ef0ff' : '#7dff9a');
    G.drawText(c, 'EN', 10, 27, { size: 7, color: G.UI.dim });
    G.bar(c, 22, 28, 104, 5, p.enVal, p.maxen, mech && p.enVal >= p.maxen - 1 && s.skills.includes('overdrive') ? '#ff5fa2' : '#ffd25e');
    // お金
    const mt = '¢ ' + s.money.toLocaleString();
    G.panel(c, G.W - 84, 4, 80, 16, {});
    G.drawText(c, mt, G.W - 10, 7, { size: 9, align: 'right', color: G.UI.gold });
    // 目的
    if (s.objective && !F.battle) {
      const ob = '▶ ' + s.objective;
      const w = G.measure(c, ob, 8) + 12;
      c.fillStyle = 'rgba(12,8,30,0.6)';
      c.fillRect(4, 41, w, 13);
      c.fillStyle = G.UI.line;
      c.fillRect(4, 41, 2, 13);
      G.drawText(c, ob, 10, 43, { size: 8, color: '#e8e4ff' });
    }
    // ボス名
    const boss = F.enemies().find((e) => e.boss);
    if (boss) G.drawText(c, boss.name, G.W / 2, G.H - 31, { size: 9, align: 'center', outline: '#140c22' });
    if (F.battle && F.battle.def.timer) {
      const left = Math.max(0, F.battle.def.timer - F.battle.t);
      G.drawText(c, 'TIME ' + Math.ceil(left / 60), G.W / 2, 8, { size: 12, align: 'center', color: G.UI.gold, outline: '#140c22' });
    }
    // 操作ヒント（最初だけ）
    if (s.play < 60 * 60 * 3 && !G.ev.running) {
      const hint = mech ? 'Z:ビーム  X:ブースト  C:近接  Esc:メニュー' : 'Z:話す/攻撃  X:ダッシュ  C:スキル  Esc:メニュー';
      G.drawText(c, hint, G.W - 6, G.H - 12, { size: 7, align: 'right', color: 'rgba(230,226,255,0.7)' });
    }
  };
  F.drawCRT = function (c) {
    c.fillStyle = 'rgba(0,0,0,0.10)';
    for (let y = 0; y < G.H; y += 2) c.fillRect(0, y + 1, G.W, 0.5);
    const g = c.createRadialGradient(G.W / 2, G.H / 2, G.H * 0.45, G.W / 2, G.H / 2, G.W * 0.65);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(10,0,30,0.35)');
    c.fillStyle = g;
    c.fillRect(0, 0, G.W, G.H);
  };

  // ---------- プレイヤー撃破 ----------
  F.playerDown = function () {
    if (F.downing) return;
    F.downing = true;
    const p = F.player;
    G.fx.explosion(p.x, p.y - 10, p.isMech);
    G.audio.se(p.isMech ? 'bigexplode' : 'kill');
    p.visible = false;
    G.ev.run(async () => {
      await G.waitFrames(50);
      if (F.battle && F.battle.def.canLose) {
        F.battle.lost = true;
        F.downing = false;
        p.visible = true;
        return;
      }
      G.audio.bgm('gameover');
      const r = await G.ui.gameOver();
      F.downing = false;
      p.visible = true;
      if (r === 'retry') {
        if (F.battle) F.battle.retry = true;
        else F.restoreCheckpoint();
      } else {
        F.battle = null;
        G.ui.toTitle();
      }
    });
  };

  // ---------- 戦闘 ----------
  // def: {map,x,y,mech,mechId,enemies:[{type,x,y,lv,hp,boss,name}],waves:[[...]],allies:[{mech,x,y,name,id}],
  //       bgm,canLose,win:'all'|'boss',timer,title,sub,party,onStart,onWave}
  F.battleStart = async function (def) {
    const p = F.player;
    const ret = { map: F.map.id, x: p.tx, y: p.ty, dir: p.dir, mech: p.isMech, bgm: G.audio.curId };
    const snap = JSON.stringify(G.state);
    for (;;) {
      F.battle = { def, t: 0, wave: 0, lost: false, won: false, retry: false };
      const bx = def.x !== undefined ? def.x : p.tx,
        by = def.y !== undefined ? def.y : p.ty;
      await G.ev.fadeOut(12);
      F.load(def.map || ret.map, bx, by, def.dir || 'up', { mech: !!def.mech, mechId: def.mechId, noEnemies: true, silent: true, keepBgm: true, noParty: def.party === false });
      if (p.isMech) G.state.mech.hp = G.mechStats().maxhp;
      F.spawnWave(def.waves ? def.waves[0] : def.enemies);
      (def.allies || []).forEach((a) => F.allies.push(new Ally(a)));
      G.audio.bgm(def.bgm || (def.mech ? 'mech' : 'battle'));
      await G.ev.fadeIn(12);
      F.battle.bannerT = 0;
      F.battle.bannerText = def.title || (def.mech ? 'ENGAGE!' : 'BATTLE!');
      F.battle.bannerSub = def.sub || '';
      if (def.onStart) await def.onStart();
      F.battle.active = true;
      await G.tasks.until(() => F.battle.won || F.battle.lost || F.battle.retry);
      if (F.battle.retry) {
        G.state = Object.assign(G.newState(), JSON.parse(snap));
        G.ui.closeAll();
        continue;
      }
      break;
    }
    const won = F.battle.won;
    F.battle.active = false;
    if (won) {
      F.battle.bannerT = 0;
      F.battle.bannerText = def.mech ? 'MISSION COMPLETE' : 'VICTORY!';
      F.battle.bannerSub = '';
      F.battle.bannerCol = G.UI.gold;
      G.audio.bgm('victory');
      await G.waitFrames(130);
      // 残った回収物を自動で拾う
      for (const e of F.ents) if (e instanceof G.Pickup && !e.persistent) e.collect();
    }
    if (def.after !== 'stay') {
      await G.ev.fadeOut(16);
      F.battle = null;
      if (def.returnTo) F.load(def.returnTo[0], def.returnTo[1], def.returnTo[2], def.returnTo[3] || 'down', { silent: true, keepBgm: false });
      else F.load(ret.map, ret.x, ret.y, ret.dir, { mech: ret.mech, silent: true, keepBgm: true });
      if (!def.returnTo) G.audio.bgm(ret.bgm, { restart: true });
      if (!won) {
        const st = G.stats();
        G.state.hp = Math.max(G.state.hp, Math.floor(st.maxhp * 0.5));
      }
      F.player.visible = true;
      if (!def.noFadeIn) await G.ev.fadeIn(16);
    } else F.battle = null;
    return won;
  };
  F.spawnWave = function (list) {
    (list || []).forEach((e) => {
      const en = new G.Enemy(e.type, e.x * 16 + 8, e.y * 16 + 14, e);
      en.aggro = e.aggro || 999;
      if (e.state !== 'idle') en.set(en.ai === 'mech' ? 'engage' : en.ai === 'drone' ? 'idle' : 'chase');
      F.add(en);
      if (e.warpIn !== false) G.fx.ring(en.x, en.y - 10, 26, '#ff5fa2');
    });
  };
  F.checkBattle = function () {
    const b = F.battle;
    if (b.won || b.lost || !b.active) return;
    b.t++;
    const def = b.def;
    const es = F.enemies();
    const bossAlive = es.some((e) => e.boss);
    let clear = def.win === 'boss' ? !bossAlive && b.t > 10 : es.length === 0 && b.t > 10;
    if (def.timer && b.t >= def.timer) clear = def.timerWin !== false;
    if (clear) {
      if (def.waves && b.wave < def.waves.length - 1) {
        b.wave++;
        F.spawnWave(def.waves[b.wave]);
        b.bannerT = 0;
        b.bannerText = 'WAVE ' + (b.wave + 1);
        b.bannerSub = '';
        if (def.onWave) G.ev.run(() => def.onWave(b.wave));
        return;
      }
      if (def.win === 'boss') for (const e of es) e.die();
      b.won = true;
    }
  };
  F.onEnemyKilled = function (e) {
    const def = F.mapDef();
    if (def.onKill) def.onKill(e);
  };

  // ---------- 味方機体（ゼフィール等） ----------
  class Ally extends G.Ent {
    constructor(a) {
      super();
      this.id = a.id || a.mech;
      this.name = a.name;
      this.isMech = !!a.mech;
      this.sheet = a.mech ? G.mechSheet(G.MECHS[a.mech]) : G.charSheet(G.chars[a.char].spr);
      if (this.isMech) {
        this.w = 16;
        this.fh = 10;
        this.bodyH = 34;
      }
      this.x = a.x * 16 + 8;
      this.y = a.y * 16 + 14;
      this.dmg = a.dmg || 10;
      this.col = a.col || '#7dff9a';
      this.cd = 40;
      this.solid = false;
      this.t = 0;
    }
    update() {
      this.updateCommon();
      this.t++;
      const es = F.enemies();
      let tgt = null,
        bd = 1e9;
      for (const e of es) {
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < bd) {
          bd = d;
          tgt = e;
        }
      }
      let moving = false;
      const p = F.player;
      const goal = tgt || p;
      const want = tgt ? 80 : 40;
      const dx = goal.x - this.x,
        dy = goal.y - this.y,
        d = Math.hypot(dx, dy) || 1;
      if (d > want + 10) {
        this.move((dx / d) * 1.7, (dy / d) * 1.7);
        moving = true;
      } else if (tgt) {
        this.move((-dy / d) * Math.sin(this.t * 0.02) * 1.2, (dx / d) * Math.sin(this.t * 0.02) * 1.2);
        moving = true;
      }
      this.dir = G.dirFromVec(dx, dy);
      if (--this.cd <= 0 && tgt && bd < 220) {
        this.cd = G.irand(30, 55);
        const b = tgt.body();
        const a = Math.atan2(b.cy - (this.y - 22), tgt.x - this.x);
        F.add(new G.Projectile({ x: this.x, y: this.y - 22, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, team: 'player', dmg: this.dmg, kind: 'beam', col: this.col, life: 45 }));
        G.audio.se('beam');
        this.frame = 3;
      } else this.animate(moving, 9);
      if (G.frame % 3 === 0 && this.isMech && this.sheet === G.mechSheet(G.MECHS.zephyr)) G.fx.add({ x: this.x + G.rand(-10, 10), y: this.y - 26, vx: 0, vy: 0.4, col: '#8ff8ff', size: 1, life: 20, glow: true });
    }
  }
  G.Ally = Ally;
})();
