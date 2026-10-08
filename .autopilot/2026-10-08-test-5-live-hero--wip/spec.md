# /test_5 — настоящий hero в правой странице

## Область
Только opening /test_5 и его тесты/локальная README. Настоящий финальный homepage сохраняет content, photography, editorial CSS, forms, photo storage и состояния. /test_4 и все другие routes, включая /design-system, не меняются. Новые dependencies, scroll lock и WebGL не нужны.

## Видимое поведение (R02–R04)
Cover прежний. После раскрытия левая страница сохраняется; правая показывает настоящий первый экран текущего сайта: navbar, metadata, TRAVEL CLUB, «Куда — важно. С кем — важнее.», описание и фотографии hero. Удалить отдельный China-панельный слой из правой страницы. China ’26 сохраняется на обложке/левой странице. Это один живой homepage DOM: никакого screenshot вместо работающего сайта или второго hero. Миниатюра имеет полный понятный верхний экран; кадр и fit рассчитываются по viewport/правой странице/hero geometry, не по одному screenshot. Направленное приближение раскрывает тот же сайт до обычного viewport; никакого cut, смены сцены или глобального crossfade. Нижние разделы становятся доступны обычной прокруткой после окончания opening.

## Движение (R01)
Сохранить короткий путь порядка 1–1.5 высоты viewport, четыре последовательные фазы, разные eased phase curves без bounce. Native passive scroll обновляет target progress; rAF при необходимости продолжает короткое frame-rate independent сглаживание до target, затем прекращается. Параметры сглаживания именованные и подписаны. Камера не зависает при быстрых колесных событиях и не оставляет пустой frame на нижней границе sequence; геометрия и normal-flow handoff непрерывны и при обратном ходе. Resize/media/hash/reduced/reset не используют устаревшее smoothing state. Никаких React rerenders per pixel, layout reads per scroll или вечного rAF в покое.

## Сохранение поведения
Прямой /test_5#start без flash до hydration, корректный skip с клавиатурным focus после снятия inert; reduced motion открывает homepage без сложного движения. Mobile390 и tablet768 показывают адаптированную правую страницу; не требуется desktop spread в тесном viewport. В no-JS режиме skip продолжает скрывать opening. Фото editor и один DOM/state сохраняются при reverse. CSS Modules selector глобального id не должен снова scope #start.

## Проверки
Сначала воспроизвести ожидаемое отличающееся поведение осмысленным browser assertion: right page после open содержит headline/summary/hero imagery и не содержит прежнюю China-панель. Тестировать settled motion и multi-frame easing без зависимости от произвольной sleep; сверять target/rendered progress по разумному observable seam, не тестировать копию формулы. Native slow/fast/reverse, stopping scroll, resize, refresh, #start/no-JS, reduced motion, keyboard, console/hydration. Скриншоты как минимум1920/1440/1280/768/390 в spread/focus/merge/hero; визуальная миниатюра/конечный hero/source unchanged. Relevant camera/photo/source routes/Design System smoke; lint/typecheck/Vitest/build. Сохранить evidence в ignored frontend/test-results отдельным output-каталогом, не удаляя старые результаты.

## Доставка (R05–R07)
Root выполняет scoped commit, normal git push в origin для текущей branch после зелёных проверок. Пользователь это прямо разрешил; повторное подтверждение не нужно. Frontend-only Docker rebuild/restart не трогает PostgreSQL/backend; production3000 проверяется после запуска. Не включать существующие посторонние untracked файлы в commit. Финальный отчёт: что поменялось, проверки, commit/push/Docker outcome и ссылка /test_5.
