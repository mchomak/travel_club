# Recreate Chromium sessions after confirmed renderer crashes

## Context

A confirmed Chromium renderer crash can leave the current session unusable. Waiting for the planned keep-alive delays recovery. The cycle should use the existing schedule after recovery rather than resubmitting an action that may already have started.

## Decision

On known renderer-crash errors, recreate the session immediately, with one restart. The current cycle then fails and is retried by the normal schedule. Do not retry a submit if it has started. Keep crash diagnostics limited to safe phase and reason information, timings, counts, DOM attempts, and optional JavaScript heap data.

## Why

Waiting for planned keep-alive is explicitly rejected for a confirmed renderer crash. Recovery is limited to known renderer errors; other ambiguous failures are not treated as proof of a renderer crash. Repeating a started submit is rejected because its outcome may be uncertain.

## Consequences

The session manager needs to identify known renderer errors and permit a single immediate recreation. A cycle interrupted by that recovery goes through the normal schedule, and a started submit remains protected from automatic repetition.
