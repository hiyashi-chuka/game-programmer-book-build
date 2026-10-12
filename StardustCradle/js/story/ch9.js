// =============================================================
//  story/ch9.js — 終章「ほんとうの空」
//  スターシードが閉じる → シグは光の中へ → 夜明け（ミラーが開く）
//  → 宇宙港で「おかえり」 → 星屑亭の朝ごはん（ニコの住民証）
//  → 自由行動（町のみんなの「その後」）→ 屋上 → スタッフロール
//  → 星屑亭にSからの手紙 → クリア後（chapter 10）
// =============================================================
(function () {
  const C9 = (G.C9 = G.C9 || {});
  const is9 = () => G.state.chapter === 9;

  G.addItem('c9_resident', { name: 'クレイドル7住民証', desc: 'ニコの正式な住民証。名前の欄には「春瀬 ニコ」、住所は「ミナト区 星屑亭」。' });
  G.addItem('c9_letter', { name: 'Sからの手紙', desc: '星屑亭に届いた、差出人「S」の手紙。消印はかすれて「S.C.0091」と読める。' });

  // =============================================================
  //  章の開始：中心核、スターシードが閉じる
  // =============================================================
  G.STORY.chapters[9] = async function () {
    E.set('c7_dark');
    E.set('w_evac');
    E.set('c8_calm');
    E.set('c8_core_intro');
    E.set('c8_port_open');
    E.party(['ruu', 'niko']);
    G.state.mech.id = 'harukaze2';
    G.state.objective = '';
    await E.chapter(9);
    await E.warp('c8_core', 17, 21, 'up');
    await C9.seedClose();
  };

  C9.seedClose = async function () {
    E.cut();
    E.bgm('sad');
    E.npc({ id: 'c9_helmina', char: 'helmina', x: 17, y: 9, dir: 'down' });
    await E.camera(17, 9, { frames: 50 });
    await E.say(null, 'スターシードが、ゆっくりと閉じていく。光の花びらが、一枚ずつ、内側へたたまれていくように。');
    await E.cameraReset();
    E.se('boost');
    E.npc({ id: 'c9_zephyr', char: 'sys', mech: 'zephyr', x: 22, y: 20, dir: 'left' });
    G.fx.ring(22 * 16 + 8, 20 * 16, 40, '#8ff8ff');
    await E.say('sig', '〈……間に合いました〉');
    await E.say('kanata:surprise', 'シグ！');
    await E.mech(false);
    E.npc({ id: 'c9_sig', char: 'sig', x: 21, y: 21, dir: 'left' });
    await E.wait(20);
    await E.move('c9_sig', [[19, 21]], { speed: 0.8 });
    E.face('player', 'right');
    await E.say('sig', 'スターシードが閉じれば、向こうの世界への道も、閉じます。');
    await E.say('ruu:surprise', 'え……。');
    await E.say('sig', '僕は、この世界の人間ではありません。扉が閉じれば……たぶん、ここにはいられない。');
    await E.say('kanata:surprise', 'そんな……！　だって、さっき、帰るって……ラーメン、食べるって……！');
    await E.say('sig:sad', 'はい。……約束を、破ることになります。すみません。');
    await E.say('niko:sad', 'シグ……いっちゃうの？');
    await E.say('sig', '僕の世界の空は、落ちてしまいました。でも、あそこにはまだ、空を見上げている人がいるかもしれない。');
    await E.say('sig', 'この世界で、僕は見ました。落ちなかった空を。……だから今度は、僕の世界でも、あきらめずに探してみます。');
    await E.say('ruu:cry', 'バカ……。あんたまで、いなくなんの……。');
    await E.say('sig:smile', 'ルウ。あなたは、本物の空が見たいと言っていましたね。');
    await E.say('sig', '僕は、たくさんの空を見てきました。……でも、この世界の空がいちばん、きれいでした。');
    await E.say('ruu:cry', '……ニセモノの空だよ。');
    await E.say('sig:smile', '知っています。');
    await E.say('sig', 'カナタ。……ラーメンの作り方、ばあちゃんに聞いておいてください。いつか、どこかで、教えてもらいます。');
    await E.say('kanata:smile', '……ああ。大盛りの作り方もな。');
    await E.say('sig', 'ニコ。……歌、きれいでした。');
    await E.say('niko:cry', 'シグ……。');
    E.se('echo');
    E.flash(10);
    E.bgm('title');
    await E.say('sig:smile', 'また、どこかの空で。');
    await E.cg('white', '', { wait: false });
    await E.say(null, 'シグの姿が、光の中にほどけていく。白い機体ゼフィールも、羽のような光の粒になって――。');
    E.remove('c9_sig');
    E.remove('c9_zephyr');
    E.set('c9_seed_closed');
    E.set('met_sig');
    await E.cgCaption('スターシードの向こうへ、まっすぐに、消えていった。');
    E.cgOff();
    E.reload();
    E.npc({ id: 'c9_helmina', char: 'helmina', x: 17, y: 9, dir: 'down' });
    await E.wait(40);
    await E.say(null, 'スターシードは、小さな青い光になって、静かに眠りについた。');
    await E.say('niko:sad', '……シグ、いっちゃった。');
    await E.say('ruu:cry', '……うん。');
    await E.say('kanata', '……「また、どこかの空で」、か。');

    // アイゼンとヘルミナ
    E.npc({ id: 'c9_eisen', char: 'eisen', x: 13, y: 22, dir: 'up' });
    await E.move('c9_eisen', [[16, 22], [16, 11]], { speed: 1 });
    await E.say('eisen', '……終わったようだな。');
    await E.say('eisen:serious', 'ドクター・ヘルミナ・クロイツ。コロニー公安として、あなたを拘束する。');
    await E.say('helmina:sad', '……ええ。');
    await E.say('eisen', '罪は償ってもらう。……だが、生きて償うんだ。あなたの娘も、それを望んでいるはずだ。');
    await E.say('helmina:sad', '……ありがとう、と言うべきなのかしら。');
    await E.say('helmina', 'カナタくん、ルウさん、ニコ。……ごめんなさい。そして――ありがとう。');
    await E.say('helmina:smile', 'ミアの声を、もう一度、聞かせてくれて。');
    await E.say('gil', '〈おーい！　生きてるか、スターダスト！　こっちは全部片づいたぜ！　……オレ様のおかげでな！〉');
    await E.say('ruu:smile', '……うるさいのが来た。');

    // 夜明け
    E.se('ok');
    await E.say('mother', 'オハヨウゴザイマス、クレイドル7ノ皆サン。');
    await E.say('mother', '……ソシテ、ゴメンナサイ。ワタシハ、トテモ ナガイ 夜ヲ、ツクッテシマイマシタ。');
    await E.say('mother', 'タダイマヨリ、ミラーヲ カイホウ シマス。');
    await E.fadeOut(30, '#ffffff');
    E.unset('c7_dark');
    E.unset('w_evac');
    E.time('morning');
    E.bgm('ending', { restart: true });
    await E.cg('dawn', '', { wait: false });
    await E.fadeIn(50);
    await E.cgCaption('――ミラーが、開いていく。');
    await E.cgCaption('長い長い夜のあとで、クレイドル7に、朝が来た。');
    await E.cgCaption('街じゅうの窓が開いて、人々が空を見上げる。……ニセモノの、でも、いつもの空を。');
    await E.fadeOut(24);
    E.cgOff();
    await C9.homecoming();
  };

  // =============================================================
  //  宇宙港で「おかえり」
  // =============================================================
  const homeOn = () => is9() && !E.flag('c9_home');
  const greeter = (id, char, x, y, dir) => ({ id, char, x, y, dir, move: 'still', show: homeOn });
  G.addToMap('scrapbay', {
    npcs: [
      greeter('c9p_tome', 'tome', 52, 48, 'up'),
      greeter('c9p_jin', 'jin', 55, 48, 'up'),
      greeter('c9p_doc', 'doc', 49, 47, 'up'),
      greeter('c9p_ponta', 'ponta', 57, 47, 'up'),
      greeter('c9p_yui', 'yui', 47, 47, 'up'),
      greeter('c9p_lily', 'lily', 59, 47, 'up'),
      greeter('c9p_vargas', 'vargas', 45, 46, 'right'),
      greeter('c9p_mimi', 'mimi', 61, 46, 'left'),
      greeter('c9p_kyosuke', 'kyosuke', 43, 47, 'right'),
    ],
  });

  C9.homecoming = async function () {
    G.state.objective = '';
    await E.warp('scrapbay', 53, 45, 'down');
    E.cut();
    E.bgm('home');
    await E.say(null, '――宇宙港ゲート7。開いた扉の向こうから、朝の光がさしこんでいた。');
    await E.say('tome', 'カナタ！');
    await E.move('c9p_tome', [[52, 47], [53, 47]], { speed: 1.2 });
    E.face('c9p_tome', 'up');
    await E.say('tome:smile', '……おかえり。よく、帰ってきたね。');
    await E.say('kanata:smile', 'ただいま、ばあちゃん。');
    await E.say('niko:smile', 'ただいま！　ばあちゃん、ラーメン！');
    await E.say('tome:smile', 'あいよ。……まずは食いな、だろ？');
    await E.say('jin:smile', 'おかえり、カナタ。……よくやった。');
    await E.say('kanata', '……父さん。');
    await E.say('lily:smile', 'ルウ！');
    await E.say('ruu:surprise', 'リリィ姉……！');
    await E.say('lily:smile', 'おかえり。チビたち、ひと晩じゅう寝ないで、窓の灯り守ってたよ。……あとで、顔見せてあげて。');
    await E.say('ruu:cry', '……うん。');
    await E.say('ponta:cry', 'ぶっひゃー！　ハルカゼ改、傷だらけっす！　……でも、ちゃんと帰ってきたっす……！');
    await E.say('yui:smile', 'おかえりなさい。校則第1条、ちゃんと守りましたね。');
    await E.say('vargas:grin', '宿題、提出期限ギリギリだな！　合格だ！');
    E.flash(5);
    E.se('ok');
    await E.say('mimi:smile', 'はい、一面いただきっす！　見出しは『2年B組、朝を連れて帰る』！');
    await E.say('kyosuke', '……タイマンの続きは、また今度だ。');
    await E.say('doc', 'ふん。……機体ごと帰ってくるとは、上出来じゃ、若造。');
    await E.say('ponta', 'あれ？　……シグは？');
    await E.say(null, '……少しのあいだ、誰も、何も言わなかった。');
    await E.say('kanata', 'シグは……自分の空に、帰ったよ。');
    await E.say('ruu', '「また、どこかの空で」……だってさ。');
    await E.say('tome', '……そうかい。あの子のぶんも、大盛り作っといたんだけどねえ。');
    await E.say('tome:smile', 'さ、帰るよ。星屑亭で、朝ごはんだ。');
    E.set('c9_home');
    await C9.breakfast();
  };

  // =============================================================
  //  星屑亭の朝ごはん：ニコの住民証
  // =============================================================
  C9.breakfast = async function () {
    E.time('morning');
    await E.warp('hoshikuzu', 7, 7, 'up');
    E.cut();
    const seat = (id, x) => {
      const f = E.get(id);
      if (!f) return;
      E.teleport(id, x, 6, 'up');
      f.pinned = true;
    };
    E.teleport('player', 7, 6, 'up');
    seat('f_ruu', 5);
    seat('f_niko', 6);
    await E.say(null, '星屑亭。朝の光が、のれんごしに差しこんでいる。');
    await E.say('tome', 'ほれ、できたよ。星屑ラーメン、朝の特盛りだ。');
    await E.say('niko:smile', 'ラーメン！　……ずるずる……おいしい！　……ニコ、いきてる！');
    await E.say('ruu:smile', '大げさ……でも、ないか。');
    await E.say('kanata:smile', 'うまい……。やっぱ、ばあちゃんのが一番だ。');
    E.se('door');
    E.npc({ id: 'c9_yui_b', char: 'yui', x: 7, y: 10, dir: 'up' });
    E.npc({ id: 'c9_kazami', char: 'kazami', x: 8, y: 10, dir: 'up' });
    await E.move('c9_yui_b', 'U', { noWait: true });
    await E.move('c9_kazami', 'U');
    E.face('player', 'down');
    await E.say('yui', 'おはようございます。……朝早くに、すみません。');
    await E.say('kazami:serious', '……春瀬トメさん。それに、子どもたち。');
    await E.say('kazami', 'わたしは、総督を辞任する。スターシードを隠し、ヘルミナに資金を与えていたのは、わたしだ。……すべての責任を取るつもりだ。');
    await E.say('yui:sad', '父はこれから、査問委員会に出ます。……でも、その前に、どうしてもと。');
    await E.say('kazami', '総督として、最後にひとつだけ、正しい仕事をさせてほしい。');
    await E.say('kazami', 'ニコくん。……これを。');
    if (E.has('idcard')) E.take('idcard');
    await E.give('c9_resident', 1, { wait: true });
    await E.say(null, 'それは、本物の住民証だった。名前の欄には「春瀬 ニコ」と書かれている。');
    await E.say('niko:surprise', 'はるせ……ニコ……？');
    await E.say('tome:smile', 'うちの子なんだから、名字も春瀬さね。……勝手に決めちまったけど、いやかい？');
    await E.say('niko:cry', 'ニコ……ここのこ？　ずっと、いて、いいの？');
    await E.say('tome:smile', 'とっくの昔から、うちの子さね。');
    await E.say('ruu:cry', '……よかったじゃん、ニコ。春瀬ニコ、か。……なんか、いいね。');
    await E.say('kanata:think', 'じゃあ、ニコはオレの……妹？　いとこ？　……おば？');
    await E.say('tome', '細かいことはいいんだよ。家族は、家族さ。');
    await E.say('kazami:sad', 'それと……ユイ。おまえにも、すまなかった。');
    await E.say('yui:cry', 'お父さん……。……帰ってきたら、いっしょに、ここのラーメン、食べましょう。');
    await E.say('kazami:smile', '……ああ。約束しよう。');
    await E.say('yui', 'わたしは、父を見送ってきます。……あとで、公園にいますね。');
    await E.move('c9_kazami', 'D', { noWait: true });
    await E.move('c9_yui_b', 'D');
    E.remove('c9_kazami');
    E.remove('c9_yui_b');
    E.se('door');
    await E.wait(20);
    await E.radio([
      'ハロー、クレイドル7の早起きさんたち！　……いい朝だね。ほんとに、いい朝。',
      'ミラーが開いて、マザーも元どおり。避難所のみんなは、ゆっくりおうちに帰ってね。',
      'それから……ゆうべ、コロニーじゅうに流れたあの歌。リクエストが止まらないの。',
      'だから、今日は一日じゅう流しちゃう。歌ってくれた子に、ありったけの「ありがとう」をこめて。',
      ['niko:shy', '……えへへ。'],
    ]);
    await E.say('tome', 'さ、今日は一日、町を回っておいで。みんな、あんたたちの顔を見たがってるよ。');
    await E.say('ruu', 'じゃあさ、カナタ。……みんなに会ったら、屋上、行こ。夕方に。');
    await E.say('kanata:think', '屋上？');
    await E.say('ruu:shy', 'いいから！');
    E.set('c9_free');
    E.time('day');
    E.cut(false);
    E.reload();
    E.teleport('player', 7, 8, 'down');
    C9.updateObjective();
    E.toast('ジン・アイゼン・ユイ・バルガス先生・キョウスケ・ギル……町のみんなに会いに行こう', G.UI.line2);
  };

  // =============================================================
  //  屋上：「でも、ここがわたしたちの空なんだよね」
  // =============================================================
  G.addToMap('rooftop', {
    onEnter: async () => {
      if (!is9() || !E.flag('c9_free') || E.flag('c9_roof')) return;
      E.cut();
      const n = C9.visitCount ? C9.visitCount() : 0;
      const q = n >= 6 ? 'カナタ。……みんなに、会えた？' : 'あ、カナタ。……もう、みんなに会ってきた？　まだ行ってないとこ、あるっしょ。';
      const i = await E.ask('ruu', q, ['うん（エンディングへ）', 'まだ（町に戻る）'], { cancel: 1 });
      if (i !== 0) {
        await E.say('ruu', 'じゃ、待ってる。……夕方までには来なよ。');
        E.cut(false);
        await E.warp('school_hall', 3, 3, 'down');
        return;
      }
      E.set('c9_roof');
      await C9.rooftop();
    },
  });

  C9.rooftop = async function () {
    E.cut();
    await E.fadeOut(30);
    E.time('evening');
    E.stopBgm(2);
    E.reload();
    E.teleport('player', 16, 11, 'up');
    const ruu = E.get('f_ruu'),
      niko = E.get('f_niko');
    if (ruu) {
      E.teleport('f_ruu', 18, 11, 'up');
      ruu.pinned = true;
    }
    if (niko) {
      E.teleport('f_niko', 15, 14, 'down');
      niko.pinned = true;
    }
    await E.wait(20);
    await E.fadeIn(40);
    E.bgm('title', { restart: true });
    await E.say(null, '夕方。第三中学校の屋上。');
    await E.say(null, 'ミラーから差しこむ光が、空いっぱいの「向こう側の街」を、オレンジ色に染めていた。');
    E.emote('f_niko', '…');
    await E.say('niko', 'すぅ……すぅ……。ラーメン……おかわり……。');
    await E.say('ruu:smile', '寝ちゃった。……今日、ずっとはしゃいでたもんね。');
    E.face('f_ruu', 'left');
    E.face('player', 'right');
    await E.say('ruu', 'ねえ、カナタ。覚えてる？　春に、ここで言ったこと。');
    await E.say('kanata', '「この空、全部ニセモノなんだよ」……だろ。');
    await E.say('ruu', 'うん。……あたし、ずっと本物の空が見たかった。');
    await E.say('ruu', 'で、見てきた。宇宙。真っ黒で、冷たくて、星がいっぱいで……すごかった。ほんとに、すごかった。');
    await E.say('ruu:shy', 'でもさ。帰ってきて、この空を見たら……なんか、泣きそうになった。');
    E.face('f_ruu', 'up');
    E.face('player', 'up');
    await E.cg('rooftop', '');
    await E.say('ruu', 'ニセモノなのは、変わんないんだけどね。ミラーで光を入れて、空気はマザーが作ってて。');
    await E.say('kanata', 'でもさ。ばあちゃんのラーメンの湯気も、ニコの寝言も、みんなの「おかえり」も……ぜんぶ、この空の下にあるんだよな。');
    await E.say('ruu', '……うん。');
    const i = await E.ask('kanata', '（……）', ['ニセモノでも、ここがオレたちの空だ', '（だまって、空を見上げる）']);
    if (i === 0) {
      await E.say('kanata:smile', 'ニセモノでもさ。……ここが、オレたちの空だ。');
      await E.say('ruu:smile', 'あんた、それ春にも言ってた。');
    } else {
      await E.say(null, 'カナタは、だまって空を見上げた。ルウも、となりで、同じ空を見ていた。');
    }
    await E.say('ruu:smile', 'でも、ここがわたしたちの空なんだよね。');
    await E.say('kanata:smile', '……ああ。');
    await E.say('ruu:shy', 'カナタ。……いつかさ、いっしょに行こうよ。ほんとうの空の、もっと向こう。');
    await E.say('kanata:smile', 'なんとかなるって。……ふたりなら。いや、三人なら。');
    await E.say('niko', 'むにゃ……よにん……。シグも……。');
    await E.say('ruu:smile', 'ふふっ。……そうだね。');
    await E.cgCaption('風のないコロニーの空を、紙飛行機がひとつ、ゆっくりと飛んでいった。');
    await E.fadeOut(60);
    E.cgOff();
    E.cut(false);
    await C9.credits();
  };

  // =============================================================
  //  スタッフロール → Sからの手紙 → クリア後
  // =============================================================
  C9.credits = async function () {
    await E.ending();
    G.field.cg = null;
    E.time('day');
    E.party(['ruu', 'niko']);
    await E.cg('black', '', { wait: false });
    E.stopBgm(1);
    await E.warp('hoshikuzu', 6, 7, 'up', { noEnter: true });
    E.cgOff();
    E.cut();
    E.bgm('home');
    await E.say(null, '――それから、しばらくして。');
    await E.say('tome', 'カナタ、あんた宛てに手紙が来てるよ。……切手も消印も、見たことないやつだ。');
    await E.say('kanata:surprise', '手紙？　オレに？');
    await E.say('tome', 'カナタと、ルウちゃんと、ニコちゃん。三人宛てさね。');
    await C9.readLetter(false);
    await E.say('ruu:smile', '……あいつ、ラーメン屋になる気じゃん。');
    await E.say('niko:smile', 'シグの、ラーメン……たべたい！');
    await E.say('kanata:think', 'スープ三日って……ばあちゃん、そんなの教えてたの？');
    await E.say('tome:smile', 'あの子、厨房でこっそりメモとってたからねえ。……まったく、大した弟子だよ。');
    await E.say(null, '封筒の消印は、かすれていて、よく読めなかった。');
    await E.say(null, '――「S.C.0091」。そう、書いてあるように見えた。');
    await E.give('c9_letter', 1, { quiet: true });
    E.cut(false);
    await C9.postGame();
  };

  C9.readLetter = async function (again) {
    await E.cg('c9_letter', again ? '' : '差出人の欄には、ただ一文字。――「S」', again ? { wait: false } : undefined);
    const L = { name: 'Sからの手紙' };
    await E.say('sys', '「カナタ、ルウ、ニコへ。」', L);
    await E.say('sys', '「こちらの空は、まだ少し暗いけれど、毎日すこしずつ、明るくなっています。」', L);
    await E.say('sys', '「落ちたコロニーのかけらで、小さな町をつくっている人たちに会いました。……ラーメン屋は、まだありません。」', L);
    await E.say('sys', '「だから、つくってみようと思います。ばあちゃんに教わったとおり、スープは三日かけて。」', L);
    await E.say('sys', '「失敗したら、また手紙を書きます。成功しても、書きます。」', L);
    await E.say('sys', '「この手紙が届くかどうかは、わかりません。でも、星の声は、きっと、つないでくれると思います。」', L);
    await E.say('sys', '「また、どこかの空で。　――S」', L);
    E.cgOff();
  };

  C9.postGame = async function () {
    G.state.chapter = 10;
    E.unset('w_evac');
    E.unset('c7_dark');
    E.time('day');
    E.party(['ruu', 'niko']);
    await E.fadeOut(20);
    await E.warp('tome_room', 5, 6, 'down', { noEnter: true });
    E.cut();
    E.bgm('home');
    await E.notice('― CLEAR ―\n「星屑のクレイドル」の物語は、ここでおしまい。\nクリアおめでとう！\n\nでも、クレイドル7の毎日は、まだまだ続いていく。\nランク戦、町の人の依頼、星屑メモリー集め……\nこのまま自由に遊べます。', { col: G.UI.gold });
    const r = await E.ask(null, 'クリアデータをセーブしますか？', ['セーブする', 'しない'], { cancel: 1 });
    if (r === 0) {
      await new Promise((res) => {
        const w = G.ui.slotSelect('save', () => {
          G.ui.pop(w);
          res();
        });
        G.ui.push(w);
      });
    }
    E.cut(false);
    E.objective('自由行動：ランク戦・サブクエスト・星屑メモリー集め');
  };
})();
