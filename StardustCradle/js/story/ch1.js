// =============================================================
//  story/ch1.js — 第1章「ジャンクヤードの白い影」
//   進行は E.val('c1_ph') で管理：
//    0 放課後の教室→スクラップ・ベイへ  1 ベイ到着→ドクのガレージを探す
//    2 部品探し（ジャイロ/アクチュエータ/パワーセル）  3 部品がそろった→ガレージへ
//    4 夜・封鎖→資材ヤード（ステルス）  5 廃材置き場（ニコ・機体戦）
//    6 ニコを連れて星屑亭へ  7 終了
// =============================================================
(function () {
  const ch1 = () => G.state.chapter === 1;
  const ph = () => E.val('c1_ph');
  const setPh = (n) => E.set('c1_ph', n);
  const at = (n) => ch1() && ph() === n;
  const C1 = (G.C1 = {});
  const trail = (id) => G.C0 && G.C0.trail(id);
  const turnBack = (dir, lines) =>
    async function () {
      const l = typeof lines === 'function' ? lines() : lines;
      for (const [who, t] of l) await E.say(who, t);
      await E.move('player', dir);
    };
  const partsN = () => (E.has('gyro') ? 1 : 0) + (E.has('c1_actuator') ? 1 : 0) + (E.has('c1_cell') ? 1 : 0);
  const partsObj = () => '部品を探す（' + partsN() + '/3：ジャイロ・アクチュエータ・パワーセル）';

  // ===============================================================
  //  章の開始：翌日の放課後、2年B組
  // ===============================================================
  G.STORY.chapters[1] = async function () {
    const s = G.state;
    for (const k of Object.keys(s.flags)) if (k.startsWith('c1_') || k.startsWith('k_c1_') || k.startsWith('item_scrapbay_c1')) delete s.flags[k];
    setPh(0);
    E.time('evening');
    E.party([]);
    s.mech.id = 'ponkotsu';
    if (!s.equip.weapon) {
      G.addItemCount('wrench', 1);
      E.equip('weapon', 'wrench');
    }
    for (const id of ['gyro', 'c1_actuator', 'c1_cell', 'parts_list']) delete s.items[id];
    E.objective('');
    E.cut(true);
    G.field.fade = 1;
    await E.chapter(1);
    await E.warp('classroom', 6, 9, 'up', { noEnter: true });
    E.cut(true);
    E.npc({ id: 'c1_vargas', char: 'vargas', x: 11, y: 3, dir: 'down' });
    await E.wait(20);
    await E.say(null, '揺れの翌日。教室は、朝からその話でもちきりだった。');
    await E.say('vargas', '——ホームルームは以上だ。……それと、連絡事項がひとつある。');
    await E.say('vargas:serious', 'ゆうべから、公安局がスクラップ・ベイ周辺を夜間巡回している。理由は……先生たちにも知らされていない。');
    await E.say('vargas', '暗くなったら、あのあたりには近づくな。……いいな、特に春瀬と水無月！');
    E.face('c1_ruu_c', 'left');
    await E.say('ruu:angry', 'なんであたしたち名指し！？');
    await E.say('vargas:angry', '日ごろの行いだ！ 以上、解散！');
    await E.move('c1_vargas', [[13, 3], [13, 5], [19, 5], [19, 13], [20, 13], [20, 14]], { speed: 1.6 });
    E.remove('c1_vargas');
    E.face('c1_ponta_c', 'left');
    await E.say('ponta', 'カナタ～！ 聞いてくださいっす！ 昨日の揺れで、ポン湯の湯船が大波になったっす！');
    await E.say('ponta', 'オイラ、湯船の端から端まで流されたっす！ コロニーで波乗りした最初の人類っす！');
    await E.say('kanata', '……楽しそうだな。');
    await E.say('kanata', 'それより、オレ、今日スクラップ・ベイに行く。ポンコツ号の部品を探しに。');
    E.face('c1_ruu_c', 'left');
    await E.say('ruu:surprise', 'ポンコツ号って……昨日屋上で言ってた、お父さんのワークフレーム？');
    await E.say('kanata', 'ああ。ばあちゃんが、明るいうちなら行っていいって。');
    await E.say('ponta:surprise', 'ぶっひゃー！ ポンコツ号って、PW-03型っすよね！？ 30年前の傑作ワークフレーム！ 関節がぜんぶ手作業で調整できるやつ！');
    await E.say('ponta:sad', 'オイラも行きたいっす……でも今日は、ポン湯の番台当番なんす……。');
    await E.say('ponta', 'そうだ、ジャイロユニットを探すなら、ベイの南西のコンテナ置き場っす。軍の払い下げ品がよく流れつくって、パーツ屋のボルトさんが言ってたっす！');
    await E.say('ponta', 'それと、これ！ オイラが組んだ修理キットっす。機体に乗ることがあったら使うっす！');
    await E.give('repair', 1, { wait: true });
    await E.say('ruu', '……ねえカナタ。あたしも行く。');
    await E.say('kanata:surprise', 'え？ でも、門限……');
    await E.say('ruu', '園に帰っても、ちびたちの宿題みてやるだけだし。……それに、動いたら乗せてくれるんでしょ。肩の上。');
    await E.say('kanata:smile', '……覚えてたのか。');
    await E.say('ruu:shy', 'うっさい。行くよ。');
    E.face('c1_yui_c', 'right');
    await E.say('yui', '……春瀬くん。水無月さん。');
    await E.say('yui', 'スクラップ・ベイに行くなら……本当に、気をつけてください。');
    await E.say('yui:serious', 'ゆうべ、父が書斎で電話しているのを聞いてしまったんです。「被験体の回収を急げ」って……。');
    await E.say('kanata', 'ひけんたい……？');
    await E.say('yui:surprise', '……！ な、なんでもありません！ 聞かなかったことにしてください！ 校則……校則とは関係ないですけど、お願いします！');
    E.face('c1_yui_c', 'up');
    E.remove('c1_ruu_c');
    E.set('c1_ruu_join');
    E.party(['ruu']);
    E.objective('スクラップ・ベイへ行く（ミナト区の大通りを南へ）');
    await E.say(null, '（スクラップ・ベイは、ミナト区の大通りをまっすぐ南。準備をしてから向かおう）');
    E.cut(false);
  };

  // ===============================================================
  //  学校（第1章）
  // ===============================================================
  G.addToMap('classroom', {
    npcs: [
      { id: 'c1_ruu_c', char: 'ruu', x: 14, y: 9, dir: 'up', move: 'still', show: () => at(0) && !E.flag('c1_ruu_join'), talk: async () => E.say('ruu', 'なに？') },
      {
        id: 'c1_ponta_c', char: 'ponta', x: 17, y: 9, dir: 'up', move: 'still', show: () => at(0),
        talk: async () => {
          if (!E.flag('c1_ponta_t')) {
            E.set('c1_ponta_t');
            await E.say('ponta', 'PW-03型の弱点は、左膝の駆動系っす。設計上、どうしても負荷がかかるんす。');
            await E.say('ponta', 'あと、パワーセルは旧規格だから、今の市販品は合わないっす。軍の払い下げを探すしかないっす。');
            await E.say('ponta:grin', '部品がそろったら、オイラにも見せてほしいっす！ 約束っすよ！');
            return;
          }
          await E.say('ponta', '番台当番、サボったら父ちゃんに湯船に沈められるっす……。ぶっひゃー。');
        },
      },
      {
        id: 'c1_yui_c', char: 'yui', x: 6, y: 7, dir: 'up', move: 'still', show: () => at(0),
        talk: async () => {
          await E.say('yui', '……さっきの話、本当に忘れてください。');
          await E.say('yui:sad', '父は、コロニーのために働いているんです。悪いことなんて、するはずありません。……するはず、ないんです。');
        },
      },
    ],
  });
  G.addToMap('school_hall', {
    npcs: [
      {
        id: 'c1_mimi', char: 'mimi', x: 40, y: 12, dir: 'down', move: 'still', show: () => at(0),
        talk: async () => {
          if (!E.flag('c1_mimi_t')) {
            E.set('c1_mimi_t');
            await E.say('mimi', 'あっ、春瀬先輩！ ルウ先輩も！ ちょうどいいとこに！');
            await E.say('mimi', 'ゆうべ、スクラップ・ベイの上空を「白い光」が飛んでったって目撃情報が、3件も来てるっす！');
            await E.say('kanata:surprise', '白い光……！？ それ、オレも見たかも。部屋の窓から。');
            await E.say('mimi', 'マジっすか！？ 証言いただきっす！ ……あやしいっす、ぜったいスクープの匂いがするっす！');
            await E.say('ruu', 'どうせドローンでしょ。');
            await E.say('mimi', 'ドローンは、あんなふうに羽を広げたりしないっすよ！ ミミも現場に行きたいっすけど、今日は部の予算会議で……。');
            await E.say('mimi', '先輩たち、ベイに行くなら写真お願いっす！ ブレててもいいっす！');
            return;
          }
          await E.say('mimi', 'スクラップ・ベイの「白い光」、何かわかったら教えてくださいっす！ 一面は空けとくっす！');
        },
      },
    ],
  });

  // ===============================================================
  //  ミナト区（第1章）
  // ===============================================================
  const inTown = () => ch1() && ph() <= 3;
  G.addToMap('minato', {
    events: [
      { x: 70, y: 22, w: 1, h: 3, cond: inTown, run: turnBack('L', [['ruu', 'ネオン通りは夜からでしょ。今日はスクラップ・ベイ！ 寄り道してたら日が暮れるよ。']]) },
      { x: 1, y: 22, w: 1, h: 3, cond: inTown, run: turnBack('R', [['ruu', 'グリーン・ブロック？ 野菜でも買うの？ ……ベイは南だってば。']]) },
      { x: 70, y: 22, w: 1, h: 3, cond: () => at(6), run: turnBack('L', [['ruu', 'ちょっと、この子連れてどこ行くの。星屑亭は西だよ！']]) },
      { x: 1, y: 22, w: 1, h: 3, cond: () => at(6), run: turnBack('R', [['ruu', 'そっちじゃない！ 星屑亭、星屑亭！']]) },
      { x: 34, y: 46, w: 4, h: 1, cond: () => at(6), run: turnBack('U', [['ruu', 'ベイに戻ってどうすんの！ 公安がうようよしてるって！']]) },
      { x: 34, y: 1, w: 4, h: 1, cond: () => at(6), run: turnBack('D', [['ruu', '学校に行ってもしょうがないでしょ。星屑亭！']]) },
      // 運河の橋で
      {
        x: 33, y: 33, w: 6, h: 1, once: 'c1_bridge', cond: () => ch1() && ph() <= 1 && G.state.party.includes('ruu'),
        run: async () => {
          E.cut(true);
          await E.say('ruu', 'ねえ、ちょっと止まって。');
          E.face('player', 'left');
          await E.say('ruu', 'ほら、運河。夕方になると、ミラーの光が水に映って……空が二つになるんだよ。');
          await E.say(null, '見下ろすと、ピンク色の空が運河の水面にゆらめいている。上にも空、下にも空。');
          await E.say('kanata', '……ほんとだ。上と下に、ピンクの空。');
          await E.say('ruu', '園のちびたちに見せてやりたいな。……あいつら、なかなか外出許可が出ないから。');
          await E.say('kanata', 'じゃあ、今度連れてこいよ。オレも手伝う。');
          await E.say('ruu:shy', '……ちびたち、うるさいよ？ あんたのゴーグル、ぜったい取り合いになる。');
          await E.say('kanata:smile', 'なんとかなるって。');
          await E.say('ruu:smile', '……ふふ。行こ。');
        },
      },
    ],
    onEnter: async () => {
      if (at(6) && !E.flag('c1_canal_night')) {
        E.set('c1_canal_night');
        E.cut(true);
        await E.wait(20);
        await E.say(null, '排水路のはしごを登ると、そこは見なれたミナト区の運河ぞいだった。');
        await E.say(null, '夜の街は、何事もなかったように静かだ。遠くでサイレンが鳴っている。');
        await E.say('niko', '……ん……。');
        await E.say('ruu', 'あ、起きた。');
        await E.say('niko', '……ここ、どこ？');
        await E.say('kanata', 'ミナト区。今からオレんちに行く。……ばあちゃんのラーメン、うまいぞ。');
        await E.say('niko', '……らーめん？');
        await E.say(null, 'ニコは、ゆっくりと空を見上げた。夜の側の空に、向こう側の街の灯りがまたたいている。');
        await E.say('niko', '……ここの、そら……ないてない。');
        await E.say('niko:smile', '……やさしい、そら。');
        await E.say('ruu', '……ニセモノの空だけどね。');
        await E.say('niko', '……にせもの？ ……でも、あったかい。');
        await E.say('ruu:sad', '……。……そっか。');
        E.objective('ニコを連れて星屑亭へ帰る（運河の北、商店街の西）');
        E.cut(false);
      }
    },
  });

  // コンビニで、ルウの買い物
  G.addToMap('konbini', {
    onEnter: async () => {
      if (!ch1() || ph() > 3 || E.flag('c1_ruu_candy') || !G.state.party.includes('ruu')) return;
      E.set('c1_ruu_candy');
      E.cut(true);
      await E.wait(10);
      await E.say('ruu', 'あ、ちょうどいいや。ちびたちのおみやげ、買ってこ。');
      await E.say(null, 'ルウは、ネオンキャンディの袋を両手いっぱいにかかえてレジに並んだ。');
      await E.say('kanata', '……そんなに？');
      await E.say('ruu', '園のちび、7人いるんだよ。一人でも少ないと、ケンカになるの。');
      await E.say('ruu:shy', 'はい、これ。……あんたのぶん。おすそわけ。');
      await E.give('candy', 1, { wait: true });
      await E.say('kanata:smile', 'サンキュ。ルウ、いい姉ちゃんしてるんだな。');
      await E.say('ruu:angry', 'う、うっさい！ 姉ちゃんとかじゃないし！');
      E.cut(false);
    },
  });

  // ===============================================================
  //  星屑亭（第1章：寄り道と、ラスト）
  // ===============================================================
  G.addToMap('hoshikuzu', {
    onEnter: async () => {
      if (!ch1()) return;
      if (ph() === 6) return C1.ending();
      if (ph() <= 3 && !E.flag('c1_tome_visit')) {
        E.set('c1_tome_visit');
        E.cut(true);
        await E.say('tome', 'おや、カナタ。ルウちゃんも一緒かい。');
        await E.say('ruu:shy', 'こ、こんにちは……。');
        await E.say('kanata', 'ばあちゃん、今からスクラップ・ベイに行ってくる。ポンコツ号の部品、探しに。');
        await E.say('tome', 'ふん……言い出したら聞かないのは、誰に似たんだかね。');
        await E.say('tome', 'ほれ、持っていきな。腹が減っては、ネジ一本まわせないよ。');
        await E.give('onigiri', 3, { wait: true });
        await E.say('tome', 'ドクに会ったら言っときな。「ツケ、いいかげん払え」ってね。');
        await E.say('ruu:surprise', 'ツケ？ ドクって人、ここのお客さんなの？');
        await E.say('tome', '腐れ縁ってやつさ。……暗くなる前に帰ってくるんだよ。いいね。');
        E.cut(false);
      }
    },
  });

  C1.ending = async function () {
    E.cut(true);
    E.time('night');
    await E.wait(20);
    await E.say('tome:angry', 'カナタ！ こんな時間まで、どこほっつき歩いて——');
    E.emote('w_tome', '!');
    await E.wait(30);
    await E.say(null, 'ばあちゃんの目が、カナタの後ろの、白い髪の女の子に止まった。');
    await E.say('tome:serious', '……。');
    await E.say('kanata', 'ばあちゃん、この子……');
    await E.say('ruu', 'あの、トメばあちゃん、これには事情が——');
    await E.say('tome', '……話は、あとだよ。');
    await E.say('tome', 'まずは、その子を座らせな。……腹、減ってるんだろう？');
    await E.say('niko', '……ニコ、おなか、すいた。');
    await E.say('tome:smile', 'ふん。……いい返事だ。');
    await E.fadeOut(40);
    setPh(7);
    E.set('c1_done');
    E.exp(20);
    await E.startChapter(2);
  };

  // ===============================================================
  //  スクラップ・ベイ（第1章）
  // ===============================================================
  const partGot = async function () {
    E.exp(20);
    const n = partsN();
    if (n >= 3) {
      E.cut(true);
      await E.notice('ポンコツ号の部品が、ぜんぶそろった！', { col: G.UI.gold });
      await E.say('ruu:grin', 'やったじゃん、カナタ！ 三つとも！');
      await E.say('kanata:smile', 'ああ。……ドクのガレージに戻ろう！');
      setPh(3);
      E.objective('ドクのガレージに戻る（ベイの北西）');
    } else E.objective(partsObj());
  };
  const cubeHint = (flag) => async () => {
    if (!G.state.party.includes('cube')) return;
    E.emote('f_cube', '!');
    E.se('cursor');
    await E.say('cube', 'ピポッ！ ピポポポポ！');
    await E.say('ruu', 'キューブが騒いでる……。このへんに部品があるのかも。');
  };
  const sbEnemy = () => ch1() && (ph() === 2 || ph() === 3);
  G.addToMap('scrapbay', {
    objects: [
      { p: 'c1_glint', x: 5, y: 36, show: () => ch1() && ph() === 2 && !E.has('gyro') },
      { p: 'c1_glint', x: 48, y: 30, col: '#ffd25e', show: () => ch1() && ph() === 2 && !E.flag('c1_botfight') },
      { p: 'c1_glint', x: 40, y: 5, col: '#ff5fa2', show: () => ch1() && ph() === 2 && !E.has('c1_cell') },
    ],
    enemies: [
      { type: 'rat', x: 12, y: 32, lv: 1, id: 'c1_rat1', show: sbEnemy },
      { type: 'rat', x: 20, y: 39, lv: 1, id: 'c1_rat2', show: sbEnemy },
      { type: 'rat', x: 3, y: 44, lv: 2, id: 'c1_rat3', show: sbEnemy },
      { type: 'rat', x: 16, y: 45, lv: 1, id: 'c1_rat4', show: sbEnemy },
      { type: 'rat', x: 24, y: 35, lv: 2, id: 'c1_rat5', show: sbEnemy },
      { type: 'rat', x: 42, y: 23, lv: 1, show: sbEnemy },
      { type: 'rat', x: 58, y: 24, lv: 1, show: sbEnemy },
      { type: 'bot', x: 60, y: 18, lv: 1, show: sbEnemy },
      { type: 'rat', x: 50, y: 6, lv: 1, show: sbEnemy },
    ],
    npcs: [
      {
        id: 'c1_momo', char: 'c1_momo', x: 34, y: 11, dir: 'down', move: 'still', show: () => ch1() && ph() >= 1 && ph() <= 3,
        talk: async () => await C1.momo(),
      },
    ],
    items: [
      {
        x: 63, y: 16, item: 'c1_spring', id: 'c1_spring', show: () => ch1() && E.flag('c1_momo_q') && !E.flag('c1_momo_done'),
        onPick: async () => {
          await E.say('kanata', 'これ……オルゴールのゼンマイだ。小さな星の模様がついてる。');
          await E.say('ruu', 'モモちゃんが探してたやつじゃない？ 持っていってあげよ。');
        },
      },
    ],
    checks: [
      {
        x: 41, y: 4, w: 3, h: 1, show: () => ch1() && ph() === 2 && !E.has('c1_cell'),
        run: async () => await C1.cellBox(),
      },
    ],
    events: [
      // 到着後の小手調べ：スクラップラットの奇襲
      {
        x: 28, y: 6, w: 6, h: 1, once: 'c1_rat_ambush', cond: () => at(1),
        run: async () => await C1.ratAmbush(),
      },
      // アンダーシェル行きのエレベーター
      {
        x: 52, y: 14, w: 3, h: 1, cond: () => ch1(),
        run: turnBack('D', [['w2_bouncer', '……おい、そこのガキども。ここは子どもの来るところじゃない。'], ['w2_bouncer', 'ゆうべから公安がうろついてる。……用がないなら、帰んな。']]),
      },
      // 部品1：ジャイロ（コンテナ迷路のすき間）
      {
        x: 2, y: 33, w: 8, h: 7, once: 'c1_nest', cond: () => at(2) && !E.has('gyro'),
        run: async () => await C1.ratNest(),
      },
      // 部品2：アクチュエータ（南東の廃材の山）
      {
        x: 43, y: 27, w: 11, h: 7, once: 'c1_botfight', cond: () => at(2),
        run: async () => await C1.botFight(),
      },
      // 宇宙港ゲート
      {
        x: 50, y: 45, w: 8, h: 2, once: 'c1_gate_talk', cond: () => ch1() && ph() >= 1 && ph() <= 3,
        run: async () => {
          E.cut(true);
          await E.say('ruu', 'これが宇宙港のゲート……。この向こうに、外があるんだよね。');
          await E.say('kanata', '10年前から封鎖されてるって。戦争が終わってから、一度も開いてない。');
          await E.say('ruu:serious', '……いつか、こじ開けてやる。');
          await E.say('ruu', '本物の空って、きっとこの扉の向こうから始まってるんだ。');
          if (G.state.party.includes('cube')) await E.say('cube', 'ピポ……。');
        },
      },
      // キューブの反応（ヒント）
      { x: 0, y: 28, w: 14, h: 15, once: 'c1_hint1', cond: () => at(2) && !E.has('gyro'), run: cubeHint() },
      { x: 40, y: 25, w: 17, h: 10, once: 'c1_hint2', cond: () => at(2) && !E.flag('c1_botfight'), run: cubeHint() },
      { x: 37, y: 2, w: 10, h: 6, once: 'c1_hint3', cond: () => at(2) && !E.has('c1_cell'), run: cubeHint() },
    ],
    onEnter: async () => {
      if (!ch1()) return;
      if (ph() === 0) {
        setPh(1);
        E.cut(true);
        await E.wait(20);
        await E.say('ruu:surprise', 'うわ……ガラクタの山……。');
        await E.say('kanata', 'スクラップ・ベイ。コロニーじゅうのいらなくなった物が、最後に流れつく場所だ。');
        await E.say('ruu', '鉄と油のにおい……。けど、なんかワクワクするね。宝探しみたい。');
        await E.say('kanata', 'ドクのガレージは、たしかベイの北西のほう。赤い看板が目印だったはず。');
        E.objective('ドクのガレージを探す（ベイの北西）');
        E.cut(false);
      } else if (ph() === 2 && !E.flag('c1_explore_talk')) {
        E.set('c1_explore_talk');
        E.cut(true);
        await E.say('ruu', 'さて、宝探しの始まりだね。どこから行く？');
        await E.say('kanata', 'ドクの話だと……ジャイロは南西のコンテナ迷路、アクチュエータは南東の廃材の山、パワーセルは北東のコンテナ置き場。');
        await E.say('cube', 'ピポ！');
        await E.say('ruu:smile', 'キューブも「まかせろ」だって。……たぶん。');
        E.cut(false);
      }
    },
  });

  // ---- 寄り道：モモのオルゴール ----
  C1.momo = async function () {
    if (E.flag('c1_momo_done')) {
      return E.say('c1_momo', G.pick(['♪～……オルゴール、ちゃんと鳴るよ。おにいちゃん、ありがと。', 'ママが帰ってくるまで、毎日ここで鳴らすの。そしたら、迷子にならないでしょ？']));
    }
    if (E.has('c1_spring')) {
      E.cut(true);
      await E.say('kanata', 'モモちゃん、これ。廃材の山の東のほうに落ちてた。');
      await E.say('c1_momo', '……！ モモのゼンマイ！');
      await E.say(null, 'モモは、ゼンマイを小さな木箱にはめこみ、ネジを巻いた。');
      E.se('echo');
      await E.say(null, '♪……ポロン、ポロロン……。かすれた、やさしいメロディが流れ出す。');
      await E.say('c1_momo', 'ママがね、くれたの。宇宙港で働いてて……10年前から、帰ってこないけど。');
      await E.say('c1_momo', 'このオルゴールが鳴ってたら、ママ、迷子にならずに帰ってこられるんだって。');
      await E.say('ruu:sad', '……。');
      await E.say('ruu', '……そっか。じゃあ、毎日ちゃんと鳴らさなきゃね。');
      await E.say('c1_momo', 'うん！ おねえちゃん、おにいちゃん、ありがと！ これ、あげる。モモの宝物のひとつ！');
      E.take('c1_spring', 1);
      E.set('c1_momo_done');
      await E.give('energy', 2, { wait: true });
      E.money(80);
      await E.say('ruu', '……ねえ、カナタ。宇宙港のゲートの向こうって、10年前、何があったんだろうね。');
      await E.say('kanata', '……わからない。でも、みんな、何かを待ってるみたいだ。');
      E.cut(false);
      return;
    }
    if (E.flag('c1_momo_q')) return E.say('c1_momo', 'ゼンマイ、ゼンマイ……。ちっちゃくて、お星さまの模様がついてるの。東のほうの、コンテナのとこで落としたかも……。');
    E.cut(true);
    await E.say('c1_momo', '……ぐすっ。');
    await E.say('ruu', 'どうしたの？ こんなところで。');
    await E.say('c1_momo', 'オルゴールのゼンマイ、落としちゃったの……。ガラクタの山のどこかに……。');
    await E.say('c1_momo', 'ママがくれた、たいせつなオルゴールなの……。');
    const i = await E.ask('ruu', '……カナタ。', ['いっしょに探そう', 'ごめん、急いでるんだ']);
    if (i === 0) {
      await E.say('kanata', 'いっしょに探すよ。どんなゼンマイ？');
      await E.say('c1_momo', 'ちっちゃくて、お星さまの模様がついてるの。東のほう……コンテナがいっぱいあるとこで、走ってたら落としちゃった。');
      await E.say('ruu:smile', 'まかせて。このおにいちゃん、部品さがしのプロだから。');
      E.set('c1_momo_q');
      E.reload();
    } else {
      await E.say('ruu:angry', '……カナタ。');
      await E.say('kanata', '……ごめん、やっぱり探す。どんなゼンマイ？');
      await E.say('c1_momo', 'ちっちゃくて、お星さまの模様……。東のほうのコンテナのとこ……。');
      E.set('c1_momo_q');
      E.reload();
    }
    E.cut(false);
  };

  C1.ratAmbush = async function () {
    E.cut(true);
    E.se('hit');
    E.shake(2, 14);
    await E.say(null, 'ガラガラッ！ 廃材の山がくずれ、何かが飛び出してきた！');
    await E.say('ruu:surprise', 'ネズミ！？ ……じゃない、機械のネズミ！');
    await E.say('kanata', 'スクラップラットだ！ 廃材をかじって巣を作る、野良の掃除ロボ！');
    await E.say('ruu:grin', 'へえ、ちょうどいいじゃん。準備運動！');
    await E.notice('【戦闘のコツ】Zの連打で3段コンボ。最後の一撃は敵をふっとばす。\nXのダッシュ中は無敵。囲まれたらダッシュで抜けよう。\nルウも一緒に戦ってくれる。');
    E.cut(false);
    await E.battle({
      enemies: [{ type: 'rat', x: 27, y: 9, lv: 1 }, { type: 'rat', x: 33, y: 10, lv: 1 }, { type: 'rat', x: 30, y: 12, lv: 1 }],
      title: 'BATTLE!', sub: 'スクラップラットを追いはらえ',
    });
    E.cut(true);
    await E.say('ruu:grin', 'ふふん、楽勝！');
    await E.say('kanata', 'ルウ、ケンカ強いよな……。');
    await E.say('ruu', '園じゃ、ちびたちを守るのはあたしの役目だからね。');
    E.cut(false);
  };

  C1.ratNest = async function () {
    E.cut(true);
    await E.say(null, 'コンテナのすき間で、何かが青く光っている。');
    await E.say('kanata:surprise', 'あれ……ジャイロユニットじゃないか！？');
    E.se('hit');
    E.shake(2, 12);
    await E.say('ruu:surprise', 'げっ、ネズミの巣！ ジャイロの上に巣を作ってる！');
    await E.say('kanata', 'あいつら、光る部品が好きなんだ。……どいてもらうぞ！');
    E.cut(false);
    await E.battle({
      enemies: [
        { type: 'rat', x: 5, y: 33, lv: 1 }, { type: 'rat', x: 3, y: 38, lv: 2, name: 'スクラップラット（巣の主）' },
        { type: 'rat', x: 7, y: 38, lv: 1 }, { type: 'rat', x: 9, y: 35, lv: 2 },
      ],
      title: 'BATTLE!', sub: 'ラットの巣からジャイロを取りもどせ',
    });
    E.cut(true);
    await E.say(null, 'カナタはコンテナのすき間に腕をつっこんで、青く光る球体を引っぱり出した。');
    await E.give('gyro', 1, { wait: true });
    await E.say('kanata:smile', 'PW-03用の姿勢制御ジャイロ……型番もぴったりだ！ ヒビもない！');
    await E.say('ruu', 'ネズミのよだれでベトベトだけどね。');
    E.reload();
    await partGot();
    E.cut(false);
  };

  C1.botFight = async function () {
    E.cut(true);
    await E.say(null, '廃材の山のふもとで、黄色い何かが、ガタガタと動いている。');
    await E.say('sys', 'ギ……ギギ……。シン……ニュウ……シャ……。ハイキ……ハイキ……。', { name: '？？？' });
    await E.say('ruu:surprise', 'なにあれ、でっか！');
    await E.say('kanata', '暴走した整備ボットだ。……おい、あの脚を見ろ！');
    await E.say('kanata:surprise', 'あいつ、ワークフレーム用のアクチュエータを、自分の脚にくっつけてやがる！');
    await E.say('ruu:grin', 'じゃ、ぶっとばして返してもらおっか！');
    if (G.state.skills.includes('spark')) await E.say('kanata', '（ドクのスパーク……Cで使えるんだったな）');
    E.cut(false);
    await E.battle({
      enemies: [
        { type: 'bot', x: 48, y: 31, lv: 3, hp: 75, name: '暴走整備ボット〈ガンテツ〉' },
        { type: 'rat', x: 44, y: 30, lv: 1 }, { type: 'rat', x: 52, y: 32, lv: 1 },
      ],
      title: 'BATTLE!', sub: '暴走ボット〈ガンテツ〉を止めろ',
    });
    E.cut(true);
    await E.say(null, '動かなくなったボットの脚から、カナタはアクチュエータを慎重に取りはずした。');
    await E.give('c1_actuator', 1, { wait: true });
    await E.say('kanata', '……ちょっと焦げてるけど、コイルは生きてる。ドクなら直せるはず。');
    await E.say('ruu', 'このボット、ちょっとかわいそうだね。……自分の脚、ほしかったのかな。');
    await E.say('kanata', '……ドクに頼んで、あとで直してもらおうか。こいつも。');
    E.reload();
    await partGot();
    E.cut(false);
  };

  C1.cellBox = async function () {
    E.cut(true);
    if (!E.flag('c1_box_seen')) {
      E.set('c1_box_seen');
      await E.say(null, '「AF-PARTS」と書かれたコンテナ。すき間から、ピンク色の光がもれている。');
      await E.say('kanata', '中にパワーセルがありそうだ。……けど、扉がさびついて開かない。');
      await E.say('ruu', 'スパナでこじ開けたら？ お父さんのスパナでしょ。きっと、こういう時のためにあるんだよ。');
    }
    const i = await E.ask(null, 'スパナで扉をこじ開ける？', ['こじ開ける', 'やめておく'], { cancel: 1 });
    if (i !== 0) return;
    const n = await E.timing({ title: 'さびた扉をこじ開ける', rounds: 3, speed: 1.3, zone: 0.22, labels: ['スパナをすき間にかませる！', 'てこの要領で、ぐっと！', 'いまだ、ひねれ！'], col: '#ff8a30' });
    if (n < 2) {
      await E.say(null, 'ギ……ギギ……。扉は、ほんの少し動いただけだった。');
      await E.say('ruu', 'おしい！ もう一回！');
      return;
    }
    E.se('explode');
    E.shake(3, 16);
    await E.say(null, 'ガコンッ！ さびた扉が、ついに開いた！');
    await E.say('kanata:smile', 'あった……パワーセル！ 軍の払い下げ品だ。旧規格のやつ！');
    E.se('alarm');
    await E.say('sys', 'ピピピッ！ 侵入者ヲ確認。資材ヲ保護シマス。', { name: '警備ドローン' });
    await E.say('ruu:surprise', 'げっ、コンテナに防犯ドローンがついてた！');
    E.cut(false);
    await E.battle({
      enemies: [{ type: 'drone', x: 38, y: 7, lv: 1 }, { type: 'drone', x: 46, y: 7, lv: 1 }, { type: 'drone', x: 42, y: 9, lv: 2, name: '警備ドローン（親機）' }],
      title: 'BATTLE!', sub: '警備ドローンを撃退せよ',
    });
    E.cut(true);
    await E.give('c1_cell', 1, { wait: true });
    await E.say('kanata', 'ちょっと重いけど……まだ温かい。充電も残ってる。');
    await E.say('ruu', '泥棒じゃないよね、これ？');
    await E.say('kanata', '……ドクの店の入荷予定に入れといてもらおう。たぶん。');
    E.reload();
    await partGot();
    E.cut(false);
  };

  // ===============================================================
  //  ドクのガレージ（第1章）
  // ===============================================================
  G.addToMap('doc_garage', {
    objects: [{ p: 'c1_backdoor', x: 24, y: 2, show: () => ch1(), nosolid: true }],
    npcs: [
      { id: 'c1_doc', char: 'doc', x: 15, y: 8, dir: 'up', move: 'still', show: () => ch1(), talk: async () => await C1.docTalk() },
      {
        id: 'c1_cube', char: 'cube', x: 18, y: 9, dir: 'down', move: 'wander', range: 1, speed: 0.4, show: () => ch1() && (ph() <= 1 || ph() >= 4),
        talk: async () => {
          await E.say('cube', G.pick(['ピポ！', 'ピポポ？', 'ピ……ポ……（スリープ中らしい）']));
        },
      },
    ],
    events: [
      { x: 11, y: 14, w: 4, h: 1, cond: () => at(4), run: turnBack('U', [['doc', '表はダメじゃ！ 装甲車がうようよしとる。裏口（右奥の扉）から行け！']]) },
    ],
    warps: [{ x: 24, y: 3, w: 1, h: 1, to: 'c1_yard', tx: 2, ty: 11, dir: 'right', cond: () => at(4) }],
    onEnter: async () => {
      if (!ch1()) return;
      E.remove('w2_doc');
      if (ph() === 1) return C1.meetDoc();
      if (ph() === 3) return C1.install();
      if (ph() === 4 && E.flag('c1_yard_intro')) await E.say('doc', 'なんじゃ、忘れ物か！？ ぐずぐずするな、裏口から行け！');
    },
  });

  C1.docTalk = async function () {
    if (ph() >= 4) return E.say('doc', 'ぐずぐずするな！ 裏口（右奥の扉）から資材ヤードへ出ろ！');
    if (ph() === 3) return E.say('doc', 'おお、部品がそろったか！ ……ほれ、ポンコツ号のところへ来い。');
    const k = await E.ask('doc', 'なんじゃ。部品は見つかったか？', ['部品のありか', '買い物', '話す', 'やめる'], { cancel: 3 });
    if (k === 0) {
      const lines = [];
      if (!E.has('gyro')) lines.push('ジャイロは南西のコンテナ迷路じゃ。ラットどもが光り物を巣に溜めこんどる。');
      if (!E.flag('c1_botfight')) lines.push('アクチュエータは南東の廃材の山。……最近、あのへんで暴走ボットが暴れとるらしい。気をつけい。');
      if (!E.has('c1_cell')) lines.push('パワーセルは北東の「AF-PARTS」のコンテナじゃろう。さびついとるから、スパナでこじ開けろ。');
      for (const l of lines) await E.say('doc', l);
      if (!lines.length) await E.say('doc', '全部そろっとるじゃろうが。……ボケたか、ワシ。');
    } else if (k === 1) {
      await E.say('doc', 'ふん、ガキ相手でも値引きはせんぞ。');
      await E.shop(['soda', 'energy', 'repair', 'onigiri'], 'ドクのジャンク屋');
    } else if (k === 2) {
      const t = E.inc('c1_doc_talk');
      const L = [
        [['doc', 'ジンとは、あいつがお前くらいの歳から知っとる。ガラクタの山から部品を拾ってきては、ワシの作業台を勝手に使いおった。'], ['doc', '……今のお前と、同じ顔でな。']],
        [['doc', 'このガレージの2番ハンガーは、ジンの指定席じゃった。ペンキの文字、まだ消しとらん。'], ['kanata', '……消さないでいてくれたんですね。'], ['doc', '消すのが面倒なだけじゃ。']],
        [['doc', 'ネジはワシの最高傑作じゃ。ネジを食って、ネジを出す。……完全循環型ロボット猫じゃ。'], ['ruu', 'それ、ただの……'], ['doc', '言うな。']],
        [['doc', 'トメさんか？ ……あの人には、昔から頭が上がらん。ラーメンのツケが、ざっと12年分たまっとる。'], ['kanata', 'ばあちゃん、「ツケ払え」って言ってましたよ。'], ['doc', '……聞かなかったことにする。']],
        [['doc', '機械は嘘をつかん。壊れとる時は壊れとると、ちゃんと言う。'], ['doc', '……人間のほうが、よっぽど厄介じゃ。']],
      ];
      for (const [w, s] of L[(t - 1) % L.length]) await E.say(w, s);
    }
  };

  C1.meetDoc = async function () {
    E.cut(true);
    await E.wait(20);
    E.se('beam');
    G.fx.sparks(15 * 16 + 8, 7 * 16, 12, '#ffd25e');
    await E.say(null, 'バチバチッ……！ 奥の作業台で、溶接の火花が散っている。');
    await E.say('kanata', 'ごめんくださーい……。');
    await E.wait(30);
    E.face('c1_doc', 'down');
    E.emote('c1_doc', '?');
    await E.say('doc', 'なんじゃ、小僧。ここはガキの遊び場じゃ……');
    await E.move('player', [[12, 12], [15, 12], [15, 10]], { face: 'up' });
    await E.say('doc', '……ん？');
    await E.say(null, 'ドクは片眼鏡をくいっと持ち上げ、カナタの顔と、腰のスパナを交互に見た。');
    await E.say('doc:serious', '……その顔。そのスパナ。');
    await E.say('doc', '……ジンの息子か。');
    await E.say('kanata:surprise', '父さんを、知ってるんですか！？');
    await E.say('doc', '知っとるも何も。ここの2番ハンガーは、あいつの指定席じゃった。');
    await E.say('doc', 'ワシはドク・モーリス。見てのとおりのジャンク屋じゃ。こっちはネジ。');
    await E.say('neji', 'ニャ……ギギ。');
    await E.say('ruu:surprise', 'ネコ……？ ロボット？');
    await E.say('doc', 'ネジを食う。');
    await E.say('ruu:surprise', '食うの！？');
    await E.say('doc', '……で、ジンの息子が何の用じゃ。');
    await E.say('kanata', 'ポンコツ号——父さんのワークフレームを、直したくて来ました。');
    await E.say('doc', 'ポンコツ号？ ……ああ、あのPW-03のことか。あいつ、そんな名前をつけられとったのか。');
    await E.say('kanata', 'オレがつけました。7歳のとき。');
    await E.say('doc', 'ふん。……ついてこい。');
    await E.move('c1_doc', [[15, 9], [6, 9]], { speed: 1.2 });
    E.face('c1_doc', 'up');
    await E.move('player', [[15, 10], [4, 10], [4, 9]], { face: 'up' });
    E.bgm('sad');
    await E.say(null, 'ハンガーに、一機のワークフレームが固定されていた。');
    await E.say(null, '黄色い塗装は色あせ、左の膝は外れかけ、バイザーにはうっすらと埃が積もっている。');
    await E.say('kanata', '……ポンコツ号。');
    await E.say(null, 'それでも——父さんの匂いがした。オイルと、鉄と、少しだけ焦げた電線の匂い。');
    E.tint('rgba(255,200,140,0.18)');
    await E.say('jin', 'カナタ、レバーは軽く握るんだ。……そう、そっと。', { name: '父さん（記憶）' });
    await E.say('jin', '機械はな、こっちが怖がると、怖がり返してくる。話を聞いてやれば、ちゃんと応えてくれる。', { name: '父さん（記憶）' });
    await E.say('jin', '……いつか、こいつで一緒に空を飛ぼうな。', { name: '父さん（記憶）' });
    E.tint(null);
    await E.say('kanata:sad', '（……ワークフレームは、飛べないのに。父さん、いつもそう言ってたっけ）');
    await E.say('ruu', '……カナタ？');
    await E.say('kanata', 'ああ、ごめん。なんでもない。');
    E.bgm('scrap');
    await E.say('doc', '見てのとおりじゃ。ジャイロユニットは割れとる。左膝の駆動アクチュエータは焼き切れ、パワーセルは空っぽじゃ。');
    await E.say('doc', 'その三つさえあれば、動く。……たぶんな。');
    await E.say('ruu', 'たぶんって。');
    await E.say('doc', '機械は嘘をつかん。じゃが、ワシは時々つく。');
    await E.say('doc', 'ほれ、部品リストじゃ。このベイには、なんでも落ちとる。目を皿にして探してこい。');
    await E.give('parts_list', 1, { wait: true });
    await E.say('ruu', 'あの……お金とか、いいの？');
    await E.say('doc', 'ジンには、返しきれん借りがある。……部品代は、こいつに体で返してもらう。ツケじゃ、ツケ。');
    await E.say('kanata:smile', '……はい！');
    await E.say('doc', 'それと、小僧。そのスパナを貸せ。');
    const i = await E.ask('kanata', '……', ['……はい', 'これは、父さんの形見だから']);
    if (i === 1) {
      await E.say('doc', 'わかっとる。だから貸せと言うとる。……壊しゃせん。ワシを誰だと思っとる。');
      await E.say('kanata', '……。……お願いします。');
    }
    await E.say(null, 'ドクはスパナを受けとると、作業台の上で何やらカチャカチャといじり始めた。');
    E.se('beam');
    E.flash(6);
    G.fx.sparks(G.field.player.x, G.field.player.y - 20, 16, '#7af8ff');
    await E.wait(30);
    E.se('beam');
    await E.say('doc', '……ほれ。グリップに放電コイルを仕込んだ。スイッチひとつで、周りにバチッとな。');
    await E.say('doc', 'ジンのスパナじゃ。ジンが一番喜ぶ使い方をしてやれ。');
    await E.learn('spark');
    await E.notice('【スキル】Cでスパーク（EN8消費）\n周りの敵にダメージを与え、しびれさせる。囲まれた時に！');
    await E.say('doc', 'ちょうどいい。そこの〈ガラクタ3号〉で試してみい。最近、言うことを聞かんでな。');
    await E.say('sys', 'ガ……ガガ……ギギギ……！', { name: 'ガラクタ3号' });
    await E.say('ruu:surprise', '動いた！？');
    E.cut(false);
    await E.battle({
      enemies: [{ type: 'bot', x: 9, y: 12, lv: 1, name: '暴走ボット〈ガラクタ3号〉' }],
      title: 'BATTLE!', sub: 'Cでスパークを使ってみよう',
    });
    E.cut(true);
    E.face('c1_doc', 'right');
    await E.say('doc', 'ふん、上出来じゃ。……やれやれ、3号も一から組み直しじゃな。');
    await E.say('doc', 'それと、こいつを連れていけ。');
    await E.move('c1_cube', [[7, 9]], { speed: 1.2 });
    await E.say('cube', 'ピポ！');
    await E.say('doc', 'キューブ。ワシが作ったヘルパーロボじゃ。ジャンクの匂いを嗅ぎわける。');
    await E.say('doc', '探している部品が近くにあると、騒いで知らせるはずじゃ。');
    await E.say('cube', 'ピポッ、ピポポ！');
    await E.say('ruu:smile', 'かわいい……。よろしくね、キューブ。');
    await E.say('doc', 'ジャイロは南西のコンテナ迷路、アクチュエータは南東の廃材の山……パワーセルは北東のコンテナ置き場が怪しい。');
    await E.say('doc', '暗くなる前に戻ってこい。……最近、このベイは物騒じゃからな。');
    E.remove('c1_cube');
    E.party(['ruu', 'cube']);
    setPh(2);
    E.objective(partsObj());
    E.cut(false);
  };

  C1.install = async function () {
    E.cut(true);
    E.face('c1_doc', 'down');
    await E.say('doc', 'ほう……全部そろえたか。');
    E.take('gyro', 1);
    E.take('c1_actuator', 1);
    E.take('c1_cell', 1);
    await E.say('doc', 'ネズミの巣のジャイロに、暴走ボットの脚、さびたコンテナのセル……。');
    await E.say('doc:smile', '……まったく。部品の集め方まで、ジンにそっくりじゃ。');
    await E.move('player', [[12, 13], [12, 10], [4, 10], [4, 9]], { face: 'up' });
    await E.say('doc', 'よし、取りつけるぞ。小僧、手伝え。装甲板を外して、ジャイロの台座にボルトを締めるんじゃ。');
    const n = await E.timing({ title: 'ジャイロユニット取りつけ', rounds: 2, speed: 1.2, zone: 0.24, labels: ['ボルトを締める！', '配線をつなぐ！'], col: '#7af8ff' });
    if (n === 2) {
      await E.say('doc', '……！ お前、その手つき……。');
      await E.say('doc', '……ジンの手つき、そのまんまじゃ。');
    } else await E.say('doc', 'ふん、まだまだじゃな。……まあいい、残りはワシがやる。');
    await E.fadeOut(30);
    E.time('night');
    await E.cg('black', 'カチャ、カチャ、ギュイーン……。\n工具の音だけが、ガレージに響く。');
    await E.cgCaption('気がつくと、シャッターのすき間から見える空は、\nすっかり夜の色になっていた。');
    E.cgOff();
    await E.fadeIn(30);
    await E.say('ruu', 'ふぁ……。やば、門限……。');
    await E.say('doc', 'よし……メインスイッチ、入れるぞ。');
    E.se('boot');
    E.flash(8);
    await E.wait(30);
    await E.say(null, 'ポンコツ号のバイザーに、ぽうっと青い光がともった。');
    await E.say('kanata:surprise', '動いた……！');
    await E.say('ruu:grin', 'すご……！ ほんとに目が光った！');
    await E.say('doc', 'まだじゃ。ジャイロが機体になじむまで、一晩はかかる。起動テストは明日——');
    E.se('alarm');
    E.stopBgm();
    E.tint('rgba(255,40,70,0.12)');
    await E.wait(40);
    E.se('alarm');
    E.emote('c1_doc', '!');
    E.emote('player', '!');
    await E.say('mother', 'スクラップ・ベイ地区ノ皆サン。只今ヨリ、公安局ニヨル緊急封鎖ヲ実施シマス。');
    await E.say('mother', '屋外ニ出ナイデクダサイ。繰リ返シマス。屋外ニ、出ナイデクダサイ。');
    E.bgm('tension');
    await E.say('doc:serious', '封鎖じゃと……！？ こんな夜中に、公安が何を探しとる。');
    await E.say(null, 'シャッターのすき間から、サーチライトの光が差しこんでくる。装甲車のエンジン音。');
    await E.say('ruu:surprise', 'え、え、どうすんの！？ 閉じこめられた！？');
    await E.say('doc', '表の道は装甲車でふさがれとる。……裏口から資材ヤードに出て、東の廃材置き場まで抜けろ。');
    await E.say('doc', 'あそこの金網の破れ目から、運河の排水路に下りられる。ミナト区まで一本道じゃ。');
    await E.say('kanata', 'ドクは？');
    await E.say('doc', 'ワシはここでポンコツ号を見とる。公安に見つかったら、ジンの機体を没収されかねん。');
    await E.say('doc', 'キューブは置いていけ。こいつは光るからな。');
    await E.say('cube', 'ピポ……。');
    E.party(['ruu']);
    E.npc({ id: 'c1_cube_stay', char: 'cube', x: 6, y: 10, dir: 'up' });
    E.tint(null);
    await E.say('doc', 'いいか、見張りの「視線」に入るな。懐中電灯の光の扇の中じゃ。ライトの向きをよく見ろ。');
    await E.say('doc', '……気をつけてな、カナタ。');
    await E.say('ruu', '行こ、カナタ。……ちょっとワクワクしてる自分が、イヤだけど。');
    setPh(4);
    E.heal();
    E.objective('裏口（ガレージの右奥の扉）から、資材ヤードへ');
    E.cut(false);
  };

  // ===============================================================
  //  廃材置き場（夜）：ニコとの遭遇 → ゼフィール → ポンコツ号起動
  // ===============================================================
  const fieldOn = (k) => () => ch1() && ph() >= 5 && E.flag(k);
  const fieldNight = () => ch1() && ph() >= 4;
  G.addToMap('scrap_field', {
    objects: [
      { p: 'lamp', x: 6, y: 6, show: fieldNight },
      { p: 'lamp', x: 33, y: 6, show: fieldNight },
      { p: 'lamp', x: 6, y: 20, show: fieldNight },
      { p: 'lamp', x: 33, y: 20, show: fieldNight },
      { p: 'c1_searchlight', x: 4, y: 1, show: fieldNight },
      { p: 'c1_searchlight', x: 35, y: 24, show: fieldNight },
    ],
    lights: [],
    npcs: [
      { id: 'c1_niko', char: 'niko', x: 16, y: 2, dir: 'down', move: 'still', show: fieldOn('c1_niko_on'), talk: async () => E.say('niko', '……。') },
      { id: 'c1_ponko', char: 'sys', mech: 'ponkotsu', x: 6, y: 12, dir: 'right', move: 'still', show: fieldOn('c1_ponko_on'), talk: async () => E.say(null, 'ポンコツ号。装甲のあちこちが焦げて、湯気が立っている。') },
      { id: 'c1_zephyr', char: 'sys', mech: 'zephyr', x: 22, y: 8, dir: 'left', move: 'still', show: fieldOn('c1_zephyr_on'), talk: async () => E.say(null, '白い機体。見上げると、光の羽がゆっくりと明滅している。') },
      { id: 'c1_docf', char: 'doc', x: 5, y: 14, dir: 'right', move: 'still', show: fieldOn('c1_doc_on'), talk: async () => E.say('doc', '……') },
    ],
    events: [
      { x: 1, y: 12, w: 1, h: 4, cond: () => ch1() && ph() >= 4 && ph() <= 5, run: turnBack('R', [['ruu', 'そっちはベイだよ！ 公安がいっぱいいる！']]) },
    ],
    onEnter: async () => {
      if (at(4)) await C1.field();
    },
  });

  // ゼフィールのビーム（演出）
  function beam(from, to, col) {
    const sx = from.x,
      sy = from.y - 26,
      tx = to.x,
      ty = to.y - 20;
    const a = Math.atan2(ty - sy, tx - sx);
    for (let i = 0; i < 3; i++)
      G.field.add(new G.Projectile({ x: sx + Math.cos(a) * i * 10, y: sy + Math.sin(a) * i * 10, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, team: 'player', dmg: 0, kind: 'beam', col: col || '#7dff9a', life: Math.ceil(Math.hypot(tx - sx, ty - sy) / 9), through: true }));
    G.audio.se('beam');
    G.fx.muzzle(sx, sy, '#bff8ff');
  }
  function boom(id) {
    const e = E.get(id);
    if (!e) return;
    G.fx.explosion(e.x, e.y - 18, true);
    G.audio.se('bigexplode');
    E.shake(8, 30);
    E.flash(6);
    E.remove(id);
  }

  C1.field = async function () {
    setPh(5);
    E.cut(true);
    E.time('night');
    E.set('c1_niko_on');
    E.reload();
    E.hide('c1_niko');
    await E.wait(20);
    await E.say('ruu', 'はぁ、はぁ……抜けた……！ ここが廃材置き場？');
    await E.say('kanata', 'ああ。あとは金網の破れ目を探して、排水路に——');
    await E.wait(20);
    E.se('hit');
    await E.wait(10);
    E.emote('player', '!');
    E.emote('f_ruu', '!');
    await E.say('kanata', '……今、物音がしなかったか？');
    await E.camera(16, 3);
    E.hide('c1_niko', false);
    await E.wait(30);
    await E.say(null, 'コンテナの陰に、小さな影がうずくまっていた。');
    await E.cameraReset();
    await E.move('player', [[8, 13], [8, 5], [16, 5]], { face: 'up' });
    await E.say(null, 'ぶかぶかの作業服。はだしの足。そして——月の光みたいに、白い髪。');
    E.emote('c1_niko', '!');
    await E.say('niko:surprise', '……っ。');
    await E.move('c1_niko', 'U', { speed: 0.6 });
    await E.say('kanata', 'あ、ごめん！ 驚かせるつもりじゃなかったんだ。……オレ、カナタ。こっちはルウ。');
    await E.say('ruu:serious', 'ちょっと、カナタ。この子……公安が探してる「白い髪のガキ」って……。');
    await E.say('niko', '……こうあん。……こわい、ひと。');
    await E.say('niko:sad', '……たすけて。');
    await E.say('kanata', '……！');
    E.bgm('sad');
    await E.say(null, 'ぐううううう……。');
    await E.say('niko', '……ニコ、おなか、すいた。');
    await E.say('ruu:surprise', 'このタイミングで！？');
    const opts = [];
    if (E.has('onigiri')) opts.push('おにぎりをあげる');
    if (E.has('melonpan')) opts.push('メロンパンをあげる');
    opts.push('なにも持ってない……');
    const i = await E.ask('kanata', '……', opts);
    const pick = opts[i];
    await E.move('c1_niko', 'D', { speed: 0.6 });
    if (pick.startsWith('おにぎり')) {
      E.take('onigiri', 1);
      E.set('c1_fed', 'onigiri');
      await E.say(null, 'ニコはおにぎりを両手で受けとると、じっと見つめ、それから小さくかじった。');
      await E.say('niko', '……もぐ。……もぐ。');
      await E.say('niko:surprise', '……！ これ……おいしい。');
      await E.say('niko:smile', '……あったかい、あじ。');
      await E.say('kanata:smile', 'ばあちゃんのおにぎりだからな。コロニーで一番うまいんだ。');
    } else if (pick.startsWith('メロンパン')) {
      E.take('melonpan', 1);
      E.set('c1_fed', 'melonpan');
      await E.say(null, 'ニコはメロンパンのにおいをくんくんとかいで、おそるおそる口に入れた。');
      await E.say('niko:surprise', '……あまい……！ ふわふわ……！');
      await E.say('niko:smile', '……これ、すき。');
    } else {
      E.set('c1_fed', 'candy');
      await E.say('ruu', '……あたし、アメなら持ってる。ほら、ネオンキャンディ。');
      await E.say('niko:surprise', '……ひかってる。');
      await E.say(null, 'ニコはアメを口に入れて、目をまんまるにした。');
      await E.say('niko:smile', '……あまい。……ありがと。');
      await E.say('ruu:shy', '……べ、別に。');
    }
    await E.say('kanata', '名前、ニコっていうのか？');
    await E.say('niko', '……ニコ。ニコは、ニコ。');
    await E.say('ruu', 'どこから来たの？ おうちは？');
    await E.say(null, 'ニコは、ゆっくりと人さし指を上に向けた。');
    await E.say('niko', '……そと。……そらの、そと。');
    await E.say('ruu:surprise', '……そらの、そと？');
    await E.wait(20);
    E.emote('c1_niko', '!');
    await E.say('niko:serious', '……！ くる。');
    // ---- 公安隊員 ----
    E.stopBgm();
    E.se('alarm');
    E.npc({ id: 'c1_g1', char: 'guard', x: 38, y: 11, dir: 'left' });
    E.npc({ id: 'c1_g2', char: 'guard', x: 38, y: 14, dir: 'left' });
    E.move('c1_g1', [[26, 11], [24, 6]], { speed: 1.8, noWait: true });
    await E.move('c1_g2', [[26, 14], [24, 9]], { speed: 1.8 });
    E.bgm('tension');
    await E.say('c1_guardA', 'いたぞ！ 対象を発見！');
    await E.say('c1_guardA', '……子どもが二人。民間人か。おい、その少女から離れろ！');
    E.face('player', 'right');
    await E.say('kanata', 'この子、怖がってる。……この子が、何をしたっていうんですか！');
    await E.say('c1_guardA', '子どもの知ることではない。……抵抗するなら、拘束する。');
    await E.say('ruu:angry', 'はあ？ 子どもだからって、なめんじゃないよ！');
    await E.say('niko:sad', '……カナタ。');
    await E.say('kanata', '大丈夫だ、ニコ。……なんとかする！');
    E.remove('c1_g1');
    E.remove('c1_g2');
    E.cut(false);
    await E.battle({
      enemies: [{ type: 'guard', x: 24, y: 6, lv: 1, name: '公安隊員' }, { type: 'guard', x: 24, y: 9, lv: 1, name: '公安隊員' }],
      title: 'BATTLE!', sub: '公安隊員をふりきれ！', bgm: 'battle',
    });
    E.cut(true);
    E.face('player', 'right');
    await E.say('ruu', 'はぁ、はぁ……やった……！');
    await E.say('kanata', 'ニコ、今のうちに——');
    // ---- ガードナー降下 ----
    E.stopBgm();
    E.se('boost');
    E.shake(4, 60);
    await E.say(null, 'ゴォォォォォ……！ 頭上から、スラスターの轟音が降ってきた。');
    const gds = [['c1_gd1', 23, 6], ['c1_gd2', 28, 10], ['c1_gd3', 32, 6]];
    for (const [id, x, y] of gds) {
      E.npc({ id, char: 'sys', mech: 'guardner', x, y: y - 9, dir: 'left' });
      E.move(id, [[x, y]], { speed: 2.2, noWait: true });
    }
    for (let k = 0; k < 40; k++) {
      for (const [id] of gds) {
        const e = E.get(id);
        if (e && k % 2 === 0) G.fx.thrust(e.x, e.y - 6);
      }
      await E.wait(2);
    }
    E.se('mechstep');
    E.shake(8, 30);
    await E.wait(30);
    E.bgm('boss');
    await E.say(null, '青灰色の巨人が、三機。モノアイが、赤くこちらをにらんでいる。');
    await E.say('ruu:surprise', 'うそ……機体まで……！？');
    await E.say('c1_captain', '……生身の子ども相手に、隊員二名がやられただと？', { name: 'ガードナー隊長（拡声器）' });
    await E.say('c1_captain', 'もういい。対象ごと確保する。……邪魔をするなら、民間人でも容赦はしない。', { name: 'ガードナー隊長（拡声器）' });
    await E.say('kanata', 'ルウ、ニコを連れて逃げろ！');
    await E.say('ruu:angry', 'あんたは！？');
    await E.say(null, 'カナタは、スパナを握りしめて前に出た。……ひざが、ふるえている。');
    await E.say('kanata', '……なんとかする。');
    await E.say('ruu:angry', 'バカ！ スパナで機体に勝てるわけないじゃん！');
    E.se('charge');
    await E.wait(30);
    await E.say('niko', '……だめ。……くる。');
    await E.say('niko:serious', '……しろい、はね。');
    // ---- ゼフィール ----
    E.stopBgm();
    E.se('echo');
    await E.wait(30);
    E.flash(12);
    await E.cg('zephyr', '——夜空が、裂けた。');
    await E.cgCaption('光の羽を広げて、白い機体が降りてくる。');
    await E.cgCaption('まるで、本物の空から落ちてきた星みたいに。');
    E.cgOff();
    E.bgm('mech');
    E.set('c1_zephyr_on');
    const z = E.npc({ id: 'c1_zephyr', char: 'sys', mech: 'zephyr', x: 19, y: -2, dir: 'down' });
    await E.move('c1_zephyr', [[19, 7]], { speed: 3 });
    E.flash(8);
    E.shake(6, 20);
    E.se('mechstep');
    await E.say('c1_captain', 'な……なんだ、あの機体は！？ 識別信号なし……！', { name: 'ガードナー隊長' });
    await E.wait(20);
    E.face('c1_zephyr', 'right');
    beam(z, E.get('c1_gd1'));
    await E.wait(14);
    boom('c1_gd1');
    await E.wait(20);
    E.se('boost');
    await E.move('c1_zephyr', [[26, 9]], { speed: 6 });
    E.se('saber');
    G.fx.slash(E.get('c1_zephyr').x + 12, E.get('c1_zephyr').y - 18, 'right', '#8ff8ff', true, 2);
    await E.wait(10);
    boom('c1_gd2');
    await E.wait(30);
    await E.say('ruu:surprise', 'いっしゅんで……二機……！？');
    E.se('boost');
    await E.move('c1_gd3', [[34, 9]], { speed: 3 });
    await E.say('c1_captain', 'くっ……！ せめて対象だけでも……！', { name: 'ガードナー隊長' });
    await E.say(null, 'ガードナーのライフルが、ニコに向けられた。');
    await E.say(null, '白い機体が動こうとして——その光の羽が、ノイズのように乱れた。');
    E.se('buzz');
    E.shake(2, 20);
    await E.say('niko:sad', '……あの子、いたい、って……ないてる。');
    // ---- ポンコツ号、到着 ----
    E.se('mechstep');
    await E.wait(16);
    E.se('mechstep');
    await E.say(null, 'ズシン……ズシン……。西の暗がりから、重い足音が近づいてくる。');
    E.set('c1_ponko_on');
    E.npc({ id: 'c1_ponko', char: 'sys', mech: 'ponkotsu', x: -2, y: 12, dir: 'right' });
    for (let k = 0; k < 4; k++) {
      await E.move('c1_ponko', 'R2', { speed: 0.9 });
      E.se('mechstep');
      E.shake(3, 8);
    }
    await E.say('doc', '待たせたな、若造ども！！', { name: 'ドク（ポンコツ号の中から）' });
    await E.say('kanata:surprise', 'ドク！？ ポンコツ号、動くのか！？');
    await E.say('doc', '動くかどうかは、乗るやつしだいじゃ！ ……ワシの腰じゃ、これ以上は無理じゃ！', { name: 'ドク' });
    E.set('c1_doc_on');
    E.npc({ id: 'c1_docf', char: 'doc', x: 6, y: 13, dir: 'right' });
    await E.move('c1_docf', [[6, 14]], { speed: 1 });
    await E.say('doc', '乗れ、カナタ！ ジンの機体を動かせるのは、お前しかおらん！');
    await E.say('ruu', 'カナタ、行け！ ニコはあたしが守る！');
    await E.move('player', [[16, 12], [7, 12]], { speed: 2.2 });
    E.remove('c1_ponko');
    E.unset('c1_ponko_on');
    G.field.player.setMech(true, 'ponkotsu');
    E.refreshParty();
    E.se('boot');
    E.flash(8);
    await E.say(null, 'シートに飛びこむ。父さんの匂い。計器の光が、ひとつ、またひとつ、ともっていく。');
    const sc = await E.timing({ title: 'ポンコツ号 起動シーケンス', rounds: 3, speed: 1.5, zone: 0.19, labels: ['メイン・ジェネレーター、点火！', 'ジャイロ、同期……！', '駆動系リンク、接続！'], col: '#7af8ff' });
    E.set('c1_boot', sc);
    if (sc === 3) {
      await E.say(null, '——システム、オールグリーン。');
      await E.say('doc', '……一発で！？ ジャイロの慣らしもなしに……！', { name: 'ドク（通信）' });
    } else if (sc >= 1) {
      await E.say(null, '——左膝、反応低下。ジャイロ同期率62%。……警告灯が、いくつか赤い。');
      await E.say('kanata', '……けど、いける！');
    } else {
      E.se('buzz');
      await E.say(null, '——エラー。エラー。駆動系、応答なし。');
      await E.say('doc', '叩け！ 機械は叩けば直る！ 右のパネルじゃ！', { name: 'ドク（通信）' });
      E.se('hit');
      E.shake(3, 10);
      await E.say(null, 'ガンッ！ ……ブゥゥン。——システム、強制起動。');
      await E.say('kanata', '……ほんとに直った。');
    }
    await E.say('kanata', '父さん……力、貸してくれ。');
    E.se('boot');
    E.flash(10);
    await E.say('kanata', 'ポンコツ号——起動！！');
    await E.notice('【初の機体戦】Z：ビーム（押しっぱなしで連射）　X：ブースト\nC：ヒートスパナ（近接・強力）　ゼフィールが援護してくれる。\n装甲（AR）が減ったら、メニューから修理キットを使おう。');
    E.remove('c1_zephyr');
    E.remove('c1_gd3');
    E.unset('c1_zephyr_on');
    E.cut(false);
    await E.battle({
      map: 'scrap_field', x: 8, y: 12, dir: 'right', mech: true, mechId: 'ponkotsu', bgm: 'mech',
      title: 'ENGAGE!', sub: 'ニコを守れ ― ガードナーを撃退せよ',
      waves: [
        [{ type: 'guardner', x: 30, y: 10, lv: 3, name: 'ガードナー（隊長機）' }],
        [{ type: 'guardner', x: 34, y: 5, lv: 2, name: 'ガードナー（増援）' }, { type: 'guardner', x: 34, y: 20, lv: 1, name: 'ガードナー（増援）' }],
      ],
      allies: [{ mech: 'zephyr', x: 16, y: 8, dmg: 6, col: '#7dff9a', name: 'ゼフィール' }],
      onWave: async () => {
        E.cut(true);
        await E.say('c1_captain', '……増援、到着！ 囲め、ガキの乗った作業機など、すぐに落ちる！', { name: 'ガードナー隊長（通信）' });
        await E.say('kanata', 'まだ来るのか……！ ポンコツ号、もうちょっとだけ、がんばってくれ！');
        E.cut(false);
      },
      returnTo: ['scrap_field', 9, 12, 'right'],
    });
    E.cut(true);
    E.exp(30);
    // ---- 戦いのあと ----
    E.set('c1_ponko_on');
    E.set('c1_zephyr_on');
    E.reload();
    E.time('night');
    E.bgm('sad');
    E.teleport('player', 9, 13, 'right');
    E.move('c1_niko', [[16, 5], [12, 9], [11, 12]], { speed: 1.2, noWait: true });
    await E.wait(30);
    await E.say(null, 'コクピットのハッチを開けて、地面に飛び降りる。足が、まだふるえていた。');
    await E.say('ruu', 'カナタ！ ……やったじゃん！ ほんとに、勝っちゃった！');
    await E.say('doc', '……ふん。左膝の関節、焼きつきかけとるぞ。……無茶しおって。');
    await E.say('doc', '……じゃが、いい操縦じゃった。ジンが見たら、きっと……いや、なんでもない。');
    await E.wait(20);
    E.se('boost');
    await E.say(null, '白い機体が、ゆっくりと地面に降りてきた。胸のハッチが、音もなく開く。');
    E.npc({ id: 'c1_sig', char: 'sig', x: 22, y: 9, dir: 'left' });
    await E.move('c1_sig', [[22, 11], [19, 11]], { speed: 1 });
    E.face('player', 'right');
    E.bgm('title');
    await E.say(null, '降りてきたのは——カナタたちと同じくらいの、銀色の髪の少年だった。');
    await E.say('kanata', 'お前……さっきの……。助けて、くれたのか？');
    await E.say('sig', '……。');
    await E.say(null, '少年は、カナタではなく、その後ろのニコを見ていた。');
    await E.say('sig', '……その子を、頼む。');
    await E.say('kanata:surprise', 'ちょ、待てよ！ お前、誰なんだ！ その機体は！？ なんでこの子が狙われてるんだ！？');
    E.face('c1_sig', 'right');
    await E.wait(30);
    await E.say('sig', '……この世界の空は、まだ落ちていない。');
    await E.say('sig', '……落とさないでくれ。');
    await E.move('c1_sig', [[22, 11], [22, 9]], { speed: 1.2 });
    E.remove('c1_sig');
    E.se('boost');
    E.flash(6);
    await E.move('c1_zephyr', [[22, -6]], { speed: 4 });
    E.unset('c1_zephyr_on');
    E.remove('c1_zephyr');
    await E.wait(20);
    await E.say('ruu', '……なにあれ。ポエム？');
    await E.say('kanata', '……空が、落ちる……？');
    E.face('player', 'left');
    await E.say('niko', '……シグ。');
    await E.say('kanata:surprise', 'え？ ニコ、あいつのこと知ってるのか？');
    await E.say('niko', '……しらない。……でも、しってる。……ふしぎ。');
    await E.say('niko', '……ふぁ……。');
    await E.say(null, 'ニコの体が、ふらりとかたむいた。カナタはあわてて受けとめる。');
    await E.say('niko', '……すう……すう……。');
    await E.say('ruu:surprise', '寝てる！？ この状況で！？');
    await E.say('doc', '……よっぽど疲れとったんじゃろう。');
    await E.say('doc:serious', '公安の増援が来る前に、ずらかるぞ。ポンコツ号はワシがガレージに隠す。');
    await E.say('kanata', 'この子、どうしよう……。');
    const k = await E.ask('kanata', '……', ['うちに連れて帰る', '交番に届ける……？']);
    if (k === 1) {
      await E.say('ruu:angry', 'バカじゃないの！？ 交番に届けたって、公安に引き渡されるだけじゃん！');
      await E.say('kanata', '……だよな。');
    }
    await E.say('kanata', '星屑亭に連れていく。……ばあちゃんなら、きっと。');
    await E.say('doc', 'トメさんのところか。……あそこなら、まあ安全じゃろう。いろんな意味でな。');
    await E.say('ruu', 'いろんな意味？');
    await E.say('doc', '……なんでもない。さっさと行け。排水路は、あの金網の破れ目からじゃ。');
    E.set('c1_niko_join');
    E.unset('c1_niko_on');
    E.remove('c1_niko');
    E.party(['ruu', 'niko']);
    setPh(6);
    E.heal();
    E.objective('ニコを連れて星屑亭へ帰る');
    await E.fadeOut(40);
    await E.cg('black', '金網の破れ目から、暗い排水路へ。\nニコを背負って、カナタたちは夜のコロニーを歩いた。');
    E.cgOff();
    await E.warp('minato', 8, 30, 'right');
  };
})();
