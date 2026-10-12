"""
現代風の可愛い女性キャラクター「ミオ」のドット絵を、画像生成を使わずに描くスクリプト。

docs/00_ai_pixel_protocol.md の「方式B：図形ラスタライズ方式」の実装例。
  0. 骨格（関節の位置＝ポーズ）を比率表から決め、骨に解剖学的な太さで肉付けする（docs/09）
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

W, H = 96, 176
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
    "strap":    dict(line="#8a3a5a", s2="#9a4066", s1="#a84a72", base="#c45a82"),
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


def sym(right_half, c=48.0):
    """右半分の点列（上→下）から左右対称の閉じた点列を作る（中心 x=c）。"""
    left = [(2 * c - x, y) for (x, y) in reversed(right_half)]
    return right_half + left


def mirror_pts(points, c=48.0):
    return [(2 * c - x, y) for (x, y) in points]


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
                 ao=True, strong=False):
        self.name, self.mask, self.mat = name, mask, mat
        self.group = group or name
        self.shade = shade      # vol が無いときの簡易影：オフセットマスクのずらし量 (dx, dy)
        self.line = line
        # 立体の形（docs/08）：[(マスク, 重み, "sphere" | "cyl"[, 縁の丸み px]), ...]
        self.vol = vol
        self.bias = bias        # 明るさの補正（顔は影を少なく＝プラス）
        self.rim = rim          # 影側の輪郭の内側にリムライトを入れる
        self.ao = ao            # 手前のパーツと接する所を暗くする（オクルージョン）
        self.strong = strong    # 他のパーツに重なる縁を常に濃い線にする（前後関係をはっきり見せる）


# ---------------------------------------------------------------------------
# 骨格とポーズ（docs/09）
#   1. 比率表から各関節の高さを決める（頭の高さ HEAD を単位に、全身 約5.4頭身）
#   2. コントラポスト：右脚（画面左）に体重 → 骨盤は画面左が上がり、肩は逆に画面左が下がる
#      首の付け根（頸窩）の真下に体重を支える足を置く（重心線）
#   3. 関節をつないだ「骨」に、解剖学的な太さの表（筋肉のふくらみの位置）で肉付けする
# ---------------------------------------------------------------------------
CX = 47.5                     # 体の中心線（キャンバス 96px の中央）
SKULL_TOP, CHIN = 13.9, 42.6  # 頭頂と顎（HEAD = 28.7px）
SOLE = 168.6                  # 足裏
SH_TILT = math.radians(-5.7)  # 肩の線の傾き（画面左が下がる）
PEL_TILT = math.radians(5.9)  # 骨盤の傾き（画面左＝体重側が上がる）

POSE = {
    "neck_pit":   (47.5, 49.5),   # 頸窩（首の付け根の中央のくぼみ）。この真下に支持脚の足
    "head_pivot": (47.5, 44.6),   # 頭と首の関節（頭を傾ける中心）
    "shoulder_L": (31.6, 51.6), "shoulder_R": (63.4, 48.4),
    "elbow_L":    (29.6, 78.5), "elbow_R":    (67.6, 75.5),   # 肘＝ウエストの高さ
    "wrist_L":    (34.0, 92.5), "wrist_R":    (58.0, 60.5),   # 左手首は股の高さ（バッグの上）
    "pelvis":     (47.0, 89.0),
    "hip_L":      (39.7, 87.3), "hip_R":      (54.3, 88.8),
    "crotch":     (47.2, 93.0),
    "knee_L":     (43.0, 127.0), "knee_R":    (51.3, 127.5),  # 遊脚（画面右）の膝は内側・前へ
    "ankle_L":    (45.0, 160.5), "ankle_R":   (55.0, 158.0),  # 遊脚はかかとを少し上げる
}
# 骨の長さ（px、HEAD=28.7）。ポーズを付けても骨は伸び縮みしない。画面上の長さは
# 「こちらへ向かう骨ほど短く見える（短縮）」ので、この長さ以下でなければならない（docs/09 9-4）
BONES = {
    "upper_arm": 28.5,  # 上腕 ≒ 1.0 頭
    "forearm": 21.0,    # 前腕 ≒ 0.73 頭
    "hand": 12.0,       # 手 ≒ 0.42 頭（実際の比率より小さめ＝可愛く見せるデフォルメ）
    "thigh": 39.5,      # 大腿 ≒ 1.38 頭
    "shin": 34.5,       # 下腿 ≒ 1.2 頭
}
HEAD_TILT = 6.0  # 頭の傾き（度）。肩の線と逆向きに傾け、頭・肩・腰の線をジグザグにする

# 肉付けの太さ（骨の中心から外側・内側への距離 px、t=0 が付け根、t=1 が先端）
# 太ももは外側がなだらか、内側は膝上でふくらむ。ふくらはぎは内側が高く大きい（docs/01 1-3）
THIGH_OUT = [(0, 6.6), (0.15, 6.5), (0.5, 5.5), (0.85, 4.1), (1, 3.6)]
THIGH_IN = [(0, 5.4), (0.25, 5.2), (0.6, 4.5), (0.85, 3.9), (1, 3.3)]
SHIN_OUT = [(0, 3.4), (0.28, 3.9), (0.45, 3.7), (0.78, 2.3), (1, 2.0)]
SHIN_IN = [(0, 3.2), (0.18, 4.3), (0.36, 4.0), (0.78, 2.2), (1, 2.0)]
# オーバーサイズの袖（腕より太い筒。袖口は広がり、手の甲まで隠す＝萌え袖）
SLEEVE_UP = [(0, 4.8), (0.5, 4.5), (1, 4.2)]
SLEEVE_FORE = [(0, 4.0), (0.55, 4.3), (1, 5.2)]


def clean(mask):
    """多数決フィルタ：周囲9マスの過半数で塗り直し、輪郭の1pxのガタつき・出っ張りを消す。"""
    s = sum(shift(mask, dx, dy).astype(int) for dx in (-1, 0, 1) for dy in (-1, 0, 1))
    return s >= 5


def segment(a, b, left, right, ext_a=0.0, ext_b=0.0, n=12):
    """関節 a→b の骨に沿って肉付けした多角形のマスク。
    left / right は骨の進行方向に対する左右の太さの表（下向きの骨なら left＝画面左）。"""
    ax, ay = a
    bx, by = b
    length = math.hypot(bx - ax, by - ay)
    ux, uy = (bx - ax) / length, (by - ay) / length
    nx, ny = -uy, ux      # 進行方向の左
    ax, ay = ax - ux * ext_a, ay - uy * ext_a
    length += ext_a + ext_b
    lp, rp = [], []
    for i in range(n + 1):
        t = i / n
        s = t * length
        cx, cy = ax + ux * s, ay + uy * s
        tl = np.interp(t, *zip(*left))
        tr = np.interp(t, *zip(*right))
        lp.append((cx + nx * tl, cy + ny * tl))
        rp.append((cx - nx * tr, cy - ny * tr))
    return poly(catmull(lp, False, 3) + catmull(rp[::-1], False, 3))


def torso_xf(points, bob=0):
    """胴体の座標変換：左右対称に描いた胴を、肩は SH_TILT、骨盤は PEL_TILT に傾ける。
    間の高さでは角度をなめらかに変える（体重側の脇腹が縮み、反対側が伸びる）。"""
    out = []
    for x, y in points:
        t = min(1.0, max(0.0, (y - 52) / 32))
        a = SH_TILT * (1 - t) + PEL_TILT * t
        ts = min(1.0, max(0.0, (y - 49.5) / 39.5))
        cx = 47.5 * (1 - ts) + 47.0 * ts
        dx = x - CX
        out.append((cx + dx * math.cos(a), y + dx * math.sin(a) + (bob if y < 84 else bob * max(0, (92 - y) / 8))))
    return out


HEAD_SCALE = 1.04


def head_xf(tilt, bob):
    """頭部パーツ用の座標変換。元の頭の座標（首の関節 (48, 42)）を POSE の位置へ移し、拡大・傾ける。
    grav=True（髪）のときは顎より下ほど傾きを弱める：髪の毛先は重力で真下に垂れる。"""
    hx_, hy_ = POSE["head_pivot"]

    def f(points, grav=False):
        out = []
        for x, y in points:
            w = 1.0
            if grav:
                w = 1.0 - 0.75 * min(1.0, max(0.0, (y - 36) / 12))
            a = math.radians(tilt) * w
            ca, sa = math.cos(a), math.sin(a)
            dx, dy = (x - 48.0) * HEAD_SCALE, (y - 42.0) * HEAD_SCALE
            out.append((hx_ + dx * ca - dy * sa, hy_ + dx * sa + dy * ca + bob))
        return out

    def p(x, y):
        return f([(x, y)])[0]

    return f, p


def build(tilt=HEAD_TILT, bob=0, eyes="open"):
    T, TP = head_xf(tilt, bob)

    def G(points):  # 髪：重力で毛先は真下へ
        return T(points, grav=True)

    def TX(points):  # 胴体
        return torso_xf(points, bob)

    def J(name, up=True):  # 関節の位置（上半身は呼吸で上下）
        x, y = POSE[name]
        return (x, y + (bob if up else 0))

    L = []

    # --- 1. 後ろ髪（外ハネボブ） ------------------------------------------
    back = sym([(48, 7.6), (55, 8.2), (60.6, 11), (63.4, 15.5), (64.4, 21), (64.6, 28), (64.8, 35),
                (65.8, 41), (68.4, 45.4), (71.4, 47.8), (70.4, 50), (66.6, 50.2), (63, 48.6), (60, 46)])
    hair_back = smooth(G(back))
    L.append(Layer("hair_back", hair_back, MAT["hair"], group="hair", rim=True))
    inner_r = [(53, 41), (59.5, 40.5), (62.2, 44), (64.8, 48.2), (60, 48.6), (56, 47.4), (53.2, 45.4)]
    inner = smooth(G(inner_r)) | smooth(G(mirror_pts(inner_r)))
    L.append(Layer("hair_inner", inner, MAT["inner"], group="hair", bias=-0.25))

    # --- 2. 脚（骨＋肉付け）・ソックス・靴 ----------------------------------
    #   支持脚（画面左）を先に、遊脚（画面右、膝が前に出る）を手前に描く
    legs = {}
    for side, out_left in (("L", True), ("R", False)):
        hip, knee, ankle = POSE["hip_" + side], POSE["knee_" + side], POSE["ankle_" + side]
        lt, rt = (THIGH_OUT, THIGH_IN) if out_left else (THIGH_IN, THIGH_OUT)
        ls, rs = (SHIN_OUT, SHIN_IN) if out_left else (SHIN_IN, SHIN_OUT)
        m = segment(hip, knee, lt, rt, ext_a=5) | segment(knee, ankle, ls, rs, ext_b=2)
        m |= ellipse(knee[0], knee[1], 3.5, 3.0)
        legs[side] = clean(m)

    def sock_mask(leg, kx, top):
        curve = 1.3 * np.clip(1 - ((PX - kx) / 4.2) ** 2, 0, 1)  # 脚に巻きつく弧（クロスコンター）
        return leg & (PY > top + curve)

    shoe_l = [(41.6, 158.4), (47.8, 158.4), (48.8, 161), (49.4, 164.6), (49.0, 168.6), (40.0, 168.6),
              (39.6, 164.6), (40.4, 161)]
    # 遊脚はつま先立ち気味で内向き（内股）：正面から見ると縦に長く、つま先が内側を向く
    shoe_r = [(52.6, 155.4), (57.6, 155.4), (58.2, 158.6), (57.6, 162.6), (56.2, 166.6), (54.8, 168.4),
              (51.8, 168.4), (51.2, 166.4), (51.8, 162.4), (52.2, 158.6)]
    sock_top = {"L": 141.0, "R": 139.5}
    for side, shoe_pts, name in (("L", shoe_l, "w"), ("R", shoe_r, "f")):
        leg = legs[side]
        ank = POSE["ankle_" + side]
        L.append(Layer("leg_" + name, leg, MAT["skin"], group="skin_leg_" + name,
                       vol=[(leg, 1.0, "cyl")], rim=True, bias=-0.12))
        so = sock_mask(leg, ank[0] - (1.0 if side == "L" else 1.6), sock_top[side])
        L.append(Layer("socks_" + name, so, MAT["socks"], vol=[(leg, 1.0, "cyl")], rim=True))
        sh = smooth(shoe_pts, 4)
        L.append(Layer("shoe_" + name, sh, MAT["shoes"], vol=[(sh, 1.0, "sphere")]))

    # --- 3. 体（首・デコルテ） ----------------------------------------------
    body = sym([(47.5, 34), (51.7, 34), (51.7, 45.5), (53.2, 48.6), (57.5, 49.8), (61, 51.5), (62, 56),
                (60, 66), (59, 76), (47.5, 78)], CX)
    body_m = smooth(TX(body))
    L.append(Layer("body", body_m, MAT["skin"], group="skin", vol=[(body_m & (PY < 50 + bob), 1.0, "cyl")]))

    # --- 4. インナー（白T） -------------------------------------------------
    tee = sym([(47.5, 51.6), (50.2, 51.2), (52.4, 49.5), (57, 50.3), (60.5, 53), (61, 60), (58.8, 68),
               (57.8, 76), (57.8, 81), (47.5, 81)], CX)
    tee_m = smooth(TX(tee))
    tee_layer = Layer("tee", tee_m, MAT["tee"])
    L.append(tee_layer)

    # --- 5. スカート（骨盤と一緒に傾く。裾は中央が下がる弧＋プリーツのジグザグ）
    skirt_side = [(47.5, 77.5), (56.4, 77.5), (58.6, 84), (61.4, 92), (64.4, 100), (65.4, 102.0)]
    hem = []
    for k in range(5, -6, -1):
        x = CX + k * 3.6
        hem += [(x + 1.8, 102.9), (x, 101.7)] if k > -5 else [(x + 1.8, 102.9)]
    hem = [(x, y + 1.6 * max(0.0, 1 - ((x - CX) / 17.4) ** 2)) for x, y in hem]
    side_c = catmull(skirt_side, False, 4)
    skirt_local = side_c + hem + [(2 * CX - x, y) for x, y in reversed(side_c)]
    skirt_m = poly(torso_xf(skirt_local, 0))
    L.append(Layer("skirt", skirt_m, MAT["skirt"], vol=[(skirt_m, 1.0, "cyl")], rim=True))

    # --- 6. カーディガン（オーバーサイズ、前開き、ドロップショルダー） -------
    card_r = [(53.0, 49.2), (57.5, 50.0), (62.6, 51.4), (65.2, 54.5), (64.4, 62), (63.8, 70),
              (64.0, 80), (64.4, 89.4), (59, 90.0), (55.6, 89.8), (54.8, 80), (54.6, 70), (55.0, 60),
              (53.6, 54)]
    card_rm, card_lm = smooth(TX(card_r)), smooth(TX(mirror_pts(card_r, CX)))
    card = card_rm | card_lm
    # 立体の形は服のシルエットではなく中身の胴体で決める
    torso = smooth(TX(sym([(47.5, 48), (55, 48.6), (59.2, 51.6), (59.8, 59), (58.4, 67), (58.6, 75),
                           (59.4, 88), (47.5, 89)], CX)))
    torso_vol = [(torso, 1.0, "cyl"), (torso, 0.4, "sphere")]
    tee_layer.vol = torso_vol + [(tee_m, 0.15, "sphere")]
    L.append(Layer("cardigan", card, MAT["cardigan"], rim=True,
                   vol=torso_vol + [(card_rm, 0.35, "sphere"), (card_lm, 0.35, "sphere")]))

    # --- 7. 斜めがけのストラップ（画面右の肩 → 画面左の腰のバッグ） ----------
    s0, s1 = (59.6, 49.6 + bob), (42.0, 93.4 + bob)
    strap = segment(s0, s1, [(0, 0.85), (1, 0.85)], [(0, 0.85), (1, 0.85)])
    L.append(Layer("strap", strap, MAT["strap"], line=False))

    # --- 8. バッグ ------------------------------------------------------------
    bag = smooth([(31.8, 92.8 + bob), (42.2, 92.8 + bob), (43.0, 94.4 + bob), (42.8, 101.2 + bob),
                  (41.6, 102.4 + bob), (32.4, 102.4 + bob), (31.2, 101.2 + bob), (31.0, 94.4 + bob)], 4)
    L.append(Layer("bag", bag, MAT["bag"], vol=[(bag, 1.0, "sphere")]))

    # --- 9. 手：右手（画面右）はストラップを握る、左手はバッグの上に添える ------
    def fore_dir(side):
        (ex, ey), (wx, wy) = POSE["elbow_" + side], POSE["wrist_" + side]
        d = math.hypot(wx - ex, wy - ey)
        return (wx - ex) / d, (wy - ey) / d

    ux, uy = fore_dir("R")
    wx, wy = J("wrist_R")
    hand_r = ellipse(wx + ux * 3.8, wy + uy * 3.8, 3.0, 2.8)
    ux, uy = fore_dir("L")
    wx, wy = J("wrist_L")
    hand_l = ellipse(wx + ux * 3.0, wy + uy * 3.0, 3.0, 2.4)
    hands = Layer("hands", hand_r | hand_l, MAT["skin"], group="skin_hand", strong=True,
                  vol=[(hand_r, 1.0, "sphere"), (hand_l, 1.0, "sphere")])

    # --- 10. 袖（腕の骨に沿った筒）。上腕と前腕は別パーツにして、前腕を手前に重ねる
    #   （同じパーツにすると、曲げた腕の「く」の字が1つの塊に潰れる）
    up, fore = {}, {}
    for side, sgn in (("L", -1), ("R", 1)):
        sx, sy = J("shoulder_" + side)
        top = (sx - sgn * 1.2, sy + 1.2)
        el, wr = J("elbow_" + side), J("wrist_" + side)
        up[side] = segment(top, el, SLEEVE_UP, SLEEVE_UP, ext_a=1.5) | ellipse(el[0], el[1], 4.2, 4.2) \
            | ellipse(top[0], top[1] + 1, 4.8, 4.6)
        fore[side] = segment(el, wr, SLEEVE_FORE, SLEEVE_FORE, ext_a=1.0, ext_b=1.8) | ellipse(el[0], el[1], 4.0, 4.0)
    L.append(Layer("sleeve_up", up["L"] | up["R"], MAT["cardigan"], rim=True,
                   vol=[(up["L"], 1.0, "cyl"), (up["R"], 1.0, "cyl")]))
    L.append(hands)
    L.append(Layer("sleeve_fore", fore["L"] | fore["R"], MAT["cardigan"], rim=True, strong=True,
                   vol=[(fore["L"], 1.0, "cyl"), (fore["R"], 1.0, "cyl")]))
    sleeves = fore

    # --- 11. 顔 -------------------------------------------------------------
    face = sym([(48, 12.5), (54, 13.2), (58.5, 15.5), (60.4, 19.5), (60.8, 24), (60.5, 27),
                (59.9, 30.5), (58.6, 33.4), (56.6, 36), (54.0, 38.3), (51.2, 39.7), (48.6, 40.1)])
    face_m = smooth(T(face))
    L.append(Layer("face", face_m, MAT["skin"], group="skin_face", vol=[(face_m, 1.0, "sphere", 4)],
                   bias=0.05, ao=False))

    # --- 12. 横髪・前髪・アホ毛 ----------------------------------------------
    side_r = [(57.2, 15.5), (61.4, 16), (64.0, 21), (65.0, 29), (65.4, 37), (66.4, 43.4),
              (69.4, 47.2), (67.0, 48.6), (63.0, 47.0), (60.2, 44), (58.8, 39), (58.6, 33), (58.8, 24)]
    side = smooth(G(side_r)) | smooth(G(mirror_pts(side_r)))
    L.append(Layer("hair_side", side, MAT["hair"], group="hair_f", rim=True))
    bang_tips = [(61.2, 19.0), (60.0, 23.4), (58.2, 19.6), (55.8, 23.8), (54.0, 19.2), (51.4, 23.4),
                 (49.6, 20.0), (47.4, 25.8), (46.0, 20.4), (43.6, 23.8), (41.6, 19.4), (39.2, 23.8),
                 (37.4, 19.6), (36.2, 23.0), (34.8, 19.0)]
    crown = [(35.0, 17.5), (36.4, 12.6), (41.0, 9.0), (48.0, 7.8), (55.0, 9.0), (59.6, 12.6), (61.2, 17.5)]
    bangs = poly(catmull(T(crown), False, 6) + T(bang_tips))  # 毛先はジグザグを保つため直線で結ぶ
    L.append(Layer("hair_front", bangs, MAT["hair"], group="hair_f", rim=True))
    ahoge = poly(T([(48.0, 8.6), (49.0, 5.6), (51.4, 3.2), (54.2, 3.0), (52.0, 4.4), (50.4, 6.4), (49.8, 8.6)]))
    L.append(Layer("ahoge", ahoge, MAT["hair"], group="hair_f"))

    head_ball = hair_back | side | bangs
    for l in L:
        if l.name in ("hair_back", "ahoge", "hair_inner"):
            l.vol = [(head_ball, 1.0, "sphere")]
        elif l.name == "hair_side":
            l.vol = [(head_ball, 1.0, "sphere"), (side, 0.5, "cyl")]
        elif l.name == "hair_front":
            l.vol = [(head_ball, 1.0, "sphere"), (bangs, 0.3, "sphere")]

    ctx = dict(T=T, TP=TP, G=G, TX=TX, J=J, bob=bob, eyes=eyes, bang_tips=bang_tips, sock_top=sock_top,
               legs=legs, sleeves=sleeves, card=card, strap=(s0, s1))
    return L, ctx


# ---------------------------------------------------------------------------
# レンダリング
# ---------------------------------------------------------------------------
def render(tilt=HEAD_TILT, bob=0, eyes="open"):
    layers, ctx = build(tilt, bob, eyes)
    idx = {l.name: i for i, l in enumerate(layers)}
    owner = np.full((H, W), -1, int)
    for i, l in enumerate(layers):
        owner[l.mask] = i
    img = np.zeros((H, W, 4), np.uint8)

    def vis(*names):
        m = np.zeros((H, W), bool)
        for n in names:
            m |= owner == idx[n]
        return m

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
            lam -= 0.10 * np.clip((PY - 70) / 95, 0, 1)  # 環境光は上から：下ほど少し暗く
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

    cast(["hair_front", "ahoge"], "face", 1, 2)
    cast(["hair_side"], "face", 1, 1)
    cast(["face"], "body", 0, 3)
    cast(["face"], "body", 1, 1, 4)
    cast(["hair_side", "hair_back"], "body", 1, 2)
    for r in ("cardigan", "sleeve_up", "tee"):
        cast(["hair_side"], r, 1, 2)
    cast(["cardigan"], "tee", 2, 1)
    cast(["strap"], "tee", 1, 1)
    cast(["strap"], "cardigan", 1, 1)
    cast(["cardigan", "sleeve_up", "sleeve_fore"], "skirt", 1, 2, 4)
    for leg in ("leg_w", "leg_f"):
        cast(["skirt"], leg, 1, 3)
        cast(["skirt"], leg, 0, 1, 4)
    cast(["leg_f"], "leg_w", 1, 1)
    cast(["sleeve_fore"], "hands", 0, 2)
    cast(["sleeve_up", "sleeve_fore"], "cardigan", 2, 1)
    cast(["sleeve_fore"], "tee", 2, 2)
    cast(["sleeve_fore"], "strap", 2, 2)
    cast(["sleeve_fore"], "sleeve_up", 1, 1)
    cast(["sleeve_fore"], "bag", 1, 1)
    cast(["hands"], "bag", 0, 1)
    cast(["bag"], "skirt", 1, 1, 4)
    cast(["bag"], "cardigan", 1, 1)

    T, TP, G, TX = ctx["T"], ctx["TP"], ctx["G"], ctx["TX"]
    bob = ctx["bob"]

    def bump(mask, d):
        lv[mask] = np.clip(lv[mask] + d, 0, 4)

    # 後ろ髪の内側（顔の横〜首）は奥にあるので暗く（奥＝暗い＝遠い）
    hb = vis("hair_back")
    m1 = hb & poly(G([(33, 30), (63, 30), (63, 54), (33, 54)]))
    lv[m1] = np.maximum(lv[m1], 3)
    lv[hb & poly(G([(37, 37), (59, 37), (59, 54), (37, 54)]))] = 4
    hi_ = vis("hair_inner")
    lv[hi_ & poly(G([(41, 36), (55, 36), (55, 54), (41, 54)]))] = 4
    for sx in (58.5, 61.5, 37.5, 34.5):  # インナーカラーにも毛束の筋
        bump(poly(G([(sx - 0.4, 40), (sx + 0.5, 40), (sx + (1.6 if sx > 48 else -0.6), 48.6),
                     (sx + (0.8 if sx > 48 else -1.4), 48.6)])) & hi_, 1)
    # 脚どうしが接する所（太ももの内側）
    lw, lf = ctx["legs"]["L"], ctx["legs"]["R"]
    near = lambda m: m | shift(m, 1, 0) | shift(m, -1, 0)
    bump(vis("leg_w") & near(lf) & (PY < 112), 1)

    # 4) 髪の束の影（くさび形）とハイライト
    hf = vis("hair_front")
    for (nx, ny) in ctx["bang_tips"][2:-1:2]:
        bump(poly(T([(nx - 1.0, ny + 0.6), (nx + 1.2, ny + 0.6), (nx + 0.6, ny - 5.5)])) & hf, 1)
    for (nx, ny) in [(41, 12.5), (55, 12.5)]:
        bump(poly(T([(nx - 0.6, ny - 3), (nx + 0.8, ny - 3), (nx + 0.6, ny + 4)])) & hf, 1)
    hs = vis("hair_side")
    for sx in (62.6, 33.4):
        bump(poly(G([(sx - 0.5, 24), (sx + 0.7, 24), (sx + 1.6, 44), (sx + 0.8, 44)])) & hs, 1)
    for sx in (68.0, 28.0):
        bump(poly(G([(sx - 0.4, 22), (sx + 0.6, 22), (sx + 0.6, 40), (sx - 0.2, 40)])) & hb, 1)
    ring_lt = np.zeros((H, W), bool)
    ring_hi = np.zeros((H, W), bool)
    for x in range(37, 59):
        t = (x + 0.5 - 48) / 11.0
        seg = (x - 37) % 5
        if seg == 4:
            continue
        yc = 13.0 + 3.0 * t * t + (0.0, 0.6, 0.9, 0.5)[seg]
        x2, y2 = TP(x + 0.5, yc)
        xi, yi = int(x2), int(y2)
        ring_lt[yi, xi] = ring_lt[yi + 1, xi] = True
        if seg in (1, 2):
            ring_hi[yi, xi] = True
    lv[ring_lt & hf] = np.clip(lv[ring_lt & hf] - 2, 1, 4)
    lv[ring_hi & hf] = np.clip(lv[ring_hi & hf] - 1, 0, 4)
    bump(shift(ring_lt, 0, -2) & ~ring_lt & hf, 1)

    # 服のディテール：段階を上げ下げする（影の中でも皺が見える）
    sk = vis("skirt")
    for k in range(-5, 6):  # プリーツ：骨盤と同じ変換で、ウエストから裾へ放射状
        (x0, y0), (x1, y1) = torso_xf([(CX + k * 1.9, 78.2), (CX + k * 3.6, 103.0)], 0)
        for (px, py) in line_pixels(x0, y0, x1, y1):
            if 0 <= px < W and 0 <= py < H and sk[py, px]:
                lv[py, px] = min(lv[py, px] + 1, 4)
                if px - 1 >= 0 and sk[py, px - 1]:
                    lv[py, px - 1] = max(lv[py, px - 1] - 1, 1)
    cd = vis("cardigan")
    for cx_ in (58.5, 35.5):  # ケーブル編み（胴の変換に沿って）
        for y in range(56, 87):
            ph = (y - 56) % 4
            for xo in [(0, 1, 1, 0)[ph]] + ([2] if ph == 0 else []):
                (px, py), = TX([(cx_ + xo + 0.5, y + 0.5)])
                px, py = int(px), int(py)
                if cd[py, px]:
                    lv[py, px] = min(lv[py, px] + 1, 4)
    rib = (XX % 2 == 0)
    card = ctx["card"]
    bump(cd & ~shift(card, 0, 3) & rib, 1)   # 裾のリブ（カーディガンの下端から3px）
    sl = vis("sleeve_fore")
    for side in ("L", "R"):  # 袖口のリブ：前腕の軸方向に測って袖の先端から3px
        (ex, ey), (wx, wy) = ctx["J"]("elbow_" + side), ctx["J"]("wrist_" + side)
        d = math.hypot(wx - ex, wy - ey)
        ux, uy = (wx - ex) / d, (wy - ey) / d
        s = (PX - ex) * ux + (PY - ey) * uy
        cuff = sl & ctx["sleeves"][side] & (s > d + 1.8 - 3.0)
        bump(cuff & (((PX - ex) * -uy + (PY - ey) * ux).astype(int) % 2 == 0), 1)
    # 肘の内側の皺（曲げた右腕はジグザグに溜まる、伸ばした左腕は浅い皺）
    slu = vis("sleeve_up", "sleeve_fore")
    for (pts, side) in (([(68.4, 68.5), (66.6, 70.6), (68.8, 72.2)], "R"),
                        ([(31.6, 75.5), (29.6, 77.6), (31.4, 79.2)], "L")):
        pts = [(x, y + bob) for x, y in pts]
        for a, b in zip(pts, pts[1:]):
            for (px, py) in line_pixels(*a, *b):
                if slu[py, px]:
                    lv[py, px] = min(lv[py, px] + 1, 4)
    for name, side in (("socks_w", "L"), ("socks_f", "R")):  # ソックスの口ゴム
        so = vis(name)
        top = so & ~shift(so, 0, -2)
        bump(top, 1)
        bump(so & ~top & ~shift(so, 0, -4) & rib, 1)

    # 5) 段階 → 色
    for i, l in enumerate(layers):
        v = owner == i
        for k in range(5):
            img[v & (lv == k)] = ramp(l.mat, k)
    for name in ("shoe_w", "shoe_f"):
        sh = vis(name)
        img[sh & ~shift(sh, 0, 2)] = MAT["shoes"]["s1"]                      # 靴底
        band = sh & ~shift(sh, 0, -3) & shift(sh, 0, -2)                     # ローファーのベルト
        img[band] = MAT["shoes"]["line"]
    for j, row in enumerate([".h.h.", "hhhhh", ".hhh.", "..h.."]):          # Tシャツのハート
        for i_, ch in enumerate(row):
            (x_, y_), = TX([(43.5 + i_ + 0.5, 57 + j + 0.5)])
            x_, y_ = int(x_), int(y_)
            if ch == "h" and owner[y_, x_] == idx["tee"]:
                img[y_, x_] = MAT["bag"]["base"]

    # 6) リムライト
    empty = owner < 0
    for i, l in enumerate(layers):
        if not l.rim:
            continue
        v = owner == i
        r = v & shift(empty, 2, 0) & ~shift(empty, 1, 0) & (lv >= 3)
        img[r] = mix(l.mat["s1"], RIM, 0.45)

    # 7) 輪郭線（線の強弱：明部は明るい線、影は濃い線）
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
        if l.strong:
            line_img[edge_lower] = l.mat["line"]
        else:
            line_img[edge_lower & lit] = l.mat.get("s2", l.mat["s1"])
            line_img[edge_lower & ~lit] = soft_line
        line_img[edge_empty & lit] = soft_line
        line_img[edge_empty & ~lit] = l.mat["line"]
    img = line_img

    # 8) 顔のディテール（文字グリッドのスタンプ）
    def stamp(x0, y0, rows, pal):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != "." and ch in pal:
                    x, y = x0 + i, y0 + j
                    if 0 <= x < W and 0 <= y < H:
                        img[y, x] = pal[ch]

    def at(cx, cy, rows):
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
    right = []  # 右目：まぶたの形だけ反転し、瞳とハイライトの向きは共通（寄り目防止）
    for r in rows:
        m = r[::-1]
        right.append(m[0] + r[2:7] + m[6:] if len(r) == 8 and r[2:7].strip(".") else m)
    put(55, 29, right, EYE_PAL)
    put(41.5, 22, ["..EEEE.", ".E....."], FACE_PAL)
    put(54.5, 22, [".EEEE..", ".....E."], FACE_PAL)
    # 鼻と口は v2 より上へ（口が顎に近すぎた：口は頭の高さの 0.87 付近、docs/09 9-2）
    put(48.5, 34.6, ["N"], FACE_PAL)
    put(48, 36.6, ["M..M", ".MM."], FACE_PAL)
    put(39, 35.2, [".BBBB", "BCBCB"], FACE_PAL)
    put(57.5, 35.2, ["BBBB.", "BCBCB"], FACE_PAL)

    # 9) 小物
    clip_rows = [".ppp...", "pPPPpq.", "pPhPPPq", ".pPPPq.", "..qqq.."]
    cx, cy = at(59.5, 17.5, clip_rows)
    stamp(cx, cy, clip_rows, {"p": ACC["clip_line"], "P": ACC["clip"], "h": ACC["clip_hi"], "q": ACC["clip_line"]})
    stamp(cx - 2, cy + 4, ["o", "s"], {"o": ACC["pearl"], "s": ACC["pearl_sh"]})
    st = vis("strap")
    (sx0, sy0), (sx1, sy1) = ctx["strap"]
    for (px, py) in line_pixels(sx0, sy0, sx1, sy1)[2::6]:
        if st[py, px]:
            img[py, px] = ACC["strap_hi"]
    stamp(35, 93 + bob, ["gGGg"], {"g": MAT["bag"]["line"], "G": ACC["gold"]})
    bg_ = vis("bag")
    for (px, py, c) in ((39, 96, MAT["bag"]["hi"]), (40, 96, MAT["bag"]["lt"]), (39, 97, MAT["bag"]["lt"])):
        if bg_[py + bob, px]:
            img[py + bob, px] = c
    for by in (57, 64, 71, 78, 85):  # カーディガンのボタン
        (px, py), = TX([(55.9, by + 0.5)])
        if cd[int(py), int(px)]:
            img[int(py), int(px)] = ACC["button"]
    for (nx_, ny_) in [(45.5, 50.8), (46.5, 51.6), (47.5, 51.9), (48.5, 51.6), (49.5, 50.8)]:  # ネックレス
        (px, py), = TX([(nx_, ny_)])
        px, py = int(px), int(py)
        if owner[py, px] in (idx["body"], idx["tee"]):
            img[py, px] = ACC["gold"]
    # 右手の指（ストラップを握る指の境目）
    (ex, ey), (wx, wy) = ctx["J"]("elbow_R"), ctx["J"]("wrist_R")
    d = math.hypot(wx - ex, wy - ey)
    ux, uy = (wx - ex) / d, (wy - ey) / d
    hx0, hy0 = wx + ux * 3.8, wy + uy * 3.8
    hn = vis("hands")
    for k in (-1, 1):
        px, py = int(hx0 + k * 1.2 - 0.6), int(hy0 - 0.5)
        if hn[py, px]:
            img[py, px] = MAT["skin"]["s2"]
    for name, (x0, y0) in (("shoe_w", (42, 161)), ("shoe_f", (53, 158))):  # 靴のつや
        sh = vis(name)
        for (px, py, c) in ((x0, y0, MAT["shoes"]["hi"]), (x0 + 1, y0, MAT["shoes"]["lt"]), (x0, y0 + 1, MAT["shoes"]["lt"])):
            if sh[py, px]:
                img[py, px] = c
    for side, name in (("L", "leg_w"), ("R", "leg_f")):  # 膝の血色
        kx, ky = POSE["knee_" + side]
        lg = vis(name)
        for px in (int(kx) - 1, int(kx)):
            if lg[int(ky) - 1, px]:
                img[int(ky) - 1, px] = FACE_PAL["B"]

    return img


# ---------------------------------------------------------------------------
# 比率のチェック（docs/09 9-0 の表を作るための計測）
# ---------------------------------------------------------------------------
def report():
    T, TP = head_xf(HEAD_TILT, 0)
    top, chin = TP(48, 12.5)[1], TP(48, 40.1)[1]
    head = chin - top
    total = SOLE - top
    P = POSE
    rows = [
        ("頭身（全身 ÷ 頭の高さ）", total / head),
        ("股の位置（頭頂からの割合）", (P["crotch"][1] - top) / total),
        ("膝（股〜足裏の中での位置）", (P["knee_L"][1] - P["crotch"][1]) / (SOLE - P["crotch"][1])),
        ("首の長さ（顎〜頸窩 ÷ 頭の高さ）", (P["neck_pit"][1] - chin) / head),
        ("肘の高さ − ウエストの高さ (px)", P["elbow_L"][1] - 78.0),
        ("上腕の長さ ÷ 頭の高さ", math.dist(P["shoulder_R"], P["elbow_R"]) / head),
        ("肩幅 ÷ 顔の幅", (P["shoulder_R"][0] - P["shoulder_L"][0] + 5) / (25.0 * HEAD_SCALE)),
        ("目の中心（頭頂からの割合）", (TP(41, 29)[1] - top) / head),
        ("口（頭頂からの割合）", (TP(48, 36.6)[1] - top) / head),
        ("頸窩の x − 支持脚の足首の x (px)", P["neck_pit"][0] - P["ankle_L"][0]),
    ]
    reach = P["shoulder_L"][1] + BONES["upper_arm"] + BONES["forearm"] + BONES["hand"]
    rows.append(("腕を真下に伸ばしたときの指先 − 股 (px)", reach - P["crotch"][1]))
    for k, v in rows:
        print(f"{k}: {v:.2f}")
    print("骨の画面上の長さ ÷ 骨の長さ（1.03 を超えたら骨が伸びている＝破綻）")
    for side in ("L", "R"):
        for bone, a, b in (("upper_arm", "shoulder", "elbow"), ("forearm", "elbow", "wrist"),
                           ("thigh", "hip", "knee"), ("shin", "knee", "ankle")):
            r = math.dist(P[a + "_" + side], P[b + "_" + side]) / BONES[bone]
            print(f"  {bone}_{side}: {r:.2f}" + ("  ← 伸びすぎ" if r > 1.03 else ""))


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
        if shadow:  # 足元の影：薄い楕円＋靴底が接する所の濃い接地影
            m = ((PX - 48.5) / 15) ** 2 + ((PY - SOLE) / 2.2) ** 2 <= 1
            base[m, :3] = (base[m, :3] * 0.84).astype(np.uint8)
            for cx_, w_ in ((44.4, 6.0), (54.2, 3.4)):  # 遊脚はつま先だけ接地
                m2 = ((PX - cx_) / w_) ** 2 + ((PY - SOLE) / 1.2) ** 2 <= 1
                base[m2, :3] = (base[m2, :3] * 0.68).astype(np.uint8)
        a = sprite[..., 3:4] / 255.0
        base[..., :3] = (sprite[..., :3] * a + base[..., :3] * (1 - a)).astype(np.uint8)
        out = base
    else:
        out = sprite
    im = Image.fromarray(out, "RGBA")
    return im.resize((w * scale, h * scale), Image.NEAREST)


def skeleton_sheet(still, scale=5):
    """ポーズの検討図：頭の高さごとの目盛り、骨格、重心線、肩と骨盤の傾きを重ねる（docs/09）。"""
    from PIL import ImageDraw
    base = composite(still, scale).convert("RGBA")
    veil = Image.new("RGBA", base.size, (255, 255, 255, 110))
    im = Image.alpha_composite(base, veil)
    d = ImageDraw.Draw(im)
    S = lambda p: (p[0] * scale, p[1] * scale)
    T, TP = head_xf(HEAD_TILT, 0)
    top, chin = TP(48, 12.5)[1], TP(48, 40.1)[1]
    head = chin - top
    k = 0
    while top + head * k <= SOLE + 0.1:  # 頭の高さの目盛り
        y = (top + head * k) * scale
        d.line([(0, y), (W * scale, y)], fill=(120, 120, 200, 160), width=1)
        d.text((2, y + 1), f"{k}H", fill=(80, 80, 160, 255))
        k += 1
    P = POSE
    bones = [("neck_pit", "pelvis"), ("shoulder_L", "shoulder_R"), ("hip_L", "hip_R"),
             ("shoulder_L", "elbow_L"), ("elbow_L", "wrist_L"), ("shoulder_R", "elbow_R"), ("elbow_R", "wrist_R"),
             ("hip_L", "knee_L"), ("knee_L", "ankle_L"), ("hip_R", "knee_R"), ("knee_R", "ankle_R"),
             ("neck_pit", "head_pivot")]
    for a, b in bones:
        d.line([S(P[a]), S(P[b])], fill=(220, 40, 90, 255), width=3)
    for name, p in P.items():
        x, y = S(p)
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(255, 255, 255, 255), outline=(220, 40, 90, 255), width=2)
    hx_, hy_ = S(TP(48, 26))
    d.ellipse([hx_ - 15 * scale, hy_ - 15 * scale, hx_ + 15 * scale, hy_ + 15 * scale],
              outline=(220, 40, 90, 200), width=2)
    x0, y0 = S(P["neck_pit"])  # 重心線：頸窩から真下 → 支持脚の足に落ちる
    d.line([(x0, y0), (x0, SOLE * scale)], fill=(30, 150, 90, 255), width=2)
    for a, b in (("shoulder_L", "shoulder_R"), ("hip_L", "hip_R")):  # 肩と骨盤の傾きを延長
        (ax, ay), (bx, by) = S(P[a]), S(P[b])
        dx, dy = bx - ax, by - ay
        d.line([(ax - dx * 0.4, ay - dy * 0.4), (bx + dx * 0.4, by + dy * 0.4)], fill=(240, 150, 30, 255), width=2)
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    still = render()
    Image.fromarray(still, "RGBA").save(os.path.join(OUT, "mio_1x.png"))
    composite(still, 6).save(os.path.join(OUT, "mio_x6.png"))
    skeleton_sheet(still).save(os.path.join(OUT, "pose_skeleton_x5.png"))

    seq = [  # (bob, eyes, ms) 呼吸＋まばたき
        (0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 300),
        (1, "half", 60), (1, "closed", 90), (1, "half", 60), (1, "open", 300),
        (0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 400),
    ]
    frames, durs = [], []
    for bob, eyes, ms in seq:
        frames.append(composite(render(bob=bob, eyes=eyes), 4).convert("RGB"))
        durs.append(ms)
    frames[0].save(os.path.join(OUT, "mio_idle_x4.gif"), save_all=True, append_images=frames[1:],
                   duration=durs, loop=0, disposal=1)
    report()


if __name__ == "__main__":
    main()
