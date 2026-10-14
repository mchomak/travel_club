# Shared contract
## Boundaries
One isolated test_6 feature. Scene controller owns Three resources; texture factory owns local artwork; pure geometry/timeline owns motion; React shell owns controls. Controller public API: update params/replay/pause/final/reset/seek/dispose (names may follow code conventions). Shell must not own vertex internals. Tests through deformation/timeline and visible controls.
## Rules
Workdir C:/Users/McHomak/Projects/travel_club. Existing Next 16.3.6 React 19.3 TypeScript6 App Router. Read frontend/AGENTS and local Next docs. Only app/test_6, components/test_6, new targeted tests, frontend package and lock for authorized three/@types/three additions. No changes to /test_5 or other existing routes/assets/design-system. Existing dirty Design System files and six docs are user-owned.
Authorized minimal dependencies: three + @types/three, stable official versions verified. No Fiber/Drei/GSAP/GUI/GLTF/model addition. Missing other dependency => BLOCKED, do not install.
Commands frontend: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd run build. Specific Vitest: npm.cmd test -- src/components/test_6/*.test.ts. Browser using Playwright tooling already installed; default localhost3000, own dev port3001 if needed. Local Compose rebuild authorized. No external publish/deploy.

## Built ticket01
createScene(host,initial,report,failure,signal): Promise<SceneController>. Controller: update(params),replay(),togglePause(),final(),reset(),seek(fraction),dispose().
deformPage(progress,PageShape,columns?,rows?), sampleTimeline(elapsed,Timing). Shape includes bend/curl/stiffness/lift/spineConstraint/outerEdgeInfluence. Scene: two faces+closed edges,56x16 desktop32x16compact. Font load cleanupallSettled; natural TARGET pauses then renders hook.
QA selectors: data-testid=magazine-scene with data-phase/elapsed/active-progress/paused/frames; Sequence progress slider0..100 seeks. Buttons Replay/Pause/Play/Final State/Reset; Tuning controls + opens, Close controls − hides.
Baseline localhost3001/test_6 dev session48393. First/second/third paper midpoint38.86/62.29/85.71 percent sequence. Baseline tests86Vitest,4Playwright,lint/typecheck/build, npmci dryrun green. Root baseline visuals under frontend/test-results/test-6-root-*.png; agentbaseline test-results/test-6-ticket01-final.

## Built ticket02
Three sequential actual before/after passes complete; CPU geometrybend2.05/curl.9/cornerlead.15; smooth envelope40–60%crest, .68turns/.14holds,3.46total. CameraPitch18,key(-2,1,12),softness4,closedfootprintcentered. ControllerAPIunchanged.8puretests/88fullunit/31productionbrowser(lab10+regression21), allchecks/Dockergreen. Scopedtest6/icon.svg removesrealChromefavicon404;rootactualcleanconsole+stablerenderstopverified. PerformanceRTX4060~120FPS1440x900DPR1;SwiftShader16–17.

## Built ticket03
Conditionalmaterialmapoptionremoves5Threewarnings. Play/Replay browserchecksobservefirstresumeddrawwithoutappclockchange.10software10hardware+independentG4 10pass; fullunit88afterfinalfix;lint/typecheck/Dockerbuildpass.0Threewarnings/errors/HTTPfailures; exactly2existingroot404CSSpreloadwarningsalso/test5 remainexplicitR680scope limitation. Finalstableproofdocs/qa/test-6.
