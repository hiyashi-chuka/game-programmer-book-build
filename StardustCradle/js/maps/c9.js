// =============================================================
//  maps/c9.js — 終章「ほんとうの空」：エピローグの町（共有マップへの追記）
//  ・朝のクレイドル7で会える「その後」のみんな（chapter >= 9、自由行動中）
//  ・カスタムCG（Sからの手紙）
//  ストーリー本体は js/story/ch9.js。
// =============================================================
(function () {
  const C9 = (G.C9 = G.C9 || {});
  const free = () => G.state.chapter >= 9 && E.flag('c9_free');

  // ---------------------------------------------------------------
  //  会えた人のカウント（目的表示に反映）
  // ---------------------------------------------------------------
  C9.VISITS = ['jin', 'eisen', 'yui', 'vargas', 'kyosuke', 'gil'];
  C9.visitCount = () => C9.VISITS.filter((k) => E.flag('c9_v_' + k)).length;
  C9.updateObjective = function (quiet) {
    if (G.state.chapter !== 9 || E.flag('c9_roof')) return;
    const n = C9.visitCount();
    const t = n >= C9.VISITS.length ? 'みんなに会えた。夕方、学校の屋上へ' : `町のみんなに会いに行こう（${n}/${C9.VISITS.length}）・夕方、屋上へ`;
    if (quiet) G.state.objective = t;
    else E.objective(t);
  };
  C9.visit = function (k) {
    if (E.flag('c9_v_' + k)) return;
    E.set('c9_v_' + k);
    C9.updateObjective();
  };

  // 1回だけのごほうび
  async function giftOnce(flag, item, n) {
    if (E.flag(flag)) return false;
    E.set(flag);
    await E.give(item, n || 1, { wait: true });
    return true;
  }

  // ---------------------------------------------------------------
  //  ドクのガレージ：ジン
  // ---------------------------------------------------------------
  G.addToMap('doc_garage', {
    npcs: [
      {
        id: 'c9_jin', char: 'jin', x: 8, y: 9, dir: 'up', move: 'still', show: free,
        talk: async () => {
          if (!E.flag('c9_v_jin')) {
            await E.say('jin:smile', 'おう、カナタ。ハルカゼ改の装甲、ドクと張り替えてるところだ。');
            await E.say('jin', '傷だらけだったよ。……でも、いい傷だ。おまえが、誰かを守った傷だ。');
            await E.say('jin', 'ばあちゃんに言われてな。今日から星屑亭の2階に、オレの部屋もあるらしい。……5年ぶりの、自分の布団だ。');
            await E.say('kanata:smile', 'おかえり、父さん。');
            await E.say('jin:smile', '……ああ。ただいま。');
            await E.say('jin:grin', 'そうだ、カナタ。今度シミュレーターで勝負しないか。父さん、手加減しないぞ。');
            await E.say('kanata:grin', 'のぞむところ！');
            C9.visit('jin');
          } else {
            await E.say('jin', G.state.chapter >= 10 ? 'シミュレーターの対戦、またやろう。……昨日は、ちょっとだけ手加減した。ちょっとだけな。' : '屋上？　……行ってこい。父さんは、ここでドクとハルカゼをいじってる。');
          }
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  星屑亭：アイゼン少佐（約束のラーメン）
  // ---------------------------------------------------------------
  G.addToMap('hoshikuzu', {
    npcs: [
      {
        id: 'c9_eisen', char: 'eisen', x: 13, y: 9, dir: 'left', move: 'still', show: free,
        talk: async () => {
          if (!E.flag('c9_v_eisen')) {
            await E.say('eisen', '……約束だったな。今日は私のおごりだ。何杯でも食べたまえ。');
            await E.say('ruu:grin', 'マジで！？　じゃ、10杯！');
            await E.say('eisen:think', '……一杯にしてくれ。公務員の給料は、それほど多くない。');
            await E.say('eisen:serious', 'ヘルミナは、きちんと裁判を受けることになった。……あの人の話を、時間をかけて聞くつもりだ。');
            await E.say('eisen', '公安も、変わらなければならない。守るべきものを、もう一度、考えなおす。');
            await E.say('eisen:smile', '……ここのラーメンは、うまいな。前に来たときは、味がしなかった。');
            await giftOnce('c9_gift_eisen', 'ramen', 2);
            await E.say('eisen', 'それは持ち帰り用だ。……君たちの、次の冒険のために。');
            C9.visit('eisen');
          } else {
            await E.say('eisen', G.byCh({ 9: '……替え玉を頼むべきか、迷っている。公務員としての節度と、人間としての欲求のあいだで。', 10: '非番の日は、ここに来ることにした。……替え玉は、まだ頼めていない。' }));
          }
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  ミナト区の公園：ユイ（父を見送ったあと）
  // ---------------------------------------------------------------
  G.addToMap('minato', {
    npcs: [
      {
        id: 'c9_yui', char: 'yui', x: 55, y: 12, dir: 'down', move: 'still', show: free,
        talk: async () => {
          if (!E.flag('c9_v_yui')) {
            await E.say('yui', 'カナタくん、ルウさん、ニコさん。……父を、見送ってきました。');
            await E.say('yui:sad', '査問委員会では、ぜんぶ話すそうです。わたしのことも、隠さなくていいって。');
            await E.say('yui:smile', 'それで……わたし、決めました。来期の生徒会長に、立候補します。');
            await E.say('ruu:surprise', '委員長が会長！？　校則、倍になりそう……。');
            await E.say('yui:shy', 'ひとつだけ、増やしたい校則があるんです。「屋上は、いつでも生徒に開放すること」。');
            await E.say('yui:smile', '……わたしも、たまには空を見上げたいので。');
            C9.visit('yui');
          } else {
            await E.say('yui', G.byCh({ 9: '選挙ポスターのデザイン、ミミさんにお願いしようと思っています。……ちょっと不安ですけど。', 10: '生徒会の選挙、当選しました。公約どおり、屋上は開放です。……校則第15条、です。' }));
          }
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  職員室：バルガス先生
  // ---------------------------------------------------------------
  G.addToMap('staffroom', {
    npcs: [
      {
        id: 'c9_vargas', char: 'vargas', x: 16, y: 8, dir: 'down', move: 'still', show: () => G.state.chapter >= 9,
        talk: async () => {
          if (!E.flag('c9_v_vargas')) {
            await E.say('vargas:grin', '春瀬！　水無月！　ニコ！　……よく帰ってきた！');
            await E.say('vargas', '宿題は満点だ！　提出期限も守った！　先生はな、先生はな……！');
            await E.say('vargas:cry', 'う、うおおおん……！');
            await E.say('ruu:think', '先生、職員室で泣かないでよ……。');
            await E.say('vargas', 'ぐすっ……ほれ、お祝いだ。先生の秘蔵のメロンパンだ。……半分じゃないぞ、まるごとだ！');
            await giftOnce('c9_gift_vargas', 'melonpan', 3);
            await E.say('vargas', '廊下を走るな！　……と言いたいところだが、今日くらいは、走っていいぞ！');
            C9.visit('vargas');
          } else {
            await E.say('vargas', G.byCh({ 9: '屋上か？　夕方の屋上はいいぞ。先生も昔、よく……いや、なんでもない！', 10: '補習のプリントだ！　……コロニーを救っても、数学の点数は救えんのだ！' }));
          }
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  校庭：キョウスケ
  // ---------------------------------------------------------------
  G.addToMap('school_yard', {
    npcs: [
      {
        id: 'c9_kyosuke', char: 'kyosuke', x: 20, y: 33, dir: 'right', move: 'still', show: free,
        talk: async () => {
          if (!E.flag('c9_v_kyosuke')) {
            await E.say('kyosuke', 'あぁ？　……タイマンの続きか？');
            await E.say('kyosuke', '……今日はやめとく。おまえら、まだボロボロじゃねえか。');
            await E.say('kyosuke:smile', 'コロニー救ったヤツに勝っても、自慢にならねえしな。……借りは、もう返してもらった。');
            await E.say('kyosuke', '避難所で、チビどもに「あの白いロボットの兄ちゃん、友だち？」って聞かれてよ。……「ダチだ」って答えといた。');
            await E.say('kanata:smile', '……ありがと、キョウスケ先輩。');
            await E.say('kyosuke:angry', '先輩とか言うな、気持ちわりい。');
            C9.visit('kyosuke');
          } else {
            await E.say('kyosuke', G.byCh({ 9: '……さっさと行け。屋上で誰か待ってんだろ。', 10: 'アリーナのランク戦、オレも復帰した。……上がってこいよ、スターダスト。' }));
          }
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  ネオン通り：ギル
  // ---------------------------------------------------------------
  G.addToMap('neon', {
    npcs: [
      {
        id: 'c9_gil', char: 'gil', x: 31, y: 17, dir: 'down', move: 'still', show: free,
        talk: async () => {
          if (!E.flag('c9_v_gil')) {
            await E.say('gil:grin', 'イッツ・ショータイム！　……と言いたいとこだが、今日は休業だ。体じゅう痛え。');
            await E.say('gil', 'あの廊下で、警備ロボを300体は相手にしたぜ。……盛ってねえよ！　たぶん200体だ！');
            await E.say('ruu:smile', 'はいはい。……ありがとね、ギル。あんたがいなかったら、あそこで終わってた。');
            await E.say('gil:shy', 'よ、よせやい！　……オレ様はな、借りを返しただけだ。');
            await E.say('gil:grin', '次のシーズン、ジャッカルズはおまえらに勝つ。スターダストはまだクランとして残るんだろ？　逃げんなよ！　燃えろォ！');
            C9.visit('gil');
          } else {
            await E.say('gil', G.byCh({ 9: 'アリーナの再開は来週だ。……それまでに、肩の関節を直しとかねえとな。', 10: 'ランク戦、上で待ってるぜ。……Sランクの椅子は、ひとつしかねえからな！' }));
          }
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  クリア後：星屑亭の手紙を読み返せる
  // ---------------------------------------------------------------
  G.addToMap('tome_room', {
    checks: [
      {
        x: 4, y: 2, show: () => G.state.chapter >= 10,
        run: async () => {
          await E.say(null, '机の上に、父の写真と、Sからの手紙が並べて立てかけてある。');
          const i = await E.ask(null, '手紙を読み返す？', ['読む', 'やめる'], { cancel: 1 });
          if (i === 0 && G.C9.readLetter) await G.C9.readLetter(true);
        },
      },
    ],
  });

  // ---------------------------------------------------------------
  //  カスタムCG：Sからの手紙
  // ---------------------------------------------------------------
  G.CG.c9_letter = function (c, t) {
    const W = G.W,
      H = G.H;
    // 星屑亭のカウンター（木目）
    c.fillStyle = '#5a3a24';
    c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 6) {
      c.fillStyle = y % 12 ? '#6a4630' : '#4e3220';
      c.fillRect(0, y, W, 2);
    }
    // 朝の光
    c.globalCompositeOperation = 'lighter';
    G.glow(c, W * 0.8, -20, 260, 'rgba(255,220,170,0.25)');
    c.globalCompositeOperation = 'source-over';
    // どんぶり（すみっこ）
    G.ellipse(c, 70, 220, 46, 18, '#e8e0d0');
    G.ellipse(c, 70, 214, 40, 12, '#c8783a');
    G.ellipse(c, 60, 212, 8, 4, '#f4e8c0');
    // 封筒
    c.save();
    c.translate(W / 2 + 10, H / 2 + 6);
    c.rotate(-0.06);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(-118, -66, 240, 140);
    c.fillStyle = '#f4ecd8';
    c.fillRect(-122, -72, 240, 140);
    c.fillStyle = '#e4d8bc';
    c.beginPath();
    c.moveTo(-122, -72);
    c.lineTo(-2, 0);
    c.lineTo(118, -72);
    c.closePath();
    c.fill();
    // 切手（星）と消印
    c.fillStyle = '#3a6ad0';
    c.fillRect(70, -62, 36, 40);
    c.fillStyle = '#f4f6ff';
    c.fillRect(74, -58, 28, 32);
    c.fillStyle = '#8ff8ff';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      c.fillRect(88 + Math.cos(a) * 9 - 1, -42 + Math.sin(a) * 9 - 1, 3, 3);
    }
    c.strokeStyle = 'rgba(90,60,80,0.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(64, -36, 16, 0, Math.PI * 2);
    c.stroke();
    G.pixText(c, '0091', 56, -38, 'rgba(90,60,80,0.6)');
    // 宛名とS
    G.pixText(c, 'TO: HOSHIKUZU-TEI', -100, 20, '#5a4a5a');
    G.pixText(c, 'CRADLE 7', -100, 30, '#5a4a5a');
    G.pixText(c, 'S', 80, 40, '#3a6ad0', 3);
    c.restore();
    // 舞う光の粒
    for (let i = 0; i < 20; i++) {
      const x = (i * 53 + t * 0.2) % W,
        y = (i * 31 + Math.sin(t * 0.02 + i) * 10 + 40) % H;
      c.fillStyle = 'rgba(255,240,200,0.6)';
      c.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  };
})();
