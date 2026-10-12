// =============================================================
//  story/ch3.js — 第3章「ネオン・アリーナ」
//   進行は E.val('c3_step')
//    0 星屑亭・出発  1 ネオン通り→ラジオ局（リリィ）  2 ゲーセン（シミュレーター）
//    3 スクラップ・ベイ（ポンタと合流）  4 アンダーシェル（登録・ギル）  5 予選（大扉）
//    6 翌朝ドクのガレージ（ハルカゼ改造・試運転）  7 夜のロビー（ローズハウンド・シグ加入）
//    8 星屑亭（シグとラーメン）  9 本戦の夜・ロビー  10 本戦1回戦  11 準決勝  12 決勝
//   13 祝勝会（星屑亭）→ アイゼン → ラジオ → 第4章
//   後の章向けフラグ：c3_registered c3_rose c3_sig_joined c3_won c3_clan_name
// =============================================================
(function () {
  const C3 = () => G.state.chapter === 3;
  const step = () => E.val('c3_step');
  const at = (n) => C3() && step() === n;
  const setStep = (n) => E.set('c3_step', n);
  const put = (id, char, x, y, dir, extra) => E.npc(Object.assign({ id, char, x, y, dir: dir || 'down', move: 'still' }, extra || {}));
  const del = (...ids) => ids.forEach((id) => E.remove(id));
  async function goOut(id, path) {
    await E.move(id, path);
    E.remove(id);
  }
  const ROSE = (x, y) => ({ mech: 'rose', id: 'ally_rose', x, y, col: '#ff79c6', dmg: 12, name: 'ローズハウンド' });
  const ZEPH = (x, y) => ({ mech: 'zephyr', id: 'ally_zephyr', x, y, col: '#7dff9a', dmg: 14, name: 'ゼフィール' });
  const MC = { name: '実況・DJリリィ' };

  G.addItem('c3_card', { name: 'ゴトウの推薦状', desc: 'ゲーセン〈ギャラクシー〉店長の推薦状。「この坊主たち、筋がいい」と殴り書きしてある。' });
  G.mob('c3_goto', 'ゲーセン店長ゴトウ', 225, { girl: false, old: true, over: { outfit: 'suit', top: '#2a2a3a', top2: '#ff5fa2', tie: '#ff5fa2', acc: ['sunglasses'], accCol: '#141418', style: 'slick' } });
  G.mob('c3_jk1', 'ジャッカルズのモヒ', 207, { girl: false, old: false, kid: false, over: { outfit: 'jacket', top: '#c02030', top2: '#1a1a1a', style: 'spiky', hair: '#ffd25e', acc: ['sunglasses'], accCol: '#141418' } });
  G.mob('c3_jk2', 'ジャッカルズのチビ', 208, { girl: true, old: false, kid: false, over: { outfit: 'jacket', top: '#c02030', top2: '#1a1a1a', style: 'pixie', hair: '#ff5fa2', build: 'small' } });
  G.mob('c3_aide', '特務隊の副官', 7301, { girl: false, over: { top: '#2a2e44', top2: '#c0c8d8', outfit: 'military', acc: ['cap'], accCol: '#2a2e44', build: 'tall' } });

  // ---------- 寄り道ブロック ----------
  const BACK = {
    green: ['minato', 2, 23, 'right'],
    school_yard: ['minato', 35, 2, 'down'],
    scrapbay: ['shell_lobby', 5, 4, 'down'],
    shell_lobby: ['scrapbay', 53, 15, 'down'],
    minato: ['hoshikuzu', 7, 10, 'up'],
  };
  const BLOCK = (mapId) => {
    const s = step();
    if (mapId === 'shell_lobby' && s < 4) return ['ruu', '待って。まずはリリィに話を聞かないと。受付のしかたも、わかんないっしょ。'];
    if (mapId === 'scrapbay' && s >= 9 && s <= 12 && G.state.party.length === 0) return ['ponta', 'カナタ！　試合中に外に出ちゃダメっす！　失格になるっすよ！'];
    if ((mapId === 'green' || mapId === 'school_yard') && s >= 1 && s <= 12) return ['ruu', 'そっちじゃないって。今夜の目的、忘れたの？'];
    if (mapId === 'minato' && s === 13) return ['ponta', 'カナタ〜！　主役がどこ行くっすか！　まだ乾杯してないっすよ！'];
    return null;
  };
  Object.keys(BACK).forEach((mapId) =>
    G.addToMap(mapId, {
      onEnter: async () => {
        if (!C3()) return;
        const b = BLOCK(mapId);
        if (!b) return;
        E.cut();
        await E.say(b[0], b[1]);
        const [m, x, y, d] = BACK[mapId];
        await E.warp(m, x, y, d, { noEnter: true });
        E.cut(false);
      },
    })
  );

  // ---------- ドクのガレージ：ハンガー2のローズハウンド（第3章以降） ----------
  G.addToMap('doc_garage', {
    npcs: [
      {
        id: 'c3_rose_hangar', char: 'sys', mech: 'rose', x: 8, y: 7, dir: 'down', move: 'still', noFace: true,
        show: () => E.flag('c3_rose') && !E.flag('w2_hangar_empty') && !E.flag('c3_rose_away'),
        talk: async () => {
          await E.say(null, 'ローズハウンドがハンガーに固定されている。肩に、ルウが描いたピンクのバラのマーク。');
          if (G.state.chapter <= 4) await E.say(null, 'コクピットには、ひだまり園の子どもたちの写真がテープで貼ってある。');
        },
      },
    ],
    onEnter: async () => {
      if (at(6)) await sceneRebuild();
    },
  });

  // =============================================================
  //  章の頭：星屑亭から出発
  // =============================================================
  G.STORY.chapters[3] = async function () {
    E.time('night');
    G.state.mech.id = 'ponkotsu';
    E.party([]);
    setStep(0);
    if (G.field.player && G.field.player.charId !== 'kanata') E.setChar('kanata');
    await E.chapter(3);
    await E.warp('hoshikuzu', 7, 9, 'up', { noEnter: true });
    E.hide('player', false);
    await sceneDepart();
  };

  async function sceneDepart() {
    E.cut();
    E.bgm('home');
    E.remove('w_taxi');
    put('c3_ruu', 'ruu', 8, 8, 'up');
    put('c3_niko', 'niko', 6, 8, 'up');
    put('c3_ponta', 'ponta', 9, 9, 'up');
    await E.say(null, '──週末の夜。星屑亭の閉店後。');
    await E.say('ponta', 'ポンコツ号は、ドクのじいちゃんと一緒にトラックに積んであるっす！　オイラは先にスクラップ・ベイで待ってるっす！');
    await E.say('ruu', 'オッケー。あたしたちは、まずネオン通りのラジオ局。DJリリィに、アンダーシェルの入り方を聞く。');
    await E.say('niko', '……ねおん、どおり。ひかる、まち？');
    await E.say('ruu:grin', 'そ。夜でもギラッギラに明るい街。ニコ、迷子になんないでよ。');
    await goOut('c3_ponta', [[9, 10], [8, 10], [8, 11]]);
    await E.say('tome', '……夜遊びかい。');
    E.face('player', 'up');
    await E.say('kanata:surprise', 'ぎくっ。');
    await E.say('tome', '……どこへ行って何をするかは聞かないよ。');
    await E.say('tome:serious', 'ただし、ケガだけはするんじゃないよ。三人とも、ちゃんと帰ってきな。……ラーメン、作って待ってるからね。');
    await E.say('ruu:shy', '……うん。');
    await E.say('niko:smile', 'らーめん、まってる。');
    if (!E.has('charm') && G.state.equip.acc !== 'charm') {
      await E.say('tome', 'カナタ。これ、持っていきな。昔、ばあちゃんが使ってたお守りさ。');
      await E.say('tome', '……機体に乗る時もね、これがあると不思議と弾が当たらないんだ。');
      await E.give('charm', 1, { wait: true });
      await E.say('kanata:think', '（機体に乗る時……？　ばあちゃん、なんでそんなこと……）');
    }
    del('c3_ruu', 'c3_niko');
    E.party(['ruu', 'niko']);
    setStep(1);
    E.cut(false);
    E.objective('ネオン通りのラジオ塔〈レディオ・スターダスト〉へ（ミナト区の東）');
  }

  // ---------- ネオン通り ----------
  G.addToMap('neon', {
    onEnter: async () => {
      if (at(1) && !E.flag('c3_neon_cg')) {
        E.set('c3_neon_cg');
        E.cut();
        await E.cg('neon', 'ネオン通り──クレイドル7でいちばん眠らない街。');
        await E.say('niko:surprise', '……！　ぴかぴか……！　ぜんぶ、ひかってる……！');
        await E.say('ruu:grin', 'でしょ。屋台も、ゲーセンも、怪しいお店も、なんでもある。');
        await E.say('kanata', 'ラジオ塔は、通りの東の端だったよな。');
        await E.say('ruu', 'うん。……ニコ、屋台のにおいにつられてフラフラしないでよ。');
        await E.say('niko', '……たこやき……。');
        await E.say('ruu', '言ったそばから！');
        E.cgOff();
        E.cut(false);
      }
    },
    npcs: [
      {
        id: 'c3_jk_street', char: 'c3_jk1', x: 40, y: 13, dir: 'down', move: 'still', show: () => C3() && step() >= 2 && step() <= 4,
        talk: async () => {
          await E.say('c3_jk1', 'あぁん？　ゲーセンで店長の記録を抜いたガキってのは、テメェらか。');
          await E.say('c3_jk1', 'アンダーシェルに来る気なら覚悟しな。下じゃ、ギルさんが王様だ。……イッツ・ショータイム、ってな！');
        },
      },
    ],
  });

  // ---------- ネオン通りの寄り道（ニコと） ----------
  const nikoNeon = () => C3() && step() >= 1 && step() <= 9 && G.state.party.includes('niko');
  G.addToMap('neon', {
    events: [
      {
        x: 16, y: 14, w: 3, h: 1, once: 'c3_fl_candy', cond: nikoNeon,
        run: async () => {
          E.cut();
          E.emote('f_niko', '!');
          await E.say('niko', '……ひかる、あめ……！　ここにも、ある……！');
          await E.say('w2_candy', 'あっ、白い髪の子！　この前もいっぱい買ってくれたよね☆');
          await E.say('ruu', '……ニコ、いつの間に。');
          const k = await E.ask('kanata', '（ニコがこっちを見上げている……）', ['ネオンキャンディを3本買う（¢60）', '今日はがまん']);
          if (k === 0 && G.state.money >= 60) {
            E.money(-60);
            await E.give('candy', 2);
            await E.say('niko:smile', '……1ぽんは、いま。2ほんは、カナタに、あげる。たたかう、とき、なめて。');
            await E.say('kanata:grin', '……ありがとな。');
          } else {
            await E.say('niko:sad', '……がまん。……つぎは、かう。');
          }
          E.cut(false);
        },
      },
      {
        x: 34, y: 11, w: 2, h: 1, once: 'c3_fl_uranai', cond: nikoNeon,
        run: async () => {
          E.cut();
          await E.say('w2_uranai', 'ピピピ……ヨウコソ、迷エル子羊……。');
          await E.say('w2_uranai', 'ピ……？　……ソコノ、白イ髪ノ、アナタ。');
          await E.say('w2_uranai', '……アナタノ 運勢……検索中……検索中……。');
          E.se('alarm');
          E.shake(2, 20);
          await E.say('w2_uranai', '……エラー。……S.C.0091。……S.C.0091。……空ガ……オチ……。');
          await E.say('niko:sad', '……！');
          await E.say('ruu:angry', 'ちょっと、なにこのポンコツ！　縁起でもない！');
          await E.say('w2_uranai', '……ピピ。失礼シマシタ。再起動シマス。……今日ノ 運勢ハ 大吉。ラッキーアイテムハ、ラーメン。');
          await E.say('niko', '……らーめん。……だいきち。');
          await E.say('kanata:think', '（S.C.0091……？　今は0085年だろ。……壊れてるのかな）');
          E.cut(false);
        },
      },
    ],
  });

  // ---------- レディオ・スターダスト：リリィ ----------
  G.addToMap('radio_booth', {
    onEnter: async () => {
      if (at(1)) await sceneLily();
    },
  });
  async function sceneLily() {
    setStep(2);
    E.cut();
    E.party([]);
    put('c3_ruu', 'ruu', 10, 9, 'up');
    put('c3_niko', 'niko', 8, 9, 'up');
    E.teleport('player', 9, 8, 'up');
    await E.wait(10);
    await E.say('lily', '──ってわけで、次のリクエストは……あら？');
    E.emote('w2_lily', '!');
    await E.say('lily', 'お客さん？　……ここ、一応「秘密の」放送局なんだけどな。');
    await E.say('kanata', 'あの、DJリリィさん……ですよね？　ジャンク・デュエルのことを聞きたくて。');
    await E.say('lily:smile', 'あら、あなたたちが「命知らずの坊やたち」？　ふふ、ラジオを聴いてくれてたのね。');
    await E.move('w2_lily', [[10, 6]]);
    E.face('w2_lily', 'down');
    await E.say('lily', '……。');
    E.emote('w2_lily', '…');
    await E.wait(30);
    await E.say('lily:surprise', '…………ルウ……？');
    await E.say('ruu:surprise', '……え？　なんで、あたしの名前……。');
    await E.say('lily', 'あ……っ、ご、ごめんね！　ほら、リスナーのハガキで！　「ひだまり園」の子たちが、よく書いてくれるのよ。ピンクのメッシュのお姉ちゃんの話。');
    await E.say('ruu:think', '……ふーん。');
    await E.say('ruu', '（……この声。屋根の上で聴いた、あの声だ）');
    await E.say('lily', 'こほん。……で、ジャンク・デュエルね。');
    await E.say('lily', '入り口はスクラップ・ベイの「LIFT B7」。貨物用エレベーターで、地下のアンダーシェルまで一直線。');
    await E.say('lily', 'ただし、新人がいきなり本戦に出るには「推薦」がいるの。誰でも出られたら、死人が出ちゃうからね。');
    await E.say('lily', '推薦状を書いてくれるのは、ネオン通りのゲーセン〈ギャラクシー〉の店長ゴトウ。あの人、アンダーシェルのスカウトもやってるのよ。');
    await E.say('lily:smile', '店のAFシミュレーターで、店長が認める成績を出せば……ね？');
    await E.say('kanata:grin', 'シミュレーターなら、まかせてくれ！');
    await E.say('ruu', 'こいつ、学年1位だから。……あたしは2位。');
    await E.say('lily:smile', 'あら、頼もしい。');
    await E.say('niko', '……リリィ。');
    await E.say('niko', 'リリィの、こえ……ニコ、しってる、きがする。');
    await E.say('lily', '……！');
    await E.say('lily', '……そう。きっと、ラジオで聴いてくれたのね。');
    await E.say('lily:serious', '……ねえ、あなたたち。アンダーシェルは、ただの遊び場じゃない。……いろんな「目」が、見てる場所よ。');
    await E.say('lily', '白い髪の子は、なるべくフードをかぶっておきなさい。……いい？');
    await E.say('ruu', '……あんた、何者？');
    await E.say('lily:smile', 'ただのDJよ。夜ふかしな子たちの、味方。……がんばってね、「スターダスト」さんたち。');
    await E.say('kanata:think', '……スターダスト？');
    await E.say('lily:smile', 'あら、クラン名、まだ決めてないの？　……ふふ、なんでもない。');
    await goOut('c3_niko', [[8, 10], [9, 10]]);
    del('c3_ruu');
    E.party(['ruu', 'niko']);
    E.reload();
    E.cut(false);
    E.objective('ゲーセン〈ギャラクシー〉の店長に会う（ネオン通りの西側）');
  }

  // ---------- ゲーセン：シミュレーター ----------
  G.addToMap('arcade', {
    onEnter: async () => {
      if (at(2)) await sceneArcade();
    },
  });
  async function sceneArcade() {
    E.cut();
    E.party([]);
    E.remove('w2_manager');
    put('c3_ruu', 'ruu', 15, 14, 'up');
    put('c3_niko', 'niko', 13, 14, 'up');
    put('c3_goto', 'c3_goto', 15, 10, 'down');
    E.teleport('player', 14, 13, 'up');
    await E.say('c3_goto', '……いらっしゃい。ガキが来る時間じゃねえぞ。');
    await E.say('kanata', 'DJリリィに聞いてきました。アンダーシェルの推薦状を書いてほしいんです。');
    await E.say('c3_goto', '……リリィの紹介か。');
    await E.say('c3_goto', '毎晩、何十人もそう言って来る。で、毎晩、何十人も泣いて帰る。');
    await E.say('c3_goto', 'うちのシミュレーターの「デュエル・モード」で、仮想の機体を全部ぶっ倒してみな。');
    await E.say('c3_goto', '……俺の記録を抜いたら、推薦状を書いてやる。');
    await E.say('w2_king', 'おいおい店長、そいつはムリだって！　あのモード、上級者向けの鬼設定だぜ！');
    await E.say('kanata:grin', '……燃えてきた。');
    await E.move('c3_goto', 'R');
    await E.move('player', [[14, 10], [15, 10]]);
    E.face('player', 'up');
    await E.say(null, 'カナタはシミュレーターのシートに座った。ヘッドセットをかぶると、視界がネオンの格子に包まれる──');
    E.cut(false);
    for (;;) {
      const won = await E.battle({
        map: 'c3_sim', mech: true, mechId: 'ponkotsu', x: 14, y: 16, dir: 'up', bgm: 'mech', title: 'SIMULATION', sub: '仮想ジャンク・デュエル：全機撃破せよ', canLose: true,
        waves: [
          [{ type: 'junker', x: 10, y: 5, lv: 2, name: '仮想ジャンカーA' }, { type: 'junker', x: 19, y: 5, lv: 2, name: '仮想ジャンカーB' }],
          [{ type: 'clanB', x: 14, y: 4, lv: 3, name: '仮想ホーネット' }, { type: 'junker', x: 6, y: 6, lv: 2, name: '仮想ジャンカーC' }],
        ],
        onStart: async () => {
          await E.say('c3_goto', '（ヘッドセット越しに）Zでビーム、Cで近接、Xでブースト。……せいぜい長生きしな。');
        },
      });
      if (won) break;
      E.cut();
      await E.say('c3_goto', '……そんなもんか。もう一度やるか？');
      const k = await E.ask('kanata', '（くっ……！）', ['もう一回！', '少し休む（あとで店長に話しかける）'], { cancel: 1 });
      E.cut(false);
      if (k !== 0) {
        del('c3_ruu', 'c3_niko', 'c3_goto');
        E.party(['ruu', 'niko']);
        E.reload();
        E.objective('ゲーセンの店長に話しかけて、シミュレーターに再挑戦');
        return;
      }
    }
    E.cut();
    E.set('c3_sim_won');
    await E.say(null, 'ピロリロリン！　──画面に「NEW RECORD」の文字が躍った。');
    await E.say('w2_king:surprise', 'う、うそだろ……店長の記録を、ポンコツ機で……！？');
    await E.say('c3_goto', '…………。');
    await E.say('c3_goto', '……ククッ。おもしれえ。');
    await E.say('ruu', 'あたしもやる。……どいて、カナタ。');
    await E.fadeOut(16);
    await E.say(null, '──数分後。');
    await E.fadeIn(16);
    await E.say('c3_goto', '……2位の記録まで塗り替えやがった。なんなんだ、今年の中坊は。');
    await E.say('ruu:grin', '格闘戦なら、あたしのほうが上だから。');
    await E.say('niko', '……ニコも、やる？');
    await E.say('c3_goto', '……いや、もう十分だ。俺の心が持たねえ。');
    await E.say('c3_goto', '持っていけ。推薦状だ。');
    await E.give('c3_card', 1, { wait: true });
    await E.say('c3_goto', '……おまえの動き。昔、ここで見たことがある。');
    await E.say('c3_goto', '右に旋回する前に、半歩だけ左に振る。……20年前、ジャンク・デュエルを荒らし回った若造のクセだ。');
    await E.say('kanata:surprise', '……！　それって……。');
    await E.say('c3_goto', '……行け。下で、思い知ってこい。');
    E.exp(30);
    del('c3_ruu', 'c3_niko', 'c3_goto');
    E.party(['ruu', 'niko']);
    E.reload();
    setStep(3);
    E.cut(false);
    E.objective('スクラップ・ベイの LIFT B7 へ（ポンタと合流）');
  }
  G.addToMap('arcade', {
    npcs: [
      {
        id: 'c3_goto_retry', char: 'c3_goto', x: 16, y: 10, dir: 'down', move: 'still', show: () => at(2) && !E.flag('c3_sim_won'),
        talk: async () => {
          await E.say('c3_goto', '……もう一度、やるか？');
          await sceneArcade();
        },
      },
    ],
  });

  // ---------- スクラップ・ベイ：ポンタと合流 ----------
  G.addToMap('scrapbay', {
    onEnter: async () => {
      if (at(3)) await scenePontaLift();
    },
  });
  async function scenePontaLift() {
    setStep(4);
    E.cut();
    E.time('night');
    put('c3_ponta', 'ponta', 48, 15, 'right');
    put('c3_pon_mech', 'sys', 46, 17, 'down', { mech: 'ponkotsu' });
    await E.wait(10);
    await E.camera(48, 15);
    await E.say('ponta', 'カナタ〜！　こっちっす！　ポンコツ号、貨物エレベーターに積む準備バッチリっす！');
    await E.cameraReset();
    await E.say('kanata', 'ポンタ！　推薦状、もらってきたぞ！');
    await E.say('ponta', 'ぶっひゃー！　さすがカナタっす！');
    await E.say('ponta', 'ドクのじいちゃんが言ってたっす。「動くようにはした。戦えるかは知らん」って。');
    await E.say('ponta', 'ジェネレーター出力は通常の72%、右腕の反応は0.3秒遅れ……でも、オイラが整備したっす！　気合いでなんとかするっす！');
    await E.say('kanata:grin', 'なんとかなるって。');
    await E.say('ruu', '……なんか、二人とも楽しそうじゃない？');
    await E.say('ponta:grin', 'そりゃあ楽しいっす！　本物のアリーナっすよ！？');
    del('c3_pon_mech');
    await goOut('c3_ponta', [[53, 15], [53, 13]]);
    E.cut(false);
    E.objective('LIFT B7 からアンダーシェルへ下りる');
  }

  // ---------- アンダーシェル・ロビー ----------
  G.addToMap('shell_lobby', {
    onEnter: async () => {
      if (at(4)) await sceneRegister();
      else if (at(7)) await sceneRoseAndSig();
      else if (at(9)) await sceneTournamentNight();
    },
    events: [
      {
        x: 15, y: 3, w: 6, h: 1,
        cond: () => C3() && [5, 10, 11, 12].includes(step()),
        run: async () => await gateEvent(),
      },
    ],
    npcs: [
      {
        id: 'c3_ponta_l', char: 'ponta', x: 13, y: 5, dir: 'down', move: 'still', show: () => C3() && step() >= 5 && step() <= 12 && step() !== 6,
        talk: async () => await pontaTalk(),
      },
      {
        id: 'c3_ruu_l', char: 'ruu', x: 11, y: 8, dir: 'right', move: 'still', show: () => C3() && step() >= 10 && step() <= 12,
        talk: async () => {
          if (step() === 10) {
            await E.say('ruu', '……ローズハウンド、手になじむ。初めて乗った気がしない。');
            await E.say('ruu:grin', 'カナタ、本戦では、あたしが前に出る。あんたは後ろからビームでも撃ってな。');
          } else if (step() === 11) {
            await E.say('ruu', 'ねえ、カナタ。……あたし、施設育ちでしょ。いつか誰かに置いてかれるって、ずっと思ってた。');
            await E.say('ruu:shy', 'でも、今は……背中を預けられる。……変な感じ。');
            await E.say('ruu:angry', 'い、今の、忘れて！');
          } else {
            await E.say('ruu:serious', 'ギルのやつ、絶対あたしたちを舐めてる。……決勝で、黙らせてやろう。');
          }
        },
      },
      {
        id: 'c3_niko_l', char: 'niko', x: 10, y: 9, dir: 'right', move: 'still', show: () => C3() && step() >= 10 && step() <= 12,
        talk: async () => {
          if (step() === 10) {
            await E.say('niko', '……かんきゃく、いっぱい。おと、いっぱい。');
            await E.say('niko:smile', 'みんなの、どきどき、きこえる。……たのしい、おと。');
          } else if (step() === 11) {
            await E.say('niko', '……。');
            await E.say('niko:sad', '……つめたい、おと。……だれかが、ずっと、みてる。');
            await E.say('kanata', 'え……？　どこから？');
            await E.say('niko', '……わからない。でも、しろいへやの、ひとたちと、すこし、にてる。');
            await E.say('kanata:think', '（……公安？　まさか、こんなところに……）');
          } else {
            await E.say('niko:smile', '……カナタ、がんばって。ニコ、ここで、うたって、まってる。');
          }
        },
      },
      {
        id: 'c3_sig_l', char: 'sig', x: 22, y: 7, dir: 'left', move: 'still', show: () => C3() && step() >= 10 && step() <= 12,
        talk: async () => {
          if (step() === 10) {
            await E.say('sig', '……。');
            await E.say('sig', '……ラーメン、という食べ物。また、食べたいです。');
            await E.say('kanata:grin', '優勝したら、ばあちゃんが山ほど作ってくれるって。');
            await E.say('sig', '……では、負けられませんね。');
          } else if (step() === 11) {
            await E.say('sig', '準決勝の相手は、ジャッカルズの別働隊。……速さで攪乱してきます。');
            await E.say('sig', '僕が上を抑えます。あなたは、目の前の一機だけを見てください。');
            await E.say('kanata', '……シグ。おまえ、なんでそんなに戦い慣れてるんだ？');
            await E.say('sig', '……慣れたくて、慣れたわけでは、ありません。');
          } else {
            await E.say('sig', '……ギル・ブレイズ。彼は、強い。でも、まっすぐな人です。');
            await E.say('sig', 'まっすぐな人には、まっすぐ応えればいい。……あなたなら、できます。');
          }
        },
      },
      {
        id: 'c3_kyo_l', char: 'kyosuke', x: 30, y: 13, dir: 'left', move: 'still', show: () => C3() && step() >= 10 && step() <= 12,
        talk: async () => {
          if (!E.flag('c3_kyo_gift')) {
            E.set('c3_kyo_gift');
            await E.say('kyosuke', '……よう、春瀬。本戦まで上がってくるとはな。');
            await E.say('kyosuke', '言ったろ。借りは返す。……ほらよ。去年のオレの残りもんだ。');
            await E.give('repair2', 2, { wait: true });
            await E.say('kyosuke', 'それと、ひとつ教えてやる。サラマンダーは、炎の突進の前に、ほんの一瞬だけ動きが止まる。');
            await E.say('kyosuke:serious', '止まったら、横だ。真後ろに逃げたら、焼かれるぞ。');
            return;
          }
          await E.say('kyosuke', G.pick(['……ギルとは去年、決勝でやり合った。負けたけどな。……あいつの炎は、熱いだけじゃねぇ。', '止まったら、横だ。忘れんなよ。', '……チッ。応援なんざガラじゃねぇ。さっさと行け。']));
        },
      },
    ],
  });
  async function pontaTalk() {
    const s = step();
    if (s === 5) {
      await E.say('ponta', 'ポンコツ号、いつでも出られるっす！　大扉の前に立てば、試合開始っす！');
      await E.say('ponta', '予選は2連戦っす。……右腕の反応、0.3秒遅れてるのを忘れないでほしいっす！');
      return;
    }
    if (s === 7 || s === 8) {
      await E.say('ponta', 'ハルカゼ……オイラ、一生ついていくっす……！　あの関節の駆動音、子守唄にして寝たいっす……！');
      return;
    }
    const k = await E.ask('ponta', 'カナタ！　整備はバッチリっす！　何か要るっすか？', ['修理キットをもらう', 'ハルカゼの話を聞く', 'だいじょうぶ'], { cancel: 2 });
    if (k === 0) {
      const key = 'c3_ponta_kit' + s;
      if (E.flag(key)) {
        await E.say('ponta', 'さっき渡したので最後っす……！　ジャンゴさんのお店でも売ってるっす！');
      } else {
        E.set(key);
        await E.give('repair', 2);
        await E.say('ponta:grin', '試合中にメニューから使うっす！　装甲がガッと戻るっす！');
      }
    } else if (k === 1) {
      await E.say('ponta', 'ハルカゼの最高速度はポンコツ号の1.3倍、ジェネレーター出力は約2倍っす！');
      await E.say('ponta', 'ヒートスパナ（C）は、当たれば相手の装甲をごっそり持っていくっす。ブースト（X）で懐に飛びこむのがコツっす！');
      await E.say('ponta:think', '……それにしても、ばあちゃんさんの整備の手際……あれ、正規軍の手順書そのものだったっす……。');
    } else await E.say('ponta', '了解っす！　ぶちかましてくるっす！');
  }

  // ---------- 受付：クラン登録 ＆ ギル ----------
  async function sceneRegister() {
    setStep(5);
    E.cut();
    E.party([]);
    put('c3_ruu', 'ruu', 5, 6, 'down');
    put('c3_niko', 'niko', 3, 6, 'down');
    E.teleport('player', 4, 5, 'down');
    await E.wait(10);
    await E.say(null, '──ゴウン、ゴウン……。貨物エレベーターが、地下7階で止まった。');
    E.bgm('arena');
    await E.say('niko:surprise', '……！　おと……！　おおきい、おと……！');
    await E.say(null, '扉の向こうから、地鳴りのような歓声が聞こえてくる。');
    await E.say('ruu:grin', 'ここが……アンダーシェル。');
    await E.say('kanata', '地下に、こんな場所があったなんて……。');
    put('c3_ponta', 'ponta', 13, 5, 'down');
    await E.say('ponta', 'カナタ〜！　ポンコツ号、搬入完了っす！　受付はあっちのカウンターっす！');
    await Promise.all([E.move('player', [[4, 7], [25, 7], [25, 6]]), E.move('c3_ruu', [[5, 8], [24, 8], [24, 7]]), E.move('c3_niko', [[3, 8], [26, 8], [26, 7]])]);
    E.face('player', 'up');
    E.face('c3_ruu', 'up');
    E.face('c3_niko', 'up');
    await E.say('w2_registrar', 'あら、かわいいお客さん。……迷子かしら？');
    await E.say('kanata', 'ジャンク・デュエルに出たいんです。推薦状もあります！');
    await E.say('w2_registrar', '……ゴトウのサイン。本物ね。あの人が推薦状を書くなんて、3年ぶりよ。');
    await E.say('w2_registrar', 'じゃあ、手続き。機体は？');
    await E.say('kanata', 'ポンコツ号。……作業用ワークフレームの改造機です。');
    await E.say('w2_registrar', 'パイロットは？');
    await E.say('kanata', 'オレ。春瀬カナタ。');
    await E.say('ruu', '……あたしも。水無月ルウ。……機体はまだないけど。');
    await E.say('ponta', '整備士、権田ポンタロウっす！');
    await E.say('w2_registrar', 'それと、そこの白い髪のお嬢ちゃんは……マスコット？');
    await E.say('niko', '……ニコ。おうえん、がかり。');
    await E.say('w2_registrar:smile', 'ふふ、いいわね。……最後に、クラン名を。');
    const names = ['スターダスト', 'ラーメン星屑', 'ポンコツ・ブラザーズ', 'ニコニコ団'];
    let picked = -1;
    for (let tries = 0; tries < 4 && picked !== 0; tries++) {
      const k = await E.ask('kanata', '（クラン名……どうしよう？）', names);
      picked = k;
      if (k === 1) {
        await E.say('ruu', '……店の宣伝じゃん。却下。');
        await E.say('kanata:cry', 'ばあちゃん喜ぶと思ったのに……。');
      } else if (k === 2) {
        await E.say('ruu:angry', 'あたしはブラザーじゃない！　却下！');
        await E.say('ponta', 'オイラはちょっと気に入ったっす……。');
      } else if (k === 3) {
        await E.say('niko:smile', '……ニコニコ、だん。');
        await E.say('ruu:shy', '……か、かわいいけど！　対戦相手に舐められるから、却下！');
        await E.say('niko:sad', '……むー。');
      }
      if (k !== 0 && tries >= 2) {
        await E.say('niko', '……すたーだすと。');
        await E.say('niko', 'ほしくず。……らーめんやさんと、おなじ、なまえ。ほしの、かけら。');
        picked = 0;
      }
    }
    E.set('c3_clan_name', 'スターダスト');
    await E.say('kanata:smile', '……スターダスト。オレたちは、〈スターダスト〉だ！');
    await E.say('ruu:grin', '……悪くないじゃん。星屑亭の「星屑」。');
    await E.say('niko:smile', 'ほしくず。きらきら。');
    await E.say('w2_registrar', 'クラン〈スターダスト〉。……受理したわ。');
    await E.say('w2_registrar', 'はい、デュエル参加証。なくさないでね。ランク戦も受け付けてるから、腕を磨きたくなったら声をかけて。');
    E.set('c3_registered');
    await E.give('entry', 1, { wait: true });
    await E.say('w2_registrar', '新人は予選の2連戦から。勝ち抜けば本戦トーナメントよ。……準備ができたら、アリーナの大扉の前へ。');
    // ギル登場
    E.se('boost');
    E.shake(3, 20);
    await E.say('gil', '──イッツ・ショータイム！！');
    put('c3_gil', 'gil', 18, 3, 'down');
    put('c3_jk1', 'c3_jk1', 17, 3, 'down');
    put('c3_jk2', 'c3_jk2', 19, 3, 'down');
    await E.camera(18, 6);
    await E.say('w2_fangirl', 'きゃああああ！　ギル様ーーっ！！');
    await Promise.all([E.move('c3_gil', [[18, 7], [22, 7]]), E.move('c3_jk1', [[17, 8], [21, 8]]), E.move('c3_jk2', [[19, 8], [23, 8]])]);
    await E.cameraReset();
    E.face('c3_gil', 'right');
    E.face('player', 'left');
    E.face('c3_ruu', 'left');
    await E.say('gil', 'ハッハァ！　今夜は新人の登録があるって聞いてな、どんな命知らずかと見に来てやったぜ！');
    await E.say('gil', '……って、なんだ。ガキのお遊戯会か？');
    await E.say('c3_jk1', 'ギルさん、こいつら、黄色いポンコツの作業機で出るらしいっすよ！');
    await E.say('gil:grin', 'ポンコツ！　ハッハッハ！　そいつは傑作だ！　アリーナに上がる前に、関節がバラけちまうぜ！');
    await E.say('ruu:angry', '……あんたがギル？　ずいぶん声がでかいね。中身がないと、よく響くんだって。');
    E.emote('c3_gil', '💢');
    await E.say('gil', '……ほぉ。口だけは一人前のお嬢ちゃんだ。');
    await E.say('gil', 'オレはギル・ブレイズ。〈ネオン・ジャッカルズ〉のリーダーにして、アンダーシェルで一番熱い男だ。');
    await E.say('gil:grin', 'いいか、ガキども。ここは遊び場じゃねえ。燃えるか、燃え尽きるかだ。');
    await E.say('kanata:serious', '……オレたちは、遊びに来たんじゃない。勝ちに来たんだ。');
    await E.say('gil', '…………。');
    await E.say('gil:grin', '……ハッ。いい目だ。気に入らねえが、嫌いじゃねえ。');
    await E.say('gil', '決勝で待ってるぜ、スターダスト。……たどり着けたらな！　燃えろォ！');
    await Promise.all([goOut('c3_gil', [[18, 7], [18, 2]]), goOut('c3_jk1', [[17, 8], [17, 2]]), goOut('c3_jk2', [[19, 8], [19, 2]])]);
    await E.say('ponta:cry', 'ギ、ギルっす……本物っす……サイン欲しかったっす……。');
    await E.say('ruu', 'ポンタ、どっちの味方なの。');
    del('c3_ruu', 'c3_niko', 'c3_ponta');
    E.party(['ruu', 'niko']);
    E.reload();
    E.cut(false);
    E.objective('アリーナの大扉の前に立って、予選に出場する');
  }

  // ---------- 大扉：試合の分岐 ----------
  async function gateEvent() {
    const s = step();
    const label = { 5: '予選（2連戦）', 10: '本戦1回戦', 11: '準決勝', 12: '決勝' }[s];
    const k = await E.ask(null, 'アリーナの大扉。係員が「スターダスト、出番だ」と手招きしている。【' + label + '】', ['出場する', 'まだ準備する'], { cancel: 1 });
    if (k !== 0) {
      await E.move('player', 'D');
      return;
    }
    if (s === 5) await sceneQualifiers();
    else if (s === 10) await sceneQuarter();
    else if (s === 11) await sceneSemi();
    else if (s === 12) await sceneFinal();
  }

  // ---------- 予選2連戦 ----------
  async function sceneQualifiers() {
    E.cut();
    E.bgm('arena');
    await E.cg('arena', 'ジャンク・デュエル・アリーナ。──地下に響く、何千人もの歓声。');
    await E.say('lily', 'ハロー、アンダーシェル！　今夜の実況は、特別ゲストのこのわたし、DJリリィがお届けするわよ！', MC);
    await E.say('lily', '予選第1試合！　新人クラン〈スターダスト〉、なんと機体は作業用ワークフレーム！　対するは〈ガラクタ団〉！', MC);
    E.cgOff();
    E.cut(false);
    await E.battle({
      map: 'arena', mech: true, mechId: 'ponkotsu', x: 17, y: 17, dir: 'up', bgm: 'arena', title: 'QUALIFIER 1', sub: 'VS ガラクタ団　ジャンカー2機を撃破せよ',
      enemies: [
        { type: 'junker', x: 13, y: 6, lv: 3, name: 'ジャンカー〈ドラム〉' },
        { type: 'junker', x: 21, y: 6, lv: 3, name: 'ジャンカー〈ボルト〉' },
      ],
      onStart: async () => {
        await E.say('ruu', '（観客席から）カナターー！　負けたら承知しないからね！！');
        await E.say('niko', '（観客席から）……カナタ、がんばれ……！');
      },
      returnTo: ['shell_lobby', 17, 7, 'down'],
    });
    E.cut();
    await E.say('lily', '勝者、スターダスト！　なんてこと、作業機が勝っちゃった！　会場、どよめいてるわよ！', MC);
    await E.say('ponta', 'カナタ、ナイスっす！　……でも、右腕の温度が上がってるっす。次はもっと気をつけて！');
    await E.say('lily', '休む間もなく予選第2試合！　相手は中堅クラン〈ハチの巣〉と〈スクラップ・キング〉の混成チーム！', MC);
    E.cut(false);
    await E.battle({
      map: 'arena', mech: true, mechId: 'ponkotsu', x: 17, y: 17, dir: 'up', bgm: 'arena', title: 'QUALIFIER 2', sub: 'VS 混成チーム　全機撃破せよ',
      enemies: [
        { type: 'clanB', x: 12, y: 6, lv: 4, name: 'ホーネット〈スティング〉' },
        { type: 'junker', x: 22, y: 6, lv: 4, name: 'ジャンカー〈キング〉' },
        { type: 'junker', x: 17, y: 4, lv: 3, name: 'ジャンカー〈ジャック〉' },
      ],
      onStart: async () => {
        await E.say('lily', 'ホーネットは速いわよ！　足を止めたら刺される！', MC);
      },
      returnTo: ['shell_lobby', 17, 7, 'down'],
    });
    E.cut();
    E.bgm('tension');
    await E.say('lily', '勝者……スターダスト！！　予選突破！！　新人が作業機で予選を抜けるなんて、何年ぶりかしら！', MC);
    E.se('explode');
    E.shake(5, 30);
    await E.say(null, '──その時、格納庫のほうから、ボンッ、と嫌な音がした。');
    put('c3_ponta', 'ponta', 14, 5, 'down');
    await E.say('ponta:cry', 'カ、カナタ……！　ポンコツ号が……！');
    await E.say('ponta:cry', 'ジェネレーター、焼き切れたっす……。右腕も、もう……。');
    await E.say('kanata:surprise', 'そんな……！　本戦は、3日後だろ！？');
    await E.say('ponta:cry', 'このままじゃ、本戦は無理っす……。');
    await E.say('w2_registrar', '……予選突破、おめでとう。賞金よ。');
    E.money(1200);
    await E.say('w2_registrar', '本戦は3日後の夜。……それまでに機体を用意できなければ、棄権扱いになるわ。');
    E.party([]);
    put('c3_ruu', 'ruu', 16, 8, 'up');
    put('c3_niko', 'niko', 18, 8, 'up');
    await E.say('ruu', '……カナタ。');
    await E.say('kanata', '……ドクに、相談しよう。明日の朝いちばんに。');
    await E.say('niko', '……ポンコツごう、ないてる。……でも、まだ、いきてる。');
    await E.say('kanata', '……ああ。まだ、終わってない。');
    await E.fadeOut(30);
    del('c3_ruu', 'c3_niko', 'c3_ponta');
    // 幕間ラジオ（予選の夜）
    await E.radio([
      'ハロー、夜ふかしさんたち。レディオ・スターダスト、深夜の速報よ！',
      '今夜のアンダーシェル、予選で大波乱！　作業用ワークフレームで勝ち上がった新人クラン〈スターダスト〉！',
      'ただし、機体は試合のあとに煙を噴いちゃったみたい。本戦は3日後……間に合うのかしら？',
      'リリィお姉さんは、ちょっとだけ……ううん、かなり応援してる。がんばれ、星屑たち。',
    ]);
    setStep(6);
    E.time('morning');
    E.party(['ruu', 'niko']);
    await E.warp('doc_garage', 12, 13, 'up', { noEnter: true });
    await sceneRebuild();
  }

  // ---------- ハルカゼ改造 ----------
  async function sceneRebuild() {
    setStep(6.5);
    E.cut();
    E.party([]);
    E.bgm('scrap');
    put('c3_ruu', 'ruu', 13, 12, 'up');
    put('c3_niko', 'niko', 11, 12, 'up');
    put('c3_ponta', 'ponta', 7, 10, 'up');
    E.teleport('player', 12, 11, 'up');
    await E.say(null, '──翌朝。ドクのガレージ。');
    await E.say('doc', '……ふん。予選を抜けたそうじゃな。そして、機体は丸焦げ、と。');
    await E.say('kanata', 'ドク……！　頼む、本戦までに直してくれ！　お金は、予選の賞金があるから……！');
    await E.say('doc', '……直す？');
    await E.say('doc', 'ポンコツ号は、もう限界じゃ。フレームの芯まで疲れきっとる。直しても、本戦の相手には勝てん。');
    await E.say('kanata:sad', '……そんな。');
    await E.say('doc', '──だから、「生まれ変わらせる」。');
    await E.say('kanata:surprise', '……え？');
    await E.say('doc', 'ジンが遺した設計図がある。あいつが若い頃、ポンコツ号を土台に組むはずだった、夢の機体じゃ。');
    await E.say('doc', 'じゃが、ワシ一人では手が足りん。特に関節まわりの組み付けは、昔のやり方を知っとる者でないと……。');
    E.se('door');
    put('c3_tome', 'tome', 12, 15, 'up');
    await E.say('tome', '──だから、ばあちゃんが来たのさ。');
    await E.move('c3_tome', [[12, 14], [10, 14], [10, 10]]);
    E.face('c3_tome', 'up');
    E.face('player', 'left');
    await E.say('kanata:surprise', 'ば、ばあちゃん！？　店は！？');
    await E.say('tome', '臨時休業さ。……ドク、工具を貸しな。');
    await E.say('doc:smile', '……トメさん。腕は鈍っとらんじゃろうな。');
    await E.say('tome:grin', 'ラーメンの湯切りで毎日鍛えてるよ。');
    E.cut(false);
    E.remove('w2_hangar_mech');
    put('c3_frame', 'sys', 4, 7, 'down', { mech: 'ponkotsu' });
    E.cut();
    await E.fadeOut(16);
    await E.say(null, '──そこから、まる二日。ガレージの灯りは、一度も消えなかった。');
    E.teleport('c3_tome', 5, 9, 'up');
    E.teleport('c3_ponta', 6, 9, 'up');
    E.teleport('w2_doc', 3, 9, 'up');
    E.teleport('player', 7, 10, 'up');
    await E.fadeIn(16);
    await E.say('tome', 'ドク、その肩のアクチュエータ、上下逆さだよ。ジンの組み方は、右肩が先。');
    await E.say('doc', '……むう。そうじゃった。');
    await E.say('tome', 'ジェネレーターの位相は2度ずらしな。古い機体はね、そうやってご機嫌をとってやるのさ。');
    await E.say('ponta:surprise', 'ば、ばあちゃんさん……今の、正規軍の整備手順書と、まったく同じっす……！');
    await E.say('tome', '……さあね。昔、テレビで見たのさ。');
    await E.say('kanata:think', '（……テレビで見て、あんなことできるわけない）');
    await E.say('tome', 'カナタ！　ボーッとしてないで、最後の組み付けはあんたがやりな。あんたの機体だろ。');
    E.cut(false);
    const sc = await E.timing({ title: 'ハルカゼ組み上げ', rounds: 4, speed: 1.5, zone: 0.19, labels: ['フレームを固定！', '関節アクチュエータを交換！', 'ジェネレーターを直結！', '装甲を溶接！'] });
    E.cut();
    if (sc >= 3) await E.say('doc:smile', '……ふん。いい手つきじゃ。ジンの若い頃にそっくりじゃな。');
    else await E.say('tome', 'ネジが一本余ってるよ。……まあ、いいさ。ジンもよく余らせてた。');
    E.flash(20);
    E.se('boot');
    E.remove('c3_frame');
    G.state.mech.id = 'harukaze';
    G.state.mech.hp = null;
    put('c3_haru', 'sys', 4, 7, 'down', { mech: 'harukaze' });
    E.bgm('mech');
    await E.wait(30);
    await E.say(null, '白い装甲に、青いライン。V字のアンテナが、ガレージの灯りを跳ね返す。');
    await E.say('ponta:cry', 'ぶ、ぶっひゃー……！！　かっこいいっす……！　オイラ、泣きそうっす……！');
    await E.say('ruu:surprise', '……これが、あのポンコツ……？');
    await E.say('niko:smile', '……きれい。かぜの、おと、する。');
    await E.say('doc', '名前は、もう決まっとる。');
    await E.say('doc', '──〈ハルカゼ〉。ジンが夢見とった機体じゃ。春瀬の「春」に、風。');
    await E.say('kanata', '……ハルカゼ。');
    await E.say('tome', '……ジンはね、この機体で、いつか「本物の空」を飛ぶんだって言ってたよ。');
    await E.say('tome:smile', '……あんたが乗りな、カナタ。');
    await E.say('kanata', '……うん。');
    await E.say('kanata:serious', '父さん。……借りるよ。');
    await E.say('doc', 'ほれ、試運転じゃ。廃材置き場に、ワシの練習用ジャンカーを3機出しておいた。');
    await E.say('doc', 'ハルカゼは速い。C の「ヒートスパナ」は、ポンコツ号の比じゃないぞ。……振り回されるなよ。');
    E.cut(false);
    await E.battle({
      map: 'scrap_field', mech: true, mechId: 'harukaze', x: 8, y: 13, dir: 'right', bgm: 'mech', title: 'TEST DRIVE', sub: 'ハルカゼの性能を確かめろ！',
      enemies: [
        { type: 'junker', x: 28, y: 9, lv: 4, name: '練習用ジャンカー1号' },
        { type: 'junker', x: 31, y: 14, lv: 4, name: '練習用ジャンカー2号' },
        { type: 'junker', x: 28, y: 18, lv: 4, name: '練習用ジャンカー3号' },
      ],
      onStart: async () => {
        await E.say('kanata:surprise', '（……軽い！　思った通りに、体ごと動く……！）');
      },
    });
    E.cut();
    put('c3_ruu', 'ruu', 13, 12, 'up');
    put('c3_niko', 'niko', 11, 12, 'up');
    put('c3_ponta', 'ponta', 7, 10, 'up');
    put('c3_tome', 'tome', 10, 10, 'right');
    E.teleport('player', 12, 11, 'up');
    await E.say('ponta', '速いっす！　ポンコツ号の時とは、まるで別物っす！');
    await E.say('doc', '……ふん。合格じゃ。');
    await E.say('ruu', '……。');
    await E.say('ruu', '……ねえ、ドク。');
    await E.say('ruu:serious', 'あたしも、機体に乗りたい。……観客席から叫んでるだけなんて、もうイヤ。');
    await E.say('doc', '……ほう。');
    await E.say('doc', 'アンダーシェルの闇パーツ屋、ジャンゴのところに、ピンクの格闘機が転がっとると聞いた。持ち主が夜逃げして、置いていったそうじゃ。');
    await E.say('doc', 'じゃが、反応がピーキーすぎて、誰も乗りこなせんらしい。……じゃじゃ馬じゃよ。');
    await E.say('ruu:grin', 'じゃじゃ馬なら、あたしにぴったりじゃん。');
    await E.say('tome', '……ふふ。じゃあ、ばあちゃんは店に戻るよ。今夜のぶんの仕込みがあるからね。');
    await E.say('tome', '……カナタ。ハルカゼのこと、大事にしな。あの子は、ジンの……いや、ばあちゃんたちの夢なんだ。');
    await goOut('c3_tome', [[10, 14], [12, 14], [12, 15]]);
    await E.fadeOut(20);
    del('c3_ruu', 'c3_niko', 'c3_ponta');
    E.time('night');
    E.party(['ruu', 'niko']);
    setStep(7);
    await E.say(null, '──その夜。');
    await E.fadeIn(20);
    E.cut(false);
    E.objective('アンダーシェルの闇パーツ屋ジャンゴを訪ねる（スクラップ・ベイの LIFT B7）');
  }

  // ---------- ローズハウンド ＆ シグ加入 ----------
  async function sceneRoseAndSig() {
    setStep(7.5);
    E.cut();
    E.party([]);
    put('c3_ruu', 'ruu', 5, 6, 'left');
    put('c3_niko', 'niko', 3, 6, 'right');
    E.teleport('player', 4, 5, 'down');
    await E.move('player', [[6, 5], [6, 11], [3, 11]]);
    E.face('player', 'up');
    E.teleport('c3_ruu', 4, 11, 'up');
    E.teleport('c3_niko', 2, 12, 'up');
    await E.say('w2_django', '……よう、スターダストの新顔。作業機で予選を抜けたって？　ハハッ、こっちまで噂が届いてるぜ。');
    await E.say('ruu', 'ピンクの格闘機があるって聞いた。……見せて。');
    await E.say('w2_django', '……ローズハウンドか。こっちだ。');
    put('c3_rose', 'sys', 3, 16, 'down', { mech: 'rose' });
    await E.move('player', [[3, 14]]);
    await E.move('c3_ruu', [[4, 14]]);
    E.face('player', 'down');
    E.face('c3_ruu', 'down');
    await E.camera(3, 15);
    await E.say(null, 'ほこりをかぶった、ピンクの機体。猫のような耳型のセンサー。細い手足に、太い拳。');
    await E.say('w2_django', '持ち主が借金残して夜逃げしてな。置いていきやがった。');
    await E.say('w2_django', '格闘戦用のじゃじゃ馬だ。反応速度が普通の3倍。乗ったヤツはみんな、壁に突っこんでおしまいさ。');
    await E.say('ruu', '……乗っていい？');
    await E.say('w2_django', '……ケガしても知らねえぞ。');
    await E.say(null, 'ルウはひらりとコクピットに飛び乗った。');
    E.cut(false);
    const sc = await E.timing({ title: 'ローズハウンド起動（ルウ）', rounds: 3, speed: 2.0, zone: 0.17, labels: ['姿勢制御、同調……', 'リミッター解除……', '起動ッ！'] });
    E.cut();
    E.flash(16);
    E.se('boot');
    await E.wait(20);
    E.shake(3, 20);
    if (sc >= 2) await E.say('ruu:grin', '……っ、ははっ！　すっご……！　この子、あたしの思ったとおりに動く！');
    else await E.say('ruu:grin', 'わっ、とと……！　……オッケー、わかった。あんた、気が短いんだね。……あたしと一緒じゃん！');
    await E.say('w2_django:surprise', '…………動いた。');
    await E.say('w2_django', '壁に突っこまずに、立ったまま……。こいつは、たまげた。');
    await E.say('ruu', 'ジャンゴ。この子、いくら？');
    await E.say('w2_django', '……ふん。乗りこなせるヤツに、ガラクタのまま腐らせるのはもったいねえ。');
    await E.say('w2_django', '予選の賞金、そっくりそのまま。それで手を打とう。');
    await E.say('ruu', '……カナタ。賞金は、ニコの身分証と、修理代のための……。');
    const k = await E.ask('kanata', '（ルウが、こっちを見ている）', ['「買おう。チームの機体だ」', '「ルウが乗るなら、ローズハウンドも喜ぶよ」']);
    if (k === 0) await E.say('kanata:grin', '買おう。……チームの機体だ。本戦で勝てば、全部取り返せる。');
    else await E.say('kanata:grin', 'ルウが乗るなら、あいつも喜ぶよ。……さっき、すげえ楽しそうな音してた。');
    E.money(-Math.min(1200, G.state.money));
    E.set('c3_rose');
    await E.say('ruu:shy', '……ありがと。この借りは、本戦で返す。');
    await E.say('niko:smile', '……ルウの、ろぼっと。ぴんく。かわいい。');
    await E.say('ruu:grin', '〈ローズハウンド〉。……よろしく、相棒。');
    await E.cameraReset();
    // シグ登場
    E.se('mechstep');
    E.shake(4, 30);
    await E.say(null, '──ズシン。ズシン。');
    await E.say('w2_fangirl', 'ちょ、ちょっと、エレベーターから……白い機体が……！？');
    E.bgm('tension');
    await E.say('w2_registrar', '……あら。飛び入りの登録？');
    put('c3_sig', 'sig', 4, 3, 'down');
    await E.say('sig', '……ソロで、本戦に登録したいのですが。');
    await E.say('w2_registrar', '残念だけど、本戦は3人1組のクラン戦よ。ソロじゃ出られないわ、坊や。');
    await E.say('sig', '……そうですか。');
    await E.move('c3_sig', [[6, 4], [6, 13], [5, 13]]);
    E.face('c3_sig', 'left');
    E.face('player', 'c3_sig');
    E.face('c3_ruu', 'c3_sig');
    await E.say('kanata:surprise', 'お、おまえ……あの夜の！');
    await E.say('ruu:angry', 'ゼフィールのパイロット……！');
    await E.say('niko', '……シグ。');
    await E.say('sig', '……シグ、です。獅子堂シグレ。');
    await E.say('sig', '……あなたたちのクランに、僕を入れてほしい。');
    await E.say('ruu:angry', '……は？　いきなり何。あんた、あの夜、ニコをカナタに押しつけて消えたじゃん。');
    await E.say('sig', '……はい。');
    await E.say('ruu:angry', '何者なの。なんでニコを知ってるの。なんで公安と戦ってたの。');
    await E.say('sig', '……今は、まだ言えません。');
    await E.say('ruu:angry', 'それで信じろって？');
    await E.say('sig', '……ここなら。');
    await E.say('sig', '……ここなら、空が落ちる前に、会える人がいる。');
    await E.say('kanata:think', '（空が……落ちる前に？）');
    await E.say('niko', '……シグの、おと。しずか。……でも、すごく、かなしい。');
    await E.say('niko:smile', '……でも、うそ、ついてない。');
    await E.say('ruu:think', '……。');
    const j = await E.ask('kanata', '（どうする？）', ['「よろしくな、シグ！」', '「……条件がある。今夜、星屑亭でラーメン食ってけ」']);
    if (j === 0) {
      await E.say('kanata:grin', '……よろしくな、シグ！　オレはカナタ。こっちがルウで、ニコ。整備のポンタは格納庫だ。');
    } else {
      await E.say('kanata:grin', '……条件がある。今夜、星屑亭でラーメン食ってけ。話はそれからだ。');
      await E.say('sig', '……ラーメン。');
      await E.say('ruu', '……ばあちゃんの真似じゃん。');
      await E.say('kanata:grin', 'うちのやり方なんだよ。');
    }
    await E.say('sig', '……ありがとう、ございます。');
    await E.say('ruu', '……ふん。あたしは、まだ信用してないから。');
    await E.say('ruu', '……でも、あの夜。ゼフィールが来なかったら、あたしたち全員、捕まってた。……それは、ありがと。');
    await E.say('sig', '……。');
    E.set('c3_sig_joined');
    await E.say('w2_registrar', 'クラン〈スターダスト〉、メンバー変更受理。パイロット3名、整備1名。……これで本戦に出られるわね。');
    await E.say('w2_registrar', '本戦は、明後日の夜。……面白くなってきたじゃない。');
    del('c3_ruu', 'c3_niko', 'c3_sig');
    E.party(['ruu', 'niko', 'sig']);
    setStep(8);
    E.reload();
    E.cut(false);
    E.objective('星屑亭へ帰る（シグを連れて）');
  }

  // ---------- 星屑亭：シグとラーメン ----------
  G.addToMap('hoshikuzu', {
    onEnter: async () => {
      if (at(8)) await sceneSigRamen();
      else if (at(13)) await scenePartyStart();
    },
    npcs: [
      // 祝勝会（step 13）
      { id: 'c3_tome_p', char: 'tome', x: 4, y: 4, dir: 'down', move: 'still', show: () => at(13), talk: async () => await partyTome() },
      {
        id: 'c3_ruu_p', char: 'ruu', x: 7, y: 6, dir: 'up', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('ruu:grin', '……勝った。ほんとに、勝っちゃった。');
          await E.say('ruu', 'ローズハウンドのコクピットにね、チビたちの写真、貼ったんだ。……ハルにも、ショウタにも、ミオにも、見せてやりたかった。');
          await E.say('ruu:shy', '……カナタ。あんたと組めて、よかった。……一回しか言わないからね。');
        },
      },
      {
        id: 'c3_niko_p', char: 'niko', x: 5, y: 6, dir: 'up', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('niko:smile', '……らーめん、ごはい、め。');
          await E.say('niko:smile', 'カナタ、かっこよかった。ハルカゼ、かぜの、おと、した。');
          await E.say('niko', '……でも、さいごに、つめたい、おと、した。……アリーナの、うえのほう。');
        },
      },
      {
        id: 'c3_sig_p', char: 'sig', x: 13, y: 7, dir: 'left', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('sig', '……ラーメン。二杯目です。');
          await E.say('sig', '……にぎやかですね。こういう夜を、僕は……ずっと、知らなかった。');
          await E.say('sig', '……少し、外の空気を吸ってきます。');
        },
      },
      {
        id: 'c3_ponta_p', char: 'ponta', x: 3, y: 6, dir: 'up', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('ponta:grin', 'ぶっひゃー！　優勝っす！　優勝っすよカナタ！！');
          await E.say('ponta', '賞金でハルカゼのパーツ、買い放題っす！　……あ、でもニコちゃんの身分証が先っすね。');
          await E.say('ponta:cry', 'オイラ、整備士になってよかったっす……！　うおおお……！');
        },
      },
      {
        id: 'c3_doc_p', char: 'doc', x: 10, y: 10, dir: 'up', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('doc', '……ふん。ラーメン屋で祝勝会とはな。ジンの時と、まったく同じじゃ。');
          await E.say('doc', 'あいつも、優勝した夜は、ここでトメさんのラーメンを三杯食っとった。');
          await E.say('doc:smile', '……カナタ。おまえは、ジンを越えるかもしれんな。');
        },
      },
      {
        id: 'c3_kyo_p', char: 'kyosuke', x: 2, y: 8, dir: 'right', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('kyosuke', '……チッ。なんでオレまで呼ばれてんだ。');
          await E.say('kyosuke', '……まあ、ラーメンはうめぇ。それは認める。');
          await E.say('kyosuke:grin', 'ギルのツラ、見たか？　あんな悔しそうで、うれしそうな顔、初めて見たぜ。');
        },
      },
      {
        id: 'c3_gil_p', char: 'gil', x: 14, y: 10, dir: 'left', move: 'still', show: () => at(13),
        talk: async () => {
          await E.say('gil', '……よう、チャンピオン。差し入れだ。ネオン通りのドーナツ、50個。');
          await E.say('gil:grin', '勘違いすんなよ。リベンジの予約だ。次のシーズン、サラマンダーはもっと熱くなって帰ってくる。');
          await E.say('gil', '……それと、このラーメン。……うめえな。ちくしょう。');
        },
      },
    ],
  });
  async function sceneSigRamen() {
    setStep(8.5);
    E.cut();
    E.party([]);
    E.remove('w_taxi');
    put('c3_ruu', 'ruu', 7, 6, 'up');
    put('c3_niko', 'niko', 5, 6, 'up');
    put('c3_sig', 'sig', 6, 6, 'up');
    E.teleport('player', 8, 6, 'up');
    E.bgm('home');
    await E.say('tome', 'おかえり。……おや、新顔だね。');
    E.emote('w_tome', '…');
    await E.wait(30);
    await E.say('tome', '…………。');
    await E.say('tome:serious', '……あんた。どこかで、会ったことがあるかね。');
    await E.say('sig', '……いいえ。');
    await E.say('sig', '……この世界では、まだ。');
    await E.say('tome', '……そうかい。');
    await E.say('tome:smile', 'まずは食いな。話は、それからさ。');
    await E.say(null, '湯気の立つどんぶりが、シグの前に置かれた。');
    await E.say('sig', '……これは、なんという食べ物ですか。');
    await E.say('kanata:surprise', 'え、ラーメン知らないの？');
    await E.say('sig', '……ラーメン。');
    await E.say(null, 'シグは、おそるおそる麺をすすり──');
    await E.wait(40);
    await E.say('sig', '…………。');
    await E.wait(60);
    await E.say('ruu', '……固まった。');
    await E.say('niko', '……シグ、とまった。');
    await E.say('kanata', 'お、おい、シグ？　熱かったか？');
    await E.say('sig', '……温かい。');
    await E.say('sig', '……僕のいたところには、もう、なかったものです。');
    await E.say('tome', '……。');
    await E.say('tome:smile', '……おかわりは、いくらでもあるよ。');
    await E.say('sig', '……はい。');
    await E.say('sig', '……おかわりを、ください。');
    await E.say('niko:smile', '……ニコも、おかわり。');
    await E.say('ruu:grin', 'ニコは張り合わなくていいから。');
    await E.fadeOut(30);
    del('c3_ruu', 'c3_niko', 'c3_sig');
    await E.say(null, '──そして、本戦の夜がやってきた。');
    E.time('night');
    E.party(['ruu', 'niko', 'sig']);
    setStep(9);
    E.teleport('player', 7, 9, 'down');
    await E.fadeIn(20);
    await E.say('tome', 'いってらっしゃい。……全員、ちゃんと帰ってくるんだよ。');
    E.cut(false);
    E.objective('アンダーシェルへ。いよいよ本戦！（スクラップ・ベイの LIFT B7）');
  }

  // ---------- 本戦の夜 ----------
  async function sceneTournamentNight() {
    setStep(10);
    E.cut();
    E.party([]);
    E.reload();
    E.teleport('player', 4, 5, 'down');
    E.bgm('arena');
    await E.say(null, '──本戦の夜。アンダーシェルは、これまでにない熱気に包まれていた。');
    await E.say('lily', 'ハロー、アンダーシェル！！　ジャンク・デュエル新シーズン、本戦トーナメントの開幕よ！', MC);
    await E.say('lily', '注目はもちろん、優勝候補〈ネオン・ジャッカルズ〉！　そして……作業機で予選を抜けた、あの新人〈スターダスト〉！', MC);
    await E.say('lily', '噂じゃ、機体を総入れ替えしてきたって話よ！　白い新型、ピンクの格闘機、そして……謎の白い天使！', MC);
    put('c3_gil', 'gil', 18, 4, 'down');
    await E.camera(18, 6);
    await E.say('gil', 'よう、スターダスト。逃げずに来たか。');
    await E.say('gil', '……ほぉ。白いの、ピンクの、それに天使の羽か。ずいぶん化けたじゃねえか。');
    await E.say('gil:grin', 'いいぜ、燃えてきた。決勝まで上がってこい。……オレのサラマンダーが、まるごと焼いてやる！');
    await goOut('c3_gil', [[18, 2]]);
    await E.cameraReset();
    await E.say('ponta', 'カナタ！　みんな控室に集まってるっす！　出番になったら、大扉の前に立つっす！');
    await E.say('kyosuke', '……よう。');
    await E.say('kanata:surprise', 'キョウスケ先輩！？');
    await E.say('kyosuke', '……見に来ただけだ。勘違いすんな。……あとで顔、出せ。');
    E.cut(false);
    E.objective('控室で仲間と話す／準備ができたら大扉の前へ（本戦1回戦）');
  }

  // ---------- 本戦1回戦 ----------
  async function sceneQuarter() {
    E.cut();
    await E.say('lily', '本戦1回戦！　スターダスト　対　鉄壁と毒針の混成クラン〈アイアン・スティング〉！', MC);
    E.cut(false);
    await E.battle({
      map: 'arena', mech: true, mechId: 'harukaze', x: 17, y: 17, dir: 'up', bgm: 'arena', title: 'ROUND 1', sub: 'VS アイアン・スティング　3対3のクラン戦！',
      enemies: [
        { type: 'clanA', x: 17, y: 5, lv: 5, name: 'タートル〈アイアン〉' },
        { type: 'clanB', x: 11, y: 6, lv: 5, name: 'ホーネット〈スティング〉' },
        { type: 'clanB', x: 23, y: 6, lv: 4, name: 'ホーネット〈ニードル〉' },
      ],
      allies: [ROSE(13, 16), ZEPH(21, 16)],
      onStart: async () => {
        await E.say('ruu', 'ローズハウンド、出るよ！　カナタ、前はあたしに任せな！');
        await E.say('sig', '……ゼフィール、行きます。');
      },
      returnTo: ['shell_lobby', 17, 7, 'down'],
    });
    E.cut();
    await E.say('lily', '勝者、スターダスト！！　なんてチームワーク！　ピンクが殴って、白い天使が撃ち抜いて、白い新型がとどめ！', MC);
    setStep(11);
    E.reload();
    E.cut(false);
    E.objective('控室で仲間と話す／準備ができたら大扉の前へ（準決勝）');
  }

  // ---------- 準決勝 ----------
  async function sceneSemi() {
    E.cut();
    await E.say('lily', '準決勝！　スターダスト　対　ジャッカルズ別働隊〈レッド・ファング〉！　率いるは、ギルの右腕レオ！', MC);
    await E.say('w2_leo', '……ギルさんの前に、オレたちが相手だ。決勝には行かせねえ。');
    E.cut(false);
    await E.battle({
      map: 'arena', mech: true, mechId: 'harukaze', x: 17, y: 17, dir: 'up', bgm: 'arena', title: 'SEMI FINAL', sub: 'VS レッド・ファング　ジャッカル部隊を撃破せよ',
      enemies: [
        { type: 'jackal', x: 17, y: 5, lv: 5, name: 'ジャッカル〈レオ〉', hp: 450 },
        { type: 'jackal', x: 11, y: 6, lv: 5, name: 'ジャッカル〈モヒ〉' },
        { type: 'jackal', x: 23, y: 6, lv: 5, name: 'ジャッカル〈チビ〉' },
      ],
      allies: [ROSE(13, 16), ZEPH(21, 16)],
      onStart: async () => {
        await E.say('sig', '……速い。でも、見えないほどでは、ありません。');
      },
      returnTo: ['shell_lobby', 17, 7, 'down'],
    });
    E.cut();
    await E.say('lily', '決まったーー！！　スターダスト、決勝進出！！　相手はもちろん、あの男！', MC);
    put('c3_gil', 'gil', 18, 3, 'down');
    await E.move('c3_gil', [[18, 6]]);
    await E.say('gil', '……レオたちを、まとめて沈めやがったか。');
    await E.say('gil', '認めてやるよ、スターダスト。おまえらは、遊びに来たガキじゃねえ。');
    await E.say('gil:grin', '──だからこそ、全力で焼き尽くす！　決勝で会おうぜ！');
    await goOut('c3_gil', [[18, 2]]);
    setStep(12);
    E.reload();
    E.cut(false);
    E.objective('準備ができたら大扉の前へ（決勝 VS ギル）');
  }

  // ---------- 決勝 ----------
  async function sceneFinal() {
    E.cut();
    E.bgm('arena');
    await E.cg('arena', '決勝。──アンダーシェルが、揺れていた。');
    await E.say('lily', 'さあ、いよいよ決勝戦！！　〈ネオン・ジャッカルズ〉対〈スターダスト〉！！', MC);
    await E.say('lily', '王者の炎か、星屑の奇跡か！　……レディ……ファイト！！', MC);
    E.cgOff();
    E.cut(false);
    await E.battle({
      map: 'arena', mech: true, mechId: 'harukaze', x: 17, y: 17, dir: 'up', bgm: 'arena', title: 'FINAL', sub: 'VS ネオン・ジャッカルズ　親衛隊を突破せよ', after: 'stay',
      waves: [
        [
          { type: 'jackal', x: 12, y: 6, lv: 5, name: 'ジャッカル親衛隊〈ブレイズ1〉' },
          { type: 'jackal', x: 22, y: 6, lv: 5, name: 'ジャッカル親衛隊〈ブレイズ2〉' },
        ],
        [
          { type: 'clanA', x: 17, y: 4, lv: 5, name: 'ジャッカル重装機〈ブレイズ3〉', color: { body: '#c02030', accent: '#1a1a24', accent2: '#ffd25e' } },
          { type: 'jackal', x: 9, y: 6, lv: 5, name: 'ジャッカル親衛隊〈ブレイズ4〉' },
          { type: 'jackal', x: 25, y: 6, lv: 5, name: 'ジャッカル親衛隊〈ブレイズ5〉' },
        ],
      ],
      allies: [ROSE(13, 16), ZEPH(21, 16)],
      onStart: async () => {
        await E.say('gil', '（通信）まずは前座だ！　オレの親衛隊を抜けてみせな！');
      },
    });
    // ギルとのタイマン
    E.cut();
    E.bgm('tension');
    E.se('boost');
    E.shake(5, 30);
    put('c3_sal', 'sys', 17, 6, 'down', { mech: 'salamander' });
    await E.camera(17, 8);
    await E.say('lily', 'き、来たーーっ！！　真紅の機体、サラマンダー！！　ギル・ブレイズ、ついに降臨！！', MC);
    await E.say('gil', '（通信）……ピンクのお嬢ちゃん、白い天使。悪いが、下がってくれ。');
    await E.say('gil', '（通信）オレは、そいつと──春瀬カナタと、サシでやりてえ。');
    await E.say('ruu', '（通信）……はぁ？　何それ、ずるくない？');
    await E.say('sig', '（通信）……下がりましょう、ルウ。彼の炎は、まっすぐです。');
    await E.say('ruu', '（通信）……っ、わかったよ！　カナタ！　負けたら、ラーメン一生おごりだからね！');
    await E.say('kanata:serious', '（通信）……ああ。受けて立つ、ギル！');
    await E.say('gil', '（通信）ハッハァ！　いい返事だ！　──イッツ・ショータイム！！　燃えろォォォ！！');
    await E.cameraReset();
    E.remove('c3_sal');
    E.cut(false);
    await E.battle({
      map: 'arena', mech: true, mechId: 'harukaze', x: 17, y: 17, dir: 'up', bgm: 'boss', title: 'FINAL ROUND', sub: 'VS ギル・ブレイズ〈サラマンダー〉', after: 'stay', win: 'boss',
      // state:'idle' … spawnWave が 'chase' にすると salamander AI が動かないため
      enemies: [{ type: 'salamander', x: 17, y: 6, lv: 5, hp: 1150, boss: true, state: 'idle', name: 'サラマンダー（ギル）' }],
      onStart: async () => {
        await E.say('kanata', '（キョウスケ先輩が言ってた……止まったら、横だ！）');
      },
    });
    // 勝利
    E.cut();
    E.bgm('arena');
    put('c3_sal', 'sys', 17, 7, 'down', { mech: 'salamander' });
    await E.say('lily', '……決まった……！！　決まったわ！！　サラマンダー、膝をついた！！', MC);
    await E.say('lily', '優勝は……新星〈スターダスト〉！！！　作業機から始まった星屑が、アンダーシェルの頂点に輝いたーーっ！！', MC);
    E.shake(3, 40);
    await E.say(null, '──観客席が、爆発したような歓声に包まれた。');
    put('c3_gil', 'gil', 18, 8, 'down');
    await E.say('gil', '（ハッチを開けて）……っはぁ、はぁ……。');
    await E.say('gil', '……ハッ。ハハハ……！');
    await E.say('gil:grin', '燃えたぜ……。こんなに熱いデュエルは、生まれて初めてだ。');
    await E.say('gil', '……オレの負けだ、春瀬カナタ。おまえらの勝ちだ。');
    await E.say('gil:grin', 'だがな、覚えとけ！　次のシーズンは、オレが勝つ！　それまで、その王座、誰にも渡すんじゃねえぞ！');
    await E.say('kanata:grin', '（通信）……ああ。また、やろうぜ。');
    // 観客席のアイゼン
    E.stopBgm();
    put('c3_eisen', 'eisen', 27, 20, 'down');
    await E.wait(20);
    E.bgm('tension');
    await E.camera(27, 18);
    await E.say(null, '……歓声の渦の中。観客席の最上段に、ひとりだけ、拍手をしない男がいた。');
    await E.say('eisen', '……。');
    await E.say('eisen', '……白い新型。ピンクの格闘機。そして……あの白い羽。');
    await E.say('eisen:serious', '……見つけたぞ。');
    await E.cameraReset();
    E.remove('c3_eisen');
    await E.say('kanata:think', '（……今、誰かに見られていたような……）');
    // ロビーで表彰
    E.set('c3_won');
    setStep(12.5);
    E.bgm('arena');
    await E.warp('shell_lobby', 25, 7, 'up', { noEnter: true });
    E.party([]);
    put('c3_ruu', 'ruu', 24, 8, 'up');
    put('c3_niko', 'niko', 26, 8, 'up');
    put('c3_sig', 'sig', 23, 8, 'up');
    put('c3_ponta', 'ponta', 27, 8, 'up');
    await E.say('w2_registrar:smile', '……おめでとう、スターダスト。新しい王者の誕生ね。');
    await E.say('w2_registrar', '優勝賞金、10万クレジット。……それと、これ。王者のクランだけが付けられる、クラン・バッジよ。');
    await E.give('badge', 1, { wait: true });
    if (!G.state.equip.acc) {
      E.equip('acc', 'badge');
      E.toast('クラン・バッジを装備した', '#ffd25e');
    } else {
      const k = await E.ask(null, 'クラン・バッジを装備する？（攻撃+3 防御+3）', ['装備する', 'あとで'], { cancel: 1 });
      if (k === 0) {
        E.equip('acc', 'badge');
        E.toast('クラン・バッジを装備した', '#ffd25e');
      }
    }
    await E.say('ponta:cry', 'ぶ、ぶっひゃー……じゅ、じゅうまん……！');
    await E.say('kanata', 'ドクに修理代を払って、ニコの身分証を作って……残りは、みんなで分けよう。');
    E.money(3000);
    await E.say('w2_django', '……おう、チャンピオン。例の「紙」の件、聞いてるぜ。');
    put('c3_django', 'w2_django', 21, 9, 'right');
    await E.say('w2_django', '白い髪のお嬢ちゃんの身分証。名前、生年月日、住所。……全部、本物と見分けがつかねえように作ってやる。');
    await E.say('w2_django', '明日の夜には仕上げて、星屑亭に届けてやるよ。……チャンピオン割引でな。');
    await E.say('niko', '……ニコの、みぶんしょう？');
    await E.say('ruu:smile', 'そ。ニコが、ここにいていいっていう証拠。');
    await E.say('niko:smile', '……！');
    await E.fadeOut(30);
    del('c3_ruu', 'c3_niko', 'c3_sig', 'c3_ponta', 'c3_django');
    await E.say(null, '──翌日の夜。星屑亭。');
    setStep(13);
    E.party([]);
    E.time('night');
    await E.warp('hoshikuzu', 7, 9, 'up', { noEnter: true, noFade: true });
    await E.fadeIn(30);
    await scenePartyStart();
  }

  // ---------- 祝勝会 ----------
  async function scenePartyStart() {
    E.remove('w_tome');
    E.remove('w_taxi');
    if (E.flag('c3_party_intro')) return;
    E.set('c3_party_intro');
    E.cut();
    E.bgm('home');
    await E.say(null, '──星屑亭は、「本日貸し切り」。');
    await E.say('tome:grin', 'さあさあ、今夜は食べ放題だよ！　優勝祝いだ、遠慮なんかするんじゃないよ！');
    await E.say('ponta:grin', 'うおおお！　いただきますっす！！');
    await E.say('gil', '……邪魔するぜ。');
    await E.say('ruu:surprise', 'ギル！？　なんであんたが……！');
    await E.say('gil:grin', '負けた相手の祝勝会に顔を出すのが、オレの流儀だ。……ほらよ、差し入れ。');
    await E.say('kyosuke', '……チッ。オレまで呼びやがって。');
    E.cut(false);
    E.objective('祝勝会：みんなと話そう（最後はばあちゃんに話しかける）');
  }
  async function partyTome() {
    const k = await E.ask('tome', 'どうしたい、カナタ。みんなとは、もう話したかい？', ['乾杯しよう！', 'もう少しみんなと話す'], { cancel: 1 });
    if (k !== 0) {
      await E.say('tome:smile', 'ゆっくりしな。ラーメンは逃げやしないよ。……のびるけどね。');
      return;
    }
    await scenePartyToast();
  }
  async function scenePartyToast() {
    E.cut();
    E.objective('');
    E.teleport('player', 8, 7, 'up');
    await E.say('tome', 'さあ、みんな！　グラスは持ったかい！　……ジュースだよ、ジュース！');
    await E.say('tome', 'スターダストの優勝と……。');
    await E.say('tome', 'それから、もうひとつ。……カナタ。あれを。');
    await E.say(null, 'カナタは、ジャンゴから届いた封筒を取り出した。');
    await E.give('idcard', 1, { wait: true });
    await E.say('kanata', 'ニコ。……これ。');
    await E.say('niko', '……？');
    await E.say(null, '小さなカード。白い髪の少女の写真と、名前。');
    await E.say('niko', '……「はるせ、ニコ」……？');
    await E.say('tome', '名字がないと、何かと不便だろ。……春瀬で、いいかい。');
    await E.say('niko:surprise', '……！');
    await E.wait(30);
    await E.say('niko:cry', '……ニコ……ここの、こ……？');
    await E.say('niko:cry', '……ここに、いて……いい……？');
    await E.say('tome:smile', '当たり前だろ。……あんたは、うちの子だよ。');
    await E.say('ruu:cry', '……っ、もう……泣かせないでよ、ばあちゃん……。');
    await E.say('ponta:cry', 'うおおおん……！　オイラも泣いてるっす……！');
    await E.say('gil', '……ちくしょう、目にゴミが……。');
    await E.say('kyosuke', '……チッ。');
    await E.say('tome', 'さあ、もう一度！　スターダストの優勝と、春瀬ニコの誕生日に！');
    E.se('levelup');
    await E.say(null, '「──かんぱーい！！」');
    E.flash(10);
    await E.wait(30);
    await E.fadeOut(30);
    await E.say(null, '──宴が、いつまでも続いた夜ふけ。');
    await E.say(null, 'カナタは、ひとり店の外に出たシグを追って、物干し台にのぼった。');
    await E.cg('rooftop_night', '', { wait: false });
    await E.fadeIn(30);
    E.bgm('sad');
    await E.cgCaption('星屑亭の物干し台。見上げれば、向こう側の街の灯りが、星のようにまたたいていた。');
    await E.say('kanata', '……シグ。ここにいたのか。');
    await E.say('sig', '……カナタ。');
    await E.say('kanata', '……なあ。おまえが前に言ってた、「空が落ちる前に」って……どういう意味だよ。');
    await E.say('sig', '……。');
    await E.say('sig', '……この世界の空は、まだ落ちていない。');
    await E.say('sig', '……だから、間に合う。今度は、きっと。');
    await E.say('kanata:think', '……今度は？');
    await E.say('sig', '……いつか、話します。あなたたちが、僕を許してくれるなら。');
    await E.say('kanata', '……許すも何も。おまえはもう、スターダストの仲間だろ。');
    await E.say('kanata:grin', 'ラーメン三杯食ったやつを、仲間じゃないとは言わせないぞ。');
    await E.say('sig', '……。');
    await E.say('sig:smile', '……はい。');
    await E.say(null, '……シグが、はじめて少しだけ笑った気がした。');
    E.cgOff();
    await E.fadeOut(30);
    await sceneEisenCoda();
  }

  // ---------- アイゼン少佐（不穏なラストショット） ----------
  async function sceneEisenCoda() {
    E.cut();
    E.stopBgm();
    await E.warp('arena', 17, 12, 'up', { noEnter: true, noFade: true });
    E.hide('player');
    put('c3_eisen', 'eisen', 17, 11, 'down');
    put('c3_aide', 'c3_aide', 17, 13, 'up');
    E.camera(17, 11, { noWait: true });
    await E.say(null, '──同じ頃。無人のアリーナ。');
    await E.fadeIn(30);
    E.bgm('tension');
    await E.say('c3_aide', '少佐。……白い髪の少女、確認しました。星屑亭に、間違いありません。');
    await E.say('c3_aide', '白い羽の機体も、例の「イレギュラー」と一致します。……ただちに確保しますか。');
    await E.say('eisen', '……まだだ。');
    await E.say('c3_aide', 'しかし、クロイツ博士からは「一刻も早く」と……。');
    await E.say('eisen', '……博士には、私から報告する。');
    await E.say('eisen', '……春瀬ジンの息子、か。');
    await E.say('eisen:serious', 'あの太刀筋……あいつに、よく似ていた。');
    await E.wait(30);
    await E.say('eisen', '……子供の遊びは、そろそろ終わりだ。');
    await E.say('eisen:serious', '──せめて、遊びのうちに終わらせてやるのが、大人の仕事だろう。');
    await E.fadeOut(40);
    del('c3_eisen', 'c3_aide');
    E.cameraReset();
    E.hide('player', false);
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさんたち！　レディオ・スターダスト、今夜は特別編成！',
      'ジャンク・デュエル新シーズン、優勝は……なんと新人クラン〈スターダスト〉！　リリィお姉さん、実況席で泣いちゃった！',
      '負けたギル・ブレイズも「最高に燃えた」ってコメント。……いい男じゃない？',
      'それから、ちょっと真面目なお知らせ。来週から、第三中学校で文化祭の準備が始まるんだって。リスナーの中学生のみんな、楽しんでね。',
      '……ただ、ね。最近、街で公安の制服をよく見かけるの。アンダーシェルの観客席にも、いたって噂。',
      '星屑たち。……光るのはいいけど、目立ちすぎないように。お姉さんとの約束よ。',
      'それじゃ、今夜の一曲。……「星屑ララバイ」。おやすみなさい、クレイドル7。',
    ]);
    E.cut(false);
    await E.startChapter(4);
  }

  // デバッグ・テスト用
  G.C3 = { setStep, sceneDepart, sceneLily, sceneArcade, scenePontaLift, sceneRegister, sceneQualifiers, sceneRebuild, sceneRoseAndSig, sceneSigRamen, sceneTournamentNight, sceneQuarter, sceneSemi, sceneFinal, scenePartyStart, scenePartyToast, sceneEisenCoda };
})();
