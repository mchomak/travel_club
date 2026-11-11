# Public pages

`site-shell.tsx` owns the shared Website navigation and footer. Route content lives in `formats.tsx`, `archive.tsx`, `start-form.tsx`, and `legal-document.tsx`.

The approved design system lives in `src/styles/travel-club-design-system.css` and is loaded by the Website root layout, so its `--tc-*` tokens and Lato files are available on every route. `site-tokens.ts` only adapts existing publication CSS names to those approved tokens; it is not a second source of visual values.

There is no finalized Pantone Cloud token, so the legacy `cloud` alias resolves to the approved paper token until Cloud is fixed. The old `ocean` and `tobacco` names have no approved counterpart and resolve to the closest existing blue and Madagascar roles. Editorial frame ratios, the 12-column composition grid, and the `46ch` prose measure remain local layout values because the approved system has no image-ratio, column-count, or text-measure roles.

The start form is a browser-only demonstration. It does not send or persist personal information. The archived Field Notes are illustrative records, and the public page set contains no story detail route yet.
