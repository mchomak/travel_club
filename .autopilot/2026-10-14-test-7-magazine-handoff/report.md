# Приёмка /test_7

Решения за пользователя: новая сцена без лабораторных controls; один живой homepage; обратная прокрутка не повторяет intro; skip/hash/reduced motion/WebGL failure сразу показывают сайт. Повторно используется provider /test_5 и его origin-local photo storage. Никаких новых services/dependencies/env.

Слепая приёмка blind7, без spec/manifest: все продуктовые пункты исходного брифа реализованы; самостоятельно пройден dev browser сценарий и production3000. Craft review craft7: clean, blocking findings нет. G2: исходный бриф полностью покрыт; дополнительных capabilities нет, только углубление поведения и lifecycle.

- Root preset и local preset.json равны; cover +8 leaves, total3.46648s.
- Реальный CPU curl и тень на живой DOM подтверждены mid-flip на49.37%; alpha/depth cutout физически перекрывается листом.
- Визуально проверены ready,25/50/75/99% focus, native site. Независимая граница header (40.0008,-0.00023)→(40,0).
- Четыре viewport:1440×900,1280×720,768×1024,390×844; production regression включает прежний landscape667×375.
- Lint/typecheck pass; unit94passed/21files (нынешнее working tree с ранее накопленными test_6 правками); новый браузерный набор10passed dev; independent10passed dev; production46passed/1.9m across test_7/test_6/test_5 camera/photo.
- Docker frontend успешно production-built/recreated; service running localhost3000. Backend/DB не менялись.
- Local Chromium channelchromium:356draws за3.4665 timeline seconds (~102.7drawFPS), послеTARGET за500ms остаётся356. Page/console errors0; ровно2прежних Next unused CSS preload warnings.
- Ранний wheel воспроизвёл race до hydration; startup теперь Cloud безhomepageflash, explicit wheel/touch/key guard. Unit/production/browser после исправления зелёные.
- Контрольные test_5 не изменены; ранее dirty test_6/design-system/прочие файлы побайтно сохранены. В feature-коммит включены только test_7 и корневой JSON.
- Local visual artifacts (ignored): frontend/test-results/test-7-visual/, test-7-blind/, test-7-production/; temporary MCP captures ignored.

Готово всё из брифа. Новых placeholders/пустых env нет; существующие demo-формы и иллюстративные фото сохраняют прежний статус. Ничего не отложено. Известное ограничение: два общих Next CSS preload warning; photo storage общий с/test_5. Экспериментальная сцена не является физическим симулятором бумаги.

Feature commit: c8beffb1a914dde6f297735d753e34d8e5dffe5e; обычный git push origin main подтверждён (423d526→c8beffb). Финальная запись приёмки/памяти сохраняется отдельным docs-коммитом.
