// =============================================================
//  story/ch5.js — 第5章「無重力の迷宮」
//   フェーズ（E.val('c5_phase')）
//    0 作戦会議 → 1 グリーン・ブロックへ（夜）→ 2 トンネル上層 → 3 下層・ウォーデン
//    4 コア・シャフト（ステルス）→ 5 研究棟（記録・ニコ救出）→ 6 脱出 → 7 ドック（ミラージュ再戦）→ 8 帰還
//   フラグ接頭辞 c5_ ／ マップ c5_tunnel1 c5_tunnel2 c5_core c5_lab c5_dock（maps/c5.js）
//   後の章へ：ニコ救出（パーティ復帰）、pendant 装備、echo 習得、keycard・pass_core 所持、c4_yui_ally
// =============================================================
(function () {
  const H = G.C45;
  const ch5 = () => G.state.chapter === 5;
  const ph = () => E.val('c5_phase');
  const setPh = (n) => {
    if (ph() < n) E.set('c5_phase', n);
  };
  const ROSE = { mech: 'rose', x: 6, y: 16, dmg: 18, col: '#ff7fb0', name: 'ローズハウンド', id: 'c5_ally_rose' };

  // ===============================================================
  //  章の開始：作戦会議（星屑亭）
  // ===============================================================
  G.STORY.chapters[5] = async function () {
    E.time('morning');
    G.state.mech.id = 'harukaze';
    ['c3_rose', 'c3_sig_joined', 'c4_yui_ally', 'c4_done'].forEach((f) => E.set(f));
    G.state.skills = G.state.skills.filter((s) => s !== 'echo');
    if (G.state.equip.acc === 'pendant') G.state.equip.acc = null;
    delete G.state.items.pendant;
    E.set('c5_phase', 0);
    E.party([]);
    await E.chapter(5, null, '――星の声が、呼んでいる。');
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさん……ううん、今夜は眠れなかった人たちへ。レディオ・スターダストだよ。',
      '昨日の夕方、第三中学校の文化祭に公安の特務隊が入ったって話、もう聞いたかな。公安の発表は「不審者の保護」。……それだけ。',
      '保護、ね。リリィには、そうは聞こえなかったな。屋台のラーメン、すごくおいしかったって噂だったのに。',
      '……ねえ、聞いてる？　もし大切な誰かがいなくなったなら。手を離さないで。リリィは、そういう子たちの味方だから。',
      'それじゃ一曲。――「ニセモノの空に、ホンモノの声を」。',
    ]);
    await E.warp('hoshikuzu', 6, 7, 'up', { noEnter: true });
    await planning();
  };

  async function planning() {
    E.cut();
    E.remove('w_taxi');
    H.actors([
      ['c5_a_ruu', 'ruu', 3, 6, 'up'],
      ['c5_a_yui', 'yui', 5, 6, 'up'],
      ['c5_a_ponta', 'ponta', 8, 6, 'up'],
      ['c5_a_doc', 'doc', 13, 6, 'left'],
    ]);
    E.teleport('player', 6, 7, 'up');
    E.bgm('home');
    await E.wait(20);
    await E.say(null, '翌朝。星屑亭の入口には「本日休業」の札がかかっていた。');
    await E.say('doc', 'ふん。ハルカゼとローズハウンドは直しておいた。……徹夜でな。');
    await E.say('doc', '礼はいらん。代わりに、二度と壊すな。機体は嘘をつかん。壊れるのは、乗り手が無茶をした時だけだ。');
    await E.say('ponta', 'ドクさん、一睡もしてないっす。オイラも手伝ったっすけど……半分寝てたっす。');
    await E.say('yui:serious', '……父の執務室から、これを借りてきました。');
    E.se('get');
    await E.give('pass_core', 1);
    await E.say('ruu:surprise', '委員長、それって……盗んだってこと？');
    await E.say('yui:shy', '借りたんです！　返します、ちゃんと。……校則違反どころか、たぶん法律違反ですけれど。');
    await E.say('yui:serious', 'ニコさんがいるのは、コア・シャフトの第七研究棟。父のファイルにあった名前です。入口は公安の詰所の奥……正面からは、とても入れません。');
    await E.say('doc', 'コア・シャフトへの道なら、もうひとつある。グリーン・ブロックの北壁、第7整備トンネルだ。昔は貨物線に使われとった。');
    await E.say('doc', '今は封鎖されとるが、総督府の通行証なら、扉の認証を通せるかもしれん。');
    await E.say('tome', 'あそこは迷路みたいなもんだよ。……ばあちゃんも昔、一度だけ通ったことがある。');
    E.emote('player', '?');
    await E.say('kanata:surprise', 'え、ばあちゃんが？');
    await E.say('tome', 'なんでもないさね。昔の話だよ。');
    await E.say('ponta:think', 'でも、機体はどうするっす？　トンネルにAFは入らないっすよ。');
    await E.say('doc', 'グリーン・ブロックの農業用リフトを使う。収穫物をコア・シャフトの貨物ドックへ上げる大型リフトだ。機体はコンテナに隠して運ぶ。ポンタ、おまえとワシでな。');
    await E.say('ponta:surprise', 'ぶっひゃー！　密輸っす！　オイラ、犯罪者デビューっす！');
    await E.say('kanata:serious', 'オレとルウとユイは、トンネルから研究棟へ。ニコを助けたら、貨物ドックでドクたちと合流する。');
    await E.say('ruu:grin', '帰りはハルカゼとローズで強行突破、ってわけね。……いいじゃん、わかりやすくて。');
    const c = await E.ask('ruu', 'ねえ、作戦名つけようよ。こういうのは気合いが大事っしょ。', ['「ニコ・カムバック作戦」', '「星屑ラーメン大作戦」', '「名前なんていらない」']);
    E.set('c5_opname', c);
    if (c === 0) {
      await E.say('ruu:grin', 'ニコ・カムバック。……うん、悪くない。絶対に帰ってきてもらう。');
      await E.say('yui:smile', 'シンプルで、目的が明確です。賛成します。');
    } else if (c === 1) {
      await E.say('ponta:grin', 'ラーメン大作戦！　ニコちゃんを助けて、ラーメンを食わせる！　完璧な作戦っす！');
      await E.say('tome:grin', 'ふふん。じゃあ、ばあちゃんは最高のチャーシューを仕込んで待ってるかね。');
    } else {
      await E.say('kanata', '名前なんていらないよ。……ニコを連れて帰る。それだけだ。');
      await E.say('ruu:shy', '……かっこつけ。でも、まあ、それでいいか。');
    }
    E.se('door');
    E.npc({ id: 'c5_a_sig', char: 'sig', x: 7, y: 10, dir: 'up', move: 'still' });
    await E.move('c5_a_sig', 'U2', { speed: 0.9 });
    E.emote('c5_a_ruu', '!');
    await E.say('ruu:surprise', 'シグ！？　あんた、どっから……！');
    await E.say('sig', '……研究棟の警備は、深夜二時に交代します。その時間、中心軸の巡回はいちばん手薄になる。');
    await E.say('kanata:surprise', 'なんで、そんなこと知って……。');
    await E.say('sig:serious', '……知っているんです。前にも、見たから。');
    await E.say('yui:think', '前にも……？');
    await E.say('sig', '中心軸は無重力です。足元に気をつけて。……トンネルの奥で、また会いましょう。');
    await E.say('tome', 'あんた、ラーメン食べていかないのかい。');
    E.face('c5_a_sig', 'w_tome');
    await E.say('sig', '……今度、必ず。四人と一緒に。');
    await E.move('c5_a_sig', 'D2', { speed: 1 });
    E.se('door');
    E.remove('c5_a_sig');
    await E.say('ruu', '……ほんっと、なんなのアイツ。');
    await E.say('tome', 'ほら、持っていきな。腹が減っては、なんとやらだ。');
    E.give('onigiri', 5, { quiet: true });
    E.give('ramen', 2, { quiet: true });
    await E.notice('星屑おにぎり ×5、星屑ラーメン ×2 を受け取った！');
    await E.say('tome:serious', '……必ず、四人で帰ってきな。');
    await E.say('kanata:serious', 'うん。必ず。');
    await E.fadeOut(30);
    H.clear(['c5_a_ruu', 'c5_a_yui', 'c5_a_ponta', 'c5_a_doc']);
    E.time('night');
    E.party(['ruu', 'yui']);
    setPh(1);
    E.teleport('player', 7, 10, 'down');
    await E.fadeIn(30);
    await E.say(null, '――深夜一時。夜間外出禁止令の出た街は、しんと静まり返っていた。');
    E.objective('グリーン・ブロックのメンテナンス・トンネルへ（ミナト区の西）');
  }

  // ---------------------------------------------------------------
  //  ミナト区：夜間外出禁止令の検問
  // ---------------------------------------------------------------
  G.mob('c5_patrol', '夜間巡回の公安隊員', 5101, { girl: false, over: { top: '#4a5a7a', outfit: 'military', acc: ['helmet'], accCol: '#5a6a8a', build: 'tall' } });
  G.addToMap('minato', {
    npcs: [
      { id: 'c5_patrol', char: 'c5_patrol', x: 3, y: 21, dir: 'down', move: 'still', show: () => ch5() && ph() >= 1 && ph() < 8 && !E.flag('w_evac'), talk: async () => await E.say('c5_patrol', E.flag('c5_checkpoint') ? '総督府の方でしたか。……お気をつけて。' : '夜間外出禁止令が出ている。早く帰りなさい。') },
    ],
    events: [
      { x: 1, y: 22, w: 2, h: 3, once: 'c5_checkpoint', cond: () => ch5() && ph() === 1, run: async () => {
        E.cut();
        E.face('c5_patrol', 'player');
        E.emote('c5_patrol', '!');
        await E.say('c5_patrol', '止まれ！　夜間外出禁止令だ。子どもがこんな時間に、どこへ行く。');
        await E.say('ruu', '（げっ……）');
        await E.say('yui:serious', '……総督府の者です。父の――風見総督の命で、グリーン・ブロックの夜間視察に向かっています。');
        E.se('get');
        await E.say(null, 'ユイが、通行証をすっと差し出した。');
        await E.say('c5_patrol:surprise', 'そ、総督府……！　ご令嬢でしたか。し、失礼しました！');
        await E.say('c5_patrol', 'どうぞ。……ですが、最近は公安特務隊もピリピリしています。お気をつけて。');
        await E.say('ruu:grin', '（委員長、演技うまっ）');
        await E.say('yui:shy', '（……心臓が止まるかと思いました）');
        H.reward(80);
      } },
    ],
  });

  // ---------------------------------------------------------------
  //  グリーン・ブロック：リフトのポンタとドク／トンネルの開放
  // ---------------------------------------------------------------
  G.addToMap('green', {
    npcs: [
      { id: 'c5_g_haru', char: 'sys', mech: 'harukaze', x: 15, y: 22, dir: 'down', move: 'still', noFace: true, show: () => ch5() && ph() >= 1 && ph() <= 2, talk: async () => await E.say(null, 'コンテナに積みこまれるのを待つハルカゼ。直したばかりの装甲が、月明かりならぬ街灯の光を返している。') },
      { id: 'c5_g_rose', char: 'sys', mech: 'rose', x: 18, y: 22, dir: 'down', move: 'still', noFace: true, show: () => ch5() && ph() >= 1 && ph() <= 2, talk: async () => await E.say('ruu', '……ローズ。待っててね。帰りは、あんたの出番だから。') },
      { id: 'c5_g_ponta', char: 'ponta', x: 21, y: 23, dir: 'left', move: 'still', show: () => ch5() && ph() >= 1 && ph() <= 2, talk: async () => {
        await E.say('ponta', 'リフトの積み込み、あと30分っす！　キャベツのコンテナの奥に機体を隠すっす。');
        await E.say('ponta:grin', 'カナタ、ルウ、委員長。……ニコちゃんのこと、頼んだっす。ドックで待ってるっすからね！');
      } },
      { id: 'c5_g_doc', char: 'doc', x: 23, y: 23, dir: 'left', move: 'still', show: () => ch5() && ph() >= 1 && ph() <= 2, talk: async () => {
        const i = await E.ask('doc', 'ふん。出発前に、機体をいじっておくか？', ['改造する', 'やめておく'], { cancel: 1 });
        if (i === 0) await E.upgrade();
        await E.say('doc', 'トンネルの奥には、昔の警備ロボが残っとるかもしれん。〈ウォーデン〉……でかい図体の監視ロボだ。正面から殴り合うな。動きをよく見ろ。');
      } },
    ],
    warps: [{ x: 4, y: 4, to: 'c5_tunnel1', tx: 6, ty: 26, dir: 'up', cond: () => E.flag('w_tunnel_open'), se: 'door' }],
    events: [
      { x: 1, y: 4, w: 7, h: 2, cond: () => ch5() && ph() >= 1 && !E.flag('w_tunnel_open'), run: async () => await openTunnel() },
    ],
  });
  async function openTunnel() {
    E.cut();
    await E.camera(4, 4);
    await E.say(null, '北の構造壁に埋めこまれた、巨大な隔壁扉。「MAINT-07」の文字の下で、赤いランプが点滅している。');
    await E.say('yui:serious', '認証パネルがあります。……通行証を読ませてみます。');
    for (;;) {
      const s = await E.timing({ title: '認証コード入力', rounds: 3, speed: 1.4, zone: 0.2, labels: ['通行証をかざす！', '照合キーを合わせる！', '承認コードを送信！'], col: '#4ef0ff' });
      if (s >= 2) break;
      E.se('buzz');
      await E.say('yui:surprise', 'エラー……！　もう一度、落ち着いて……。');
    }
    E.se('door');
    E.shake(4, 40);
    E.flash(8);
    E.set('w_tunnel_open');
    E.reload();
    await E.wait(30);
    await E.say(null, 'ゴウン……と低い音を立てて、隔壁がゆっくりと開いた。');
    await E.say('ruu:grin', '開いた……！　委員長、やるじゃん。');
    await E.say('yui:smile', '……父の通行証が、こんなふうに役に立つなんて。皮肉ですね。');
    await E.cameraReset();
    await E.say('kanata:serious', '行こう。ニコが待ってる。');
    E.objective('メンテナンス・トンネルに入る');
    H.reward(120);
  }

  // ===============================================================
  //  トンネル上層（c5_tunnel1）
  // ===============================================================
  async function t1Valve(n) {
    if (E.flag('c5_v' + n)) return await E.say(null, '圧力弁は開いている。配管の中を、勢いよく水が流れる音がする。');
    await E.say(null, n === 1 ? '錆びついた圧力弁だ。ハンドルに「W-VALVE」の刻印。' : '圧力弁だ。ハンドルに「SE-VALVE」の刻印。足元を冷却水が流れている。');
    const i = await E.ask('kanata', '（回してみる？）', ['回す', 'やめておく'], { cancel: 1 });
    if (i === 1) return;
    const s = await E.timing({ title: '圧力弁を回す', rounds: 3, speed: 1.3, zone: 0.22, labels: ['ぐっと力をこめる！', 'もうひと押し！', '一気に回す！'], col: '#7dff9a' });
    if (s < 1) {
      E.se('buzz');
      await E.say('kanata:sad', 'か、かてぇ……！　びくともしない……。');
      await E.say('ruu', 'ちょっと、もっと腰入れなよ。もう一回！');
      return;
    }
    E.set('c5_v' + n);
    E.se('charge');
    H.swap('c5_v' + n, 'c5_valve', { open: true });
    await E.say(null, 'ギギギ……と鈍い音を立てて、圧力弁が開いた！');
    H.reward(250);
    if (E.flag('c5_v1') && E.flag('c5_v2')) await t1Open();
    else E.objective('もうひとつの圧力弁を開く（' + (E.flag('c5_v1') ? '南東のポンプ室' : '西のバルブ室') + '）');
  }
  async function t1Open() {
    E.cut();
    await E.wait(20);
    E.se('quake');
    E.shake(5, 50);
    await E.say(null, 'トンネルの奥で、配管の圧力が戻っていく音がした――。');
    await E.camera(32, 9);
    for (let y = 8; y < 12; y++) {
      E.setTile(32, y, 'x');
      E.setTile(33, y, 'x');
    }
    H.removeObj('c5_sh1');
    E.set('c5_t1_open');
    E.se('door');
    E.flash(6);
    await E.wait(40);
    await E.cameraReset();
    await E.say('yui', '東のシャッターが開いたはずです！');
    await E.say('ruu:grin', 'よっし。……ってか、委員長、なんで場所わかんの？');
    await E.say('yui', '配管の流れる向きです。理科の教科書、第4章「流体と圧力」。');
    await E.say('ruu', '……教科書、役に立つんだ。');
    E.objective('東のシャッターの先、ハッチから下層へ');
    H.reward(200);
  }
  G.addToMap('c5_tunnel1', {
    checks: [
      { x: 9, y: 3, run: async () => await t1Valve(1) },
      { x: 34, y: 19, run: async () => await t1Valve(2) },
      { x: 32, y: 8, h: 4, show: () => !E.flag('c5_t1_open'), run: async () => {
        await E.say(null, '分厚い防火シャッターだ。表示板に「P-07　配管圧力異常のため封鎖中」。');
        await E.say(null, '小さな文字で「復旧手順：西バルブ室および南東ポンプ室の圧力弁を開放のこと」とある。');
        if (!E.flag('c5_t1_shutter_seen')) {
          E.set('c5_t1_shutter_seen');
          await E.say('kanata', '圧力弁を2つ開けりゃいいのか。西と、南東……。');
          E.objective('圧力弁を2つ開く（西のバルブ室・南東のポンプ室）');
        }
      } },
      { x: 21, y: 24, w: 14, text: '冷却水の水路。透きとおった水が、ごうごうと流れていく。コロニーの「血管」だ。' },
      { x: 42, y: 2, run: async () => {
        await E.say(null, '保守端末。画面に古いログが残っている。');
        await E.say(null, '「S.C.0075　貨物線封鎖。理由：第七研究棟の機密保持のため。署名：H.クロイツ」');
        await E.say('yui:serious', '……十年前。この区画を閉じたのも、研究所だったんですね。');
      } },
    ],
    onEnter: async () => {
      if (!ch5()) return;
      setPh(2);
      if (E.flag('c5_t1_in')) return;
      E.set('c5_t1_in');
      E.cut();
      await E.wait(20);
      await E.say('ruu', 'うわ、くさっ。カビと油のにおい……。');
      await E.say('yui', 'ここから先、地図はありません。父の書類によると、上層と下層を抜けると、中心軸へのリフトに出るはずです。');
      await E.say('kanata', '……配管の音、すごいな。コロニーの中って、こんなふうになってたのか。');
      await E.say('ruu:serious', 'ネズミとかボットとか、いそうだね。……ユイ、あたしたちの後ろにいな。');
      await E.say('yui:shy', '……はい。お願いします。');
      E.objective('トンネルを進む（東のシャッターを開ける方法を探す）');
    },
  });

  // ===============================================================
  //  トンネル下層（c5_tunnel2）
  // ===============================================================
  async function restTalk() {
    const opts = ['ルウと話す', 'ユイと話す', 'ひと休みする（回復）', 'やめておく'];
    const i = await E.ask(null, '錆びたベンチだ。少し、腰をおろそうか。', opts, { cancel: 3 });
    if (i === 0) {
      const n = E.inc('c5_talk_ruu');
      if (n === 1) {
        await E.say('ruu', '……ねえ、カナタ。ひだまり園にもさ、ニコみたいな子、いたんだ。夜中にずっと泣いてる子。');
        await E.say('ruu', 'あたし、その子に何もしてやれなかった。……だから、今度は絶対に置いていかない。');
        await E.say('ruu:shy', 'リリィ姉が言ってたんだ。「誰かの手を離さないのが、いちばん強いってこと」って。');
        await E.say('kanata', 'リリィ姉……？　DJリリィのこと？');
        await E.say('ruu:surprise', '……！　い、今のナシ！　忘れて！');
        H.reward(60);
      } else if (n === 2) {
        await E.say('ruu', '本物の空ってさ、どんな色なんだろうね。……ニコは、見たことあるのかな。');
        await E.say('ruu:smile', '助けたら聞いてみよ。ニコが見た空のこと。');
      } else await E.say('ruu', 'なに？　休憩しすぎ。さっさと行くよ。……ニコが待ってるんだから。');
    } else if (i === 1) {
      const n = E.inc('c5_talk_yui');
      if (n === 1) {
        await E.say('yui', '……春瀬くん。わたし、小さいころから「総督の娘」として、規則を守るように言われてきました。');
        await E.say('yui', '規則を守っていれば、みんなが幸せになる。父もそう信じている……と、思っていました。');
        await E.say('yui:sad', 'でも、規則の向こうに、ニコさんみたいな子がいるなら。わたしは、何のために規則を守ってきたんでしょう。');
        await E.say('kanata', '……ユイが規則を守ってきたのは、誰かを守りたかったからだろ。それは、今も同じじゃないか。');
        await E.say('yui:shy', '……春瀬くんは、ときどき、ずるいことを言いますね。');
        H.reward(60);
      } else if (n === 2) {
        await E.say('yui:shy', '……ここだけの話ですけど。わたし、本当は少女マンガとネオンキャンディが大好きなんです。');
        await E.say('ruu:grin', '知ってる。図書室の「星屑ロマンス」、ずっと借りてるの委員長でしょ。');
        await E.say('yui:surprise', 'なっ……！　な、なぜそれを……！');
      } else await E.say('yui', '休憩は十分です。……行きましょう。');
    } else if (i === 2) {
      await E.fadeOut(16);
      E.heal();
      await E.wait(20);
      await E.fadeIn(16);
      G.audio.se('heal');
      E.toast('HP・ENが全回復した', '#7dff9a');
      await E.say('kanata', '（ばあちゃんのおにぎり、うまいな……）');
    }
  }
  async function extendBridge() {
    if (E.flag('c5_bridge')) return await E.say(null, 'レバーは「ON」になっている。橋は伸びたままだ。');
    await E.say(null, '「可動橋」と書かれたレバーだ。');
    const i = await E.ask('kanata', '（倒してみる？）', ['倒す', 'やめておく'], { cancel: 1 });
    if (i === 1) return;
    E.cut();
    E.set('c5_bridge');
    E.se('charge');
    H.swap('c5_lv', 'c5_lever', { on: true });
    await E.wait(20);
    await E.camera(7, 11);
    for (let y = 9; y <= 14; y++) {
      E.setTile(6, y, 'g');
      E.setTile(7, y, 'g');
      E.se('mechstep');
      await E.wait(12);
    }
    E.shake(3, 20);
    await E.wait(30);
    await E.cameraReset();
    await E.say('ruu:grin', '橋、伸びた！　……下、見たらダメなやつだね、これ。');
    await E.say('yui:surprise', '……見てしまいました。底が、見えません。');
    E.objective(E.flag('c5_keycard') ? '橋をわたって、カードキーのゲートへ' : '橋をわたって先へ（警備室も調べよう）');
    H.reward(200);
  }
  async function takeKeycard() {
    if (E.flag('c5_keycard')) return await E.say(null, '空っぽのロッカーだ。');
    await E.say(null, 'ロッカーの扉が、半開きになっている。');
    E.set('c5_keycard');
    H.swap('c5_lk', 'c5_locker', { col: '#5a6a8a', open: true });
    await E.give('keycard', 1);
    await E.say('yui', '研究棟のカードキー……！　警備員の予備でしょうか。これで、奥のゲートも開くはずです。');
    await E.say('ruu', '不用心な警備員さんに感謝、だね。');
    H.reward(250);
    E.objective(E.flag('c5_bridge') ? '橋をわたって、カードキーのゲートへ' : '奈落にかかる橋を伸ばす方法を探す（警備室）');
  }
  async function openGate() {
    if (!E.has('keycard')) return await E.say(null, '分厚いゲートだ。カードリーダーが赤く光っている。「研究棟関係者専用」……カードキーが必要だ。');
    E.cut();
    await E.say(null, 'カードキーをリーダーに通した。……ピッ。');
    E.se('ok');
    await E.wait(20);
    for (let y = 17; y <= 20; y++) {
      E.setTile(31, y, 'x');
      E.setTile(32, y, 'x');
    }
    H.removeObj('c5_gate');
    E.set('c5_gate_open');
    E.se('door');
    E.shake(3, 20);
    await E.say('kanata', '開いた……。奥は、広い部屋みたいだ。');
    await E.say('yui:serious', '……気をつけてください。なにか、大きな駆動音がします。');
    E.objective('奥の部屋を抜けて、中心軸へのリフトへ');
  }
  G.addToMap('c5_tunnel2', {
    checks: [
      { x: 7, y: 7, w: 2, run: restTalk },
      { x: 15, y: 2, run: takeKeycard },
      { x: 21, y: 7, run: extendBridge },
      { x: 31, y: 17, h: 4, show: () => !E.flag('c5_gate_open'), run: openGate },
      { x: 20, y: 2, run: async () => {
        await E.say(null, '警備端末。監視カメラの映像が、いくつも並んでいる。');
        await E.say(null, 'そのひとつに、白い部屋が映っていた。……ベッドの上で、小さな影が膝を抱えている。');
        await E.say('ruu:angry', 'ニコ……！');
        await E.say('kanata:serious', '……待ってろ。すぐ行く。');
      } },
    ],
    events: [
      { x: 34, y: 11, h: 19, once: 'c5_warden_ev', cond: () => ch5() && !E.flag('c5_warden_down'), run: async () => await wardenFight() },
    ],
    onEnter: async () => {
      if (!ch5()) return;
      setPh(3);
      if (E.flag('c5_t2_in')) return;
      E.set('c5_t2_in');
      E.cut();
      await E.wait(20);
      await E.say('yui', 'ここが下層……。空気が、冷たいです。');
      await E.say('ruu', '下、真っ暗な穴じゃん。落ちたら……コロニーの外まで落ちるのかな。');
      await E.say('kanata', '外壁と内壁のあいだの「層」だよ。……落ちたら、たぶん帰ってこられない。');
      E.se('cursor');
      await E.say('ponta', '……ザザッ……こちらポンタ！　聞こえるっすか！？　リフトの積み込み完了っす！　キャベツくさいっす！', { name: 'ポンタ（無線）' });
      await E.say('ponta', 'ドクさんが「下層には昔の監視ロボがいるかもしれん、気をつけろ」って……ザザッ……ドックで待ってるっす！', { name: 'ポンタ（無線）' });
      await E.say('ruu:grin', '了解。キャベツと一緒に待ってな。');
      E.objective('奈落を越える方法を探す（東の警備室）');
    },
  });
  async function wardenFight() {
    E.cut();
    E.bgm('tension');
    E.enemy('warden', 40, 15, { lv: 7 });
    await E.camera(40, 15);
    E.se('boot');
    E.flash(6);
    await E.say(null, '部屋の中央で、巨大な機械の塊が身じろぎした。赤いモノアイが、ぎょろりとこちらを向く。');
    await E.say(null, '「侵入者ヲ確認。第七研究棟ハ、立入禁止区域デス。……排除シマス」', { name: '監視ロボ〈ウォーデン〉' });
    await E.say('ruu:grin', 'でっか……！　ドクの言ってた〈ウォーデン〉ってやつ！？');
    await E.say('yui', '動きが重いぶん、突進と衝撃波に気をつけてください！　ドクさんの言葉どおり、動きをよく見て！');
    await E.say('kanata:serious', 'ここを抜けなきゃ、ニコのところへは行けない……！');
    await E.cameraReset();
    E.cut(false);
    const won = await E.battle({
      enemies: [{ type: 'warden', x: 40, y: 15, lv: 7, hp: 1100, boss: true }],
      bgm: 'boss', title: 'BOSS', sub: '監視ロボ〈ウォーデン〉',
      onStart: async () => {
        E.toast('ダッシュ（X）で突進をかわそう', '#ffd25e');
      },
    });
    if (!won) return;
    E.set('c5_warden_down');
    E.cut();
    E.bgm('dungeon');
    await E.say('ruu', 'はぁ、はぁ……倒した……！');
    await E.say('yui:smile', 'リフトの電源が入りました！');
    E.npc({ id: 'c5_a_sig', char: 'sig', x: 41, y: 11, dir: 'down', move: 'still' });
    E.se('echo');
    E.flash(6);
    await E.wait(20);
    await E.say('sig', '……お見事です。');
    await E.say('ruu:angry', 'シグ！　また出た！　手伝いなさいよ、こういう時は！');
    await E.say('sig', '……僕が手を出すと、きっと、うまくいかないんです。この戦いは、あなたたちのものだから。');
    await E.say('sig:serious', 'リフトの先は、中心軸。無重力区画です。公安の巡回がいます。見つからないように。');
    await E.say('sig', '……それと、カナタ。研究棟で何を見ても、目をそらさないでください。');
    await E.say('kanata', 'シグ、おまえ、いったい――');
    E.flash(10);
    E.se('boost');
    E.remove('c5_a_sig');
    await E.say('yui:think', '……消えた。彼は、どうやってここに……？');
    await E.say('kanata:serious', '……行こう。');
    E.objective('リフトでコア・シャフトへ');
    H.reward(600);
  }

  // ===============================================================
  //  コア・シャフト（c5_core）：無重力・ステルス
  // ===============================================================
  G.MAPS.c5_core.onSpotted = async function (e) {
    E.cut();
    E.tint('rgba(255,40,60,0.18)');
    await E.say('guard', '……！　そこにいるのは誰だ！', { name: '公安特務隊員' });
    await E.say('ruu:surprise', 'やばっ、見つかった！　戻って、隠れて！');
    E.tint(null);
    await E.fadeOut(16);
    const cp = E.flag('c5_cp1') ? [35, 15, 'right'] : [5, 15, 'right'];
    await E.warp('c5_core', cp[0], cp[1], cp[2], { noFade: true });
    await E.fadeIn(16);
    E.toast('黄色い扇形は見張りの視界。背中側から、物陰を伝って進もう', '#ffd25e');
  };
  G.addToMap('c5_core', {
    checks: [
      { x: 5, y: 11, w: 4, run: async () => {
        E.cut();
        await E.say(null, '手すりから身を乗り出して、見上げてみた。');
        await E.cg('colony_night', '回転軸から見るクレイドル7は、三本の「陸」が頭上をぐるりと取り囲む、巨大な筒だった。');
        await E.say('ruu', '……ニセモノの空の、ど真ん中。あたしたちの街も、どっかに見えるのかな。');
        await E.say('yui', 'あの明かりの帯が、たぶんミナト区です。……星屑亭の灯りも、あの中に。');
        await E.say('kanata', '……帰る場所が見えるってのは、悪くないな。');
        E.cgOff();
        if (!E.flag('c5_core_view')) {
          E.set('c5_core_view');
          H.reward(50);
        }
      } },
    ],
    events: [
      { x: 35, y: 14, h: 2, cond: () => ch5() && !E.flag('c5_cp1'), run: async () => {
        E.set('c5_cp1');
        E.se('save');
        E.toast('チェックポイント', '#7dff9a');
      } },
      { x: 27, y: 14, h: 2, once: 'c5_core_voice', cond: () => ch5() && !E.flag('c5_alarm'), run: async () => {
        E.cut();
        E.se('echo');
        E.tint('rgba(150,220,255,0.15)');
        await E.say('niko', '……カナタ……。', { name: '？？？' });
        E.tint(null);
        E.emote('player', '!');
        await E.say('kanata:surprise', '……ニコ！？　今の、ニコの声……！');
        await E.say('ruu:surprise', 'え、なに？　何も聞こえなかったけど……。');
        await E.say('kanata', '……頭の中に、直接……。こっちだ。研究棟の方から。');
      } },
    ],
    onEnter: async () => {
      if (!ch5()) return;
      setPh(4);
      if (E.flag('c5_core_in')) return;
      E.set('c5_core_in');
      E.cut();
      await E.wait(30);
      await E.say(null, 'リフトの扉が開いた瞬間――体が、ふわりと浮いた。');
      await E.say('ruu:surprise', 'うわっ、髪が……！　ちょ、浮く浮く！');
      await E.say('yui', '磁力ブーツのおかげで、床からは離れません。……スカートが、少し困りますけど。');
      await E.say('kanata', 'ここが……コロニーの中心軸。回転の、ど真ん中か。');
      await E.camera(14, 22);
      await E.say(null, '手すりの向こうは、底の見えない縦穴。はるか下――いや、「奥」で、何かが青白く脈打っている。');
      await E.say('yui:think', 'あの光……。父のファイルにあった〈スターシード〉……？');
      await E.cameraReset();
      await E.say('ruu:serious', '見て、公安の巡回。……あの黄色いのが視界っぽいね。見つかったら、たぶん即アウト。');
      await E.say('kanata:serious', '物陰を伝って、背中側を抜けよう。研究棟は、東の端だ。');
      E.objective('巡回に見つからないように、東の研究棟へ');
      E.toast('黄色い扇形は見張りの視界。入ると見つかる', '#ffd25e');
    },
  });

  // ===============================================================
  //  第七研究棟（c5_lab）：記録・ニコ救出・脱出
  // ===============================================================
  async function readRecord(n) {
    E.cut();
    const first = !E.flag('c5_rec' + n);
    E.set('c5_rec' + n);
    E.se('cursor');
    if (n === 1) {
      await E.say(null, '「PROJECT ECHO　――ステラ感応応用研究計画――」');
      await E.say(null, '「目的：〈スターシード〉と共鳴可能な児童（ステラ感応者）の能力を増幅し、結晶体の制御を実現する」');
      await E.say(null, '「主任研究員：Dr. H.クロイツ　／　予算承認：クレイドル7総督府 特別会計」');
      await E.say('yui:sad', '……父の、署名……。見間違いじゃ、なかった……。');
      await E.say('ruu', 'ユイ……。');
      await E.say('yui:serious', '……大丈夫です。読み進めましょう。目をそらしたら、きっと後悔しますから。');
    } else if (n === 2) {
      await E.say(null, '「被験体 E-07　通称：ニコ　推定年齢13」');
      await E.say(null, '「S.C.0084、宙域にて結晶体とともに漂流中のポッドから回収。出自不明。言語能力に一部障害」');
      await E.say(null, '「共鳴率：歴代最高値。ただし反復試験への拒否反応が強く、情緒不安定。……試験第214回、被験体は泣き続けた」');
      await E.say(null, '「S.C.0085春、被験体E-07脱走。公安特務隊に回収を要請」');
      await E.say('ruu:angry', '……「被験体」。「回収」。ニコは、モノじゃないって……言ってんだろ……！');
      await E.say('kanata:serious', '…………。');
    } else if (n === 3) {
      E.bgm('sad');
      await E.cg('memory', '');
      await E.cgCaption('「被験体 E-00　獅子堂シグレ　共鳴率：測定不能」');
      await E.cgCaption('「所見：E-00はE-07と同一の共鳴パターンを示す。両者は"同じ星"の声を聞いている」');
      await E.cgCaption('「記録日：S.C.0091」');
      E.cgOff();
      await E.say('yui:surprise', 'S.C.0091……？　今は、0085年です。六年後の……日付……？');
      await E.say('ruu', '入力ミス、でしょ……？　そうじゃなきゃ、おかしいじゃん。');
      await E.say('kanata:think', '……でも、シグのやつ、言ってた。「前にも、見たから」って。');
      await E.say('kanata', 'それに、「この世界の空は、まだ落ちていない」って……。');
      await E.say(null, '誰も、その先を口にしなかった。');
      E.bgm(E.flag('c5_alarm') ? 'chase' : 'dungeon');
    } else {
      await E.say(null, '「神経同調マスク　試作一号　――AF〈ノクターン〉制御系統との同期率 98.2%」');
      await E.say(null, '「装着者：J.H.（元・技術主任）　意識レベル：抑制下にて安定。……以下、データ破損」');
      await E.say('kanata:think', 'ノクターン……あの黒い機体……。J.H.……？');
      await E.say('yui', 'イニシャルだけでは、誰だか……。「元・技術主任」というのも、気になりますが。');
      await E.say('kanata', '……なんだろう。胸のあたりが、ざわざわする。');
    }
    if (first) H.reward(120);
    const n4 = [1, 2, 3, 4].filter((k) => E.flag('c5_rec' + k)).length;
    if (n4 >= 4 && !E.flag('c5_rec_all')) {
      E.set('c5_rec_all');
      await E.say('yui:serious', '……記録は、これで全部です。春瀬くん、ニコさんを。');
    }
  }
  async function rescueNiko() {
    if (E.flag('c5_niko_free')) return await E.say(null, '空っぽのカプセルだ。まだ、ほんのりと温かい。');
    E.cut();
    await E.say(null, '青い液体に満たされたカプセル。その中で、白い髪の少女が眠っている。');
    await E.say('ruu:cry', 'ニコ……！');
    if (!E.flag('c5_rec_all')) await E.say('yui', '制御端末で、ロックを外せるはずです。……春瀬くん、手伝ってください。');
    for (;;) {
      const s = await E.timing({ title: 'カプセルのロック解除', rounds: 3, speed: 1.5, zone: 0.18, labels: ['鎮静剤の供給を止める！', '液体を排出する！', 'ロックを外す！'], col: '#4ef0ff' });
      if (s >= 2) break;
      E.se('buzz');
      await E.say('yui:surprise', 'エラーです……！　落ち着いて、もう一度！');
    }
    H.stash();
    E.se('door');
    E.flash(10);
    E.set('c5_niko_free');
    H.swap('c5_pod', 'c5_pod', { empty: true });
    H.actors([
      ['c5_a_niko', 'niko', 28, 11, 'down'],
      ['c5_a_ruu', 'ruu', 27, 12, 'up'],
      ['c5_a_yui', 'yui', 30, 12, 'up'],
    ]);
    E.teleport('player', 29, 13, 'up');
    E.bgm('sad');
    await E.wait(40);
    await E.say('niko', '……ん……。');
    await E.say('niko:surprise', '……カナタ。ルウ。ユイ……。');
    await E.say('niko:smile', '……おそい。');
    await E.say('ruu:cry', 'バカ……！　こっちのセリフだよ……！');
    await E.move('c5_a_ruu', 'U', { speed: 1.5 });
    await E.say(null, 'ルウが、ニコを力いっぱい抱きしめた。');
    await E.say('niko', 'ルウ、くるしい。……でも、あったかい。');
    await E.say('yui:cry', 'ニコさん……ごめんなさい。わたしの父が……わたしが、守れなくて……。');
    await E.say('niko:smile', 'ユイ、きてくれた。ニコ、しってる。ユイの、こころの、おと。……やさしい、おと。');
    await E.say('niko', 'カナタ。……ニコ、ずっと、よんでた。きこえた？');
    await E.say('kanata:smile', '……ああ。聞こえたよ。ちゃんと。');
    await E.say('niko:serious', '……これ。');
    await E.say(null, 'ニコが、首にかけていた小さな石を外した。星のかけらのような、淡く光る石。');
    await E.say('niko', 'ニコの、ほし。ニコが、ここに、きたとき、もってた。……カナタに、あげる。');
    await E.say('kanata:surprise', 'いいのか？　大事なものなんだろ。');
    await E.say('niko:smile', 'だいじ。だから、カナタに。……カナタ、みんなを、まもる。この、ほしが、カナタを、まもる。');
    await E.give('pendant', 1, { wait: true });
    E.equip('acc', 'pendant');
    E.toast('星のペンダントを装備した', '#ffd25e');
    E.se('echo');
    E.flash(12);
    E.tint('rgba(150,230,255,0.2)');
    await E.wait(30);
    await E.say(null, 'ペンダントを握った瞬間――胸の奥で、澄んだ音が鳴った。ニコの声と、もうひとつ、遠い誰かの声が重なる。');
    E.tint(null);
    await E.learn('echo');
    await E.say('kanata', '……今の、なんだ……？　頭の中が、すっと静かになって……。');
    await E.say('niko', 'それ、ニコと、おなじ、おと。……エコー。カナタにも、きこえる。');
    // 警報
    E.stopBgm(1);
    await E.wait(20);
    E.set('c5_alarm');
    E.se('alarm');
    E.shake(5, 40);
    E.bgm('chase');
    await E.say(null, '「警報。第七研究棟ニテ、被験体E-07ノ逸脱ヲ確認。警備部隊ハ直チニ急行セヨ」', { name: 'マザー' });
    await E.say('ruu:angry', 'バレた！　カナタ、逃げるよ！');
    await E.say('yui:serious', '西の通路はもう使えません！　東の隔壁を開けます――貨物ドックへの近道です！');
    for (let y = 9; y <= 11; y++) {
      E.setTile(34, y, 'm');
      E.setTile(35, y, 'm');
    }
    H.removeObj('c5_labdoor');
    E.se('door');
    H.clear(['c5_a_niko', 'c5_a_ruu', 'c5_a_yui']);
    E.party(['ruu', 'niko', 'yui']);
    setPh(6);
    H.reward(1000);
    E.npc({ id: 'c5_a_g1', char: 'guard', x: 10, y: 10, dir: 'right', move: 'still' });
    E.npc({ id: 'c5_a_g2', char: 'guard', x: 10, y: 12, dir: 'right', move: 'still' });
    await E.say('guard', 'いたぞ！　被験体を確保しろ！', { name: '公安特務隊員' });
    await E.say('niko:serious', 'カナタ。ほしの、こえ。きいて。……まもる、って、おもって。');
    H.clear(['c5_a_g1', 'c5_a_g2']);
    E.cut(false);
    await E.battle({
      enemies: [
        { type: 'guard2', x: 18, y: 10, lv: 7 },
        { type: 'guard2', x: 18, y: 13, lv: 7 },
        { type: 'guard', x: 22, y: 16, lv: 7 },
        { type: 'drone', x: 15, y: 7, lv: 7 },
      ],
      bgm: 'chase', title: 'ESCAPE!', sub: '追っ手を振り切れ',
      onStart: async () => {
        E.toast('C長押し：エコー・シールド（ダメージ無効＋押し返し）', '#4ef0ff');
      },
    });
    E.cut();
    await E.say('ruu', 'よし、今のうち！　東の通路へ！');
    E.objective('東の通路を抜けて、貨物ドックへ脱出！');
  }
  G.addToMap('c5_lab', {
    checks: [
      { x: 11, y: 9, run: async () => await readRecord(1) },
      { x: 18, y: 12, run: async () => await readRecord(2) },
      { x: 26, y: 15, run: async () => await readRecord(3) },
      { x: 14, y: 14, run: async () => await readRecord(4) },
      { x: 28, y: 10, w: 2, run: rescueNiko },
      { x: 34, y: 9, h: 3, show: () => !E.flag('c5_niko_free'), text: '分厚い隔壁だ。「E-WING　研究主任の許可なく開放を禁ず」' },
    ],
    enemies: [
      { type: 'guard2', x: 42, y: 10, lv: 7, id: 'c5_lab_e1', show: () => E.flag('c5_alarm') },
      { type: 'guard2', x: 48, y: 9, lv: 7, id: 'c5_lab_e2', show: () => E.flag('c5_alarm') },
      { type: 'drone', x: 46, y: 11, lv: 7, id: 'c5_lab_e3', show: () => E.flag('c5_alarm') },
      { type: 'guard', x: 53, y: 11, lv: 7, id: 'c5_lab_e4', show: () => E.flag('c5_alarm') },
      { type: 'drone', x: 54, y: 9, lv: 7, id: 'c5_lab_e5', show: () => E.flag('c5_alarm') },
    ],
    items: [{ x: 9, y: 4, item: 'repair2', id: 'c5_lab_i1' }],
    onEnter: async () => {
      if (!ch5()) return;
      setPh(5);
      if (E.flag('c5_lab_in')) return;
      E.set('c5_lab_in');
      E.cut();
      await E.wait(20);
      await E.say(null, '白い。床も、壁も、天井も。消毒液のにおいが、鼻の奥を刺す。');
      await E.say('ruu:serious', '……ここが、ニコの言ってた「しろいへや」。');
      await E.say('yui:sad', 'ずらりと並んだカプセル……。ここで、何人の子どもが……。');
      await E.say('kanata:serious', '端末に記録が残ってるかもしれない。……でも、まずはニコを探そう。');
      E.objective('研究室を調べ、ニコを助け出す');
    },
  });

  // ===============================================================
  //  貨物ドック（c5_dock）：合流 → ミラージュ再戦（痛み分け）→ アイゼン
  // ===============================================================
  G.addToMap('c5_dock', {
    npcs: [
      { id: 'c5_d_haru', char: 'sys', mech: 'harukaze', x: 8, y: 9, dir: 'down', move: 'still', noFace: true, show: () => ch5() && !E.flag('c5_dock_board') },
      { id: 'c5_d_rose', char: 'sys', mech: 'rose', x: 11, y: 9, dir: 'down', move: 'still', noFace: true, show: () => ch5() && !E.flag('c5_dock_board') },
      { id: 'c5_d_ponta', char: 'ponta', x: 9, y: 12, dir: 'left', move: 'still', show: () => ch5() && !E.flag('c5_dock_board') },
      { id: 'c5_d_doc', char: 'doc', x: 12, y: 12, dir: 'left', move: 'still', show: () => ch5() && !E.flag('c5_dock_board') },
    ],
    onEnter: async () => {
      if (!ch5() || E.flag('c5_dock_done')) return;
      setPh(7);
      await dockScene();
    },
  });
  async function dockScene() {
    E.cut();
    H.stash();
    H.actors([
      ['c5_a_ruu', 'ruu', 3, 13, 'right'],
      ['c5_a_niko', 'niko', 3, 15, 'right'],
      ['c5_a_yui', 'yui', 2, 14, 'right'],
    ]);
    E.teleport('player', 4, 14, 'right');
    await E.wait(20);
    await E.say('ponta', 'カナタ！　こっちっす！　……ニコちゃん！！');
    await E.say('niko:smile', 'ポンタ。……ドク。');
    await E.say('ponta:cry', 'ぶ、ぶっひゃー……！　よかったっす……よかったっすぅ……！');
    await E.say('doc', 'ふん。遅いぞ、若造。……キャベツくさいコンテナで、三時間も待たされたわい。');
    await E.say('doc', 'ほれ、乗れ。リフトは動かしてある。上がれば、グリーン・ブロックの集荷場だ。');
    await E.say('kanata:serious', 'よし……！　ルウ、行くぞ！');
    await E.say('ruu:grin', '待ってました！　ローズ、起きな！');
    await E.fadeOut(12);
    H.clear(['c5_a_ruu', 'c5_a_niko', 'c5_a_yui']);
    E.set('c5_dock_board');
    E.reload();
    G.field.player.setMech(true, 'harukaze');
    E.npc({ id: 'c5_a_rose', char: 'sys', mech: 'rose', x: 6, y: 16, dir: 'right', move: 'still' });
    E.teleport('player', 8, 13, 'right');
    E.se('boot');
    await E.fadeIn(12);
    await E.say(null, 'ハルカゼのコクピットに、ニコとユイが滑りこむ。狭いシートの後ろで、ニコがぎゅっとカナタの肩をつかんだ。');
    await E.say('niko:serious', '……カナタ。くる。くろい、おと。……すごく、かなしい、おと。');
    E.stopBgm(1);
    await E.wait(30);
    E.se('charge');
    E.flash(12);
    E.shake(8, 40);
    E.npc({ id: 'c5_a_noc', char: 'sys', mech: 'nocturne', x: 28, y: 4, dir: 'left', move: 'still' });
    await E.move('c5_a_noc', [[28, 13]], { speed: 3 });
    E.se('bigexplode');
    E.shake(10, 30);
    await E.camera(24, 13);
    await E.say('mirage', '……また、おまえか。');
    await E.say('ruu:angry', 'ノクターン……！');
    await E.say('kanata:serious', 'ニコは返してもらった。……今度は、負けない！');
    await E.say('mirage', '……その子を、置いていけ。それで、終わる。');
    await E.say('kanata:angry', '断る！！');
    await E.say('mirage', '……ならば、来い。');
    await E.cameraReset();
    E.remove('c5_a_noc');
    E.remove('c5_a_rose');
    let draw = false;
    E.cut(false);
    await E.battle({
      map: 'c5_dock', x: 8, y: 13, dir: 'right', mech: true, mechId: 'harukaze',
      enemies: [{ type: 'nocturne', x: 28, y: 13, lv: 8, hp: 2600, boss: true, name: 'ノクターン（ミラージュ）' }],
      allies: [ROSE],
      bgm: 'mirage', title: 'REMATCH', sub: 'ノクターンを食い止めろ', canLose: true,
      onStart: async () => {
        await E.say('niko:serious', 'カナタ。ほしの、こえ。……あのひとの、うごき、きこえる。');
        // 半分削るか、90秒しのげば「痛み分け」
        G.tasks.until(() => {
          const b = G.field.battle;
          if (!b || b.won || b.lost) return true;
          const n = G.field.enemies().find((e) => e.type === 'nocturne');
          if (b.active && ((n && n.hp < n.maxhp * 0.5) || b.t > 60 * 90)) {
            draw = true;
            if (n) {
              G.fx.explosion(n.x, n.y - 16, true);
              G.audio.se('bigexplode');
              G.field.shake = 10;
            }
            b.lost = true;
            return true;
          }
          return false;
        });
      },
      returnTo: ['c5_dock', 8, 13, 'right'],
    });
    E.set('c5_mirage_draw', draw);
    await eisenArrives(draw);
  }
  async function eisenArrives(draw) {
    E.cut();
    G.field.player.setMech(true, 'harukaze');
    E.npc({ id: 'c5_a_rose', char: 'sys', mech: 'rose', x: 6, y: 16, dir: 'right', move: 'still' });
    E.npc({ id: 'c5_a_noc', char: 'sys', mech: 'nocturne', x: 22, y: 13, dir: 'left', move: 'still' });
    E.bgm('tension');
    if (draw) {
      await E.say(null, 'ハルカゼのヒートスパナが、ノクターンの肩装甲を削り取った。黒い機体が、初めて膝をつく。');
      await E.say('ruu:grin', '当たった……！　カナタ、当たったよ！');
      await E.say('mirage', '……その、動き……。');
    } else {
      await E.say(null, 'ハルカゼの装甲が悲鳴を上げる。それでも――倒れなかった。カナタは、立ち上がった。');
      await E.say('kanata:angry', 'まだだ……！　まだ、立てる……！');
      await E.say('mirage', '……なぜ、退かない。');
    }
    await E.say('kanata:serious', 'あんたが誰でも関係ない。ニコは……オレたちの家族だ！');
    await E.say('mirage', '…………家族……。');
    E.emote('c5_a_noc', '…');
    await E.wait(30);
    E.se('alarm');
    await E.say(null, '――そのとき、ドックの隔壁が開いた。');
    E.npc({ id: 'c5_a_eisen', char: 'sys', mech: 'guardner2', x: 33, y: 5, dir: 'left', move: 'still' });
    E.npc({ id: 'c5_a_gd1', char: 'sys', mech: 'guardner', x: 35, y: 9, dir: 'left', move: 'still' });
    E.npc({ id: 'c5_a_gd2', char: 'sys', mech: 'guardner', x: 35, y: 18, dir: 'left', move: 'still' });
    E.bgm('boss');
    await E.move('c5_a_eisen', [[30, 10]], { speed: 1.5 });
    await E.say('eisen', 'そこまでだ、ミラージュ。');
    await E.say('ruu:surprise', 'アイゼン……！　公安まで来た……！');
    await E.say('eisen', 'ここは公安特務隊の管轄だ。研究所の私兵に、好き勝手はさせん。……下がれ。');
    await E.say('mirage', '……アイゼン。おまえは、命令に従うだけの男だと思っていた。');
    await E.say('eisen:serious', '命令には従う。だが、何に従うかは、私が決める。');
    await E.say('mirage', '…………。');
    E.se('boost');
    E.flash(10);
    await E.move('c5_a_noc', [[22, 1]], { speed: 4 });
    E.remove('c5_a_noc');
    await E.wait(30);
    await E.say('kanata:serious', '…………ニコは、渡さない。');
    await E.say('eisen', '……春瀬カナタ。');
    await E.say('eisen', '……今夜、私は何も見なかった。報告書にも、何も書かん。');
    await E.say('eisen:serious', '子供の遊びではない。……だが、大人の遊びは、もっとたちが悪い。');
    await E.say('eisen', '行け。リフトの電源は、十分後に落とす。……二度と、私の前に現れるな。');
    await E.move('c5_a_eisen', [[33, 5]], { speed: 1.5 });
    H.clear(['c5_a_eisen', 'c5_a_gd1', 'c5_a_gd2']);
    await E.say('ruu:surprise', '……なに、あいつ。味方なの？　敵なの？');
    await E.say('yui:think', '……わかりません。でも、父のファイルにあった「アイゼン」の名前は……もしかしたら、研究所を調べていた側の名前だったのかもしれません。');
    await E.say('niko', 'あのひと、つめたい、おと。……でも、きょうは、すこし、あったかかった。');
    await E.say('doc', 'ふん。考えるのは後だ。リフトを上げるぞ、若造ども！');
    E.set('c5_dock_done');
    H.reward(600);
    await E.fadeOut(40);
    E.remove('c5_a_rose');
    await homecoming();
  }

  // ===============================================================
  //  帰還（星屑亭）→ 運河のシグ → 第6章へ
  // ===============================================================
  // デバッグ・テスト用の入口
  G.C5 = { planning: () => planning(), t1Open: () => t1Open(), wardenFight: () => wardenFight(), rescueNiko: () => rescueNiko(), dockScene: () => dockScene(), homecoming: () => homecoming() };

  async function homecoming() {
    setPh(8);
    E.time('night');
    E.party([]);
    H._party = [];
    await E.warp('hoshikuzu', 6, 7, 'up', { noEnter: true, noFade: true });
    E.cut();
    E.remove('w_taxi');
    H.actors([
      ['c5_a_niko', 'niko', 4, 6, 'up'],
      ['c5_a_ruu', 'ruu', 2, 6, 'up'],
      ['c5_a_yui', 'yui', 6, 6, 'up'],
      ['c5_a_ponta', 'ponta', 8, 6, 'up'],
      ['c5_a_doc', 'doc', 13, 6, 'left'],
    ]);
    E.teleport('player', 5, 7, 'up');
    E.bgm('home');
    await E.fadeIn(40);
    await E.say(null, '夜明け前の星屑亭。暖簾の向こうから、湯気と、いいにおいがあふれていた。');
    await E.say('tome:smile', '……おかえり。');
    await E.say('niko:cry', '……ただいま。');
    await E.say('tome', 'さ、食いな。チャーシュー、ちゃんと取っておいたよ。');
    E.se('pickup');
    await E.say(null, 'ことり、と置かれたどんぶり。分厚いチャーシューが、三枚も乗っている。');
    await E.say('niko:surprise', 'ラーメン……！　ばあちゃんの、ラーメン……！');
    await E.say(null, 'ニコは夢中ですすった。すすりながら、泣いていた。泣きながら、笑っていた。');
    await E.say('niko:smile', 'おいしい。……おいしい。ニコ、ここに、かえってきた。');
    await E.say('ruu:cry', '……もう、どこにも行かせないから。');
    await E.say('ponta:cry', 'オイラ、もうダメっす……涙でスープがしょっぱいっす……。');
    await E.say('doc', 'ふん。……ネジにも、土産話ができたわい。');
    await E.say('yui:serious', '……通行証は、わたしが父の執務室に戻しておきます。……いえ、やっぱり、もう少しだけ持っていてください。');
    await E.say('yui', '父とは、いつか必ず話します。わたしの言葉で。……でも、それは今日じゃありません。');
    await E.say('tome', 'ユイちゃんも、食べていきな。今日はみんな、ばあちゃんのおごりだよ。');
    await E.say('yui:smile', '……はい。いただきます。');
    await E.say('kanata:smile', '（なんとかなった。……いや、みんなで、なんとかしたんだ）');
    await E.fadeOut(40);
    H.clear(['c5_a_niko', 'c5_a_ruu', 'c5_a_yui', 'c5_a_ponta', 'c5_a_doc']);
    // 運河のシグ
    await E.warp('minato', 13, 30, 'right', { noEnter: true, noFade: true });
    E.cut();
    E.npc({ id: 'c5_a_sig', char: 'sig', x: 16, y: 30, dir: 'left', move: 'still' });
    E.stopBgm(1);
    await E.fadeIn(40);
    await E.say(null, 'みんなが眠ったあと。カナタはひとり、運河のほとりに出ていた。');
    await E.say(null, '胸のペンダントが、かすかに温かい。……ふと顔を上げると、そこに彼がいた。');
    E.bgm('space');
    await E.say('kanata', '……シグ。');
    await E.say('sig', '……ニコを、取り戻したんですね。よかった。');
    await E.say('kanata:serious', '研究棟で、おまえの記録を見た。「被験体E-00」……記録日は、S.C.0091。');
    await E.say('kanata', '六年後の日付だ。……シグ、おまえは、いったい何者なんだ？');
    await E.say('sig', '…………。');
    await E.say('sig:serious', '僕にとっては……過去の日付です。');
    E.emote('player', '!?');
    await E.say('kanata:surprise', '過去……？　それって、どういう――');
    await E.say('sig', 'カナタ。黒い機体のパイロットに、次に会ったら……その仮面の下を、見てください。');
    await E.say('sig', 'きっと、あなたにしか、外せないから。');
    E.se('echo');
    E.flash(12);
    E.remove('c5_a_sig');
    await E.wait(30);
    await E.say('kanata', '……シグ。');
    await E.cg('colony_night', '運河の水面に、ニセモノの夜空が揺れている。胸のペンダントが、ひとつ、澄んだ音で鳴った。');
    E.cgOff();
    // 後の章のための状態
    E.party(['ruu', 'niko']);
    if (!E.has('pendant')) E.give('pendant', 1, { quiet: true });
    E.equip('acc', 'pendant');
    if (!G.state.skills.includes('echo')) G.state.skills.push('echo');
    if (!E.has('keycard')) E.give('keycard', 1, { quiet: true });
    if (!E.has('pass_core')) E.give('pass_core', 1, { quiet: true });
    E.set('c4_yui_ally');
    E.set('c5_niko_rescued');
    E.set('c5_done');
    H.reward(500);
    await E.startChapter(6);
  }
})();
