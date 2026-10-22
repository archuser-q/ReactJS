"""Vẽ biểu đồ thực nghiệm ghép cặp (PNG cho báo cáo) từ CSV của backend: npm run benchmark -- --out <thư mục>.

  python ve_bieu_do.py <thư mục chứa A_tinh.csv, B_dong.csv> <thư mục lưu ảnh>   (cần matplotlib)
"""
import csv, sys, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

src, out = sys.argv[1], sys.argv[2]
SURFACE, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df"
FAMILY = {"instant": ("Tức thời (Greedy)", "#2a78d6"), "batch": ("Theo lô (Hungarian)", "#eb6834"), "auto": ("Tự động (hybrid)", "#1baf7a")}
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.edgecolor": GRID, "axes.labelcolor": INK2,
                     "xtick.color": INK2, "ytick.color": INK2, "text.color": INK, "figure.facecolor": SURFACE, "axes.facecolor": SURFACE})

def rows(name):
    with open(os.path.join(src, name), encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

def num(v):
    v = str(v).split("±")[0].strip()
    return float(v)

def ci(v):
    parts = str(v).split("±")
    return float(parts[1]) if len(parts) > 1 else 0.0

def style(ax):
    for s in ("top", "right", "left"):
        ax.spines[s].set_visible(False)
    ax.tick_params(length=0)
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)

# ── A: bài toán gán tĩnh ─────────────────────────────────────────────────────
A = rows("A_tinh.csv")
n = [int(r["n (đơn = thợ)"]) for r in A]
gain = [num(r["cải thiện %"]) for r in A]
ms = [num(r["Hungarian ms"]) for r in A]
fig, (a1, a2) = plt.subplots(1, 2, figsize=(10, 3.6), gridspec_kw={"wspace": 0.35})
labels = [str(x) for x in n]
a1.barh(labels, gain, color="#eb6834", height=0.62, edgecolor=SURFACE, linewidth=2)
for y, g in enumerate(gain):
    a1.text(g + 0.15, y, f"+{g:.1f}%".replace(".", ","), va="center", fontsize=9, color=INK)
a1.set_title("Hungarian hơn Greedy về tổng điểm phù hợp", loc="left", fontsize=11, color=INK)
a1.set_xlabel("% tổng điểm cao hơn"); a1.set_ylabel("n đơn = n thợ"); a1.invert_yaxis(); a1.set_xlim(0, max(gain) * 1.25); style(a1)
a2.plot(n, ms, color="#eb6834", linewidth=2, marker="o", markersize=7, markeredgecolor=SURFACE, markeredgewidth=2)
a2.annotate(f"{ms[-1]:.0f} ms".replace(".", ","), (n[-1], ms[-1]), textcoords="offset points", xytext=(-8, 8), ha="right", fontsize=9)
a2.set_title("Thời gian giải Hungarian", loc="left", fontsize=11, color=INK)
a2.set_xlabel("n đơn = n thợ"); a2.set_ylabel("ms"); style(a2); a2.grid(axis="y", color=GRID, linewidth=0.8); a2.grid(axis="x", visible=False)
a2.spines["left"].set_visible(False)
fig.text(0.01, -0.04, "Trung bình 30 lần (n ≤ 50) / 5 lần (n > 50); thợ và đơn ngẫu nhiên trong bán kính 8 km, R = 5 km. Hàm điểm và Hungarian đúng bản hệ thống đang chạy.",
         fontsize=8, color=INK2)
fig.savefig(os.path.join(out, "A_tinh.png"), dpi=200, bbox_inches="tight")
plt.close(fig)

# ── B: mô phỏng vận hành ────────────────────────────────────────────────────
B = rows("B_dong.csv")
keep = ["instant k=1", "instant k=3", "batch W=10s", "batch W=30s", "auto k=1", "auto k=2", "auto k=3"]
scen = []
for r in B:
    if r["kịch bản"] not in scen:
        scen.append(r["kịch bản"])
title = {"thưa đơn": "Thưa đơn (0,5 đơn/phút)", "vừa": "Vừa (1,5 đơn/phút)", "cao điểm": "Cao điểm (3 đơn/phút)"}
metrics = [("chờ TB (s)", "Chờ ghép TB (giây)", "{:.0f} s"), ("thợ đến nơi TB (phút)", "Thợ tới nơi TB (phút) = chờ ghép + di chuyển", "{:.1f}")]
fig, axes = plt.subplots(2, len(scen), figsize=(13, 7.2), gridspec_kw={"hspace": 0.55, "wspace": 0.55})
for ci_, s in enumerate(scen):
    data = {r["cấu hình"]: r for r in B if r["kịch bản"] == s}
    for ri, (col, label, fmt) in enumerate(metrics):
        ax = axes[ri][ci_]
        vals = [num(data[k][col]) for k in keep]
        errs = [ci(data[k][col]) for k in keep]
        colors = [FAMILY[k.split()[0]][1] for k in keep]
        y = list(range(len(keep)))
        ax.barh(y, vals, color=colors, height=0.66, edgecolor=SURFACE, linewidth=2,
                xerr=errs, error_kw={"ecolor": INK2, "elinewidth": 1, "capsize": 2})
        best = min(vals)
        for yy, v, e in zip(y, vals, errs):
            ax.text(v + e + max(vals) * 0.02, yy, fmt.format(v).replace(".", ","), va="center", fontsize=8.5,
                    color=INK, fontweight="bold" if v == best else "normal")
        ax.set_yticks(y, keep if ci_ == 0 else [""] * len(keep))
        ax.invert_yaxis(); ax.set_xlim(0, max(v + e for v, e in zip(vals, errs)) * 1.28); style(ax)
        if ri == 0:
            ax.set_title(title.get(s, s), loc="left", fontsize=11, color=INK, pad=22)
        ax.text(0, 1.03, label, transform=ax.transAxes, fontsize=9, color=INK2)
handles = [plt.Rectangle((0, 0), 1, 1, color=c) for _, c in FAMILY.values()]
fig.legend(handles, [l for l, _ in FAMILY.values()], loc="upper center", ncol=3, frameon=False, bbox_to_anchor=(0.5, 1.0))
fig.text(0.01, 0.0, "60 thợ, 10 hạt giống × 120 phút, thanh lỗi = khoảng tin cậy 95%. Thợ không phản hồi 10%, nhận với xác suất 0,85; xe máy 20 km/h. "
         "Số in đậm = tốt nhất trong kịch bản.", fontsize=8, color=INK2)
fig.savefig(os.path.join(out, "B_dong.png"), dpi=200, bbox_inches="tight")
print("ok")
