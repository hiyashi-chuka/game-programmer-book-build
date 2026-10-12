// =============================================================
//  chars.js — 登場人物データ（見た目・名前・声）
// =============================================================
// spr: スプライト用パラメータ / por: ポートレート用（省略時は spr を流用）
// voice: 会話ブリップの音の高さ(Hz)
(function () {
  const UNI = { top: '#2a3460', top2: '#f4f2fb', bottom: '#22263e', outfit: 'uniform' }; // 第三中の制服
  const C = (G.chars = {});
  function def(id, o) {
    o.id = id;
    o.por = Object.assign({}, o.spr, o.por || {});
    C[id] = o;
  }

  // ---------------- 主人公たち ----------------
  def('kanata', {
    name: 'カナタ',
    full: '春瀬 カナタ',
    voice: 420,
    spr: Object.assign({}, UNI, { skin: '#f6d3b3', hair: '#4a2e2a', style: 'messy', iris: '#4a8ae0', eye: '#2a1838', tie: '#ff4f6a', shoes: '#f0f0f8', acc: ['goggles', 'wrench'], accCol: '#f08a30' }),
    por: { acc: ['goggles'], thickBrows: false },
  });
  def('ruu', {
    name: 'ルウ',
    full: '水無月 ルウ',
    voice: 560,
    spr: { skin: '#f8dcc4', hair: '#2a2238', mesh: '#ff5fa2', style: 'pixie', iris: '#ff6f9f', top: '#7a5ae0', top2: '#ff5fa2', outfit: 'hoodie', bottom: '#22263e', bstyle: 'skirt', shoes: '#ff5fa2', socks: '#1a1a2a', acc: ['headphones'], accCol: '#1e1a2a', lashes: true },
    por: { acc: ['headphones', 'earring', 'bandaid'] },
  });
  def('niko', {
    name: 'ニコ',
    full: 'ニコ',
    voice: 700,
    spr: { skin: '#fbe6d8', hair: '#eef2ff', style: 'wild', iris: '#4ef0ff', eye: '#205070', top: '#e0903a', top2: '#f4f0e0', outfit: 'jumpsuit', bottom: '#e0903a', shoes: '#606878', build: 'small', lashes: true, blush: true, ahoge: true },
    por: { ahoge: true },
  });
  def('sig', {
    name: 'シグ',
    full: '獅子堂 シグレ',
    voice: 300,
    spr: { skin: '#f2dccc', hair: '#b8c8ec', style: 'side', iris: '#ff4060', top: '#eef0fa', top2: '#3a6ad0', outfit: 'jumpsuit', bottom: '#eef0fa', shoes: '#3a6ad0', build: 'slim' },
    por: { hideEye: 1 },
  });

  // ---------------- 学校 ----------------
  def('ponta', {
    name: 'ポンタ',
    full: '権田 ポンタロウ',
    voice: 260,
    spr: Object.assign({}, UNI, { skin: '#eec6a0', hair: '#3a2a20', style: 'buzz', iris: '#6a4a30', tie: '#ff4f6a', build: 'big', acc: ['bandana'], accCol: '#ff8a30', shoes: '#c04040', mouth: true }),
    por: { thickBrows: true, blush: true, jaw: 'wide' },
  });
  def('yui', {
    name: 'ユイ',
    full: '風見 ユイ',
    voice: 600,
    spr: Object.assign({}, UNI, { skin: '#fbe2d0', hair: '#1c1a34', style: 'hime', iris: '#4a5ab0', tie: '#3a8ae0', bstyle: 'skirt', socks: '#f4f2fb', shoes: '#3a2a20', acc: ['glasses'], accCol: '#a03050', lashes: true }),
    por: { ribbon: true, acc: ['glasses', 'hairpin'] },
  });
  def('vargas', {
    name: 'バルガス先生',
    full: 'バルガス',
    voice: 170,
    spr: { skin: '#c99068', hair: '#3a3a48', style: 'slick', iris: '#5a4a3a', top: '#2f5a44', top2: '#f0f0f0', outfit: 'jacket', bottom: '#2a2a3a', shoes: '#f0f0f0', build: 'big', beard: '#3a3040', thickBrows: true },
    por: { scar: true, thickBrows: true, jaw: 'wide', beard: '#4a3a40' },
  });
  def('mimi', {
    name: 'ミミ',
    full: '小鳥遊 ミミ',
    voice: 760,
    spr: Object.assign({}, UNI, { skin: '#fbe0cc', hair: '#c86a5a', style: 'twin', iris: '#e0803a', tie: '#ffd25e', bstyle: 'skirt', socks: '#f4f2fb', shoes: '#e05a5a', build: 'small', lashes: true, blush: true, acc: ['ribbon'], accCol: '#ffd25e' }),
    por: { acc: ['hairpin'] },
  });
  def('kyosuke', {
    name: 'キョウスケ',
    full: '鬼塚 キョウスケ',
    voice: 230,
    spr: { skin: '#f0c8a8', hair: '#e8d070', style: 'wild', iris: '#c04040', top: '#1a1a28', top2: '#c02040', outfit: 'jacket', bottom: '#1a1a28', shoes: '#c02040', build: 'tall' },
    por: { acc: ['earring', 'bandaid'], thickBrows: true },
  });

  // ---------------- 街の人々 ----------------
  def('tome', {
    name: 'ばあちゃん',
    full: '春瀬 トメ',
    voice: 330,
    spr: { skin: '#f0caa8', hair: '#dcdce8', style: 'bun', iris: '#5a3a3a', top: '#3a5a98', top2: '#f6f2ea', outfit: 'apron', bottom: '#3a3a50', shoes: '#4a3030', acc: ['bandana'], accCol: '#e04a4a', eyesClosed: true },
    por: { old: true, age: 'old', acc: ['bandana'] },
  });
  def('doc', {
    name: 'ドク',
    full: 'ドク・モーリス',
    voice: 200,
    spr: { skin: '#e8b890', hair: '#f0f0f4', style: 'bald', iris: '#3a7a5a', top: '#6a5038', top2: '#d0c0a0', outfit: 'coat', bottom: '#3a3028', shoes: '#2a2020', beard: '#f0f0f4', acc: ['monocle'], accCol: '#e8c050' },
    por: { old: true, age: 'old', beard: '#e8e8f0', acc: ['monocle', 'goggles'], accCol: '#8a6a3a', thickBrows: true },
  });
  def('lily', {
    name: 'DJリリィ',
    full: 'DJリリィ',
    voice: 520,
    spr: { skin: '#f8d8c8', hair: '#9a6ae0', mesh: '#4ef0ff', style: 'long', iris: '#4ef0ff', top: '#ff5fa2', top2: '#1a1a2a', outfit: 'jacket', bottom: '#1a1a2a', bstyle: 'shorts', shoes: '#f0f0f0', socks: '#1a1a2a', lashes: true, acc: ['headphones'], accCol: '#f0f0f8' },
    por: { acc: ['headphones', 'earring'] },
  });
  def('gil', {
    name: 'ギル',
    full: 'ギル・ブレイズ',
    voice: 340,
    spr: { skin: '#e8b898', hair: '#ff4848', mesh: '#ffd25e', style: 'spiky', iris: '#ffb030', top: '#c02030', top2: '#1a1a1a', outfit: 'jacket', bottom: '#1a1a24', shoes: '#ffd25e', build: 'tall', acc: ['sunglasses'], accCol: '#1a1a1a' },
    por: { acc: ['earring'], mesh: '#ffd25e' },
  });
  def('cube', { name: 'キューブ', full: 'キューブ', voice: 1200, spr: { special: 'cube' }, por: { special: 'cube' } });
  def('neji', { name: 'ネジ', full: 'ロボット猫ネジ', voice: 980, spr: { special: 'neji' }, por: { special: 'neji' } });

  // ---------------- 敵・大人たち ----------------
  def('eisen', {
    name: 'アイゼン少佐',
    full: 'ヴォルフ・アイゼン',
    voice: 190,
    spr: { skin: '#f0d0b8', hair: '#e4e0cc', style: 'slick', iris: '#6a8ab0', top: '#343a54', top2: '#c0c8d8', outfit: 'military', bottom: '#2a2e44', shoes: '#141418', build: 'tall' },
    por: { scar: true },
  });
  def('mirage', {
    name: 'ミラージュ',
    full: '黒い仮面の男',
    voice: 210,
    spr: { skin: '#e8c8a8', hair: '#3a2a2e', style: 'messy', iris: '#ff3050', top: '#1a1a26', top2: '#ff3050', outfit: 'military', bottom: '#141420', shoes: '#141418', build: 'tall', acc: ['mask'], accCol: '#1a1a24' },
    por: { acc: ['mask'], accCol: '#20202c' },
  });
  def('jin', {
    name: 'ジン',
    full: '春瀬 ジン',
    voice: 230,
    spr: { skin: '#e8c8a8', hair: '#3a2a2e', style: 'messy', iris: '#4a8ae0', top: '#3a4a6a', top2: '#f0a040', outfit: 'jumpsuit', bottom: '#3a4a6a', shoes: '#2a2a30', build: 'tall', beard: '#4a3a3a' },
    por: { beard: '#5a4040', jaw: 'wide' },
  });
  def('helmina', {
    name: 'ヘルミナ',
    full: 'ドクター・ヘルミナ・クロイツ',
    voice: 380,
    spr: { skin: '#f6e0d6', hair: '#cdbde6', style: 'hime', iris: '#a060ff', top: '#e6e8f2', top2: '#5a3aa0', outfit: 'labcoat', bottom: '#2a2440', shoes: '#2a2440', build: 'tall', lashes: true },
    por: { tie: '#5a3aa0', tie2: true },
  });
  def('kazami', {
    name: '風見総督',
    full: '風見 ソウイチロウ',
    voice: 210,
    spr: { skin: '#f0d0b8', hair: '#6a6a78', style: 'slick', iris: '#4a5ab0', top: '#2a2a3a', top2: '#f0f0f0', tie: '#3a8ae0', outfit: 'suit', bottom: '#2a2a3a', shoes: '#141418', build: 'tall', acc: ['glasses'], accCol: '#c0c0d0' },
    por: { thickBrows: true },
  });
  def('mother', { name: 'マザー', full: 'コロニー管理AI〈マザー〉', voice: 880, spr: { special: 'mother' }, por: { special: 'mother' } });
  def('radio', { name: 'レディオ・スターダスト', full: '', voice: 520, spr: { special: 'radio' }, por: { special: 'radio' } });
  def('guard', {
    name: '公安隊員',
    full: '公安隊員',
    voice: 180,
    spr: { skin: '#f0d0b8', hair: '#2a2a3a', style: 'buzz', top: '#4a5a7a', top2: '#c0c8d8', outfit: 'military', bottom: '#3a4060', shoes: '#141418', acc: ['helmet'], accCol: '#5a6a8a', build: 'tall' },
    por: { acc: ['helmet'] },
  });
  def('kid', {
    name: '子ども',
    voice: 820,
    spr: { skin: '#f8dcc0', hair: '#7a4a2a', style: 'short', top: '#ff8a50', outfit: 'tshirt', top2: '#ffffff', bottom: '#3a4a70', bstyle: 'shorts', build: 'small', shoes: '#f0f0f0' },
  });
  // 名前のない人（ナレーション）
  def('sys', { name: '', voice: 0, spr: {} });

  // 名前付きモブ（町の人）を手早く作る
  G.mob = function (id, name, seed, opt) {
    const spr = G.randomCitizen(seed, opt);
    def(id, { name, full: name, voice: (opt && opt.voice) || (spr.lashes ? 540 : 300) + (seed % 7) * 25, spr });
    return C[id];
  };
})();
