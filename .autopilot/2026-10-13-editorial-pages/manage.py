import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

run = Path(__file__).resolve().parent
root = run.parent
state_path = root / 'state.js'
now = datetime.now(timezone(timedelta(hours=3))).isoformat(timespec='seconds')
if sys.argv[1] == 'init':
    previous = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    (root / previous['dir'] / 'state.js').write_text(state_path.read_text(encoding='utf-8'), encoding='utf-8')
    source = Path('C:/Users/McHomak/.codex/attachments/7ee5121b-7154-4ecb-b1c4-47ecdfdcd3a2/Pasted text.txt').read_text(encoding='utf-8')
    assert not re.search(r'sk-(?:proj-)?[\w-]{20,}|gh[pous]_[\w]{20,}|-----BEGIN .*PRIVATE KEY-----', source)
    (run / '2026-10-13-brief.md').write_text('# Изначальная задача\n\n> Записано 2026-10-13. Неизменяемый текст брифа.\n\n' + source + '\n\n## Дополнения\n\n/autopilot full — прочитай прикрепленный текст и выполни.\n', encoding='utf-8')
    rows = []
    section = 'Контекст'
    for chunk in re.split(r'={10,}\s*\n', source):
        chunk = chunk.strip()
        if not chunk:
            continue
        if re.match(r'\d+\.', chunk):
            section = chunk
            continue
        for paragraph in re.split(r'\n\s*\n', chunk):
            paragraph = paragraph.strip()
            if not paragraph or set(paragraph) == {'-'}:
                continue
            if paragraph.startswith('- '):
                parts = paragraph.splitlines()
            else:
                parts = [paragraph]
            for part in parts:
                quote = part.replace('|', '\\|').replace('\n', '<br>')
                rows.append(f'| R{len(rows)+1:03} | «{quote}» | in-spec | Бриф: {section} | spec: {section} |')
    (run / 'manifest.md').write_text('# Манифест требований\n\nИсточник: `2026-10-13-brief.md`. Требование может снять только пользователь.\n\n| ID | Из брифа (дословно) | Статус | Основание | Где |\n|---|---|---|---|---|\n' + '\n'.join(rows) + '\n\n## Самобрифинг\n\nASSUMPTION: реальной отправки нет; новый прототип не сохраняет и не передаёт данные. Юридические тексты и detail pages не выдумываются. Используем BASE_TOKENS Playground, не меняя Playground и его draft. Новые стили scoped, /test_5 меняется только в ссылках.\n\nG1: нет open.\n', encoding='utf-8')
    (run / 'reference.md').write_text('# Эталон\n\nТекущая `/test_5`: Living Travel Publication. Golos + Lora, Cloud/Ink/Blue, editorial grid, тонкие линии, локальные фотографии.\n', encoding='utf-8')
    state = dict(slug='editorial-pages', dir=run.name, title='Travel Club — единый редакционный сайт', mode='full', depth='normal', polish=None, tier=None, briefFile='2026-10-13-brief.md', memoryFile='AGENTS.md', skillDir='C:/Users/McHomak/.agents/skills/autopilot', startedAt=now, updatedAt=now, finishedAt=None, stages=[dict(id=i, status='active' if i == 'spec' else 'skipped' if i == 'briefing' else 'done' if i in ('preflight', 'manifest') else 'pending', **({'startedAt': now} if i == 'spec' else {})) for i in ('preflight', 'manifest', 'briefing', 'spec', 'plan', 'build', 'review', 'final')], requirements=dict(total=len(rows), done=0, inTicket=0, inSpec=len(rows), placeholder=0, deferred=0, dropped=0), tickets=[], singlePass=None, tests=None, debt=dict(placeholders=['Юридические документы в подготовке', 'Форма демонстрационная', 'Нет detail pages архива'], assumptions=['Использовать BASE_TOKENS, scoped public styles, честный прототип'], emptyEnv=[]), additions=[], coverage=None, concerns=[], reviewers=dict(manifestSpec=None, craft=None), blind=None)
    with (root / 'README.md').open('a', encoding='utf-8') as f:
        f.write(f'\n| 2026-10-13 | `{run.name}` | в работе | редакционные страницы |\n')
elif sys.argv[1] == 'tickets':
    state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    state['tier'] = 'T1'
    state['coverage'] = dict(found=5, fixed=5, deferred=0, extraInSpec=0, note='G2 reader coverage: omissions clarified; сопровождение существующий продукт')
    state['tickets'] = [dict(id=i, title=t, requirements=[], blockedBy=[] if i == '01' else ['01'], wave=1 if i == '01' else 2, zone=z, status='in-progress' if i == '01' else 'pending', retries=0, repairs=0, handoffs=0, **({'startedAt': now} if i == '01' else {})) for i,t,z in [('01','Общая система и базовые страницы',['public-site/shared','publication/legal','publication/thanks','not-found']),('02','Форматы, архив и ссылки homepage',['public-site/editorial','publication/formats','publication/archive','test_5/navigation']),('03','Start и демонстрационная форма',['public-site/start-form','publication/start'])]]
    manifest_path = run / 'manifest.md'
    lines = manifest_path.read_text(encoding='utf-8').splitlines()
    for index, line in enumerate(lines):
        if line.startswith('| R'):
            section_match = re.search(r'Бриф: (\d+)\.', line)
            section = int(section_match[1]) if section_match else 0
            ticket = '03' if section in (15,16,17) else '02' if section in (10,11,12,13,14) else '01'
            rid = line.split('|')[1].strip()
            state['tickets'][int(ticket)-1]['requirements'].append(rid)
            lines[index] = line.replace('in-spec', 'in-ticket').replace('spec:', f'T{ticket} → spec:')
    manifest_path.write_text('\n'.join(lines)+'\n', encoding='utf-8')
    state['requirements'].update(inSpec=0, inTicket=state['requirements']['total'])
    state['stages'][5].update(status='active',startedAt=now)
    for stage in state['stages'][:2]:
        stage.setdefault('startedAt', state['startedAt'])
        stage.setdefault('finishedAt', state['startedAt'])
    state['stages'][2]['note'] = 'full — самобрифинг'
    state['updatedAt'] = now
elif sys.argv[1] == 'refinement':
    state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    state['concerns'] = ['T01 alias: fix now в T04, один источник и точная документация.', 'T02 dynamic archive и BASE→adapter→DOM: исправлено и независимо проверено.', 'T03 radio overflow: причина подтверждена, исправление и QA в процессе.']
    state['coverage']['note'] = 'G2: повторная независимая сверка без missing/half-covered/extras'
    state['tickets'].append(dict(id='04',title='Финальная доработка общей типографики',requirements=['R036','R040','R066','R505'],blockedBy=['01','02','03'],wave=3,zone=['public-site/shared-refinement'],status='in-progress',startedAt=now,retries=0,repairs=0,handoffs=0))
    state['updatedAt']=now
elif sys.argv[1] in ('start', 'review', 'done'):
    state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    for tid in sys.argv[2].split(','):
        ticket = next(t for t in state['tickets'] if t['id'] == tid)
        if sys.argv[1] == 'start':
            ticket.update(status='in-progress', startedAt=now)
        elif sys.argv[1] == 'review':
            ticket.update(status='review')
            review = next(s for s in state['stages'] if s['id'] == 'review')
            review.update(status='active')
            review.setdefault('startedAt', now)
        else:
            ticket.update(status='done', finishedAt=now, commit=sys.argv[3] if len(sys.argv)>3 else None)
            mp = run / 'manifest.md'
            lines = mp.read_text(encoding='utf-8').splitlines()
            for i,line in enumerate(lines):
                if (line.startswith('| R') and f'T{tid} →' in line) or (line.startswith('| D01') and tid == '03'):
                    lines[i] = line.replace('in-ticket', 'done')
            mp.write_text('\n'.join(lines)+'\n', encoding='utf-8')
    done_ids = {t['id'] for t in state['tickets'] if t['status']=='done'}
    done_count = len({rid for t in state['tickets'] if t['id'] in done_ids for rid in t['requirements']})
    state['requirements'].update(done=done_count,inTicket=state['requirements']['total']-done_count)
    state['updatedAt']=now
elif sys.argv[1] == 'privacy-repair':
    state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    state['finishedAt']=None
    state['stages'][-1].update(status='active',startedAt=now)
    state['stages'][-1].pop('finishedAt',None)
    ticket = next(t for t in state['tickets'] if t['id']=='03')
    ticket.update(status='repair',repairs=2)
    ticket['requirements'].append('D01')
    ticket['repairFindings']=['Scoped radio dimensions', 'D01: native GET without JavaScript']
    state['requirements'].update(total=550,done=549,inTicket=1)
    state['concerns'].append('D01: реальный no-JS native GET обнаружен финальной проверкой; исправление T03 в процессе.')
    state['updatedAt']=now
elif sys.argv[1] == 'finish':
    state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    state['dir'] = run.name
    state['tests'] = dict(passed=180,failed=0,vitest='80 passed / 19 files',playwright='100 passed / 10 files / production',lint='passed',typecheck='passed',build='passed',compose='frontend rebuilt/running; existing backend and PostgreSQL healthy after Docker recovery')
    state['blind'] = dict(status='passed',matched='Все продуктовые требования брифа',mismatches=[],findings=[],runtime='Independent isolated browser: main flow, all routes, 32 viewport/page cases, HTTP404, no POST/storage; 187 checks plus 8/8 bounded H1 verification. D01 privacy follow-up: 9/9 checks, no-JS disabled/click/Enter/noscript and normal-JS group → thanks, no personal requests or browser storage.',note='Один predicate независимого helper ожидал 35px выше документированного legal cap; отдельно проверено корректное распространение 30px на всех 8 routes. No-JS text проверяется CSS locator, поскольку Playwright text engine исключает noscript.')
    state['concerns'] = ['Resolved: единый editorial alias и точная inventory документация.', 'Resolved: динамический архив и BASE→adapter→DOM propagation.', 'Resolved: scoped radio width и mobile legal headings; production passed.', 'Resolved: lazy image readiness и camera target/rendered convergence, строгие assertions сохранены; 100 production tests passed.', 'Resolved D01: SSR submit disabled, no-JS instruction visible, click/Enter cannot transmit answers; hydrated demo flow unchanged.', 'Environment: Docker Desktop stopped externally, restored CLI restart; existing PostgreSQL/backend containers started without rebuild/data deletion.']
    state['finishedAt']=now
    state['updatedAt']=now
    for stage in state['stages']:
        if stage['status']=='active':
            stage.update(status='done',finishedAt=now)
    state['stages'][-1]['note']='100 production browser checks и независимая G4 пройдены; включая no-JS privacy, без продуктовых gaps'
    state['requirements'].update(done=state['requirements']['total'],inTicket=0,inSpec=0)
    register = root / 'README.md'
    body = register.read_text(encoding='utf-8')
    body = re.sub(r'\| 2026-10-13 \| `2026-10-13-editorial-pages(?:--wip)?` \|[^\n]+', '| 2026-10-13 | `2026-10-13-editorial-pages` | сдан | семь страниц, общие токены, demo-форма и 404; 100 browser checks |', body)
    register.write_text(body, encoding='utf-8')
else:
    state = json.loads(state_path.read_text(encoding='utf-8').split('\n', 1)[1])
    for stage in state['stages']:
        if stage['id'] == sys.argv[1]:
            stage.update(status='active', startedAt=now)
    state['updatedAt'] = now
state_path.write_text('window.STATE =\n' + json.dumps(state, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(state['dir'])
