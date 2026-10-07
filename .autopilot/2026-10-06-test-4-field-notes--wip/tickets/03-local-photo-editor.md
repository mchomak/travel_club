# 03 — Встроенная замена фото и IndexedDB

Требования: R33–R44,R48–R49. Blocked by: 01. Зона: test_4 editable-image/image-editor/photo-store/crop helper + package/lock + e2e editor tests. Волна: 2.

Из брифа: «ПКМ ... Заменить фото ... file picker»; «рамка ТОЧНО с aspect ratio конкретного image slot»; «IndexedDB ... после refresh ... сохраняться»; «Вернуть исходное фото»; «предотвращай ТОЛЬКО на ... фотографиях /test_4».

Spec §10–§12,§14. Реализуй EditableImage + ImageEditorProvider через interfaces. Registry photo-slots.ts пишет T02, не меняй его. Provider импортируется route T02. File validation JPG/PNG/WEBP/decode, native picker, custom scoped contextmenu, reset, focus-safe clean editorial dialog, drag/zoom/crop preview точного ratio, Cancel/Escape/Save, canvas качественный cropped Blob max2400px, IDB only test_4 slotId, transaction-complete сохранение, immediate update/reload persistence, reset/reload. Handle storage/decode errors without claiming saved; cancel preserves original. ObjectURL lifecycle, duplicate save prevention, menu viewport clamp/clickout/Escape. Доступная кнопка zoom и slider; keyboard access к editing хорошее дополняет ПКМ.

Зависимости проверены: cropper нет. Разрешено npm install ровно ОДНУ direct dependency react-easy-crop, verify compatibility using official repo/docs/npm metadata; не менять версии старых deps. Иначе BLOCKED.

Приёмка:
- ПКМ только фото → menu → native input → crop editor; outside contextmenu не предотвращается.
- Canvas crop соответствует preview/ratio, drag+zoom работают; Save не меняет frame.
- Blob persists reload, reset persists reload; no localStorage base64/original20MB.
- Cancel/invalid/decode/storage errors понятны и данные не теряются.
- Editor dialog mobile390/desktop1440 usable, focus trap/Escape/reduced motion.
- Playwright e2e покрывает replace/zoom/reposition/save/reload/reset/frame ratio/outside contextmenu/cancel; тест через пользовательский seam.
- Lint/typecheck/Vitest/build после совместной интеграции. В процессе другому agent сообщи готовый interface.

Не менять route/data/copied styles/public assets/other routes/backend/shared components. Не коммить. Верни <=25 строк contract.
