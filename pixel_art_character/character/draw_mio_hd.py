"""ミオ HD（v9）：解像度を上げて、プロのイラストの描き方を取り入れた版（docs/15）。

3D の人体モデル（draw_mio_3d.py の v8）を RES 倍（4 倍＝384×704）の解像度でレイマーチし、
- 肌：顔の影は額だけ（頬に影を入れるとやつれて見える）、手足は 2 段、影の境目に彩度の高い色
- 髪：法線を球へ寄せて影を大きな形に、毛束の座標で束の影・毛流れの線・毛先の透け・天使の輪を描く
- 線：色トレス（線の色を下の色の暗い版に）、光の当たる外側は明るい線
- 顔：目・眉・鼻・口・頬を、頭の座標で定義した形（曲線）から高解像度で描く
を行う。

    python3 draw_mio_hd.py
"""
import math
import os

import numpy as np
from PIL import Image

import draw_mio_3d as B
from draw_mio import MAT, FACE_PAL, ACC, hx, mix, ramp, RIM, BG_TOP, BG_BOTTOM

v3, nrm = B.v3, B.nrm

# 髪の色：v8 より基本色を少し濃くして、天使の輪（明るい帯）との差を出す（ミルクティー色）
HAIR_HD = dict(line="#69402f", s2="#a8705a", s1="#c99378", base="#e0b392", lt="#f3d3b4", hi="#fff6e8")
MAT["hair"].update({k: hx(v) for k, v in HAIR_HD.items()})

RES = 4                       # 解像度の倍率（v8 の 96×176 → 384×704）
W, H = 96 * RES, 176 * RES
OX, OY = 0, 0                 # 描く範囲の左上（一部分だけ描くとき）
OUT = B.OUT


def shift(a, dx, dy, fill):
    """out[y, x] = a[y + dy, x + dx]（範囲外は fill）。"""
    out = np.full_like(a, fill)
    h, w = a.shape[:2]
    ys, yd = slice(max(0, -dy), min(h, h - dy)), slice(max(0, dy), min(h, h + dy))
    xs, xd = slice(max(0, -dx), min(w, w - dx)), slice(max(0, dx), min(w, w + dx))
    out[ys, xs] = a[yd, xd]
    return out


# ===========================================================================
# 1. 高解像度のレイマーチ
# ===========================================================================
def raymarch(groups, yaw=B.BODY_YAW, pitch=B.PITCH):
    Rv = B.view_matrix(yaw, pitch)
    jj, ii = np.mgrid[0:H, 0:W]
    sx = (ii.ravel() + OX + 0.5) / RES - 48.0
    sy = B.GROUND_ROW - (jj.ravel() + OY + 0.5) / RES
    O = np.stack([sx, sy, np.full_like(sx, 120.0)], axis=1) @ Rv
    D = np.array([0, 0, -1.0]) @ Rv
    t = np.zeros(len(O))
    hit = np.zeros(len(O), bool)
    alive = np.ones(len(O), bool)
    for _ in range(200):
        idx = np.where(alive)[0]
        if len(idx) == 0:
            break
        d, _ = B.scene_d(groups, O[idx] + np.outer(t[idx], D))
        t[idx] += d * 0.75
        done = d < 0.02
        hit[idx[done]] = True
        alive[idx[done | (t[idx] > 260)]] = False
    return O + np.outer(t, D), hit, Rv


def project(p, Rv):
    """モデル座標 → 画面のピクセル座標（RES 倍）。"""
    v = Rv @ p
    return (v[0] + 48.0) * RES - OX, (B.GROUND_ROW - v[1]) * RES - OY, v[2]


def chain_ids(group):
    """毛束（RoundCone の鎖）ごとの番号：前の部品の終点と次の部品の始点が同じなら同じ束。"""
    ids, cur = [], 0
    for i, p in enumerate(group.prims):
        if i > 0:
            q = group.prims[i - 1]
            same = isinstance(p, B.RoundCone) and isinstance(q, B.RoundCone) and np.allclose(p.a, q.b)
            cur += 0 if same else 1
        ids.append(cur)
    return np.array(ids)


def strand_coords(group, Ph, Vm):
    """毛束の座標：各点について (束の番号, u＝根元 0〜毛先 1, v＝束の中心からの横の位置 -1〜1, 横の距離)。
    3D のアニメ調モデルで、毛束に沿って髪のテクスチャ（毛流れの線・ハイライト）を描くのと同じ考え方。"""
    Q = group.to_src(Ph)
    Q = Q if group.warp is None else group.warp(Q)
    prims = group.prims
    ds = np.stack([p.d(Q) for p in prims], axis=1)
    j = ds.argmin(axis=1)
    cid = chain_ids(group)
    # 鎖ごとの長さ
    seg_len = np.array([np.linalg.norm(p.b - p.a) if isinstance(p, B.RoundCone) else 0.0 for p in prims])
    start = np.zeros(len(prims))
    total = {}
    for i in range(len(prims)):
        if i > 0 and cid[i] == cid[i - 1]:
            start[i] = start[i - 1] + seg_len[i - 1]
        total[cid[i]] = start[i] + seg_len[i]
    u = np.full(len(Q), -1.0)
    v = np.zeros(len(Q))
    lat = np.zeros(len(Q))
    for k in np.unique(j):
        p = prims[k]
        if not isinstance(p, B.RoundCone):
            continue
        m = j == k
        ba = p.b - p.a
        L = np.linalg.norm(ba)
        h = np.clip(((Q[m] - p.a) @ ba) / (L * L), 0, 1)
        A = p.a + np.outer(h, ba)
        r = p.r1 + (p.r2 - p.r1) * h
        side = np.cross(ba / L, Vm)
        side = side / max(np.linalg.norm(side), 1e-6)
        if side[0] < 0:        # 横の向きを画面の右＝正にそろえる（光は左上）
            side = -side
        lat[m] = (Q[m] - A) @ side
        v[m] = lat[m] / np.maximum(r, 0.3)
        u[m] = (start[k] + h * L) / max(total[cid[k]], 1e-6)
    return cid[j], u, np.clip(v, -1.5, 1.5), lat


def sharpen_tips(group, extend=1.2, tip=0.04):
    """毛先を尖らせる：鎖の最後の部品を少し延ばし、先端の半径をほぼ 0 にする（丸い指のような毛先を防ぐ）。"""
    cid = chain_ids(group)
    for i, p in enumerate(group.prims):
        if not isinstance(p, B.RoundCone):
            continue
        last = i == len(group.prims) - 1 or cid[i + 1] != cid[i]
        if last:
            d = (p.b - p.a) / np.linalg.norm(p.b - p.a)
            group.prims[i] = B.RoundCone(p.a, p.b + d * extend, p.r1, tip, p.tag)


# ===========================================================================
# 1.5 HD 用の顔の形と髪型（docs/15 15-11）
# ===========================================================================
def face_prims_hd(P):
    """可愛い輪郭：頬は目の下でぷにっとふくらみ、顎は小さく丸く、口から顎までを短く（大人っぽい V の顎を避ける）。"""
    Rh = B.head_frame(P)
    o = P["head"]
    L = lambda x, y, z: o + Rh @ v3(x, y, z)
    E = lambda c, r, tag: B.Ellipsoid(L(*c), r, Rh, tag)
    out = [
        E((0, 17.5, -1.0), (13.9, 13.3, 13.3), "cranium"),
        E((0, 10.2, 2.6), (12.6, 7.3, 9.8), "cheek"),
        E((0, 3.9 + CHIN_UP, 5.5), (4.7, 2.7, 3.0), "chin"),
    ]
    for s in (-1, 1):
        out.append(E((s * 6.9, 7.6, 6.0), (4.8 * CHEEK_PUFF, 3.9 * CHEEK_PUFF, 4.4), "cheek_puff"))   # 頬のふくらみ
        out.append(B.RoundCone(L(s * 9.6, 8.4, 2.8), L(s * 2.6, 3.9 + CHIN_UP, 5.4), 3.4, 3.0, "jaw"))
    return out


CHIN_UP = 0.9        # 顎先を上げる量（口から顎までを短く＝幼く）
CHEEK_PUFF = 1.0     # 頬のふくらみの大きさ


class Ribbon(B.RoundCone):
    """平たいリボン状の毛束の一区間（断面が楕円：幅 rw、厚み rt）。
    厚みの向き＝頭の中心から外向き。円柱の毛束は糸っぽく見えるので、プロの描き方どおり平たい束にする。"""

    def __init__(self, a, b, rw1, rw2, rt1, rt2, center, tag=""):
        super().__init__(a, b, rw1, rw2, tag)
        self.rt1, self.rt2 = float(rt1), float(rt2)
        self.center = np.asarray(center, float)

    def d(self, P):
        ba = self.b - self.a
        L2 = ba @ ba
        u = ba / np.sqrt(L2)
        h = np.clip(((P - self.a) @ ba) / L2, 0, 1)
        A = self.a + np.outer(h, ba)
        q = P - A
        n = A - self.center
        n = n - np.outer(n @ u, u)
        n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-6)
        bvec = np.cross(u, n)
        rw = self.r1 + (self.r2 - self.r1) * h
        rt = self.rt1 + (self.rt2 - self.rt1) * h
        qa, qn, qb = q @ u, np.einsum("ij,ij->i", q, n), np.einsum("ij,ij->i", q, bvec)
        k = np.sqrt((qb / rw) ** 2 + (qn / rt) ** 2 + (qa / rt) ** 2)
        return (k - 1.0) * np.minimum(rw, rt)


def build_hair_hd(P, old_hair, old_bangs):
    """HD 用の髪型（ミルクティー色のボブ）。
    - 毛束は平たいリボン。太い束と細い束を混ぜ、数を絞る
    - ボブの毛先は内巻きが中心（内巻き 8：外ハネ 2）、頬の高さでふんわり膨らむ
    - 横髪は頬に沿って下り、毛先が顎の方へ内巻き（顔を包んで小さく見せる）
    - 前髪は 7 束、大・中・小。毛先は尖り、束の間から額が見える
    - 遊び毛を 2 本、アホ毛 1 本"""
    Rh = B.head_frame(P)
    o = P["head"]
    HL = lambda p: o + Rh @ v3(*p)
    HC = np.array([0, 17.5, -1.4])
    center = HL(HC)

    def ribbon(pts, rws, rts, tag, n=4):
        P2 = [HL(p) for p in pts]
        curve = []
        m = len(P2)
        for i in range(m - 1):
            p0, p1, p2, p3 = P2[max(i - 1, 0)], P2[i], P2[i + 1], P2[min(i + 2, m - 1)]
            for j in range(n):
                t = j / n
                curve.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                                    + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
        curve.append(P2[-1])
        tt = np.linspace(0, 1, len(curve))
        src = np.linspace(0, 1, len(rws))
        rw, rt = np.interp(tt, src, rws), np.interp(tt, src, rts)
        return [Ribbon(curve[i], curve[i + 1], rw[i], rw[i + 1], rt[i], rt[i + 1], center, tag)
                for i in range(len(curve) - 1)]

    def on_skull(d, r):
        d = np.asarray(d, float)
        return tuple(HC + d / np.linalg.norm(d) * r)

    # 土台：頭のふくらみ（v8 より少し大きく、ふんわり）＋ボブのかたまり
    hair = [B.Ellipsoid(HL((0, 18.4, -1.4)), (14.9, 14.3, 14.8), Rh, "crown"),
            B.Ellipsoid(HL((0, 10.8, -3.2)), (16.4, 13.8, 14.4), Rh, "bob")]
    whorl = np.array([-0.18, 0.78, -0.6])
    n_back = 11
    widths = [3.9, 2.6, 3.5, 2.3, 4.0, 2.8, 3.8, 2.4, 3.6, 2.7, 3.9]
    flip = {1, 9}                                   # 外ハネにする束（残りは内巻き）
    for k, az in enumerate(np.linspace(-120, 120, n_back)):   # 一番前の束が横髪の上を覆わないように
        a_ = math.radians(az)
        hor = np.array([math.sin(a_), 0.0, -math.cos(a_)])
        eq = hor + np.array([0, 0.18, 0])
        w = widths[k]
        jit = ((k * 37) % 7) / 7.0 - 0.5
        p0 = on_skull(whorl * 0.8 + eq * 0.2, 14.4)
        p1 = on_skull(whorl * 0.45 + eq * 0.55, 14.4)   # 頭頂では土台になじませる（帯のような段差を作らない）
        p2 = on_skull(eq, 15.6)
        p3 = tuple(np.array([0, 6.0, -2.6]) + hor * 15.8)        # 頬の高さでふんわり膨らむ
        p4 = tuple(np.array([0, 1.2 + 0.6 * jit, -2.6]) + hor * 15.9)
        if k in flip:
            p5 = tuple(np.array([0, -1.0 + 0.4 * jit, -2.4]) + hor * 19.4)   # 外ハネ
        else:
            p5 = tuple(np.array([0, -1.6 + 0.5 * jit, -2.2]) + hor * 14.0)   # 内巻き：毛先が首の方へ入る
        hair += ribbon([p0, p1, p2, p3, p4, p5], [w * 0.75, w * 0.95, w, w * 1.05, w * 0.85, 0.12],
                       [1.5, 1.6, 1.7, 1.7, 1.4, 0.3], "strand")
    # 遊び毛（輪郭の外へ少しだけ。描きすぎるとくせ毛に見える）
    for pts in (((9.0, 27.6, 7.0), (12.6, 28.4, 6.0), (15.4, 27.0, 4.6)),
                ((-12.0, 25.0, 4.0), (-15.2, 24.4, 2.6), (-16.6, 22.4, 1.4))):
        hair += ribbon(list(pts), [0.42, 0.32, 0.05], [0.3, 0.25, 0.05], "stray", n=3)
    # アホ毛
    ah = [(0.6, 30.4, 1.8), (2.4, 34.4, 1.2), (5.2, 36.6, 0.4), (7.8, 35.6, -0.2)]
    hair += ribbon(ah, [0.95, 0.75, 0.5, 0.05], [0.6, 0.5, 0.4, 0.05], "ahoge", n=3)

    front = []
    sx = B.SIDE_LOCK_OUT
    for s_ in (-1, 1):
        # 横髪：こめかみから頬に沿って細く下り、毛先は少しだけ顎の方へ。先は筆先のように尖らせる
        # （太く丸い横髪は頬の横の塊＝耳あてのように見えた）
        front += ribbon([(s_ * (11.4 + sx), 23.0, 8.2), (s_ * (12.7 + sx), 15.0, 9.2), (s_ * (12.7 + sx), 8.0, 9.0),
                         (s_ * (12.2 + sx), 2.4, 8.2), (s_ * (11.2 + sx), -1.6, 7.4)],
                        [1.9, 2.1, 1.9, 1.1, 0.06], [0.9, 1.0, 1.0, 0.8, 0.2], "side_lock")
        front += ribbon([(s_ * (13.4 + sx), 21.5, 4.8), (s_ * (14.8 + sx), 12.0, 5.8), (s_ * (15.0 + sx), 4.5, 5.6),
                         (s_ * (14.4 + sx), -0.6, 5.0)], [1.7, 1.9, 1.3, 0.06], [0.9, 1.0, 0.9, 0.2], "side_lock")
    # 前髪：分け目（画面左寄り）から放射状。大・中・小の 7 束、毛先は少し内側へ
    part_x = -2.4
    bangs_spec = [(-11.2, -12.0, 19.4, 1.6), (-7.6, -8.2, 17.0, 2.9), (-3.8, -3.6, 18.7, 1.4),
                  (0.2, 0.4, 16.3, 3.1), (4.4, 5.2, 17.8, 2.3), (8.4, 9.2, 18.9, 1.9), (11.4, 12.3, 20.1, 1.3)]
    for rx, tx, ty, w in bangs_spec:
        ty += B.BANG_UP
        root_x = part_x + (rx - part_x) * 0.55
        inward = -0.6 if tx > 0 else 0.6
        # 束は毛先へ向かって徐々に細くなり、筆先のように尖る（束の間から額が見える）
        front += ribbon([(root_x, 28.6, 4.2), (rx, 25.6, 11.0), (tx * 0.98, (25.0 + ty) / 2, 13.0),
                         (tx + inward * 0.6, ty + 2.0, 13.4), (tx + inward, ty, 13.5)],
                        [w * 0.85, w * 0.95, w * 0.7, w * 0.4, 0.06], [0.8, 0.8, 0.7, 0.5, 0.2], "bang")

    g_hair = B.Group("hair", old_hair.mat, hair, k=2.0, cut=old_hair.cut, warp=old_hair.warp)
    g_bangs = B.Group("bangs", old_bangs.mat, front, k=0.8, warp=old_bangs.warp)
    for g in (g_hair, g_bangs):
        g.set_xf(P["head"], B.HEAD_SCALE, P["head"] * B.BODY_SCALE)
    return g_hair, g_bangs


# ===========================================================================
# 2. セルルックの描画
# ===========================================================================
_make_pose_v8 = getattr(B, "_make_pose_v8", B.make_pose)   # 再読み込みしても v8 の元の関数を使う
B._make_pose_v8 = _make_pose_v8


def make_pose(bob=0.0):
    """v8 のポーズから、ストラップを握る手を首元からみぞおちの高さへ下げる（docs/15：紐を持つ手は鎖骨の下〜みぞおち）。"""
    P = _make_pose_v8(bob)
    up = v3(0, bob, 0)
    P["elbow_R"], P["wrist_R"] = B.ik(P["shoulder_R"], v3(1.6, 97.0, 11.8) + up, B.BONES["upper_arm"],
                                      B.BONES["forearm"], v3(0.8, -0.6, -0.6))
    return P


def render(bob=0.0, eyes="open", face_details=True):
    base = render_base(bob)
    return finish(base, eyes, face_details)


def render_base(bob=0.0):
    """顔を描く前までの描画（まばたきの差分は finish だけ描き直せばよい）。"""
    B.make_pose = make_pose
    B.TEE_NECK, B.CARD_NECK = (4.3, 3.0, 6.5), (5.0, 4.0, 7.5)   # 襟ぐりを狭く：首元の肌が横に広がって見えないように
    groups, P = B.build_scene(bob)
    for i, g in enumerate(groups):
        if g.name in ("leg_w", "leg_f"):
            g.inflate = LEG_SLIM         # 可愛い系は手足を細く（docs/15）
        if g.name == "tee":
            # T シャツで肩の上（僧帽筋）と鎖骨も覆う：襟元の左右に肌が「翼」のように見えるのを防ぐ
            extra = [B.Ellipsoid(p.c, p.r + 0.7, p.R, p.tag) for p in B.torso_prims(bob) if p.tag == "trapezius"]
            # 鎖骨も覆う（鎖骨の棒が T シャツを突き抜けて、襟元の左右に肌が見えていた）
            extra += [B.RoundCone(p.a, p.b, p.r1 + 0.8, p.r2 + 0.8, p.tag) for p in B.neck_prims(bob, P["head"])
                      if p.tag == "clavicle"]
            ng = B.Group("tee", g.mat, g.prims + extra, k=g.k, cut=g.cut)
            ng.set_xf(np.zeros(3), B.BODY_SCALE, np.zeros(3))
            groups[i] = ng
        if g.name == "face" and FACE_HD:
            ng = B.Group("face", g.mat, face_prims_hd(P), k=g.k)
            ng.set_xf(P["head"], B.HEAD_SCALE, P["head"] * B.BODY_SCALE)
            groups[i] = ng
    if HAIR_HD_SHAPE:
        ih, ib = [k for k, g in enumerate(groups) if g.name == "hair"][0], [k for k, g in enumerate(groups) if g.name == "bangs"][0]
        groups[ih], groups[ib] = build_hair_hd(P, groups[ih], groups[ib])
    elif HAIR_SHARP:
        for g in groups:
            if g.name in ("hair", "bangs"):
                sharpen_tips(g)
    Pw, hit, Rv = raymarch(groups)
    names = [g.name for g in groups]
    gi = {n: k for k, n in enumerate(names)}
    idx = np.where(hit)[0]
    Ph = Pw[idx]
    _, gid = B.scene_d(groups, Ph)
    N = B.normals(groups, Ph, gid)
    Ph_src = Ph.copy()
    for g in np.unique(gid):
        m = gid == g
        Ph_src[m] = groups[g].to_src(Ph[m])
    Lm = B.L_VIEW @ Rv
    Vm = np.array([0, 0, 1.0]) @ Rv

    # 顔は球の法線（法線転写）
    fi = gi["face"]
    mface = gid == fi
    Rh = B.head_frame(P)
    if mface.any():
        c = P["head"] + Rh @ v3(0, 15.0, -2.0)
        rad = np.array([12.0, 15.0, 12.0])
        q = (Ph_src[mface] - c) @ Rh / rad
        ns = (q / rad) @ Rh.T
        ns = ns / np.linalg.norm(ns, axis=1, keepdims=True) + Vm * 0.9
        N[mface] = ns / np.linalg.norm(ns, axis=1, keepdims=True)

    # 髪の法線を「頭を包む球の法線」と混ぜる：束ごとの円柱の影（糸っぽさ）が消え、影が大きな形にまとまる
    # （アニメ調 3D モデルの髪の法線調整と同じ考え方。docs/15）
    mh_all = np.isin(gid, [gi["hair"], gi["bangs"]])
    if mh_all.any():
        hc = P["head"] + Rh @ v3(0, 14.0, -2.0)
        nsph = Ph_src[mh_all] - hc
        nsph = nsph / np.linalg.norm(nsph, axis=1, keepdims=True)
        nm = (1 - HAIR_SPHERE) * N[mh_all] + HAIR_SPHERE * nsph
        N[mh_all] = nm / np.linalg.norm(nm, axis=1, keepdims=True)
    lam = N @ Lm
    lam -= 0.10 * np.clip((100 - Ph[:, 1]) / 100, 0, 1)
    for gname, b in (("hair", -0.14), ("bangs", -0.08)):
        lam[gid == gi[gname]] += b
    lv = B.level_of(lam)
    lit = B.shadow(groups, Ph + N * 0.6, Lm)
    lv[~lit] = np.maximum(lv[~lit], 3)
    deep = (~lit) & (lam < 0.05)
    lv[deep] = 4
    occ = B.ambient_occlusion(groups, Ph + N * 0.1, N)
    is_hair = np.isin(gid, [gi["hair"], gi["bangs"]])
    th = np.where(is_hair, 4.2, 2.6)
    ao = (occ > th) & ~mface
    lv[ao] = np.minimum(lv[ao] + 1, 4)

    # 単純化（docs/14）：顔はベタ＋落ち影、髪は 3 段（解像度が上がったので v8 の 2 段から 1 段戻す）
    # 顔の影は「前髪の下の額」だけ（プロのアニメ塗り）。横髪の落ち影が頬や顎に入ると、頬がこけて
    # やつれて見えるので消す。顎の下の影は首の側に入る
    ql_f = (Ph_src[mface] - P["head"]) @ Rh
    lv[mface] = np.where(~lit[mface] & (ql_f[:, 1] > FACE_SHADOW_Y), 3, 2)
    lv[is_hair] = np.clip(lv[is_hair], 1, 3)
    mb = gid == gi["bangs"]                       # 前髪：束ごとの丸みの縞を消し、ベタ＋落ち影＋束の下の影だけ
    lv[mb] = np.where(lit[mb] & (occ[mb] < 4.6), 2, 3)
    lv[(lv == 4) & ~deep] = 3
    # 手足の肌：アニメ塗りの 2 段（明るい面と、光と反対側の 1 本の影）＋すねの細いツヤ。
    # 細かな凹凸の影（膝・ふくらはぎのまだら）は消す
    limbs = np.isin(gid, [gi[n] for n in ("leg_w", "leg_f", "arm_L", "arm_R", "hands")])
    lv[limbs] = np.where(lit[limbs] & (lam[limbs] > 0.12), 2, 3)
    lv[limbs & lit & (lam > 0.86)] = 1

    # 天使の輪
    mh = gid == gi["hair"]
    spec = (N @ nrm(Lm + Vm)) ** 24
    ql = (Ph_src - P["head"]) @ Rh
    inner = mh & (ql[:, 1] < 10.5) & (np.hypot(ql[:, 0], ql[:, 2] + 3.0) < 14.2)

    # 毛束の番号（束の分かれ目の線に使う）
    strand = np.full(W * H, -1)
    su = np.full(len(idx), -1.0)       # 毛束の上の位置（根元 0〜毛先 1）
    sv = np.zeros(len(idx))            # 毛束の中心からの横の位置（-1〜1、画面の右が正）
    slat = np.zeros(len(idx))
    for name in ("hair", "bangs"):
        g = gi[name]
        m = gid == g
        if m.any():
            c_, u_, v_, l_ = strand_coords(groups[g], Ph[m], Vm)
            strand[idx[m]] = c_ + (0 if name == "hair" else 1000)
            su[m], sv[m], slat[m] = u_, v_, l_

    # 天使の輪（docs/15）：頭の丸みに沿った帯。頭頂から頭の高さの約 25% 下、光の側（画面左）だけ。
    # 毛束ごとに上端を上下にずらしてギザギザにし、束の途中で途切れさせる
    st = strand[idx]
    jit = ((st * 7919) % 11) / 10.0 - 0.5
    ring_c = 23.6 + 0.9 * jit
    # 束ごとに「レンズ形」：束の中心で一番太く、束の縁で細くなって途切れる → ギザギザのツヤが並ぶ
    taper = np.clip(1 - np.abs(sv) ** 2, 0, 1)
    taper = np.where(su >= 0, taper, 1.0)
    dy = ql[:, 1] - ring_c
    hh = (1.05 + 0.35 * jit) * taper
    band = is_hair & (st >= 0) & (np.abs(dy) < hh) & (ql[:, 0] < 5.0 + 3.0 * jit) & (ql[:, 2] > -7.0) & lit
    lv[band] = 1
    core = band & (np.abs(dy + 0.15) < hh * 0.5) & (ql[:, 0] < 3.0)
    lv[core] = 0
    under_ring = is_hair & (st >= 0) & ~band & (dy < -hh) & (dy > -hh - 0.45 * taper - 0.05) \
        & (ql[:, 0] < 4.0 + 3.0 * jit) & (ql[:, 2] > -7.0) & lit & (taper > 0.3)

    img = np.zeros((W * H, 4), np.uint8)
    mats = [g.mat for g in groups]
    for g in range(len(groups)):
        m = gid == g
        for k in range(5):
            img[idx[m & (lv == k)]] = ramp(mats[g], k)
    for k in range(5):
        c = ramp(MAT["inner"], min(k, 4))      # 顎の横で暗くなりすぎないよう 1 段明るく
        if k >= 3:
            c = mix(c, hx("#9a6ab8"), 0.25)    # 内側の影は紫寄り（寒色で空気感）
        img[idx[inner & (lv == k)]] = c

    B.texture_details(img, idx, Ph_src, gid, names, lv, P, bob)   # カーディガンのリブ・靴下の口ゴムなど
    if HAIR_TEXTURE:
        hair_texture(img, idx, is_hair, lv, lit, su, sv, slat, strand[idx], ql, inner,
                     is_bang=(gid == gi["bangs"]), ring=under_ring)

    # 肌の影の境目に彩度の高い色（明るい側の 1px）：プロの塗りでよく使う「境目の赤み」
    lv_full = np.full(W * H, -1)
    lv_full[idx] = lv
    gid_full = np.full(W * H, -1)
    gid_full[idx] = gid
    gmap = gid_full.reshape(H, W)
    lvmap = lv_full.reshape(H, W)
    img = img.reshape(H, W, 4)
    skin_ids = [gi[n] for n in ("face", "torso_skin", "leg_w", "leg_f", "arm_L", "arm_R", "hands")]
    skin = np.isin(gmap, skin_ids)
    term = np.zeros_like(skin)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        term |= skin & (lvmap <= 2) & (shift(lvmap, dx, dy, -1) == 3) & np.isin(shift(gmap, dx, dy, -1), skin_ids)
    img[term] = SKIN_TERM

    # リムライト
    fres = 1 - np.abs(N @ Vm)
    rim = (fres > 0.72) & (lv >= 3) & ~mface
    flat = img.reshape(-1, 4)
    for g in range(len(groups)):
        m = rim & (gid == g)
        flat[idx[m]] = mix(ramp(mats[g], 3), RIM, 0.45)

    vz = np.full(W * H, -1e9)
    vz[idx] = (Ph @ Rv.T)[:, 2]
    vz = vz.reshape(H, W)

    su_full = np.full(W * H, -1.0)
    su_full[idx] = su
    img = outlines(img, gmap, vz, lvmap, strand.reshape(H, W), mats, groups, su_full.reshape(H, W))
    return dict(img=img, gmap=gmap, vz=vz, names=names, P=P, Rv=Rv, groups=groups, bob=bob, strand=strand.reshape(H, W))


def finish(base, eyes="open", face_details=True):
    img = base["img"].copy()
    gmap, P, Rv = base["gmap"], base["P"], base["Rv"]
    if face_details:
        draw_face(img, gmap, base["vz"], base["names"], P, Rv, eyes, base["groups"])
        draw_accessories(img, gmap, base["names"], P, Rv, base["bob"])
    grade(img, gmap)
    return img, P, Rv, gmap


def grade(img, gmap):
    """仕上げの色調補正：上はほんのり暖色、下はほんのり寒色（プロの仕上げのオーバーレイを弱くかけるのと同じ）。"""
    ys = np.where((gmap >= 0).any(axis=1))[0]
    top, bot = ys.min(), ys.max()
    t = np.clip((np.arange(H) - top) / max(bot - top, 1), 0, 1)[:, None, None]
    warm, cool = np.array([255, 236, 220]), np.array([224, 230, 255])
    tint = warm * (1 - t) + cool * t
    a = np.where(t < 0.5, 0.35 * (1 - 2 * t), 0.3 * (2 * t - 1))   # 乗算の強さ（色の変化は数％）
    m = gmap >= 0
    rgb = img[..., :3].astype(float)
    soft = rgb * (1 - a) + (rgb * tint / 255.0) * a          # 乗算を弱く
    img[..., :3] = np.where(m[..., None], np.clip(soft, 0, 255), rgb).astype(np.uint8)


FACE_SHADOW_Y = 16.0        # 顔に落ち影を入れるのはこの高さ（頭の座標）より上＝額だけ
LEG_SLIM = -0.45            # 脚を細くする量（距離関数を内側へずらす）
HAIR_SPHERE = 0.6           # 髪の法線を球の法線へ寄せる割合
FACE_HD = True              # HD 用の可愛い輪郭（頬のふくらみ・小さく丸い顎）
HAIR_HD_SHAPE = True        # HD 用の髪型（平たい毛束・内巻きのボブ）
HAIR_SHARP = True           # 毛先を尖らせる
HAIR_TEXTURE = True         # 毛束に沿った質感（毛流れの線・束の影・毛先の明るさ）
SKIN_TERM = hx("#ffbcaa")   # 肌の影の境目（明るい側）に置く彩度の高い色
HAIR_JUMP = 9.0   # 髪の中の輪郭線は大きく重なる所だけ（内側の線は少なく：docs/15）


def hair_texture(img, idx, is_hair, lv, lit, su, sv, slat, st, ql, inner, is_bang=None, ring=None):
    """毛束の座標を使って、髪に質感を付ける（docs/15）。
    - 束の影：各束の光と反対側（画面右）の縁を 1 段暗く → 平たいリボンが重なった立体感
    - 毛流れの線：束の中ほどから毛先へ、細い線を 1〜2 本（束ごとに位置をずらす）
    - 毛先：先の方を明るく（光が透ける・柔らかい）
    """
    hm = HAIR_HD
    col = {k: np.array(hx(v)[:3], float) for k, v in hm.items()}
    out = img.reshape(-1, 4)
    hsh = (st * 2654435761) % 1000 / 1000.0          # 束ごとの乱数（0〜1）
    on = is_hair & (su >= 0) & ~inner
    cur = out[idx, :3].astype(float)

    def blend(mask, c, a):
        cur[mask] = cur[mask] * (1 - a) + c * a

    # 束の影（画面右の縁）。根元は土台に溶けるので u > 0.15 から
    side_sh = on & (sv > 0.45 + 0.2 * hsh) & (su > 0.15) & (lv <= 2)
    blend(side_sh, col["s1"], 0.75)
    # 束の光（画面左の縁を少し明るく）
    side_lt = on & (sv < -0.55) & (su > 0.2) & (su < 0.8) & lit & (lv == 2)
    blend(side_lt, col["lt"], 0.45)
    # 毛流れの線：束ごとに 1 本（太い束は 2 本）。細い線＝今の色と影色の中間
    for k, off in enumerate((-0.25, 0.3)):
        v0 = off + 0.25 * (hsh - 0.5)
        line = on & (np.abs(slat - v0 * 1.6) < LINE_W / RES * 1.8) & (su > 0.35 + 0.2 * hsh) & (su < 0.93) \
            & (np.abs(sv) < 0.85)
        if k == 1:
            line &= hsh > 0.45
        blend(line, col["s2"], 0.45)
    # 前髪の毛先の透け感：顔にかかる先の方に肌の色を混ぜる
    skin = np.array(MAT["skin"]["base"][:3], float)
    bt = on & is_bang & (su > 0.55)
    a2 = np.clip((su - 0.55) / 0.45, 0, 1) * 0.3
    cur[bt] = cur[bt] * (1 - a2[bt, None]) + skin * a2[bt, None]
    # 毛先を明るく（先 12% を明るい色へ、先ほど強く）
    tip = on & (su > 0.86)
    a = np.clip((su - 0.86) / 0.14, 0, 1) * 0.45
    cur[tip] = cur[tip] * (1 - a[tip, None]) + col["lt"] * a[tip, None]
    # 天使の輪のすぐ下に細い影：輪が目立つ
    if ring is not None:
        blend(ring & on, col["s1"], 0.6)
    out[idx, :3] = np.clip(cur, 0, 255).astype(np.uint8)


LINE_W = 1.0


def outlines(img, gmap, vz, lvmap, strand, mats, groups, su_map=None):
    """色トレスの輪郭線（1px）。
    - 外形（背景との境目）：光の当たる側は素材の影色、影側は素材の線の色
    - パーツの境目・深さの飛び：手前側に線
    - 毛束の分かれ目：奥側の束に細い影色の線（線ではなく「溝」として）"""
    out = img.copy()
    hair_ids = [i for i, g in enumerate(groups) if g.name in ("hair", "bangs")]
    face_id = [i for i, g in enumerate(groups) if g.name == "face"][0]
    here = gmap >= 0
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ng = shift(gmap, dx, dy, -1)
        nz = shift(vz, dx, dy, -1e9)
        ns = shift(strand, dx, dy, -1)
        edge_empty = here & (ng < 0)
        diff = here & (ng >= 0) & (ng != gmap) & (vz > nz)
        jt = np.where(np.isin(gmap, hair_ids), HAIR_JUMP, 3.0)
        jump = here & (ng == gmap) & (vz - nz > jt)
        groove = here & (strand >= 0) & (ns >= 0) & (ns != strand) & (vz < nz + 0.5) & ~jump
        # 毛束が別の束の手前に重なる所：細く明るめの線（内側の線は外周より弱く。束の形がつながって見える）
        overlap = here & (strand >= 0) & (ns >= 0) & (ns != strand) & (vz - nz > 1.2) & ~jump & (ng == gmap)
        for y, x in zip(*np.where(overlap)):
            m = mats[gmap[y, x]]
            out[y, x] = mix(m["line"], m["s2"], 0.6)
        for y, x in zip(*np.where(groove)):
            m = mats[gmap[y, x]]
            # 束の分かれ目は「線」ではなく浅い溝：今の色と影色の中間（強すぎると髪が細い糸の束に見える）
            out[y, x] = mix(tuple(img[y, x]), m.get("s2", m["s1"]), 0.55)
        for y, x in zip(*np.where(edge_empty | diff | jump)):
            m = mats[gmap[y, x]]
            lit = lvmap[y, x] <= 2
            dark = m["line"]
            soft = mix(m["line"], m.get("s2", m["s1"]), 0.55)
            if su_map is not None and su_map[y, x] > 0.82:   # 毛先は線を抜く：先へ行くほど明るい線
                a = min((su_map[y, x] - 0.82) / 0.18, 1.0)
                dark = mix(m["line"], m["s2"], 0.35 + 0.5 * a)
                soft = mix(m["line"], m["s1"], 0.5 + 0.4 * a)
            if gmap[y, x] == face_id:      # 顔の輪郭は細く柔らかい色に（濃い輪郭は頬をこけて見せる）
                dark, soft = mix(m["line"], m["s2"], 0.45), mix(m["line"], m["s2"], 0.8)
            if edge_empty[y, x]:
                out[y, x] = soft if lit else dark
            elif jump[y, x]:
                out[y, x] = m.get("s2", m["s1"]) if lit else soft
            else:
                out[y, x] = soft if lit else dark
        # 髪の外周は影側だけ 2px（線の強弱：光の側は細く、影側は太く）。毛先は太くしない
        if RES >= 3:
            thick = edge_empty & np.isin(gmap, hair_ids) & (lvmap >= 3)
            if su_map is not None:
                thick &= su_map < 0.8
            for y, x in zip(*np.where(thick)):
                yi, xi = y - dy, x - dx
                if 0 <= yi < H and 0 <= xi < W and gmap[yi, xi] == gmap[y, x]:
                    m = mats[gmap[y, x]]
                    out[yi, xi] = mix(m["line"], m["s2"], 0.5)
    return out


# ===========================================================================
# 3. 顔：頭の表面に「模様」として描く（アニメ調 3D モデルで目をテクスチャで描くのと同じ考え方）
# ===========================================================================
# 顔の各ピクセルについて、頭の座標（x：左右、y：上下）を求め、目・眉・鼻・口・頬をその座標の形で塗る。
# 斜め向きの奥の目が自然に狭くなり、顔の丸みに沿って形が曲がる。単位は頭の座標（v8 の 1px ＝ 1）。
FP = dict(
    eye_x=7.6, eye_y=12.2,     # 目の中心
    ew=4.1,                    # 目の半幅
    eye_h=0.93,                # 目の高さの倍率（大きすぎると違和感：docs/12）
    brow_x=7.2, brow_y=19.1,   # 眉
    nose=(0.5, 7.7), mouth=(0.3, 5.8),
    blush=(8.7, 7.0),          # 目の真下に付けると「目の下の赤み（疲れ）」に見えるので、少し下・外へ
)
EYE_C = {
    "line": hx("#3e1f33"),     # 上まぶたの線（黒でなく暗い赤紫）
    "line2": hx("#6e3a4e"),    # 線の中間色（目頭側・まつ毛の先）
    "fold": hx("#d49a94"),     # 二重のライン
    "white": hx("#ffffff"),
    "white_sh": hx("#dcd2ea"), # 白目に落ちる上まぶたの影（髪色を少し映した淡い紫）
    "iris_top": hx("#3c2460"), # 瞳の上部（暗い）
    "iris_acc": hx("#4b4b9a"), # 瞳の上部の差し色（青紫）
    "iris": hx("#8a4fb0"),
    "iris_lo": hx("#c46fb8"),  # 瞳の下部（明るいピンク紫）
    "iris_rim": hx("#f2a8d8"), # 瞳の下の照り返し
    "iris_edge": hx("#3a1d52"),# 虹彩のふち
    "pupil": hx("#24122f"),
    "hl": hx("#ffffff"),
    "hl2": hx("#f4e8ff"),
    "spark": hx("#c6f0ff"),    # 補色のきらめき
    "lower": hx("#b77d8a"),    # 下まぶた
    "caruncle": hx("#f6b8bc"), # 目頭の赤み（淡く）
    "tear": hx("#fff3ee"),     # 涙袋のハイライト
}


def cr_table(pts, n=64):
    """制御点 (s, t) を通るなめらかな曲線を表にする（Catmull-Rom）。"""
    pts = [np.array(p, float) for p in pts]
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        for j in range(n):
            t = j / n
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    a = np.array(out)
    return lambda s: np.interp(s, a[:, 0], a[:, 1])


# 目の形（s：-1＝目尻、+1＝目頭。t：目の中心からの高さ、頭の座標の単位）
# たれ目：目尻は目頭より低い。上まぶたの一番高い所は中央より少し目尻側
EYE_TOP = cr_table([(-1.22, -0.35), (-1.0, 0.35), (-0.6, 2.35), (-0.15, 2.95), (0.35, 2.75), (0.8, 1.75), (1.0, 0.95)])
EYE_BOT = cr_table([(-1.0, 0.3), (-0.75, -1.6), (-0.3, -2.75), (0.2, -2.85), (0.65, -2.2), (1.0, -0.9)])
LID_W = cr_table([(-1.25, 0.3), (-1.0, 1.45), (-0.5, 1.3), (0.2, 0.95), (0.8, 0.6), (1.0, 0.4)])


def face_uv(face_group, P, Rv, box):
    """顔の面だけをレイマーチして、各ピクセルの頭の座標 (x, y, z) を返す（前髪の下でも求まる）。"""
    x0, y0, x1, y1 = box
    jj, ii = np.mgrid[y0:y1, x0:x1]
    sx = (ii.ravel() + OX + 0.5) / RES - 48.0
    sy = B.GROUND_ROW - (jj.ravel() + OY + 0.5) / RES
    O = np.stack([sx, sy, np.full_like(sx, 120.0)], axis=1) @ Rv
    D = np.array([0, 0, -1.0]) @ Rv
    t = np.zeros(len(O))
    hit = np.zeros(len(O), bool)
    alive = np.ones(len(O), bool)
    for _ in range(160):
        idx = np.where(alive)[0]
        if len(idx) == 0:
            break
        d = face_group.d(O[idx] + np.outer(t[idx], D))
        t[idx] += d * 0.8
        done = d < 0.02
        hit[idx[done]] = True
        alive[idx[done | (t[idx] > 260)]] = False
    Pw = O + np.outer(t, D)
    loc = (face_group.to_src(Pw) - P["head"]) @ B.head_frame(P)
    return loc.reshape(y1 - y0, x1 - x0, 3), hit.reshape(y1 - y0, x1 - x0)


def draw_face(img, gmap, vz, names, P, Rv, eyes, groups):
    fi, hi_, bi = names.index("face"), names.index("hair"), names.index("bangs")
    Rh = B.head_frame(P)
    cx, cy, _ = project(B.head_dst(P["head"] + Rh @ v3(0, 13, 8), P), Rv)
    r = int(20 * RES)
    box = (max(int(cx) - r, 0), max(int(cy) - r, 0), min(int(cx) + r, W), min(int(cy) + r, H))
    loc, hit = face_uv(groups[fi], P, Rv, box)
    x0, y0 = box[0], box[1]
    sub = img[y0:box[3], x0:box[2]]
    g = gmap[y0:box[3], x0:box[2]]
    X, Y = loc[..., 0], loc[..., 1]
    on_face = hit & (g == fi)
    on_bang = hit & np.isin(g, (hi_, bi))

    def paint(mask, color, through=0.0):
        """顔の上はそのまま、前髪の上は through の割合で透かして塗る（透け目・透け眉）。"""
        sub[mask & on_face] = color
        if through > 0:
            m = mask & on_bang
            for y, x in zip(*np.where(m)):
                sub[y, x] = mix(sub[y, x], color, through)

    # --- 頬の赤み（目の下、横長の楕円。中心ほど濃い） ---
    for side in (-1, 1):
        bx, by = FP["blush"]
        e = ((X - side * bx) / 2.7) ** 2 + ((Y - by) / 1.15) ** 2
        paint(e < 1.0, mix(MAT["skin"]["base"], hx("#ffb4ac"), 0.42))
        paint(e < 0.4, mix(MAT["skin"]["base"], hx("#ffa0a0"), 0.5))

    # --- 目 ---
    for side in (-1, 1):
        ex, ey, ew = side * FP["eye_x"], FP["eye_y"], FP["ew"]
        s = (abs(ex) - np.abs(X)) / ew * 1.0           # -1＝目尻、+1＝目頭
        s = np.where(np.sign(X) == side, s, 9)
        t = (Y - ey) / FP["eye_h"]
        top, bot, lw = EYE_TOP(s), EYE_BOT(s), LID_W(s)
        if eyes == "happy":
            # にっこり：上に凸のアーチ（∩）。目尻は少し下がり、下に涙袋のふくらみ
            arc = -0.4 + 1.5 * (1 - np.clip(s, -1, 1) ** 2) - 0.25 * (s < -0.6)
            paint((s > -1.1) & (s < 0.95) & (np.abs(t - arc) < 0.45), EYE_C["line"], 0.75)
            paint((s > -0.7) & (s < 0.6) & (np.abs(t - (-1.1)) < 0.25), EYE_C["tear"])
            continue
        if eyes == "closed":
            arc = -0.6 - 0.9 * (1 - np.clip(s, -1, 1) ** 2)
            paint((s > -1.15) & (s < 0.95) & (np.abs(t - arc) < 0.42), EYE_C["line"], 0.75)
            paint((s > -0.7) & (s < 0.5) & (np.abs(t - arc + 1.1) < 0.3), EYE_C["tear"])
            continue
        if eyes == "half":
            top = np.minimum(top, 0.6 + 0.2 * s)
        inside = (s > -1.0) & (s < 1.0) & (t < top) & (t > bot)
        # 白目（上まぶたの影は髪色を映した淡い紫）
        paint(inside, EYE_C["white"], 0.85)
        paint(inside & (t > top - 0.75), EYE_C["white_sh"], 0.85)
        # 瞳：縦長の楕円。上は暗く、下へ明るいピンク紫へのグラデーション
        icx, icy, irx, iry = ex - side * 0.1, ey - 0.3, 2.6, 3.15
        u, v = (X - icx) / irx, (Y - icy) / iry
        iris = inside & (u * u + v * v < 1.0)
        tt = v
        paint(iris, EYE_C["iris"], 0.85)
        paint(iris & (tt > 0.38), EYE_C["iris_acc"], 0.85)
        paint(iris & (tt > 0.62), EYE_C["iris_top"], 0.85)
        paint(iris & (t > top - 0.8), EYE_C["iris_top"], 0.85)          # 上まぶたの落ち影
        paint(iris & (tt < -0.15), EYE_C["iris_lo"], 0.85)
        paint(iris & (tt < -0.62) & (np.abs(u) < 0.75), EYE_C["iris_rim"], 0.85)
        paint(iris & (u * u + v * v > 0.78) & (tt > -0.4), EYE_C["iris_edge"], 0.85)
        # 瞳孔（縦長、少し上）
        pu, pv = (X - icx) / 0.95, (Y - (icy + 0.35)) / 1.45
        paint(iris & (pu * pu + pv * pv < 1.0), EYE_C["pupil"], 0.85)
        # ハイライト：主（光源側の上）・副（反対の下）・補色のきらめき。両目で同じ向き
        hx_, hy_ = icx - 0.95, icy + 1.05
        paint(inside & (((X - hx_) / 0.78) ** 2 + ((Y - hy_) / 0.7) ** 2 < 1), EYE_C["hl"], 0.9)
        paint(inside & (((X - (icx + 0.95)) / 0.42) ** 2 + ((Y - (icy - 0.75)) / 0.42) ** 2 < 1), EYE_C["hl2"], 0.9)
        paint(inside & (((X - (icx - 0.85)) / 0.36) ** 2 + ((Y - (icy - 1.25)) / 0.36) ** 2 < 1), EYE_C["spark"], 0.9)
        # 目頭の赤み
        paint(inside & (s > 0.9) & (t < 0.3) & (t > -0.6), EYE_C["caruncle"], 0.85)   # 大きいと充血して見える
        # 上まぶたの線：目尻が太く目頭へ細い。目尻の外へ少し跳ねる
        lid = (s > -1.22) & (s < 1.0) & (t >= top - 0.05) & (t < top + lw)
        paint(lid, EYE_C["line"], 0.9)
        paint(lid & (t < top + 0.3) & (s > -0.9) & (s < 0.6), EYE_C["line2"], 0.9)   # まぶたの下側は赤茶（色トレス）
        paint(lid & (s > 0.6), EYE_C["line2"], 0.9)
        # まつ毛の束：根元が太く先が細い。目尻側に 2 本（外へ跳ねる）、中央寄りに 1 本（上向き）
        Sx = s * ew                                   # 目の座標（単位：頭の座標）。正＝目頭側
        for s0, dx_, dy_ in ((-1.05, -1.25, 0.75), (-0.72, -0.9, 1.05), (-0.3, -0.25, 0.9)):
            top0 = float(EYE_TOP(s0)) if eyes == "open" else min(float(EYE_TOP(s0)), 0.6 + 0.2 * s0)
            bx0, by0 = s0 * ew, top0 + float(LID_W(s0)) * 0.5
            ax, ay = dx_, dy_
            L2 = ax * ax + ay * ay
            h = np.clip(((Sx - bx0) * ax + (t - by0) * ay) / L2, 0, 1)
            dist = np.hypot(Sx - bx0 - h * ax, t - by0 - h * ay)
            paint((dist < 0.42 * (1 - h) + 0.12) & (s > -1.6) & (s < 1.0), EYE_C["line"], 0.9)
        # 二重のライン（細く、肌より少し濃い）
        if eyes == "open":   # 二重のライン（半目では隠れる）
            fold = (s > -0.75) & (s < 0.45) & (np.abs(t - (top + lw + 0.75)) < 0.2)
            paint(fold, EYE_C["fold"], 0.6)
        # 下まぶた：目尻側だけ細く、淡く
        paint((s > -1.0) & (s < 0.15) & (t <= bot + 0.05) & (t > bot - 0.32), EYE_C["lower"], 0.7)
        # 涙袋のハイライト
        paint((s > -0.55) & (s < 0.55) & (np.abs(t - (bot - 0.85)) < 0.2), EYE_C["tear"])

    # --- 眉：細いアーチ。眉頭を少し上げる（ほんのり困り眉）。前髪の上は透かす ---
    for side in (-1, 1):
        bx, by = side * FP["brow_x"], FP["brow_y"]
        s = (abs(bx) - np.abs(X)) / 2.9
        s = np.where(np.sign(X) == side, s, 9)
        yc = by + 0.55 * (1 - s * s) + 0.35 * s
        wid = 0.5 * (1 - 0.45 * np.abs(s))
        paint((s > -1.05) & (s < 1.0) & (np.abs(Y - yc) < wid), BROW_C, 0.95)

    # --- 鼻：鼻先の小さな影（光と反対側）だけ ---
    nx, ny = FP["nose"]
    paint((((X - nx) / 0.5) ** 2 + ((Y - ny) / 0.38) ** 2) < 1, MAT["skin"]["s1"])
    # --- 口：小さな ∪ の笑顔、口角を上げる ---
    mx, my = FP["mouth"]
    if eyes == "happy":
        # 開いた口：上は横一文字に近い弧、下は丸い三日月。中は奥ほど暗く、下に舌（docs/15）
        du = (X - mx) / 2.0
        top_y = my + 0.15 - 0.25 * (1 - du * du)
        bot_y = my - 1.7 * np.sqrt(np.clip(1 - du * du, 0, 1))
        inside = (np.abs(du) < 1.0) & (Y < top_y) & (Y > bot_y)
        paint(inside, hx("#9a3448"))
        paint(inside & (Y < bot_y + 0.75) & (np.abs(du) < 0.6), hx("#f08a94"))
        paint((np.abs(du) < 1.05) & (np.abs(Y - top_y) < 0.25), MOUTH_C)
    else:
        du = (X - mx) / 1.7
        curve_y = my - 0.55 * (1 - du * du)
        paint((np.abs(du) < 1.0) & (np.abs(Y - curve_y) < 0.26 + 0.1 * (1 - np.abs(du))), MOUTH_C)
    img[y0:box[3], x0:box[2]] = sub


BROW_C = hx("#8e4c44")   # 前髪の輪郭線（暗い茶）と見分けがつく、赤みのある茶
MOUTH_C = hx("#b05866")


def stamp(img, gmap, cx, cy, rows, pal, on):
    """ドットの型を画面の (cx, cy) を中心に置く。on のパーツの上だけに描く。"""
    k = max(1, RES // 2)                     # 4 倍以上の解像度では型を 2 倍に
    if k > 1:
        rows = ["".join(ch * k for ch in r) for r in rows for _ in range(k)]
    h, w = len(rows), max(len(r) for r in rows)
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch not in pal:
                continue
            px, py = x0 + i, y0 + j
            if 0 <= px < W and 0 <= py < H and gmap[py, px] in on:
                img[py, px] = pal[ch]


HEART_CLIP = [
    ".pp..pp.",
    "pPPppPPp",
    "phPPPPPp",
    "phPPPPPp",
    ".pPPPPp.",
    "..pPPp..",
    "...pp...",
]
TEE_HEART = [".hh.hh.", "hhhhhhh", "hhhhhhh", ".hhhhh.", "..hhh..", "...h..."]


def draw_accessories(img, gmap, names, P, Rv, bob):
    gi = {n: k for k, n in enumerate(names)}
    ids = lambda *ns: [gi[n] for n in ns if n in gi]
    pj = lambda p: project(B.body_dst(p), Rv)
    TX = lambda c0: B.torso_xf(v3(*c0), bob)[0]
    Rh = B.head_frame(P)
    # ヘアクリップ（ハート形。キャラの左のこめかみ＝画面右）
    x, y, _ = project(B.head_dst(P["head"] + Rh @ v3(11.0, 24.5, 9.0), P), Rv)
    stamp(img, gmap, x, y, HEART_CLIP, {"p": ACC["clip_line"], "P": ACC["clip"], "h": ACC["clip_hi"]},
          ids("hair", "bangs"))
    # ネックレス：細い金の鎖（1px の点を詰めて並べる）と小さなチャーム
    for xx in np.linspace(-2.6, 2.6, 11):
        x, y, _ = pj(TX((xx, 118.7 - 0.2 * xx * xx, 4.2)))
        stamp(img, gmap, x, y, ["g"], {"g": ACC["gold"]}, ids("torso_skin", "tee"))
    x, y, _ = pj(TX((0.0, 117.0, 4.6)))
    stamp(img, gmap, x, y + 1, [".g.", "gGg", ".g."], {"g": hx("#c89a40"), "G": hx("#fff0b0")}, ids("torso_skin", "tee"))
    # カーディガンのボタン（2×2、上に光）
    for yb in (110, 103, 96, 89):
        x, y, _ = pj(TX((5.6, yb, 9.6)))
        stamp(img, gmap, x, y, ["hb", "bb"], {"b": ACC["button"], "h": hx("#e8d8c0")}, ids("cardigan"))
    # T シャツのハート
    x, y, _ = pj(TX((-3.6, 104.5, 8.6)))
    stamp(img, gmap, x, y, TEE_HEART, {"h": MAT["bag"]["base"]}, ids("tee"))
    # バッグの金具
    x, y, _ = pj(v3(-11.4, 74.4 + bob, 8.2))
    stamp(img, gmap, x, y, ["lggggggl", "lGGGGGGl"], {"l": MAT["bag"]["line"], "g": ACC["gold"], "G": hx("#c89a40")},
          ids("bag"))
    # 膝・肘の血色（肌より少し赤い小さな楕円）
    yy, xx = np.mgrid[0:H, 0:W]
    for side, leg in (("L", "leg_w"), ("R", "leg_f")):
        x, y, _ = pj(P["knee_" + side] + v3(0, 0.8, 3.4))
        m = ((xx + 0.5 - x) / (1.6 * RES)) ** 2 + ((yy + 0.5 - y) / (0.9 * RES)) ** 2 < 1
        m &= np.isin(gmap, ids(leg))
        img[m, :3] = (img[m, :3] * 0.7 + np.array(hx("#ffa8a0")[:3]) * 0.3).astype(np.uint8)   # 柔らかく混ぜる


def composite(sprite, scale, P=None, Rv=None):
    h, w = sprite.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    t = yy / (h - 1)
    base = np.zeros((h, w, 4), np.uint8)
    for i in range(3):
        base[..., i] = (BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t).astype(np.uint8)
    base[..., 3] = 255
    if P is not None:
        g = B.GROUND_ROW * RES
        for name, rx, ry, k in (("ankle_L", 6.5, 1.6, 0.68), ("ankle_R", 3.6, 1.2, 0.72)):
            a = P[name]
            x, y, z = project(B.body_dst(v3(a[0], 0, a[2] + 5)), Rv)
            m = ((xx + 0.5 - x) / (rx * RES)) ** 2 + ((yy + 0.5 - g) / (ry * RES)) ** 2 <= 1
            base[m, :3] = (base[m, :3] * k).astype(np.uint8)
        m = ((xx + 0.5 - 49 * RES) / (15 * RES)) ** 2 + ((yy + 0.5 - g) / (2.4 * RES)) ** 2 <= 1
        base[m, :3] = (base[m, :3] * 0.88).astype(np.uint8)
    a = sprite[..., 3:4] / 255.0
    base[..., :3] = (sprite[..., :3] * a + base[..., :3] * (1 - a)).astype(np.uint8)
    return Image.fromarray(base, "RGBA").resize((w * scale, h * scale), Image.NEAREST)


def set_res(r):
    global RES, W, H, OX, OY
    RES, W, H, OX, OY = r, 96 * r, 176 * r, 0, 0


def set_window(x0, y0, w, h):
    """一部分（例：頭だけ）を描く：試作を速くするため。座標は RES 倍の画面のピクセル。"""
    global W, H, OX, OY
    OX, OY, W, H = x0, y0, w, h


def face_closeup(base, scale):
    """顔の拡大（開き・半目・閉じ）を横に並べる。"""
    P, Rv = base["P"], base["Rv"]
    Rh = B.head_frame(P)
    cx, cy, _ = project(B.head_dst(P["head"] + Rh @ v3(0, 14, 6), P), Rv)
    r = int(21 * RES)
    tiles = []
    for eyes in ("open", "half", "closed", "happy"):
        img, *_ = finish(base, eyes)
        c = composite(img, 1).crop((int(cx) - r, int(cy) - r, int(cx) + r, int(cy) + int(r * 0.9)))
        tiles.append(c.resize((c.width * scale, c.height * scale), Image.NEAREST))
    w, h = tiles[0].size
    sheet = Image.new("RGB", (w * len(tiles) + 10 * (len(tiles) - 1), h), (255, 255, 255))
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * (w + 10), 0))
    return sheet


def main():
    import time
    B.apply_preset("v8")
    os.makedirs(OUT, exist_ok=True)
    for r, tag, zoom in ((4, "mio_hd", 2), (2, "mio_hd2", 4)):
        set_res(r)
        t0 = time.time()
        bases = {0: render_base(0.0), 1: render_base(1.0)}
        print(tag, "render", round(time.time() - t0, 1), "s")
        img, P, Rv, _ = finish(bases[0], "open")
        Image.fromarray(img, "RGBA").save(os.path.join(OUT, tag + "_1x.png"))
        composite(img, zoom, P, Rv).save(os.path.join(OUT, f"{tag}_x{zoom}.png"))
        if r == 4:
            face_closeup(bases[0], 3).save(os.path.join(OUT, "mio_hd_face_x3.png"))
            seq = [(0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 300),
                   (1, "half", 60), (1, "closed", 90), (1, "half", 60), (1, "open", 300),
                   (0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 400)]
            cache, frames, durs = {}, [], []
            for bob, eyes, ms in seq:
                if (bob, eyes) not in cache:
                    im, P_, Rv_, _ = finish(bases[bob], eyes)
                    cache[(bob, eyes)] = composite(im, zoom, P_, Rv_).convert("RGB")
                frames.append(cache[(bob, eyes)])
                durs.append(ms)
            frames[0].save(os.path.join(OUT, "mio_hd_idle_x2.gif"), save_all=True, append_images=frames[1:],
                           duration=durs, loop=0, disposal=1)
    # v8 と HD の比較（同じ表示サイズ）
    v8 = Image.open(os.path.join(OUT, "mio3d_1x.png")).convert("RGBA")
    v8 = composite(np.array(v8), 8)
    hd3 = Image.open(os.path.join(OUT, "mio_hd_x2.png")).convert("RGB")
    hd2 = Image.open(os.path.join(OUT, "mio_hd2_x4.png")).convert("RGB")
    v8 = v8.convert("RGB")
    sheet = Image.new("RGB", (v8.width * 3 + 40, v8.height), (255, 255, 255))
    for i, im in enumerate((v8, hd2, hd3)):
        sheet.paste(im, (i * (v8.width + 20), 0))
    sheet.save(os.path.join(OUT, "compare_v8_hd.png"))
    print("done")


if __name__ == "__main__":
    main()
