# Real Metrika URL-leak diagnostic

This opt-in diagnostic downloads the current public `tag.js`, executes it in Chromium on a locally running Website, and intercepts all third-party requests before they reach the provider. It never submits the lead form. Start the Website locally with Metrika disabled, then run from the repository root:

```powershell
node apps/website/e2e/metrika-real-diagnostic.cjs
```

The default origin is `http://127.0.0.1:3100`; override it with `METRIKA_PROBE_BASE_URL` for a separate local Website instance using HTTP, IPv4 address `127.0.0.1`, and an explicit port. Remote origins are rejected. The command requires Website dependencies, Playwright's Chromium, `curl`, and network access to download the public script. The diagnostic injects the current analytics initialization and sanitized hit rather than enabling the integration in the server build; keep these synchronized when that code changes. Only synthetic canaries are used. It tests direct `/thanks` and `/formats` URLs, checks that the vendor script and watch requests actually ran, and verifies its URL decoder against a doubly encoded positive control. It searches URLs, headers, and text representations of bodies of all intercepted external requests, including the script request.

Exit 1 means an intercepted request contained the canary; exit 2 means the test could not establish a verdict. It deliberately never reports success: provider configuration responses are replaced locally, Webvisor activation is unverified, and compressed or binary replay payloads are not decoded. The check is a reproducible demonstration of a known failure, not proof of privacy, coverage of SPA transitions, or permission to enable analytics. After an architectural fix, replace or extend this diagnostic to exercise the actual integration, SPA transitions, referrers, form data, and decoded replay payloads with a verified active recording before considering activation.

## Controlled provider investigation (18 November 2026)

The recorded diagnostic above intercepted all provider traffic. A separate, explicitly authorized synthetic localhost visit forwarded the tag's provider GETs (including watch and configuration requests) through `curl`, while blocking other methods; no lead API request or real personal information was sent. The genuine downloaded tag requested `/ytm-config/114346486` and `/watch/114346486`; responses were returned, but no identifiable replay upload was observed during 15 seconds. Another probe with provider responses replaced by empty responses reproduced the URL-canary leak. The localhost visit did not preserve the provider's browser cookies, so it is not equivalent to an ordinary session. It does not prove that recording is enabled or disabled, whether localhost or counter restrictions apply, or that replay data cannot contain sensitive values. No positive recording control or replay decoding was achieved.

Yandex documents that [Session Replay must also be enabled in counter settings](https://yandex.com/support/metrica/en/webvisor/settings), and that [recordings are sampled](https://yandex.com/support/metrica/en/webvisor/requirements); [short sessions and network conditions can also prevent recording](https://yandex.com/support/metrica/en/webvisor/qanda). The exact account configuration and recording list were not accessible in this investigation. A complete replay test needs an authorized counter with known enabled settings, a verified recorded synthetic control, inspection of its replay and transport, and the actual integration and navigation flows. A synthetic `.test` hostname would not establish the real counter's domain policy, and changing the counter or impersonating its configured production origin was not performed.

A further local synthetic `/formats` visit used Chromium's normal provider networking and cookie handling for approximately 42 seconds, including mouse movement and scrolling. The browser received successful responses to provider watch/configuration requests and had provider cookies; no identifiable replay upload was observed. Redirects can bypass Playwright route callbacks after the initial request, so the temporary live probe was not a reliable interception boundary; only synthetic URL data was used. This remains an inconclusive negative observation, not a positive recording control. The original opt-in script above instead fulfills the initially intercepted external requests locally and does not intentionally follow provider redirects.

A further authorized synthetic control used the counter's configured HTTPS origin as the browser URL, without connecting to that site: Playwright fulfilled the document from an in-memory fixture, service workers were blocked, and Chromium used a local proxy that allowed CONNECT only to Yandex domains and rejected all other destinations. The fixture loaded the current real `tag.js`, enabled `webvisor: true`, and exercised synthetic text, an input, a click and mouse movement for 56 seconds. Yandex watch and configuration endpoints responded successfully and browser cookies were present, but no POST or identifiable replay upload was observed. This fixture did not exercise the Website integration or decode replay. Its outcome remains inconclusive about recording, sampling and privacy; the counter settings and reported provider maintenance were observed separately in the account UI, not verified by this script.

## Real-tag integration probe

`metrika-integration-real.spec.ts` exercises the actual Website with the build flag set to `true`. Its positive control injects the downloaded real tag and requires an intercepted watch request containing a synthetic URL canary. With the flag enabled, a clean public entry must load the real tag and issue a watch request. The scenarios check private entries, URL mutations, form submission and navigation for detectable canaries in external requests. Requests outside the exact local origin are fulfilled locally, service workers are blocked, and the lead endpoints return synthetic responses. Only the initial `curl` download contacts the provider; no browser request is forwarded to a counter. The test does not decode compressed or binary replay, establish an active recording, or establish privacy if the integration is re-enabled.

Use a separate copy and an unused loopback port; copy dependencies as real files, not a junction outside the copy (Turbopack rejects that junction). Do not reuse or remove `.next-metrika-test`. From the repository root in PowerShell, with Website dependencies and Playwright Chromium already installed:

```powershell
$probeRoot = Join-Path $env:TEMP ('travel-metrika-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $probeRoot 'apps/website') -Force | Out-Null
robocopy apps/website (Join-Path $probeRoot 'apps/website') /E /XD .next .next-metrika-test test-results playwright-report /XF '.env*'
robocopy shared (Join-Path $probeRoot 'shared') /E
curl.exe -fsSL --max-time 30 https://mc.yandex.ru/metrika/tag.js -o (Join-Path $probeRoot 'tag.js')
```

Check the download succeeded and choose an unused port; the example uses `3297`. In one PowerShell window, start the copy:

```powershell
Set-Location (Join-Path $probeRoot 'apps/website')
$env:WEBSITE_LEAD_FORM_ENABLED = 'true'
$env:WEBSITE_LEADS_API_URL = 'http://127.0.0.1:1'
$env:NEXT_PUBLIC_YANDEX_METRIKA_ENABLED = 'true'
npm.cmd exec -- next dev --hostname 127.0.0.1 --port 3297
```

In another window, set `$probeRoot` to the path printed or retained from the first window, then run:

```powershell
Set-Location (Join-Path $probeRoot 'apps/website')
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3297'
$env:WEBSITE_TEST_METRIKA_ENABLED = 'true'
$env:METRIKA_REAL_TAG_PATH = Join-Path $probeRoot 'tag.js'
npm.cmd exec -- playwright test e2e/metrika-integration-real.spec.ts --workers=1 --reporter=list
```

Stop the temporary server after the run. A passing result requires the positive control as well as the fail-closed checks; a download, browser, or server failure is not a privacy verdict. On 19 November 2026 an earlier version passed against the then-current fail-closed integration. An earlier `Unexpected end of JSON input` was not reproduced, so its cause remains unknown.

