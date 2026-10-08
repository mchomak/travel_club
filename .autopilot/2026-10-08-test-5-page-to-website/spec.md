# Спецификация: правая страница становится Travel Club

## Задача и решение
Создать /test_5 как полную изолированную копию /test_4. Только после запуска и визуального сравнения исходной копии изменить opening: cover → spread → направленное приближение к правой странице → существующий homepage. Все 32 раздела исходного брифа обязательны; численные фазы допускают визуальную настройку.

## 1. Копия и границы
Скопировать route и весь локальный каталог компонентов test_4 в test_5; использовать прежние фото и шрифты. Сохранить все тексты, FIELD NOTES, China, Thailand, архив, Contents, Products, Point of View, Club, Process, формы и редактор фотографий. Не менять исходные routes или общие компоненты. Отдельное хранилище test_5 защищает пользовательские замены фото на test_4. Визуальное сравнение до изменения opening обязательно; сохранить доказательства и контрольные хэши source.

## 2. Четыре фазы
A: прежняя обложка China ’26, размеры, белое поле, тени, metadata и существующая подсказка. B: спокойное раскрытие с subtle perspective и полным spread. C: eased zoom + translation к измеренному центру правой страницы; левая страница и spine выходят влево. D: edges за viewport, perspective и shadow → 0; Cloud совпадает с homepage; композиция страницы вырастает в реальный hero.
Прокрутка около 1.25 высоты viewport, а не длинное отдельное интро. Cover ориентировочно 0–20%, opening 20–45%, focus 45–75%, merge 75–100%; smoothstep/разные интервалы без bounce. Обложку и нижнюю homepage не redesign.

## 3. Непрерывность
Хотя бы один крупный элемент (предпочтительно реальный masthead TRAVEL CLUB) должен сохраняться из right page в hero, плюс редакционная линия/metadata при возможности. Hero: «Куда — важно. С кем — важнее.» и прежняя фотография/описание. Никакого глобального crossfade magazine→homepage. Перемещение, scale, crop и layout continuation — основные инструменты. Локальное удаление China деталей допускается. Предпочитать один живой экземпляр hero/homepage, сохраняющий DOM и form/editor state; любые технические совпадающие слои должны совпадать пиксельно в точке передачи и исключать duplicate accessibility/interactive heroes.

## 4. Координаты и performance
Нативный scroll, passive listener и rAF, CSS variables/transforms; никаких React rerenders на пиксель. ResizeObserver/resize измеряет раскрытый right-page box и target viewport/hero box; scale и translation вычисляются из геометрии, а не одного screenshot. Вынести границы фаз и коэффициенты в понятные константы с комментариями. Читать layout при измерении, писать transforms в кадре; не анимировать width/height/top/left на каждом scroll. Локальная понятная stack hierarchy; убрать debug UI. Новые motion зависимости не нужны: package.json уже содержит React/Next, CSS достаточно.

## 5. Lifecycle, accessibility и responsive
Reverse проходит те же функции progress назад, без teleport, blank, двойного hero, stuck magazine, scroll lock. Быстрый scroll/refresh в промежуточной точке сразу вычисляет правильное состояние. Resize сохраняет корректный progress и геометрию. /test_5#start пропускает opening до первого paint, без flash; hero доступен, hash и scroll корректны. Existing skip link тоже работает. Reduced motion: opening пропущен или короткая статичная версия без долгого scroll, весь homepage/navigation доступен; переключение media query также стабильно. Mobile: simpler cover→open/focus→page fills viewport→hero, без попытки втиснуть desktop spread; без horizontal overflow. Проверить 1920/1440/1280/768/390 px, laptop height и mobile portrait/landscape. Доступность навигации и photo editor на конечном сайте сохранена.

## 6. Проверка и refinement
До изменения копии: source/target screenshots начала, spread, #start и full homepage, идентичность local files с заменой namespace. После реализации: медленный и быстрый scroll, forward/reverse, resize, refresh в начале, #start (первый paint/keyboard), reduced motion, console/hydration, обычный первый scroll после hero. Visual refinement обязателен: start/speed открытия, spread dwell, zoom direction/start, выход left/spine, тени, потеря края страницы, continuity и переход к обычному scroll. Сравнить homepage после opening с /test_4; существующие routes должны работать. Запустить lint, typecheck, Vitest, production build и релевантный Playwright, включая regression source. Browser screenshots обязательно.

## Границы и швы
Локальный test_5 владеет только новой homepage и opening. LivingIssue отвечает за timeline и измерение; EditorialHome сохраняет прежние content/style/state, при необходимости минимально выставляет hero seam. Test seams: браузерный route, scroll, hash, resize, media query и живой DOM hero. Существующий test_4 — readonly эталон.

## Вне рамок
Общий redesign, copy/photography changes, новые dependencies, backend/admin/schema, publish/deploy, unrelated fixes.

## Открытые места
Нет. Решения full: изолированное photo storage; локальный запуск без внешних сервисов; 1.25 viewport как начальная калибровка с визуальным refinement.

## Покрытие
Разделы брифа 1–4, 7–11, 22–25, 29–31 → §2–3,6. 5–6 → §1–2. 12–18 → §4–5. 19 → §5. 20–21 → §1,6. 26–28 → §4–6. 32 → финальный отчёт только по десяти запрошенным пунктам, без кода.
