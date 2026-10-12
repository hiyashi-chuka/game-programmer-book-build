// =============================================================
//  script.js — イベントスクリプトAPI（E.xxx）
// =============================================================
// ストーリーは async 関数で書く：
//   async () => { await E.say('ruu:smile', 'よっ'); await E.move('ruu', 'LLU'); }
(function () {
  const E = (G.ev = window.E = { running: 0, cutscene: false });
  const F = () => G.field;
  const UI = () => G.ui;

  E.reset = function () {
    E.running = 0;
    E.cutscene = false;
  };
  E.run = async function (fn) {
    E.running++;
    try {
      await fn();
    } catch (e) {
      console.error('event error', e);
    } finally {
      E.running = Math.max(0, E.running - 1);
      if (E.running === 0) {
        E.cutscene = false;
        G.input.clear();
      }
    }
  };
  E.cut = function (on) {
    E.cutscene = on !== false;
  };

  // ---------- 会話 ----------
  E.say = (who, text, opt) => UI().say(who, text, opt);
  E.talk = async function (list) {
    for (const l of list) await E.say(l[0], l[1], l[2]);
  };
  E.narr = (text) => UI().say(null, text);
  E.ask = async function (who, text, choices, opt) {
    const w = await UI().say(who, text, Object.assign({ keep: true }, opt || {}));
    const r = await UI().choice(choices, opt);
    UI().pop(w);
    return r;
  };
  E.choice = (choices, opt) => UI().choice(choices, opt);
  E.timing = (opt) => UI().timing(opt);
  E.notice = (text, opt) => UI().notice(text, opt);
  E.toast = (text, col) => UI().toast(text, col);

  // ---------- 待ち ----------
  E.wait = (n) => G.waitFrames(n || 30);
  E.waitPress = () => G.waitPress('ok');

  // ---------- 画面効果 ----------
  E.fadeOut = function (n, col) {
    n = n || 20;
    F().fadeCol = col || '#000000';
    const st = F().fade;
    let k = 0;
    return G.tasks.until(() => {
      k++;
      F().fade = Math.min(1, st + (k / n) * (1 - st));
      return k >= n;
    });
  };
  E.fadeIn = function (n) {
    n = n || 20;
    const st = F().fade;
    let k = 0;
    return G.tasks.until(() => {
      k++;
      F().fade = Math.max(0, st * (1 - k / n));
      return k >= n;
    });
  };
  E.flash = function (n, col) {
    F().flash = n || 8;
  };
  E.shake = function (p, n) {
    F().shake = p || 6;
    if (n) {
      let k = 0;
      return G.tasks.until(() => {
        F().shake = Math.max(F().shake, p * (1 - k / n));
        return ++k >= n;
      });
    }
  };
  E.tint = function (col) {
    F().tint = col || null;
  };
  E.time = function (t) {
    G.state.time = t;
  };

  // ---------- 移動 ----------
  E.get = (id) => F().get(id);
  E.pos = function (id) {
    const e = E.get(id);
    return e ? [e.tx, e.ty] : null;
  };
  // steps: 'UULLR' / 'U3L2' / [[tx,ty],...]（絶対タイル座標）
  E.move = function (id, steps, opt) {
    opt = opt || {};
    const e = typeof id === 'string' ? E.get(id) : id;
    if (!e) {
      console.warn('move: no entity', id);
      return Promise.resolve();
    }
    let tx = Math.floor(e.x / 16),
      ty = Math.floor((e.y - 2) / 16);
    const pts = [];
    if (typeof steps === 'string') {
      const re = /([UDLR])(\d*)/g;
      let m;
      while ((m = re.exec(steps))) {
        const n = m[2] ? parseInt(m[2]) : 1;
        for (let i = 0; i < n; i++) {
          if (m[1] === 'U') ty--;
          if (m[1] === 'D') ty++;
          if (m[1] === 'L') tx--;
          if (m[1] === 'R') tx++;
          pts.push([tx * 16 + 8, ty * 16 + 14]);
        }
      }
    } else for (const [x, y] of steps) pts.push([x * 16 + 8, y * 16 + 14]);
    e.path = pts;
    e.pathSpeed = opt.speed || (e.isPlayer ? 1.3 : 1.1);
    const pr = G.tasks.until(() => !e.path || !e.path.length || e.dead);
    if (opt.noWait) return Promise.resolve();
    return pr.then(() => {
      if (opt.face) e.dir = opt.face;
    });
  };
  E.moveTo = function (id, tx, ty, opt) {
    const e = E.get(id);
    if (!e) return Promise.resolve();
    const cx = Math.floor(e.x / 16),
      cy = Math.floor((e.y - 2) / 16);
    const pts = [];
    // x→yの順で移動
    const firstY = opt && opt.yFirst;
    if (firstY) {
      if (cy !== ty) pts.push([cx, ty]);
      if (cx !== tx) pts.push([tx, ty]);
    } else {
      if (cx !== tx) pts.push([tx, cy]);
      if (cy !== ty) pts.push([tx, ty]);
    }
    return E.move(e, pts, opt);
  };
  E.face = function (id, dir) {
    const e = E.get(id);
    if (!e) return;
    if (G.DIRS[dir]) e.dir = dir;
    else {
      const o = E.get(dir);
      if (o) e.faceTo(o);
    }
  };
  E.teleport = function (id, tx, ty, dir) {
    const e = E.get(id);
    if (!e) return;
    e.x = tx * 16 + 8;
    e.y = ty * 16 + 14;
    if (dir) e.dir = dir;
    if (e.isPlayer) {
      F().trail = F().trail.map(() => [e.x, e.y, e.dir]);
      F().followers.forEach((f) => {
        f.x = e.x;
        f.y = e.y;
      });
    }
  };
  E.npc = function (def) {
    const n = new G.NPC(def);
    F().add(n);
    return n;
  };
  E.remove = function (id) {
    const e = E.get(id);
    if (e) e.dead = true;
  };
  E.hide = function (id, v) {
    const e = E.get(id);
    if (e) e.visible = v === false;
  };
  E.emote = function (id, sym, dur) {
    const e = E.get(id);
    if (e) e.emote = { sym, t: 0, dur: dur || 70 };
    if (sym === '!') G.audio.se('cursor');
  };
  E.camera = function (tx, ty, opt) {
    F().cam.fx = tx * 16 + 8;
    F().cam.fy = ty * 16 + 8;
    let k = 0;
    if (opt && opt.noWait) return Promise.resolve();
    return G.waitFrames((opt && opt.frames) || 50);
  };
  E.cameraReset = function () {
    F().cam.fx = null;
    F().cam.fy = null;
    return G.waitFrames(30);
  };

  // ---------- マップ移動 ----------
  E.warp = async function (map, tx, ty, dir, opt) {
    opt = opt || {};
    if (!opt.noFade) await E.fadeOut(opt.fade || 14);
    F().load(map, tx, ty, dir, opt);
    if (!opt.noFade) await E.fadeIn(opt.fade || 14);
    if (!opt.noEnter) await E.runMapEnter();
  };
  E.runMapEnter = async function () {
    const m = F().map;
    for (const h of m.enterHooks) {
      if (F().map !== m) break; // フック内でワープした
      await h();
    }
  };
  // タイルを書き換える（扉を開ける・橋をかける等）。セーブにも残る
  E.setTile = function (tx, ty, ch, opt) {
    const m = F().map;
    const key = '_tiles_' + m.id;
    if (!(opt && opt.temp)) {
      G.state.flags[key] = G.state.flags[key] || {};
      G.state.flags[key][tx + ',' + ty] = ch;
    }
    m.grid[ty][tx] = ch;
    m.computeSolid();
    m.renderGround();
  };
  // 章の開始（G.STORY.chapters[n] を呼ぶ）
  E.startChapter = async function (n) {
    const f = G.STORY.chapters[n];
    if (!f) {
      await E.notice('（第' + n + '章は準備中です）');
      return;
    }
    G.state.chapter = n;
    await f();
  };
  E.reload = function () {
    const p = F().player;
    F().load(F().map.id, p.tx, p.ty, p.dir, { silent: true, keepBgm: true, mech: p.isMech });
  };

  // ---------- フラグ・アイテム ----------
  E.flag = (k) => !!G.state.flags[k];
  E.val = (k) => G.state.flags[k] || 0;
  E.set = function (k, v) {
    G.state.flags[k] = v === undefined ? true : v;
  };
  E.unset = function (k) {
    delete G.state.flags[k];
  };
  E.inc = function (k, n) {
    G.state.flags[k] = (G.state.flags[k] || 0) + (n || 1);
    return G.state.flags[k];
  };
  E.give = async function (id, n, opt) {
    n = n || 1;
    opt = opt || {};
    G.addItemCount(id, n);
    const it = G.ITEMS[id];
    G.audio.se(it.kind === 'key' ? 'get' : 'item');
    if (opt.quiet) return;
    const msg = it.name + (n > 1 ? ' ×' + n : '') + ' を手に入れた！';
    if (it.kind === 'key' || opt.wait) await UI().notice(msg, { col: G.UI.gold });
    else UI().toast(msg, G.UI.line2);
  };
  E.take = function (id, n) {
    G.addItemCount(id, -(n || 1));
  };
  E.has = (id, n) => (G.state.items[id] || 0) >= (n || 1);
  E.money = function (n) {
    G.state.money = Math.max(0, G.state.money + n);
    if (n > 0) {
      G.audio.se('coin');
      UI().toast('¢' + n + ' を手に入れた', G.UI.gold);
    } else if (n < 0) UI().toast('¢' + -n + ' 支払った', G.UI.dim);
  };
  E.exp = function (n) {
    G.gainExp(n);
  };
  E.heal = function () {
    const st = G.stats();
    G.state.hp = st.maxhp;
    G.state.en = st.maxen;
    G.state.mech.hp = null;
  };
  E.learn = async function (id) {
    if (G.state.skills.includes(id)) return;
    G.state.skills.push(id);
    G.audio.se('levelup');
    await UI().notice('スキル「' + G.SKILLS[id].name + '」を覚えた！\n' + G.SKILLS[id].desc, { col: G.UI.line2 });
  };
  E.equip = function (slot, id) {
    G.state.equip[slot] = id;
  };

  // ---------- 進行 ----------
  E.objective = function (t) {
    G.state.objective = t;
    if (t) UI().toast('目的：' + t, G.UI.line);
  };
  E.chapter = async function (n, title, sub) {
    G.state.chapter = n;
    const ch = G.CHAPTERS[n] || ['', title];
    await UI().chapterCard(ch[0], title || ch[1], sub || ch[2]);
  };
  E.quest = function (id, st) {
    const q = G.QUESTS[id];
    const old = G.state.quests[id];
    G.state.quests[id] = st || 'active';
    if (!q) return;
    if (st === 'done' && old !== 'done') {
      UI().toast('クエスト達成：' + q.name, G.UI.gold);
      G.audio.se('get');
    } else if (!old) UI().toast('新しいクエスト：' + q.name, G.UI.line2);
  };
  E.questState = (id) => G.state.quests[id];
  E.party = function (arr) {
    G.state.party = arr.slice();
    E.refreshParty();
  };
  E.join = function (id) {
    if (!G.state.party.includes(id)) G.state.party.push(id);
    E.refreshParty();
  };
  E.leave = function (id) {
    G.state.party = G.state.party.filter((x) => x !== id);
    E.refreshParty();
  };
  E.refreshParty = function () {
    const f = F();
    if (!f.player) return;
    f.ents = f.ents.filter((e) => !e.isFollower);
    f.followers = [];
    if (f.player.isMech) return;
    G.state.party.forEach((cid, i) => {
      const fo = new G.Follower(cid, i);
      const tr = f.trail[Math.min(f.trail.length - 1, (i + 1) * 14)] || [f.player.x, f.player.y];
      fo.x = tr[0];
      fo.y = tr[1];
      fo.dir = f.player.dir;
      fo.fighter = cid === 'ruu' || cid === 'kyosuke' || cid === 'sig';
      f.followers.push(fo);
      f.ents.push(fo);
    });
  };
  E.setChar = function (id) {
    F().player.setChar(id);
  };
  E.mech = async function (on, mechId) {
    const p = F().player;
    if (on) {
      if (mechId) G.state.mech.id = mechId;
      G.audio.se('boot');
      E.flash(12);
      await E.wait(10);
    }
    p.setMech(on, mechId);
    E.refreshParty();
  };

  // ---------- 音 ----------
  E.bgm = (id, opt) => G.audio.bgm(id, opt);
  E.stopBgm = (f) => G.audio.stopBgm(f || 1);
  E.se = (id) => G.audio.se(id);

  // ---------- CG ----------
  E.cg = async function (id, caption, opt) {
    opt = opt || {};
    F().cg = { id, t: 0, caption: caption || '' };
    if (caption && opt.wait !== false) {
      await G.waitFrames(20);
      await G.waitPress('ok');
      G.audio.se('cursor');
    } else if (opt.frames) await G.waitFrames(opt.frames);
  };
  E.cgCaption = async function (caption) {
    if (!F().cg) return;
    F().cg.caption = caption;
    await G.waitFrames(10);
    await G.waitPress('ok');
  };
  E.cgOff = function () {
    F().cg = null;
  };

  // ---------- ラジオ幕間 ----------
  E.radio = async function (lines, opt) {
    opt = opt || {};
    const prev = G.audio.curId;
    G.audio.bgm('radio');
    await E.cg('radio', '', { wait: false });
    for (const l of lines) {
      const [who, text] = Array.isArray(l) ? l : ['lily', l];
      await E.say(who, text, { radio: who === 'lily', name: who === 'lily' ? 'DJリリィ ― レディオ・スターダスト' : undefined });
    }
    E.cgOff();
    if (!opt.keepBgm) G.audio.bgm(prev);
  };

  // ---------- 戦闘 ----------
  E.battle = (def) => F().battleStart(def);
  E.enemy = function (type, tx, ty, opt) {
    const e = new G.Enemy(type, tx * 16 + 8, ty * 16 + 14, opt || {});
    F().add(e);
    return e;
  };

  // ---------- ショップ等 ----------
  E.shop = (goods, title) => UI().shop(goods, { title });
  E.upgrade = () => UI().upgrade();
  E.savePoint = async function () {
    E.heal();
    G.audio.se('heal');
    UI().toast('HP・ENが全回復した', G.UI.green);
    const r = await E.ask(null, 'コロニー公衆端末だ。データを記録しますか？', ['セーブする', 'やめる'], { cancel: 1 });
    if (r === 0) {
      await new Promise((res) => {
        const w = UI().slotSelect('save', () => {
          UI().pop(w);
          res();
        });
        UI().push(w);
      });
    }
  };
  E.ending = async function () {
    await G.credits();
  };
})();
