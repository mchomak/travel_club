"""Download the twenty editorial-study photos; retain source and license metadata."""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from pathlib import Path
import requests
from PIL import Image, ImageDraw, ImageOps
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "frontend/public/test_9"
SESSION = requests.Session()
SESSION.mount("https://", HTTPAdapter(max_retries=Retry(total=4, connect=4, read=2, backoff_factor=1, status_forcelist=(429, 500, 502, 503, 504), allowed_methods=("GET",))))
PHOTOS = [
    ("china", "China", "Zhangjiajie", "Fu Shan Un", "aerial-shot-of-foggy-mountain-2484717", "2484717"),
    ("thailand", "Thailand", "Krabi", "rishi", "tall-lush-green-island-with-a-sailboat-nearby-IMkiX1MiV8s", "1761056074698-e14568ec931d"),
    ("vietnam", "Vietnam", "Ninh Binh", "Alex Azabache", "a-river-running-through-a-lush-green-valley-2EMn5z1416I", "1571406252288-cc9c25bb4a44"),
    ("indonesia", "Indonesia", "Mount Bromo", "Xendro XDR", "volcano-landscape-at-sunrise-with-clouds-and-fog-D3K9FAHa82w", "1751778814489-84010fc18094"),
    ("kazakhstan", "Kazakhstan", "Charyn Canyon", "Tim Broadbent", "a-rocky-landscape-with-mountains-in-the-background-uj4TyuvM72w", "1677475191981-653bcfcc3cd2"),
    ("kyrgyzstan", "Kyrgyzstan", "Kolduk / Alay Mountains", "Aydin Hassan", "a-lake-in-the-middle-of-a-field-with-mountains-in-the-background-17DC4cTEITk", "1618824834769-fcad49940077"),
    ("uzbekistan", "Uzbekistan", "Chimgan", "Sergio Franklin", "snow-covered-mountains-near-body-of-water-during-daytime-BzYi0w8jTTQ", "1580217442567-daaff0cf13ca"),
    ("mongolia", "Mongolia", "Gobi", "Usukhbayar Gankhuyag", "man-standing-on-desert-jI6o7rIHE3I", "1571821809399-0ca9d5c79884"),
    ("madagascar", "Madagascar", "Avenue of the Baobabs", "Elle Leontiev", "people-walking-on-street-near-brown-concrete-tower-during-daytime-Wtv8wbxk-M4", "1627580206975-ede73a2ca147"),
    ("serbia", "Serbia", "Tara National Park", "Maria Ivanova", "mountains-and-a-lake-shrouded-in-mist-ZVuZ9PrjFVA", "1746538175255-4b4b9f2ef89c"),
    ("japan_tateyama", "Japan", "Murodo / Tateyama", "Zion C", "a-tranquil-lake-surrounded-by-green-mountains-and-misty-clouds-zP1gZG-B0lU", "1785638619617-7bb173558161"),
    ("laos_nong_khiaw", "Laos", "Nong Khiaw", "Frank Eiffert", "river-through-green-mountain-valley-9VQWGLlHllE", "1789148276355-fe609eba57b2"),
    ("georgia_kazbegi", "Georgia", "Kazbegi / Mount Kazbek", "Marek Piwnicki", "snow-covered-mountain-under-cloudy-sky-during-daytime-iBVJxyIxeGo", "1627328561499-a3584d4ee4f7"),
    ("tajikistan_pamir", "Tajikistan", "Pamir Mountains", "Johnny van der Leelie", "brown-and-gray-mountain-painting-h3a7hMonbBI", "1571315571166-ea32c32d3582"),
    ("armenia_azhdahak", "Armenia", "Azhdahak", "Alexander Gluschenko", "volcanic-crater-with-snow-and-a-lake-under-cloudy-sky-h8V84HQBBG4", "1785791151048-3ac800b20dd2"),
    ("kazakhstan_almaty_lake", "Kazakhstan", "Big Almaty Lake", "Polina Skaia", "lake-surrounded-with-mountains-during-daytime-ToJNyWpDn9I", "1530480667809-b655d4dc3aaa"),
    ("bhutan_punakha", "Bhutan", "Punakha Valley", "Rama Krushna Behera", "a-river-flows-through-a-valley-with-mountains-Ox-ZD-PbYQY", "1761048158626-d998ebc47e77"),
    ("sri_lanka_mandaramnuwara", "Sri Lanka", "Mandaramnuwara", "Ajai S", "mountains-and-green-hills-are-beneath-a-cloudy-sky-oFTSI9hQw0E", "1749527520272-1554ddc3263d"),
    ("philippines_coron", "Philippines", "Coron Hills, Palawan", "RONATORY", "landscape-photograph-of-mountain-ranges-QRjQIyNa7uI", "1551519924-41efeb4833f5"),
    ("vietnam_mu_cang_chai", "Vietnam", "Mù Cang Chải", "Hoach Le Dinh", "rice-terraces-in-mu-cang-chai-PeRt3uMmjYM", "1609412058473-c199497c3c5d"),
]

def download(photo):
    slug, country, location, author, page, cdn = photo
    pexels = slug == "china"
    source = f"https://www.pexels.com/photo/{page}/" if pexels else f"https://unsplash.com/photos/{page}"
    url = f"https://images.pexels.com/photos/{cdn}/pexels-photo-{cdn}.jpeg?w=2560" if pexels else f"https://images.unsplash.com/photo-{cdn}?w=2560&q=88&fm=jpg&fit=max"
    path = TARGET / f"{slug}.webp"
    previous = json.loads((TARGET / "manifest.json").read_text(encoding="utf-8")) if (TARGET / "manifest.json").exists() else []
    old_source = next((item["source"] for item in previous if item["file"] == path.name), None)
    if not path.exists() or (old_source and old_source != source):
        response = SESSION.get(url, timeout=(30, 90))
        response.raise_for_status()
        image = ImageOps.exif_transpose(Image.open(BytesIO(response.content))).convert("RGB")
        image.thumbnail((2560, 2560))
        image.save(path, "WEBP", quality=82, method=6)
    image = Image.open(path)
    overlay_study = slug in {"japan_tateyama", "laos_nong_khiaw", "georgia_kazbegi", "tajikistan_pamir", "armenia_azhdahak", "kazakhstan_almaty_lake", "bhutan_punakha", "sri_lanka_mandaramnuwara", "philippines_coron", "vietnam_mu_cang_chai"}
    modifications = "WebP conversion, resized to max 2560 px; complete frame shown at its original aspect ratio, without a Hero crop." if overlay_study else "WebP conversion, resized to max 2560 px; CSS crops per composition."
    record = dict(file=path.name, country=country, location=location, author=author,
                  source=source, download=url,
                  license="Pexels License" if pexels else "Unsplash License", licenseUrl="https://www.pexels.com/license/" if pexels else "https://unsplash.com/license",
                  verified="2026-10-17", width=image.width, height=image.height,
                  bytes=path.stat().st_size, modifications=modifications,
                  usage="Illustrative editorial exploration, not a confirmed TC tour.")
    print(f"{slug}: {image.size}, {path.stat().st_size // 1024} KiB", flush=True)
    return record

if __name__ == "__main__":
    TARGET.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as executor:
        records = list(executor.map(download, PHOTOS))
    (TARGET / "manifest.json").write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    columns = 2
    rows = (len(records) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * 700, rows * 460), "#f2f0ea")
    draw = ImageDraw.Draw(sheet)
    for i, item in enumerate(records):
        x, y = (i % columns) * 700, (i // columns) * 460
        frame = ImageOps.fit(Image.open(TARGET / item["file"]), (680, 408))
        sheet.paste(frame, (x + 10, y + 10))
        draw.text((x + 10, y + 426), f"{i+1:02} / {item['country']} / {item['location']}", fill="#171717")
    out = ROOT / "docs/qa/test-9"
    out.mkdir(parents=True, exist_ok=True)
    sheet.save(out / "photo-selection.jpg", quality=90)
