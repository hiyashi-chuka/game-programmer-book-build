"""髪を 2D の「束」として設計して描く（docs/15 15-13）。

プロのイラストレーターと同じ順番で描く：
  1. シルエット（髪全体の外形）と、顔を見せる窓
  2. 大きな束：後ろ髪（ボブ）→ 頭頂 → 横髪 → 前髪 の順に重ねる。束は「筆の形」（中心線＋太さの変化、先は尖る）
  3. 影の形：束の形を光の方向へずらして、重ならない部分（＝束の影側の縁）を影にする。手前の束は奥の束に影を落とす
  4. ツヤ：頭の丸みに沿った帯を、束ごとの芯（細くした束）で切り取る → 束ごとのレンズ形が並ぶ
  5. 線：外形は濃く、束どうしの重なりは細く明るく、毛先は線を抜く
  6. 前髪が額に落とす影

束の座標は「正面から見た頭の座標」（x：右が正、y：上が正、単位は v8 の 1px）で設計し、
頭を包む球面に載せてから 3D の投影で画面に写す（斜め向きでも自然に縮む）。
"""
import math

import numpy as np
from PIL import Image, ImageDraw

CAP_RX, CAP_RY = 16.5, 15.0             # 髪全体の外形（頭頂 ≒ 32.8）
SHELL_C = np.array([0.0, 17.5, -1.2])   # 髪の殻（頭を包む球）の中心
SHELL_R = 16.8


def cr_curve(pts, n=10):
    """Catmull-Rom 曲線（制御点を通る）。"""
    P = [np.asarray(p, float) for p in pts]
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for j in range(n):
            t = j / n
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return np.array(out)


def stroke(pts, widths, scale=1.0, t0=0.0, t1=1.0):
    """筆の形の束：中心線に沿って左右に太さ（半幅）を付けた多角形。scale で細くした芯も作れる。
    t0〜t1 で一部分（例：毛先だけ）を切り出せる。"""
    c = cr_curve(pts)
    n = len(c)
    tt = np.linspace(0, 1, n)
    w = np.interp(tt, np.linspace(0, 1, len(widths)), widths) * scale
    d = np.gradient(c, axis=0)
    d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-6)
    nrm = np.stack([-d[:, 1], d[:, 0]], axis=1)
    sel = (tt >= t0) & (tt <= t1)
    left = (c + nrm * w[:, None])[sel]
    right = (c - nrm * w[:, None])[sel]
    return np.concatenate([left, right[::-1]], axis=0)


def shell_z(x, y, lift=0.0):
    r2 = SHELL_R ** 2 - x ** 2 - (y - SHELL_C[1]) ** 2
    return SHELL_C[2] + np.sqrt(np.maximum(r2, 0.0)) + lift


class Painter:
    def __init__(self, D, P, Rv):
        self.D, self.P, self.Rv = D, P, Rv
        self.Rh = D.B.head_frame(P)
        self.o = P["head"]

    def to_screen(self, poly, lift=0.0):
        D = self.D
        out = []
        for x, y in poly:
            z = shell_z(x, y, lift)
            p = D.B.head_dst(self.o + self.Rh @ D.v3(x, y, z), self.P)
            sx, sy, _ = D.project(p, self.Rv)
            out.append((sx, sy))
        return out

    def mask(self, poly, lift=0.0):
        D = self.D
        im = Image.new("1", (D.W, D.H), 0)
        ImageDraw.Draw(im).polygon(self.to_screen(poly, lift), fill=1)
        return np.array(im, bool)


# ---------------------------------------------------------------------------
# 髪型の設計（正面から見た頭の座標）。頭頂 30.8、顎先 ≈ 2、目の中心 (±7.6, 12.2)、顔の幅 ≈ ±13
# ---------------------------------------------------------------------------
def design(D):
    """(名前, 層, 中心線の制御点, 半幅のリスト) の一覧。層：back＝背景の上だけ／front＝何の上にも描く。
    リストの順に重ねる（後ろほど手前）。"""
    B = D.B
    up = B.BANG_UP
    clumps = []
    # 後ろ髪の内側（首の後ろに見える暗い所）：背景の上だけ
    # 後ろ髪（首の後ろ）：首の両脇が背景のまま抜けるとヘルメットに見えたので、肩の近くまで下ろす
    clumps.append(("inner", "back", "fill", [(-15.0, 10.0), (15.0, 10.0), (15.2, 2.0), (14.2, -1.4), (12.0, -3.2),
                                              (9.0, -2.8), (-9.0, -2.8), (-12.0, -3.2), (-14.2, -1.4), (-15.2, 2.0)]))
    # 土台：頭全体の外形から、顔の窓（生え際〜顎）を抜いた形
    cap = [(CAP_RX * math.cos(a), 17.8 + CAP_RY * math.sin(a)) for a in np.linspace(0, math.pi, 25)]
    base = cap[:]                          # 右 → 頭頂 → 左（下端は束の毛先に任せるため高めで止める）
    base += [(-16.6, 12.0), (-16.0, 6.0), (-14.4, 3.6), (-12.9, 4.0), (-12.9, 21.0),
             (-8.0, 26.0), (-2.4, 27.4), (4.0, 26.8), (9.5, 25.2), (12.9, 21.0),
             (12.9, 4.0), (14.4, 3.6), (16.0, 6.0), (16.6, 12.0)]
    clumps.append(("base", "front", "fill", base))
    # 後ろ〜横のボブ：内巻き中心（毛先は首の方へ入る）、外ハネは 1 束ずつ。奥の束から
    for s in (-1, 1):
        # 後ろ〜横の束は頭頂（分け目の近く）から毛先まで一続きに流す：こめかみで途切れると、
        # 左右のボブが頭から切り離された塊（犬の耳・ヘッドホン）に見えた。毛先の長さ・向き・太さは変化をつける
        # 頬の高さで一番膨らみ、毛先へ向かって内側へすぼまる（縦にまっすぐ落ちると四角いヘルメットに見えた）
        clumps.append((f"bob_out{s}", "front", [(s * 9.0, 30.5), (s * 14.6, 25.0), (s * 16.6, 16.0), (s * 17.0, 8.0),
                                                 (s * 16.6, 2.4), (s * 17.4, 0.4)], [1.4, 2.4, 2.6, 2.4, 1.5, 0.0]))
        clumps.append((f"bob_c{s}", "front", [(s * 6.5, 31.4), (s * 13.2, 27.0), (s * 16.0, 17.0), (s * 16.4, 8.0),
                                               (s * 15.4, 1.6), (s * 13.4, -1.6)], [1.4, 2.6, 3.0, 2.8, 1.9, 0.0]))
        clumps.append((f"bob_b{s}", "front", [(s * 4.0, 31.8), (s * 11.0, 28.5), (s * 14.8, 18.0), (s * 15.4, 8.5),
                                               (s * 14.6, 2.4), (s * 12.8, -0.6)], [1.2, 2.6, 3.0, 2.8, 2.0, 0.0]))
        clumps.append((f"bob_a{s}", "front", [(s * 9.5, 27.5), (s * 13.2, 21.0), (s * 14.4, 12.0), (s * 14.4, 6.0),
                                               (s * 13.6, 2.2), (s * 11.8, 0.2)], [1.4, 2.2, 2.4, 2.4, 1.6, 0.0]))
    # 頭頂の束：分け目から左右へ流れる大きな束（頭の上の面の構造）
    part = (-2.4, 30.9)
    for end, mid, w in (((-15.2, 16.5), (-11.0, 27.0), 4.4), ((-13.8, 23.0), (-8.0, 29.6), 3.8),
                        ((-9.0, 28.6), (-5.6, 31.0), 2.8), ((3.6, 31.4), (0.6, 31.8), 3.0),
                        ((10.0, 28.8), (4.8, 31.6), 4.0), ((14.2, 22.6), (9.0, 29.8), 4.2),
                        ((15.4, 15.5), (11.8, 26.6), 4.2)):
        clumps.append(("crown", "front", [part, mid, end], [1.2, w, w * 0.6]))
    # 横髪：こめかみから頬の縁に沿って下り、先は尖って少しだけ内へ
    for s in (-1, 1):
        # （目尻にかからないよう外寄り・細め。講評：目尻とまつ毛が髪に食い込んでいた）
        clumps.append((f"side{s}", "front", [(s * 12.4, 24.0), (s * 13.9, 17.0), (s * 14.3, 10.0),
                                              (s * 13.8, 4.0), (s * 12.4, -0.2)], [1.7, 2.0, 2.0, 1.4, 0.0]))
    # 前髪：大・中・小の 7 束。外側から重ね、中央の大きい束を一番手前に
    bangs = [(-11.4, -12.4, 19.6, 1.8), (11.6, 12.6, 20.2, 1.5), (8.6, 9.4, 18.9, 2.1), (-7.6, -8.4, 17.2, 3.0),
             (-3.8, -3.6, 18.8, 1.6), (4.6, 5.4, 17.9, 2.5), (0.3, 0.5, 16.5, 3.3)]
    for rx, tx, ty, w in bangs:
        ty += up
        rootx = part[0] + (rx - part[0]) * 0.5
        inward = -0.7 if tx > 0 else 0.7
        clumps.append(("bang", "front", [(rootx, 29.6), (rx, 26.6), (tx * 0.98, (26.0 + ty) / 2),
                                         (tx + inward * 0.6, ty + 2.2), (tx + inward, ty)],
                       [w * 0.8, w * 1.0, w * 0.78, w * 0.38, 0.0]))
    # アホ毛・遊び毛
    clumps.append(("ahoge", "front", [(0.4, 31.0), (2.2, 34.8), (5.2, 37.0), (8.0, 36.0)], [1.0, 0.75, 0.45, 0.0]))
    return clumps


def draw(img, gmap, names, P, Rv, D):
    pt = Painter(D, P, Rv)
    H, W, RES = D.H, D.W, D.RES
    sh = lambda a, dx, dy, f=False: D.shift(a, int(round(dx)), int(round(dy)), f)
    col = {k: np.array(D.hx(v)[:3], float) for k, v in D.HAIR_HD.items()}
    inner_c = np.array(D.mix(D.hx(D.HAIR_HD["s2"]), D.MAT["inner"]["s1"], 0.25)[:3], float)
    if "hair" not in names:
        names.append("hair")
    if "bangs" not in names:
        names.append("bangs")
    hid, bid = names.index("hair"), names.index("bangs")
    fid = names.index("face")
    face0 = gmap == fid

    clumps = design(D)
    cap_mask = pt.mask([(CAP_RX * math.cos(a), 17.8 + CAP_RY * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 48)])
    bob_clip = pt.mask([(19.5 * math.cos(a), 15.5 + 17.3 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 64)]) \
        | pt.mask([(-30.0, 15.5), (30.0, 15.5), (30.0, -15.0), (-30.0, -15.0)])   # 上半分だけ丸く切る
    top = np.full((H, W), -1)          # 一番手前の束の番号
    masks, cores, tips, kinds = [], [], [], []
    for i, (kind, layer, pts, *w) in enumerate(clumps):
        if pts == "fill":
            m = pt.mask(w[0])
            core = np.zeros_like(m)
            tip = np.zeros_like(m)
        else:
            widths = w[0]
            m = pt.mask(stroke(pts, widths))
            core = pt.mask(stroke(pts, widths, scale=0.55, t0=0.05, t1=0.9))
            tip = pt.mask(stroke(pts, widths, t0=0.8, t1=1.0))
        if layer == "back":
            m &= gmap < 0
        if kind == "crown":
            m &= cap_mask                  # 頭頂の束は外形の内側に収める（はみ出すと寝ぐせのように見えた）
            core &= cap_mask
        elif kind.startswith("bob"):
            # ボブの束の根元も、頭の丸みに沿ったなめらかな楕円の内側に収める（ある高さで切ると段差ができた）
            m &= bob_clip
            core &= bob_clip
        masks.append(m)
        cores.append(core)
        tips.append(tip)
        kinds.append(kind)
        top[m] = i
    hair = top >= 0
    out = img[..., :3].astype(float)
    out[hair] = col["base"]

    u = RES / 4.0 * 4.0 / 4.0          # 4 倍解像度で 1 単位 ≒ 4px
    k1 = max(1, round(1.0 * RES))      # 束の影の幅（単位：px）
    # 1. 全体の影：髪の外形の右下の縁（光は左上から）
    mass = hair & ~sh(hair, 1.8 * RES, 1.8 * RES)
    # 2. 束の影：各束の右下の縁（束の形を左上へずらして重ならない所）
    clump_sh = np.zeros_like(hair)
    cast = np.zeros_like(hair)
    for i, m in enumerate(masks):
        if clumps[i][2] == "fill":
            continue
        vis = top == i
        clump_sh |= vis & ~sh(m, k1, k1)
        # 3. 手前の束が奥の髪に落とす影（束の右下へ）
        cast |= hair & (top < i) & sh(m, -k1 * 1.1, -k1 * 1.1)
    shadow = (mass | clump_sh | cast) & hair
    out[shadow] = col["s1"]
    # 2 影：全体の影と束の影が重なる所、首の後ろの内側
    deep = mass & (clump_sh | cast)
    out[deep] = col["s2"]
    inner = hair & (np.array(kinds, dtype=object)[np.clip(top, 0, None)] == "inner")
    out[inner] = inner_c
    # 4. ツヤ（天使の輪）：頭の丸みに沿った帯 × 束の芯、光の側だけ
    ring_poly = [(x, 24.4 - 0.022 * x * x + 0.9) for x in np.linspace(-15, 9, 30)] + \
                [(x, 24.4 - 0.022 * x * x - 0.9) for x in np.linspace(9, -15, 30)]
    band = pt.mask(ring_poly, lift=0.6)
    core_top = np.zeros_like(hair)
    for i, c in enumerate(cores):
        core_top |= c & (top == i)
    ring = band & core_top & ~shadow
    out[ring] = col["lt"]
    ring_hi = ring & ~sh(ring, 0, -max(1, RES // 2)) & sh(ring, 0, max(1, RES // 2))   # 帯の中心だけ一番明るく
    out[ring & sh(band, 0, max(1, RES // 2)) & sh(band, 0, -max(1, RES // 2))] = col["hi"]
    # 帯のすぐ下に細い影（輪が目立つ）
    under = hair & sh(band, 0, -max(1, RES // 2)) & ~band & core_top & ~shadow
    out[under] = col["s1"] * 0.6 + col["base"] * 0.4
    # 4b. 細かいツヤの筋：光の側の束の中ほどに、束に沿った細い明るい筋（大きなツヤと細かいツヤの 2 種類：プロの描き方）
    for i, (kind, layer, pts, *w) in enumerate(clumps):
        if pts == "fill" or not (kind.startswith("bob") or kind.startswith("side") or kind == "bang"):
            continue
        cx = np.mean([p[0] for p in pts])
        if cx > 2.0:                       # 光は左上：画面左側の束だけ
            continue
        streak = pt.mask(stroke(pts, w[0], scale=0.16, t0=0.32, t1=0.62)) & (top == i) & ~shadow
        out[streak] = out[streak] * 0.45 + col["lt"] * 0.55
    # 5. 毛先：明るく抜く（前髪の先は肌が透ける）
    tip_top = np.zeros_like(hair)
    for i, t in enumerate(tips):
        tip_top |= t & (top == i)
    out[tip_top & ~shadow] = out[tip_top & ~shadow] * 0.72 + col["lt"] * 0.28
    # 6. 線：外形は濃く（光の側は少し明るく）、束どうしは細く明るめ、毛先は抜く
    outer = np.zeros_like(hair)
    innerl = np.zeros_like(hair)
    crown_ids = [i for i, c in enumerate(clumps) if c[0] == "crown"]
    bang_ids = [i for i, c in enumerate(clumps) if c[0] == "bang"]
    top_region = pt.mask([(-20.0, 26.8), (20.0, 26.8), (20.0, 40.0), (-20.0, 40.0)])
    bob_ids = [i for i, c in enumerate(clumps) if c[0].startswith("bob")]
    upper7 = pt.mask([(-26.0, 7.0), (26.0, 7.0), (26.0, 40.0), (-26.0, 40.0)])
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nh = sh(hair, dx, dy)
        nt = sh(top, dx, dy, -1)
        outer |= hair & ~nh
        innerl |= hair & nh & (nt < top) & (nt >= 0) & ~np.isin(nt, [i for i, c in enumerate(clumps) if c[2] == "fill"]) \
            & ~(np.isin(top, crown_ids) & np.isin(nt, crown_ids)) \
            & ~(top_region & np.isin(top, crown_ids + bang_ids) & np.isin(nt, crown_ids + bang_ids))
        # ↑ 頭頂の束どうし、頭頂付近の前髪の根元どうしには線を引かない（分け目のまわりが星形の網目に見えた）
        innerl &= ~(upper7 & np.isin(top, bob_ids) & np.isin(nt, bob_ids))   # 横の束の線は毛先の近くだけ（すだれ防止）
    lit_side = sh(hair, -2 * RES, -2 * RES) & ~sh(hair, 2 * RES, 2 * RES)
    line_dark = col["line"]
    line_lit = col["line"] * 0.7 + col["s2"] * 0.3
    line_in = col["line"] * 0.45 + col["s2"] * 0.55
    oc = outer & ~tip_top
    out[oc] = line_dark
    out[oc & lit_side] = line_lit
    out[outer & tip_top] = col["line"] * 0.4 + col["s1"] * 0.6
    il = innerl & ~tip_top
    out[il] = line_in
    out[innerl & tip_top] = col["s2"] * 0.5 + out[innerl & tip_top] * 0.5
    # 影側の外形は 2px（線の強弱）
    if RES >= 3:
        thick = hair & ~outer & sh(outer, 1, 1) & ~lit_side & ~tip_top
        out[thick] = line_dark * 0.6 + col["s2"] * 0.4

    # 髪の内側の縁（顔・首・体に接する所）に暗い帯：髪の厚み（講評より）。前髪の毛先には入れない
    body = (gmap >= 0) & ~hair
    near_b = np.zeros_like(hair)
    for dx in range(-RES, RES + 1):
        near_b |= sh(body, dx, 0)
    side_kinds = np.isin(np.array(kinds, dtype=object)[np.clip(top, 0, None)],
                         [k for k in set(kinds) if k.startswith(("bob", "side", "base", "inner"))])
    out[hair & near_b & side_kinds & ~outer] = col["s1"] * 0.6 + col["s2"] * 0.4
    # 7. 前髪・横髪が顔に落とす影（左上の光 → 右下へ）
    front_hair = hair
    fshadow = face0 & ~hair & sh(front_hair, -1.0 * RES, -1.4 * RES)
    skin = D.MAT["skin"]
    out[fshadow] = np.array(skin["s1"][:3], float) * 0.85 + np.array(skin["base"][:3], float) * 0.15

    img[..., :3] = np.clip(out, 0, 255).astype(np.uint8)
    img[hair, 3] = 255
    # 番号の地図を更新：前髪と横髪・頭頂は「bangs」（目・眉を透かして描く対象）、それ以外は「hair」
    is_bang = np.isin(np.array(kinds, dtype=object)[np.clip(top, 0, None)], ["bang", "side-1", "side1", "crown"])
    gmap[hair] = hid
    gmap[hair & is_bang] = bid
