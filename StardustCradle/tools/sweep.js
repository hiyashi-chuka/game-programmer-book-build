// =============================================================
//  sweep.js — 全章×全マップ×全NPCに話しかけて、スクリプトエラーを探すQAツール
//  会話・選択肢・戦闘・ミニゲーム等は自動で即時に進める（選択肢は opt 番号）
//  使い方: node tools/sweep.js [章の範囲 例 0-10] [選択肢番号 既定0]
// =============================================================
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
(async () => {
  const [a, b] = (process.argv[2] || '0-10').split('-').map(Number);
  const pick = +(process.argv[3] || 0);
  const root = path.resolve(__dirname, '..');
  const br = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await br.newPage({ viewport: { width: 480, height: 270 } });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + root + '/index.html?map=tome_room&x=5&y=6&enter=0');
  await p.waitForTimeout(1500);
  const result = await p.evaluate(async ({ a, b, pick }) => {
    const UI = G.ui, E = G.ev, F = G.field;
    // 自動進行のパッチ
    let sc = 0;
    UI.say = async (w, t, o) => {
      if (++sc % 50 === 0) await new Promise((r) => setTimeout(r, 0));
      return o && o.keep ? { kept: true } : undefined;
    };
    UI.pop = () => {};
    let cc = 0;
    const tick = () => new Promise((r) => setTimeout(r, 0));
    UI.choice = async (opts) => {
      await tick();
      return (pick + cc++) % opts.length; // 同じ質問が繰り返されても抜けられるよう順に変える
    };
    UI.notice = async () => {};
    UI.shop = async () => {};
    UI.upgrade = async () => {};
    UI.timing = async (o) => (o && o.rounds) || 3;
    UI.chapterCard = async () => {};
    UI.gameOver = async () => 'title';
    UI.slotSelect = (m, cb) => ({ update() { cb(); }, drawHi() {} });
    G.waitFrames = async () => {};
    G.waitPress = async () => {};
    E.wait = async () => {};
    E.fadeOut = async () => {};
    E.fadeIn = async () => {};
    E.camera = async () => {};
    E.cameraReset = async () => {};
    E.cg = async (id) => { F.cg = { id, t: 0 }; };
    E.cgCaption = async () => {};
    E.ending = async () => {};
    E.move = async (id, steps) => {};
    E.moveTo = async () => {};
    E.shake = () => {};
    F.battleStart = async () => true;
    E.battle = async () => true;
    E.startChapter = async () => {};
    G.tasks.until = async () => {};
    const report = { talks: 0, maps: 0, errors: [] };
    const orig = console.error;
    for (let ch = a; ch <= b; ch++) {
      for (const id of Object.keys(G.MAPS)) {
        G.state = G.newState();
        G.STORY.debugSetup(Math.min(ch, 9));
        G.state.chapter = ch;
        try {
          F.load(id, 5, 5, 'down', { silent: true, keepBgm: true });
        } catch (e) { report.errors.push(`ch${ch} load ${id}: ${e.message}`); continue; }
        report.maps++;
        const npcs = F.ents.filter((e) => e instanceof G.NPC && e.talk);
        for (const n of npcs) {
          const snap = JSON.stringify(G.state);
          cc = 0;
          try {
            if (F.map.id !== id) F.load(id, 5, 5, 'down', { silent: true, keepBgm: true });
            await Promise.race([n.talk(n), new Promise((r) => setTimeout(r, 1500))]);
            report.talks++;
          } catch (e) { report.errors.push(`ch${ch} ${id} npc ${n.id}: ${e.message} ${(e.stack || '').split('\n')[1] || ''}`); }
          G.state = JSON.parse(snap);
        }
        // マップ入場フック・踏むイベント
        for (const h of F.map.enterHooks.concat(F.map.events.map((e) => e.run))) {
          const snap = JSON.stringify(G.state);
          try {
            if (F.map.id !== id) F.load(id, 5, 5, 'down', { silent: true, keepBgm: true });
            await Promise.race([h(), new Promise((r) => setTimeout(r, 1500))]);
          } catch (e) { report.errors.push(`ch${ch} ${id} hook: ${e.message} ${(e.stack || '').split('\n')[1] || ''}`); }
          G.state = JSON.parse(snap);
        }
        // 調べるポイント
        for (const ck of F.map.checks) {
          if (!ck.run) continue;
          if (ck.show && !ck.show()) continue;
          const snap = JSON.stringify(G.state);
          try {
            if (F.map.id !== id) F.load(id, 5, 5, 'down', { silent: true, keepBgm: true });
            await Promise.race([ck.run(), new Promise((r) => setTimeout(r, 1500))]);
          } catch (e) { report.errors.push(`ch${ch} ${id} check ${ck.x},${ck.y}: ${e.message}`); }
          G.state = JSON.parse(snap);
        }
      }
    }
    return report;
  }, { a, b, pick });
  console.log(JSON.stringify({ maps: result.maps, talks: result.talks }, null, 0));
  const all = result.errors.concat(errs.filter((e) => !/willReadFrequently/.test(e)));
  const uniq = [...new Set(all)];
  uniq.slice(0, 80).forEach((e) => console.log('ERR', e));
  console.log('unique errors:', uniq.length);
  await br.close();
})();
