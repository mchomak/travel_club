# Independent original-brief acceptance

Reviewer: /root/shanghai_acceptance. Only the original brief and actual scoped source/live page were inspected; spec, manifest and other workflow records were excluded.

Verdict: all checked requirements implemented, no partial/missing block found.

- Open Call / Shanghai: poster typography, asymmetry, paper/graphite/cobalt identity; 10-17 FEB 2027, 8 people, 7 nights visible.
- Plan / residence: all four principles, Jing'an/French Concession, provisional four-star format, schematic map/coordinates, no invented hotel.
- Route: all eight dates, headings/copy, free day and highlighted quote.
- Editorial / group: all CITY/FOOD/NIGHT/PEOPLE/SPACE, NOT A CHECKLIST, compatibility and audience columns; all 18 image elements loaded.
- Includes / price / seats: planned includes/excludes, flights TBD, calculating without price; eight seats, YOU?, no fake urgency.
- CTA / application: five application anchors, hero/final CTA work; empty form eight errors, invalid text fields four; valid demo confirmation, edit and reload behave correctly. Zero mutation requests and storage unchanged; reload clears values.
- DayNight / responsive / accessibility: progress 100% at DAY05, matching active index, mobile index hidden; reduced motion removes live vars/attributes and transition is 0s. No horizontal overflow or clipped headings at 1440x900, 1024x900, 390x844. Skip link, error/success focus and image alt checked.

Own installed Node Playwright Chromium runner exit0. No page errors or failed requests. Ten temporary scoped screenshots viewed and removed. No source edits, installs, git mutations or server restarts.

Commands used: Get-Content of original brief with -Encoding UTF8; scoped rg --files excluding workflow records; Node inline Playwright script piped from literal PowerShell here-string. Browser launched via chromium.launch({headless:true}), visiting existing http://localhost:3000/test_3. Full tests/lint/typecheck/build, git scope and cold resource observations are separately recorded by root in qa.md, not claimed as this reviewer's independent checks.
