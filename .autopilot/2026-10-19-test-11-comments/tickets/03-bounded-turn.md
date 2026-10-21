# 03 — Конечный fallback при зависшем изображении

Зона: frontend/src/components/test_11/reading-turn.tsx, frontend/e2e/test-11-handoff.spec.ts (и reading-turn-engine.ts только при доказанной необходимости). Не менять spreads/data/CSS — ими владеет параллельный composition.
Требование D01 → R19: пересобранный preview должен сохранять работоспособную навигацию после смены фото. spec раздел Delivery.

Craft воспроизвёл на production localhost3000 без monkeypatch decode: route удерживает **/test_11/together.webp при переходе1→2; через8.5s data-turning=true, preparing scene, Next disabled; ответ изображения отпущен — через2s lock снимается. reading-turn.tsx:45–49 очищает 6s capture watchdog и затем fallback опять ждёт все decode без deadline. Другой await после landed также требует оценки конечности, но не расширяй scope без доказательств.

Исправить узко: после watchdog capture timeout переход должен конечным путём открыть DOM/снять lock даже если destination response так и не пришёл. Не ломать существующий нормальный путь: декодирование изображений до передачи DOM, совпадение кадра GPU и live страницы, interruption/cleanup/reduced motion. Никаких бесконечных timer/retry. Нужен meaningful e2e regression с реальным held network response (не фиктивное decode), конечный turning=false без предварительного release HTTP response, usable nav после. Test должен быть RED до исправления. Проверить все existing test11 handoff tests.

Root full Vitest119 и lint уже green. UI dev3002 сейчас будет использоваться composition; до запуска твоего e2e сообщи root: либо root даст dev3003, либо дождись production rebuild. Не делать build/docker/commit, не останавливать Research dev3001. Можно запускать свой Next dev3003 только если безопасно к shared .next/dev (второй Next dev на main запрещён); лучше дождись composition окна и используй его3002. Root проверит production тоже.

Сначала interfaces.md и C:/Users/McHomak/.agents/skills/autopilot/prompts/executor.md. Return ≤25 строк STATUS/FILES/TESTS/INTERFACES/REQUIREMENTS/CONCERNS/BLOCKERS.
