# Keep bounded search exhaustion distinct from confirmed absence

## Context

A source search can reach its configured limit without proving that the source comment was deleted or absent. Publishing without the source comment is disallowed, and a send whose outcome is uncertain must not be repeated.

## Decision

When source search is exhausted, record `scan_limit_reached=true` and `absence_confirmed=false`. Keep the publication retry limit finite. Do not publish when the source comment is unavailable. Treat an uncertain send as its own terminal status and do not retry it.

## Why

The rejected interpretation is to report bounded search exhaustion as confirmed absence or deletion. The rejected recovery for an uncertain send is to retry publication, which could duplicate a reply. Explicit status fields preserve the distinction between a search limit and evidence of absence.

## Consequences

Operators and downstream logic can distinguish an incomplete bounded search from confirmed absence. The finite retry limit remains in force, and an uncertain send cannot be automatically submitted again.
