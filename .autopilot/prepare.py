import json
import re
from pathlib import Path
from datetime import datetime

root = Path(__file__).resolve().parent
state_path = root / 'state.js'
state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
state['title'] = 'Travel Club — конструктор поездок'
now = datetime.now().astimezone().isoformat(timespec='seconds')
state['updatedAt'] = now
state['stages'][0].update(status='done', finishedAt=now)
state['stages'][1].update(status='active', startedAt=now)
state_path.write_text('window.STATE =\n' + json.dumps(state, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
p = root.parent / 'AGENTS.md'
original = p.read_text(encoding='utf-8').split('<!-- autopilot:start -->')[0]
p.write_text(original + '''<!-- autopilot:start -->
## Текущая сборка
Travel Club: закрытый конструктор поездок. Работа ведётся через `/autopilot full`.
Требования, спецификация и таски: `.autopilot/2026-09-26-travel-constructor--wip/`.
Состояние: `.autopilot/state.js`; прогресс: `.autopilot/dashboard.html`.
Требование может снять только пользователь.
<!-- autopilot:end -->
''', encoding='utf-8')
source = Path('C:/Users/McHomak/.codex/attachments/138fbc47-6792-4f81-92ef-5d0d377c9576/Pasted text.txt').read_text(encoding='utf-8')
patterns = [r'sk-(?:proj-)?[\w-]{20,}', r'gh[pous]_[\w]{20,}', r'AKIA[A-Z0-9]{16}', r'AIza[\w-]{20,}', r'xox[bpa]-[\w-]+', r'\w+://[^\s/:]+:[^\s@]+@', r'-----BEGIN .*PRIVATE KEY-----']
assert not any(re.search(p, source) for p in patterns), 'Secret-like content: do not persist'
run = root / state['dir']
(run / state['briefFile']).write_text('# Изначальная задача\n\n> Записано 2026-09-26. Текст неизменяем; дополнения ниже.\n\n' + source + '\n\n## Дополнения\n\n- 2026-09-26 — «прочитай приложенный текст. [$autopilot] full все скилы скачаны локально»\n', encoding='utf-8')
# Every independent bullet and prose paragraph remains verbatim and traceable.
rows = []
section = 0
for paragraph in re.split(r'\n\s*\n', source):
    paragraph = paragraph.strip()
    match = re.match(r'# (\d+)\.', paragraph)
    if match:
        section = int(match[1]); continue
    if paragraph.startswith('## ') or not paragraph:
        continue
    if section in (1,):
        continue
    parts = paragraph.splitlines() if paragraph.startswith('- ') else [paragraph]
    for part in parts:
        quote = part.strip().replace('|', '\\|').replace('\n', '<br>')
        if not quote: continue
        rows.append((f'R{len(rows)+1:03}', section, quote))
manifest = '# Манифест требований\n\nИсточник: `2026-09-26-brief.md`. Снять требование может только пользователь. Каждая строка сохраняет дословный текст; примеры и ограничения также проверяются.\n\n| ID | Из брифа (дословно) | Статус | Основание | Где |\n|---|---|---|---|---|\n'
manifest += ''.join(f'| {rid} | «{quote}» | in-spec | Бриф §{sec}; самобрифинг ниже | spec §{sec} |\n' for rid,sec,quote in rows)
manifest += '''\n## Самобрифинг — режим full

- ASSUMPTION — локальный Docker Compose; публичное развёртывание не требуется.
- ASSUMPTION — округление HALF_UP до 0.01 для каждой исходной и нормализованной статьи; остаток распределения по дням в последнюю дату. Валюты задаются трёхбуквенным кодом.
- ASSUMPTION — даты поездки включительны, отель: ночи [заезд, выезд). Отель должен целиком помещаться в диапазон поездки; противоречащие изменению дат элементы требуют исправления или явного удаления.
- ASSUMPTION — общий расход без дня показан отдельной группой и входит в итог ровно один раз.
- ASSUMPTION — участники null означают всех и меняются с поездкой; число означает явно выбранную подгруппу и не меняется. При уменьшении группы ниже подгруппы изменение отклоняется с понятной ошибкой.
- ASSUMPTION — сохранение агрегата атомарно, версия защищает от перезаписи из другой вкладки; данные в полях остаются при сетевой ошибке.
- ASSUMPTION — мгновенный предварительный расчёт в одном модуле TypeScript с decimal arithmetic; общие контрольные векторы и серверный ответ проверяют совпадение.
- ASSUMPTION — нет реальных маршрутов или тарифов по умолчанию; пустой список. Первый администратор создаётся локальной командой с защищённым вводом, без запроса пароля в чат.

G1: нет open; полный автомат, все неопределённости разрешены без отмены требований.
'''
(run / 'manifest.md').write_text(manifest, encoding='utf-8')
(run / 'reference.md').write_text('# Эталон из брифа\n\n«минималистичным; современным; воздушным; визуально аккуратным; с хорошей типографикой»\n\n«Избегай ощущения бухгалтерской программы и огромной Excel-таблицы.»\n\n«Поездка должна визуально ощущаться как маршрут/таймлайн.»\n', encoding='utf-8')
state['requirements']['total'] = len(rows)
state['requirements']['inSpec'] = len(rows)
state['debt']['assumptions'] = ['Локальный запуск Docker Compose', 'HALF_UP до 0.01; остаток распределения в последний день', 'Поездка: даты включительны; отель: выезд исключён', 'Общие расходы учитываются отдельно', 'Явная подгруппа не меняется вместе с общим числом', 'Версии защищают параллельные сохранения', 'Decimal preview + единые контрольные векторы', 'Пустой список; администратор создаётся локально']
state['stages'][1].update(status='done',finishedAt=now)
state['stages'][2].update(status='skipped',note='полный автомат — самобрифинг')
state['stages'][3].update(status='active',startedAt=now)
state_path.write_text('window.STATE =\n' + json.dumps(state, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Manifest: {len(rows)} source fragments; secret scan clean.')
