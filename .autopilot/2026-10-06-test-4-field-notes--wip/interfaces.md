# Границы, решённые в спецификации

EditorialData владеет FIELD NOTES/архивом/текстом. PhotoSlots владеет стабильными ID, fallback и aspect ratio. Exposes `photoSlots: Record<string, {src, alt, aspectRatio, position?}>`.
EditableImage exposes `EditableImage({slotId, className?, sizes?, preload?, decorative?})`, className задаёт внешний размер frame, внутреннее фото fill/cover. ImageEditorProvider wraps весь test_4; общие menu/file input/dialog и storage скрыты внутри. Одно место управления состоянием вместо dialog на каждую фотографию. Компонент импортируется только в test_4.
PhotoStore exposes `loadPhoto(slotId): Promise<Blob|undefined>`, `savePhoto(slotId, blob): Promise<void>`, `resetPhoto(slotId): Promise<void>`; прячет IDB transactions. Crop export скрывает canvas и decode, вход image source/pixel area, выход Blob. Главный test seam — browser EditableImage публичные действия, без тестов внутренних implementation details.

## Общие правила

- CWD C:/Users/McHomak/Projects/travel_club. Next 16/React19/TS/Tailwind; npm на Windows через npm.cmd.
- Менять только новые test_4 route/components/public/e2e и package/lock для одной разрешённой crop dependency. Не менять test_2/test/test_3/root/admin/backend/API/auth/shared components/styles/assets. Не менять версии текущих deps.
- Рабочее дерево в начале чистое. Не reset/stash/clean. Изолированная копия нового route — требуемая пользователем изоляция; работа в этом workspace.
- Корневая agent не пишет продуктовый код. Исполнители не меняют .autopilot, AGENTS или git index/commits.
- Проверки frontend: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test; npm.cmd run build. Один тест: npm.cmd test -- src/...test.ts; браузерный: npm.cmd exec playwright test e2e/test-4-*.spec.ts.
- Браузер Chromium установлен/при необходимости выяснить путь. Тестовый localhost:3000 должен соответствовать текущему коду; только frontend можно обновлять.
- Если нужной зависимости нет, BLOCKED; исключение cropper react-easy-crop — заранее разрешён T03 после primary-source проверки совместимости, одна direct dependency.
- T01 только копирование/фиксация исходника. T02 владеет route, copied TSX/CSS/data, photo-slots.ts, stock assets. T03 владеет editable-image.tsx, image-editor.tsx/CSS, photo-store/crop helpers, package/lock и e2e editor tests. Они не редактируют друг другу файлы; интеграция через контракт выше.
- className EditableImage размещает frame как прежний Photo. У frame aspect ratio из registry; inner img всегда width/height100% object-fit cover. Inline ratio не должен быть overridden parent height. Overlay context menu/dialog portal.

## Артефакты проверки

`.autopilot/<run>/qa/` содержит hash baseline и screenshots. Скрипты одноразового capture можно создать здесь исполнителю по явному поручению, но не менять state/manifest/spec.
