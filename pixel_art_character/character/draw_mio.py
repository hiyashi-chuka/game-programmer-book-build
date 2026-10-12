"""
現代風の可愛い女性キャラクター「ミオ」のドット絵を、画像生成を使わずに描くスクリプト。

docs/00_ai_pixel_protocol.md の「方式B：図形ラスタライズ方式」の実装例。
  1. 図形（スプライン多角形・楕円）で各パーツのマスクを作る
  2. 奥→手前の順にベタ塗り
  3. オフセットマスク法で形状影、マスクのずらしで落ち影
  4. 素材ごとの暗色で輪郭線（色トレス）＋光源側を明るくするセレクティブアウトライン
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
    "cardigan": dict(line="#8a7462", s2="#c2ad92", s1="#e0cfb2", base="#f6ecd8", hi="#fffaf0"),
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
# パーツ定義
# ---------------------------------------------------------------------------
class Layer:
    def __init__(self, name, mask, mat, group=None, shade=None, shade2=None, line=True, soft_top=True):
        self.name, self.mask, self.mat = name, mask, mat
        self.group = group or name
        self.shade = shade      # 形状影のずらし量 (dx, dy)
        self.shade2 = shade2    # 2影のずらし量
        self.line = line
        self.soft_top = soft_top  # 光源側（上・左）の外周線を一段明るく


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
    L.append(Layer("hair_back", smooth(T(back)), MAT["hair"], group="hair", shade=(3, 2)))

    # インナーカラー（後ろ髪の内側、首の左右に見える）
    inner_r = [(53, 41), (59.5, 40.5), (62.2, 44), (64.8, 48.2), (60, 48.6), (56, 47.4), (53.2, 45.4)]
    inner = smooth(T(inner_r)) | smooth(T(mirror_pts(inner_r)))
    L.append(Layer("hair_inner", inner, MAT["inner"], group="hair", shade=(2, 1), soft_top=False))

    # --- 2. 脚・ソックス・靴 ------------------------------------------------
    leg_l = [(38.2, 84), (47.3, 84), (47.5, 92), (47.1, 104), (46.7, 112), (46.4, 117), (46.9, 124),
             (46.4, 132), (45.7, 140), (45.6, 145), (41.6, 145), (41.2, 140), (40.0, 131), (39.2, 123),
             (40.0, 116), (39.6, 110), (38.4, 100), (37.6, 92)]
    leg_l = LEG(leg_l)
    leg_r = mirror_pts(leg_l)
    legs = smooth(leg_l, 6) | smooth(leg_r, 6)
    L.append(Layer("legs", legs, MAT["skin"], group="skin_leg", shade=(2, 0)))

    sock_top = 124
    socks = legs & (PY > sock_top) & (PY < 146)
    L.append(Layer("socks", socks, MAT["socks"], shade=(2, 0)))

    shoe_l = LEG([(41.0, 142.5), (46.4, 142.5), (47.6, 145.5), (48.2, 149), (48.0, 153), (37.4, 153),
                  (37.0, 149), (38.4, 145.5)])
    shoes = smooth(shoe_l, 4) | smooth(mirror_pts(shoe_l), 4)
    L.append(Layer("shoes", shoes, MAT["shoes"], shade=(2, 1)))

    # --- 3. 体（首・デコルテ） ----------------------------------------------
    body = sym([(48, 30), (51.6, 30), (51.6, 41.5), (53, 44.2), (57.5, 45.6), (61, 47.5), (62, 52),
                (60, 62), (59, 70), (48, 72)])
    L.append(Layer("body", smooth(B(body)), MAT["skin"], group="skin", shade=(2, 1)))

    # --- 4. インナー（白T、スカートにタックイン） ---------------------------
    tee = sym([(48, 47.6), (50.6, 47.2), (52.6, 45.6), (57, 46.4), (60.5, 49), (61, 56), (58.6, 63),
               (57.8, 68), (48, 68)])
    L.append(Layer("tee", smooth(B(tee)), MAT["tee"], shade=(2, 2)))

    # --- 5. スカート（ネイビーのプリーツミニ、Aライン） -----------------------
    skirt_side = [(48, 63.5), (56.6, 63.5), (58.8, 70), (61.6, 78), (64.6, 86), (65.4, 88.0)]
    hem = []  # 裾のジグザグ：プリーツの谷で1px上がる
    for k in range(5, -6, -1):
        x = 48 + k * 3.6
        hem += [(x + 1.8, 88.9), (x, 87.7)] if k > -5 else [(x + 1.8, 88.9)]
    skirt_pts = catmull(skirt_side, False, 4) + hem + [(96 - x, y) for x, y in reversed(catmull(skirt_side, False, 4))]
    L.append(Layer("skirt", poly(skirt_pts), MAT["skirt"], shade=(3, 2)))

    # --- 6. カーディガン（オーバーサイズ、前開き、ドロップショルダー） -------
    card_r = [(53.4, 45.2), (57.5, 46.0), (61.8, 47.6), (64.2, 50.5), (63.6, 58), (63.4, 66),
              (63.8, 74), (64.0, 80.6), (59, 81.4), (55.0, 81.2), (54.6, 74), (54.4, 64), (55.0, 56),
              (53.8, 50)]
    card = smooth(B(card_r)) | smooth(B(mirror_pts(card_r)))
    L.append(Layer("cardigan", card, MAT["cardigan"], shade=(3, 2), shade2=(1, 1)))

    # --- 7. 手（萌え袖からのぞく指先） --------------------------------------
    hand_r = ellipse(66.0, 85.0 + bob, 2.9, 2.6)
    hand_l = ellipse(30.0, 85.0 + bob, 2.9, 2.6)
    L.append(Layer("hands", hand_r | hand_l, MAT["skin"], group="skin_hand", shade=(1, 1)))

    # --- 8. 袖 ---------------------------------------------------------------
    sleeve_r = [(59.5, 47.0), (62.6, 47.4), (65.4, 50), (67.0, 56), (67.9, 63), (69.2, 71),
                (70.6, 79), (70.8, 84.4), (66.8, 85.2), (62.0, 84.4), (61.6, 78), (61.0, 70),
                (60.6, 62), (60.0, 54)]
    sleeves = smooth(B(sleeve_r)) | smooth(B(mirror_pts(sleeve_r)))
    L.append(Layer("sleeves", sleeves, MAT["cardigan"], shade=(2, 1), shade2=(1, 0)))

    # --- 9. バッグ（ピンクのパテント・ミニショルダー） -----------------------
    bag = smooth(B([(31.6, 73.4), (41.0, 73.4), (42.0, 75), (41.8, 81), (40.6, 82.2), (32.4, 82.2),
                    (31.0, 81), (30.8, 75)]), 4)
    L.append(Layer("bag", bag, MAT["bag"], shade=(2, 2)))

    # --- 10. 顔 -------------------------------------------------------------
    face = sym([(48, 12.5), (54, 13.2), (58.5, 15.5), (60.4, 19.5), (60.8, 24), (60.5, 27),
                (59.9, 30.5), (58.6, 33.4), (56.6, 36), (54.0, 38.3), (51.2, 39.7), (48.6, 40.1)])
    L.append(Layer("face", smooth(T(face)), MAT["skin"], group="skin_face"))

    # --- 11. 横髪（顔の両側の束、毛先は外ハネ） -----------------------------
    side_r = [(57.2, 15.5), (61.4, 16), (64.0, 21), (65.0, 29), (65.4, 37), (66.4, 43.4),
              (69.4, 47.2), (67.0, 48.6), (63.0, 47.0), (60.2, 44), (58.8, 39), (58.6, 33), (58.8, 24)]
    side = smooth(T(side_r)) | smooth(T(mirror_pts(side_r)))
    L.append(Layer("hair_side", side, MAT["hair"], group="hair_f", shade=(2, 2)))

    # --- 12. 前髪（シースルーバング） ---------------------------------------
    bang_tips = [(61.2, 19.0), (60.0, 23.4), (58.2, 19.6), (55.8, 23.8), (54.0, 19.2), (51.4, 23.4),
                 (49.6, 20.0), (47.4, 25.8), (46.0, 20.4), (43.6, 23.8), (41.6, 19.4), (39.2, 23.8),
                 (37.4, 19.6), (36.2, 23.0), (34.8, 19.0)]
    crown = [(35.0, 17.5), (36.4, 12.6), (41.0, 9.0), (48.0, 7.8), (55.0, 9.0), (59.6, 12.6), (61.2, 17.5)]
    bangs = poly(  # 頭頂はスプライン、毛先はジグザグを保つため直線で結ぶ
        catmull(T(crown), False, 6) + T(bang_tips))
    L.append(Layer("hair_front", bangs, MAT["hair"], group="hair_f", shade=(2, 3)))

    # アホ毛
    ahoge = poly(T([(48.0, 8.6), (49.0, 5.6), (51.4, 3.2), (54.2, 3.0), (52.0, 4.4), (50.4, 6.4), (49.8, 8.6)]))
    L.append(Layer("ahoge", ahoge, MAT["hair"], group="hair_f"))

    ctx = dict(T=T, TP=TP, B=B, bob=bob, eyes=eyes, tilt=tilt, sock_top=sock_top,
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

    def paint(mask, color):
        img[mask] = color

    # 1) ベタ塗り
    for i, l in enumerate(layers):
        paint(owner == i, l.mat["base"])

    # 2) 形状影（オフセットマスク法）
    for i, l in enumerate(layers):
        v = owner == i
        if l.shade:
            dx, dy = l.shade
            paint(v & ~shift(l.mask, dx, dy), l.mat["s1"])
        if l.shade2:
            dx, dy = l.shade2
            paint(v & ~shift(l.mask, dx, dy) & ~shift(l.mask, -dx * 3, 0) & shift(l.mask, 0, -2), l.mat["s2"])

    # 3) 落ち影（影を落とすマスクを右下にずらし、受け側の見えている部分と重ねる）
    def cast(caster, receiver, dx, dy, key="s1", extra=None):
        c = np.zeros((H, W), bool)
        for n in caster:
            c |= layers[idx[n]].mask
        m = shift(c, -dx, -dy) & vis(receiver)
        if extra is not None:
            m &= extra
        paint(m, layers[idx[receiver]].mat[key])
        return m

    cast(["hair_front", "ahoge"], "face", 1, 2)
    cast(["hair_side"], "face", 1, 1)
    cast(["face"], "body", 0, 3)
    cast(["face"], "body", 1, 1, "s2")
    cast(["hair_side", "hair_back"], "body", 1, 2)
    cast(["hair_side"], "cardigan", 1, 2)
    cast(["hair_side"], "sleeves", 1, 2)
    cast(["cardigan"], "tee", 2, 1)
    cast(["cardigan", "sleeves"], "skirt", 1, 2, "s2")
    cast(["skirt"], "legs", 1, 3)
    cast(["sleeves"], "hands", 0, 2)
    cast(["sleeves"], "cardigan", 2, 1)
    cast(["bag"], "skirt", 1, 1, "s2")
    cast(["bag"], "cardigan", 1, 1)
    cast(["bag"], "sleeves", 1, 1)

    T, TP = ctx["T"], ctx["TP"]
    # 後ろ髪の内側（顔の真横〜首）は一番暗く
    hb = vis("hair_back")
    paint(hb & (PY > 30 + bob) & (np.abs(PX - 48) < 15), MAT["hair"]["s1"])
    paint(hb & (PY > 37 + bob) & (np.abs(PX - 48) < 11), MAT["hair"]["s2"])
    # インナーカラーの奥（首に近いほど暗い）
    hi_ = vis("hair_inner")
    paint(hi_ & (np.abs(PX - 48) < 7), MAT["inner"]["s2"])
    for sx in (58.5, 61.5, 37.5, 34.5):  # インナーカラーにも毛束の筋
        paint(poly(T([(sx - 0.4, 40), (sx + 0.5, 40), (sx + (1.6 if sx > 48 else -0.6), 48.6),
                      (sx + (0.8 if sx > 48 else -1.4), 48.6)])) & hi_, MAT["inner"]["s1"])

    # 4) 髪の束の影（くさび形）とハイライト
    hf = vis("hair_front")
    for (nx, ny) in ctx["bang_tips"][2:-1:2]:  # 前髪の切れ込みから上へ伸びる影
        paint(poly(T([(nx - 1.0, ny + 0.6), (nx + 1.2, ny + 0.6), (nx + 0.6, ny - 5.5)])) & hf, MAT["hair"]["s1"])
    for (nx, ny) in [(41, 12.5), (55, 12.5)]:  # 分け目付近の束
        paint(poly(T([(nx - 0.6, ny - 3), (nx + 0.8, ny - 3), (nx + 0.6, ny + 4)])) & hf, MAT["hair"]["s1"])
    # 横髪・後ろ髪の束の筋
    hs = vis("hair_side")
    for sx in (62.6, 33.4):
        paint(poly(T([(sx - 0.5, 24), (sx + 0.7, 24), (sx + 1.6, 44), (sx + 0.8, 44)])) & hs, MAT["hair"]["s1"])
    for sx in (68.0, 28.0):
        paint(poly(T([(sx - 0.4, 22), (sx + 0.6, 22), (sx + 0.6, 40), (sx - 0.2, 40)])) & hb, MAT["hair"]["s1"])

    # 天使の輪：頭の丸みに沿ったジグザグの帯（束ごとに途切れる）
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
        if x < 53 and seg in (1, 2):  # 光源側の束の中央だけ最も明るく
            ring_hi[yi, xi] = True
    paint(ring_lt & hf, MAT["hair"]["lt"])
    paint(ring_hi & hf, MAT["hair"]["hi"])
    # 横髪の上のつや
    for sx in (60.8, 35.0):
        x2, y2 = TP(sx, 19.5)
        paint(poly([(x2 - 0.6, y2), (x2 + 0.6, y2), (x2 + 0.4, y2 + 5), (x2 - 0.2, y2 + 5)]) & hs, MAT["hair"]["lt"])

    # 服のディテール（輪郭線より前に塗る＝縁は輪郭が上書き）
    bob = ctx["bob"]
    sk = vis("skirt")
    # プリーツ：ウエストから裾へ放射状。谷＝影、その左（光源側）＝明るい折り山
    for k in range(-5, 6):
        x0, x1 = 48 + k * 1.9, 48 + k * 3.6
        for (px, py) in line_pixels(x0, 64, x1, 88):
            if 0 <= px < W and sk[py, px]:
                img[py, px] = MAT["skirt"]["s1"] if k < 3 else MAT["skirt"]["s2"]
                if px - 1 >= 0 and sk[py, px - 1] and k < 2:
                    img[py, px - 1] = MAT["skirt"]["lt"]
    # カーディガンのケーブル編み（前身頃の中央に縦の縄目）
    for cx_ in (59, 36):
        for y in range(52, 77):
            ph = (y - 52) % 4
            for dx_ in ((0,), (1,), (1,), (0,))[ph]:
                x_ = cx_ + dx_
                if owner[y + bob, x_] == idx["cardigan"]:
                    img[y + bob, x_] = MAT["cardigan"]["s1"]
            if ph == 0 and owner[y + bob, cx_ + 2] == idx["cardigan"]:
                img[y + bob, cx_ + 2] = MAT["cardigan"]["s1"]
    # Tシャツのワンポイント（小さなハート）
    stamp_heart = [".h.h.", "hhhhh", ".hhh.", "..h.."]
    for j, row in enumerate(stamp_heart):
        for i, ch in enumerate(row):
            x_, y_ = 49 + i, 53 + j + bob
            if ch == "h" and owner[y_, x_] == idx["tee"]:
                img[y_, x_] = MAT["bag"]["base"]
    # カーディガンの裾リブ・袖口リブ
    cd, sl = vis("cardigan"), vis("sleeves")
    rib = (XX % 2 == 0)
    paint(cd & (PY > 78 + bob) & rib, MAT["cardigan"]["s1"])
    paint(sl & (PY > 81.5 + bob) & rib, MAT["cardigan"]["s1"])
    # 袖の大きなたるみ皺（肘のあたり）
    for sgn in (1, -1):
        cx = 48 + sgn * 17.5
        pts = [(cx - sgn * 2, 62 + bob), (cx, 64.5 + bob), (cx + sgn * 1.5, 63 + bob), (cx - sgn * 0.4, 66 + bob)]
        for a, b in zip(pts, pts[1:]):
            for (px, py) in line_pixels(*a, *b):
                if sl[py, px]:
                    img[py, px] = MAT["cardigan"]["s1"]
    # ソックスの口ゴム
    so = vis("socks")
    paint(so & (YY == ctx["sock_top"] + 1), MAT["socks"]["s1"])
    paint(so & (YY == ctx["sock_top"] + 2) & rib, MAT["socks"]["s1"])
    # ローファーのベルト
    sh = vis("shoes")
    paint(sh & (YY == 140), MAT["shoes"]["line"])
    paint(sh & (YY >= 145), MAT["shoes"]["s1"])

    # 5) 輪郭線（上のレイヤー側に1px。外周＝最暗、光源側＝一段明るい）
    gid = {}
    for l in layers:
        gid.setdefault(l.group, len(gid))
    grp = np.array([gid[l.group] for l in layers])
    own_g = np.where(owner >= 0, grp[np.clip(owner, 0, None)], -1)
    line_img = img.copy()
    for i, l in enumerate(layers):
        if not l.line:
            continue
        v = owner == i
        need_dark = np.zeros((H, W), bool)
        need_soft = np.zeros((H, W), bool)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            # shift() の範囲外は 0 になるので、範囲外を空(-1)として扱う
            valid = shift(np.ones((H, W), bool), dx, dy)
            nb_owner = np.where(valid, shift(owner, dx, dy), -1)
            nb_g = np.where(nb_owner >= 0, grp[np.clip(nb_owner, 0, None)], -1)
            empty = nb_owner < 0
            lower = (nb_owner >= 0) & (nb_owner < i) & (nb_g != gid[l.group])
            edge = v & (empty | lower)
            toward_light = (dx == -1 or dy == -1)
            if l.soft_top and toward_light:
                need_soft |= edge & lower
                need_dark |= edge & empty
            else:
                need_dark |= edge
        line_img[need_soft & ~need_dark] = l.mat.get("s2", l.mat["line"])
        line_img[need_dark] = l.mat["line"]
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
        if shadow:  # 足元の楕円の影
            m = ((PX - 48) / 15) ** 2 + ((PY - 147.3) / 2.2) ** 2 <= 1
            base[m, :3] = (base[m, :3] * 0.82).astype(np.uint8)
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
