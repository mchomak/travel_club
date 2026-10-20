# TEST_12 initial copy parity

All test_11 component files were copied byte-for-byte before shell edits. Route changes only local imports and page function name. Capture below is initial copy evidence, before Ticket 02.

[
    {
        "file":  "capture-page.ts",
        "sha256":  "EA7A32753D3C2887F9B2C2D741FA3430A895A905B9B0BA2AEC873AD3A773A6EE",
        "identical":  true
    },
    {
        "file":  "data.ts",
        "sha256":  "A7F8E8BBB4169829C9DD7AD7AF5FF556836DC69188ECC2220BF96EEC8E1B677D",
        "identical":  true
    },
    {
        "file":  "intro-scene.ts",
        "sha256":  "22B86D6A429FDA2F5CAC758433B58B6A6C396369F4403288E1319C0CB65320E3",
        "identical":  true
    },
    {
        "file":  "magazine-experience.tsx",
        "sha256":  "9EC8E104C9E61DF0A348121AB82D1287AFD76EF18459C2381E6F1E110E0E5E26",
        "identical":  true
    },
    {
        "file":  "magazine-intro.tsx",
        "sha256":  "7741A00CB46346D4DEEB7C1298AE3EF605A726C4A53D49B2CA133C7EE7545693",
        "identical":  true
    },
    {
        "file":  "magazine.module.css",
        "sha256":  "B0553BF94FC227223044FF9DF4F24B72082795C77695E24DC4806E4A2DE33F8F",
        "identical":  true
    },
    {
        "file":  "reading-turn-engine.ts",
        "sha256":  "85E0A7D16126DFA47526BA6CA2311FFEB43EA957FB90B383D297B50074BD0B9B",
        "identical":  true
    },
    {
        "file":  "reading-turn.tsx",
        "sha256":  "DBB67FD05544AE6B86B54DDA3BF3F89A3EF6C8B38951CEB56F116A4F8E58A768",
        "identical":  true
    },
    {
        "file":  "README.md",
        "sha256":  "98656B6CD47B1A27A39B169714E4CB766C9F6B5B95715623DE0E9F5C97916179",
        "identical":  true
    },
    {
        "file":  "spreads.module.css",
        "sha256":  "71472E6708D2571BA3405DBAB9A6F38B3C8FD24961C8B927EE09DDC041704BC7",
        "identical":  true
    },
    {
        "file":  "spreads.tsx",
        "sha256":  "3EEF9929C8D54E225415808795E97F29D8EA23D6A52BD9449D881B57785F39AE",
        "identical":  true
    }
]
## Ticket 01 shell verification
- Initial isolated copy typecheck passed before shell edits.
- Shell changes limited to magazine-experience.tsx and magazine.module.css; route imports are local. data.ts/spreads.tsx/spreads.module.css were left unchanged by Ticket 01.
- npm.cmd run lint: exit 0. npm.cmd run typecheck: exit 0. Full Vitest: 113 passed in 26 files, baseline 113/26.
- HTTP3012 /test_12?spread=1: 200. Real Chromium on3012: pre-hover cue visible, ready GPU scene retains cue; zero running animations after2.2s; Space opens original intro to target with no pageerrors.
- Reduced motion: cue visible and Enter opens to preference fallback. Horizontal nav44px controls fit1366x768/1440x900/1920x1080 without root horizontal overflow; bottom remains viewport minus2px.
- Visually inspected shell-cover.png and shell-cover-reduced.png beside this note. Intro/capture/reading and magazine-intro remain byte-identical to TEST_11.
- Formal new browser suite belongs to Ticket03; coordinator runs final integration/build against Ticket02 seven-chapter data.
