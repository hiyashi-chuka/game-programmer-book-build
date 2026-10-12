// =============================================================
//  maps/c3.js — 第3章「ネオン・アリーナ」専用マップ
//   c3_sim : ゲーセン〈ギャラクシー〉のAFシミュレーター内（仮想空間・機体戦専用）
// =============================================================
(function () {
  const W2 = G.W2;
  const r = G.rect,
    px = G.px;

  // ---------- 仮想アリーナ（30×20） ----------
  //  床 m：x=1..28, y=2..18。プレイヤー開始 (14,16)、敵は y=4..7
  const S = W2.grid(30, 20, '#');
  S.fill(1, 2, 28, 17, 'm');
  // 障害物（データブロック）
  [[7, 9], [8, 9], [21, 9], [22, 9], [14, 6], [15, 6]].forEach(([x, y]) => S.set(x, y, '#'));

  G.defMap('c3_sim', {
    name: 'AFシミュレーター',
    area: 'VIRTUAL JUNK DUEL ver.7.2',
    bgm: 'mech',
    light: '#8a9ae0',
    lightAlpha: 1,
    ambient: 'neon',
    floor: 'm',
    noParty: true,
    bg: '#05030f',
    pal: { metal: '#141a3a', block: '#0a0820' },
    rows: S.rows(),
    lights: [
      { x: 14, y: 10, r: 120, col: '#4ef0ff', a: 0.35 },
      { x: 4, y: 4, r: 40, col: '#ff5fa2', a: 0.5, flicker: true },
      { x: 25, y: 4, r: 40, col: '#ff5fa2', a: 0.5, flicker: true },
      { x: 4, y: 16, r: 40, col: '#4ef0ff', a: 0.5 },
      { x: 25, y: 16, r: 40, col: '#4ef0ff', a: 0.5 },
    ],
    decorate(c, m) {
      // ワイヤーフレームの格子
      for (let y = 2; y <= 18; y++)
        for (let x = 1; x <= 28; x++) {
          if (m.cell(x, y) !== 'm') continue;
          const X = x * 16,
            Y = y * 16;
          r(c, X, Y, 16, 1, 'rgba(78,240,255,0.35)');
          r(c, X, Y, 1, 16, 'rgba(78,240,255,0.35)');
          if ((x + y) % 7 === 0) r(c, X + 6, Y + 6, 4, 4, 'rgba(255,95,162,0.35)');
        }
      // 外周のネオンライン
      r(c, 16, 2 * 16 - 2, 28 * 16, 2, '#ff5fa2');
      r(c, 16, 19 * 16, 28 * 16, 2, '#4ef0ff');
      r(c, 14, 2 * 16, 2, 17 * 16, '#7a5ae0');
      r(c, 29 * 16, 2 * 16, 2, 17 * 16, '#7a5ae0');
      // データブロックの光るふち
      for (let y = 0; y < m.h; y++)
        for (let x = 0; x < m.w; x++) {
          if (m.cell(x, y) !== '#' || x === 0 || y < 2 || x === 29 || y === 19) continue;
          r(c, x * 16, y * 16, 16, 16, '#1a1440');
          r(c, x * 16 + 1, y * 16 + 1, 14, 1, '#4ef0ff');
          r(c, x * 16 + 1, y * 16 + 14, 14, 1, '#ff5fa2');
        }
      G.pixText(c, 'SIMULATION MODE', 15 * 16 - G.pixTextW('SIMULATION MODE') / 2, 1 * 16 + 4, '#4ef0ff');
      // スタート位置
      r(c, 14 * 16 - 4, 16 * 16 + 14, 24, 2, '#4ef0ff');
    },
  });
})();
