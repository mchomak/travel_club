from pathlib import Path
import json
root = Path('frontend/src/components/test_4')
p = root / 'data.ts'
t = p.read_text(encoding='utf-8')
t = t.replace('{ label: "Выпуски", href: "#issues" }', '{ label: "Выпуски", href: "#field-notes" }')
a = t.index('export const contents =')
b = t.index('export const principles =')
t = t[:a] + '''export const contents = [
  { number: "01", title: "Три способа начать", label: "ФОРМАТЫ", href: "#formats" },
  { number: "02", title: "Среди своих, до начала клуба", label: "FIELD NOTES", href: "#field-notes" },
  { number: "03", title: "Предыдущие страницы", label: "АРХИВ / 2025", href: "#from-the-archive" },
  { number: "04", title: "Наш культурный код", label: "НАШ ВЗГЛЯД", href: "#point-of-view" },
  { number: "05", title: "Люди, а не список", label: "КЛУБ", href: "#club" },
  { number: "06", title: "Ваша история", label: "НАЧАТЬ ИСТОРИЮ", href: "#story" },
];

export const fieldNotes = {
  origin: "Друзья, маршруты, поиск мест. Иногда планы менялись, а мы сохраняли то, что хотелось повторить. Из этих поездок вырастает Travel Club.",
  thailand: "Четверо. От островов до Бангкока. В заметках — два разных ритма одной поездки.",
  china: "Четверо прилетели из Москвы. Двое друзей ждали нас в Пекине. Дальше история собиралась сама.",
};

export const archiveStories = [
  { id: "archive-china", destination: "CHINA", route: "BEIJING → SHANGHAI → SUZHOU → SANYA", people: "5 PEOPLE", composition: "traceChina", trace: "M 35 5 C 30 110, 370 90, 350 215 S 25 270, 60 380 S 355 420, 370 625", phrase: "Четыре города. Одна компания.", frames: [
    { slot: "archive-china-street", caption: "Город в движении" },
    { slot: "archive-china-alley", caption: "Другой масштаб" },
    { slot: "archive-china-night", caption: "Вечерний свет" },
  ] },
  { id: "archive-madagascar", destination: "MADAGASCAR", route: "", people: "2 PEOPLE", composition: "traceMadagascar", trace: "M 195 5 C 175 110, 190 175, 225 235 S 380 315, 300 380 S 45 465, 125 625", phrase: "Двое. Большой остров.", frames: [
    { slot: "archive-madagascar-baobabs", caption: "Новый горизонт" },
    { slot: "archive-madagascar-lemur", caption: "Среди зелени" },
    { slot: "archive-madagascar-sunset", caption: "Свет и простор" },
  ] },
  { id: "archive-thailand", destination: "THAILAND", route: "ISLANDS → BANGKOK", people: "SMALL COMPANY", composition: "traceThailand", trace: "M 335 5 C 345 130, 20 125, 70 265 S 345 305, 305 415 S 120 480, 80 625", phrase: "От островов к большому городу.", frames: [
    { slot: "archive-thailand-islands", caption: "Острова" },
    { slot: "archive-thailand-food", caption: "Городской ритм" },
    { slot: "archive-thailand-boat", caption: "У воды" },
  ] },
];

''' + t[b:]
p.write_text(t, encoding='utf-8')
issue = {
  'edition': 'FIELD NOTES / 2026', 'date': 'CHINA ’26', 'title': 'TRAVEL CLUB', 'label': 'FIELD NOTES',
  'statement': 'Сначала —\nпоездки среди своих.', 'coverLine': 'С кем — важнее.',
  'coverCaption': 'BEIJING → SHANGHAI', 'coverSlot': 'living-cover-china',
  'spread': {'number': '26', 'destination': 'CHINA', 'people': '4 FRIENDS', 'headline': 'Города разные. Люди — свои.',
    'note': 'Поездка друзей до публичного запуска. Из таких историй вырастает Travel Club.',
    'route': 'BEIJING → SHANGHAI', 'extraPeople': '+ 2 LOCAL FRIENDS IN BEIJING', 'imageSlot': 'living-spread-city',
    'detailSlot': 'living-detail-food', 'caption': 'Куда — важно. С кем — важнее.', 'footnote': 'Друзья / до начала клуба'}
}
(root / 'issue-content.ts').write_text('// Content only: opening mechanics remain unchanged.\nexport const livingIssue = ' + json.dumps(issue, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
p = root / 'editorial-home.tsx'; t = p.read_text(encoding='utf-8')
t = t.replace('diagonal ? "?" : "?"', 'diagonal ? "↗" : "→"').replace('href="#issues">Листать выпуски', 'href="#field-notes">Листать заметки')
p.write_text(t, encoding='utf-8')
p = root / 'living-issue.tsx';t = p.read_text(encoding='utf-8').replace('Ещё один чай.<br />Ещё одна история.', 'Город. Еда.<br />Своя компания.'); p.write_text(t, encoding='utf-8')
p = Path('frontend/src/app/test_4/page.tsx');t = p.read_text(encoding='utf-8').replace('Первая редакционная версия Travel Club.', 'FIELD NOTES: поездки с друзьями до начала Travel Club.');p.write_text(t, encoding='utf-8')
alts = {'thailand-islands.jpg': 'Известняковые острова Таиланда в солнечном свете', 'thailand-boat.jpg': 'Деревянная лодка у известняковых скал Таиланда', 'bangkok-night.jpg': 'Люди и огни вечерней улицы Бангкока', 'thailand-road.jpg': 'Дорога под густой зелёной кроной в Таиланде', 'bangkok-food.jpg': 'Уличная кухня Бангкока', 'beijing-hutong.jpg': 'Традиционный переулок Пекина', 'madagascar-baobabs.jpg': 'Баобабы и песчаная дорога на Мадагаскаре', 'madagascar-lemur.jpg': 'Лемур среди зелени на Мадагаскаре', 'madagascar-sunset.jpg': 'Баобабы на Мадагаскаре в вечернем свете'}
p = Path('frontend/public/test_4/manifest.json');manifest = json.loads(p.read_text(encoding='utf-8'))
for asset in manifest: asset['alt'] = alts[asset['file']]
p.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('UTF-8 copy, anchors and manifest repaired')
