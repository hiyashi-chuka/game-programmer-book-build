// =============================================================
//  ui.js — 会話・選択肢・メニュー・ショップ・各種画面
// =============================================================
(function () {
  const UI = (G.ui = { stack: [], toasts: [], hideHud: false });
  const I = G.input;
  const C = G.UI;

  UI.push = function (w) {
    UI.stack.push(w);
    return w;
  };
  UI.pop = function (w) {
    const i = UI.stack.indexOf(w);
    if (i >= 0) UI.stack.splice(i, 1);
  };
  UI.closeAll = function () {
    UI.stack.forEach((w) => w.resolve && w.resolve(null));
    UI.stack = [];
    G.audio.muffle(false);
  };
  UI.blocking = () => UI.stack.length > 0;
  UI.paused = () => UI.stack.some((w) => w.pause);
  UI.update = function () {
    const top = UI.stack[UI.stack.length - 1];
    if (top) top.update();
    for (const t of UI.toasts) t.t++;
    UI.toasts = UI.toasts.filter((t) => t.t < 150);
  };
  UI.draw = function (c) {
    for (const w of UI.stack) if (w.draw) w.draw(c);
  };
  UI.drawHi = function (c) {
    c.imageSmoothingEnabled = false;
    for (const w of UI.stack) if (w.drawHi) w.drawHi(c);
    // トースト
    UI.toasts.forEach((t, i) => {
      const a = t.t < 10 ? t.t / 10 : t.t > 130 ? (150 - t.t) / 20 : 1;
      c.globalAlpha = a;
      const w = G.measure(c, t.text, 9) + 20;
      const x = G.W / 2 - w / 2,
        y = 60 + i * 18 - (t.t < 10 ? 10 - t.t : 0);
      c.fillStyle = 'rgba(12,8,30,0.85)';
      c.fillRect(x, y, w, 15);
      c.fillStyle = t.col;
      c.fillRect(x, y, 2, 15);
      c.fillRect(x + w - 2, y, 2, 15);
      G.drawText(c, t.text, G.W / 2, y + 3, { size: 9, align: 'center', color: '#ffffff' });
      c.globalAlpha = 1;
    });
  };
  UI.toast = function (text, col) {
    UI.toasts.push({ text, col: col || C.line2, t: 0 });
    if (UI.toasts.length > 4) UI.toasts.shift();
  };

  // カーソル付きリストの共通処理
  function listNav(w, n, cols) {
    cols = cols || 1;
    if (n <= 0) return;
    if (I.pressed('down')) {
      w.sel = (w.sel + cols) % n;
      G.audio.se('cursor');
    }
    if (I.pressed('up')) {
      w.sel = (w.sel - cols + n) % n;
      G.audio.se('cursor');
    }
    if (cols > 1 && I.pressed('right')) {
      w.sel = (w.sel + 1) % n;
      G.audio.se('cursor');
    }
    if (cols > 1 && I.pressed('left')) {
      w.sel = (w.sel - 1 + n) % n;
      G.audio.se('cursor');
    }
  }
  function cursor(c, x, y) {
    const o = Math.sin(G.frame * 0.2) * 1.5;
    c.fillStyle = C.line;
    c.beginPath();
    c.moveTo(x + o, y);
    c.lineTo(x + 5 + o, y + 4);
    c.lineTo(x + o, y + 8);
    c.fill();
  }

  // =============================================================
  //  会話ウィンドウ
  // =============================================================
  // who: 'ruu' / 'ruu:smile' / null(ナレーション)
  UI.say = function (who, text, opt) {
    opt = opt || {};
    return new Promise((resolve) => {
      let charId = null,
        expr = 'normal';
      if (who) [charId, expr] = who.split(':');
      expr = expr || opt.expr || 'normal';
      const ch = charId ? G.chars[charId] : null;
      if (charId && !ch) console.warn('unknown char', charId);
      if (ch && charId !== 'sys') G.state.flags['met_' + charId] = true;
      const w = {
        ch,
        charId,
        expr,
        name: opt.name || (ch ? ch.name : ''),
        pages: [],
        page: 0,
        shown: 0,
        resolve,
        opt,
        t: 0,
      };
      // ページ分割（4行ごと）
      const lines = G.wrapText(G.ctx, text, ch && charId !== 'sys' ? 360 : 430, 11);
      for (let i = 0; i < lines.length; i += 3) w.pages.push(lines.slice(i, i + 3).join('\n'));
      if (!w.pages.length) w.pages.push('');
      w.update = function () {
        w.t++;
        const full = w.pages[w.page];
        const sp = [0.35, 0.7, 1.5, 4][G.settings.textSpeed] || 0.7;
        if (w.shown < full.length) {
          const before = Math.floor(w.shown);
          w.shown = Math.min(full.length, w.shown + sp);
          const nowI = Math.floor(w.shown);
          if (nowI !== before && ch && ch.voice && nowI % 2 === 0 && !' 　\n'.includes(full[nowI - 1] || ' ')) G.audio.blip(ch.voice * (expr === 'angry' ? 0.9 : expr === 'surprise' ? 1.15 : 1));
          if (I.pressed('ok') || (I.down('cancel') && w.t > 4)) w.shown = full.length;
          return;
        }
        if (opt.keep && w.page === w.pages.length - 1) {
          if (!w.kept) {
            w.kept = true;
            resolve(w);
          }
          return;
        }
        if (I.pressed('ok') || (I.down('cancel') && w.t > 6) || (opt.auto && w.t > opt.auto)) {
          w.t = 0;
          if (w.page < w.pages.length - 1) {
            w.page++;
            w.shown = 0;
          } else {
            UI.pop(w);
            resolve();
          }
        }
      };
      w.drawHi = function (c) {
        const radio = opt.radio;
        const hasP = ch && charId !== 'sys';
        const bx = 8,
          by = 194,
          bw = G.W - 16,
          bh = 70;
        G.panel(c, bx, by, bw, bh, { accent: radio ? '#ff5fa2' : C.line, line: radio ? '#ff5fa2' : C.line2, bg: radio ? 'rgba(36,10,40,0.94)' : C.bg });
        let tx = bx + 14;
        if (hasP) {
          const px = bx + 6,
            py = by - 10;
          // ポートレート背景
          const g = c.createLinearGradient(px, py, px, py + 74);
          g.addColorStop(0, radio ? '#5a1848' : '#3a2a7a');
          g.addColorStop(1, radio ? '#1a0a20' : '#120c2a');
          c.fillStyle = g;
          c.fillRect(px, py, 74, 74);
          c.strokeStyle = radio ? '#ff5fa2' : C.line;
          c.lineWidth = 1;
          c.strokeRect(px + 0.5, py + 0.5, 73, 73);
          const img = G.portrait(ch.por, expr);
          c.imageSmoothingEnabled = false;
          c.drawImage(img, px + 4, py + 4, 66, 66);
          tx = px + 84;
        }
        if (w.name) {
          const nw = G.measure(c, w.name, 10) + 18;
          const nx = hasP ? tx - 4 : bx + 10;
          c.fillStyle = radio ? '#ff5fa2' : C.line;
          c.fillRect(nx, by - 8, nw, 14);
          G.drawText(c, w.name, nx + 9, by - 6, { size: 10, color: '#1a0f2e', shadow: false, bold: true });
        }
        if (radio) {
          const on = Math.floor(G.frame / 30) % 2 === 0;
          c.fillStyle = on ? '#ff3050' : '#5a1828';
          c.fillRect(bx + bw - 62, by + 6, 6, 6);
          G.drawText(c, 'ON AIR', bx + bw - 52, by + 4, { size: 9, color: on ? '#ff8090' : '#8a4050' });
        }
        const full = w.pages[w.page];
        const txt = full.slice(0, Math.floor(w.shown));
        txt.split('\n').forEach((ln, i) => G.drawText(c, ln, tx, by + 12 + i * 17, { size: 11, color: !ch ? '#d8d4ff' : '#ffffff' }));
        if (w.shown >= full.length && !w.kept && Math.floor(G.frame / 20) % 2 === 0) {
          c.fillStyle = C.line;
          c.beginPath();
          c.moveTo(bx + bw - 18, by + bh - 14);
          c.lineTo(bx + bw - 10, by + bh - 14);
          c.lineTo(bx + bw - 14, by + bh - 9);
          c.fill();
        }
      };
      UI.push(w);
    });
  };

  // ---------- 選択肢 ----------
  UI.choice = function (options, opt) {
    opt = opt || {};
    return new Promise((resolve) => {
      const w = { sel: opt.def || 0, resolve };
      w.update = function () {
        listNav(w, options.length);
        if (I.pressed('ok')) {
          G.audio.se('ok');
          UI.pop(w);
          resolve(w.sel);
        } else if (I.pressed('cancel') && opt.cancel !== undefined) {
          G.audio.se('cancel');
          UI.pop(w);
          resolve(opt.cancel);
        }
      };
      w.drawHi = function (c) {
        const ww = Math.max(...options.map((o) => G.measure(c, o, 10))) + 34;
        const hh = options.length * 16 + 10;
        const x = G.W - ww - 12,
          y = 186 - hh;
        G.panel(c, x, y, ww, hh, {});
        options.forEach((o, i) => {
          if (i === w.sel) {
            c.fillStyle = C.sel;
            c.fillRect(x + 4, y + 5 + i * 16, ww - 8, 15);
            cursor(c, x + 8, y + 8 + i * 16);
          }
          G.drawText(c, o, x + 20, y + 7 + i * 16, { size: 10, color: i === w.sel ? '#ffffff' : C.dim });
        });
      };
      UI.push(w);
    });
  };

  // ---------- 汎用：メッセージ表示（中央） ----------
  UI.notice = function (text, opt) {
    opt = opt || {};
    return new Promise((resolve) => {
      const w = { t: 0 };
      w.update = function () {
        w.t++;
        if ((I.pressed('ok') || I.pressed('cancel')) && w.t > 10) {
          UI.pop(w);
          resolve();
        }
      };
      w.drawHi = function (c) {
        const lines = G.wrapText(c, text, 300, 11);
        const ww = Math.max(...lines.map((l) => G.measure(c, l, 11))) + 40,
          hh = lines.length * 16 + 20;
        const x = G.W / 2 - ww / 2,
          y = G.H / 2 - hh / 2 - 20;
        G.panel(c, x, y, ww, hh, { accent: opt.col || C.gold });
        lines.forEach((l, i) => G.drawText(c, l, G.W / 2, y + 11 + i * 16, { size: 11, align: 'center', color: opt.textCol || '#ffffff' }));
      };
      UI.push(w);
    });
  };

  // =============================================================
  //  タイミング・ミニゲーム（ラーメン作り、機体起動、ハッキング等）
  // =============================================================
  // opt: {title, rounds:3, speed:1.6, zone:0.18, labels:['麺','スープ','具'], col}
  // 戻り値：成功した回数
  UI.timing = function (opt) {
    opt = opt || {};
    return new Promise((resolve) => {
      const rounds = opt.rounds || 3;
      const w = { round: 0, pos: 0, dir: 1, ok: 0, res: [], t: 0, wait: 0, zone: [0, 0] };
      const newZone = () => {
        const z = opt.zone || 0.18;
        const a = G.rand(0.1, 0.9 - z);
        w.zone = [a, a + z];
        w.pos = 0;
        w.dir = 1;
      };
      newZone();
      w.update = function () {
        w.t++;
        if (w.wait > 0) {
          if (--w.wait === 0) {
            if (w.round >= rounds) {
              UI.pop(w);
              resolve(w.ok);
              return;
            }
            newZone();
          }
          return;
        }
        const sp = (opt.speed || 1.6) * (1 + w.round * 0.15) * 0.012;
        w.pos += sp * w.dir;
        if (w.pos > 1) {
          w.pos = 1;
          w.dir = -1;
        }
        if (w.pos < 0) {
          w.pos = 0;
          w.dir = 1;
        }
        if (I.pressed('ok')) {
          const hit = w.pos >= w.zone[0] && w.pos <= w.zone[1];
          w.res.push(hit);
          if (hit) {
            w.ok++;
            G.audio.se('ok');
          } else G.audio.se('buzz');
          w.round++;
          w.wait = 40;
        }
      };
      w.drawHi = function (c) {
        const x = 90,
          y = 100,
          ww = 300;
        G.panel(c, x - 20, y - 40, ww + 40, 110, { title: opt.title || 'TIMING', accent: opt.col || C.gold });
        const lab = (opt.labels || [])[Math.min(w.round, rounds - 1)] || 'タイミングよくZ！';
        G.drawText(c, lab, G.W / 2, y - 26, { size: 11, align: 'center' });
        c.fillStyle = 'rgba(0,0,0,0.6)';
        c.fillRect(x, y, ww, 14);
        c.fillStyle = 'rgba(125,255,154,0.55)';
        c.fillRect(x + w.zone[0] * ww, y, (w.zone[1] - w.zone[0]) * ww, 14);
        c.fillStyle = '#ffffff';
        c.fillRect(x + w.pos * ww - 1, y - 4, 3, 22);
        for (let i = 0; i < rounds; i++) {
          const r = w.res[i];
          c.fillStyle = r === undefined ? 'rgba(255,255,255,0.2)' : r ? C.green : C.red;
          c.fillRect(G.W / 2 - rounds * 9 + i * 18, y + 28, 12, 12);
        }
        if (w.wait > 0) G.drawText(c, w.res[w.res.length - 1] ? 'GOOD!' : 'MISS…', G.W / 2, y + 48, { size: 12, align: 'center', color: w.res[w.res.length - 1] ? C.green : C.red });
      };
      UI.push(w);
    });
  };

  // =============================================================
  //  チャプタータイトル
  // =============================================================
  UI.chapterCard = function (num, title, sub) {
    return new Promise((resolve) => {
      const w = { t: 0, pause: false };
      G.audio.se('echo');
      w.update = function () {
        w.t++;
        if (w.t > 260 || (w.t > 60 && I.pressed('ok'))) {
          UI.pop(w);
          resolve();
        }
      };
      w.drawHi = function (c) {
        const t = w.t;
        const a = t < 30 ? t / 30 : t > 230 ? (260 - t) / 30 : 1;
        c.fillStyle = `rgba(6,4,16,${Math.min(1, a * 1.2)})`;
        c.fillRect(0, 0, G.W, G.H);
        c.globalAlpha = a;
        // 星
        for (let i = 0; i < 60; i++) {
          const x = (G.hash(i, 1, 9) * G.W + t * (0.1 + G.hash(i, 2, 9) * 0.4)) % G.W,
            y = G.hash(i, 3, 9) * G.H;
          c.fillStyle = i % 5 ? 'rgba(200,210,255,0.6)' : '#ff9ac8';
          c.fillRect(x, y, 1, 1);
        }
        const lw = Math.min(260, t * 6);
        c.fillStyle = C.line;
        c.fillRect(G.W / 2 - lw / 2, 112, lw, 1);
        c.fillStyle = C.line2;
        c.fillRect(G.W / 2 - lw / 2, 160, lw, 1);
        G.drawText(c, num, G.W / 2, 92, { size: 10, align: 'center', color: C.line2 });
        G.drawText(c, title, G.W / 2, 122, { size: 22, align: 'center', bold: true });
        if (sub) G.drawText(c, sub, G.W / 2, 168, { size: 9, align: 'center', color: C.dim });
        c.globalAlpha = 1;
      };
      UI.push(w);
    });
  };

  // =============================================================
  //  ゲームオーバー
  // =============================================================
  UI.gameOver = function () {
    return new Promise((resolve) => {
      const w = { t: 0, sel: 0 };
      const opts = ['リトライ', 'タイトルへ'];
      w.update = function () {
        w.t++;
        if (w.t < 60) return;
        listNav(w, 2);
        if (I.pressed('ok')) {
          G.audio.se('ok');
          UI.pop(w);
          resolve(w.sel === 0 ? 'retry' : 'title');
        }
      };
      w.drawHi = function (c) {
        const a = Math.min(1, w.t / 40);
        c.fillStyle = `rgba(20,0,10,${a * 0.85})`;
        c.fillRect(0, 0, G.W, G.H);
        c.globalAlpha = a;
        G.drawText(c, 'GAME OVER', G.W / 2, 80, { size: 30, align: 'center', bold: true, color: '#ff4060' });
        G.drawText(c, '……まだ、終われない。', G.W / 2, 120, { size: 11, align: 'center', color: C.dim });
        if (w.t > 60)
          opts.forEach((o, i) => {
            if (i === w.sel) cursor(c, G.W / 2 - 48, 162 + i * 20);
            G.drawText(c, o, G.W / 2, 160 + i * 20, { size: 12, align: 'center', color: i === w.sel ? '#fff' : C.dim });
          });
        c.globalAlpha = 1;
      };
      UI.push(w);
    });
  };

  // =============================================================
  //  メニュー
  // =============================================================
  const TABS = ['アイテム', 'そうび', 'スキル', '機体', 'クエスト', '人物ファイル', 'システム'];
  UI.openMenu = function () {
    G.audio.se('ok');
    G.audio.muffle(true);
    const w = { pause: true, tab: 0, sel: 0, focus: 'tab', sub: null };
    w.update = function () {
      if (w.sub) return w.sub.update();
      if (w.focus === 'tab') {
        if (I.pressed('down')) {
          w.tab = (w.tab + 1) % TABS.length;
          G.audio.se('cursor');
        }
        if (I.pressed('up')) {
          w.tab = (w.tab - 1 + TABS.length) % TABS.length;
          G.audio.se('cursor');
        }
        if (I.pressed('ok') || I.pressed('right')) {
          w.focus = 'list';
          w.sel = 0;
          G.audio.se('ok');
        }
        if (I.pressed('cancel') || I.pressed('menu')) {
          G.audio.se('cancel');
          G.audio.muffle(false);
          UI.pop(w);
        }
        return;
      }
      const T = PAGES[w.tab];
      if (I.pressed('cancel') || I.pressed('left')) {
        w.focus = 'tab';
        G.audio.se('cancel');
        return;
      }
      if (I.pressed('menu')) {
        G.audio.muffle(false);
        UI.pop(w);
        return;
      }
      T.update(w);
    };
    w.drawHi = function (c) {
      c.fillStyle = 'rgba(6,4,18,0.55)';
      c.fillRect(0, 0, G.W, G.H);
      // 左：タブ
      G.panel(c, 8, 8, 100, 168, { title: 'MENU' });
      TABS.forEach((t, i) => {
        const y = 20 + i * 21;
        if (i === w.tab) {
          c.fillStyle = w.focus === 'tab' ? C.sel : 'rgba(255,95,162,0.12)';
          c.fillRect(12, y - 3, 92, 18);
          if (w.focus === 'tab') cursor(c, 16, y + 1);
        }
        G.drawText(c, t, 28, y, { size: 10, color: i === w.tab ? '#ffffff' : C.dim });
      });
      // 左下：ステータス
      const s = G.state,
        st = G.stats();
      G.panel(c, 8, 182, 100, 80, {});
      G.drawText(c, 'カナタ  Lv ' + s.lv, 14, 188, { size: 9 });
      G.drawText(c, 'HP ' + s.hp + '/' + st.maxhp, 14, 201, { size: 8, color: C.green });
      G.drawText(c, 'EN ' + s.en + '/' + st.maxen, 14, 212, { size: 8, color: C.gold });
      G.drawText(c, 'EXP ' + s.exp + '/' + G.expNext(s.lv), 14, 223, { size: 8, color: C.dim });
      G.drawText(c, '¢ ' + s.money.toLocaleString(), 14, 236, { size: 9, color: C.gold });
      G.drawText(c, 'PLAY ' + G.fmtTime(s.play), 14, 248, { size: 8, color: C.dim });
      // 右：内容
      G.panel(c, 114, 8, G.W - 122, 254, { title: TABS[w.tab] });
      PAGES[w.tab].draw(c, w, 120, 18, G.W - 134, 238);
      if (w.sub) w.sub.drawHi(c);
    };
    UI.push(w);
  };

  // ---------- メニュー各ページ ----------
  function itemList(filter) {
    return Object.keys(G.state.items)
      .filter((k) => G.ITEMS[k] && filter(G.ITEMS[k], k))
      .sort((a, b) => (G.ITEMS[a].kind > G.ITEMS[b].kind ? 1 : -1));
  }
  function useItem(id) {
    const it = G.ITEMS[id];
    const s = G.state,
      st = G.stats();
    if (it.kind !== 'use') return false;
    const p = G.field.player;
    if (it.mech) {
      if (!p || !p.isMech) {
        UI.toast('機体戦でしか使えない', C.red);
        return false;
      }
      G.state.mech.hp = Math.min(p.maxhp, G.state.mech.hp + Math.ceil(p.maxhp * it.mech));
    } else {
      if (p && p.isMech && !it.en) {
        UI.toast('機体に乗っている間は使えない', C.red);
        return false;
      }
      if (it.hp) s.hp = Math.min(st.maxhp, s.hp + it.hp);
      if (it.en) {
        if (p && p.isMech) p.en = Math.min(p.maxen, p.en + it.en);
        else s.en = Math.min(st.maxen, s.en + it.en);
      }
    }
    G.addItemCount(id, -1);
    G.audio.se('heal');
    UI.toast(it.name + ' を使った', C.green);
    return true;
  }
  UI.useItem = useItem;
  function drawList(c, items, sel, focused, x, y, w, h, row) {
    const per = Math.floor(h / 16);
    const start = Math.max(0, Math.min(sel - Math.floor(per / 2), items.length - per));
    for (let i = start; i < Math.min(items.length, start + per); i++) {
      const yy = y + (i - start) * 16;
      if (i === sel && focused) {
        c.fillStyle = C.sel;
        c.fillRect(x, yy - 2, w, 15);
        cursor(c, x + 3, yy + 1);
      }
      row(items[i], x + 14, yy, i === sel && focused);
    }
    if (!items.length) G.drawText(c, '（なし）', x + 14, y, { size: 10, color: C.dim });
  }
  const PAGES = [
    // アイテム
    {
      update(w) {
        const list = itemList(() => true);
        listNav(w, list.length);
        if (I.pressed('ok') && list[w.sel]) {
          if (G.ITEMS[list[w.sel]].kind === 'use') useItem(list[w.sel]);
          else G.audio.se('buzz');
          if (w.sel >= itemList(() => true).length) w.sel = Math.max(0, w.sel - 1);
        }
      },
      draw(c, w, x, y, ww, hh) {
        const list = itemList(() => true);
        drawList(c, list, w.sel, w.focus === 'list', x, y + 4, ww, hh - 60, (id, xx, yy, on) => {
          const it = G.ITEMS[id];
          const col = it.kind === 'use' ? '#fff' : it.kind === 'key' ? C.gold : it.kind === 'mat' ? C.line2 : '#c8b8ff';
          G.drawText(c, it.name, xx, yy, { size: 10, color: on ? '#fff' : col });
          G.drawText(c, '×' + G.state.items[id], x + ww - 10, yy, { size: 10, align: 'right', color: C.dim });
        });
        const id = list[w.sel];
        if (id && w.focus === 'list') {
          c.fillStyle = 'rgba(255,255,255,0.08)';
          c.fillRect(x, y + hh - 50, ww, 1);
          G.wrapText(c, G.ITEMS[id].desc, ww - 10, 9).forEach((l, i) => G.drawText(c, l, x + 6, y + hh - 44 + i * 13, { size: 9, color: C.dim }));
        }
      },
    },
    // そうび
    {
      update(w) {
        if (w.equipPick) {
          const slot = w.equipPick;
          const list = [null].concat(itemList((it) => it.kind === slot));
          listNav(w, list.length);
          if (I.pressed('ok')) {
            G.state.equip[slot] = list[w.sel];
            G.audio.se('ok');
            w.equipPick = null;
            w.sel = slot === 'weapon' ? 0 : 1;
          }
          if (I.pressed('cancel')) w.equipPick = null;
          return;
        }
        listNav(w, 2);
        if (I.pressed('ok')) {
          w.equipPick = w.sel === 0 ? 'weapon' : 'acc';
          w.sel = 0;
          G.audio.se('ok');
        }
      },
      draw(c, w, x, y, ww) {
        const s = G.state,
          st = G.stats();
        const slots = [['武器', 'weapon'], ['アクセサリ', 'acc']];
        slots.forEach(([lab, k], i) => {
          const yy = y + 6 + i * 20;
          if (!w.equipPick && w.sel === i && w.focus === 'list') {
            c.fillStyle = C.sel;
            c.fillRect(x, yy - 3, ww, 17);
            cursor(c, x + 3, yy + 1);
          }
          G.drawText(c, lab, x + 14, yy, { size: 10, color: C.dim });
          G.drawText(c, s.equip[k] ? G.ITEMS[s.equip[k]].name : '―', x + 90, yy, { size: 10 });
        });
        const sy = y + 56;
        [['最大HP', st.maxhp], ['最大EN', st.maxen], ['攻撃', st.atk], ['防御', st.def]].forEach(([l, v], i) => {
          G.drawText(c, l, x + 14 + (i % 2) * 150, sy + Math.floor(i / 2) * 15, { size: 9, color: C.dim });
          G.drawText(c, v, x + 120 + (i % 2) * 150, sy + Math.floor(i / 2) * 15, { size: 9, align: 'right' });
        });
        if (w.equipPick) {
          const list = [null].concat(itemList((it) => it.kind === w.equipPick));
          const by = y + 96;
          c.fillStyle = 'rgba(255,255,255,0.08)';
          c.fillRect(x, by - 6, ww, 1);
          drawList(c, list, w.sel, true, x, by, ww, 120, (id, xx, yy) => {
            const it = id ? G.ITEMS[id] : null;
            G.drawText(c, it ? it.name : 'はずす', xx, yy, { size: 10 });
            if (it) G.drawText(c, [it.atk ? '攻+' + it.atk : '', it.def ? '防+' + it.def : '', it.en ? 'EN+' + it.en : '', it.spd ? '速↑' : ''].join(' '), x + ww - 8, yy, { size: 9, align: 'right', color: C.line2 });
          });
        }
      },
    },
    // スキル
    {
      update(w) {
        listNav(w, G.state.skills.length);
      },
      draw(c, w, x, y, ww) {
        const sk = G.state.skills;
        drawList(c, sk, w.sel, w.focus === 'list', x, y + 4, ww, 120, (id, xx, yy) => {
          G.drawText(c, G.SKILLS[id].name, xx, yy, { size: 10 });
          if (G.SKILLS[id].en) G.drawText(c, 'EN ' + G.SKILLS[id].en, x + ww - 8, yy, { size: 9, align: 'right', color: C.gold });
        });
        const id = sk[w.sel];
        if (id) G.wrapText(c, G.SKILLS[id].desc, ww - 10, 9).forEach((l, i) => G.drawText(c, l, x + 6, y + 140 + i * 13, { size: 9, color: C.dim }));
        G.drawText(c, '操作：Z 攻撃（連打でコンボ）／X ダッシュ（無敵時間あり）／C スキル', x + 6, y + 210, { size: 8, color: C.dim });
      },
    },
    // 機体
    {
      update() {},
      draw(c, w, x, y, ww) {
        const m = G.state.mech;
        const md = G.MECHS[m.id] || G.MECHS.ponkotsu;
        const ms = G.mechStats();
        const sheet = G.mechSheet(md);
        c.imageSmoothingEnabled = false;
        c.drawImage(sheet.down[Math.floor(G.frame / 12) % 3], x + 10, y + 10, 68, 76);
        G.drawText(c, md.name, x + 96, y + 8, { size: 13, bold: true, color: C.line2 });
        const rows = [['装甲', ms.maxhp, m.armor], ['出力（近接）', ms.atk, m.power], ['推力（EN/速度）', ms.maxen, m.boost], ['武装（ビーム）', ms.beam, m.weapon]];
        rows.forEach(([l, v, lv], i) => {
          const yy = y + 30 + i * 16;
          G.drawText(c, l, x + 96, yy, { size: 9, color: C.dim });
          G.drawText(c, v, x + 210, yy, { size: 9, align: 'right' });
          for (let k = 0; k < 5; k++) {
            c.fillStyle = k < lv ? C.line : 'rgba(255,255,255,0.15)';
            c.fillRect(x + 220 + k * 9, yy + 2, 7, 6);
          }
        });
        G.drawText(c, '防御 ' + ms.def + '   速度 ' + ms.spd.toFixed(2), x + 96, y + 96, { size: 9, color: C.dim });
        G.drawText(c, 'ジャンクパーツ ×' + (G.state.items.scrap || 0) + '   レアチップ ×' + (G.state.items.chip || 0), x + 10, y + 120, { size: 9, color: C.line2 });
        G.drawText(c, '改造はスクラップ・ベイのドクに頼もう。', x + 10, y + 136, { size: 9, color: C.dim });
        G.drawText(c, '操作：Z ビームライフル（長押し連射・自動照準）', x + 10, y + 170, { size: 8, color: C.dim });
        G.drawText(c, '　　　X ブースト（EN消費・無敵）／C 近接攻撃', x + 10, y + 183, { size: 8, color: C.dim });
        if (G.state.skills.includes('overdrive')) G.drawText(c, '　　　EN満タンでC：オーバードライブ', x + 10, y + 196, { size: 8, color: C.line });
      },
    },
    // クエスト
    {
      update(w) {
        listNav(w, questList().length);
      },
      draw(c, w, x, y, ww, hh) {
        const s = G.state;
        G.drawText(c, (G.CHAPTERS[s.chapter] || [''])[0], x + 6, y + 4, { size: 9, color: C.line2 });
        G.drawText(c, (G.CHAPTERS[s.chapter] || ['', ''])[1], x + 6, y + 17, { size: 12, bold: true });
        G.drawText(c, '目的：' + (s.objective || '―'), x + 6, y + 36, { size: 10, color: C.gold });
        c.fillStyle = 'rgba(255,255,255,0.1)';
        c.fillRect(x, y + 54, ww, 1);
        G.drawText(c, 'サブクエスト', x + 6, y + 60, { size: 9, color: C.dim });
        const ql = questList();
        drawList(c, ql, w.sel, w.focus === 'list', x, y + 76, ww, 100, (q, xx, yy) => {
          const st = s.quests[q.id];
          G.drawText(c, (st === 'done' ? '✔ ' : '・') + q.name, xx, yy, { size: 10, color: st === 'done' ? C.dim : '#fff' });
        });
        const q = ql[w.sel];
        if (q && w.focus === 'list') G.wrapText(c, q.desc, ww - 10, 9).forEach((l, i) => G.drawText(c, l, x + 6, y + 186 + i * 13, { size: 9, color: C.dim }));
        G.drawText(c, '星屑メモリー ' + s.memories + ' / 20', x + ww - 6, y + 4, { size: 9, align: 'right', color: '#ff9ac8' });
      },
    },
    // 人物ファイル
    {
      update(w) {
        listNav(w, peopleList().length);
      },
      draw(c, w, x, y, ww, hh) {
        const pl = peopleList();
        drawList(c, pl, w.sel, w.focus === 'list', x, y + 4, 110, hh - 10, (id, xx, yy) => G.drawText(c, G.chars[id].name, xx, yy, { size: 10 }));
        const id = pl[w.sel];
        if (id) {
          const ch = G.chars[id];
          c.imageSmoothingEnabled = false;
          const px = x + 124;
          c.fillStyle = '#1a1238';
          c.fillRect(px, y + 4, 70, 70);
          c.drawImage(G.portrait(ch.por, 'normal'), px + 2, y + 6, 66, 66);
          const sh = ch.spr.special ? G.specialSheet(ch.spr.special) : G.charSheet(ch.spr);
          c.drawImage(sh.down[Math.floor(G.frame / 10) % 3 === 2 ? 2 : Math.floor(G.frame / 10) % 3], px + 76, y + 30, 36, 52);
          G.drawText(c, ch.full || ch.name, px + 120, y + 8, { size: 12, bold: true });
          const pr = (G.PROFILES || {})[id] || {};
          if (pr.tag) G.drawText(c, pr.tag, px + 120, y + 26, { size: 9, color: C.line2 });
          G.wrapText(c, pr.text || '……', ww - 134, 9).slice(0, 11).forEach((l, i) => G.drawText(c, l, px, y + 86 + i * 13, { size: 9, color: '#e0dcff' }));
        }
      },
    },
    // システム
    {
      opts: ['セーブ', 'ロード', 'BGM音量', '効果音量', '文字速度', 'ブラウン管風フィルタ', 'タイトルへ戻る'],
      update(w) {
        const n = this.opts.length;
        listNav(w, n);
        const s = G.settings;
        const lr = (I.pressed('right') ? 1 : 0) - (I.pressed('left') && w.sel >= 2 && w.sel <= 5 ? 1 : 0);
        if (w.sel === 2 && lr) {
          s.music = G.clamp(Math.round((s.music + lr * 0.1) * 10) / 10, 0, 1);
          G.audio.setMusicVol(s.music);
        }
        if (w.sel === 3 && lr) {
          s.sfx = G.clamp(Math.round((s.sfx + lr * 0.1) * 10) / 10, 0, 1);
          G.audio.setSfxVol(s.sfx);
          G.audio.se('cursor');
        }
        if (w.sel === 4 && lr) s.textSpeed = G.clamp(s.textSpeed + lr, 0, 3);
        if (w.sel === 5 && (lr || I.pressed('ok'))) s.crt = !s.crt;
        if (lr) G.saveSettings();
        if (I.pressed('ok')) {
          if (w.sel === 0) {
            if (G.ev.running || G.field.battle) {
              UI.toast('今はセーブできない', C.red);
              return;
            }
            w.sub = UI.slotSelect('save', () => (w.sub = null));
          } else if (w.sel === 1) w.sub = UI.slotSelect('load', () => (w.sub = null));
          else if (w.sel === 6) {
            G.audio.muffle(false);
            UI.closeAll();
            UI.toTitle();
          }
        }
      },
      draw(c, w, x, y, ww) {
        const s = G.settings;
        const vals = ['', '', bars(s.music), bars(s.sfx), ['おそい', 'ふつう', 'はやい', '瞬間'][s.textSpeed], s.crt ? 'ON' : 'OFF', ''];
        this.opts.forEach((o, i) => {
          const yy = y + 6 + i * 20;
          if (w.sel === i && w.focus === 'list') {
            c.fillStyle = C.sel;
            c.fillRect(x, yy - 3, ww, 17);
            cursor(c, x + 3, yy + 1);
          }
          G.drawText(c, o, x + 14, yy, { size: 10 });
          G.drawText(c, vals[i], x + ww - 10, yy, { size: 10, align: 'right', color: C.line2 });
        });
        G.drawText(c, '※ セーブはメニューからいつでも可能です（イベント中・戦闘中を除く）', x + 6, y + 160, { size: 8, color: C.dim });
        G.drawText(c, '※ 公衆端末（ホログラム）を調べるとHP/ENが全回復します', x + 6, y + 173, { size: 8, color: C.dim });
      },
    },
  ];
  function bars(v) {
    return '■'.repeat(Math.round(v * 10)) + '□'.repeat(10 - Math.round(v * 10));
  }
  function questList() {
    return Object.keys(G.state.quests)
      .filter((k) => G.QUESTS && G.QUESTS[k])
      .map((k) => Object.assign({ id: k }, G.QUESTS[k]));
  }
  function peopleList() {
    const order = Object.keys(G.PROFILES || {});
    return order.filter((id) => G.chars[id] && (G.state.flags['met_' + id] || id === 'kanata'));
  }

  // ---------- セーブスロット ----------
  UI.slotSelect = function (mode, onClose) {
    const w = { sel: 0 };
    w.update = function () {
      listNav(w, 3);
      if (I.pressed('cancel')) {
        onClose();
        return;
      }
      if (I.pressed('ok')) {
        const slot = w.sel + 1;
        if (mode === 'save') {
          G.save(slot);
          G.audio.se('save');
          UI.toast('スロット' + slot + ' にセーブしました', C.green);
          onClose();
        } else {
          if (!G.saveMeta(slot)) {
            G.audio.se('buzz');
            return;
          }
          G.audio.se('ok');
          onClose();
          UI.closeAll();
          G.startFromSave(slot);
        }
      }
    };
    w.drawHi = function (c) {
      G.panel(c, 130, 50, 300, 160, { title: mode === 'save' ? 'SAVE' : 'LOAD', accent: C.line2 });
      for (let i = 0; i < 3; i++) {
        const m = G.saveMeta(i + 1);
        const y = 66 + i * 46;
        if (i === w.sel) {
          c.fillStyle = C.sel;
          c.fillRect(136, y - 4, 288, 42);
          cursor(c, 140, y + 12);
        }
        G.drawText(c, 'SLOT ' + (i + 1), 152, y, { size: 10, color: C.line2 });
        if (m) {
          G.drawText(c, (G.CHAPTERS[m.chapter] || [''])[1] + '  Lv' + m.lv, 152, y + 13, { size: 10 });
          G.drawText(c, m.place + '   ' + G.fmtTime(m.play), 152, y + 26, { size: 8, color: C.dim });
        } else G.drawText(c, '― データなし ―', 152, y + 15, { size: 10, color: C.dim });
      }
    };
    return w;
  };

  // =============================================================
  //  ショップ
  // =============================================================
  UI.shop = function (goods, opt) {
    opt = opt || {};
    G.audio.muffle(false);
    return new Promise((resolve) => {
      const w = { sel: 0, mode: 'buy', resolve };
      const sellList = () => itemList((it) => (it.kind === 'use' || it.kind === 'mat' || it.kind === 'weapon' || it.kind === 'acc') && (it.sell || it.price) > 0 && G.state.equip.weapon !== undefined);
      w.update = function () {
        if (I.pressed('left') || I.pressed('right')) {
          w.mode = w.mode === 'buy' ? 'sell' : 'buy';
          w.sel = 0;
          G.audio.se('cursor');
        }
        const list = w.mode === 'buy' ? goods : sellList();
        listNav(w, list.length);
        if (I.pressed('cancel')) {
          UI.pop(w);
          resolve();
          return;
        }
        if (I.pressed('ok') && list[w.sel]) {
          const id = list[w.sel];
          const it = G.ITEMS[id];
          if (w.mode === 'buy') {
            if (G.state.money < it.price) {
              G.audio.se('buzz');
              UI.toast('お金が足りない', C.red);
              return;
            }
            G.state.money -= it.price;
            G.addItemCount(id, 1);
            G.audio.se('coin');
          } else {
            if (Object.values(G.state.equip).includes(id) && G.state.items[id] <= 1) {
              G.audio.se('buzz');
              UI.toast('装備中のものは売れない', C.red);
              return;
            }
            const pr = it.sell || Math.floor(it.price / 2);
            G.state.money += pr;
            G.addItemCount(id, -1);
            G.audio.se('coin');
            if (w.sel >= sellList().length) w.sel = Math.max(0, w.sel - 1);
          }
        }
      };
      w.drawHi = function (c) {
        G.panel(c, 70, 20, 340, 168, { title: opt.title || 'SHOP', accent: C.gold });
        ['かう', 'うる'].forEach((t, i) => {
          const on = (i === 0) === (w.mode === 'buy');
          c.fillStyle = on ? C.line : 'rgba(255,255,255,0.08)';
          c.fillRect(80 + i * 60, 30, 56, 15);
          G.drawText(c, t, 108 + i * 60, 32, { size: 10, align: 'center', color: on ? '#1a0f2e' : C.dim, shadow: false });
        });
        G.drawText(c, '所持金 ¢' + G.state.money.toLocaleString(), 400, 32, { size: 10, align: 'right', color: C.gold });
        const list = w.mode === 'buy' ? goods : sellList();
        drawList(c, list, w.sel, true, 80, 54, 320, 100, (id, xx, yy) => {
          const it = G.ITEMS[id];
          G.drawText(c, it.name, xx, yy, { size: 10 });
          const pr = w.mode === 'buy' ? it.price : it.sell || Math.floor(it.price / 2);
          G.drawText(c, '¢' + pr, 330, yy, { size: 10, align: 'right', color: C.gold });
          G.drawText(c, '持:' + (G.state.items[id] || 0), 396, yy, { size: 9, align: 'right', color: C.dim });
        });
        const id = list[w.sel];
        if (id) G.wrapText(c, G.ITEMS[id].desc, 310, 9).forEach((l, i) => G.drawText(c, l, 84, 160 + i * 12, { size: 9, color: C.dim }));
        G.drawText(c, '←→ 切替  Z 決定  X 閉じる', 400, 176, { size: 8, align: 'right', color: C.dim });
      };
      UI.push(w);
    });
  };

  // =============================================================
  //  機体改造（ドクのガレージ）
  // =============================================================
  const PARTS = [['armor', '装甲'], ['power', '出力'], ['boost', '推力'], ['weapon', '武装']];
  G.upgradeCost = (lv) => [null, { scrap: 4, money: 200 }, { scrap: 8, money: 500 }, { scrap: 14, money: 1000, chip: 1 }, { scrap: 22, money: 2000, chip: 3 }][lv];
  UI.upgrade = function () {
    return new Promise((resolve) => {
      const w = { sel: 0 };
      w.update = function () {
        listNav(w, PARTS.length);
        if (I.pressed('cancel')) {
          UI.pop(w);
          resolve();
          return;
        }
        if (I.pressed('ok')) {
          const [k, name] = PARTS[w.sel];
          const lv = G.state.mech[k];
          const cost = G.upgradeCost(lv);
          const s = G.state;
          if (!cost) {
            G.audio.se('buzz');
            UI.toast('これ以上は改造できない', C.red);
            return;
          }
          if ((s.items.scrap || 0) < cost.scrap || s.money < cost.money || (cost.chip && (s.items.chip || 0) < cost.chip)) {
            G.audio.se('buzz');
            UI.toast('素材かお金が足りない', C.red);
            return;
          }
          G.addItemCount('scrap', -cost.scrap);
          if (cost.chip) G.addItemCount('chip', -cost.chip);
          s.money -= cost.money;
          s.mech[k]++;
          G.audio.se('levelup');
          UI.toast(name + ' が Lv' + s.mech[k] + ' になった！', C.gold);
          s.mech.hp = null;
        }
      };
      w.drawHi = function (c) {
        G.panel(c, 70, 20, 340, 170, { title: 'ドクの改造工房', accent: C.line2 });
        const s = G.state;
        G.drawText(c, 'ジャンク ×' + (s.items.scrap || 0) + '   チップ ×' + (s.items.chip || 0) + '   ¢' + s.money.toLocaleString(), 400, 32, { size: 9, align: 'right', color: C.gold });
        PARTS.forEach(([k, name], i) => {
          const y = 54 + i * 26;
          const lv = s.mech[k];
          if (i === w.sel) {
            c.fillStyle = C.sel;
            c.fillRect(78, y - 4, 324, 22);
            cursor(c, 82, y + 3);
          }
          G.drawText(c, name, 96, y, { size: 11 });
          for (let q = 0; q < 5; q++) {
            c.fillStyle = q < lv ? C.line : 'rgba(255,255,255,0.15)';
            c.fillRect(150 + q * 11, y + 3, 9, 7);
          }
          const cost = G.upgradeCost(lv);
          G.drawText(c, cost ? 'ジャンク' + cost.scrap + (cost.chip ? ' チップ' + cost.chip : '') + '  ¢' + cost.money : 'MAX', 396, y + 2, { size: 9, align: 'right', color: cost ? C.dim : C.gold });
        });
        const ms = G.mechStats();
        G.drawText(c, `装甲 ${ms.maxhp}  近接 ${ms.atk}  EN ${ms.maxen}  ビーム ${ms.beam}`, 240, 166, { size: 9, align: 'center', color: C.line2 });
      };
      UI.push(w);
    });
  };

  // =============================================================
  //  CG表示用キャプション
  // =============================================================
  G.drawCGCaption = function (c, cg) {
    const lines = G.wrapText(c, cg.caption, 400, 11);
    const h = lines.length * 16 + 12;
    c.fillStyle = 'rgba(8,4,20,0.7)';
    c.fillRect(0, G.H - h - 8, G.W, h);
    lines.forEach((l, i) => G.drawText(c, l, G.W / 2, G.H - h - 2 + i * 16, { size: 11, align: 'center' }));
  };

  UI.toTitle = function () {
    UI.closeAll();
    G.ev.reset();
    G.field.battle = null;
    G.field.cg = null;
    G.field.fade = 0;
    G.field.tint = null;
    G.setScene(G.titleScene);
  };
})();
