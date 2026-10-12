// =============================================================
//  story/ch7.js — 第7章「崩れる空」
//   1. ヘルミナがマザーを掌握、ミラーが閉じる（星屑亭）→ 永遠の夜・避難開始（w_evac / c7_dark）
//   2. 避難誘導：ミナト区（橋の瓦礫・公園の子ども・ネコ）／第三中（ドローン・屋上のミミとシグ）／ネオン通り（操られた公安・アイゼン）
//   3. 地下シェルター（c7_shelter）：町の人々 → ユイと総督府タワーへ（c7_govtower・ステルス）
//   4. 総督との対決・アイゼンの決断 → リリィの全コロニー放送（灯り）
//   5. ギルのクラン参戦 → ハルカゼ改完成（overdrive）→ 宇宙港ゲート → 第7ドック防衛戦 → 発進 → 第8章へ
//  フラグ接頭辞 c7_ ／ マップは maps/c7.js
// =============================================================
(function () {
  const ch = () => G.state.chapter;
  const is7 = () => G.state.chapter === 7;
  const F = () => G.field;
  const C6 = G.C6 || {};
  const pin = C6.pin,
    unpin = C6.unpin,
    cast = C6.cast,
    watch = C6.watch;

  G.addItem('c7_linekey', { name: '総督非常回線キー', desc: '風見総督が最後までヘルミナに渡さなかった、非常回線と宇宙港封鎖の解除キー。' });

  // ---------- ヘルパー ----------
  const EVAC = ['c7_ev_minato', 'c7_ev_school', 'c7_ev_neon'];
  function evacObjective() {
    const n = EVAC.filter((k) => E.flag(k)).length;
    if (n < 3) E.objective('避難誘導：ミナト区・第三中・ネオン通り（' + n + '/3）');
    else E.objective('ミナト区北西の地下シェルターへ（公園の西の芝生）');
  }
  G.C7.evacObjective = evacObjective;
  async function evacDone(k, place) {
    E.set(k);
    E.se('get');
    E.toast('避難誘導完了：' + place, '#7dff9a');
    evacObjective();
    if (EVAC.every((x) => E.flag(x))) {
      await E.say('ruu', 'これで三か所ぜんぶ！ シェルターに行こう、みんなそこにいるはず。');
    }
  }
  // 指定IDの敵を全部倒したら（このマップにいる間に）run
  // （同じマップの E.reload() では途切れない。マップを出たら終わる。同じ組は二重に走らせない）
  const watching = {};
  function whenCleared(ids, run) {
    const mid = F().map.id;
    const key = mid + ':' + ids.join(',');
    if (watching[key]) return;
    watching[key] = true;
    const here = () => F().map && F().map.id === mid && !F().battle;
    (async () => {
      try {
        await G.tasks.until(() => (F().map && F().map.id !== mid) || ids.every((id) => E.flag('k_' + id)));
        if (F().map.id !== mid) return;
        await G.tasks.until(() => F().map.id !== mid || (here() && !G.ev.running && !G.ui.blocking()));
        if (F().map.id !== mid) return;
        G.ev.run(run);
      } finally {
        watching[key] = false;
      }
    })();
  }

  // ---------- 第7章の空気：赤い明滅と、ときどきの揺れ ----------
  if (!G.C7._ticker) {
    G.C7._ticker = true;
    let nextQuake = 60 * 20;
    const tick = () => {
      const f = G.field;
      if (!f || !f.map || G.scene !== G.fieldScene) return;
      if (f._c7tint && f.tint !== f._c7last) f._c7tint = false; // イベントが上書きした
      if (G.state.chapter !== 7 || !G.state.flags.c7_dark) {
        if (f._c7tint) {
          f.tint = null;
          f._c7tint = false;
        }
        return;
      }
      const def = f.map.def;
      const outdoor = !!def.outdoor || f.map.id === 'neon' || f.map.id === 'c7_port';
      if (outdoor && !f.cg) {
        if (f.tint === null || f._c7tint) {
          const warm = !!G.state.flags.c7_broadcast;
          const a = warm ? 0.05 + 0.015 * Math.sin(G.frame * 0.03) : 0.1 + 0.05 * Math.sin(G.frame * 0.05);
          const t = warm ? 'rgba(255,150,60,' + a.toFixed(3) + ')' : 'rgba(120,0,40,' + a.toFixed(3) + ')';
          f.tint = t;
          f._c7tint = true;
          f._c7last = t;
        }
        if (!G.ev.running && !f.battle && !G.ui.blocking() && !G.state.flags.c7_broadcast) {
          if (--nextQuake <= 0) {
            nextQuake = 60 * (22 + Math.floor(Math.random() * 20));
            G.audio.se('quake');
            f.shake = 5;
          }
        }
      } else if (f._c7tint) {
        f.tint = null;
        f._c7tint = false;
      }
    };
    G.tasks.until(() => {
      try {
        tick();
      } catch (e) {}
      return false;
    });
  }

  // =============================================================
  //  章の開始
  // =============================================================
  G.STORY.chapters[7] = async function () {
    E.time('night');
    E.party([]);
    G.state.mech.id = 'harukaze';
    E.set('c6_jin_freed');
    E.set('met_jin');
    E.unset('c7_dark');
    E.unset('w_evac');
    E.tint(null);
    E.objective('');
    await E.chapter(7);
    await E.warp('hoshikuzu', 7, 8, 'up', { noEnter: true });
    E.cut(true);
    E.hide('w_taxi');
    cast('c7_jin', 'jin', 4, 6, 'up');
    cast('c7_ruu', 'ruu', 6, 6, 'up');
    cast('c7_niko', 'niko', 8, 6, 'up');
    E.bgm('home');
    await E.say(null, '――翌朝、6時。いつもなら、ミラーが開いて光が差しこむ時刻。');
    await E.say(null, '……窓の外は、真っ暗なままだった。');
    await E.say('tome', 'おかしいね。もう6時だよ。……ミラーが開かない。');
    await E.say('niko:sad', '……ほしが、ざわざわ、してる。');
    E.stopBgm();
    E.se('alarm');
    E.camera(9, 3, { noWait: true });
    await E.wait(30);
    await E.say(null, '店のテレビが、勝手に点いた。砂嵐。そして――赤い円。');
    await E.say('mother:angry', 'オハヨウ、ゴザイマス。クレイドル7ノ、皆サン。本日ノ天気ハ……夜。明日モ、夜。ズット、ズット、夜デス。', { name: 'マザー' });
    E.bgm('tension');
    await E.say('helmina', 'おはようございます、クレイドル7の皆さん。わたしは、ヘルミナ・クロイツ。コロニー総合研究所の、主任研究員です。', { name: 'ヘルミナ（全域放送）' });
    await E.say('helmina', '管理AI〈マザー〉は、ただいまより、わたしの管理下に入りました。', { name: 'ヘルミナ（全域放送）' });
    await E.say('helmina', '怖がらないで。これから、すべてがやり直されます。戦争のなかった世界へ。誰も、何も、失わなかった世界へ。', { name: 'ヘルミナ（全域放送）' });
    await E.say('helmina', '……それまでの、少しのあいだ。どうか、おやすみなさい。', { name: 'ヘルミナ（全域放送）' });
    E.cameraReset();
    E.se('quake');
    E.shake(8, 70);
    await E.wait(30);
    await E.cg('colony_dark', '――空の向こうで、巨大なミラーが、一枚、また一枚と閉じていく。');
    await E.cgCaption('街灯がまたたき、遠くでサイレンが鳴りはじめた。');
    await E.cgCaption('クレイドル7に、明けない夜が来た。');
    E.cgOff();
    E.set('c7_dark');
    E.set('w_evac');
    E.time('night');
    await E.say('ruu:surprise', '……うそでしょ。ミラーが、全部……。');
    await E.say('jin', '……やられた。マザーの全権限だ。空調も、ミラーも――回転制御まで。');
    await E.say('kanata:serious', '回転制御って……コロニーの？');
    await E.say('jin', 'スターシードを開くには、とてつもないエネルギーがいる。ヘルミナは、コロニーの回転エネルギーを中心核に回すつもりだ。');
    await E.say('jin', '回転が乱れれば、重力が狂う。地震が起きる。建物が崩れる。……シグの世界と、同じ道だ。');
    E.se('door');
    cast('c7_doc', 'doc', 7, 10, 'up');
    await E.move('c7_doc', [[7, 9], [10, 9], [10, 7]]);
    E.face('c7_doc', 'left');
    await E.say('doc', 'ジン！ 外はひどいもんだ。公安の機体も、警備ボットも、マザーに乗っ取られて暴れとる。');
    await E.say('doc', '総督府は沈黙、公安本部も応答なし。……大人は誰もアテにならんわい。');
    await E.say('jin', '……ヘルミナを止めるには、外の宇宙からミラー施設を抜けて、中心核まで行くしかない。');
    await E.say('jin', 'だが宇宙港は封鎖されている。ゲートを開けるには、総督の権限がいる。それに――');
    await E.say('jin', '今のハルカゼでは、宇宙はもたない。……ドク、設計図の「最後のページ」を使う。ハルカゼ改を仕上げるぞ。');
    await E.say('doc', 'ふん。5年待ったわい。……ガレージで待っとるぞ。');
    await E.say('tome', 'あたしは避難所に配るラーメンを作るよ。百杯じゃ足りないね。');
    await E.say('ponta', 'オイラも手伝うっす！ 寸胴運びなら任せるっす！ ……カナタたちは、どうするっすか？');
    await E.say('kanata:serious', 'オレたちは、町のみんなを避難させる。');
    await E.say('ruu:serious', 'ミナト区、学校、ネオン通り。手分けしてる時間はないから、三人で全部まわるよ。');
    await E.say('niko:serious', 'ニコ、みんなの、こえ、さがす。こわがってる、こえ、すぐ、わかる。');
    E.se('cursor');
    await E.say(null, 'ピピッ。カナタの携帯端末が鳴った。');
    await E.say('yui', '春瀬くん！ 委員長の風見です。ミナト区の第2地下シェルターを開放しました！ 公園の西の芝生にある入口です。', { name: 'ユイ（通信）' });
    await E.say('yui', '避難してくる人の誘導、お願いできますか？ ……それと、父と、連絡がとれないんです。', { name: 'ユイ（通信）' });
    await E.say('kanata', '任せとけ、委員長。……親父さんのことは、あとで一緒に考えよう。');
    await E.say('jin', 'カナタ。……無茶はするな。いや、するだろうな。俺の息子だ。');
    await E.say('jin', 'なら、せめて無事に帰ってこい。ハルカゼ改を、お前に渡すまでは。');
    await E.say('kanata:smile', 'なんとかなるって。……なんとか、してくる。');
    ['c7_jin', 'c7_ruu', 'c7_niko', 'c7_doc'].forEach((id) => E.remove(id));
    E.party(['ruu', 'niko']);
    evacObjective();
  };

  // 星屑亭（7章：ばあちゃんの店は炊き出し中）
  G.addToMap('hoshikuzu', {
    npcs: [
      {
        id: 'c7_hk_ponta', char: 'ponta', x: 11, y: 8, dir: 'up', move: 'still',
        show: () => is7() && !E.flag('c7_kai'),
        talk: async () => {
          await E.say('ponta', 'ばあちゃんの手伝いっす！ ラーメンを寸胴ごとシェルターに運ぶっす！ ぶっひゃー、重いっす！');
          await E.say('ponta', 'ハルカゼ改の配線も、あとでオイラがやるっす！ カナタたちは避難誘導、がんばるっす！');
        },
      },
    ],
  });

  // =============================================================
  //  ミナト区
  // =============================================================
  const minatoTasks = () => ['c7_m_bridge', 'c7_m_park', 'c7_m_cat'];
  function minatoObjective() {
    const left = [];
    if (!E.flag('c7_m_bridge')) left.push('橋の瓦礫');
    if (!E.flag('c7_m_park')) left.push('公園の子ども');
    if (!E.flag('c7_m_cat')) left.push(E.flag('c7_kiyo_ask') ? '南の路地のネコ' : '南の路地のキヨさん');
    if (left.length) E.objective('ミナト区：' + left.join('・'));
  }
  async function checkMinato() {
    if (E.flag('c7_ev_minato')) return;
    minatoObjective();
    if (minatoTasks().every((k) => E.flag(k))) {
      await E.say('w_police', 'ミナト区の逃げ遅れは、これでゼロだ！ ありがとう、君たち！', { name: '交番のマモルさん' });
      await evacDone('c7_ev_minato', 'ミナト区');
    }
  }
  G.addToMap('minato', {
    objects: [
      { p: 'c7_bunker', x: 18, y: 11, show: () => is7(), msg: '地下避難シェルターの入口。緑の非常灯がともっている。' },
      { p: 'c6_rubble', x: 33, y: 33, w: 6, seed: 21, show: () => is7() && !E.flag('c7_m_bridge') },
      { p: 'car', x: 35, y: 32, col: '#c04a3a', show: () => is7() && !E.flag('c7_m_bridge') },
      { p: 'w_cat', x: 12, y: 45, col: '#e8a050', stripe: true, nosolid: true, show: () => is7() && E.flag('c7_kiyo_ask') && !E.flag('c7_cat_got') },
    ],
    warps: [{ x: 19, y: 11, to: 'c7_shelter', tx: 4, ty: 21, dir: 'up', se: 'step', show: () => is7() }],
    npcs: [
      {
        id: 'c7_mamoru', char: 'w_police', x: 14, y: 22, dir: 'down', move: 'still',
        show: () => is7() && !E.flag('c7_ev_minato'),
        talk: async () => {
          const left = [];
          if (!E.flag('c7_m_bridge')) left.push('大通りの橋で、瓦礫の下に車が埋まってる');
          if (!E.flag('c7_m_park')) left.push('公園の遊具に、子どもたちが取り残されてる');
          if (!E.flag('c7_m_cat')) left.push('南の路地のキヨさんが、避難をいやがってる');
          await E.say('w_police', left.length ? '残っているのは……' + left.join('。') + '。頼む！' : 'あとは任せてくれ。', { name: '交番のマモルさん' });
        },
      },
      {
        id: 'c7_tanaka', char: 'w_salaryman', x: 36, y: 34, dir: 'up', move: 'still',
        show: () => is7() && !E.flag('c7_m_bridge'),
        talk: async () => await E.say('w_salaryman', 'た、助けてくれ……！ 車のドアが、瓦礫で開かないんだ……！'),
      },
      { id: 'c7_kenta', char: 'w_kenta', x: 66, y: 17, dir: 'down', move: 'still', show: () => is7() && !E.flag('c7_m_park'), talk: async () => await E.say('w_kenta:cry', 'うわああん！ ロボットが、こっち来るよお！') },
      { id: 'c7_miku', char: 'w_miku', x: 68, y: 17, dir: 'down', move: 'still', show: () => is7() && !E.flag('c7_m_park'), talk: async () => await E.say('w_miku:cry', 'こわくないもん……こわくない、もん……！') },
      { id: 'c7_yuta', char: 'w_yuta', x: 65, y: 18, dir: 'up', move: 'still', show: () => is7() && !E.flag('c7_m_park'), talk: async () => await E.say('w_yuta', 'カイト、とんでっちゃう……風、ないのに……！') },
      {
        id: 'c7_kiyo', char: 'w_catlady', x: 27, y: 43, dir: 'down', move: 'still',
        show: () => is7() && !E.flag('c7_m_cat'),
        talk: async () => await kiyoTalk(),
      },
    ],
    checks: [
      { x: 33, y: 33, w: 6, show: () => is7() && !E.flag('c7_m_bridge'), run: async () => await bridgeRescue() },
      { x: 35, y: 32, w: 3, show: () => is7() && !E.flag('c7_m_bridge'), run: async () => await bridgeRescue() },
      {
        x: 12, y: 45, show: () => is7() && E.flag('c7_kiyo_ask') && !E.flag('c7_cat_got'),
        run: async () => {
          E.cut(true);
          await E.say(null, '路地の隅、ゴミ箱の陰で、トラ柄のネコが丸くなってふるえている。');
          await E.say('niko', '……だいじょうぶ。こわくない。ニコも、こわかった。');
          await E.say(null, 'ニコがそっと手をのばすと、ネコは「ニャ」と鳴いて、腕の中におさまった。');
          E.set('c7_cat_got');
          E.reload();
          await E.say('ruu:smile', 'さっすがニコ。キヨさんのとこに連れてこ。');
        },
      },
    ],
    events: [
      {
        x: 60, y: 12, w: 11, h: 8, once: 'c7_park_seen',
        cond: () => is7() && !E.flag('c7_m_park'),
        run: async () => {
          E.cut(true);
          E.camera(66, 16);
          await E.wait(20);
          await E.say('w_miku:cry', 'たすけてえ！', { name: '女の子の声' });
          await E.say(null, '遊具の上に、子どもが三人。そのまわりを、目を赤く光らせた清掃ボットがうろついている。');
          await E.say('kanata:serious', 'マザーに操られてる……！ ルウ、ニコ、子どもたちを守るぞ！');
          await E.say('ruu:angry', 'あたしの前で子どもに手ぇ出すとか、いい度胸じゃん！');
          E.cameraReset();
        },
      },
    ],
    enemies: [
      { type: 'bot', x: 62, y: 15, lv: 10, id: 'c7_pb1', show: () => is7() },
      { type: 'bot', x: 69, y: 14, lv: 10, id: 'c7_pb2', show: () => is7() },
      { type: 'bot', x: 63, y: 18, lv: 11, id: 'c7_pb3', show: () => is7() },
      { type: 'drone', x: 67, y: 13, lv: 10, id: 'c7_pb4', show: () => is7() },
      { type: 'drone', x: 64, y: 14, lv: 10, id: 'c7_pb5', show: () => is7() },
      { type: 'bot', x: 26, y: 44, lv: 10, id: 'c7_mb1', show: () => is7() },
      { type: 'drone', x: 47, y: 23, lv: 10, id: 'c7_mb2', show: () => is7() },
      { type: 'bot', x: 20, y: 30, lv: 10, id: 'c7_mb3', show: () => is7() },
    ],
    onEnter: async () => {
      if (!is7() || !E.flag('w_evac')) return;
      if (!E.flag('c7_m_park')) whenCleared(['c7_pb1', 'c7_pb2', 'c7_pb3', 'c7_pb4', 'c7_pb5'], parkRescue);
      if (E.flag('c7_minato_in')) return;
      E.set('c7_minato_in');
      E.cut(true);
      E.camera(13, 21);
      await E.wait(20);
      await E.say(null, '街は、見たことのない顔をしていた。消えた街灯。鳴りやまないサイレン。どこかでガラスの割れる音。');
      await E.move('c7_mamoru', [[13, 22], [12, 22]]);
      await E.say('w_police', 'カナタくん！ 星屑亭の！ 無事だったか！', { name: '交番のマモルさん' });
      await E.say('w_police', 'みんな北西の地下シェルターに向かってる。だが、逃げ遅れが三か所あるんだ。', { name: '交番のマモルさん' });
      await E.say('w_police', '大通りの橋で、瓦礫の下に車が埋まってる。公園では子どもたちが暴走ボットに囲まれてる。それと、南の路地のキヨさんが、ネコを置いていけないって……。', { name: '交番のマモルさん' });
      await E.say('w_police', 'わたし一人じゃ手が回らない。……頼めるか。', { name: '交番のマモルさん' });
      await E.say('kanata:serious', 'もちろん。ルウ、ニコ、行こう。');
      await E.move('c7_mamoru', [[14, 22]]);
      E.face('c7_mamoru', 'down');
      E.cameraReset();
      minatoObjective();
    },
  });

  async function bridgeRescue() {
    E.cut(true);
    await E.say(null, '橋の上で、ビルの外壁が崩れ落ちていた。瓦礫の下に、赤い車が一台。');
    await E.say('w_salaryman', 'だ、誰か……！ ドアが開かないんだ！', { name: '車の中の声' });
    await E.say('kanata:serious', 'この量、生身じゃムリだ。……ハルカゼ！');
    await E.say('ruu', '町の中で機体出すとか……。いいよ、今夜は誰も怒らない。');
    await E.mech(true, G.state.mech.id === 'harukaze2' ? 'harukaze2' : 'harukaze');
    await E.say('kanata:serious', 'ゆっくり……ゆっくりだ。車をつぶさないように……。');
    const sc = await E.timing({ title: '瓦礫を持ち上げる', rounds: 3, speed: 1.3, zone: 0.22, labels: ['腕を差しこむ', '持ち上げる', 'そっと、どける'] });
    E.se('mechstep');
    E.shake(6, 30);
    E.set('c7_m_bridge');
    E.reload();
    await E.wait(20);
    if (sc < 2) await E.say('kanata', 'あぶね……ちょっと車、こすった。ごめん！');
    await E.mech(false);
    E.reload();
    cast('c7_tanaka2', 'w_salaryman', 36, 33, 'up');
    await E.say('w_salaryman', 'た、助かった……！ ありがとう、本当にありがとう……！');
    await E.say('w_salaryman', '今日、娘の誕生日なんだ。ケーキを取りに行った帰りで……ははっ、ケーキ、ぐしゃぐしゃだ。');
    await E.say('niko', 'ケーキ、つぶれても、あまいの、かわらない。');
    await E.say('w_salaryman', '……そうだね。娘と半分こするよ。シェルターに行けばいいんだね。');
    E.remove('c7_tanaka2');
    E.toast('タナカさんがシェルターへ向かった', '#7dff9a');
    await checkMinato();
  }

  async function parkRescue() {
    if (E.flag('c7_m_park')) return;
    E.cut(true);
    await E.say('kanata', 'もう大丈夫だ！ ケガしてないか？');
    await E.say('w_kenta', 'カナタ兄ちゃん……！ すげえ！ ロボット、ぜんぶやっつけた！');
    await E.say('w_miku', 'こわくなかったもん！ ……ちょっとだけ、こわかった。');
    await E.say('w_yuta', 'カイト……空、暗くなって、見えなくなっちゃった。');
    await E.say('ruu:smile', 'カイトはまた今度ね。今は、シェルター。お姉さんについてくる？');
    await E.say('w_kenta', 'ルウ姉ちゃん、こわい顔してるけど優しいって、母ちゃんが言ってた！');
    await E.say('ruu:angry', 'こわい顔は余計！');
    E.set('c7_m_park');
    E.reload();
    E.toast('子どもたちがシェルターへ向かった', '#7dff9a');
    await checkMinato();
  }

  async function kiyoTalk() {
    E.cut(true);
    if (E.flag('c7_cat_got')) {
      await E.say('w_catlady', 'ミケ！ ……ああ、よかった、よかったねえ。');
      await E.say('w_catlady', 'この子はね、亡くなったじいさんが拾ってきた子なのさ。この子まで失くしたら、あたしゃ、じいさんに合わせる顔がないよ。');
      await E.say('w_catlady', 'ありがとうね、坊やたち。ほら、シェルターに行こうかね。ほかの子たちは、ご近所さんが先に連れてってくれたから。');
      E.set('c7_m_cat');
      E.reload();
      E.toast('キヨさんがシェルターへ向かった', '#7dff9a');
      await checkMinato();
      return;
    }
    await E.say('w_catlady', 'あたしは行かないよ。ミケが……トラ柄の子が、さっきの揺れで逃げちまったんだ。');
    const i = await E.ask('w_catlady', 'あの子を置いて、あたしだけ逃げるなんてできないよ。', ['ネコを探してくる', 'キヨさんの命が先だよ'], {});
    if (i === 1) {
      await E.say('kanata:serious', 'キヨさん、ネコも大事だけど、キヨさんの命が――');
      await E.say('w_catlady', 'わかってるさ。……わかってるけどね。');
      await E.say('ruu', '……カナタ。探してあげよ。ちょっとだけなら、間に合う。');
    }
    await E.say('niko', 'ニコ、さがす。ネコの、こえも、きこえる。……ふるえてる、こえ。みなみの、ほう。');
    E.set('c7_kiyo_ask');
    E.reload();
    E.objective('ミナト区：南の路地でトラ柄のネコ〈ミケ〉を探す（ほかの逃げ遅れも）');
  }

  // =============================================================
  //  第三中学校
  // =============================================================
  const SCHOOL_IDS = ['c7_sd1', 'c7_sd2', 'c7_sd3', 'c7_sd4', 'c7_sd5', 'c7_sd6'];
  G.addToMap('school_yard', {
    npcs: [
      {
        id: 'c7_vargas', char: 'vargas', x: 22, y: 34, dir: 'up', move: 'still',
        show: () => is7() && !E.flag('c7_ev_school'),
        talk: async () => {
          if (!E.flag('c7_s_drones')) await E.say('vargas', '校庭のドローンを片づけろ！ 生徒たちは体育館の裏に固まっとる！ 廊下を走るな！ 走るなら全力で走れ！');
          else await E.say('vargas', 'ミミは屋上だ！ 校舎に入って、廊下の西の階段から上がれ！');
        },
      },
      {
        id: 'c7_kyo', char: 'kyosuke', x: 24, y: 34, dir: 'up', move: 'still',
        show: () => is7() && !E.flag('c7_s_drones') && E.flag('c7_school_in'),
        talk: async () => await E.say('kyosuke', 'あぁ？ ボサっとしてんじゃねえ。……借りは返す。さっさと片づけるぞ。'),
      },
    ],
    enemies: [
      { type: 'drone', x: 14, y: 20, lv: 10, id: 'c7_sd1', show: () => is7() },
      { type: 'drone', x: 30, y: 16, lv: 10, id: 'c7_sd2', show: () => is7() },
      { type: 'drone', x: 36, y: 22, lv: 11, id: 'c7_sd3', show: () => is7() },
      { type: 'bot', x: 20, y: 14, lv: 10, id: 'c7_sd4', show: () => is7() },
      { type: 'bot', x: 8, y: 26, lv: 11, id: 'c7_sd5', show: () => is7() },
      { type: 'drone', x: 24, y: 12, lv: 11, id: 'c7_sd6', show: () => is7() },
    ],
    onEnter: async () => {
      if (!is7() || !E.flag('w_evac')) return;
      if (!E.flag('c7_s_drones') && E.flag('c7_school_in')) whenCleared(SCHOOL_IDS, schoolCleared);
      if (E.flag('c7_school_in')) return;
      E.set('c7_school_in');
      E.cut(true);
      await E.say(null, '真っ暗な校庭を、赤い光が飛びかっている。校舎の警備ドローンだ。');
      await E.say('vargas', 'カナタ！ ルウ！ ニコ！ 無事だったか！');
      await E.move('player', 'U');
      await E.say('vargas', '警備ドローンがマザーに乗っ取られた！ 避難の途中で生徒が何人か残っとる！');
      E.reload();
      await E.say('kyosuke', '……チッ。遅えんだよ、2年坊。');
      await E.say('kanata:surprise', 'キョウスケ先輩！');
      await E.say('kyosuke', 'あぁ？ 勘違いすんな。学校がなくなったら、俺がシメる場所がなくなるだけだ。……借りは返す。手ぇ貸せ。');
      await E.say('vargas', '廊下を走るな！ ……と言いたいところだが、今夜は特別だ。全力で走れ！ 行けえ！');
      E.join('kyosuke');
      E.objective('第三中：校庭の警備ドローンを止める');
      whenCleared(SCHOOL_IDS, schoolCleared);
    },
  });
  async function schoolCleared() {
    if (E.flag('c7_s_drones')) return;
    E.set('c7_s_drones');
    E.cut(true);
    await E.say('kyosuke', '……ふん。悪くねえ。');
    await E.say('vargas', 'よくやった！ これで生徒を外に出せる！ ……だが、ミミがいない。');
    await E.say('vargas', '「この空は記録しとかなきゃいけないっす」とか言って、屋上に上がったきりだ！');
    await E.say('ruu', 'あの子らしい……。');
    await E.say('kyosuke', '下のガキどもは俺が連れてく。てめえらはあのチビ記者を拾ってこい。……借りは、これでチャラだ。');
    E.leave('kyosuke');
    E.reload();
    E.objective('第三中：屋上のミミを迎えに行く（廊下の西の階段）');
  }
  G.addToMap('rooftop', {
    onEnter: async () => {
      if (!is7() || !E.flag('c7_s_drones') || E.flag('c7_ev_school')) return;
      E.cut(true);
      cast('c7_mimi', 'mimi', 17, 11, 'up');
      cast('c7_sig', 'sig', 21, 10, 'up');
      E.bgm('sad');
      await E.say(null, '屋上。フェンスの前で、小さな背中がカメラを構えている。その隣に、白い髪の少年。');
      await E.move('player', [[6, 10], [15, 10], [15, 11]]);
      await E.say('kanata', 'ミミ！ シグも！？');
      E.face('c7_mimi', 'player');
      await E.say('mimi', '先輩！ ……すんません、どうしても、この空を撮っときたくて。');
      await E.say('mimi', 'だって、記録しとかないと。明日、誰かが「そんな夜はなかった」って言っても、写真は嘘つかないっすから。');
      await E.say('ruu', '……あんた、ほんと根性あるよね。');
      await E.say('sig', '……僕の世界でも、この夜がありました。');
      E.face('c7_sig', 'player');
      await E.say('sig', 'ミラーが閉じて、三日後に、空が落ちた。……あのとき、僕は、何も記録しなかった。何も、残せなかった。');
      await E.say('mimi', 'シグ先輩……。');
      await E.say('sig', 'だから、この写真は、残してください。……空が落ちなかった世界の、最初の一枚として。');
      await E.say('mimi', '……はいっす。この写真、絶対に記事にするっす。「クレイドル7の、いちばん長い夜」。');
      await E.say('mimi', 'で、見出しの続きは「――そして朝が来た」っすよ。先輩たちが、そうしてくれるんすよね？');
      await E.say('kanata:smile', 'ああ。……約束する。');
      await E.say('sig', '僕は先に宇宙港の様子を見てきます。……ゼフィールが、何かを感じている。');
      E.remove('c7_sig');
      E.flash(6);
      E.se('boost');
      await E.say('mimi', 'さ、シェルター行くっす！ あ、先輩、そのポーズで一枚！');
      E.se('ok');
      E.flash(4);
      await E.say(null, 'パシャッ。');
      E.remove('c7_mimi');
      await evacDone('c7_ev_school', '第三中学校');
    },
  });

  // =============================================================
  //  ネオン通り
  // =============================================================
  G.addToMap('neon', {
    onEnter: async () => {
      if (!is7() || !E.flag('w_evac') || E.flag('c7_ev_neon')) return;
      E.cut(true);
      cast('c7_obaa', 'w2_obaa', 18, 16, 'right');
      cast('c7_tako', 'w2_tako', 17, 15, 'right');
      cast('c7_hg1', 'guard', 26, 15, 'left');
      cast('c7_hg2', 'guard', 27, 17, 'left');
      cast('c7_hg3', 'guard2', 29, 16, 'left');
      E.camera(20, 16);
      await E.wait(20);
      await E.say(null, 'ネオンの消えた通り。屋台の陰で、老人たちが身を寄せあっている。');
      await E.say(null, 'その前に、公安の隊員たちが並んでいた。……ヘルメットのバイザーが、マザーと同じ赤に光っている。');
      await E.say('guard', '……避難……ヲ……妨害スル者ハ……排除……。', { name: '公安隊員？' });
      await E.say('w2_tako', 'なんだってんだ、こいつら……！ 呼びかけても返事ひとつしやがらねえ！');
      await E.say('niko:cry', '……このひとたち、なかで、ないてる。いたい、いたいって。');
      await E.say('kanata:serious', '強化スーツごと操られてるのか……！ 止めるぞ！');
      E.cameraReset();
      ['c7_hg1', 'c7_hg2', 'c7_hg3'].forEach((id) => E.remove(id));
      E.cut(false);
      const won = await E.battle({
        x: 14, y: 16, dir: 'right',
        enemies: [
          { type: 'guard', x: 25, y: 14, lv: 11, name: '制御された公安隊員' },
          { type: 'guard', x: 26, y: 18, lv: 11, name: '制御された公安隊員' },
          { type: 'guard', x: 28, y: 16, lv: 11, name: '制御された公安隊員' },
          { type: 'guard2', x: 31, y: 16, lv: 11, name: '制御された特務隊員' },
        ],
        bgm: 'battle', title: 'BATTLE!', sub: 'マザーに操られた公安隊員を止めろ',
      });
      if (!won) return;
      E.cut(true);
      E.teleport('player', 15, 16, 'right');
      cast('c7_obaa', 'w2_obaa', 18, 16, 'right');
      cast('c7_tako', 'w2_tako', 17, 15, 'right');
      await E.say('ruu', 'スーツの制御、止まったみたい。……みんな、気絶してるだけ。');
      E.se('step');
      cast('c7_eisen', 'eisen', 34, 16, 'left');
      await E.move('c7_eisen', [[22, 16]], { speed: 1.4 });
      E.bgm('tension');
      await E.say('eisen', '…………。');
      await E.say('kanata:serious', 'アイゼン少佐……！');
      await E.say('eisen', '……私の部下だ。マザー経由で、強化スーツの制御を奪われた。本部の命令系統も、すべてマザーに握られている。');
      await E.say('eisen', '……公安は、もう公安ではない。');
      await E.say('ruu:angry', 'あんたたちが、ニコを追っかけまわしてる間にね！');
      await E.say('eisen', '……返す言葉もない。');
      await E.say('eisen', '春瀬カナタ。……なぜ戦う。子供が出る幕ではない夜だ。');
      const i = await E.ask('kanata:serious', '……少佐。', ['守りたいから', '大人が誰も来なかったから'], {});
      if (i === 0) await E.say('kanata:serious', '守りたいからです。ばあちゃんの店も、この街も、ニコも。……理由、それだけじゃだめですか。');
      else await E.say('kanata:serious', '大人が誰も来なかったからです。……だから、オレたちが来た。');
      await E.say('eisen', '………………。');
      await E.say('eisen', '……確かめねばならんことがある。総督府へ行く。');
      await E.say('eisen', 'お前たちは、民間人の避難を続けろ。……それが、今夜いちばん正しい仕事だ。');
      await E.move('c7_eisen', [[34, 16]], { speed: 1.4 });
      E.remove('c7_eisen');
      await E.say('w2_tako', '助かったぜ、坊主たち。……たこ焼き器、置いてきちまったなあ。');
      await E.say('w2_obaa', 'ありがとうねえ。夜の散歩が趣味でも、こんな夜はごめんだよ。');
      E.remove('c7_obaa');
      E.remove('c7_tako');
      await evacDone('c7_ev_neon', 'ネオン通り');
      await E.say('ruu', 'ねえ、ラジオ塔……リリィ、大丈夫かな。');
    },
  });
  G.addToMap('radio_booth', {
    onEnter: async () => {
      if (!is7()) return;
      if (E.flag('c7_eisen_ally') && !E.flag('c7_broadcast')) return await broadcast();
      if (E.flag('c7_lily_pre')) return;
      E.set('c7_lily_pre');
      E.cut(true);
      await E.say('lily', 'ルウ！ カナタくんたちも！ ……来てくれたんだ。');
      await E.say('lily', 'ごめん、今夜はラジオ、届けられないの。電波塔もマザーに押さえられちゃってさ。いつもの抜け道も、ぜんぶふさがれてる。');
      await E.say('lily', '総督府の非常回線なら、マザーとは別系統なんだけど……そんなの、総督本人じゃないと使えないし。');
      await E.say('kanata:think', '総督……ユイの、親父さん。');
      await E.say('lily', 'みんな、真っ暗な中で、ひとりぼっちだと思ってる。……声を届けたいのに。DJが声を出せないなんて、最低。');
      await E.say('ruu', 'リリィ……。');
    },
  });

  // =============================================================
  //  地下シェルター
  // =============================================================
  const evacAll = () => EVAC.every((k) => E.flag(k));
  const folk = (id, char, x, y, dir, cond, lines, extra) =>
    Object.assign({ id, char, x, y, dir: dir || 'down', move: 'still', show: () => is7() && (!cond || cond()), talk: async () => { for (const l of [].concat(typeof lines === 'function' ? lines() : lines)) await (Array.isArray(l) ? E.say(l[0], l[1]) : E.say(char, l)); } }, extra || {});
  G.addToMap('c7_shelter', {
    onEnter: async () => {
      if (!is7()) return;
      if (!E.flag('c7_shelter_in')) {
        E.set('c7_shelter_in');
        E.cut(true);
        await E.say(null, '地下シェルター。コンクリートの壁の向こうから、ときおり地鳴りが響く。');
        await E.say(null, '毛布にくるまる人。泣きやまない赤ちゃん。それでも、誰かが誰かに、温かい飲み物を手渡している。');
        await E.say('yui', '春瀬くん！ ルウさん、ニコさんも！ ……よかった、無事で。');
        if (!evacAll()) await E.say('yui', '避難誘導、ありがとうございます。まだ残っている場所があれば、お願いします。ここはわたしが守ります。');
      }
      if (evacAll() && !E.flag('c7_shelter_meet')) await shelterMeet();
    },
    npcs: [
      {
        id: 'c7s_yui', char: 'yui', x: 21, y: 6, dir: 'down', move: 'still',
        show: () => is7() && !E.flag('c7_gov_go'),
        talk: async () => {
          if (!evacAll()) await E.say('yui', '残りの避難誘導、お願いします。……わたしは、ここで名簿をつけています。総督の娘ですから。せめて、これくらいは。');
          else await shelterMeet();
        },
      },
      folk('c7s_hoken', 'w2_hoken', 38, 15, 'left', null, [], {
        talk: async () => {
          await E.say('w2_hoken', '救護所よ。ケガはない？ ……無理しすぎ。ほら、じっとして。');
          E.heal();
          E.se('heal');
          E.toast('HP・ENが全回復した', '#7dff9a');
        },
      }),
      folk('c7s_stall', 'w2_onigiri', 23, 8, 'down', null, [], {
        talk: async () => {
          await E.say('w2_onigiri', 'おにぎり屋のサチだよ。星屑亭のトメさんから、ラーメンが寸胴で届いたからね！ 好きなだけ持っておいき。お代は、朝が来てからでいいよ。');
          await E.shop(['ramen', 'onigiri', 'soda', 'energy', 'repair'], '炊き出し（星屑亭直送）');
        },
      }),
      folk('c7s_vargas', 'vargas', 13, 12, 'down', () => E.flag('c7_ev_school'), [
        '生徒は全員無事だ！ 点呼もとった！ ……ミミは写真の整理で忙しいらしい。',
        'お前たちを止めはせん。教師失格かもしれんがな。……その代わり、帰ってきたら、全員そろって俺の授業を受けろ。いいな！',
      ]),
      folk('c7s_mimi', 'mimi', 15, 13, 'left', () => E.flag('c7_ev_school'), [
        '先輩！ シェルターのみんなの顔、撮らせてもらってるっす。不安な顔も、笑ってる顔も。',
        '……全部、記録するっす。朝が来たら、みんなで見るっすよ。',
      ]),
      folk('c7s_ponta', 'ponta', 25, 11, 'left', () => E.flag('c7_ev_minato'), [
        'ラーメン、運び終わったっす！ 腕がパンパンっす！',
        'ハルカゼ改の配線、あとはオイラの仕上げだけっす。カナタたちの用事がすんだら、ガレージに来てほしいっす！',
      ]),
      folk('c7s_kyosuke', 'kyosuke', 3, 18, 'right', () => E.flag('c7_ev_school'), ['……ガキどもが騒ぐから、見張ってるだけだ。勘違いすんな。', ['w_kenta', 'キョウスケ兄ちゃん、肩車して！'], ['kyosuke', '……チッ。一回だけだぞ。']]),
      folk('c7s_pigeon', 'w_pigeon', 3, 5, 'right', null, [
        'ハトたちは置いてきちまった。ロボットのハトだから大丈夫だって、みんな言うがね。',
        '……あいつらにも、こわいって気持ちがある気がしてな。朝が来たら、迎えに行ってやらんと。',
      ]),
      folk('c7s_sora', 'w_sora', 6, 15, 'up', null, [
        'ねえ、おそらのテレビ、こわれちゃったの？',
        ['kanata:smile', 'うん、ちょっとだけな。……オレたちが直してくる。'],
        ['w_sora', 'ほんと？ なおったら、また、あおいの、うつる？ ……やくそくね！'],
      ]),
      folk('c7s_veteran', 'w_veteran', 17, 7, 'left', null, [
        'わしは軌道戦争で、空が燃えるのを見た。……それに比べりゃ、暗いだけの空なんぞ、なんてことはない。',
        '星屑のトメがな、昔、言っとった。「空が暗いときほど、ラーメンはうまい」ってな。……はは、届いたラーメン、うまかったぞ。',
      ]),
      folk('c7s_motherfan', 'w_mother_fan', 19, 14, 'down', null, [
        'マザーは……わたしたちを見守ってくれてたのよ。毎朝「オハヨウゴザイマス」って。',
        'あの声が、こわいなんて。……ねえ、マザーは悪くないのよね？ 誰かに、無理やり……。',
        ['niko:sad', '……マザーの、こえも、ないてる。ほんとうは、いやだって。'],
        ['w_mother_fan', '……そう。そうよね。……ありがとう、お嬢ちゃん。'],
      ]),
      folk('c7s_tanaka', 'w_salaryman', 10, 12, 'down', () => E.flag('c7_m_bridge'), [], {
        talk: async () => {
          if (E.flag('c7_tanaka_gift')) return await E.say('w_salaryman', '娘がね、ぐしゃぐしゃのケーキ、「世界一おいしい」って。……生きててよかったよ。');
          await E.say('w_salaryman', '助けてくれて、ありがとう。……娘の誕生日なのに、プレゼントも車の中に置いてきちゃってね。');
          if (E.has('melonpan')) {
            const i = await E.ask('w_salaryman', '（娘さんに、何か渡せるものは……）', ['メロンパンをあげる', 'なにもしない'], { cancel: 1 });
            if (i === 0) {
              E.take('melonpan', 1);
              E.set('c7_tanaka_gift');
              await E.say('w_salaryman', 'いいのかい！？ ……ありがとう。娘、メロンパンが大好きなんだ。');
              await E.say('w_salaryman', 'お礼にこれを。会社の非常用キットなんだけど、機械にも使えるらしい。');
              await E.give('repair2', 1);
              return;
            }
          }
          await E.say('w_salaryman', 'でも、ケーキはぐしゃぐしゃでも甘いからね。……それで十分さ。');
        },
      }),
      folk('c7s_kenta', 'w_kenta', 8, 16, 'left', () => E.flag('c7_m_park'), ['カナタ兄ちゃん、ロボットやっつけたとこ、かっこよかった！ オレも大きくなったらAF乗る！']),
      folk('c7s_miku', 'w_miku', 9, 17, 'up', () => E.flag('c7_m_park'), ['こわくなかったもん！ ……ルウ姉ちゃんが手ぇつないでくれたから、こわくなかったもん。']),
      folk('c7s_yuta', 'w_yuta', 5, 17, 'right', () => E.flag('c7_m_park'), ['ここ、風、ないね。……外も、なかったけど。', '朝になったら、カイト、あげに行こう。風がなくても、走れば、あがるんだ。']),
      folk('c7s_kiyo', 'w_catlady', 12, 7, 'down', () => E.flag('c7_m_cat'), ['ミケも、おとなしくしてるよ。ほら、ニコちゃんのひざが好きみたいだねえ。', ['niko:smile', 'ミケ、あったかい。']]),
      folk('c7s_tako', 'w2_tako', 27, 13, 'down', () => E.flag('c7_ev_neon'), ['たこ焼き器、持ってくりゃよかった。こんな夜こそ、熱々を焼いてやりたかったよ。']),
      folk('c7s_candy', 'w2_candy', 29, 12, 'down', () => E.flag('c7_ev_neon'), [], {
        talk: async () => {
          await E.say('w2_candy', 'ネオンキャンディ、配ってるの！ 光るから、暗いとこでもこわくないでしょ？');
          if (!E.flag('c7_candy_got')) {
            E.set('c7_candy_got');
            await E.give('candy', 3);
            await E.say('niko:smile', 'ひかる、アメ！ ニコ、だいすき！');
          }
        },
      }),
      folk('c7s_jiro', 'w_jiro', 31, 7, 'left', null, [
        'こんな夜こそ、歌だろ。……ギターの弦、一本切れちまったけどな。',
        '五本でも、ちゃんと鳴るんだぜ。足りないもんがあっても、音楽は止まらない。',
      ]),
      folk('c7s_couple_m', 'w_couple_m', 35, 19, 'right', null, ['結婚式、来月だったんだ。……でもやるよ。空がどうなっても。', ['w_couple_f', '……当たり前でしょ。招待状、もう出しちゃったんだから。']]),
      folk('c7s_couple_f', 'w_couple_f', 36, 19, 'left', null, ['この人ね、揺れたとき、真っ先にわたしの上に覆いかぶさったの。……自分のほうがケガしてるのに。']),
      folk('c7s_novelist', 'w_novelist', 40, 6, 'left', null, ['書きかけの小説の結末を、まだ決めてないんだ。', '……ハッピーエンドにしたいね。こういう夜を書いたあとは、特に。']),
      folk('c7s_baker', 'w_baker', 26, 7, 'down', null, ['パンが焼けないのが、いちばんつらいわ。生地、ちゃんと発酵してるかしら……。', '朝が来たら、いちばんに焼くわね。星屑亭のラーメンのお礼に、焼きたてを届けるわ。']),
      folk('c7s_obachan', 'w2_obachan', 21, 17, 'down', null, [], {
        talk: async () => {
          await E.say('w2_obachan', '購買のメロンパン、ありったけ持ってきたよ！ 一人一個まで！ ……あんたたちは特別に二個！');
          if (!E.flag('c7_melon_got')) {
            E.set('c7_melon_got');
            await E.give('melonpan', 2);
          }
        },
      }),
      folk('c7s_gen', 'w2_gen', 2, 12, 'right', null, ['非常用発電機は、わしが見とる。学校のボイラーと同じさ。', '……灯りが消えたら、人は不安になる。だから灯りだけは、絶対に消さん。']),
      folk('c7s_police', 'w_police', 6, 20, 'up', () => E.flag('c7_ev_minato'), ['避難者、現在312名。……みんな、よく来てくれた。', '君たちのおかげだ。……交番のおまわりさんとして、礼を言わせてくれ。']),
      folk('c7s_aya', 'w_aya', 17, 17, 'left', null, ['先輩……学校、なくならないですよね？', '……わたし、まだ2学期の文化祭、出てないんです。来年は先輩たちのクラスみたいな屋台、やりたいんです。']),
      folk('c7s_shiori', 'w_shiori', 10, 18, 'up', null, ['子どもたちに絵本を読んでるの。「ほしのこもりうた」。', '……暗い夜のお話はね、最後は必ず朝が来るのよ。そういうふうに、書かれてるの。']),
      folk('c7s_tome', 'tome', 24, 8, 'down', () => E.flag('c7_shelter_meet') && !E.flag('c7_broadcast'), ['ラーメンのおかわりなら、サチちゃんに言いな。……あたしはもう少ししたら、ガレージに行くよ。ジンひとりじゃ、装甲の張り方がなっちゃいないからね。']),
    ],
    checks: [
      { x: 40, y: 2, w: 2, show: () => !E.flag('c7_gov_go'), text: '重い防火扉。「総督府タワー直通・非常連絡通路　関係者以外立入禁止」' },
      { x: 20, y: 2, w: 4, text: () => (E.flag('c7_broadcast') ? 'モニターに、ラジオ局のロゴが映っている。「レディオ・スターダスト　非常放送中」' : 'モニターには、赤い円と「ALERT」の文字。マザーのマーク……のはずなのに、ひどく冷たく見える。') },
    ],
  });

  async function shelterMeet() {
    E.set('c7_shelter_meet');
    E.cut(true);
    E.party([]);
    E.teleport('player', 21, 9, 'up');
    cast('c7_m_ruu', 'ruu', 19, 9, 'up');
    cast('c7_m_niko', 'niko', 20, 10, 'up');
    E.hide('c7s_stall');
    cast('c7_m_tome', 'tome', 24, 8, 'left');
    E.bgm('sad');
    await E.say('yui', '……ミナト区、第三中、ネオン通り。避難の呼びかけは、ひととおり終わりました。');
    await E.say('tome', 'よくやったね、あんたたち。ほら、まずは食いな。……一杯だけだよ、まだ仕事が残ってるんだろ？');
    E.se('item');
    await E.say(null, 'シェルターの片隅で、湯気の立つラーメンをすする。……少しだけ、手のふるえが止まった。');
    await E.say('yui:serious', '……わたし、父と話をつけてきます。');
    await E.say('kanata:surprise', '委員長……。');
    await E.say('yui', '父の執務室に、総督の非常回線があるはずです。マザーとは別系統の回線。それがあれば――');
    await E.say('ruu', 'リリィが、全コロニーに放送できる！');
    await E.say('yui', 'はい。宇宙港のゲートも、総督の権限なら開けられます。');
    await E.say('yui', 'このシェルターの奥の扉は、総督府タワーに直通しています。総督の家族のIDなら、開くはずです。');
    await E.say('yui:sad', '……本当は、こわいです。父が何をしてきたのか、この目で確かめるのが。');
    const i = await E.ask('yui', 'いっしょに、来てくれますか。', ['もちろん', 'ユイが行くなら、どこまでも'], {});
    if (i === 0) await E.say('kanata:smile', 'もちろん。委員長ひとりに行かせるかよ。');
    else await E.say('kanata:smile', '委員長が行くなら、どこまでも。……校則違反にならない範囲で。');
    await E.say('yui:shy', '……今夜は、校則のことは忘れてください。');
    await E.say('niko', 'ユイ、いっしょ。ニコも、いっしょ。');
    await E.say('ruu:grin', 'ほら、委員長。手。……つないどけば、こわくないっしょ。');
    await E.say('yui:shy', 'ル、ルウさん……。……はい。');
    await E.say('tome', 'いっといで。……ユイちゃん、あんたの親父さんにも、ラーメン一杯取っといてやるよ。腹が減ってちゃ、ろくな話もできないからね。');
    await E.say('yui:cry', '……はい。');
    E.remove('c7_m_ruu');
    E.remove('c7_m_niko');
    E.remove('c7_m_tome');
    E.hide('c7s_stall', false);
    E.set('c7_gov_go');
    E.party(['ruu', 'niko', 'yui']);
    E.reload();
    E.bgm('home');
    E.objective('シェルター奥の連絡通路から、総督府タワーへ');
  }

  // =============================================================
  //  総督府タワー
  // =============================================================
  const patrolA = () => is7() && !E.flag('c7_kazami_done') && !E.flag('c7_stealth_help');
  const patrolB = () => is7() && !E.flag('c7_kazami_done') && E.flag('c7_stealth_help');
  const patrols = [
    { type: 'guard2', name: '制御された特務隊員', x: 14, y: 28, patrol: [[14, 28], [27, 28]], dir: 'right' },
    { type: 'drone', name: '監視ドローン', x: 4, y: 24, patrol: [[4, 24], [22, 24]], dir: 'right' },
    { type: 'drone', name: '監視ドローン', x: 26, y: 23, patrol: [[26, 23], [36, 23]], dir: 'right' },
    { type: 'guard2', name: '制御された特務隊員', x: 34, y: 20, patrol: [[34, 20], [4, 20]], dir: 'left' },
    { type: 'drone', name: '監視ドローン', x: 34, y: 15, patrol: [[34, 15], [19, 15]], dir: 'left' },
  ];
  G.addToMap('c7_govtower', {
    enemies: [
      ...patrols.map((p) => Object.assign({ lv: 11, vision: 72, show: patrolA }, p)),
      ...patrols.map((p) => Object.assign({ lv: 11, vision: 34, show: patrolB }, p)),
      { type: 'turret', x: 6, y: 36, lv: 11, id: 'c7_gt1', show: () => is7() },
      { type: 'turret', x: 33, y: 36, lv: 11, id: 'c7_gt2', show: () => is7() },
      { type: 'guard', x: 12, y: 39, lv: 11, id: 'c7_gg1', name: '制御された公安隊員', show: () => is7() },
      { type: 'guard', x: 27, y: 39, lv: 11, id: 'c7_gg2', name: '制御された公安隊員', show: () => is7() },
    ],
    items: [
      { x: 5, y: 29, item: 'repair2', id: 'c7_gti1' },
      { x: 35, y: 17, item: 'energy', n: 2, id: 'c7_gti2' },
      { x: 4, y: 15, item: 'chip', id: 'c7_gti3' },
    ],
    onEnter: async () => {
      if (!is7() || E.flag('c7_gov_in')) return;
      E.set('c7_gov_in');
      E.cut(true);
      E.bgm('chase');
      await E.say(null, '長い連絡通路を抜けると、そこは総督府タワーのロビーだった。大理石の床に、赤い警告灯が映りこんでいる。');
      await E.say('yui', '執務室は最上階です。ロビーの奥の階段から、警備フロアを抜けて……。');
      await E.say('yui:serious', '警備フロアは、マザー直結の監視網です。見つかったら、すぐ追い返されます。巡回の視界に入らないように。');
      await E.say('ruu', 'ようするに、こっそり行けってことね。……一番苦手なやつ。');
      await E.say('niko', 'ニコ、しずかにする。……すう、すう。');
      await E.say('ruu', 'ニコ、それ寝息。');
      E.objective('ロビーを抜け、警備フロアを見つからずに進んで執務室へ');
    },
    events: [
      {
        x: 19, y: 30, w: 2, h: 1, once: 'c7_gov_floor',
        cond: () => is7() && !E.flag('c7_kazami_done'),
        run: async () => {
          await E.say('yui', 'ここから警備フロアです。巡回のライトの向きに気をつけて。……背中側なら、見つかりません。');
        },
      },
      {
        x: 19, y: 11, w: 2, h: 2, once: 'c7_kazami_scene',
        cond: () => is7(),
        run: async () => await kazamiScene(),
      },
    ],
  });
  G.C7.spotted = async () => {
    if (F().map.id !== 'c7_govtower') return;
    E.cut(true);
    E.flash(6);
    E.tint('rgba(255,0,40,0.25)');
    await E.wait(20);
    E.inc('c7_spotted');
    if (E.val('c7_spotted') === 1) await E.say('yui:surprise', '見つかりました！ いったん下がって、巡回の向きを見てから進みましょう！');
    else await E.say('ruu:angry', 'うわ、また見つかった！ 下がるよ！');
    E.tint(null);
    await E.warp('c7_govtower', 20, 32, 'up', { noEnter: true });
    if (E.val('c7_spotted') >= 3 && !E.flag('c7_stealth_help')) {
      E.set('c7_stealth_help');
      E.reload();
      await E.say('yui:serious', '……待ってください。さっきの端末で、監視センサーの感度を下げてみます。');
      E.se('cursor');
      await E.say('yui', '……できました！ 巡回の視界が、半分くらいになったはずです。');
      await E.say('ruu:grin', 'さっすが委員長！');
    }
  };

  async function kazamiScene() {
    E.cut(true);
    E.party([]);
    E.teleport('player', 20, 11, 'up');
    cast('c7_k_ruu', 'ruu', 18, 11, 'up');
    cast('c7_k_niko', 'niko', 21, 11, 'up');
    cast('c7_k_yui', 'yui', 19, 10, 'up');
    cast('c7_kazami', 'kazami', 20, 4, 'up');
    E.camera(20, 7);
    E.stopBgm();
    await E.wait(30);
    await E.say(null, '広い執務室。窓の外の、闇に沈んだコロニーを、ひとりの男が見下ろしていた。');
    await E.say('yui', '……お父さん。');
    E.face('c7_kazami', 'down');
    await E.wait(20);
    E.bgm('sad');
    await E.say('kazami', '……ユイ。なぜここにいる。シェルターにいろと言ったはずだ。');
    await E.move('c7_k_yui', 'U2');
    await E.say('yui:serious', 'マザーを、ヘルミナ博士に渡したのは、お父さんですね。');
    await E.say('kazami', '……渡したのではない。貸したのだ。管理者権限を、一時的に。');
    await E.say('kazami', '中立とは、力のない者のきれいごとだ。テラ・ユニオンも同盟も、いつでもこのコロニーを奪いに来る。');
    await E.say('kazami', 'スターシードの研究は、クレイドル7を守る盾になるはずだった。だから予算をつけた。プロジェクト・エコーも、黙認した。');
    await E.say('kazami', '5年前の事故を、事故として処理したのも……私だ。');
    await E.say('kanata:angry', '……父さんを、死んだことにしたのも。');
    E.face('c7_kazami', 'player');
    await E.say('kazami', '……春瀬ジン君には、すまないことをした。言い訳はしない。');
    await E.say('ruu:angry', 'すまない、で済むと思ってんの！？ ニコたちが、どんな目に――');
    await E.say('niko:sad', '……ルウ。いい。');
    await E.say('niko', 'このひとの、こえ、ずっと、ないてる。……ユイのこえと、おなじ、おと。');
    await E.say('yui', 'お父さん。……校則第1条、知っていますか。');
    await E.say('kazami', '……？');
    await E.say('yui', '「生徒は、自らの行いに責任を持つこと」。わたし、ずっと守ってきました。お父さんが、そう教えてくれたから。');
    await E.say('yui:cry', '子どもに教えることを、大人が守らないで……どうするんですか……！');
    await E.wait(40);
    await E.say('kazami', '……………………。');
    await E.say('kazami', '……ユイ。お前は、母さんに似てきたな。');
    await E.say('kazami', '私は、守るつもりで、いちばん大事なものから目をそらしていた。……この窓から見える街は、地図ではなかったのにな。');
    await E.say(null, '総督は机の引き出しから、銀色の鍵を取り出した。');
    await E.say('kazami', '総督非常回線のキーだ。マザーとは完全に独立している。全コロニーのスピーカーとモニターに割りこめる。宇宙港の封鎖解除にも使える。');
    await E.say('kazami', '……私が唯一、ヘルミナに渡さなかったものだ。なぜ渡さなかったのか、自分でもわからなかったが……。');
    await E.say('kazami', '今わかった。お前に、渡すためだったんだろう。');
    await E.give('c7_linekey', 1, { wait: true });
    await E.say('yui:cry', '……お父さん。');
    // ---- アイゼン ----
    E.se('door');
    cast('c7_eisen', 'eisen', 19, 13, 'up');
    E.stopBgm();
    await E.move('c7_eisen', [[19, 11], [23, 11], [23, 9]]);
    E.face('player', 'right');
    await E.say('eisen', '総督。……話は、聞かせていただいた。');
    await E.say('kazami', 'アイゼンか。……私を拘束しに来たのか。');
    await E.say('eisen', 'そのつもりでした。……ですが、今はそれより先にやるべきことがある。');
    E.face('c7_eisen', 'left');
    E.bgm('tension');
    await E.say('eisen', '春瀬カナタ。水無月ルウ。ニコ。風見ユイ。');
    await E.say('eisen', '私はお前たちに、「子供の遊びではない」と言った。……訂正する。');
    await E.say('eisen', 'この夜、いちばん本気だったのは、お前たちだ。');
    await E.say('eisen', '私の部下は、マザーに体を奪われた。命令系統も握られた。残っているのは、スーツを着ていなかったわずかな者だけだ。');
    await E.say('eisen', '……私はずっと、コロニーの秩序を守ることが、人を守ることだと思っていた。だが、秩序はマザーに奪われても、人はまだここにいる。');
    await E.say('eisen', '私も、守りたいものがある。');
    await E.say('eisen', '公安特務隊の残存戦力は、これよりお前たちに協力する。……命令ではない。頼みだ。');
    await E.say('kanata:smile', '……少佐。よろしくお願いします。');
    await E.say('ruu', '……ニコを追っかけまわしたこと、あとでちゃんと謝ってよね。');
    await E.say('eisen', '……ああ。必ず。');
    await E.say('eisen', '宇宙港のゲートは、そのキーで開く。我々が先に行って確保しておく。お前たちは――');
    await E.say('yui:serious', 'ラジオ塔へ。リリィさんに、このキーを届けます。');
    await E.say('kazami', 'アイゼン。……娘を、頼む。');
    await E.say('eisen', '総督。あなたにも来ていただく。シェルターの人々に、あなたの口から、本当のことを説明していただく。');
    await E.say('kazami', '……ああ。そうしよう。それが、私の責任だ。');
    E.set('c7_kazami_done');
    E.set('c7_eisen_ally');
    E.set('met_kazami');
    await E.say('eisen', '下に車を回してある。ネオン通りまで送ろう。');
    await E.fadeOut(30);
    ['c7_k_ruu', 'c7_k_niko', 'c7_k_yui', 'c7_kazami', 'c7_eisen'].forEach((id) => E.remove(id));
    E.cameraReset();
    E.party(['ruu', 'niko', 'yui']);
    E.objective('ネオン通りのラジオ塔へ（リリィに非常回線キーを届ける）');
    await E.warp('radio_booth', 9, 9, 'up');
  }

  // =============================================================
  //  リリィの全コロニー放送
  // =============================================================
  async function broadcast() {
    E.cut(true);
    E.party([]);
    E.teleport('player', 9, 6, 'up');
    cast('c7_b_ruu', 'ruu', 8, 7, 'up');
    cast('c7_b_niko', 'niko', 10, 7, 'up');
    cast('c7_b_yui', 'yui', 7, 6, 'right');
    E.hide('w2_ad');
    await E.say('lily', 'ルウ！ ……え、その鍵、まさか。');
    await E.say('yui', '総督非常回線のキーです。風見ソウイチロウ総督の娘として、レディオ・スターダストに使用を許可します。');
    await E.say('lily', '……ははっ。総督の娘さんが、海賊ラジオに許可、かあ。最高のジョークだね。');
    await E.say('lily:serious', 'オーケー。回線、つなぐよ。周波数合わせ、手伝ってくれる？');
    E.se('charge');
    const sc = await E.timing({ title: '非常回線の周波数を合わせる', rounds: 3, speed: 1.5, zone: 0.2, labels: ['キャリア周波数', 'マザーの妨害をよける', '全域スピーカーに接続'] });
    E.se('boot');
    if (sc < 2) await E.say('lily', 'ちょっとノイズ乗ったけど……大丈夫、届く！');
    else await E.say('lily:smile', 'バッチリ！ ……クレイドル7じゅうのスピーカー、ぜんぶ、つながった。');
    await E.say('lily', '……ルウ。今からしゃべること、ちゃんと聞いててね。');
    await E.say('ruu', 'リリィ……？');
    await E.radio([
      'ハロー、クレイドル7の夜ふかしさんたち。……って、今夜は全員が夜ふかしだね。レディオ・スターダスト、特別放送。総督府の非常回線をお借りして、コロニーじゅうのスピーカーからお届けしてます。',
      'まず、大事なこと。空が暗いのは、マザーが壊れたからじゃない。ある人がマザーを乗っ取って、この世界を「なかったこと」にしようとしてるから。',
      'でもね、それを止めに行こうとしてる子たちがいるの。……中学生。笑っちゃうでしょ。あたしも最初、笑った。',
      'それから、ずっと秘密にしてたこと。ひとつだけ話すね。……あたし、子どものころ、〈ひだまり園〉っていう施設にいたの。',
      ['ruu:surprise', '（……ひだまり園！？）'],
      'ある夜、「いい里親さんが見つかったよ」って言われて、車に乗せられた。着いたのは、真っ白な研究所。あたしは〈プロジェクト・エコー〉の被験者になった。',
      '星の声が聞こえる子ども。……でも、あたしの声は、星には届かなかった。「失敗作」って言われて、放り出された。',
      'だから、声だけで生きていこうって決めたの。DJになって、毎晩、誰かに話しかけた。',
      'ねえ。星には届かなかったこの声、今、あなたには届いてるでしょ？',
      ['ruu:cry', '……リリ姉……。'],
      'だから、お願い。窓に、灯りをともして。懐中電灯でも、ろうそくでも、携帯の画面でもいい。',
      'マザーが空を消したって、あたしたちには灯りがある。ここに人がいるって、これから空を取り戻しに行く子たちに、見せてあげて。',
      '……それじゃ、一曲だけ。ひだまり園で、毎晩ちびっこたちに歌ってた子守唄。――「星屑のうた」。',
    ], { keepBgm: true });
    E.bgm('title');
    await E.cg('colony_night', 'ひとつ、またひとつ。真っ暗なコロニーの窓に、灯りがともっていく。');
    await E.cgCaption('ミナト区に。第三中に。ネオン通りに。シェルターの換気口からも。……空の向こうの、向こう側の街にも。');
    await E.cgCaption('――クレイドル7が、光っていた。');
    E.cgOff();
    E.set('c7_broadcast');
    E.bgm('sad');
    await E.say('ruu:cry', '……リリ姉。なんで、言ってくれなかったの。');
    await E.say('ruu:cry', 'あたしが施設にいたとき、夜、眠れないとき……毎晩あの歌、歌ってくれたの、リリ姉でしょ。');
    await E.say('lily', '……覚えてたんだ、ルウ。……大きくなったね。');
    await E.say('lily', '言えなかったよ。あたしがいなくなった夜のこと話したら、ちびっこたち、こわがるでしょ。');
    await E.say('lily', 'それに……「失敗作」のお姉ちゃんなんて、かっこ悪いじゃん。');
    await E.say('ruu:angry', 'バカじゃないの……！ かっこ悪くなんかない！ リリ姉は、ずっと……！');
    await E.say('ruu:cry', '……ずっと、あたしのヒーローだったんだから。');
    await E.say('lily', '……ありがと。');
    await E.say('niko', 'リリィの、こえ。ほしに、とどいてた。ニコ、きこえた。……ずっと、むかしから。');
    await E.say('lily', '……え？');
    await E.say('niko:smile', 'しろいへやで、ひとりのとき、どこかから、うた、きこえた。……あのうた。');
    await E.say('lily', '…………っ。そっか。……届いてたんだ。');
    await E.say('lily', 'ルウ。本物の空、見に行くんでしょ。……いってらっしゃい。帰ってきたら、番組のゲストね。');
    await E.say('ruu:smile', '……うん。いってきます、リリ姉。');
    await E.say('yui', 'わたしはここに残って、回線を守ります。マザーが回線を探しに来るかもしれません。');
    await E.say('yui:smile', '春瀬くん。……校則第1条。帰ってくるまでが、遠足です。');
    await E.say('kanata:smile', 'それ、校則だったっけ？');
    await E.say('yui:shy', '今、わたしが決めました。');
    ['c7_b_ruu', 'c7_b_niko', 'c7_b_yui'].forEach((id) => E.remove(id));
    E.hide('w2_ad', false);
    E.party(['ruu', 'niko']);
    E.objective('スクラップ・ベイ、ドクのガレージへ（ハルカゼ改）');
  }

  // =============================================================
  //  スクラップ・ベイ：ギルのクラン／宇宙港ゲート
  // =============================================================
  G.addToMap('scrapbay', {
    npcs: [
      { id: 'c7_salamander', char: 'sys', mech: 'salamander', x: 26, y: 5, dir: 'down', move: 'still', noFace: true, show: () => is7() && E.flag('c7_gil_ally') && !E.flag('c7_kai'), talk: async () => await E.say(null, 'ギルの〈サラマンダー〉。燃えるような赤い装甲に、「STARDUST」の手書きステッカーが貼ってある。') },
      { id: 'c7_jackal1', char: 'sys', mech: 'jackal', x: 34, y: 5, dir: 'down', move: 'still', noFace: true, show: () => is7() && E.flag('c7_gil_ally') && !E.flag('c7_kai') },
      {
        id: 'c7_gil', char: 'gil', x: 30, y: 6, dir: 'down', move: 'still',
        show: () => is7() && E.flag('c7_gil_ally') && !E.flag('c7_kai'),
        talk: async () => await E.say('gil', '宇宙港で待ってるぜ、スターダスト！ 主役が遅刻しちゃ、ショーが始まらねえ！'),
      },
      {
        id: 'c7_gate_eisen', char: 'eisen', x: 54, y: 46, dir: 'left', move: 'still',
        show: () => is7() && E.flag('c7_eisen_ally') && !E.flag('c8_port_open'),
        talk: async () => {
          if (!E.flag('c7_kai')) await E.say('eisen', 'ゲートは我々が確保している。……機体の準備ができたら来い。ハルカゼ改、だったか。');
        },
      },
    ],
    events: [
      {
        x: 50, y: 45, w: 8, h: 3,
        cond: () => is7() && E.flag('c7_kai') && !E.flag('c8_port_open'),
        run: async () => await gateOpen(),
      },
    ],
    warps: [{ x: 52, y: 45, w: 4, h: 1, to: 'c7_port', tx: 22, ty: 28, dir: 'up', show: () => is7() && E.flag('c8_port_open') && !E.flag('c7_launch') }],
    onEnter: async () => {
      if (!is7() || !E.flag('c7_broadcast') || E.flag('c7_gil_ally')) return;
      await gilJoins();
    },
  });

  async function gilJoins() {
    E.set('c7_gil_ally');
    E.cut(true);
    E.party([]);
    E.reload();
    E.hide('c7_gil');
    cast('c7_g_ruu', 'ruu', 29, 3, 'down');
    cast('c7_g_niko', 'niko', 31, 3, 'down');
    E.teleport('player', 30, 3, 'down');
    E.se('mechstep');
    E.shake(5, 30);
    await E.wait(20);
    E.stopBgm();
    await E.say(null, 'スクラップ・ベイに降りたとたん、地響き。……いや、地震じゃない。足音だ。');
    E.flash(8);
    E.bgm('arena');
    cast('c7_gil2', 'gil', 30, 8, 'up');
    cast('c7_leo', 'w2_leo', 28, 8, 'up');
    cast('c7_moh', 'w2_punk1', 32, 8, 'up');
    await E.say('gil', 'イッツ……ショーーーータイム！！');
    await E.say('ruu:surprise', 'ギル！？');
    await E.say('gil', '聞いたぜ、リリィの放送！ 中学生がコロニーを救いに行くってなあ！');
    await E.say('gil', 'ネオン・ジャッカルズが、それを黙って見てると思ったか！？ アンダーシェルの連中は、全員シェルターに放りこんできた！');
    await E.say('gil', '宇宙港の防衛、俺たちネオン・ジャッカルズが引き受けたァ！ 燃えろォ！');
    await E.say('w2_leo', 'リーダー、テンション上げすぎて機体のエンジン焼けかけてます。');
    await E.say('gil', 'それが燃えるってことだァ！');
    await E.say('ruu:smile', 'ギル……あんた、意外といいやつじゃん。');
    await E.say('gil', '意外とは余計だ！ ……決勝で負けたあの日から、お前らは俺のライバルだ。');
    await E.say('gil', 'ライバルを見殺しにしちゃ、ショーが成り立たねえ。勝ち逃げなんざ、許さねえぞ、スターダスト！');
    await E.say('kanata:smile', '……ありがとう、ギル。頼りにしてる。');
    await E.say('gil', 'おう！ 先に宇宙港で待ってるぜ。ドクのジイさんのとこで、新しい機体を受け取ってきな！');
    ['c7_g_ruu', 'c7_g_niko', 'c7_gil2', 'c7_leo', 'c7_moh'].forEach((id) => E.remove(id));
    E.hide('c7_gil', false);
    E.party(['ruu', 'niko']);
    E.objective('ドクのガレージへ（ハルカゼ改）');
  }

  async function gateOpen() {
    E.cut(true);
    E.party([]);
    cast('c7_gt_ruu', 'ruu', 50, 47, 'right');
    cast('c7_gt_niko', 'niko', 50, 46, 'right');
    E.teleport('player', 52, 46, 'right');
    cast('c7_gt_g1', 'guard', 57, 47, 'left');
    cast('c7_gt_g2', 'guard', 57, 45, 'left');
    await E.say('eisen', '来たか。……それが、ハルカゼ改か。いい機体だ。');
    await E.say('eisen', '総督キーを。');
    await E.say(null, 'カナタは、ユイから預かった銀色の鍵を差しこんだ。');
    E.se('boot');
    await E.wait(20);
    E.se('alarm');
    E.shake(6, 60);
    E.set('c8_port_open');
    E.reload();
    E.hide('c7_gate_eisen');
    cast('c7_gt_eisen', 'eisen', 54, 46, 'left');
    await E.say(null, 'ゴウン……ゴウン……。10年間閉ざされていた宇宙港ゲートが、ゆっくりと口を開けていく。');
    await E.say('eisen', '第7ドックに、お前たちの仲間が待っている。……マザーの無人機部隊も、こちらに向かっている。急げ。');
    await E.say('kanata:serious', '少佐は？');
    await E.say('eisen', 'このゲートを守る。……地上は、大人に任せろ。今夜くらいは、な。');
    ['c7_gt_ruu', 'c7_gt_niko', 'c7_gt_g1', 'c7_gt_g2', 'c7_gt_eisen'].forEach((id) => E.remove(id));
    E.party(['ruu', 'niko']);
    E.objective('宇宙港・第7ドックへ');
    await E.warp('c7_port', 22, 28, 'up');
  }

  // =============================================================
  //  ドクのガレージ：ハルカゼ改
  // =============================================================
  G.addToMap('doc_garage', {
    npcs: [
      {
        id: 'c7_jin_g', char: 'jin', x: 8, y: 9, dir: 'up', move: 'still',
        show: () => is7() && !E.flag('c7_kai'),
        talk: async () => await jinGarageTalk(),
      },
    ],
    onEnter: async () => {
      if (!is7() || E.flag('c7_kai')) return;
      if (E.flag('c7_broadcast') && E.flag('c7_gil_ally')) return await harukazeKai();
      if (E.flag('c7_garage_in')) return;
      E.set('c7_garage_in');
      E.cut(true);
      await E.say('doc', 'ふん、来たか若造。……まだだ。まだ組み上がっとらん。');
      await E.say('jin', '装甲と駆動系はできた。だが、エコー感応フレームの最終調整が残ってる。……お前たちの仕事が終わるころには、間に合わせる。');
      await E.say('jin', 'カナタ、ハルカゼを置いていけ。一緒に仕上げる。');
    },
  });
  async function jinGarageTalk() {
    const opts = ['5年間のこと', '母さんのこと', 'ハルカゼ改のこと', 'なんでもない'];
    const i = await E.ask('jin', '……どうした、カナタ。', opts, { cancel: 3 });
    if (i === 0) {
      await E.say('jin', '……仮面をつけられている間のことは、ほとんど霧の中だ。でも、ときどき、晴れる瞬間があった。');
      await E.say('jin', 'ゲーセンの筐体のことを、なぜか思い出してた。レジェンド・モード。……お前、何回挑んだ？');
      await E.say('kanata', '……847回。');
      await E.say('jin', 'ははっ。……そうか。悪い、父さん、手加減するのを忘れてたな。');
      await E.say('kanata:smile', '手加減されてたら、もっとムカついてたよ。');
    } else if (i === 1) {
      await E.say('jin', '……お前の母さんのことか。ばあちゃんから聞いてないのか？');
      await E.say('kanata', '「あんたが大きくなったら、ジンから聞きな」って。');
      await E.say('jin', '……そうか。全部終わったら、話すよ。長い話になる。ラーメン二杯ぶんくらいな。');
    } else if (i === 2) {
      await E.say('jin', 'ハルカゼ改は、お前のために描いた機体だ。お前の操縦のクセ、5歳のころから見てたからな。');
      await E.say('jin', 'ブーストを踏む前に、一瞬だけ溜めるだろう。……あれに合わせて、推力の立ち上がりを設計してある。');
      await E.say('kanata:surprise', '5歳のときのクセ……覚えてたの？');
      await E.say('jin', '親だからな。');
    } else await E.say('jin', '……行ってこい。ここは任せろ。');
  }

  async function harukazeKai() {
    E.set('c7_kai_scene');
    E.cut(true);
    E.party([]);
    E.teleport('player', 12, 12, 'up');
    E.hide('c7_jin_g');
    cast('c7_kj', 'jin', 7, 10, 'up');
    cast('c7_kt', 'tome', 10, 10, 'up');
    cast('c7_kp', 'ponta', 5, 10, 'up');
    cast('c7_kr', 'ruu', 11, 13, 'up');
    cast('c7_kn', 'niko', 13, 13, 'up');
    E.camera(6, 9);
    E.bgm('mech');
    await E.say('doc', '来たか、若造。……見ろ。');
    await E.say(null, 'ハンガーの機体に、白と青の新しい装甲が張られている。背中には、桜色の光の翼。');
    await E.say('jin', 'ハルカゼ改。……5年前、お前のために描いた、ハルカゼの本当の姿だ。');
    await E.say('jin', 'エコー感応フレームとタンデム・コクピット。エコーの子が後ろの席に座れば、星の声が機体を動かす。');
    await E.say('niko:smile', 'ニコ、カナタと、いっしょ、のる！');
    await E.say('tome:grin', '装甲の張り方は、星屑号ゆずりさ。弾は避けるもんだけどね、当たってもへこまない程度にはしといたよ。');
    await E.say('ponta:grin', 'オイラも手伝ったっす！ 配線3万本！ ぶっひゃー、一生分のハンダ付けしたっす！');
    await E.say('doc', '最後の仕上げだ。お前のクセを、機体に覚えさせる。……乗れ、若造。');
    E.cameraReset();
    E.se('boot');
    await E.say('kanata:serious', '……同調テスト、開始！');
    const sc = await E.timing({ title: '同調テスト：ハルカゼ改', rounds: 3, speed: 1.7, zone: 0.17, labels: ['エンジン点火', 'エコー・フレーム同調', 'リミッター解除'] });
    if (sc < 2) {
      await E.say('doc', 'ふん、まだズレとる。……もう一回だ。今度は肩の力を抜け。');
      await E.timing({ title: '同調テスト：再調整', rounds: 2, speed: 1.3, zone: 0.24, labels: ['呼吸をあわせる', 'ニコの声をきく'] });
    }
    G.state.mech.id = 'harukaze2';
    E.set('c7_kai');
    E.flash(16);
    E.se('levelup');
    E.shake(4, 20);
    E.reload();
    E.hide('c7_jin_g');
    await E.say(null, 'ハンガーの機体の目に、青い光がともった。');
    await E.say('jin', '同調率、98パーセント。……いい数字だ。俺のときより高い。');
    await E.say('jin', 'カナタ。ENゲージが満タンになったら、エコー・ドライブを解放しろ。機体とお前とニコの声が、ひとつになる。');
    await E.say('jin', '――オーバードライブだ。');
    await E.learn('overdrive');
    await E.say('doc', '機体の改造なら、いつでもワシに言え。……ハルカゼ改は、まだ伸びるぞ。');
    await E.say('tome', 'それと、これ。腹が減っては戦はできぬ、ってね。');
    await E.give('ramen', 3, { wait: true });
    await E.say('ponta', 'オイラからは修理キットっす！ 宇宙は寒いっすから、気をつけてっす！');
    await E.give('repair2', 2, { wait: true });
    E.se('cursor');
    await E.say('eisen', 'こちらアイゼン。宇宙港ゲートで待機中。……マザーの無人機部隊が、こちらに向かっている。急げ。', { name: 'アイゼン（通信）' });
    await E.say('jin', '俺は管制室から、お前たちの発進を手伝う。……行こう。');
    ['c7_kj', 'c7_kt', 'c7_kp', 'c7_kr', 'c7_kn'].forEach((id) => E.remove(id));
    E.party(['ruu', 'niko']);
    E.objective('宇宙港ゲートへ（スクラップ・ベイ南東）');
  }

  // =============================================================
  //  第7ドック：防衛戦と発進
  // =============================================================
  G.addToMap('c7_port', {
    onEnter: async () => {
      if (!is7()) return;
      if (!E.flag('c7_port_won')) await portBattle();
    },
  });

  async function portBattle() {
    E.cut(true);
    E.party([]);
    cast('c7_pr', 'sys', 16, 20, 'up', { mech: 'rose', noFace: true });
    cast('c7_pz', 'sys', 29, 20, 'up', { mech: 'zephyr', noFace: true });
    cast('c7_ps', 'sys', 12, 15, 'up', { mech: 'salamander', noFace: true });
    cast('c7_pj', 'jin', 22, 26, 'up');
    cast('c7_pru', 'ruu', 21, 27, 'up');
    cast('c7_pni', 'niko', 23, 27, 'up');
    E.camera(22, 18);
    E.bgm('tension');
    await E.say(null, '第7ドック。発進カタパルトの前に、仲間たちの機体が並んでいた。');
    await E.say('gil', '遅えぞ、スターダスト！ 主役の登場だ！', { name: 'ギル（サラマンダー）' });
    await E.say('sig', '……待っていました。ゼフィールが、ずっとざわついている。', { name: 'シグ（ゼフィール）' });
    await E.say('ruu', 'ローズハウンド、準備オッケー。……カナタ、宇宙、行くよ。');
    await E.say('jin', '管制は俺がやる。隔壁を開けるまで、あと3分――');
    E.se('alarm');
    E.shake(5, 40);
    E.tint('rgba(255,0,40,0.18)');
    await E.say('mother:angry', '警告。警告。第7ドックニ、不正ナ起動信号ヲ検知。……排除シマス。', { name: 'マザー' });
    await E.say('helmina', '春瀬カナタ君。……あなたのお父様には、本当に感謝しているの。ノクターンのデータ、とても美しかったわ。', { name: 'ヘルミナ（通信）' });
    await E.say('helmina', 'でも、もう邪魔はさせない。……もうすぐ、あの子に会えるの。', { name: 'ヘルミナ（通信）' });
    await E.say('jin', '……ヘルミナ。');
    E.tint(null);
    await E.say('gil', '無人機の大群だ！ 天井の搬入口から来るぞ！', { name: 'ギル（サラマンダー）' });
    await E.say('kanata:serious', '隔壁が開くまで、ドックを守る！ ……ニコ、乗って！');
    await E.say('niko:serious', 'うん！ ニコ、うしろの、せき！');
    E.remove('c7_pni');
    E.remove('c7_pru');
    await E.mech(true, 'harukaze2');
    await E.say('kanata:serious', 'ハルカゼ改――いくぞ！');
    E.cameraReset();
    ['c7_pr', 'c7_pz', 'c7_ps', 'c7_pj'].forEach((id) => E.remove(id));
    E.cut(false);
    const won = await E.battle({
      map: 'c7_port', x: 22, y: 23, dir: 'up', mech: true, mechId: 'harukaze2',
      waves: [
        [
          { type: 'guardner', x: 12, y: 8, lv: 10, name: '無人ガードナー' },
          { type: 'guardner', x: 22, y: 7, lv: 10, name: '無人ガードナー' },
          { type: 'guardner', x: 33, y: 8, lv: 10, name: '無人ガードナー' },
          { type: 'guardner', x: 17, y: 11, lv: 10, name: '無人ガードナー' },
          { type: 'drone', x: 8, y: 12, lv: 10 },
          { type: 'drone', x: 37, y: 12, lv: 10 },
          { type: 'drone', x: 27, y: 10, lv: 10 },
        ],
        [
          { type: 'guardner', x: 6, y: 10, lv: 11, name: '無人ガードナー' },
          { type: 'guardner', x: 38, y: 10, lv: 11, name: '無人ガードナー' },
          { type: 'guardner', x: 22, y: 6, lv: 11, name: '無人ガードナー' },
          { type: 'guardner', x: 16, y: 8, lv: 11, name: '無人ガードナー' },
          { type: 'guardner', x: 29, y: 8, lv: 11, name: '無人ガードナー' },
          { type: 'drone', x: 28, y: 12, lv: 11 },
          { type: 'drone', x: 14, y: 12, lv: 11 },
          { type: 'drone', x: 33, y: 13, lv: 11 },
        ],
        [
          { type: 'jackal', x: 8, y: 8, lv: 11, name: '暴走レース機', color: { body: '#5a5a6a', accent: '#ff3050', eye: '#ff3050' } },
          { type: 'jackal', x: 36, y: 8, lv: 11, name: '暴走レース機', color: { body: '#5a5a6a', accent: '#ff3050', eye: '#ff3050' } },
          { type: 'guardner', x: 22, y: 7, lv: 12, name: '無人ガードナー' },
          { type: 'guardner', x: 14, y: 6, lv: 12, name: '無人ガードナー' },
          { type: 'guardner', x: 30, y: 6, lv: 12, name: '無人ガードナー' },
          { type: 'drone', x: 10, y: 13, lv: 12 },
          { type: 'drone', x: 34, y: 13, lv: 12 },
        ],
        [
          { type: 'guardner2', x: 22, y: 7, lv: 12, hp: 4200, boss: true, name: '無人指揮官機〈アークエンジェル〉', color: { body: '#e8e4f0', accent: '#8a3af0', eye: '#ff2848' } },
          { type: 'guardner', x: 12, y: 9, lv: 12, name: '無人ガードナー' },
          { type: 'guardner', x: 32, y: 9, lv: 12, name: '無人ガードナー' },
          { type: 'drone', x: 18, y: 12, lv: 12 },
          { type: 'drone', x: 26, y: 12, lv: 12 },
        ],
      ],
      allies: [
        { mech: 'rose', x: 16, y: 24, dmg: 22, col: '#ff9ac8', name: 'ローズハウンド' },
        { mech: 'zephyr', x: 28, y: 24, dmg: 24, col: '#7dff9a', name: 'ゼフィール' },
        { mech: 'salamander', x: 10, y: 20, dmg: 22, col: '#ff8a30', name: 'サラマンダー' },
      ],
      bgm: 'boss', title: 'DEFEND DOCK 7', sub: '隔壁が開くまで、ドックを守り抜け',
      win: 'all',
      onStart: async () => {
        E.toast('ジン：隔壁開放まで、あと3分！', '#4ef0ff');
      },
      onWave: async (w) => {
        if (w === 1) {
          E.toast('ギル：第二波だ！ 燃えろォ！', '#ff8a30');
          E.toast('ジン：隔壁開放まで、あと2分！', '#4ef0ff');
        }
        if (w === 2) {
          E.toast('ルウ：速いのが来る！ 近づかれたら斬られるよ！', '#ff9ac8');
          E.toast('ジン：隔壁開放まで、あと1分！', '#4ef0ff');
        }
        if (w === 3) {
          E.toast('シグ：指揮官機です！ あれを落とせば、群れは止まる！', '#7dff9a');
          E.toast('ニコ：カナタ、EN、いっぱい……オーバードライブ！', '#ff9ac8');
        }
      },
    });
    if (!won) return;
    E.set('c7_port_won');
    await launch();
  }

  async function launch() {
    E.cut(true);
    E.bgm('mech');
    await E.say('jin', '……全機、無事か！ よし、隔壁を開くぞ！', { name: 'ジン（管制）' });
    E.set('c7_launch');
    E.reload();
    E.se('alarm');
    E.shake(5, 60);
    E.camera(22, 4);
    await E.wait(60);
    await E.say(null, '巨大な隔壁が、左右に割れていく。その向こうに――星が、あった。');
    await E.say('ruu', '……あれが、本物の、空……。', { name: 'ルウ（ローズハウンド）' });
    await E.say('niko', '……ほしのこえ、いっぱい。……スターシードが、よんでる。', { name: 'ニコ（ハルカゼ改）' });
    await E.say('gil', 'へっ、ビビってんのか？ オレ様はワクワクが止まらねえぜ！', { name: 'ギル（サラマンダー）' });
    await E.say('sig', '……ここから先は、僕の知らない未来です。', { name: 'シグ（ゼフィール）' });
    await E.say('jin', '全機、いったんゲート前に集合しろ。発進前の最後のブリーフィングだ。……母さんも来てる。', { name: 'ジン（管制）' });
    E.cameraReset();
    await E.say('kanata:serious', '……行こう。ヘルミナを止めに。');
    await E.say('kanata:serious', '空を、取り戻しに。');
    E.bgm('space');
    await E.cg('space', '――ニセモノの空の、その外側。');
    await E.cgCaption('灯りのともったコロニーを背に、子どもたちは、本物の空の入口に立っていた。');
    E.cgOff();
    E.unset('w_evac');
    E.tint(null);
    await E.fadeOut(40);
    await E.startChapter(8);
  }
})();
