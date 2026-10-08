# 01 — Точная изолированная копия
Требования: все пункты брифа о сохранении и COPY SOURCE FIRST (разделы 2,10,19–21,27,30).
Blocked by: нет. Зона: frontend/src/app/test_5, frontend/src/components/test_5. Волна: 1.
Разделы спецификации: §1 и §6.
«Сначала полностью скопируй текущую страницу /test_4 на /test_5»; «Не изменяй /test_4».
Создать побайтовую копию локального каталога и route с заменой namespace imports; допускается отдельное storage name test_5. Не менять animation. Запустить target (3001 dev или Docker 3000), сравнить source/target через screenshots cover и #start/whole page. После своей проверки остановиться для root visual baseline. Зафиксировать контрольные хэши source и сообщить URL. Не commit.
Приёмка: новая route работает; исходник untouched; content/style/function identical; photo editing работает; visual baseline доказан до camera.
