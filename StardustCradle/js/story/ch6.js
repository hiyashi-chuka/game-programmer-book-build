// =============================================================
//  story/ch6.js — 第6章「ミラージュ」
//   1. 悪夢とハルカゼの戦闘ログ（tome_room）→ 朝ごはん（hoshikuzu）
//   2. ゲーセン〈ギャラクシー〉のレジェンド・モード：父の戦闘記録＝ミラージュ（c6_sim）
//   3. ばあちゃんの告白（“星屑のトメ”・写真）→ ユイの見取り図
//   4. 旧第2研究所（c6_yard → c6_ruins1 → c6_ruins2）：ニコの記憶、父の手紙、ミラージュの決闘状
//   5. 準備（ドクのガレージ）→ ノクターン戦（c6_yard）→ 仮面を割る → 父・ジン解放
//   6. ジンの告白（ゼロ・リライト計画とシグの正体）→ 屋上の夜（ルウ）→ 第7章へ
//  フラグ接頭辞 c6_ ／ マップは maps/c6.js
// =============================================================
(function () {
  const ch = () => G.state.chapter;
  const is6 = () => G.state.chapter === 6;
  const F = () => G.field;

  G.addItem('c6_jincard', { name: 'ジンのIDカード', desc: '父のIDカード。5年前、勲章と一緒に「遺品」として届いたもの。' });
  G.addItem('c6_blueprint', { name: '旧第2研究所の見取り図', desc: 'ユイが総督府の資料室から写してきた見取り図。' });
  G.addItem('c6_duel', { name: 'ミラージュの決闘状', desc: '「ハルカゼのパイロットへ。明晩零時、旧第2研究所演習場にて待つ。――M」' });

  // ---------- 小さなヘルパー ----------
  // 仲間（フォロワー）をその場に留める／解放する
  async function pin(id, path, dir) {
    const e = E.get(id);
    if (!e) return;
    if (path) await E.move(id, path);
    if (dir) e.dir = dir;
    e.pinned = true;
  }
  function unpin() {
    (F().followers || []).forEach((f) => (f.pinned = false));
  }
  // イベント用のNPCを出す
  function cast(id, char, x, y, dir, extra) {
    return E.npc(Object.assign({ id, char, x, y, dir: dir || 'down', move: 'still' }, extra || {}));
  }
  // 戦闘中の割り込み会話（条件を満たしたら一度だけ）
  function watch(cond, run) {
    const b0 = F().battle;
    (async () => {
      await G.tasks.until(() => F().battle !== b0 || (b0 && b0.active));
      await G.tasks.until(() => F().battle !== b0 || !b0.active || b0.won || b0.lost || b0.retry || cond());
      const b = F().battle;
      if (b !== b0 || !b || !b.active || b.won || b.lost || b.retry) return;
      E.cut(true);
      try {
        await run();
      } finally {
        E.cut(false);
      }
    })();
  }
  const bossOf = () => F().enemies().find((e) => e.boss);
  G.C6.pin = pin;
  G.C6.unpin = unpin;
  G.C6.cast = cast;
  G.C6.watch = watch;

  // =============================================================
  //  章の開始
  // =============================================================
  G.STORY.chapters[6] = async function () {
    E.time('morning');
    E.party([]);
    G.state.mech.id = 'harukaze';
    E.tint(null);
    if (!E.has('pendant')) {
      G.addItemCount('pendant', 1);
      if (!G.state.equip.acc) E.equip('acc', 'pendant');
    }
    if (!G.state.skills.includes('echo')) G.state.skills.push('echo');
    E.objective('');
    await E.chapter(6);
    await E.warp('tome_room', 5, 6, 'down', { noEnter: true });
    E.cut(true);
    E.bgm('mirage');
    E.tint('rgba(40,0,60,0.35)');
    await E.say(null, '――黒い機体が、こちらに背を向けたまま、ふっと消える。');
    await E.say(null, '三度のブースト。右、左、右。そして、振り向きざまの一閃。');
    await E.say('mirage', '……退け。');
    E.flash(10);
    E.se('saber');
    E.shake(5, 20);
    await E.wait(30);
    E.tint(null);
    E.bgm('home');
    E.emote('player', '!');
    await E.say('kanata:surprise', '――っ！ ……はぁ、はぁ……夢、か。');
    await E.say('kanata:think', '研究所でミラージュとやり合ってから、毎晩これだ。あの動き……頭から離れない。');
    await E.move('player', 'U2');
    await E.say('kanata:think', '右、左、右……振り向いて斬る。オレ、あのクセ、どっかで……。');
    await E.say('kanata', 'ハルカゼのレコーダー、ログ残ってるはずだよな。机の端末で見てみるか。');
    E.objective('机の端末で、ハルカゼの戦闘ログを見る');
  };

  // =============================================================
  //  1. カナタの部屋：戦闘ログ
  // =============================================================
  G.addToMap('tome_room', {
    checks: [
      {
        x: 5, y: 2,
        show: () => is6() && !E.flag('c6_log'),
        run: async () => {
          E.cut(true);
          E.se('boot');
          await E.say(null, '端末にハルカゼのフライトレコーダーをつなぐ。ノイズまじりの映像が流れはじめた。');
          await E.say(null, '〈再生：コア・シャフト研究棟・格納区画〉　黒い機体――ノクターンが、画面の中で舞う。');
          await E.say('kanata:think', 'ここだ。三連ブースト……右、左、右。で、こっちの死角に回って、振り向きざまに斬る。');
          await E.say('kanata:think', '……フェイントの前に、肩を一回だけ落とすクセ。これ、オレ知ってる。');
          await E.say('kanata:serious', 'ガキのころ、ネオン通りのゲーセンで何百回も負けたやつだ。〈ギャラクシー・パイロット〉の、レジェンド・モード……。');
          await E.say('kanata:think', '…………まさか、な。');
          E.set('c6_log');
          E.objective('下の店へ行く（星屑亭 1F）');
        },
      },
    ],
    events: [
      {
        x: 9, y: 3, w: 2, h: 1,
        cond: () => is6() && !E.flag('c6_log'),
        run: async () => {
          await E.say('kanata:think', '（その前に、ハルカゼの戦闘ログを見ておこう。机の端末だ）');
          await E.move('player', 'L2D');
        },
      },
      {
        x: 9, y: 2,
        cond: () => is6() && !E.flag('c6_log'),
        run: async () => {
          await E.say('kanata:think', '（その前に、机の端末でログを確認だ）');
          await E.move('player', 'DL2');
        },
      },
    ],
  });

  // =============================================================
  //  朝ごはん（星屑亭）
  // =============================================================
  G.addToMap('hoshikuzu', {
    onEnter: async () => {
      if (!is6()) return;
      if (E.flag('c6_log') && !E.flag('c6_breakfast')) await breakfast();
      else if (E.flag('c6_sim_done') && !E.flag('c6_confess')) await confession();
      else if (E.flag('c6_letter') && !E.flag('c6_challenge')) await challengeNight();
      else if (E.flag('c6_jin_freed') && !E.flag('c6_jin_talk')) await jinTalk();
    },
    npcs: [
      {
        id: 'c6_yui', char: 'yui', x: 11, y: 8, dir: 'left', move: 'still',
        show: () => is6() && E.flag('c6_lab_go') && !E.flag('c6_letter'),
        talk: async () => {
          const i = await E.ask('yui', '研究所の件、何か確認したいことはありますか？', ['見取り図のこと', '公安の見回り', 'ユイのお父さんのこと', 'なんでもない'], { cancel: 3 });
          if (i === 0) await E.say('yui', '1Fの西棟に地下への階段があります。でも、防火シャッターで閉鎖されているはずです。電源を戻せば、きっと開きます。');
          else if (i === 1) {
            await E.say('yui', '外出禁止の見回りは、グリーン・ブロックの南までは来ません。……校則第14条にも、夜間外出の禁止はありますけど。');
            await E.say('yui:shy', '今夜だけは、見なかったことにします。');
          } else if (i === 2) {
            await E.say('yui:sad', '父は……あの研究所が閉鎖された年に、総督になりました。偶然だと、思いたいです。');
            await E.say('yui:serious', 'だから、わたしも知りたいんです。本当のことを。');
          } else await E.say('yui:smile', '気をつけて。……ニコさんのこと、ちゃんと守ってくださいね。');
        },
      },
    ],
  });

  async function breakfast() {
    E.set('c6_breakfast');
    E.cut(true);
    E.time('morning');
    cast('c6_ruu', 'ruu', 5, 6, 'up');
    cast('c6_niko', 'niko', 6, 6, 'up');
    await E.wait(10);
    await E.say('tome', 'おはよう、カナタ。……なんだい、そのクマは。ちゃんと寝てるのかい。');
    await E.move('player', [[14, 4], [9, 4], [9, 6], [7, 6]]);
    E.face('player', 'left');
    await E.say('niko:smile', 'カナタ、おはよ。……ラーメン、あさから、おかわり、した。');
    await E.say('ruu', 'ニコ、それ三杯目だからね。……あ、カナタ。あんた、ひどい顔。');
    await E.say('kanata', 'んー……ちょっと、夢見が悪くてさ。');
    E.face('player', 'up');
    await E.say('tome', 'まずは食いな。腹が減ってちゃ、悪い夢の続きしか見られないよ。');
    E.se('item');
    await E.say(null, 'ばあちゃん特製の朝ラーメン。あっさりした塩味が、寝不足の頭にしみる。');
    await E.say('kanata:think', '……なあ、ばあちゃん。ネオン通りのゲーセンにさ、昔から「レジェンド・モード」ってあるだろ。');
    await E.say('kanata', 'あのゴーストの記録、誰のか知ってる？ 名前のとこ、「J.H」としか出ないやつ。');
    E.emote('w_tome', '…');
    await E.wait(30);
    await E.say('tome', '……さあね。ばあちゃんはゲームのことはわかんないよ。');
    await E.say('tome', 'ほら、どんぶり下げな。今日は臨時休校なんだろ？ 外出禁止は夜だけさ、昼のうちに用事をすませておいで。');
    E.face('c6_ruu', 'right');
    await E.say('ruu:think', '（……今の間、なに？）');
    await E.say('kanata:serious', '（ばあちゃんがゲームのこと知らないわけない。毎週デュエルの中継見てるくせに）');
    await E.say('kanata', '……ルウ、ニコ。ちょっとゲーセン、付き合ってくれる？');
    await E.say('ruu:grin', 'いいけど。あんたが朝からゲーセン誘うとか、雪でも降るんじゃないの。……ニセモノの空だけど。');
    await E.say('niko:smile', 'ゲーセン！ ニコ、ネオンキャンディ、たべる。');
    E.remove('c6_ruu');
    E.remove('c6_niko');
    E.party(['ruu', 'niko']);
    E.time('day');
    E.objective('ネオン通りのゲーセン〈ギャラクシー〉へ行く');
  }

  // =============================================================
  //  2. ゲーセン〈ギャラクシー〉：レジェンド・モード
  // =============================================================
  G.addToMap('arcade', {
    npcs: [
      {
        id: 'c6_ponta', char: 'ponta', x: 16, y: 6, dir: 'down', move: 'still',
        show: () => is6() && !E.flag('c6_letter'),
        talk: async () => {
          if (!E.flag('c6_sim_done')) {
            await E.say('ponta', 'レジェンド・モードはいちばん左の筐体っす！ ゴーストは3秒で落とされるんで、覚悟っすよ！');
          } else {
            const i = await E.ask('ponta', 'カナタ……大丈夫っすか？', ['ハルカゼの調子を見てほしい', 'なんでもない'], { cancel: 1 });
            if (i === 0) {
              await E.say('ponta', '任せるっす！ ……データ上はバッチリ。改造ならドクのところでやってもらうっすよ。');
              E.heal();
              E.se('heal');
              E.toast('HP・ENが全回復した', '#7dff9a');
            } else await E.say('ponta:sad', 'オイラ、難しいことはわかんないっすけど……カナタのお父さんなら、きっといい人っす。だってカナタのお父さんっすもん。');
          }
        },
      },
    ],
    checks: [
      {
        x: 12, y: 4, w: 2, h: 2,
        show: () => is6() && E.flag('c6_breakfast') && !E.flag('c6_sim_done'),
        run: async () => await legendSim(),
      },
    ],
    onEnter: async () => {
      if (!is6() || !E.flag('c6_breakfast') || E.flag('c6_arcade_in')) return;
      E.set('c6_arcade_in');
      E.cut(true);
      E.emote('c6_ponta', '!');
      await E.say('ponta:grin', 'ぶっひゃー！ カナタ！ ルウ！ ニコちゃんも！ 臨時休校で、みんな考えることは同じっすね！');
      await E.say('kanata', 'ポンタ。……ちょうどよかった。レジェンド・モードのゴーストってさ、今も入ってる？');
      await E.say('ponta', 'もちろんっす！ 〈J.H〉のゴースト、筐体の稼働開始からずーっとランキング不動の1位っす！');
      await E.say('ponta', '三連ブーストからの反転斬り、通称「ミカヅキ」！ 当たり判定ギリギリを縫う変態機動っす！');
      await E.say('ruu:think', '三連ブースト……反転斬り？ それ、ミラージュの――');
      await E.say('kanata:serious', '……確かめたいんだ。オレ、あのゴーストと戦ってくる。');
      await E.say('niko', '……カナタ、こわい、かお、してる。');
      E.objective('いちばん左のシミュレーター筐体（レジェンド・モード）を調べる');
    },
  });

  async function legendSim() {
    E.cut(true);
    await E.say(null, 'AFシミュレーター〈ギャラクシー・パイロット〉。隠しコマンドを入れると、画面が青く染まった。');
    await E.say(null, '「LEGEND MODE ―― GHOST: J.H ―― RECORDED S.C.0078」');
    const i = await E.ask('kanata:serious', 'S.C.0078……。やるか。', ['挑む', 'まだやめておく'], { cancel: 1 });
    if (i !== 0) {
      await E.say('kanata', '……準備してからにしよう。');
      return;
    }
    await E.say('ruu', 'カナタ。勝っても負けても、ちゃんと見てるから。');
    E.se('boot');
    E.flash(10);
    E.cut(false);
    const won = await E.battle({
      map: 'c6_sim', x: 16, y: 15, dir: 'up', mech: true, mechId: G.state.mech.id,
      enemies: [{ type: 'nocturne', x: 16, y: 6, lv: 6, hp: 1700, boss: true, state: 'idle', name: 'レジェンド・ゴースト〈J.H〉', color: { body: '#9ad8ff', accent: '#4ef0ff', accent2: '#ffffff', frame: '#2a4a8a', eye: '#ffffff', wings: '#4ef0ff' } }],
      bgm: 'boss', title: 'SIMULATION', sub: 'レジェンド・ゴースト〈J.H〉を撃破せよ',
      win: 'boss', canLose: true,
      onStart: async () => {
        watch(() => { const b = bossOf(); return b && b.hp < b.maxhp * 0.55; }, async () => {
          await E.say('kanata:surprise', '（肩を落とした――来る！ 右、左、右……）');
          await E.say('kanata:serious', '（やっぱり同じだ。研究所で戦った、あいつと……！）');
        });
      },
      returnTo: ['arcade', 12, 6, 'up'],
    });
    E.cut(true);
    E.set('c6_sim_done');
    if (won) {
      await E.say(null, '「NEW RECORD!」　ランキングの1位が、「J.H」から「KANATA」に書きかわる。');
      await E.say('ponta:grin', 'ぶっひゃー！！ レジェンド撃破っす！ 稼働以来、初っすよ！？');
    } else {
      await E.say(null, '「GAME OVER」　……それでも、最後の一合で、ゴーストの動きは全部見えた。');
      await E.say('ponta', '惜しかったっす！ でもあの「ミカヅキ」をかわしたの、初めて見たっす！');
    }
    await E.say('kanata:think', '…………。');
    await E.say('ruu:serious', 'カナタ。今のゴースト……研究所のミラージュと、まったく同じ動きだった。');
    await E.say('niko:sad', '……この「おと」、しってる。くろいひとの、おと。……でも、もっと、あったかい。');
    if (!E.get('w2_manager')) cast('w2_manager', 'w2_manager', 2, 12, 'down');
    E.emote('w2_manager', '?');
    await E.move('w2_manager', [[2, 7], [10, 7], [10, 6]]);
    E.face('w2_manager', 'right');
    E.face('player', 'left');
    await E.say('w2_manager', 'おいおい、レジェンドを落としたのか、坊主。……そのゴースト、どこの誰のデータか教えてやろうか。');
    await E.say('w2_manager', '7年前、筐体を入れた日にな、ひとりの技術屋が「息子がいつか挑むから」って、自分の操縦データを入れてったのさ。');
    await E.say('w2_manager', '作業着で、スパナを腰にさげた男だった。……ちょうど、お前さんみたいにな。');
    await E.move('w2_manager', [[10, 7], [2, 7], [2, 12]]);
    await E.say('kanata:serious', '…………。');
    await E.say('ruu:sad', 'カナタ……。');
    await E.say('kanata:think', '……スパナを腰にさげた技術屋。J.H。春瀬ジン。');
    await E.say('kanata:serious', 'ミラージュの動きは、父さんの動きだ。');
    E.emote('f_niko', '…');
    await E.say('ruu:serious', '帰ろ。ばあちゃんに聞くしかないっしょ。あの人、絶対なにか知ってる。');
    E.time('evening');
    E.objective('星屑亭に帰って、ばあちゃんに話を聞く');
  }

  // =============================================================
  //  3. ばあちゃんの告白
  // =============================================================
  async function confession() {
    E.set('c6_confess');
    E.cut(true);
    E.time('night');
    E.party([]);
    E.hide('w_taxi');
    cast('c6_ruu', 'ruu', 8, 7, 'right');
    cast('c6_niko', 'niko', 10, 7, 'left');
    E.bgm('sad');
    await E.say(null, '閉店後の星屑亭。のれんを下ろす音だけが、やけに大きく聞こえた。');
    await E.move('player', [[7, 8], [9, 8]]);
    E.face('player', 'up');
    await E.say('kanata:serious', 'ばあちゃん。……レジェンド・モードのゴースト、父さんの記録だった。');
    await E.say('kanata:serious', 'それで、そのゴーストと、ミラージュの動きが、同じなんだ。');
    await E.move('w_tome', [[9, 4], [9, 6]]);
    E.face('w_tome', 'down');
    E.face('player', 'up');
    await E.say('tome', '…………そうかい。とうとう、たどり着いちまったかい。');
    await E.say('tome', 'カナタ。あんた、ジンは事故で「行方不明」だって聞かされてたろう。');
    await E.say('tome:sad', '本当はね、5年前、研究所から届いたのは「死亡通知」だったのさ。空っぽの棺と、勲章ひとつ。');
    E.emote('player', '!');
    await E.say('kanata:surprise', '……死んだ、ことに……？');
    await E.say('tome', '研究所の爆発事故。遺体は見つからない、機密だから詳しくは言えない……それで終わりさ。');
    await E.say('tome:angry', 'ふざけるんじゃないよって、総督府に怒鳴りこんでやったけどね。門前払いさ。');
    await E.say('tome:sad', 'だから、あんたには「行方不明」って言った。……死んだなんて、ばあちゃんも信じちゃいなかったからね。');
    const i = await E.ask('kanata:serious', '……ばあちゃん。', ['なんで黙ってたんだよ！', '…………', '父さんは、どんな人だった？'], {});
    if (i === 0) {
      await E.say('kanata:angry', 'なんで……なんで今まで黙ってたんだよ、ばあちゃん！');
      await E.say('tome:sad', '……言ったら、あんたは探しに行っちまうだろう。ジンとおんなじ顔してさ。');
      await E.say('tome', 'あんたまでいなくなったら、ばあちゃん、ラーメン作る相手がいなくなっちまうよ。');
    } else if (i === 1) {
      await E.say('kanata:sad', '…………。');
      await E.say('tome', '黙るとこまでジンそっくりだね、あんたは。……怒っていいんだよ。');
    } else {
      await E.say('tome:smile', 'バカだったよ。機械いじりのバカ。でもね、困ってる奴をほっとけない、大バカでもあった。');
      await E.say('tome', '研究所で、子どもたちを機械につなぐ実験が始まったって、怒ってた。……それが最後に聞いた言葉さ。');
    }
    E.emote('c6_niko', '…');
    await E.say('niko:sad', '……こども、きかいに、つなぐ……。');
    await E.say('ruu:serious', 'ニコ……。');
    await E.say('tome', 'それから、もうひとつ。……あんたたちには、ばあちゃんの昔話もしなきゃいけないね。');
    await E.say('tome', 'ほら、壁のあの写真。');
    E.camera(12, 1);
    await E.wait(40);
    await E.say(null, '色あせた写真。星のマークをつけた古いAFの前で、若い女の人がピースしている。');
    E.cameraReset();
    await E.say('tome:grin', 'あれ、ばあちゃんさ。軌道戦争のころ、同盟軍のAF乗りでね。「星屑のトメ」なんて呼ばれてた。');
    await E.say('ruu:surprise', 'はあ！？ ばあちゃんが、エースパイロット！？');
    await E.say('kanata:surprise', 'マジか……。じゃあハルカゼの改造のとき、やたら詳しかったのって……。');
    await E.say('tome:smile', '昔とった杵柄ってやつさ。ジンに操縦を教えたのも、ばあちゃんだよ。');
    await E.say('tome', '三連ブーストの反転斬り――「ミカヅキ」。あれはね、もともと、ばあちゃんの技さ。');
    E.emote('player', '!');
    await E.say('kanata:serious', '……ばあちゃんの技が、父さんに。父さんの記録が、オレに。');
    await E.say('tome', 'これ、持っておいき。写真の裏、見てごらん。');
    await E.give('photo', 1, { wait: true });
    await E.say(null, '写真の裏に、鉛筆の字。「星屑号と。S.C.0062」。その下に、もうひとつ、別の字で。');
    await E.say(null, '「母さん、カナタを頼む。　ジン」');
    await E.say('kanata:sad', '……父さんの、字だ。');
    await E.say('tome', 'ジンのIDカードも、遺品だって送られてきたよ。……研究所跡に行く気なんだろう。止めやしないさ。');
    await E.give('c6_jincard', 1, { wait: true });
    await E.say('tome', 'そのかわり、約束しな。……ちゃんと帰ってきて、ラーメン食べること。');
    await E.say('kanata:serious', '……うん。約束する。');
    await E.say('niko', 'ニコも、やくそく。ラーメン、たべに、かえる。');
    await E.say('ruu:smile', 'あたしも。……ばあちゃん、大盛りでね。');
    E.bgm('home');
    // ---- 翌日の夕方：ユイが来る ----
    await E.fadeOut(30);
    E.remove('c6_ruu');
    E.remove('c6_niko');
    E.time('evening');
    await E.wait(30);
    await E.say(null, '――翌日、夕方。');
    E.teleport('player', 10, 8, 'up');
    cast('c6_ruu', 'ruu', 10, 6, 'down');
    cast('c6_niko', 'niko', 12, 7, 'left');
    cast('c6_yui2', 'yui', 7, 10, 'up');
    E.hide('w_tome');
    await E.fadeIn(30);
    E.se('door');
    await E.say('yui', 'ごめんください。……あの、春瀬くん。少し、いいですか。');
    E.face('player', 'down');
    await E.say('kanata:surprise', '委員長！？ 外出禁止なのに、どうやって。');
    await E.say('yui:shy', '総督の娘ですから。……見回りのルートくらい、知ってます。');
    await E.move('c6_yui2', [[7, 8], [9, 8]]);
    E.face('c6_yui2', 'right');
    E.face('player', 'left');
    await E.say('yui:serious', 'ルウさんから聞きました。旧第2研究所のこと。……父の資料室に、これがありました。');
    await E.give('c6_blueprint', 1, { wait: true });
    await E.say('yui', '旧第2研究所の見取り図です。グリーン・ブロックの南、立入禁止区域の中。5年前の事故のあと、閉鎖されています。');
    await E.say('yui:sad', '……閉鎖を命じた書類に、父のサインがありました。');
    await E.say('ruu', 'ユイ……。');
    await E.say('yui:serious', 'わたしも、本当のことを知りたいんです。だから、これは校則違反じゃなくて……学級委員としての、協力です。');
    await E.say('kanata:smile', '……ありがと、委員長。助かる。');
    await E.say('yui', '地下に実験棟があるはずです。でも電源が落ちていて、防火シャッターが閉まったままだと思います。気をつけて。');
    await E.say('yui', 'わたしはここで、公安の無線を聞いておきます。……おばあさまにも、頼まれましたから。');
    E.remove('c6_yui2');
    E.remove('c6_ruu');
    E.remove('c6_niko');
    E.hide('w_tome', false);
    E.party(['ruu', 'niko']);
    E.set('c6_lab_go');
    E.reload();
    E.time('night');
    E.objective('グリーン・ブロック南の旧第2研究所へ（南の柵の破れた門）');
  }

  // ---- 寄り道：慰霊碑（ばあちゃんの告白のあと） ----
  G.addToMap('minato', {
    checks: [
      {
        x: 58, y: 10, w: 2,
        show: () => is6() && E.flag('c6_confess') && !E.flag('c6_memorial'),
        run: async () => {
          E.set('c6_memorial');
          E.cut(true);
          await E.say(null, '軌道戦争慰霊碑。「星の海に散った、すべての人々へ」。');
          await E.say(null, '台座の裏に、びっしりと名前が刻まれている。……そのいちばん端に、まだ新しい傷。誰かが彫りかけて、やめたような。');
          await E.say('kanata:think', '……「ハルセ」って、彫りかけてある。');
          await E.say('ruu:sad', 'ばあちゃん……かな。ジンさんの名前、刻もうとして……。');
          await E.say('kanata:serious', 'でも、やめたんだ。……信じてなかったから。死んだなんて。');
          await E.say('niko', 'ここ、しずか。……でも、たくさんの、こえ、ねむってる。');
          await E.say('niko:serious', 'ジンせんせいの、こえは、ここに、ない。……だから、いきてる。');
          await E.say('kanata:smile', '……ああ。そうだな、ニコ。');
          E.exp(120);
        },
      },
    ],
  });
  // ---- 寄り道：ドクのガレージ（告白のあと・決闘状の前） ----
  G.addToMap('doc_garage', {
    onEnter: async () => {
      if (!is6() || !E.flag('c6_confess') || E.flag('c6_challenge') || E.flag('c6_doc_pre')) return;
      E.set('c6_doc_pre');
      E.cut(true);
      await E.say('doc', '……トメから聞いたか。そういう顔をしとる。');
      await E.say('kanata', 'ドクも、知ってたんだな。父さんのこと。');
      await E.say('doc', 'ふん。知っとったのは、「死んだ証拠がない」ってことだけじゃ。……ワシも、トメも、それにすがって5年過ごした。');
      await E.say('doc', 'あの2番ハンガー、床に「ジン専用」と書いてあるじゃろう。消せんかった。消したら、本当に死んだことになる気がしてな。');
      await E.say('ruu:sad', 'ドク……。');
      await E.say('doc', '……行くなら、ハルカゼの面倒はワシが見る。若造、改造の用があれば言え。');
    },
  });

  // =============================================================
  //  4. グリーン・ブロック南の門
  // =============================================================
  G.addToMap('green', {
    objects: [
      { p: 'c6_gate', x: 38, y: 32, show: () => ch() >= 6, msg: '立入禁止区域への門。フェンスが破られて、くぐれるようになっている。' },
      { p: 'sign', x: 42, y: 31, text: 'KEEP OUT', col: '#c03a3a', show: () => ch() >= 6, msg: '「この先　コロニー総合研究所　第2研究棟　立入禁止」' },
    ],
    warps: [
      {
        x: 39, y: 32, to: 'c6_yard', tx: 2, ty: 15, dir: 'right',
        show: () => ch() >= 6,
        cond: () => E.flag('c6_lab_go') || ch() > 6,
        blocked: async () => {
          await E.say(null, 'フェンスの向こうは、真っ暗な立入禁止区域。……今は用がない。');
          await E.move('player', 'U');
        },
      },
    ],
    events: [
      {
        x: 36, y: 29, w: 6, h: 2, once: 'c6_gate_seen',
        cond: () => is6() && E.flag('c6_lab_go'),
        run: async () => {
          E.cut(true);
          E.camera(39, 31);
          await E.wait(20);
          await E.say('ruu', 'ここ？ 「立入禁止」。……ご丁寧に、フェンスは破られてるけど。');
          await E.say('kanata:think', '最近、誰かが通ったあとだ。草が踏まれてる。');
          await E.say('niko:sad', '……この先、ほしが、たくさん、ないてる。');
          await E.say('kanata:serious', '行こう。父さんが最後にいた場所だ。');
          E.cameraReset();
        },
      },
    ],
  });

  // =============================================================
  //  旧第2研究所・外構
  // =============================================================
  G.addToMap('c6_yard', {
    onEnter: async () => {
      if (!is6()) return;
      if (!E.flag('c6_yard_in')) {
        E.set('c6_yard_in');
        E.cut(true);
        await E.wait(20);
        E.camera(24, 8);
        await E.wait(30);
        await E.say(null, '月明かりのない夜空の下、骨のように白い建物が立っている。窓という窓は暗い。');
        await E.say('ruu', 'うわ……。肝試しには最高の場所じゃん。');
        await E.say('kanata', 'ルウ、こういうの平気なんだ。');
        await E.say('ruu:shy', '平気じゃないけど！？ ……あんたが平気そうだから、言っただけ。');
        E.cameraReset();
        await E.say('niko:sad', '……ニコ、ここ、しってる。しろいへや。つめたい、ゆか。');
        await E.say('kanata:serious', 'ニコ。無理しなくていいからな。……オレたちがいる。');
        await E.say('niko', '……うん。カナタ、ルウ、いる。だいじょうぶ。');
        E.objective('旧第2研究所に入る');
      } else if (E.flag('c6_challenge') && !E.flag('c6_duel_won')) await duel();
    },
    enemies: [
      { type: 'rat', x: 12, y: 18, lv: 8, show: () => is6() && !E.flag('c6_challenge') },
      { type: 'rat', x: 34, y: 22, lv: 8, show: () => is6() && !E.flag('c6_challenge') },
      { type: 'drone', x: 30, y: 16, lv: 8, show: () => is6() && !E.flag('c6_challenge') },
    ],
    items: [{ x: 45, y: 28, item: 'repair', id: 'c6_y1' }],
  });

  // =============================================================
  //  旧第2研究所 1F：ブレーカー
  // =============================================================
  const brkCount = () => ['c6_brk1', 'c6_brk2', 'c6_brk3'].filter((k) => E.flag(k)).length;
  async function breaker(k, where) {
    if (E.flag(k)) {
      await E.say(null, 'ブレーカーは「ON」になっている。');
      return;
    }
    if (F().enemies().some((e) => Math.hypot(e.x - F().player.x, e.y - F().player.y) < 110)) {
      await E.say('ruu', 'カナタ、後ろ！ 先にそいつら片づけて！');
      return;
    }
    E.cut(true);
    await E.say(null, where + 'の配電盤。レバーは「OFF」で錆びついている。');
    const sc = await E.timing({ title: 'ブレーカーを入れる', rounds: 2, speed: 1.5, zone: 0.22, labels: ['レバーをこじる！', '一気に押し上げる！'] });
    if (sc === 0) {
      await E.say('kanata', 'かった……！ もう一回だ。');
      await E.timing({ title: 'ブレーカーを入れる', rounds: 1, speed: 1.1, zone: 0.3, labels: ['力いっぱい！'] });
    }
    E.set(k);
    E.se('boot');
    E.reload();
    const n = brkCount();
    E.toast('ブレーカー ' + n + '/3', '#7dff9a');
    if (n < 3) {
      await E.say(null, 'ガコン、と重い音。どこかで非常灯がひとつ、緑に変わった。（' + n + '/3）');
      E.objective('ブレーカーを入れて電源を戻す（' + n + '/3）');
      return;
    }
    // 電源復旧
    E.set('c6_power');
    G.MAPS.c6_ruins1.light = '#6a6488';
    await E.say(null, 'ブウン……と低いうなり。研究所じゅうの照明が、まばらに灯りはじめた。');
    E.reload();
    E.shake(3, 20);
    E.se('door');
    await E.say('ruu', '西のほうで、なんか開いた音したよ！');
    await E.say('niko:think', '……した。……したから、こえ、する。');
    E.objective('西棟の階段から地下へ降りる');
  }

  G.addToMap('c6_ruins1', {
    onEnter: async () => {
      if (E.flag('c6_power')) G.MAPS.c6_ruins1.light = '#6a6488';
      if (!is6() || E.flag('c6_ruins_in')) return;
      E.set('c6_ruins_in');
      E.cut(true);
      await E.say(null, 'ガラスの割れた自動ドアをくぐる。ほこりと、焦げた電線のにおい。');
      await E.say('kanata:think', '真っ暗だ……。委員長の見取り図だと、地下への階段は西棟。防火シャッターで閉まってる、って。');
      await E.say('ruu', 'で、電源を戻せばいいわけね。ブレーカーは？');
      await E.say('kanata', 'サーバー室（西）、オフィス（東）、それと北の倉庫。3つ全部入れないと、主電源が戻らない。');
      await E.say('niko:sad', '……くらいの、きらい。……でも、ニコ、がんばる。');
      await E.say('ruu:smile', 'ほら、手。つないどけば、怖くないっしょ。');
      E.objective('ブレーカーを入れて電源を戻す（0/3）');
    },
    checks: [
      { x: 3, y: 13, run: async () => await breaker('c6_brk1', 'サーバー室') },
      { x: 36, y: 13, run: async () => await breaker('c6_brk2', 'オフィス') },
      { x: 25, y: 3, run: async () => await breaker('c6_brk3', '北倉庫') },
      { x: 6, y: 7, show: () => !E.flag('c6_power'), text: '防火シャッターが下りている。「非常電源喪失のため閉鎖中」の赤いランプが点滅している。' },
      { x: 33, y: 18, text: '生きている端末がひとつ。「主任研究員：H.クロイツ　副主任：J.ハルセ　――プロジェクト・エコー第2期」' },
      { x: 2, y: 6, text: '入退室記録の端末。最後の記録は5年前。「J.HARUSE　退室――未記録」' },
      { x: 9, y: 2, w: 2, text: '空の培養カプセル。ガラスに、小さな手のあとが残っている。' },
    ],
    events: [
      {
        x: 5, y: 8, w: 3, h: 1,
        cond: () => is6() && E.flag('c6_power') && !E.flag('c6_shutter_seen'),
        run: async () => {
          E.set('c6_shutter_seen');
          await E.say('kanata', 'シャッターが開いてる。この先が西棟……地下への階段だ。');
        },
      },
    ],
    enemies: [
      { type: 'drone', x: 10, y: 9, lv: 8, id: 'c6_e1_1' },
      { type: 'drone', x: 27, y: 9, lv: 8, id: 'c6_e1_2' },
      { type: 'turret', x: 6, y: 17, lv: 9, id: 'c6_t1' },
      { type: 'bot', x: 4, y: 18, lv: 8, id: 'c6_e1_3' },
      { type: 'bot', x: 7, y: 14, lv: 8, id: 'c6_e1_4' },
      { type: 'bot', x: 31, y: 15, lv: 8, id: 'c6_e1_5' },
      { type: 'bot', x: 34, y: 18, lv: 9, id: 'c6_e1_6' },
      { type: 'drone', x: 30, y: 19, lv: 8, id: 'c6_e1_7' },
      { type: 'turret', x: 18, y: 5, lv: 9, id: 'c6_t2' },
      { type: 'drone', x: 22, y: 4, lv: 9, id: 'c6_e1_8' },
      { type: 'bot', x: 20, y: 18, lv: 8, id: 'c6_e1_9' },
    ],
    items: [
      { x: 2, y: 19, item: 'repair', id: 'c6_r1a' },
      { x: 37, y: 20, item: 'energy', n: 2, id: 'c6_r1b' },
      { x: 26, y: 2, item: 'chip', id: 'c6_r1c' },
      { x: 10, y: 3, item: 'melonpan', n: 2, id: 'c6_r1d' },
    ],
  });

  // =============================================================
  //  旧第2研究所 B1：ニコの記憶・エコーの壁・父の手紙
  // =============================================================
  G.addToMap('c6_ruins2', {
    onEnter: async () => {
      if (!is6() || E.flag('c6_ruins2_in')) return;
      E.set('c6_ruins2_in');
      E.cut(true);
      E.bgm('sad');
      await E.say(null, '階段を降りきると、空気が変わった。冷たくて、かすかに甘い、薬品のにおい。');
      await E.say('niko:cry', '……っ。');
      E.emote('f_niko', '!');
      await E.say('ruu:surprise', 'ニコ！？');
      await E.say('niko:sad', '……ここ、ニコ、いた。……ずっと、いた。');
      await E.say('kanata:serious', 'プロジェクト・エコーの、実験棟……。');
      await E.say('ruu:angry', '……最っ低。こんなとこに、子どもを。');
      E.bgm('dungeon');
      await E.say('niko:serious', '……でも、ニコ、いく。みんなの、こえ、きこえる。……あっちで、よんでる。');
      E.objective('実験棟の奥を調べる');
    },
    events: [
      {
        x: 19, y: 12, w: 5, h: 4, once: 'c6_memory',
        cond: () => is6(),
        run: async () => await nikoMemory(),
      },
      {
        x: 31, y: 12, w: 3, h: 3,
        cond: () => is6() && !E.flag('c6_wall_open'),
        run: async () => {
          if (!E.flag('c6_memory')) {
            await E.say('niko:think', '……ひかりの、かべ。……まだ、ひらかない。まんなかの、カプセル、よんでる。');
            await E.move('player', 'L2');
            return;
          }
          await echoWall();
        },
      },
    ],
    checks: [
      { x: 38, y: 10, w: 2, run: async () => await jinDesk() },
      { x: 20, y: 9, text: '空のカプセル。プレートに「E-07」。……ニコが、ここにいた。' },
      { x: 2, y: 15, text: '端末。「被験体の夜間睡眠導入：子守唄プログラム再生中」……スピーカーが、ずっと壊れたまま歌おうとしている。' },
      { x: 20, y: 22, w: 2, text: '観測端末。「同調実験・第41回。被験体の脳波、別位相と一致。スターシード側からの応答……」その先は、黒く塗りつぶされている。' },
    ],
    enemies: [
      { type: 'echo', x: 15, y: 12, id: 'c6_e2_1', lv: 9, show: () => !E.flag('c6_letter') },
      { type: 'echo', x: 27, y: 11, id: 'c6_e2_2', lv: 9, show: () => !E.flag('c6_letter') },
      { type: 'echo', x: 16, y: 16, id: 'c6_e2_3', lv: 9, show: () => !E.flag('c6_letter') },
      { type: 'echo', x: 28, y: 16, id: 'c6_e2_4', lv: 10, show: () => !E.flag('c6_letter') },
      { type: 'echo', x: 18, y: 24, id: 'c6_e2_5', lv: 10, show: () => !E.flag('c6_letter') },
      { type: 'turret', x: 3, y: 13, lv: 9, id: 'c6_t3' },
    ],
    items: [
      { x: 11, y: 24, item: 'repair2', id: 'c6_r2a' },
      { x: 22, y: 25, item: 'energy', n: 2, id: 'c6_r2b' },
      { x: 42, y: 19, item: 'ramen', id: 'c6_r2c' },
    ],
  });

  async function nikoMemory() {
    E.cut(true);
    await E.say('niko', '……ここ。');
    await pin('f_niko', [[20, 10]], 'up');
    await E.say(null, 'ニコが、空のカプセルにそっと手を当てる。プレートには「E-07」。');
    await E.say('ruu:sad', 'ニコ……。');
    E.se('echo');
    E.flash(12);
    await E.wait(10);
    await E.cg('memory', '――白い部屋。冷たいカプセル。毎晩、知らない誰かの泣き声が聞こえた。');
    await E.cgCaption('でも、ひとりだけ。消灯のあとに、こっそりカプセルを叩いて、笑ってくれる人がいた。');
    await E.say('jin', '（よう。眠れないのか。……おじさんもだ。ここは、星の声がうるさいからな）', { name: '作業着の男' });
    await E.say('jin', '（番号で呼ばれるの、嫌だろう。……名前、つけてもいいかな）', { name: '作業着の男' });
    await E.say('jin', '（「ニコ」。にこにこ笑えるように、ニコ。……おじさんの息子とな、たぶん、気が合うと思うんだ）', { name: '作業着の男' });
    await E.cgCaption('その人は、いつも腰にスパナをさげていた。');
    E.cgOff();
    E.flash(8);
    await E.wait(20);
    await E.say('niko:cry', '……ジン、せんせい。');
    E.emote('player', '!');
    await E.say('kanata:surprise', '今……ジンって。');
    await E.say('niko:cry', 'ニコの、なまえ。……ジンせんせいが、くれた。にこにこ、わらえるように、って。');
    await E.say('niko:sad', 'ジンせんせい、いつも、スパナ、もってた。……カナタと、おなじ。');
    await E.say('kanata:sad', '……父さんが。ニコに、名前を……。');
    await E.say('ruu:sad', '……そっか。だからあんた、最初からカナタになついてたんだ。');
    await E.say('ruu', '……あたしもさ、施設にいたころ、夜中に急にいなくなる子がいたんだ。「いい里親が見つかった」って言われて。');
    await E.say('ruu:serious', 'まさか、ここに……なんて、考えたくないけど。');
    await E.say('niko:serious', '……あっちの、ひかりのかべ。いまなら、ひらける。カナタ、ペンダント、かして。');
    unpin();
    E.objective('ホールの奥、光の壁へ');
  }

  async function echoWall() {
    E.cut(true);
    await E.say('niko', 'カナタ、ペンダント、もって。ニコと、いっしょに、きいて。');
    await E.say('kanata', '……星の声を、か。やってみる。');
    E.se('charge');
    const sc = await E.timing({ title: 'エコー共鳴', rounds: 3, speed: 1.4, zone: 0.2, labels: ['こえを、きく', 'こえを、あわせる', 'こえを、とどける'] });
    E.se('echo');
    E.flash(14);
    G.fx.ring(34 * 16 + 8, 13 * 16, 60, '#bff8ff');
    E.set('c6_wall_open');
    E.reload();
    if (sc >= 2) await E.say('niko:smile', '……とどいた。カナタの、おと、きれい。');
    else await E.say('niko', '……ちょっと、ずれた。でも、ひらいた。');
    await E.say('ruu', '光の壁が……消えた。この奥、部屋になってる。');
    E.objective('奥の部屋を調べる');
  }

  async function jinDesk() {
    if (E.flag('c6_letter')) {
      await E.say(null, 'ジンの机。引き出しは空っぽだ。');
      return;
    }
    E.cut(true);
    await E.say(null, '使いこまれた机。マグカップ、設計図の束、そして、小さな男の子の写真。');
    await E.say('kanata:sad', '……オレだ。5歳くらいの。');
    await E.say(null, '引き出しに、4ケタの暗証番号つきの鍵がかかっている。');
    for (;;) {
      const i = await E.ask(null, '暗証番号は？', ['0712', '0062', '0091', 'わからない'], { cancel: 3 });
      if (i === 0) break;
      if (i === 3) {
        await E.say('ruu:think', '壁に子どもの絵が貼ってあったよね。「カナタ 5さい 7がつ12にち」って書いてあった。……誕生日、じゃない？');
        continue;
      }
      E.se('buzz');
      await E.say(null, 'ビーッ。……違うようだ。');
    }
    E.se('door');
    await E.say(null, 'カチリ。引き出しの中に、封筒がひとつ。表に「カナタへ」。');
    await E.give('letter', 1, { wait: true });
    E.bgm('sad');
    await E.say(null, '――カナタへ。');
    await E.say('jin', 'この手紙を読んでいるなら、父さんはたぶん、約束を守れなかったんだと思う。ごめんな。', { name: '父の手紙' });
    await E.say('jin', '研究所でやっていることが、怖くなった。星の声を聞く子どもたちを、機械につなぐ研究だ。父さんはそれを止めたい。', { name: '父の手紙' });
    await E.say('jin', '止められなかったら、きっと父さんは帰れない。でも、ここにいる子どもたちを、見なかったことにはできないんだ。', { name: '父の手紙' });
    await E.say('jin', 'ハルカゼの設計図の最後のページは、ドクに預けた。いつか、お前が乗る日のために。', { name: '父の手紙' });
    await E.say('jin', '空がニセモノでも、そこで笑ってる人たちは本物だ。だから、守れ。', { name: '父の手紙' });
    await E.say('jin', 'お前はいつも「なんとかなるって」と言うな。父さんもそう思う。――なんとかする奴が、いればな。', { name: '父の手紙' });
    await E.say(null, '――父さんより。');
    await E.say('kanata:cry', '…………っ。');
    await E.say('ruu:sad', '……カナタ。');
    await E.say('kanata:cry', '……父さん、逃げたんじゃなかった。ニコたちを、助けようとして……。');
    await E.say('niko:sad', 'ジンせんせい、やさしかった。ずっと、やさしかった。');
    E.set('c6_letter');
    // ---- ミラージュ ----
    E.stopBgm();
    await E.wait(30);
    E.se('echo');
    E.emote('f_niko', '!');
    await E.say('niko:surprise', '――くる。くろいひと！');
    cast('c6_mirage', 'mirage', 38, 17, 'up');
    E.flash(8);
    E.bgm('mirage');
    E.face('player', 'down');
    E.camera(38, 13);
    await E.wait(20);
    await E.say('mirage', '…………。');
    await E.say('ruu:angry', 'ミラージュ……！ あんた、いつから！');
    await E.move('c6_mirage', 'U2');
    await E.say('mirage', '……ここは、お前たちの来る場所ではない。');
    await E.say('kanata:serious', '……その声。その立ち方。……肩を落とすクセ。');
    await E.say('kanata:serious', 'あんた、父さんなんだろ。春瀬ジン。');
    E.emote('c6_mirage', '…');
    await E.wait(40);
    await E.say('mirage', '…………知らない、名だ。');
    await E.say('mirage', '……ぐ……っ。', { expr: 'angry' });
    E.shake(2, 20);
    await E.say(null, '仮面の奥で、赤い光が脈打つ。ミラージュは、こめかみを押さえてよろめいた。');
    await E.say('niko:cry', 'いたい、って、いってる。……くろいひとの、なか、ジンせんせいが、ないてる！');
    await E.say('mirage', '……ハルカゼの、パイロット。', { expr: 'serious' });
    await E.say(null, 'ミラージュが、一通の封筒を床に投げた。');
    await E.say('mirage', '……決着を、つける。それが……命令だ。');
    E.flash(12);
    E.se('dash');
    E.remove('c6_mirage');
    await E.wait(20);
    E.cameraReset();
    await E.give('c6_duel', 1, { wait: true });
    await E.say(null, '「ハルカゼのパイロットへ。明晩零時、旧第2研究所演習場にて待つ。――M」');
    await E.say('ruu:angry', '決闘状って……。ふざけてんの！？');
    await E.say('kanata:serious', '……いや。行くよ。');
    await E.say('kanata:serious', 'あの仮面が、父さんを操ってるなら。ぶっ壊して、連れて帰る。');
    await E.say('niko:serious', 'ニコも、いく。ジンせんせい、たすける。');
    await E.say('ruu', '……当然、あたしもね。いったん帰って、作戦会議しよ。');
    await E.fadeOut(30);
    await E.warp('hoshikuzu', 7, 9, 'up');
  }

  // =============================================================
  //  5. 決闘前夜（星屑亭）
  // =============================================================
  async function challengeNight() {
    E.set('c6_challenge');
    E.cut(true);
    E.party([]);
    E.hide('w_taxi');
    E.time('night');
    cast('c6_ruu', 'ruu', 6, 6, 'up');
    cast('c6_niko', 'niko', 8, 6, 'up');
    cast('c6_doc', 'doc', 11, 7, 'left');
    E.bgm('tension');
    await E.say('tome', '……おかえり。三人とも、無事だね。');
    await E.move('player', [[7, 7]]);
    E.face('player', 'up');
    await E.say('kanata', 'ばあちゃん。父さんの手紙、見つけた。……それと、ミラージュから、決闘状。');
    await E.say('tome', '……そうかい。');
    await E.say('doc', 'ふん。ワシも呼ばれたわけが、ようやくわかったわい。', {});
    E.face('player', 'right');
    await E.say('kanata:surprise', 'ドク！？');
    await E.say('doc', 'トメに呼ばれてな。……ジンの手紙、見せてみい。');
    await E.say(null, 'ドクは片眼鏡を光らせて手紙を読み、しばらく黙っていた。');
    await E.say('doc', '……「設計図の最後のページ」か。ああ、預かっとる。ジンの奴、5年前、ワシのガレージに置いていきおった。');
    await E.say('doc', 'ハルカゼの、本当の完成形――〈ハルカゼ改〉の設計図だ。だがな、若造。今のお前さんには、まだ早い。');
    await E.say('kanata', 'なんでだよ。');
    await E.say('doc', '機械は嘘をつかん。……乗る奴の覚悟が決まらんうちに組んでも、ガラクタにしかならんのさ。');
    await E.say('tome', 'カナタ。明日の夜、ジンと戦うことになる。……殴りあってでも、連れ戻す覚悟はあるかい。');
    const i = await E.ask('kanata:serious', '……覚悟。', ['ある', '……わからない。でも、行く'], {});
    if (i === 0) await E.say('kanata:serious', 'ある。……父さんにだって、負けない。');
    else await E.say('kanata:sad', 'わかんない。父さんと戦うとか、全然。……でも、行かなきゃ、絶対に後悔する。');
    await E.say('tome:smile', 'それでいい。ジンもね、昔、同じ顔して出ていったよ。');
    await E.say('tome', 'それと、ひとつだけ。「ミカヅキ」はね、肩を落とした瞬間、左に半歩ずれな。それで最後の斬りは空を切る。');
    await E.say('kanata:surprise', '……ばあちゃん、それ、ゲーセンでも誰も知らない攻略法だぞ。');
    await E.say('tome:grin', '技を作った本人だよ？ 弱点くらい知ってるさ。');
    await E.say('ruu:grin', 'ばあちゃん、かっこよすぎでしょ……。');
    await E.say('doc', 'ハルカゼの整備は、ワシのガレージでやっておく。出発の前に寄っていけ、若造。');
    await E.say('niko', 'ニコ、ねる。……あした、ジンせんせい、たすける、から。');
    await E.fadeOut(30);
    E.remove('c6_ruu');
    E.remove('c6_niko');
    E.remove('c6_doc');
    await E.wait(30);
    await E.say(null, '――そして、翌日の夜。');
    E.party(['ruu', 'niko']);
    E.teleport('player', 7, 9, 'down');
    E.heal();
    await E.fadeIn(30);
    E.bgm('home');
    await E.say('tome', 'いってきな。……帰ってきたら、いちばんうまいラーメン作って待ってるよ。');
    E.objective('準備ができたら、旧第2研究所の演習場へ（ドクのガレージで整備も）');
  }

  // ドクのガレージ：決闘前の整備（任意）
  G.addToMap('doc_garage', {
    onEnter: async () => {
      if (!is6() || !E.flag('c6_challenge') || E.flag('c6_doc_tune')) return;
      E.set('c6_doc_tune');
      E.cut(true);
      await E.say('doc', '来たか、若造。ハルカゼは仕上げておいたぞ。');
      await E.say('doc', '関節の遊びを詰めて、ブーストの立ち上がりを0.2秒早くした。……ジンのクセに、ついていけるようにな。');
      await E.say('kanata', 'ドク……父さんのクセ、知ってたの？');
      await E.say('doc', 'ふん。あいつの機体を何年整備したと思っとる。……機械は嘘をつかん。乗り手のクセは、関節のすり減り方に全部出る。');
      await E.say('doc', 'ネジ、お前も見送ってやれ。');
      await E.say('neji', 'ニャ……ギギ。');
      if (G.state.mech.boost < 5) {
        G.state.mech.boost++;
        E.se('levelup');
        await E.notice('ハルカゼの推力が上がった！（推力Lv' + G.state.mech.boost + '）');
      }
      E.heal();
      await E.say('doc', 'ほかに改造したけりゃ、いつものように言え。……生きて帰ってこい。ジンもつれてな。');
    },
  });

  // =============================================================
  //  ノクターン戦
  // =============================================================
  async function duel() {
    E.cut(true);
    E.stopBgm();
    E.party([]);
    cast('c6_ruu', 'ruu', 4, 14, 'right');
    cast('c6_niko', 'niko', 4, 16, 'right');
    E.teleport('player', 6, 15, 'right');
    await E.wait(20);
    cast('c6_noc', 'sys', 26, 17, 'left', { mech: 'nocturne', noFace: true });
    cast('c6_mirage', 'mirage', 24, 17, 'left');
    E.camera(22, 16);
    await E.wait(40);
    E.bgm('mirage');
    await E.say(null, '零時。演習場の真ん中に、黒い機体が膝をついている。その前に、仮面の男がひとり。');
    await E.move('player', 'R6');
    await E.say('mirage', '……来たか。');
    await E.say('kanata:serious', '来たよ。……父さんを、迎えに。');
    await E.say('mirage', '……その名で、呼ぶな。……頭が、割れる。');
    const i = await E.ask('kanata:serious', '（ルウとニコは後ろにいる。決闘状には「ひとりで」とは書いていなかった）', ['みんなで戦う', 'オレひとりでやる'], {});
    const together = i === 0;
    E.set('c6_duel_together', together);
    if (together) {
      await E.say('kanata', 'ルウ。……いっしょに来てくれ。');
      await E.say('ruu:grin', '言われなくても。ローズハウンド、とっくに外に待たせてあるっての。');
      E.se('boost');
      E.flash(6);
      await E.say(null, '――そのとき、夜空を白い光が裂いた。');
      cast('c6_zeph', 'sys', 12, 12, 'right', { mech: 'zephyr', noFace: true });
      E.se('mechstep');
      E.shake(4, 16);
      await E.wait(20);
      await E.say('sig', '……間に合いましたね。', { name: 'シグ（ゼフィール）' });
      await E.say('ruu:surprise', 'シグ！？ あんた、どこ行ってたのよ！');
      await E.say('sig', 'ミラージュとは、僕にも因縁があります。……それに、この夜は、僕の知っている夜と違う結末にしたい。');
      await E.say('kanata:smile', '……ありがとな、シグ。');
    } else {
      await E.say('kanata:serious', 'ルウ、ニコ。……悪い。これは、オレがやらなきゃいけない。');
      await E.say('ruu:angry', 'はあ！？ ……バカじゃないの。');
      await E.say('ruu:sad', '……わかったよ。そのかわり、負けたら一生ラーメンおごりだからね。');
      await E.say('niko', 'カナタ。ニコ、ここで、ずっと、きいてる。');
    }
    await E.say('mirage', '……ノクターン、起動。');
    E.move('c6_mirage', 'R2', { noWait: true });
    await E.wait(30);
    E.remove('c6_mirage');
    E.se('boot');
    await E.say('kanata:serious', 'ハルカゼ！');
    E.cameraReset();
    await E.mech(true, 'harukaze');
    await E.say('kanata:serious', '――いくぞ、父さん！');
    E.remove('c6_noc');
    E.remove('c6_zeph');
    const allies = together
      ? [
          { mech: 'rose', x: 10, y: 22, dmg: 24, col: '#ff9ac8', name: 'ローズハウンド' },
          { mech: 'zephyr', x: 10, y: 14, dmg: 26, col: '#7dff9a', name: 'ゼフィール' },
        ]
      : [];
    E.cut(false);
    const won = await E.battle({
      map: 'c6_yard', x: 16, y: 20, dir: 'right', mech: true, mechId: 'harukaze',
      enemies: [{ type: 'nocturne', x: 28, y: 18, lv: 9, hp: together ? 3600 : 3000, boss: true, state: 'idle', name: 'ノクターン（ミラージュ）' }],
      allies,
      bgm: 'mirage', title: 'DUEL', sub: '黒い仮面のエース〈ノクターン〉',
      win: 'boss',
      onStart: async () => {
        watch(() => { const b = bossOf(); return b && b.hp < b.maxhp * 0.7; }, async () => {
          await E.say('kanata:serious', '（肩が落ちた――左に、半歩！）');
          await E.say('mirage', '……！？ なぜ、それを……。');
        });
        watch(() => { const b = bossOf(); return b && b.hp < b.maxhp * 0.35; }, async () => {
          await E.say('kanata:angry', '父さん！ 目ぇ覚ませよ！ オレだよ、カナタだ！');
          await E.say('mirage', '……カ、ナ……タ……。う、あああっ！');
          if (together) await E.say('ruu:serious', 'カナタ、押しきって！ あたしたちが道を作る！');
          else await E.say('niko:serious', '（……カナタの、こえ、とどいてる。もうすこし！）');
        });
      },
    });
    if (!won) return;
    E.set('c6_duel_won');
    await maskBreak(together);
  }

  async function maskBreak(together) {
    E.cut(true);
    await E.mech(false);
    E.party([]);
    E.teleport('player', 20, 18, 'right');
    cast('c6_noc', 'sys', 25, 18, 'left', { mech: 'nocturne', noFace: true });
    cast('c6_hk', 'sys', 17, 17, 'right', { mech: 'harukaze', noFace: true });
    cast('c6_ruu', 'ruu', 15, 20, 'right');
    cast('c6_niko', 'niko', 16, 21, 'right');
    E.camera(22, 18);
    E.bgm('mirage');
    await E.wait(30);
    E.shake(4, 30);
    E.se('explode');
    await E.say(null, 'ノクターンが、火花を散らして膝をつく。コクピットハッチが、軋みながら開いた。');
    cast('c6_mirage', 'mirage', 24, 18, 'left');
    await E.wait(20);
    await E.say('mirage', '……まだ、だ。……任務を……。');
    await E.move('c6_mirage', 'L2');
    await E.say('kanata:serious', 'もう、いいだろ！');
    await E.move('player', 'R');
    await E.say('mirage', '……退け……！');
    E.se('swing');
    E.flash(4);
    E.shake(3, 10);
    await E.say(null, 'ミラージュの拳を、カナタは避けなかった。');
    await E.say('kanata:angry', '……っ、効かねえよ。ばあちゃんのゲンコツのほうが、ずっと痛え。');
    await E.say('niko:serious', 'カナタ！ ペンダント！ ニコの、こえと、あわせて！');
    await E.move('c6_niko', [[18, 21], [19, 19]]);
    E.se('charge');
    const sc = await E.timing({ title: '仮面の声を、かき消せ', rounds: 3, speed: 1.6, zone: 0.18, labels: ['ニコの声をきく', 'エコーを重ねる', '父さんにとどけ！'] });
    E.se('echo');
    G.fx.ring(21 * 16 + 8, 18 * 16, 70, '#bff8ff');
    E.flash(16);
    E.shake(6, 30);
    await E.wait(20);
    if (sc < 2) await E.say('kanata:angry', '届けえええっ！！');
    E.se('bigexplode');
    E.flash(20);
    await E.say(null, '――パキン。');
    await E.say(null, '乾いた音を立てて、黒い仮面に一本のひびが走り……砕け散った。');
    E.remove('c6_mirage');
    cast('c6_jin', 'jin', 22, 18, 'left');
    E.stopBgm();
    await E.wait(40);
    await E.say('jin', '…………。');
    E.bgm('sad');
    await E.say('jin', '……ここ、は……。俺は、なにを……。');
    await E.say('kanata:sad', '……父さん。');
    E.face('c6_jin', 'player');
    await E.wait(40);
    await E.say('jin', '……カナ、タ……？');
    await E.say('jin', '…………大きくなったな、カナタ。');
    await E.say('kanata:cry', '……っ、遅えよ……！ 5年だぞ……！');
    await E.move('player', 'R');
    E.emote('c6_jin', '…');
    await E.say('jin', 'ああ。……遅くなった。本当に、すまない。');
    await E.say('jin', '仮面をつけられてからのことは、霧の中みたいだ。……だが、お前と戦ったことは、覚えてる。');
    await E.say('jin', '「ミカヅキ」を、左半歩でかわしたな。……母さんの入れ知恵だろう。');
    await E.say('kanata:cry', '……へへ。ばあちゃん、技作った本人だから、弱点知ってるって。');
    await E.say('jin', '……変わらないな、あの人は。');
    await E.move('c6_niko', [[21, 19]]);
    await E.say('niko:cry', '……ジン、せんせい。');
    E.face('c6_jin', 'c6_niko');
    await E.say('jin', '……E-07。いや……ニコ、か。……生きていてくれたんだな。');
    await E.say('niko:cry', 'うん。……ニコ、にこにこ、わらえるように、なった。カナタと、ルウの、おかげ。');
    await E.say('jin', '……そうか。……そうか。');
    await E.say('ruu:smile', '……あたし、席外したほうがいい空気？');
    await E.say('kanata:smile', 'いいよ、ルウもいて。……父さん、こいつ、ルウ。オレの――');
    await E.say('ruu:shy', 'クラスメイト！ ただのクラスメイト！ ……水無月ルウです。');
    await E.say('jin', 'ふふ。……カナタが世話になってるみたいだな。');
    if (together) {
      cast('c6_sig', 'sig', 12, 16, 'right');
      await E.move('c6_sig', 'R4');
      await E.say('sig', '……春瀬ジン博士。はじめまして。いえ……僕にとっては「お久しぶりです」ですね。');
      await E.say('jin', '……君は……その目。まさか、記録の……。');
      await E.say('sig', '話は、安全な場所で。……公安の巡回が来ます。');
    } else {
      await E.say('jin', '……ここは危ない。ノクターンの信号は、研究所に届いている。すぐに追っ手が来るぞ。');
    }
    await E.say('kanata', '帰ろう、父さん。ばあちゃんが、ラーメン作って待ってる。');
    await E.say('jin', '……母さんのラーメン、か。5年ぶりだな。');
    E.set('c6_jin_freed');
    E.set('met_jin');
    await E.fadeOut(40);
    E.cameraReset();
    E.party(['ruu', 'niko']);
    await E.warp('hoshikuzu', 7, 9, 'up');
  }

  // =============================================================
  //  6. ジンの告白（星屑亭）
  // =============================================================
  async function jinTalk() {
    E.set('c6_jin_talk');
    E.cut(true);
    E.party([]);
    E.hide('w_taxi');
    E.time('night');
    cast('c6_jin', 'jin', 4, 6, 'up');
    cast('c6_ruu', 'ruu', 6, 6, 'up');
    cast('c6_niko', 'niko', 8, 6, 'up');
    cast('c6_doc', 'doc', 11, 7, 'left');
    E.teleport('player', 7, 8, 'up');
    E.bgm('sad');
    await E.wait(20);
    E.emote('w_tome', '!');
    await E.say('tome', '…………ジン。');
    await E.say('jin', '……ただいま、母さん。');
    await E.wait(30);
    await E.say('tome:angry', 'こ……のっ、大バカ息子がっ！');
    E.se('hit');
    E.shake(4, 10);
    await E.say(null, 'ゴツン。カウンター越しに、見事なゲンコツが入った。');
    await E.say('jin', 'いっ……てえ。……変わらないな。');
    await E.say('tome:cry', '5年だよ……！ 空っぽの棺に、どんな顔して手ぇ合わせてたと思ってんだい……！');
    await E.say('tome:cry', '…………おかえり、ジン。');
    await E.say('tome', '……まずは食いな。話はそれからだよ。');
    E.se('item');
    await E.wait(30);
    await E.say(null, '湯気の立つどんぶりが、カウンターに並ぶ。ジンは、何も言わずにスープを飲み干した。');
    await E.say('jin', '……うまい。');
    await E.say('niko:smile', 'ジンせんせい、ラーメン、すき？ ニコも、だいすき。');
    await E.say('jin', 'ああ。世界でいちばんうまいラーメンだ。');
    E.bgm('tension');
    await E.say('jin', '……さて。話さなきゃならないことが、山ほどある。');
    await E.say('jin', '俺をミラージュにしたのは、ドクター・ヘルミナ・クロイツ。研究所の主任で、プロジェクト・エコーの責任者だ。');
    await E.say('jin', '5年前、俺は実験を止めようとして、研究所のデータを持ち出そうとした。……捕まって、あの神経マスクをつけられた。');
    await E.say('doc', 'ふん。爆発事故ってのは、口封じの芝居だったわけか。');
    await E.say('jin', 'ヘルミナの目的は、コロニーの中心核に封印された〈スターシード〉だ。');
    await E.say('jin', 'あの結晶は、エコーの子どもたちと共鳴して、「あり得たかもしれない別の世界」への扉を開く。');
    await E.say('jin', 'ヘルミナは、それを完全に開放するつもりだ。……世界そのものを、「戦争が起きなかった世界」に書き換えるために。');
    await E.say('jin', '――ゼロ・リライト計画。');
    await E.say('ruu', '戦争がなかった世界……？ それって、悪いことなの？');
    await E.say('jin', '書き換わった世界に、今のこの世界は残らない。クレイドル7も、ここに住む人たちも……全部、なかったことになる。');
    await E.say('kanata:surprise', '……！');
    await E.say('jin', 'ヘルミナは、戦争で娘を亡くしている。……あの人にとって、この世界は、娘のいない世界なんだ。');
    await E.say('tome:sad', '……親が子を亡くすってのは、そういうことさ。わからないでもないよ。……許せやしないけどね。');
    await E.say('jin', 'そして、計画には「鍵」がいる。強いエコーを持つ子ども――ニコのような子だ。');
    await E.say('niko:sad', '……ニコ、かぎ……。');
    await E.say('ruu:angry', 'させない。ニコは、ニコでしょ。鍵とか、知らない。');
    // ---- シグ ----
    E.se('door');
    cast('c6_sig', 'sig', 7, 10, 'up');
    await E.say('sig', '……それだけじゃありません。');
    E.face('player', 'down');
    await E.move('c6_sig', [[9, 10], [9, 8]]);
    E.face('c6_sig', 'left');
    await E.say('ruu:surprise', 'シグ！');
    await E.say('jin', '……やはり、君か。研究所の記録で見た。被験体記録の日付は、S.C.0091。……未来の日付だ。');
    await E.say('sig', 'はい。僕は、六年後の世界から来ました。……いいえ、正確には、「この世界がたどったかもしれない、別の未来」から。');
    await E.say('sig', '僕の世界でも、ヘルミナ博士はゼロ・リライトを実行しました。そして――失敗した。');
    await E.say('sig', 'スターシードは暴走し、書き換えは中途半端に止まった。コロニーの回転制御が壊れて……。');
    await E.say('sig', '……僕の世界では、クレイドル7は落ちた。');
    await E.wait(40);
    await E.say('kanata:surprise', '……落ちた、って……。');
    await E.say('sig', '空が、落ちてきたんです。ミラーが割れて、街が、向こう側の街に向かって……。');
    await E.say('sig', '僕はそのとき、スターシードの光に呑まれて、この世界にたどり着きました。');
    await E.say('sig', '「この世界の空は、まだ落ちていない」――ずっとそう言っていたのは、そういう意味です。');
    await E.say('sig', '……今度は、落とさない。');
    await E.say('doc', 'ふん……。ラーメン屋の座敷で聞く話じゃないのう。');
    await E.say('tome', '……どこで聞いたって、重い話さ。');
    await E.say('jin', 'ヘルミナは、俺が解放されたことに気づいたはずだ。計画は、早まる。');
    await E.say('jin', 'カナタ。……すまない。お前たちを巻きこむつもりはなかった。だが――');
    await E.say('kanata:serious', 'いいよ、父さん。もう巻きこまれてるし。……それに。');
    await E.say('kanata:serious', '父さんの手紙に書いてあった。空がニセモノでも、そこで笑ってる人たちは本物だって。');
    await E.say('kanata:smile', 'なんとかなるって。……なんとか、するよ。オレたちで。');
    await E.say('jin', '…………ああ。そうだな。');
    await E.say('niko', 'ニコも。');
    await E.say('ruu:grin', 'あたしも。……シグ、あんたもでしょ。');
    await E.say('sig', '……はい。');
    await E.say('tome', 'よし。じゃあ今夜はもう寝な。……カナタ、ルウちゃん。ちょっと夜風に当たってきてもいいよ。顔に書いてある。');
    await E.fadeOut(30);
    ['c6_jin', 'c6_ruu', 'c6_niko', 'c6_doc', 'c6_sig'].forEach((id) => E.remove(id));
    await rooftop();
  }

  // =============================================================
  //  屋上の夜（カナタとルウ）
  // =============================================================
  async function rooftop() {
    E.party([]);
    E.time('night');
    await E.warp('rooftop', 17, 12, 'up', { noEnter: true });
    E.cut(true);
    E.stopBgm();
    ['w2_tenmon', 'w2_napper', 'w2_guitar'].forEach((id) => E.hide(id));
    cast('c6_ruu', 'ruu', 18, 11, 'up');
    E.teleport('player', 16, 11, 'up');
    await E.cg('rooftop_night', '――真夜中の、第三中学校の屋上。');
    E.bgm('sad');
    await E.say('ruu', '……忍びこむの、慣れてきたね、あたしたち。');
    await E.say('kanata', 'ユイにばれたら、校則第何条だろうな。');
    await E.say('ruu:smile', '全部じゃない？');
    await E.cgCaption('見上げれば、向こう側の街の灯り。ミラーのすき間から、ほんの少しだけ、本物の星が見えた。');
    await E.say('ruu', '……よかったじゃん。父さん、帰ってきて。');
    await E.say('kanata', 'うん。……なんか、まだ実感ない。');
    await E.say('ruu', 'あたしさ、親の顔、知らないんだ。施設の前に置かれてたの。赤ちゃんのとき。');
    await E.say('ruu:sad', 'だから、あんたが父さんって呼んでるの見て、ちょっとだけ……うらやましかった。……ちょっとだけね。');
    const i = await E.ask('kanata', '……。', ['ルウも、うちの家族みたいなもんだろ', '……オレ、何て言えばいい？', '（黙って隣に座る）'], {});
    if (i === 0) {
      await E.say('kanata:smile', 'ルウだって、もう星屑亭の家族みたいなもんだろ。ばあちゃん、ルウの分のどんぶり、勝手に買い足してたぞ。');
      await E.say('ruu:shy', '……っ、なにそれ。……ずるいでしょ、そういうの。');
      E.set('c6_roof_family');
    } else if (i === 1) {
      await E.say('kanata:sad', '……ごめん。オレ、こういうとき、何て言えばいいかわかんない。');
      await E.say('ruu:smile', 'いいよ、何も言わなくて。……そういうとこ、あんたのいいとこ。');
    } else {
      await E.say(null, 'カナタは何も言わず、ルウの隣に腰をおろした。肩が、少しだけ触れた。');
      await E.say('ruu:shy', '…………バカ。');
    }
    await E.say('ruu', 'ねえ、カナタ。シグの世界では、この空が落ちたんだって。');
    await E.say('ruu', 'あたし、ずっと「こんなニセモノの空」って思ってた。……でも、落ちたら嫌だなって、今、思った。');
    await E.say('kanata', '……オレも。');
    await E.say('ruu:serious', '本物の空、いつか見に行くけどさ。……帰ってくる場所は、ここがいい。');
    await E.say('kanata:smile', 'じゃあ、守らなきゃな。ここ。');
    await E.say('ruu:grin', '……うん。約束。');
    // ---- 異変 ----
    E.stopBgm(2);
    await E.wait(40);
    E.se('quake');
    E.shake(6, 50);
    await E.cgCaption('――そのとき。空の向こうで、ミラーの一枚が、ぎしりと軋んだ。');
    E.cgOff();
    E.tint('rgba(120,0,40,0.18)');
    E.se('alarm');
    await E.say('mother:angry', 'ピ……ガ……。……クレイドル7ノ、皆サン。オヤスミナサイ。', { name: 'マザー' });
    await E.say('mother:angry', '…………コレヨリ、全テヲ、書キ換エマス。', { name: 'マザー' });
    await E.say('ruu:surprise', 'マザーの声……！？ 今の、なに……！');
    await E.say('kanata:serious', '……始まったんだ。ヘルミナが、動いた。');
    E.tint(null);
    E.remove('c6_ruu');
    ['w2_tenmon', 'w2_napper', 'w2_guitar'].forEach((id) => E.hide(id, false));
    await E.fadeOut(40);
    await E.startChapter(7);
  }
})();
