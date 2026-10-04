# Медиа для экспериментальной главной `/test`

Локальные фотографии и шрифты временно используются в дизайнерской версии Travel Club. Фото — иллюстративный stock, а не участники поездок Travel Club. География стамбульских и шанхайского кадров проверена по страницам источников; общий ужин не привязан к месту.

Все файлы отдаются локально. Сетевые адреса ниже нужны для атрибуции, страница их не загружает. В `manifest.json` указаны пути, реальные размеры, размеры файлов, alt, авторы, источники и рекомендуемое положение при кадрировании.

## Фотографии

| Файл | Размер | Автор | Источник |
| --- | --- | --- | --- |
| `hero-table.jpg` | 1600 × 1067 | Atlantic Ambience | [Общий стол в ресторане у воды, Стамбул](https://www.pexels.com/photo/group-of-friends-gathering-around-table-in-restaurant-7444129/) |
| `istanbul-street.jpg` | 675 × 1200 | Ibrahim Yousef | [Трамвай и прохожие в Стамбуле](https://www.pexels.com/photo/people-walking-beside-a-tram-13792272/) |
| `shanghai-night.jpg` | 800 × 1200 | Edward Eyer | [Вечерняя Нанкин-роуд, Шанхай](https://www.pexels.com/photo/people-walking-on-street-during-night-time-4127160/) |
| `memory-dinner.jpg` | 1200 × 800 | cottonbro studio | [Разговор за общим ужином](https://www.pexels.com/photo/a-group-of-friends-having-conversation-while-sitting-near-the-dining-table-6955643/) |
| `memory-ferry.jpg` | 960 × 1200 | Alimurat Üral | [Пассажиры парома и Галатский мост](https://www.pexels.com/photo/people-sitting-on-vessel-with-galata-bridge-behind-window-17283084/) |
| `memory-street.jpg` | 802 × 1200 | ibrahim arslan | [Люди на набережной рядом с паромом](https://www.pexels.com/photo/ferry-and-people-by-galata-district-in-istanbul-28869454/) |

Лицензия исходных шести фотографий — [Pexels License](https://www.pexels.com/license/). Исходники скачаны 3 октября 2026 года, приведены к разумному размеру без изменения композиции и сохранены как progressive JPEG (quality 84). Размер этой исходной подборки — 828 413 байт, около 809 KiB. Каждый итоговый файл просмотрен визуально.

Для редакционного редизайна 4 октября добавлены восемь кадров. Istanbul получил чай, небольшую чайную и уличные разговоры; Shanghai — движение на перекрёстке, переулок, кухню и вечернюю улицу. Общий кадр Club не заявляет конкретного города. География городских кадров сверена по страницам источников, фотографии просмотрены перед использованием.

| Файл | Размер | Автор | Источник |
| --- | --- | --- | --- |
| `istanbul-tea.jpg` | 1067 × 1600 | Buse Oktar | [Чай в стамбульском кафе](https://www.pexels.com/photo/traditional-turkish-tea-in-istanbul-cafe-31966105/) |
| `istanbul-cafe.jpg` | 1143 × 1600 | Necip Duman | [Чайная в Арнавуткёе](https://www.pexels.com/photo/tea-shop-by-the-street-13799023/) |
| `istanbul-people.jpg` | 1067 × 1600 | zahara | [Уличные столики чайной](https://www.pexels.com/photo/people-sitting-at-tea-house-tables-on-a-street-in-istanbul-19771058/) |
| `shanghai-street.jpg` | 1600 × 1067 | Margo Evardson | [Велосипедисты на перекрёстке](https://www.pexels.com/photo/busy-shanghai-street-with-cyclists-at-crosswalk-37071059/) |
| `shanghai-alley.jpg` | 1067 × 1600 | Johnny Song | [Шанхайский переулок](https://www.pexels.com/photo/street-scene-in-shanghai-s-urban-alleyway-31552628/) |
| `shanghai-dumplings.jpg` | 1600 × 1067 | Jonas F | [Сяолунбао](https://www.pexels.com/photo/steamed-dumplings-in-the-bamboo-steamer-6752827/) |
| `shanghai-evening.jpg` | 1200 × 1600 | Zheng Xia | [Вечерняя улица Шанхая](https://www.pexels.com/photo/people-walking-on-the-street-at-night-4993575/) |
| `club-evening.jpg` | 1600 × 1067 | DΛVΞ GΛRCIΛ | [Вечерний разговор друзей](https://www.pexels.com/photo/casual-evening-dinner-with-friends-outdoors-38786290/) |

Новые файлы — progressive JPEG, quality 85, максимум 1600px по длинной стороне, с той же лицензией Pexels. Все 14 фотографий занимают 3 156 974 байта (около 3 MiB). `next/image` отдаёт подходящий размер; кроме главного кадра, изображения загружаются лениво. Каталог `images` и галереи `issues[].gallery` в `src/components/test/data.ts` определяют использование фотографий; `manifest.json` документирует источники и реальные размеры.

## Шрифты

Современный grotesk **Golos Text** и редакционный serif **Lora** скачаны с официального CDN Google Fonts. Для каждой используемой начертательной группы есть отдельные Latin и Cyrillic subsets. Все шесть WOFF2 содержат диапазон весов 400–700 согласно официальным CSS-описаниям; Lora доступна в обычном и настоящем курсивном начертании. Общий размер WOFF2 — 182 712 байт, около 178 KiB.

- [Golos Text в Google Fonts](https://fonts.google.com/specimen/Golos+Text), авторы Golos Text Project. Лицензия: [fonts/Golos-Text-OFL.txt](fonts/Golos-Text-OFL.txt), SIL Open Font License 1.1. [Исходная лицензия Google Fonts](https://github.com/google/fonts/blob/main/ofl/golostext/OFL.txt).
- [Lora в Google Fonts](https://fonts.google.com/specimen/Lora), авторы Lora Project / Cyreal. Лицензия: [fonts/Lora-OFL.txt](fonts/Lora-OFL.txt), SIL Open Font License 1.1. [Исходная лицензия Google Fonts](https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt).

Проверенные CSS-источники:

- [Golos Text 400–700](https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..700&display=swap).
- [Lora regular / italic 400–700](https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap).

Нужно подключать Latin и Cyrillic как два `@font-face` с одинаковыми family/style/weight и своими `unicode-range`. Готовые диапазоны и URL перечислены в `manifest.json`. `font-display: swap` оставляет текст доступным во время загрузки. Сеть для загрузки шрифтов во время сборки или просмотра не нужна.

## Замена собственными материалами

Можно заменить JPEG с сохранением имени; при другом соотношении сторон обновить width/height и alt в контентных данных страницы и в манифесте. После замены проверить кадрирование на desktop и mobile. Для новых источников обновить атрибуцию здесь. Файлы шрифтов и семейства заменяются централизованно в стилях экспериментальной страницы. Эта папка используется только `/test`.
