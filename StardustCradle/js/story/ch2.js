// =============================================================
//  story/ch2.js — 第2章「星屑亭の居候」
//   進行は E.val('c2_step') で管理（マップの onEnter / イベントが段階を見て発動）
//    0 夕食（章の頭）  1 星屑亭・夜（2階へ）  2 朝・転入の段取り  3 登校（パトロール）
//    4 校舎へ（ユイ）→教室（自己紹介・授業・給食）  5 昼休み：ミミをかわして屋上へ
//    6 体育→放課後  7 ポン湯へ  8 星屑亭へ帰る  9 ルウ編：ひだまり園  10 屋根へ
//   11 3日目の朝→放課後  12 体育倉庫裏（キョウスケ）  13 星屑亭の手伝い（アイゼン来店・ニコ倒れる）
//   14 4日目：ドクのガレージ（お金の問題）→ ラジオ幕間 → 第3章
// =============================================================
(function () {
  const C2 = () => G.state.chapter === 2;
  const step = () => E.val('c2_step');
  const at = (n) => C2() && step() === n;
  const setStep = (n) => E.set('c2_step', n);

  // ---------- 名前付きモブ ----------
  G.mob('c2_haru', 'ハル', 7101, { kid: true, girl: true, over: { top: '#ffd25e', outfit: 'dress', style: 'twin', hair: '#7a4a2a' } });
  G.mob('c2_shota', 'ショウタ', 7102, { kid: true, girl: false, over: { top: '#3a8ae0', outfit: 'tshirt', bstyle: 'shorts', acc: ['cap'], accCol: '#e04a4a' } });
  G.mob('c2_mio', 'ミオ', 7103, { kid: true, girl: true, over: { top: '#c8b8e8', outfit: 'hoodie', style: 'long', hair: '#2a2238' } });
  G.mob('c2_encho', '園長のサクラ先生', 7104, { old: true, girl: true, over: { top: '#e8a0b0', outfit: 'apron', acc: ['glasses'], accCol: '#8a6a4a', style: 'bun', hair: '#e0dce8' } });
  G.mob('c2_cust1', '常連の工場長', 7105, { old: true, girl: false, over: { top: '#5a6a7a', outfit: 'jumpsuit', acc: ['cap'], accCol: '#e8a030' } });
  G.mob('c2_cust2', 'OLのミナミさん', 7106, { girl: true, over: { top: '#f0f0f8', outfit: 'suit', style: 'bob', hair: '#5a3a2a' } });
  G.mob('c2_goon1', 'キョウスケの子分・テツ', 7107, { girl: false, over: { top: '#1a1a28', top2: '#c02040', outfit: 'jacket', style: 'spiky', hair: '#e8d070' } });
  G.mob('c2_goon2', 'キョウスケの子分・マサ', 7108, { girl: false, over: { top: '#1a1a28', top2: '#c02040', outfit: 'jacket', style: 'buzz', hair: '#3a2a20', build: 'big' } });
  // ステルス用の「ミミ」（巡回するだけ・無敵）
  G.ENEMIES.c2_mimi = { name: 'ミミ', hp: 999, atk: 0, def: 0, exp: 0, money: 0, spd: 1.15, ai: 'patrol', spr: () => G.charSheet(G.chars.mimi.spr) };

  // ---------- 小さなヘルパー ----------
  const put = (id, char, x, y, dir, extra) => E.npc(Object.assign({ id, char, x, y, dir: dir || 'down', move: 'still' }, extra || {}));
  const del = (...ids) => ids.forEach((id) => E.remove(id));
  async function goOut(id, path) {
    await E.move(id, path);
    E.remove(id);
  }
  // 寄り道ブロック：その段階で行ってほしくない場所に入ったら、ひと言いって戻す
  const BACK = {
    neon: ['minato', 69, 23, 'left'],
    scrapbay: ['minato', 35, 45, 'up'],
    green: ['minato', 2, 23, 'right'],
    school_yard: ['minato', 35, 2, 'down'],
    minato: ['school_yard', 22, 37, 'up'],
  };
  const BLOCK = {
    2: { maps: ['neon', 'scrapbay', 'green'], who: 'ruu', msg: 'ちょっと、そっちは学校と逆！　初日から遅刻させる気？' },
    3: { maps: ['neon', 'scrapbay', 'green'], who: 'ruu', msg: 'ちょっと、そっちは学校と逆！　初日から遅刻させる気？' },
    7: { maps: ['neon', 'scrapbay', 'green', 'school_yard'], who: 'ponta', msg: 'カナタ〜、ポン湯は運河の南っすよ！　ミナト区から出ちゃダメっす！' },
    8: { maps: ['neon', 'scrapbay', 'green', 'school_yard'], who: 'ruu', msg: '寄り道してないで帰るよ。ばあちゃん、ごはん作って待ってるっしょ。' },
    12: { maps: ['minato'], who: 'ruu', msg: '逃げる気？　……体育倉庫の裏は、校庭の北東。倉庫の東の細い道から回れるはず。' },
    13: { maps: ['neon', 'scrapbay', 'green', 'school_yard'], who: 'ruu', msg: '星屑亭の手伝い、あるんでしょ。夜のお客さん、待たせたらばあちゃんに怒られるよ。' },
  };
  Object.keys(BACK).forEach((mapId) =>
    G.addToMap(mapId, {
      onEnter: async () => {
        if (!C2()) return;
        const b = BLOCK[step()];
        if (!b || !b.maps.includes(mapId)) return;
        E.cut();
        await E.say(b.who, b.msg);
        const [m, x, y, d] = BACK[mapId];
        await E.warp(m, x, y, d, { noEnter: true });
        E.cut(false);
      },
    })
  );
  // ルウ編の途中でロードした時などに、操作キャラを合わせる
  const fixChar = async () => {
    const p = G.field.player;
    if (!p || p.isMech) return;
    const want = E.flag('c2_ruu_mode') ? 'ruu' : 'kanata';
    if (p.charId !== want) E.setChar(want);
  };
  ['c2_hidamari', 'c2_hidamari_out', 'minato', 'hoshikuzu', 'tome_room'].forEach((m) => G.addToMap(m, { onEnter: fixChar }));

  // =============================================================
  //  章の頭：星屑亭の夜「まずは食いな」
  // =============================================================
  G.STORY.chapters[2] = async function () {
    E.time('night');
    G.state.mech.id = 'ponkotsu';
    E.unset('c2_ruu_mode');
    E.party([]);
    E.cgOff();
    E.tint(null);
    E.hide('player', false);
    setStep(0);
    await E.chapter(2);
    await E.warp('hoshikuzu', 7, 10, 'up', { noEnter: true });
    if (G.field.player.charId !== 'kanata') E.setChar('kanata');
    E.objective('');
    await sceneDinner();
  };

  async function sceneDinner() {
    E.cut();
    E.bgm('home');
    put('c2_ruu', 'ruu', 8, 10, 'up');
    put('c2_niko', 'niko', 6, 10, 'up');
    E.teleport('player', 7, 9, 'up');
    del('w_taxi');
    const tome = E.get('w_tome');
    await E.wait(30);
    await E.say(null, '──夜。星屑亭ののれんは、もうしまわれていた。');
    await E.say('tome', '……カナタ。こんな時間まで、どこほっつき歩いて──');
    E.emote('w_tome', '…');
    await E.wait(50);
    await E.say(null, 'ばあちゃんの目が、カナタの後ろに隠れるように立つ、白い髪の女の子に止まった。');
    await E.say('kanata:think', 'あー……ばあちゃん、これには、その、深いわけがあって……。');
    await E.say('ruu', 'スクラップ・ベイで、公安に追われてた子。……で、カナタがポンコツ号で、公安の機体をぶっ飛ばした。');
    await E.say('kanata:surprise', 'ルウ！？　いきなり全部言うなよ！');
    await E.wait(30);
    await E.say('tome', '……。');
    await E.wait(40);
    await E.say('tome', '……座りな。');
    await E.say('tome:smile', 'まずは食いな。話は、それからさ。');
    // 席へ
    await Promise.all([E.move('c2_niko', [[6, 7], [5, 7], [5, 6]]), E.move('c2_ruu', [[8, 7], [7, 7], [7, 6]]), E.move('player', [[7, 8], [6, 8], [6, 6]])]);
    E.face('c2_niko', 'up');
    E.face('c2_ruu', 'up');
    E.face('player', 'up');
    await E.say('tome', 'カナタ、ボサっとしてないで手伝いな。麺、ゆでるよ。');
    await E.say('kanata', 'お、おう！');
    E.cut(false);
    const sc = await E.timing({ title: 'ラーメン作り', rounds: 3, speed: 1.4, zone: 0.2, labels: ['麺をゆでる！', '星屑スープを注ぐ！', 'チャーシューをのせる！'] });
    E.cut();
    if (sc >= 3) await E.say('tome:smile', 'ふん。ちったあ、マシになったじゃないか。');
    else if (sc >= 1) await E.say('tome', 'スープの注ぎ方が雑だね。……まあ、今夜は許してやるさ。');
    else await E.say('tome:angry', 'チャーシューが落ちてるよ！　……ったく、しょうがない子だね。');
    E.se('ok');
    await E.say(null, '湯気の立つどんぶりが、三つ並んだ。');
    await E.say('niko:surprise', '……！');
    await E.say('niko', 'これ……なに？　あったかい、におい……。');
    await E.say('tome', '星屑ラーメン。うちの看板さ。熱いから、ふーふーして食べな。');
    await E.say(null, '女の子は、見よう見まねでどんぶりを両手で持ちあげ──');
    E.emote('c2_niko', '♥');
    E.se('heal');
    await E.say('niko:smile', '……！！　おいしい……！　おいしい、おいしい……！');
    await E.say('ruu:surprise', 'ちょ、スープから飲む派！？');
    await E.wait(30);
    E.emote('c2_niko', '♪');
    await E.say('niko:smile', '……おかわり。');
    await E.say('kanata:surprise', 'はやっ！');
    await E.say('tome:smile', 'いい食いっぷりだねえ。ほら、もう一杯。');
    await E.wait(40);
    E.emote('c2_niko', '♪');
    await E.say('niko:smile', '……おかわり。');
    await E.say('ruu:surprise', '3杯目！？　その細い体のどこに入ってんの……。');
    await E.say('tome:grin', 'あっはっは！　気に入った。好きなだけ食いな。');
    await E.wait(30);
    await E.say('kanata', 'なあ、名前……聞いてもいい？　オレはカナタ。こっちはルウ。');
    await E.say('niko', '……ニコ。');
    await E.say('niko', 'ニコ、って……呼ばれてた。ほかの、なまえ、しらない。');
    await E.say('ruu:sad', '……そっか。');
    await E.say('ruu', 'じゃあ、ニコ。よろしく。');
    await E.wait(20);
    E.emote('c2_niko', '…');
    await E.say('niko:sad', '……ニコ、おなか、いっぱい……。ねむ……い……。');
    E.face('c2_niko', 'up');
    await E.say(null, 'ニコはカウンターに突っ伏して、そのまま寝息を立てはじめた。');
    await E.say('kanata:think', '……寝ちゃった。');
    await E.say('tome', '……。');
    await E.say('kanata', 'ばあちゃん。……何も、聞かないの？');
    await E.say('tome', '聞いてほしけりゃ、本人が話すさ。');
    await E.say('tome', '腹を空かせた子に、理由なんか要らないよ。……それが、星屑亭のやり方だ。');
    await E.say('ruu', '……。');
    await E.say('kanata', 'あと……ニコを助けてくれたのは、白い機体なんだ。パイロットは、オレらと同じくらいの……。');
    E.emote('w_tome', '!');
    await E.wait(20);
    await E.say('tome:serious', '……白い、機体？');
    await E.say('kanata', 'うん。羽みたいな光が出てた。「その子を頼む」って、それだけ言って……。');
    await E.say('tome', '……そうかい。');
    await E.say('tome', '今夜はその子、2階のあんたの布団に寝かせな。カナタは床だよ。');
    await E.say('tome', 'ルウちゃん、あんたも泊まっていきな。もう遅い。園には、ばあちゃんから電話しとくよ。');
    await E.say('ruu:shy', '……べ、別に。ひとりで帰れるし。');
    await E.wait(30);
    await E.say('ruu:shy', '……でも、まあ。今夜だけ。ニコが起きた時、知らない顔ばっかだと、困るっしょ。');
    if (tome) tome.dir = 'down';
    // 自由行動へ
    del('c2_ruu', 'c2_niko');
    setStep(1);
    E.reload();
    E.cut(false);
    E.objective('2階のカナタの部屋で休む');
  }

  // ---------- 星屑亭（夜・自由行動中のルウとニコ） ----------
  G.addToMap('hoshikuzu', {
    npcs: [
      {
        id: 'c2_ruu1', char: 'ruu', x: 10, y: 8, dir: 'up', move: 'still', show: () => at(1),
        talk: async () => {
          const k = await E.ask('ruu', '……なに？', ['ニコのこと', 'ポンコツ号のこと', '泊まってくんだ？'], { cancel: 2 });
          if (k === 0) {
            await E.say('ruu', 'あの子……公安に追われてた。「保護対象」とか言ってたけど、あれは保護って顔じゃなかった。');
            await E.say('ruu:serious', 'カナタ。……あたしたちで、守ろう。大人に任せたら、きっと連れてかれる。');
          } else if (k === 1) {
            await E.say('ruu:grin', 'まさかあのポンコツ、ほんとに動くなんてね。……ちょっとカッコよかったよ。ちょっとだけ。');
            await E.say('ruu', 'でもあちこち煙出てたし、ドクのじいさん、また頭抱えてるんじゃない？');
          } else {
            await E.say('ruu:shy', 'う、うるさいな。ばあちゃんがいいって言ったんだから、いいの。');
            await E.say('ruu', '……園のチビたちには、明日ちゃんと顔見せに帰るよ。');
          }
        },
      },
      {
        id: 'c2_niko1', char: 'niko', x: 5, y: 6, dir: 'up', move: 'still', show: () => at(1),
        talk: async () => {
          await E.say('niko', 'すー……すー……。');
          await E.say('niko:smile', '……らーめん……もう、いっぱい……むにゃ。');
          await E.say(null, '幸せそうな寝顔だ。……あとで2階まで運んであげよう。');
        },
      },
    ],
    onEnter: async () => {
      if (at(2)) await sceneMorning();
      else if (at(8)) await sceneEveningRuuLeaves();
      else if (at(13)) await sceneShopEisen();
    },
  });

  // ---------- カナタの部屋：夜の会話 → 朝 ----------
  G.addToMap('tome_room', {
    onEnter: async () => {
      if (at(1)) await sceneNightTalk();
      else if (at(11)) await sceneDay3Morning();
    },
  });

  async function sceneNightTalk() {
    E.cut();
    setStep(2);
    put('c2_niko', 'niko', 1, 4, 'down');
    E.teleport('player', 4, 5, 'left');
    await E.fadeOut(10);
    await E.say(null, '──眠ったニコを2階に運び、カナタは床に布団を敷いた。');
    await E.fadeIn(20);
    E.bgm('sad');
    await E.wait(40);
    E.emote('c2_niko', '…');
    await E.say('niko', '……カナタ。');
    await E.say('kanata:surprise', 'わ、起きてた？');
    await E.say('niko', 'ここ……どこ？　しろいへや、じゃない。');
    await E.say('kanata', 'オレの部屋。星屑亭の2階。……ちょっと散らかってるけど。');
    await E.say('niko', '……まど。そと、まちが、さかさま。');
    await E.say('kanata', 'ああ、あれは「向こう側の街」。コロニーは筒の形だから、上を見ると反対側の地面が見えるんだ。');
    await E.say('niko:sad', '……ほし、みえない。');
    await E.say('kanata:think', '……うん。コロニーの中からは、本物の星は見えないんだ。');
    await E.say('niko', 'ニコ、ほし、きこえる。……みえないけど、きこえる。');
    await E.say('kanata:think', '（……聞こえる？）');
    const k = await E.ask('kanata', '（どう返そう……）', ['「星の声って、どんな？」', '「……もう寝よう。明日も腹へるぞ」']);
    if (k === 0) {
      await E.say('niko', '……さみしい、おと。ずっと、とおくで、だれかが、ないてる。');
      await E.say('niko', 'でも……きょうは、すこし、ちいさい。らーめん、あったかかった、から。');
    } else {
      await E.say('niko:smile', '……ふふ。あした、も、らーめん？');
      await E.say('kanata:grin', '朝からラーメンはさすがにないって。……たぶん、おにぎり。');
    }
    await E.say('niko', '……カナタ。ニコ、ここに、いて、いい？');
    await E.say('kanata', '……。');
    await E.say('kanata:smile', 'なんとかなるって。ばあちゃん、ああ見えて、一度拾ったものは絶対に手放さないんだ。');
    await E.say('kanata:grin', 'オレも、子どもの頃に拾われた……っていうか、父さんがいなくなってから、ずっとここだし。');
    await E.say('niko:smile', '……ありがと。');
    await E.say(null, '……すぐに、小さな寝息が聞こえてきた。');
    await E.fadeOut(40);
    del('c2_niko');
    E.time('morning');
    await E.wait(30);
    E.teleport('player', 4, 6, 'down');
    await E.fadeIn(30);
    E.bgm('home');
    E.shake(3, 20);
    await E.say('tome:angry', '起きなー！！　朝だよ！！　カナタ！　ニコちゃんはもう、おにぎり三つ食べたよ！');
    await E.say('kanata:surprise', 'うわっ！？　……ニコ、もう下にいるのか。はええ……。');
    E.cut(false);
    E.objective('1階の星屑亭へ下りる');
  }

  // ---------- 朝：転入の段取り ----------
  async function sceneMorning() {
    E.cut();
    del('w_taxi');
    put('c2_niko', 'niko', 6, 7, 'up');
    put('c2_ruu', 'ruu', 11, 8, 'left');
    E.teleport('player', 13, 4, 'down');
    await E.wait(20);
    await E.move('player', [[13, 7], [8, 7]]);
    E.face('player', 'left');
    E.face('c2_niko', 'right');
    await E.say('niko:smile', 'カナタ、おはよ。おにぎり、おいしい。');
    await E.say('ruu', 'おそよう。……あんた、毎朝こうなの？');
    await E.say('tome', 'さて。全員そろったね。大事な話をするよ。');
    E.face('c2_niko', 'up');
    E.face('player', 'up');
    await E.say('tome', '今日から、ニコちゃんは「春瀬トメの遠い親戚」だ。');
    await E.say('tome', 'で、第三中に転入させる。手続きは、ゆうべのうちにばあちゃんがやっといた。');
    await E.say('kanata:surprise', 'はやっ！？　一晩で！？　ていうか、どうやって！？');
    await E.say('tome:grin', '大人にはね、大人のツテってもんがあるのさ。……細かいことは気にしなさんな。');
    await E.say('ruu', '……学校に行かせて、大丈夫なの？　公安が探してるんでしょ。');
    await E.say('tome', 'だからこそさ。家に閉じこめとくほうが、よっぽど目立つ。');
    await E.say('tome', '子どもはね、子どもの中にいるのがいちばん見つかりにくいんだよ。');
    await E.say('tome', 'ほら、ニコちゃん。カナタの母さんが昔着てた制服だ。ちょっと古いけど、サイズは直しといた。');
    await E.fadeOut(16);
    await E.say(null, '──着替え中──');
    await E.fadeIn(16);
    E.emote('c2_niko', '♪');
    await E.say('niko:smile', '……どう？');
    await E.say('ruu:smile', '……似合うじゃん。');
    await E.say('kanata:grin', 'おお、どっからどう見ても第三中の生徒だ。……髪以外は。');
    await E.say('niko', 'これ……すこし、きつい。でも……すき。');
    await E.say('tome', 'カナタ、ルウちゃん。ニコちゃんのこと、頼んだよ。');
    await E.say('tome:serious', '……それと。白い髪のことを聞かれたら、生まれつきだって言いな。嘘じゃないだろ？');
    await E.say('tome', 'ほれ、弁当がわりのおにぎり。持っていきな。');
    await E.give('onigiri', 3);
    del('c2_niko', 'c2_ruu');
    E.party(['ruu', 'niko']);
    setStep(3);
    E.cut(false);
    E.objective('ニコとルウと学校へ（ミナト区の北・桜並木の先）');
  }

  // ---------- 登校：ミナト区（公安のパトロール） ----------
  G.addToMap('minato', {
    onEnter: async () => {
      if (at(3) && !E.flag('c2_patrol')) await scenePatrol();
    },
    warps: [
      // 北西の路地の奥 → ひだまり園（第2章から）
      { x: 1, y: 8, w: 1, h: 2, to: 'c2_hidamari_out', tx: 27, ty: 12, dir: 'left', show: () => G.state.chapter >= 2 && !E.flag('w_evac') },
    ],
    objects: [{ p: 'sign', x: 2, y: 7, text: 'HIDAMARI', col: '#e07a3a', show: () => G.state.chapter >= 2, msg: '← 児童養護施設〈ひだまり園〉　この路地の奥' }],
    npcs: [
      // 第2章・4日目（土曜）の自由行動：仲間たちの寄り道会話
      {
        id: 'c2_yui_town', char: 'yui', x: 23, y: 21, dir: 'down', move: 'still', show: () => at(14),
        talk: async () => {
          await E.say('yui:surprise', 'は、春瀬くん！？　な、なんで休日にこんなところに……。');
          await E.say('yui', '……わたしは、その、本屋さんに参考書を買いに。');
          const k = await E.ask('kanata', '（ユイが紙袋を後ろに隠した）', ['参考書って、どんなの？', 'じゃ、またな']);
          if (k === 0) {
            await E.say('yui:shy', '……っ！　み、見ないでください！　これはその……「星屑ロマンス」の13巻で……！');
            await E.say('yui:angry', '少女マンガは、校則で禁止されていません！　校則第14条には書いてありません！');
            await E.say('kanata:grin', 'いや、何も言ってないって……。');
          }
          await E.say('yui', '……それより。ニコさんのことです。転入書類の保護者の印鑑、星屑亭のスタンプでしたよ。');
          await E.say('yui:think', '「ラーメン一杯無料」って書いてありました。……先生方は気づいていないみたいですけど。');
          await E.say('kanata:surprise', 'ばあちゃん……！');
          await E.say('yui', '……今回は、見なかったことにします。でも、困ったことがあるなら、ちゃんと相談してくださいね。');
        },
      },
      {
        id: 'c2_vargas_town', char: 'vargas', x: 62, y: 14, dir: 'right', move: 'still', show: () => at(14),
        talk: async () => {
          await E.say('vargas:surprise', 'む、春瀬！？　……こ、これは違う。たい焼きの品質を、教師として抜き打ちで検査しているのだ。');
          await E.say('vargas', '……五つ目だがな。');
          await E.say('vargas', 'そうだ、春瀬。転入生のニコ……あいつは、たまに遠くを見ているな。');
          await E.say('vargas:serious', '先生は昔、ああいう目をした兵士を見たことがある。……戦場で、聞こえないはずの音を聞いていた奴らだ。');
          await E.say('vargas', '……いや、余計な話だった。ほれ、一つやる。ニコに持っていけ。甘いものは、心にいい。');
          if (!E.flag('c2_taiyaki')) {
            E.set('c2_taiyaki');
            await E.give('candy', 2);
          }
        },
      },
      {
        id: 'c2_mimi_town', char: 'mimi', x: 55, y: 16, dir: 'left', move: 'still', show: () => at(14),
        talk: async () => {
          await E.say('mimi', '先輩！　昨日は取材から逃げられたっすけど、今日こそ逃がさないっす！');
          await E.say('mimi', '……とは言ったものの、休日に追いかけ回すのは記者の美学に反するっす。');
          await E.say('mimi:think', 'それより先輩、知ってるっすか？　最近、夜中にマザーの放送が流れると、街中の犬が一斉に空を見るらしいっす。');
          await E.say('mimi', 'まるで、何かが聞こえてるみたいに……。スクープのにおいがするっす！');
          if (!E.questState('mimi_scoop')) await E.say('mimi', 'あ、七不思議の取材も手伝ってほしいっす！　新聞部の部室にいるときに声かけてほしいっす！');
        },
      },
      {
        id: 'c2_kyo_town', char: 'kyosuke', x: 20, y: 44, dir: 'right', move: 'still', show: () => at(14),
        talk: async () => {
          await E.say('kyosuke', '……あぁ？　なんだ、春瀬か。');
          await E.say('kyosuke', 'ジャンク・デュエルに出る気になったか？　……顔に書いてあるぜ。');
          await E.say('kyosuke', 'ネオン通りの「レディオ・スターダスト」。あそこのDJは、アンダーシェルのことなら何でも知ってる。');
          await E.say('kyosuke:serious', 'それと……ギルって野郎には気をつけな。派手なだけのバカだが、腕は本物だ。');
          await E.say('kyosuke', '……借りは返す。必要な時は呼べ。');
        },
      },
    ],
  });

  async function scenePatrol() {
    E.set('c2_patrol');
    E.cut();
    await E.wait(20);
    E.party([]);
    put('c2_ruu', 'ruu', 12, 22, 'up');
    put('c2_niko', 'niko', 10, 22, 'up');
    E.teleport('player', 11, 22, 'down');
    put('c2_g1', 'guard', 22, 23, 'left');
    put('c2_g2', 'guard', 23, 24, 'left');
    E.bgm('tension');
    await E.say('ruu:surprise', '……！　カナタ、あれ。');
    await E.camera(20, 23);
    await E.say('guard', '──繰り返す。白い髪の少女、年齢13〜14歳。見かけた者は、公安に通報するように。');
    await E.say('c2_cust1', 'へえ、物騒だねえ。家出かい？');
    await E.say('guard', '……保護対象だ。詮索は不要。');
    await E.cameraReset();
    await Promise.all([E.move('c2_g1', [[16, 23]], { speed: 0.6 }), E.move('c2_g2', [[17, 24]], { speed: 0.6 })]);
    const k = await E.ask('kanata', '（まずい、こっちに来る……！）', ['ルウのパーカーでニコの頭を隠す', '堂々と歩いてやりすごす']);
    if (k === 0) {
      await E.say('kanata', 'ルウ、パーカー！');
      await E.say('ruu', 'わかってる！　……ニコ、ちょっとかぶってて。');
      await E.say('niko', 'む……くらい。');
      await E.move('c2_g1', [[13, 23]], { speed: 0.6 });
      E.face('c2_g1', 'left');
      await E.say('guard', '……おい、そこの子ども。そのフードの子は？');
      await E.say('kanata:grin', 'あー、寝ぐせがひどくて。見られたくないんだって。な？');
      await E.say('niko', '……ねぐせ。');
      await E.say('guard', '…………そうか。学生は早く学校へ行け。');
    } else {
      await E.say('kanata', '（……逃げたら、かえって怪しまれる）');
      await E.move('c2_g1', [[13, 23]], { speed: 0.6 });
      E.face('c2_g1', 'left');
      await E.say('guard', '……おい。その白い髪の子は。');
      await E.say('ruu:angry', 'あたしの妹。生まれつき白いの。……文句ある？');
      await E.say('guard', '……妹？　似ていないな。');
      await E.say('ruu:angry', 'よく言われる。遺伝子のいたずらってやつ。');
      E.se('alarm');
      await E.say('guard', '……！　──こちら特務隊。了解、スクラップ・ベイ方面に反応あり。急行する。');
      await E.say('guard', '……行け。寄り道はするなよ。');
    }
    await Promise.all([goOut('c2_g1', [[16, 23], [33, 23]]), goOut('c2_g2', [[33, 24]])]);
    E.bgm('town');
    await E.say('kanata', '……ふう。心臓に悪い。');
    E.face('c2_niko', 'right');
    await E.say('niko:sad', '……あのひとたち。しろいへやの、におい、する。');
    await E.say('ruu:serious', '……ニコ。あたしたちから、離れないで。');
    await E.say('niko', '……うん。');
    del('c2_ruu', 'c2_niko');
    E.party(['ruu', 'niko']);
    E.cut(false);
    E.objective('第三中学校へ（大通りを北へ）');
  }

  // ---------- 校門：バルガス先生 ----------
  G.addToMap('school_yard', {
    onEnter: async () => {
      if (at(3)) await sceneGate();
      else if (at(12) && !E.flag('c2_gym_hint')) {
        E.set('c2_gym_hint');
        await E.say('ruu', '体育倉庫の裏ね。……倉庫の東側の細い道から、裏に回れるはず。');
      }
    },
    warps: [{ x: 38, y: 1, w: 7, h: 1, to: 'c2_gymback', tx: 11, ty: 11, dir: 'up', show: () => at(12) }],
  });
  async function sceneGate() {
    setStep(4);
    E.cut();
    E.party([]);
    put('c2_ruu', 'ruu', 23, 37, 'up');
    put('c2_niko', 'niko', 21, 37, 'up');
    E.teleport('player', 22, 36, 'up');
    put('c2_vargas', 'vargas', 22, 33, 'down');
    await E.wait(10);
    E.shake(4, 16);
    await E.say('vargas:angry', '春瀬ェ！！　遅刻1秒前！！');
    await E.say('kanata:grin', 'セーフ！　1秒前はセーフ！');
    await E.say('vargas', 'うむ、セーフだ！　だが廊下は走るな！　走るなら全力で走れ！');
    await E.move('c2_vargas', 'D', { speed: 0.5 });
    await E.say('vargas', '……で、そっちが転入生か。春瀬の親戚だと聞いている。');
    await E.say('niko', '……ニコ、です。');
    E.emote('c2_vargas', '…');
    await E.wait(30);
    await E.say('vargas:serious', '…………。');
    await E.say('vargas', '……いい目をしている。遠くを見てきた目だ。');
    await E.say('vargas:smile', '担任のバルガスだ。わからないことがあったら何でも聞け。……甘いものの店以外ならな。');
    await E.say('ruu', '（先生、甘いものの店しか知らないでしょ……）');
    await E.say('vargas', 'ほれ、教室へ行け！　ホームルームで紹介する！');
    del('c2_vargas', 'c2_ruu', 'c2_niko');
    E.party(['ruu', 'niko']);
    E.cut(false);
    E.objective('2年B組の教室へ（校舎1階の廊下）');
  }

  // ---------- 廊下：ユイ ／ 昼休みのミミ（ステルス） ----------
  G.addToMap('school_hall', {
    enemies: [
      {
        type: 'c2_mimi', x: 6, y: 3, dir: 'down', patrol: [[6, 3], [6, 7], [10, 7], [10, 3]], vision: 60,
        show: () => at(5),
        onSpot: async (e) => await mimiSpotted(e),
      },
    ],
    onEnter: async () => {
      if (at(4) && !E.flag('c2_yui_hall')) await sceneYuiHall();
      if (at(5)) {
        E.remove('w2_mimi');
        if (!E.flag('c2_mimi_brief')) {
          E.set('c2_mimi_brief');
          E.cut();
          await E.camera(8, 5);
          await E.say('mimi', 'ふっふっふ……転校生さんは必ずここを通るっす。新聞部の名にかけて、独占インタビューっす！');
          await E.cameraReset();
          await E.say('kanata', '（うわ、ミミが廊下で張ってる……。ニコが質問ぜめにされたら、ボロが出るかも）');
          await E.say('kanata', '（ミミの視線をかわして、西の端の屋上への階段まで行こう）');
          E.cut(false);
          E.objective('ミミに見つからずに、廊下の西の端・屋上への階段へ');
        }
      }
    },
  });
  async function mimiSpotted(e) {
    E.cut();
    E.inc('c2_mimi_fail');
    await E.say('mimi:surprise', 'あーっ！！　見つけたっす、先輩！　そっちが噂の転校生さんっすね！？');
    await E.say('mimi', '好きな食べ物は！？　前の学校は！？　その白い髪は地毛っすか！？');
    await E.say('niko', '……ら、らーめ──');
    await E.say('kanata:surprise', 'ストップストップ！　ニコ、逃げるぞ！');
    await E.fadeOut(12);
    E.teleport('player', 14, 3, 'down');
    e.x = 6 * 16 + 8;
    e.y = 3 * 16 + 14;
    e.pi = 0;
    e.waitT = 60;
    e.spotted = false;
    await E.fadeIn(12);
    if (E.val('c2_mimi_fail') >= 2) {
      const k = await E.ask('niko', '……カナタ。ニコ、かくれるの、とくい。ついてきて。', ['ニコについていく（スキップ）', 'もう一度自分でやる'], { cancel: 1 });
      if (k === 0) {
        await E.fadeOut(16);
        await E.say(null, 'ニコは、ミミが振り返るタイミングを「音」で読むように、するすると廊下を抜けていった……。');
        E.cut(false);
        await E.warp('rooftop', 6, 9, 'up');
        return;
      }
    }
    await E.say('kanata', '（……ふう。もう一回だ。ミミが背中を向けた隙に！）');
    E.cut(false);
  }
  async function sceneYuiHall() {
    E.set('c2_yui_hall');
    E.cut();
    E.party([]);
    put('c2_ruu', 'ruu', 17, 7, 'left');
    put('c2_niko', 'niko', 15, 7, 'up');
    const p = G.field.player;
    E.teleport('player', 16, 7, 'up');
    put('c2_yui', 'yui', 14, 3, 'down');
    await E.wait(10);
    await E.say('yui', '──春瀬くん、水無月さん。おはようございます。');
    await E.move('c2_yui', [[14, 6], [15, 6]]);
    E.face('c2_yui', 'down');
    await E.say('yui', 'それと……あなたが、転入生のニコさんですね。学級委員の風見ユイです。');
    await E.say('niko', '……ニコ、です。');
    await E.say('yui', '転入書類、職員室で拝見しました。保護者「春瀬トメ」、続柄「遠い親戚」。');
    await E.say('yui:think', '……遠いって、どのくらい遠いんですか？');
    await E.say('kanata:think', 'え、えーと……宇宙くらい？');
    await E.say('ruu', '（バカ……！）');
    await E.say('yui', '……。');
    await E.say('yui:think', '前の学校の欄は空白。生年月日は「たぶん春」。校則第14条によると、書類の虚偽申告は──');
    await E.wait(30);
    await E.say('yui', '……いえ。今日のところは、いいです。');
    await E.say('yui:smile', 'ようこそ、2年B組へ。わからないことは、わたしに聞いてください。');
    await E.say('niko:smile', '……うん。ユイ、やさしい。');
    E.emote('c2_yui', '!');
    await E.say('yui:shy', 'べ、別にやさしくなんか……！　学級委員の義務です！');
    await goOut('c2_yui', [[14, 6], [14, 3], [14, 2]]);
    await E.say('ruu', '……あの子、絶対なにか気づいてる。');
    await E.say('kanata', '……でも、悪いやつじゃないよ。たぶん。');
    del('c2_ruu', 'c2_niko');
    E.party(['ruu', 'niko']);
    E.cut(false);
  }

  // ---------- 教室：自己紹介・授業・給食 ----------
  G.addToMap('classroom', {
    onEnter: async () => {
      if (at(4)) await sceneClassroom();
      else if (at(11)) await sceneAfterSchoolDay3();
    },
  });
  async function sceneClassroom() {
    setStep(5);
    E.cut();
    E.party([]);
    E.bgm('school');
    put('c2_vargas', 'vargas', 11, 3, 'down');
    put('c2_niko', 'niko', 12, 5, 'down');
    put('c2_ruu', 'ruu', 14, 9, 'up');
    put('c2_ponta', 'ponta', 17, 9, 'up');
    put('c2_yui', 'yui', 6, 7, 'up');
    E.teleport('player', 6, 9, 'up');
    await E.fadeIn(10);
    await E.say(null, '──朝のホームルーム。');
    await E.say('vargas', '静かに！　今日から2年B組に新しい仲間が加わる。……ほれ、自己紹介だ。');
    await E.wait(20);
    await E.say('niko', '……。');
    await E.say('niko', '……ニコ、です。');
    await E.wait(40);
    await E.say('w2_takashi', '…………それだけ？');
    await E.say('niko', '……すきなもの、らーめん。');
    await E.say('niko', 'きらいなもの……しろいへや。');
    E.emote('c2_ruu', '…');
    await E.say('w2_mayu', '白い部屋……？　病院とか？');
    await E.say('w2_tsubasa', 'てか髪、真っ白じゃん。染めてんの？');
    await E.say(null, '教室が、ざわざわし始めた。ニコは不安そうに、スカートのすそを握っている。');
    const k = await E.ask('kanata', '（……どうする？）', ['「ニコの髪は生まれつきだよ！」とフォローする', '「ラーメンなら星屑亭が一番！」と話をそらす', '黙って見守る']);
    if (k === 0) {
      await E.say('kanata', 'ニコの髪は生まれつきだって！　オレの遠い親戚。……宇宙くらい遠い。');
      await E.say('w2_takashi', '宇宙くらいってなんだよ！　あっはっは！');
      await E.say(null, 'クラスがどっと笑った。ニコも、ほんの少しだけ口元をゆるめた。');
    } else if (k === 1) {
      await E.say('kanata:grin', 'ラーメンが好きなら、星屑亭に来いよ！　今なら大盛り無料！');
      await E.say('ponta', 'ぶっひゃー！　カナタ、宣伝っすか！？　でも星屑亭のラーメンはマジで宇宙一っす！');
      await E.say('w2_rinka', 'え、行きたい！　ニコちゃんも一緒に行こ！');
      await E.say('niko:smile', '……うん。らーめん、いっしょ。');
    } else {
      await E.wait(30);
      await E.say('ruu', '……ニコはニコ。それでいいじゃん。');
      await E.say('ruu:angry', '文句あるやつは、あたしに言いな。');
      await E.say(null, 'ルウのひと言で、教室がしんと静まった。……ニコが、ルウの方をじっと見ている。');
    }
    await E.say('ponta', 'ぶっひゃー！　かわいいっす！　オイラ、権田ポンタロウ！　ポンタって呼んでほしいっす！');
    await E.say('ponta', 'ちなみに好きなものはアームド・フレームっす！　全高、重量、ジェネレーター出力、ぜーんぶ言えるっす！');
    await E.say('niko', '……ぽんた。おおきい。');
    await E.say('ponta:grin', 'よく言われるっす！');
    await E.say('vargas', 'よし！　ニコの席は窓側、春瀬のとなりだ。春瀬、面倒を見てやれ。');
    await E.move('c2_niko', [[12, 6], [4, 6], [4, 9], [3, 9]]);
    E.face('c2_niko', 'up');
    await E.say('niko:smile', '……カナタ、となり。');
    await E.say('kanata:grin', 'よろしくな。……教科書、見せてやるよ。');
    // 授業
    await E.fadeOut(16);
    await E.say(null, '──1時間目・歴史。');
    await E.fadeIn(16);
    await E.say('vargas', '……こうして星暦0075年、軌道戦争は休戦となった。クレイドル7が中立を宣言したのは、その直後だ。');
    await E.say('vargas', '戦争では、多くのコロニーが失われた。……先生の仲間も、たくさん星になった。');
    await E.say('vargas:serious', 'いいか、おまえたち。平和ってのは、当たり前じゃない。毎日誰かが、必死に守ってるもんだ。');
    E.emote('c2_niko', '…');
    await E.wait(20);
    await E.say('niko', '……すー……。');
    await E.say('kanata', '（ニコ、寝てる……。てか、オレも眠い……昨日、床で寝たし……）');
    E.emote('player', '…');
    await E.wait(40);
    E.shake(3, 10);
    await E.say('vargas:angry', '春瀬ェ！！　寝るなら全力で寝ろ！　……いや違う、起きろ！！');
    E.se('swing');
    E.cut(false);
    const dodge = await E.timing({ title: 'チョークが飛んでくる！', rounds: 1, speed: 1.9, zone: 0.22, labels: ['今だ、よけろ！'] });
    E.cut();
    if (dodge) {
      E.se('dash');
      await E.say('kanata:grin', 'っと！　セーフ！');
      E.se('hit');
      await E.say('ponta:cry', 'ぶへっ！？　オ、オイラのおでこに……！');
      await E.say('vargas', 'む……よけるとは成長したな、春瀬。権田、すまん。');
    } else {
      E.se('hit');
      E.shake(4, 10);
      await E.say('kanata:cry', 'いでっ！！');
      await E.say('vargas', '目が覚めたか！　……ニコ、おまえもだ。……ニコ？');
      await E.say('niko', '……すー……らーめん……。');
      await E.say('vargas:smile', '…………転入初日だ。今日だけは許す。');
    }
    // 給食
    await E.fadeOut(16);
    await E.say(null, '──そして、待ちに待った給食の時間。');
    E.teleport('c2_vargas', 2, 5, 'down');
    await E.fadeIn(16);
    E.bgm('home');
    await E.say('yui', '今日の献立は、合成米のごはん、星くず汁、グリーン・ブロック産の野菜炒め。デザートはプリンです。');
    E.emote('c2_niko', '!');
    await E.say('niko:surprise', '……ぷりん？');
    await E.say('niko:smile', '……！！　ぷるぷる……！　あまい……！');
    await E.say('ponta', 'ニコちゃん、いい食べっぷりっす！　オイラの野菜炒め、あげるっす！');
    await E.say('ruu', 'ポンタ、それ自分が野菜きらいなだけでしょ。');
    await E.say('ponta:grin', 'バレたっす！');
    await E.say('niko', '……カナタの、ぷりん……。');
    const pk = await E.ask('kanata', '（ニコがオレのプリンを見つめている……）', ['プリンをあげる', '……これはあげられない']);
    if (pk === 0) {
      E.set('c2_pudding');
      await E.say('kanata:smile', 'ほら、やるよ。');
      E.emote('c2_niko', '♥');
      await E.say('niko:smile', '……カナタ、いいひと。せかいで、いちばん。');
      await E.say('ruu:grin', 'プリン一個で世界一とか、安っ。');
      await E.say('ruu:shy', '……あたしのも、半分あげる。');
    } else {
      await E.say('kanata', 'ごめん、プリンだけは……星屑亭じゃ、デザートなんて出ないんだ……。');
      await E.say('niko:sad', '……。');
      await E.say('ruu', 'ほら、ニコ。あたしの半分あげる。カナタはケチだから。');
      await E.say('niko:smile', '……ルウ、いいひと。せかいで、いちばん。');
      await E.say('kanata:cry', '（……なんか負けた気がする）');
    }
    await E.say('ponta', 'そうだカナタ！　ゆうべスクラップ・ベイで黄色いワークフレームが公安機と戦ったって噂、知ってるっすか！？');
    await E.say('kanata:surprise', 'ぶっ！？');
    await E.say('ponta', '旧式の作業機で、ガードナーを倒したらしいっす！　ガードナーは全高9.2m、重量14t、正規軍のモノアイ量産機っすよ！？');
    await E.say('ponta', 'ジェネレーター出力の差は約3倍、普通なら勝てるわけないっす！　どんなパイロットなんすかね〜！');
    await E.say('kanata:think', '……さ、さあ……。すごいやつも、いるもんだなー……。');
    await E.say('ruu', '（……ポンタって、こういう時だけ鋭いよね）');
    await E.say('ruu', 'カナタ、あたし先に屋上行ってる。……ニコ連れて、あとで来て。');
    await goOut('c2_ruu', [[14, 13], [20, 13], [20, 15]]);
    await E.fadeOut(12);
    del('c2_ponta', 'c2_yui', 'c2_vargas', 'c2_niko');
    E.party(['niko']);
    E.cut(false);
    E.bgm('school');
    await E.warp('school_hall', 14, 3, 'down');
  }

  // ---------- 屋上：ルウとニコ ----------
  G.addToMap('rooftop', {
    onEnter: async () => {
      if (at(5)) await sceneRooftop();
    },
  });
  async function sceneRooftop() {
    setStep(6);
    E.exp(E.val('c2_mimi_fail') ? 30 : 60);
    E.cut();
    E.party([]);
    E.objective('');
    put('c2_ruu', 'ruu', 17, 11, 'up');
    put('c2_niko', 'niko', 6, 10, 'up');
    E.teleport('player', 7, 10, 'up');
    await E.wait(20);
    await Promise.all([E.move('player', [[7, 12], [15, 12]]), E.move('c2_niko', [[6, 12], [14, 12]])]);
    E.face('player', 'up');
    E.face('c2_niko', 'up');
    await E.say('ruu', '……遅い。ミミにつかまってたでしょ。');
    await E.say('kanata:grin', 'ギリギリ逃げ切った。');
    await E.cg('rooftop', '屋上から見上げる空は、今日も“向こう側の街”でいっぱいだった。');
    await E.say('ruu', '……ニコ。この空、どう思う？');
    await E.say('niko', '……まち。さかさまの、まち。');
    await E.say('ruu', 'そ。全部ニセモノ。青く見えるのは、ミラーが光を反射してるだけ。');
    await E.say('ruu', 'あたしはね、いつか本物の空が見たいの。どこまでも上に抜けてて、天井なんてない空。');
    await E.say('niko', '……ニコ、ほんとうのそら、みたこと、ある。');
    await E.say('ruu:surprise', '……え？');
    await E.say('niko:sad', 'くろくて……つめたくて……ずっと、ずっと、なにもない。');
    await E.say('niko:sad', 'ほしは、いっぱい。でも、だれも、いない。……さむかった。');
    await E.say('ruu', '……。');
    await E.say('niko', 'ニコは……こっちの、そら、すき。まちが、みえる。ひとが、いる。');
    await E.say('kanata', '……オレも、この空、けっこう好きなんだ。ニセモノでも、オレらの空だろ。');
    await E.say('ruu:shy', '……ふん。二人して、なにそれ。');
    await E.say('ruu', '……でも。ニコがここの空のほうがいいって言うなら。');
    await E.say('ruu:smile', 'ちょっとだけ、見直してやってもいいかな。この空のこと。');
    E.cgOff();
    E.se('ok');
    await E.say(null, 'キーンコーンカーンコーン……。');
    await E.say('ruu:surprise', 'げっ、5時間目、体育じゃん！　着替えなきゃ！');
    await E.say('kanata:surprise', 'バルガス先生の体育で遅刻したら、校庭10周だぞ！　急げ！');
    await E.fadeOut(16);
    del('c2_ruu', 'c2_niko');
    await scenePE();
  }

  // ---------- 体育：ドッジボール ----------
  async function scenePE() {
    E.time('day');
    await E.warp('school_yard', 33, 20, 'right', { noEnter: true, noFade: true });
    E.cut();
    del('w2_daichi', 'w2_kick');
    put('c2_ruu', 'ruu', 33, 18, 'right');
    put('c2_niko', 'niko', 32, 19, 'right');
    put('c2_ponta', 'ponta', 32, 21, 'right');
    put('c2_yui', 'yui', 31, 20, 'right');
    put('c2_o1', 'w2_takashi', 39, 18, 'left');
    put('c2_o2', 'w2_tsubasa', 40, 20, 'left');
    put('c2_o3', 'w2_rinka', 39, 21, 'left');
    put('c2_o4', 'w2_tsubame', 41, 19, 'left');
    put('c2_vargas', 'vargas', 36, 15, 'down');
    put('c2_kyo', 'kyosuke', 44, 23, 'down');
    await E.fadeIn(20);
    E.bgm('battle');
    await E.say(null, '──5時間目・体育。');
    await E.say('vargas', '本日はドッジボール！　コロニーの低重力、ではないが、手加減は無用だ！');
    await E.say('vargas', '当てたら当て返す！　逃げるなら全力で逃げろ！　ピーッ！');
    await E.say('w2_takashi', 'いくぜ春瀬ぇ！　シミュレーター1位の反射神経、見せてみろ！');
    E.cut(false);
    const sc = await E.timing({ title: 'ドッジボール', rounds: 5, speed: 1.7, zone: 0.17, labels: ['ボールが来た！　よけろ！', 'キャッチだ！', '投げ返せ！', 'ニコを狙ってる！　かばえ！', 'とどめの一球！'] });
    E.cut();
    E.set('c2_dodge', sc);
    E.exp(50 + sc * 15);
    if (sc >= 4) {
      await E.say('w2_takashi:surprise', 'なっ……全部よけて、全部当てた！？　化け物かよ！');
      await E.say('vargas:smile', 'うむ！　見事だ春瀬！　今日のMVPだ！');
      await E.give('soda', 2);
    } else if (sc >= 2) {
      await E.say('kanata:grin', 'へへっ、まあまあかな。');
      await E.say('ponta', 'カナタ、ナイスっす！');
    } else {
      E.se('hit');
      E.shake(4, 12);
      await E.say('kanata:cry', 'ぶべっ！？　顔面……！');
      await E.say('vargas', '顔面はセーフだ！　……痛そうだがな。');
    }
    await E.say('w2_rinka', '……ねえ、ニコちゃん、さっきから一回も当たってなくない？');
    await E.say('w2_tsubasa', 'しかも目、つぶってるし……。');
    await E.say('niko', '……ボール。おと、する。どこに、くるか、きこえる。');
    await E.say('w2_tsubame', '……音？');
    await E.say('kanata:think', '（ニコ……やっぱり、何か特別な力が……？）');
    await E.say('ruu:grin', 'じゃ、最後はあたしの番！　……必殺、ルウ・スペシャル！');
    E.se('swing');
    E.shake(5, 10);
    await E.say(null, 'ルウの剛速球が、うなりを上げて──相手の頭上を越え、コートの外へ。');
    await E.camera(44, 22);
    E.se('hit');
    E.emote('c2_kyo', '💢');
    await E.say('kyosuke', '…………いってぇな。');
    await E.say('ponta:cry', 'ひぃっ！？　さ、3年の鬼塚キョウスケ先輩っす……！　番長っす……！');
    await E.move('c2_kyo', [[44, 20], [42, 20]], { speed: 0.8 });
    E.face('c2_kyo', 'left');
    await E.cameraReset();
    await E.say('kyosuke', '……誰だ。今の、投げたの。');
    await E.say('ruu:angry', 'あたし。……授業中にサボって寝てるほうが悪いんでしょ。');
    await E.say('kyosuke', '……あぁ？');
    await E.wait(30);
    await E.say('kyosuke', '……いい肩してんじゃねぇか。');
    E.face('c2_kyo', 'left');
    await E.say('kyosuke', 'で、そっちの寝ぐせ。……テメェ、春瀬だな。シミュレーター1位の。');
    await E.say('kanata', 'え、オレ？');
    await E.say('kyosuke:serious', '明日の放課後。体育倉庫裏に来い。……逃げんなよ。');
    await E.say('vargas:angry', '鬼塚ァ！！　授業中だ！　サボるなら全力でサボれ！　……いや違う、出るなら全力で出ろ！！');
    await E.say('kyosuke', '……チッ。');
    await goOut('c2_kyo', [[44, 20], [44, 30]]);
    await E.say('ponta:cry', 'カ、カナタ……番長に目をつけられたっす……。明日、生きて帰ってこれるっすかね……。');
    await E.say('ruu', '……あたしのせいだし。明日は、あたしも行く。');
    // 放課後
    await E.fadeOut(20);
    del('c2_o1', 'c2_o2', 'c2_o3', 'c2_o4', 'c2_vargas', 'c2_yui');
    E.time('evening');
    await E.say(null, '──放課後。');
    E.teleport('player', 22, 12, 'down');
    E.teleport('c2_ruu', 23, 12, 'left');
    E.teleport('c2_niko', 21, 12, 'right');
    E.teleport('c2_ponta', 22, 14, 'up');
    await E.fadeIn(20);
    E.bgm('school');
    await E.say('ponta', 'そうだ！　ニコちゃんの歓迎会、やるっす！　うちの銭湯〈ポン湯〉、今日はオイラのおごりっす！');
    await E.say('niko', '……せんとう？');
    await E.say('ponta', 'おっきいお風呂っす！　壁に地球のフジヤマが描いてあるっす！');
    await E.say('niko:surprise', '……おふろ……おおきい……！？');
    await E.say('ruu', 'ポンタの家のお風呂、47度あるけどね。');
    await E.say('ponta:grin', 'それがいいんっす！　さ、行くっす！');
    del('c2_ruu', 'c2_niko', 'c2_ponta');
    E.party(['ruu', 'niko', 'ponta']);
    setStep(7);
    E.cut(false);
    E.objective('銭湯〈ポン湯〉へ（ミナト区・運河の南）');
  }

  // ---------- ポン湯 ----------
  G.addToMap('ponyu', {
    onEnter: async () => {
      if (at(7)) await sceneBath();
    },
    npcs: [
      {
        id: 'c2_ponta_bath', char: 'ponta', x: 6, y: 10, dir: 'down', move: 'still', show: () => at(14),
        talk: async () => {
          await E.say('ponta', 'カナタ！　昨日の話、考えてくれたっすか？　ポンコツ号の整備、オイラにも手伝わせてほしいっす！');
          await E.say('ponta', 'オイラ、ずっと本物のAFをいじってみたかったんっす。……銭湯のボイラーとは、わけが違うっすからね！');
          await E.say('ponta:grin', 'もし、どこかで機体を動かすことになったら……オイラ、整備士として絶対ついていくっす！');
        },
      },
    ],
  });
  async function sceneBath() {
    setStep(8);
    E.cut();
    E.party([]);
    E.bgm('home');
    put('c2_ruu', 'ruu', 9, 11, 'up');
    put('c2_niko', 'niko', 8, 11, 'up');
    put('c2_ponta', 'ponta', 9, 10, 'down');
    E.teleport('player', 8, 12, 'up');
    await E.say('w_ponyu_oyaji', 'おう、ポンタ！　友だち連れてきたのか。……お、カナタじゃねえか。トメさん元気か？');
    await E.say('ponta', '父ちゃん、今日はオイラのおごりっす！　転校生の歓迎会っす！');
    await E.say('w_ponyu_oyaji', 'がっはっは！　ゆっくりあったまっていきな、嬢ちゃん！');
    await E.say('niko', '……おふろ。はいりかた、しらない。');
    await E.say('ruu', '……しょうがないな。あたしが教えたげる。行くよ、ニコ。');
    await E.say('ponta', 'じゃ、男湯はこっちっす！');
    await E.fadeOut(20);
    del('c2_ruu', 'c2_niko');
    E.teleport('player', 4, 5, 'up');
    E.teleport('c2_ponta', 5, 5, 'up');
    E.tint('rgba(220,235,255,0.18)');
    await E.say(null, '──男湯。');
    await E.fadeIn(20);
    await E.say('ponta', 'ふい〜〜っ……。47度、最高っす……。');
    await E.say('kanata:cry', 'あ、あっつ……！　ポンタ、これ茹で上がるって……！');
    await E.say('ponta', '慣れっす、慣れ。……ところでカナタ。');
    await E.say('ponta:serious', '……ゆうべの黄色いワークフレーム。あれ、カナタっすよね？');
    await E.say('kanata:surprise', '……！');
    await E.say('ponta', 'あの関節の動き、カナタのシミュレーターのクセそのままだったっす。噂の動画、10回見たっすから。');
    await E.say('ponta:smile', '大丈夫、誰にも言わないっす。……ニコちゃんのことも、なんとなくわかるっす。');
    await E.say('kanata', '……ポンタ。');
    await E.say('ponta', 'その代わり！　ポンコツ号、オイラにも触らせてほしいっす！　整備、絶対役に立つっすから！');
    await E.say('kanata:grin', '……ああ。頼むよ、相棒。');
    await E.say('ponta:grin', 'ぶっひゃー！　やったっす！');
    E.shake(2, 10);
    await E.say('ruu', '──ちょっと、ニコ！　お湯の中で泳がないの！');
    await E.say('niko', '……おゆ、いっぱい……！　ぷかぷか……！');
    await E.say('ruu', 'それと、そっちの蛇口は電気風呂！　しびれるから──');
    E.se('hit');
    await E.say('niko:surprise', 'ぴゃっ！？');
    await E.say('ruu:grin', '……言わんこっちゃない。あははっ！');
    await E.say('kanata:grin', '（……ルウの笑い声、久しぶりに聞いたかも）');
    await E.wait(30);
    await E.say(null, '壁の向こうから、ニコの小さな鼻歌が聞こえてくる。どこか懐かしい、知らない歌。');
    await E.say('niko', '♪……ほしの、こえ……ねむれ、ねむれ……クレイドル……♪');
    await E.say('ponta', '……いい歌っすね。なんて歌っすか？');
    await E.say('niko', '……しらない。むかし、だれかが、うたってた。');
    await E.fadeOut(20);
    E.tint(null);
    await E.say(null, '──湯上がり。');
    E.teleport('player', 8, 10, 'right');
    E.teleport('c2_ponta', 10, 10, 'left');
    put('c2_ruu', 'ruu', 9, 11, 'up');
    put('c2_niko', 'niko', 9, 9, 'down');
    await E.fadeIn(20);
    await E.say('ponta', '湯上がりは、これっす！　ポン湯名物、ビン牛乳！');
    await E.say('ponta', '正しい飲み方は、腰に手を当てて、一気っす！');
    E.cut(false);
    const milk = await E.timing({ title: 'フルーツ牛乳一気飲み', rounds: 2, speed: 1.5, zone: 0.2, labels: ['腰に手を当てて……', '一気！'] });
    E.cut();
    if (milk >= 2) {
      await E.say('kanata:grin', 'ぷはーっ！');
      await E.say('w_ponyu_oyaji', 'おっ、いい飲みっぷりだ！　ほれ、もう一本サービスだ！');
      await E.give('soda', 1);
    } else {
      await E.say('kanata:cry', 'げほっ、げほっ！　鼻に入った……！');
    }
    await E.say('niko:smile', '……ぷはー。');
    await E.say('ruu:grin', 'ニコ、白いヒゲついてる。');
    await E.say('niko:smile', '……ルウも、ついてる。');
    await E.say('ruu:shy', 'う、うそ！？');
    await E.say('ponta', 'じゃ、オイラは店番があるっす！　ニコちゃん、また来るっす！');
    await E.say('niko:smile', '……うん。おふろ、すき。ぽんた、すき。');
    await E.say('ponta:shy', 'ぶ、ぶっひゃー……！');
    del('c2_ruu', 'c2_niko');
    E.party(['ruu', 'niko']);
    E.time('evening');
    E.cut(false);
    E.objective('星屑亭へ帰る（ミナト区・商店街の北側）');
  }

  // ---------- 星屑亭・夕方：ルウが帰る → ルウ編へ ----------
  async function sceneEveningRuuLeaves() {
    setStep(9);
    E.cut();
    E.party([]);
    del('w_taxi');
    put('c2_ruu', 'ruu', 8, 9, 'up');
    put('c2_niko', 'niko', 6, 7, 'up');
    E.teleport('player', 7, 7, 'up');
    await E.say('tome', 'おかえり。……おや、いい匂いさせて。ポン湯かい？');
    await E.say('niko:smile', 'おふろ、ひろかった。ぷかぷか、した。');
    await E.say('tome:smile', 'そうかい、そうかい。ほら、夕飯だよ。');
    await E.say(null, '──その夜の星屑亭は、いつもよりにぎやかだった。');
    await E.say('niko:smile', '……おかわり。');
    await E.say('tome:grin', 'はいよ！');
    await E.wait(30);
    E.face('player', 'right');
    E.face('c2_ruu', 'left');
    await E.say('ruu', '……あたし、そろそろ帰る。チビたちが待ってるし。');
    await E.say('kanata', 'あ……送ってこうか？　もう暗いし。');
    await E.say('ruu', 'いらない。……あんたは、ニコのこと見てて。');
    await E.say('ruu', 'ばあちゃん。……ごちそうさま。……おいしかった。');
    await E.say('tome:smile', 'いつでも食いにおいで。あんたの分のどんぶりも、ちゃんとあるんだからね。');
    await E.say('ruu:shy', '……っ。');
    await E.move('c2_ruu', [[8, 10], [8, 11]]);
    E.remove('c2_ruu');
    E.se('door');
    await E.wait(40);
    await E.fadeOut(30);
    await E.say(null, '──その夜。ルウは、ひとりで帰り道を歩いていた。');
    E.stopBgm();
    del('c2_niko');
    E.set('c2_ruu_mode');
    E.setChar('ruu');
    E.time('night');
    await E.warp('c2_hidamari_out', 27, 12, 'left', { noEnter: true });
    E.cut();
    await E.wait(30);
    await E.say('ruu', '……ただいま。');
    await E.say('ruu', '（……星屑亭のあったかさが、まだ手のひらに残ってる）');
    await E.say('ruu', '（ばあちゃん、何も聞かなかった。ニコにも、あたしにも）');
    await E.say('ruu:sad', '（……「あんたの分のどんぶりも、ある」……か）');
    E.cut(false);
    E.objective('ひだまり園に入る');
  }

  // ---------- ルウ編：ひだまり園 ----------
  const kidsDone = () => ['c2_gn_haru', 'c2_gn_shota', 'c2_gn_mio'].filter((k) => E.flag(k)).length;
  function kidObjective() {
    E.objective('ちびたちに「おやすみ」を言う（' + kidsDone() + '/3）');
  }
  async function kidDone(flag) {
    if (E.flag(flag)) return;
    E.set(flag);
    if (kidsDone() >= 3) {
      await E.wait(10);
      await E.say('c2_encho', 'ルウ。……ありがとうね。みんな、あなたが帰ってくるのを、ずっと待ってたのよ。');
      await E.say('c2_encho:smile', '……屋根の上でしょ？　行ってらっしゃい。風邪ひかないようにね。');
      await E.say('ruu:shy', '……なんでバレてんの。');
      await E.say('c2_encho:smile', '何年あなたの先生やってると思ってるの。');
      setStep(10);
      E.objective('屋根にのぼる（建物の東側の非常はしご）');
    } else kidObjective();
  }
  G.addToMap('c2_hidamari_out', {
    onEnter: async () => {
      if (E.flag('c2_ruu_mode') && step() === 10 && !E.flag('c2_ladder_hint')) {
        E.set('c2_ladder_hint');
        await E.say('ruu', '（はしごは東側。……昔から、眠れない夜はここから屋根にのぼってた）');
      }
    },
    checks: [
      {
        x: 21, y: 5, h: 3,
        show: () => at(10),
        run: async () => await sceneRoof(),
      },
    ],
    events: [
      {
        x: 28, y: 11, w: 1, h: 2,
        cond: () => E.flag('c2_ruu_mode'),
        run: async () => {
          await E.say('ruu', '（……今夜は、ここにいよう）');
          await E.move('player', 'L');
        },
      },
    ],
  });
  G.addToMap('c2_hidamari', {
    onEnter: async () => {
      if (at(9) && !E.flag('c2_home_greet')) await sceneHomeGreet();
    },
    npcs: [
      {
        id: 'c2_encho_n', char: 'c2_encho', x: 4, y: 6, dir: 'right', move: 'still', show: () => G.state.chapter >= 2 && !E.flag('w_evac'),
        talk: async () => {
          if (E.flag('c2_ruu_mode')) {
            const k = await E.ask('c2_encho', 'なあに、ルウ。', ['リリねえのこと', '……あたしが来た日のこと', 'なんでもない']);
            if (k === 0) {
              await E.say('ruu', '……先生。リリねえって、今どうしてるか知ってる？');
              await E.say('c2_encho:sad', '……リリィちゃんね。あなたがいつも後ろをついて回ってた、歌の上手な子。');
              await E.say('c2_encho', 'あの子が12歳の時……「特別な奨学生に選ばれた」って、白い車が迎えに来てね。');
              await E.say('c2_encho:sad', 'それきり、手紙も来ないの。……元気でいてくれたら、いいんだけど。');
              await E.say('ruu', '…………白い、車。');
              await E.say('ruu:serious', '（……「しろいへや」。ニコが言ってた……まさか、ね）');
            } else if (k === 1) {
              await E.say('c2_encho', 'あなたが来た日？　……人工降雨の日だったわね。ずぶぬれで、ひと言もしゃべらなかった。');
              await E.say('c2_encho:smile', '3歳なのに、泣きもしないで。ずっと、窓から空を見てた。');
              await E.say('c2_encho', '「あのそら、うそ」って、最初にしゃべった言葉がそれよ。……今と変わらないわね。');
              await E.say('ruu:shy', '……覚えてないし。');
            } else {
              await E.say('c2_encho:smile', 'ふふ。……おかえり、ルウ。');
            }
          } else {
            await E.say('c2_encho', G.byCh({ 2: 'あら、ルウのお友だち？　いつもあの子がお世話になってます。', 4: 'ルウが最近、よく笑うの。……あなたたちのおかげね。', 7: 'ここの子たちは、地下の避難所に移すわ。……ルウに、無理しないでって伝えて。', 9: 'ニコちゃんも、遊びにきてくれるのよ。うちの子たちと、すっかり仲良し。' }));
          }
        },
      },
      {
        id: 'c2_haru_n', char: 'c2_haru', x: 15, y: 9, dir: 'up', move: 'wander', range: 2, show: () => G.state.chapter >= 2 && !E.flag('w_evac'),
        talk: async () => {
          if (!E.flag('c2_ruu_mode')) {
            await E.say('c2_haru', G.byCh({ 2: 'おにいちゃん、だあれ？　ルウねえちゃんの、カレシ？', 3: 'ルウねえちゃん、ロボットにのってるってほんと？　ピンクの！', 9: 'ニコおねえちゃんとね、おほしさまのうた、うたったの！' }));
            return;
          }
          await E.say('c2_haru', 'ルウねえちゃん……きのう、じめんが、ぐらぐらした……。');
          await E.say('c2_haru:sad', 'おそらが、おちてくるの？　むこうがわのまちが、ふってくる？');
          const k = await E.ask('ruu', '（ハルが、パジャマのすそを握りしめてる……）', ['「落ちてこないよ。あれはニセモノの空だもん」', '「落ちてきたら、あたしが受け止める」']);
          if (k === 0) {
            await E.say('ruu', '落ちてこないよ。あれはただの地面。ニセモノの空なんだから。');
            await E.say('c2_haru', '……ニセモノなら、だいじょうぶ？');
            await E.say('ruu:smile', 'そ。ニセモノは、こわくない。');
          } else {
            await E.say('ruu:grin', '落ちてきたら、あたしが受け止めてやる。片手で。');
            await E.say('c2_haru:smile', 'すごーい！　ルウねえちゃん、つよーい！');
            await E.say('ruu', 'だから、安心して寝な。');
          }
          await E.say('c2_haru:smile', '……うん。おやすみ、ルウねえちゃん。');
          await E.say('ruu:smile', 'おやすみ、ハル。');
          await kidDone('c2_gn_haru');
        },
      },
      {
        id: 'c2_shota_n', char: 'c2_shota', x: 18, y: 4, dir: 'down', move: 'still', show: () => G.state.chapter >= 2 && !E.flag('w_evac'),
        talk: async () => {
          if (!E.flag('c2_ruu_mode')) {
            await E.say('c2_shota', G.byCh({ 2: 'にいちゃん、黄色いロボットのうわさ知ってる？　オレ、いつかパイロットになるんだ！', 3: 'スターダストってクラン、知ってる！？　黄色……じゃなくて白い機体がめっちゃ速いんだって！', 9: 'オレ、ドクってじいちゃんに弟子入りするんだ！　ネジって猫にかじられたけど！' }));
            return;
          }
          await E.say('c2_shota', 'ルウ姉！　聞いてよ、ゆうべスクラップ・ベイに黄色いロボットが出たんだって！');
          await E.say('c2_shota', '公安のロボを、ドカーン！　ってやっつけたって！　ネットで動画見た！');
          await E.say('ruu:grin', '……へえ。どんなパイロットなんだろうね。');
          await E.say('c2_shota', 'きっと、すっげーマッチョで、ヒゲのおっさんだよ！');
          await E.say('ruu:grin', 'ぷっ……！　あはは、そうかもね。寝ぐせのひどい、のんびりしたおっさんかも。');
          await E.say('c2_shota', 'オレも大きくなったら、パイロットになる！　そんで、ルウ姉をロボに乗せてやる！');
          await E.say('ruu', '……生意気。あたしは、自分で操縦するの。');
          await E.say('ruu', 'ほら、もう寝な。パイロットは睡眠も仕事だよ。おやすみ、ショウタ。');
          await E.say('c2_shota', 'ちぇー。……おやすみ、ルウ姉！');
          await kidDone('c2_gn_shota');
        },
      },
      {
        id: 'c2_mio_n', char: 'c2_mio', x: 2, y: 11, dir: 'right', move: 'still', show: () => G.state.chapter >= 2 && !E.flag('w_evac'),
        talk: async () => {
          if (!E.flag('c2_ruu_mode')) {
            await E.say('c2_mio', G.byCh({ 2: '……。', 3: '……ラジオのおねえさんの声、すき。', 9: '……ニコおねえちゃん、また、きてね。' }));
            return;
          }
          await E.say('c2_mio', '……。');
          await E.say('ruu', '（ミオ。先月ここに来たばかりの子。……まだ、誰とも話さない）');
          await E.say('ruu', '（来たばかりの頃の、あたしみたいだ）');
          await E.say('ruu', '……となり、いい？');
          await E.say('c2_mio', '……。');
          await E.wait(40);
          await E.say('c2_mio', '……ルウおねえちゃんは……ずっと、ここにいたの？');
          await E.say('ruu', '……3歳から。親の顔は、覚えてない。');
          await E.say('c2_mio:sad', '……さみしく、なかった？');
          const k = await E.ask('ruu', '（……）', ['「さみしかったよ。今も、たまに」', '「さみしくなかった。ここがあったから」']);
          if (k === 0) {
            await E.say('ruu', 'さみしかったよ。……今も、たまにね。');
            await E.say('ruu', 'でも、さみしいって言える相手がいると、ちょっとだけマシになる。');
            await E.say('c2_mio', '……ミオも、いってもいい？　さみしいって。');
            await E.say('ruu:smile', 'いいよ。いつでも、あたしに言いな。');
          } else {
            await E.say('ruu', '……さみしくなかったって言ったら、うそになるけど。');
            await E.say('ruu', 'ここには先生も、チビたちもいた。ひとりじゃなかった。……ミオも、もうひとりじゃないよ。');
            await E.say('c2_mio', '……うん。');
          }
          await E.say('c2_mio', '……あのね。ミオ、ラジオのおねえさんの声、すき。夜、こわくなくなるの。');
          await E.say('ruu', 'ラジオ？　……ああ、海賊ラジオの。');
          await E.say('c2_mio:smile', '……おやすみ、ルウおねえちゃん。');
          await E.say('ruu:smile', 'おやすみ、ミオ。');
          await kidDone('c2_gn_mio');
        },
      },
    ],
  });
  async function sceneHomeGreet() {
    E.set('c2_home_greet');
    E.cut();
    await E.wait(10);
    await E.say('c2_haru', 'あーっ！　ルウねえちゃんだ！');
    await E.say('c2_shota', 'ルウ姉、おそい！　どこ行ってたんだよ！');
    await E.say('ruu', 'ちょっとね。……友だちの家。');
    await E.say('c2_haru', 'ルウねえちゃんに、ともだち！？');
    await E.say('ruu:angry', '……なにその反応。');
    await E.say('c2_encho:smile', 'おかえり、ルウ。春瀬さんから電話もらったわよ。……楽しかった？');
    await E.say('ruu:shy', '……べつに。ふつう。');
    await E.say('c2_encho:smile', 'そう。ふつうに、楽しかったのね。');
    await E.say('ruu', '……先生、ちびたち、まだ起きてんの？　もう寝る時間でしょ。');
    await E.say('c2_encho', 'みんな、あなたが帰ってくるまで寝ないって言うのよ。……おやすみ、言ってあげて。');
    E.cut(false);
    kidObjective();
  }

  // ---------- ルウ編：屋根の上 ----------
  async function sceneRoof() {
    setStep(11);
    E.cut();
    await E.fadeOut(20);
    await E.say(null, '……カン、カン、カン。錆びたはしごを、のぼる。');
    E.bgm('sad');
    await E.cg('rooftop_night', '', { wait: false });
    await E.fadeIn(30);
    await E.cgCaption('ひだまり園の屋根の上。ルウの、いちばん古い秘密の場所。');
    await E.say('ruu', '……やっぱ、ここ落ち着く。');
    await E.say('ruu', '（昔はリリねえと、ここで星を数えてた。……星なんて、ひとつも見えないのに）');
    await E.say('ruu', '（「あれが一番星」って、リリねえは向こう側の街の灯りを指さして、笑ってた）');
    await E.say('ruu:sad', '（そしてある日、白い車が来て……それきり）');
    await E.say('ruu', '……ニコ。');
    await E.say('ruu', '（「しろいへや」が嫌いだって、あの子は言った）');
    await E.say('ruu', '（名前も「ニコって呼ばれてた」だけ。誕生日も、親の顔も、知らない）');
    await E.say('ruu:sad', '（……あたしと、同じだ）');
    await E.wait(30);
    await E.say(null, '……園の窓から、子どもたちのラジオの音が、かすかに漏れてくる。');
    await E.radio(
      [
        'ハロー、クレイドル7の夜ふかしさんたち。レディオ・スターダスト、深夜のおまけコーナーよ。',
        'リクエストのお便り。「ミナト区のはずれの、小さなおうちのみんな」から。……読むね。',
        '「ラジオのおねえさんへ。ルウねえちゃんが、さいきん、ちょっとだけ、わらうようになりました」',
        '……ふふ。そう。よかった。……本当に、よかった。',
        'じゃあ、そのおうちのみんなに、この曲を。……古い子守唄よ。おやすみなさい、星屑たち。',
      ],
      { keepBgm: true }
    );
    E.bgm('sad');
    await E.cg('rooftop_night', '', { wait: false });
    await E.say('ruu:surprise', '……！？　な、なんで、あたしの名前……！');
    await E.say('ruu', '……チビたちの誰かが、ハガキ出したんだ。まったく。');
    await E.say('ruu:think', '（……でも、今の声。どこかで聞いたような……）');
    await E.say('ruu', '（この歌……ニコが、お風呂で歌ってた歌と、同じ……？）');
    await E.wait(30);
    await E.say('ruu:serious', '……決めた。');
    await E.say('ruu:serious', 'ニコは、あたしが守る。');
    await E.say('ruu:serious', 'リリねえの時みたいに、白い車なんかに、絶対に連れていかせない。');
    await E.cgCaption('ニセモノの空の下で、ルウは小さく、拳をにぎった。');
    E.cgOff();
    await E.fadeOut(40);
    // カナタに戻る
    E.unset('c2_ruu_mode');
    E.setChar('kanata');
    E.party([]);
    E.time('morning');
    setStep(11);
    await E.warp('tome_room', 5, 6, 'down', { noFade: true, noEnter: true });
    await E.fadeIn(30);
    await sceneDay3Morning();
  }

  // ---------- 3日目：朝 → 放課後 ----------
  async function sceneDay3Morning() {
    setStep(11.5);
    E.cut();
    put('c2_niko', 'niko', 2, 2, 'up');
    E.bgm('home');
    await E.say(null, '──翌朝。');
    await E.say('niko', '……カナタ、おはよ。');
    await E.say('kanata', 'おはよ……って、ニコ、窓にはりついて何してんの？');
    await E.say('niko', '……あさの、ひかり。ミラーが、うごく、おと。きいてた。');
    await E.say('niko:smile', 'きょうも、そら、おちてない。');
    await E.say('kanata:think', '（……そら、おちてない？　あの白い機体のやつも、似たようなこと言ってたような……）');
    await E.say('tome', 'カナタ！　ニコちゃん！　ごはんだよ！　今日は店が混むからね、学校終わったらまっすぐ帰って手伝いな！');
    await E.say('kanata', 'へーい！');
    await E.fadeOut(20);
    del('c2_niko');
    await E.say(null, '──その日の授業は、何事もなく過ぎた。');
    await E.say(null, 'ニコはお昼にパンを五つ食べ、バルガス先生にチョークを二本投げられ、ユイに数学の宿題を見てもらった。');
    await E.say(null, '……そして、放課後。');
    E.time('evening');
    setStep(11);
    await E.warp('classroom', 6, 9, 'up', { noFade: true, noEnter: true });
    await E.fadeIn(20);
    await sceneAfterSchoolDay3();
  }
  async function sceneAfterSchoolDay3() {
    setStep(12);
    E.cut();
    E.party([]);
    E.bgm('school');
    put('c2_ruu', 'ruu', 14, 9, 'left');
    put('c2_niko', 'niko', 3, 9, 'right');
    put('c2_ponta', 'ponta', 17, 9, 'left');
    put('c2_yui', 'yui', 6, 7, 'down');
    E.teleport('player', 6, 9, 'up');
    await E.say('yui', '春瀬くん。少し、いいですか。');
    await E.say('yui:think', 'ニコさんの転入書類のことなんですけど。保護者欄の印鑑……あれ、星屑亭のお店のスタンプでしたよね。');
    await E.say('kanata:surprise', 'え゛っ！？');
    await E.say('yui', '「ラーメン一杯無料」の文字が、うっすら残ってました。');
    await E.say('ruu', '（ばあちゃん……！）');
    await E.say('yui', '……先生方は、気づいてないみたいです。わたしも……今は、まだ何も言いません。');
    await E.say('yui:serious', 'でも。……何か事情があるなら、いつか、わたしにも話してください。学級委員として……いえ。');
    await E.say('yui:shy', '……クラスメイトとして。');
    await goOut('c2_yui', [[6, 13], [20, 13], [20, 15]]);
    await E.say('ponta', '……委員長、いい人っすね。');
    await E.wait(20);
    E.se('door');
    put('c2_goon1', 'c2_goon1', 20, 14, 'up');
    put('c2_goon2', 'c2_goon2', 19, 14, 'up');
    await E.move('c2_goon1', [[20, 11], [16, 11]]);
    E.face('c2_goon1', 'left');
    await E.say('c2_goon1', 'よぉ、2年B組の春瀬ってのは、テメェか。');
    await E.say('c2_goon2', 'キョウスケさんがお呼びだ。体育倉庫裏。……逃げたら、わかってんな？');
    await E.say('ponta:cry', 'き、来たっす……！');
    await goOut('c2_goon1', [[20, 11], [20, 15]]);
    del('c2_goon2');
    await E.say('ruu:serious', '……行くよ、カナタ。あたしが投げたボールのせいだし。');
    await E.say('niko', '……ニコも、いく。');
    await E.say('kanata', 'ニコは……いや、ひとりで置いてくほうが心配か。……なんとかなるって。たぶん。');
    await E.say('ponta:cry', 'オ、オイラは……オイラは、保健室の先生を呼ぶ準備をしておくっす！');
    del('c2_ruu', 'c2_niko', 'c2_ponta');
    E.party(['ruu', 'niko']);
    E.cut(false);
    E.objective('体育倉庫の裏へ（校庭の北東・倉庫の東側の小道から裏へ）');
  }

  // ---------- 体育倉庫裏：キョウスケ ----------
  G.addToMap('c2_gymback', {
    onEnter: async () => {
      if (at(12)) await sceneKyosuke();
    },
  });
  async function sceneKyosuke() {
    E.cut();
    E.party([]);
    put('c2_ruu', 'ruu', 12, 11, 'up');
    put('c2_niko', 'niko', 10, 11, 'up');
    E.teleport('player', 11, 10, 'up');
    put('c2_kyo', 'kyosuke', 11, 3, 'down');
    put('c2_goon1', 'c2_goon1', 8, 4, 'down');
    put('c2_goon2', 'c2_goon2', 14, 4, 'down');
    await E.wait(10);
    await E.say('kyosuke', '……来たか。');
    await E.say('kanata', '昨日のボールのことなら、悪かったって。ルウもわざとじゃ──');
    await E.say('kyosuke', 'ボール？　……ああ、あれか。どうでもいい。');
    await E.move('c2_kyo', 'D2', { speed: 0.6 });
    await E.say('kyosuke', '春瀬。テメェ、シミュレーターで学年1位らしいな。');
    await E.say('kyosuke', '……オレはな、画面の中でだけ強ぇヤツが、いちばん嫌いなんだよ。');
    await E.say('kyosuke:serious', '本物のケンカで、テメェの腕を見せてみろ。');
    await E.say('ruu:angry', 'はぁ？　なにそれ。言いがかりじゃん。');
    await E.say('c2_goon1', 'おっと、ピンク頭の相手はオレらだ！');
    E.bgm('battle');
    E.party(['ruu']);
    E.cut(false);
    await E.battle({
      map: 'c2_gymback', x: 11, y: 10, dir: 'up', bgm: 'battle', title: 'BATTLE!', sub: 'キョウスケの子分たちを追い払え',
      enemies: [
        { type: 'thug', x: 7, y: 5, lv: 2, name: '子分のテツ' },
        { type: 'thug', x: 15, y: 5, lv: 2, name: '子分のマサ' },
        { type: 'thug', x: 4, y: 9, lv: 2, name: '3年の取り巻き' },
      ],
      onStart: async () => {
        await E.say('ruu:angry', 'カナタ、雑魚はまとめて片づけるよ！');
      },
    });
    E.cut();
    E.party([]);
    put('c2_ruu', 'ruu', 13, 10, 'up');
    put('c2_niko', 'niko', 10, 12, 'up');
    put('c2_kyo', 'kyosuke', 11, 5, 'down');
    put('c2_goon1', 'c2_goon1', 4, 4, 'right');
    put('c2_goon2', 'c2_goon2', 19, 4, 'left');
    E.teleport('player', 11, 9, 'up');
    await E.say('c2_goon1:cry', 'い、いてて……。キョウスケさん、こいつら、強ぇっす……。');
    await E.say('kyosuke', '……ほぉ。');
    await E.say('kyosuke', 'ピンク頭。テメェは手ぇ出すな。……こっからは、タイマンだ。');
    await E.say('ruu:angry', 'ちょっと──');
    await E.say('kanata', '……いいよ、ルウ。');
    await E.say('kanata:serious', 'オレが逃げたら、ニコまで舐められる。……やるよ、先輩。');
    await E.say('kyosuke', '……いい目だ。来い！');
    E.cut(false);
    const won = await E.battle({
      map: 'c2_gymback', x: 11, y: 10, dir: 'up', bgm: 'boss', party: false, title: 'VS 番長', sub: '鬼塚キョウスケとタイマン！',
      enemies: [{ type: 'kyosuke', x: 11, y: 4, lv: 4, hp: 560, name: '番長・鬼塚キョウスケ' }],
    });
    E.cut();
    put('c2_ruu', 'ruu', 13, 10, 'up');
    put('c2_niko', 'niko', 10, 11, 'up');
    put('c2_kyo', 'kyosuke', 11, 6, 'down');
    E.teleport('player', 11, 8, 'up');
    E.bgm('school');
    await E.say('kyosuke', '……はぁ、はぁ……。');
    await E.say('kyosuke', '……ククッ。');
    await E.say('kyosuke:grin', 'あっはっはっは！　やるじゃねぇか、春瀬！');
    await E.say('kanata:think', '……え？');
    await E.say('kyosuke', '画面の中だけじゃねぇ。テメェは、本物だ。……あのドッジボールの身のこなしを見て、ピンと来たんだよ。');
    await E.say('kyosuke', '……悪かったな。試すような真似して。');
    await E.say('ruu', '……最初から、そう言えばいいじゃん。');
    await E.say('kyosuke', 'それじゃあ、わかんねぇだろ。拳で話すのが、いちばん早ぇ。');
    await E.say('niko', '……キョウスケ、さっきと、おと、ちがう。……やさしい、おと。');
    await E.say('kyosuke:surprise', '……あぁ？　なんだこのチビ。');
    await E.say('kyosuke', '……チッ。調子狂うぜ。');
    await E.say('kyosuke:serious', '……春瀬。テメェ、ジャンク・デュエルって知ってるか。');
    await E.say('kanata', 'アンダーシェルの……違法ロボバトル？');
    await E.say('kyosuke', 'オレは去年まで、そこで機体に乗ってた。……今は、ワケあって降りてるがな。');
    await E.say('kyosuke', 'テメェの腕なら、あそこでも食っていける。……覚えとけ。');
    await E.say('kyosuke', '──借りは、いつか返す。じゃあな。');
    await goOut('c2_kyo', [[11, 7], [16, 7], [16, 12], [11, 12], [11, 13]]);
    await E.say('ruu', '……なんなの、あいつ。');
    await E.say('kanata:grin', '……悪いやつじゃ、なさそうだな。');
    await E.say('kanata:surprise', 'あ、やべ！　ばあちゃんの店の手伝い！　今日は混むって言われてたんだ！');
    E.exp(150);
    del('c2_ruu', 'c2_niko');
    E.party(['ruu', 'niko']);
    setStep(13);
    E.cut(false);
    E.objective('星屑亭へ帰って、店を手伝う');
  }

  // ---------- 星屑亭：アイゼン少佐の来店 → ニコが倒れる ----------
  async function sceneShopEisen() {
    setStep(13.5);
    E.cut();
    E.party([]);
    E.time('night');
    del('w_taxi');
    put('c2_ruu', 'ruu', 12, 8, 'left');
    put('c2_niko', 'niko', 10, 8, 'right');
    put('c2_c1', 'c2_cust1', 2, 6, 'up');
    put('c2_c2', 'c2_cust2', 3, 6, 'up');
    put('c2_c3', 'w_taxi', 10, 6, 'right');
    E.teleport('player', 7, 9, 'up');
    E.bgm('home');
    await E.say('tome', 'おそい！　ほら、エプロンつけな！　カウンターに注文が三つたまってるよ！');
    await E.say('kanata', 'ご、ごめん！');
    await E.say('ruu', '……あたしも手伝う。皿洗いくらいなら。');
    await E.say('niko', '……ニコも。おみず、はこぶ。');
    await E.say('tome:smile', '助かるねえ。じゃあニコちゃんはお冷や、ルウちゃんは洗い場だ。カナタは麺！');
    E.teleport('player', 6, 4, 'down');
    E.cut(false);
    const s1 = await E.timing({ title: '星屑亭・夜の部', rounds: 4, speed: 1.6, zone: 0.17, labels: ['工場長の大盛り！', 'ミナミさんの麺かため！', 'サブローさんのネギ多め！', 'チャーシュー追加！'] });
    E.cut();
    E.set('c2_shop_score', s1);
    E.exp(40 + s1 * 10);
    if (s1 >= 3) {
      await E.say('c2_cust1:smile', 'うん、うまい！　カナタ坊、腕を上げたな！');
      await E.say('tome:smile', '……ふん。まあまあだね。');
      E.money(150);
    } else {
      await E.say('c2_cust2', 'あら、今日は麺がちょっと……やわらかめ？');
      await E.say('tome', 'カナタ、ボーっとしてんじゃないよ！');
      E.money(50);
    }
    await E.say('niko:smile', 'おみず、どうぞ。');
    await E.say('c2_cust1', 'おっ、かわいい店員さんだ！　トメさん、新しいバイトかい？');
    await E.say('tome', '遠い親戚さ。……宇宙くらい遠いね。');
    await E.say('kanata', '（ばあちゃんまで……）');
    await E.wait(30);
    // アイゼン来店
    E.se('door');
    E.stopBgm();
    put('c2_eisen', 'eisen', 7, 11, 'up');
    put('c2_eg', 'guard', 8, 11, 'up');
    await E.wait(20);
    E.emote('c2_c1', '!');
    E.emote('c2_c2', '!');
    await E.say(null, 'のれんをくぐって、軍服の男が入ってきた。店の空気が、すっと冷える。');
    E.bgm('tension');
    await E.say('c2_cust1', '（……公安だ。それも、特務の……）');
    await E.say('tome', '……いらっしゃい。');
    await E.say('tome', 'ニコちゃん、ルウちゃん。上で、どんぶり拭いといてくれるかい。……ゆっくりでいいからね。');
    await E.say('ruu', '……！　う、うん。行こ、ニコ。');
    await Promise.all([E.move('c2_ruu', [[13, 8], [13, 3], [14, 3]]), E.move('c2_niko', [[10, 7], [13, 7], [13, 3], [14, 3]])]);
    del('c2_ruu', 'c2_niko');
    await E.move('c2_eisen', [[7, 7], [5, 7], [5, 6]], { speed: 0.7 });
    E.face('c2_eisen', 'up');
    await E.move('c2_eg', [[8, 10]]);
    E.face('c2_eg', 'up');
    await E.say('eisen', '……星屑ラーメンを、ひとつ。');
    await E.say('tome', 'あいよ。……カナタ、作りな。');
    await E.say('kanata', '（……手が、ふるえる）');
    E.cut(false);
    const s2 = await E.timing({ title: '公安の注文', rounds: 3, speed: 1.8, zone: 0.16, labels: ['落ち着いて……麺をゆでる', 'スープを注ぐ', 'チャーシューを、のせる'] });
    E.cut();
    await E.say(null, '湯気の立つどんぶりを、男の前に置く。');
    await E.say('eisen', '……。');
    await E.wait(40);
    await E.say('eisen', '……うまい。');
    if (s2 >= 2) await E.say('eisen', '麺のゆで加減も、悪くない。……いい腕だ。');
    else await E.say('eisen', '……スープは、昔と同じ味だ。');
    await E.say('tome', '……あんたも、昔はいつも大盛りを頼んでたね。');
    await E.say('eisen', '……覚えていたか。');
    await E.say('tome', '客の顔は忘れないさ。……で、今日は何の用だい。ラーメンを食べに来ただけじゃないんだろ。');
    await E.say('eisen', '……コロニー公安、特務隊のアイゼンだ。');
    await E.say('eisen', '白い髪の少女を探している。年は十三、四。オレンジの作業服を着ていた。');
    await E.say('eisen', '保護対象だ。……見かけなかったか。');
    E.cut(false);
    const k = await E.ask('tome', '（ばあちゃんがちらりとこちらを見た……）', ['（黙って皿を拭き続ける）', '「……保護って、何から？」']);
    E.cut();
    if (k === 1) {
      E.set('c2_asked_eisen');
      await E.say('kanata', '……保護って、何から守るんですか。');
      await E.say('eisen', '……。');
      await E.say('eisen:serious', '──世界から、だ。');
      await E.say('eisen', '子供が首を突っこむ話ではない。');
    }
    await E.say('tome', 'うちに来るのは、腹を空かせた客だけさ。白い髪でも、黒い髪でもね。');
    await E.say('eisen', '……そうか。');
    E.face('c2_eisen', 'right');
    await E.say('eisen', '……君は。春瀬ジンの息子だな。');
    await E.say('kanata:surprise', '……！　父さんを、知ってるんですか。');
    await E.say('eisen', '……昔、少しな。目が、似ている。');
    await E.say('eisen', '……ごちそうさま。');
    await E.say(null, 'アイゼンはカウンターに代金と、一枚のカードを置いた。');
    await E.say('eisen', '何か見かけたら、ここへ。……昼でも夜でも構わない。');
    await E.say('eisen:serious', '春瀬トメ。……これは、子供の遊びではない。');
    await E.say('tome', '……知ってるさ。あんたよりも、ずっとね。');
    await E.move('c2_eisen', [[5, 7], [7, 7], [7, 11]], { speed: 0.7 });
    del('c2_eisen', 'c2_eg');
    E.se('door');
    await E.wait(40);
    await E.say('c2_cust1', '……ぷはーっ、息が止まるかと思ったぜ。');
    await E.say('kanata', 'ばあちゃん……今の人と、知り合いなの？');
    await E.say('tome', '……昔の、常連さ。');
    // マザーの放送 → ニコが倒れる
    await E.wait(20);
    E.se('alarm');
    E.shake(3, 40);
    E.tint('rgba(120,200,255,0.12)');
    await E.say('mother', 'オシラセ シマス。タダイマ ヨリ、コロニー ノ 回転調整ヲ 行イマス。');
    await E.say('mother', '住民ノ 皆サマハ、ソノママ オ過ゴシ クダサイ。……クレイドル7ハ、安全デス。');
    E.se('echo');
    await E.wait(20);
    E.se('hit');
    E.shake(5, 12);
    await E.say(null, 'ガタンッ！　──2階で、何かが倒れる音がした。');
    await E.say('ruu', '──ニコ！？　ニコ、しっかりして！　カナタ、来て！！');
    E.tint(null);
    await E.say('kanata:surprise', '……ニコ！！');
    del('c2_c1', 'c2_c2', 'c2_c3');
    await E.warp('tome_room', 10, 3, 'down', { noEnter: true });
    await sceneNikoCollapse();
  }
  async function sceneNikoCollapse() {
    E.cut();
    E.bgm('sad');
    put('c2_niko', 'niko', 4, 6, 'down');
    put('c2_ruu', 'ruu', 4, 7, 'up');
    await E.move('player', [[10, 6], [5, 6]], { speed: 1.6 });
    E.face('player', 'left');
    E.tint('rgba(140,230,255,0.14)');
    E.se('echo');
    await E.say(null, 'ニコが床に倒れていた。うっすらと開いた瞳が、青白く光っている。');
    await E.say('ruu:cry', '急にふらっとして……マザーの放送が始まった瞬間に……！');
    await E.say('niko', '……ほしが……ないてる……。');
    await E.say('mother', 'クレイドル7ハ……安全デス……アンゼン……デス……');
    await E.say('niko', '……だれかが……よんでる……とおく、とおく……「まだ、おちてない」……。');
    await E.say('niko:cry', '……いたい……さむい……しろいへや……いや……いや……！');
    const k = await E.ask('kanata', '（ニコの手が、氷みたいに冷たい……！）', ['ニコの手をにぎる', '名前を呼ぶ']);
    if (k === 0) {
      await E.say('kanata', 'ニコ！　オレがいる。ここは星屑亭だ。……白い部屋じゃない。');
    } else {
      await E.say('kanata', 'ニコ！　ニコ！！　聞こえるか！　オレだ、カナタだ！');
    }
    await E.say('ruu', 'ニコ、大丈夫。あたしたちが、ついてる。……どこにも、行かせないから。');
    await E.wait(40);
    E.tint(null);
    E.emote('c2_niko', '…');
    await E.say('niko', '……カナタ……ルウ……。');
    await E.say('niko:sad', '……おと……ちいさく、なった……。');
    await E.say('ruu:cry', '……よかった……。');
    put('c2_tome', 'tome', 10, 3, 'down');
    await E.move('c2_tome', [[10, 6], [7, 6]]);
    E.face('c2_tome', 'left');
    await E.say('tome', '……。');
    await E.say('tome:serious', '……今夜は、そばにいてやりな。');
    await E.say('ruu', 'あたし、今夜も泊まる。……いいでしょ。');
    await E.say('tome', 'ああ。布団、もう一組出しとくよ。');
    await E.fadeOut(30);
    del('c2_niko', 'c2_ruu');
    await E.say(null, '──深夜。ニコとルウが眠ったあと、カナタは1階へ下りた。');
    await E.warp('hoshikuzu', 7, 6, 'up', { noEnter: true, noFade: true });
    del('w_taxi');
    const tm = E.get('w_tome');
    if (tm) E.teleport('w_tome', 4, 4, 'down');
    await E.fadeIn(30);
    await E.say('tome', '……眠ったかい。');
    await E.say('kanata', 'うん。……ばあちゃん。ニコ、どうなっちゃうんだろう。');
    await E.say('tome', '……星の声、か。');
    await E.say('tome:serious', 'カナタ。あの子を守るなら、いつまでも「遠い親戚」じゃ済まない。ちゃんとした身分証が要る。');
    await E.say('tome', 'あの少佐はバカじゃない。学校の書類だって、調べられたらすぐバレる。');
    await E.say('kanata', '身分証って……どうやって？');
    await E.say('tome', '……蛇の道は蛇、さ。ドクに相談してみな。あのじいさんは、裏の顔が広い。');
    await E.say('tome', 'それと……ほら、これ。ドクから届いてたよ。');
    await E.say(null, 'ばあちゃんが差し出したのは、一枚の紙。「ポンコツ号　修理費見積書」と書いてある。');
    await E.say('kanata:surprise', '……………………よんまん、はっせん……クレジット……！？');
    await E.say('tome:grin', 'うちの店の売り上げ、半年分だね。');
    await E.say('kanata:cry', 'マジか……。');
    await E.say('tome:smile', '……まあ、今夜はもう寝な。明日は土曜だろ。なんとかなるさ。');
    await E.say('tome', '「なんとかなる」は、なんとかする奴の言葉だよ。……あんたの父ちゃんの口癖さ。');
    await E.fadeOut(30);
    setStep(14);
    E.time('day');
    E.party(['ruu', 'niko']);
    await E.say(null, '──翌日。土曜日。');
    await E.warp('hoshikuzu', 7, 9, 'down', { noEnter: true, noFade: true });
    await E.fadeIn(20);
    E.bgm('home');
    await E.say('ruu', 'おはよ。……ニコ、もうすっかり元気。朝からおにぎり四つ。');
    await E.say('niko:smile', '……ごつ。');
    await E.say('kanata:grin', 'はは……よかった。');
    await E.say('kanata', '今日はドクのガレージに行こう。修理代のことと……ニコの身分証のこと、相談しないと。');
    await E.say('ruu', '……ねえ。ドクのとこの前に、ひだまり園に寄ってもいい？');
    await E.say('ruu:shy', 'チビたちに、ニコを会わせたいの。……べつに、あとでもいいけど。');
    E.cut(false);
    E.objective('ドクのガレージへ（スクラップ・ベイ）／寄り道：ひだまり園（ミナト区・北西の路地の奥）');
  }

  // ---------- 4日目：ドクのガレージ ----------
  G.addToMap('doc_garage', {
    onEnter: async () => {
      if (at(14)) await sceneMoneyProblem();
    },
  });
  async function sceneMoneyProblem() {
    setStep(15);
    E.cut();
    E.party([]);
    put('c2_ruu', 'ruu', 13, 11, 'up');
    put('c2_niko', 'niko', 11, 11, 'up');
    E.teleport('player', 12, 11, 'up');
    E.bgm('scrap');
    await E.say('doc', '……ふん。来おったか、若造。');
    await E.say('doc', '見積書は見たな？　48,000クレジット。これでも、ジンのよしみで負けてやっとるんじゃぞ。');
    await E.say('kanata', 'そ、そんなにかかるの！？');
    await E.say('doc', 'あの晩、ガードナーとやり合ったせいでな。駆動系はガタガタ、ジェネレーターは焼けかけ、右腕はもげかけじゃ。');
    await E.say('doc', '動かすだけなら、ワシがツケで何とかしてやる。……じゃが、まともに「戦える」ようにするには、金が要る。');
    await E.say('neji', 'ニャ……ギギ。');
    await E.say('ruu', '……それと、ドク。もうひとつ相談。');
    await E.say('ruu', 'ニコの身分証がいるの。……本物っぽいやつ。');
    E.emote('w2_doc', '…');
    await E.say('doc', '……ほう。');
    await E.say('doc:think', '……身分証はワシの専門外じゃ。じゃが、アンダーシェルの闇パーツ屋が「紙」も作るという噂は聞く。');
    await E.say('doc', '30,000は取られるじゃろうな。……合わせて、78,000クレジット。');
    await E.say('kanata:cry', 'ななまん、はっせん……。星屑亭の売り上げ、一年分くらい……？');
    await E.say('niko:sad', '……ニコの、せい？');
    await E.say('kanata', 'ち、ちがうって！　ニコのせいじゃない！');
    await E.wait(30);
    await E.say('ruu', '……ねえ。あたしに、ひとつ考えがある。');
    await E.say('ruu:serious', 'ジャンク・デュエル。');
    await E.say('kanata:surprise', '……！');
    await E.say('ruu', 'アンダーシェルの違法ロボバトル。予選を突破するだけで、賞金は1万。優勝すれば、10万。');
    await E.say('ruu', 'あんたには機体がある。シミュレーター学年1位の腕もある。……出ない理由、ある？');
    await E.say('kanata', '……違法、だろ。それに、機体はボロボロだし……。');
    await E.say('doc', '……ふん。');
    await E.say('doc', 'ジンも若い頃は、あそこに出とった。');
    await E.say('kanata:surprise', '父さんが……！？');
    await E.say('doc', 'ああ。ポンコツ号は、ジンが若い頃にジャンク・デュエル用に組んだ最初のフレームじゃ。');
    await E.say('doc:smile', 'あいつは負けた日も、勝った日も、ここで夜通し機体をいじって……笑っとったよ。');
    await E.say('kanata', '……。');
    await E.say('niko', '……カナタ。');
    await E.say('niko', 'ニコも、たたかう。……ニコ、ここに、いたい。カナタと、ルウと、ばあちゃんと。');
    const k = await E.ask('kanata', '（……）', ['「やろう。ジャンク・デュエルに出る！」', '「……少しだけ、考えさせてくれ」']);
    if (k === 1) {
      await E.say('kanata', '……少しだけ、考えさせてくれ。');
      await E.wait(40);
      await E.say(null, 'カナタは、ハンガーのポンコツ号を見上げた。傷だらけの黄色い装甲。父さんの組んだ機体。');
      await E.say('kanata', '（……父さんも、ここから始めたんだ）');
      await E.say('kanata', '……いや。考えるまでもなかった。');
    }
    await E.say('kanata:serious', 'やろう。ジャンク・デュエルに出る！');
    await E.say('kanata:grin', 'ニコの身分証と、ポンコツ号の修理代。……全部まとめて、稼いでやる！');
    await E.say('ruu:grin', 'そうこなくっちゃ。');
    await E.say('niko:smile', '……うん！');
    await E.say('doc', '……ふん。血は争えんな。');
    await E.say('doc', 'ポンコツ号は、とりあえず動くようにはしといてやる。勝てるかどうかは、おまえ次第じゃ。');
    E.exp(60);
    await E.say('doc', 'アンダーシェルの入り方は……そうじゃな。ネオン通りの海賊ラジオのDJに聞け。あの娘は、下のことなら何でも知っとる。');
    await E.say('ruu', 'レディオ・スターダスト？　……チビたちが毎晩聴いてるやつだ。');
    await E.say('doc', '夜にならんと局は開かん。……今夜は、ゆっくり寝て、腹をくくっておけ。');
    await E.fadeOut(30);
    del('c2_ruu', 'c2_niko');
    E.time('night');
    await sceneRadioCh2();
  }
  async function sceneRadioCh2() {
    E.cut();
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさんたち！　DJリリィの、レディオ・スターダスト！　今夜も海賊電波で、こっそりお届け！',
      'まずはニュース。今週に入って、ミナト区で公安の聞き込みが急増中。「白い髪の女の子を探してる」んだって。',
      '公式発表は「保護対象」。……保護ねえ。リリィお姉さん、その言葉、あんまり好きじゃないな。',
      'それから、今夜もあった〈マザー〉の回転調整。リスナーから「放送のあと、耳鳴りがした」ってお便りが何通も。……気のせい、かな？',
      'さて、お待ちかね！　今週末はアンダーシェルで、ジャンク・デュエルの新シーズン開幕！',
      'ディフェンディング・ファイナリストは、ご存じ「燃える男」ギル・ブレイズ率いる〈ネオン・ジャッカルズ〉！',
      '新規クランも大募集中。……命知らずの坊やたち、いるかな？　ドアはいつでも開いてるわよ。',
      'それじゃ、今夜の一曲。……ちょっと古い歌だけど、眠れない子に。「星屑ララバイ」。',
      'レディオ・スターダスト。……あなたの夜に、星屑を。',
    ]);
    E.cut(false);
    await E.startChapter(3);
  }

  // =============================================================
  //  寄り道：ニコの「はじめて」（ミナト区・コンビニ・ひだまり園）
  // =============================================================
  const withNiko = () => C2() && G.state.party.includes('niko') && [7, 8, 14].includes(step());
  G.addToMap('minato', {
    events: [
      {
        x: 34, y: 33, w: 4, h: 1, once: 'c2_fl_canal', cond: withNiko,
        run: async () => {
          E.cut();
          E.emote('f_niko', '!');
          await E.say('niko', '……みず。きらきら、ひかってる。');
          await E.say('ruu', 'ミナト運河。コロニーの水は、ぜんぶここを通って循環してるんだって。');
          await E.say('niko', '……おさかな、いる？');
          await E.say('kanata', 'いるいる。ロボットの魚だけどな。水をきれいにする掃除用のやつ。');
          await E.say('niko', '……ロボの、おさかな。');
          await E.say('niko:sad', '……つかまって、ここに、いれられたの？');
          await E.say('ruu', '……さあね。でも、ほら。気持ちよさそうに泳いでるよ。');
          await E.say('niko:smile', '……うん。ここ、ひろい、から。');
          E.cut(false);
        },
      },
      {
        x: 56, y: 12, w: 6, h: 1, once: 'c2_fl_memorial', cond: withNiko,
        run: async () => {
          E.cut();
          await E.say('niko', '……。');
          E.emote('f_niko', '…');
          await E.say('niko', '……ここ。たくさんの、こえ。');
          await E.say('kanata', '……軌道戦争の慰霊碑だよ。10年前の戦争で、星になった人たちの。');
          await E.say('niko', '……ないて、ない。……しずかに、ねむってる。');
          await E.say('niko', 'でも……ひとつだけ、まだ、おきてる、こえ。……「まだ、おわってない」って。');
          await E.say('ruu', '……ニコ？');
          await E.say('niko:smile', '……なんでも、ない。おはな、きれい。');
          E.cut(false);
        },
      },
      {
        x: 63, y: 14, w: 3, h: 1, once: 'c2_fl_taiyaki', cond: withNiko,
        run: async () => {
          E.cut();
          E.emote('f_niko', '!');
          await E.say('niko', '……おさかなの、おかし？');
          const k = await E.ask('kanata', '（ニコが、たい焼き屋台をじっと見ている）', ['たい焼きを買ってあげる（¢30）', '晩ごはん前だから、ガマン']);
          if (k === 0 && G.state.money >= 30) {
            E.money(-30);
            await E.say('niko:smile', '……あたまから、たべる。');
            await E.say('niko', '…………しっぽ、あんこ、ない。');
            await E.say('ruu:grin', 'それ、しっぽまであんこ入ってるかどうかで、店の良し悪しがわかるらしいよ。');
            await E.say('niko:smile', '……じゃあ、つぎは、しっぽから、たべる。');
          } else {
            await E.say('niko:sad', '……がまん。');
            await E.say('ruu', 'えらいえらい。ばあちゃんのラーメンが待ってるよ。');
          }
          E.cut(false);
        },
      },
    ],
  });
  G.addToMap('konbini', {
    onEnter: async () => {
      if (!withNiko() || E.flag('c2_fl_konbini')) return;
      E.set('c2_fl_konbini');
      E.cut();
      E.emote('f_niko', '!');
      await E.say('niko:surprise', '……ドア、かってに、あいた……！');
      await E.say('niko', '……あれ。ひかる、あめ。いっぱい。');
      await E.say('ruu', 'ネオンキャンディ。なめると舌が光るやつ。……ほしいの？');
      const k = await E.ask('kanata', '（ニコの目が、キャンディの棚に釘づけだ）', ['1本買ってあげる（¢20）', '……虫歯になるぞ']);
      if (k === 0 && G.state.money >= 20) {
        E.money(-20);
        await E.say('niko:smile', '……！　……したが、ぴかぴか。');
        await E.say('ruu:grin', 'あははっ、ほんとに光ってる！');
        await E.say('w_clerk', '（店員さんが笑いをこらえている……）');
      } else {
        await E.say('niko:sad', '……むしば。こわい。');
        await E.say('kanata', '……今度、ご褒美に買ってやるよ。');
      }
      E.cut(false);
    },
  });
  // 4日目：ひだまり園でチビたちとニコ
  G.addToMap('c2_hidamari', {
    onEnter: async () => {
      if (!(at(14) && G.state.party.includes('ruu') && !E.flag('c2_visit_home'))) return;
      E.set('c2_visit_home');
      E.cut();
      E.party([]);
      put('c2_ruu', 'ruu', 11, 11, 'up');
      put('c2_niko', 'niko', 9, 11, 'up');
      E.teleport('player', 10, 12, 'up');
      E.bgm('home');
      await E.say('c2_haru', 'あーっ！　ルウねえちゃん！　……と、だれ！？');
      await E.say('c2_shota', '男だ！　ルウ姉が男つれてきた！　カレシだ！');
      await E.say('ruu:angry', 'ちがう！！　ただのクラスメイト！');
      await E.say('kanata:grin', 'ど、どうも。カナタです。ただのクラスメイトです……。');
      await E.say('c2_shota', 'ほんとにー？　……あれ、にいちゃんの腰のスパナ、カッコいい！　機械いじりすんの！？');
      await E.say('kanata:grin', 'お、わかる？　これは父さんの形見でさ──');
      await E.say('ruu', '話が長くなるからやめて。……それより、みんな。この子が、ニコ。');
      await E.say('niko', '……ニコ、です。');
      await E.say('c2_haru', 'かみ、まっしろ！　ゆきみたい！　さわっていい？');
      await E.say('niko:smile', '……いい、よ。');
      await E.wait(20);
      put('c2_mio2', 'c2_mio', 5, 11, 'right');
      E.remove('c2_mio_n');
      await E.say(null, '部屋のすみで、ミオがこっちをじっと見ている。');
      await E.move('c2_niko', [[6, 11]], { speed: 0.6 });
      E.face('c2_niko', 'left');
      await E.say('niko', '……となり、いい？');
      await E.say('c2_mio', '……。');
      await E.say('niko', '……ニコも、あたらしい、こ。……まだ、しらないこと、いっぱい。');
      await E.say('c2_mio', '……おねえちゃんも、ひとり？');
      await E.say('niko', '……ううん。');
      await E.say('niko:smile', 'いまは、ひとりじゃ、ない。……ミオも。');
      await E.wait(30);
      E.emote('c2_mio2', '♪');
      await E.say('c2_mio:smile', '……うん。');
      await E.say('ruu:surprise', '（……ミオが、笑った）');
      await E.say('c2_encho:smile', '……春瀬さん、でしたね。ルウがいつもお世話になってます。');
      await E.say('c2_encho', 'あの子がお友だちを連れてくるなんて、初めてなのよ。……これからも、仲良くしてあげてね。');
      await E.say('kanata', 'あ、はい！　……オレのほうこそ、いつも助けられてます。');
      await E.say('ruu:shy', '……っ、もう帰るよ！　ほら、ドクのとこ行くんでしょ！');
      await E.say('c2_encho:smile', 'はいはい。これ、おやつのおにぎり。みんなで食べて。');
      await E.give('onigiri', 3);
      await E.say('c2_haru', 'ニコおねえちゃん、またきてね！');
      await E.say('niko:smile', '……うん。また、くる。');
      del('c2_ruu', 'c2_niko', 'c2_mio2');
      E.party(['ruu', 'niko']);
      E.reload();
      E.cut(false);
    },
  });

  // デバッグ・テスト用
  G.C2 = { sceneNikoCollapse, sceneHomeGreet, sceneYuiHall, sceneNightTalk, sceneMorning, scenePatrol, sceneGate, sceneClassroom, sceneRooftop, scenePE, sceneBath, sceneEveningRuuLeaves, sceneRoof, sceneDay3Morning, sceneAfterSchoolDay3, sceneKyosuke, sceneShopEisen, sceneMoneyProblem, setStep };
})();
