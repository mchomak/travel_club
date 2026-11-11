# Legacy Design Experiments — local archive record

**Status: local-only. Do not publish this tag or create a GitHub Release from it.** The target commit contains internal CustDev materials that must not be disclosed. A Release attached to this tag would expose that archived commit; a prose-only redaction would not remove its contents.

## Release decision

Публикуемое описание Release не подготовлено: сам архивный commit содержит внутренние CustDev материалы. Отредактированное текстовое описание не удаляет материалы из Git-тега или исходного commit, поэтому публикация запрещена.

**Title:** Travel Club — Legacy Design Experiments (Test 01–19)

**Tag:** `archive/legacy-test-pages-01-19`

**Target commit:** `7d3b1dd43cf6fddd48699a3e44bd4d817c124326` (`docs: finalize test_21 homepage integration`)

**Publication status:** No GitHub Release was published. The annotated tag is local and must remain unpushed under the current privacy decision.

## Safe summary of the code archive

The pre-cleanup snapshot preserves early Travel Club website experiments: editorial home page structures, Field Notes and journal layouts, hero variants, page-opening transitions, WebGL motion prototypes, mobile reading layouts, and an interactive design-settings experiment. These versions explored navigation, trip-story presentation, editorial composition, responsive reading, and reduced-motion fallbacks. The `/test_21` implementation became the basis of the public Website home page. `/test_20` remains a historical Design Settings experiment in the snapshot.

To inspect a file locally without changing the working tree:

```powershell
git show archive/legacy-test-pages-01-19:frontend/src/app/test_20/page.tsx
```

To check out the archived snapshot into a separate worktree:

```powershell
git worktree add ..\travel-club-legacy archive/legacy-test-pages-01-19
```

To restore an individual file after confirming the destination has no needed local work:

```powershell
git restore --source=archive/legacy-test-pages-01-19 -- frontend/src/app/test_20/page.tsx
```

The tracked source for the former `frontend/` app has been removed from the active tree; ignored/untracked local artifacts were left untouched. Archive paths in this record refer to the historical tag. The old app is not an active launch target. The safe summary above is not authorization to publish the tag. A release remains prohibited for this snapshot because it contains private material.
