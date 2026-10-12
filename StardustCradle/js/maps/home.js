// =============================================================
//  maps/home.js — 星屑亭 2F（カナタの部屋）／星屑亭 1F（ラーメン屋）
//  ワールド担当 part1。ばあちゃんの会話・出前クエストは story/side_w1.js
// =============================================================
(function () {
  G.W1 = G.W1 || {};
  // 平置きの小物（ポスター・窓・ラグ等）は地面に焼き込まれて objs から消えるため、
  // msg を調べられるよう checks に変換する
  G.W1.flatChecks = function (def) {
    def.checks = def.checks || [];
    for (const o of def.objects || [])
      if (o.msg && ['poster', 'wallwindow', 'rug', 'stairs', 'hatch'].includes(o.p) && !o.talk)
        def.checks.push({ x: o.x, y: o.y, w: o.w || 1, h: o.p === 'rug' ? o.h || 1 : 1, text: o.msg, show: o.show });
    return def;
  };

  // ---------------- カナタの部屋（星屑亭 2F） ----------------
  // ベッド (1,2)-(1,3) ／ 机 (4,2) ／ 端末 (5,2) ／ 階段 (10,2)→hoshikuzu
  // 開始位置 (5,6)（ラグの上）
  G.defMap('tome_room', G.W1.flatChecks({
    name: '星屑亭 2F・カナタの部屋',
    bgm: 'home',
    light: '#f4e6d4',
    lightAlpha: 0.7,
    pal: { wall: '#dfe6d6', wallTop: '#3a3048', wood: '#c4925e', baseboard: '#8a6a4a' },
    floor: 'f',
    rows: [
      'wwwwwwwwwwww',
      'wwwwwwwwwwww',
      'wffffffffffw',
      'wffffffffffw',
      'wffffffffffw',
      'wffffffffffw',
      'wffffffffffw',
      'wffffffffffw',
      'wffffffffffw',
      'wwwwwwwwwwww',
    ],
    objects: [
      { p: 'wallwindow', x: 1, y: 1, w: 3, msg: '窓の外には、空に浮かぶ「向こう側の街」。コロニーの朝は、ミラーが光を運んでくる。' },
      { p: 'poster', x: 5, y: 1, col: '#4ef0ff', msg: 'AFシミュレーター全国ランキングのポスター。1位の欄に、ひそかに「カナタ」と落書きしてある。' },
      { p: 'poster', x: 6, y: 1, col: '#ff5fa2', msg: 'アイドルユニット〈ミラー・ガールズ〉のポスター。ポンタに押しつけられた。' },
      { p: 'poster', x: 9, y: 1, col: '#ffd25e', msg: '手書きの目標。「いつか本物の空を飛ぶ　カナタ」' },
      { p: 'bed', x: 1, y: 2, col: '#3a6ad0', id: 'w_bed' },
      { p: 'desk', x: 4, y: 2, book: true, msg: '机の上に、写真立て。作業着の男の人が、小さい頃の自分を肩車して笑っている。……父さん。' },
      { p: 'terminal', x: 5, y: 2, col: '#7dff9a', msg: '自作のAFシミュレーター端末。ハイスコア：1位 KANATA　2位 RUU　3位 PONTA' },
      { p: 'shelf', x: 7, y: 2, w: 2, kind: 'parts', msg: '棚にはプラモデルとジャンクパーツがぎっしり。「父さんのスパナ」の定位置はここ……だけど、今は腰のベルトにある。' },
      { p: 'stairs', x: 10, y: 2 },
      { p: 'rug', x: 3, y: 5, w: 5, h: 3, col: '#4a6ab0' },
      { p: 'table', x: 6, y: 5, w: 2, h: 1, col: '#a07040', msg: 'ちゃぶ台。食べかけのせんべいと、宿題のプリント（白紙）。' },
      { p: 'crate', x: 1, y: 8, msg: '木箱いっぱいのジャンクパーツ。父さんが残した工具も入っている。' },
      { p: 'plant', x: 10, y: 8 },
      { p: 'tv', x: 8, y: 8, msg: 'ブラウン管風のレトロTV。マザーの天気予報：「明日も晴れ。降水確率0％。ミラー角度は12度です」' },
    ],
    checks: [
      {
        x: 1, y: 2, h: 2,
        run: async () => {
          const i = await E.ask(null, 'ふとんがふかふかだ。少し休む？', ['休む（全回復＋セーブ）', 'やめておく'], { cancel: 1 });
          if (i === 0) {
            await E.fadeOut(20);
            await E.wait(20);
            await E.fadeIn(20);
            await E.savePoint();
          }
        },
      },
    ],
    warps: [{ x: 10, y: 2, to: 'hoshikuzu', tx: 14, ty: 3, dir: 'down', se: 'step' }],
  }));

  // ---------------- 星屑亭 1F（ラーメン屋） ----------------
  // 厨房 x1..8,y2..4（ばあちゃん (4,4)）／ カウンター x1..8,y5 ／ 丸椅子 x1..8,y6
  // 階段 (14,2)→tome_room ／ 出入口 (7..8,11)→minato (11,21)
  G.defMap('hoshikuzu', G.W1.flatChecks({
    name: '星屑亭',
    bgm: 'home',
    light: '#f6dcc0',
    lightAlpha: 0.75,
    pal: { wall: '#efe0c4', wallTop: '#3a2a30', wood: '#b07a48', tile: '#d8d4c8', baseboard: '#6a4a30' },
    floor: 'f',
    rows: [
      'wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      'wppppppppffffffw',
      'wppppppppffffffw',
      'wppppppppffffffw',
      'wffffffffffffffw',
      'wUUUUUUUUffffffw',
      'wffffffffffffffw',
      'wttttffffffffffw',
      'wttttffffffffffw',
      'wttttffffffffffw',
      'wwwwwwwffwwwwwww',
    ],
    objects: [
      // 厨房
      { p: 'stove', x: 1, y: 2, msg: '寸胴鍋で、豚骨と「星屑ダシ」がぐつぐつ煮えている。いいにおい……。' },
      { p: 'stove', x: 3, y: 2 },
      { p: 'fridge', x: 5, y: 2, msg: '冷蔵庫。「つまみ食い厳禁　トメ」の貼り紙。' },
      { p: 'shelf', x: 6, y: 2, w: 2, col: '#7a5038', msg: 'どんぶりと調味料の棚。秘伝のタレのビンには「さわるな」の文字。' },
      { p: 'counter', x: 1, y: 5, w: 8, col: '#6a4028', top: '#e8d4b0' },
      { p: 'wallwindow', x: 2, y: 1, w: 2 },
      // 壁のメニュー・写真
      { p: 'poster', x: 11, y: 1, col: '#e04a4a', msg: '壁のお品書き。「星屑ラーメン　¢200」「星屑おにぎり　¢45」「大盛り無料（ただし残したら皿洗い）」' },
      { p: 'poster', x: 12, y: 1, col: '#4ef0ff', msg: '色あせた写真。星のマークをつけた古いAFの前で、若い女の人がピースしている。……誰だろう？' },
      // 客席
      { p: 'table', x: 11, y: 6, w: 2, h: 1, col: '#7a4a2a', items: true },
      { p: 'table', x: 11, y: 9, w: 2, h: 1, col: '#7a4a2a', items: true },
      { p: 'stool', x: 10, y: 6 },
      { p: 'stool', x: 13, y: 6 },
      { p: 'stool', x: 10, y: 9 },
      { p: 'stool', x: 13, y: 9 },
      { p: 'table', x: 1, y: 9, w: 3, h: 1, col: '#5a3a24', msg: '小上がりの座卓。常連さんの将棋盤が置きっぱなしだ。' },
      { p: 'shelf', x: 13, y: 2, w: 1, col: '#7a5038', msg: '漫画の棚。「機動騎兵ガンボール」全48巻。' },
      { p: 'tv', x: 9, y: 2, msg: 'テレビではコロニー・ニュース。「本日のミラー開閉は定刻どおり。マザーは今日も皆さまの暮らしを見守っています」' },
      { p: 'stairs', x: 14, y: 2 },
      { p: 'plant', x: 14, y: 10 },
      { p: 'plant', x: 5, y: 10 },
      { p: 'noren', x: 7, y: 11, col: '#c03030' },
      { p: 'noren', x: 8, y: 11, col: '#c03030' },
    ],
    checks: [
      // カウンター越しにばあちゃんと話せるように（ばあちゃんが定位置にいる時だけ）
      {
        x: 2, y: 5, w: 5,
        show: () => {
          const t = E.get('w_tome');
          return !!(t && t.visible !== false && Math.abs(t.x - 72) < 40 && Math.abs(t.y - 78) < 20);
        },
        run: async () => {
          const t = E.get('w_tome');
          t.faceTo(G.field.player);
          await G.W1.tomeTalk(t);
          t.dir = 'down';
        },
      },
      { x: 1, y: 5, w: 1, text: 'カウンターに手書きの貼り紙。「出前やってます！　ミナト区・グリーン・ブロックまで」' },
      { x: 7, y: 5, w: 2, text: '「ジャンク・デュエル　中継やってます」の手書きの紙。……ばあちゃん、意外とノリノリだ。' },
    ],
    npcs: [
      { id: 'w_tome', char: 'tome', x: 4, y: 4, dir: 'down', move: 'still', talk: async (n) => G.W1.tomeTalk(n) },
    ],
    lights: [
      { x: 3, y: 3, r: 40, col: '#ffc890', a: 0.6 },
      { x: 11, y: 7, r: 46, col: '#ffe0b0', a: 0.5 },
      { x: 7, y: 10, r: 30, col: '#ffd0a0', a: 0.4 },
    ],
    warps: [
      { x: 14, y: 2, to: 'tome_room', tx: 10, ty: 3, dir: 'down', se: 'step' },
      { x: 7, y: 11, w: 2, h: 1, to: 'minato', tx: 11, ty: 21, dir: 'down', se: 'door' },
    ],
  }));
  // セーブ端末（店の隅）
  G.MAPS.hoshikuzu.rows[7] = 'wffffffffffffZfw';
})();
