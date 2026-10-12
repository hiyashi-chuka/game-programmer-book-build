"""
「ミオ」v4：3D の人体モデルを作り、アニメ調（セルルック）で描画してドット絵にするスクリプト。

画像生成は使わない。docs/10 の方法の実装例：
  1. 骨格（関節）を比率表とポーズから決め、腕・脚は 2 ボーン IK で骨の長さを厳密に守る
  2. 骨に「骨の目印（鎖骨・膝蓋骨・くるぶし等）」と「筋肉のふくらみ（大腿四頭筋・腓腹筋等）」を
     楕円体・円錐で肉付けし、なめらかに合成する（符号付き距離関数 SDF ＋ smooth min）
  3. 服は体の形をふくらませた殻（Tシャツ・カーディガン）や円錐（プリーツスカート）、髪は毛束の集まり
  4. レイ・マーチングで深度・法線・パーツ ID を求める（Gバッファ）
  5. セルルックの技法で描画：段階的な陰影、影の判定は光線を飛ばす（落ち影）、
     顔は球の法線を使う（法線転写）、髪は鏡面反射で天使の輪、深度と ID の差で輪郭線
  6. 目・口などの顔パーツは 3D の位置を画面に投影して、ドットのスタンプで描く

使い方: python3 draw_mio_3d.py → output/mio3d_*.png, mio3d_idle_x4.gif, mio3d_anatomy_x4.png
必要なもの: Python 3, numpy, Pillow
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw

from draw_mio import MAT, EYE_PAL, FACE_PAL, ACC, hx, mix, ramp, shift, RIM

W, H = 96, 176
GROUND_ROW = 168.6
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")


# ===========================================================================
# 1. ベクトルと SDF の基本形（Inigo Quilez の距離関数をベクトル化）
# ===========================================================================
def v3(x, y, z):
    return np.array([x, y, z], float)


def nrm(v):
    return v / np.linalg.norm(v)


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def frame(u, hint):
    """骨の向き u を y 軸とする直交座標系（列 = 横, 骨の向き, 前）。hint は「前」に近い向き。"""
    u = nrm(u)
    f = hint - u * np.dot(hint, u)
    f = nrm(f)
    s = np.cross(u, f)
    return np.stack([s, u, f], axis=1)


def smin(a, b, k):
    """なめらかな最小値：2つの形を k の幅でつなぐ（筋肉どうし・骨と皮膚の境目）。"""
    if k <= 0:
        return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


class Ellipsoid:
    def __init__(self, c, r, R=None, tag=""):
        self.c, self.r = np.asarray(c, float), np.asarray(r, float)
        self.R = np.eye(3) if R is None else R
        self.tag = tag
        self.bound = (self.c, float(self.r.max()))

    def d(self, P):
        q = (P - self.c) @ self.R
        k0 = np.linalg.norm(q / self.r, axis=1)
        k1 = np.linalg.norm(q / (self.r * self.r), axis=1)
        return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


class RoundCone:
    """2点 a, b を結び、半径が r1 → r2 に変わる円錐（両端は球）。腕・脚・毛束の基本形。"""

    def __init__(self, a, b, r1, r2, tag=""):
        self.a, self.b = np.asarray(a, float), np.asarray(b, float)
        self.r1, self.r2 = float(r1), float(r2)
        self.tag = tag
        c = (self.a + self.b) / 2
        self.bound = (c, np.linalg.norm(self.b - self.a) / 2 + max(r1, r2))

    def d(self, P):
        a, b, r1, r2 = self.a, self.b, self.r1, self.r2
        ba = b - a
        l2 = ba @ ba
        rr = r1 - r2
        a2 = l2 - rr * rr
        il2 = 1.0 / l2
        pa = P - a
        y = pa @ ba
        z = y - l2
        x2v = pa * l2 - np.outer(y, ba)
        x2 = np.einsum("ij,ij->i", x2v, x2v)
        y2 = y * y * l2
        z2 = z * z * l2
        k = np.sign(rr) * rr * rr * x2
        d3 = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
        d1 = np.sqrt(x2 + z2) * il2 - r2
        d2 = np.sqrt(x2 + y2) * il2 - r1
        out = np.where(np.sign(y) * a2 * y2 < k, d2, d3)
        out = np.where(np.sign(z) * a2 * z2 > k, d1, out)
        return out


class RoundBox:
    def __init__(self, c, half, rad, R=None, tag=""):
        self.c, self.half, self.rad = np.asarray(c, float), np.asarray(half, float), rad
        self.R = np.eye(3) if R is None else R
        self.tag = tag
        self.bound = (self.c, float(np.linalg.norm(self.half)) + rad)

    def d(self, P):
        q = np.abs((P - self.c) @ self.R) - self.half
        return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(axis=1), 0) - self.rad


class Group:
    """1つの素材・パーツ（皮膚、カーディガン、髪…）。基本形を smooth min でつなぎ、cut で削る。"""

    def __init__(self, name, mat, prims, k=1.5, inflate=0.0, cut=None, warp=None, line=True, scale=None):
        self.name, self.mat, self.prims, self.k = name, mat, prims, k
        self.inflate, self.cut, self.warp, self.line = inflate, cut, warp, line
        cs = np.array([p.bound[0] for p in prims])
        c = cs.mean(axis=0)
        r = max(np.linalg.norm(p.bound[0] - c) + p.bound[1] for p in prims) + abs(inflate) + 4
        self.raw_bound = (c, r)
        self.scale = None
        self.bound = (c, r)
        if scale is not None:
            self.set_xf(scale[0], scale[1], scale[0])

    def set_xf(self, src, k, dst):
        """拡大縮小と移動：元の座標 src を中心に k 倍して dst へ置く（SDF は距離×k で正しいまま）。
        頭だけ大きくする・体だけ小さくする、に使う。"""
        src, dst = np.asarray(src, float), np.asarray(dst, float)
        self.scale = (src, k, dst)
        c, r = self.raw_bound
        self.bound = (dst + (c - src) * k, r * k)

    def to_src(self, Q):
        if self.scale is None:
            return Q
        src, k, dst = self.scale
        return src + (Q - dst) / k

    def raw(self, P):
        d = None
        for p in self.prims:
            dp = p.d(P)
            d = dp if d is None else smin(d, dp, self.k)
        d = d - self.inflate
        if self.cut is not None:
            d = self.cut(P, d)
        return d

    def d(self, P):
        c, r = self.bound
        db = np.linalg.norm(P - c, axis=1) - r
        out = db.copy()
        near = db < 2.0
        if near.any():
            Q = P[near]
            k_ = 1.0 if self.scale is None else self.scale[1]
            Q = self.to_src(Q)
            if self.warp is not None:
                Q = self.warp(Q)
            out[near] = self.raw(Q) * k_
        return out

    def nearest_prim(self, P):
        Q = self.to_src(P)
        Q = Q if self.warp is None else self.warp(Q)
        ds = np.stack([p.d(Q) for p in self.prims], axis=1)
        return ds.argmin(axis=1)


# ===========================================================================
# 2. 骨格とポーズ（docs/09・10）
# ===========================================================================
HEAD = 28.7
BONES = {"upper_arm": 28.5, "forearm": 21.0, "thigh": 39.5, "shin": 34.5}
SH_TILT = math.radians(5.7)     # 肩：画面左（体重側）が下がる（y 上向きの座標で +）
PEL_TILT = math.radians(-5.9)   # 骨盤：画面左が上がる
HEAD_TILT = math.radians(-6.0)  # 頭：肩と逆に傾ける（画面で頭頂が右へ）
HEAD_YAW = math.radians(9.0)    # 顔を体よりこちらへ向ける
BODY_YAW = math.radians(-18.0)  # 体を 3/4 向きに（キャラの左半身が手前）
PITCH = math.radians(5.0)       # 少し上から見下ろす
HEAD_SCALE = 1.06              # 頭を 1.06 倍（約5.0頭身）。大きな頭は可愛さの要素だが、1.1 倍では頭でっかちになった（docs/12）
BODY_SCALE = 0.94              # 首から下を 0.94 倍（小柄に。頭と目の大きさは変えない。docs/12）
ANIME_SMOOTH = 3.0              # 筋肉どうしをつなぐ幅（1.5 で写実寄り、3〜4 でアニメ寄り。docs/10 10-5）
ROUND_FACE = 0.0               # 顔の丸さ 0（v6）〜 1（v7：円で組み立てた横に広い顔）
SIDE_LOCK_OUT = 0.0            # 横髪を外へずらす量（v7：丸い頬を隠さない）
BANG_UP = 0.0                  # 前髪の毛先を上げる量（v7：おでこを広く）
SIMPLE = False                 # 単純化＋ドットの手直し（v8、docs/14）
TEE_NECK = (5.6, 3.6, 6.5)     # T シャツの首まわりの穴（半径）
CARD_NECK = (6.2, 4.4, 7.5)    # カーディガンの首まわりの穴（半径）

# 絵柄のプリセット（比較用）。v7 は『メイドインアビス』の比率の研究（docs/13）を反映した版
PRESETS = {
    "v6": dict(HEAD_SCALE=1.06, BODY_SCALE=0.94, ANIME_SMOOTH=3.0, ROUND_FACE=0.0, FACE_STYLE="modern",
               SIDE_LOCK_OUT=0.0, BANG_UP=0.0, EYE_X=7.3, BROW_Y=18.8, BROW_FAR_DY=0.0, SIMPLE=False),
    "v7": dict(HEAD_SCALE=1.08, BODY_SCALE=0.88, ANIME_SMOOTH=4.0, ROUND_FACE=1.0, FACE_STYLE="round",
               SIDE_LOCK_OUT=1.8, BANG_UP=2.2, EYE_X=7.3, SIMPLE=False),
    # v8：v7 はやりすぎ（目が離れすぎ・目が単純すぎ・体が小さすぎ）だったため、v6 を土台に少しだけ丸く
    "v8": dict(HEAD_SCALE=1.06, BODY_SCALE=0.94, ANIME_SMOOTH=3.0, ROUND_FACE=0.4, FACE_STYLE="modern",
               SIDE_LOCK_OUT=0.8, BANG_UP=1.0, EYE_X=7.6, BROW_Y=16.9, BROW_FAR_DY=-1.0, SIMPLE=True),
}


def apply_preset(name):
    globals().update(PRESETS[name])


def head_dst(p, P):
    """頭の座標（拡大前）→ 画面に出る位置（体の縮小・頭の拡大を反映）。"""
    return P["head"] * BODY_SCALE + (p - P["head"]) * HEAD_SCALE


def body_dst(p):
    return p * BODY_SCALE


def ik(a, target, l1, l2, pole):
    """2 ボーン IK：付け根 a から target へ、骨の長さ l1, l2 を保って中間関節（肘・膝）を求める。"""
    d = target - a
    L = np.linalg.norm(d)
    u = d / L
    L = min(max(L, abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3)
    x = (l1 * l1 - l2 * l2 + L * L) / (2 * L)
    h = math.sqrt(max(l1 * l1 - x * x, 0))
    p = pole - u * np.dot(pole, u)
    p = nrm(p)
    joint = a + u * x + p * h
    end = a + u * L
    return joint, end


def make_pose(bob=0.0):
    P = {}
    up = v3(0, bob, 0)
    P["neck_pit"] = v3(0, 119.1, 1.5) + up
    P["head"] = v3(0, 127.0, -0.5) + up   # v4 より 2.8px 上げて首を長く（首 0.20 → 0.28 頭、docs/11）
    P["shoulder_L"] = v3(-14.9, 117.2, -1.5) + up   # v6：肩を少し狭く（頭が大きいほど肩は控えめに）
    P["shoulder_R"] = v3(14.9, 120.4, -1.5) + up
    P["hip_L"], P["hip_R"] = v3(-7.6, 81.3, 0), v3(6.9, 79.8, 0)
    # 腕：左（画面左）はバッグの上に手を置く、右は胸の前でストラップを握る
    P["elbow_L"], P["wrist_L"] = ik(P["shoulder_L"], v3(-12.6, 76.6, 6.8) + up,
                                    BONES["upper_arm"], BONES["forearm"], v3(-0.35, 0, -1))
    P["elbow_R"], P["wrist_R"] = ik(P["shoulder_R"], v3(9.6, 107.4, 10.6) + up,
                                    BONES["upper_arm"], BONES["forearm"], v3(0.7, -0.5, -0.9))
    # 脚：左が支持脚（膝はほぼ伸びる）、右が遊脚（膝を前・内へ、かかとを上げる）
    P["knee_L"], P["ankle_L"] = ik(P["hip_L"], v3(-3.0, 7.6, -0.6), BONES["thigh"], BONES["shin"], v3(0.05, 0, 1))
    P["knee_R"], P["ankle_R"] = ik(P["hip_R"], v3(8.2, 9.4, -0.8), BONES["thigh"], BONES["shin"], v3(-0.25, 0, 1))
    return P


def torso_xf(c0, bob=0.0):
    """左右対称に作った胴の点を、肩は SH_TILT、骨盤は PEL_TILT に傾ける（側屈）。回転行列も返す。"""
    y = c0[1]
    t = min(1.0, max(0.0, (116.0 - y) / 32.0))
    a = SH_TILT * (1 - t) + PEL_TILT * t
    sx = -0.5 * t
    R = rot_z(a)
    piv = v3(sx, y, 0)
    c = R @ (c0 - piv) + piv + v3(0, bob if y > 84 else bob * max(0.0, (y - 76) / 8), 0)
    return c, R


# ===========================================================================
# 3. 人体モデル（骨の目印＋筋肉のふくらみ）
# ===========================================================================
def leg_prims(hip, knee, ankle, side, tag):
    """脚：side=+1 はキャラの左脚（画面右）、-1 は右脚（画面左）。横軸の + が外側。"""
    out = []
    fth = frame(knee - hip, v3(0, 0, 1))
    if side < 0:
        fth = fth @ np.diag([-1, 1, 1])      # 横軸を外側向きに
    lt = np.linalg.norm(knee - hip)

    def at(t, s, f):  # 太もも上の位置：t=骨に沿う割合、s=外側、f=前
        return hip + fth[:, 1] * (t * lt) + fth[:, 0] * s + fth[:, 2] * f

    E = lambda c, r, tg: Ellipsoid(c, r, fth, tag + tg)
    out.append(RoundCone(hip, knee, 4.2, 3.0, tag + "femur"))
    out.append(E(at(0.50, 2.6, 0.4), (3.3, 15.0, 3.3), "vastus_lateralis"))     # 外側広筋（外側の長いふくらみ）
    out.append(E(at(0.45, 0.0, 2.1), (3.0, 14.5, 2.8), "rectus_femoris"))       # 大腿直筋（前）
    out.append(E(at(0.80, -2.3, 0.9), (3.3, 6.5, 3.0), "vastus_medialis"))      # 内側広筋（膝上内側の涙形）
    out.append(E(at(0.25, -3.3, -0.4), (3.2, 11.0, 3.4), "adductors"))          # 内転筋群（内もも上部）
    out.append(E(at(0.50, 0.0, -2.5), (3.1, 15.0, 3.0), "hamstrings"))          # ハムストリングス（後ろ）
    out.append(E(at(0.02, 4.8, -0.8), (3.0, 4.5, 3.8), "greater_trochanter"))   # 大転子（腰の横の出っ張り）
    # 膝
    fsh = frame(ankle - knee, v3(0, 0, 1))
    if side < 0:
        fsh = fsh @ np.diag([-1, 1, 1])
    ls = np.linalg.norm(ankle - knee)

    def bt(t, s, f):
        return knee + fsh[:, 1] * (t * ls) + fsh[:, 0] * s + fsh[:, 2] * f

    out.append(Ellipsoid(knee + fth[:, 2] * 0.2, (3.3, 2.6, 3.0), fth, tag + "condyles"))     # 大腿骨の顆
    out.append(Ellipsoid(knee + fth[:, 2] * 2.7 + fth[:, 1] * -0.6, (1.9, 2.1, 1.1), fth, tag + "patella"))  # 膝蓋骨
    out.append(RoundCone(bt(0.02, 0, 2.2), bt(0.13, 0.2, 2.3), 0.9, 0.8, tag + "patellar_ligament"))
    out.append(Ellipsoid(bt(0.12, 0.3, 2.0), (1.2, 1.2, 1.0), fsh, tag + "tibial_tuberosity"))
    # すね・ふくらはぎ
    E2 = lambda c, r, tg: Ellipsoid(c, r, fsh, tag + tg)
    out.append(RoundCone(bt(0.0, 0, 0.5), bt(1.0, 0, 0.4), 3.0, 1.6, tag + "tibia"))
    out.append(E2(bt(0.36, -1.5, -1.9), (2.8, 8.6, 2.6), "gastrocnemius_medial"))   # 腓腹筋・内側頭（低い位置まで下がり、大きい）
    out.append(E2(bt(0.26, 1.4, -1.8), (2.4, 6.6, 2.3), "gastrocnemius_lateral"))   # 腓腹筋・外側頭（高い位置、小さい）
    out.append(E2(bt(0.55, 0.0, -1.5), (2.5, 10.0, 2.1), "soleus"))                 # ヒラメ筋
    out.append(E2(bt(0.35, 1.5, 1.3), (1.5, 10.0, 1.4), "tibialis_anterior"))       # 前脛骨筋
    out.append(RoundCone(bt(0.72, 0, -1.4), bt(1.02, 0, -1.6), 1.2, 1.1, tag + "achilles"))  # アキレス腱
    out.append(Ellipsoid(bt(0.985, -1.7, 0.1), (1.0, 1.2, 1.0), fsh, tag + "malleolus_medial"))   # 内くるぶし（高い）
    out.append(Ellipsoid(bt(1.02, 1.7, -0.2), (1.0, 1.2, 1.0), fsh, tag + "malleolus_lateral"))   # 外くるぶし（低い）
    return out


def arm_prims(shoulder, elbow, wrist, side, tag):
    """腕：side=+1 はキャラの左腕（画面右）。横軸の + が外側（親指側）。袖の下に隠れるが形の基礎になる。"""
    out = []
    fu = frame(elbow - shoulder, v3(0, 0, 1))
    fl = frame(wrist - elbow, v3(0, 0, 1))
    if side < 0:
        fu = fu @ np.diag([-1, 1, 1])
        fl = fl @ np.diag([-1, 1, 1])
    lu, ll = np.linalg.norm(elbow - shoulder), np.linalg.norm(wrist - elbow)
    U = lambda t, s, f: shoulder + fu[:, 1] * (t * lu) + fu[:, 0] * s + fu[:, 2] * f
    F = lambda t, s, f: elbow + fl[:, 1] * (t * ll) + fl[:, 0] * s + fl[:, 2] * f
    out.append(RoundCone(shoulder, elbow, 3.0, 2.3, tag + "humerus"))
    out.append(Ellipsoid(U(0.56, 0.0, 1.3), (2.3, 8.5, 2.2), fu, tag + "biceps"))         # 上腕二頭筋（前）
    out.append(Ellipsoid(U(0.45, 0.0, -1.5), (2.5, 10.0, 2.4), fu, tag + "triceps"))      # 上腕三頭筋（後ろ）
    out.append(Ellipsoid(U(0.72, 1.5, 0.2), (1.8, 5.0, 1.8), fu, tag + "brachialis"))     # 上腕筋（外側）
    out.append(Ellipsoid(elbow + fu[:, 2] * -1.8, (1.4, 1.5, 1.2), fu, tag + "olecranon"))  # 肘頭（肘の骨）
    out.append(Ellipsoid(elbow + fu[:, 0] * -2.0, (1.0, 1.2, 1.0), fu, tag + "epicondyle"))  # 内側上顆
    out.append(RoundCone(elbow, wrist, 2.4, 1.5, tag + "radius_ulna"))
    out.append(Ellipsoid(F(0.25, 1.5, 0.6), (1.9, 6.5, 1.8), fl, tag + "brachioradialis"))  # 腕橈骨筋（肘下の外側のふくらみ）
    out.append(Ellipsoid(F(0.30, -1.2, 0.4), (1.9, 7.0, 1.7), fl, tag + "flexors"))         # 屈筋群
    out.append(Ellipsoid(F(0.32, 0.8, -1.0), (1.7, 7.0, 1.6), fl, tag + "extensors"))       # 伸筋群
    out.append(Ellipsoid(F(0.98, 0.0, 0.0), (2.0, 1.2, 1.3), fl, tag + "wrist"))
    return out


def torso_prims(bob):
    """胴と首（服の下の体の形。服の殻もここから作る）。左右対称に置いてから側屈させる。"""
    T = lambda c0: torso_xf(v3(*c0), bob)
    out = []

    def E(c0, r, tag, extra=None):
        c, R = T(c0)
        if extra is not None:
            R = R @ extra
        out.append(Ellipsoid(c, r, R, tag))

    E((0, 104.5, -0.5), (10.4, 13.0, 7.4), "ribcage")                 # 胸郭
    for s in (-1, 1):
        E((s * 5.0, 100.8, 5.6), (4.5, 4.1, 3.6), "breast")           # 胸（控えめ）
        E((s * 14.3, 116.4, -1.2), (4.0, 5.0, 4.2), "deltoid")        # 三角筋（肩の丸み）
        E((s * 7.0, 120.2, -2.6), (6.2, 2.5, 3.4), "trapezius", rot_z(-s * 0.32))  # 僧帽筋（首から肩への斜面）
    E((0, 90.5, 0.6), (8.4, 8.5, 6.3), "abdomen")                     # 腹部・ウエスト
    E((-0.5, 80.5, 0.0), (12.6, 8.0, 7.6), "pelvis")                  # 骨盤
    for s in (-1, 1):
        E((s * 5.0, 77.5, -4.2), (6.4, 6.6, 4.8), "gluteus")           # 大殿筋
    return out


def neck_prims(bob, head_pt):
    T = lambda c0: torso_xf(v3(*c0), bob)[0]
    out = [RoundCone(T((0, 116.0, -0.5)), head_pt + v3(0, 2.5, -1.2), 4.1, 3.7, "neck")]   # 首は細め
    for s in (-1, 1):  # 胸鎖乳突筋：耳の後ろ → 鎖骨の内端（首の斜めの筋）
        out.append(RoundCone(head_pt + v3(s * 4.6, 4.5, -1.5), T((s * 1.2, 118.6, 2.7)), 1.3, 1.1, "sternocleidomastoid"))
        # 鎖骨：浅い S 字の棒（胸骨の端 → 肩先）。皮膚のすぐ下にあり、細い稜線になる
        pts = [T((s * 1.6, 118.4, 2.9)), T((s * 6.5, 118.8, 2.8)), T((s * 11.0, 119.2, 1.6)), T((s * 14.6, 119.6, -0.6))]
        for a, b in zip(pts, pts[1:]):
            out.append(RoundCone(a, b, 0.95, 0.9, "clavicle"))
    return out


def head_frame(P):
    return rot_z(HEAD_TILT) @ rot_y(HEAD_YAW)


def face_prims(P):
    Rh = head_frame(P)
    o = P["head"]
    L = lambda x, y, z: o + Rh @ v3(x, y, z)
    # 顔の輪郭（docs/11 11-2）：頭蓋は横にやや広い球、頬は目の下で一番広く、
    # そこから顎先へ「なめらかな V」で細くなる。顎の角（えら）は作らない
    # ROUND_FACE（0〜1）で v6 の顔と v7 の「円で組み立てた顔」（docs/13）の間をなめらかに変える
    t = ROUND_FACE
    lp = lambda a, b: tuple(x * (1 - t) + y * t for x, y in zip(a, b))
    out = [
        Ellipsoid(L(0, 17.5, -1.0), lp((13.7, 13.3, 13.3), (14.3, 13.4, 13.4)), Rh, "cranium"),
        Ellipsoid(L(*lp((0, 10.4, 2.4), (0, 10.0, 2.4))), lp((12.2, 7.0, 9.6), (13.0, 7.6, 10.0)), Rh, "cheek"),
        Ellipsoid(L(*lp((0, 2.9, 5.4), (0, 3.4, 5.0))), lp((3.8, 2.4, 2.9), (5.0, 2.8, 3.2)), Rh, "chin"),
    ]
    if t >= 1.0:
        for s in (-1, 1):
            out.append(RoundCone(L(s * 10.0, 8.4, 2.6), L(s * 2.6, 3.2, 5.0), 3.6, 3.0, "jaw"))
        return out
    for s in (-1, 1):
        # 頬骨：3/4 向きで奥の輪郭の「目の下の外側」に小さなふくらみを作る
        out.append(Ellipsoid(L(s * 8.4, 11.4, 7.8), (2.6, 2.0, 2.0), Rh, "cheekbone"))
        # 顎のライン：頬から顎先へ細くなる円錐
        j0, j1 = lp((9.2, 8.6, 2.6), (10.0, 8.4, 2.6)), lp((1.8, 2.9, 5.4), (2.6, 3.2, 5.0))
        r0, r1 = lp((3.2, 2.6), (3.6, 3.0))
        out.append(RoundCone(L(s * j0[0], j0[1], j0[2]), L(s * j1[0], j1[1], j1[2]), r0, r1, "jaw"))
    return out


def hand_prims(P):
    """手：v4 は小さすぎた（拳の長さ 6px ≒ 0.2 頭）。アニメの女性の手は「顎〜目の下」くらい
    （手首〜指先 ≒ 0.4〜0.45 頭）。手のひら＝角の丸い箱、指＝円錐（docs/11 11-1）。"""
    out = []
    # 右手：ストラップを握る拳（指は手のひらの前で曲がる）
    u = nrm(P["wrist_R"] - P["elbow_R"])
    F = frame(u, v3(0, 0, 1))
    A = lambda x, y, z, c0: c0 + F[:, 0] * x + F[:, 1] * y + F[:, 2] * z
    c = P["wrist_R"] + u * 3.4
    out.append(RoundBox(c, (2.5, 2.9, 1.2), 0.9, F, "palm"))
    for i, sx in enumerate((-1.9, -0.65, 0.65, 1.9)):
        out.append(RoundCone(A(sx, 2.6, 0.6, c), A(sx * 0.95, 1.6, 2.6, c), 0.95, 0.85, "finger"))
    out.append(RoundCone(A(-2.6, -0.8, 1.0, c), A(-1.4, 1.6, 2.6, c), 1.05, 0.85, "thumb"))
    # 左手：バッグの上に手のひらを乗せ、指先はバッグの前へ垂れる
    u = nrm(P["wrist_L"] - P["elbow_L"])
    F = frame(u, v3(0, 1, 0))
    A = lambda x, y, z, c0: c0 + F[:, 0] * x + F[:, 1] * y + F[:, 2] * z
    c = P["wrist_L"] + u * 3.2
    out.append(RoundBox(c, (2.6, 3.2, 0.9), 0.7, F, "palm"))
    for sx, ln in ((-1.9, 3.6), (-0.65, 4.4), (0.65, 4.2), (1.9, 3.4)):
        out.append(RoundCone(A(sx, 3.2, 0.2, c), A(sx * 1.05, 3.2 + ln * 0.6, -ln * 0.75, c), 0.8, 0.65, "finger"))
    out.append(RoundCone(A(2.7, -0.6, 0.2, c), A(3.2, 2.2, -0.6, c), 0.9, 0.7, "thumb"))
    return out


# ===========================================================================
# 4. 服・髪・小物
# ===========================================================================
def body_suit(torso, inflate):
    return [Ellipsoid(p.c, p.r + inflate, p.R, p.tag) for p in torso if p.tag in ("ribcage", "breast", "abdomen")]


# 靴（かかと → つま先）。足の長さ ≒ 0.66 頭（v4 の 0.62 は少し小さすぎた。docs/11 11-1）
SHOES = (("shoe_w", v3(-3.0, 0.0, -4.6), v3(-4.5, 0.0, 15.4)),
         ("shoe_f", v3(8.0, 5.0, -5.8), v3(6.5, 0.0, 13.6)))


def build_scene(bob=0.0, anatomy=False):
    P = make_pose(bob)
    torso = torso_prims(bob)
    groups = []
    TX = lambda c0: torso_xf(v3(*c0), bob)

    # --- 皮膚 -----------------------------------------------------------------
    groups.append(Group("torso_skin", MAT["skin"], torso + neck_prims(bob, P["head"]), k=2.2))
    legL = leg_prims(P["hip_L"], P["knee_L"], P["ankle_L"], -1, "L_")
    legR = leg_prims(P["hip_R"], P["knee_R"], P["ankle_R"], +1, "R_")
    # smooth min の幅 k が「アニメ度」：大きいほど筋肉の境目がなめらかに溶けて、アニメらしい脚になる
    groups.append(Group("leg_w", MAT["skin"], legL, k=ANIME_SMOOTH))
    groups.append(Group("leg_f", MAT["skin"], legR, k=ANIME_SMOOTH))
    groups.append(Group("arm_L", MAT["skin"], arm_prims(P["shoulder_L"], P["elbow_L"], P["wrist_L"], -1, "L_"), k=1.8))
    groups.append(Group("arm_R", MAT["skin"], arm_prims(P["shoulder_R"], P["elbow_R"], P["wrist_R"], +1, "R_"), k=1.8))
    groups.append(Group("hands", MAT["skin"], hand_prims(P), k=1.2))
    face = Group("face", MAT["skin"], face_prims(P), k=3.0, scale=(P["head"], HEAD_SCALE))
    groups.append(face)

    if anatomy:
        suit = body_suit(torso, 0.6) + [p for p in torso if p.tag in ("pelvis", "gluteus")]
        groups.append(Group("suit", MAT["tee"], suit, k=3.0, inflate=0.5))
    else:
        # --- Tシャツ：胸郭・胸・腹の形を少しふくらませた殻。首まわりを丸く開ける -----
        neck_c, _ = TX((0, 121.0, 3.2))

        def tee_cut(Q, d):
            q = (Q - neck_c) / np.array(TEE_NECK)
            hole = (np.linalg.norm(q, axis=1) - 1.0) * 3.4
            return np.maximum(d, -hole)

        groups.append(Group("tee", MAT["tee"], body_suit(torso, 0.7), k=3.0, cut=tee_cut))

        # --- スカート：骨盤と一緒に傾く楕円錐。半径をのこぎり波で変えて本物のプリーツを作る ----
        pel_c = v3(-0.5, 79.6, 0)
        Rp = rot_z(PEL_TILT)

        class Skirt:
            tag = "skirt"
            bound = (pel_c, 26.0)

            def d(self, Q):
                q = (Q - pel_c) @ Rp
                y0, y1 = -13.4, 11.2
                t = np.clip((q[:, 1] - y0) / (y1 - y0), 0, 1)
                ax = 18.0 * (1 - t) + 9.4 * t
                az = 13.4 * (1 - t) + 7.2 * t
                ang = np.arctan2(q[:, 2], q[:, 0])
                saw = np.abs((ang * 24 / (2 * np.pi)) % 1.0 - 0.5) * 2 - 0.5   # -0.5..0.5
                amp = 0.07 * (1 - t) + 0.01
                scale = 1 + amp * saw
                rad = np.sqrt((q[:, 0] / ax) ** 2 + (q[:, 2] / az) ** 2)
                d_side = (rad - scale) * np.minimum(ax, az) * 0.9
                hem = y0 + 0.5 * saw * (1 - t) * 1.6       # 裾はプリーツの谷で少し上がる
                return np.maximum(d_side, np.maximum(hem - q[:, 1], q[:, 1] - y1))

        groups.append(Group("skirt", MAT["skirt"], [Skirt()], k=0))

        # --- カーディガン：肩・胸を大きくふくらませた殻＋胸から裾まで真っすぐ落ちる筒。前を開ける ---
        drape_top, Rt = TX((0, 104.0, -0.4))
        drape_bot, Rb = TX((0, 79.2, -0.2))
        card_prims = [Ellipsoid(p.c, p.r + 1.7, p.R, p.tag) for p in torso
                      if p.tag in ("ribcage", "breast", "deltoid", "trapezius")]
        card_prims.append(RoundCone(drape_top, drape_bot, 12.4, 13.6, "drape"))
        hem_n = Rb @ v3(0, 1, 0)

        def card_cut(Q, d):
            d = np.maximum(d, -(np.einsum("ij,j->i", Q - drape_bot, hem_n)))      # 裾（骨盤と同じ傾き）
            ql = (Q - drape_top) @ Rt
            yy = ql[:, 1]
            w = np.clip(2.0 + (18.0 - yy) * 0.11, 2.0, 6.5)                       # 前開き：下ほど広い
            wedge = np.maximum(np.abs(ql[:, 0] + 0.4) - w, 3.2 - ql[:, 2])
            d = np.maximum(d, -wedge)
            nq = (Q - TX((0, 120.5, 1.0))[0]) / np.array(CARD_NECK)
            d = np.maximum(d, -(np.linalg.norm(nq, axis=1) - 1.0) * 4.0)          # 首まわり
            return d

        groups.append(Group("cardigan", MAT["cardigan"], card_prims, k=4.5, cut=card_cut))

        # --- 袖（上腕と前腕は別パーツ：曲げた腕の重なりに輪郭線が出る） ----------------
        for side in ("L", "R"):
            sh, el, wr = P["shoulder_" + side], P["elbow_" + side], P["wrist_" + side]
            u = nrm(wr - el)
            end = wr + u * 1.6
            groups.append(Group("sleeve_up_" + side, MAT["cardigan"],
                                [RoundCone(sh + v3(0, -1.0, 0), el, 4.9, 4.3, "sleeve_up"),
                                 Ellipsoid(sh + v3(0, 0.2, 0), (5.0, 5.0, 4.8), None, "shoulder_cap")], k=2.0))

            def cuff_cut(Q, d, end=end, u=u):
                return np.maximum(d, (Q - end) @ u)

            groups.append(Group("sleeve_fore_" + side, MAT["cardigan"],
                                [RoundCone(el, end + u * 0.5, 4.2, 5.1, "sleeve_fore"),
                                 Ellipsoid(el, (4.3, 4.3, 4.3), None, "elbow")], k=1.5, cut=cuff_cut))

        # --- ソックス：すねの形を少しふくらませ、上端を水平に切る（3D なので口は自然に曲線になる）
        for name, prims, top in (("socks_w", legL, 27.6), ("socks_f", legR, 29.0)):
            lower = [p for p in prims if any(t in p.tag for t in
                                             ("tibia", "gastro", "soleus", "tibialis", "achilles", "malleolus"))]

            def sock_cut(Q, d, top=top):
                return np.maximum(d, Q[:, 1] - top)

            groups.append(Group(name, MAT["socks"], lower, k=ANIME_SMOOTH, inflate=0.45, cut=sock_cut))

        # --- バッグとストラップ ----------------------------------------------------
        bag_R = rot_z(math.radians(4)) @ rot_y(math.radians(-14))
        bag_c = v3(-11.6, 70.4 + bob, 6.2)
        groups.append(Group("bag", MAT["bag"], [RoundBox(bag_c, (5.2, 4.3, 1.9), 1.3, bag_R, "bag")], k=0))

    # --- 靴（ローファー）：足の座標系（かかと→つま先）で作る -------------------------
    shoes = []
    for name, heel, toe in SHOES:
        fwd = nrm(toe - heel)
        F = frame(fwd, v3(0, 1, 0))           # 列 = 横, 前（つま先）, 上
        side, up = F[:, 0], F[:, 2]
        Lf = np.linalg.norm(toe - heel)
        A = lambda x, y, z, heel=heel, side=side, fwd=fwd, up=up: heel + side * x + fwd * z + up * y
        Rf = np.stack([side, up, fwd], axis=1)
        prims = [RoundCone(A(0, 3.2, 3.2), A(0, 2.7, Lf - 3.4), 3.4, 3.6, "shoe_body"),
                 RoundBox(A(0, 0.9, Lf / 2), (3.8, 0.85, Lf / 2), 0.6, Rf, "sole"),
                 RoundBox(A(0, 1.8, 2.6), (3.3, 1.7, 2.5), 0.6, Rf, "heel")]

        def shoe_cut(Q, d, heel=heel, up=up, fwd=fwd):
            rel = Q - heel
            return np.maximum(d, rel @ up - (6.9 - 0.17 * (rel @ fwd)))

        shoes.append(Group(name, MAT["shoes"], prims, k=1.0, cut=shoe_cut))
    groups += shoes

    # --- 髪：頭全体のふくらみ＋外ハネボブ＋毛束（前髪・横髪・後ろ髪）。毛先は重力で垂れる ------
    Rh = head_frame(P)
    o = P["head"]
    HL = lambda x, y, z: o + Rh @ v3(x, y, z)
    HC = v3(0, 17.5, -1.0)      # 頭蓋の中心（頭の座標）

    def chain(pts, radii, tag, n=3):
        """制御点を通るなめらかな曲線に沿って、太さが変わる円錐をつなげた毛束。"""
        cs = []
        P2 = [HL(*p) for p in pts]
        curve = []
        m = len(P2)
        for i in range(m - 1):
            p0, p1, p2_, p3 = P2[max(i - 1, 0)], P2[i], P2[i + 1], P2[min(i + 2, m - 1)]
            for j in range(n):
                t = j / n
                curve.append(0.5 * (2 * p1 + (-p0 + p2_) * t + (2 * p0 - 5 * p1 + 4 * p2_ - p3) * t * t
                                    + (-p0 + 3 * p1 - 3 * p2_ + p3) * t ** 3))
        curve.append(P2[-1])
        rr = np.interp(np.linspace(0, 1, len(curve)), np.linspace(0, 1, len(radii)), radii)
        for i in range(len(curve) - 1):
            cs.append(RoundCone(curve[i], curve[i + 1], rr[i], rr[i + 1], tag))
        return cs

    def on_skull(d, r):
        d = d / np.linalg.norm(d)
        return tuple(HC + d * r)

    # 髪の土台：頭蓋より 1〜1.5px 大きい頭のふくらみ＋ボブのかたまり（毛束の下地）
    hair = [Ellipsoid(HL(0, 18.4, -1.4), (14.9, 14.3, 14.8), Rh, "crown")]
    hair.append(Ellipsoid(HL(0, 11.2, -3.2), (16.0, 14.2, 14.2), Rh, "bob"))
    # 後ろ〜横の毛束：すべてつむじ（頭頂の後ろ寄り、少し右）から頭の丸みに沿って流れ、
    # 耳の高さから下へ落ちて、肩の上で外へ跳ねる。太さと長さを「大・中・小」で変えて規則的にしない
    whorl = np.array([-0.18, 0.78, -0.6])
    widths = [3.4, 2.3, 3.0, 2.0, 3.6, 2.5, 3.2, 2.1, 3.5, 2.7, 3.0, 2.2, 3.3]
    tipdy = [-0.6, 0.6, -1.4, 0.9, -0.2, -1.0, 0.4, -1.6, 0.2, 0.8, -0.9, 0.5, -0.4]
    for k, az in enumerate(np.linspace(-138, 138, 13)):
        a_ = math.radians(az)
        hor = np.array([math.sin(a_), 0.0, -math.cos(a_)])
        eq = hor + np.array([0, 0.18, 0])
        p0 = on_skull(whorl * 0.8 + eq * 0.2, 14.6)
        p1 = on_skull(whorl * 0.45 + eq * 0.55, 14.4)     # 上の方は土台の中に沈めて、表面はなめらかに
        p2 = on_skull(eq, 14.6)
        p3 = tuple(np.array([0, 5.0, -2.6]) + hor * 15.2)
        p4 = tuple(np.array([0, 0.6 + tipdy[k] * 0.5, -2.6]) + hor * 16.8)   # 下の方で束が分かれて見える
        p5 = tuple(np.array([0, -2.6 + tipdy[k], -2.4]) + hor * (20.6 + 0.4 * tipdy[k]))
        w = widths[k]
        hair += chain([p0, p1, p2, p3, p4, p5], [w * 0.7, w * 0.85, w * 0.85, w * 0.8, w * 0.6, 0.45], "strand")
    front = []   # 横髪と前髪は「顔の前を空ける」切り取りの対象外にするため別グループ
    # 横髪：こめかみから頬に沿って S 字に下り、毛先で外へ跳ねる。後ろにもう1本細い束を重ねる
    sx_ = SIDE_LOCK_OUT   # v7 は丸い頬を見せるため横髪を外へ
    for s_ in (-1, 1):
        front += chain([(s_ * (11.6 + sx_), 22.0, 7.0 - sx_ * 0.6), (s_ * (12.8 + sx_), 14.0, 8.2 - sx_ * 0.8),
                        (s_ * (12.5 + sx_), 7.5, 8.2 - sx_ * 0.8), (s_ * (13.9 + sx_), 1.4, 7.4 - sx_ * 0.6),
                        (s_ * (16.8 + sx_), -2.4, 6.4 - sx_ * 0.5)], [2.8, 2.6, 2.2, 1.4, 0.45], "side_lock")
        front += chain([(s_ * (13.2 + sx_), 21.0, 4.6), (s_ * (14.4 + sx_), 12.0, 5.6), (s_ * (15.0 + sx_), 4.0, 5.2),
                        (s_ * (17.2 + sx_), 0.6, 4.4)], [2.0, 1.8, 1.2, 0.4], "side_lock")
    # 前髪：分け目（画面左寄り）から放射状に流れる。中央の束が一番長く太い、間に細い束。
    # 毛先は少し内側（中央）へ向け、束の間から額が見える（シースルーバング）
    part_x = -2.4
    bangs_spec = [(-11.0, -11.8, 19.8, 1.7), (-8.0, -8.6, 17.8, 2.4), (-5.0, -4.6, 18.8, 1.4),
                  (-1.8, -1.0, 16.0, 2.8), (1.6, 2.4, 17.4, 2.4), (4.8, 5.4, 18.9, 1.4),
                  (8.0, 8.6, 17.6, 2.3), (11.0, 11.9, 19.9, 1.6)]
    for rx, tx, ty, w in bangs_spec:
        ty += BANG_UP             # v7 は前髪を短くしておでこを広く見せる
        root_x = part_x + (rx - part_x) * 0.55
        inward = -0.5 if tx > 0 else 0.5
        front += chain([(root_x, 28.6, 4.2), (rx, 25.6, 11.0), (tx * 0.98, (25.0 + ty) / 2, 12.9),
                        (tx + inward, ty, 13.4)], [w * 0.9, w, w * 0.55, 0.3], "bang")
    # アホ毛
    ah = [HL(0.6, 30.4, 1.8), HL(2.4, 34.4, 1.2), HL(5.2, 36.6, 0.4), HL(7.6, 35.8, 0.0)]
    for i, rr in enumerate([(0.9, 0.7), (0.7, 0.55), (0.55, 0.35)]):
        hair.append(RoundCone(ah[i], ah[i + 1], rr[0], rr[1], "ahoge"))

    def hair_cut(Q, d):
        # 顔の前を空ける（前髪の束以外が顔を覆わないように）
        ql = (Q - o) @ Rh
        face_box = np.maximum.reduce([np.abs(ql[:, 0]) - 11.0, ql[:, 1] - 21.0, 1.5 - ql[:, 2], -ql[:, 1] - 8])
        return np.maximum(d, -face_box)

    def hair_warp(Q):
        # 重力：顎より下の髪ほど頭の傾きを戻す（毛先は真下へ垂れる）
        rel = Q - o
        w = np.clip((rel[:, 1] - 6.0) / 12.0, -1, 0)   # 0（上）〜 -1（下）
        a = -HEAD_TILT * 0.75 * w
        c, s = np.cos(a), np.sin(a)
        x = c * rel[:, 0] - s * rel[:, 1]
        y = s * rel[:, 0] + c * rel[:, 1]
        return np.stack([x, y, rel[:, 2]], axis=1) + o

    # 束（strand 以外）は smin を小さくして束感を残す
    groups.append(Group("hair", MAT["hair"], hair, k=2.0, cut=hair_cut, warp=hair_warp, scale=(o, HEAD_SCALE)))
    groups.append(Group("bangs", MAT["hair"], front, k=0.8, warp=hair_warp, scale=(o, HEAD_SCALE)))

    if not anatomy:
        # ストラップ：画面右の肩から胸の前を通ってバッグへ。服の表面の少し外側に沿わせる
        cloth = [g for g in groups if g.name in ("cardigan", "tee", "skirt", "bag")]
        sp = []
        a0, a1 = v3(10.4, 121.6 + bob, 0.0), v3(-7.4, 74.8 + bob, 0.0)
        zprev = 8.0
        for t in np.linspace(0, 1, 11):
            xy = a0 * (1 - t) + a1 * t
            z = surface_z(cloth, xy[0], xy[1])
            z = zprev if z is None else z
            zprev = z
            sp.append(v3(xy[0], xy[1], z + 0.8))
        sp[0] = sp[0] + v3(0, 0, -3.0)
        groups.append(Group("strap", MAT["strap"], [RoundCone(a, b, 0.8, 0.8, "strap") for a, b in zip(sp, sp[1:])],
                            k=0.5))
    # 体は足元を中心に縮小、頭は首の付け根（縮小後の位置）に元の大きさ×HEAD_SCALE で載せる
    for g in groups:
        if g.name in ("face", "hair", "bangs"):
            g.set_xf(P["head"], HEAD_SCALE, P["head"] * BODY_SCALE)
        else:
            g.set_xf(np.zeros(3), BODY_SCALE, np.zeros(3))
    return groups, P


def surface_z(groups, x, y):
    """(x, y) を前から見たときの服の表面の z（ストラップを服に沿わせるため）。"""
    z = 30.0
    for _ in range(120):
        p = v3(x, y, z)[None]
        d = min(g.d(p)[0] for g in groups)
        if d < 0.05:
            return z
        z -= max(d, 0.05)
        if z < -20:
            break
    return None


# ===========================================================================
# 5. レイ・マーチング（Gバッファ：深度・法線・パーツ ID）
# ===========================================================================
def view_matrix(yaw=BODY_YAW, pitch=PITCH):
    return rot_x(pitch) @ rot_y(yaw)


def scene_d(groups, Pts):
    ds = np.stack([g.d(Pts) for g in groups], axis=1)
    return ds.min(axis=1), ds.argmin(axis=1)


def raymarch(groups, yaw=BODY_YAW, pitch=PITCH):
    Rv = view_matrix(yaw, pitch)
    jj, ii = np.mgrid[0:H, 0:W]
    sx = ii.ravel() + 0.5 - 48.0
    sy = GROUND_ROW - (jj.ravel() + 0.5)
    O_view = np.stack([sx, sy, np.full_like(sx, 120.0)], axis=1)
    O = O_view @ Rv            # view → model（Rv の転置を掛ける）
    D = np.array([0, 0, -1.0]) @ Rv
    t = np.zeros(len(O))
    hit = np.zeros(len(O), bool)
    alive = np.ones(len(O), bool)
    for _ in range(160):
        idx = np.where(alive)[0]
        if len(idx) == 0:
            break
        Pp = O[idx] + np.outer(t[idx], D)
        d, _ = scene_d(groups, Pp)
        t[idx] += d * 0.75
        done = d < 0.03
        hit[idx[done]] = True
        far = t[idx] > 260
        alive[idx[done | far]] = False
    Pw = O + np.outer(t, D)
    return Pw, hit, t, Rv


def normals(groups, Pp, gid):
    e = 0.3
    n = np.zeros_like(Pp)
    for k in range(3):
        dv = np.zeros(3)
        dv[k] = e
        a = np.zeros(len(Pp))
        b = np.zeros(len(Pp))
        for g in np.unique(gid):
            m = gid == g
            a[m] = groups[g].d(Pp[m] + dv)
            b[m] = groups[g].d(Pp[m] - dv)
        n[:, k] = a - b
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)


def shadow(groups, Pp, Lm):
    """影の判定：表面から光の方へ光線を飛ばし、何かに当たれば影（落ち影を正しく作る）。"""
    t = np.full(len(Pp), 1.2)
    lit = np.ones(len(Pp), bool)
    alive = np.ones(len(Pp), bool)
    for _ in range(70):
        idx = np.where(alive)[0]
        if len(idx) == 0:
            break
        d, _ = scene_d(groups, Pp[idx] + np.outer(t[idx], Lm))
        blocked = d < 0.05
        lit[idx[blocked]] = False
        t[idx] += np.maximum(d, 0.15)
        alive[idx[blocked | (t[idx] > 80)]] = False
    return lit


def ambient_occlusion(groups, Pp, N):
    occ = np.zeros(len(Pp))
    for i, h in enumerate((1.0, 2.2, 3.6, 5.2)):
        d, _ = scene_d(groups, Pp + N * h)
        occ += (h - d) * (0.6 ** i)
    return occ


# ===========================================================================
# 6. セルルックの描画
# ===========================================================================
L_VIEW = nrm(v3(-0.50, 0.62, 0.60))   # 画面上で左上・手前からの光（どの向きから描いても画面上の光源は同じ）
LEVELS = [(0.90, 0), (0.72, 1), (0.16, 2), (-0.12, 3)]


def level_of(lam):
    out = np.full(lam.shape, 4, int)
    for th, k in reversed(LEVELS):
        out[lam > th] = k
    return out


def render(bob=0.0, eyes="open", anatomy=False, yaw=BODY_YAW, face_details=True):
    groups, P = build_scene(bob, anatomy)
    Pw, hit, depth, Rv = raymarch(groups, yaw)
    names = [g.name for g in groups]
    gid_full = np.full(W * H, -1)
    idx = np.where(hit)[0]
    Ph = Pw[idx]
    _, gid = scene_d(groups, Ph)
    gid_full[idx] = gid
    N = normals(groups, Ph, gid)
    Ph_src = Ph.copy()            # 各パーツの元の座標（模様・顔の法線・インナーカラーの判定に使う）
    for g in np.unique(gid):
        m = gid == g
        Ph_src[m] = groups[g].to_src(Ph[m])
    Lm = L_VIEW @ Rv                      # 光の向きをモデル座標へ
    Vm = np.array([0, 0, 1.0]) @ Rv       # 視線（カメラの方向）

    # 顔は「球の法線」を使う（法線転写）：自分の凹凸で汚い影が出るのを防ぎ、顎の下と外側だけ影にする
    fi = names.index("face")
    mface = gid == fi
    if mface.any():
        Rh = head_frame(P)
        c = P["head"] + Rh @ v3(0, 15.0, -2.0)
        rad = np.array([12.0, 15.0, 12.0])
        q = (Ph_src[mface] - c) @ Rh / rad
        ns = (q / rad) @ Rh.T
        ns = ns / np.linalg.norm(ns, axis=1, keepdims=True)
        ns = ns + Vm * 0.9                 # 正面寄りに倒して影を減らす
        N[mface] = ns / np.linalg.norm(ns, axis=1, keepdims=True)

    lam = N @ Lm
    lam -= 0.10 * np.clip((100 - Ph[:, 1]) / 100, 0, 1)   # 下ほど少し暗い（環境光は上から）
    for gname, b in (("hair", -0.14), ("bangs", -0.08)):   # 髪は明るい色なので陰影を強めに
        lam[gid == names.index(gname)] += b
    lv = level_of(lam)
    lit = shadow(groups, Ph + N * 0.6, Lm)
    lv[~lit] = np.maximum(lv[~lit], 3)
    deep = (~lit) & (lam < 0.05)
    lv[deep] = 4
    occ = ambient_occlusion(groups, Ph + N * 0.1, N)
    noao = np.isin(gid, [names.index("face")])
    is_hair = np.isin(gid, [names.index("hair"), names.index("bangs")])
    th = np.where(is_hair, 4.2, 2.6)    # 髪は束の溝が多いので、オクルージョンを弱めて暗くなりすぎないように
    lv[(occ > th) & ~noao] = np.minimum(lv[(occ > th) & ~noao] + 1, 4)

    if SIMPLE:
        # 単純化（docs/14）：アニメ化で線と色分けを減らすのと同じ考え方で、計算で出る細かな明暗を整理する
        fi_ = names.index("face")
        mf = gid == fi_
        lv[mf] = np.where(lit[mf], 2, 3)             # 顔はベタ。前髪・横髪の落ち影（1影）だけ残す
        lv[is_hair] = np.where(lv[is_hair] <= 2, 2, 3)  # 髪はベース・影の2段階（＋天使の輪）
        lv[(lv == 4) & ~deep] = 3                     # 2影は光が届かない深い所だけ

    # 髪：鏡面反射のハイライト＝天使の輪（毛束の溝で自然に途切れる）
    hi_ = names.index("hair")
    mh = gid == hi_
    Hh = nrm(Lm + Vm)
    spec = (N @ Hh) ** 24
    ring = mh & (spec > (0.3 if SIMPLE else 0.45)) & lit
    lv[ring] = np.maximum(lv[ring] - 2, 0)
    # インナーカラー：ボブの内側（首に近い面）
    Rh = head_frame(P)
    ql = (Ph_src - P["head"]) @ Rh
    inner = mh & (ql[:, 1] < 10.5) & (np.hypot(ql[:, 0], ql[:, 2] + 3.0) < 14.2)

    # 段階 → 色
    img = np.zeros((H * W, 4), np.uint8)
    lv_full = np.full(W * H, 2)
    lv_full[idx] = lv
    mats = [g.mat for g in groups]
    if anatomy:
        img_idx = anatomy_colors(groups, Ph, gid, lv)
        img[idx] = img_idx
    else:
        for g in range(len(groups)):
            m = gid == g
            for k in range(5):
                mk = m & (lv == k)
                img[idx[mk]] = ramp(mats[g], k)
        for k in range(5):
            mk = inner & (lv == k)
            img[idx[mk]] = ramp(MAT["inner"], min(k + 1, 4))

    # ディテール（3D 座標から模様を付ける）
    if not anatomy:
        texture_details(img, idx, Ph_src, gid, names, lv, P, bob)

    # リムライト：影側で、輪郭に近い（視線とほぼ直角の）面
    fres = 1 - np.abs(N @ Vm)
    rim = (fres > 0.72) & (lv >= 3) & ~mface
    for g in range(len(groups)):
        m = rim & (gid == g)
        if anatomy:
            continue
        img[idx[m]] = mix(ramp(mats[g], 3), RIM, 0.45)

    img = img.reshape(H, W, 4)
    gmap = gid_full.reshape(H, W)
    vz = (Pw @ Rv.T)[:, 2].reshape(H, W)   # カメラ方向の深さ（大きいほど手前）
    vz[gmap < 0] = -1e9
    lvmap = lv_full.reshape(H, W)
    img = outlines(img, gmap, vz, lvmap, mats, groups, anatomy)
    if SIMPLE and not anatomy:
        img = cleanup(img, gmap)

    if face_details and not anatomy:
        draw_face(img, gmap, vz, names, P, Rv, eyes)
        draw_accessories(img, gmap, vz, names, P, Rv, bob)
    return img, P, Rv


HAIR_JUMP = 5.0   # 髪の中の輪郭線は深さが大きく飛ぶ所（束が手前に重なる所）だけ：線を減らしてアニメらしく


def cleanup(img, gmap):
    """ドット絵の手直しを自動で：同じパーツの中で、上下左右4つと色が違う孤立した1px を、
    周りで一番多い色に置き換える（ノイズの点を消す。docs/00 0-2「孤立ピクセル」）。"""
    out = img.copy()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            g = gmap[y, x]
            if g < 0:
                continue
            nb = [(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)]
            if any(gmap[a, b] != g for a, b in nb):
                continue
            c = tuple(img[y, x])
            cols = [tuple(img[a, b]) for a, b in nb]
            if c in cols:
                continue
            best = max(set(cols), key=cols.count)
            if cols.count(best) >= 3:
                out[y, x] = best
    return out


def outlines(img, gmap, vz, lvmap, mats, groups, anatomy):
    """輪郭線：パーツ ID が変わる所・深度が大きく飛ぶ所に、手前側のピクセルへ1px の線。
    明部は明るめの線、影は濃い線（線の強弱）。"""
    out = img.copy()
    hair_ids = [i for i, g in enumerate(groups) if g.name in ("hair", "bangs")]
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ng = shift(gmap, dx, dy)
        nz = shift(vz, dx, dy)
        valid = shift(np.ones_like(gmap, bool), dx, dy)
        ng = np.where(valid, ng, -1)
        nz = np.where(valid, nz, -1e9)
        here = gmap >= 0
        edge_empty = here & (ng < 0)
        diff = here & (ng >= 0) & (ng != gmap) & (vz > nz)
        jt = np.where(np.isin(gmap, hair_ids), HAIR_JUMP + (2.5 if SIMPLE else 0.0), 3.0)
        jump = here & (ng >= 0) & (ng == gmap) & (vz - nz > jt)
        e = edge_empty | diff | jump
        ys, xs = np.where(e)
        for y, x in zip(ys, xs):
            g = gmap[y, x]
            m = mats[g]
            if anatomy:
                out[y, x] = (70, 60, 70, 255)
                continue
            lit = lvmap[y, x] <= 2
            dark = m["line"]
            soft = mix(m["line"], m.get("s2", m["s1"]), 0.55)
            if edge_empty[y, x]:
                out[y, x] = soft if lit else dark
            else:
                out[y, x] = (m.get("s2", m["s1"]) if lit else soft) if jump[y, x] else (soft if lit else dark)
    return out


def project(p, Rv):
    v = Rv @ p
    return v[0] + 48.0, GROUND_ROW - v[1], v[2]


def texture_details(img, idx, Ph, gid, names, lv, P, bob):
    def paint(mask, lvl_shift, matname):
        sel = np.where(mask)[0]
        for i in sel:
            img[idx[i]] = ramp(MAT[matname], int(min(max(lv[i] + lvl_shift, 0), 4)))

    gi = {n: k for k, n in enumerate(names)}
    # カーディガン：裾のリブとケーブル編み（胴の座標で縦の模様）
    if "cardigan" in gi:
        m = gid == gi["cardigan"]
        y = Ph[:, 1]
        paint(m & (y < 82.5) & (np.floor(Ph[:, 0]) % 2 == 0), 1, "cardigan")
        cab = m & (y > 82) & (y < 112) & (np.abs(np.abs(Ph[:, 0]) - 11.5 - 0.6 * np.sign(np.sin(y * 0.9))) < 0.6)
        paint(cab, 1, "cardigan")
    for side in ("L", "R"):
        k = "sleeve_fore_" + side
        if k in gi:
            el, wr = P["elbow_" + side], P["wrist_" + side]
            u = nrm(wr - el)
            s = (Ph - el) @ u
            m = (gid == gi[k]) & (s > np.linalg.norm(wr - el) - 1.6)
            paint(m & (np.floor((Ph @ np.cross(u, v3(0, 0, 1))) * 1.0) % 2 == 0), 1, "cardigan")
    for k, top in (("socks_w", 27.6), ("socks_f", 29.0)):
        if k in gi:
            m = gid == gi[k]
            paint(m & (Ph[:, 1] > top - 1.6), 1, "socks")
            paint(m & (Ph[:, 1] > top - 3.4) & (Ph[:, 1] <= top - 1.6) & (np.floor(Ph[:, 0] * 1.4) % 2 == 0), 1, "socks")
    for k in ("shoe_w", "shoe_f"):
        if k in gi:
            m = gid == gi[k]
            paint(m & (Ph[:, 1] < 1.6), 1, "shoes")


# ---------------------------------------------------------------------------
# 顔パーツのスタンプ（docs/11 11-5：2020年代の目・顔）
# ---------------------------------------------------------------------------
FACE_STYLE = "modern"   # "classic" で v4 までの目（比較用）
# 顔パーツの高さ（頭の座標、頭頂 30.8・顎 0.6）。目を少し下げ、口を目に近づける（docs/12 12-2）
EYE_Y, NOSE_Y, MOUTH_Y = 12.2, 7.6, 5.9
EYE_X = 7.3
# 眉（docs/14 14-7）：前髪の毛先と重ならない高さ（目の上 2px ほど）に、髪の輪郭線より明るく肌よりはっきり濃い色で
BROW_X, BROW_Y = 7.0, 18.8
BROW_FAR_DY = 0.0                  # 奥の眉の高さの調整（前髪の毛先との重なりを避ける）
BROW_FAR = ["...EEE", ".EE..."]    # 奥（画面左）の眉：右端＝眉頭
BROW_NEAR = ["EEE...", "...EE."]   # 手前（画面右）の眉：左端＝眉頭
BROW_PAL = dict(FACE_PAL, E=hx("#96604f"))   # 前髪の輪郭線（#6e4a42）より明るく、肌の上ではっきり見える茶色

MODERN_PAL = {
    "c": hx("#d9a29a"),  # 二重のライン（細く、肌より少し濃い色）
    "K": hx("#4a2638"),  # 上まぶたのライン（黒ではなく暗い赤紫）
    "k": hx("#86505f"),  # まつ毛の毛束・中間色
    "q": hx("#f8dde4"),  # まつ毛の上の白い描き込み（白抜き）
    "W": hx("#ffffff"),
    "w": hx("#e6dbe8"),  # 白目のまぶたの影（髪色を少し映した淡い色）。白目の両端は暗く中央は明るい
    "U": hx("#46408f"),  # 瞳の上部の差し色（虹彩と違う系統の青紫）
    "d": hx("#5a2f72"),  # 虹彩の暗部
    "I": hx("#9a58b0"),  # 虹彩
    "J": hx("#e47fb6"),  # 虹彩の下部（ピンク）
    "G": hx("#ffc6e2"),  # 虹彩の最下部の照り返し
    "P": hx("#2e1840"),  # 瞳孔（小さめ）
    "L": hx("#ffffff"),  # ハイライト（小さな点）
    "l": hx("#f2e6ff"),  # 小さな副ハイライト
    "b": hx("#c88a94"),  # 下まつ毛（目尻側だけ）
    "x": hx("#c6f2ff"),  # 瞳の下部の補色のきらめき（水色）
    "p": hx("#f0a2aa"),  # 目頭の赤み（涙丘・粘膜の色）
    "t": hx("#fff4ee"),  # 涙袋のハイライト
    "r": hx("#ffc2b8"),  # 涙袋の下の赤み（サーモンピンク）
}

#   列0 = 目尻（外側）、列7 = 目頭。8×8 の目（v4 の 8×10 より横長）＋二重・下まつ毛・涙袋（docs/11 11-5）
EYE_MODERN = [
    "..ccc...",   # 0 二重のライン
    "k.KKKKk.",   # 1 まつ毛の毛束（目尻に1本はね）
    "KKKqkkkK",   # 2 上まぶた：目尻が太く目頭へ細い、q＝白抜き
    "KwdLPPdw",   # 3 瞳の上部はまぶたに少し隠れる（力の抜けた優しい目）。目尻が下がる（たれ目）
    ".WdIPPdW",   # 4 黒目がち：瞳は目の幅の 5/8、瞳孔は大きめ
    ".WdJxldp",   # 5 下は明るいピンク、x＝きらめき、l＝副ハイライト、p＝目頭の赤み
    "..dGGd..",   # 6 扇形の照り返し（瞳の下端が下まぶたに接する）
    ".bb.....",   # 7 下まつ毛は目尻側だけ
    "..tttt..",   # 8 ふっくらした涙袋
]
EYE_MODERN_HALF = [
    "........",
    "........",
    "..ccc...",
    "k.KKKKk.",
    "KKKqkkkK",
    "KwdJxJdp",
    "..dGGd..",
    ".bb.....",
    "..tttt..",
]
EYE_MODERN_CLOSED = [
    "........",
    "........",
    "........",
    "..ccc...",
    "........",
    "k.......",
    "KK....KK",
    "..KKKK..",
    "..tttt..",
]
IRIS_ROWS = {3, 4, 5, 6}   # 瞳の行（右目にするとき左右反転しない）


def mirror_eye(rows, iris_rows):
    """右目：まぶた・まつ毛の形は左右反転、瞳とハイライトの向きはそのまま（寄り目防止）。
    列0＝目尻、列1＝白目、列2〜6＝瞳、列7＝目頭（8px 幅）。"""
    out = []
    for j, r in enumerate(rows):
        m = r[::-1]
        out.append(m[0] + r[2:7] + m[6:] if j in iris_rows else m)
    return out


def draw_face_modern(put, eyes, hi_, bi):
    rows = {"open": EYE_MODERN, "half": EYE_MODERN_HALF, "closed": EYE_MODERN_CLOSED}[eyes]
    iris = IRIS_ROWS if eyes == "open" else ({5, 6} if eyes == "half" else set())
    far = [r[:1] + r[2:] for r in rows]          # 奥の目（3/4 向き）は1列狭く
    # 目は前髪の上にも描く（前髪越しに目元が見える「透け」。まつ毛が前髪に隠れると眠そうに見える）
    put((-EYE_X, EYE_Y, 11.6), far, MODERN_PAL, allow=(bi,))
    put((EYE_X, EYE_Y, 11.6), mirror_eye(rows, iris), MODERN_PAL, allow=(bi,))
    # 眉：細く、ゆるいアーチ。眉頭（内側）を少し上げた「ほんのり困り眉」は守ってあげたくなる可愛さ
    put((-BROW_X, BROW_Y + BROW_FAR_DY, 12.4), BROW_FAR, BROW_PAL, allow=(hi_, bi))
    put((BROW_X, BROW_Y, 12.4), BROW_NEAR, BROW_PAL, allow=(hi_, bi))
    put((0.4, NOSE_Y, 12.6), ["N"], FACE_PAL)                   # 鼻は1px の影だけ
    # 口：小さな ∪ の笑顔（口角を上げる）。目に近づけて「目と口の三角形」を低く広く（狸顔・童顔）
    put((0.2, MOUTH_Y, 11.9), ["M..M", ".MM."], {"M": hx("#b45a66")})
    # チーク：斜線は使わず、涙袋のすぐ下に横長でやわらかく
    soft = {"r": hx("#ffc8be"), "R": hx("#ffaaa4")}
    put((-8.4, 7.4, 10.4), [".rrrr", "rRRRr", ".rrr."], soft)
    put((9.0, 7.4, 10.4), ["rrrr.", "rRRRr", ".rrr."], soft)


# v7：丸く単純な目（docs/13）。7×7、瞳は大きく丸く、ハイライトは大1＋小1、まつ毛は目尻に1本だけ。
# 列0＝目尻（輪郭線）、列1＝白目、列2〜5＝瞳、列6＝目頭（開いたまま）
ROUND_PAL = {
    "K": hx("#5a3038"),  # まぶたの線（濃い赤茶。細く一定）
    "k": hx("#9a6670"),  # 下まぶた・まつ毛の淡い線
    "W": hx("#ffffff"),
    "d": hx("#4a2a66"),  # 瞳の上部（暗い）
    "I": hx("#8a52a8"),  # 瞳
    "J": hx("#c27ac4"),  # 瞳の下部（明るい）
    "G": hx("#ecb6e4"),  # 瞳の最下部
    "P": hx("#2e1a3e"),  # 瞳孔
    "L": hx("#ffffff"),  # 大きめのハイライト
    "l": hx("#f4e6ff"),  # 小さなハイライト
}
EYE_ROUND = [
    ".kKKKK.",
    "KKddddK",
    "KWdLLdW",
    "KWdLPdW",
    ".WIPPIW",
    ".WJIlJW",
    "..JGGJ.",
    "..kkk..",
]
EYE_ROUND_HALF = [
    ".......",
    ".......",
    ".kKKKK.",
    "KKddddK",
    "KWJIlJW",
    "..JGGJ.",
    "..kkk..",
    ".......",
]
EYE_ROUND_CLOSED = [".......", ".......", ".......", ".......", "k......", "KK...KK", "..KKK..", "......."]


ROUND_EYE_X, ROUND_EYE_Y, ROUND_NOSE_Y, ROUND_MOUTH_Y = 7.9, 11.3, 8.0, 6.6


def mirror_eye7(rows, iris_rows):
    out = []
    for j, r in enumerate(rows):
        m = r[::-1]
        out.append(m[0] + r[2:6] + m[5:] if j in iris_rows else m)
    return out


def draw_face_round(put, eyes, hi_, bi):
    rows = {"open": EYE_ROUND, "half": EYE_ROUND_HALF, "closed": EYE_ROUND_CLOSED}[eyes]
    iris = {1, 2, 3, 4, 5, 6} if eyes == "open" else ({3, 4, 5} if eyes == "half" else set())
    far = [r[:1] + r[2:] for r in rows]
    # 目は低く（頭頂から 0.64）、離して（両目の間 ≒ 片目の幅の 1.2 倍）置く
    put((-ROUND_EYE_X, ROUND_EYE_Y, 11.8), far, ROUND_PAL, allow=(bi,))
    put((ROUND_EYE_X, ROUND_EYE_Y, 11.8), mirror_eye7(rows, iris), ROUND_PAL, allow=(bi,))
    # 眉：細く短く、目から少し離して高めに
    put((-7.6, 17.8, 12.6), ["..EEE", "EE..."], FACE_PAL, allow=(hi_, bi))
    put((7.6, 17.8, 12.6), ["EEE..", "...EE"], FACE_PAL, allow=(hi_, bi))
    put((0.4, ROUND_NOSE_Y, 12.8), ["N"], {"N": hx("#f2b4a6")})          # 鼻はごく淡い1px
    put((0.2, ROUND_MOUTH_Y, 12.2), ["M.M", ".M."], {"M": hx("#a85a62")})  # 小さな口（目に近い）
    soft = {"r": hx("#ffcbc0"), "R": hx("#ffb0a8")}              # 丸い頬の赤み
    put((-9.6, 7.8, 10.0), [".rr.", "rRRr", ".rr."], soft)
    put((10.2, 7.8, 10.0), [".rr.", "rRRr", ".rr."], soft)


def draw_face_classic(put, eyes, hi_, bi):
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
    eye_half = ["........", "........", "........", "..KKKKK.", "KKKkkkKK", ".WdddddW", ".WdLLPIW",
                ".WIJJGIW", "..JGGJ..", "...bbb.."]
    eye_closed = ["........"] * 6 + ["KK......", ".KKKKKKK", "..k..k..", "........"]
    rows = {"open": eye_open, "half": eye_half, "closed": eye_closed}[eyes]
    right = []
    for r in rows:
        m = r[::-1]
        right.append(m[0] + r[2:7] + m[6:] if r[2:7].strip(".") else m)
    far = [r[:1] + r[2:] for r in rows]
    put((-7.3, 13.6, 11.6), far, EYE_PAL)
    put((7.3, 13.6, 11.6), right, EYE_PAL)
    put((-7.0, 20.0, 12.4), ["..EEEE", ".E...."], FACE_PAL, allow=(hi_, bi))
    put((7.0, 20.0, 12.4), [".EEEE..", ".....E."], FACE_PAL, allow=(hi_, bi))
    put((0.4, 8.0, 12.6), ["N"], FACE_PAL)
    put((0.2, 5.8, 11.9), ["M..M", ".MM."], FACE_PAL)
    put((-8.6, 8.9, 10.2), [".BBB", "BCBC"], FACE_PAL)
    put((9.2, 8.9, 10.2), ["BBBB.", "BCBCB"], FACE_PAL)


def draw_face(img, gmap, vz, names, P, Rv, eyes):
    fi, hi_, bi = names.index("face"), names.index("hair"), names.index("bangs")
    Rh = head_frame(P)
    o = P["head"]

    def put(local, rows, pal, allow=(None,), face_only=True):
        x, y, z = project(head_dst(o + Rh @ v3(*local), P), Rv)
        w, h = max(len(r) for r in rows), len(rows)
        x0, y0 = int(round(x - w / 2)), int(round(y - h / 2))
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch == "." or ch not in pal:
                    continue
                px, py = x0 + i, y0 + j
                if not (0 <= px < W and 0 <= py < H):
                    continue
                g = gmap[py, px]
                if face_only and g != fi and g not in allow:
                    continue
                img[py, px] = pal[ch]

    if FACE_STYLE == "classic":
        draw_face_classic(put, eyes, hi_, bi)
    elif FACE_STYLE == "round":
        draw_face_round(put, eyes, hi_, bi)
    else:
        draw_face_modern(put, eyes, hi_, bi)
    # ヘアクリップ（キャラの左のこめかみ＝画面右）
    clip = [".ppp...", "pPPPpq.", "pPhPPPq", ".pPPPq.", "..qqq.."]
    put((11.0, 24.5, 9.0), clip, {"p": ACC["clip_line"], "P": ACC["clip"], "h": ACC["clip_hi"],
                                   "q": ACC["clip_line"]}, allow=(hi_, bi), face_only=True)


def draw_accessories(img, gmap, vz, names, P, Rv, bob):
    gi = {n: k for k, n in enumerate(names)}
    pj = lambda p: project(body_dst(p), Rv)   # 体の座標 → 画面（体の縮小を反映）

    def dot(p, color, on):
        x, y, z = pj(p)
        px, py = int(x), int(y)
        if 0 <= px < W and 0 <= py < H and gmap[py, px] in [gi[n] for n in on if n in gi]:
            img[py, px] = color

    TX = lambda c0: torso_xf(v3(*c0), bob)[0]
    for x in (-2.2, -1.1, 0, 1.1, 2.2):  # ネックレス
        dot(TX((x, 118.6 - 0.18 * x * x, 4.2)), ACC["gold"], ("torso_skin", "tee"))
    for y in (110, 103, 96, 89):  # カーディガンのボタン（キャラの左の前立て）
        c = TX((5.6, y, 9.6))
        x, yy, z = pj(c)
        px, py = int(x), int(yy)
        if 0 <= px < W and 0 <= py < H and gmap[py, px] == gi["cardigan"]:
            img[py, px] = ACC["button"]
    # Tシャツのハート
    hc = TX((-3.6, 104.5, 8.6))
    x, y, z = pj(hc)
    for j, row in enumerate([".h.h.", "hhhhh", ".hhh.", "..h.."]):
        for i, ch in enumerate(row):
            px, py = int(x) - 2 + i, int(y) - 1 + j
            if ch == "h" and 0 <= px < W and 0 <= py < H and gmap[py, px] == gi["tee"]:
                img[py, px] = MAT["bag"]["base"]
    # バッグの金具
    bx, by, bz = pj(v3(-11.4, 74.4 + bob, 8.2))
    for i, c in enumerate([MAT["bag"]["line"], ACC["gold"], ACC["gold"], MAT["bag"]["line"]]):
        px, py = int(bx) - 2 + i, int(by)
        if 0 <= px < W and 0 <= py < H and gmap[py, px] == gi["bag"]:
            img[py, px] = c
    # 膝の血色
    for side, leg in (("L", "leg_w"), ("R", "leg_f")):
        k = P["knee_" + side]
        x, y, z = pj(k + v3(0, 0.8, 3.4))
        for dxp in (0, 1):
            px, py = int(x) + dxp - 1, int(y)
            if 0 <= px < W and 0 <= py < H and gmap[py, px] == gi[leg]:
                img[py, px] = FACE_PAL["B"]


# ===========================================================================
# 7. 解剖モデルの色分け表示（骨の目印・筋肉ごとに色を変える）
# ===========================================================================
ANAT_COLORS = {
    "vastus_lateralis": "#e86a6a", "rectus_femoris": "#f08a7a", "vastus_medialis": "#ff9f80",
    "adductors": "#f2b45a", "hamstrings": "#b07ad0", "greater_trochanter": "#fff4e0",
    "condyles": "#fff4e0", "patella": "#ffffff", "patellar_ligament": "#d8e4f0", "tibial_tuberosity": "#fff4e0",
    "tibia": "#fff4e0", "gastrocnemius_medial": "#e870a8", "gastrocnemius_lateral": "#f090c0",
    "soleus": "#c06090", "tibialis_anterior": "#f0d060", "achilles": "#d8e4f0",
    "malleolus_medial": "#ffffff", "malleolus_lateral": "#ffffff", "femur": "#fff4e0",
    "ribcage": "#cccccc", "breast": "#cccccc", "abdomen": "#cccccc", "pelvis": "#cccccc", "gluteus": "#cccccc",
    "deltoid": "#e88a6a", "trapezius": "#d0a060", "neck": "#ffd8c8", "sternocleidomastoid": "#e86a8a",
    "clavicle": "#ffffff", "cranium": "#ffe1cf", "cheek": "#ffe1cf", "chin": "#ffe1cf", "jaw": "#ffe1cf",
    "cheekbone": "#ffe1cf", "palm": "#ffe1cf", "finger": "#ffe1cf", "thumb": "#ffe1cf",
    "humerus": "#fff4e0", "biceps": "#e86a6a", "triceps": "#b07ad0", "brachialis": "#f08a7a",
    "olecranon": "#ffffff", "epicondyle": "#ffffff", "radius_ulna": "#fff4e0", "brachioradialis": "#f2b45a",
    "flexors": "#f090c0", "extensors": "#c06090", "wrist": "#fff4e0",
}


def anatomy_colors(groups, Ph, gid, lv):
    out = np.zeros((len(Ph), 4), np.uint8)
    for g, grp in enumerate(groups):
        m = np.where(gid == g)[0]
        if len(m) == 0:
            continue
        if grp.name in ("hair", "suit", "shoe_w", "shoe_f", "hands"):
            base = {"hair": "#d8c8b8", "suit": "#9aa0b4", "hands": "#ffe1cf"}.get(grp.name, "#4a4050")
            cols = np.array([hx(base)] * len(m))
        else:
            pi = grp.nearest_prim(Ph[m])
            cols = []
            for k in pi:
                tag = grp.prims[k].tag
                tag = tag.split("_", 1)[-1] if grp.name.startswith(("leg", "arm")) else tag
                cols.append(hx(ANAT_COLORS.get(tag, "#ffe1cf")))
            cols = np.array(cols)
        shade = np.array([1.12, 1.05, 1.0, 0.82, 0.66])[lv[m]]
        c = np.clip(cols[:, :3] * shade[:, None], 0, 255)
        out[m, :3] = c.astype(np.uint8)
        out[m, 3] = 255
    return out


# ===========================================================================
# 8. 書き出し
# ===========================================================================
BG_TOP, BG_BOTTOM = (250, 236, 240), (222, 230, 250)


def composite(sprite, scale, P=None, Rv=None):
    h, w = sprite.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    t = yy / (h - 1)
    base = np.zeros((h, w, 4), np.uint8)
    for i in range(3):
        base[..., i] = (BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t).astype(np.uint8)
    base[..., 3] = 255
    if P is not None:  # 接地影：支持脚は足全体、遊脚はつま先だけ
        for name, rx, ry, k in (("ankle_L", 6.5, 1.6, 0.68), ("ankle_R", 3.6, 1.2, 0.72)):
            a = P[name]
            x, y, z = project(body_dst(v3(a[0], 0, a[2] + 5)), Rv)
            m = ((xx + 0.5 - x) / rx) ** 2 + ((yy + 0.5 - GROUND_ROW) / ry) ** 2 <= 1
            base[m, :3] = (base[m, :3] * k).astype(np.uint8)
        m = ((xx + 0.5 - 49) / 15) ** 2 + ((yy + 0.5 - GROUND_ROW) / 2.4) ** 2 <= 1
        base[m, :3] = (base[m, :3] * 0.88).astype(np.uint8)
    a = sprite[..., 3:4] / 255.0
    base[..., :3] = (sprite[..., :3] * a + base[..., :3] * (1 - a)).astype(np.uint8)
    return Image.fromarray(base, "RGBA").resize((w * scale, h * scale), Image.NEAREST)


def report():
    """アニメ顔に合う体の比率（docs/11 11-1・11-3）を 3D モデルから計測して表示する。"""
    P = make_pose(0.0)
    Rh = head_frame(P)
    o = P["head"]
    top = head_dst(o + Rh @ v3(0, 30.8, -1.0), P)[1]
    chin = head_dst(o + Rh @ v3(0, 0.6, 5.4), P)[1]
    BS = BODY_SCALE
    head = top - chin
    HS = HEAD_SCALE
    rnd = FACE_STYLE == "round"
    crx = 13.7 + 0.6 * ROUND_FACE
    ey, ny, my = (ROUND_EYE_Y, ROUND_NOSE_Y, ROUND_MOUTH_Y) if rnd else (EYE_Y, NOSE_Y, MOUTH_Y)
    ecx = ROUND_EYE_X if rnd else EYE_X
    face_w = 2 * crx * math.sqrt(1 - ((17.5 - ey) / 13.3) ** 2) * HS   # 目の高さでの顔の幅
    eye_w, eye_cx, eye_h = (7.0 if rnd else 8.0), ecx * HS, (7 if rnd else 6)
    rows = [
        ("頭身", top / head),
        ("首の長さ（顎〜頸窩）÷ 頭の高さ", (chin - P["neck_pit"][1] * BS) / head),
        ("首の幅 ÷ 顔の幅", 8.2 * BS / face_w),
        ("肩幅（三角筋の外側）÷ 顔の幅", 2 * (14.3 + 4.0) * BS / face_w),
        ("手の長さ（手首〜指先）÷ 頭の高さ", (2 * 3.2 + 1.4 + 4.4 * 0.6 + 1.0) * BS / head),
        ("足の長さ（靴の中の足）÷ 頭の高さ", np.linalg.norm(SHOES[0][2] - SHOES[0][1]) * BS / head),
        ("目の幅 ÷ 顔の幅", eye_w / face_w),
        ("両目の間 ÷ 目の幅", (2 * eye_cx - eye_w) / eye_w),
        ("目尻〜輪郭 ÷ 目の幅", (face_w / 2 - eye_cx - eye_w / 2) / eye_w),
        ("目の中心（頭頂から）", (30.8 - ey) * HS / head),
        ("鼻（頭頂から）", (30.8 - ny) * HS / head),
        ("口（頭頂から）", (30.8 - my) * HS / head),
        ("目と口の三角形：高さ ÷ 両目の間隔（小さいほど童顔）", (ey - my) / (2 * ecx)),
        ("瞳の幅 ÷ 目の幅", (4 if rnd else 5) / eye_w),
        ("目の高さ（まつ毛〜下端）÷ 頭の高さ", eye_h / head),
        ("顔の幅 ÷ 頭の高さ", face_w / head),
        ("髪の厚み（頭頂）÷ 頭の高さ", (18.4 + 14.3 - 30.8) * HS / head),
    ]
    for k, v in rows:
        print(f"{k}: {v:.2f}")


def main():
    import time
    apply_preset("v8")
    report()
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    img0, P, Rv = render(0.0, "open")
    print("render", round(time.time() - t0, 1), "s")
    Image.fromarray(img0, "RGBA").save(os.path.join(OUT, "mio3d_1x.png"))
    composite(img0, 6, P, Rv).save(os.path.join(OUT, "mio3d_x6.png"))

    # アイドルアニメ：3D は呼吸の上下 2 通りだけ描画し、目はスタンプを差し替える
    cache = {}
    seq = [(0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 300),
           (1, "half", 60), (1, "closed", 90), (1, "half", 60), (1, "open", 300),
           (0, "open", 400), (1, "open", 400), (0, "open", 400), (1, "open", 400)]
    frames, durs = [], []
    for bob, eyes, ms in seq:
        key = (bob, eyes)
        if key not in cache:
            im, P_, Rv_ = render(float(bob), eyes)
            cache[key] = composite(im, 4, P_, Rv_).convert("RGB")
        frames.append(cache[key])
        durs.append(ms)
    frames[0].save(os.path.join(OUT, "mio3d_idle_x4.gif"), save_all=True, append_images=frames[1:],
                   duration=durs, loop=0, disposal=1)

    # 解剖モデル（服を外し、筋肉・骨の目印を色分け）を 3 方向から
    views = []
    for yaw in (0.0, -40.0, -90.0):
        im, P_, Rv_ = render(0.0, anatomy=True, yaw=math.radians(yaw), face_details=False)
        views.append(composite(im, 4, P_, Rv_))
    sheet = Image.new("RGB", (sum(v.width for v in views), views[0].height), (255, 255, 255))
    x = 0
    for v in views:
        sheet.paste(v, (x, 0))
        x += v.width
    sheet.save(os.path.join(OUT, "mio3d_anatomy_x4.png"))
    print("done")


if __name__ == "__main__":
    main()
