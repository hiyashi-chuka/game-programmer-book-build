"""
現代風の可愛い女性キャラクター「ミオ」のドット絵を、画像生成を使わずに描くスクリプト。

docs/00_ai_pixel_protocol.md の「方式B：図形ラスタライズ方式」の実装例。
  1. 図形（スプライン多角形・楕円）で各パーツのマスクを作る
  2. 奥→手前の順にベタ塗り
  3. マスクから高さ・法線を推定して球／円柱の陰影（docs/08 8-10）、オクルージョン影、落ち影
  4. リムライト、素材ごとの暗色で輪郭線（色トレス）。明部は明るい線・影は濃い線（線の強弱）
  5. 目・眉・口・頬などは文字グリッド（方式A）のスタンプで上書き

使い方:  python3 draw_mio.py   → output/ に PNG と GIF を書き出す
必要なもの: Python 3, numpy, Pillow
"""
import math
import os

import numpy as np
from PIL import Image

W, H = 96, 156
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")

# 光源は左上。影は右下 (+x, +y) 方向へ落ちる。


# ---------------------------------------------------------------------------
# パレット（docs/01・05 のランプ規則：影は寒色/赤紫側、明部は暖色側へ色相シフト）
# ---------------------------------------------------------------------------
def hx(s):
    s = s.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)


MAT = {
    "skin":     dict(line="#a8605e", s2="#d98f86", s1="#f5b9a6", base="#ffe1cf", hi="#fff3ea"),
    "hair":     dict(line="#6e4a42", s2="#a77866", s1="#c99a80", base="#e6c3a5", lt="#f4dcc4", hi="#fff0e0"),
    "inner":    dict(line="#8a3d5c", s2="#b85c7e", s1="#d97a9a", base="#f29bb5"),
    "cardigan": dict(line="#8a7462", s2="#b9a07f", s1="#dbc7a6", base="#f6ecd8", hi="#fffaf0"),
    "tee":      dict(line="#8c8aa6", s2="#bcbad4", s1="#dedcee", base="#ffffff"),
    "skirt":    dict(line="#1c1e38", s2="#262a4c", s1="#343a66", base="#474f88", lt="#606aa8"),
    "socks":    dict(line="#8c8aa6", s1="#d6d6ea", base="#fafaff"),
    "shoes":    dict(line="#141018", s1="#241c2a", base="#3a2e40", lt="#6a5a70", hi="#b0a0b8"),
    "bag":      dict(line="#8a3a5a", s1="#d0608a", base="#f08cb0", lt="#ffc0d8", hi="#ffffff"),
}
for m in MAT.values():
    for k in m:
        m[k] = hx(m[k])

EYE_PAL = {
    "K": hx("#3e2234"),  # 上まぶた・まつげ（黒ではなく暗い赤紫）
    "k": hx("#7a4658"),  # まつげ中間色
    "W": hx("#ffffff"),  # 白目
    "w": hx("#dcd8f0"),  # 白目のまぶた影
    "d": hx("#5a2f72"),  # 虹彩・上部（暗）
    "I": hx("#9a58b0"),  # 虹彩ベース
    "J": hx("#e47fb6"),  # 虹彩下部（ピンクへのグラデ）
    "G": hx("#ffc2e0"),  # 虹彩最下部の反射
    "P": hx("#341a46"),  # 瞳孔
    "L": hx("#ffffff"),  # ハイライト
    "b": hx("#b07080"),  # 下まつげ（薄い）
}
FACE_PAL = {
    "M": hx("#a8505a"),  # 口の線
    "m": hx("#e8848c"),  # 口の中・舌
    "B": hx("#ffb8b0"),  # 頬（薄）
    "C": hx("#ff9a9e"),  # 頬（濃・斜線）
    "N": hx("#eaa496"),  # 鼻
    "E": hx("#b98a76"),  # 前髪越しに透ける眉（眉色と髪色の中間）
}
ACC = {
    "clip": hx("#ff7fa8"), "clip_hi": hx("#ffd6e4"), "clip_line": hx("#a23e66"),
    "pearl": hx("#fff8f0"), "pearl_sh": hx("#d8c8c8"),
    "strap": hx("#c45a82"), "strap_hi": hx("#f49ab8"),
    "button": hx("#b49a7e"),
    "gold": hx("#f0c860"),
}


# ---------------------------------------------------------------------------
# ラスタライズの道具
# ---------------------------------------------------------------------------
YY, XX = np.mgrid[0:H, 0:W]
PX = XX + 0.5  # ピクセル中心
PY = YY + 0.5


def catmull(points, closed=True, n=8):
    """制御点を通る滑らかな曲線（Catmull-Rom スプライン）を折れ線で返す。"""
    pts = list(points)
    out = []
    m = len(pts)
    rng = range(m) if closed else range(m - 1)
    for i in rng:
        p0 = pts[(i - 1) % m] if closed or i > 0 else pts[i]
        p1 = pts[i]
        p2 = pts[(i + 1) % m]
        p3 = pts[(i + 2) % m] if closed or i + 2 < m else pts[(i + 1) % m]
        for j in range(n):
            t = j / n
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                       + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                       + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    if not closed:
        out.append(pts[-1])
    return out


def poly(points):
    """多角形の内部（ピクセル中心で判定、偶奇規則）をマスクで返す。"""
    inside = np.zeros((H, W), bool)
    n = len(points)
    for i in range(n):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % n]
        if y1 == y2:
            continue
        cond = (PY >= min(y1, y2)) & (PY < max(y1, y2))
        xint = x1 + (PY - y1) * (x2 - x1) / (y2 - y1)
        inside ^= cond & (PX < xint)
    return inside


def smooth(points, n=8):
    return poly(catmull(points, True, n))


def sym(right_half):
    """右半分の点列（上→下）から左右対称の閉じた点列を作る（中心 x=48）。"""
    left = [(96 - x, y) for (x, y) in reversed(right_half)]
    return right_half + left


def mirror_pts(points):
    return [(96 - x, y) for (x, y) in points]


def ellipse(cx, cy, rx, ry):
    return ((PX - cx) / rx) ** 2 + ((PY - cy) / ry) ** 2 <= 1.0


def shift(mask, dx, dy):
    """result[y, x] = mask[y + dy, x + dx]（範囲外は False）。"""
    out = np.zeros_like(mask)
    ys = slice(max(0, -dy), min(H, H - dy))
    xs = slice(max(0, -dx), min(W, W - dx))
    ys2 = slice(max(0, dy), min(H, H + dy))
    xs2 = slice(max(0, dx), min(W, W + dx))
    out[ys, xs] = mask[ys2, xs2]
    return out


def line_pixels(x0, y0, x1, y1):
    """ブレゼンハムの直線（整数座標）。"""
    x0, y0, x1, y1 = map(int, map(round, (x0, y0, x1, y1)))
    pts = []
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return pts



# ---------------------------------------------------------------------------
# 立体感の計算（docs/08 8-6）：マスク → 高さ → 法線 → 光との内積 → 明るさの段階
# ---------------------------------------------------------------------------
LIGHT = np.array([-0.55, -0.65, 0.52])   # 左上・手前からの光
LIGHT = LIGHT / np.linalg.norm(LIGHT)
RIM = hx("#dfe6ff")                        # リムライト（逆光）の色：空の淡い青


def mix(c1, c2, t):
    return tuple(int(round(c1[i] * (1 - t) + c2[i] * t)) for i in range(3)) + (255,)


def inner_distance(mask, mode):
    """マスクの縁からの距離（何回削ると消えるか）。cyl は左右方向だけで測る。"""
    d = np.zeros((H, W))
    cur = mask.copy()
    k = 0
    while cur.any():
        k += 1
        d[cur] = k
        nb = shift(cur, 1, 0) & shift(cur, -1, 0)
        if mode == "sphere":
            nb &= shift(cur, 0, 1) & shift(cur, 0, -1)
            if k % 2 == 0:  # 4近傍と8近傍を交互に使い、距離を丸く近づける
                nb &= shift(cur, 1, 1) & shift(cur, -1, -1) & shift(cur, 1, -1) & shift(cur, -1, 1)
        cur &= nb
    return d


def blur(a):
    return (a + shift(a, 1, 0) + shift(a, -1, 0) + shift(a, 0, 1) + shift(a, 0, -1)) / 5.0


def height(mask, mode="sphere", edge=None):
    """マスクを風船のようにふくらませた高さマップ（断面が円になるプロファイル）。
    edge を指定すると、縁から edge px だけが丸く、内側は平らな形（角の丸い板）になる。"""
    d = inner_distance(mask, mode)
    if edge:
        R = edge
    elif mode == "cyl":   # 円柱：行ごとの太さで正規化（細い所も太い所も同じように丸い）
        R = np.maximum(d.max(axis=1, keepdims=True), 1)
    else:               # 球：全体の太さで正規化
        R = max(d.max(), 1)
    t = np.clip((d - 0.5) / R, 0, 1)
    h = R * np.sqrt(1 - (1 - t) ** 2) * mask
    for _ in range(2):
        h = blur(h)
    return h


def lambert(h):
    """高さマップの勾配から法線を求め、光の向きとの内積（-1〜1）を返す。"""
    gx = (shift(h, 1, 0) - shift(h, -1, 0)) / 2
    gy = (shift(h, 0, 1) - shift(h, 0, -1)) / 2
    n = np.stack([-gx, -gy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n @ LIGHT


# 内積 → 段階のしきい値（明部と影の境目＝明暗境界線は 0.30 付近）
LEVELS = [(0.93, 0), (0.80, 1), (0.30, 2), (0.02, 3)]


def level_of(lam):
    out = np.full(lam.shape, 4, int)
    for th, k in reversed(LEVELS):
        out[lam > th] = k
    return out


RAMP = ["hi", "lt", "base", "s1", "s2"]


def ramp(mat, k):
    """段階 k の色。素材にその段階が無ければ base 側の隣の色を使う。"""
    step = 1 if k < 2 else -1
    while RAMP[k] not in mat:
        k += step
    return mat[RAMP[k]]

# ---------------------------------------------------------------------------
# パーツ定義
# ---------------------------------------------------------------------------
class Layer:
    def __init__(self, name, mask, mat, group=None, shade=None, line=True, vol=None, bias=0.0, rim=False,
                 ao=True):
        self.name, self.mask, self.mat = name, mask, mat
        self.group = group or name
        self.shade = shade      # vol が無いときの簡易影：オフセットマスクのずらし量 (dx, dy)
        self.line = line
        # 立体の形（docs/08）：[(マスク, 重み, "sphere" | "cyl"), ...]
        #   sphere = 球・卵（頭、胴）、cyl = 円柱・円錐（腕、脚、スカート）
        self.vol = vol
        self.bias = bias        # 明るさの補正（顔は影を少なく＝プラス）
        self.rim = rim          # 影側の輪郭の内側にリムライトを入れる
        self.ao = ao            # 手前のパーツと接する所を暗くする（オクルージョン）


HEAD_SCALE = 1.08  # 頭を少し大きくして可愛さを上げる（docs/00 0-3：小さいほど頭を大きく）


def head_xf(tilt, bob):
    """頭部パーツ用の座標変換（首の付け根を中心に拡大・傾き＋上下の呼吸）。"""
    a = math.radians(tilt)
    cx, cy = 48.0, 42.0
    ca, sa = math.cos(a), math.sin(a)

    def f(points):
        out = []
        for x, y in points:
            dx, dy = (x - cx) * HEAD_SCALE, (y - cy) * HEAD_SCALE
            out.append((cx + dx * ca - dy * sa, cy + dx * sa + dy * ca + bob))
        return out

    def p(x, y):
        return f([(x, y)])[0]

    return f, p


def LEG(points):
    """脚を少し短くする縦方向の圧縮（スカートの裾 y=88 より下を 0.9 倍）。"""
    return [(x, y if y <= 88 else 88 + (y - 88) * 0.9) for x, y in points]


def build(tilt=0.0, bob=0, eyes="open"):
    T, TP = head_xf(tilt, bob)

    def B(points):  # 上半身（呼吸で上下）
        return [(x, y + bob) for x, y in points]

    L = []

    # --- 1. 後ろ髪（外ハネボブ） ------------------------------------------
    back = sym([(48, 7.6), (55, 8.2), (60.6, 11), (63.4, 15.5), (64.4, 21), (64.6, 28), (64.8, 35),
                (65.8, 41), (68.4, 45.4), (71.4, 47.8), (70.4, 50), (66.6, 50.2), (63, 48.6), (60, 46)])
    hair_back = smooth(T(back))
    L.append(Layer("hair_back", hair_back, MAT["hair"], group="hair", rim=True))

    # インナーカラー（後ろ髪の内側、首の左右に見える）
    inner_r = [(53, 41), (59.5, 40.5), (62.2, 44), (64.8, 48.2), (60, 48.6), (56, 47.4), (53.2, 45.4)]
    inner = smooth(T(inner_r)) | smooth(T(mirror_pts(inner_r)))
    L.append(Layer("hair_inner", inner, MAT["inner"], group="hair", bias=-0.25))

    # --- 2. 脚・ソックス・靴 ------------------------------------------------
    leg_l = [(38.2, 84), (47.3, 84), (47.5, 92), (47.1, 104), (46.7, 112), (46.4, 117), (46.9, 124),
             (46.4, 132), (45.7, 140), (45.6, 145), (41.6, 145), (41.2, 140), (40.0, 131), (39.2, 123),
             (40.0, 116), (39.6, 110), (38.4, 100), (37.6, 92)]
    leg_l = LEG(leg_l)
    leg_r = mirror_pts(leg_l)
    leg_lm, leg_rm = smooth(leg_l, 6), smooth(leg_r, 6)
    legs = leg_lm | leg_rm
    leg_vol = [(leg_lm, 1.0, "cyl"), (leg_rm, 1.0, "cyl")]
    L.append(Layer("legs", legs, MAT["skin"], group="skin_leg", vol=leg_vol, rim=True, bias=-0.12))

    # ソックスの口は脚（円柱）に巻きつく曲線にする（クロスコンター。直線だと平面に見える）
    sock_top = 124
    sock_curve = np.zeros((H, W))
    for cx_ in (43.6, 52.4):
        sock_curve = np.maximum(sock_curve, 1.3 * np.clip(1 - ((PX - cx_) / 4.2) ** 2, 0, 1))
    socks = legs & (PY > sock_top + sock_curve) & (PY < 146)
    L.append(Layer("socks", socks, MAT["socks"], vol=leg_vol, rim=True))

    shoe_l = LEG([(41.0, 142.5), (45.8, 142.5), (47.0, 145.5), (47.4, 149), (47.2, 153), (37.4, 153),
                  (37.0, 149), (38.4, 145.5)])
    shoe_lm, shoe_rm = smooth(shoe_l, 4), smooth(mirror_pts(shoe_l), 4)
    L.append(Layer("shoes", shoe_lm | shoe_rm, MAT["shoes"], vol=[(shoe_lm, 1.0, "sphere"), (shoe_rm, 1.0, "sphere")]))

    # --- 3. 体（首・デコルテ） ----------------------------------------------
    body = sym([(48, 30), (51.6, 30), (51.6, 41.5), (53, 44.2), (57.5, 45.6), (61, 47.5), (62, 52),
                (60, 62), (59, 70), (48, 72)])
    body_m = smooth(B(body))
    neck_vol = [(body_m & (PY < 46 + bob), 1.0, "cyl")]
    L.append(Layer("body", body_m, MAT["skin"], group="skin", vol=neck_vol))

    # --- 4. インナー（白T、スカートにタックイン） ---------------------------
    tee = sym([(48, 47.6), (50.6, 47.2), (52.6, 45.6), (57, 46.4), (60.5, 49), (61, 56), (58.6, 63),
               (57.8, 68), (48, 68)])
    tee_m = smooth(B(tee))
    L.append(Layer("tee", tee_m, MAT["tee"]))

    # --- 5. スカート（ネイビーのプリーツミニ、Aライン） -----------------------
    skirt_side = [(48, 63.5), (56.6, 63.5), (58.8, 70), (61.6, 78), (64.6, 86), (65.4, 88.0)]
    hem = []  # 裾のジグザグ：プリーツの谷で1px上がる
    for k in range(5, -6, -1):
        x = 48 + k * 3.6
        hem += [(x + 1.8, 88.9), (x, 87.7)] if k > -5 else [(x + 1.8, 88.9)]
    # 裾は円錐の切り口＝楕円の手前側なので、中央ほど下がる弧にする（クロスコンター）
    hem = [(x, y + 1.6 * max(0.0, 1 - ((x - 48) / 17.4) ** 2)) for x, y in hem]
    skirt_pts = catmull(skirt_side, False, 4) + hem + [(96 - x, y) for x, y in reversed(catmull(skirt_side, False, 4))]
    skirt_m = poly(skirt_pts)
    L.append(Layer("skirt", skirt_m, MAT["skirt"], vol=[(skirt_m, 1.0, "cyl")], rim=True))

    # --- 6. カーディガン（オーバーサイズ、前開き、ドロップショルダー） -------
    card_r = [(53.4, 45.2), (57.5, 46.0), (61.8, 47.6), (64.2, 50.5), (63.6, 58), (63.4, 66),
              (63.8, 74), (64.0, 80.6), (59, 81.4), (55.0, 81.2), (54.6, 74), (54.4, 64), (55.0, 56),
              (53.8, 50)]
    card_rm, card_lm = smooth(B(card_r)), smooth(B(mirror_pts(card_r)))
    card = card_rm | card_lm
    # 胴体は1つの大きな卵形（胸郭）として陰影を付け、前身頃ごとの厚みを少し足す
    # 立体の形は服のシルエットではなく中身の胴体で決める（カーディガンは胴より大きく、袖の下に隠れる）
    torso = smooth(B(sym([(48, 44), (55, 44.6), (59.2, 47.6), (59.8, 55), (58.4, 63), (58.6, 71),
                          (59.4, 80), (48, 81)])))
    torso_vol = [(torso, 1.0, "cyl"), (torso, 0.4, "sphere")]
    L[-2].vol = torso_vol + [(tee_m, 0.15, "sphere")]  # tee
    L.append(Layer("cardigan", card, MAT["cardigan"], rim=True,
                   vol=torso_vol + [(card_rm, 0.35, "sphere"), (card_lm, 0.35, "sphere")]))

    # --- 7. 手（萌え袖からのぞく指先） --------------------------------------
    hand_r = ellipse(66.0, 85.0 + bob, 2.9, 2.6)
    hand_l = ellipse(30.0, 85.0 + bob, 2.9, 2.6)
    L.append(Layer("hands", hand_r | hand_l, MAT["skin"], group="skin_hand",
                   vol=[(hand_r, 1.0, "sphere"), (hand_l, 1.0, "sphere")]))

    # --- 8. 袖 ---------------------------------------------------------------
    sleeve_r = [(59.5, 47.0), (62.6, 47.4), (65.4, 50), (67.0, 56), (67.9, 63), (69.2, 71),
                (70.6, 79), (70.8, 84.4), (66.8, 85.2), (62.0, 84.4), (61.6, 78), (61.0, 70),
                (60.6, 62), (60.0, 54)]
    sl_rm, sl_lm = smooth(B(sleeve_r)), smooth(B(mirror_pts(sleeve_r)))
    L.append(Layer("sleeves", sl_rm | sl_lm, MAT["cardigan"], rim=True,
                   vol=[(sl_rm, 1.0, "cyl"), (sl_lm, 1.0, "cyl")]))

    # --- 9. バッグ（ピンクのパテント・ミニショルダー） -----------------------
    bag = smooth(B([(31.6, 73.4), (41.0, 73.4), (42.0, 75), (41.8, 81), (40.6, 82.2), (32.4, 82.2),
                    (31.0, 81), (30.8, 75)]), 4)
    L.append(Layer("bag", bag, MAT["bag"], vol=[(bag, 1.0, "sphere")]))

    # --- 10. 顔 -------------------------------------------------------------
    face = sym([(48, 12.5), (54, 13.2), (58.5, 15.5), (60.4, 19.5), (60.8, 24), (60.5, 27),
                (59.9, 30.5), (58.6, 33.4), (56.6, 36), (54.0, 38.3), (51.2, 39.7), (48.6, 40.1)])
    face_m = smooth(T(face))
    # アニメの顔は影を最小限に：縁の4pxだけ丸める（右頬と顎の下だけに影）、オクルージョンも入れない
    L.append(Layer("face", face_m, MAT["skin"], group="skin_face", vol=[(face_m, 1.0, "sphere", 4)],
                   bias=0.05, ao=False))

    # --- 11. 横髪（顔の両側の束、毛先は外ハネ） -----------------------------
    side_r = [(57.2, 15.5), (61.4, 16), (64.0, 21), (65.0, 29), (65.4, 37), (66.4, 43.4),
              (69.4, 47.2), (67.0, 48.6), (63.0, 47.0), (60.2, 44), (58.8, 39), (58.6, 33), (58.8, 24)]
    side = smooth(T(side_r)) | smooth(T(mirror_pts(side_r)))
    L.append(Layer("hair_side", side, MAT["hair"], group="hair_f", rim=True))

    # --- 12. 前髪（シースルーバング） ---------------------------------------
    bang_tips = [(61.2, 19.0), (60.0, 23.4), (58.2, 19.6), (55.8, 23.8), (54.0, 19.2), (51.4, 23.4),
                 (49.6, 20.0), (47.4, 25.8), (46.0, 20.4), (43.6, 23.8), (41.6, 19.4), (39.2, 23.8),
                 (37.4, 19.6), (36.2, 23.0), (34.8, 19.0)]
    crown = [(35.0, 17.5), (36.4, 12.6), (41.0, 9.0), (48.0, 7.8), (55.0, 9.0), (59.6, 12.6), (61.2, 17.5)]
    bangs = poly(  # 頭頂はスプライン、毛先はジグザグを保つため直線で結ぶ
        catmull(T(crown), False, 6) + T(bang_tips))
    L.append(Layer("hair_front", bangs, MAT["hair"], group="hair_f", rim=True))

    # アホ毛
    ahoge = poly(T([(48.0, 8.6), (49.0, 5.6), (51.4, 3.2), (54.2, 3.0), (52.0, 4.4), (50.4, 6.4), (49.8, 8.6)]))
    L.append(Layer("ahoge", ahoge, MAT["hair"], group="hair_f"))

    # 髪全体を1つの球（頭）として陰影を付け、横髪・前髪は束としての厚みを足す
    head_ball = hair_back | side | bangs
    for l in L:
        if l.name in ("hair_back", "ahoge"):
            l.vol = [(head_ball, 1.0, "sphere")]
        elif l.name == "hair_side":
            l.vol = [(head_ball, 1.0, "sphere"), (side, 0.5, "cyl")]
        elif l.name == "hair_front":
            l.vol = [(head_ball, 1.0, "sphere"), (bangs, 0.3, "sphere")]
        elif l.name == "hair_inner":
            l.vol = [(head_ball, 1.0, "sphere")]

    ctx = dict(T=T, TP=TP, B=B, bob=bob, eyes=eyes, tilt=tilt, sock_top=sock_top, sock_curve=sock_curve,
               bang_tips=bang_tips)
    return L, ctx


# ---------------------------------------------------------------------------
# レンダリング
# ---------------------------------------------------------------------------
def render(tilt=0.0, bob=0, eyes="open"):
    layers, ctx = build(tilt, bob, eyes)
    idx = {l.name: i for i, l in enumerate(layers)}
    owner = np.full((H, W), -1, int)
    for i, l in enumerate(layers):
        owner[l.mask] = i
    img = np.zeros((H, W, 4), np.uint8)

    def vis(name):
        return owner == idx[name]

    # ---- 明るさを「段階（レベル）」で管理する -------------------------------
    # 0=hi 1=lt 2=base 3=s1 4=s2。最後にレイヤーの素材ランプで色に変換する。
    lv = np.full((H, W), 2, int)

    # 1) 立体の陰影：マスクから高さ（ふくらみ）を作り、法線と光の向きの内積で明るさを決める
    hcache = {}
    lam_all = np.zeros((H, W))
    for i, l in enumerate(layers):
        v = owner == i
        if not v.any():
            continue
        if l.vol:
            hgt = np.zeros((H, W))
            for spec in l.vol:
                m, wgt, mode = spec[:3]
                edge = spec[3] if len(spec) > 3 else None
                key = (id(m), mode, edge)
                if key not in hcache:
                    hcache[key] = height(m, mode, edge)
                hgt += wgt * hcache[key]
            lam = lambert(hgt) + l.bias
            lam -= 0.10 * np.clip((PY - 60) / 90, 0, 1)  # 環境光は上から：下ほど少し暗く
            lam_all[v] = lam[v]
            lv[v] = level_of(lam)[v]
        elif l.shade:
            dx, dy = l.shade
            lv[v & ~shift(l.mask, dx, dy)] = 3

    # 2) オクルージョン影：手前のパーツが接している所（すき間・付け根）は光が届かず暗い
    gid = {}
    for l in layers:
        gid.setdefault(l.group, len(gid))
    grp = np.array([gid[l.group] for l in layers])
    own_g = np.where(owner >= 0, grp[np.clip(owner, 0, None)], -1)
    occl = np.zeros((H, W), bool)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
        nb = shift(owner, dx, dy)
        nbg = shift(own_g, dx, dy)
        occl |= (owner >= 0) & (nb > owner) & (nbg != own_g)
    occl &= np.array([l.ao for l in layers])[np.clip(owner, 0, None)]
    lv[occl] = np.minimum(lv[occl] + 1, 4)

    # 3) 落ち影（影を落とすマスクを右下にずらし、受け側の見えている部分と重ねる）
    def cast(caster, receiver, dx, dy, level=3):
        c = np.zeros((H, W), bool)
        for n in caster:
            c |= layers[idx[n]].mask
        m = shift(c, -dx, -dy) & vis(receiver)
        lv[m] = np.maximum(lv[m], level)
        return m

    cast(["hair_front", "ahoge"], "face", 1, 2)
    cast(["hair_side"], "face", 1, 1)
    cast(["face"], "body", 0, 3)
    cast(["face"], "body", 1, 1, 4)
    cast(["hair_side", "hair_back"], "body", 1, 2)
    cast(["hair_side"], "cardigan", 1, 2)
    cast(["hair_side"], "sleeves", 1, 2)
    cast(["cardigan"], "tee", 2, 1)
    cast(["cardigan", "sleeves"], "skirt", 1, 2, 4)
    cast(["skirt"], "legs", 1, 3)
    cast(["skirt"], "legs", 0, 1, 4)
    cast(["sleeves"], "hands", 0, 2)
    cast(["sleeves"], "cardigan", 2, 1)
    cast(["bag"], "skirt", 1, 1, 4)
    cast(["bag"], "cardigan", 1, 1)
    cast(["bag"], "sleeves", 1, 1)

    T, TP = ctx["T"], ctx["TP"]
    bob = ctx["bob"]

    def bump(mask, d):
        lv[mask] = np.clip(lv[mask] + d, 0, 4)

    # 後ろ髪の内側（顔の真横〜首）は奥にあるので暗く（奥＝暗い＝遠い）
    hb = vis("hair_back")
    lv[hb & (PY > 30 + bob) & (np.abs(PX - 48) < 15)] = np.maximum(lv[hb & (PY > 30 + bob) & (np.abs(PX - 48) < 15)], 3)
    lv[hb & (PY > 37 + bob) & (np.abs(PX - 48) < 11)] = 4
    hi_ = vis("hair_inner")
    lv[hi_ & (np.abs(PX - 48) < 7)] = 4
    for sx in (58.5, 61.5, 37.5, 34.5):  # インナーカラーにも毛束の筋
        bump(poly(T([(sx - 0.4, 40), (sx + 0.5, 40), (sx + (1.6 if sx > 48 else -0.6), 48.6),
                     (sx + (0.8 if sx > 48 else -1.4), 48.6)])) & hi_, 1)
    # 太ももの内側（脚どうしが接する所）
    bump(vis("legs") & (np.abs(PX - 48) < 1.6) & (PY < 100), 1)

    # 4) 髪の束の影（くさび形）とハイライト
    hf = vis("hair_front")
    for (nx, ny) in ctx["bang_tips"][2:-1:2]:  # 前髪の切れ込みから上へ伸びる影
        bump(poly(T([(nx - 1.0, ny + 0.6), (nx + 1.2, ny + 0.6), (nx + 0.6, ny - 5.5)])) & hf, 1)
    for (nx, ny) in [(41, 12.5), (55, 12.5)]:  # 分け目付近の束
        bump(poly(T([(nx - 0.6, ny - 3), (nx + 0.8, ny - 3), (nx + 0.6, ny + 4)])) & hf, 1)
    hs = vis("hair_side")
    for sx in (62.6, 33.4):
        bump(poly(T([(sx - 0.5, 24), (sx + 0.7, 24), (sx + 1.6, 44), (sx + 0.8, 44)])) & hs, 1)
    for sx in (68.0, 28.0):
        bump(poly(T([(sx - 0.4, 22), (sx + 0.6, 22), (sx + 0.6, 40), (sx - 0.2, 40)])) & hb, 1)

    # 天使の輪：頭の丸みに沿ったジグザグの帯。周りより2段明るく（影側では控えめになる）
    ring_lt = np.zeros((H, W), bool)
    ring_hi = np.zeros((H, W), bool)
    for x in range(37, 59):
        t = (x + 0.5 - 48) / 11.0
        seg = (x - 37) % 5            # 5px ごとに1つの束
        if seg == 4:
            continue                  # 束の境目で途切れさせる
        yc = 13.0 + 3.0 * t * t + (0.0, 0.6, 0.9, 0.5)[seg]  # 束ごとに下へ垂れるジグザグ
        x2, y2 = TP(x + 0.5, yc)
        xi, yi = int(x2), int(y2)
        ring_lt[yi, xi] = ring_lt[yi + 1, xi] = True
        if seg in (1, 2):
            ring_hi[yi, xi] = True
    lv[ring_lt & hf] = np.clip(lv[ring_lt & hf] - 2, 1, 4)
    lv[ring_hi & hf] = np.clip(lv[ring_hi & hf] - 1, 0, 4)
    # 天使の輪のすぐ下は頭の丸みが向こうへ回り込むので一段暗く
    under = shift(ring_lt, 0, -2) & ~ring_lt & hf
    bump(under, 1)

    # 服のディテール：段階を上げ下げする（影の中でも皺が見える）
    sk = vis("skirt")
    for k in range(-5, 6):  # プリーツ：谷＝+1段、光源側の折り山＝-1段
        x0, x1 = 48 + k * 1.9, 48 + k * 3.6
        for (px, py) in line_pixels(x0, 64, x1, 89):
            if 0 <= px < W and sk[py, px]:
                lv[py, px] = min(lv[py, px] + 1, 4)
                if px - 1 >= 0 and sk[py, px - 1]:
                    lv[py, px - 1] = max(lv[py, px - 1] - 1, 1)
    for cx_ in (59, 36):  # カーディガンのケーブル編み
        for y in range(52, 77):
            ph = (y - 52) % 4
            for x_ in [cx_ + (0, 1, 1, 0)[ph]] + ([cx_ + 2] if ph == 0 else []):
                if owner[y + bob, x_] == idx["cardigan"]:
                    lv[y + bob, x_] = min(lv[y + bob, x_] + 1, 4)
    cd, sl = vis("cardigan"), vis("sleeves")
    rib = (XX % 2 == 0)
    bump(cd & (PY > 78 + bob) & rib, 1)
    bump(sl & (PY > 81.5 + bob) & rib, 1)
    for sgn in (1, -1):  # 袖のたるみ皺
        cx = 48 + sgn * 17.5
        pts = [(cx - sgn * 2, 62 + bob), (cx, 64.5 + bob), (cx + sgn * 1.5, 63 + bob), (cx - sgn * 0.4, 66 + bob)]
        for a, b in zip(pts, pts[1:]):
            for (px, py) in line_pixels(*a, *b):
                if sl[py, px]:
                    lv[py, px] = min(lv[py, px] + 1, 4)
    so = vis("socks")
    sc = ctx["sock_curve"]
    bump(so & (PY - sc < ctx["sock_top"] + 2.5), 1)
    bump(so & (PY - sc >= ctx["sock_top"] + 2.5) & (PY - sc < ctx["sock_top"] + 3.5) & rib, 1)

    # 5) 段階 → 色
    for i, l in enumerate(layers):
        v = owner == i
        for k in range(5):
            img[v & (lv == k)] = ramp(l.mat, k)
    sh = vis("shoes")
    img[sh & (YY == 140)] = MAT["shoes"]["line"]   # ローファーのベルト
    img[sh & (YY >= 145)] = MAT["shoes"]["s1"]      # 靴底
    # Tシャツのワンポイント（小さなハート）
    for j, row in enumerate([".h.h.", "hhhhh", ".hhh.", "..h.."]):
        for i_, ch in enumerate(row):
            x_, y_ = 49 + i_, 53 + j + bob
            if ch == "h" and owner[y_, x_] == idx["tee"]:
                img[y_, x_] = MAT["bag"]["base"]

    # 6) リムライト：影側（右・下）の輪郭のすぐ内側を淡い寒色で明るく → 背景から浮き上がる
    empty = owner < 0
    for i, l in enumerate(layers):
        if not l.rim:
            continue
        v = owner == i
        r = v & shift(empty, 2, 0) & ~shift(empty, 1, 0) & (lv >= 3)
        img[r] = mix(l.mat["s1"], RIM, 0.45)

    # 7) 輪郭線：上のレイヤー側に1px。光が当たる側は細く見えるよう明るい線、影側は濃い線（線の強弱）
    line_img = img.copy()
    for i, l in enumerate(layers):
        if not l.line:
            continue
        v = owner == i
        edge_empty = np.zeros((H, W), bool)
        edge_lower = np.zeros((H, W), bool)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            valid = shift(np.ones((H, W), bool), dx, dy)
            nb_owner = np.where(valid, shift(owner, dx, dy), -1)
            nb_g = np.where(nb_owner >= 0, grp[np.clip(nb_owner, 0, None)], -1)
            edge_empty |= v & (nb_owner < 0)
            edge_lower |= v & (nb_owner >= 0) & (nb_owner < i) & (nb_g != gid[l.group])
        lit = lam_all > 0.55 if l.vol else np.zeros((H, W), bool)
        soft_line = mix(l.mat["line"], l.mat.get("s2", l.mat["s1"]), 0.55)
        line_img[edge_lower & lit] = l.mat.get("s2", l.mat["s1"])
        line_img[edge_lower & ~lit] = soft_line
        line_img[edge_empty & lit] = soft_line
        line_img[edge_empty & ~lit] = l.mat["line"]
    img = line_img

    # 6) 顔のディテール（文字グリッドのスタンプ）
    def stamp(x0, y0, rows, pal):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != "." and ch in pal:
                    x, y = x0 + i, y0 + j
                    if 0 <= x < W and 0 <= y < H:
                        img[y, x] = pal[ch]

    def at(cx, cy, rows):
        """スタンプの中心 (cx, cy) を頭部の変換に通し、左上の座標を返す。"""
        w, h = max(len(r) for r in rows), len(rows)
        x2, y2 = TP(cx, cy)
        return int(round(x2 - w / 2)), int(round(y2 - h / 2))

    def put(cx, cy, rows, pal):
        stamp(*at(cx, cy, rows), rows, pal)

    eye_open = [
        "..KKKKK.",
        "KKKkkkKK",
        ".KwddddK",
        ".WdddddW",
        ".WdLLPdW",
        ".WdLLPIW",
        ".WIIPPIW",
        ".WIJJGIW",
        "..JGGJ..",
        "...bbb..",
    ]
    eye_half = [
        "........",
        "........",
        "........",
        "..KKKKK.",
        "KKKkkkKK",
        ".WdddddW",
        ".WdLLPIW",
        ".WIJJGIW",
        "..JGGJ..",
        "...bbb..",
    ]
    eye_closed = [
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "KK......",
        ".KKKKKKK",
        "..k..k..",
        "........",
    ]
    rows = {"open": eye_open, "half": eye_half, "closed": eye_closed}[ctx["eyes"]]
    put(41, 29, rows, EYE_PAL)
    # 右目：まぶた・白目の形は左右反転するが、瞳とハイライトの向きは反転しない
    # （反転すると両目のハイライトが内側に寄り、寄り目に見える。光源は左上で共通）
    right = []
    for r in rows:
        m = r[::-1]
        right.append(m[0] + r[2:7] + m[6:] if len(r) == 8 and r[2:7].strip(".") else m)
    put(55, 29, right, EYE_PAL)

    # 眉（前髪越しに透ける）
    put(41.5, 22, ["..EEEE.", ".E....."], FACE_PAL)
    put(54.5, 22, [".EEEE..", ".....E."], FACE_PAL)
    # 鼻・口
    put(48.5, 35.5, ["N"], FACE_PAL)
    put(48, 38, ["M..M", ".MM."], FACE_PAL)
    # 頬（楕円＋斜線）
    put(39, 35.6, [".BBBB", "BCBCB"], FACE_PAL)
    put(57.5, 35.6, ["BBBB.", "BCBCB"], FACE_PAL)

    # 7) 小物
    # ヘアクリップ（キャラの左＝画面右のこめかみに、ピンクのバレッタ＋パール）
    clip_rows = [
        ".ppp...",
        "pPPPpq.",
        "pPhPPPq",
        ".pPPPq.",
        "..qqq..",
    ]
    cx, cy = at(59.5, 17.5, clip_rows)
    stamp(cx, cy, [
        ".ppp...",
        "pPPPpq.",
        "pPhPPPq",
        ".pPPPq.",
        "..qqq..",
    ], {"p": ACC["clip_line"], "P": ACC["clip"], "h": ACC["clip_hi"], "q": ACC["clip_line"]})
    stamp(cx - 2, cy + 4, ["o", "s"], {"o": ACC["pearl"], "s": ACC["pearl_sh"]})
    # 斜めがけストラップ（画面右の肩→画面左の腰のバッグ）
    strap = line_pixels(55, 46 + bob, 39, 73 + bob)
    for (px, py) in strap:
        img[py, px] = ACC["strap"]
    for (px, py) in strap[::5]:
        img[py, px] = ACC["strap_hi"]
    # バッグの金具・ハイライト
    stamp(35, 74 + bob, ["gGGg"], {"g": MAT["bag"]["line"], "G": ACC["gold"]})
    stamp(33, 76 + bob, ["hl", "l."], {"h": MAT["bag"]["hi"], "l": MAT["bag"]["lt"]})
    # カーディガンのボタン（画面右の前立て）
    for by in (52, 59, 66, 73):
        img[by + bob, 55] = ACC["button"]
    # ネックレス（細い金の線＋ペンダント）
    for (px, py) in [(46, 47), (47, 48), (48, 48), (49, 47)]:
        if owner[py + bob, px] == idx["body"] or owner[py + bob, px] == idx["tee"]:
            img[py + bob, px] = ACC["gold"]
    # 靴のつや
    for x0 in (39, 50):
        img[141, x0] = MAT["shoes"]["hi"]
        img[141, x0 + 1] = MAT["shoes"]["lt"]
        img[142, x0] = MAT["shoes"]["lt"]
    # 膝の血色（チーク）
    for x0 in (43, 51):
        img[111, x0] = FACE_PAL["B"]
        img[111, x0 + 1] = FACE_PAL["B"]

    return img


# ---------------------------------------------------------------------------
# 書き出し
# ---------------------------------------------------------------------------
BG_TOP, BG_BOTTOM = (250, 236, 240), (222, 230, 250)


def background(w, h):
    bg = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        t = y / max(1, h - 1)
        c = [int(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3)]
        bg[y, :, :3] = c
        bg[y, :, 3] = 255
    return bg


def composite(sprite, scale, with_bg=True, shadow=True):
    h, w = sprite.shape[:2]
    if with_bg:
        base = background(w, h)
        if shadow:  # 足元の影：薄い楕円＋靴底が接する所の濃い接地影（立体が床に乗っている感）
            m = ((PX - 49) / 15) ** 2 + ((PY - 147.3) / 2.2) ** 2 <= 1
            base[m, :3] = (base[m, :3] * 0.84).astype(np.uint8)
            for cx_ in (42.6, 53.4):
                m2 = ((PX - cx_) / 6.0) ** 2 + ((PY - 147.0) / 1.2) ** 2 <= 1
                base[m2, :3] = (base[m2, :3] * 0.68).astype(np.uint8)
        a = sprite[..., 3:4] / 255.0
        base[..., :3] = (sprite[..., :3] * a + base[..., :3] * (1 - a)).astype(np.uint8)
        out = base
    else:
        out = sprite
    im = Image.fromarray(out, "RGBA")
    return im.resize((w * scale, h * scale), Image.NEAREST)


def main():
    os.makedirs(OUT, exist_ok=True)
    tilt = 4.0
    still = render(tilt=tilt)
    Image.fromarray(still, "RGBA").save(os.path.join(OUT, "mio_1x.png"))
    composite(still, 6).save(os.path.join(OUT, "mio_x6.png"))

    # アイドルアニメ（呼吸＋まばたき）
    seq = [  # (bob, eyes, ms)
        (0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 300),
        (1, "half", 60), (1, "closed", 90), (1, "half", 60), (1, "open", 300),
        (0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 400),
    ]
    frames, durs = [], []
    for bob, eyes, ms in seq:
        frames.append(composite(render(tilt=tilt, bob=bob, eyes=eyes), 4).convert("RGB"))
        durs.append(ms)
    frames[0].save(os.path.join(OUT, "mio_idle_x4.gif"), save_all=True, append_images=frames[1:],
                   duration=durs, loop=0, disposal=1)
    print("wrote", os.listdir(OUT))


if __name__ == "__main__":
    main()
