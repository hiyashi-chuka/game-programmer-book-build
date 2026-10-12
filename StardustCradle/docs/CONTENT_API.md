# 星屑のクレイドル — コンテンツ制作ガイド（マップ／ストーリー API）

ゲーム本体は `index.html` + `js/` の素のJavaScript（ビルド不要、クラシック `<script>`）。
コンテンツ（マップ・イベント）はすべて **`js/maps/*.js`** と **`js/story/*.js`** に書き、`index.html` の `<!--CONTENT-->` の位置に `<script>` を追加して読み込む。

- 内部解像度 480×270、1タイル 16px。画面には約 30×17 タイルが映る。
- 座標はすべて **タイル座標**（x=列, y=行, 左上が0,0）。
- 世界観・人物・ストーリーは `docs/DESIGN.md` が正。
- 動作確認：`node tools/playtest.js "chapter=1" out.png '[{"adv":40}]'`（後述）。

---

## 1. マップ定義 `G.defMap(id, def)`

```js
G.defMap('minato', {
  name: 'ミナト区',            // 入った時に表示されるマップ名
  bgm: 'town',                // BGM ID（関数も可: () => E.flag('x') ? 'tension' : 'town'）
  outdoor: true,              // true なら G.state.time（morning/day/evening/night）で明るさが変わる
  time: 'night',              // 時間帯を固定したい場合（'day'|'evening'|'night'|'dark'|'alarm'|関数）
  light: '#c8c0e0',           // 屋内の環境光（乗算色）。暗い地下なら '#3a3458' など。lightAlpha も可
  ambient: 'petals',          // 環境パーティクル: petals(桜) leaves dust neon sparks echo snow
  pal: { grass:'#6cb85a', wall:'#e8dcc8', wallTop:'#3a3048', wood:'#c08a58', ... }, // タイル色の上書き
  floor: '=',                 // 小物文字の下に敷く既定の床
  bg: '#0a0818',              // マップ外の背景色
  mech: false,                // true: このマップでは機体で操作
  space: false,               // true: '*'（宇宙）タイルを歩行可能に
  noParty: false,             // true: 仲間の追従を非表示
  rows: [ "....", "....", ...],   // 地形（全行同じ長さ推奨。短い行は空白=void で埋まる）
  objects: [ ... ],           // 建物・小物（下記）
  npcs: [ ... ], events: [ ... ], checks: [ ... ], warps: [ ... ],
  enemies: [ ... ], items: [ ... ], lights: [ ... ],
  onEnter: async () => { },   // マップに入るたびに実行（フラグで1回限りにすること）
});
```

### 1.1 地形タイル文字（`rows`）

| 文字 | タイル | 通行 | 備考 |
|---|---|---|---|
| `.` | 草 | ○ | 端に縁取り自動 |
| `,` | 花畑 | ○ | |
| `"` | 背の高い草 | ○ | |
| `:` | 土の道 | ○ | 草との境界をぼかす |
| `s` | 廃材の地面 | ○ | スクラップ・ベイ |
| `o` | 畑 | ○ | |
| `=` | 歩道（石畳） | ○ | 道路と接する側に縁石 |
| `-` | アスファルト | ○ | |
| `_` | 道路センターライン（横） | ○ | |
| `\|` | 道路センターライン（縦） | ○ | |
| `z` | 横断歩道 | ○ | 横に並べると縦縞 |
| `+` | レンガ広場 | ○ | |
| `c` | コンクリート | ○ | |
| `f` | 木の床 | ○ | 屋内 |
| `t` | 畳 | ○ | |
| `k` | 市松タイル | ○ | 店・ゲーセン |
| `l` | リノリウム | ○ | 学校の廊下・病院 |
| `p` | 浴室タイル | ○ | |
| `r` | 赤じゅうたん | ○ | 縁は金色 |
| `m` | 金属床 | ○ | |
| `g` | グレーチング | ○ | |
| `x` | 警戒色ストライプ | ○ | |
| `a` | アリーナ床 | ○ | |
| `n` | ネオン街の路面 | ○ | |
| `h` | 船体外板 | ○ | 宇宙港・コロニー外壁 |
| `*` | 宇宙（星空） | × | `space:true` のマップでは通行可 |
| `w` | 屋内の壁 | × | 下が壁でなければ「壁面」、壁なら「天面」で自動描画 |
| `W` | 屋外の大きな壁・擁壁 | × | 同上 |
| `#` | 黒いブロック | × | |
| ` `（空白） | 何もない | × | |
| `~` | 水（運河） | × | 岸が自動で描かれる・きらめく |
| `F` | 金網フェンス | × | 下の床は隣から推定 |
| `R` | 手すり | × | |
| `B` | レンガ塀 | × | |
| `H` | 生け垣 | × | |
| `O` | 宇宙が見える窓（壁） | × | |
| `K` | 黒板（壁） | × | |

**屋内マップのコツ**：外周を `w` で2段以上（上端は天面＋壁面の2行）にすると立体感が出る。
```
"wwwwwwwwww",
"wwwwwwwwww",   ← 2行目が「壁面」として描かれる（下が床なので）
"wffffffffw",
```

### 1.2 小物文字（`rows` に直接書ける）

| 文字 | 小物 | 文字 | 小物 |
|---|---|---|---|
| `T` | 木 | `Y` | 桜の木 |
| `A` | 紅葉の木 | `J` | 濃い緑の木 |
| `b` | 植え込み | `q` | 花の植え込み |
| `L` | 街灯（夜に光る） | `V` | 自販機（光る） |
| `D` | 学校の机 | `d` | 机（本あり） |
| `C` | 木箱 | `Q` | ドラム缶 |
| `P` | 鉢植え | `E` | 端末（光る） |
| `X` | サーバーラック | `U` | 丸椅子（通行可） |
| `j` | ゴミ箱 | `y` | 消火栓 |
| `G` | 積みタイヤ | `M` | ポスト |
| `Z` | **セーブ端末**（調べるとHP/EN全回復＋セーブ） | `I`/`i` | 培養カプセル（中身あり／空） |

小物の下の床は左/上/右/下の隣接タイルから自動推定（`floor` で既定値）。マップごとに `props: { 'S': ['bench', {}] }` で文字を追加・上書きできる。

### 1.3 オブジェクト `objects`

```js
{ p: 'bldg', x: 4, y: 2, w: 5, h: 5, style: 'shop', sign: 'RAMEN', signCol: '#c03030',
  awning: '#e04a4a', doorType: 'noren', door: 2, to: 'hoshikuzu', tx: 6, ty: 10, dir: 'up' },
{ p: 'tree', x: 10, y: 8, kind: 'sakura' },
{ p: 'bench', x: 3, y: 12, msg: '古いベンチ。「カナタ参上」と彫ってある。' },  // 調べると表示
{ p: 'terminal', x: 5, y: 3, talk: async () => { ... } },                // 調べると実行
```
共通キー：`p`(種類) `x` `y` `id` `msg`(調べた時の文) `talk`(調べた時の async 関数) `show`(表示条件の関数) `nosolid`(当たり判定なし)。それ以外のキーはその小物のオプション。
**看板の文字は英数字のみ**（3x5ドットフォント：A-Z 0-9 - . ! & ? : / + * ' #）。

#### 建物 `bldg`（足元 w×h タイル。下 wallH 行が正面の壁、上が屋根）
- `style`: `house` `shop` `apartment` `school` `factory` `neon` `tower` `garage`
- `roof`: `flat`（屋上設備つき）`tile`（瓦）`metal`（波板）、`roofCol` 色
- `wall` 壁色、`wallH` 壁の段数（既定 house/shop=2, apartment=3, school/tower=4）
- `door` 扉のx（建物内の列、既定は中央）。`door:-1` で扉なし
- `doorType`: `wood` `glass` `shutter` `noren`(のれん：`norenText`,`norenCol`) `neon`
- `sign` 看板文字, `signCol` 看板色, `signText` 文字色, `signScale` 2で大きく, `signX` 看板の列, `neon:true` 夜に光る
- `awning` ひさしの色（ストライプ）, `neonTube` 壁のネオン管色, `vending` 自販機を置く列, `antenna:true`, `heli:true`
- `to` `tx` `ty` `dir`：**扉に入るとワープ**（扉タイルが自動でワープになる）
- `seed`：窓のカーテン等のバリエーション

#### その他の小物（`p:` に指定）
| 種類 | 足元 | オプション |
|---|---|---|
| `tree` | 1×1 | `kind`: green sakura autumn dark neon |
| `bush` | 1×1 | `kind:'flower'` |
| `flowerbed` | w×1 | `w` |
| `lamp` | 1×1 | `col` |
| `vending` | 1×1 | `col` |
| `bench` | 2×1 | |
| `trash` `hydrant` `mailbox` `bicycle` | 1×1 | |
| `sign` | 1×1 | `text`, `col`, `neon` |
| `billboard` | w×1 | `w`, `text`, `col`（大型ホロ看板・光る） |
| `neonsign` | 1×1 | `text`(縦書き英字), `col` |
| `car` | 3×1 | `col` |
| `stall` | 3×1 | `text`, `col`（屋台・提灯が光る・湯気） |
| `fountain` | 3×2 | 水しぶき |
| `statue` | 2×1 | 慰霊碑（AF像） |
| `container` | 3×2 | `col`, `text`, `stack`(段数) |
| `scrap` | 2×2 | 廃材の山 |
| `crate` `barrel` `tires` | 1×1 | `col`, `hazard` |
| `pipe` | w×1 / 1×w | `w`, `vertical`, `col` |
| `tank` | 2×2 | `text`, `col` |
| `crane` | 3×1 | 大型クレーン（足元は真ん中1マスのみ） |
| `forklift` | 2×1 | |
| `terminal` | 1×1 | `col`（画面が光る） |
| `server` | 1×1 | |
| `capsule` | 1×1 | `empty` |
| `starseed` | 2×1 | 巨大結晶（強く光る） |
| `desk` | 1×1 | `book` |
| `table` | w×h | `w`,`h`,`col`,`items` |
| `counter` | w×1 | `w`,`col`,`top`,`items:false` |
| `stool` | 1×1 | 通行可 |
| `stove` | 2×1 | 厨房（寸胴・湯気・火の光） |
| `fridge` `plant` `arcade` | 1×1 | `arcade` は `col` |
| `shelf` | w×1 | `w`, `kind:'parts'` |
| `locker` | w×1 | `w` |
| `bed` | 1×2 | `col` |
| `tv` | 2×1 | |
| `bath` | 4×2 | 湯船（湯気） |
| `poster` | 壁に貼る | `col`（壁タイルに重ねる・判定なし） |
| `wallwindow` | w×1 | 壁に掛ける窓（コロニーの景色）`night` |
| `rug` | w×h | `col`（床に敷く） |
| `stairs` `hatch` | 1×1 | 床に描くだけ（判定なし）。`hatch` は `glow` |
| `save` | 1×1 | セーブ端末（`Z` 文字と同じ） |
| `partition` | w×1 | 衝立 |
| `hangar` | 3×1 | 機体の整備フレーム |
| `noren` | 1×1 | のれん単体 |

### 1.4 ワープ `warps`
```js
{ x: 0, y: 10, w: 1, h: 3, to: 'neon', tx: 38, ty: 11, dir: 'left' }
// cond: () => E.flag('gate_open'), blocked: async () => { await E.say(null,'鍵がかかっている。') }
```
- 指定範囲に足を踏み入れるとワープ。到着地点のタイルは**ワープ範囲の外**にすること（即座に戻されないように1マスずらす）。
- 画面端の出口は、端の列/行をワープにし、相手マップでは1マス内側に到着させる。
- 建物の扉は `bldg` の `to` を使えば自動でワープになる。屋内の出口は扉の位置（下端の壁の切れ目など）に `warps` を置く。

### 1.5 NPC `npcs`
```js
{ id: 'baker', char: 'tome', x: 5, y: 8, dir: 'down',
  move: 'still' | 'wander' | 'pace' | 'look', range: 2, speed: 0.6,
  show: () => G.state.chapter >= 2 && !E.flag('baker_gone'),
  mech: 'harukaze',          // 機体を置く場合（話しかけ可能な大きなNPCになる）
  ghost: true,               // 当たり判定なし
  talk: async (npc) => { await E.say('tome', 'いらっしゃい！'); } }
```
- `char` は `js/data/chars.js` の ID：**kanata ruu niko sig ponta yui vargas mimi kyosuke tome doc lily gil cube neji eisen mirage jin helmina kazami mother guard kid**。
- 名前付きの町の人を作る：`G.mob('c2_baker', 'パン屋のおじさん', 37, { old: false, girl: false })` → `char: 'c2_baker'`（ID は**ファイルごとに接頭辞**をつけて衝突を防ぐ）。第2引数が名前、第3引数のシードで見た目が決まる。opt: `girl` `old` `kid` `over:{top:'#..',outfit:'apron',...}` `voice`。
- 名前のない通行人は `G.mob` を使うかシードを変えて量産する。

### 1.6 イベント `events`（踏むと発動） / `checks`（Zで調べると発動）
```js
events: [ { x: 10, y: 4, w: 3, h: 1, once: 'ev_meet_ruu', cond: () => G.state.chapter === 0, run: async () => { ... } } ],
checks: [ { x: 3, y: 2, msg: '「本日休業」の札がかかっている。' },  // ← text でも可
          { x: 7, y: 2, run: async () => { ... }, show: () => true } ],
```

### 1.7 敵 `enemies` / アイテム `items`（`onPick: async()=>{}` で拾った時の処理） / 光源 `lights`
```js
enemies: [ { type: 'rat', x: 20, y: 8, lv: 2, id: 'boss1' /*id付きは一度倒すと復活しない*/, show: () => ... } ],
items:   [ { x: 3, y: 4, item: 'memory', n: 1, id: 'mem_minato_1' } ],   // 拾うまで残る（キラキラ）
lights:  [ { x: 5, y: 3, r: 40, col: '#ff5fa2', a: 0.8, flicker: true, night: false } ],
```

### 1.8 他ファイルからマップに追記 `G.addToMap(id, ext)`
**共有マップ（ミナト区・学校など）は、章のファイルから直接編集しない。** 代わりに：
```js
G.addToMap('minato', {
  npcs: [ { id: 'c4_guard1', char: 'guard', x: 20, y: 9, show: () => G.state.chapter === 4, talk: async () => {...} } ],
  events: [ ... ], checks: [ ... ], objects: [ ... ], enemies: [ ... ], items: [ ... ], warps: [ ... ],
  onEnter: async () => { if (G.state.chapter === 4 && !E.flag('c4_x')) { E.set('c4_x'); ... } },
});
```
`objects` も `show` 条件付きで追加できる（文化祭の飾りなど）。`onEnter` はマップ本体の onEnter の後に順番に実行される。

---

## 2. イベントスクリプト API（`E.xxx`、すべて async 関数内で `await` する）

### 会話
| 関数 | 説明 |
|---|---|
| `E.say(who, text, opt?)` | 会話。`who` = `'ruu'` / `'ruu:smile'`（表情）/ `null`（ナレーション）。長文は自動で改ページ。`opt.name` で表示名変更 |
| `E.talk([[who,text],[who,text],...])` | 連続会話 |
| `E.ask(who, text, ['はい','いいえ'], {cancel:1})` | 質問して選択肢の番号を返す |
| `E.choice([...])` | 選択肢だけ |
| `E.notice(text)` | 画面中央のお知らせ（Zで閉じる） |
| `E.toast(text, col?)` | 画面上部の小さな通知（待たない） |

**表情**: `normal` `smile` `grin` `angry` `sad` `surprise` `serious` `think` `shy` `cry`
会話文は日本語。1回の `say` は2〜3行（全角60〜90字）程度が読みやすい。キャラの口調を守ること（DESIGN.md 参照）。

### 演出
| 関数 | 説明 |
|---|---|
| `E.cut(true/false)` | カットシーン（上下に黒帯・敵停止・無敵）。イベント終了時に自動で解除 |
| `E.wait(frames)` | 待つ（60フレーム=1秒） |
| `E.fadeOut(n, col?)` / `E.fadeIn(n)` | フェード |
| `E.flash(n)` / `E.shake(power, frames?)` / `E.tint('rgba(255,0,0,0.2)' or null)` | 画面効果 |
| `E.emote(id, '!' / '?' / '♪' / '…' / '♥' / '💢' / '!?')` | 頭上にフキダシ |
| `E.camera(tx, ty)` / `E.cameraReset()` | カメラを移動／プレイヤーに戻す |
| `E.cg(id, caption?)` / `E.cgCaption(text)` / `E.cgOff()` | 一枚絵を表示（caption があるとZ待ち）。CG表示中も `E.say` 可能 |
| `E.chapter(n, title?, sub?)` | 章タイトル表示（`G.CHAPTERS[n]` を使用） |
| `E.radio(['セリフ', ['ruu','セリフ'], ...])` | DJリリィの海賊ラジオ幕間（ラジオCG＋専用BGM） |
| `E.time('morning'|'day'|'evening'|'night')` | 屋外の時間帯 |
| `E.bgm(id)` / `E.stopBgm()` / `E.se(id)` | 音 |

### 移動・キャラ操作（id: `'player'`, NPCの `id`, 仲間は `'f_ruu'` 等）
| 関数 | 説明 |
|---|---|
| `E.move(id, 'UUL2R', {speed, face, noWait})` | 相対移動（U/D/L/R＋回数） |
| `E.move(id, [[tx,ty],...])` | 絶対座標を順に |
| `E.moveTo(id, tx, ty, {yFirst})` | x→y の順に移動 |
| `E.face(id, 'left')` / `E.face(id, 'otherId')` | 向き |
| `E.teleport(id, tx, ty, dir)` | 瞬間移動 |
| `E.npc({id, char, x, y, dir, ...})` | NPCをその場に出す（そのマップ滞在中のみ） |
| `E.remove(id)` / `E.hide(id)` / `E.hide(id,false)` | 消す／隠す |
| `E.get(id)` / `E.pos(id)` | エンティティ／タイル座標 |
| `E.warp(map, tx, ty, dir, {noEnter, noFade})` | マップ移動（onEnter も実行） |
| `E.reload()` | 現マップを再読込（NPCの show 条件を反映） |
| `E.setTile(tx, ty, ch)` | 地形を書き換え（扉を開く等、セーブに残る） |
| `E.setChar('ruu')` | 操作キャラを変える（ルウ編など）。戻す時は `'kanata'` |
| `E.mech(true, 'harukaze')` / `E.mech(false)` | その場で機体に乗る／降りる |

### 進行・データ
| 関数 | 説明 |
|---|---|
| `E.flag(k)` / `E.set(k, v?)` / `E.unset(k)` / `E.inc(k)` / `E.val(k)` | フラグ |
| `E.give(item, n?, {quiet,wait})` / `E.take(item, n?)` / `E.has(item, n?)` | アイテム |
| `E.money(±n)` / `E.exp(n)` / `E.heal()` | お金・経験値・全回復 |
| `E.learn('spark'|'echo'|'overdrive')` | スキル習得 |
| `E.equip('weapon', 'stunrod')` | 装備変更 |
| `E.objective('スクラップ・ベイへ行く')` | 画面左上の目的表示 |
| `E.party(['ruu','niko'])` / `E.join('sig')` / `E.leave('niko')` | 仲間（後ろをついてくる。ruu/kyosuke/sig は戦闘で加勢） |
| `E.quest(id, 'active'|'done')` / `E.questState(id)` | サブクエスト（`G.QUESTS`） |
| `E.shop(['soda','melonpan'], '店名')` | ショップ画面 |
| `E.upgrade()` | 機体改造画面（ドク） |
| `E.savePoint()` | 全回復＋セーブ確認 |
| `E.startChapter(n)` | 次の章へ（`G.STORY.chapters[n]` を呼ぶ） |
| `E.ending()` | スタッフロール |
| `G.byCh({0:'…', 3:'…'})` | 現在の章で値を切り替え（町の人のセリフに便利） |

### 戦闘 `await E.battle(def)` → 勝てば `true`
```js
const won = await E.battle({
  map: 'arena', x: 15, y: 14, dir: 'up',   // 戦闘マップと開始位置（省略すると現在地）
  mech: true, mechId: 'harukaze',          // 機体戦か
  enemies: [ { type: 'guardner', x: 15, y: 5, lv: 2 }, { type: 'drone', x: 10, y: 6 } ],
  waves: [ [ ...1波目 ], [ ...2波目 ] ],     // enemies の代わりに（WAVE表示）
  allies: [ { mech: 'zephyr', x: 12, y: 14, dmg: 14, col: '#7dff9a' } ],   // 味方機体（無敵・自動攻撃）
  bgm: 'boss', title: 'ENGAGE!', sub: 'ガードナー部隊を撃退せよ',
  win: 'all' | 'boss',                     // boss: ボス（boss:true）を倒せば勝利
  timer: 60*60, timerWin: true,            // 制限時間（生き延びれば勝利）
  canLose: false,                          // true なら負けても false が返る（負けイベント用）
  party: false,                            // 生身戦で仲間を出さない
  onStart: async () => { await E.say('ruu','いくよ！'); },
  returnTo: ['scrapbay', 10, 8, 'down'],   // 終了後の移動先（省略で元の場所）
  quietWin: true,                          // 勝利バナーと勝利BGMを出さない（演出に繋げたい時）
});
```
- 負けるとゲームオーバー画面（リトライで戦闘をやり直し）。`canLose:true` の負け戦は「ストーリー上の敗北」に使う。
- 敵の個別指定：`{ type, x, y, lv, hp, exp, boss:true, name:'名前', ai, spdMul, color:{body:'#..',accent:'#..'} }`

#### 敵タイプ（`G.ENEMIES`）
生身：`rat`（スクラップラット）`drone`（警備ドローン・射撃）`bot`（暴走整備ボット）`turret`（固定砲台）`thug`（チンピラ）`punk`（ジャッカルズ下っ端）`guard`（公安隊員）`guard2`（公安特務）`echo`（エコー体・瞬間移動）
生身ボス：`kyosuke`（不良番長）`warden`（監視ロボ・突進/衝撃波/召喚）`eisen_f`（アイゼン少佐）
機体：`guardner` `guardner2`(指揮官・boss) `junker` `clanA` `clanB` `jackal`
機体ボス：`salamander`（ギル）`nocturne`（ミラージュ・瞬間移動/ホーミング/分身）`seraph`（ヘルミナ・最終ボス、ビット召喚/弾幕/回転レーザー、HP 3200）
`lv` で強さが上がる（+18%/Lv）。

#### 想定レベル
| 章 | カナタLv | 敵 lv | 機体 |
|---|---|---|---|
| 序章 | 1–2 | 1 | （なし） |
| 1 | 2–5 | 1–2 | ponkotsu |
| 2 | 5–8 | 2–3 | ponkotsu |
| 3 | 8–12 | 3–5 | ponkotsu → **harukaze**（`G.state.mech.id='harukaze'`） |
| 4 | 12–15 | 5–6 | harukaze |
| 5 | 15–19 | 6–8 | harukaze |
| 6 | 19–23 | 8–10 | harukaze |
| 7 | 23–27 | 10–12 | **harukaze2**（ハルカゼ改、`overdrive` 習得） |
| 8 | 27–32 | 12–15 | harukaze2 |

### 2.1 素材ID一覧
- **BGM**: title town home school scrap neon arena battle mech boss tension sad space final ending radio victory gameover shop dungeon festival mirage chase
- **効果音**: cursor ok cancel buzz swing hit hurt kill dash pickup coin door step mechstep beam shot saber boost explode bigexplode levelup heal alarm quake echo save lockon charge shield item get boot
- **CG**: colony colony_dusk colony_night colony_dark rooftop rooftop_night title space colony_out colony_out_dark neon arena zephyr starseed memory dawn radio black white
- **アイテム**: 消費 soda melonpan onigiri ramen energy repair repair2 candy ／素材 scrap chip memory ／武器 wrench pipe stunrod plasmabat echoblade ／装飾 charm sneakers headset badge pendant ／大事なもの parts_list gyro idcard entry keycard letter pass_core ticket ramen_box photo tape （新規は `G.addItem('id', {name, desc})`）
- **機体（MECHS）**: ponkotsu harukaze harukaze2 rose zephyr guardner guardner2 salamander nocturne junker clanA clanB jackal

---

## 3. 章の構成ルール

- 各章ファイル `js/story/chN.js` は **`G.STORY.chapters[N] = async () => { ... }`** を定義する。これは「章の頭から始める」関数で、章タイトル表示、時間帯、仲間、機体ID、目的、プレイヤーの配置（`E.warp`）を**すべて明示的に設定**する（前章の状態に依存しない。デバッグで `?chapter=N` から直接始められるように）。
- 章の最後のイベントで `await E.startChapter(N + 1)` を呼ぶ。
- デバッグ開始時の補正が必要なら `G.STORY.debugSetup = (n) => { ... }`（レベルや所持品を章相応に）を ch0 のファイルで定義済み（後述）。
- フラグ名は **`cN_` の接頭辞**（例 `c3_met_gil`）。共有マップ側（町のNPC等）は `w_` 接頭辞。
- マップIDも章専用マップは `cN_` 接頭辞（例 `c5_tunnel1`）。
- `G.mob` のIDも `cN_` 接頭辞。

### 3.1 書き方の例
```js
(function () {
  G.STORY.chapters[1] = async function () {
    E.time('evening');
    E.party(['ruu']);
    G.state.mech.id = 'ponkotsu';
    await E.chapter(1);
    await E.warp('school_yard', 12, 20, 'down');
    E.objective('スクラップ・ベイへ行く');
  };

  G.addToMap('scrapbay', {
    events: [{
      x: 20, y: 10, w: 2, once: 'c1_first_scrap', cond: () => G.state.chapter === 1,
      run: async () => {
        E.cut();
        await E.say('ruu', 'うわ、ガラクタの山……。');
        await E.move('f_ruu', 'RR');
        E.emote('player', '!');
        await E.say('kanata:surprise', 'あれって……ジャイロユニット！？');
        E.cut(false);
      },
    }],
  });
})();
```

---

## 4. 動作確認

```bash
# 章の頭から始めて、会話を40回送ってスクリーンショット
node tools/playtest.js "chapter=1" out.png '[{"adv":40},{"js":"[G.state.objective, G.field.map.id]"}]'
# マップ単体を開く（onEnter を実行しない）
node tools/playtest.js "map=minato&x=10&y=12&ch=2&enter=0" out.png '[{"w":500}]'
# 会話が終わるまで送る
node tools/playtest.js "chapter=3" out.png '[{"until":"!G.ev.running && !G.ui.blocking()","max":30000}]'
```
出力の `errors: 0` を必ず確認すること。`[pageerror]` は必ず直す。
キー：矢印・`z`（決定/攻撃）・`x`（ダッシュ）・`c`（スキル）・`Escape`（メニュー）。
`{"js":"..."}` で `G.state`、`G.field.player.x` などを調べられる。

---

## 5. 追加のゲーム要素

### タイミング・ミニゲーム
```js
const score = await E.timing({ title: 'ラーメン作り', rounds: 3, speed: 1.6, zone: 0.18, labels: ['麺をゆでる！', 'スープを注ぐ！', '具をのせる！'] });
// score = 成功回数（0〜rounds）。ラーメン屋の手伝い、機体の起動シーケンス、ハッキング、文化祭の屋台などに。
```

### ステルス（巡回する見張り）
`enemies` / `E.enemy()` に `patrol` を付けると、決まったルートを巡回し、前方の扇形の視界（壁で遮られる）にプレイヤーが入ると発見する。
```js
enemies: [ { type: 'guard', x: 10, y: 5, patrol: [[10,5],[20,5],[20,9]], vision: 72, dir: 'right' } ],
onSpotted: async (e) => {            // マップ定義に書く（または敵ごとに onSpot）
  await E.say('guard', 'そこにいるのは誰だ！');
  await E.warp(G.field.map.id, 3, 12, 'up');   // スタート地点に戻すなど
},
```
巡回中の見張りは既定で無敵・接触ダメージなし（`invuln:false, contact:true` で通常の敵にもできる）。

### 宇宙マップ
`space: true` のマップでは `*` タイルが透明・通行可能になり、背景に**パララックス（星空・地球・コロニー外観）**が自動で描かれる。
足場（宇宙港・外壁）には `h`（船体外板）や `m` `g` `x` を使う。宇宙での戦闘は `mech:true` 推奨。
`E.set('c7_dark')` 中は背景のコロニーの窓が暗くなる（ミラーが閉じた状態）。

### ボス戦のカメラ
戦闘中にボス（boss:true）がいると、カメラは自動でボス側に寄る。ボスは開始位置からプレイヤーまで画面1枚以内（タイル距離10〜14程度）に置くとよい。
