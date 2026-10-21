# Keep Studio diagnostics free of comment content

## Context

Studio scan, publication, and recovery failures need enough diagnostics to distinguish their phases and causes. Comment content and identifying details are not needed for that classification.

## Decision

Log only safe phase and reason values, timings, counts, DOM-attempt counts, and optional JavaScript heap data. Exclude authors, comment text, links, tokens, URLs, and HTML from diagnostics. Safe counters distinguish scan-budget exhaustion, changed or missing controls, publication errors, and stuck cycles.

## Why

Logging author or comment content, links, URLs, tokens, or HTML is explicitly excluded. The selected safe event and counter fields provide the specified classification without those values.

## Consequences

Diagnostics can identify error phases and aggregate scan/recovery behavior, but cannot reveal the underlying comment text, author, URL, token, or page markup.
