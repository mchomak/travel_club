# Scope Studio scans to new and relevant cards

## Context

Large Studio feeds make repeated checks of already viewed comments and opening replies on unrelated cards slow and fragile. The search can use the known publication URL from the comment record. Live Playwright extraction also needs to handle large result sets without many element-by-element browser calls.

## Decision

For publication searches, use the known post URL as the search scope, process only cards newly encountered between scrolls, and expand replies only on cards belonging to the target publication. For a full-feed collection, process each new card at most once per pass. Read the post link, title, and comment fields in one read-only DOM snapshot; continue to create synthetic IDs and timestamps in Python. A legacy comment without `post_url` uses a bounded feed-search fallback and does not revisit already processed groups.

## Why

The rejected behavior is to keep rereading viewed comments and expanding reply branches on irrelevant cards. The specified one-snapshot approach replaces element-wise Playwright reads for the live path; a fake-DOM path remains available for tests.

## Consequences

Search state must distinguish new cards from already processed cards during a pass. Publication-scoped searches avoid unrelated reply expansion, while full-feed collection still visits each new card once. Legacy records without a post URL remain supported through a bounded fallback rather than an unbounded rescan.
