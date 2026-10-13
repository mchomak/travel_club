# Living Issue WebGL laboratory

## Contract and scope
The entire original 2026-10-13-brief.md is the acceptance contract, including all prohibitions, qualitative criteria, controls, refinement and final-report requirements. This specification resolves implementation choices without weakening any clause. Build only /test_6, no public-site navigation/footer/homepage, no scroll/handoff/zoom or edits to other routes. Existing dirty Design System edits and unrelated docs are preserved.

## Outcome
A viewport-filling Cloud (#F2F0EA from BASE_TOKENS) scene displaying a restrained physical editorial magazine. Starts already visible, near-closed; plays opening plus THREE full paper flips, ending stationary on China ’26. Negative space, thin magazine proportions near test_5 (single leaf width/height about .8), matte surfaces, natural mild 3/4 perspective, soft short shadows. No leather, glossy catalogue, interior, library flipbook, dramatic perspective, wavy cloth, bounce or rigid rotating cards.

## Study before implementation
Inspect package.json, installed dependencies, animation use, App Router and applicable frontend AGENTS/local Next docs. Read test_5 Living Issue proportions, identity/content/fonts/assets only as reference. three/Fiber/Drei are absent; authorize adding only three runtime plus @types/three development dependency, verify current stable official version. Use direct Three.js, no Fiber/Drei/GUI/GLTF/Blender packages.

## Geometry and motion
Procedural magazine group: covers, thin left/right static stacks with visible restrained edges, left/right visible pages, one active turning leaf. No single-rectangle texture swap illusion: static underlying surfaces and moving two-sided leaf coexist. CPU BufferGeometry vertex deformation, width 48-64 subdivisions desktop (32 mobile acceptable) with height subdivisions for gently changing edge shape; update only active leaf. Arc-length-based cross-section integrates tangent angles, anchoring x=0 spine and constraining near-spine displacement. Independently tune bend, curl, stiffness, lift, spine constraint and outer-edge influence; last two may be internal documented constants, first four visible controls. Curl travels along width, evolves through lift 0-.15, formation .15-.4, strongest .4-.65, unfolding .65-.9, settling .9-1. Flat endpoints, continuous geometry/normals, no rubber stretching, intersection, centre rotation or z fighting. Cover uses higher stiffness/less bend. Very small physical offsets and positive page thickness, thin stacks rather than 150 sheets. Explicit tests for anchored spine, changing cross-section, no stretching beyond intended tolerances, flattening, finite vertices and timeline boundaries.

## Deterministic sequence
One elapsed-time timeline: initial hold -> opening -> spread 1 PEOPLE/PLACES/CULTURE/STORIES -> flip 1 -> spread 2 THAILAND ’26 / ISLANDS → BANGKOK -> flip 2 -> spread 3 FIELD NOTES / 2025 -> flip 3 -> TARGET China ’26. Default total 2.5–4 seconds; eased acceleration/deceleration, no bounce/spring/overshoot. Clear paused state freezes elapsed, no timeout chains. Replay resets all leaf/spread state without reload. Play/Pause, Final State, Reset work at any phase. Changing durations keeps timeline valid; document any intentional restart policy. Final renders remain available on parameter/resize changes, motion fully stops. Visibility tab pauses clock to prevent unwanted catch-up. Reduced motion starts immediately at target and reacts to preference changes.

## Artwork
CanvasTexture, local existing assets only. Load TC Golos/TC Lora before rasterizing. Intermediate layouts simple typography/photo editorial. Final left ink page and right Cloud photo page refer to test_5: CHINA ’26, BEIJING → SHANGHAI, 4 FRIENDS, + 2 LOCAL FRIENDS IN BEIJING, Russian headline/caption if useful. Readable orientation on both leaf sides, no mirrored back. Texture sizes reasonable, owned/disposed.

## Scene and camera
PerspectiveCamera mild horizontal yaw, above magazine, modest FOV minimizing trapezoid. User controls distance, FOV, pitch, yaw, roll; magazine scale/tilt. Hemisphere/ambient plus one key directional. High roughness, metalness zero, faint specular. Key shadows on receiving pages and Cloud plane, restrained spine separation and soft contact shadow. Tune ambient, key intensity and xyz position, shadow strength and softness. Same-family floor only, no decor. Shadow quality/pixel ratio adaptive to viewport. Camera fit prevents clipping at desktop 1440/1280 and tablet 768/mobile 390, including midflip height. Controls usable without introducing document scroll sections.

## Laboratory panel
Small HTML control panel, collapsible for clean view and mobile. Every listed CAMERA/MAGAZINE/PAGE/LIGHT/SHADOW/ANIMATION parameter above updates scene immediately. Sliders show value, accessible labels, no heavy GUI dependency. Flip duration and interflip delay. Replay, Pause/Play, Final State, Reset. Optional DEBUG default off: wireframe/subdivisions, axes, spine, measured FPS and active progress. Include deterministic timeline scrub control to inspect 0/25/50/75/100% screenshots; this supports requested visual QA. No site navigation or footer.

## Lifecycle and failures
Client-only WebGL initialized after mounting; Cloud visible before ready, no black opening/flying object. Clear accessible WebGL/asset-load failure with retry if feasible; no misleading success. React StrictMode safe async disposal: cancel RAF, dispose all geometry/materials/textures/renderer, remove observers/listeners/context handlers. Stop/render-on-demand when static; replay and controls wake renderer. DPR <=1.5–2 desktop, lower mobile. No perframe React render or perframe all-page deformation. Aim 60fps desktop, measure actual browser results and report limitations; no fabricated FPS. Handle resize/tab visibility/WebGL context loss without leaks. No backend or persistence required.

## Boundaries and tests
One laboratory feature implemented in one executor context (T0). Scene controller owns Three resources, texture factory owns local editorial artwork, pure deformation/timeline functions own geometry/motion, React shell owns controls and reports. Public controller surface only update params, replay/pause/final/reset/seek/dispose. Test seams: pure deformation/timeline + visible route controls. Geometry internals hidden from shell.

## Verification and refinement
Run geometry/timeline unit tests, lint, typecheck, full frontend unit suite and production build. Browser QA mandatory with actual screenshots: initial, 25%, 45–55% midflip, 75%, final. Three actual sequential refinement passes with before/after screenshots and documented findings: (1) geometry, spine, bend/curl/end flatten/intersections, (2) lighting/camera/thickness/shadows, (3) motion acceleration/curl timing/pauses/settling. View and iterate screenshots, do not count a working canvas as quality evidence. Test 1440,1280,768,390; browser console/network clean; verify Replay/Pause/Final/Reset/immediate tuning, reduced motion, no page scroll, resource cleanup and final stop. Rebuild local frontend at localhost:3000 using existing Compose if available; no external deploy. Verify no diff to test_5 or unrelated routes. Document three passes and measured performance, not merely checks.

## Final report
Concise Russian report linking created files and route; dependencies/versions, direct Three.js, CPU geometry/curl formula/subdivisions, shadows, camera, all tuning parameters, passes, tested sizes/performance, unchanged test_5 and prototype limitations before later integration. No large code listing. No integration implemented early.

## Decisions and additions
ASSUMPTION: direct Three.js CPU deterministic arc-length deformation, native HTML panel, no third-party services or new env vars. Timeline scrub is QA support under the explicit debug/visual QA requirements, not site functionality. All content illustrative and local. No requirements deferred or dropped.

## Plan sizing
T1: two serial deliverables. First delivers working complete scene with controls and tests. Second is browser-led three-pass refinement and measured acceptance, a substantial geometry/light/motion task that revisits the running scene. No artificial parallel split of shared scene files.

## G2 clarification: implementation depth, not extra product scope
Scrub is a laboratory debug control serving required progress QA, visibility pause and dynamic reduced-motion serve deterministic motion/accessibility, WebGL failure/cleanup serve lifecycle, screenshots are evidence of requested visual comparisons, on-demand final rendering serves performance while keeping scene live. These are subordinate R##.n implementation details, not extra site capabilities. No change to original scope.

## Cross-platform lock (D01, ticket02)
Windows npmci dryrun and local build do not prove Linux Docker clean install. Docker exposed missing existing @emnapi/runtime and core optional transitive lock entries. Repair lock only, no added direct dependencies; verify clean Linuxnpmci through Docker frontendbuild. User scope unchanged.

## Scoped icon (D02, ticket02)
Real Chromium requested absent global/favicon.ico which headless-shell did not, causing consoleerror. Add only test6 route icon/metadata, keepglobal andother routes unchanged; validate actual Chromium console/network. Original consoleclean requirement unchanged.
