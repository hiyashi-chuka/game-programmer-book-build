// =============================================================
//  playtest.js — ヘッドレスブラウザでゲームを動かして確認する開発用ツール
//  使い方:
//   node tools/playtest.js "<クエリ>" out.png '[アクション...]'
//   クエリ例: "chapter=1"  /  "map=minato&x=10&y=12&ch=2"
//   アクション: {"k":"z"} キー押下, {"k":"ArrowUp","ms":500} 長押し,
//               {"w":500} 待機(ms), {"js":"G.state.flags"} 評価して表示, {"shot":"a.png"} 撮影,
//               {"until":"!G.ev.running","max":20000} 条件待ち, {"adv":30} 会話送り(Zを30回)
//  追加のスクリプト: --extra=path.js（content 以外のテスト用マップなど）
//  コンソールエラー・ページエラーを全部出力する。
// =============================================================
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
(async () => {
  const q = process.argv[2] || '';
  const out = process.argv[3] || 'shot.png';
  const acts = JSON.parse(process.argv[4] || '[]');
  const root = path.resolve(__dirname, '..');
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  let errors = 0;
  p.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && !/willReadFrequently/.test(m.text()))) { errors++; console.log('[' + m.type() + ']', m.text().slice(0, 400)); } });
  p.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await p.goto('file://' + root + '/index.html?' + q);
  await p.waitForTimeout(1200);
  for (const a of acts) {
    if (a.k) { await p.keyboard.down(a.k); await p.waitForTimeout(a.ms || 70); await p.keyboard.up(a.k); await p.waitForTimeout(a.gap || 60); }
    if (a.w) await p.waitForTimeout(a.w);
    if (a.adv) for (let i = 0; i < a.adv; i++) { await p.keyboard.down('z'); await p.waitForTimeout(40); await p.keyboard.up('z'); await p.waitForTimeout(a.gap || 120); }
    if (a.until) { const t0 = Date.now(); while (Date.now() - t0 < (a.max || 15000)) { if (await p.evaluate(a.until)) break; const busy = await p.evaluate('G.ev.running > 0 || G.ui.blocking()'); if (!busy) { await p.waitForTimeout(150); continue; } await p.keyboard.down('z'); await p.waitForTimeout(40); await p.keyboard.up('z'); await p.waitForTimeout(150); } }
    if (a.js) console.log('js>', JSON.stringify(await p.evaluate(a.js)).slice(0, 2000));
    if (a.shot) await p.screenshot({ path: a.shot });
  }
  await p.screenshot({ path: out });
  console.log('errors:', errors);
  await b.close();
})();
