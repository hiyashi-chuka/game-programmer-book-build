// =============================================================
//  music.js — 星屑のクレイドル 全BGM（MML）
//  G.audio.songs に登録する。各曲は全チャンネル同じ長さ（拍）でループする。
//  注意: ドラムch では 'o'(オープンハット) と 't'(ロータム) はパーサ上
//        オクターブ/テンポ命令として解釈されてしまうため使わない。
// =============================================================
(function () {
  const S = G.audio.songs;

  // ---------- ヘルパ ----------
  // コード名 → ベース音（スラッシュコードは分母）。'Bb'→'b-', 'F#'→'f+'
  const ROOT = (c) => {
    const b = c.includes('/') ? c.split('/')[1] : c;
    let r = b[0].toLowerCase();
    if (b[1] === 'b') r += '-';
    else if (b[1] === '#') r += '+';
    return r;
  };
  const NAME = (c) => c.split('/')[0];
  // o4 内の昇順クローズボイシング（オクターブ記号なし・3音）
  const TRI = {
    C: 'c e g', Cm: 'c e- g', C7: 'e g b-', Cmaj7: 'e g b',
    'C#m': 'c+ e g+', Db: 'd- f a-',
    D: 'd f+ a', Dm: 'd f a', D7: 'c f+ a', Dm7: 'c f a', Dmaj7: 'c+ f+ a',
    Eb: 'e- g b-',
    E: 'e g+ b', Em: 'e g b', Em7: 'd g b', E7: 'd g+ b',
    F: 'c f a', Fm: 'c f a-', Fmaj7: 'c e a', 'F#m': 'c+ f+ a',
    G: 'd g b', Gm: 'd g b-', G7: 'd f b', Gm7: 'd f b-', Gmaj7: 'd f+ b',
    'G#m': 'd+ g+ b', Ab: 'c e- a-',
    A: 'c+ e a', Am: 'c e a', A7: 'c+ e g', Am7: 'c e g',
    Bb: 'd f b-', Bbmaj7: 'd f a', B: 'd+ f+ b', Bm: 'd f+ b', Bm7: 'd f+ a', B7: 'd+ f+ a',
  };
  const tri = (c) => {
    const v = TRI[NAME(c)];
    if (!v) throw new Error('music.js: no voicing for ' + c);
    return v;
  };
  const T3 = (c) => tri(c).split(' ');
  // 進行文字列の各小節に f(chord, half) を適用。'Cm7-F7' のように '-' で 1小節2コード
  const each = (p, f) =>
    p.trim().split(/\s+/)
      .map((tok) => (tok.includes('-') ? tok.split('-').map((c) => f(c, true)).join(' ') : f(tok, false)))
      .join(' | ');
  const R = (n) => `[r1]${n}`; // n小節休み (n>=1)
  const FIFTH = {
    c: ['g', 0], 'c+': ['g+', 0], 'd-': ['a-', 0], d: ['a', 0], 'd+': ['a+', 0], 'e-': ['b-', 0], e: ['b', 0],
    f: ['c', 1], 'f+': ['c+', 1], g: ['d', 1], 'g+': ['d+', 1], 'a-': ['e-', 1], a: ['e', 1], 'b-': ['f', 1], b: ['f+', 1],
  };
  const fifth = (r, l) => {
    const [n, hi] = FIFTH[r];
    return hi ? `> ${n}${l} <` : `${n}${l}`;
  };
  // パワーコード {root 5th (octave)}
  const pc = (r, l, full) => {
    const [n, hi] = FIFTH[r];
    const inner = hi ? `${r} > ${n}${full ? ' ' + r : ''}` : `${r} ${n}${full ? ' > ' + r : ''}`;
    return `{${inner}}${l}`;
  };

  // --- 小節パターン（(chord, half) → MML）。長さは全て明示 ---
  const padF = (c, h) => `{${tri(c)}}${h ? 2 : 1}`;
  const pad2F = (c) => `{${tri(c)}}1^1`; // 2小節
  const rootF = (c, h) => `${ROOT(c)}${h ? 2 : 1}`;
  const root2F = (c) => `${ROOT(c)}1^1`;
  const halfRootF = (c) => `${ROOT(c)}2 ${ROOT(c)}2`;
  const pumpF = (c, h) => {
    const r = ROOT(c);
    const s = `${r}8 ${r}8 > ${r}8 < ${r}8`;
    return h ? s : `[${s}]2`;
  };
  const eightF = (c, h) => `[${ROOT(c)}8]${h ? 4 : 8}`;
  const gallopF = (c, h) => `[${ROOT(c)}8 ${ROOT(c)}16 ${ROOT(c)}16]${h ? 2 : 4}`;
  const rumbleF = (c, h) => {
    const r = ROOT(c);
    return `[${r}16 ${r}16 > ${r}16 < ${r}16]${h ? 2 : 4}`;
  };
  const arpF = (c, h) => {
    const [x, y, z] = T3(c);
    const s = `${x}16 ${y}16 ${z}16 > ${x}16 ${y}16 ${x}16 < ${z}16 ${y}16`;
    return h ? s : `[${s}]2`;
  };
  // ピアノ分散和音: ベース(o3)+三和音(o4)
  const parpF = (c, h) => {
    const r = ROOT(c);
    const [x, y, z] = T3(c);
    return h ? `< ${r}8 > ${x}8 ${y}8 ${z}8` : `< ${r}8 > ${x}8 ${y}8 ${z}8 > ${x}8 < ${z}8 ${y}8 ${x}8`;
  };
  const alb16F = (c, h) => {
    const [x, y, z] = T3(c);
    return `[${x}16 ${z}16 ${y}16 ${z}16]${h ? 2 : 4}`;
  };
  const offF = (c, h) => `[r8 {${tri(c)}}8]${h ? 2 : 4}`;
  const pc8F = (full) => (c, h) => `[${pc(ROOT(c), 8, full)}]${h ? 4 : 8}`;
  const slapF = (c, h) => {
    const r = ROOT(c);
    return h
      ? `${r}8. ${r}16 > ${r}8 < ${r}8`
      : `${r}8. ${r}16 > ${r}8 < ${r}8 ${r}16 ${r}8 ${r}16 > ${r}8 < ${r}8`;
  };

  // ドラム共通
  const FILL = 's16 s16 s16 s16 m16 m16 m16 m16 k16 k16 k16 k16 s16 s16 s16 s16';
  const FILL2 = 'k8 h8 s8 h8 s16 s16 m16 m16 k16 k16 s16 s16';
  const ROCK = 'k8 r8 s8 r8 k8 k8 s8 r8';
  const HATS8 = (bars) => `c4 [h8]6${bars > 1 ? ` [h8]${(bars - 1) * 8}` : ''}`;

  // =============================================================
  // title — STARDUST CRADLE（切ないシンセ、アルペジオ）
  // =============================================================
  {
    const I = 'Dm Bb F C',
      A = 'Dm Bb F C Dm Bb Gm A',
      B = 'Bb C Am Dm Gm C F A',
      O = 'Dm Bb Gm A';
    const all = [I, A, B, O].join(' ');
    const melA =
      'r8 d8 e8 f8 a4 g8 f8 | f4 e8 d8 d4 r8 c8 | c8 d8 f8 a8 > c4 < a8 g8 | g2 r4 e8 g8 |' +
      'a4. g8 f8 e8 f8 a8 | b-4. a8 g8 f8 d4 | d8 e8 f8 g8 b-4 a8 g8 | a2. r4';
    const melB =
      '> d4. c8 d8 c8 < b-8 a8 | g4 e8 g8 > c4. < g8 | a4. g8 e8 c8 e8 g8 | f2 r8 d8 e8 f8 |' +
      'g4. f8 g8 a8 b-8 > d8 < | > c4. < b-8 a8 g8 e8 g8 | a2 > c4 < a4 | g+4 a4 b4 > c+4 <';
    S.title = {
      tempo: 100, vol: 1.0,
      ch: [
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o5 v13 ${R(4)} | ${melA} | ${melB} | ${R(4)}` },
        { inst: 'bell', vol: 1, pan: -0.25, mml: `o5 v11 a2 g4 f4 | f2 e4 d4 | c2 d4 f4 | e1 | ${R(16)} | a2 g4 f4 | f2 e4 d4 | d2 e4 f4 | e1` },
        { inst: 'arp', vol: 1, pan: 0.3, mml: `o4 v8 ${each(all, arpF)}` },
        { inst: 'pad', vol: 1, pan: -0.1, mml: `o4 v9 ${each(all, padF)}` },
        { inst: 'bass', vol: 1, mml: `o2 v11 ${each(I, rootF)} | ${each([A, B, O].join(' '), pumpF)}` },
        {
          inst: 'drum', vol: 0.85,
          mml:
            `v11 [k4 r4 r4 r4]3 k8 r8 r8 r8 k8 r8 s8 s8 |` +
            ` c8 h8 s8 h8 k8 k8 s8 h8 [k8 h8 s8 h8 k8 k8 s8 h8]6 k8 h8 s8 h8 s16 s16 m16 m16 k16 k16 s16 s16 |` +
            ` c8 h8 s8 h8 k8 k8 s8 h8 [k8 h8 s8 h8 k8 k8 s8 h8]6 ${FILL} |` +
            ` c8 h8 h8 h8 s8 h8 h8 h8 [k8 h8 h8 h8 s8 h8 h8 h8]2 k8 h8 h8 h8 s8 h8 s8 s8`,
        },
      ],
    };
  }

  // =============================================================
  // town — ミナト区ブルース（シティポップ、FMエレピ、スラップ）
  // =============================================================
  {
    const A = 'Bbmaj7 A7 Dm7 Cm7-F7 Bbmaj7 A7 Dm7 Cm7-F7',
      B = 'Gm7 C7 Am7 Dm7 Gm7 C7 Fmaj7 A7';
    const all = [A, B, A].join(' ');
    const V = {
      Bbmaj7: 'd f a > c', A7: 'c+ e g b', Dm7: 'c e f a', Cm7: 'e- g b- > d', F7: 'e- g a > c',
      Gm7: 'f a b- > d', C7: 'e g b- > d', Am7: 'c e g b', Fmaj7: 'e g a > c',
    };
    const epF = (c, h) => (h ? `{${V[c]}}4. {${V[c]}}8` : `{${V[c]}}4. {${V[c]}}8 r8 {${V[c]}}4.`);
    const a7 =
      'r8 f8 a8 > c8 d4 c8 < a8 | > c+4. < a8 g8 e8 g8 a8 | a8 g8 f8 e8 f4. d8 | e-4 g8 b-8 a4 r4 |' +
      'r8 f8 a8 > c8 d8 f8 d8 c8 < | > c+4 e4 < a4 g4 | f4. e8 d4 c8 d8';
    const melA = a7 + ' | e-8 d8 c8 < b-8 > c4 r4';
    const melA2 = a7 + ' | e-8 g8 b-8 > d8 c4 r4 <';
    const melB =
      'b-4. a8 g8 f8 d8 f8 | e2 g8 a8 b-8 > c8 < | > d4. c8 < b8 a8 g8 a8 | f2. r4 |' +
      'g8 a8 b-8 > d8 f4 e8 d8 < | > c4. < b-8 g8 e8 c8 e8 | a2 > c4 e4 < | > c+4 < b4 a4 g4';
    S.town = {
      tempo: 108, vol: 1.0,
      ch: [
        { inst: 'softlead', vol: 1, pan: 0.15, mml: `o4 v13 ${melA} | ${melB} | ${melA2}` },
        { inst: 'ep', vol: 1, pan: -0.3, mml: `o4 v10 ${each(all, epF)}` },
        { inst: 'slap', vol: 1, mml: `o2 v11 ${each(all, slapF)}` },
        { inst: 'drum', vol: 0.8, mml: `v11 [[k4 k4 k4 k4]7 k8 k8 k8 r8 m16 m16 m16 m16 s16 s16 s16 s16]3` },
        { inst: 'drum', vol: 0.6, pan: 0.2, mml: `v10 [r16 h16 b16 h16 x16 h16 b16 h16 r16 h16 b16 h16 x16 h16 b16 h16]24` },
      ],
    };
  }

  // =============================================================
  // home — 星屑亭のまかない（あたたかい、ゆったり）
  // =============================================================
  {
    const A = 'G D/F# Em7 G/D C G/B Am7 D7',
      A2 = 'G D/F# Em7 G/D C D G G',
      B = 'C D Bm7 Em7 Am7 D G D7';
    const all = [A, A2, B].join(' ');
    const m5 = 'd4 g8 a8 b4 a8 g8 | a4. f+8 d4 r4 | e4 g8 a8 b4 a4 | g2. r4 | e4 e8 g8 > c4 < b8 a8';
    const melA = m5 + ' | b4. a8 g4 d4 | c4 e8 g8 a4 g8 e8 | f+4. g8 a2';
    const melA2 = m5 + ' | a4. b8 a4 f+4 | g2. r4 | r2 r8 d8 e8 f+8';
    const melB =
      'g4. e8 g4 > c4 < | a4. f+8 a4 > d4 < | b4. a8 f+4 d4 | e4 g8 b8 > d4. < b8 |' +
      '> c4. < b8 a4 g4 | f+4 a4 > d4 c4 < | b2 a4 g4 | a2 f+4 a4';
    S.home = {
      tempo: 84, vol: 1.0,
      ch: [
        { inst: 'flute', vol: 1, pan: 0.15, mml: `o5 v12 ${melA} | ${melA2} | ${melB}` },
        { inst: 'piano', vol: 1, pan: -0.2, mml: `o4 v9 ${each(all, parpF)}` },
        { inst: 'bass', vol: 0.9, mml: `o2 v10 ${each(all, (c) => `${ROOT(c)}4. ${ROOT(c)}8 ${ROOT(c)}2`)}` },
        { inst: 'strings', vol: 1, pan: 0.25, mml: `o4 v8 ${R(16)} | ${each(B, padF)}` },
        { inst: 'drum', vol: 0.55, mml: `v9 [k8 b8 b8 b8 x8 b8 b8 b8]16 [k8 b8 x8 b8 k8 k8 x8 b8]8` },
      ],
    };
  }

  // =============================================================
  // school — 第三中学校のチャイム（軽快、ポップ）
  // =============================================================
  {
    const I = 'C G G C',
      A = 'C G/B Am Em F C/E Dm7 G',
      B = 'F G Em Am Dm7 G C C7',
      A2 = 'C G/B Am Em F C/E Dm7 C';
    const a7 =
      'e8 g8 > c4 < b8 g8 a8 b8 | > d4. c8 < b8 a8 g4 | a8 b8 > c8 < a8 e4 c8 e8 | g4. f8 e4 d4 |' +
      'c8 d8 e8 f8 a4 g8 f8 | e4 g4 > c4. < g8 | a4 g8 f8 e8 d8 c8 d8';
    const melB =
      'a4. g8 a4 > c4 < | b4. a8 g4 d4 | g4. a8 b4 g4 | a4 > c4 < a4 e4 | f4. e8 d4 f4 |' +
      'g4. a8 b4 > d4 < | > c2 < g4 e4 | > c4 < r8 e8 g8 b-8 > c8 r8 <';
    const main = [A, B, A2].join(' ');
    const beat8 = `c8 h8 s8 h8 k8 k8 s8 h8 [k8 h8 s8 h8 k8 k8 s8 h8]6 k8 h8 s8 h8 s16 s16 m16 m16 k16 k16 s16 s16`;
    S.school = {
      tempo: 132, vol: 1.0,
      ch: [
        { inst: 'bell', vol: 1, pan: -0.2, mml: `o5 v12 e2 c2 | d2 < g2 | g2 > d2 | e2 c2 | ${R(24)}` },
        { inst: 'sq25', vol: 1, pan: 0.15, mml: `o4 v11 ${R(4)} | ${a7} | d4 g4 r4 g8 g8 | ${melB} | ${a7} | > c2. < r4` },
        { inst: 'piano', vol: 1, pan: -0.25, mml: `o4 v8 ${each(I, padF)} | ${each(main, offF)}` },
        { inst: 'sqbass', vol: 1, mml: `o2 v11 ${each(I, rootF)} | ${each(main, pumpF)}` },
        { inst: 'drum', vol: 0.8, mml: `v11 r1 r1 r1 r2 s16 s16 s16 s16 m16 m16 k16 k16 | [${beat8}]3` },
      ],
    };
  }

  // =============================================================
  // scrap — ジャンク・ファンク（スラップベース風ファンク）
  // =============================================================
  {
    const B = 'Cmaj7 Bm7 Am7 D7 Cmaj7 Bm7 Am7 B7';
    const em = 'e8 e16 > e16 < r16 e16 g16 a16 b8 > d16 < b16 a16 g16 e16 r16';
    const a7 = 'a8 a16 > a16 < r16 a16 > c+16 d16 e8 g16 e16 d16 c+16 < a16 r16';
    const riffA = `[${em} | ${em} | ${a7} | ${a7}]2`;
    const V = { Em7: 'e g b > d', A7: 'e g b > c+', Cmaj7: 'e g b', Bm7: 'd f+ a', Am7: 'c e g', D7: 'c f+ a', B7: 'd+ f+ a' };
    const chopF = (c) => {
      const X = `{${V[c]}}`;
      return `r8 ${X}16 r16 r8 ${X}16 ${X}16 r8 ${X}16 r16 ${X}8 r8`;
    };
    const chopsA = each('Em7 Em7 A7 A7 Em7 Em7 A7 A7', chopF);
    const orgA = '[[{d g b}2. r4]2 [{c+ e g}2. r4]2]2';
    const melB =
      'g4. e8 g8 a8 b4 | a4 f+8 d8 f+4 a4 | g8 a8 g8 e8 c4 e4 | f+4. e8 d8 c8 < a8 > c8 |' +
      'e4 g4 b4 > d4 < | > c+4. < b8 a4 f+4 | g4 e8 g8 a4 > c4 < | b4. a8 f+4 d+4';
    const hits = '[r2 r8 {d g b}8 r8 {d g b}8 | {e g b}4 r4 r2 | r2 r8 {c+ e g}8 r8 {c+ e a}8 | {c+ e a}4. r8 r2]2';
    const kick = 'k16 r16 r16 k16 s16 r16 r16 k16 r16 r16 k16 r16 s16 r16 r16 k16';
    S.scrap = {
      tempo: 104, vol: 1.0,
      ch: [
        { inst: 'slap', vol: 1, mml: `o2 v12 ${riffA} | ${each(B, slapF)} | ${riffA}` },
        { inst: 'pluck', vol: 0.9, pan: 0.3, mml: `o4 v9 ${chopsA} | ${each(B, chopF)} | ${chopsA}` },
        { inst: 'organ', vol: 1, pan: -0.2, mml: `o4 v8 ${orgA} | o5 v12 ${melB} | o4 v8 ${orgA}` },
        { inst: 'brass', vol: 1, pan: 0.1, mml: `o4 v11 ${R(16)} | ${hits}` },
        { inst: 'drum', vol: 0.85, mml: `v12 [[${kick}]7 k16 r16 r16 k16 s16 r16 r16 k16 s16 s16 m16 m16 k16 k16 s16 s16]3` },
        { inst: 'drum', vol: 0.55, pan: 0.25, mml: `[v11 h16 v6 h16 v9 h16 v6 h16]96` },
      ],
    };
  }

  // =============================================================
  // neon — ネオン・ノクターン（シンセウェーブ）
  // =============================================================
  {
    const I = 'Am F C G',
      A = 'Am F C G Am F C G',
      B = 'F G Em Am F G E E';
    const all = [I, A, B, A].join(' ');
    const melA =
      'e4. d8 c8 < b8 > c8 e8 | f4. e8 c4 < a4 > | g4. f8 e8 d8 c8 e8 | d2 r4 < b8 > d8 |' +
      'e4. d8 c8 < b8 > c8 a8 | a4. g8 f4 e8 f8 | g4 e8 g8 > c4 < b8 a8 | b2. r4';
    const melB =
      '> c4. < a8 > c4 d4 < | b4. g8 b4 > d4 < | > e4. d8 < b4 g4 | a2 > c4 < b4 |' +
      'a4. f8 a4 > c4 < | > d4. c8 < b4 g4 | g+4. a8 b4 > d4 < | > e2 < g+4 b4';
    const beat = `c8 r8 s8 r8 k8 k8 s8 r8 [${ROCK}]6 k8 r8 s8 r8 s16 s16 m16 m16 k16 k16 s16 s16`;
    S.neon = {
      tempo: 100, vol: 1.0,
      ch: [
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o5 v12 ${R(4)} | ${melA} | ${melB} | ${melA}` },
        { inst: 'pad', vol: 1, pan: -0.2, mml: `o4 v9 ${each(all, padF)}` },
        { inst: 'arp', vol: 1, pan: 0.35, mml: `o4 v8 ${each(all, arpF)}` },
        { inst: 'bass', vol: 1, mml: `o2 v11 ${each(all, pumpF)}` },
        { inst: 'drum', vol: 0.9, mml: `v12 [k4 r4 k4 r4]3 k8 k8 s8 s8 [s16]8 | [${beat}]3` },
        { inst: 'drum', vol: 0.5, pan: -0.2, mml: `v10 ${R(4)} | [r8 h8 r8 h8 r8 h8 r8 h8]24` },
      ],
    };
  }

  // =============================================================
  // arena — CLAN BATTLE!!（パンクロック、ハイテンション）
  // =============================================================
  {
    const V = 'E B C#m A E B C#m A',
      C = 'A B E C#m A B E E',
      Br = 'C D E E';
    const verse =
      'b8 b8 g+8 b8 > e4 < b4 | a8 a8 f+8 a8 b4 f+4 | g+8 g+8 e8 g+8 > c+4 < b8 a8 | a4 g+8 f+8 e4 r4 |' +
      'b8 b8 g+8 b8 > e4 f+4 < | > d+4 c+8 < b8 f+4 b4 | > c+4 < b8 a8 g+4 e4 | f+4 e8 f+8 g+4 b4';
    const chorus =
      '> c+2 < b4 a4 | > d+2 c+4 < b4 | b4. g+8 b4 > e4 < | > e2 d+4 c+4 < |' +
      '> c+2 < b4 a4 | > d+2 e4 f+4 < | > g+2. e4 < | > e2 < r4 r8 b8';
    const bridge = '> c4. c8 c4 d4 | d4. d8 d4 e4 | e1^1 <';
    const gtrF = pc8F(true);
    const gIntro = `${pc('e', 1, 1)} | ${pc('e', 1, 1)} | ${pc('c', 2, 1)} ${pc('d', 2, 1)} | [${pc('e', 8, 1)}]8`;
    const punk = 'k8 s8 k8 s8 k8 s8 k8 s8';
    S.arena = {
      tempo: 180, vol: 0.95,
      ch: [
        { inst: 'gtrlead', vol: 1, pan: 0.1, mml: `o4 v13 ${R(4)} | ${verse} | ${chorus} | ${bridge} | ${chorus}` },
        { inst: 'gtr', vol: 1, pan: -0.25, mml: `o3 v10 ${gIntro} | ${each([V, C, Br, C].join(' '), gtrF)}` },
        { inst: 'bass', vol: 1, mml: `o2 v12 e1 | e1 | c2 d2 | [e8]8 | ${each([V, C, Br, C].join(' '), eightF)}` },
        {
          inst: 'drum', vol: 0.9,
          mml: `v12 c1 | c1 | c2 c2 | [s16]16 | [${punk}]7 ${FILL} | [${punk}]7 ${FILL} | k4 s4 k4 s4 | k4 s4 k4 s4 | [s8]8 | [s16]16 | [${punk}]7 ${FILL}`,
        },
        { inst: 'drum', vol: 0.55, pan: 0.2, mml: `v10 ${R(4)} | ${HATS8(8)} | ${HATS8(8)} | c1 | c1 | r1 | r1 | ${HATS8(8)}` },
      ],
    };
  }

  // =============================================================
  // battle — スパナ一本で（生身戦闘、疾走感）
  // =============================================================
  {
    const In = 'Dm Dm',
      A = 'Dm Bb C Dm Dm Bb C A',
      B = 'Gm A Bb C Gm A Bb A',
      C = 'Bb C Dm Dm Bb C A A';
    const main = [A, B, C].join(' ');
    const riff = 'd8 d8 > d8 < d8 c8 d8 f8 d8';
    const bassF = (c, h) => (c === 'Dm' && !h ? riff : pumpF(c, h));
    const melA =
      'd8 f8 a8 > d8 c8 < a8 f8 a8 | b-4. a8 g8 f8 d8 f8 | g4. f8 e8 c8 e8 g8 | a2 r8 a8 g8 a8 |' +
      'd8 f8 a8 > d8 f4 e8 d8 < | > d4. c8 < b-8 a8 g8 f8 | e8 g8 > c8 e8 g4 f8 e8 < | > c+2 < a4 e4';
    const melB =
      'g4. a8 b-4 > d4 < | > c+4. d8 e4 c+4 < | > d4. c8 < b-4 f4 | g4. a8 b-4 > c4 < |' +
      '> d2 < b-4 g4 | > e2 c+4 < a4 | > f4. e8 d4 < b-4 | a2 > c+4 e4 <';
    const melC = 'f2 b-2 | > c2 < g2 | a1 | f4 e4 d4 e4 | f2 b-2 | > c2 e2 < | > c+1 < | > e2 c+4 < a4';
    S.battle = {
      tempo: 160, vol: 0.95,
      ch: [
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o4 v12 ${R(2)} | ${melA} | ${melB} | ${melC}` },
        { inst: 'gtr', vol: 1, pan: -0.3, mml: `o3 v9 ${R(2)} | ${each(main, pc8F(false))}` },
        { inst: 'bass', vol: 1, mml: `o2 v12 ${each(In + ' ' + main, bassF)}` },
        { inst: 'strings', vol: 1, pan: 0.3, mml: `o4 v8 ${R(10)} | ${each(B + ' ' + C, padF)}` },
        { inst: 'drum', vol: 0.9, mml: `v12 [${ROCK}]2 | [[${ROCK}]7 ${FILL}]3` },
        { inst: 'drum', vol: 0.5, pan: 0.2, mml: `v10 [h8]16 | [${HATS8(8)}]3` },
      ],
    };
  }

  // =============================================================
  // mech — アームド・フレーム起動（熱いロック、アニメOP風）
  // =============================================================
  {
    const I = 'D C G A',
      V = 'Bm G D A Bm G A A',
      P = 'Em F#m G A',
      C = 'G A F#m Bm G A D D';
    const fanfare = 'a8 r8 a8 a8 > d4. e8 < | > e4. d8 c4 < g4 | b4. a8 b4 > d4 < | > c+2. e4 <';
    const verse =
      'f+8 f+8 f+8 e8 f+4 a4 | b4. a8 g4 d4 | a8 a8 a8 g8 f+4 d4 | e2. r4 |' +
      'f+8 f+8 f+8 e8 f+4 b4 | > d4. < b8 a4 g4 | a4. g8 f+4 e4 | e2 c+4 e4';
    const pre = 'g4 g4 a4 b4 | a4 a4 b4 > c+4 < | > d4 d4 e4 f+4 < | > e2 r8 c+8 d8 e8 <';
    const chorus =
      '> f+4. e8 d4 e4 < | > e4. d8 c+4 < a4 | > c+4 d4 e4 a4 < | > f+2. r4 < |' +
      '> g4. f+8 e4 d4 < | > e4. f+8 e4 c+4 < | > d2 f+4 a4 < | > a1 <';
    const gI = each(I, (c) => {
      const r = ROOT(c);
      return `${pc(r, '4.', 1)} ${pc(r, 8, 1)} ${pc(r, 2, 1)}`;
    });
    S.mech = {
      tempo: 150, vol: 0.95,
      ch: [
        { inst: 'gtrlead', vol: 1, pan: 0.1, mml: `o4 v13 ${R(4)} | ${verse} | ${pre} | ${chorus}` },
        { inst: 'brass', vol: 1, pan: -0.15, mml: `o4 v12 ${fanfare} | ${R(12)} | v9 ${each(C, padF)}` },
        { inst: 'gtr', vol: 1, pan: -0.35, mml: `o3 v9 ${gI} | ${each(V + ' ' + P, pc8F(false))} | ${each(C, pc8F(true))}` },
        { inst: 'bass', vol: 1, mml: `o2 v12 ${each(I, (c) => `${ROOT(c)}4. ${ROOT(c)}8 ${ROOT(c)}2`)} | ${each(V + ' ' + P, eightF)} | ${each(C, pumpF)}` },
        { inst: 'strings', vol: 1, pan: 0.35, mml: `o4 v8 ${each(I, padF)} | ${R(8)} | ${each(P + ' ' + C, padF)}` },
        {
          inst: 'drum', vol: 0.9,
          mml:
            `v12 c4. k8 s2 | k4. k8 s2 | k4. k8 s2 | ${FILL} | [${ROCK}]8 |` +
            ` [k8 k8 s8 k8 k8 k8 s8 k8]3 [s16]16 | c8 r8 s8 r8 k8 k8 s8 r8 [${ROCK}]6 ${FILL}`,
        },
        { inst: 'drum', vol: 0.5, pan: 0.2, mml: `v10 ${R(4)} | [h8]64 | [h8]32 | ${HATS8(8)}` },
      ],
    };
  }

  // =============================================================
  // boss — 白銀の脅威（ボス戦、緊迫）
  // =============================================================
  {
    const In = 'Cm Cm Cm Cm',
      A = 'Cm Cm Ab G Cm Cm Db G',
      B = 'Fm Gm Ab Bb Fm G Ab G',
      C = 'Cm Cm Cm G';
    const all = [In, A, B, C].join(' ');
    const melA = 'c2 d4 e-4 | g2. f8 e-8 | e-4. f8 e-4 c4 | d2 < b2 > | c2 d4 e-4 | g2 > c4 < b-4 | a-2 f4 d-4 | b2 > d4 < b4';
    const melB =
      '> c4. < a-8 > c4 f4 | d4. < b-8 > d4 g4 | e-4. c8 e-4 a-4 | f2. d4 |' +
      'a-4. g8 f4 c4 | b4. a-8 g4 d4 | c4. < b-8 a-4 > c4 | < b2 > d2 <';
    const brassF = (c) => {
      const X = `{${tri(c)}}`;
      return `${X}8 r8 r4 ${X}8 r8 ${X}8 r8`;
    };
    const dbl = 'k8 k8 s8 k8 r8 k8 s8 r8';
    S.boss = {
      tempo: 168, vol: 0.95,
      ch: [
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o4 v12 ${R(4)} | ${melA} | ${melB} | ${R(4)}` },
        { inst: 'bass', vol: 1, mml: `o2 v11 ${each(all, rumbleF)}` },
        { inst: 'brass', vol: 1, pan: -0.25, mml: `o4 v10 ${each(all, brassF)}` },
        { inst: 'strings', vol: 1, pan: 0.3, mml: `o4 v8 ${R(4)} | ${each(A + ' ' + B, padF)} | ${R(4)}` },
        {
          inst: 'drum', vol: 0.9,
          mml: `v12 [k16 k16 r8 s8 r8 k16 k16 r8 s8 r8]4 | [[${dbl}]7 ${FILL}]2 | [k8 r8 m8 r8 k8 m8 m8 r8]3 ${FILL}`,
        },
        { inst: 'drum', vol: 0.5, pan: 0.2, mml: `v10 [h8]32 | [${HATS8(8)}]2 | [h4]16` },
      ],
    };
  }

  // =============================================================
  // tension — 公安の影（低音、不穏）
  // =============================================================
  {
    const P = 'Dm Dm Eb/D Dm Bb A Dm Dm Gm Gm Eb Eb Bb A A A';
    S.tension = {
      tempo: 80, vol: 1.0,
      ch: [
        { inst: 'subbass', vol: 1, mml: `o2 v11 ${each(P, rootF)}` },
        { inst: 'pad', vol: 1, pan: -0.2, mml: `o4 v8 ${each(P, padF)}` },
        {
          inst: 'pluck', vol: 1, pan: 0.3,
          mml: `o4 v10 [d8 r8 a8 r8 g+8 r8 r4 | f8 r8 e8 r8 r2]4 | [g8 r8 > d8 < r8 c+8 r8 r4 | b-8 r8 a8 r8 r2]4`,
        },
        { inst: 'strings', vol: 1, pan: -0.3, mml: `o4 v10 ${R(8)} | b-2 a2 | g1 | g2 b-2 | > e-1 < | d2 f2 | e1 | c+1 | e1` },
        { inst: 'sqbass', vol: 0.7, pan: 0.15, mml: `o3 v7 [d8 r8 d8 d8 r8 d8 r8 d8]16` },
        { inst: 'drum', vol: 0.7, mml: `v10 [k8 k8 r8 r8 r8 r8 r8 r8]16` },
        { inst: 'drum', vol: 0.4, pan: 0.3, mml: `v7 [r8 h8 r8 h8 r8 h8 r8 b8]16` },
      ],
    };
  }

  // =============================================================
  // sad — 星の声（ピアノ、静か）
  // =============================================================
  {
    const A = 'Dm Bbmaj7 Gm7 A7 Dm F/C Bb A',
      B = 'Bb C Am Dm Gm C A A';
    const melA = 'a4. g8 f4 a4 | g4. f8 d2 | f4. e8 d4 < b-4 > | c+2. r4 | a4. g8 f4 a4 | > c2 < a4 f4 | g4. f8 d4 f4 | e2. r4';
    const melB = 'f4. g8 a4 b-4 | > c4. d8 e2 < | > c2 < a4 e4 | f2. r4 | b-4. a8 g4 d4 | e4. f8 g4 > c4 < | c+2 e2 | a1';
    S.sad = {
      tempo: 66, vol: 1.0,
      ch: [
        { inst: 'piano', vol: 1, pan: 0.1, mml: `o5 v12 ${melA} | ${melB}` },
        { inst: 'piano', vol: 0.8, pan: -0.15, mml: `o4 v8 ${each(A + ' ' + B, parpF)}` },
        { inst: 'strings', vol: 1, pan: 0.2, mml: `o4 v7 ${R(4)} | ${each('Dm F/C Bb A ' + B, padF)}` },
      ],
    };
  }

  // =============================================================
  // space — 無重力（アンビエント、ベル＋パッド）
  // =============================================================
  {
    const P = 'Dmaj7 E/D Bm7 Gmaj7 Dmaj7 E/D Gmaj7 A'; // 各2小節
    const bell =
      'f+4 a4 > c+2 < | r4 e4 a2 | g+4 b4 > e2 < | r4 d4 f+2 | f+4 a4 > d2 < | r4 c+4 f+2 | d4 f+4 b2 | r4 a4 f+2 |' +
      'a2 > c+2 | e1 < | b2 g+2 | e1 | f+2 d2 | < b1 > | e2 d2 | c+1';
    S.space = {
      tempo: 70, vol: 1.0,
      ch: [
        { inst: 'bell', vol: 1, pan: 0.25, mml: `o5 v10 ${bell}` },
        { inst: 'pad', vol: 1, pan: -0.15, mml: `o4 v10 ${each(P, pad2F)}` },
        { inst: 'subbass', vol: 0.9, mml: `o2 v10 ${each(P, root2F)}` },
        { inst: 'choir', vol: 1, pan: -0.3, mml: `o4 v9 ${R(8)} | f+1^1 | g+1^1 | b1 a1 | e1^1` },
      ],
    };
  }

  // =============================================================
  // final — 星の歌（最終決戦、壮大、コーラス）
  // =============================================================
  {
    const I = 'Em C D B',
      A = 'Em C G D Em C B7 B7',
      B = 'C D Bm Em C D B B',
      C = 'G D Em C G D C D';
    const all = [I, A, B, C].join(' ');
    const melA =
      'e4. f+8 g4 b4 | a4. g8 e2 | d4. e8 g4 b4 | a2. f+4 | e4. f+8 g4 b4 | > c4. < b8 a4 g4 | f+4. g8 a4 b4 | b2. r4';
    const melB =
      '> e4. d8 c4 < g4 > | f+4. e8 d4 < a4 > | d4. e8 f+4 b4 | g2 e2 |' +
      'e4. f+8 g4 > c4 < | > d4. c8 < b4 a4 | b4. a8 b4 > d+4 < | b1 <';
    const melC =
      '> d4. e8 d4 < b4 | > a4. g8 f+4 d4 | g4. a8 b4 > d4 < | > e2. < r4 |' +
      'd4. e8 g4 b4 | a4. b8 a4 f+4 | g4. f+8 e4 c4 | d2 f+4 a4 <';
    const strF = (c) => {
      const [, y, z] = T3(c);
      return `${z}2 ${y}2`;
    };
    const beat = `c8 r8 s8 r8 k8 k8 s8 r8 [${ROCK}]6 ${FILL}`;
    S.final = {
      tempo: 140, vol: 0.95,
      ch: [
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o4 v13 ${R(4)} | ${melA} | ${melB} | ${melC}` },
        { inst: 'choir', vol: 1, pan: -0.2, mml: `o4 v10 ${each(all, padF)}` },
        { inst: 'strings', vol: 1, pan: 0.3, mml: `o5 v8 ${each(all, strF)}` },
        { inst: 'pluck', vol: 0.8, pan: -0.35, mml: `o4 v8 ${each(all, alb16F)}` },
        { inst: 'bass', vol: 1, mml: `o2 v12 ${each(I, rootF)} | ${each([A, B, C].join(' '), pumpF)}` },
        { inst: 'drum', vol: 0.9, mml: `v12 [k8 r8 m8 m8 k8 r8 m8 r8]3 [s16]16 | [${beat}]3` },
        { inst: 'drum', vol: 0.5, pan: 0.2, mml: `v10 ${R(4)} | [${HATS8(8)}]3` },
      ],
    };
  }

  // =============================================================
  // ending — ほんとうの空（感動的バラード → 高揚、D→E転調）
  // =============================================================
  {
    const EA = 'D A/C# Bm F#m/A G D/F# Em A',
      EB = 'G A F#m Bm G A Bm B7',
      EC = 'E B/D# C#m G#m/B A E/G# F#m B',
      ED = 'A B G#m C#m A B E A7';
    const all = [EA, EB, EC, ED].join(' ');
    const melA = 'f+2 e4 d4 | e2 c+4 < a4 > | d2 f+4 b4 | a2 f+4 e4 | d4. e8 f+4 g4 | a2 f+4 d4 | g4. f+8 e4 d4 | e2. r4';
    const melB = 'd4 g4 b4 > d4 < | > c+4. < b8 a2 | a4. f+8 e4 c+4 | d4 f+4 b2 | b4. a8 g4 b4 | a4. g8 f+4 e4 | f+2 d4 f+4 | d+2 f+2';
    const melC = 'g+2 f+4 e4 | f+2 d+4 < b4 > | e2 g+4 > c+4 < | b2 g+4 f+4 | e4. f+8 g+4 a4 | b2 g+4 e4 | a4 > c+4 < b4 a4 | f+2. r4';
    const melD =
      'e4 a4 > c+4 < b4 | b4. a8 g+4 f+4 | g+4. a8 b4 > d+4 < | > e2 c+2 < |' +
      '> c+4. < b8 a4 > c+4 < | b4. a8 b4 > c+4 < | > e1 < | e1';
    const up = `c8 h8 s8 h8 k8 k8 s8 h8 [k8 h8 s8 h8 k8 k8 s8 h8]6 ${FILL}`;
    S.ending = {
      tempo: 84, vol: 1.0,
      ch: [
        { inst: 'flute', vol: 1, pan: 0.15, mml: `o5 v12 ${melA} | ${melB} | ${R(16)}` },
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o5 v12 ${R(16)} | ${melC} | ${melD}` },
        { inst: 'piano', vol: 1, pan: -0.2, mml: `o4 v8 ${each(all, parpF)}` },
        { inst: 'strings', vol: 1, pan: 0.3, mml: `o4 v7 ${R(4)} | ${each('G D/F# Em A ' + EB + ' ' + EC + ' ' + ED, padF)}` },
        {
          inst: 'bass', vol: 0.9,
          mml: `o2 v10 ${each(EA + ' ' + EB, halfRootF)} | ${each(EC + ' ' + ED, (c) => `${ROOT(c)}4. ${ROOT(c)}8 ${ROOT(c)}4 ${ROOT(c)}4`)}`,
        },
        {
          inst: 'drum', vol: 0.75,
          mml: `v10 ${R(8)} | [k8 b8 b8 b8 x8 b8 b8 b8]7 ${FILL2} | v12 [${up}]2`,
        },
      ],
    };
  }

  // =============================================================
  // radio — レディオ・スターダスト（幕間ジングル、8小節ループ）
  // =============================================================
  {
    const P = 'F Dm7 Gm7 C7 F Dm7 Gm7-C7 F';
    const V = { F: 'e g a > c', Dm7: 'c e f a', Gm7: 'f a b- > d', C7: 'e g b- > d' };
    const epF = (c, h) => (h ? `{${V[c]}}4. {${V[c]}}8` : `{${V[c]}}4. {${V[c]}}8 r8 {${V[c]}}4.`);
    const mel =
      'c8 f8 a8 > c8 < a4 r8 f8 | g8 a8 g8 f8 d4 r4 | b-8 a8 g8 f8 g4 > d4 < | c2 r4 e8 g8 |' +
      'c8 f8 a8 > c8 < a4 r8 f8 | > d4 c8 < a8 f4 d4 | g4 b-4 a4 g4 | f2 r2';
    S.radio = {
      tempo: 120, vol: 1.0,
      ch: [
        { inst: 'sq25', vol: 1, pan: 0.15, mml: `o5 v10 ${mel}` },
        { inst: 'bell', vol: 0.8, pan: -0.25, mml: `o5 v8 ${mel}` },
        { inst: 'ep', vol: 1, pan: -0.1, mml: `o4 v9 ${each(P, epF)}` },
        { inst: 'slap', vol: 1, mml: `o2 v11 ${each(P, slapF)}` },
        { inst: 'drum', vol: 0.75, mml: `v11 [k16 r16 h16 r16 x16 r16 h16 h16 k16 r16 h16 r16 x16 r16 h16 b16]8` },
      ],
    };
  }

  // =============================================================
  // victory — 勝利ファンファーレ（4小節・ループなし）
  // =============================================================
  S.victory = {
    tempo: 140, vol: 1.0, loop: false,
    ch: [
      { inst: 'lead', vol: 1, pan: 0.1, mml: `o5 v13 e8 e8 e8 g4. e8 g8 | a4 f8 a8 b4 g8 b8 | > c2. < g4 | > c2. < r4` },
      { inst: 'brass', vol: 1, pan: -0.2, mml: `o4 v11 {c e g}4. {c e g}8 {c e g}2 | {c f a}2 {d g b}2 | {e g > c}2. {d g b}4 | {e g > c}2. r4` },
      { inst: 'arp', vol: 1, pan: 0.3, mml: `o5 v8 l16 [c e g > c <]4 | [c f a > c <]2 [d g b > d <]2 | [e g > c e <]3 d g b > d < | [e g > c e <]2 r2` },
      { inst: 'bass', vol: 1, mml: `o3 v11 c4. c8 c2 | f2 g2 | c2. g4 | c2. r4` },
      { inst: 'drum', vol: 0.9, mml: `v12 c4 k8 k8 s4 k4 | ${FILL} | c4. k8 s4 k4 | c2. r4` },
    ],
  };

  // =============================================================
  // gameover — ゲームオーバー（4小節・ループなし）
  // =============================================================
  S.gameover = {
    tempo: 70, vol: 1.0, loop: false,
    ch: [
      { inst: 'piano', vol: 1, pan: 0.1, mml: `o5 v12 e4. d8 c4 < a4 | > c4. < b8 a4 f4 | f4 d4 e2 | a1` },
      { inst: 'strings', vol: 1, pan: -0.2, mml: `o4 v8 {c e a}1 | {c f a}1 | {d f a}2 {e g+ b}2 | {c e a}1` },
      { inst: 'tri', vol: 1, mml: `o3 v10 a1 | f1 | d2 e2 | a1` },
    ],
  };

  // =============================================================
  // shop — ショップ（軽いボサノバ／ラウンジ）
  // =============================================================
  {
    const A = 'Cmaj7 Am7 Dm7 G7 Em7 A7 Dm7 G7',
      B = 'Fmaj7 Fm7 Em7 A7 Dm7 G7 Cmaj7 G7';
    const V = {
      Cmaj7: 'e g b > d', Am7: 'c e g b', Dm7: 'c e f a', G7: 'f a b > e',
      Em7: 'd f+ g b', A7: 'c+ e g b', Fmaj7: 'e g a > c', Fm7: 'e- g a- > c',
    };
    const compF = (c) => {
      const X = `{${V[c]}}`;
      return `${X}4 r8 ${X}8 r8 ${X}8 ${X}4`;
    };
    const bossaF = (c) => {
      const r = ROOT(c);
      return `${r}4. ${fifth(r, 8)} ${fifth(r, '4.')} ${r}8`;
    };
    const melA = 'e4. d8 e4 g4 | g4. e8 c2 | f4. e8 f4 a4 | g2. r4 | b4. a8 g4 e4 | a4. g8 e4 c+4 | d4. e8 f4 a4 | g2 f4 d4';
    const melB = 'a4. g8 a4 > c4 < | a-4. g8 f4 e-4 | g4. f+8 e4 d4 | c+2. r4 | d4 f4 a4 > c4 < | b4. a8 g4 f4 | e2. r4 | r2 d4 f4';
    S.shop = {
      tempo: 120, vol: 1.0,
      ch: [
        { inst: 'flute', vol: 1, pan: 0.2, mml: `o5 v11 ${melA} | ${melB}` },
        { inst: 'ep', vol: 1, pan: -0.25, mml: `o4 v9 ${each(A + ' ' + B, compF)}` },
        { inst: 'bass', vol: 0.9, mml: `o2 v10 ${each(A + ' ' + B, bossaF)}` },
        { inst: 'drum', vol: 0.6, mml: `v9 [k8 r8 r8 k8 k8 r8 r8 k8]16` },
        { inst: 'drum', vol: 0.5, pan: 0.25, mml: `v9 [x8 b8 b8 x8 b8 b8 x8 b8 b8 b8 x8 b8 b8 x8 b8 b8]8` },
      ],
    };
  }

  // =============================================================
  // dungeon — メンテナンス・トンネル（神秘的、インダストリアル）
  // =============================================================
  {
    const A = 'Em Em F Em Em Em F F',
      B = 'Am C F B Am C F F';
    const all = A + ' ' + B;
    const plF = (c) => {
      const [x, y, z] = T3(c);
      return `${x}16 r16 ${z}16 r16 ${y}16 r16 > ${x}16 r16 < ${z}16 r16 ${y}16 r16 ${x}16 r16 r8`;
    };
    const melA = 'b2. r4 | r4 g4 a4 b4 | > c2. < b8 a8 | b1 | e4 r8 g8 f+4 e4 | b4 r8 a8 g4 f+4 | f2 a2 | > c2 < b2';
    const melB = 'a2 > c2 < | g2 e2 | f2 a2 | f+2 d+2 | e4 a4 > c4 e4 < | > d2 c4 < b4 | a1 | > c2 < b2';
    S.dungeon = {
      tempo: 96, vol: 1.0,
      ch: [
        { inst: 'bell', vol: 1, pan: 0.2, mml: `o5 v10 ${melA} | ${melB}` },
        { inst: 'pluck', vol: 1, pan: -0.3, mml: `o4 v8 ${each(all, plF)}` },
        { inst: 'pad', vol: 1, mml: `o3 v9 ${each(all, padF)}` },
        { inst: 'sqbass', vol: 1, mml: `o2 v9 ${each(all, (c) => `[${ROOT(c)}16 r16 ${ROOT(c)}16 ${ROOT(c)}16]4`)}` },
        { inst: 'drum', vol: 0.8, mml: `v11 [k16 r16 r16 r16 x16 r16 r16 k16 r16 r16 k16 r16 x16 r16 b16 b16]16` },
        { inst: 'drum', vol: 0.4, pan: 0.3, mml: `v7 [h16 r16 b16 h16]64` },
      ],
    };
  }

  // =============================================================
  // festival — 文化祭（にぎやか、ハッピー）
  // =============================================================
  {
    const A = 'D D G A D Bm G-A D',
      B = 'G A F#m Bm G A D D';
    const all = [A, B, A].join(' ');
    const a7 =
      'a8 a8 b8 a8 f+4 e8 d8 | e8 f+8 a8 b8 a4 r4 | b8 b8 > d8 < b8 a4 f+8 e8 | e4. f+8 e4 r4 |' +
      'a8 a8 b8 a8 f+4 e8 d8 | f+8 a8 b8 > d8 e4 d4 < | b4 a4 e4 f+4';
    const melB =
      'b4. a8 b4 > d4 < | > e4. d8 c+4 < a4 | f+4. e8 f+4 a4 | b2 a4 f+4 |' +
      'g4. a8 b4 > d4 < | > e4 d4 c+4 < a4 | > d2 < a4 f+4 | d4 f+4 a4 r4';
    S.festival = {
      tempo: 140, vol: 1.0,
      ch: [
        { inst: 'flute', vol: 1, pan: 0.15, mml: `o5 v12 ${a7} | d2. r4 | ${melB} | ${a7} | d2 a8 b8 > d8 e8 <` },
        { inst: 'piano', vol: 1, pan: -0.25, mml: `o4 v8 ${each(all, offF)}` },
        { inst: 'bass', vol: 1, mml: `o2 v11 ${each(all, pumpF)}` },
        { inst: 'drum', vol: 0.85, mml: `v11 [[k8 m8 x8 m8 k8 k8 x8 m8]7 ${FILL}]3` },
        { inst: 'drum', vol: 0.45, pan: 0.25, mml: `v9 [h16 r16 b16 r16]96` },
      ],
    };
  }

  // =============================================================
  // mirage — ミラージュ（黒い仮面のライバル、短調、疾走）
  // =============================================================
  {
    const I = 'Gm Gm Gm Gm',
      A = 'Gm Eb Cm D Gm Eb Ab D',
      B = 'Eb F Gm Gm Eb F D D',
      C = 'Gm F Eb D';
    const all = [I, A, B, C].join(' ');
    const melA = 'd4 g4 b-4. a8 | g2 f4 e-4 | e-4 g4 > c4. < b-8 | a2 f+2 | d4 g4 b-4. > c8 < | > d4. c8 < b-4 g4 | a-4. g8 f4 e-4 | d2 f+4 a4';
    const melB =
      '> g2 f4 e-4 < | > f4. e-8 d4 c4 < | > d2. < b-4 | > d4 e-4 f4 g4 < |' +
      '> b-2 g4 e-4 < | > a2 f4 c4 < | > f+2 a4 f+4 < | > d1 <';
    const gal = 'k8 k16 k16 s8 k8 k8 k16 k16 s8 r8';
    S.mirage = {
      tempo: 152, vol: 0.95,
      ch: [
        { inst: 'gtrlead', vol: 1, pan: 0.1, mml: `o4 v13 ${R(4)} | ${melA} | ${melB} | b-1 | a1 | g1 | f+1` },
        { inst: 'bass', vol: 1, mml: `o2 v12 ${each(all, gallopF)}` },
        { inst: 'gtr', vol: 1, pan: -0.3, mml: `o3 v9 ${R(4)} | ${each([A, B, C].join(' '), pc8F(false))}` },
        { inst: 'choir', vol: 1, pan: 0.3, mml: `o4 v8 ${each(all, padF)}` },
        { inst: 'drum', vol: 0.9, mml: `v12 [${gal}]4 | [[${gal}]7 ${FILL}]2 | [${ROCK}]3 [s16]16` },
        { inst: 'drum', vol: 0.5, pan: 0.2, mml: `v10 [h8]32 | [${HATS8(8)}]2 | [c2 h4 h4]3 c1` },
      ],
    };
  }

  // =============================================================
  // chase — 逃走（速い、緊迫）
  // =============================================================
  {
    const I = 'Am Am F E',
      A = 'Am Am F E Am Am Bb E',
      B = 'Dm E Am F Dm E E E';
    const all = [I, A, B].join(' ');
    const run1 = 'a8 > c8 < b8 a8 e8 a8 > c8 e8 < | > d8 c8 < b8 a8 g+8 a8 b8 > c8 <';
    const melA =
      `${run1} | a8 f8 c8 f8 a8 > c8 < a8 f8 | g+8 e8 < b8 > e8 g+8 b8 g+8 e8 |` +
      ` ${run1} | b-8 f8 d8 f8 b-8 > d8 < b-8 f8 | g+4 b4 > e4 < g+4`;
    const melB =
      '> d4. c8 < a4 f4 | g+4. a8 b4 g+4 | > c4. < b8 a4 e4 | f4. e8 f4 a4 |' +
      '> d4. e8 f4 d4 < | > e2 < b4 g+4 | > e4 f4 e4 d4 < | > e8 r8 e8 r8 e8 e8 e8 e8 <';
    const stabF = (c) => `{${tri(c)}}4 r4 r4 r8 {${tri(c)}}8`;
    const drv = 'k16 r16 k16 r16 s16 r16 k16 r16 k16 r16 k16 r16 s16 r16 k16 k16';
    S.chase = {
      tempo: 172, vol: 0.95,
      ch: [
        { inst: 'lead', vol: 1, pan: 0.1, mml: `o4 v12 ${R(4)} | ${melA} | ${melB}` },
        { inst: 'arp', vol: 1, pan: -0.3, mml: `o4 v7 ${each(all, arpF)}` },
        { inst: 'bass', vol: 1, mml: `o2 v12 ${each(all, eightF)}` },
        { inst: 'brass', vol: 1, pan: 0.3, mml: `o4 v9 ${each(all, stabF)}` },
        { inst: 'drum', vol: 0.9, mml: `v12 [${drv}]3 [s16]16 | [[${drv}]7 ${FILL}]2` },
        { inst: 'drum', vol: 0.5, pan: 0.2, mml: `[v10 h16 v6 h16 v8 h16 v6 h16]80` },
      ],
    };
  }
})();
