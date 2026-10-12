// =============================================================
//  story/ch8.js — 第8章「星の歌」
//  宇宙港から出撃 → L4宙域（機体）→ ミラー施設（生身）→ 中心軸（機体）
//  → 中心核：ヘルミナとの対話 → 最終決戦〈セラフィム〉→ ニコの歌 → 終章へ
// =============================================================
(function () {
  const C8 = (G.C8 = G.C8 || {});
  const is8 = () => G.state.chapter === 8;
  const F = () => G.field;

  // 戦闘中の会話（敵・弾を止めてから話す）
  async function bsay(lines) {
    E.cut(true);
    for (const l of lines) await E.say(l[0], l[1], l[2]);
    E.cut(false);
  }
  C8.bsay = bsay;
  // 1回だけのごほうび
  async function giftOnce(flag, item, n) {
    if (E.flag(flag)) return false;
    E.set(flag);
    await E.give(item, n, { wait: true });
    return true;
  }
  // 味方機体
  const ALLY = {
    rose: (x, y) => ({ mech: 'rose', x, y, dmg: 30, col: '#ff9ac8', name: 'ルウ' }),
    zephyr: (x, y) => ({ mech: 'zephyr', x, y, dmg: 34, col: '#8ff8ff', name: 'シグ' }),
    gil: (x, y) => ({ mech: 'salamander', x, y, dmg: 30, col: '#ffb030', name: 'ギル' }),
    eisen: (x, y) => ({ id: 'eisen_ally', mech: 'guardner2', x, y, dmg: 30, col: '#9ab0ff', name: 'アイゼン' }),
  };
  C8.ALLY = ALLY;

  // =============================================================
  //  章の開始
  // =============================================================
  G.STORY.chapters[8] = async function () {
    E.time('night');
    E.set('c7_dark');
    E.set('w_evac');
    E.set('c7_eisen_ally');
    E.set('c7_gil_ally');
    E.set('c8_port_open');
    E.party(['ruu', 'niko']);
    G.state.mech.id = 'harukaze2';
    G.state.mech.hp = null;
    if (!G.state.skills.includes('overdrive')) G.state.skills.push('overdrive');
    await E.chapter(8);
    await E.warp('scrapbay', 53, 47, 'up');
    await C8.portBriefing();
  };

  // =============================================================
  //  1. 宇宙港ゲート7（scrapbay 南）
  // =============================================================
  const portOn = () => is8() && !E.flag('c8_launched');
  C8.portBriefing = async function () {
    E.cut();
    E.bgm('tension');
    await E.camera(53, 43, { frames: 60 });
    await E.say(null, 'クレイドル7、宇宙港ゲート7。――10年ぶりに、その扉が開いていた。');
    await E.say(null, '扉の向こうは、本物の宇宙。そして、光の消えたコロニーの外壁。');
    await E.cameraReset();
    E.face('player', 'right');
    await E.say('jin:serious', '……もう一度だけ、作戦を確認する。');
    await E.say('jin', 'ヘルミナは中心核、スターシードの前にいる。マザーを通して、コロニーのすべてを握っている。');
    await E.say('eisen:serious', '中心核への正面ルートは、マザーの最上位ロックで閉ざされている。……外せるのは、ソーラーミラー施設の制御中枢だけだ。');
    await E.say('jin', '宇宙港から外壁沿いにミラー施設へ。制御中枢でロックを外し、中心軸のベイゲートから中心核に入る。');
    await E.say('gil:grin', 'つまり、外ではオレ様たちが暴れて、中ではガキどもが暴れる。シンプルでいいじゃねえか！');
    await E.say('ruu:angry', 'ガキって言うな。');
    await E.say('eisen', 'ゼロ・リライトの完了まで、マザーの試算で……あと6時間。');
    E.emote('player', '…');
    await E.say('kanata:serious', '……6時間あれば、なんとかなるって。');
    await E.say('ruu:smile', 'あんたのそれ、今日ばっかりは頼もしいじゃん。');
    await E.say('niko:serious', 'ニコも、いく。……スターシードのこえ、ニコ、きこえる。とめられるの、たぶん、ニコだけ。');
    await E.say('tome', 'ニコちゃん。……あんたはもう、うちの子だよ。それだけ、おぼえときな。');
    await E.say('niko:smile', 'うん。……ばあちゃん。ラーメン、つくって、まってて。');
    await E.say('tome:smile', 'あいよ。とびきりのを作っとくさね。');
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさんたち！　……って言っても、今夜はみんな、眠れないよね。',
      '空は真っ暗。マザーは何も答えない。でもね、いま宇宙港に、朝を迎えに行く子たちがいる。',
      '……ルウ、聞こえてる？　ひだまり園のチビたちが、窓にロウソク並べて待ってるよ。',
      ['ruu:shy', '……リリィ姉。'],
      'じゃあ一曲。レディオ・スターダストから、宇宙へ。――「星の歌」。いってらっしゃい！',
    ]);
    E.cut(false);
    E.objective('みんなと話して、宇宙港ゲートから出撃する');
    E.toast('出撃前に、集まったみんなと話しておこう', G.UI.line2);
  };

  // 出撃前に話せる人たち
  const portNpc = (id, char, x, y, dir, talk) => ({ id, char, x, y, dir, move: 'still', show: portOn, talk });
  G.addToMap('scrapbay', {
    objects: [{ p: 'save', x: 47, y: 45, show: () => G.state.chapter === 8 }],
    npcs: [
      portNpc('c8_tome', 'tome', 50, 47, 'right', async () => {
        if (await giftOnce('c8_gift_tome', 'onigiri', 4)) {
          await E.say('tome', 'ほれ、星屑おにぎり。腹が減っては戦はできないさね。');
          await E.say('tome:serious', 'あたしもね、昔はあの扉から何度も出ていったもんさ。……でも、帰ってこなかった仲間も、たくさんいた。');
          await E.say('tome', 'だから約束しな。必ず、帰っておいで。それだけでいい。');
        } else await E.say('tome:smile', '帰ってきたら、とびきりのラーメンだよ。……ニコちゃんの大盛りもね。');
      }),
      portNpc('c8_jin', 'jin', 56, 46, 'left', async () => {
        if (!E.flag('c8_talk_jin')) {
          E.set('c8_talk_jin');
          await E.say('jin', 'ハルカゼ改のリミッターは外してある。ENが満タンの時にCを押せば、オーバードライブだ。');
          await E.say('jin:sad', '……5年、おまえのそばにいてやれなかった。だから今日は、ここで待つ。それが、父親の仕事だと思う。');
          await E.say('jin:smile', '行ってこい、カナタ。……大きくなったな。');
          await E.say('kanata:smile', '……行ってきます、父さん。');
        } else await E.say('jin', 'ルウちゃんのローズハウンドも、関節を全部組み直した。……ふたりとも、無茶はするなよ。');
      }),
      portNpc('c8_doc', 'doc', 48, 46, 'right', async () => {
        if (await giftOnce('c8_gift_doc', 'repair2', 2)) {
          await E.say('doc', 'ふん、若造。ハルカゼ改の整備は完璧じゃ。ワシとジンとポンタで、三晩寝とらん。');
          await E.say('doc', 'それも持っていけ。……機械は嘘をつかん。おまえが信じれば、ちゃんと応えてくれる。');
        } else await E.say('doc', 'ネジのやつ、ガレージで留守番じゃ。……帰ったら、なでてやれ。');
      }),
      portNpc('c8_ponta', 'ponta', 58, 47, 'left', async () => {
        await E.say('ponta:grin', 'ぶっひゃー！　出撃前のハルカゼ改、かっこよすぎるっす……！');
        await E.say('ponta', 'オイラ、整備しかできないけど……装甲板の裏に、クラスのみんなの寄せ書き、貼っといたっす！');
        if (!E.flag('c8_talk_ponta')) {
          E.set('c8_talk_ponta');
          await E.say('ruu:surprise', '……マジで？　ローズハウンドにも？');
          await E.say('ponta:shy', 'もちろんっす！　ルウのには、ひだまり園のチビたちの絵も入ってるっす！');
          await E.say('ruu:shy', '……あとで、見とく。');
        }
      }),
      portNpc('c8_yui', 'yui', 46, 47, 'right', async () => {
        await E.say('yui:serious', '父は……総督は、すべての責任を取ると言いました。わたしも、逃げません。');
        await E.say('yui', '避難所の点呼は、わたしが責任を持ちます。校則第1条「生徒は全員、無事に登校すること」。');
        await E.say('yui:shy', '……だから、ちゃんと帰ってきてください。2年B組、全員で。');
      }),
      portNpc('c8_eisen', 'eisen', 60, 46, 'left', async () => {
        await E.say('eisen:serious', '子供を戦場に送り出すのは、大人として最低の判断だ。……だが、君たちにしか届かない声がある。');
        await E.say('eisen', '公安特務隊の残存機は、施設周辺の無人機を引きつける。私も施設内まで同行しよう。マザーのセキュリティには、私の古いコードが残っているはずだ。');
      }),
      portNpc('c8_gil', 'gil', 62, 47, 'left', async () => {
        await E.say('gil:grin', 'イッツ・ショータイム！　ネオン・ジャッカルズ、全機出撃準備よしだ！');
        await E.say('gil', '勘違いすんなよ、カナタ。オレ様は借りを返しに行くだけだ。……決勝の借りをな！　燃えろォ！');
      }),
      portNpc('c8_sig', 'sig', 57, 45, 'down', async () => {
        await E.say('sig', '……僕の世界では、この夜は、明けませんでした。');
        await E.say('sig:smile', 'でも、ここにはラーメンがある。ばあちゃんがいる。……カナタと、ルウと、ニコがいる。だから、きっと明けます。');
      }),
      portNpc('c8_kyosuke', 'kyosuke', 44, 46, 'right', async () => {
        await E.say('kyosuke', 'あぁ？　……避難所の見回りは、オレらに任せとけ。');
        await E.say('kyosuke:serious', '……借りは返す。帰ってきたら、タイマンの続きだ。死ぬんじゃねえぞ。');
      }),
      portNpc('c8_vargas', 'vargas', 43, 47, 'right', async () => {
        await E.say('vargas:angry', '廊下を走るな！　……だが宇宙は廊下じゃない！　全力で飛べ！');
        await E.say('vargas:sad', '先生な、昔は同盟のパイロットだった。生徒を戦場に送るなんて、一番やりたくなかったことだ。');
        await E.say('vargas', 'だから絶対に帰ってこい！　これは宿題だ！　提出期限は明日の朝だ！');
      }),
      portNpc('c8_mimi', 'mimi', 41, 46, 'right', async () => {
        await E.say('mimi', '先輩！　最後に一枚、いいっすか！');
        E.flash(5);
        E.se('ok');
        await E.wait(20);
        await E.say('mimi:smile', '……よし。帰ってきたら一面に載せるっすからね！　見出しは『2年B組、宇宙へ』！');
      }),
    ],
    events: [
      {
        x: 52, y: 45, w: 4, h: 1, cond: portOn,
        run: async () => {
          const i = await E.ask(null, '宇宙港ゲート7。この先はハンガー、そして宇宙だ。', ['出撃する', 'もう少し準備する'], { cancel: 1 });
          if (i !== 0) {
            await E.move('player', 'D');
            return;
          }
          await C8.launch();
        },
      },
    ],
  });

  // 出撃シークエンス
  C8.launch = async function () {
    E.set('c8_launched');
    E.cut();
    await E.fadeOut(24);
    E.stopBgm();
    await E.cg('black', '', { wait: false });
    await E.fadeIn(10);
    await E.say(null, '――宇宙港ハンガー。ハルカゼ改のコクピットに、カナタとニコが乗りこむ。');
    await E.say('niko', 'ニコ、カナタのうしろ、すわる。……いっしょに、いく。');
    await E.say('kanata', 'しっかりつかまってろよ。');
    await E.say('jin', '〈管制、ジンだ。カタパルト、接続準備よし。タイミングはおまえに任せる〉');
    const sc = await E.timing({ title: 'ハルカゼ改 発進シークエンス', rounds: 3, speed: 1.5, zone: 0.2, labels: ['リアクター、出力安定！', 'カタパルト、接続！', 'ハルカゼ改、発進！'] });
    if (sc >= 2) await E.say('jin:smile', '〈完璧だ。……さすが、学年一位〉');
    else await E.say('jin', '〈少し荒いが、問題ない。……オレの若いころより、ずっとましだ〉');
    E.se('boost');
    E.shake(6, 30);
    await E.say('kanata:serious', '春瀬カナタ、ハルカゼ改……いきます！');
    E.flash(12);
    E.se('boot');
    E.bgm('space');
    await E.cg('colony_out_dark', '――光の消えたクレイドル7が、真っ暗な宇宙に浮かんでいた。');
    await E.say('ruu', '〈ルウ、ローズハウンド。……ついてってる〉');
    await E.say('ruu:surprise', '〈これが、外……。本物の、宇宙〉');
    await E.say('niko:sad', 'くらい……。コロニーの、みんな、こわがってる。こえ、きこえる。');
    await E.fadeOut(16);
    E.cgOff();
    await E.warp('c8_space1', 6, 17, 'right');
  };

  // =============================================================
  //  2. L4宙域（c8_space1）
  // =============================================================
  G.addToMap('c8_space1', {
    onEnter: async () => {
      if (E.flag('c8_s1_intro')) return;
      E.set('c8_s1_intro');
      E.cut();
      await E.say('sig', '〈ゼフィール、先行します。……ミラー施設は、東。外壁に沿って進んでください〉');
      await E.say('gil', '〈ネオン・ジャッカルズ、ショータイムだ！　野郎ども、ガキどもに遅れんなよ！〉');
      await E.say('mother', 'ケイコク。ミショウニンノ キタイヲ カクニン。……ハイジョ シマス。');
      await E.say('kanata:serious', 'マザーの声……。いつもの「オハヨウゴザイマス」とは、ぜんぜん違う。');
      E.cut(false);
      E.objective('ミラー施設へ向かう（東）');
      E.toast('Z:ビーム  X:ブースト  C:近接（EN満タンでオーバードライブ）', G.UI.line2);
    },
    events: [
      { x: 16, y: 1, w: 1, h: 32, once: 'c8_s1_a', cond: is8, run: () => C8.battleA() },
      { x: 48, y: 1, w: 1, h: 32, once: 'c8_s1_b', cond: is8, run: () => C8.battleB() },
      { x: 84, y: 19, w: 4, h: 3, cond: is8, run: () => C8.dock() },
    ],
  });

  C8.battleA = async function () {
    E.cut();
    await E.say('ruu', '〈前方に機影！　数……多っ！〉');
    await E.say('gil:grin', '〈イッツ・ショータイム！　オレ様に続けェ！〉');
    E.cut(false);
    const p = F().player;
    await E.battle({
      map: 'c8_space1', x: Math.max(17, p.tx), y: G.clamp(p.ty, 3, 26), dir: 'right', mech: true, mechId: 'harukaze2',
      waves: [
        [
          { type: 'guardner', x: 31, y: 10, lv: 13, name: '無人ガードナー' },
          { type: 'guardner', x: 33, y: 15, lv: 13, name: '無人ガードナー' },
          { type: 'guardner', x: 33, y: 19, lv: 13, name: '無人ガードナー' },
          { type: 'guardner', x: 31, y: 24, lv: 13, name: '無人ガードナー' },
        ],
        [
          { type: 'drone', x: 29, y: 8, lv: 13 },
          { type: 'drone', x: 30, y: 24, lv: 13 },
          { type: 'guardner', x: 35, y: 13, lv: 13, name: '無人ガードナー' },
          { type: 'guardner', x: 35, y: 20, lv: 13, name: '無人ガードナー' },
          { type: 'drone', x: 34, y: 17, lv: 13 },
        ],
        [
          { type: 'jackal', x: 33, y: 11, lv: 13, name: '無人ハウンド', color: { body: '#8a90b0', accent: '#ff3a8a', eye: '#ff3a8a' } },
          { type: 'guardner', x: 32, y: 22, lv: 13, name: '無人ガードナー' },
          { type: 'bit', x: 36, y: 13, lv: 13 },
          { type: 'bit', x: 36, y: 17, lv: 13 },
          { type: 'bit', x: 36, y: 21, lv: 13 },
        ],
      ],
      allies: [ALLY.rose(15, 13), ALLY.zephyr(15, 21), ALLY.gil(13, 17)],
      title: 'ENGAGE!', sub: 'マザーの無人機部隊を突破せよ',
      onWave: async (w) => {
        if (w === 1) await bsay([['sig', '〈……上と下から、もう一隊〉'], ['ruu:grin', '〈任せな！〉']]);
        if (w === 2) await bsay([['niko:surprise', 'あの、きいろいひかり……ヘルミナの、ビット。'], ['kanata:surprise', 'セラフィムの端末まで出してきたのか……！']]);
      },
    });
    E.cut();
    await E.say('gil', '〈へっ、準備運動にもなりゃしねえ！〉');
    await E.say('gil', '〈ジャッカルズ各機、外の掃除は任せた！　オレ様はガキどもの護衛だ！〉');
    await E.say('sig', '〈……施設まで、あと半分です〉');
    E.cut(false);
  };

  C8.battleB = async function () {
    E.cut();
    E.se('alarm');
    await E.say('mother', 'ハイジョ プログラム、レベル3。シキカン ユニット、キドウ。');
    await E.say('ruu:surprise', '〈デカいの来た！　指揮官機！〉');
    E.cut(false);
    const p = F().player;
    let eisenIn = false;
    await E.battle({
      map: 'c8_space1', x: Math.max(49, p.tx), y: G.clamp(p.ty, 3, 26), dir: 'right', mech: true, mechId: 'harukaze2',
      enemies: [
        { type: 'guardner2', x: 60, y: 15, lv: 13, name: 'マザー指揮ユニット', boss: true },
        { type: 'guardner', x: 58, y: 9, lv: 13, name: '無人ガードナー' },
        { type: 'guardner', x: 58, y: 21, lv: 13, name: '無人ガードナー' },
      ],
      allies: [ALLY.rose(47, 12), ALLY.zephyr(47, 20), ALLY.gil(46, 16)],
      bgm: 'boss', title: 'WARNING', sub: 'マザー指揮ユニットを撃破せよ', win: 'all',
      onStart: async () => {
        const b = F().enemies().find((e) => e.type === 'guardner2');
        if (!b) return;
        b.onHurt = () => {
          if (eisenIn || b.hp > b.maxhp * 0.55) return;
          eisenIn = true;
          G.ev.run(async () => {
            E.se('boost');
            const pl = F().player;
            F().allies.push(new G.Ally(ALLY.eisen(Math.max(2, pl.tx - 3), Math.max(2, pl.ty - 3))));
            G.fx.ring(pl.x - 40, pl.y - 50, 30, '#9ab0ff');
            await bsay([
              ['eisen', '〈こちらアイゼン。公安特務隊、これより子供たちを援護する〉'],
              ['ruu:grin', '〈少佐！　遅いっての！〉'],
              ['eisen', '〈……すまない。大人は、決断に時間がかかる生き物でね〉'],
            ]);
          });
        };
      },
    });
    E.cut();
    E.exp(1200);
    if (!eisenIn) await E.say('eisen', '〈こちらアイゼン。……どうやら、援護は必要なかったようだな〉');
    await E.say('eisen', '〈公安特務隊、残存4機。施設周辺の無人機は我々が引きつける〉');
    await E.say('eisen', '〈私は君たちと一緒に施設へ降りる。ドックは、この先だ〉');
    await E.say('kanata', 'ありがとう、少佐！');
    E.cut(false);
    E.objective('ミラー施設のドッキングポートへ');
  };

  C8.dock = async function () {
    E.cut();
    if (!E.flag('c8_docked')) {
      E.set('c8_docked');
      await E.say(null, 'ソーラーミラー施設B区画、ドッキングポート。');
      await E.say('sig', '〈僕はここで、ドックを守ります。……外は、任せてください〉');
      await E.say('kanata', 'わかった。すぐ戻る！');
      await E.say('ruu', '〈ローズハウンド、着艦。……生身で行くの、久しぶりだね〉');
    }
    E.party(['ruu', 'niko', 'gil', 'eisen']);
    E.cut(false);
    await E.warp('c8_mirror1', 10, 30, 'up');
  };

  // =============================================================
  //  3. ソーラーミラー施設 B区画（c8_mirror1）
  // =============================================================
  const parked = (id, mech, x, msg) => ({ id, mech, x, y: 34, dir: 'down', move: 'still', show: is8, talk: async () => await E.say(null, msg) });
  G.addToMap('c8_mirror1', {
    npcs: [
      parked('c8_park_haru', 'harukaze2', 4, 'ハルカゼ改。装甲の裏に、ポンタの言っていた寄せ書きが見える。「絶対帰ってこい　2-B一同」'),
      parked('c8_park_rose', 'rose', 8, 'ローズハウンド。コクピットに、子どもの描いたクレヨンの絵が貼ってある。「ルウねえちゃん　がんばれ」'),
      parked('c8_park_sala', 'salamander', 13, 'サラマンダー。肩に新しく「SHOW TIME」とペイントされている。'),
      parked('c8_park_eisen', 'guardner2', 17, 'アイゼン少佐のガードナー指揮官機。公安のマークの上から、白いテープで×印が貼られている。'),
      {
        id: 'c8_gil_hold', char: 'gil', x: 42, y: 7, dir: 'left', move: 'still', show: () => is8() && E.flag('c8_gil_hold'),
        talk: async () => await E.say('gil:grin', 'なに戻ってきてやがる！　ここはオレ様のステージだって言ったろ！　行け行け！'),
      },
      {
        id: 'c8_eisen_hold', char: 'eisen', x: 54, y: 21, dir: 'left', move: 'still', show: () => is8() && E.flag('c8_eisen_hold'),
        talk: async () => await E.say('eisen', 'ロックは押さえている。……振り返るな。前だけを見ろ。'),
      },
    ],
    checks: [
      { x: 9, y: 19, w: 2, show: () => !E.flag('c8_m1_sw'), text: '分厚いシャッターが下りている。「GATE-B2：LOCKED」……近くに制御端末があるはずだ。' },
      { x: 17, y: 16, run: () => C8.m1Switch() },
      { x: 52, y: 21, w: 3, show: () => !E.flag('c8_door_open'), text: 'マザーの紋章が刻まれた大扉。赤い光が、脈打つように明滅している。' },
    ],
    events: [
      { x: 9, y: 12, w: 2, h: 1, once: 'c8_m1_echo', cond: is8, run: () => C8.echoScene() },
      { x: 42, y: 6, w: 1, h: 4, once: 'c8_m1_gil', cond: is8, run: () => C8.gilStand() },
      { x: 49, y: 3, w: 1, h: 9, once: 'c8_m1_deck', cond: is8, run: () => C8.deckScene() },
      { x: 52, y: 20, w: 3, h: 1, cond: () => is8() && !E.flag('c8_door_open'), run: () => C8.eisenDoor() },
      {
        x: 53, y: 26, cond: () => is8() && E.flag('c8_door_open'),
        run: async () => {
          const i = await E.ask(null, '制御中枢へ降りるリフトだ。', ['降りる', 'やめる'], { cancel: 1 });
          if (i === 0) await E.warp('c8_mirror2', 21, 6, 'down');
        },
      },
    ],
    onEnter: async () => {
      if (E.flag('c8_m1_intro')) return;
      E.set('c8_m1_intro');
      E.cut();
      await E.say(null, 'ソーラーミラー施設、B区画。コロニーの「空」をつくる巨大な鏡を動かす場所だ。');
      await E.say('eisen', '施設内は低重力区画が多い。足元に気をつけろ。');
      await E.say('gil:grin', 'へっ、生身のケンカもオレ様の得意分野だ。');
      await E.say('ruu', 'ニコ、あたしから離れんなよ。');
      await E.say('niko:smile', 'うん。……ルウの、て、あったかい。');
      E.cut(false);
      E.objective('施設の奥へ進む（北の通路）');
    },
  });

  C8.m1Switch = async function () {
    if (E.flag('c8_m1_sw')) return E.say(null, 'シャッターの制御端末。「GATE-B2：OPEN」');
    if (G.state.party.includes('eisen')) await E.say('eisen', '公安コードで……よし、通った。');
    else await E.say(null, '制御端末を操作した。');
    E.set('c8_m1_sw');
    E.se('door');
    E.reload();
    E.shake(3, 20);
    await E.say(null, 'どこかで、重いシャッターが上がる音がした。');
    E.objective('北の無重力ホールへ');
  };

  C8.echoScene = async function () {
    E.cut();
    await E.say(null, '天井の窓の向こうに、星がにじんでいる。……空気が、しんと冷たい。');
    E.emote('f_niko', '…');
    await E.say('niko:sad', '……このこたち。プロジェクト・エコーの、こどもたちの、こえ。');
    await E.say('ruu:surprise', 'エコー体って……まさか、人なの！？');
    await E.say('eisen:serious', '……実験で失われた子供たちの「残響」だと、記録にはあった。ヘルミナはそれを、警備に使っている。');
    await E.say('niko:cry', 'いたいって、いってる。……カナタ、ルウ。おねがい。ねむらせて、あげて。');
    await E.say('kanata:serious', '……ああ。わかった。');
    E.cut(false);
    E.objective('無重力ホールを抜けて東へ');
  };

  C8.gilStand = async function () {
    E.cut();
    E.se('alarm');
    E.shake(4, 30);
    await E.say('mother', 'シンニュウシャ。ハイジョ。ハイジョ。ハイジョ。');
    await E.say('gil:angry', 'ちっ、前からも後ろからも来やがる！　構えろ！');
    E.cut(false);
    await E.battle({
      map: 'c8_mirror1', x: 44, y: 7, dir: 'left',
      waves: [
        [
          { type: 'bot', x: 36, y: 5, lv: 13 },
          { type: 'bot', x: 36, y: 9, lv: 13 },
          { type: 'drone', x: 38, y: 7, lv: 13 },
        ],
        [
          { type: 'bot', x: 47, y: 7, lv: 13 },
          { type: 'drone', x: 34, y: 4, lv: 13 },
          { type: 'echo', x: 34, y: 10, lv: 13 },
          { type: 'bot', x: 37, y: 7, lv: 14 },
        ],
      ],
      title: 'BATTLE!', sub: '警備ロボを撃退せよ',
    });
    E.cut();
    E.shake(3, 40);
    await E.say(null, '遠くから、また無数の駆動音が近づいてくる。');
    await E.say('gil', '……キリがねえな。');
    await E.say('gil:serious', 'おい、カナタ、ルウ。ここは、オレ様のステージだ。');
    await E.say('kanata:surprise', 'ギル！？　ひとりじゃ無理だって！');
    await E.say('gil:grin', 'ハッ、誰に言ってる。オレはネオン・ジャッカルズのギル・ブレイズ様だぜ？　……観客がロボットってのが、ちっと寂しいがな。');
    await E.say('gil', '決勝で負けたあの日から、ずっと考えてた。オレに足りなかったのは、何か。');
    await E.say('gil:serious', '……今ならわかる。守るもんがあるヤツは、強え。');
    await E.say('gil:grin', '行け、スターダスト！　イッツ・ショータイムだ！');
    await E.say('ruu:smile', '……ギル。あんた、けっこうカッコいいじゃん。');
    await E.say('gil:angry', '「けっこう」は余計だ！　燃えろォ！');
    E.leave('gil');
    E.set('c8_gil_hold');
    E.reload();
    E.cut(false);
    E.objective('東の観測デッキへ');
  };

  C8.deckScene = async function () {
    E.cut();
    E.bgm('sad');
    await E.say('eisen', '……少し、周囲を見てくる。君たちは、ここで息を整えろ。');
    await E.camera(53, 4, { frames: 70 });
    await E.say(null, '観測デッキの大窓の向こうに、クレイドル7が浮かんでいた。');
    await E.say(null, '灯りの消えた、巨大な円筒。……カナタたちの街は、その内側で、朝を待っている。');
    await E.say('ruu', '……ねえ、カナタ。あれ、あたしたちのコロニーだよ。');
    await E.say('kanata:think', 'ちっさいな……。いや、でかいんだけど。なんか、ちっさく見える。');
    await E.say('ruu', 'あたしさ、ずっと「本物の空」が見たかった。ニセモノじゃない、本物の。');
    await E.say('ruu:sad', '……で、これが本物。真っ黒で、冷たくて、なんにもない。……ちょっと、拍子抜け。');
    await E.say('niko', 'ニコ、ここ、きたこと、ある。');
    await E.say('ruu:surprise', 'え？');
    await E.say('niko:sad', 'けんきゅうじょ、にげたとき。……このまどから、コロニー、みた。くらくて、さむくて、ひとりだった。');
    await E.say('niko', 'でも、ほしのこえ、いってた。あのなかに、あったかいとこ、あるって。……だから、ニコ、いった。');
    await E.say('niko:smile', 'そしたら、カナタとルウ、いた。ラーメン、あった。');
    await E.say('ruu:cry', '……バカ。そういうこと、急に言うなっての。');
    await E.say(null, 'ルウが、ニコをぎゅっと抱きしめた。');
    await E.say('ruu:cry', 'もう、ひとりじゃないっしょ。……あたしも。ニコも。');
    const i = await E.ask('kanata', '（……なにか、言おうか）', ['ニセモノでも、オレらの空だろ', '（だまって、ふたりの頭をなでる）']);
    if (i === 0) {
      await E.say('kanata:smile', 'ニセモノでもさ。あそこが、オレらの空だろ。……帰ろうぜ、みんなで。');
      await E.say('ruu:shy', '……知ってるよ、そんなの。');
    } else {
      await E.say(null, 'カナタは何も言わずに、ふたりの頭をくしゃっとなでた。');
      await E.say('ruu:angry', 'ちょっ……髪型くずれるっての！');
      await E.say('niko:smile', 'えへへ。');
    }
    await E.cameraReset();
    await E.say('eisen', '……行けるか。');
    await E.say('ruu:smile', 'うん。もう平気。');
    E.bgm('dungeon');
    E.cut(false);
    E.objective('南の大扉へ');
  };

  C8.eisenDoor = async function () {
    E.cut();
    await E.say(null, 'マザーの紋章が刻まれた大扉。赤い光が、脈打つように明滅している。');
    await E.say('eisen:serious', 'マザーの最上位ロックだ。……私の公安コードで、こじ開ける。');
    await E.say('eisen', 'カナタ。コードの送信タイミングを合わせてくれ。私が鍵を回す。君が押し込め。');
    const sc = await E.timing({ title: 'マザー・ロック解除', rounds: 4, speed: 1.7, zone: 0.17, labels: ['第1層：認証コード', '第2層：暗号鍵', '第3層：権限の上書き', '最終層：解錠'] });
    if (sc >= 3) await E.say('eisen:smile', '見事だ。……シミュレーター学年一位は、伊達ではないな。');
    else {
      await E.say('eisen', '……あとは私がやる。少し、手荒くな。');
      E.se('explode');
      E.shake(5, 20);
    }
    E.se('door');
    E.set('c8_door_open');
    E.reload();
    E.flash(6);
    await E.say(null, '大扉が、きしみながら開いた。');
    await E.say('eisen', 'ロックはすぐに再起動しようとする。誰かがここで、手動で押さえていなければならない。');
    await E.say('kanata:surprise', 'じゃあ、少佐も……ここに残るのか！？');
    await E.say('eisen:serious', '子供に未来を押しつけるのは、大人の怠慢だ。……せめて、扉くらいは開けさせてくれ。');
    await E.say('eisen', '私は長いこと、正しいと信じて、君たちを追いかけてきた。……今度は、君たちの背中を守らせてほしい。');
    await E.say('ruu', '……少佐。帰ったら、星屑亭でラーメンおごりな。');
    await E.say('eisen:smile', '……ああ。約束しよう。');
    E.leave('eisen');
    E.set('c8_eisen_hold');
    E.reload();
    E.cut(false);
    E.objective('リフトで制御中枢へ降りる');
  };

  // =============================================================
  //  4. ミラー制御中枢（c8_mirror2）
  // =============================================================
  G.addToMap('c8_mirror2', {
    checks: [
      { x: 3, y: 4, run: () => C8.m2Switch('a') },
      { x: 40, y: 4, run: () => C8.m2Switch('b') },
      { x: 20, y: 11, w: 4, show: () => !E.flag('c8_m2_bar'), text: 'レーザー障壁だ。左右の区画の制御スイッチで止められそうだ。' },
      { x: 19, y: 26, w: 6, run: () => C8.console() },
    ],
    events: [
      { x: 20, y: 15, w: 4, h: 1, once: 'c8_m2_boss', cond: is8, run: () => C8.helios() },
      {
        x: 21, y: 4, cond: () => is8() && !E.flag('c8_m2_done'),
        run: async () => {
          const i = await E.ask(null, 'B区画へ戻るリフトだ。', ['戻る', 'やめる'], { cancel: 1 });
          if (i === 0) await E.warp('c8_mirror1', 53, 25, 'up');
        },
      },
    ],
    onEnter: async () => {
      if (E.flag('c8_m2_intro')) return;
      E.set('c8_m2_intro');
      E.party(['ruu', 'niko']);
      E.cut();
      await E.say('mother', 'ココハ……ミラー セイギョ チュウスウ。……タチイリ キンシ、デス。');
      await E.say('niko:sad', '……マザー、ないてる。');
      await E.say('ruu', 'AIが泣くわけ……');
      await E.say('niko:sad', 'ないてる。ずっと。……「いたい」「やめて」って。');
      await E.say('kanata:serious', 'ヘルミナに、むりやり動かされてるんだ……。');
      await E.say(null, '南の通路は、レーザー障壁でふさがれている。左右の区画に、制御スイッチがあるようだ。');
      E.cut(false);
      E.objective('左右の区画の制御スイッチを入れる');
    },
  });

  C8.m2Switch = async function (k) {
    const f = 'c8_m2_sw' + k;
    if (E.flag(f)) return E.say(null, '制御スイッチ。ランプは緑に変わっている。');
    E.set(f);
    E.se('ok');
    await E.say(null, '制御スイッチを入れた。ランプが赤から緑に変わる。');
    if (E.flag('c8_m2_swa') && E.flag('c8_m2_swb')) {
      E.set('c8_m2_bar');
      E.se('door');
      E.reload();
      await E.say(null, 'ブゥン……と低い音がして、中央通路のレーザー障壁が消えた。');
      E.objective('中央の制御室へ');
    } else {
      await E.say('ruu', 'もう片方のスイッチも入れないとダメっぽいね。');
      E.objective('もう一方の制御スイッチを入れる');
    }
  };

  C8.helios = async function () {
    E.cut();
    E.se('alarm');
    E.shake(6, 40);
    await E.say('mother', 'ハイジョ……シナサイ……ヘリオス……。');
    await E.say(null, '天井から、巨大な管理ロボが降りてきた！');
    await E.say('ruu:surprise', 'でっか！　ミラーの整備ロボ！？');
    await E.say('kanata:serious', 'ルウ、ニコをたのむ！　いくぞ！');
    E.cut(false);
    await E.battle({
      map: 'c8_mirror2', x: 21, y: 17, dir: 'down',
      enemies: [{ type: 'warden', x: 21, y: 23, lv: 13, name: 'ミラー管理ロボ〈ヘリオス〉' }],
      bgm: 'boss', title: 'BOSS BATTLE', sub: 'ミラー管理ロボ〈ヘリオス〉', win: 'boss',
    });
    E.exp(1500);
    E.cut();
    await E.say('ruu', 'はぁ、はぁ……。どんなもんよ。');
    await E.say('niko', '……コンソール。マザー、そこにいる。');
    E.cut(false);
    E.objective('制御コンソールを調べる');
  };

  C8.console = async function () {
    if (E.flag('c8_m2_done')) return E.say(null, 'コンソールの光は消えている。……マザーの声は、もう聞こえない。');
    if (!E.flag('c8_m2_boss')) return E.say(null, 'ミラー制御コンソール。');
    E.set('c8_m2_done');
    E.cut();
    await E.say('niko', 'ニコ、マザーと、はなす。');
    E.se('echo');
    E.flash(10);
    E.bgm('sad');
    await E.say('mother', '……ア……アナタハ……ECHO-07……。');
    await E.say('niko', 'マザー。ニコだよ。……いたい？');
    await E.say('mother', 'ワタシハ……クレイドル7ノ……ミンナヲ……マモル タメニ……ツクラレマシタ。');
    await E.say('mother', 'デモ……イマノ ワタシハ……ミンナノ ソラヲ……トジテ イル……。');
    await E.say('mother', '……タスケテ。');
    await E.say('kanata:serious', '……マザー。待ってろ。オレたちが、ヘルミナを止める。');
    await E.say('mother', 'チュウシンカクノ ゲートロック……カイジョ シマス。……ワタシニ デキルノハ、ココマデ……デス。');
    E.set('c8_gate_unlock');
    E.se('door');
    await E.say('mother', 'ドウカ……ソラヲ……。');
    await E.say('ruu', '……任せなって。あんたの空、取り返してくる。');
    await E.say(null, 'コンソールの光が消えた。');
    await E.say('niko', '……いこう。シグ、まってる。');
    E.cut(false);
    await E.fadeOut(20);
    E.party(['ruu', 'niko']);
    await E.say(null, '――B区画ドッキングポート。カナタたちは、ふたたび機体に乗りこんだ。');
    await E.warp('c8_space2', 4, 18, 'right');
  };

  // =============================================================
  //  5. 中心軸・ベイゲート前（c8_space2）
  // =============================================================
  G.addToMap('c8_space2', {
    events: [
      { x: 24, y: 1, w: 1, h: 34, once: 'c8_s2_bits', cond: is8, run: () => C8.bitSwarm() },
      { x: 56, y: 13, w: 3, h: 9, once: 'c8_s2_gate', cond: () => is8() && E.flag('c8_s2_bits'), run: () => C8.openGate() },
    ],
    warps: [{ x: 60, y: 15, w: 3, h: 5, to: 'c8_core', tx: 17, ty: 22, dir: 'up', cond: () => E.flag('c8_gate_open') }],
    onEnter: async () => {
      if (E.flag('c8_s2_intro')) return;
      E.set('c8_s2_intro');
      E.cut();
      await E.say('sig', '〈おかえりなさい。……ドックは無事です〉');
      await E.say('kanata', 'シグ！　中心核のロック、外れたぞ！');
      await E.say('sig', '〈見えます。中心軸の先端、ベイゲート。……あそこが、中心核への入口です〉');
      await E.say('niko:surprise', '……くる。たくさん。ひかり、たくさん。');
      E.cut(false);
      E.objective('中心軸のベイゲートへ（東）');
    },
  });

  C8.bitSwarm = async function () {
    E.cut();
    E.shake(3, 40);
    await E.say(null, '前方の宇宙が、黄色い光で埋めつくされていく。');
    await E.say(null, '――ビット。セラフィムの遠隔端末が、何百、何千と群れをなしていた。');
    await E.say('helmina', 'ようこそ、子どもたち。……そこから先へは、通さないわ。');
    await E.say('helmina', 'あなたたちを傷つけたくはないの。引き返しなさい。すべてが書き換われば、痛みも、なにも、なかったことになるのだから。');
    await E.say('ruu:angry', '〈なかったことになんか、させるかっての！〉');
    E.cut(false);
    const p = F().player;
    await E.battle({
      map: 'c8_space2', x: Math.max(25, p.tx), y: G.clamp(p.ty, 4, 30), dir: 'right', mech: true, mechId: 'harukaze2',
      waves: [
        [0, 1, 2, 3, 4, 5].map((k) => ({ type: 'bit', x: 36 + (k % 2) * 2, y: 8 + k * 4, lv: 12 })),
        [
          { type: 'bit', x: 35, y: 9, lv: 13 },
          { type: 'bit', x: 37, y: 14, lv: 13 },
          { type: 'bit', x: 35, y: 19, lv: 13 },
          { type: 'bit', x: 37, y: 24, lv: 13 },
          { type: 'guardner', x: 40, y: 12, lv: 14, name: '無人ガードナー' },
          { type: 'guardner', x: 40, y: 22, lv: 14, name: '無人ガードナー' },
        ],
        [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ type: 'bit', x: 34 + (k % 3) * 2, y: 6 + k * 3, lv: 13 })),
      ],
      allies: [ALLY.rose(22, 14), ALLY.zephyr(22, 22)],
      title: 'ENGAGE!', sub: 'ビットの群れを突破せよ',
      onWave: async (w) => {
        if (w === 1) await bsay([['sig', '〈ビットに、無人機が混ざっています。……気をつけて〉']]);
        if (w === 2) await bsay([['ruu:angry', '〈倒しても倒しても、湧いてくる……！〉'], ['niko:sad', 'ヘルミナの、かなしい、きもち。……ビットに、なってる。']]);
      },
    });
    E.exp(1500);
    E.cut();
    E.shake(3, 30);
    await E.say(null, 'だが、光の群れは減らない。倒したそばから、次のビットが湧き出してくる。');
    await E.say('ruu:angry', '〈キリない……！　これじゃ、ゲートまで持たない！〉');
    await E.say('sig', '〈……カナタ、ルウ。ここは、僕が引き受けます〉');
    await E.say('kanata:surprise', 'シグ！？');
    await E.say('sig', '〈僕の世界でも、こうでした。ビットの群れに道をふさがれて、誰も、中心核にたどりつけなかった〉');
    await E.say('sig:sad', '〈そして、空が落ちた。……クレイドル7は、星の海に沈みました〉');
    await E.say('sig:serious', '〈自分の世界と同じ結末には――させない〉');
    E.se('charge');
    await E.cg('c8_wings', 'ゼフィールの背中に、光の羽が広がった。');
    await E.say('sig', '〈ゼフィール、リミッター解除。……光の羽、全開〉');
    E.se('beam');
    E.flash(10);
    await E.cgCaption('光の羽が、ビットの群れを薙ぎはらう。宇宙に、一本の道が開いた。');
    E.cgOff();
    await E.say('ruu', '〈……シグ。死ぬなよ。絶対だかんね〉');
    await E.say('sig', '〈……僕は、この世界の人間じゃありません。でも――〉');
    await E.say('sig:smile', '〈ばあちゃんのラーメン、もう一度、食べたいです。だから、帰ります〉');
    await E.say('kanata:smile', '……約束だぞ！　大盛りな！');
    await E.say('niko', 'シグ。……またね。');
    E.set('c8_sig_stay');
    E.cut(false);
    E.objective('ベイゲートへ急げ（セーブ端末で準備を）');
  };

  C8.openGate = async function () {
    E.cut();
    await E.say(null, '中心核のベイゲート。マザーの紋章は、もう赤く光っていない。');
    await E.say('niko', 'ニコが、あける。……スターシードが、よんでる。');
    E.se('echo');
    E.flash(12);
    E.set('c8_gate_open');
    E.reload();
    await E.wait(30);
    await E.say(null, '巨大な円形の扉が、音もなく開いた。奥から、青白い光があふれてくる。');
    await E.say('ruu', '〈……行こう。終わらせに〉');
    await E.say('kanata:serious', '（この先が最後だ。……準備はいいか？）');
    E.cut(false);
    E.objective('中心核へ（ゲートの奥）');
  };

  // =============================================================
  //  6. 中心核（c8_core）— ヘルミナ、最終決戦、星の歌
  // =============================================================
  G.addToMap('c8_core', {
    onEnter: async () => {
      if (!is8() || E.flag('c8_core_intro')) return;
      E.set('c8_core_intro');
      await C8.coreScene();
    },
  });

  C8.coreScene = async function () {
    E.cut();
    E.stopBgm();
    await E.cg('starseed', '中心核。――そこには、星があった。');
    await E.cgCaption('〈スターシード〉。コロニーの心臓に眠る、青い結晶。');
    E.cgOff();
    await E.camera(17, 8, { frames: 70 });
    E.npc({ id: 'c8_helmina', char: 'helmina', x: 17, y: 8, dir: 'down' });
    E.flash(6);
    await E.wait(20);
    E.bgm('sad');
    await E.say('helmina', 'よく来たわね。カナタくん、ルウさん。……そして、ECHO-07。いいえ、ニコ。');
    await E.cameraReset();
    await E.mech(false);
    E.get('f_ruu') && E.teleport('f_ruu', 16, 21, 'up');
    E.get('f_niko') && E.teleport('f_niko', 18, 21, 'up');
    await E.move('player', [[17, 12]], { speed: 1 });
    await E.say('helmina', 'ここまで来たあなたたちに、ひとつだけ、見せたいものがあるの。');
    await E.cg('starseed', '');
    await E.say('helmina', 'スターシードの向こうには、無数の「あり得た世界」がある。……戦争が起きなかった世界も。');
    await E.say('helmina', 'そこでは10年前のあの日、軌道上の病院船は撃たれなかった。……ミアは、8歳の誕生日を迎えたの。');
    await E.say('kanata:surprise', '……ミア？');
    await E.say('helmina:sad', '私の娘よ。あの子は、戦争で死んだ。ベッドの上で、私の手を握ったまま。');
    E.cgOff();
    await E.say('helmina', 'ゼロ・リライトは、世界を「戦争がなかった世界」に書き換える。……あの子が、生きている世界に。');
    await E.say('ruu:angry', 'でも、それって……この世界は、どうなんのさ。');
    await E.say('helmina', '消えるわ。クレイドル7も、あなたたちも。……でも痛みはないの。最初から、なかったことになるだけ。');
    E.emote('player', '💢');
    await E.say('kanata:angry', 'ふざけんな……！');
    await E.say('kanata:angry', 'この世界にだって、ばあちゃんがいて、父さんがいて……ラーメンがあって、学校があって。');
    await E.say('kanata:serious', 'ニセモノの空かもしれないけど……オレたちは、ここで生きてんだよ！');
    await E.say('ruu:angry', 'あんたの娘のことは、かわいそうだと思う。……でも、あたしたちの「いま」を、勝手に消すな！');
    await E.say('niko:sad', 'ヘルミナ。……スターシード、ないてる。むりやり、あけられて、いたいって。');
    await E.say('niko:sad', 'ミアも、きっと――');
    E.stopBgm();
    E.shake(6, 30);
    await E.say('helmina:angry', 'あの子の名前を、気安く呼ばないで！');
    await E.say('helmina', '……そう。わかってもらえないのね。なら――');
    await E.say('helmina:serious', 'セラフィム、起動。');
    E.se('bigexplode');
    E.flash(16);
    E.remove('c8_helmina');
    await E.cg('c8_seraph', '白金の巨体が、スターシードの光の中から現れた。');
    await E.say('helmina', '止められるものなら、止めてごらんなさい。……これが、母親の祈りよ。');
    E.cgOff();
    await E.say('kanata:serious', 'ルウ、ニコ！　乗るぞ！');
    await E.mech(true, 'harukaze2');
    await E.say('niko:serious', 'ニコ、カナタのうしろ。……いっしょに、うたう。');
    await E.say('ruu:grin', '〈ローズハウンド、いつでもいける！〉');
    await E.say('kanata:serious', '……なんとかする。なんとかしてみせる！');
    E.cut(false);
    await C8.finalBattle();
    await C8.starSong();
  };

  // 最終決戦
  C8.SERAPH_HP = 18000;
  C8.finalBattle = async function () {
    E.heal();
    await E.battle({
      map: 'c8_core', x: 17, y: 19, dir: 'up', mech: true, mechId: 'harukaze2',
      enemies: [{ type: 'seraph', x: 17, y: 11, lv: 13, hp: C8.SERAPH_HP, boss: true, name: 'セラフィム（ヘルミナ）' }],
      allies: [ALLY.rose(14, 19)],
      bgm: 'final', title: 'FINAL BATTLE', sub: 'セラフィムを止めろ！', win: 'boss',
      returnTo: ['c8_core', 17, 20, 'up'],
      onStart: async () => {
        E.tint(null);
        const s = F().enemies().find((e) => e.type === 'seraph');
        if (s) s.onPhase = (ph) => G.ev.run(() => C8.seraphPhase(ph, s));
        await bsay([['helmina', '……来なさい。'], ['ruu:grin', '〈いくよ、カナタ！〉'], ['kanata:serious', 'おう！']]);
      },
    });
  };

  C8.seraphPhase = async function (ph, s) {
    if (ph === 2) {
      E.cut(true);
      await E.say('helmina:angry', 'なぜ……！　どうして、わかってくれないの！');
      E.se('boost');
      E.flash(8);
      const pl = F().player;
      F().allies.push(new G.Ally(ALLY.zephyr(G.clamp(pl.tx + 3, 2, 33), G.clamp(pl.ty, 2, 23))));
      G.fx.ring(pl.x + 48, pl.y - 20, 40, '#8ff8ff');
      await E.say('sig', '〈……お待たせしました〉');
      await E.say('ruu:surprise', '〈シグ！　生きてた！〉');
      await E.say('sig', '〈ビットの群れは、全部、星の海に返してきました。……ここからは、三人で〉');
      await E.say('niko:smile', 'よにん！');
      await E.say('sig:smile', '〈……四人で〉');
      await E.say('helmina:angry', 'ECHO-12……別の世界の亡霊まで……！');
      E.cut(false);
    } else if (ph === 3) {
      E.cut(true);
      E.shake(8, 40);
      await E.say('helmina:angry', 'まだよ……まだ……！　セラフィム、全出力！');
      await E.say('ruu:surprise', '〈うそ、ビームの量、ハンパない……！〉');
      await E.say('niko:serious', '……カナタ。ルウ。ニコの、こえ、きいて。');
      E.se('echo');
      E.flash(20);
      await E.cg('white', '', { wait: false });
      await E.say(null, '――♪　ラ……ラ、ラ……');
      await E.say(null, 'ニコの歌が、ふたつの機体をつないでいく。');
      await E.say('kanata', '……ルウの声が、聞こえる。');
      await E.say('ruu:shy', '〈……あんたの心臓の音、うるさいくらい聞こえるっての〉');
      await E.say('kanata:smile', 'なんとかなるって。……ふたりなら。');
      await E.say('ruu:smile', '〈……ふたりじゃないっしょ。みんなで、だよ〉');
      E.cgOff();
      const pl = F().player;
      pl.hp = pl.maxhp;
      pl.en = pl.maxen;
      if (s && !s.dead) s.def = 0;
      G.fx.ring(pl.x, pl.y - 18, 60, '#bff8ff');
      E.tint('rgba(150,240,255,0.06)');
      E.se('heal');
      await E.say(null, 'ハルカゼ改が、歌に共鳴して光を帯びる！　装甲が回復し、セラフィムの装甲がゆらいだ！');
      E.cut(false);
    }
  };

  // 戦いの後：星の歌
  C8.starSong = async function () {
    E.tint(null);
    E.exp(3000);
    E.cut();
    E.stopBgm();
    E.shake(8, 60);
    E.flash(14);
    E.se('bigexplode');
    await E.say(null, 'セラフィムが、光の粒になってほどけていく――。');
    E.npc({ id: 'c8_helmina', char: 'helmina', x: 17, y: 9, dir: 'down' });
    await E.wait(30);
    E.se('alarm');
    await E.say('mother', 'ゼロ・リライト……ジドウ シッコウ……ケイゾク……チュウ……。');
    await E.say('ruu:surprise', '〈うそ……止まんないの！？〉');
    await E.say('helmina:surprise', '……そんな。セラフィムが落ちれば、止まるはずじゃ……。');
    E.tint('rgba(255,120,180,0.14)');
    E.shake(4, 60);
    await E.say('niko:sad', 'スターシード……あばれてる。ヘルミナの、かなしいきもち、たべて、おおきくなってる。');
    await E.say(null, 'スターシードの光がふくれ上がる。世界の輪郭が、にじみはじめた。');
    await E.say('niko', '……カナタ。ルウ。ニコ、うたう。');
    await E.say('kanata:surprise', 'ニコ……？');
    await E.say('niko:smile', 'さっき、カナタとルウ、つながった。……こんどは、みんなと、つながる。');
    E.se('echo');
    E.flash(20);
    E.tint(null);
    await E.cg('white', '', { wait: false });
    E.bgm('final', { restart: true });
    await E.say(null, '――♪　ラ……ラ、ラ……　ラ、ラ……');
    await E.say(null, 'ニコの歌が、光になって広がっていく。中心核を越えて、コロニーじゅうへ。');
    await E.say(null, 'ミナト区の窓。ひだまり園の子どもたち。避難所の体育館。……コロニー中の灯りが、歌に重なっていく。');
    await E.say('lily', '〈みんな、聞こえる……？　この歌、いま、コロニーじゅうに流れてる……！〉', { radio: true, name: 'DJリリィ ― レディオ・スターダスト' });
    await E.say('tome', '〈……ああ。聞こえるよ、ニコちゃん〉');
    await E.say('kanata', '（聞こえる。ルウの声。ばあちゃんの声。父さんの声。……みんなの、声）');
    await E.say('ruu', '（あったかい。……ニセモノの空の下で、みんな、こんなにあったかかったんだ）');
    await E.cg('starseed', '');
    E.set('c8_calm');
    await E.cgCaption('スターシードの光が、ゆっくりと、やわらかい青に変わっていく。');
    E.cgOff();
    E.stopBgm(2);
    await E.say('helmina', '……この歌……。');
    await E.wait(60);
    await E.cg('white', '', { wait: false });
    await E.say('sys', '「……ママ」', { name: 'ちいさな声' });
    await E.say('helmina:surprise', '……ミア？');
    await E.say('sys', '「ママ。もういいよ」', { name: 'ミアの声' });
    await E.say('sys', '「ミア、ずっと見てたよ。ママ、ずっと、ずっと泣いてたね」', { name: 'ミアの声' });
    await E.say('sys', '「ミアのいない世界でも、ママには、わらっててほしいな」', { name: 'ミアの声' });
    await E.say('helmina:cry', '……ミア……ごめんね……。ママ、あなたに、なにも……。');
    await E.say('sys', '「ママ、だいすき。……だから、もういいよ」', { name: 'ミアの声' });
    await E.say(null, '光の中で、小さな手が、ヘルミナの頬にふれた――ような気がした。');
    E.cgOff();
    E.bgm('sad');
    await E.say('helmina:cry', '……私は……あの子のためと言いながら……あの子の声を、一度も、聞こうとしなかった……。');
    await E.say('helmina:sad', '……ゼロ・リライト、中止。マザーの制御を、返します。');
    E.se('ok');
    await E.say('mother', 'ゼロ・リライト……テイシ。……システム、フッキ シマス。');
    await E.say(null, 'スターシードが、静かに、閉じはじめた。');
    E.cut(false);
    await E.startChapter(9);
  };
})();
