// =============================================================
//  story/ch0.js — 序章「空のない空」
//   進行は E.val('c0_ph') の段階で管理する：
//    0 目覚め（カナタの部屋） 1 登校（星屑亭→ミナト区） 2 校門→2年B組
//    3 昼休み（購買） 4 屋上 5 放課後（帰り道へ） 6 揺れのあと（慰霊碑へ）
//    7 帰宅（星屑亭） 8 夜（部屋・ラジオ） 9 終了
// =============================================================
(function () {
  const ch0 = () => G.state.chapter === 0;
  const ph = () => E.val('c0_ph');
  const setPh = (n) => E.set('c0_ph', n);
  const at = (n) => ch0() && ph() === n;
  const C0 = (G.C0 = {});

  // 足もとに土ぼこりと残像を出しながら動かす（スケボー等）
  C0.trail = function (id) {
    const e = E.get(id);
    if (!e) return;
    let k = 0;
    G.tasks.until(() => {
      k++;
      if (e.dead || !e.path || !e.path.length) return k > 4;
      if (k % 2 === 0) G.fx.afterimage(e);
      if (k % 5 === 0) G.fx.dust(e.x, e.y);
      return false;
    });
  };
  // 立ち止まって引き返させる
  const turnBack = (dir, lines) =>
    async function () {
      const l = typeof lines === 'function' ? lines() : lines;
      for (const [who, t] of l) await E.say(who, t);
      await E.move('player', dir);
    };
  // 敵を「報酬なし」にする（シミュレーター内）
  const noReward = async () => {
    for (const e of G.field.enemies()) e.noReward = true;
  };
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60),
      s = Math.floor(sec % 60),
      cs = Math.floor((sec * 100) % 100);
    return m + '分' + String(s).padStart(2, '0') + '秒' + String(cs).padStart(2, '0');
  };

  // ===============================================================
  //  章の開始
  // ===============================================================
  G.STORY.chapters[0] = async function () {
    const s = G.state;
    E.time('morning');
    E.party([]);
    s.mech.id = 'ponkotsu';
    E.objective('');
    // 父のスパナは棚の上（拾って装備する）
    s.equip.weapon = null;
    delete s.items.wrench;
    for (const k of Object.keys(s.flags)) if (k.startsWith('c0_')) delete s.flags[k];
    setPh(0);
    E.cut(true);
    G.field.fade = 1;
    E.stopBgm();
    await E.wait(40);

    // ---- オープニング ----
    E.bgm('space');
    await E.cg('colony_out', '', { wait: false });
    await E.fadeIn(60);
    await E.cgCaption('星暦0085年。\n地球と月の重力がつり合う宙域、L4。');
    await E.cgCaption('そこに、ひとつの円筒が浮かんでいる。\n全長32km、直径6.4km——中立コロニー〈クレイドル7〉。');
    await E.cgCaption('十年前、この星の海で大きな戦争があった。\n今では、だれもその話をしたがらない。');
    E.bgm('title');
    await E.cg('colony', '円筒の内側に、街がある。\n見上げれば、空のかわりに「向こう側の街」が逆さまに浮かんでいる。');
    await E.cgCaption('巨大なミラーが光を運び、管理AI〈マザー〉が朝と夜を決める。\nこの街の空は——ぜんぶ、つくりものだ。');
    await E.cgCaption('それでも、ぼくらはこの空の下で生まれて、\nこの空の下で、大きくなった。');
    await E.fadeOut(40);
    E.cgOff();
    E.stopBgm();
    await E.chapter(0);

    // ---- 目覚め（まだ暗転中） ----
    await E.warp('tome_room', 2, 3, 'left', { noFade: true, noEnter: true });
    G.field.banner = null;
    await E.wait(30);
    E.se('echo');
    await E.say('mother', 'オハヨウゴザイマス、クレイドル7ノ皆サン。只今、標準時06時45分。ミラー開角12度。本日モ、晴天デス。');
    await E.say('mother', 'ソレデハ、良イ一日ヲ。……マザーハ、イツモ皆サンヲ見守ッテイマス。');
    await E.wait(30);
    E.shake(4, 20);
    E.se('hit');
    await E.say('tome:angry', 'カナタ！！ 起きなー！！ 遅刻だよ！！');
    await E.say('kanata:sad', '……んぁ……。あと5分……。');
    E.shake(3, 14);
    await E.say('tome:angry', 'その「あと5分」を、もう3回聞いたよ！ 降りてこないなら、おにぎりは常連さんに配っちまうからね！');
    await E.say('kanata:surprise', 'それはダメだ！！');
    E.bgm('home');
    await E.fadeIn(50);
    E.emote('player', '…');
    await E.wait(40);
    await E.say('kanata', 'ふぁ……。今日もいい天気……って、天気は毎日マザーが決めてるんだっけ。');
    await E.say('kanata', 'えーと、制服よし、ゴーグルよし……。あれ？ スパナ。父さんのスパナ、どこ置いたっけ。');
    await E.say('kanata:think', '……そうだ、ゆうべ棚の上に置いたんだ。');
    await E.notice('【操作】矢印キー / WASD：移動　Z：話す・調べる\nX：ダッシュ　Esc：メニュー');
    E.objective('父のスパナを持って、1階の店へ降りる');
  };

  // ===============================================================
  //  カナタの部屋（tome_room）
  // ===============================================================
  G.addToMap('tome_room', {
    checks: [
      {
        // 棚：父のスパナ
        x: 7, y: 2, w: 2,
        show: () => ch0() && ph() === 0,
        run: async () => {
          if (E.flag('c0_wrench')) return E.say(null, 'プラモデルとジャンクパーツがぎっしりの棚。スパナの定位置は、今はからっぽだ。');
          await E.say(null, '棚の上に、使いこまれたスパナ。グリップに小さく「JIN」と彫ってある。');
          await E.say('kanata', '……あった。');
          E.set('c0_wrench');
          G.addItemCount('wrench', 1);
          E.equip('weapon', 'wrench');
          E.se('get');
          await E.notice('「父のスパナ」を手に入れた！\n（装備した。調べる相手がいない時、Zで攻撃できる）', { col: G.UI.gold });
          await E.say('kanata', '……いってきます、父さん。');
          E.objective('1階の星屑亭へ降りる（部屋の右上の階段）');
        },
      },
      {
        x: 4, y: 2,
        show: () => ch0() && (ph() === 0 || ph() === 8),
        run: async () => {
          if (ph() === 8) {
            await E.say(null, '写真立ての父さんは、今夜も変わらずに笑っている。');
            await E.say('kanata', '……今日、ゴンゾウさんが言ってたんだ。10年前と同じ揺れだって。');
            await E.say('kanata:sad', '父さんなら、なんて言うかな。……「なんとかなるって」かな。');
            return;
          }
          await E.say(null, '写真立て。作業着の男の人が、小さいころのカナタを肩車して笑っている。');
          await E.say('kanata', '……父さんがいなくなって、もう5年か。');
          await E.say('kanata', '「なんとかなるって」——父さんの口ぐせ。いつの間にか、オレの口ぐせになってた。');
        },
      },
      {
        x: 5, y: 2,
        show: () => ch0() && (ph() === 0 || ph() === 8),
        run: async () => {
          await E.say(null, '自作のAFシミュレーター端末。ハイスコア：1位 KANATA　2位 RUU　3位 PONTA');
          if (ph() === 8) return E.say('kanata', '……ルウのスコア、また少し縮んでる。あいつ、夜中にゲーセンで練習してるな。');
          await E.say('kanata', '今日は学校のシミュレーター実習の日だ。ルウのやつ、また勝負をふっかけてくるんだろうな。');
        },
      },
      {
        x: 8, y: 8, w: 2,
        show: () => ch0() && (ph() === 0 || ph() === 8),
        run: async () => {
          if (ph() === 8) {
            await E.say(null, 'テレビは「砂嵐」を映している。マザーの放送は、もう終わったらしい。');
            return E.say('kanata', '……夕方の揺れのニュース、ひとこともやってなかったな。');
          }
          await E.say('mother', '……本日ノ、コロニー回転数ハ正常。昨夜観測サレタ微弱ナ振動ニツイテハ、現在調査中デス。', { name: 'テレビ（マザー）' });
          await E.say('kanata', '微弱な振動？ ……ぜんぜん気づかなかった。寝てたし。');
        },
      },
      {
        // 木箱：父さんの古いラジオ（夜）
        x: 1, y: 8,
        show: () => ch0() && ph() === 8,
        run: async () => await C0.night(),
      },
    ],
    onEnter: async () => {
      if (!at(8) || E.flag('c0_room_night')) return;
      E.set('c0_room_night');
      E.cut(true);
      await E.wait(20);
      await E.say('kanata', '……ふう。長い一日だった。');
      await E.say('kanata:think', 'シミュレーター、メロンパン、屋上、それに……あの揺れ。');
      await E.say('kanata', '眠れそうにないや。……そうだ。父さんの古いラジオ、まだ木箱に入ってたよな。');
      E.objective('木箱（部屋の左下）から古いラジオを出して聴く');
    },
  });

  // 夜：ラジオ → 窓の外 → 第1章へ
  C0.night = async function () {
    if (E.flag('c0_radio')) return;
    E.set('c0_radio');
    E.cut(true);
    await E.say(null, '木箱の底から、父さんの古いラジオを引っぱり出した。アンテナを伸ばして、つまみを回す。');
    E.se('cursor');
    await E.say(null, '……ザザ……ザ……。');
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさんたち！ 今夜も始まりました、海賊ラジオ〈レディオ・スターダスト〉！ DJはわたし、リリィでーす！',
      'さてさて、今日の夕方の揺れ、みんな大丈夫だった？ マザーの公式発表は「回転軸の定期調整」。……定期、ねえ。',
      'わたしの記憶だと、前回の「定期調整」は10年前なんだけど？ ふふ、ずいぶん気の長い定期だこと。',
      'リスナーさんからのおたより、読んじゃうよ。ペンネーム「クレーン乗りのM」さん。',
      '「スクラップ・ベイに、夜な夜な軍用の機体が出入りしてるって噂、本当ですか？」……だって。',
      '……うーん。本当かどうかは、わたしにもわからない。でもね、中立コロニーに軍用機。ちょっと、におうよね。',
      ['kanata:surprise', '……スクラップ・ベイ？ ドクのガレージがあるところだ。'],
      'さ、難しい話はここまで！ 眠れない子のために、今夜の一曲。……「空のない空」。',
      'おやすみ、クレイドル7。ニセモノの空の下でも、星はちゃんと見てるからね。',
    ]);
    await E.say('kanata', '……軍用の機体、か。');
    await E.say('kanata:think', 'ポンコツ号、ドクのとこに置きっぱなしなんだよな。……大丈夫かな。');
    await E.say(null, 'ラジオを止めて、窓の外を見上げた。');
    E.bgm('sad');
    await E.cg('colony_night', '夜の側に回ったコロニーの空に、向こう側の街の灯りが、逆さまにまたたいている。');
    await E.cgCaption('ニセモノの空。ニセモノの星。\n……でも、オレはこの景色がきらいじゃない。');
    E.se('echo');
    E.flash(10);
    await E.cgCaption('——そのとき。\n空を、白い光がひとすじ、横切った。');
    E.cgOff();
    E.emote('player', '!');
    await E.say('kanata:surprise', '……流れ星？');
    await E.say('kanata:think', 'いや……コロニーの中に、流れ星なんて落ちるわけない。');
    await E.say('kanata', '……なんだったんだ、今の。');
    await E.fadeOut(60);
    E.stopBgm();
    await E.cg('black', 'それが、ぼくらの「ほんとうの空」をめぐる、ひと夏のはじまりだった。');
    E.cgOff();
    setPh(9);
    E.exp(10);
    await E.startChapter(1);
  };

  // ===============================================================
  //  星屑亭（朝・夜）
  // ===============================================================
  G.addToMap('hoshikuzu', {
    npcs: [
      {
        id: 'c0_daisuke', char: 'c0_daisuke', x: 5, y: 6, dir: 'up', move: 'still',
        show: () => ch0() && ph() <= 1,
        talk: async () => {
          if (ph() === 0) return E.say('c0_daisuke', 'よう、カナタ！ 今日も寝ぐせが元気だな！');
          await E.say('c0_daisuke', '夜勤明けのラーメンは格別よ。工場のクレーンをひと晩じゅう転がしてるとな、腹の底から「星屑ダシ」を欲するんだ。');
          await E.say('c0_daisuke', 'お前の親父さんにはよく世話になったぜ。工場のワークフレームが動かなくなると、真夜中でも飛んできてくれてな。');
          await E.say('c0_daisuke', '「機械にも機嫌がある。話を聞いてやれば、ちゃんと動く」……ってな。変わった人だったよ。');
        },
      },
      {
        id: 'c0_ume', char: 'c0_ume', x: 13, y: 6, dir: 'left', move: 'still',
        show: () => ch0() && ph() <= 1,
        talk: async () => {
          await E.say('c0_ume', 'おはよう、カナちゃん。あたしゃね、毎朝ここでラーメンを食べるのが日課なの。もう30年よ。');
          await E.say('c0_ume', 'トメさんのラーメンはね、戦争の前から味が変わらないの。変わらないって、すごいことなのよ。');
          await E.say('c0_ume', '……ゆうべの揺れ？ 年寄りは眠りが浅いからねえ。夜中に一度、湯のみがカタカタって鳴ったわ。');
        },
      },
    ],
    onEnter: async () => {
      if (!ch0()) return;
      // スパナを忘れて降りてきた
      if (ph() === 0 && !E.flag('c0_wrench')) {
        E.cut(true);
        E.emote('player', '!');
        await E.say('kanata:surprise', 'あっ、父さんのスパナ忘れた！');
        await E.say('tome', '……なにやってんだい、あんたは。');
        await E.warp('tome_room', 10, 3, 'down');
        return;
      }
      if (ph() === 0) return C0.morningShop();
      if (ph() === 7) return C0.dinner();
      if (ph() === 1 && !E.flag('c0_shop_again')) {
        E.set('c0_shop_again');
        await E.say('tome:angry', 'まだいたのかい！ ほら、さっさと行きな！ 学校は北だよ、北！');
      }
    },
  });

  C0.morningShop = async function () {
    E.cut(true);
    await E.wait(20);
    await E.say('tome', 'やっと起きたかい、ねぼすけ。');
    await E.say('c0_daisuke', 'よう、カナタ！ 今日も寝ぐせが元気だな！');
    await E.say('kanata', 'おはよ、ダイスケさん。……朝からラーメン？');
    await E.say('c0_daisuke:grin', '夜勤明けにはこれよ！ トメさんの「星屑ダシ」が、五臓六腑にしみるんだ！');
    await E.move('player', [[14, 7], [7, 7], [7, 6]], { face: 'up' });
    await E.say('tome', 'ほれ、朝ごはん。歩きながら食いな。');
    await E.give('onigiri', 2, { wait: true });
    await E.say('kanata:smile', 'やった、ばあちゃんの星屑おにぎり！');
    await E.say('tome', '一個はルウちゃんのぶんだよ。どうせあの子も、朝なんか食べてないんだから。');
    await E.say('tome:serious', 'それと……そのスパナ。');
    await E.say('tome', '父ちゃんの形見だ。なくすんじゃないよ。');
    await E.say('kanata', 'わかってるって。……肌身はなさず、だろ。');
    await E.say('tome', 'ふん。わかってりゃいいのさ。');
    await E.say('mother', '……ツヅイテノ、ニュースデス。昨夜、コロニー各地デ観測サレタ微弱ナ振動ニツイテ、マザーハ現在、原因ヲ調査中デス。', { name: 'テレビ（マザー）' });
    await E.say('c0_ume', 'あらやだ、また揺れの話かい。夜中に湯のみがカタカタ鳴ってねえ。');
    await E.say('c0_daisuke', '工場のクレーンも、ちょっと揺れたんだよなあ。……ま、マザーが調べてるなら安心か！');
    E.emote('w_tome', '…');
    await E.wait(40);
    await E.say('tome:serious', '……。');
    await E.say('kanata', 'ばあちゃん？');
    await E.say('tome:angry', 'ほら、ぼさっとしてないで！ 遅刻するよ！ 学校は北だ、大通りをまっすぐ！');
    setPh(1);
    E.objective('第三中学校へ登校する（ミナト区の大通りを北へ）');
    E.cut(false);
  };

  C0.dinner = async function () {
    E.cut(true);
    E.time('night');
    await E.wait(20);
    await E.say('tome', 'カナタ！ ……おかえり。揺れ、大丈夫だったかい。');
    await E.say('kanata', 'うん、ルウも無事。……ばあちゃんこそ。');
    await E.say('tome', '鍋がちょいと跳ねたくらいさ。それより手ぇ洗って、手伝いな。サブローさんの替え玉だよ！');
    await E.say('w_taxi', 'わりいな、カナタ。揺れでタクシーが止まっちまってよ。客もいねえし、やけ食いだ。');
    await E.move('player', [[7, 7], [9, 7], [9, 4]], { face: 'left' });
    await E.say('tome', 'いいかい、麺は湯の中で踊らせる。スープは静かに。具はやさしく。……ほら、やってみな！');
    const sc = await E.timing({ title: '星屑ラーメン作り', rounds: 3, speed: 1.4, zone: 0.2, labels: ['麺をゆでる！（湯切りのタイミング）', 'スープを注ぐ！', 'チャーシューとネギをのせる！'] });
    E.set('c0_ramen', sc);
    if (sc === 3) {
      await E.say('w_taxi:surprise', 'ズズッ……！ うめえ！ トメさんの味そのまんまだ！');
      await E.say('tome:smile', 'ふん、まあまあだね。……ほんの少しだけ、父ちゃんより上手いかもしれないよ。');
      await E.say('w_taxi', 'ほらよ、カナタ。チップだ。');
      E.money(60);
    } else if (sc >= 1) {
      await E.say('w_taxi', 'ズズッ……うん、うまい！ ちょっと麺がやわらかいけど、それもまた良し！');
      await E.say('tome', '湯切りが甘いね。……ま、修行あるのみさ。');
      E.money(20);
    } else {
      await E.say('w_taxi', 'ズ……ズズ……。うん、まあ……腹にはたまる！');
      await E.say('tome:angry', '……麺がのびて、スープがこぼれて、チャーシューが裏返ってるよ。どうやったらこうなるんだい。');
      await E.say('kanata', 'なんとかなると思ったんだけどなあ……。');
    }
    await E.fadeOut(30);
    E.remove('w_taxi');
    E.teleport('player', 5, 6, 'up');
    E.move('w_tome', 'R', { noWait: true });
    await E.wait(10);
    await E.fadeIn(30);
    await E.say(null, '店じまいのあと。カウンターで、ばあちゃんと二人きりのまかない。');
    await E.say('tome', 'さ、食いな。');
    await E.say('kanata:smile', 'いただきます！');
    await E.say(null, 'ズルズル……。湯気の向こうで、ばあちゃんが黙ってお茶をすすっている。');
    await E.say('kanata', '……ねえ、ばあちゃん。今日の揺れ、本当に「調整」なのかな。');
    await E.say('tome', 'マザーがそう言うんなら、そうなんだろうさ。……表向きはね。');
    await E.say('kanata:surprise', '表向き？');
    await E.say('tome', 'なんでもないよ。');
    await E.say('kanata', '慰霊碑のところで、ゴンゾウさんが言ってた。「10年前と同じ揺れだ」って。');
    await E.say('tome:serious', '……ゴンゾウのやつ、子どもに余計なことを。');
    E.emote('w_tome', '…');
    await E.wait(30);
    await E.say('kanata', '父さんも……AFに乗ってたんだよね。技術者だったけど、テストパイロットもしてたって。');
    await E.say('tome', '……ああ。あの子は、作るのも乗るのも好きだった。');
    await E.say('tome', 'あんたの父ちゃんもね、空ばっかり見てる子だったよ。ニセモノだろうがなんだろうが、空があれば上を向いてた。');
    await E.say('tome:smile', '……似てきたね、カナタ。');
    await E.say('kanata:sad', '……。');
    await E.say('tome', 'ジンのワークフレーム、ドクのところに預けっぱなしだろ。あのポンコツ。');
    await E.say('kanata', '「ポンコツ号」な。オレがつけた名前。……いつか、直したいんだ。直して、動かしたい。');
    await E.say('tome', 'ふん。……スクラップ・ベイには近ごろ、柄の悪いのがうろついてるらしい。行くなら、明るいうちにしな。');
    E.emote('player', '!');
    await E.say('kanata:smile', '……！ うん！');
    await E.say('tome', 'さ、食ったら寝な。明日も学校だよ。……おやすみ、カナタ。');
    await E.say('kanata', 'おやすみ、ばあちゃん。ごちそうさま！');
    setPh(8);
    E.heal();
    E.objective('2階の部屋に戻って休む');
    E.cut(false);
  };

  // ===============================================================
  //  ミナト区（登校・帰り道）
  // ===============================================================
  const commute = () => ch0() && (ph() === 1 || ph() === 6 || ph() === 7);
  const wrongWay = () =>
    ph() === 1
      ? [['kanata', 'こっちは学校と反対だ。遅刻したら、バルガス先生に殺される……！']]
      : ph() === 6
      ? [['ruu', 'ちょっと、どこ行くの。公園はあっち、東のほうだよ。']]
      : [['kanata', '……今日はもう、まっすぐ帰ろう。ばあちゃんが心配してる。']];
  G.addToMap('minato', {
    npcs: [
      // 揺れのあとの町の人
      {
        id: 'c0_mom', char: 'c0_mom', x: 23, y: 21, dir: 'down', move: 'still', show: () => ch0() && ph() >= 6 && ph() <= 7,
        talk: async () => {
          await E.say('c0_mom', 'こわかったわねえ……。棚の缶詰が、ぜんぶ落ちてきたのよ。');
          await E.say('c0_mom', 'でも、マザーが「調整」だって言ってるんだもの。だいじょうぶ……よね？');
        },
      },
      {
        id: 'c0_kid', char: 'c0_kid', x: 24, y: 21, dir: 'down', move: 'still', show: () => ch0() && ph() >= 6 && ph() <= 7,
        talk: async () => {
          await E.say('c0_kid', 'にいちゃん、見た！？ 空がね、ぐにゃってしたんだよ！ 水たまりに石なげたみたいに！');
          await E.say('c0_kid', 'ママは「見まちがい」って言うけど、ぼく、ぜったい見たもん。');
        },
      },
      {
        id: 'c0_courier', char: 'c0_courier', x: 42, y: 21, dir: 'down', move: 'still', show: () => ch0() && ph() >= 6 && ph() <= 7,
        talk: async () => {
          await E.say('c0_courier', '配達ドローンが、全部いっぺんに墜ちちまった。マザーのネットワークごと、一瞬落ちたらしい。');
          await E.say('c0_courier', 'この仕事して8年だけど、こんなの初めてだ。……「調整」ねえ。');
        },
      },
      {
        id: 'c0_otherjk', char: 'c0_otherjk', x: 33, y: 11, dir: 'right', move: 'still', show: () => ch0() && ph() >= 6 && ph() <= 7,
        talk: async () => {
          await E.say('c0_otherjk', '今の、地震？ コロニーに地震ってあるの？ ……ねえ、ないよね？');
          await E.say('c0_otherjk', 'お母さんにメッセージ送ったのに、ぜんぜん届かないの。マザーの回線、混んでるのかな……。');
        },
      },
      {
        id: 'c0_oldman', char: 'c0_oldman', x: 42, y: 14, dir: 'right', move: 'still', show: () => ch0() && ph() >= 6 && ph() <= 7,
        talk: async () => {
          await E.say('c0_oldman', '……ほう、ほう。ずいぶん揺れたのう。');
          await E.say('c0_oldman', 'わしの若いころ、コロニーが揺れるのは「外」で戦があるときと決まっておった。……いや、昔の話じゃよ。');
        },
      },
    ],
    events: [
      // 寄り道を止める
      { x: 1, y: 22, w: 1, h: 3, cond: commute, run: turnBack('R', wrongWay) },
      { x: 70, y: 22, w: 1, h: 3, cond: commute, run: turnBack('L', wrongWay) },
      { x: 34, y: 46, w: 4, h: 1, cond: commute, run: turnBack('U', wrongWay) },
      // ルウがスケボーで追い抜いていく
      {
        x: 32, y: 14, w: 12, h: 1, once: 'c0_ruu_pass', cond: () => at(1),
        run: async () => await C0.ruuPass(),
      },
      // 慰霊碑（公園に入ったら）
      {
        x: 47, y: 9, w: 23, h: 11, once: 'c0_monument', cond: () => at(6),
        run: async () => await C0.monument(),
      },
    ],
    onEnter: async () => {
      if (!ch0()) return;
      if (ph() === 1 && !E.flag('c0_minato_intro')) {
        E.set('c0_minato_intro');
        await E.wait(10);
        await E.say('kanata', 'よし……走れば間に合う、はず！');
        await E.notice('【ヒント】Xでダッシュ。第三中学校は、大通りをまっすぐ北へ。\n町の人に話しかけてみるのもいい。');
      }
      if (ph() === 5) await C0.quake();
    },
  });

  C0.ruuPass = async function () {
    E.cut(true);
    const p = E.get('player');
    const x = G.clamp(p.tx === 37 ? 36 : p.tx + 1, 34, 37);
    E.se('dash');
    const ruu = E.npc({ id: 'c0_ruu_sk', char: 'ruu', x, y: 22, dir: 'up' });
    E.move('c0_ruu_sk', [[x, 11]], { speed: 3.4, noWait: true });
    C0.trail('c0_ruu_sk');
    await E.wait(30);
    E.emote('player', '!');
    await G.tasks.until(() => !ruu.path || !ruu.path.length);
    E.face('c0_ruu_sk', 'down');
    E.face('player', 'up');
    await E.say('ruu:grin', 'おっそーい！ おはよ、カナタ。今日もギリギリじゃん。');
    await E.say('kanata', 'ルウ！ 歩道でスケボーは禁止だろ。');
    await E.say('ruu', 'ここ車道だし。っていうか、マザーの無人バスしか走ってないじゃん、この道。');
    await E.say('ruu:serious', 'それより今日、シミュレーター実習でしょ。……今日こそ、あんたを抜くから。');
    const opts = ['競争だ！ 校門まで！'];
    if (E.has('onigiri')) opts.push('その前に、おにぎり食う？');
    opts.push('お手やわらかに……');
    const i = await E.ask('ruu', 'で？ 学年1位さんは、なんか言うことある？', opts);
    const pick = opts[i];
    if (pick.startsWith('競争')) {
      E.set('c0_race');
      await E.say('ruu:grin', 'へえ、生意気。じゃ、負けたほうが購買のメロンパンおごりね！');
      await E.say('ruu', 'よーい……ドン！');
    } else if (pick.startsWith('その前に')) {
      E.set('c0_gave_onigiri');
      E.take('onigiri', 1);
      await E.say('ruu:surprise', '……え、くれんの？ これ、トメばあちゃんの？');
      await E.say('ruu:shy', 'べ、別にお腹すいてたわけじゃないし。……もらっとく。');
      await E.say(null, 'ルウはおにぎりを一口で半分かじった。');
      await E.say('ruu:smile', 'ん、うまっ。……トメばあちゃんに、ありがとって言っといて。');
      await E.say('ruu:grin', 'お礼にハンデあげる。……先に行ってるね！');
    } else {
      await E.say('ruu:grin', 'やだ。全力でたたきつぶす。');
    }
    E.se('dash');
    E.move('c0_ruu_sk', [[x, 0]], { speed: 3.6, noWait: true });
    C0.trail('c0_ruu_sk');
    await E.wait(50);
    E.remove('c0_ruu_sk');
    await E.say('kanata', '……朝から元気だな、あいつ。');
  };

  C0.quake = async function () {
    E.cut(true);
    await E.wait(40);
    await E.say('ruu', 'ねえ、カナタ。今日の夕方の空、ちょっとピンクっぽくない？');
    await E.say('kanata', 'ミラーの角度のせいだろ。マザーが「夕焼け」って呼んでるやつ。');
    await E.say('ruu', '知ってる。……でも、本物の夕焼けって、もっと燃えるみたいな色らしいよ。');
    await E.wait(30);
    E.se('quake');
    E.shake(2, 50);
    await E.wait(50);
    E.emote('player', '?');
    E.emote('f_ruu', '?');
    await E.say('kanata', '……ん？');
    E.stopBgm();
    E.se('quake');
    E.tint('rgba(255,60,110,0.10)');
    E.shake(9, 160);
    await E.wait(20);
    E.se('quake');
    E.emote('player', '!');
    E.emote('f_ruu', '!');
    await E.say('ruu:surprise', 'わっ……な、なに！？ 揺れてる！？');
    await E.say('kanata:surprise', 'ルウ、つかまれ！');
    E.shake(7, 120);
    E.se('explode');
    await E.say(null, '地面が——いや、コロニーそのものが、低くうなっている。');
    await E.say(null, '街灯がいっせいに明滅し、どこかでガラスの割れる音がした。');
    E.flash(5);
    await E.wait(40);
    E.tint(null);
    await E.wait(60);
    E.se('echo');
    await E.say('mother', 'ピンポンパンポーン。……クレイドル7ノ皆サン。只今ノ振動ハ、コロニー回転軸ノ、定期調整ニヨルモノデス。');
    await E.say('mother', '危険ハアリマセン。ゴ安心クダサイ。……マザーハ、イツモ皆サンヲ見守ッテイマス。');
    await E.say('ruu:serious', '……定期調整？ そんなの、聞いたことない。');
    await E.say('kanata', '……オレも。');
    await E.say('ruu:serious', 'ねえ、カナタ。今……空が、ゆがまなかった？');
    await E.say('kanata:surprise', 'ルウも見たのか？ 水面みたいに、ぐにゃって……。');
    await E.say('ruu', '……公園のほう、人が集まってる。慰霊碑のあたり。');
    await E.say('ruu', 'ちょっと、行ってみよ。');
    E.bgm('tension');
    setPh(6);
    E.set('c0_quake');
    E.reload();
    E.objective('公園の慰霊碑へ行く（ミナト区の東）');
    E.cut(false);
  };

  C0.monument = async function () {
    E.cut(true);
    await E.fadeOut(14);
    E.teleport('player', 57, 12, 'up');
    await E.wait(2);
    E.move('f_ruu', [[59, 12]], { noWait: true });
    E.face('w_veteran', 'down');
    await E.fadeIn(14);
    await E.wait(20);
    await E.say('w_veteran', '……この揺れ。10年前と同じだ。');
    await E.say('kanata', 'ゴンゾウさん？');
    E.face('f_ruu', 'up');
    await E.say('w_veteran', '軌道戦争の終わりごろだ。コロニーに「アレ」が運びこまれた夜も、こんなふうに地の底がうなった。');
    await E.say('ruu', 'アレって？');
    await E.say('w_veteran', '……さあな。わしら下っ端には、なにも知らされなかった。');
    await E.say('w_veteran', 'ただ、あの夜から空の色が少しだけ変わったと……星屑亭のトメさんが、そう言っておったよ。');
    await E.say('kanata:surprise', 'ばあちゃんが？');
    await E.say('w_veteran', 'いや……年寄りの昔話だ。忘れてくれ。');
    await E.say('w_veteran', 'お前さんたち、早く家に帰りなさい。今夜は、あまり空を見上げないほうがいい。');
    E.face('w_veteran', 'up');
    await E.wait(30);
    await E.say(null, '慰霊碑には、たくさんの名前が刻まれている。「星の海に散った、すべての人々へ」。');
    E.face('f_ruu', 'left');
    await E.say('ruu', '……ねえ。カナタのお父さんの名前、ここにある？');
    await E.say('kanata', 'ないよ。父さんは事故で「行方不明」だから。……死んだって決まったわけじゃない。');
    await E.say('ruu:sad', '……そっか。ごめん。');
    await E.say('kanata:smile', 'いいって。なんとかなるって。');
    await E.say(null, '自分で言っておきながら、その言葉は、いつもより少しだけ軽く聞こえた。');
    await E.wait(20);
    E.bgm('title');
    await E.say('ruu', 'じゃ、あたしこっちだから。ひだまり園、門限うるさいんだよね。');
    await E.say('ruu', '……ねえ、カナタ。もしさ。本当に空が落ちてきたら、どうする？');
    const i = await E.ask('ruu', 'ニセモノの空が、ぜんぶ。', ['受けとめる', '逃げる', 'いっしょに見る']);
    E.set('c0_fall', i + 1);
    if (i === 0) {
      await E.say('kanata', '受けとめる。……スパナで。');
      await E.say('ruu:grin', 'ぷっ……スパナで？ バカじゃないの。');
      await E.say('ruu:smile', '……でも、あんたならやりそう。');
    } else if (i === 1) {
      await E.say('kanata', '逃げる。全力で。');
      await E.say('ruu:grin', '正直か。……ま、そのときはあたしが手、引っぱってあげる。あんた、のんびりだし。');
    } else {
      await E.say('kanata', 'いっしょに見る。……落ちてくる空なんて、たぶん一生に一回しか見られないし。');
      await E.say('ruu:surprise', '……。');
      await E.say('ruu:smile', '……うん。それ、いいね。ニセモノの空が落ちたら、その向こうに本物があるかもしれないし。');
    }
    await E.say('ruu:grin', 'また明日。……遅刻すんなよ！');
    E.leave('ruu');
    E.npc({ id: 'c0_ruu_bye', char: 'ruu', x: 59, y: 12, dir: 'down' });
    E.se('dash');
    E.move('c0_ruu_bye', [[59, 13], [62, 13], [62, 19], [62, 21], [70, 21]], { speed: 2.6, noWait: true });
    C0.trail('c0_ruu_bye');
    await E.wait(70);
    E.remove('c0_ruu_bye');
    await E.say('kanata', '……空が落ちてきたら、か。');
    setPh(7);
    E.bgm('town');
    E.objective('星屑亭に帰る（ミナト区・商店街の西）');
  };

  // ===============================================================
  //  第三中学校
  // ===============================================================
  G.addToMap('school_yard', {
    events: [
      {
        x: 21, y: 38, w: 4, h: 1, cond: () => ch0() && ph() >= 2 && ph() <= 4,
        run: turnBack('U', [['kanata', '授業をサボるわけにはいかない。……バルガス先生、地の果てまで追いかけてくるし。']]),
      },
    ],
    onEnter: async () => {
      if (at(1)) await C0.gate();
    },
  });

  C0.gate = async function () {
    E.cut(true);
    E.npc({ id: 'c0_vargas_g', char: 'vargas', x: 22, y: 34, dir: 'down' });
    E.npc({ id: 'c0_ruu_g', char: 'ruu', x: 24, y: 35, dir: 'left' });
    await E.wait(10);
    E.shake(3, 16);
    await E.say('vargas:angry', '春瀬カナタ！ 遅刻……1秒前！！');
    await E.say('kanata:surprise', 'セーフ！ セーフですよね、先生！');
    await E.say('vargas', 'セーフだ！ だが廊下は走るなよ！ 走るなら全力で走れ！');
    await E.say(null, '（どっちなんだ……）');
    if (E.flag('c0_race')) {
      await E.say('ruu:grin', 'はい、あたしの勝ち。メロンパン、よろしく～。');
      await E.say('kanata', 'スケボーはずるいだろ……。');
    } else if (E.flag('c0_gave_onigiri')) {
      await E.say('ruu:smile', 'おにぎり、ごちそうさま。……ちょっとだけ、手加減してあげてもいいかな。シミュレーター。');
    } else {
      await E.say('ruu', 'おっそ。ほんと、のんびり屋なんだから。');
    }
    E.face('c0_vargas_g', 'right');
    await E.say('vargas:angry', '水無月！ 貴様はまたスケボーで登校したな！ 校則……ええと、第何条だったか……');
    E.npc({ id: 'c0_yui_g', char: 'yui', x: 22, y: 30, dir: 'down' });
    await E.move('c0_yui_g', [[22, 33], [23, 33]], { face: 'down' });
    await E.say('yui', '校則第14条、「校内および通学路における、危険な乗り物の使用禁止」です、先生。');
    await E.say('ruu:angry', 'げっ、委員長。');
    await E.say('yui', 'おはようございます、水無月さん。反省文、三枚。');
    E.face('c0_yui_g', 'left');
    await E.say('yui', '春瀬くんは……遅刻ではないので、セーフです。……ぎりぎりですけど。');
    await E.say('kanata', '委員長、毎朝ここで見張ってるの？');
    await E.say('yui:shy', '見張ってなんかいません。……たまたま、です。');
    await E.say('vargas:grin', 'よし、全員そろったな！ さあ入れ入れ！ 1時間目は、お待ちかねのAFシミュレーター実習だ！');
    E.move('c0_vargas_g', [[22, 10]], { speed: 1.4, noWait: true });
    E.move('c0_yui_g', [[23, 10]], { speed: 1.3, noWait: true });
    E.move('c0_ruu_g', [[24, 33], [24, 10]], { speed: 1.5, noWait: true });
    await E.wait(80);
    E.remove('c0_vargas_g');
    E.remove('c0_yui_g');
    E.remove('c0_ruu_g');
    setPh(2);
    E.objective('2年B組の教室へ（校舎に入り、廊下の「2-B」の扉）');
  };

  G.addToMap('school_hall', {
    npcs: [
      // 購買の人だかり（昼休み）
      { id: 'c0_st1', char: 'c0_st1', x: 43, y: 5, dir: 'up', move: 'still', show: () => at(3), talk: async () => E.say('c0_st1', 'メロンパン……メロンパン……！') },
      { id: 'c0_st2', char: 'c0_st2', x: 44, y: 6, dir: 'up', move: 'still', show: () => at(3), talk: async () => E.say('c0_st2', '今日のメロンパンは、ミラー光で焼いた限定品なの！ 外はカリッ、中はふわっ！') },
      { id: 'c0_st3', char: 'c0_st3', x: 45, y: 5, dir: 'up', move: 'still', show: () => at(3), talk: async () => E.say('c0_st3', 'どけどけ2年坊！ 3年の昼メシは戦争だ！') },
      { id: 'c0_st4', char: 'c0_st4', x: 46, y: 6, dir: 'up', move: 'still', show: () => at(3), talk: async () => E.say('c0_st4', 'う、うしろから押さないでくださいぃ……！') },
      { id: 'c0_st5', char: 'c0_st5', x: 47, y: 5, dir: 'up', move: 'still', show: () => at(3), talk: async () => E.say('c0_st5', '購買歴2年のわたしが断言するわ。勝負は「おばちゃんが袋を開けた瞬間」よ。') },
      { id: 'c0_ponta_h', char: 'ponta', x: 42, y: 7, dir: 'right', move: 'still', show: () => at(3), talk: async () => E.say('ponta', 'カナタ！ こっちっす！ 作戦会議っす！') },
      // 新聞部のミミ（序章）
      {
        id: 'c0_mimi', char: 'mimi', x: 40, y: 12, dir: 'down', move: 'still', show: () => ch0() && ph() >= 4,
        talk: async () => {
          if (ph() === 4) {
            await E.say('mimi', '先輩、屋上はあっちっすよ！ 廊下の左のはしっこの階段っす！');
            return;
          }
          if (!E.flag('c0_mimi_after')) {
            E.set('c0_mimi_after');
            await E.say('mimi', 'あっ、春瀬先輩！ 新聞部へようこそっす！ ……部員、ミミひとりっすけど！');
            await E.say('mimi', '見てくださいっす、これ。昼休みの「メロンパン争奪戦・決死のダイブ」！ 来週の一面っす！');
            await E.say('kanata', '……オレ、すごい顔してるな。');
            await E.say('mimi', 'それがいいんすよ！ 報道は真実を写すっす！');
            await E.say('mimi', 'ミミの夢はっすね、いつかコロニー中がひっくり返るような大スクープを撮ることっす。');
            await E.say('mimi:serious', 'マザーの発表しかないニュースなんて、つまんないっすもん。');
            return;
          }
          await E.say('mimi', G.pick(['スクープの匂いがしたら、いつでも教えてくださいっす！ 謝礼は……メロンパンの耳で！', '最近、夜中に変な光が飛んでるって噂があるっす。UFOっすかね！？ コロニーの中なのに！', 'ルウ先輩、写真撮ろうとするとすっごい顔でにらむんすよ。……でも、笑うとかわいいんす。これは極秘情報っす。']));
        },
      },
    ],
    events: [
      // 屋上は昼休みまで
      {
        x: 2, y: 3, w: 2, h: 1, cond: () => ch0() && ph() < 4,
        run: turnBack('D', () => [['kanata', ph() === 3 ? '屋上は、メロンパンを手に入れてからだ。' : 'まずは教室に行かないと。ホームルームが始まる！']]),
      },
      // メロンパン争奪戦
      {
        x: 40, y: 3, w: 2, h: 6, once: 'c0_pan_scene', cond: () => at(3),
        run: async () => await C0.melonpan(),
      },
    ],
  });

  G.addToMap('classroom', {
    npcs: [
      {
        id: 'c0_ruu_c', char: 'ruu', x: 14, y: 9, dir: 'up', move: 'still', show: () => at(2) || (at(5) && !E.flag('c0_ruu_join')),
        talk: async () => {
          if (ph() === 2) return E.say('ruu:serious', '……今日は負けないから。ゴーグルのベルト、きつめに締めときなよ。');
          await E.say('ruu', 'なに？ 帰るんでしょ。');
        },
      },
      {
        id: 'c0_ponta_c', char: 'ponta', x: 17, y: 9, dir: 'up', move: 'still', show: () => at(2) || at(5),
        talk: async () => {
          if (ph() === 2) {
            await E.say('ponta', '今日のシミュレーター、新しい訓練プログラムが入ったらしいっす！ オイラ、ゆうべ眠れなかったっす！');
            return;
          }
          if (!E.flag('c0_ponta_after')) {
            E.set('c0_ponta_after');
            await E.say('ponta', 'カナタ、今日のあれ、すごかったっす！ 最後のターゲットに、ブーストで回りこんでからのゼロ距離！');
            await E.say('ponta', '旧式の作業フレームの推力で、あの旋回半径……！ 計算が合わないっす！ ぶっひゃー！');
            await E.say('kanata', 'ポンタこそ、射撃の命中率はクラスで一番だったろ。');
            await E.say('ponta:shy', 'えへへ……オイラ、体がでかいから避けるのは苦手っすけど、照準を合わせるのは好きなんす。');
            await E.say('ponta', 'オイラ、将来は整備士になりたいんす。最高の機体を組んで、最高のパイロットに乗ってもらうのが夢っす！');
            await E.say('ponta:grin', 'そのときは、カナタが乗ってくれるっすか？');
            const i = await E.ask('kanata', '……', ['もちろん', 'ルウのほうが向いてるかも']);
            if (i === 0) await E.say('ponta:grin', 'ぶっひゃー！ 約束っすよ！ 指切りっす！');
            else await E.say('ponta', 'ルウはたぶん、機体を壊すっす……。整備士泣かせっす……。');
            return;
          }
          await E.say('ponta', 'オイラは店の手伝いがあるから、先に帰るっす。ポン湯、今日は「宇宙ラベンダーの湯」っすよ！ 今度来るっす！');
        },
      },
      {
        id: 'c0_yui_c', char: 'yui', x: 6, y: 7, dir: 'up', move: 'still', show: () => ch0() && ph() >= 2 && ph() <= 5,
        talk: async () => {
          if (ph() === 2) return E.say('yui', '春瀬くん、着席してください。ホームルームまであと30秒です。');
          if (ph() === 3 || ph() === 4) {
            if (!E.flag('c0_yui_lunch')) {
              E.set('c0_yui_lunch');
              await E.say('yui', '……なんですか。お弁当を見ないでください。');
              await E.say(null, 'ユイのお弁当は、ものすごく豪華だ。三段重ねで、エビが光っている。');
              await E.say('yui:shy', '……家の料理人さんが作ってくれるんです。わたしは、購買のパンでいいって言ってるのに。');
              await E.say('yui', '……メロンパン、一度でいいから争奪戦で勝ってみたいな、なんて。な、なんでもありません。');
              return;
            }
            return E.say('yui', '昼休みの屋上は、立ち入り自由です。……ただし、フェンスに登ったら校則違反ですからね。');
          }
          if (!E.flag('c0_yui_after')) {
            E.set('c0_yui_after');
            await E.say('yui', '春瀬くん。シミュレーターの成績、おめでとうございます。');
            await E.say('yui', '……でも、ああいう無茶な機動は、本物の機体でやったら関節が壊れますからね。');
            await E.say('kanata', '委員長、詳しいね。');
            await E.say('yui:shy', '父の仕事の関係で、少しだけ。……コロニーの行政には、AFの管理も含まれるので。');
            await E.say('yui:serious', '最近、父の帰りがずっと遅いんです。……今日の揺れのことも、何か知ってるのかな。');
            await E.say('yui', '……すみません、関係ない話でした。気をつけて帰ってくださいね。');
            return;
          }
          await E.say('yui', '寄り道はほどほどに。……校則第21条です。');
        },
      },
    ],
    onEnter: async () => {
      if (at(2)) await C0.homeroom();
    },
  });

  // ---- ホームルーム → シミュレーター実習 → 昼休み ----
  C0.homeroom = async function () {
    E.cut(true);
    await E.wait(10);
    E.face('c0_ponta_c', 'down');
    await E.say('ponta', 'カナタ！ ぶっひゃー、ギリギリセーフっす！');
    await E.say('ponta', '聞いたっすか！？ 今日のシミュレーター、新しい訓練プログラムが入ったんすよ！ しかも、敵の機体データは公安の最新型〈ガードナー〉！');
    await E.say('ponta', 'モノアイ式の複合センサー、推力重量比1.3、装甲は第三世代の複合セラミック、腰部ラッチは……');
    await E.say('kanata', 'ポンタ、ポンタ。息して。');
    await E.say('ponta:shy', 'ぶっひゃー、つい！ オイラ、スペック表を見ると止まらなくなるんすよ。');
    E.face('c0_yui_c', 'down');
    await E.say('yui', '権田くん、春瀬くん。ホームルーム前です。着席してください。');
    await E.move('player', [[20, 13], [19, 13], [19, 9], [6, 9]], { face: 'up' });
    await E.say('yui', '……春瀬くん、寝ぐせ。校則第8条「身だしなみは清潔に」。');
    await E.say('kanata', 'これは寝ぐせじゃなくて、個性で……。');
    await E.say('yui', '個性は、校則では保護されていません。');
    E.face('c0_yui_c', 'up');
    E.face('c0_ponta_c', 'up');
    await E.say(null, 'キーンコーン、カーンコーン……。');
    const v = E.npc({ id: 'c0_vargas_c', char: 'vargas', x: 20, y: 14, dir: 'up' });
    await E.move('c0_vargas_c', [[20, 13], [19, 13], [19, 5], [13, 5], [13, 3], [11, 3]], { speed: 1.5, face: 'down' });
    await E.say('vargas', '起立！ 礼！ 着席！');
    await E.say('sys', 'おはようございまーす！', { name: '2年B組のみんな' });
    await E.say('vargas:grin', 'うむ、いい声だ！ 今日の1時間目は、お待ちかねのAFシミュレーター実習だ！');
    await E.say('w2_takashi', 'よっしゃー！ 先生、今日こそ「赤い悪魔」の機動を見せてくださいよ！');
    await E.say('vargas:angry', '誰が赤い悪魔だ！ ……ゴホン。');
    await E.say('vargas:serious', 'いいか、よく聞け。アームド・フレームは兵器じゃない。……少なくとも、この中立コロニーではな。');
    await E.say('vargas', 'あれは作業機だ。人の手が届かない場所に、手を届かせるための機械だ。');
    await E.say('vargas:serious', 'だが、扱いを間違えれば人が死ぬ。だから訓練する。……先生も昔、それを思い知った。');
    await E.say('vargas', '全員、ゴーグルを装着！ 神経同調、開始！');
    E.face('c0_ruu_c', 'left');
    await E.say('ruu:serious', 'カナタ。勝負だからね。');
    await E.say('kanata:smile', 'なんとかなるって。');
    E.se('boot');
    await E.fadeOut(30, '#ffffff');
    // ---- 仮想空間 ----
    await E.warp('c0_sim', 18, 18, 'up', { noFade: true, noEnter: true });
    await E.fadeIn(40);
    E.cut(true);
    await E.say(null, '——視界が、光の格子に塗りかえられていく。');
    await E.say('vargas', '……聞こえるか、春瀬！ ここは仮想訓練空間〈VR-7〉。今のお前は、データでできたアバターだ。', { name: 'バルガス先生（通信）' });
    await E.say('vargas', 'まずは生身の基礎反応テストだ。AFの操縦も、結局は人間の反射神経がものを言う！', { name: 'バルガス先生（通信）' });
    await E.notice('【戦闘】Z：攻撃（連打で3段コンボ）\nX：ダッシュ（ダッシュ中は無敵。敵の弾をかわせる）');
    const t0 = G.state.play;
    E.cut(false);
    await E.battle({
      map: 'c0_sim', x: 18, y: 18, dir: 'up', party: false, bgm: 'battle',
      title: 'PROGRAM 01', sub: '基礎反応テスト ― ターゲットをすべて破壊せよ',
      waves: [
        [{ type: 'drone', x: 12, y: 6, name: 'ターゲット・ドローン' }, { type: 'drone', x: 18, y: 5, name: 'ターゲット・ドローン' }, { type: 'drone', x: 24, y: 6, name: 'ターゲット・ドローン' }],
        [{ type: 'rat', x: 10, y: 10, name: 'ホロ・ラット' }, { type: 'rat', x: 26, y: 10, name: 'ホロ・ラット' }, { type: 'bot', x: 18, y: 6, name: 'ターゲット・ボット' }],
      ],
      onStart: noReward,
      onWave: noReward,
      returnTo: ['c0_sim', 18, 18, 'up'],
    });
    E.cut(true);
    E.heal();
    await E.say('vargas', 'よし、反応は上々だ！ 次はいよいよAF操縦だ。訓練フレーム、転送！', { name: 'バルガス先生（通信）' });
    E.se('boot');
    E.flash(10);
    G.field.player.setMech(true, 'c0_trainer');
    await E.wait(20);
    await E.say('kanata', '……来た。この感じ。');
    await E.say(null, 'コクピットのシートが背中を包む。レバーを握ると、指先から機体の重さが伝わってくる。');
    await E.notice('【機体操作】Z：ビームライフル（押しっぱなしで連射）\nX：ブースト（高速移動・回避）　C：ヒートスパナ（近接攻撃・強力）');
    E.cut(false);
    await E.battle({
      map: 'c0_sim', x: 18, y: 18, dir: 'up', mech: true, mechId: 'c0_trainer', bgm: 'mech',
      title: 'PROGRAM 02', sub: 'AF操縦訓練 ― ダミー・フレームを撃破せよ',
      waves: [
        [
          { type: 'junker', x: 12, y: 6, hp: 45, name: 'ダミー・フレーム', color: { body: '#ff8fc8', accent: '#5a2a6a', frame: '#3a2050', eye: '#ffffff' } },
          { type: 'junker', x: 24, y: 6, hp: 45, name: 'ダミー・フレーム', color: { body: '#ff8fc8', accent: '#5a2a6a', frame: '#3a2050', eye: '#ffffff' } },
        ],
        [{ type: 'guardner', x: 18, y: 5, hp: 90, name: 'ターゲット〈ガードナー型〉', color: { body: '#9ab0ff', accent: '#4a3a9a', eye: '#ff5fa2' } }],
      ],
      onStart: noReward,
      onWave: async () => {
        await noReward();
        E.cut(true);
        await E.say('vargas', '最後は公安の量産機〈ガードナー〉のデータだ！ 射撃が来るぞ、ブーストでかわせ！', { name: 'バルガス先生（通信）' });
        E.cut(false);
      },
      returnTo: ['c0_sim', 18, 18, 'up'],
    });
    const sec = (G.state.play - t0) / 60;
    E.cut(true);
    E.heal();
    await E.say('vargas', '……プログラム終了！ 全員、同調解除！', { name: 'バルガス先生（通信）' });
    E.se('boot');
    await E.fadeOut(30, '#ffffff');
    await E.warp('classroom', 6, 9, 'up', { noFade: true, noEnter: true });
    E.npc({ id: 'c0_vargas_c', char: 'vargas', x: 11, y: 3, dir: 'down' });
    await E.fadeIn(30);
    E.cut(true);
    await E.say('vargas', 'よーし、結果発表だ！');
    await E.say('vargas', '1位、春瀬カナタ！ タイム ' + fmtTime(sec) + '！');
    await E.say('sys', 'おおーっ！', { name: '2年B組のみんな' });
    await E.say('vargas', '2位、水無月ルウ！ タイム ' + fmtTime(sec + 0.83) + '！ 3位、権田ポンタロウ！ タイム ' + fmtTime(sec + 14.6) + '！');
    E.face('c0_ruu_c', 'left');
    E.emote('c0_ruu_c', '💢');
    await E.say('ruu:angry', 'また2位……！ 0.8秒差って何！？');
    await E.say('kanata', 'まあまあ。なんとかなったって。');
    await E.say('ruu:angry', 'それがムカつくの！ のんびりしてるくせに、なんでそんなに速いわけ！？');
    E.face('c0_ponta_c', 'left');
    await E.say('ponta', 'カナタの最後の旋回、まるで軌道戦争のエースっす……！ オイラ、3位でも満足っす！');
    await E.say('vargas', '春瀬。あの最後の機動……あれは、どこで覚えた？');
    await E.say('kanata', 'えっと……家に父さんの古い訓練記録があって。それを見て、真似してるだけです。');
    E.emote('c0_vargas_c', '…');
    await E.wait(40);
    await E.say('vargas:serious', '……そうか。');
    await E.say('vargas', '……いい機動だ。だが、機体を信じすぎるな。機体はお前の命まで守ってはくれん。いいな。');
    E.face('c0_yui_c', 'right');
    await E.say('yui', '水無月さんは、最後に突っこみすぎです。実機だったら、機体の修理代は……学校負担ですけど、それでも、です。');
    await E.say('ruu:angry', 'うっさい、委員長。');
    E.exp(35);
    E.toast('シミュレーター成績ボーナス！', G.UI.gold);
    await E.wait(30);
    await E.fadeOut(30);
    E.remove('c0_vargas_c');
    await E.wait(20);
    await E.cg('black', 'そして、2時間目、3時間目、4時間目——。');
    E.cgOff();
    await E.fadeIn(30);
    await E.say(null, 'キーンコーン、カーンコーン……。昼休みのチャイムが鳴った。');
    E.face('c0_ponta_c', 'left');
    await E.say('ponta', 'カナタ！ 昼休みっすよ！ 今日の購買は、限定メロンパンの日っす！');
    await E.say('ponta', '争奪戦っす！ オイラ、先に行って場所とっとくっす！');
    E.move('c0_ponta_c', [[17, 9], [19, 9], [19, 13], [20, 13], [20, 14]], { speed: 1.6, noWait: true });
    E.face('c0_ruu_c', 'left');
    if (E.flag('c0_race')) await E.say('ruu', 'メロンパン、約束だからね。……あたし、屋上にいるから。');
    else await E.say('ruu', 'あたし屋上いるから。……べ、別に待ってるとかじゃないけど。');
    await E.move('c0_ruu_c', [[15, 9], [15, 11], [19, 11], [19, 13], [20, 13], [20, 14]], { speed: 1.6 });
    E.remove('c0_ruu_c');
    E.remove('c0_ponta_c');
    setPh(3);
    E.objective('購買でメロンパンを手に入れる（廊下の右奥）');
    E.cut(false);
  };

  // ---- メロンパン争奪戦 ----
  C0.melonpan = async function () {
    E.cut(true);
    await E.say('ponta', '来たっすね、カナタ！ 見てくださいっす、この人だかり！');
    await E.say('kanata:surprise', 'うわぁ……戦場だ。');
    await E.say('sys', 'メロンパン！ メロンパンをよこせー！！', { name: '生徒たち' });
    await E.say('w2_obachan', 'はいはい、押さないの！ 限定メロンパン、残りあと3個だよ～！');
    await E.say('ponta', 'オイラが壁になって道をあけるっす！ カナタは、すき間を見て突っこむっす！');
    await E.say('ponta:grin', 'タイミングが命っす！ 行くっすよ……ぶっひゃー！！');
    E.shake(3, 20);
    const n = await E.timing({ title: 'メロンパン争奪戦！', rounds: 3, speed: 1.5, zone: 0.2, labels: ['人波のすき間に飛びこめ！', '手をのばせ！', 'つかみとれ！'], col: '#ffd25e' });
    E.set('c0_pan_score', n);
    if (n > 0) await E.give('melonpan', n, { wait: true });
    if (n === 3) {
      await E.say('w2_obachan:smile', 'あらまあ、三つ全部！？ 今日の勝者は2年の春瀬くんだねえ！');
      await E.say('ponta:grin', 'ぶっひゃー！ 完全勝利っす！ カナタ、オイラのぶんもあるっすか！？');
      await E.say('kanata:smile', 'もちろん。ポンタが道をあけてくれたおかげだし。');
      E.take('melonpan', 1);
      await E.say('ponta:grin', 'いただくっす！ ……うまっ！ カリカリっす！ 友情の味っす！');
      E.set('c0_pan_ruu');
    } else if (n === 2) {
      await E.say('w2_obachan', 'はい、二つね！ まいどあり！');
      await E.say('ponta:sad', 'あれ……オイラのぶんは……。');
      const i = await E.ask('kanata', '一個はルウとの約束……もう一個は……', ['ポンタにあげる', '自分で食べる']);
      if (i === 0) {
        E.take('melonpan', 1);
        await E.say('ponta:grin', 'カナタ……！ 一生ついていくっす！');
        E.set('c0_pan_ponta');
      } else {
        await E.say('ponta', 'うう……オイラは焼きそばパンで我慢するっす……。');
      }
      E.set('c0_pan_ruu');
    } else if (n === 1) {
      await E.say('w2_obachan', 'はい、最後の一個！ 運がいいねえ！');
      await E.say('ponta', 'やったっす！ ……でも、一個だけっすね。');
      await E.say('kanata', '……これは、ルウにあげる約束だから。');
      E.set('c0_pan_ruu');
    } else {
      await E.say('w2_obachan', 'あらあら、売り切れちゃった。……ほら、これはおまけだよ。がんばったからね。');
      await E.give('c0_rusk', 1, { wait: true });
      await E.say('ponta:sad', 'ぶひぃ……完敗っす……。');
    }
    await E.wait(10);
    E.se('ok');
    E.flash(6);
    const m = E.npc({ id: 'c0_mimi_l', char: 'mimi', x: 38, y: 8, dir: 'up' });
    await E.say('mimi', 'スクープの匂い！！');
    await E.move('c0_mimi_l', [[38, 6], [39, 6]], { speed: 1.8 });
    E.face('c0_mimi_l', 'right');
    E.face('player', 'left');
    await E.say('mimi', 'あっ、ども！ 1年の小鳥遊ミミっす！ 新聞部っす！');
    await E.say('mimi', 'いまの「メロンパン争奪戦・決死のダイブ」、ばっちり撮らせてもらったっす！');
    await E.say('kanata:surprise', 'え、撮ったの！？');
    await E.say('mimi', '春瀬先輩っすよね？ シミュレーター学年1位の！ ずっと取材したかったんすよ～！');
    const j = await E.ask('mimi', '先輩、ズバリ聞くっす！ 強さの秘訣は！？', ['なんとかなるって精神', '父さんの訓練記録', 'メロンパン']);
    if (j === 0) {
      await E.say('mimi', '「なんとかなる」……！ 深いっす！ 見出しは「学年1位の極意、それは楽観」っす！');
    } else if (j === 1) {
      await E.say('mimi:serious', 'お父さん、パイロットだったんすか？ ……あ、すいませんっす。ちょっと踏みこみすぎたっす。');
      await E.say('kanata', 'いいよ。技術者だったんだ。……5年前から、行方不明だけど。');
      await E.say('mimi:sad', '……そうだったんすか。この話は、記事にはしないっす。約束っす。');
    } else {
      await E.say('mimi', 'メロンパン！ 「糖分こそパイロットの燃料」……メモメモ……購買のおばちゃんが喜ぶっす！');
    }
    await E.say('mimi', 'あっ、そうだ先輩。ルウ先輩なら、さっき屋上に上がっていったっすよ。なんか、空ばっかり見てたっす。');
    await E.say('mimi', 'ネタがあったら新聞部（廊下の南側の部屋）に来てくださいっす！ スクープの匂いがしたら、いつでも！');
    await E.move('c0_mimi_l', [[38, 6], [38, 9]], { speed: 1.8 });
    E.remove('c0_mimi_l');
    await E.say('ponta', 'オイラはここでパンを食べてくっす。カナタ、ルウによろしくっす！');
    setPh(4);
    E.objective('屋上へ行く（廊下の左はしの階段）');
    E.cut(false);
  };

  // ---- 屋上 ----
  G.addToMap('rooftop', {
    npcs: [
      {
        id: 'c0_ruu_r', char: 'ruu', x: 17, y: 9, dir: 'up', move: 'still', show: () => at(4),
        talk: async () => await C0.rooftop(),
      },
    ],
    onEnter: async () => {
      if (at(4)) await C0.rooftop();
    },
  });

  C0.rooftop = async function () {
    if (E.flag('c0_roof_done')) return;
    E.set('c0_roof_done');
    E.cut(true);
    await E.wait(20);
    E.bgm('title');
    await E.say(null, '屋上には、ミラーの光がまっすぐ降りそそいでいた。');
    await E.move('player', [[6, 10], [16, 10], [16, 9]], { face: 'right' });
    E.face('c0_ruu_r', 'left');
    await E.say('ruu', '……遅い。');
    if (E.flag('c0_pan_ruu') && E.has('melonpan')) {
      await E.say('kanata:smile', 'ほら、メロンパン。限定のやつ。');
      E.take('melonpan', 1);
      await E.say('ruu:surprise', '……え、ほんとに取ってきたの？ あの争奪戦で？');
      await E.say('ruu:shy', '……。……ありがと。');
      await E.say(null, 'ルウはメロンパンを半分にちぎって、大きいほうをカナタに押しつけた。');
      await E.say('ruu:shy', 'はんぶんこ。……あたし、そんなにお腹すいてないし。');
    } else {
      await E.say('kanata', 'ごめん、メロンパン……全滅した。');
      await E.say('ruu', 'ふーん。……ま、期待してなかったし。');
      if (E.has('onigiri')) {
        await E.say('kanata', 'かわりに、ばあちゃんのおにぎりならあるけど。');
        E.take('onigiri', 1);
        await E.say('ruu:smile', '……それ、メロンパンより当たりじゃん。');
      }
    }
    E.face('c0_ruu_r', 'up');
    await E.wait(30);
    await E.cg('rooftop');
    await E.say('ruu', '……ねえ、カナタ。あれ、見える？');
    await E.say('kanata', '向こう側の街？');
    await E.say('ruu', 'そう。真上に、逆さまの街。あそこにも学校があって、屋上があって……たぶん、あたしたちみたいなのが寝転がってる。');
    await E.say('ruu', 'で、その上にも、そのまた上にも、空はない。');
    await E.say('ruu:serious', '……この空、全部ニセモノなんだよ。');
    await E.say('kanata', 'ニセモノ、か。');
    await E.say('ruu', 'ミラーで光を入れて、マザーが青く塗ってるだけ。雨だって、でっかいスプリンクラーみたいなもんじゃん。');
    await E.say('ruu', 'あたしさ、本物の空が見たいんだ。どこまでも上に抜けてて、天井なんかなくて……落ちてきそうなくらい、高いやつ。');
    const i = await E.ask('kanata', '……', ['オレも、見てみたいな', 'でも、オレらの空だろ']);
    E.set('c0_sky', i + 1);
    if (i === 0) {
      await E.say('kanata', 'オレも、見てみたいな。本物の空。');
      await E.say('ruu:smile', 'でしょ！ ……いつか一緒に、外に出よ。約束。');
      await E.say('kanata', '……でもさ。ニセモノでも、オレはこの空、けっこう好きだよ。');
      await E.say('kanata:smile', 'オレらが生まれた空だし。……オレらの空だろ。');
      await E.say('ruu:shy', '……そういうこと、さらっと言うな。');
    } else {
      await E.say('kanata', 'でも、オレらの空だろ。ニセモノでも、オレらが生まれて、育った空だ。');
      await E.say('ruu:angry', 'は？ ……バカじゃないの。');
      await E.say('ruu:shy', '……でも、あんたらしいね。そういうとこ。');
    }
    await E.say('ruu', '……あたしの部屋の窓からはさ、空なんて見えないんだよね。となりのビルの壁だけ。');
    await E.say('kanata', '……。');
    await E.say('ruu:shy', 'あ、今の忘れて。');
    await E.say('ruu', 'カナタは？ 夢とか、ないの？');
    await E.say('kanata', 'オレは……父さんのワークフレームを直したいんだ。スクラップ・ベイの、ドクっていうジャンク屋に預けっぱなしでさ。');
    await E.say('kanata:smile', 'いつか、あれで空を飛ぶ。……ワークフレームって、飛べないけど。');
    await E.say('ruu:grin', 'なにそれ。……ふふっ、いいじゃん。そしたらあたし、助手席ね。');
    await E.say('kanata', 'AFに助手席はないぞ。');
    await E.say('ruu:grin', 'じゃ、肩の上。');
    E.cgOff();
    await E.wait(20);
    E.se('echo');
    E.flash(3);
    E.shake(1, 10);
    await E.wait(30);
    E.emote('c0_ruu_r', '!');
    await E.say('ruu:surprise', '……今、空、チラってしなかった？');
    await E.say('kanata', 'え？ ……気のせいじゃない？');
    await E.say('ruu', '……そっか。そうかもね。');
    await E.wait(20);
    await E.say(null, 'キーンコーン、カーンコーン……。');
    await E.say('ruu:surprise', 'やば、5時間目！ 走るよ、カナタ！');
    await E.say('kanata', '廊下は走るな、走るなら——');
    await E.say('ruu:grin', '全力で走れ！');
    await E.fadeOut(40);
    E.stopBgm();
    await E.cg('black', '午後の授業は、ほとんど頭に入らなかった。\n窓の外の空ばかり、見ていた気がする。');
    E.cgOff();
    // ---- 放課後 ----
    E.time('evening');
    setPh(5);
    await E.warp('classroom', 6, 9, 'up', { noFade: true, noEnter: true });
    E.npc({ id: 'c0_vargas_e', char: 'vargas', x: 11, y: 3, dir: 'down' });
    await E.fadeIn(30);
    E.cut(true);
    await E.say('vargas', '——というわけで、今日はここまで！ 寄り道せずに帰れよ！');
    await E.say('vargas:serious', '……近ごろ、コロニーの揺れがどうとか、妙な噂が多い。暗くなる前に家に着くように。いいな！');
    await E.say('sys', 'はーい！', { name: '2年B組のみんな' });
    await E.move('c0_vargas_e', [[13, 3], [13, 5], [19, 5], [19, 13], [20, 13], [20, 14]], { speed: 1.6 });
    E.remove('c0_vargas_e');
    E.face('c0_yui_c', 'right');
    await E.say('yui', '水無月さん。反省文、三枚。');
    E.face('c0_ruu_c', 'left');
    await E.say('ruu:angry', 'げっ……明日出す！');
    await E.say('yui', '……今日の分は、明日の朝で許してあげます。でも、明日のスケボーは没収ですからね。');
    await E.say('ruu', 'はいはい。……カナタ、帰ろ。途中まで一緒。');
    E.set('c0_ruu_join');
    E.remove('c0_ruu_c');
    E.party(['ruu']);
    E.objective('ルウと一緒に家に帰る（ミナト区の星屑亭）');
    await E.say(null, '（クラスメイトや先生と話してから帰ることもできる）');
    E.cut(false);
  };

  // ---- 職員室のバルガス先生（放課後に呼び止められる） ----
  G.addToMap('staffroom', {
    onEnter: async () => {
      if (!at(5) || E.flag('c0_staff')) return;
      E.set('c0_staff');
      E.cut(true);
      await E.wait(10);
      await E.say('vargas', 'おう、春瀬か。ちょうどいい、こっちへ来い。');
      await E.move('player', [[19, 12], [19, 9], [16, 9]], { face: 'up' });
      E.face('w2_vargas', 'down');
      await E.say('vargas', '……今日の実習の、最後の機動のことだ。');
      await E.say('vargas', '急制動からの逆噴射、半歩だけ左に振ってから右へ旋回する。……あれは、教科書には載っとらん動きだ。');
      await E.say('kanata', '父さんの訓練記録の、まねです。何回も見て、体が覚えちゃって。');
      await E.say('vargas:serious', '……そうか。その記録、大事にしろ。');
      await E.say('vargas', '先生も昔、同盟軍でAFに乗っていた。……あの頃は、ああいう動きができるパイロットに、何度も命を救われた。');
      await E.say('vargas', 'いい腕だ、春瀬。だがな、本物の機体は、シミュレーターの何倍も重い。……一人で背負おうとするなよ。');
      await E.say('vargas:grin', '……ゴホン！ よし、説教は終わりだ！ ほれ、これでも食え！');
      await E.give('candy', 2, { wait: true });
      await E.say('kanata', '……先生、机の引き出し、お菓子でいっぱいですね。');
      await E.say('vargas:angry', '見るな！ これは……その、非常食だ！');
      if (G.state.party.includes('ruu')) await E.say('ruu:grin', 'センセー、あたしにも非常食ちょうだい。');
      E.cut(false);
    },
  });

  // ---- 放課後の屋上（寄り道） ----
  G.addToMap('rooftop', {
    onEnter: async () => {
      if (!at(5) || E.flag('c0_roof_dusk') || !G.state.party.includes('ruu')) return;
      E.set('c0_roof_dusk');
      E.cut(true);
      await E.wait(20);
      await E.say('ruu', '……また来ちゃった。夕方の屋上。');
      await E.cg('colony_dusk', 'ミラーが角度を変え、コロニーの空がオレンジとピンクに染まっていく。');
      await E.say('ruu', '昼間はニセモノの青。夕方はニセモノのオレンジ。……でもさ。');
      await E.say('ruu:shy', 'この時間の空だけは……ちょっとだけ、本物っぽいって思う。');
      await E.say('kanata', '向こう側の街の窓、ぜんぶに明かりがつき始めてる。');
      await E.say('ruu', 'あの明かりの一つ一つに、だれかの晩ごはんがあるんだよね。……なんか、変な感じ。');
      await E.say('kanata', '星屑亭の明かりも、向こうから見えてるのかな。');
      await E.say('ruu:smile', '見えてるよ、きっと。ラーメンのにおいまでは届かないだろうけど。');
      E.cgOff();
      await E.say('ruu', '……帰ろっか。');
      E.cut(false);
    },
  });

  // ---- ポン湯（帰り道の寄り道） ----
  G.addToMap('ponyu', {
    npcs: [
      {
        id: 'c0_ponta_yu', char: 'ponta', x: 6, y: 9, dir: 'down', move: 'still', show: () => ch0() && ph() >= 5 && ph() <= 7,
        talk: async () => {
          if (!E.flag('c0_ponyu')) {
            E.set('c0_ponyu');
            await E.say('ponta', 'カナタ！ ポン湯へようこそっす！ 今日は「宇宙ラベンダーの湯」っすよ！');
            if (E.flag('c0_quake')) {
              await E.say('ponta', 'さっきの揺れ、すごかったっすね……。湯船が大波になって、常連のじいちゃんが流されかけたっす。');
              await E.say('ponta', 'でも、うちの湯船は軌道戦争の時代から一回も割れたことがないっす！ 父ちゃんの自慢っす！');
            }
            await E.say('ponta', 'ひとっ風呂あびていくっすか？ 友だち割引で、今日はタダっす！');
            await E.fadeOut(20);
            E.heal();
            G.audio.se('heal');
            await E.wait(20);
            await E.fadeIn(20);
            await E.say(null, 'ラベンダーの香りの湯けむり。体の芯までぽかぽかになった。（HP・EN全回復）');
            await E.say('ponta:grin', 'ぶっひゃー！ 湯上がりの顔、いい顔っす！');
            await E.say('ponta', 'オイラね、いつかこの銭湯の地下に、AFの整備工場を作るのが夢なんす。湯船とハンガーが一体型っす！');
            await E.say('kanata', '……機体が湯気でさびそうだな。');
            await E.say('ponta', 'そこは研究中っす！');
            return;
          }
          await E.say('ponta', G.pick(['番台の手伝い、意外と楽しいっす。いろんな人の話が聞けるっすから。', 'カナタのばあちゃん、昔はここの常連だったらしいっす。「湯上がりの牛乳は、腰に手を当てて飲め」って、父ちゃんに教えたのもトメさんだって。', 'また来るっす！ 次は「星雲ミルクの湯」の日っす！']));
        },
      },
    ],
  });
})();
