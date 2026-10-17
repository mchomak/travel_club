# Shared boundaries

Existing stack Next16 React19 TS6 CSS modules. Read frontend/AGENTS.md and relevant local next docs. No new dependencies/env/backend. Dirty files are pre-existing and must not be changed/reverted. Work current tree, do not stash/reset/worktree away from those changes. Do not commit; orchestrator stages named files only after review.

## Common geometry
Magazine reading book is physical full-spread ratio 1.6 (4.64:2.9). Intended width min(1250px, calc(100vw - 112px), calc((100svh - 120px)*1.6)); at 1280x768 ~1037x648; typography >=14px body, >=11 metadata. Height may be adjusted coherently after visual QA, never squeeze unreadably. Center in viewport with compact top title and bottom nav. Intro projection accepts measured book node dimensions.

## Ticket ownership
01 owns frontend/src/components/test_10/magazine-experience.tsx, magazine-intro.tsx, magazine.module.css, frontend/src/app/test_10/page.tsx, backward-compatible optional config extension to test_7 scene if needed, e2e/test-10-magazine.spec.ts. Own README test_10 and docs/qa/test-10. Must leave test_8 source untouched, existing scene default behavior unchanged.
02 owns frontend/src/components/test_10/spreads.tsx, spreads.module.css, data.ts, public/test_10/* (local photos and manifest). No shell/navigation files. Real SVG use existing /test_9 logo paths.

## Contract
spreads.tsx exports MagazineSpread({ index, side? }: { index: number; side?: 'left'|'right' }): ReactNode. index zero-based 0..2; with side returns only corresponding page; without returns both pages as fragment. Each page outer section has data-magazine-page=left/right and fills exactly its half in 2-column parent, min-width/min-height 0. Page owns padding/content/footer/page number. Shell owns overall grid, paper, fold, dimensions/turns/nav. No global IDs in repeated turning copies, no href=# to absent anchors. Shell marks duplicate copies inert and aria-hidden.
data.ts exports SPREADS readonly [{title:'Hero + Formats'}, {title:'Next Issue'}, {title:'Thailand ’26'}]; additional content/assets there as needed. Images as standard Next Image or img with explicit object-fit and frame geometry; no dependency on image editor.

## Commands
From frontend: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd run build. Browser npm.cmd exec playwright test e2e/test-10-magazine.spec.ts e2e/test-8-concept.spec.ts e2e/test-7-handoff.spec.ts -- --workers=1. Use dev on localhost:3001 if 3000 production old. Executors only targeted checks, root full suite after files integrated. Missing dependencies report BLOCKED, don't install. Return executor contract <=25 lines.

## Task02 complete
MagazineSpread({index,side?}) and SPREADS available. Five optimized local licensed WebPs in public/test_10; manifest verified. Refined at1280x768 and1440x900; metadata>=11 and body>=14.
