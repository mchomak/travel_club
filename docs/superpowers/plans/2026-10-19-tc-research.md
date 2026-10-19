# TC Research implementation plan

Build the internal interview tool in the existing FastAPI/PostgreSQL + Next.js application. Keep public site routes independent. Use the exact interview source bank from `Travel_Club_CustDev.docx`, deterministic editable rules, admin-only access, PostgreSQL question snapshots, conflict-safe answer saves, complete XLSX export, and a responsive interview workflow.

## Work sequence

1. **JSON bank and rules:** import all 82 question codes and 17 hypotheses, screening fields/options, four DOCX-aligned scenario arrays, validation and deterministic classification. Add failing unit tests first.
2. **Backend:** additive `research_` migration, models, DTOs, authenticated API, transactional respondent/interview creation, immutable question snapshots, answer revision CAS, completion, filters and full XLSX export. Add failing backend tests first.
3. **Frontend:** private respondent list, screening and category choice, interview/detail editing, optional questions, progress, debounced and blur saves, local offline queue, conflict/error states, finish flow, and Excel download. Add failing UI/e2e tests first.
4. **Operations:** document local setup, configurable HTTPS subdomain, JSON validation/update, VPS reverse proxy, and PostgreSQL backup/restore. Verify configuration and commands.

## Invariants

- Question codes/text and hypotheses come from the DOCX. DOCX scenario order wins where it differs from the supplied lists; X stays disabled until offer terms exist.
- Acknowledged server writes are the only state labeled «Сохранено». Failed/offline text remains visible and recoverable. An older revision cannot overwrite a newer one.
- Saving a new screening recommendation never mutates an existing interview snapshot or its answers. Editing completed interviews preserves `completed` status.
- No public routes, external AI, audio uploads, or real deployment changes.

## Verification

Run relevant backend pytest/Ruff, frontend Vitest/lint/typecheck/build, browser acceptance scenarios against an isolated Compose project, Alembic upgrade on a clean disposable PostgreSQL database, and inspect the generated `.xlsx` contents.
