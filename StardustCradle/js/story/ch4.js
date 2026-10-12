// =============================================================
//  story/ch4.js — 第4章「文化祭と公安」
//   フェーズ（E.val('c4_phase')）
//    0 ホームルーム → 1 文化祭の準備（材料4・看板・ポスター3）→ 2 ユイに報告（夕方）
//    3 ユイが仲間に（夜）→ 4 文化祭当日・屋台 → 5 出し物めぐり → 6 公安突入（夕方）→ 7 敗北の夜
//   フラグ接頭辞 c4_ ／ マップ c4_haunted c4_cafe c4_chase（maps/c4.js）
// =============================================================
(function () {
  const H = G.C45;
  const ch4 = () => G.state.chapter === 4;
  const ph = () => E.val('c4_phase');
  const setPh = (n) => E.set('c4_phase', n);
  const prep = () => ch4() && ph() === 1;
  const fest = () => ch4() && (ph() === 4 || ph() === 5);
  const tour = () => ch4() && ph() === 5;
  const raid = () => ch4() && ph() === 6;
  const festDeco = () => ch4() && ph() >= 4 && ph() <= 6;

  // ---------------------------------------------------------------
  //  アイテム
  // ---------------------------------------------------------------
  G.addItem('c4_list', { name: '文化祭準備リスト', desc: 'ユイの手書きリスト。材料：麺とスープの素（星屑亭のばあちゃん）／ネギ（グリーン・ブロックの農協）／大豆チャーシュー（ミナト区商店街の肉屋）／移動式コンロ（スクラップ・ベイのドク）。看板（教室）。ポスター3枚（廊下の掲示板・ミナト区のバス停・星屑亭の壁）。' });
  G.addItem('c4_noodle', { name: '特製麺とスープの素', desc: 'ばあちゃん直伝。「ダシは急いじゃだめ。人間と同じさ」' });
  G.addItem('c4_negi', { name: '朝どれネギ', desc: 'グリーン・ブロックのネギ。シャキシャキ。' });
  G.addItem('c4_chashu', { name: '大豆チャーシュー', desc: 'ミナト区の肉屋〈ガンテツ〉の自信作。本物の肉より高いらしい。' });
  G.addItem('c4_stove', { name: '移動式コンロ', desc: 'ドクがジャンクから作ったコンロ。火力がおかしい。' });
  G.addItem('c4_poster', { name: '文化祭ポスター', desc: '「2年B組 星屑亭・出張店」のポスター。貼る場所はリストに書いてある。' });
  G.addItem('c4_extra', { name: '第三中新聞 号外', desc: '「2年B組ラーメン、行列100人突破！？」ミミの号外。一面に屋台の写真。' });
  G.addItem('c4_takoyaki', { name: 'たこ焼き', kind: 'use', price: 80, hp: 80, desc: '3年B組の屋台。HP80回復。中身は培養タコ。' });
  G.addItem('c4_crepe', { name: 'いちごクレープ', kind: 'use', price: 90, hp: 50, en: 20, desc: '1年C組の屋台。HP50・EN20回復。' });
  G.addItem('c4_yakisoba', { name: 'やきそば', kind: 'use', price: 110, hp: 120, desc: '3年C組の屋台。HP120回復。ソース多め。' });
  G.addItem('c4_kakigori', { name: 'かき氷（ネオン味）', kind: 'use', price: 60, en: 35, desc: '光るシロップ。EN35回復。舌が光る。' });

  // ---------------------------------------------------------------
  //  町の人（4章だけ）
  // ---------------------------------------------------------------
  G.mob('c4_butcher', '肉屋のガンテツ', 4101, { old: true, girl: false, over: { top: '#f0f0f0', top2: '#c03030', outfit: 'apron', acc: ['bandana'], accCol: '#c03030', build: 'big', beard: '#5a4a3a' } });
  G.mob('c4_yoshio', '農協のヨシオさん', 4102, { old: true, girl: false, over: { top: '#3a8a4a', outfit: 'jumpsuit', acc: ['cap'], accCol: '#e8c040' } });
  G.mob('c4_mom', '来場者のおかあさん', 4103, { girl: true, old: false, over: { top: '#e0a0c0', outfit: 'dress' } });
  G.mob('c4_kid', '迷子のタロウくん', 4104, { kid: true, girl: false, over: { top: '#ffd25e', outfit: 'tshirt', bstyle: 'shorts' } });
  G.mob('c4_old', '卒業生のおじいさん', 4105, { old: true, girl: false, over: { top: '#6a5a4a', outfit: 'coat', acc: ['cap'], accCol: '#3a3a48' } });
  G.mob('c4_tako', 'たこ焼き屋の3年生', 4106, { girl: false, over: { top: '#2a3460', top2: '#f4f2fb', outfit: 'uniform', acc: ['bandana'], accCol: '#ffffff' } });
  G.mob('c4_crepe', 'クレープ屋の1年生', 4107, { girl: true, over: { top: '#2a3460', top2: '#f4f2fb', outfit: 'uniform', bstyle: 'skirt', acc: ['ribbon'], accCol: '#ff8fb8' } });
  G.mob('c4_soba', 'やきそば屋の3年生', 4108, { girl: false, over: { top: '#f0f0f0', outfit: 'tank', acc: ['bandana'], accCol: '#3a6ad0', build: 'big' } });
  G.mob('c4_kori', 'かき氷屋の2年A組', 4109, { girl: true, over: { top: '#4ef0ff', outfit: 'tshirt', style: 'ponytail' } });
  G.mob('c4_sec', '公安特務隊員', 4110, { girl: false, over: { top: '#2a2e44', top2: '#c0c8d8', outfit: 'military', bottom: '#2a2e44', acc: ['helmet'], accCol: '#3a3a4a', build: 'tall' } });

  // ---------------------------------------------------------------
  //  進行チェック
  // ---------------------------------------------------------------
  const ING = ['noodle', 'negi', 'chashu', 'stove'];
  const POST = ['hall', 'bus', 'shop'];
  function prepStatus() {
    return { ing: ING.filter((k) => E.flag('c4_got_' + k)).length, post: POST.filter((k) => E.flag('c4_post_' + k)).length, sign: E.flag('c4_sign_done') };
  }
  async function prepUpdate() {
    const s = prepStatus();
    if (s.ing === 4 && s.post === 3 && s.sign) {
      if (ph() !== 1) return;
      setPh(2);
      await E.wait(20);
      await E.notice('文化祭の準備が、ぜんぶそろった！\nいつのまにか、ミラーの光が夕焼け色に変わっている。');
      E.time('evening');
      E.objective('2年B組の教室に戻って、ユイに報告する');
    } else E.objective(`文化祭の準備（材料${s.ing}/4・看板${s.sign ? '済' : '未'}・ポスター${s.post}/3）`);
  }
  const TOURS = ['cafe', 'haunt', 'news', 'live'];
  function tourCount() {
    return TOURS.filter((k) => E.flag('c4_tour_' + k)).length;
  }
  async function tourUpdate() {
    const n = tourCount();
    if (n >= 4) {
      await E.wait(10);
      await E.notice('出し物をぜんぶ回った！\n……そろそろ屋台に戻る時間だ。');
      E.objective('2年B組の教室に戻る（後夜祭の準備）');
    } else E.objective(`出し物を回る（${n}/4）：喫茶・お化け屋敷・新聞部・屋上ライブ`);
  }

  // ===============================================================
  //  章の開始
  // ===============================================================
  G.STORY.chapters[4] = async function () {
    E.time('morning');
    G.state.mech.id = 'harukaze';
    E.set('c3_rose');
    E.set('c3_sig_joined');
    setPh(0);
    E.party(['ruu', 'niko']);
    await E.chapter(4, null, '――星暦0085年・秋。ニセモノの空にも、祭りは来る。');
    E.party([]);
    await E.warp('classroom', 6, 9, 'up', { noEnter: true });
    await homeroom();
  };

  // ---------------------------------------------------------------
  //  1. ホームルーム（classroom）
  // ---------------------------------------------------------------
  async function homeroom() {
    E.cut();
    H.actors([
      ['c4_a_ruu', 'ruu', 14, 9, 'up'],
      ['c4_a_ponta', 'ponta', 17, 9, 'up'],
      ['c4_a_yui', 'yui', 6, 7, 'up'],
      ['c4_a_niko', 'niko', 14, 11, 'up'],
      ['c4_a_vargas', 'vargas', 11, 3, 'down'],
    ]);
    E.teleport('player', 6, 9, 'up');
    await E.wait(30);
    await E.say('vargas', 'よーし、席につけ！　今日のホームルームは大事な話だ！');
    await E.say('vargas:grin', '来週はいよいよ、第三中の文化祭だ！　2年B組の出し物を、今日中に決めるぞ！');
    E.emote('c4_a_ruu', '…');
    await E.say('w2_takashi', 'はいはーい！　お化け屋敷！　オレ、ゾンビやりたい！');
    await E.say('vargas', 'お化け屋敷は3年A組がやる。鬼塚のクラスだ。……あそこと被ると、面倒だぞ。');
    await E.say('w2_mayu', 'ねえねえ聞いた？　鬼塚先輩、お化け屋敷のために墓石を自作してるって。……本物の。');
    E.emote('c4_a_ponta', '!');
    await E.say('ponta:grin', 'はいっす！　オイラ、ラーメン屋がいいと思うっす！　カナタんちの〈星屑亭〉の味なら、優勝まちがいなしっす！');
    E.emote('player', '!?');
    await E.say('kanata:surprise', 'え、オレんち！？');
    await E.say('ruu:grin', 'いいじゃん。トメばあちゃんのラーメン、反則級にうまいっしょ。');
    await E.say('niko:smile', 'ラーメン……！　ニコ、さんせい。ぜったい、さんせい。');
    await E.say('yui:serious', 'では、多数決を取ります。校則第22条、「文化祭の出し物はクラスの過半数の賛成をもって決定する」。');
    await E.say('yui', 'ラーメン屋台に賛成の人は、挙手を。……全員、ですね。');
    await E.say('vargas:grin', '決まりだ！　2年B組の出し物は「星屑亭・出張店」！　春瀬、ばあちゃんに話を通しておけよ！');
    await E.say('kanata', 'マジか……。ま、なんとかなるって。');
    await E.say('vargas', '委員長、役割分担は任せた。先生は職員室で、教員有志の喫茶店の準備がある。……甘いものの仕入れが、あるのでな。');
    await E.move('c4_a_vargas', [[13, 3], [13, 5], [21, 5], [21, 13], [20, 13], [20, 14]], { speed: 1.6 });
    E.remove('c4_a_vargas');
    E.se('door');
    await E.move('c4_a_yui', [[8, 7], [8, 5], [11, 5]], { speed: 1.4 });
    E.face('c4_a_yui', 'down');
    await E.say('yui', 'それでは、役割を決めます。春瀬くん。あなたは何を担当しますか？');
    const k = await E.ask('yui', '春瀬くんの担当は？', ['麺ゆで担当', 'スープ担当', '呼び込み担当']);
    E.set('c4_role_k', k);
    if (k === 0) {
      await E.say('yui', 'さすがシミュレーター学年1位。反射神経は申し分ありませんね。麺は茹で時間が命です。');
      await E.say('kanata:grin', 'ばあちゃん直伝の湯切り、見せてやるって。');
    } else if (k === 1) {
      await E.say('yui:serious', 'スープは屋台の心臓です。……責任重大ですよ？');
      await E.say('kanata', 'ばあちゃんに叩き込まれてるから、たぶん大丈夫。……たぶん。');
    } else {
      await E.say('yui:think', '呼び込み……。春瀬くんの声、のんびりしすぎていませんか？');
      await E.say('kanata', 'いらっしゃーい……ませー……。');
      await E.say('ruu', 'ねむ。');
    }
    await E.say('yui', 'では、ルウさんは……。');
    await E.say('ruu', 'あたし？　別に、なんでもいいけど。');
    const r = await E.ask('kanata:think', '（ルウには……）', ['行列整理（用心棒）', '皿洗い', '宣伝係（スケボー）']);
    E.set('c4_role_r', r);
    if (r === 0) {
      await E.say('ruu:grin', '用心棒ね。割り込みするヤツは、あたしがシメる。');
      await E.say('yui:surprise', '……シメないでください。');
    } else if (r === 1) {
      await E.say('ruu:angry', 'はぁ！？　なんであたしが皿洗いなの！');
      await E.say('niko:smile', 'ルウ、おさら、ピカピカ。ニコ、みたい。');
      await E.say('ruu:shy', '……ちっ。ニコが言うなら、やる。');
    } else {
      await E.say('ruu:grin', 'スケボーで校内を流して宣伝するってこと？　……それ、いいじゃん。');
      await E.say('yui:serious', '廊下を走るのは校則違反です。');
      await E.say('ruu', '走ってないっしょ。滑ってんの。');
    }
    await E.say('yui', 'それから、ニコさんは……。');
    const n = await E.ask('yui', 'ニコさんの担当は？', ['看板娘', '味見係', 'ネギ切り']);
    E.set('c4_role_n', n);
    if (n === 0) {
      await E.say('niko:surprise', 'かんばん、むすめ……？　ニコ、かんばんに、なる？');
      await E.say('kanata', '屋台の前で、ニコニコしてればいいんだよ。');
      await E.say('niko:grin', 'ニコ、ニコニコ、とくい。');
    } else if (n === 1) {
      await E.say('niko:surprise', 'あじみ……！　たくさん、たべる、しごと……！');
      await E.say('yui:serious', '味見は一口ずつです。');
      await E.say('niko:sad', '……ひとくち。');
    } else {
      await E.say('niko:serious', 'ネギ……きる。ニコ、がんばる。');
      E.se('swing');
      await E.say(null, '（トントントントン……ものすごい速さで、エア・ネギが刻まれていく）');
      await E.say('ponta:surprise', 'ぶっひゃー！　ニコちゃん、プロの手さばきっす！');
    }
    await E.say('yui:smile', '……決まりですね。準備は今日の放課後から。材料、看板、ポスター。リストにまとめておきました。');
    await E.give('c4_list', 1);
    E.give('c4_poster', 3, { quiet: true });
    E.toast('文化祭ポスター ×3 を受け取った', '#ffd25e');
    await E.say('ponta', 'オイラは屋台の骨組みと換気扇を作るっす！　コンロは……ドクさんに頼めないっすかね？');
    await E.say('kanata', 'ドクなら、ジャンクでなんとかしてくれるかも。');
    await E.say('ponta:grin', 'それと、当日はハルカゼとローズハウンドを校庭に展示したいっす！　「本物のAFが見られる屋台」、話題性バツグンっす！');
    await E.say('ruu', 'ドクのじいさんが許すかね、それ。');
    await E.say('yui', 'それと……ニコさん。文化祭の参加者名簿に、住民IDを書いてもらえますか？　生徒会に提出しなければならないので。');
    await E.say('niko:think', 'じゅうみん……あいでぃー？');
    E.emote('c4_a_ruu', '!');
    await E.say('ruu:surprise', 'あ、あー！　それ、あたしがあとで書いとくから！　ニコ、字ぃ書くの遅いし！');
    await E.say('yui:think', '……？　そうですか。では、ルウさんにお願いします。');
    E.emote('player', '…');
    await E.say('kanata:think', '（……ニコの身分証。デュエルの賞金で作った、ニセモノの……）');
    await E.fadeOut(20);
    H.clear(['c4_a_ruu', 'c4_a_ponta', 'c4_a_yui', 'c4_a_niko']);
    E.time('day');
    setPh(1);
    E.party(['ruu', 'niko']);
    E.teleport('player', 6, 5, 'right');
    E.reload();
    await E.fadeIn(20);
    await E.say(null, '――放課後。2年B組は、文化祭の準備で大さわぎだ。');
    await E.say('ruu', 'で、どこから回る？　材料は町じゅうに散らばってるし。');
    await E.say('kanata', 'リストを見ながら、順番に回ろう。ばあちゃんの店、グリーン・ブロック、商店街、ドクのとこ……。');
    await E.say('niko:smile', 'ぜんぶ、ラーメンの、ため。ニコ、がんばる。');
    await prepUpdate();
  }

  // ---------------------------------------------------------------
  //  教室（準備中のユイ・ポンタ／屋台／看板）
  // ---------------------------------------------------------------
  const shopShow = () => ch4() && ph() >= 4;
  G.addToMap('classroom', {
    objects: [
      { p: 'c4_board', x: 10, y: 13, id: 'c4_board', show: () => ch4() && ph() >= 1 && !E.flag('c4_sign_done') },
      { p: 'c4_board', x: 10, y: 13, id: 'c4_board_done', painted: true, show: () => ch4() && ph() >= 1 && E.flag('c4_sign_done') },
      { p: 'stall', x: 13, y: 4, text: 'RAMEN', col: '#c03030', show: shopShow },
      { p: 'stove', x: 16, y: 3, show: shopShow },
      { p: 'c4_chochin', x: 2, y: 3, w: 6, show: shopShow },
      { p: 'c4_chochin', x: 17, y: 5, w: 4, show: shopShow },
    ],
    npcs: [
      {
        id: 'c4_yui', char: 'yui', x: 8, y: 5, dir: 'down', move: 'still', show: () => ch4() && ph() === 1,
        talk: async () => {
          const s = prepStatus();
          await E.say('yui', `進み具合を確認します。材料は ${s.ing}/4、看板は${s.sign ? '完成' : 'まだ'}、ポスターは ${s.post}/3 枚。`);
          if (!E.flag('c4_got_noodle')) await E.say('yui', '麺とスープの素は、春瀬くんのおばあさま……星屑亭ですね。');
          else if (!E.flag('c4_got_negi')) await E.say('yui', 'ネギは、グリーン・ブロックの農協で分けてもらえるそうです。ミナト区の西の出口から行けます。');
          else if (!E.flag('c4_got_chashu')) await E.say('yui', 'チャーシューは、商店街の肉屋さんへ。星屑亭の並びです。');
          else if (!E.flag('c4_got_stove')) await E.say('yui', 'コンロは、スクラップ・ベイのドクさんという方に……。ミナト区の南です。');
          else if (!E.flag('c4_sign_done')) await E.say('yui', '看板は、教室のうしろの画板です。サキさんが下書きをしてくれています。');
          else await E.say('yui', 'あとはポスターですね。廊下の掲示板、ミナト区のバス停、星屑亭の壁。');
          await E.say('yui:shy', '……べ、別に楽しみにしているわけではありません。委員長としての責務です。');
        },
      },
      {
        id: 'c4_yui_shop', char: 'yui', x: 14, y: 3, dir: 'down', move: 'still', show: () => ch4() && ph() === 5,
        talk: async () => {
          await E.say('yui:smile', 'おかえりなさい。屋台は順調です。……お客さんに「委員長の湯切り、キレがある」と言われました。');
          const i = await E.ask('yui', '一杯、食べていきますか？　関係者割引はありませんけど。', ['買う', 'やめておく'], { cancel: 1 });
          if (i === 0) await E.shop(['ramen', 'onigiri', 'soda'], '星屑亭・出張店');
          else await E.say('yui', '出し物めぐり、楽しんできてください。……わたしのぶんまで。');
        },
      },
      {
        id: 'c4_ponta', char: 'ponta', x: 19, y: 5, dir: 'left', move: 'still', show: () => ch4() && ph() === 1,
        talk: async () => {
          const i = E.inc('c4_ponta_t') % 3;
          if (i === 1) {
            await E.say('ponta:grin', '屋台の骨組み、AFの廃材フレームで作ってるっす！　耐荷重2トン！　ラーメン屋台としては過剰スペックっす！');
            await E.say('kanata:grin', 'いいじゃん、それ。');
          } else if (i === 2) {
            await E.say('ponta', 'ハルカゼの展示、ドクさんがOKしてくれたら、オイラが搬入するっす。ローズハウンドも並べたら、絶対映えるっす！');
            await E.say('ruu:grin', 'あたしのローズに指一本でも触ったら、ポンタでもシメるからね。');
            await E.say('ponta:surprise', 'ぶっひゃー！');
          } else {
            await E.say('ponta', '換気扇の風量、3倍にしたっす！　……ばあちゃんにスープが冷めるって怒られたっす。');
          }
        },
      },
    ],
    checks: [
      { x: 10, y: 13, w: 3, show: () => prep() && !E.flag('c4_sign_done'), run: signScene },
      { x: 10, y: 13, w: 3, show: () => ch4() && E.flag('c4_sign_done'), text: '2年B組の看板。「HOSHIKUZU RAMEN」。サキの絵と、みんなで塗ったペンキが光っている。' },
    ],
    onEnter: async () => {
      if (!ch4()) return;
      if (fest()) E.bgm('festival');
      if (raid()) E.bgm('tension');
      if (ph() === 2 && !E.flag('c4_yui_scene')) {
        E.set('c4_yui_scene');
        await yuiScene();
      } else if (ph() === 4 && !E.flag('c4_shop_done')) await shopScene();
      else if (ph() === 5 && tourCount() >= 4 && !E.flag('c4_raid_start')) {
        E.set('c4_raid_start');
        await raidStart();
      }
    },
  });

  // ---------------------------------------------------------------
  //  看板づくり
  // ---------------------------------------------------------------
  async function signScene() {
    E.cut();
    await E.say(null, '看板の画板だ。サキが描いてくれた下書きが、うっすら残っている。');
    await E.say('w2_saki', 'あ……カナタくん。下書き、できてるの。あとは、ペンキで塗るだけ……。');
    await E.say('w2_saki:shy', '看板のすみに、キャッチコピーを入れたいんだけど……なにがいいかな。');
    const c = await E.ask('kanata:think', 'キャッチコピーは……', ['「うまさ光速！ 星屑ラーメン」', '「ニセモノの空に、ホンモノの味」', '「ニコも食べてる！」']);
    E.set('c4_slogan', c);
    if (c === 0) await E.say('ruu', 'ベタ。……でも、わかりやすいのが一番か。');
    else if (c === 1) {
      await E.say('ruu:surprise', '……それ、あたしの口ぐせじゃん。');
      await E.say('kanata:grin', 'いいだろ？　ルウの言葉、けっこう好きなんだよ。');
      await E.say('ruu:shy', '……バカじゃないの。');
    } else {
      await E.say('niko:grin', 'ニコ、たべてる。まいにち、たべてる。ほんと。');
      await E.say('w2_saki:smile', 'ふふ。じゃあ、ニコちゃんの似顔絵も入れるね。');
    }
    await E.say('w2_saki', 'ペンキは、はみ出さないように……タイミングよく、すっと。');
    const s = await E.timing({ title: '看板のペンキ塗り', rounds: 3, speed: 1.3, zone: 0.2, labels: ['赤いベースを塗る！', '文字をなぞる！', 'どんぶりの絵を描く！'], col: '#ff5fa2' });
    E.flash(8);
    E.se('get');
    E.set('c4_sign_done');
    H.swap('c4_board', 'c4_board', { painted: true });
    if (s >= 3) await E.say('w2_saki:smile', '……すごい。いちばんきれいな看板になった。わたしの絵より、上手かも。');
    else if (s >= 2) await E.say('w2_saki:smile', 'うん、いい看板。ちょっとはみ出したところも、味があるよ。');
    else {
      await E.say('w2_saki', '……あ、文字がちょっと、踊ってる……。');
      await E.say('ruu:grin', 'ラーメンの湯気っぽくていいじゃん。そういうデザイン、ってことで。');
    }
    H.reward(120);
    await prepUpdate();
  }

  // ---------------------------------------------------------------
  //  材料：星屑亭のばあちゃん（麺とスープの素）
  // ---------------------------------------------------------------
  G.addToMap('hoshikuzu', {
    onEnter: async () => {
      if (!prep() || E.flag('c4_got_noodle')) return;
      E.cut();
      await E.wait(20);
      await E.say('tome', 'おや、カナタ。ぞろぞろ連れて……文化祭でラーメン屋だって？　商店街じゅうの噂だよ。');
      await E.say('kanata', 'ばあちゃん、頼む！　麺とスープ、分けてくれないかな。');
      await E.say('tome:grin', 'タダでくれてやるほど、ばあちゃんは甘くないよ。……ほら、厨房に入んな。');
      await E.say('tome', 'スープの取り方、叩き込んでやる。店の名前を背負うんだ、半端は許さないからね。');
      await E.say('niko:smile', 'ニコも、みる。ばあちゃんの、ラーメン、まほう。');
      E.teleport('player', 6, 3, 'left');
      await E.wait(10);
      await E.say('tome', 'いいかい。骨は下ゆでして、アクを抜く。火は強すぎず、弱すぎず。……よし、やってみな！');
      const s = await E.timing({ title: 'スープの仕込み', rounds: 3, speed: 1.3, zone: 0.2, labels: ['骨を下ゆでする！', '火加減を見る！', 'アクをすくう！'] });
      if (s >= 3) {
        await E.say('tome:surprise', '……ほう。手つきだけは、父ちゃんそっくりだね。');
        await E.say('tome:smile', '合格だ。……ジンもね、機械いじりの合間に、よくこうして鍋をかき回してたもんさ。');
        E.emote('player', '…');
      } else if (s === 2) await E.say('tome:smile', 'まあまあだね。本番までに、あと百回は練習しな。');
      else {
        await E.say('tome:angry', 'こら、焦がすんじゃないよ！　……まったく。');
        await E.say('tome', '……ふふ。まあいいさ、ばあちゃんも最初はそうだった。');
      }
      await E.say('tome', 'ほら、麺と、スープの素だ。ダシは急いじゃだめ。人間と同じさ。');
      await E.give('c4_noodle', 1);
      await E.say('tome:grin', 'ニコちゃんも、エプロン似合いそうだねぇ。当日はばあちゃんも食べに行くよ。');
      await E.say('niko:grin', 'ニコ、まってる。ばあちゃんの、ぶんも、つくる。');
      E.set('c4_got_noodle');
      E.teleport('player', 7, 7, 'down');
      H.reward(150);
      await prepUpdate();
    },
  });

  // ---------------------------------------------------------------
  //  材料：グリーン・ブロック（ネギ）＋カラス型ドローン退治
  // ---------------------------------------------------------------
  G.addToMap('green', {
    npcs: [
      {
        id: 'c4_yoshio', char: 'c4_yoshio', x: 16, y: 23, dir: 'down', move: 'still', show: () => ch4() && ph() >= 1 && ph() <= 5,
        talk: async () => {
          if (!prep() || E.flag('c4_got_negi')) {
            await E.say('c4_yoshio:smile', 'ネギ、うまく使ってくれよ。シャキシャキが命だからな！');
            return;
          }
          await E.say('c4_yoshio', 'おう、第三中の子か。文化祭のネギ？　分けてやりたいのは山々なんだが……。');
          await E.say('c4_yoshio:angry', 'カラス型ドローンが、ニンジン畑を荒らして困っとるんだ。公安のドローンが増えてから、こいつらまで気が立っててな。');
          const i = await E.ask('c4_yoshio', '追っ払ってくれたら、とびきりのネギをやるぞ！', ['任せて！', 'ちょっと準備してから']);
          if (i === 1) {
            await E.say('c4_yoshio', 'おう。ニンジン畑は西の方だ。準備ができたら声をかけてくれ。');
            return;
          }
          await E.say('ruu:grin', 'カラス退治？　ちょうど体がなまってたとこ。');
          const won = await E.battle({
            enemies: [
              { type: 'drone', x: 4, y: 19, lv: 5, name: 'カラス型ドローン' },
              { type: 'drone', x: 9, y: 20, lv: 5, name: 'カラス型ドローン' },
              { type: 'drone', x: 6, y: 22, lv: 5, name: 'カラス型ドローン' },
              { type: 'drone', x: 10, y: 18, lv: 5, name: 'カラス型ドローン' },
            ],
            title: 'BATTLE!',
            sub: 'カラス型ドローンを追い払え',
          });
          if (!won) return;
          await E.say('c4_yoshio:grin', 'おおっ、やるじゃないか！　ほれ、朝どれのネギだ。持っていけ！');
          await E.give('c4_negi', 1);
          await E.say('c4_yoshio', 'それと……トンネルのほうには近づくなよ。北の壁の整備トンネル、最近夜中に変な音がするんだ。');
          await E.say('niko:think', '……とんねる。');
          E.set('c4_got_negi');
          H.reward(150);
          await prepUpdate();
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  材料：ミナト区（チャーシュー）／ポスター（バス停・星屑亭の壁）
  // ---------------------------------------------------------------
  G.addToMap('minato', {
    npcs: [
      {
        id: 'c4_butcher', char: 'c4_butcher', x: 16, y: 21, dir: 'down', move: 'still', show: () => ch4() && ph() >= 1 && !E.flag('w_evac'),
        talk: async () => {
          if (!prep() || E.flag('c4_got_chashu')) {
            await E.say('c4_butcher:grin', 'がっはっは！　大豆だって、愛情こめりゃあ肉になる！　文化祭、がんばれよ！');
            return;
          }
          await E.say('c4_butcher', 'へいらっしゃい！　肉屋〈ガンテツ〉だ！　……ほう、文化祭のチャーシュー？');
          await E.say('c4_butcher', 'うちの大豆チャーシューは、コロニーいちの自信作だ。培養肉より高いぞ。一本 ¢300！');
          const opts = ['¢300 払う', '値切る', 'ニコにまかせる'];
          const i = await E.ask('kanata:think', '（どうしよう……）', opts);
          if (i === 0) {
            if (G.state.money < 300) {
              await E.say('kanata:sad', '……財布の中身が、足りない。');
              await E.say('c4_butcher', 'なんでえ、しけてんな。じゃあ ¢100 でいい。出世払いだ！');
              E.money(-Math.min(100, G.state.money));
            } else {
              E.money(-300);
              await E.say('c4_butcher:grin', '毎度！　いい買いっぷりだ。気に入った、一本おまけしとく！');
            }
          } else if (i === 1) {
            await E.say('ruu:serious', 'おっちゃん。これ、学校の出し物なんだけど。子ども相手に ¢300 はないっしょ。');
            await E.say('c4_butcher:angry', 'なっ……！　うちは慈善事業じゃねえ！');
            await E.say('ruu:grin', '屋台の看板に「肉屋ガンテツ協賛」って入れてあげる。全校生徒とその親が見るよ？');
            await E.say('c4_butcher', '……ぐぬぬ。¢150 だ！　それ以上はまからねえ！');
            E.money(-Math.min(150, G.state.money));
            await E.say('kanata', '（ルウ、商売上手すぎだろ……）');
          } else {
            await E.say('niko', '…………。');
            E.emote('c4_butcher', '?');
            await E.say('niko:sad', '……ニコ、おなか、すいた。ちゃーしゅー……ちょっとだけ、みたい……。');
            E.emote('c4_butcher', '♥');
            await E.say('c4_butcher:cry', 'う、うおおお……！　なんて目で見やがる……！　持ってけ！　タダだ！　ちくしょう、持ってけ泥棒！');
            await E.say('ruu', '……ニコ、恐ろしい子。');
          }
          await E.give('c4_chashu', 1);
          E.set('c4_got_chashu');
          H.reward(100);
          await prepUpdate();
        },
      },
    ],
    checks: [
      { x: 27, y: 25, w: 4, show: () => prep() && !E.flag('c4_post_bus') && E.has('c4_poster'), run: async () => await putPoster('bus', 'バス停の掲示板') },
      { x: 8, y: 20, w: 3, show: () => prep() && !E.flag('c4_post_shop') && E.has('c4_poster'), run: async () => await putPoster('shop', '星屑亭の壁') },
      { x: 12, y: 20, w: 3, show: () => prep() && !E.flag('c4_post_shop') && E.has('c4_poster'), run: async () => await putPoster('shop', '星屑亭の壁') },
    ],
  });
  async function putPoster(key, where) {
    E.take('c4_poster', 1);
    E.set('c4_post_' + key);
    E.se('pickup');
    await E.say(null, `${where}に、文化祭のポスターを貼った！`);
    if (key === 'bus') {
      await E.say('ruu', 'バス待ちの人、けっこう見てくれてるじゃん。');
      await E.say(null, '通りがかりのおばあさん「あら、星屑亭のラーメン？　行かなきゃねぇ」');
    } else if (key === 'shop') {
      await E.say('niko:smile', 'ばあちゃんの、おみせに、ニコたちの、おみせ。……いっしょ。');
    } else {
      await E.say('ruu:grin', 'いちばん目立つとこに貼ってやった。2-Aのお化け屋敷のポスターの上に。');
      await E.say('kanata:surprise', 'おい、それはまずいって！');
    }
    H.reward(50);
    await prepUpdate();
  }

  // ---------------------------------------------------------------
  //  材料：ドクのガレージ（移動式コンロ）
  // ---------------------------------------------------------------
  G.addToMap('doc_garage', {
    onEnter: async () => {
      if (!prep() || E.flag('c4_got_stove')) return;
      E.cut();
      await E.wait(20);
      if (!E.flag('c4_doc_asked')) {
        E.set('c4_doc_asked');
        await E.say('doc', 'ふん、若造か。……なんだその顔は。また面倒ごとを持ってきたな。');
        await E.say('kanata', 'ドク！　文化祭でラーメン屋やるんだ。移動式のコンロ、作れないかな？');
        await E.say('doc', 'ラーメン屋だと？　ワシは機械屋だ。……ネジ、聞いたか。この若造、ワシを屋台の大工と勘違いしとる。');
        await E.say('neji', 'ニャー（ギギッ）。');
        await E.say('doc', '……ふん。廃材のバーナーユニットならある。ジャンクパーツを3つよこせば、組んでやらんこともない。');
      } else await E.say('doc', 'ふん、戻ったか。ジャンクパーツ3つ、持ってきたか？');
      const opts = [];
      if (E.has('scrap', 3)) opts.push('ジャンクパーツを3つ渡す');
      if (G.state.money >= 200) opts.push('お金で払う（¢200）');
      opts.push('出直す');
      const i = await E.ask('kanata', '（どうする？）', opts, { cancel: opts.length - 1 });
      const pick = opts[i];
      if (pick === '出直す') {
        await E.say('doc', 'ジャンクパーツなら、外のスクラップ・ベイにいくらでも転がっとる。ラットどもに気をつけろよ。');
        return;
      }
      if (pick.startsWith('ジャンク')) E.take('scrap', 3);
      else E.money(-200);
      await E.say('doc', 'ふん。待っとれ。');
      await E.fadeOut(16);
      E.se('hit');
      await E.wait(10);
      E.se('hit');
      await E.wait(10);
      E.se('boost');
      await E.wait(20);
      await E.fadeIn(16);
      await E.say('doc', 'ほれ。AFのスラスター用バーナーを流用した。火力は……まあ、加減して使え。');
      await E.give('c4_stove', 1);
      await E.say('ruu:surprise', 'ちょ、スラスター！？　ラーメン屋台に！？');
      await E.say('doc', '機械は嘘をつかん。正しく使えば、正しく燃える。……それだけだ。');
      await E.say('kanata', 'それとさ、ドク。当日、ハルカゼとローズハウンドを校庭に展示したいって、ポンタが……。');
      await E.say('doc', '……ふん。好きにしろ。ただし、傷ひとつでもつけたら若造の小遣いから引くぞ。');
      await E.say('doc:serious', '……それと、カナタ。最近、公安の連中がこのあたりの廃品の出入りを洗っとる。デュエルのことも、嗅ぎつけとるかもしれん。');
      await E.say('doc', '祭りの日くらいは、浮かれてもいい。だが、目だけは開けておけ。……ジンも、そういう男だった。');
      E.emote('player', '…');
      E.set('c4_got_stove');
      H.reward(150);
      await prepUpdate();
    },
  });

  // ===============================================================
  //  2. ユイの追及 → 真実 → 屋上の告白（夕方）
  // ===============================================================
  async function yuiScene() {
    E.cut();
    H.stash();
    E.teleport('player', 20, 13, 'up');
    H.actors([
      ['c4_a_yui', 'yui', 8, 5, 'right'],
      ['c4_a_ruu', 'ruu', 19, 13, 'up'],
      ['c4_a_niko', 'niko', 21, 13, 'up'],
    ]);
    await E.wait(20);
    E.move('player', [[19, 13], [19, 5], [12, 5]], { speed: 1.3, noWait: true });
    await E.wait(16);
    E.move('c4_a_ruu', [[18, 13], [18, 4], [13, 4]], { speed: 1.3, noWait: true });
    await E.move('c4_a_niko', [[21, 13], [21, 6], [13, 6]], { speed: 1.3 });
    await E.wait(10);
    E.face('player', 'left');
    E.face('c4_a_ruu', 'left');
    E.face('c4_a_niko', 'left');
    await E.say('kanata:grin', 'ユイー、ただいま。材料も看板もポスターも、ぜんぶばっちり……。');
    await E.say('yui:serious', '……おかえりなさい。準備、お疲れさまでした。');
    await E.say('yui:serious', '参加者名簿の件です。ニコさんの住民ID……ルウさんが書いてくれた番号を、総督府のデータベースで照会しました。');
    E.emote('c4_a_ruu', '!');
    await E.say('yui', '該当者なし。この番号の住民は、クレイドル7に存在しません。');
    await E.say('yui', '転入書類の印影も、発行日も……ぜんぶ、つじつまが合わないんです。');
    await E.say('yui:angry', '説明してください。ニコさんは……いったい、誰なんですか。');
    await E.say('niko:sad', '……ニコ……。');
    const c = await E.ask('kanata:think', '（どうする……？）', ['本当のことを話す', 'ごまかす']);
    if (c === 1) {
      await E.say('kanata', 'あー……その、データベースのバグじゃないかな。マザーも最近、調子悪いし……。');
      await E.say('yui:angry', '春瀬くん。わたしの目を見て、同じことが言えますか？');
      await E.say('kanata:sad', '…………。');
      E.emote('c4_a_niko', '…');
      await E.say('niko:serious', 'カナタ、うそ、へた。……ニコ、うそ、きらい。');
      await E.say('niko', 'ニコ、はなす。ほんとのこと。');
    } else await E.say('kanata:serious', 'わかった。……全部話すよ。でも、最後まで聞いてくれ。');
    await E.say('kanata', 'ニコは、コロニーの外から来たんだ。スクラップ・ベイで、公安に追われてるところを見つけた。');
    await E.say('ruu:serious', '身分証は……あたしたちがジャンク・デュエルの賞金で作った。ニセモノだよ。言い出したのは、あたし。');
    await E.say('kanata', 'ルウだけじゃない。オレも、ばあちゃんも、みんなで決めたんだ。');
    await E.say('niko:sad', 'ニコ、にげてきた。しろい、へや。……ちゅうしゃ、いたい。「ほしのこえを、きけ」って、ずっと……。');
    E.emote('c4_a_yui', '!');
    await E.say('yui:surprise', '白い部屋……星の、声……？');
    await E.say('yui:sad', '……まさか。そんな、まさか……。');
    await E.say('ruu:angry', '通報したいなら、すれば？　でも、ニコを連れてくってんなら、委員長でも、あたしが――');
    await E.say('yui:cry', 'ちがいます！　……ちがうんです。');
    await E.say('yui', '……場所を変えましょう。ここでは、話せません。');
    await E.fadeOut(24);
    H.clear(['c4_a_yui', 'c4_a_ruu', 'c4_a_niko']);
    await E.warp('rooftop', 17, 12, 'up', { noEnter: true, noFade: true });
    E.cut();
    for (const id of ['w2_tenmon', 'w2_napper', 'w2_guitar']) E.remove(id);
    H.actors([
      ['c4_a_yui', 'yui', 17, 9, 'up'],
      ['c4_a_ruu', 'ruu', 15, 12, 'up'],
      ['c4_a_niko', 'niko', 19, 12, 'up'],
    ]);
    E.bgm('sad');
    await E.fadeIn(24);
    await E.say(null, '夕暮れの屋上。フェンスの向こう、空いっぱいに「向こう側の街」が赤く染まっている。');
    await E.say('yui:serious', '……先月、父の書斎に入ったんです。父の誕生日のプレゼントを、こっそり置いておこうと思って。');
    await E.say('yui', '机の上に、ファイルがありました。表紙に「PROJECT ECHO」……そして、「極秘」の判。');
    E.face('c4_a_yui', 'down');
    await E.say('yui:sad', '開くつもりはなかったんです。でも、写真がはさまっていて……。');
    await E.say('yui:cry', '白い髪の、女の子でした。番号札をつけて、白い部屋のベッドで……眠っているみたいに。');
    E.emote('c4_a_niko', '!');
    await E.say('yui', 'ずっと、見間違いだと思っていました。父は総督です。コロニーのみんなを守る人です。そんなこと、するはずないって。');
    await E.say('yui:cry', 'でも……ニコさんの話を聞いて、わかってしまいました。あの写真の子は……あなたなんですね。');
    await E.say('niko:sad', 'ニコ……おぼえて、ない。でも、しろいへや、ほんと。');
    await E.say('ruu:serious', '……で？　委員長は、どうすんの。');
    const k = await E.ask('kanata', '（ユイに……）', ['「一緒にニコを守ってくれ」', '「無理しなくていい」']);
    if (k === 0) await E.say('kanata:serious', 'ユイ。オレたちと一緒に、ニコを守ってくれないか。');
    else {
      await E.say('kanata', '……無理しなくていいよ。ユイの父さんのことだし。オレたち、ユイを巻き込みたくない。');
      await E.say('yui:angry', '巻き込みたくない、ですって？　……もう巻き込まれています！');
    }
    await E.say('yui:serious', '……校則第1条。「生徒は、互いを尊重し、助け合わなければならない」。');
    await E.say('yui', 'わたし、規則は守ります。いちばん大事な規則から、順番に。');
    await E.say('yui:smile', 'ニコさんのIDの件は、わたしがなんとかします。生徒会の名簿は……わたしが管理していますから。');
    await E.say('ruu:grin', '……委員長、悪い子じゃん。');
    await E.say('yui:shy', 'わ、悪い子ではありません！　合理的な判断です！');
    await E.move('c4_a_niko', 'U2', { speed: 0.9 });
    await E.say('niko:smile', 'ユイ……ありがと。ユイも、ニコの、ともだち？');
    await E.say('yui:smile', '……はい。友達です。');
    E.set('c4_yui_ally');
    E.se('get');
    await E.notice('ユイが仲間になった！');
    await E.say('kanata:grin', 'なんとかなるって。……いや、なんとかしよう。みんなで。');
    await E.cg('colony_dusk', 'ニセモノの夕焼けが、四人の影を長くのばしていた。');
    E.cgOff();
    await E.say('yui:think', 'ただ……父の書斎には、もうひとつ気になる名前がありました。「アイゼン」。公安の特務隊長です。');
    await E.say('ruu:surprise', 'アイゼン……アリーナの観客席にいた、あの軍人っぽいおっさん……？');
    await E.say('kanata:serious', '…………。');
    await E.say('yui', 'ファイルには「回収」という言葉がありました。……気をつけてください。わたしも、できるだけ父の動きを探ってみます。');
    H.clear(['c4_a_yui', 'c4_a_ruu', 'c4_a_niko']);
    setPh(3);
    H.reward(300);
    await festivalEve();
  }

  // ---------------------------------------------------------------
  //  文化祭前夜（ラジオ）
  // ---------------------------------------------------------------
  async function festivalEve() {
    await E.fadeOut(30);
    E.time('night');
    E.party([]);
    await E.warp('tome_room', 5, 6, 'down', { noEnter: true, noFade: true });
    E.cut();
    H.actors([['c4_a_niko', 'niko', 3, 6, 'right']]);
    await E.fadeIn(30);
    await E.say(null, '――その夜。文化祭の前の晩。');
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさんたち！　レディオ・スターダストの時間だよ！',
      '明日はあちこちの学校で文化祭！　第三中の2年B組は、なんとラーメン屋台だって。リリィも行っちゃおうかな～。',
      '……で、ここからはちょっと真面目なお話。最近、公安の特務隊がやけに動いてるの。アイゼン少佐って人、知ってる？',
      '噂じゃ、なにか「探しもの」をしてるんだって。……みんな、楽しいお祭りの日こそ、まわりをよく見てね。',
      ['niko', '……りりぃの、こえ。やさしい。'],
      'それじゃ一曲。明日が、いい日になりますように。――「スターダスト・ララバイ」。',
    ]);
    await E.say('niko:smile', 'カナタ。あした、たのしみ。ニコ、はじめて。おまつり。');
    await E.say('kanata:smile', 'そっか。……じゃあ、最高の文化祭にしないとな。');
    await E.say('niko', 'ニコ、ラーメン、いっぱい、つくる。カナタと、ルウと、ユイと、ポンタと……みんなで。');
    await E.say('niko', '……ずっと、こうだと、いいな。');
    await E.say('kanata', '…………。ずっと、こうだよ。');
    await E.fadeOut(40);
    await E.wait(30);
    H.clear(['c4_a_niko']);
    await festivalMorning();
  }

  // ===============================================================
  //  3. 文化祭当日
  // ===============================================================
  async function festivalMorning() {
    E.time('day');
    setPh(4);
    E.party(['ruu', 'niko']);
    await E.cg('colony', '星暦0085年、秋。第三中学校 文化祭――当日。');
    E.cgOff();
    await E.warp('school_yard', 22, 35, 'up', { noEnter: true });
    E.bgm('festival');
    E.cut();
    await E.say('ruu:grin', 'うわ……ニセモノの空の下でも、祭りは祭りじゃん。');
    await E.say('niko:surprise', 'いいにおい……！　たこやき、くれーぷ、やきそば……！');
    await E.say('kanata', 'ニコ、オレたちの屋台が先な。開店前に仕込みだ。');
    await E.say('niko:sad', '……さきに、ちょっとだけ……。');
    await E.say('ruu', 'あとで全部回ってやるから。ほら、行くよ。');
    E.objective('2年B組の屋台（教室）へ行く');
  }

  // ---------------------------------------------------------------
  //  文化祭スタンプラリー（任意）：屋台4つ＋出し物4つ
  // ---------------------------------------------------------------
  G.mob('c4_satomi', '文化祭実行委員のサトミ', 4111, { girl: true, over: { top: '#2a3460', top2: '#f4f2fb', outfit: 'uniform', bstyle: 'skirt', acc: ['cap'], accCol: '#ff5fa2', style: 'ponytail' } });
  G.addItem('c4_stampcard', { name: 'スタンプカード', desc: '文化祭スタンプラリーの台紙。屋台4つ（たこ焼き・クレープ・やきそば・かき氷）と出し物4つ（喫茶・お化け屋敷・号外・屋上ライブ）を回ってスタンプを集めよう。' });
  const STAMPS = [['tako', 'たこ焼き'], ['crepe', 'クレープ'], ['soba', 'やきそば'], ['kori', 'かき氷'], ['cafe', '喫茶'], ['haunt', 'お化け屋敷'], ['news', '号外'], ['live', '屋上ライブ']];
  const stampOk = (k) => (['cafe', 'haunt', 'news', 'live'].includes(k) ? E.flag('c4_tour_' + k) : E.flag('c4_stamp_' + k));
  const stampCount = () => STAMPS.filter(([k]) => stampOk(k)).length;
  async function stamp(k, name) {
    if (E.flag('c4_stamp_' + k)) return;
    E.set('c4_stamp_' + k);
    if (E.has('c4_stampcard')) {
      E.se('pickup');
      E.toast(`スタンプ「${name}」をゲット！（${stampCount()}/8）`, '#ffd25e');
    }
  }
  async function stampRally() {
    if (!E.has('c4_stampcard')) {
      await E.say('c4_satomi', 'ようこそ、第三中学校文化祭へ！　実行委員のサトミです！　スタンプラリーやってまーす！');
      await E.say('c4_satomi', '屋台4つと、出し物4つ。ぜんぶ回ってスタンプを集めたら、豪華景品をプレゼント！');
      await E.give('c4_stampcard', 1);
      const n = stampCount();
      if (n) await E.say('c4_satomi', `あ、もう回ったところがあるの？　じゃあ、そのぶんも押しておくね！（${n}/8）`);
      return;
    }
    const n = stampCount();
    if (E.flag('c4_stamp_prize')) return await E.say('c4_satomi:smile', 'スタンプラリー制覇、おめでとう！　……実は、全部集めたのは今年あなたたちが初めてなの。');
    if (n < 8) {
      const left = STAMPS.filter(([k]) => !stampOk(k)).map(([, nm]) => nm).join('・');
      await E.say('c4_satomi', `いまのスタンプは ${n}/8 個！　あとは……${left}！`);
      if (!tour()) await E.say('c4_satomi', '出し物は午後から開くよ。屋台なら、もう回れるからね！');
      return;
    }
    E.set('c4_stamp_prize');
    await E.say('c4_satomi:grin', 'すごい！　8個ぜんぶ！　スタンプラリー完全制覇です！　景品はこちら！');
    await E.give('sneakers', 1, { wait: true });
    await E.say('c4_satomi', '体育祭用に取っておいた、エアスニーカー！　……実行委員長には内緒ね。');
    await E.say('ruu:grin', 'へえ、いいじゃん。これで廊下も全力で走れるね。');
    await E.say('kanata', 'バルガス先生に怒られるって。');
    H.reward(150);
  }

  // ---------------------------------------------------------------
  //  校庭の飾り・屋台・展示
  // ---------------------------------------------------------------
  const yardShop = (goods, title) => async () => await E.shop(goods, title);
  G.addToMap('school_yard', {
    objects: [
      { p: 'billboard', x: 28, y: 13, w: 6, text: 'NO.3 FEST', col: '#ff5fa2', show: festDeco },
      { p: 'stall', x: 2, y: 13, text: 'TAKOYAKI', col: '#c03030', show: festDeco },
      { p: 'stall', x: 13, y: 13, text: 'CREPE', col: '#ff8fb8', show: festDeco },
      { p: 'stall', x: 30, y: 23, text: 'YAKISOBA', col: '#e08a30', show: festDeco },
      { p: 'stall', x: 38, y: 23, text: 'KAKIGORI', col: '#3a9ad0', show: festDeco },
      { p: 'w2_banner', x: 17, y: 9, text: 'FEST', col: '#ff5fa2', up: 14, show: festDeco },
      { p: 'w2_banner', x: 28, y: 9, text: 'NO3', col: '#ffd25e', up: 14, show: festDeco },
      { p: 'c4_chochin', x: 20, y: 14, w: 6, show: festDeco },
      { p: 'c4_chochin', x: 20, y: 20, w: 6, show: festDeco },
      { p: 'c4_chochin', x: 20, y: 26, w: 6, show: festDeco },
      { p: 'c4_chochin', x: 20, y: 32, w: 6, show: festDeco },
      { p: 'c4_chochin', x: 1, y: 11, w: 8, show: festDeco },
      { p: 'c4_chochin', x: 36, y: 11, w: 8, show: festDeco },
      { p: 'flowerbed', x: 27, y: 36, w: 2, show: festDeco },
      { p: 'sign', x: 34, y: 23, text: 'MECH', col: '#3a6ad0', show: festDeco, msg: '「本物のAF展示！　ハルカゼ＆ローズハウンド（クラン〈スターダスト〉所属）　さわらないでね　2-B ポンタ」' },
      { p: 'c4_van', x: 21, y: 36, show: () => raid() && !E.flag('c4_abduct_done') },
      { p: 'c4_van', x: 2, y: 33, show: raid },
    ],
    npcs: [
      { id: 'c4_tako', char: 'c4_tako', x: 3, y: 12, dir: 'down', move: 'still', show: fest, talk: async () => {
        await E.say('c4_tako', '3年B組のたこ焼きだ！　中身は培養タコ、外はカリッ！');
        await stamp('tako', 'たこ焼き');
        await E.shop(['c4_takoyaki', 'soda'], 'たこ焼き〈タコ・ノヴァ〉');
      } },
      { id: 'c4_satomi', char: 'c4_satomi', x: 19, y: 36, dir: 'right', move: 'still', show: fest, talk: async () => await stampRally() },
      { id: 'c4_crepe', char: 'c4_crepe', x: 14, y: 12, dir: 'down', move: 'still', show: fest, talk: async () => {
        await E.say('c4_crepe', 'いらっしゃいませ～！　いちごは温室産です！　グリーン・ブロックの！');
        await stamp('crepe', 'クレープ');
        await E.shop(['c4_crepe', 'candy'], 'クレープ〈ミルキーウェイ〉');
      } },
      { id: 'c4_soba', char: 'c4_soba', x: 32, y: 22, dir: 'down', move: 'still', show: fest, talk: async () => {
        await E.say('c4_soba', 'やきそばァ！　ソースは三度がけ！　うまいぞォ！');
        await stamp('soba', 'やきそば');
        await E.shop(['c4_yakisoba', 'onigiri'], 'やきそば〈鉄板番長〉');
      } },
      { id: 'c4_kori', char: 'c4_kori', x: 39, y: 22, dir: 'down', move: 'still', show: fest, talk: async () => {
        await E.say('c4_kori', 'ネオン味のかき氷、いかが？　舌が光るよ！');
        await stamp('kori', 'かき氷');
        await E.shop(['c4_kakigori', 'energy'], 'かき氷〈ルミナス〉');
      } },
      { id: 'c4_haru', char: 'sys', mech: 'harukaze', x: 33, y: 18, dir: 'down', move: 'still', show: festDeco, noFace: true, talk: async () => {
        await E.say(null, 'ハルカゼ。父さんのポンコツ号を、ドクとばあちゃんが生まれ変わらせた白い機体。');
        if (fest()) await E.say(null, '見物の子どもたちが、目を輝かせて見上げている。');
      } },
      { id: 'c4_rose', char: 'sys', mech: 'rose', x: 37, y: 18, dir: 'down', move: 'still', show: festDeco, noFace: true, talk: async () => {
        await E.say(null, 'ローズハウンド。ルウのピンクの格闘機だ。');
        if (fest()) await E.say('ruu:grin', '……かわいいっしょ。でも、さわったら噛むよ。');
      } },
      { id: 'c4_y_ponta', char: 'ponta', x: 35, y: 20, dir: 'down', move: 'still', show: fest, talk: async () => {
        if (!E.flag('c4_ponta_fest')) {
          E.set('c4_ponta_fest');
          await E.say('ponta:grin', 'カナタ！　見てくださいっす、この人だかり！　AF展示、大成功っす！');
          await E.say('ponta', 'ハルカゼの全高は8.6メートル、出力はポンコツ号の2.4倍、そしてなにより――');
          await E.say('ruu', 'はいはい、スペックはあとで聞くから。');
          await E.say('ponta', '……ちなみに、展示中でもバッテリーは入れっぱなしっす。いざとなったらすぐ動かせるっす。……いざって、何っすかね？');
          return;
        }
        await E.say('ponta', G.pick(['ローズハウンドの関節、子どもたちに大人気っす！　「ネコみたい」って！', 'オイラ、ずっとここで展示の説明係っす。屋台はみんなに任せたっす！', 'さっき、軍服のおじさんがハルカゼをじーっと見てたっす。……なんだったんすかね。']));
      } },
      { id: 'c4_mom', char: 'c4_mom', x: 24, y: 28, dir: 'left', move: 'wander', range: 2, show: fest, talk: async () => {
        if (!E.flag('c4_kid_found')) return await E.say('c4_mom', 'うちの子、どこ行ったのかしら……。タロウっていうの。黄色いシャツの……見なかった？');
        if (E.flag('c4_mom_thanks')) return await E.say('c4_mom:smile', 'タロウったら、ロボットの前から動かないのよ。……将来はパイロットになるんですって。');
        E.set('c4_mom_thanks');
        await E.say('c4_mom:smile', 'あなたたちね、タロウを見つけてくれたの！　本当にありがとう……！');
        await E.say('c4_mom', 'これ、よかったら。さっきクレープ屋さんで買ったの。白い髪のお嬢ちゃんと分けてね。');
        E.give('c4_crepe', 2);
        await E.say('niko:grin', 'くれーぷ……！　ニコ、まいご、さがすの、とくい。また、さがす。');
      } },
      { id: 'c4_kid', char: 'c4_kid', x: 40, y: 30, dir: 'down', move: 'still', show: fest, talk: async () => {
        if (E.flag('c4_kid_found')) return await E.say('c4_kid:smile', 'ママのとこ、もどるね！　ロボット、かっこよかった！');
        await E.say('c4_kid:cry', 'うぇぇ……ママぁ……。ウサギさん見てたら、いなくなっちゃった……。');
        await E.say('niko', '……ニコも、まいご、だった。こわいの、しってる。');
        await E.say('niko:smile', 'だいじょうぶ。ママ、あっち。ニコ、きこえる。ママの、しんぱいの、おと。');
        E.set('c4_kid_found');
        await E.say(null, 'ニコに手をひかれて、タロウくんは母親のもとへ走っていった。');
        await E.say('ruu', '……ニコ、いま「聞こえる」って言った？');
        await E.say('niko:think', '……？　きこえる、よ？　みんなの、こころの、おと。');
        H.reward(60);
      } },
      { id: 'c4_old', char: 'c4_old', x: 7, y: 11, dir: 'down', move: 'still', show: fest, talk: async () => {
        await E.say('c4_old', 'わしは第三中の第一期卒業生じゃ。コロニーができて最初の文化祭はの、屋台が三つしかなかった。');
        await E.say('c4_old:smile', '戦争中でな、ラーメンなんぞ夢のまた夢じゃった。……いい時代になったもんじゃ。この平和が、ずっと続くといいのう。');
      } },
    ],
    events: [
      { x: 21, y: 38, w: 4, cond: () => ch4() && ph() >= 4 && ph() <= 6, run: async () => {
        await E.say('kanata', raid() ? '……ニコを置いて、逃げるわけにはいかない。' : '今日は文化祭だ。抜け出してる場合じゃないって。');
        await E.move('player', 'U', { speed: 1.4 });
      } },
    ],
    onEnter: async () => {
      if (fest()) E.bgm('festival');
      if (raid()) {
        E.bgm('tension');
        for (const e of G.field.ents.slice()) if (e.id && /^w2_/.test(e.id)) E.remove(e.id);
        if (E.flag('c4_to_yard') && !E.flag('c4_abduct_done')) await abduction();
      }
    },
  });

  // ---------------------------------------------------------------
  //  廊下：飾り・出し物の入口・号外のミミ
  // ---------------------------------------------------------------
  G.addToMap('school_hall', {
    objects: [
      { p: 'poster', x: 16, y: 2, col: '#ff5fa2', show: () => ch4() && E.flag('c4_post_hall') },
      { p: 'sign', x: 7, y: 3, text: 'OBAKE', col: '#5a3a7a', show: festDeco, msg: '「3年A組　恐怖！無重力病棟（2年A組の教室をお借りしています）」' },
      { p: 'sign', x: 15, y: 3, text: 'RAMEN', col: '#c03030', show: festDeco, msg: '「2年B組　星屑亭・出張店」' },
      { p: 'sign', x: 21, y: 3, text: 'CAFE', col: '#8a3a3a', show: festDeco, msg: '「教員有志の喫茶〈赤い悪魔〉　出張中につき2年C組の教室をお借りしています」' },
      { p: 'c4_chochin', x: 4, y: 4, w: 8, show: festDeco },
      { p: 'c4_chochin', x: 24, y: 4, w: 8, show: festDeco },
      { p: 'c4_chochin', x: 36, y: 4, w: 8, show: festDeco },
    ],
    npcs: [
      { id: 'c4_mimi', char: 'mimi', x: 24, y: 6, dir: 'down', move: 'still', show: fest, talk: async () => await mimiExtra() },
      { id: 'c4_hh_zombie', char: 'c4_zombie', x: 8, y: 2, dir: 'down', move: 'still', show: fest, talk: async () => {
        if (!tour()) return await E.say('c4_zombie', 'うぁぁ……まだ準備中だぁ……。昼過ぎに来てくれぇ……。中で「ぎゃああ」の練習中だぁ……。');
        const i = await E.ask('c4_zombie', E.flag('c4_tour_haunt') ? 'うぁぁ……また来たのかぁ……。もう一回、入ってくかぁ……？' : 'うぁぁ……いらっしゃいませぇ……。3年A組〈恐怖！無重力病棟〉……入ってくかぁ……？', ['入る', 'やめておく'], { cancel: 1 });
        if (i === 1) return await E.say('c4_zombie', 'うぁぁ……チキンめぇ……。');
        E.se('door');
        await E.warp('c4_haunted', 2, 12, 'up');
      } },
      { id: 'c4_cafe_girl', char: 'w2_rika', x: 20, y: 2, dir: 'down', move: 'still', show: fest, talk: async () => {
        if (!tour()) return await E.say('w2_rika', '教員有志の喫茶〈赤い悪魔〉は、午後から開店よ。バルガス先生が、朝からドーナツを揚げてるの。');
        await E.say('w2_rika', 'いらっしゃい。喫茶〈赤い悪魔〉へようこそ。……店長がちょっと暑苦しいけど、味は保証するわ。');
        E.se('door');
        await E.warp('c4_cafe', 9, 10, 'up');
      } },
    ],
    checks: [
      { x: 16, y: 2, w: 2, show: () => prep() && !E.flag('c4_post_hall') && E.has('c4_poster'), run: async () => await putPoster('hall', '廊下の掲示板') },
    ],
    events: [
      { x: 38, y: 3, w: 1, h: 6, once: 'c4_r1_ev', cond: () => raid() && E.flag('c4_raid_go'), run: async () => await rescue1() },
      { x: 42, y: 9, w: 1, h: 2, cond: () => raid() && E.val('c4_rescued') >= 3 && !E.flag('c4_darkroom'), run: async () => await darkroom() },
      { x: 42, y: 9, w: 1, h: 2, cond: () => raid() && E.val('c4_rescued') < 3, run: async () => {
        await E.say('kanata', '（ニコとユイは、この奥の暗室だ。……でも、まずは逃げ遅れた子たちを外に出さないと）');
        await E.move('player', 'U', { speed: 1.4 });
      } },
    ],
    onEnter: async () => {
      if (fest()) {
        E.bgm('festival');
        E.remove('w2_mimi');
      }
      if (raid()) {
        E.bgm('tension');
        for (const e of G.field.ents.slice()) if (e.id && /^w2_/.test(e.id)) E.remove(e.id);
      }
    },
  });

  // 職員室：文化祭中、先生は喫茶店に出張中
  G.addToMap('staffroom', {
    onEnter: async () => {
      if (fest()) {
        E.bgm('festival');
        E.remove('w2_vargas');
      }
      if (raid()) {
        E.bgm('tension');
        E.remove('w2_vargas');
      }
    },
  });
  // 屋上：ライブ
  G.addToMap('rooftop', {
    objects: [
      { p: 'c4_stage', x: 13, y: 9, w: 6, text: 'NO3 LIVE', show: festDeco },
      { p: 'c4_chochin', x: 3, y: 8, w: 8, show: festDeco },
      { p: 'c4_chochin', x: 22, y: 8, w: 10, show: festDeco },
    ],
    npcs: [
      { id: 'c4_kakeru', char: 'w2_guitar', x: 16, y: 9, dir: 'down', move: 'still', show: () => fest(), talk: async () => await E.say('w2_guitar', tour() ? 'ライブ、聴いてくれてサンキュ！　……ギルさん、また来てくんないかな。' : '午後から屋上ライブやるんだ。ゲストがすごいんだぜ。……誰かは、お楽しみ。') },
    ],
    onEnter: async () => {
      if (fest()) {
        E.bgm('festival');
        E.remove('w2_guitar');
        if (tour() && !E.flag('c4_tour_live')) await liveScene();
      }
      if (raid()) {
        E.bgm('tension');
        for (const e of G.field.ents.slice()) if (e.id && /^w2_/.test(e.id)) E.remove(e.id);
        if (E.flag('c4_raid_go') && !E.flag('c4_r3')) await rescue3();
      }
    },
  });

  // ---------------------------------------------------------------
  //  屋台：ラーメン作りミニゲーム（5人の客）
  // ---------------------------------------------------------------
  const CUSTOMERS = [
    {
      char: 'w2_kouhai1',
      order: [['w2_kouhai1', 'は、春瀬先輩のラーメン！　一番乗りです！　ふつう盛りで！']],
      good: [['w2_kouhai1:smile', 'うまっ……！　先輩、シミュレーターだけじゃなくて、ラーメンも学年1位です！']],
      ok: [['w2_kouhai1', 'お、おいしいです！　……ちょっと麺がかためかも。でも、先輩の味です！']],
      bad: [['w2_kouhai1', '……先輩、これ、スープ……ですよね？　あ、いえ！　個性的です！']],
    },
    {
      char: 'mimi',
      order: [['mimi', '先輩！　新聞部の取材っす！　看板メニューを一杯、写真映えするやつで！'], ['mimi', '（パシャッ）……スクープの匂い、じゃなくて、とんこつの匂いっす！']],
      good: [['mimi:smile', 'うんまっ！　号外の一面、決まりっすよ！「2年B組、光速のうまさ」！']],
      ok: [['mimi', 'おいしいっす！　……写真的には、チャーシューがもう一枚ほしかったっす。']],
      bad: [['mimi', '……先輩。記事は、うまいことぼかしておくっす。']],
    },
    {
      char: 'w2_gen',
      order: [['w2_gen', 'ほう、ここが噂の屋台か。ワシにも一杯もらえるかの。ゴミ拾いで腹が減ってのう。']],
      good: [['w2_gen:smile', '……うまい。星屑亭の味じゃ。トメさんの若い頃を思い出すわい。']],
      ok: [['w2_gen', 'うむ、悪くない。若いもんの作る味じゃ。伸びしろがある。']],
      bad: [['w2_gen', '……ワシが若い頃の、戦時配給のスープに似とるのう。いや、懐かしいわい。']],
    },
    {
      char: 'gil',
      order: [['gil', 'イッツ・ショータイム！　……おっと、今日はただの客だ。'], ['gil:grin', 'ラーメン一丁！　燃えるほど熱いやつで頼むぜ、スターダスト！']],
      good: [['gil:grin', 'うおおお、燃えろォ！　……うまい！　決勝の借りはデュエルで返すが、このラーメンには完敗だ！']],
      ok: [['gil', 'ふっ、悪くない。だがオレの舌を燃やすには、まだ火力が足りないぜ！']],
      bad: [['gil:surprise', '……ぬるい！　だが、それもまた青春の味……ってことにしといてやる！']],
    },
  ];
  async function serveCustomer(i, c) {
    const id = 'c4_cust';
    E.npc({ id, char: c.char, x: 21, y: 13, dir: 'up', move: 'still' });
    E.se('door');
    await E.move(id, [[21, 5], [14, 5]], { speed: 1.5 });
    E.face(id, 'up');
    for (const l of c.order) await E.say(l[0], l[1]);
    const zone = E.val('c4_role_k') === 0 ? 0.21 : 0.18;
    const labels = E.val('c4_role_k') === 1 ? ['麺をゆでる！', 'スープを注ぐ！（得意！）', '具をのせる！'] : ['麺をゆでる！', 'スープを注ぐ！', '具をのせる！'];
    const s = await E.timing({ title: `ラーメン作り（${i + 1}/5）`, rounds: 3, speed: 1.4 + i * 0.12, zone, labels });
    E.se('pickup');
    const lines = s >= 3 ? c.good : s === 2 ? c.ok : c.bad;
    for (const l of lines) await E.say(l[0], l[1]);
    await E.move(id, [[21, 5], [21, 13]], { speed: 1.5 });
    E.remove(id);
    return s;
  }
  async function shopScene() {
    E.cut();
    H.stash();
    E.bgm('festival');
    E.teleport('player', 14, 3, 'down');
    H.actors([
      ['c4_a_yui', 'yui', 18, 4, 'down'],
      ['c4_a_ruu', 'ruu', 19, 6, 'left'],
      ['c4_a_niko', 'niko', 12, 5, 'down'],
    ]);
    await E.wait(20);
    await E.say('yui:smile', '2年B組「星屑亭・出張店」、ただいまより開店です！');
    const r = E.val('c4_role_r');
    if (r === 0) await E.say('ruu:grin', 'はい並んで並んでー。割り込んだヤツは、このルウ様が相手するからね。');
    else if (r === 1) await E.say('ruu', '……皿洗い、開始。ニコ、ピカピカのやつ見せてやるから、ちゃんと見てなよ。');
    else await E.say('ruu:grin', 'さっき校内一周してきた！　みんな来るよ、たぶん百人くらい！');
    const n = E.val('c4_role_n');
    if (n === 0) await E.say('niko:grin', 'いらっしゃい、ませ。……ニコニコ。');
    else if (n === 1) await E.say('niko:serious', 'あじみ、じゅんび、かんりょう。……ひとくち。');
    else await E.say('niko:serious', 'ネギ、まかせて。トントントン。');
    await E.say('kanata', 'よし……ばあちゃん直伝、星屑ラーメン。いくぞ！');
    let total = 0;
    for (let i = 0; i < CUSTOMERS.length; i++) total += await serveCustomer(i, CUSTOMERS[i]);
    // 5人目：アイゼン少佐
    const id = 'c4_cust';
    E.npc({ id, char: 'eisen', x: 21, y: 13, dir: 'up', move: 'still' });
    E.bgm('tension');
    await E.move(id, [[21, 5], [14, 5]], { speed: 1.0 });
    E.face(id, 'up');
    E.emote('player', '!');
    await E.say('kanata:surprise', '（この人……アリーナの観客席にいた……！）');
    await E.say('eisen', '……ひとつ、もらおう。');
    const zone = E.val('c4_role_k') === 0 ? 0.2 : 0.17;
    const s = await E.timing({ title: 'ラーメン作り（5/5）', rounds: 3, speed: 1.9, zone, labels: ['麺をゆでる！（手がふるえる）', 'スープを注ぐ！', '具をのせる！'] });
    total += s;
    await E.say(null, '男は、黙ってラーメンをすすった。屋台のまわりの喧騒が、そこだけ遠のいたように感じる。');
    if (s >= 2) await E.say('eisen', '……星屑亭の味だ。店主に、よろしく伝えてくれ。');
    else await E.say('eisen', '……麺が、泳いでいるな。だが、スープは星屑亭の味だ。');
    E.face(id, 'c4_a_niko');
    await E.wait(30);
    await E.say('eisen:serious', '……その子は、君のクラスメイトか。');
    await E.move('c4_a_niko', 'R', { speed: 1.2 });
    E.emote('c4_a_niko', '…');
    await E.move('c4_a_ruu', [[19, 5], [16, 5]], { speed: 1.6 });
    E.face('c4_a_ruu', 'left');
    await E.say('ruu:angry', 'そうだけど。なにか？');
    await E.say('eisen', '……いや。楽しい祭りだ。');
    E.face(id, 'up');
    await E.say('eisen', '――今のうちに、楽しんでおくといい。');
    await E.move(id, [[21, 5], [21, 13]], { speed: 1.0 });
    E.remove(id);
    await E.say('yui:surprise', 'あれは……アイゼン少佐……！　どうして、わざわざ……。');
    await E.say('niko:sad', '……あのひと、つめたい、おと。でも……すこし、かなしい、おと。');
    E.bgm('festival');
    await E.say('kanata', '…………。');
    // 結果
    const money = 40 + total * 30;
    let rank = total >= 14 ? '伝説の屋台' : total >= 11 ? '行列のできる屋台' : total >= 7 ? 'ふつうにうまい屋台' : 'がんばった屋台';
    await E.notice(`営業終了！\nラーメン作り：${total} / 15\n評価：「${rank}」`);
    if (total >= 11) {
      await E.say('yui:smile', 'すごいです……！　開店2時間で、用意した麺がほぼ完売です！');
      await E.say('ruu:grin', 'へへっ。あたしたち、天才じゃん。');
    } else if (total >= 7) await E.say('yui:smile', '上々の売れ行きです。……少し、麺の茹で加減にムラがありましたが。');
    else await E.say('yui', '……味の評価はさておき、看板とニコさんの効果で、お客さんは来てくれました。');
    await E.say('yui', '売上の一部は、クラスの打ち上げ代と……屋台の協力者へのお礼にします。こちらは、春瀬くんのぶん。');
    E.money(money);
    E.set('c4_shop_score', total);
    E.set('c4_shop_done');
    await E.say('yui', '午後は交代制です。わたしが店番をしますから、みなさんは他のクラスを見てきてください。');
    await E.say('yui:shy', '……わたしは、あとで少しだけ、喫茶店に寄れたら、それで。');
    await E.say('niko:grin', 'おまつり、まわる！　ニコ、ぜんぶ、みる！');
    H.clear(['c4_a_ruu', 'c4_a_niko']);
    H.unstash(['ruu', 'niko']);
    E.teleport('player', 9, 5, 'down');
    setPh(5);
    H.reward(300);
    await tourUpdate();
  }

  // ---------------------------------------------------------------
  //  出し物：号外のミミ
  // ---------------------------------------------------------------
  async function mimiExtra() {
    if (!tour()) {
      await E.say('mimi', '先輩！　号外は午後に刷り上がるっす！　屋台の写真、撮らせてもらったっすからね！');
      return;
    }
    if (E.flag('c4_tour_news')) {
      await E.say('mimi', G.pick(['号外、もう300部はけたっす！　新聞部はじまって以来の快挙っす！', '先輩、スクープの匂いがするっす。……校門の外、公安の車が朝から3台停まりっぱなしっすよ。', 'ケイ部長が号外を見て泣いてたっす。「ついに新聞部が読まれた」って。']));
      return;
    }
    await E.say('mimi:grin', '先輩！　号外っす、号外！　刷りたてホヤホヤっすよ！');
    await E.give('c4_extra', 1);
    await E.notice('第三中新聞 号外\n「2年B組ラーメン、行列100人突破！？」\n「謎の看板娘、その正体は――星から来た少女！？」');
    await E.say('ruu:surprise', '……星から来たって。ミミ、あんた……。');
    await E.say('mimi', 'へへ、見出しは盛るのが新聞部の流儀っす！　……それで、ニコ先輩の写真、一面に使っていいっすか！？');
    const i = await E.ask('kanata:think', '（ニコの写真を……）', ['いいよ', 'やめておいて']);
    if (i === 0) {
      await E.say('niko:grin', 'ニコ、しんぶん、のる？　……ピース。');
      await E.say('mimi:smile', '最高の一枚っす！　……先輩、ニコ先輩って、写真に撮るとちょっとだけ光って写るんすよね。不思議っす。');
      E.set('c4_mimi_photo');
    } else {
      await E.say('mimi', 'ちぇー。……でも、先輩がそう言うなら、なんか理由があるんすよね。了解っす、ぼかしときます！');
      await E.say('mimi', 'あたし、こう見えて口はかたいっすから。……ニコ先輩のこと、なんか困ってたら、いつでも言ってくださいっす。');
    }
    await E.say('mimi:serious', '……それと、先輩。スクープの匂いがするっす。校門の外に、公安の車が朝から3台。屋台の行列にも、目つきの悪い大人がちらほら。');
    await E.say('mimi', '気のせいだと、いいんすけど。');
    E.set('c4_tour_news');
    H.reward(100);
    await tourUpdate();
  }

  // ---------------------------------------------------------------
  //  出し物：喫茶〈赤い悪魔〉
  // ---------------------------------------------------------------
  G.addToMap('c4_cafe', {
    npcs: [
      { id: 'c4_vargas', char: 'vargas', x: 12, y: 3, dir: 'down', move: 'still', show: ch4, talk: async () => await cafeTalk() },
      { id: 'c4_c_tome', char: 'tome', x: 5, y: 7, dir: 'right', move: 'still', show: ch4, talk: async () => {
        await E.say('tome:smile', 'ラーメン、ちゃんと食べさせてもらったよ。……まあ、及第点さね。');
        await E.say('tome', 'ばあちゃんはね、こういう日が見たくて、ずっと店を開けてきたのかもしれないねえ。');
      } },
      { id: 'c4_c_doc', char: 'doc', x: 8, y: 7, dir: 'left', move: 'still', show: ch4, talk: async () => {
        await E.say('doc', 'ふん。ワシは付き添いだ。トメに引っぱってこられた。');
        await E.say('doc', '……ここのドーナツは、悪くない。ネジの土産にひとつ包んでもらうか。');
      } },
      { id: 'c4_c_st1', char: 'w2_rinka', x: 1, y: 4, dir: 'right', move: 'still', show: ch4, talk: async () => await E.say('w2_rinka', 'バルガス先生の若い頃の写真、見た！？　同盟軍の「赤い悪魔」！　あたし、先生のことちょっと推しかも……！') },
      { id: 'c4_c_st2', char: 'w2_saki', x: 4, y: 4, dir: 'left', move: 'still', show: ch4, talk: async () => await E.say('w2_saki', 'パフェ……おいしい。先生、盛りつけの才能があると思う。……絵の才能も、あるかな。') },
    ],
    onEnter: async () => {
      if (!ch4() || E.flag('c4_cafe_seen')) return;
      E.set('c4_cafe_seen');
      E.cut();
      await E.wait(20);
      await E.say('vargas:grin', 'いらっしゃいませだ！　喫茶〈赤い悪魔〉へようこそ！');
      await E.say('ruu:surprise', '……先生、エプロン、ピンクなんだ。');
      await E.say('vargas', '甘いものを出す店の制服は、甘い色と決まっている！　さあ、好きな席に座れ！');
      await E.say(null, '店の奥のテーブルに、見慣れた二人が座っている。');
      await E.say('kanata:surprise', 'ばあちゃん！？　ドクまで！');
      await E.say('tome:grin', 'おや、カナタ。孫の文化祭くらい、のぞきに来るさね。');
      E.face('c4_vargas', 'c4_c_tome');
      await E.say('vargas:surprise', '……と、トメさん……！？　い、いや。春瀬のおばあさま。ようこそいらっしゃいました！');
      await E.say('tome:smile', 'あんた、バルガスの坊やかい。デカくなったねえ。');
      await E.say('vargas:shy', 'ぼ、坊や……。');
      await E.say('kanata:surprise', '知り合い！？');
      await E.say('vargas', 'あの頃、私はまだ新兵で……軌道戦争で「星屑」の名を知らない者は、同盟には一人も――');
      await E.say('tome:serious', 'バルガス。');
      await E.say('vargas', 'は、はいっ！　……なんでもありません！');
      await E.say('doc', 'ふん。昔話はやめておけ。……ここのドーナツは悪くない。それで十分だ。');
      await E.say('ruu', '（ねえ、カナタのばあちゃんって、何者なの……？）');
      await E.say('kanata:think', '（ラーメン屋のばあちゃん……のはず、なんだけど）');
      E.face('c4_vargas', 'down');
      await E.say('vargas', '……ゴホン！　春瀬、注文はカウンターで聞くぞ！');
    },
  });
  async function cafeTalk() {
    if (!tour()) return await E.say('vargas', '甘いものは心の燃料だ！　……廊下を走るな！　走るなら全力で走れ！');
    const opts = ['メニューを見る', '「先生の本気パフェ」（¢150）', '話す', 'やめておく'];
    const i = await E.ask('vargas', 'ご注文はなんだ！', opts, { cancel: 3 });
    if (i === 0) await E.shop(['candy', 'melonpan', 'soda', 'energy'], '喫茶〈赤い悪魔〉');
    else if (i === 1) {
      if (G.state.money < 150) return await E.say('vargas', '金が足りんぞ！　……出世払いは、卒業してからだ！');
      E.money(-150);
      await E.say('vargas:grin', 'よし！　先生の本気を見せてやる！　春瀬、手伝え！　盛りは勢いだ！');
      const s = await E.timing({ title: '先生の本気パフェ', rounds: 3, speed: 1.6, zone: 0.18, labels: ['コーンフレークを敷く！', 'アイスを積む！', 'ドーナツを刺す！'], col: '#ff8fb8' });
      if (s >= 3) {
        await E.say('vargas:grin', '完璧だ！　これぞ赤い悪魔の名にふさわしい、天を衝くパフェ！');
        await E.say('niko:surprise', 'パフェ……おおきい……！　おしろ、みたい……！');
        E.give('energy', 2);
        E.give('candy', 3);
        H.reward(80);
      } else if (s >= 1) {
        await E.say('vargas', 'うむ、少し傾いているが……それもまた、人生だ。');
        E.give('candy', 2);
      } else {
        await E.say('vargas:surprise', '……崩れた。');
        await E.say('niko:smile', 'くずれても、おいしい。ニコ、ぜんぶ、たべる。');
        E.give('candy', 1);
      }
      E.set('c4_parfait');
    } else if (i === 2) {
      await E.say('vargas', '……春瀬。今日は、いい顔をしているな。');
      await E.say('vargas:serious', '先生はな、戦争の頃、おまえたちくらいの歳のパイロットを何人も見た。……みんな、笑い方を忘れた顔をしていた。');
      await E.say('vargas:smile', 'だから、こういう日が好きなんだ。甘いものを食って、くだらないことで笑って。それが、平和ってやつだ。');
      await E.say('vargas:serious', '……ただ、さっきから校門の外が騒がしい。公安の車だ。春瀬、今日は寄り道せずに帰れよ。');
    }
    if (!E.flag('c4_tour_cafe')) {
      E.set('c4_tour_cafe');
      H.reward(100);
      await tourUpdate();
    }
  }

  // ---------------------------------------------------------------
  //  出し物：お化け屋敷（c4_haunted）
  // ---------------------------------------------------------------
  async function lightCandle(n) {
    if (E.flag('c4_cd' + n)) return await E.say(null, 'ろうそくの火が、静かにゆれている。');
    E.set('c4_cd' + n);
    E.se('charge');
    H.swap('c4_cd' + n, 'c4_candle', { lit: true }, { dy: -4, r: 34, col: '#ffa040', a: 0.9, flicker: true });
    const lit = [1, 2, 3].filter((k) => E.flag('c4_cd' + k)).length;
    await E.say(null, `ろうそくに火をともした。（${lit}/3）`);
    if (lit === 2) await E.say('niko:think', '……あと、ひとつ。');
    if (lit >= 3 && !E.flag('c4_hh_gate')) {
      E.set('c4_hh_gate');
      E.cut();
      E.se('quake');
      E.shake(4, 30);
      await E.say(null, 'どこかで、ずるずると暗幕が引かれる音がした……。');
      E.setTile(6, 2, 'f', { temp: true });
      E.setTile(6, 3, 'f', { temp: true });
    }
  }
  G.addToMap('c4_haunted', {
    checks: [
      { x: 12, y: 12, run: async () => await lightCandle(1) },
      { x: 3, y: 9, run: async () => await lightCandle(2) },
      { x: 15, y: 6, run: async () => await lightCandle(3) },
      { x: 9, y: 4, run: async () => {
        E.cut();
        await E.say(null, '大きな姿見だ。ぼんやりと、自分たちの姿が映っている。');
        H.swap('c4_mirror', 'c4_mirror', { ghost: true });
        E.se('echo');
        await E.wait(30);
        await E.say(null, '……鏡の中のニコだけが、こちらを見ていない。泣いているように、見えた。');
        await E.say('ruu:surprise', 'ちょ……今の、見た！？');
        await E.say('niko:sad', '……あっちの、ニコ。ないてる。……ひとりぼっちの、おと。');
        H.swap('c4_mirror', 'c4_mirror', {});
        await E.say('kanata', 'き、気のせいだって。照明の演出だろ……たぶん。');
      } },
    ],
    events: [
      { x: 9, y: 11, h: 2, once: 'c4_hh_s1', cond: ch4, run: async () => {
        E.cut();
        E.npc({ id: 'c4_ghost1', char: 'c4_yurei', x: 9, y: 9, dir: 'down', move: 'still', ghost: true });
        E.se('alarm');
        E.flash(6);
        E.shake(5, 20);
        await E.move('c4_ghost1', 'D', { speed: 3 });
        E.emote('player', '!?');
        await E.say('c4_yurei', 'うらめしやぁぁぁ……！');
        await E.say('ruu:surprise', 'うわあっ！？');
        await E.say('niko', '……？　こんにちは。');
        await E.say('c4_yurei:surprise', '……え。あ、こ、こんにちは……。');
        await E.say('c4_yurei:shy', '……あの、もうちょっと怖がってもらえると、うれしいです……。1年生のウミです……。');
        await E.move('c4_ghost1', 'U', { speed: 2 });
        E.remove('c4_ghost1');
        await E.say('ruu:angry', '……あ、あたしは別にビビってないから。声が出ただけだから。');
      } },
      { x: 12, y: 8, h: 2, once: 'c4_hh_s2', cond: ch4, run: async () => {
        E.cut();
        E.se('hit');
        await E.say(null, 'ぴとっ。');
        await E.say('kanata:surprise', 'つめてっ！？　な、なんか首に……！');
        await E.say('niko:think', '……こんにゃく。つめたい。……たべもの？');
        await E.say('ruu', 'ニコ、食べちゃダメ。それ、たぶん何人もの首に当たってるから。');
      } },
      { x: 14, y: 2, h: 2, once: 'c4_hh_boss', cond: () => ch4(), run: async () => {
        E.cut();
        E.stopBgm();
        await E.wait(30);
        E.npc({ id: 'c4_kyo', char: 'kyosuke', x: 16, y: 2, dir: 'left', move: 'still' });
        E.se('bigexplode');
        E.flash(10);
        E.shake(8, 30);
        await E.say('kyosuke:angry', 'ガアアアアアッ！！');
        E.emote('player', '!?');
        await E.say('kanata:surprise', 'うわああっ！？……って、キョウスケ先輩！？');
        await E.say('kyosuke', 'あぁ？　……なんだ、てめえらか。ちっ、本気でやっちまった。');
        E.bgm('tension');
        await E.say('kyosuke', '3年A組〈恐怖！無重力病棟〉のラスボス、院長役だ。……似合ってねえとか言ったら殴る。');
        await E.say('ruu:grin', '似合いすぎてて怖いわ。');
        await E.say('kyosuke', '……ふん。おい、春瀬。デュエルの決勝、見てたぜ。ギルを落としたあの機動、悪くなかった。');
        await E.say('kyosuke:serious', 'それと……気をつけな。今朝から、校舎の裏に見ねえ大人がうろついてやがる。公安のにおいだ。');
        await E.say('kyosuke', 'てめえらが何に首つっこんでんのかは知らねえ。だが、学校で何かあったら言え。……借りは返す。');
        await E.say('kanata:smile', 'ありがと、先輩。');
        await E.say('kyosuke', 'ほら、出口はあっちだ。ろうそくに火ぃつけねえと、暗幕は開かねえぞ。……そういう演出だ。');
        await E.give('energy', 2);
        E.remove('c4_kyo');
      } },
      { x: 1, y: 2, h: 2, once: 'c4_hh_exit', cond: () => ch4() && E.flag('c4_hh_gate'), run: async () => {
        E.cut();
        await E.say('ruu', 'はぁ……出口だ。……べ、別に楽しかったとか、思ってないし。');
        await E.say('niko:grin', 'ニコ、たのしかった。もういっかい、はいりたい。');
        if (!E.flag('c4_tour_haunt')) {
          E.set('c4_tour_haunt');
          H.reward(100);
          await tourUpdate();
        }
      } },
    ],
    onEnter: async () => {
      if (!ch4()) return;
      // 再入場のたびに、ろうそくと暗幕を最初の状態に（演出）
      if (!E.flag('c4_hh_in')) {
        E.set('c4_hh_in');
        E.cut();
        await E.say(null, '真っ暗な教室に、ひんやりした空気。どこかで、ぽたり、ぽたりと水の音がする。');
        await E.say('ruu', '……ふ、ふーん。ただのダンボールでしょ。');
        await E.say('niko:smile', 'くらい。……ちょっと、しろいへやに、にてる。でも、こっちは、たのしい。');
      }
      if (E.flag('c4_hh_gate')) {
        E.setTile(6, 2, 'f', { temp: true });
        E.setTile(6, 3, 'f', { temp: true });
      }
    },
  });

  // ---------------------------------------------------------------
  //  出し物：屋上ライブ（＋シグ）
  // ---------------------------------------------------------------
  async function liveScene() {
    E.cut();
    H.stash();
    E.teleport('player', 16, 13, 'up');
    H.actors([
      ['c4_a_ruu', 'ruu', 14, 13, 'up'],
      ['c4_a_niko', 'niko', 18, 13, 'up'],
      ['c4_a_gil', 'gil', 15, 9, 'down'],
      ['c4_a_fan1', 'w2_tsubame', 12, 12, 'up'],
      ['c4_a_fan2', 'w2_tsubasa', 20, 12, 'up'],
      ['c4_a_fan3', 'w2_hayate', 22, 13, 'up'],
    ]);
    E.remove('c4_kakeru');
    E.npc({ id: 'c4_kakeru', char: 'w2_guitar', x: 17, y: 9, dir: 'down', move: 'still' });
    await E.wait(20);
    await E.say('w2_guitar', '屋上ライブ、始めるぜ！　今日のスペシャルゲストは……この人だ！');
    E.flash(8);
    E.se('boost');
    await E.say('gil:grin', 'イッツ・ショータイム！！');
    await E.say('ruu:surprise', 'ギル！？　なんでアンタがここに！？');
    await E.say('gil:grin', '軽音部に頼まれちゃ、断れねえのがオレの性分でな！　ネオン・ジャッカルズのギル・ブレイズ、ボーカルで参戦だ！');
    E.bgm('arena');
    for (let k = 0; k < 6; k++) {
      E.emote(G.pick(['c4_a_fan1', 'c4_a_fan2', 'c4_a_fan3', 'c4_a_ruu']), '♪');
      E.flash(3);
      await E.wait(40);
    }
    await E.say('gil', '燃えろォ！　ニセモノの空まで、届けええええ！');
    await E.say('niko:smile', 'おと……きらきら。みんなの、こころ、おなじ、おと。');
    await E.say('ruu:grin', '……ま、悪くないじゃん。');
    await E.wait(40);
    E.stopBgm(2);
    await E.wait(40);
    E.emote('c4_a_niko', '…');
    await E.say('niko:serious', '……！');
    await E.say('niko:sad', '……ほしが、ないてる。とおくで。……こわい、おと。ちかづいてくる。');
    await E.say('kanata', 'ニコ……？');
    E.npc({ id: 'c4_a_sig', char: 'sig', x: 29, y: 9, dir: 'left', move: 'still' });
    E.se('echo');
    E.emote('player', '!');
    E.bgm('space');
    await E.camera(26, 10);
    await E.say('sig', '……こんにちは。');
    await E.say('ruu:surprise', 'シグ！？　あんた、いつからそこに……！');
    await E.say('sig', 'ずっと、聴いていました。……いい歌ですね。この世界の空は、まだ落ちていない。');
    await E.say('kanata', 'シグも来てたんなら、屋台に寄ってけよ。ラーメン、まだ少しあるぞ。');
    await E.say('sig', '……ラーメン。あれは、熱かった。');
    await E.say('sig:serious', '……カナタ。今日、空がざわめいています。ニコから、目を離さないで。');
    await E.say('kanata:serious', 'え……？');
    E.flash(10);
    E.se('boost');
    E.remove('c4_a_sig');
    await E.cameraReset();
    await E.say('ruu:angry', '……また消えた。ほんっと、なんなのアイツ。');
    await E.say('niko', '……シグの、おと。ニコと、すこし、にてる。');
    E.bgm('festival');
    await E.say('gil', 'おっと、アンコールの時間だ！　スターダストの諸君、次はデュエルで会おうぜ！');
    H.clear(['c4_a_ruu', 'c4_a_niko', 'c4_a_gil', 'c4_a_fan1', 'c4_a_fan2', 'c4_a_fan3']);
    E.remove('c4_kakeru');
    E.npc({ id: 'c4_kakeru', char: 'w2_guitar', x: 16, y: 9, dir: 'down', move: 'still', talk: async () => await E.say('w2_guitar', 'ライブ、聴いてくれてサンキュ！　……ギルさん、また来てくんないかな。') });
    H.unstash(['ruu', 'niko']);
    E.set('c4_tour_live');
    H.reward(100);
    await tourUpdate();
  }

  // ===============================================================
  //  4. 公安突入
  // ===============================================================
  async function raidStart() {
    E.cut();
    H.stash();
    E.time('evening');
    E.teleport('player', 14, 7, 'up');
    H.actors([
      ['c4_a_yui', 'yui', 15, 5, 'down'],
      ['c4_a_ruu', 'ruu', 13, 7, 'up'],
      ['c4_a_niko', 'niko', 15, 7, 'up'],
    ]);
    E.bgm('home');
    await E.wait(20);
    await E.say(null, '――夕方。ミラーの光が赤く傾き、文化祭は後夜祭を待つばかりになっていた。');
    await E.say('yui:smile', '片づけ、終わりました。売上の集計も……完璧です。');
    await E.say('ruu:grin', 'あとは後夜祭のキャンプファイヤーだけ。……ニセモノの火だけどね。');
    await E.say('niko:smile', 'カナタ。ニコ、きょう、いちばん、たのしかった。');
    await E.say('niko', 'ラーメン、つくった。おばけ、こわくなかった。おうた、きれいだった。……ぜんぶ、おぼえてる。');
    await E.say('kanata:smile', '来年も、やろうな。またラーメン屋。');
    await E.say('niko:grin', 'うん。やくそく。');
    E.stopBgm(1);
    await E.wait(30);
    E.se('alarm');
    E.shake(5, 40);
    E.tint('rgba(255,40,60,0.12)');
    await E.say('guard', 'こちらコロニー公安特務隊。これより、校内の一斉検査を行う。全員、その場を動くな。', { name: '校内放送' });
    E.tint(null);
    E.bgm('tension');
    await E.say('ruu:angry', '公安！？　なんで学校に……！');
    await E.say('yui:surprise', '学校へ部隊を入れるには、総督府の許可が要るはず……まさか、父が……。');
    await E.say('niko:sad', '……つめたい、おと。いっぱい。……ニコを、さがしてる。');
    await E.say('kanata:serious', 'ニコ、隠れるんだ！');
    await E.say('yui:serious', '……新聞部の暗室へ。あそこは内側から鍵がかかります。わたしがニコさんと一緒にいます。');
    await E.say('yui', '公安が来ても、わたしが総督の娘だと言えば……少しは時間が稼げるはずです。');
    await E.say('kanata', 'オレとルウは、逃げ遅れた子たちを外に出す。……すぐ戻るから。');
    await E.say('niko:sad', 'カナタ……。');
    await E.say('kanata:smile', 'なんとかなるって。……な？');
    await E.say('niko', '……うん。まってる。');
    await E.fadeOut(16);
    H.clear(['c4_a_yui', 'c4_a_ruu', 'c4_a_niko']);
    setPh(6);
    E.set('c4_raid_go');
    E.set('c4_rescued', 0);
    H.unstash(['ruu']);
    E.teleport('player', 20, 13, 'down');
    await E.fadeIn(16);
    E.objective('逃げ遅れた生徒を助ける（0/3）：廊下・校庭・屋上');
    await E.say('ruu:serious', 'カナタ、手分けは無理。二人で一気に回るよ。廊下、校庭、屋上！');
  }
  function raidClean() {
    for (const e of G.field.ents.slice()) if (e.id && /^w2_/.test(e.id)) E.remove(e.id);
  }
  async function rescued(n) {
    E.inc('c4_rescued');
    const k = E.val('c4_rescued');
    H.reward(150);
    if (k >= 3) {
      E.objective('新聞部の暗室へ急ぐ（廊下の東・新聞部室）');
      await E.say('ruu:serious', 'これで全員……！　カナタ、暗室に戻ろう！　ニコが待ってる！');
    } else E.objective(`逃げ遅れた生徒を助ける（${k}/3）：廊下・校庭・屋上`);
  }
  // 救出1：廊下（シオリ）
  G.addToMap('school_hall', {
    npcs: [
      { id: 'c4_r1', char: 'w2_bookworm', x: 44, y: 6, dir: 'left', move: 'still', show: () => raid() && !E.flag('c4_r1') },
      { id: 'c4_r1g1', char: 'c4_sec', x: 42, y: 5, dir: 'right', move: 'still', show: () => raid() && !E.flag('c4_r1f') },
      { id: 'c4_r1g2', char: 'c4_sec', x: 42, y: 7, dir: 'right', move: 'still', show: () => raid() && !E.flag('c4_r1f') },
    ],
  });
  async function rescue1() {
    E.cut();
    await E.say('w2_bookworm:cry', 'い、いや……！　わたし、なにも知りません……！');
    await E.say('c4_sec', '白い髪の少女を見なかったか。答えろ。');
    await E.say('ruu:angry', 'ちょっと！　女の子ひとりに大人がふたりがかり？　だっさ。');
    await E.say('c4_sec', '……邪魔をするな。民間人の妨害は拘束対象だ。');
    E.set('c4_r1f');
    await E.battle({ enemies: [{ type: 'guard', x: 41, y: 5, lv: 5 }, { type: 'guard', x: 41, y: 7, lv: 5 }], title: 'BATTLE!', sub: '公安隊員を追い払え' });
    E.cut();
    raidClean();
    await E.say('w2_bookworm', 'あ、ありがとう……春瀬くん、水無月さん……！');
    await E.say('kanata', '昇降口から外へ！　校門の反対、体育倉庫のほうは手薄だ！');
    await E.move('c4_r1', [[23, 6], [23, 15]], { speed: 1.8 });
    E.remove('c4_r1');
    E.set('c4_r1');
    await rescued(1);
  }
  // 救出2：校庭（ハナ）
  G.addToMap('school_yard', {
    npcs: [
      { id: 'c4_r2', char: 'w2_hana', x: 32, y: 29, dir: 'up', move: 'still', show: () => raid() && !E.flag('c4_r2') },
      { id: 'c4_r2g1', char: 'c4_sec', x: 31, y: 27, dir: 'down', move: 'still', show: () => raid() && !E.flag('c4_r2f') },
      { id: 'c4_r2g2', char: 'c4_sec', x: 34, y: 27, dir: 'down', move: 'still', show: () => raid() && !E.flag('c4_r2f') },
    ],
    enemies: [
      { type: 'guard', x: 9, y: 24, lv: 5, id: 'c4_yg1', show: raid },
      { type: 'drone', x: 40, y: 15, lv: 5, id: 'c4_yg2', show: raid },
      { type: 'drone', x: 14, y: 30, lv: 5, id: 'c4_yg3', show: raid },
    ],
    events: [
      { x: 26, y: 25, w: 12, once: 'c4_r2_ev', cond: () => raid() && E.flag('c4_raid_go'), run: async () => {
        E.cut();
        await E.say('w2_hana:cry', 'やめて……！　菜園を踏まないで……！　トマトが……！');
        await E.say('c4_sec', 'どけ。この区画も捜索対象だ。');
        await E.say('kanata:angry', 'おい！　その子に手を出すな！');
        E.set('c4_r2f');
        await E.battle({ enemies: [{ type: 'guard', x: 31, y: 27, lv: 5 }, { type: 'guard', x: 34, y: 27, lv: 5 }, { type: 'drone', x: 33, y: 26, lv: 5 }], title: 'BATTLE!', sub: '公安隊員を追い払え' });
        E.cut();
        raidClean();
        await E.say('w2_hana', 'カナタくん……ありがとう。トマトさんも、無事……。');
        await E.say('ruu', 'トマトはいいから、体育倉庫の裏から逃げな！');
        await E.move('c4_r2', [[37, 29], [42, 29], [42, 8]], { speed: 1.8 });
        E.remove('c4_r2');
        E.set('c4_r2');
        await rescued(2);
      } },
    ],
  });
  // 救出3：屋上（軽音部）
  async function rescue3() {
    E.cut();
    E.npc({ id: 'c4_r3', char: 'w2_guitar', x: 16, y: 10, dir: 'down', move: 'still' });
    E.npc({ id: 'c4_r3b', char: 'w2_tenmon', x: 18, y: 10, dir: 'down', move: 'still' });
    E.npc({ id: 'c4_r3g', char: 'c4_sec', x: 17, y: 13, dir: 'up', move: 'still' });
    await E.wait(20);
    await E.say('w2_guitar:angry', 'ギターは置いてかねえ！　これは軽音部の魂なんだよ！');
    await E.say('c4_sec', '機材の持ち出しは許可できない。全員、両手を上げて――');
    await E.say('ruu:angry', 'ロックの邪魔すんな！');
    E.remove('c4_r3g');
    await E.battle({ enemies: [{ type: 'guard', x: 17, y: 12, lv: 5 }, { type: 'drone', x: 12, y: 11, lv: 5 }, { type: 'drone', x: 22, y: 11, lv: 5 }], title: 'BATTLE!', sub: '公安隊員を追い払え' });
    E.cut();
    raidClean();
    E.npc({ id: 'c4_r3', char: 'w2_guitar', x: 16, y: 10, dir: 'down', move: 'still' });
    E.npc({ id: 'c4_r3b', char: 'w2_tenmon', x: 18, y: 10, dir: 'down', move: 'still' });
    await E.wait(10);
    await E.say('w2_guitar', 'サンキュ……！　おまえら、ロックだな。');
    await E.say('w2_tenmon', '望遠鏡で見えたんだ……公安の装甲車が、校門の前に横づけしてる。誰かを乗せる気だよ……！');
    await E.say('kanata:serious', '……！');
    await E.move('c4_r3', [[16, 9], [6, 9], [6, 8]], { speed: 2 });
    E.remove('c4_r3');
    await E.move('c4_r3b', [[18, 9], [6, 9], [6, 8]], { speed: 2 });
    E.remove('c4_r3b');
    E.set('c4_r3');
    await rescued(3);
  }

  // ---------------------------------------------------------------
  //  暗室 → 校庭：ニコが連れ去られる
  // ---------------------------------------------------------------
  async function darkroom() {
    E.set('c4_darkroom');
    E.cut();
    E.npc({ id: 'c4_a_yui', char: 'yui', x: 40, y: 13, dir: 'down', move: 'still' });
    await E.move('player', 'D2', { speed: 1.6 });
    await E.say(null, '新聞部室の奥。暗室のドアが、こじ開けられている。');
    await E.say('kanata:surprise', 'ユイ！');
    await E.say('yui:cry', '春瀬くん……ごめんなさい……！　ニコさんが……ニコさんが……！');
    await E.say('yui:cry', 'わたし、「総督の娘です」って言ったんです。そうしたら、アイゼン少佐は……「ならば、なおさら下がっていただこう」って……。');
    await E.say('yui', 'ニコさんを、校庭の装甲車へ……！　今なら、まだ間に合うかもしれません！');
    await E.say('ruu:angry', '……っ！　カナタ！！');
    await E.say('kanata:angry', '行くぞ！');
    E.remove('c4_a_yui');
    E.set('c4_to_yard');
    E.objective('校庭へ急げ！　ニコを取り戻す');
    E.bgm('chase');
  }
  async function abduction() {
    E.set('c4_abduct_done');
    E.cut();
    H.stash();
    E.teleport('player', 22, 11, 'down');
    H.actors([
      ['c4_a_ruu', 'ruu', 23, 11, 'down'],
      ['c4_a_eisen', 'eisen', 22, 33, 'up'],
      ['c4_a_niko', 'niko', 23, 34, 'up'],
      ['c4_a_g1', 'c4_sec', 24, 34, 'up'],
      ['c4_a_g2', 'c4_sec', 21, 34, 'up'],
      ['c4_a_g3', 'c4_sec', 20, 32, 'up'],
      ['c4_a_g4', 'c4_sec', 25, 32, 'up'],
    ]);
    E.bgm('tension');
    await E.wait(20);
    await E.camera(22, 30);
    await E.say('niko:cry', 'カナタ……！！');
    await E.cameraReset();
    await E.say('kanata:angry', 'ニコ！！');
    E.move('c4_a_ruu', [[23, 28]], { speed: 2.4, noWait: true });
    await E.move('player', [[22, 28]], { speed: 2.4 });
    E.move('c4_a_g3', [[21, 30]], { speed: 2, noWait: true });
    await E.move('c4_a_g4', [[23, 30]], { speed: 2 });
    await E.say('eisen:serious', '……春瀬カナタ。水無月ルウ。君たちのことは調べてある。');
    await E.say('eisen', 'この少女は、コロニーの最重要保護対象だ。民間人がかくまってよい存在ではない。');
    await E.say('ruu:angry', 'ふざけんな！　ニコは物じゃない！　返せ！');
    await E.say('eisen', '……子供の遊びではない。');
    E.npc({ id: 'c4_a_vargas', char: 'vargas', x: 26, y: 23, dir: 'down', move: 'still' });
    await E.move('c4_a_vargas', [[27, 29], [25, 29]], { speed: 2.4 });
    E.face('c4_a_vargas', 'down');
    await E.say('vargas:angry', '待てい！！　ここは学校だ！　生徒に手を出すなら、まず私を通してもらう！');
    await E.say('eisen', 'バルガス元中尉。……あなたなら、命令の重さはわかるはずだ。');
    await E.say('vargas:serious', '……っ。');
    await E.say('eisen', '総督府の正式な命令書もある。抵抗すれば、この学校そのものが処分の対象になる。……それでもか。');
    E.emote('c4_a_vargas', '…');
    await E.say('niko:cry', '……カナタ。ルウ。ニコ、だいじょうぶ。');
    await E.say('niko:smile', 'ラーメン……おいしかった。おまつり、たのしかった。……また、たべたい。');
    await E.say('kanata:cry', 'ニコ……！　待ってろ、今……！');
    await E.move('c4_a_niko', [[23, 36]], { speed: 1 });
    E.remove('c4_a_niko');
    E.se('door');
    await E.say('eisen', '……撤収する。');
    await E.move('c4_a_eisen', [[22, 35]], { speed: 1.2 });
    E.remove('c4_a_eisen');
    E.se('boost');
    E.shake(4, 30);
    E.flash(6);
    const van = G.field.map.objs.find((o) => o.type === 'c4_van' && o.tx === 21);
    if (van) {
      G.field.map.objs = G.field.map.objs.filter((o) => o !== van);
      G.field.map.computeSolid();
    }
    H.clear(['c4_a_g1', 'c4_a_g2', 'c4_a_g3', 'c4_a_g4']);
    await E.wait(30);
    await E.say('kanata:cry', 'ニコーーーッ！！');
    await E.wait(30);
    E.npc({ id: 'c4_a_ponta', char: 'ponta', x: 33, y: 20, dir: 'left', move: 'still' });
    await E.move('c4_a_ponta', [[33, 26], [25, 26], [24, 27]], { speed: 2.2 });
    await E.say('ponta', 'カナタ！　ルウ！　こっちっす！　展示のハルカゼとローズハウンド、バッテリー入れっぱなしっす！　動かせるっす！');
    await E.say('ruu:angry', '……行くよ、カナタ。追いかける。あたし、絶対にあきらめない。');
    await E.say('vargas:serious', '……春瀬！　水無月！');
    await E.say('vargas', '……行くなとは言わん。言っても聞かんだろう。だが――必ず、帰ってこい。それが今日の宿題だ！');
    await E.say('kanata:serious', '……はい！');
    E.bgm('chase');
    await E.fadeOut(16);
    H.clear(['c4_a_ruu', 'c4_a_ponta', 'c4_a_vargas']);
    await chase();
  }

  // ---------------------------------------------------------------
  //  追跡 → ノクターン（負け戦）
  // ---------------------------------------------------------------
  const ROSE = { mech: 'rose', x: 3, y: 12, dmg: 16, col: '#ff7fb0', name: 'ローズハウンド', id: 'c4_ally_rose' };
  async function chase() {
    E.party([]);
    G.state.mech.id = 'harukaze';
    await E.say(null, 'ハルカゼの起動音が、夕暮れの校庭に響いた――。');
    await E.battle({
      map: 'c4_chase', x: 4, y: 10, dir: 'right', mech: true, mechId: 'harukaze',
      waves: [
        [{ type: 'guardner', x: 24, y: 7, lv: 5 }, { type: 'guardner', x: 26, y: 13, lv: 5 }],
        [{ type: 'guardner', x: 34, y: 6, lv: 5 }, { type: 'guardner', x: 36, y: 10, lv: 5 }, { type: 'guardner', x: 34, y: 14, lv: 5 }],
      ],
      allies: [ROSE],
      bgm: 'chase', title: 'CHASE!', sub: '公安の輸送車を追え！',
      onStart: async () => {
        await E.say('ruu:angry', '輸送車は運河通りの先！　邪魔なガードナーをぶっとばして追いつくよ！');
      },
      returnTo: ['c4_chase', 14, 10, 'right'],
    });
    E.cut();
    G.field.player.setMech(true, 'harukaze');
    E.bgm('tension');
    E.npc({ id: 'c4_a_rose', char: 'sys', mech: 'rose', x: 12, y: 12, dir: 'right', move: 'still' });
    await E.say('ruu', '見えた！　あの装甲車……！　カナタ、追いつける！');
    await E.move('player', 'R4', { speed: 2.2 });
    E.stopBgm(1);
    await E.wait(20);
    E.se('charge');
    E.flash(12);
    E.shake(8, 40);
    E.npc({ id: 'c4_a_noc', char: 'sys', mech: 'nocturne', x: 28, y: 4, dir: 'left', move: 'still' });
    await E.move('c4_a_noc', [[28, 10]], { speed: 3 });
    E.se('bigexplode');
    E.shake(10, 30);
    await E.camera(26, 10);
    await E.say(null, '夜の運河通りに、黒い機体が舞い降りた。');
    await E.say('ruu:surprise', 'な……なに、あの機体……！　公安のじゃない……！');
    await E.say('kanata:serious', '黒い……AF……。');
    await E.say('mirage', '……退け。');
    await E.say('kanata:angry', 'どけって言われて、どけるかよ！　ニコを返せ！！');
    await E.cameraReset();
    E.remove('c4_a_noc');
    E.remove('c4_a_rose');
    let finish = null;
    await E.battle({
      map: 'c4_chase', x: 12, y: 10, dir: 'right', mech: true, mechId: 'harukaze',
      enemies: [{ type: 'nocturne', x: 28, y: 10, lv: 6, hp: 4000, boss: true, name: 'ノクターン（？？？）' }],
      allies: [Object.assign({}, ROSE, { x: 10, y: 13 })],
      bgm: 'mirage', title: 'WARNING', sub: '黒い機体〈ノクターン〉', canLose: true,
      onStart: async () => {
        // 40秒たったら、ノクターンの一撃で決着（ストーリー上の敗北）
        G.tasks.until(() => {
          const b = G.field.battle;
          if (!b || b.won || b.lost) return true;
          if (b.active && b.t > 60 * 40 && !G.field.downing) {
            const n = G.field.enemies().find((e) => e.type === 'nocturne');
            if (n) {
              G.fx.slash(G.field.player.x, G.field.player.y - 14, 'right', '#a060ff', true, 2.5);
              G.audio.se('saber');
            }
            G.field.player.hp = 0;
            G.field.playerDown();
            return true;
          }
          return false;
        });
      },
      returnTo: ['c4_chase', 14, 10, 'right'],
    });
    await defeatScene();
  }
  async function defeatScene() {
    E.cut();
    G.field.player.setMech(true, 'harukaze');
    E.npc({ id: 'c4_a_noc', char: 'sys', mech: 'nocturne', x: 24, y: 10, dir: 'left', move: 'still' });
    E.npc({ id: 'c4_a_rose', char: 'sys', mech: 'rose', x: 11, y: 13, dir: 'right', move: 'still' });
    E.bgm('sad');
    E.shake(6, 30);
    await E.say(null, 'ハルカゼの装甲から、火花が散る。モニターは赤い警告で埋めつくされていた。');
    await E.say('ruu:cry', 'うそ……でしょ……。一発も……一発も、当たんなかった……。');
    await E.say('kanata:angry', 'まだ……まだだ……！　ニコを……返せ……！');
    await E.move('c4_a_noc', 'L3', { speed: 1 });
    await E.say('mirage', '…………。');
    E.emote('c4_a_noc', '…');
    await E.wait(40);
    await E.say('mirage', '……その、機体……。');
    await E.say('kanata', '……え？');
    await E.say('mirage', '……退け。二度は言わない。');
    E.se('boost');
    E.flash(10);
    await E.move('c4_a_noc', [[21, 2]], { speed: 4 });
    E.remove('c4_a_noc');
    await E.wait(40);
    await E.say(null, '黒い機体は夜空へ消えた。装甲車のテールランプも、もう見えない。');
    await E.say('kanata:cry', '…………ちくしょう。');
    await E.say('ruu:cry', 'ちくしょう……ちくしょう……っ！');
    await E.fadeOut(60);
    E.remove('c4_a_rose');
    await defeatNight();
  }

  // ---------------------------------------------------------------
  //  敗北の夜（星屑亭）
  // ---------------------------------------------------------------
  async function defeatNight() {
    setPh(7);
    E.time('night');
    E.party([]);
    await E.warp('hoshikuzu', 7, 7, 'up', { noEnter: true, noFade: true });
    E.cut();
    E.remove('w_taxi');
    H.actors([
      ['c4_a_ruu', 'ruu', 3, 6, 'up'],
      ['c4_a_yui', 'yui', 5, 6, 'up'],
      ['c4_a_ponta', 'ponta', 8, 6, 'up'],
    ]);
    E.teleport('player', 6, 7, 'up');
    E.bgm('sad');
    await E.fadeIn(40);
    await E.say(null, 'その夜。星屑亭の明かりだけが、ミナト区の暗い通りに灯っていた。');
    await E.say(null, 'ハルカゼとローズハウンドは、ドクのガレージへ運ばれた。「直す。それだけだ」――ドクはそれしか言わなかった。');
    await E.say('ruu:angry', '……なんで。なんで、あたしたち、子どもなの。');
    await E.say('ruu:cry', '機体があっても、あいつに一発も当てられなかった……！　ニコが目の前で連れてかれたのに、なんにも……！');
    await E.say('yui:cry', 'わたしのせいです……。暗室に隠れようなんて言わなければ……父の名前を出せば止められるなんて、思い上がって……。');
    await E.say('ponta:sad', 'オイラも……展示なんかしなきゃ、ハルカゼがボロボロにならずに済んだっす……。オイラ、なんにもできなかったっす……。');
    await E.say('kanata:sad', '…………。');
    const c = await E.ask('kanata', '（……）', ['「……オレが、弱いからだ」', '（黙っている）']);
    if (c === 0) {
      await E.say('kanata:sad', '……オレが、弱いからだ。シミュレーターで一番でも、本物の戦いじゃ、なんにも守れなかった。');
      await E.say('ruu:angry', 'それ言ったら、あたしだって……！');
    } else await E.say(null, '誰も、何も言わなかった。換気扇の音だけが、やけに大きく聞こえる。');
    await E.say(null, 'ことり、と。カウンターに、どんぶりが置かれた。');
    await E.say('tome', 'ほら。食いな。');
    await E.say('ruu:sad', '……今、そんな気分じゃ――');
    await E.say('tome:serious', '泣いたら食いな。食ったら立ちな。');
    await E.say('tome', '腹が減ってるうちは、ろくな考えなんか浮かばないもんさ。……ばあちゃんはね、そうやって何度も立ってきた。');
    await E.say(null, 'ずるずる、と。最初にすすったのは、ポンタだった。それから、ユイが。ルウが。');
    await E.say(null, '……しょっぱいスープだった。涙のせいか、ばあちゃんがわざとそうしたのか、誰にもわからなかった。');
    await E.say('ruu:cry', '……うまい。ちくしょう、うまいよ……。');
    await E.say('tome:smile', 'ニコちゃんのぶんのチャーシュー、ちゃんと取ってあるからね。……連れて帰ってきな。冷める前に。');
    await E.say('kanata:serious', '……うん。必ず。');
    await E.say('yui:serious', '……わたしに、考えがあります。父の執務室に、コア・シャフトの通行証があるはずです。');
    await E.say('yui', 'ニコさんが連れて行かれたのは、きっとコア・シャフトの研究棟。父の書斎のファイルに、そう書いてありました。');
    await E.say('ruu:serious', '……乗った。');
    await E.say('ponta', 'オイラも行くっす！　……戦うのは無理でも、機体を運ぶくらいなら！');
    await E.say('kanata:serious', 'ありがとう、みんな。……明日、作戦会議だ。');
    await E.say('tome', '……ふん。いい顔になったじゃないか。');
    await E.fadeOut(30);
    H.clear(['c4_a_ruu', 'c4_a_yui', 'c4_a_ponta']);
    await E.cg('colony_night', 'ニセモノの夜空に、星はひとつも見えなかった。――それでも、明日は来る。');
    E.cgOff();
    H.reward(200);
    E.set('c4_done');
    await E.startChapter(5);
  }
})();
