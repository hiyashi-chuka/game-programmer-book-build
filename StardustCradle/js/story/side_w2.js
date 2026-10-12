// =============================================================
//  story/side_w2.js — サブクエスト（ワールド part 2）
//   lost_cat / mimi_scoop / lily_tape / vargas_snack / rank
//   ＋ ドク・ネジ・リリィ・バルガス・ミミの常駐NPC
// =============================================================
(function () {
  const W2 = (G.W2 = G.W2 || {});
  G.addItem('w2_donut', { name: '限定ネオン・リング', desc: 'マルコのドーナツの1日10個限定品。ネオン色のアイシングが光る。バルガス先生へのおみやげ。' });

  const qs = (id) => E.questState(id);

  // ---------------------------------------------------------------
  //  ドクのガレージ：ドク・ネジ・ハンガーの機体
  // ---------------------------------------------------------------
  const DOC_TALK = {
    1: ['ジンの息子が、ポンコツ号を動かしたか。……血は争えんな。', 'あの機体はな、ジンが若い頃に組んだ最初のフレームじゃ。大事にせい。'],
    2: ['修理代か。……ツケでいい、と言いたいところじゃが、ワシにも生活がある。', 'ネジのエサ代だけで月300クレジットじゃ。……ネジを食うんじゃよ、あいつは。'],
    3: ['ハルカゼ……ジンが夢見とった機体じゃ。トメさんと二人で、やっと形にできた。', 'アリーナで勝ちたけりゃ、ジャンクパーツを持ってこい。もっと速く、もっと硬くしてやる。'],
    4: '文化祭？　ワシも若い頃は屋台の発電機をいじっとった。……ネジが綿あめ機に頭から突っ込んでな。',
    5: ['公安がこのガレージにも来た。……ハルカゼのことは「ただの作業機」と言っておいた。', '嘘はついとらん。作業機じゃ。ちょっとばかり、作業が荒っぽいだけでな。'],
    6: ['ミラージュの戦い方……あれは、ジンの癖じゃ。右に旋回する前に、半歩だけ左に振る。', '……カナタ。何があっても、おまえの機体はワシが直す。それだけは約束する。'],
    7: 'ハルカゼ改の調整は終わっとる。……行ってこい。ワシは、ここでおまえの帰る場所を守る。',
    8: '空の外へ出るんじゃな。……ジンと同じ顔をしとる。帰ってこい。必ずじゃ。',
    9: ['ジンのやつ、毎日ここへ来て機体をいじっとる。……ワシの仕事がなくなるわい。', 'まあ、悪くない。ガレージがにぎやかなのは、悪くないもんじゃ。'],
  };
  async function docTalk() {
    const ch = G.state.chapter;
    if (ch < 1) {
      await E.say('doc', 'なんじゃ、小僧。ここはガキの遊び場じゃない。……その顔、どこかで見たような。');
      return;
    }
    // ネジを連れ戻した報告
    if (qs('lost_cat') === 'active' && E.flag('w2_neji_caught')) {
      await E.talk([
        ['doc', 'おお、ネジ！　帰ってきおったか、このバカ猫め。'],
        ['neji', 'ニャ……ギギ。'],
        ['doc', 'カナタ、礼を言う。こいつはワシの……まあ、家族みたいなもんじゃ。ほれ、駄賃じゃ。'],
      ]);
      await E.give('scrap', 3, { wait: true });
      E.money(300);
      E.quest('lost_cat', 'done');
      return;
    }
    const k = await E.ask('doc', G.byCh({ 1: 'なんじゃ。機体の改造か？　部品と金があれば、なんでもやってやるぞ。', 3: 'おう、カナタ。ハルカゼの具合はどうじゃ？', 7: '時間がない。手短にな。', 9: 'おう、今日はどうした。' }), ['機体を改造する', '買い物', '話す', 'やめる'], { cancel: 3 });
    if (k === 0) {
      await E.upgrade();
      await E.say('doc', G.byCh({ 1: 'ふん、少しはマシになったじゃろ。', 3: 'ハルカゼが喜んどる。……機械にも心はあるんじゃよ。', 7: 'これで、ワシにできることは全部じゃ。' }));
    } else if (k === 1) {
      await E.shop(['repair', 'repair2', 'energy'], 'ドクのジャンク屋');
    } else if (k === 2) {
      if (!qs('lost_cat') && ch !== 7) {
        await E.talk([
          ['doc', '……そうじゃ、カナタ。ネジを見なかったか？'],
          ['doc', 'あのバカ猫、またガレージを抜け出しおった。ネジを食いに、ジャンクの山へ行ったんじゃろう。'],
          ['doc', 'コンテナの迷路あたりが怪しい。狭いところが好きでな……。見つけたら連れてきてくれんか。'],
        ]);
        E.quest('lost_cat');
        E.remove('w2_neji_home');
        return;
      }
      if (qs('lost_cat') === 'active') {
        await E.say('doc', 'ネジはまだ見つからんか？　スクラップ・ベイの南西、コンテナの迷路の奥じゃ。……あいつ、狭くて暗いところが好きなんじゃ。');
        return;
      }
      await W2.lines('doc', DOC_TALK)();
    }
  }
  G.addToMap('doc_garage', {
    npcs: [
      { id: 'w2_doc', char: 'doc', x: 15, y: 8, dir: 'up', move: 'still', talk: async () => await docTalk() },
      {
        id: 'w2_neji_home', char: 'neji', x: 20, y: 13, dir: 'left', move: 'wander', range: 2, speed: 0.5,
        show: () => qs('lost_cat') !== 'active' || E.flag('w2_neji_caught'),
        talk: async () => {
          await E.say('neji', G.byCh({ 0: 'ニャ。', 1: 'ニャ……ギギ？（ネジをかじっている）', 3: 'ゴロゴロ……ギュイーン。（のどを鳴らす音が、モーター音に近い）', 7: 'ニャ……。（ドクの足もとから離れない）', 9: 'ニャー！（新しいボルトをもらってごきげんだ）' }));
        },
      },
      {
        id: 'w2_hangar_mech', char: 'sys', x: 4, y: 7, dir: 'down', move: 'still', noFace: true,
        get mech() {
          const id = G.state.mech && G.state.mech.id;
          return G.MECHS[id] ? id : 'ponkotsu';
        },
        show: () => !E.flag('w2_hangar_empty'),
        talk: async () => {
          const id = G.state.mech && G.MECHS[G.state.mech.id] ? G.state.mech.id : 'ponkotsu';
          const ms = G.state.mech;
          await E.say(null, G.MECHS[id].name + 'がハンガーに固定されている。' + (ms ? '（装甲Lv' + ms.armor + '・出力Lv' + ms.power + '・推力Lv' + ms.boost + '・武装Lv' + ms.weapon + '）' : ''));
        },
      },
    ],
  });
  G.addToMap('scrapbay', {
    npcs: [
      {
        id: 'w2_neji_lost', char: 'neji', x: 11, y: 36, dir: 'down', move: 'wander', range: 1, speed: 0.4,
        show: () => qs('lost_cat') === 'active' && !E.flag('w2_neji_caught'),
        talk: async () => {
          await E.say('neji', 'ニャ……ギギッ！？');
          E.emote('w2_neji_lost', '!');
          await E.say(null, 'ネジは錆びたボルトをくわえたまま、きょとんとこちらを見ている。');
          await E.say(null, '……抱き上げようとしたら、腕をすり抜けてガレージの方へ走っていった。');
          E.set('w2_neji_caught');
          E.remove('w2_neji_lost');
          E.toast('ネジはガレージに帰ったようだ。ドクに報告しよう', '#ffd25e');
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  レディオ・スターダスト：DJリリィ（第1章〜）＋ lily_tape
  // ---------------------------------------------------------------
  const LILY_TALK = {
    1: ['ハロー、迷い込んだリスナーくん。ここはレディオ・スターダスト。……秘密の放送局へようこそ。', '昨日の揺れのこと？　〈マザー〉の発表、ぜんぶ信じちゃダメよ。ラジオは嘘をつかない……たぶんね。'],
    2: ['白い髪の女の子の噂、リスナーから何通も来てるわ。……あなた、何か知ってる顔ね。', '大丈夫。わたしは電波には乗せない。守りたいものがある人の味方よ。'],
    3: ['スターダスト……いい名前のクランね。わたしの放送局と同じ。……偶然？', 'ルウちゃんによろしく。……あ、いや、なんでもない。リスナーの子でね、よく葉書をくれるのよ。'],
    4: '文化祭の特番、やろうかしら。「2年B組・星屑亭」の宣伝、タダでしてあげる。',
    5: ['公安の電波妨害がひどいの。……でも、声を届けることはやめない。', '夜が怖い子どもたちが、わたしの放送を聴いて眠るの。だから、止められない。'],
    6: '……ねえ、あの黒い機体の話。わたし、昔、似た光を見たことがあるの。白い部屋で。……忘れて。',
    7: 'ルウに伝えて。……「ひだまり園」の屋根の上で、一緒に星を数えた先輩は、今も歌ってるって。',
    8: '全コロニーに声を届けたわ。……あとは、あなたたちの番。いってらっしゃい。',
    9: 'レディオ・スターダスト、本日も元気に放送中！　……今日のリクエストは「ほんとうの空」。あなたたちの歌よ。',
  };
  async function lilyTalk() {
    const ch = G.state.chapter;
    if (qs('lily_tape') === 'active' && E.has('tape')) {
      await E.talk([
        ['lily:surprise', 'それ……！　見つけてくれたの！？'],
        ['lily:smile', '「星屑ララバイ」……戦争の前に、コロニーで流行った歌。わたしが小さい頃、施設で毎晩聴いてたの。'],
        ['lily', 'お礼に、これをあげる。わたしのお古だけど……あなたなら、きっといい音を拾えるわ。'],
      ]);
      E.take('tape');
      await E.give('headset', 1, { wait: true });
      E.quest('lily_tape', 'done');
      await E.say('lily:smile', '今夜の放送で、この曲をかけるわ。……あなたへの、ありがとうの代わりに。');
      return;
    }
    if (ch >= 3 && !qs('lily_tape') && ch !== 7) {
      await E.talk([
        ['lily', 'ねえ、ちょっと頼まれてくれない？　探してる音源があるの。'],
        ['lily', '「星屑ララバイ」っていう古いカセットテープ。昔、この局の誰かが路地裏で落としたって噂でね。'],
        ['lily', 'ネオン通りの裏の路地……木箱がごちゃごちゃ積んであるあたり。わたしが行くと目立つから。……お願い。'],
      ]);
      E.quest('lily_tape');
      return;
    }
    if (qs('lily_tape') === 'active') {
      await E.say('lily', 'テープ、見つかった？　ネオン通りの南の路地裏よ。東の奥、立入禁止の札のあたりの木箱があやしいと思うの。');
      return;
    }
    await W2.lines('lily', LILY_TALK)();
  }
  G.addToMap('radio_booth', {
    npcs: [{ id: 'w2_lily', char: 'lily', x: 10, y: 4, dir: 'down', move: 'still', show: () => G.state.chapter >= 1, talk: async () => await lilyTalk() }],
    checks: [{ x: 6, y: 4, w: 4, run: async () => { const n = E.get('w2_lily'); if (n) await n.talk(n); else await E.say(null, 'ミキサー卓。勝手にさわったら、リリィに怒られそうだ。'); } }],
  });
  G.addToMap('neon', {
    checks: [
      {
        x: 61, y: 27, show: () => qs('lily_tape') === 'active' && !E.flag('w2_tape_found'),
        run: async () => {
          await E.say(null, '積み上がった木箱のすき間に、何かがはさまっている……。');
          E.set('w2_tape_found');
          await E.give('tape', 1, { wait: true });
          await E.say(null, 'ラベルには、かすれた文字で「星屑ララバイ」と書いてある。リリィに届けよう。');
        },
      },
    ],
  });

  // 限定ドーナツ（vargas_snack）：ドーナツ屋台で話すと呼ばれる。処理したら true
  W2.donutQuest = async function () {
    if (qs('vargas_snack') !== 'active' || E.has('w2_donut')) return false;
    const k = await E.ask('w2_donut', '限定の「ネオン・リング」かい？　ラッキー、今日の最後の1個だよ！　¢150ね！', ['買う（¢150）', 'ほかの商品を見る', 'やめる'], { cancel: 2 });
    if (k === 1) return false;
    if (k !== 0) return true;
    if (G.state.money < 150) {
      await E.say('w2_donut', 'おっと、お金が足りないみたいだね。とっておいてあげるから、またおいで！');
      return true;
    }
    E.money(-150);
    await E.give('w2_donut', 1, { wait: true });
    await E.say('w2_donut', '誰へのおみやげ？　……甘いもの好きの先生？　ハハ、いい生徒を持ったね、その先生は！');
    return true;
  };

  // ---------------------------------------------------------------
  //  職員室：バルガス先生（序章〜第6章）＋ vargas_snack
  // ---------------------------------------------------------------
  const VARGAS_TALK = {
    0: ['春瀬！　また遅刻か！　……ラーメン屋の手伝い？　ならば仕方な……くない！', '廊下を走るな！　走るなら全力で走れ！　……それが軍で学んだ唯一の真理だ。'],
    1: ['ゆうべの揺れ……。いや、なんでもない。昔、似たような振動を戦場で感じたことがあるだけだ。', '春瀬、夜遊びはほどほどにしろ。……スクラップ・ベイは、子どもが行く場所じゃない。'],
    2: ['転入生のニコか。……いい目をしている。あれは、何かを背負ってきた目だ。', '守ってやれ、春瀬。先生には、できないこともある。'],
    3: ['……シミュレーターの成績が上がったな。まるで実戦を経験したような動きだ。', '先生は何も聞かん。ただし、無茶はするな。……無茶するなら、全力で無茶しろ。'],
    4: '文化祭のラーメン屋台、先生も手伝うぞ。……味見係としてな！',
    5: ['公安から生徒の名簿を出せと言われた。……先生は、軍にいた頃から書類仕事が苦手でな。紛失した。', '……春瀬。ニコのことは、先生も気にかけている。困ったら言え。'],
    6: ['春瀬。……先生も昔、仲間を失ったことがある。だから、これだけは言わせてくれ。', '生きて帰ってこい。宿題を出してないやつは、何があっても帰ってこなきゃならん。それが規則だ。'],
  };
  async function vargasTalk() {
    const ch = G.state.chapter;
    if (qs('vargas_snack') === 'active' && E.has('w2_donut')) {
      await E.talk([
        ['vargas:surprise', 'そ、それは……！　マルコの限定ネオン・リング！'],
        ['vargas:smile', '春瀬……おまえは、先生の心の友だ。……他の先生には内緒だぞ。特に教頭にはな。'],
        ['vargas', 'ほれ、これは礼だ。購買のメロンパンを3つ、先生の引き出しに隠してあった分だ。'],
      ]);
      E.take('w2_donut');
      await E.give('melonpan', 3, { wait: true });
      E.money(300);
      E.quest('vargas_snack', 'done');
      await E.say('vargas', '……うむ。この甘さ。戦場のレーションとは比べものにならん。平和の味だ。');
      return;
    }
    if (ch >= 2 && !qs('vargas_snack')) {
      await E.talk([
        ['vargas', '……春瀬、ちょっといいか。これは、その……教師としてではなく、男同士の頼みだ。'],
        ['vargas', 'ネオン通りの「マルコのドーナツ」。あそこの限定品「ネオン・リング」が、どうしても食べたい。'],
        ['vargas', '先生が夜のネオン通りで行列に並ぶわけにはいかん。教育委員会がうるさいのだ。……頼む！'],
      ]);
      E.quest('vargas_snack');
      return;
    }
    if (qs('vargas_snack') === 'active') {
      await E.say('vargas', 'ネオン・リングはまだか……？　ネオン通りのドーナツ屋台だ。1日10個の限定品だぞ。急げ！　……いや、廊下は走るな！');
      return;
    }
    await W2.lines('vargas', VARGAS_TALK)();
  }
  G.addToMap('staffroom', {
    npcs: [{ id: 'w2_vargas', char: 'vargas', x: 16, y: 8, dir: 'down', move: 'still', show: () => G.state.chapter <= 6, talk: async () => await vargasTalk() }],
  });

  // ---------------------------------------------------------------
  //  新聞部：ミミ（第2章〜）＋ mimi_scoop
  // ---------------------------------------------------------------
  const RUMOR_HINT = [
    '屋上の天文部の先輩が、空の観測をしてるっす。',
    'ネオン通りの占いロボ、なんか変なこと言うらしいっす。',
    'スクラップ・ベイのガラクタ拾いのおじいさん、古い話をたくさん知ってるっす。',
    '用務員のゲンさん、校庭のぬしっす。夜の学校の話とか知ってそうっす。',
  ];
  async function mimiTalk() {
    const ch = G.state.chapter;
    const got = [1, 2, 3, 4].filter((i) => E.flag('w2_rumor' + i));
    if (qs('mimi_scoop') === 'active') {
      if (got.length >= 4) {
        await E.talk([
          ['mimi:surprise', 'えっ、4つも！？　「消えない窓」「未来を言う占いロボ」「ゲートの向こうの歌」「ひとりでに弾むボール」……！'],
          ['mimi:smile', 'これで七不思議特集、組めるっす！　残りの3つは……締め切りまでに考えるっす！'],
          ['mimi', '先輩、これお礼っす！　新聞部の取材費から出したっす。……部長には内緒っすよ。'],
        ]);
        E.money(500);
        await E.give('chip', 1, { wait: true });
        await E.give('candy', 3, { quiet: true });
        E.quest('mimi_scoop', 'done');
        return;
      }
      await E.say('mimi', 'ネタ集め、どうっすか？　今 ' + got.length + '/4 っす！');
      const miss = [1, 2, 3, 4].filter((i) => !E.flag('w2_rumor' + i));
      await E.say('mimi', 'ヒント：' + RUMOR_HINT[miss[0] - 1]);
      return;
    }
    if (!qs('mimi_scoop') && ch !== 7) {
      const k = await E.ask('mimi', '先輩！　ちょうどいいとこに！　「コロニー七不思議」の特集を組みたいんすけど、ネタが集まらないんす！　手伝ってくれないっすか！？', ['手伝う', 'また今度'], { cancel: 1 });
      if (k !== 0) {
        await E.say('mimi', 'うぅ……気が変わったら、いつでも来てほしいっす！');
        return;
      }
      await E.talk([
        ['mimi:smile', 'やったっす！　目星はつけてあるっす。噂を知ってそうなのは、この4人！'],
        ['mimi', '屋上の天文部の先輩、ネオン通りの占いロボ、スクラップ・ベイのガラクタ拾いのおじいさん、それと用務員のゲンさんっす！'],
        ['mimi', '話を聞いたら、ここに報告に来てほしいっす。特ダネ、期待してるっす！'],
      ]);
      E.quest('mimi_scoop');
      return;
    }
    await W2.lines('mimi', {
      2: ['新聞部1年の小鳥遊ミミっす！　スクープのにおいがする時は、だいたい先輩たちの近くっす。', '転校生のニコ先輩、写真を撮ろうとすると必ず目をつぶるんすよ。……不思議っす。'],
      3: '先輩たち、夜な夜などこへ行ってるんすか？　……いや、聞かないっす。記者は待つのも仕事っす。',
      4: '文化祭特別号、表紙は2年B組の屋台っす！　先輩、もっとカッコいいポーズお願いするっす！',
      5: '公安に「取材は控えろ」って言われたっす。……控えるつもりはないっす！',
      6: '先輩の顔、最近ずっと険しいっす。……記事にはしないっす。先輩の味方っすから。',
      7: '号外っす！　……避難所の場所、全部まとめたっす。みんなに配ってくるっす！',
      8: '先輩たちが帰ってきたら、一面トップで記事にするっす。だから……絶対、帰ってくるっす！',
      9: '号外「2年B組、コロニーを救う」！　……先輩、今度こそ目をつぶらないで写真撮らせてほしいっす！',
    })();
  }
  G.addToMap('school_hall', {
    npcs: [{ id: 'w2_mimi', char: 'mimi', x: 40, y: 12, dir: 'down', move: 'still', show: () => G.state.chapter >= 2 && G.state.time !== 'night', talk: async () => await mimiTalk() }],
  });

  // ---------------------------------------------------------------
  //  ジャンク・デュエル ランク戦（rank）— E〜S 全15戦
  //   E.val('w_rank') = 勝利数（0〜15）
  // ---------------------------------------------------------------
  const en = (type, x, y, lv, o) => Object.assign({ type, x, y, lv }, o || {});
  const LADDER = [
    { rank: 'E', foe: 'サビ丸', sub: 'ジャンカー1機を撃破せよ', enemies: [en('junker', 17, 6, 3, { name: 'ジャンカー〈サビ丸〉' })], money: 150, items: [['scrap', 1]] },
    { rank: 'E', foe: 'ガラクタ兄弟', sub: 'ガラクタ兄弟を撃破せよ', enemies: [en('junker', 13, 6, 3, { name: 'ガラクタ兄〈ゴロ〉' }), en('junker', 21, 6, 3, { name: 'ガラクタ弟〈ジロ〉' })], money: 200, items: [['repair', 1]] },
    { rank: 'E', foe: 'スクラップ・キング', sub: 'Eランクの主を倒せ', enemies: [en('junker', 17, 5, 4, { name: 'スクラップ・キング', boss: true, hp: 320 }), en('junker', 11, 7, 3), en('junker', 23, 7, 3)], win: 'boss', money: 250, items: [['scrap', 2]], up: [['energy', 2]] },
    { rank: 'D', foe: '鉄亀団', sub: '鉄壁のタートルを撃ち抜け', enemies: [en('clanA', 17, 6, 4, { name: 'タートル〈コウラ〉' })], money: 300, items: [['scrap', 2]] },
    { rank: 'D', foe: '蜂団', sub: '素早いホーネット2機を捉えろ', enemies: [en('clanB', 12, 6, 4, { name: 'ホーネット〈ブンタ〉' }), en('clanB', 22, 6, 4, { name: 'ホーネット〈ハチコ〉' })], money: 350, items: [['repair', 1]] },
    { rank: 'D', foe: '亀蜂連合', sub: '盾と針の連携を崩せ', enemies: [en('clanA', 14, 6, 5, { name: 'タートル〈ガンテツ〉' }), en('clanB', 20, 6, 5, { name: 'ホーネット〈ハチコ〉' })], money: 400, items: [['chip', 1]], up: [['repair2', 1]] },
    { rank: 'C', foe: 'ジャッカルズ二軍', sub: 'ジャッカル2機を撃破せよ', enemies: [en('jackal', 13, 6, 5, { name: 'ジャッカル〈モヒ〉' }), en('jackal', 21, 6, 5, { name: 'ジャッカル〈チビ〉' })], money: 450, items: [['scrap', 3]] },
    { rank: 'C', foe: 'ジャンク三銃士', sub: '三方向からの攻撃をしのげ', enemies: [en('junker', 8, 6, 6), en('junker', 17, 5, 6), en('junker', 26, 6, 6)], money: 500, items: [['repair', 2]] },
    { rank: 'C', foe: 'レオ', sub: 'ジャッカルズのエースを倒せ', enemies: [en('jackal', 17, 5, 6, { name: 'ジャッカル〈レオ〉', boss: true, hp: 520 }), en('clanA', 12, 7, 6)], win: 'boss', money: 600, items: [['chip', 1]], up: [['energy', 3]] },
    { rank: 'B', foe: '蜂の巣', sub: '2つのウェーブを突破せよ', waves: [[en('clanB', 12, 6, 7), en('clanB', 22, 6, 7)], [en('jackal', 10, 5, 7), en('jackal', 24, 5, 7)]], money: 700, items: [['scrap', 4]] },
    { rank: 'B', foe: '払い下げ部隊', sub: '軍の払い下げ機体を撃破せよ', enemies: [en('guardner2', 17, 5, 7, { name: '払い下げ指揮官機〈アイアン〉', hp: 700 }), en('guardner', 11, 7, 8), en('guardner', 23, 7, 8)], win: 'boss', money: 800, items: [['chip', 1], ['repair2', 1]], up: [['repair2', 1]] },
    { rank: 'A', foe: 'トリプル・ファング', sub: 'ジャッカル3機の連携を断て', enemies: [en('jackal', 10, 6, 9), en('jackal', 17, 5, 9), en('jackal', 24, 6, 9)], money: 900, items: [['scrap', 5]] },
    { rank: 'A', foe: '要塞亀', sub: 'Aランク最強の鉄壁を崩せ', enemies: [en('clanA', 17, 5, 10, { name: '要塞亀〈ゲンブ〉', boss: true, hp: 1100 }), en('clanB', 11, 7, 10), en('clanB', 23, 7, 10)], win: 'boss', money: 1000, items: [['chip', 2]], up: [['repair2', 2]] },
    { rank: 'S', foe: 'チャンピオン親衛隊', sub: '王者への道を切り開け', waves: [[en('jackal', 11, 6, 11), en('jackal', 23, 6, 11)], [en('clanB', 9, 5, 11), en('clanA', 17, 5, 11), en('clanB', 25, 5, 11)]], money: 1200, items: [['repair2', 2]] },
    {
      rank: 'S', foe: 'ブルー・ファング', sub: '無敗のチャンピオンを倒せ！', title: 'CHAMPION MATCH', bgm: 'boss',
      enemies: [en('salamander', 17, 6, 11, { name: 'チャンピオン〈ブルー・ファング〉', boss: true, hp: 2200, color: { body: '#3a6ad0', accent: '#141420', accent2: '#4ef0ff', eye: '#4ef0ff' } })],
      win: 'boss', money: 3000, items: [['chip', 3]],
    },
  ];
  W2.LADDER = LADDER;
  W2.rankLetter = (wins) => (wins >= 15 ? 'S★' : (LADDER[wins] || LADDER[14]).rank);

  async function rankBattle(i) {
    const L = LADDER[i];
    const idx = LADDER.slice(0, i + 1).filter((x) => x.rank === L.rank).length;
    const def = {
      map: 'arena', mech: true, x: 17, y: 17, dir: 'up',
      bgm: L.bgm || 'arena', title: L.title || 'RANK ' + L.rank + '-' + idx, sub: 'VS ' + L.foe + '　' + L.sub,
      canLose: true, win: L.win || 'all',
    };
    if (L.waves) def.waves = L.waves.map((w) => w.map((e) => Object.assign({}, e)));
    else def.enemies = L.enemies.map((e) => Object.assign({}, e));
    return await E.battle(def);
  }
  W2.rankDesk = async function () {
    const wins = E.val('w_rank');
    if (!qs('rank')) {
      await E.talk([
        ['w2_registrar', 'スターダストのぼうやたちね。ランク戦への挑戦も受け付けてるわよ。'],
        ['w2_registrar', 'E から S まで、全部で15戦。勝てば賞金とパーツ。負けても命までは取らないわ。……機体は保証しないけど。'],
      ]);
      E.quest('rank');
    }
    if (wins >= 15) {
      const k = await E.ask('w2_registrar', 'あら、チャンピオン。今日はエキシビションマッチ？　賞金は控えめだけど、腕ならしにはなるわよ。', ['エキシビションに出る', 'やめる'], { cancel: 1 });
      if (k !== 0) return;
      const lv = Math.max(8, Math.min(14, 6 + G.state.chapter));
      const pool = ['junker', 'clanA', 'clanB', 'jackal'];
      const won = await E.battle({
        map: 'arena', mech: true, x: 17, y: 17, dir: 'up', bgm: 'arena', title: 'EXHIBITION', sub: 'チャンピオン防衛戦', canLose: true,
        enemies: [0, 1, 2].map((j) => ({ type: pool[(E.val('w2_exh') + j) % 4], x: 10 + j * 7, y: 6, lv })),
      });
      E.inc('w2_exh');
      if (won) {
        await E.say('w2_registrar', 'さすがね、チャンピオン。ファイトマネーよ。');
        E.money(400);
        await E.give('scrap', 2, { quiet: true });
      } else await E.say('w2_registrar', 'チャンピオンでも負ける日はあるわ。……観客は喜んでたけど。');
      return;
    }
    const L = LADDER[wins];
    const idx = LADDER.slice(0, wins + 1).filter((x) => x.rank === L.rank).length;
    const k = await E.ask('w2_registrar', '現在のランクは ' + L.rank + '（' + wins + '勝）。次の相手は「' + L.foe + '」よ。……挑戦する？', ['挑戦する（' + L.rank + '-' + idx + '）', '戦績を見る', 'やめる'], { cancel: 2 });
    if (k === 1) {
      const lines = ['E', 'D', 'C', 'B', 'A', 'S'].map((rk) => {
        const all = LADDER.map((x, i) => [x, i]).filter(([x]) => x.rank === rk);
        const w = all.filter(([, i]) => i < wins).length;
        return rk + 'ランク　' + '★'.repeat(w) + '☆'.repeat(all.length - w);
      });
      await E.say(null, lines.slice(0, 3).join('\n'));
      await E.say(null, lines.slice(3).join('\n'));
      return;
    }
    if (k !== 0) return;
    await E.say('w2_registrar', G.pick(['エントリー完了。……いってらっしゃい、ぼうや。', '観客はもう待ちきれないみたいよ。', 'さあ、ショータイムよ。']));
    const won = await rankBattle(wins);
    if (!won) {
      await E.say('w2_registrar', 'あらあら、残念。……でも、いい顔してたわよ。機体を直して、また来なさい。');
      return;
    }
    E.inc('w_rank');
    await E.say('w2_registrar', G.pick(['お見事。ファイトマネーよ。', '観客席が揺れてたわ。ほら、賞金。', 'やるじゃない。……次も期待してるわ。']));
    E.money(L.money);
    for (const [it, n] of L.items) await E.give(it, n, { quiet: true });
    E.toast('賞品：' + L.items.map(([it, n]) => G.ITEMS[it].name + '×' + n).join('・'), '#7af8ff');
    const nw = E.val('w_rank');
    if (nw >= 15) {
      await E.talk([
        ['w2_registrar', '……信じられない。ブルー・ファングが、膝をついた。'],
        ['w2_registrar', 'アンダーシェルの新しいチャンピオン、誕生よ。スターダスト。……覚えておくわ、その名前。'],
      ]);
      E.quest('rank', 'done');
      return;
    }
    if (L.up) {
      const nr = LADDER[nw].rank;
      G.audio.se('levelup');
      await E.notice('ランク ' + nr + ' に昇格！');
      for (const [it, n] of L.up) await E.give(it, n, { quiet: true });
      E.toast('昇格ボーナス：' + L.up.map(([it, n]) => G.ITEMS[it].name + '×' + n).join('・'), '#ffd25e');
    }
  };
})();
