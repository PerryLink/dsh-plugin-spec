#!/usr/bin/env python3
"""Generate README image assets for dsh-plugin-spec (docs/assets/).

Outputs (idempotent overwrite):
  dsh-plugin-spec-flow-light.svg / dsh-plugin-spec-flow-dark.svg
      Hero pipeline diagram. Two hand-written SVG files (vector — never
      rasterized to webp). Every label is a command / flag / status token
      (dsh-plugin-verify, --scope entry|mvp|ds-c, PASS / WARN / FAIL, ...),
      so all five README languages share the same pair.
  No raster evidence chart: this repo's README carries its hard numbers as
  text quoted from the checker's recorded runs; the generated asset here is
  the hero pair only.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow (pip install pillow) and a CJK font. The font probe is kept
           identical to the family asset scripts: if no CJK font is found the
           script aborts loudly instead of rendering tofu boxes (the hero text
           itself is ASCII tokens only, so this is a guard for future charts).
"""
from __future__ import annotations

import html
import os
import sys

from PIL import ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

# --- palette: PerryLink family (accent) + GitHub page backgrounds ----------
FAMILY = "#4B67B4"   # family accent (badges labelColor family uses #2B3245)
GREEN = {"light": "#16a34a", "dark": "#3fb950"}
SKIN = {
    "light": dict(bg="#ffffff", box="#f6f8fa", border="#d0d7de",
                  text="#1f2328", sub="#57606a", track="#eaeef2"),
    "dark": dict(bg="#0d1117", box="#161b22", border="#30363d",
                 text="#f0f6fc", sub="#8b949e", track="#21262d"),
}

# --- CJK font probe: Chinese must never render as tofu boxes ----------------
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",      # Microsoft YaHei
    r"C:\Windows\Fonts\simhei.ttf",    # SimHei
    r"C:\Windows\Fonts\Deng.ttf",      # DengXian
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
if FONT_PATH is None:
    sys.exit("FATAL: no CJK font found (looked for msyh.ttc, simhei.ttf, "
             "Deng.ttf, Noto Sans CJK, PingFang). Refusing to render Chinese "
             "as tofu boxes; install one of the probed fonts and re-run.")


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size)


# ---------------------------------------------------------------------------
# Hero pipeline SVG (light + dark)
# ---------------------------------------------------------------------------
# (label, sub-label) — command surface tokens only, no prose.
FLOW_NODES = [
    ("plugin dir", "cordis.patch.yml"),
    ("dsh-plugin-verify", "--scope entry|mvp|ds-c"),
    ("report", "text · json · SARIF"),
    ("dsh-levels audit", "ENTRY · FLOW · BOOST"),
    ("exit 0|1|2|3", "PASS · WARN · FAIL"),
]
LEVELS = [
    ("DSH-ENTRY", "18/18 recognized"),
    ("DSH-FLOW", "12 PASS · fixture"),
    ("DSH-BOOST", "8/8 measured"),
]
FOOTER = ("--runtime <path> · --host <path> · "
          "--flow-evidence <file> · --boost-evidence <file>")


def flow_svg(skin: str) -> str:
    s = SKIN[skin]
    w, h = 1200, 430
    nw, nh, gap = 196, 92, 30
    x0, y0 = 50, 150
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img" '
        f'aria-label="dsh-plugin-spec pipeline">',
        '<title>dsh-plugin-spec pipeline</title>',
        f'<rect width="{w}" height="{h}" rx="18" fill="{s["bg"]}"/>',
        f'<text x="50" y="58" fill="{s["text"]}" font-family="ui-sans-serif,'
        f'system-ui,sans-serif" font-size="30" font-weight="700">'
        f'dsh-plugin-spec</text>',
        f'<text x="50" y="90" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="15">DSH-ENTRY · DSH-FLOW · DSH-BOOST · '
        f'40-checker</text>',
        f'<line x1="50" y1="112" x2="1150" y2="112" stroke="{s["border"]}"/>',
    ]
    for i, (label, sub) in enumerate(FLOW_NODES):
        x = x0 + i * (nw + gap)
        accent = (GREEN[skin] if i == len(FLOW_NODES) - 1 else
                  FAMILY if i == 1 else s["border"])
        parts.append(
            f'<rect x="{x}" y="{y0}" width="{nw}" height="{nh}" rx="14" '
            f'fill="{s["box"]}" stroke="{accent}" stroke-width="2"/>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y0 + 37}" fill="{s["text"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="15" font-weight="700">{html.escape(label)}</text>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y0 + 64}" fill="{s["sub"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="12">{html.escape(sub)}</text>')
        if i < len(FLOW_NODES) - 1:
            ax = x + nw + 5
            ay = y0 + nh // 2
            parts.append(
                f'<path d="M{ax} {ay}h{gap - 10}" stroke="{s["sub"]}" '
                f'stroke-width="3"/>')
            parts.append(
                f'<path d="M{ax + gap - 12} {ay - 6}l9 6-9 6" fill="none" '
                f'stroke="{s["sub"]}" stroke-width="3" '
                f'stroke-linecap="round" stroke-linejoin="round"/>')
    # three-level evidence strip
    bw, bh, bgap, by = 350, 76, 25, 282
    for i, (label, sub) in enumerate(LEVELS):
        x = x0 + i * (bw + bgap)
        accent = FAMILY if i < 2 else GREEN[skin]
        parts.append(
            f'<rect x="{x}" y="{by}" width="{bw}" height="{bh}" rx="12" '
            f'fill="{s["box"]}" stroke="{accent}" stroke-width="2"/>')
        parts.append(
            f'<text x="{x + 20}" y="{by + 31}" fill="{s["text"]}" '
            f'font-family="ui-monospace,monospace" font-size="15" '
            f'font-weight="700">{html.escape(label)}</text>')
        parts.append(
            f'<text x="{x + bw - 20}" y="{by + 31}" fill="{s["sub"]}" '
            f'text-anchor="end" font-family="ui-monospace,monospace" '
            f'font-size="13">{html.escape(sub)}</text>')
        parts.append(
            f'<line x1="{x + 20}" y1="{by + 44}" x2="{x + bw - 20}" '
            f'y2="{by + 44}" stroke="{s["track"]}"/>')
        parts.append(
            f'<text x="{x + 20}" y="{by + 63}" fill="{s["sub"]}" '
            f'font-family="ui-monospace,monospace" font-size="12">'
            f'{"DSC-01…DSC-13" if i == 0 else "J1…J8" if i == 1 else "LEV-1…LEV-8"}'
            f'</text>')
    parts.append(
        f'<text x="50" y="404" fill="{s["sub"]}" '
        f'font-family="ui-monospace,monospace" font-size="13">'
        f'{html.escape(FOOTER)}</text>')
    parts.append(
        f'<text x="1150" y="404" fill="{s["sub"]}" text-anchor="end" '
        f'font-family="ui-monospace,monospace" font-size="13">73/73 tests'
        f'</text>')
    parts.append('</svg>')
    return "\n".join(parts) + "\n"


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        with open(os.path.join(OUT, f"dsh-plugin-spec-flow-{skin}.svg"),
                  "w", encoding="utf-8", newline="\n") as fh:
            fh.write(flow_svg(skin))
    print("wrote 2 SVG assets to docs/assets/")


if __name__ == "__main__":
    main()
