# Shanghai / Open Call 01

Isolated experimental destination landing at `/test_3`: a future group trip to Shanghai on **10–17 February 2027**, **8 people**, **7 nights**. This page does not provide a confirmed commercial offer or booking.

## Files to edit

- `content.ts`: dates, trip metadata, all eight route days, itinerary copy, group compatibility, included/excluded items, image paths and crop positions, and application choices.
- `shanghai-landing.tsx`: semantic composition of the 13 sections and the local day/night scroll behaviour.
- `shanghai.module.css`: local fonts, responsive layout, and the Shanghai palette in the `.page` token block: `--sh-paper`, `--sh-graphite`, `--sh-cobalt`, `--sh-steel`, `--sh-red`. No global styles are changed.
- `application-form.tsx` / `application-form.module.css`: self-contained application with local validation and demo success state.
- `application-form.test.tsx`: user-behaviour tests for errors, input preservation, Telegram links, catchall interests, success and restored focus when editing.
- `../../app/test_3/page.tsx`: route and metadata; `icon.svg`: scoped favicon.
- `../../../public/test_3/`: replaceable local photographs and fonts. `manifest.json` records photographer, original source, license and actual image dimensions. Generic friends/coffee photographs are labelled as mood references and do not depict a confirmed Shanghai group or hotel.

## Design

A recruitment poster opens with a large condensed Shanghai masthead, an asymmetric night street crop, trip metadata and a Russian thesis. The opening environment is cold paper; the residence uses steel grey; the open route becomes graphite by day five. The later photo essay, group and application remain in night mode, with a cobalt pricing interruption. The day index is local to the route on desktop and disappears on narrow screens. No cards, new libraries, scroll hijacking or WebGL are used.

Local Golos Text handles Russian/body copy and Barlow Condensed handles the Latin poster headings. Local font licenses are in `public/test_3/fonts/`.

## Day → Night

One passive scroll listener schedules at most one `requestAnimationFrame`. Progress is measured between the route's own DOMRect and the fifth day's DOMRect, not total document height. It updates only the route's `--sh-shift` and `--sh-route-ink` variables; CSS mixes the paper/graphite tokens. Pure black/white foregrounds switch at the midpoint needed for readable contrast. The active date is the day containing the viewport anchor; its cobalt label has a quiet paper backing for contrast at every tone. State changes only when that day changes. Listeners and frames are cleaned up on unmount.

Reduced motion disables the interpolated shift and retains a static sequence: the first four days are light and the remaining four are dark. Full content and image layout remain visible without animation or intersection-triggered reveals.

## Application

All supplied fields and preference choices are present. Text inputs, fieldsets, radio controls and checkboxes have native labels; errors describe the field and focus moves to the first invalid control. Age accepts whole numbers from 1 to 120 without adding an adult-only condition. Telegram accepts `@username`, `username`, `t.me/username` and an HTTPS t.me link. Interests allow multiple selections; “всё вместе” is an exclusive catchall. Success states explicitly say that the application was not sent, data was not stored and a place was not booked. Editing restores values and focus. Reloading clears the state.

There is no `fetch`, endpoint, API request, database change, personal-data persistence, localStorage or cookie access in this form.

## Verification

From `frontend/`:

```powershell
npm.cmd test -- src/components/test_3/application-form.test.tsx
npm.cmd exec -- eslint src/app/test_3 src/components/test_3
npm.cmd run typecheck
```

The implementation checks above passed. Final full lint, production build and browser verification at 1440×900, 1024px and 390×844 are recorded by the parent workflow after the screenshot refinement pass. Page photographs use Next Image, responsive `sizes`, quality 75, lazy loading below the hero and fixed layout frames; only the hero is prioritized.

<!-- autopilot:start -->
## Scoped maintenance map

Work only in `src/app/test_3/`, `src/components/test_3/` and `public/test_3/`. This experiment has no shared-file, dependency or backend changes. `page.tsx` owns route metadata and disables indexing; `ShanghaiLanding()` composes the page; `content.ts` owns trip data, eight route days, choice lists and photo paths/alt text/crops. Some section labels and demo notices remain in `shanghai-landing.tsx`.

The current content is 10–17 February 2027, 8 people, 7 nights. Days: arrival/Bund; Yuyuan/Bund/Pudong; French Concession; architecture/art; art/food/night; Zhujiajiao; free day/common dinner; departure. Hotel, flights, final programme, price and group membership are unconfirmed. The map is a district sketch, and the eight seats show the proposed group size.

Photos are local under `/test_3/`: hero/finale use `shanghai-night-street.jpg`; residence/day 03 use `shanghai-alley.jpg`; the route otherwise uses evening/street/glass/dumplings/canal/friends/coffee. `club-evening.jpg`, `memory-dinner.jpg` and `coffee.jpg` are mood references, identified in captions or alt text. `Photo()` uses Next Image with responsive sizes, cover crops and quality 75; only the hero loads eagerly/high priority. CSS fixes frame heights; the finale overrides the crop to `50% 60%`. Attribution/license details are in the asset manifest; this maintenance pass did not re-audit it.

`shanghai.module.css` owns scoped layout, local Golos/Barlow fonts and palette: paper `#f2f1ed`, graphite `#101114`, cobalt `#174bff`, steel `#9da5b2`, red `#e34b44`. Residence has a separate `#dddfe0` background; later sections remain graphite, with cobalt pricing. Responsive rules are at 1100/700/360px; the route day index is hidden at 700px.

Day → Night belongs to the `ShanghaiLanding()` effect and `.route` styles. A passive scroll listener batches updates through one rAF; viewport anchor is 30% of height, progress ends at day 05 + 120px relative to the route. It sets only local route variables/attributes, switches black/white ink at 55%, and updates active-day state only on change. Resize and reduced-motion changes recalculate; cleanup removes listeners/cancels rAF. Reduced motion removes live shift, leaving days 01–04 light and 05–08 dark. No whole-document progress or scroll capture is used.

`ApplicationForm()` owns eight required fields, errors and in-memory demo completion. Name: 2–80 characters; age: integer 1–120; origin: 2–100 characters; Telegram: 5–32-character username starting with a letter, optionally `@` or a t.me URL. Interests are multiple choice, with exclusive “всё вместе”. Errors focus the first invalid input; success focuses its heading; editing retains values and returns focus to name. There is no transmission, persistence or booking; reload clears state. `application-form.module.css` owns form styling and `application-form.test.tsx` covers its user behaviour.

Commands from `frontend/` (the parent workflow records results):

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3103
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Production refresh from the repository root:

```powershell
docker compose build frontend
docker compose up -d --no-deps frontend
```
<!-- autopilot:end -->
