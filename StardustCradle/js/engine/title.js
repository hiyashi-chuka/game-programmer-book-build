// =============================================================
//  title.js — タイトル画面・エンディング・起動
// =============================================================
(function () {
  const I = G.input;
  G.fieldScene = {
    update: () => G.field.update(),
    draw: (c) => G.field.draw(c),
    drawHi: (c) => G.field.drawHi(c),
  };

  const T = (G.titleScene = { t: 0, sel: 0, mode: 'press', sub: null });
  T.enter = function () {
    T.t = 0;
    T.mode = G.audio.ready ? 'menu' : 'press';
    T.sel = G.hasAnySave() ? 1 : 0;
    T.cg = { id: 'title', t: 0 };
    if (G.audio.ready) G.audio.bgm('title');
  };
  T.opts = () => ['はじめから', 'つづきから', 'せってい', 'あそびかた'];
  T.update = function () {
    T.t++;
    if (T.sub) return T.sub.update();
    if (T.mode === 'press') {
      if (I.pressed('ok') || I.pressed('menu')) {
        G.audio.init();
        G.audio.bgm('title');
        G.audio.se('ok');
        T.mode = 'menu';
      }
      return;
    }
    if (T.mode === 'menu') {
      const n = T.opts().length;
      if (I.pressed('down')) {
        T.sel = (T.sel + 1) % n;
        G.audio.se('cursor');
      }
      if (I.pressed('up')) {
        T.sel = (T.sel - 1 + n) % n;
        G.audio.se('cursor');
      }
      if (I.pressed('ok')) {
        if (T.sel === 0) {
          G.audio.se('ok');
          G.newGame();
        } else if (T.sel === 1) {
          if (!G.hasAnySave()) {
            G.audio.se('buzz');
            return;
          }
          G.audio.se('ok');
          T.sub = G.ui.slotSelect('load', () => (T.sub = null));
        } else if (T.sel === 2) {
          G.audio.se('ok');
          T.mode = 'settings';
          T.ss = 0;
        } else {
          G.audio.se('ok');
          T.mode = 'help';
        }
      }
      return;
    }
    if (T.mode === 'settings') {
      const s = G.settings;
      if (I.pressed('down')) T.ss = (T.ss + 1) % 4;
      if (I.pressed('up')) T.ss = (T.ss + 3) % 4;
      const lr = (I.pressed('right') ? 1 : 0) - (I.pressed('left') ? 1 : 0);
      if (lr) {
        if (T.ss === 0) G.audio.setMusicVol((s.music = G.clamp(Math.round((s.music + lr * 0.1) * 10) / 10, 0, 1)));
        if (T.ss === 1) G.audio.setSfxVol((s.sfx = G.clamp(Math.round((s.sfx + lr * 0.1) * 10) / 10, 0, 1)));
        if (T.ss === 2) s.textSpeed = G.clamp(s.textSpeed + lr, 0, 3);
        if (T.ss === 3) s.crt = !s.crt;
        G.audio.se('cursor');
        G.saveSettings();
      }
      if (I.pressed('cancel') || I.pressed('ok')) T.mode = 'menu';
      return;
    }
    if (T.mode === 'help') {
      if (I.pressed('cancel') || I.pressed('ok')) T.mode = 'menu';
    }
  };
  T.draw = function (c) {
    G.drawCG(c, T.cg);
  };
  T.drawHi = function (c) {
    const t = T.t;
    // ロゴ
    const ly = 44;
    c.save();
    c.globalCompositeOperation = 'lighter';
    G.glow(c, G.W / 2, ly + 16, 150, 'rgba(255,95,162,0.25)');
    c.restore();
    G.drawText(c, '星屑のクレイドル', G.W / 2, ly, { size: 34, align: 'center', bold: true, color: '#ffffff', outline: '#2a0f3e' });
    c.fillStyle = G.UI.line;
    c.fillRect(G.W / 2 - 120, ly + 42, 240, 1);
    c.fillStyle = G.UI.line2;
    c.fillRect(G.W / 2 - 90, ly + 45, 180, 1);
    G.drawText(c, 'S T A R D U S T   C R A D L E', G.W / 2, ly + 50, { size: 10, align: 'center', color: G.UI.line2, outline: '#0a0620' });
    G.drawText(c, '― コロニー・ジュブナイル ―', G.W / 2, ly + 64, { size: 9, align: 'center', color: '#ffe0f0', outline: '#0a0620' });
    if (T.mode === 'press') {
      if (Math.floor(t / 30) % 2 === 0) G.drawText(c, 'PRESS  Z  /  ENTER', G.W / 2, 150, { size: 12, align: 'center', outline: '#0a0620' });
      G.drawText(c, '※ 音が鳴ります', G.W / 2, 168, { size: 8, align: 'center', color: G.UI.dim, outline: '#0a0620' });
    } else if (T.mode === 'menu') {
      const opts = T.opts();
      const mx = G.W - 136,
        my = 130;
      G.panel(c, mx, my, 120, opts.length * 18 + 10, {});
      opts.forEach((o, i) => {
        const y = my + 6 + i * 18;
        const dis = i === 1 && !G.hasAnySave();
        if (i === T.sel) {
          c.fillStyle = G.UI.sel;
          c.fillRect(mx + 4, y - 2, 112, 16);
        }
        G.drawText(c, o, mx + 60, y, { size: 11, align: 'center', color: dis ? '#5a5478' : i === T.sel ? '#ffffff' : G.UI.dim });
      });
    } else if (T.mode === 'settings') {
      const s = G.settings;
      G.panel(c, G.W / 2 - 110, 128, 220, 92, { title: 'せってい' });
      const rows = [['BGM', '■'.repeat(Math.round(s.music * 10)) + '□'.repeat(10 - Math.round(s.music * 10))], ['効果音', '■'.repeat(Math.round(s.sfx * 10)) + '□'.repeat(10 - Math.round(s.sfx * 10))], ['文字速度', ['おそい', 'ふつう', 'はやい', '瞬間'][s.textSpeed]], ['CRTフィルタ', s.crt ? 'ON' : 'OFF']];
      rows.forEach(([a, b], i) => {
        const y = 140 + i * 18;
        if (i === T.ss) {
          c.fillStyle = G.UI.sel;
          c.fillRect(G.W / 2 - 104, y - 2, 208, 16);
        }
        G.drawText(c, a, G.W / 2 - 96, y, { size: 10 });
        G.drawText(c, b, G.W / 2 + 96, y, { size: 10, align: 'right', color: G.UI.line2 });
      });
    } else if (T.mode === 'help') {
      G.panel(c, 40, 100, G.W - 80, 160, { title: 'あそびかた' });
      [
        '矢印キー / WASD ……… 移動',
        'Z / Space / Enter ……… 話す・調べる・攻撃（連打でコンボ）',
        'X / Shift ……… ダッシュ（無敵時間あり）・キャンセル',
        'C ……… スキル（EN消費）',
        'Esc / Q / Tab ……… メニュー（アイテム・装備・セーブ）',
        '',
        '【機体戦】Z ビーム（長押し連射・自動照準）',
        '　　　　　X ブースト　C 近接攻撃',
        'ゲームパッド・スマホのタッチ操作にも対応しています。',
      ].forEach((l, i) => G.drawText(c, l, 54, 112 + i * 15, { size: 9 }));
    }
    G.drawText(c, 'Ver 1.0  ©2026 Stardust Cradle Project', G.W - 6, G.H - 12, { size: 7, align: 'right', color: 'rgba(255,255,255,0.5)' });
    if (T.sub) T.sub.drawHi(c);
    if (G.settings.crt) G.field.drawCRT(c);
  };

  // ---------- 開始 ----------
  G.newGame = async function () {
    G.state = G.newState();
    G.ui.closeAll();
    G.ev.reset();
    G.setScene(G.fieldScene);
    if (G.STORY && G.STORY.start) await G.STORY.start();
  };
  G.startFromSave = function (slot) {
    if (!G.load(slot)) return;
    G.ui.closeAll();
    G.ev.reset();
    G.field.battle = null;
    G.field.cg = null;
    G.field.fade = 1;
    G.setScene(G.fieldScene);
    const s = G.state;
    G.field.load(s.map, s.x, s.y, s.dir);
    G.ev.run(async () => {
      await G.ev.fadeIn(20);
      await G.ev.runMapEnter();
    });
  };

  // ---------- エンディング／スタッフロール ----------
  G.CREDITS = [
    ['', '星屑のクレイドル'],
    ['', 'STARDUST CRADLE'],
    [],
    ['春瀬 カナタ', '主人公。父のスパナと、ちょっとの勇気。'],
    ['水無月 ルウ', '本物の空を探す、スケボー少女。'],
    ['ニコ', '星の声を聴く子。ラーメンが好き。'],
    ['シグ', '落ちなかった空を、見に来た少年。'],
    [],
    ['権田 ポンタロウ', '風見 ユイ'],
    ['小鳥遊 ミミ', '鬼塚 キョウスケ'],
    ['バルガス先生', '春瀬 トメ'],
    ['ドク・モーリス', 'ネジ ＆ キューブ'],
    ['DJリリィ', 'ギル・ブレイズ'],
    ['アイゼン少佐', '風見総督'],
    ['ミラージュ／春瀬 ジン', 'ドクター・ヘルミナ・クロイツ'],
    ['〈マザー〉', 'クレイドル7のみなさん'],
    [],
    ['GAME DESIGN / SCENARIO', 'Stardust Cradle Project'],
    ['PIXEL ART (PROCEDURAL)', 'Stardust Cradle Project'],
    ['MUSIC (WEBAUDIO SYNTH)', 'Stardust Cradle Project'],
    [],
    ['SPECIAL THANKS', 'あなた'],
    [],
    ['', 'この空が、ニセモノでも。'],
    ['', 'ここが、わたしたちの空。'],
  ];
  G.credits = function () {
    return new Promise((resolve) => {
      const prev = G.scene;
      G.audio.bgm('ending', { restart: true });
      const S = {
        t: 0,
        cg: { id: 'dawn', t: 0 },
        update() {
          S.t++;
          const total = G.CREDITS.length * 26 + G.H + 120;
          const speed = I.down('ok') ? 3 : 0.35;
          S.y = (S.y || 0) + speed;
          if (S.y > total) {
            G.setScene(prev);
            resolve();
          }
        },
        draw(c) {
          G.drawCG(c, S.cg);
          c.fillStyle = 'rgba(6,4,20,0.45)';
          c.fillRect(0, 0, G.W, G.H);
        },
        drawHi(c) {
          let y = G.H + 20 - (S.y || 0);
          for (const row of G.CREDITS) {
            if (y > -30 && y < G.H + 30) {
              if (row.length === 2 && row[0] === '') G.drawText(c, row[1], G.W / 2, y, { size: 14, align: 'center', bold: true, outline: '#140c22' });
              else if (row.length === 2) {
                G.drawText(c, row[0], G.W / 2 - 8, y, { size: 10, align: 'right', color: G.UI.line2, outline: '#140c22' });
                G.drawText(c, row[1], G.W / 2 + 8, y, { size: 10, color: '#ffffff', outline: '#140c22' });
              }
            }
            y += 26;
          }
          const endY = y + 40;
          if (endY < G.H / 2 + 10) G.drawText(c, '― F I N ―', G.W / 2, Math.max(G.H / 2 - 10, endY - 20), { size: 18, align: 'center', color: G.UI.gold, outline: '#140c22' });
          if (G.settings.crt) G.field.drawCRT(c);
        },
      };
      G.setScene(S);
    });
  };

  // ---------- 起動 ----------
  G.boot = async function () {
    G.initCanvas();
    G.initTouch();
    G.audio.musicVol = G.settings.music;
    G.audio.sfxVol = G.settings.sfx;
    try {
      await Promise.race([document.fonts.load('16px "DotGothic16"'), G.sleep(2500)]);
    } catch (e) {}
    G.prewarmCG();
    const q = new URLSearchParams(location.search);
    G.setScene(T);
    G.start();
    // デバッグ：?chapter=N で章の頭から開始
    if (q.get('chapter')) {
      G.audio.init();
      G.state = G.newState();
      G.setScene(G.fieldScene);
      if (G.STORY.debugSetup) G.STORY.debugSetup(+q.get('chapter'));
      G.ev.run(() => G.ev.startChapter(+q.get('chapter')));
      return;
    }
    // デバッグ：?map=xxx&x=&y= で直接開始
    if (q.get('map')) {
      G.audio.init();
      G.state = G.newState();
      if (q.get('ch')) G.state.chapter = +q.get('ch');
      G.setScene(G.fieldScene);
      G.field.load(q.get('map'), +(q.get('x') || 5), +(q.get('y') || 5), 'down');
      if (q.get('enter') !== '0') G.ev.run(() => G.ev.runMapEnter());
    }
  };
})();
