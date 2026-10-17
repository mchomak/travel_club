"""Build desktop/mobile contact sheets and a local gallery for all 20 Hero studies."""
import json
from html import escape
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/qa/test-9"
NAMES = [
    "Classic Editorial Cover", "Split Editorial", "Centered Masthead", "Right-Aligned Identity",
    "Travel Magazine Spread", "Landscape Window", "Minimal Cover", "Offset Photography",
    "Dark Editorial", "Experimental Editorial", "Open Sky / Low Wordmark", "Quiet Axis",
    "Cloud / Valley Counterpoint", "High Plateau / Low Signature", "Skyline Serif",
    "Reflection / Split Register", "Valley / Opposed Corners", "Mist / Low Alignment",
    "Horizon / Floating Mark", "Terrace / Long Diagonal",
]


def contact_sheet(records, width, filename):
    columns, rows = 4, 5
    panel_width, row_height = (720, 570) if width != 390 else (720, 650)
    sheet = Image.new("RGB", (panel_width * columns, row_height * rows), "#e5e4dd")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
    for i, record in enumerate(records):
        x, y = (i % columns) * panel_width, (i // columns) * row_height
        draw.text((x + 20, y + 14), f"{i+1:02} / {NAMES[i]}", fill="#171717", font=font)
        draw.text((x + 20, y + 42), f"{record['country']} — {record['location']}", fill="#344a56", font=small)
        capture = Image.open(OUT / f"{width}-hero-{i+1:02}.png").convert("RGB")
        capture.thumbnail((panel_width - 40, row_height - 90))
        sheet.paste(capture, (x + (panel_width - capture.width) // 2, y + 74))
    sheet.save(OUT / filename, quality=92)


if __name__ == "__main__":
    records = json.loads((ROOT / "frontend/public/test_9/manifest.json").read_text(encoding="utf-8"))
    if len(records) != 20 or len(NAMES) != 20:
        raise ValueError(f"Expected 20 Hero studies, got {len(records)} assets and {len(NAMES)} names")
    OUT.mkdir(parents=True, exist_ok=True)
    contact_sheet(records, 1440, "contact-sheet-1440.jpg")
    contact_sheet(records, 390, "contact-sheet-390.jpg")

    cards = []
    for i, record in enumerate(records):
        number = f"{i+1:02}"
        links = " ".join(
            f'<a href="{width}-hero-{number}.png">{width} px ↗</a>' for width in (390, 768, 1440, 1920)
        )
        issue_links = f'<a href="issue-390-{number}.png">Living Issue mobile ↗</a> <a href="issue-1440-{number}.png">Living Issue desktop ↗</a>'
        cards.append(f'''<article><header><h2>{number} — {escape(NAMES[i])}</h2>
<p>{escape(record['country'])} / {escape(record['location'])}</p></header>
<a href="1440-hero-{number}.png"><img loading="lazy" src="1440-hero-{number}.png" alt="Hero {number}, desktop"></a>
<nav><a href="http://localhost:3000/test_9?hero={i+1}">Open live Hero ↗</a>{links}{issue_links}</nav>
<p class="credit">Photo: <a href="{escape(record['source'])}">{escape(record['author'])}</a> · <a href="{record['licenseUrl']}">{record['license']}</a></p></article>''')
    html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Travel Club — 20 Hero studies</title>
<style>*{box-sizing:border-box}body{margin:0;padding:40px;background:#e5e4dd;color:#171717;font:15px/1.5 Arial,sans-serif}h1{font-size:36px;letter-spacing:-.04em;margin:0}h2{font-size:18px;margin:0}p{margin:6px 0}a{color:#163a5f;text-underline-offset:3px}main{display:grid;grid-template-columns:1fr 1fr;gap:30px;max-width:1920px;margin:30px auto}article{background:#f3f2ee;align-self:start}article header{padding:20px}img{width:100%;height:auto;display:block}nav{display:flex;gap:12px 22px;flex-wrap:wrap;padding:20px}.credit{padding:0 20px 20px;font-size:12px}body>header{max-width:1920px;margin:auto}@media(max-width:800px){body{padding:18px}main{grid-template-columns:1fr}}</style>
<header><h1>Travel Club / Hero studies</h1><p>20 compositions. Original logo artwork. Local landscape photographs.</p><p>Variants 11–20 keep each full landscape at its original aspect ratio. All destinations are illustrative, not confirmed tours.</p><p><a href="contact-sheet-1440.jpg">Desktop contact sheet 4 × 5</a> · <a href="contact-sheet-390.jpg">Mobile contact sheet 4 × 5</a></p></header><main>''' + "\n".join(cards) + "</main></html>"
    (OUT / "comparison.html").write_text(html, encoding="utf-8")
    print(f"Contact sheets and comparison.html: {OUT}")
