// =============================================================
//  maps/c1.js — 第1章「ジャンクヤードの白い影」用のマップ・小物
//   c1_yard : 夜のスクラップ・ベイ資材ヤード（ステルス区間）
//   ドクのガレージ裏口・装甲車・サーチライト等の小物、部品アイテム
// =============================================================
(function () {
  const r = G.rect,
    px = G.px;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;

  // ---------------------------------------------------------------
  //  アイテム
  // ---------------------------------------------------------------
  G.addItem('c1_actuator', { name: '駆動アクチュエータ', desc: 'ワークフレームの膝を動かす駆動装置。暴走ボットが自分の脚に使っていた。' });
  G.addItem('c1_cell', { name: '古いパワーセル', desc: '軍の払い下げ品らしい大容量バッテリー。まだ少し温かい。' });

  // ---------------------------------------------------------------
  //  人物
  // ---------------------------------------------------------------
  G.addItem('c1_spring', { name: 'オルゴールのゼンマイ', desc: '小さな星の模様がついたゼンマイ。モモが落としたもの。' });
  G.mob('c1_momo', '迷子のモモ', 613, { kid: true, girl: true, over: { top: '#ffb0c8', outfit: 'dress', style: 'twin', hair: '#7a4a2a' } });
  G.mob('c1_guardA', '公安隊員', 611, { girl: false, over: Object.assign({}, G.chars.guard.spr) });
  G.mob('c1_captain', 'ガードナー隊長', 612, { girl: false, over: Object.assign({}, G.chars.guard.spr, { top: '#2a2e44', accCol: '#3a3a4a' }) });

  // ---------------------------------------------------------------
  //  小物
  // ---------------------------------------------------------------
  // ガレージの裏口（壁に描く）
  P.c1_backdoor = function () {
    const cv = mk(16, 32),
      c = cv.ctx;
    r(c, 1, 2, 14, 30, '#4a4e5e');
    r(c, 2, 3, 12, 28, '#6a7084');
    for (let y = 6; y < 30; y += 4) r(c, 2, y, 12, 1, '#5a6070');
    r(c, 11, 16, 2, 3, '#ffd25e');
    r(c, 3, 4, 10, 4, '#2a2a34');
    G.pixText(c, 'EXIT', 2, 5, '#7dff9a');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -16, solid: false, lights: [{ x: 8, y: -8, r: 14, col: '#7dff9a', a: 0.5, flicker: true }] };
  };
  // 公安の装甲車（3×2）
  P.c1_apc = function (o) {
    const cv = mk(48, 44),
      c = cv.ctx;
    const col = o.col || '#4a5a7a';
    r(c, 3, 38, 44, 5, 'rgba(10,6,24,0.4)');
    r(c, 2, 14, 44, 24, col);
    r(c, 2, 14, 44, 3, G.shade(col, 0.25));
    r(c, 2, 34, 44, 4, G.shade(col, -0.4));
    r(c, 8, 4, 24, 12, G.shade(col, -0.1));
    r(c, 10, 6, 8, 5, '#9ad0f0');
    r(c, 20, 6, 8, 5, '#9ad0f0');
    r(c, 2, 22, 44, 3, '#ffd25e');
    G.pixText(c, 'POLICE', 10, 27, '#f0f0f0');
    for (const x of [6, 18, 30, 40]) G.ellipse(c, x, 38, 4, 3, '#1a1a24');
    r(c, 34, 2, 4, 3, '#ff3050');
    r(c, 38, 2, 4, 3, '#3a8aff');
    return {
      w: 3, h: 2, img: cv, ox: 0, oy: 32 - 44, solid: true,
      lights: [
        { x: 36, y: -10, r: 26, col: '#ff3050', a: 0.7, blink: true },
        { x: 40, y: -10, r: 26, col: '#3a8aff', a: 0.7, flicker: true },
        { x: 46, y: 6, r: 40, col: '#fff4c0', a: 0.5, night: true },
      ],
    };
  };
  // サーチライトの塔（1×1）
  P.c1_searchlight = function () {
    const cv = mk(16, 64),
      c = cv.ctx;
    r(c, 3, 60, 10, 3, 'rgba(10,6,24,0.4)');
    r(c, 7, 14, 2, 48, '#5a6070');
    r(c, 4, 18, 1, 44, '#4a5060');
    r(c, 11, 18, 1, 44, '#4a5060');
    for (let y = 22; y < 60; y += 8) G.line(c, 4, y, 11, y + 6, '#4a5060');
    r(c, 2, 6, 12, 9, '#3a3e4e');
    r(c, 4, 8, 8, 5, '#fff8d0');
    return { w: 1, h: 1, img: cv, ox: 0, oy: -48, solid: true, lights: [{ x: 8, y: -38, r: 50, col: '#fff4c0', a: 0.75, flicker: true }] };
  };
  // ガラクタの山の中で光る部品（目印）
  P.c1_glint = function (o) {
    const cv = mk(16, 16),
      c = cv.ctx;
    r(c, 3, 10, 10, 3, '#5a5a6a');
    r(c, 5, 7, 6, 4, o.col || '#4ef0ff');
    r(c, 6, 8, 2, 1, '#ffffff');
    return { w: 1, h: 1, img: cv, ox: 0, oy: 0, solid: false, lights: [{ x: 8, y: 8, r: 16, col: o.col || '#4ef0ff', a: 0.6, flicker: true }] };
  };

  // ---------------------------------------------------------------
  //  資材ヤード（夜・ステルス） c1_yard（46×24）
  // ---------------------------------------------------------------
  const Y = G.W2.grid(46, 24, 's');
  Y.fill(0, 0, 46, 1, 'F').fill(0, 23, 46, 1, 'F').fill(0, 0, 1, 24, 'F').fill(45, 0, 1, 24, 'F');
  Y.fill(0, 11, 1, 2, '-').fill(1, 11, 3, 2, '-');
  Y.fill(42, 11, 4, 2, '-');
  Y.fill(12, 10, 18, 4, 'c'); // 中央の通路（コンクリート）
  // 散らかり（遮蔽物）
  [
    [5, 2, 'Q'], [5, 21, 'G'], [1, 6, 'C'], [1, 18, 'C'],
    [15, 11, 'C'], [19, 13, 'Q'], [24, 10, 'C'], [25, 10, 'C'], [28, 13, 'G'],
    [13, 1, 'Q'], [21, 22, 'Q'], [29, 1, 'C'],
    [29, 9, 'C'], [29, 14, 'Q'],
    [41, 8, 'C'], [42, 8, 'C'], [41, 15, 'Q'], [42, 15, 'C'], [43, 3, 'G'], [43, 20, 'G'],
    [38, 11, 'Q'],
  ].forEach(([x, y, c]) => Y.set(x, y, c));
  const cont = (x, y, col, text, stack) => ({ p: 'container', x, y, col, text, stack: stack || 1 });

  // 見つかった時
  async function spotted(e) {
    E.cut(true);
    if (e.type === 'drone') {
      E.se('alarm');
      await E.say('sys', 'ピピピッ！ 侵入者ヲ確認！ 侵入者ヲ確認！', { name: '警備ドローン' });
    } else await E.say('c1_guardA', '……！ そこにいるのは誰だ！ 止まれ！');
    const n = E.inc('c1_spotted');
    if (n === 1) await E.say('ruu:surprise', 'やばっ……カナタ、こっち！ いったん隠れよ！');
    else if (n === 2) await E.say('ruu:angry', 'もう、ヘタクソ！ 光の扇の中に入っちゃダメなんだってば！');
    else if (n === 3) {
      await E.say('ruu', '……ねえ、見張りってさ、立ち止まると、きょろきょろ向きを変えるでしょ。');
      await E.say('ruu', '歩いてる時は、進む方向しか見てない。背中を追いかけるように動けば、たぶんバレない。');
    } else await E.say('ruu', G.pick(['落ち着いて、カナタ。あんたシミュレーター1位でしょ。', '……ドローンは角で向きを変えるよ。そこがチャンス。', 'はあ……あたしの門限、もう完全にアウトだわ。']));
    await E.fadeOut(20);
    const cp = E.flag('c1_yard_cp') ? [27, 11] : [2, 11];
    await E.warp('c1_yard', cp[0], cp[1], 'right', { noFade: true });
    await E.fadeIn(20);
  }

  G.defMap('c1_yard', {
    name: '資材ヤード',
    area: 'スクラップ・ベイ・夜間封鎖中',
    bgm: 'tension',
    outdoor: true,
    time: 'night',
    ambient: 'dust',
    floor: 's',
    rows: Y.rows(),
    objects: [
      cont(2, 3, '#3a6ab0', 'C7-14'),
      cont(2, 15, '#c04a3a', 'JUNK', 2),
      cont(9, 2, '#7a5aa0', 'C7-33', 2),
      cont(9, 7, '#3a9a6a', 'AF-PARTS'),
      cont(9, 14, '#d0902a', 'C7-08'),
      cont(9, 19, '#4a8aa0', 'SCRAP', 2),
      cont(16, 5, '#c04a3a', 'C7-61'),
      cont(22, 5, '#3a6ab0', 'DOC'),
      cont(16, 16, '#d0902a', 'C7-19', 2),
      cont(22, 16, '#7a5aa0', 'FRAGILE'),
      cont(34, 2, '#3a9a6a', 'C7-77', 2),
      cont(34, 6, '#c04a3a', 'HEAVY'),
      cont(34, 14, '#3a6ab0', 'C7-90'),
      cont(34, 19, '#d0902a', 'PORT', 2),
      { p: 'c1_searchlight', x: 12, y: 1 },
      { p: 'c1_searchlight', x: 31, y: 22 },
      { p: 'c1_apc', x: 38, y: 2 },
      { p: 'c1_apc', x: 38, y: 19, col: '#3a4a6a' },
      { p: 'scrap', x: 25, y: 20, seed: 31 },
      { p: 'scrap', x: 26, y: 1, seed: 32 },
      { p: 'lamp', x: 13, y: 9 },
      { p: 'lamp', x: 30, y: 9 },
      { p: 'sign', x: 44, y: 10, text: 'EXIT', col: '#ffd25e', msg: '「廃材置き場 →」' },
      { p: 'sign', x: 3, y: 10, text: 'DOC', col: '#c03a3a', msg: '「← ドクのガレージ（裏口）」' },
    ],
    lights: [
      { x: 20, y: 11, r: 30, col: '#ffe0a0', a: 0.3 },
      { x: 44, y: 11, r: 40, col: '#ff3050', a: 0.4, flicker: true },
    ],
    enemies: [
      // 区画A：縦に巡回する隊員
      { type: 'guard', x: 7, y: 21, patrol: [[7, 21], [7, 2]], vision: 70, dir: 'up', onSpot: spotted },
      // 区画B：周回する警備ドローン
      { type: 'drone', x: 13, y: 3, patrol: [[13, 3], [27, 3], [27, 8], [13, 8]], vision: 64, dir: 'right', onSpot: spotted },
      { type: 'drone', x: 27, y: 20, patrol: [[27, 20], [13, 20], [13, 15], [27, 15]], vision: 64, dir: 'left', onSpot: spotted },
      // 区画C：縦の巡回と、出口前の見張り
      { type: 'guard', x: 31, y: 2, patrol: [[31, 2], [31, 21]], vision: 72, dir: 'down', onSpot: spotted },
      { type: 'guard', x: 40, y: 7, patrol: [[40, 7], [40, 16]], vision: 64, dir: 'down', onSpot: spotted },
    ],
    items: [
      { x: 1, y: 21, item: 'repair', id: 'c1_y1' },
      { x: 44, y: 21, item: 'energy', id: 'c1_y2' },
      { x: 20, y: 1, item: 'melonpan', id: 'c1_y3' },
    ],
    events: [
      {
        x: 30, y: 1, w: 1, h: 22, once: 'c1_yard_cp',
        run: async () => {
          E.toast('チェックポイント：ここから再開できる', '#7dff9a');
          await E.say('ruu', '（……はぁ、あと半分。出口の前に、もう一人いるよ。気をつけて）');
        },
      },
    ],
    warps: [
      { x: 0, y: 11, w: 1, h: 2, to: 'doc_garage', tx: 24, ty: 4, dir: 'down' },
      { x: 45, y: 11, w: 1, h: 2, to: 'scrap_field', tx: 2, ty: 13, dir: 'right' },
    ],
    decorate(c, m) {
      for (let i = 0; i < 140; i++) {
        const x = Math.floor(G.hash(i, 61, 3) * 46 * 16),
          y = Math.floor(G.hash(i, 62, 3) * 24 * 16);
        if (m.cell(x >> 4, y >> 4) !== 's') continue;
        const k = G.hash(i, 63, 3);
        if (k < 0.4) G.ellipse(c, x, y, 4 + Math.floor(k * 16), 2 + Math.floor(k * 5), 'rgba(40,34,44,0.3)');
        else if (k < 0.75) r(c, x, y, 3, 2, ['#8a92a6', '#a86a4a', '#c0a040', '#5a6070'][i % 4]);
        else G.line(c, x, y, x + 5, y + 2, '#7a7e8e');
      }
      // 中央通路の白線
      for (let x = 12 * 16; x < 30 * 16; x += 12) r(c, x, 12 * 16 - 1, 6, 2, 'rgba(240,240,240,0.4)');
    },
    post(c, ox, oy, f) {
      // サーチライトの光の帯（演出）
      c.globalCompositeOperation = 'lighter';
      const sweep = (bx, by, base, span, speed) => {
        const a = base + Math.sin(f * speed) * span;
        const x = bx + ox,
          y = by + oy;
        const len = 150;
        const g = c.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
        g.addColorStop(0, 'rgba(255,244,200,0.22)');
        g.addColorStop(1, 'rgba(255,244,200,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.cos(a - 0.12) * len, y + Math.sin(a - 0.12) * len);
        c.lineTo(x + Math.cos(a + 0.12) * len, y + Math.sin(a + 0.12) * len);
        c.closePath();
        c.fill();
      };
      sweep(12 * 16 + 8, 1 * 16 - 26, Math.PI * 0.5, 0.9, 0.012);
      sweep(31 * 16 + 8, 22 * 16 - 26, -Math.PI * 0.5, 0.9, 0.009);
      c.globalCompositeOperation = 'source-over';
    },
    onEnter: async () => {
      if (E.flag('c1_yard_intro')) return;
      E.set('c1_yard_intro');
      E.cut(true);
      await E.wait(20);
      await E.say(null, '裏口の先は、コンテナが迷路のように積まれた資材ヤードだった。');
      await E.say(null, 'サーチライトの光が、夜を切りさいて行き来している。');
      await E.camera(20, 11);
      await E.say('c1_guardA', '……白い髪のガキは見つかったか？', { name: '公安隊員の声' });
      await E.say('c1_guardA', 'まだだ。「対象」は、このブロックに逃げこんだはずだ。朝までに確保しろとのお達しだ。', { name: '公安隊員の声' });
      await E.cameraReset();
      await E.say('ruu:surprise', '白い髪の……ガキ？ 子どもを探してるの？ 公安が？');
      await E.say('kanata', '……なんか、ヤバそうだな。');
      await E.say('ruu:serious', 'でも、ここを抜けないと帰れない。……行こ、カナタ。');
      await E.notice('【ステルス】見張りの前に広がる「光の扇」が視界。\n入ると見つかってしまう。コンテナや木箱の陰を使って、東の出口へ進もう。');
      E.objective('見張りに見つからずに、資材ヤードの東の出口へ');
    },
  });
})();
