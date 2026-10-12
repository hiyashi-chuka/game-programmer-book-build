# 15. 解像度を上げて、プロの描き方を取り入れる（v9 / HD）

「解像度を上げてよい、細部まで検討してよい」という条件で、プロのイラストレーター・アニメーター・ドット絵師の描き方を調べ、**もっと可愛く・自然に** するための方法をまとめました。あわせて、それを実装した HD 版（v9）を作りました。

図：
- `character/output/compare_v8_hd.png`：v8（96×176）、HD 2倍（192×352）、HD 3倍（288×528）を同じ大きさで比較
- `character/output/mio_hd_face_x4.png`：HD の顔（開き・半目・閉じ・にっこり）
- `character/output/mio_hd_x2.png` / `mio_hd_1x.png`：HD 3倍の完成画像
- `character/output/mio_hd_idle_x2.gif`：呼吸とまばたき

> 調べ方の注意：この環境では Web ページの本文を開けず、すべて **検索結果の要約** から集めました。数値のうち出典が無いものは【目安】と書いています（ドット絵向けに換算した値）。特定の作家の絵柄は真似せず、共通する原理だけを取り出しています。

---

## 15-1. なぜ解像度を上げると良くなるのか

| 96×176（v8） | 288×528（HD 3倍） |
|---|---|
| 顔の幅が約 25px、目が 8×6px。目の形・瞳のグラデーション・まつ毛の束を **1px 単位の記号** で表すしかない | 顔の幅が約 75px、目が約 24×18px。上まぶたの太さの変化、まつ毛の束、瞳の上下のグラデーション、ハイライト3つを **形として** 描ける |
| 髪は 2 段の明暗と輪郭線だけ | 毛束の分かれ目（溝）、天使の輪のギザギザ、毛先の細さが出せる |
| 眉・首元・手など、数 px の部品が周りの線に埋もれやすい | 部品どうしの間に余白を取れる |

Octopath Traveler の監督は「ドット絵にぎりぎり見える高解像度」を狙ったと話している（HD-2D）。解像度を上げても、**1px の線・色トレス・少ない色の段数** を守ればドット絵らしさは残る。

---

## 15-2. プロの描き方：顔

| 項目 | プロの描き方 | HD での実装 |
|---|---|---|
| 目の配置 | 目と目の間は目1個分が基本。低めに置くと幼く見える | 目の中心は v8 と同じ（両目の間 ≒ 目の幅） |
| 上まぶた | **下まぶたより濃く太く、目尻へ太く、目頭は細く**。目尻は少し跳ね上げる | 上まぶたの太さを目尻 1.45 → 目頭 0.4（頭の座標）で変え、目尻の外へ跳ねる |
| まつ毛 | **根元が太く先が細い**束を 2〜3 本。全部平行にせず、中央は上、目尻側は外へ開く | 目尻側に外向き 2 本、中央寄りに上向き 1 本。先へ細くなる形 |
| 白目 | 上まぶたの **落ち影** を入れる（灰色より、赤みや紫みのある色がなじむ） | 白目の上端に淡い藤色 |
| 瞳 | **上が暗く下が明るい** グラデーション。上部に差し色、下部にベースより明るく彩度の高いピンク・紫。瞳孔のまわりは濃い | 瞳を 5 段（上部の暗色・差し色・中間・下部のピンク・最下部の照り返し）＋ふち＋瞳孔 |
| ハイライト | 光源側に大きめの楕円、反対側に小さな光、反射光のそばにも小さな光。目と違う色（水色など）を混ぜると単調にならない。**両目で同じ向き** | 左上に主、右下に副、左下に水色のきらめき。両目とも同じ向き |
| 下まぶた・涙袋 | 下まぶたは上より薄く短く。涙袋は線で描かず、淡い色でふくらみを示す（濃いとクマに見える） | 下まぶたは目尻側だけ淡い色、涙袋は明るい色の細い帯 |
| 目の大きさ | （docs/12）大きすぎると違和感 | 目の高さを 0.93 倍に抑えた |
| 眉 | 前髪に隠れる所は、前髪の上に透かして描く（透け眉）【目安】 | 前髪の上に 95% の濃さで重ねる。前髪の輪郭線と見分けがつく赤みのある茶 |
| 鼻 | 点・くの字の下半分・影だけ。描き込むと浮く | 鼻先の小さな影だけ |
| 口 | 閉じた口は短い線。唇を描くと大人っぽい。開いた口は中を奥ほど暗く、舌は奥から出る三角形、歯は省く | 閉じた口は口角を上げた ∪。にっこりの表情は開いた三日月の口＋舌 |
| 血色 | 頬・目の周り・鼻・耳に、少し赤く彩度の高い色を薄く | 頬に 2 段の楕円。膝にも小さな血色 |
| 色トレス | 目の周りの線は黒でなく、赤みのある茶・ワインレッド | 上まぶたは暗い赤紫、まぶたの下側と目頭側は赤茶 |
| 左右差 | 白目の幅が左右で違うと斜視に見えるので、目の比率はそろえる | 目の形は同じ式から作る。斜め向きの奥の目は顔の丸みで自然に狭くなる |

### 実装の工夫：顔を「頭の表面の模様」として描く
アニメ調の 3D モデルでは、目や口を **顔のテクスチャ** として描く。HD 版も同じ考え方で、
1. 顔の面だけをもう一度レイマーチし、各ピクセルの **頭の座標 (x, y)** を求める（前髪の下でも求まる）。
2. 目・眉・鼻・口・頬を、その座標の **曲線と楕円の式** で塗る。
3. 前髪の上の部分は、透かして塗る（透け目・透け眉）。

こうすると、斜め向きの奥の目は自然に狭くなり、顔の丸みに沿って形が曲がる。スタンプ（固定のドット絵）と違い、**解像度を変えても同じ形で描ける**（2倍でも3倍でも同じプログラム）。

---

## 15-3. プロの描き方：髪

| 項目 | プロの描き方 | HD での実装 |
|---|---|---|
| 束 | 分け目とつむじから放射状に。太い束と細い束を混ぜ、毛先の向きを少しばらつかせる。束の先どうしをつなげるとボサボサに見えない | v8 の毛束の 3D 形をそのまま使う |
| 束の分かれ目 | 束の境目に影色の切れ込み | 3D の毛束ごとの番号から、束が変わる所に「溝」（今の色と影色の中間）を入れる。濃い線にすると細い糸の束に見えたので弱めた |
| 前髪の塗り | アニメ塗りはグラデーションを使わず、影は生え際・束の下端・側面に硬く入れる | 前髪は束ごとの丸みの縞を消し、ベタ＋落ち影＋束の下の影だけにした |
| 天使の輪 | 頭の丸みに沿った帯。**毛束ごとに反射の角度が違うので形をばらつかせる**。上端は束の形に沿ってギザギザに | 頭頂から頭の高さの約 25% 下に帯。束ごとに高さと幅をずらし、光の側だけに描く |
| ツヤを見せる色 | ベタは明るすぎない方が、明るい帯が映える | 髪の基本色を少し濃いミルクティー色に（`HAIR_HD`） |
| 顔に落ちる影 | 髪の影とは別に「顔に落ちる影」として、光源から逆算して額に落とす | 3D の影の計算で、前髪の影が額にギザギザに落ちる |
| 髪の内側 | 奥の束は 1 段暗く | ボブの内側はインナーカラーで 1 段暗い |

---

## 15-4. プロの描き方：塗り・光・線

| 項目 | プロの描き方 | HD での実装 |
|---|---|---|
| 肌の影色 | 単に暗くするとくすむ。**赤〜オレンジ寄りで彩度を上げる**。例：肌 #FFECEA → 1影 #EDC1BF → 2影 #D8A29F（1段ごとに彩度 +6〜11、明度 −7〜11） | v8 の肌の色（影は赤み寄り）を使う |
| 影の境目 | **明暗の境目に彩度の高い色**を入れる（明暗境界線）。血色がよく見える | 体の肌の影の境目（明るい側）に 1px の明るいサーモンピンク |
| 光 | 光源は 1 つに統一。輪郭に沿って一律に暗くする「ピロー陰影」は避ける | 左上の光だけで 3D から計算 |
| リムライト | 逆光の縁取り。青白いと月光、暖色だと日光の印象 | 影側の縁に淡い青 |
| 仕上げ | 全体をオーバーレイやグラデーションマップで色調補正 | 上をほんのり暖色、下をほんのり寒色に（数％） |
| 線の色 | 黒でなく、周りの色の暗い版（色トレス）。光が当たる側の外周は明るい線（選択的アウトライン） | 素材ごとの線の色。光の側は影色寄りの明るい線、影側は濃い線 |
| 線の太さ | 外側は太く内側は細く。毛先は細く抜く。ただし小さな絵で強弱をつけすぎるとガタつく | 1px の線を基本に、束の分かれ目は線でなく溝 |
| ディザ | 顔やキャラには使わない（砂のように見える） | 使わない |
| 色の段数 | 64px 以上のキャンバスで 4〜5 段。素材ごとに少ないランプ | 肌・髪・服とも 4〜5 段 |

---

## 15-5. プロの描き方：体とポーズ

| 項目 | プロの描き方 | HD での実装 |
|---|---|---|
| 重心 | 片足に 7〜8 割。頭・胸・骨盤の傾きをジグザグに（コントラポスト） | v8 のポーズ（肩と骨盤を逆に傾ける）をそのまま |
| 女性らしい立ち方 | 閉じたポーズ。膝を寄せ、つま先を内へ。**膝とつま先は同じ向き** | v8 のまま（遊脚の膝を内へ） |
| 腕 | 脇と肘を閉じ、肘を胴のシルエットの内側に。紐を持つ手は **鎖骨の下〜みぞおち** の高さ【目安】 | v8 では手が首元にあり不自然だったので、みぞおちの高さへ下げて紐を握らせた |
| 手足 | 可愛い系は手足を細く、足首と手首を細く | 脚を少し細くした（`LEG_SLIM`） |
| 首元 | 首は細め、鎖骨はやや見せる | 襟ぐりが広く、肩の上の肌が左右に「翼」のように見えていたので、T シャツで肩の上と鎖骨まで覆い、襟ぐりを狭くした（鎖骨の形が T シャツを突き抜けていた） |

---

## 15-6. ドット絵のプロの手直し（今後の候補）

3D から作った絵は「手直しの土台」と考えるのがプロのやり方（Dead Cells は 3D から作ったが、手直しをしない代わりにちらつきが残った）。プログラムでできる手直しの候補：

1. **線のダブル（L 字の角）を消す**：線を 1px の斜めのつながりにそろえる。
2. **段差の長さをそろえる**：曲線の段差を 1→2→3 のように単調に増減させる（1-3-1-2 のようなばらつきはジャギーに見える）。
3. **段差の角に中間色を 1px**（手動のアンチエイリアス）。外周は背景が決まらないので控える。
4. **孤立ピクセルを消す**（v8 で実装済み）。

---

## 15-7. v8 と HD（v9）の違い

| 項目 | v8 | **HD（v9）** |
|---|---|---|
| 解像度 | 96×176 | **288×528（3倍）**。2倍（192×352）も出力 |
| 目 | 8×6px のスタンプ | 頭の座標の式で描く。5 段の瞳、ハイライト 3 つ、根元が太いまつ毛 3 本、目尻へ太くなる上まぶた |
| 眉 | 肌の上に 2 行 | 前髪の上の透け眉 |
| 表情 | 開き・半目・閉じ | ＋にっこり（∩ の目、開いた口と舌） |
| 髪 | 2 段＋天使の輪 | 3 段、束の分かれ目の溝、束ごとにずれる天使の輪、前髪はベタ＋影 |
| 肌 | ベタ＋影 | ＋影の境目の明るいサーモンピンク |
| ポーズ | 手が首元 | 手をみぞおちの高さへ、紐を握る |
| 首元 | 肩の上の肌が見える | 小さな丸首 |
| 脚 | — | 少し細く |
| 仕上げ | — | 上は暖色、下は寒色の色調補正 |
| 小物 | 1px 単位 | ハート形のヘアクリップ、金の細い鎖とチャーム、2×2 のボタン |

`python3 draw_mio_hd.py` で HD の画像をすべて作り直せる（約 4 分）。顔の形は `FP`（位置）、`EYE_TOP` / `EYE_BOT` / `LID_W`（目の形）、`EYE_C`（目の色）で調整できる。

---

## 15-8. チェックリスト

- [ ] 上まぶたは目尻へ太く、目頭は細い。まつ毛は根元が太く先が細い束を 2〜3 本
- [ ] 瞳は上が暗く下が明るい。ハイライトは主・副・きらめきの 3 つで、両目とも同じ向き
- [ ] 白目の上に、まぶたの落ち影（淡い紫）
- [ ] 眉が前髪の線に埋もれていない（透け眉）
- [ ] 鼻は小さな影だけ。口は小さく、口角を上げる
- [ ] 髪の束の分かれ目は「溝」程度。天使の輪は束ごとにずれたギザギザの帯
- [ ] 肌の影の境目に、彩度の高い明るい色
- [ ] 線は黒でなく色トレス。光の側の外周は明るい線
- [ ] 手は自然な高さで物を握っている。首元・襟ぐりが自然
- [ ] 顔にディザを使っていない

---

## 参考にした情報

顔・目：
- [CLIP STUDIO「かわいい顔の描き方」](https://www.clipstudio.net/oekaki/archives/151661)、[CLIP STUDIO（斜めの顔）](https://www.clipstudio.net/oekaki/archives/176083)、[CLIP STUDIO（白目の影）](https://www.clipstudio.net/oekaki/archives/153050)、[CLIP STUDIO（目の描き方）](https://www.clipstudio.net/oekaki/archives/149339)、[CLIP STUDIO（口の描き方）](https://www.clipstudio.net/oekaki/archives/162499)
- [CLIP STUDIO TIPS（目のメイキング）](https://tips.clip-studio.com/ja-jp/articles/667)、[ATAM ACADEMY（ハイライト）](https://atam-academy.com/blog/19951/)、[ATAM ACADEMY（斜めの顔）](https://atam-academy.com/blog/43364/)、[ATAM ACADEMY（鼻）](https://atam-academy.com/blog/43496/)
- [いちあっぷ（白目の影）](https://ichi-up.net/2017/048)、[いちあっぷ（まつ毛・ハイライトの色）](https://ichi-up.net/2020/63)、[お絵かき図鑑（まつ毛）](https://oekaki-zukan.com/articles/46969)、[お絵かき図鑑（色トレス）](https://oekaki-zukan.com/articles/47332)、[パルミー（目の塗り）](https://www.palmie.jp/lessons/309)、[KAKETA（涙袋）](https://kaketa.blog/archives/679)、[note「絵柄改造計画」](https://note.com/himitsu_x4x/n/n4442835ebdfa)、[左右非対称の扱い](https://tomitomu.com/left-right-asymmetry)
- 作家の傾向：[CLIP STUDIO（Mika Pikazo 講座）](https://www.clipstudio.net/oekaki/archives/151587)、[CLIP STUDIO（redjuice インタビュー）](https://www.clipstudio.net/oekaki/archives/149460)、[ワコム（しらび）](https://tablet.wacom.co.jp/article/drawing-with-wacom112)、[Real Sound（Mika Pikazo）](https://realsound.jp/book/2022/11/post-1170530_2.html)、[Real Sound（米山舞）](https://realsound.jp/2022/10/post-1142447_2.html)

髪・塗り・光・線：
- [CLIP STUDIO（髪の描き方）](https://www.clipstudio.net/oekaki/archives/160962)、[パルミー（前髪）](https://www.palmie.jp/lessons/293)、[いちあっぷ（天使の輪）](https://ichi-up.net/2018/079)、[egaco（髪のハイライト）](https://comic.smiles55.jp/guide/13573/)、[CLIP STUDIO（透け感）](https://www.clipstudio.net/oekaki/archives/152759)
- [CLIP STUDIO TIPS（肌の影の色）](https://tips.clip-studio.com/ja-jp/articles/8818)、[egaco（影の色相）](https://comic.smiles55.jp/guide/5257/)、[PRISMPLANE（アニメ塗り）](https://prismplane.jp/anime_style_coloring/)、[Scrapbox「明暗境界線」](https://scrapbox.io/onmk/明暗境界線)、[CLIP STUDIO（透明感のある肌）](https://www.clipstudio.net/oekaki/archives/163104)
- [CLIP STUDIO（線の強弱）](https://www.clipstudio.net/oekaki/archives/152764)、[CLIP STUDIO（色トレス）](https://www.clipstudio.net/oekaki/archives/152709)、[CLIP STUDIO（光の入れ方）](https://www.clipstudio.net/oekaki/archives/153338)、[MediBang（オーバーレイの仕上げ）](https://medibangpaint.com/en/use/2021/06/how-to-finish-the-illustration-with-overlay)

ドット絵：
- [itch.io「Selective outlines」](https://itch.io/t/2422252/pixel-tutorial-selective-outlines)、[Lospec「Pixel art outlines」](https://lospec.com/articles/pixel-art-outlines)、[Lospec「Using color」](https://lospec.com/articles/pixel-art-outlines-part-2-using-color)、[Pixel Parmesan（アンチエイリアス）](https://pixelparmesan.com/anti-aliasing-fundamentals-for-pixel-artists)、[Pixel Parmesan（ディザ）](https://pixelparmesan.com/dithering-for-pixel-artists)、[OpenGameArt（線と曲線）](https://opengameart.org/content/chapter-2-lines-and-curves)、[BuskHusker（GBA の顔グラ）](https://feuniverse.us/t/buskhuskers-gba-portraiting-tutorials/10927)、[SLYNYRD「Pixelblog 29」](https://www.slynyrd.com/blog/2020/7/28/pixelblog-29-anime-faces-and-hair)、[SLYNYRD「Pixelblog 1 パレット」](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes)、[pixnote（陰影）](https://pixnote.net/en/learn/shading)
- [Game Developer「Dead Cells の 3D パイプライン」](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)、[Unreal Engine「Octopath Traveler II」](https://www.unrealengine.com/en-us/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style)、[GOG（Owlboy の作者）](https://www.gog.com/en/news/read_about_the_future_of_pixel_art_according_to_the_creators_of_owlboy)、[Giant Robot（Paul Robertson）](https://www.giantrobot.com/blogs/giant-robot-store-and-gr2-news/15804627-gr-interview-artist-paul-robertson)

体・ポーズ・服：
- [CLIP STUDIO（頭身）](https://www.clipstudio.net/oekaki/archives/151156)、[CLIP STUDIO（脚）](https://www.clipstudio.net/oekaki/archives/149721)、[CLIP STUDIO（女性の体）](https://www.clipstudio.net/oekaki/archives/152192)、[CLIP STUDIO（ポーズの当たり）](https://www.clipstudio.net/oekaki/archives/153115)、[CLIP STUDIO TIPS（コントラポスト）](https://tips.clip-studio.com/en-us/articles/6073)、[egaco（脚の描き方）](https://comic.smiles55.jp/guide/13485/)、[パルミー（斜めの体）](https://www.palmie.jp/lessons/311)、[PoseMy.Art（S字）](https://posemy.art/blog/s-curve-drawing-guide/)
- [CLIP STUDIO（服のしわ）](https://www.clipstudio.net/oekaki/archives/159937)、[CLIP STUDIO（スカート）](https://www.clipstudio.net/oekaki/archives/152204)、[MediBang（プリーツスカート）](https://medibangpaint.com/use/2020/03/how-to-draw-pleated-skirts/)、[CLIP STUDIO（靴）](https://www.clipstudio.net/oekaki/archives/171417)
