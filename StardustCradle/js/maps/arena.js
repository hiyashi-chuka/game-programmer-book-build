// =============================================================
//  maps/arena.js — アンダーシェル・ロビー／ジャンク・デュエル会場
// =============================================================
(function () {
  const W2 = G.W2;
  const r = G.rect,
    px = G.px,
    S = 16;
  const mk = (w, h) => G.makeCanvas(w, h);
  const P = G.PROPS;

  // ---------------------------------------------------------------
  //  カスタム小物
  // ---------------------------------------------------------------
  // 貨物エレベーターの扉（壁2段ぶん・3タイル幅）
  P.w2_elevator = function () {
    const cv = mk(48, 32),
      c = cv.ctx;
    r(c, 0, 0, 48, 32, '#2a2a34');
    r(c, 2, 2, 44, 30, '#5a6070');
    r(c, 4, 6, 19, 26, '#8a90a0');
    r(c, 25, 6, 19, 26, '#8a90a0');
    for (let y = 8; y < 32; y += 4) {
      r(c, 4, y, 19, 1, '#7a8090');
      r(c, 25, y, 19, 1, '#7a8090');
    }
    for (let i = 0; i < 48; i += 6) {
      r(c, i, 0, 3, 3, '#ffd25e');
      r(c, i + 3, 0, 3, 3, '#2a2a30');
    }
    r(c, 18, 3, 12, 3, '#1a1420');
    G.pixText(c, 'UP', 20, 3, '#7dff9a');
    return { w: 3, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true, lights: [{ x: 24, y: 4, r: 18, col: '#7dff9a', a: 0.6 }] };
  };
  // アリーナへの大扉（壁2段ぶん）
  P.w2_arenagate = function (o) {
    const w = o.w || 4,
      W = w * S;
    const cv = mk(W, 32),
      c = cv.ctx;
    r(c, 0, 0, W, 32, '#1a1420');
    r(c, 2, 4, W - 4, 28, '#3a3448');
    for (let i = 4; i < W - 4; i += 4) r(c, i, 6, 2, 26, '#5a5470');
    r(c, 0, 0, W, 4, '#ff5fa2');
    G.pixText(c, 'ARENA', W / 2 - 9, 0, '#1a1420');
    r(c, W / 2 - 1, 4, 2, 28, '#141018');
    return { w, h: 1, img: cv, ox: 0, oy: 0, solid: false, flat: true, lights: [{ x: W / 2, y: 2, r: 40, col: '#ff5fa2', a: 0.8, flicker: true }] };
  };
  // 大型モニター（壁）
  P.w2_bigscreen = function (o) {
    const w = o.w || 4,
      W = w * S;
    const cv = mk(W, 26),
      c = cv.ctx;
    r(c, 0, 0, W, 26, '#141018');
    r(c, 2, 2, W - 4, 20, '#1a2a4a');
    // 試合映像（2体の機体のシルエット）
    r(c, 8, 12, 6, 8, '#f0f0f6');
    r(c, 9, 9, 4, 3, '#f0f0f6');
    r(c, W - 16, 12, 6, 8, '#e0303a');
    r(c, W - 15, 9, 4, 3, '#e0303a');
    G.line(c, 15, 14, W - 18, 14, '#4ef0ff');
    for (let i = 4; i < W - 4; i += 3) px(c, i, 21, '#2a3a5a');
    G.pixText(c, o.text || 'LIVE', 4, 3, '#ff3050');
    r(c, W / 2 - 1, 22, 2, 4, '#3a3a48');
    return { w, h: 1, img: cv, ox: 0, oy: 3, solid: false, flat: true, lights: [{ x: W / 2, y: 12, r: W / 2 + 6, col: '#4ea0ff', a: 0.6, flicker: true }] };
  };
  // 酒棚（バー：ジュースとオイル缶）
  P.w2_barshelf = function (o) {
    const w = o.w || 4,
      W = w * S;
    const cv = mk(W, 34),
      c = cv.ctx;
    r(c, 0, 0, W, 34, '#2a1a24');
    for (let j = 0; j < 3; j++) {
      const y = 3 + j * 10;
      r(c, 1, y + 7, W - 2, 2, '#6a4a3a');
      for (let i = 3; i < W - 3; i += 4) {
        const col = ['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a', '#ff8040', '#a060ff'][Math.floor(G.hash(i, j, w) * 6)];
        r(c, i, y + 1, 2, 6, col);
        px(c, i, y, G.shade(col, 0.4));
      }
    }
    return { w, h: 1, img: cv, ox: 0, oy: -18, solid: true, lights: [{ x: W / 2, y: -2, r: W / 2 + 8, col: '#ff8fb8', a: 0.4 }] };
  };

  // ---------------------------------------------------------------
  //  アンダーシェル・ロビー shell_lobby（36×20）
  // ---------------------------------------------------------------
  const L = W2.grid(36, 20, 'w');
  L.fill(1, 3, 34, 16, 'm');
  L.fill(13, 3, 10, 4, 'g'); // ゲート前のグレーチング
  L.fill(2, 3, 5, 2, 'x'); // エレベーター前
  L.fill(10, 9, 16, 1, 'x');
  [[1, 18, 'P'], [34, 18, 'P'], [8, 3, 'E'], [9, 3, 'E'], [26, 3, 'E'], [11, 18, 'j'], [6, 16, 'Z'], [34, 3, 'V'], [33, 3, 'V'], [1, 13, 'Q'], [1, 14, 'Q'], [2, 14, 'C'], [22, 18, 'G'], [23, 18, 'G']].forEach(([x, y, ch]) => L.set(x, y, ch));
  // スツール
  [27, 28, 29, 30, 31, 32].forEach((x) => L.set(x, 11, 'U'));
  [[7, 12], [9, 12], [7, 14], [9, 14], [15, 13], [17, 13], [15, 15], [17, 15], [23, 15], [25, 15]].forEach(([x, y]) => L.set(x, y, 'U'));

  G.mob('w2_registrar', '受付のマダム・ルージュ', 401, { girl: true, old: false, kid: false, over: { outfit: 'suit', top: '#c02040', top2: '#1a1a1a', style: 'bob', hair: '#1a1a24', acc: ['sunglasses'], accCol: '#ff5fa2', build: 'tall' } });
  G.mob('w2_bartender', 'バーテンのオズ', 402, { girl: false, old: true, over: { outfit: 'suit', top: '#2a2a3a', top2: '#f0f0f0', tie: '#c02040', style: 'slick', hair: '#d8d8e0', beard: '#d8d8e0' } });
  G.mob('w2_django', '闇パーツ屋ジャンゴ', 403, { girl: false, old: false, kid: false, over: { outfit: 'coat', top: '#5a4a3a', acc: ['goggles'], accCol: '#ffd25e', style: 'messy', hair: '#7a5a3a', beard: '#5a3a2a' } });
  G.mob('w2_gantetsu', '鉄亀団のガンテツ', 404, { girl: false, old: false, kid: false, over: { outfit: 'jumpsuit', top: '#4a7a5a', bottom: '#3a5a4a', build: 'big', style: 'buzz', hair: '#2a2a2a', acc: ['helmet'], accCol: '#4a7a5a' } });
  G.mob('w2_kame', '鉄亀団のコウラ', 405, { girl: true, old: false, kid: false, over: { outfit: 'jumpsuit', top: '#4a7a5a', bottom: '#3a5a4a', style: 'bun', hair: '#5a3a2a' } });
  G.mob('w2_hachi', '蜂団のハチコ', 406, { girl: true, old: false, kid: false, over: { outfit: 'jacket', top: '#ffd25e', top2: '#1a1a1a', style: 'twin', hair: '#1a1a1a', acc: ['goggles'], accCol: '#1a1a1a' } });
  G.mob('w2_buzz', '蜂団のブンタ', 407, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#ffd25e', top2: '#1a1a1a', style: 'spiky', hair: '#ffd25e', build: 'slim' } });
  G.mob('w2_leo', 'ジャッカルズのレオ', 408, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#c02030', top2: '#1a1a1a', style: 'slick', hair: '#ff8040', acc: ['sunglasses'], accCol: '#141418' } });
  G.mob('w2_veteran', '引退デュエリストのゲン爺', 409, { girl: false, old: true, over: { outfit: 'jacket', top: '#5a5a6a', acc: ['eyepatch'], accCol: '#1a1a1a', beard: '#c0c0c8' } });
  G.mob('w2_bookie', '賭け屋のコイン', 410, { girl: false, old: false, kid: false, over: { outfit: 'suit', top: '#7a5ae0', top2: '#ffd25e', tie: '#ffd25e', style: 'slick', hair: '#3a2a1a', acc: ['glasses'], accCol: '#ffd25e', build: 'slim' } });
  G.mob('w2_fangirl', 'デュエルマニアのモモ', 411, { girl: true, old: false, kid: false, over: { outfit: 'hoodie', top: '#ff8fb8', top2: '#ffffff', style: 'ponytail', hair: '#ff5fa2', acc: ['headphones'], accCol: '#4ef0ff' } });
  const lobbyOn = () => G.state.chapter >= 3 && W2.town();

  G.defMap('shell_lobby', {
    name: 'アンダーシェル',
    area: 'ジャンク・デュエル控室',
    bgm: 'arena',
    light: '#5a4c80',
    lightAlpha: 1,
    ambient: 'neon',
    floor: 'm',
    pal: { wall: '#3a3448', wallTop: '#120e1a', metal: '#5a5c6e', baseboard: '#ff5fa2' },
    rows: L.rows(),
    solids: [[4, 2, 1, 1, 0]],
    objects: [
      { p: 'w2_elevator', x: 3, y: 1, wall: false },
      { p: 'w2_arenagate', x: 15, y: 1, w: 6 },
      { p: 'w2_bigscreen', x: 9, y: 1, w: 5, text: 'LIVE' },
      { p: 'w2_bigscreen', x: 22, y: 1, w: 5, text: 'RANK' },
      { p: 'w2_neonbar', x: 28, y: 1, w: 6, col: '#ffd25e', text: 'BAR OZ' },
      { p: 'poster', x: 7, y: 2, col: '#ff5fa2' },
      { p: 'poster', x: 14, y: 2, col: '#4ef0ff' },
      { p: 'poster', x: 21, y: 2, col: '#ffd25e' },
      // 受付
      { p: 'counter', x: 23, y: 5, w: 5, col: '#3a1a2a', top: '#c02040', items: false },
      { p: 'sign', x: 28, y: 5, text: 'ENTRY', col: '#c02040', neon: true, msg: '「ジャンク・デュエル 受付　飛び入り歓迎・命の保証なし」' },
      // バー
      { p: 'w2_barshelf', x: 28, y: 8, w: 6 },
      { p: 'counter', x: 27, y: 10, w: 7, col: '#3a2a3a', top: '#8a5a3a' },
      // 闇パーツ屋
      { p: 'shelf', x: 1, y: 7, w: 3, kind: 'parts', msg: '怪しいパーツが並ぶ棚。「ジャンゴ印 純正（たぶん）」' },
      { p: 'counter', x: 1, y: 10, w: 4, col: '#4a3a2a', top: '#a08060' },
      { p: 'sign', x: 5, y: 10, text: 'PARTS', col: '#d0902a', neon: true },
      // クランのテーブル
      { p: 'table', x: 8, y: 13, w: 1, h: 1, col: '#4a7a5a' },
      { p: 'table', x: 16, y: 14, w: 1, h: 1, col: '#c0a030' },
      { p: 'table', x: 24, y: 14, w: 1, h: 1, col: '#c02030' },
      { p: 'neonsign', x: 6, y: 12, text: 'TURTLE', col: '#7dff9a' },
      { p: 'neonsign', x: 19, y: 13, text: 'HORNET', col: '#ffd25e' },
      { p: 'neonsign', x: 27, y: 14, text: 'JACKAL', col: '#ff5fa2' },
      { p: 'terminal', x: 12, y: 18, col: '#ffd25e', msg: 'オッズ表示端末。「本日のメイン：？？？ vs ？？？」' },
      { p: 'terminal', x: 13, y: 18, col: '#ff5fa2', msg: 'ランキング端末。上位に「GIL」「BLUE FANG」……そして、はるか下に「STARDUST」の文字。' },
      { p: 'rug', x: 13, y: 7, w: 10, h: 1, col: '#ff5fa2' },
    ],
    lights: [
      { x: 18, y: 4, r: 70, col: '#ff5fa2', a: 0.45, flicker: true },
      { x: 25, y: 6, r: 40, col: '#ff3050', a: 0.45 },
      { x: 30, y: 10, r: 60, col: '#ffd890', a: 0.4 },
      { x: 3, y: 10, r: 40, col: '#ffd25e', a: 0.4 },
      { x: 8, y: 13, r: 40, col: '#7dff9a', a: 0.35 },
      { x: 16, y: 14, r: 40, col: '#ffd25e', a: 0.35 },
      { x: 24, y: 14, r: 40, col: '#ff5fa2', a: 0.35 },
      { x: 4, y: 4, r: 36, col: '#7dff9a', a: 0.35 },
      { x: 6, y: 17, r: 30, col: '#4ef0ff', a: 0.3 },
    ],
    decorate(c, m) {
      W2.paintWalls(c, m);
      // 床のアリーナ誘導ライン
      for (let y = 7 * 16; y < 19 * 16; y += 10) r(c, 18 * 16 - 1, y, 2, 5, 'rgba(255,95,162,0.55)');
      G.pixText(c, 'TO ARENA', 15 * 16 + 14, 8 * 16 + 5, '#ff5fa2');
    },
    npcs: [
      {
        id: 'w2_registrar', char: 'w2_registrar', x: 25, y: 4, dir: 'down', move: 'still', show: () => !E.flag('w2_hide_registrar'),
        talk: async () => {
          if (W2.rankDesk && G.state.chapter >= 3 && E.flag('c3_registered')) return await W2.rankDesk();
          await W2.lines('w2_registrar', {
            0: 'あら、迷子のぼうや？　ここは大人の社交場よ。……おうちへお帰り。',
            2: '登録には「機体」と「仲間」と「度胸」が必要よ。……全部そろったら、またいらっしゃい。',
            3: 'エントリーね？　クラン名、機体名、それから……負けても泣かないって誓約書にサインを。',
          })();
        },
      },
      {
        id: 'w2_bartender', char: 'w2_bartender', x: 30, y: 9, dir: 'down', move: 'still', show: () => G.state.chapter >= 3,
        talk: async () => {
          const k = await E.ask('w2_bartender', G.byCh({ 3: 'いらっしゃい。未成年にはジュースしか出さない主義でね。……オイル味とソーダ味、どっちにする？', 5: '上は物騒らしいな。ここで一杯やっていきな。……もちろんジュースだ。', 7: 'こんな時でも、灯りを消さないのがバーの仕事さ。', 9: 'チャンピオンのご来店だ。今日はおごりにしとこう。' }), ['注文する', 'うわさを聞く', 'やめる'], { cancel: 2 });
          if (k === 0) await E.shop(['soda', 'energy'], 'バー・オズ');
          else if (k === 1)
            await W2.lines('w2_bartender', {
              3: ['ランク戦はEからS。Sの頂点には「ブルー・ファング」って化け物がいる。', 'ギルですら、まだ一度も勝てたことがないって話だ。……ギル本人は認めないがね。'],
              4: 'スターダストってクラン、急に強くなったね。白い機体の坊やが入ったって？',
              5: '公安の犬が、客に化けて紛れ込んでる。……カウンターの端の男、あれはそうだ。',
              6: '黒い機体？　……昔、アンダーシェルにも似たのが一度だけ現れた。誰も勝てなかった。',
              8: 'アンダーシェルの連中も、みんな上で戦ってる。……俺もシェイカーを置いて行くかな。',
              9: 'ブルー・ファングがあんたらを探してたぞ。「次は負けない」だとさ。',
            })();
        },
      },
      {
        id: 'w2_django', char: 'w2_django', x: 2, y: 9, dir: 'down', move: 'still', show: () => G.state.chapter >= 3,
        talk: async () => {
          const k = await E.ask('w2_django', G.byCh({ 3: 'よう、新顔。修理キットにエナジードリンク、なんでもござれ。……出どころは聞くなよ。', 6: '最近は公安の横流し品が多い。皮肉なもんだろ？', 9: 'チャンピオン御用達、って看板出していいか？' }), ['買う', 'やめる'], { cancel: 1 });
          if (k === 0) await E.shop(['repair', 'repair2', 'energy', 'soda'], 'ジャンゴの闇パーツ');
        },
      },
      {
        id: 'w2_gantetsu', char: 'w2_gantetsu', x: 8, y: 12, dir: 'down', move: 'still', show: lobbyOn,
        talk: W2.lines('w2_gantetsu', {
          3: ['鉄亀団のガンテツだ。オレたちの機体〈タートル〉は、とにかく硬い。', '攻撃？　しない。ひたすら耐えて、相手のエネルギー切れを待つ。……試合時間は毎回1時間だ。'],
          4: 'おまえら、ランク戦を上がってるな。……オレの装甲を抜けるかな？',
          5: '公安の連中に「機体を差し出せ」と言われた。……もちろん断った。硬いのは装甲だけじゃない。',
          6: '黒い機体に、仲間の亀が一撃で抜かれた。……あんなの、初めてだ。',
          8: 'オレたちのタートルは、避難所の盾になる。……耐えるのは得意だからな。',
          9: '新型の装甲を試したい。相手してくれ。……1時間くらい。',
        }),
      },
      {
        id: 'w2_kame', char: 'w2_kame', x: 9, y: 14, dir: 'up', move: 'still', show: lobbyOn,
        talk: W2.lines('w2_kame', {
          3: 'うちのリーダー、試合が長すぎて観客が寝ちゃうの。……でも負けたことはほとんどないのよ。',
          5: '上の様子、どう？　地下にいると、空のことがわからなくて。',
          8: 'みんなで避難所に毛布を運んだの。亀は遅いけど、ちゃんと着くのよ。',
          9: 'リーダー、チャンピオンと戦えるって張り切ってるの。……試合時間、2時間は覚悟してね。',
        }),
      },
      {
        id: 'w2_hachi', char: 'w2_hachi', x: 15, y: 15, dir: 'right', move: 'still', show: lobbyOn,
        talk: W2.lines('w2_hachi', {
          3: ['蜂団のハチコよ。〈ホーネット〉は速さが命。刺したら逃げる、それが蜂の流儀！', 'あんたのハルカゼ、旋回は悪くないけど、まだまだ遅いわね。'],
          4: 'スターダスト、最近ちょっと速くなったじゃない。……悔しいけど。',
          6: '黒い機体のスピード……蜂より速いなんて、ありえない。',
          8: '速さが必要なら呼びなさい。伝令でも何でも、蜂が飛ぶわ。',
          9: '次のシーズン、絶対あんたたちに勝つから！',
        }),
      },
      {
        id: 'w2_buzz', char: 'w2_buzz', x: 17, y: 13, dir: 'left', move: 'still', show: lobbyOn,
        talk: W2.lines('w2_buzz', {
          3: 'ブーン、ブーン！　……あ、口癖です。気にしないで。',
          4: 'ハチコ姉さん、あんたたちの試合の録画を毎晩見てる。……研究熱心なんだ。',
          6: 'ブーン……今日は元気が出ない。',
          8: 'ブーン！　出撃準備OK！',
          9: 'ブーン！　平和なアリーナ、最高ッス！',
        }),
      },
      {
        id: 'w2_leo', char: 'w2_leo', x: 24, y: 15, dir: 'up', move: 'still', show: () => lobbyOn() && G.state.chapter <= 6,
        talk: W2.lines('w2_leo', {
          3: ['ジャッカルズのレオだ。ギルさんは今、奥で機体の調整中だ。……邪魔すんなよ。', 'ランク戦で勝ち上がってくれば、いずれギルさんと当たる。……せいぜい楽しませてくれ。'],
          4: 'ギルさんがあんたらの話をする時、ちょっと楽しそうなんだよな。……なんでだろうな。',
          5: 'ギルさんに「ガキどもを見張れ」と言われてる。……守れって意味だと思う。',
          6: 'ギルさん、黒い機体と一回やり合って、ボロボロで帰ってきた。……笑ってたけどな。',
        }),
      },
      {
        id: 'w2_veteran', char: 'w2_veteran', x: 32, y: 12, dir: 'left', move: 'still', show: lobbyOn,
        talk: W2.lines('w2_veteran', {
          3: ['ワシはゲン爺。昔はここのチャンピオンだった。……片目はその時の勲章よ。', '機体戦のコツか？　相手の「肩」を見ろ。ブーストの前に、必ず肩が沈む。'],
          4: 'ブースト中は無防備じゃ。避けるなら、ブーストの直後を狙え。',
          5: 'C の技は温存しろ。追い詰められた時、それが最後の切り札になる。',
          6: '黒い機体の戦い方……昔、星屑と呼ばれたエースに似とる。いや、まさかな。',
          8: 'ワシも行く。……老いぼれでも、盾くらいにはなれる。',
          9: 'チャンピオンの席は、譲ったわけじゃない。……奪われたんじゃ。気持ちよくな。',
        }),
      },
      {
        id: 'w2_bookie', char: 'w2_bookie', x: 11, y: 16, dir: 'down', move: 'still', show: lobbyOn,
        talk: W2.lines('w2_bookie', {
          3: ['賭け屋のコインだ。今日のオッズ、スターダスト勝利は……80倍！', '……おっと、子どもは賭けちゃダメだぜ。見るだけ、見るだけ。'],
          4: 'スターダストのオッズ、3倍まで下がった。……おまえら、儲けさせてくれるねえ。',
          5: '賭け金が集まらない。みんな、上のことが心配なんだ。',
          6: '黒い機体に賭けるやつはいない。……賭けにならないからな。',
          9: 'スターダスト勝利、オッズ1.01倍。……もう賭けにならねえよ。',
        }),
      },
      {
        id: 'w2_fangirl', char: 'w2_fangirl', x: 20, y: 9, dir: 'down', move: 'wander', range: 2, show: lobbyOn,
        talk: W2.lines('w2_fangirl', {
          3: ['きゃー！　スターダストのパイロットさんですよね！？　サインください！', 'ハルカゼのヒートスパナ、あれ最高です！　ギル様のサラマンダーの次に好き！'],
          4: 'ローズハウンドのグッズ、作ってもいいですか！？　非公式で！',
          5: '公安の人がいっぱいで、応援うちわを没収されたの……。',
          6: 'ギル様がボロボロ……。でも、あの人は絶対立ち上がる。そういう人だから。',
          8: '応援うちわ、全部手作りし直しました！　スターダスト、がんばれー！',
          9: 'スターダストのファンクラブ、会員1000人突破です！　……会長はわたしです！',
        }),
      },
    ],
    checks: [
      { x: 15, y: 2, w: 6, text: () => (G.state.chapter >= 3 ? 'アリーナの大扉。試合の時だけ開く。受付でエントリーしよう。' : 'アリーナの大扉。向こう側から、地鳴りのような歓声が聞こえる。') },
      { x: 23, y: 5, w: 5, run: async () => { const n = E.get('w2_registrar'); if (n) await n.talk(n); } },
      { x: 27, y: 10, w: 7, run: async () => { const n = E.get('w2_bartender'); if (n) await n.talk(n); else await E.say(null, 'バーのカウンター。まだ開店前のようだ。'); } },
      { x: 1, y: 10, w: 4, run: async () => { const n = E.get('w2_django'); if (n) await n.talk(n); else await E.say(null, 'パーツ屋のカウンター。店主は留守のようだ。'); } },
      { x: 3, y: 2, w: 3, text: '貨物エレベーター。地上（スクラップ・ベイ）へ戻れる。' },
    ],
    items: [{ x: 34, y: 17, item: 'memory', id: 'mem_20' }],
    events: W2.memEvents([[34, 17]]),
    warps: [{ x: 4, y: 2, to: 'scrapbay', tx: 53, ty: 14, dir: 'down', se: 'door' }],
    onEnter: W2.memEnter,
  });

  // ---------------------------------------------------------------
  //  ジャンク・デュエル会場 arena（34×22）— 戦闘専用
  //   床 a：x=2..31, y=3..19。プレイヤー開始 (17,17)、敵は y=5..8 あたり
  // ---------------------------------------------------------------
  const A = W2.grid(34, 22, 'W');
  A.fill(2, 3, 30, 17, 'a');
  A.set(9, 11, 'W').set(24, 11, 'W');
  G.defMap('arena', {
    name: 'ジャンク・デュエル',
    area: 'アンダーシェル・アリーナ',
    bgm: 'arena',
    light: '#9284bc',
    lightAlpha: 1,
    ambient: 'sparks',
    floor: 'a',
    noParty: true,
    bg: '#07051a',
    pal: { bigwall: '#3a3450' },
    rows: A.rows(),
    lights: [
      ...[3, 8, 13, 18, 23, 28].map((x, i) => ({ x, y: 2, r: 40, col: i % 2 ? '#ff5fa2' : '#4ef0ff', a: 0.7, flicker: true })),
      ...[3, 8, 13, 18, 23, 28].map((x, i) => ({ x, y: 20, r: 40, col: i % 2 ? '#4ef0ff' : '#ff5fa2', a: 0.6, flicker: true })),
      ...[5, 10, 15].map((y) => ({ x: 1, y, r: 36, col: '#ffd25e', a: 0.5 })),
      ...[5, 10, 15].map((y) => ({ x: 32, y, r: 36, col: '#ffd25e', a: 0.5 })),
      { x: 17, y: 11, r: 90, col: '#ffffff', a: 0.25 },
      { x: 9, y: 10, r: 24, col: '#ff3050', a: 0.6, flicker: true },
      { x: 24, y: 10, r: 24, col: '#ff3050', a: 0.6, flicker: true },
    ],
    decorate(c, m) {
      // 観客席（上・下・左右の壁の上）
      const crowd = (x0, y0, w, h, seed) => {
        r(c, x0, y0, w, h, '#1a1428');
        for (let y = y0 + 1, row = 0; y < y0 + h - 6; y += 8, row++) {
          r(c, x0, y + 7, w, 1, '#2a2440');
          for (let x = x0 + (row % 2) * 3; x < x0 + w - 5; x += 6) {
            const k = G.hash(x, y, seed);
            if (k < 0.08) continue;
            const shirt = ['#4a3a6a', '#3a4a7a', '#6a3a5a', '#3a5a5a', '#5a5a3a'][Math.floor(k * 5)];
            r(c, x, y + 4, 5, 3, shirt);
            G.ellipse(c, x + 2, y + 2, 2, 2, k > 0.5 ? '#c89a80' : '#8a6a5a');
            if (k > 0.3 && k < 0.45) r(c, x, y, 5, 2, ['#2a2030', '#5a3a2a', '#e8d070'][Math.floor(k * 30) % 3]);
            if (k > 0.86) r(c, x + (k > 0.93 ? 4 : 0), y - 3, 1, 4, ['#ff5fa2', '#4ef0ff', '#ffd25e', '#7dff9a'][Math.floor(k * 40) % 4]);
          }
        }
      };
      crowd(2, 2, 34 * 16 - 4, 26, 1);
      crowd(2, 20 * 16 + 4, 34 * 16 - 4, 26, 2);
      crowd(1, 34, 28, 17 * 16, 3);
      crowd(32 * 16 + 3, 34, 28, 17 * 16, 4);
      // 壁の上のネオン管
      r(c, 2 * 16, 3 * 16 - 3, 30 * 16, 2, '#ff5fa2');
      r(c, 2 * 16, 20 * 16, 30 * 16, 2, '#4ef0ff');
      r(c, 2 * 16 - 2, 3 * 16, 2, 17 * 16, '#ffd25e');
      r(c, 32 * 16, 3 * 16, 2, 17 * 16, '#ffd25e');
      // 床のロゴ
      const cx = 17 * 16,
        cy = 11 * 16 + 8;
      for (let a = 0; a < 200; a++) {
        px(c, Math.round(cx + Math.cos(a / 31.8) * 64), Math.round(cy + Math.sin(a / 31.8) * 40), 'rgba(255,95,162,0.6)');
        px(c, Math.round(cx + Math.cos(a / 31.8) * 60), Math.round(cy + Math.sin(a / 31.8) * 37), 'rgba(255,95,162,0.35)');
      }
      G.pixText(c, 'JUNK DUEL', cx - G.pixTextW('JUNK DUEL', 2) / 2, cy - 5, 'rgba(255,255,255,0.35)', 2);
      // スタート位置のマーク
      for (const [x, y, col] of [[17, 17, '#4ef0ff'], [17, 5, '#ff5fa2']]) {
        r(c, x * 16 - 6, y * 16 + 14, 28, 2, col);
        r(c, x * 16 - 6, y * 16 + 2, 2, 12, col);
        r(c, x * 16 + 20, y * 16 + 2, 2, 12, col);
      }
      // 柱の警戒色
      for (const x of [9, 24]) for (let i = 0; i < 16; i += 4) r(c, x * 16 + i, 11 * 16 + 12, 2, 4, '#ffd25e');
    },
  });
})();
