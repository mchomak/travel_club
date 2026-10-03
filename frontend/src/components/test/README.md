# Travel Club — дизайнерская главная /test

Изолированный эксперимент: `src/app/test/page.tsx` подключает только эти компоненты. Главная `/`, публичные заглушки, admin, API и БД не меняются. Метаданные `/test` запрещают индексацию экспериментальной страницы.

- `data.ts` — основные тексты, навигация, три продукта, культурные принципы, шаги, изображения, выпуски. `issues[].theme` задаёт `background`, `foreground`, `accent`, `muted`, `line` каждого выпуска.
- `editorial-home.tsx` — композиция. React state выбирает выпуск; CSS variables меняют только архив, без глобальной смены темы. Контактные placeholders и пояснения документов находятся здесь.
- `editorial.module.css` — scoped стили, responsive сетка, переходы и шрифтовые tokens `--tc-sans` / `--tc-editorial`. Все `@font-face` имеют уникальные имена и Latin/Cyrillic subsets, `font-display: swap`. Motion отключается при `prefers-reduced-motion`.
- `lead-form.tsx` — compact форма, ошибки, focus, pending, retry и success. Направление и даты можно оставить открытыми; контакт обязателен. Поддерживаются email, телефон, @Telegram или t.me URL.
- `lead.ts` — `validateLead(Lead)` и `SubmitLead = (Lead) => Promise<LeadResult>`. `submitDemoLead` ничего не передаёт и не сохраняет. Для реального API заменить этот адаптер или передать `submitLead` в форму; `kind: "sent"` включает подтверждение реальной отправки.
- `public/test/` — локальные фотографии и шрифты. Источники, авторы, лицензии и размеры — `public/test/README.md` и `manifest.json`. Заменяйте файлы и, при изменении пропорций, обновляйте `images` в `data.ts`.

Выпуски, месяцы и количество участников — концептуальные примеры, помеченные на странице. Memory — образец композиции будущей книги, не реальный отзыв. Next Issue не представляет открытую продажу. Социальные контакты и документы обозначены как будущие. Новые API routes, зависимости и хранилища не добавлены.

Из корня: `docker compose build frontend`, затем `docker compose up -d --no-deps frontend`. Открыть `http://localhost:3000/test`. После замены фото пересобрать frontend: standalone runner копирует `public/` во время build.

Из `frontend/`: `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`. При работающем сайте: `npm.cmd run test:e2e -- e2e/test-home.spec.ts`. Для dev на другом порту задать `PLAYWRIGHT_BASE_URL`.
