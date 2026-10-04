# Surface and boundaries

The only new runtime surface is `/test_2` and `frontend/src/components/test_2/`. Original `/test` files, assets, global CSS/layout, dependencies and infrastructure remain unchanged.

`editorial-home.tsx` and `lead-form.tsx` are local snapshots. They import original data, CSS and demo lead validation without editing them. The experiment reserves `#start` for the bounded header/hero focus target; form links and the form ID become `#story`. The original route retains its original anchors. The scoped site wrapper keeps the original absolute skip link inside the cloned content.

`issue-content.ts` owns opening copy and image references. `living-issue.tsx` owns passive scroll/resize listeners, rAF, visibility observation and three CSS variables. `living-issue.module.css` owns publication layout, transforms, responsive variants and reduced motion. No API or persistence changes.

Next 16 / React 19 / CSS modules / Next Image. Production Docker service is on localhost:3000. The temporary Next development server on 3001 was stopped after verification. Commands and results are recorded in visual-qa.md; editing instructions are in frontend/src/components/test_2/README.md.
