// =============================================================
//  state.js — ゲーム状態・アイテム・成長・セーブ
// =============================================================
(function () {
  // ---------- アイテム定義 ----------
  // kind: use(消費) key(大事なもの) mat(素材) weapon acc
  G.ITEMS = {
    soda: { name: 'コロニーソーダ', kind: 'use', price: 30, hp: 40, desc: 'シュワっと爽快。HPを40回復。' },
    melonpan: { name: 'メロンパン', kind: 'use', price: 60, hp: 90, desc: '購買の名物。HPを90回復。' },
    onigiri: { name: '星屑おにぎり', kind: 'use', price: 45, hp: 60, en: 10, desc: 'ばあちゃん特製。HP60、EN10回復。' },
    ramen: { name: '星屑ラーメン', kind: 'use', price: 200, hp: 999, en: 999, desc: '星屑亭の看板メニュー。HPとENを全回復。' },
    energy: { name: 'エナジードリンク', kind: 'use', price: 50, en: 40, desc: 'ENを40回復。カフェイン多め。' },
    repair: { name: '修理キット', kind: 'use', price: 120, mech: 0.4, desc: '機体の装甲を40%回復（機体戦専用）。' },
    repair2: { name: '高級修理キット', kind: 'use', price: 360, mech: 1, desc: '機体の装甲を全回復（機体戦専用）。' },
    candy: { name: 'ネオンキャンディ', kind: 'use', price: 20, hp: 20, desc: '光るアメ。HPを20回復。ニコの好物。' },
    scrap: { name: 'ジャンクパーツ', kind: 'mat', price: 0, sell: 15, desc: '機体の改造に使う部品。ドクに渡そう。' },
    chip: { name: 'レアチップ', kind: 'mat', price: 0, sell: 80, desc: '高性能な回路。上位の改造に必要。' },
    memory: { name: '星屑メモリー', kind: 'mat', price: 0, sell: 0, desc: 'コロニー中に隠された古いメモリーカード。誰かの思い出が記録されている。' },
    // 武器
    wrench: { name: '父のスパナ', kind: 'weapon', atk: 4, price: 0, desc: '父の形見。手になじむ。' },
    pipe: { name: '鉄パイプ', kind: 'weapon', atk: 7, price: 150, desc: '頑丈な鉄パイプ。' },
    stunrod: { name: 'スタンロッド', kind: 'weapon', atk: 11, price: 480, desc: '電撃で相手をしびれさせる。' },
    plasmabat: { name: 'プラズマバット', kind: 'weapon', atk: 17, price: 1200, desc: '光るバット。ポンタの自信作。' },
    echoblade: { name: 'エコーブレード', kind: 'weapon', atk: 26, price: 0, desc: '星の声に共鳴する光の刃。' },
    // アクセサリ
    charm: { name: '交通安全のお守り', kind: 'acc', def: 2, price: 100, desc: '防御+2。ばあちゃんがくれた。' },
    sneakers: { name: 'エアスニーカー', kind: 'acc', spd: 0.25, def: 1, price: 380, desc: '移動速度アップ。防御+1。' },
    headset: { name: 'DJヘッドセット', kind: 'acc', en: 20, def: 1, price: 520, desc: '最大EN+20。リリィのお下がり。' },
    badge: { name: 'クラン・バッジ', kind: 'acc', atk: 3, def: 3, price: 0, desc: 'スターダストの証。攻撃+3 防御+3。' },
    pendant: { name: '星のペンダント', kind: 'acc', atk: 2, def: 5, en: 10, price: 0, desc: 'ニコがくれた石。防御+5 EN+10 攻撃+2。' },
  };
  G.addItem = function (id, def) {
    G.ITEMS[id] = Object.assign({ kind: 'key', price: 0, desc: '' }, def);
  };
  // 大事なもの
  [
    ['parts_list', '部品リスト', 'ポンコツ号の修理に必要な部品のメモ。'],
    ['gyro', 'ジャイロユニット', 'ポンコツ号の姿勢制御装置。'],
    ['idcard', 'ニコの身分証', '偽造……もとい、手作りの身分証。'],
    ['entry', 'デュエル参加証', 'ジャンク・デュエルの出場パス。'],
    ['keycard', '研究所カードキー', 'コア・シャフト研究棟のカードキー。'],
    ['letter', '父の手紙', '5年前、父がカナタに残した手紙。'],
    ['pass_core', '総督府通行証', 'ユイが用意したコア・シャフトの通行証。'],
    ['ticket', '文化祭チケット', '2年B組「星屑亭・出張店」の食券。'],
    ['ramen_box', '出前箱', '星屑亭の出前箱。熱いうちに届けよう。'],
    ['photo', '古い写真', '若い頃のばあちゃんとAF。'],
    ['tape', 'カセットテープ', 'リリィに頼まれた古い音源。'],
  ].forEach(([id, name, desc]) => G.addItem(id, { name, desc }));

  // ---------- スキル ----------
  G.SKILLS = {
    spark: { name: 'スパーク', en: 8, desc: '周囲に電撃を放つ。（C）' },
    echo: { name: 'エコー・シールド', en: 20, desc: '一定時間ダメージを無効化し、周囲を押し返す。（C長押し）' },
    overdrive: { name: 'オーバードライブ', en: 0, desc: '機体戦：ENゲージ満タン時、Cで必殺の連続斬り。' },
  };

  // ---------- 状態 ----------
  G.newState = function () {
    return {
      map: 'tome_room',
      x: 5,
      y: 6,
      dir: 'down',
      flags: {},
      items: { soda: 2 },
      money: 300,
      lv: 1,
      exp: 0,
      hp: 60,
      en: 30,
      equip: { weapon: 'wrench', acc: null },
      mech: { id: 'ponkotsu', armor: 1, power: 1, boost: 1, weapon: 1, hp: null },
      party: [],
      chapter: 0,
      objective: '',
      quests: {},
      time: 'morning',
      play: 0,
      skills: [],
      kills: 0,
      rank: 0,
      memories: 0,
      version: 1,
    };
  };
  G.state = G.newState();

  // ---------- 成長 ----------
  G.expNext = (lv) => Math.floor(18 * Math.pow(lv, 1.55) + 12);
  G.stats = function () {
    const s = G.state;
    const w = G.ITEMS[s.equip.weapon] || {},
      a = G.ITEMS[s.equip.acc] || {};
    return {
      maxhp: 50 + s.lv * 12,
      maxen: 26 + s.lv * 4 + (a.en || 0),
      atk: 4 + s.lv * 2 + (w.atk || 0) + (a.atk || 0),
      def: 1 + Math.floor(s.lv * 1.2) + (a.def || 0),
      spd: 1.25 + (a.spd || 0),
    };
  };
  // 機体ステータス（改造段階 1..5）
  G.mechStats = function () {
    const m = G.state.mech;
    const base = G.MECH_BASE[m.id] || G.MECH_BASE.ponkotsu;
    return {
      maxhp: Math.floor(base.hp * (1 + (m.armor - 1) * 0.35) + G.state.lv * 4),
      maxen: Math.floor(base.en * (1 + (m.boost - 1) * 0.2)),
      atk: Math.floor(base.atk * (1 + (m.power - 1) * 0.3) + G.state.lv * 1.5),
      beam: Math.floor(base.beam * (1 + (m.weapon - 1) * 0.3) + G.state.lv),
      spd: base.spd + (m.boost - 1) * 0.12,
      def: Math.floor(base.def + (m.armor - 1) * 2 + G.state.lv * 0.5),
    };
  };
  G.MECH_BASE = {
    ponkotsu: { hp: 130, en: 60, atk: 24, beam: 12, spd: 1.5, def: 3 },
    harukaze: { hp: 210, en: 100, atk: 34, beam: 17, spd: 1.95, def: 6 },
    harukaze2: { hp: 280, en: 130, atk: 46, beam: 23, spd: 2.15, def: 9 },
  };
  G.gainExp = function (n) {
    const s = G.state;
    s.exp += n;
    let up = false;
    while (s.exp >= G.expNext(s.lv) && s.lv < 60) {
      s.exp -= G.expNext(s.lv);
      s.lv++;
      up = true;
    }
    if (up) {
      const st = G.stats();
      s.hp = st.maxhp;
      s.en = st.maxen;
      G.audio.se('levelup');
      G.ui && G.ui.toast('レベルアップ！ Lv ' + s.lv, G.UI.gold);
    }
    return up;
  };
  G.addItemCount = function (id, n) {
    const s = G.state;
    s.items[id] = (s.items[id] || 0) + n;
    if (s.items[id] <= 0) delete s.items[id];
    if (id === 'memory' && n > 0) s.memories += n;
  };

  // ---------- セーブ/ロード ----------
  const KEY = 'stardust_cradle_save_';
  G.save = function (slot) {
    const s = G.state;
    if (G.field && G.field.player) {
      const p = G.field.player;
      s.map = G.field.map.id;
      s.x = Math.floor(p.x / 16);
      s.y = Math.floor((p.y - 4) / 16);
      s.dir = p.dir;
    }
    const data = JSON.stringify(s);
    try {
      localStorage.setItem(KEY + slot, data);
      localStorage.setItem(KEY + 'meta' + slot, JSON.stringify({ lv: s.lv, chapter: s.chapter, map: s.map, play: s.play, date: Date.now(), place: G.MAPS[s.map] ? G.MAPS[s.map].name : '' }));
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  };
  G.load = function (slot) {
    try {
      const d = localStorage.getItem(KEY + slot);
      if (!d) return false;
      G.state = Object.assign(G.newState(), JSON.parse(d));
      return true;
    } catch (e) {
      return false;
    }
  };
  G.saveMeta = function (slot) {
    try {
      const m = localStorage.getItem(KEY + 'meta' + slot);
      return m ? JSON.parse(m) : null;
    } catch (e) {
      return null;
    }
  };
  G.hasAnySave = () => [0, 1, 2, 3].some((i) => G.saveMeta(i));
  G.fmtTime = function (frames) {
    const s = Math.floor(frames / 60);
    return Math.floor(s / 3600) + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  };
  // 設定
  G.settings = { music: 0.55, sfx: 0.6, textSpeed: 1, crt: true };
  try {
    Object.assign(G.settings, JSON.parse(localStorage.getItem(KEY + 'settings') || '{}'));
  } catch (e) {}
  G.saveSettings = function () {
    try {
      localStorage.setItem(KEY + 'settings', JSON.stringify(G.settings));
    } catch (e) {}
  };
})();
