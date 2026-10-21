# Living Issue → live website /test_7

An isolated integration of the current procedural `/test_6` magazine and the
existing `/test_5` homepage. Neither reference route is edited.

- `preset.json` is an exact snapshot of the root `test-6-settings.json`, copied
  into the frontend build context. Eight leaves, separate cover, 3.46648 seconds
  to TARGET; no laboratory controls. The browser suite compares both JSON files.
- The intro camera starts at distance11.5 and follows the same deterministic
  clock to the preset's distance7, with quintic easing. Responsive safety fitting
  still keeps the magazine in frame. TARGET holds that final pose until scroll;
  reverse scroll returns there without replaying the camera approach.
- `artwork.ts`, `deformation.ts`, `timeline.ts` and `parameters.ts` are local
  snapshots of the laboratory. This keeps the experiment independent of future
  laboratory edits. Three.js and the existing assets/fonts are reused.
- `scene.ts` retains the real two-sided CPU curl (56×16 / compact 32×16). During
  the final turn, a depth-tested shader writes transparent pixels over the right
  sheet. The live DOM sits behind the alpha canvas; the turning mesh naturally
  occludes it. A separate ShadowMaterial receiver keeps page-to-page shadows.
- `projection.ts` maps the full-width homepage onto the four projected sheet
  corners with a projective CSS matrix. The source crop has the physical sheet's
  2.32:2.9 aspect. It contains the actual responsive homepage, not a screenshot.
- `magazine-handoff.tsx` owns intro/ready/focus/site, scroll guards, resize,
  reduced motion, hash/skip and fallback. Scroll covers 1.25 viewport heights,
  uses a 65ms catch-up and quintic camera easing. At full focus, the camera sees
  the right sheet front-on, its top-left matches the viewport, and the same DOM
  returns to native flow. Reverse scroll restores projection without replaying.
- The route reuses one `EditorialHome` and its `ImageEditorProvider` from
  `/test_5`. Forms retain their demo behavior. Photo edits intentionally share
  `/test_5`'s origin-local IndexedDB; this version adds no server or persistence.
- Before hydration: Cloud and scene chrome, without a homepage flash. No-JS,
  reduced motion, fragment entry, skip and WebGL failure expose the website.
  Cleanup restores prior overflow/scroll restoration and releases GPU resources.

From `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`,
`npm.cmd test -- --run --testTimeout=15000`,
`npm.cmd exec playwright test e2e/test-7-handoff.spec.ts -- --workers=1`.
From the repository root:
`docker compose up -d --no-deps --build --wait frontend`.

Set `PLAYWRIGHT_BASE_URL` for another port. The route's browser checks exercise
early wheel, preset equality, live projection at four widths, native flow and
reverse state, hash/skip, photo-editor access, reduced motion and WebGL fallback.
