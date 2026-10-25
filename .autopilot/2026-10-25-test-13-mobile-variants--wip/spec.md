# Specification: mobile layouts for `/test_13`

## User problem

The existing `/test_13` magazine experience is designed for a large screen and shows an unsupported-screen message on smaller viewports. The user needs to know whether the issue can still work on phones, and needs three live examples to compare before deciding whether the content is worth continuing.

## Outcome

Add `/test_15`, `/test_16`, and `/test_17` as three usable, distinct mobile reading layouts for the same seven-chapter issue. Keep `/test_13` as the unchanged desktop reference. Every version must let a phone visitor understand where they are, choose or change chapters, read the complete issue comfortably, and follow its existing links. Deploy all three preview routes to the project's configured preview server and return their verified URLs.

## User stories and acceptance

| ID | Story | Acceptance |
|---|---|---|
| R01 | As a visitor on a phone, I can use the issue that `/test_13` presents on desktop. | All seven original spreads (fourteen reading pages), their text, facts, images, and existing destinations remain available from the three new routes. The desktop-only unsupported message is not shown in these routes at phone sizes. `/test_13` source and behavior stay unchanged. In the final report, state whether adapting this issue for phones is viable based on the tested variants, and identify the strongest option (or say none meets the usability bar). |
| R02 | As a visitor, I can read and navigate without zooming or guessing. | At 320, 390, and 844 CSS px wide viewports there is no horizontal page overflow; body copy is at least 16px, hierarchy and contrast are legible, touch targets are at least 44px, and controls have clear labels/focus. All layouts expose chapter names and current position. |
| R03 | As the owner, I can judge whether the issue makes sense on mobile. | The three public routes have meaningfully different reading structures, load without requiring a page-turn gesture, and can be evaluated independently. They retain the issue's context and report an obvious route back to the start of the issue. |
| R04 | As the owner, I can compare the variants side by side. | `/test_15` is a continuous long-scroll issue with a compact sticky chapter index; `/test_16` is a one-chapter-at-a-time reader with stacked pages and explicit previous/next navigation; `/test_17` begins with a visual chapter index and opens one full chapter at a time, with an explicit return to the index. Each route identifies its layout in the page metadata/intro without obscuring the editorial content. |
| R05 | As the owner, I can review the finished versions on the preview server. | The three routes deploy through the documented preview deployment procedure; no production services, database contents, or unrelated routes are changed. Confirm the configured HTTPS origin and available documented port before reporting URLs. |
| R06 | As the owner, I authorize access to the server for deployment by the login method stated in the request. | Attempt access with a preconfigured SSH key first. The password included in chat was redacted from files and will not be copied to a command, file, process argument, or log under the active credential-handling boundary. If no existing key authenticates, the deployment remains blocked; report the exact key-auth result and do not claim publication. |
| R07 | As the owner, I can open each result directly. | Final response includes a separate, verified clickable URL for `/test_15`, `/test_16`, and `/test_17`; verify each route responds successfully after deployment. |
| R08i | As a reader, I get the same editorial issue across the experiments. | Reuse source content and assets from the test13 issue; do not rewrite facts, remove chapters, or change existing story destinations. Route-specific layout and navigation may differ. |
| R09i | As a phone visitor, I can operate the issue with touch and assistive input. | Navigation uses semantic buttons/links with visible focus; chapter selection does not require swipe, hover, keyboard-only input, or WebGL. Respect reduced-motion preferences; switching chapter updates the URL/history where it does not disrupt the existing content contract. |

## Decisions and implementation boundaries

- **ASSUMPTION:** The three routes are separate comparison prototypes, not a redesign of `/test_13`; keep its implementation and the shared test12 source untouched.
- **ASSUMPTION:** Prefer route-local wrappers and styles around the existing test13 issue content. If current exported components couple content to page-turn state, add a small route-local presentation layer without changing the source issue data.
- **ASSUMPTION:** Phone support includes portrait phones and landscape phones with short viewport height. Validate 320×700, 390×844, and 844×390. Layouts must remain usable in both orientations.
- **ASSUMPTION:** These experimental routes remain noindex, matching the existing editorial experiment conventions; do not add them to the main site navigation.
- The original seven chapters, fourteen reading pages, images, language, facts, and link destinations are content invariants.
- Route-specific CSS and components live under `frontend/src/components/test_15/`, `test_16/`, and `test_17/`; route entries live under `frontend/src/app/test_15/`, `test_16/`, and `test_17/`. Share only small, stable helpers if necessary; avoid editing `test_13` or `test_12` files.
- The three routes share one new static mobile-content wrapper in `frontend/src/components/test_mobile/issue-content.tsx`. Its public contract is `MobileIssueSpread({ index, className? })`; it renders both original pages for one spread in a semantic, readable vertical flow and owns only route-local mobile overrides. It does not own route state, chapter navigation, or modify the source issue.
- The local repository defines the preview image build and host Nginx/HTTPS procedure. Follow `docs/deployment-preview.md` and `compose.deploy.yaml`; do not infer a port from an old runbook example.

## Important states and behavior

- Direct links to each route render the issue from its initial state without a cover-opening action.
- `/test_15`: all seven chapters follow in one reading column; a compact chapter navigation remains available without taking over the text. Selecting a chapter jumps to its heading and updates the active chapter as the reader moves.
- `/test_16`: one chapter is visible at a time; left and right source pages become a single readable vertical chapter. Previous/next controls name their destination. A chapter selector gives direct access to any of the seven chapters. URL query `?spread=1..7` opens the requested chapter; invalid values fall back to the first chapter.
- `/test_17`: show seven scannable chapter cards with a short, truthful excerpt/title taken from the issue. Opening a card presents its complete chapter; a persistent, plainly labeled action returns to the card index. Browser back returns to the previous issue state when possible.
- Loading does not depend on an external service. If an image is unavailable, preserve its layout and useful alt text; reading and navigation still work.
- Keyboard Tab and Enter/Space operate all controls. Reduced-motion disables nonessential transitions. No automatic audio, autoplay, or forced orientation.

## Scope exclusions

| Requirement | Deferred because |
|---|---|
| Modify `/test_13` itself or shared test12/test magazine sources | R01-R08i require preserving the desktop control and issue content while comparing mobile prototypes. |
| Add an editorial CMS, new article content, translation, or new publication navigation | R01/R04 ask for layout experiments using the existing issue only. |
| Change real production/publication routes, backend, authentication, database, or deployment architecture | R05 is limited to the documented preview deployment. |
| Password-based SSH automation | R06 security boundary: deploy only through a preconfigured SSH key; do not persist or expose the supplied secret. |

## Verification

- Run frontend lint, typecheck, relevant tests, and a production build using the repository's documented commands.
- Use browser checks at 320×700, 390×844, and 844×390 for all three routes. Check zero horizontal overflow, minimum text/control sizing, navigation to all seven chapters, history/deep-link behavior, keyboard access, and image alt text.
- Run the required Impeccable UI detector against all changed UI targets after implementation and address findings relevant to these routes.
- For deployment, confirm SSH key authentication, inspect the configured preview HTTPS port/origin, rebuild the documented `linux/amd64` preview images, deploy, and verify all three HTTP routes before reporting links.

## Module boundaries

| Module | Owns | Exposes | Hides |
|---|---|---|---|
| Each route module (`test_15`, `test_16`, `test_17`) | Its route state, semantic navigation, layout composition, route-local responsive styles | A default Next.js page; route-specific accessible chapter navigation | Layout details and state mechanics specific to that experiment |
| Shared mobile issue rendering layer (`test_mobile`) | Static display of one original spread as a readable two-page vertical flow and mobile-only style resets | `MobileIssueSpread({ index, className? })` | Source issue content, route navigation/state, and physical page-turn engine |
| Existing test13 issue content | Original issue copy, facts, images, and story links | Existing content/spread exports read by the variant pages | Desktop magazine presentation and any unrelated shared behavior |

Test seam: rendered route behavior through each page's public URL in the browser, plus direct inspection of the issue content exposed by its route. Do not alter the shared issue source to create the variants.

## Manifest coverage

R01-R09i are addressed in the table above and the decisions/behavior/verification sections. R06 remains contingent on an existing deploy key; the implementation itself has no dependency on that server access.
