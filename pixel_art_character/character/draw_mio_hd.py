"""ミオ HD（v9）：解像度を上げて、プロのイラストの描き方を取り入れた版（docs/15）。

3D の人体モデル（draw_mio_3d.py の v8）を RES 倍の解像度でレイマーチし、
- 肌：影の境目に彩度の高い色（プロの塗りの「境目の赤み」）
- 髪：毛束ごとの ID から束の分かれ目に細い線、毛先の線は細く抜く
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

RES = 2                       # 解像度の倍率（v8 の 96×176 → 192×352）
W, H = 96 * RES, 176 * RES
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
    sx = (ii.ravel() + 0.5) / RES - 48.0
    sy = B.GROUND_ROW - (jj.ravel() + 0.5) / RES
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
    return (v[0] + 48.0) * RES, (B.GROUND_ROW - v[1]) * RES, v[2]


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


# ===========================================================================
# 2. セルルックの描画
# ===========================================================================
_make_pose_v8 = B.make_pose


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
    lv[mface] = np.where(lit[mface], 2, 3)
    lv[is_hair] = np.clip(lv[is_hair], 1, 3)
    mb = gid == gi["bangs"]                       # 前髪：束ごとの丸みの縞を消し、ベタ＋落ち影＋束の下の影だけ
    lv[mb] = np.where(lit[mb] & (occ[mb] < 4.6), 2, 3)
    lv[(lv == 4) & ~deep] = 3

    # 天使の輪
    mh = gid == gi["hair"]
    spec = (N @ nrm(Lm + Vm)) ** 24
    ql = (Ph_src - P["head"]) @ Rh
    inner = mh & (ql[:, 1] < 10.5) & (np.hypot(ql[:, 0], ql[:, 2] + 3.0) < 14.2)

    # 毛束の番号（束の分かれ目の線に使う）
    strand = np.full(W * H, -1)
    for name in ("hair", "bangs"):
        g = gi[name]
        m = gid == g
        if m.any():
            cid = chain_ids(groups[g])
            strand[idx[m]] = cid[groups[g].nearest_prim(Ph[m])] + (0 if name == "hair" else 1000)

    # 天使の輪（docs/15）：頭の丸みに沿った帯。頭頂から頭の高さの約 25% 下、光の側（画面左）だけ。
    # 毛束ごとに上端を上下にずらしてギザギザにし、束の途中で途切れさせる
    st = strand[idx]
    jit = ((st * 7919) % 11) / 10.0 - 0.5
    ring_c = 23.6 + 0.9 * jit
    band = is_hair & (st >= 0) & (np.abs(ql[:, 1] - ring_c) < 0.95 + 0.35 * jit) & (ql[:, 0] < 5.0 + 3.0 * jit) \
        & (ql[:, 2] > -7.0) & lit
    lv[band] = 1
    core = band & (np.abs(ql[:, 1] - ring_c) < 0.5 + 0.2 * jit) & (ql[:, 0] < 3.0)
    lv[core] = 0

    img = np.zeros((W * H, 4), np.uint8)
    mats = [g.mat for g in groups]
    for g in range(len(groups)):
        m = gid == g
        for k in range(5):
            img[idx[m & (lv == k)]] = ramp(mats[g], k)
    for k in range(5):
        img[idx[inner & (lv == k)]] = ramp(MAT["inner"], min(k + 1, 4))

    B.texture_details(img, idx, Ph_src, gid, names, lv, P, bob)   # カーディガンのリブ・靴下の口ゴムなど

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

    img = outlines(img, gmap, vz, lvmap, strand.reshape(H, W), mats, groups)
    return dict(img=img, gmap=gmap, vz=vz, names=names, P=P, Rv=Rv, groups=groups, bob=bob)


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


LEG_SLIM = -0.45            # 脚を細くする量（距離関数を内側へずらす）
SKIN_TERM = hx("#ffbcaa")   # 肌の影の境目（明るい側）に置く彩度の高い色
HAIR_JUMP = 6.0


def outlines(img, gmap, vz, lvmap, strand, mats, groups):
    """色トレスの輪郭線（1px）。
    - 外形（背景との境目）：光の当たる側は素材の影色、影側は素材の線の色
    - パーツの境目・深さの飛び：手前側に線
    - 毛束の分かれ目：奥側の束に細い影色の線（線ではなく「溝」として）"""
    out = img.copy()
    hair_ids = [i for i, g in enumerate(groups) if g.name in ("hair", "bangs")]
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
        for y, x in zip(*np.where(groove)):
            m = mats[gmap[y, x]]
            # 束の分かれ目は「線」ではなく浅い溝：今の色と影色の中間（強すぎると髪が細い糸の束に見える）
            out[y, x] = mix(tuple(img[y, x]), m.get("s2", m["s1"]), 0.55)
        for y, x in zip(*np.where(edge_empty | diff | jump)):
            m = mats[gmap[y, x]]
            lit = lvmap[y, x] <= 2
            dark = m["line"]
            soft = mix(m["line"], m.get("s2", m["s1"]), 0.55)
            if edge_empty[y, x]:
                out[y, x] = soft if lit else dark
            elif jump[y, x]:
                out[y, x] = m.get("s2", m["s1"]) if lit else soft
            else:
                out[y, x] = soft if lit else dark
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
    blush=(8.3, 8.0),
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
    "caruncle": hx("#f09aa4"), # 目頭の赤み
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
    sx = (ii.ravel() + 0.5) / RES - 48.0
    sy = B.GROUND_ROW - (jj.ravel() + 0.5) / RES
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
    box = (int(cx) - r, int(cy) - r, int(cx) + r, int(cy) + r)
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
        e = ((X - side * bx) / 2.9) ** 2 + ((Y - by) / 1.25) ** 2
        paint(e < 1.0, mix(MAT["skin"]["base"], hx("#ffb4ac"), 0.55))
        paint(e < 0.45, mix(MAT["skin"]["base"], hx("#ff9a98"), 0.6))

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
        paint(inside & (s > 0.78), EYE_C["caruncle"], 0.85)
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
    blush = mix(MAT["skin"]["base"], hx("#ffa8a0"), 0.5)
    for side, leg in (("L", "leg_w"), ("R", "leg_f")):
        x, y, _ = pj(P["knee_" + side] + v3(0, 0.8, 3.4))
        stamp(img, gmap, x, y, [".bb.", "bbbb", ".bb."], {"b": blush}, ids(leg))


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
    global RES, W, H
    RES, W, H = r, 96 * r, 176 * r


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
    for r, tag, zoom in ((3, "mio_hd", 2), (2, "mio_hd2", 3)):
        set_res(r)
        t0 = time.time()
        bases = {0: render_base(0.0), 1: render_base(1.0)}
        print(tag, "render", round(time.time() - t0, 1), "s")
        img, P, Rv, _ = finish(bases[0], "open")
        Image.fromarray(img, "RGBA").save(os.path.join(OUT, tag + "_1x.png"))
        composite(img, zoom, P, Rv).save(os.path.join(OUT, f"{tag}_x{zoom}.png"))
        if r == 3:
            face_closeup(bases[0], 4).save(os.path.join(OUT, "mio_hd_face_x4.png"))
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
    v8 = Image.open(os.path.join(OUT, "mio3d_x6.png")).convert("RGB")
    hd3 = Image.open(os.path.join(OUT, "mio_hd_x2.png")).convert("RGB")
    hd2 = Image.open(os.path.join(OUT, "mio_hd2_x3.png")).convert("RGB")
    sheet = Image.new("RGB", (v8.width * 3 + 40, v8.height), (255, 255, 255))
    for i, im in enumerate((v8, hd2, hd3)):
        sheet.paste(im, (i * (v8.width + 20), 0))
    sheet.save(os.path.join(OUT, "compare_v8_hd.png"))
    print("done")


if __name__ == "__main__":
    main()
