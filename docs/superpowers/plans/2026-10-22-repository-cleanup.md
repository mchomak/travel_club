# Repository Cleanup Implementation Plan

**Goal:** Reduce generated artifacts and clutter in the GitHub `master` tree while preserving local working files and all non-duplicate source documents.

**Architecture:** Work from a clean worktree based on the current `origin/master`. Move durable root references into `docs/` or `frontend/e2e/fixtures/`, untrack generated outputs with `git rm --cached`, and add matching ignore rules so the local files remain available. Keep required root entry points and leave `AGENTS.md` byte-for-byte unchanged.

**Tech Stack:** Git, PowerShell, Markdown.

**Spec:** User request from 2026-10-22 and repository layout recommendations from this conversation.

## Global Constraints

- Do not modify `AGENTS.md`.
- Preserve non-duplicate source files; local-only artifacts stay on disk.
- Keep README, Compose files, `.env.example`, and test settings at the root when project instructions or tooling depend on those paths.
- Preserve relative documentation and test references when moving files.
- Commit and push the completed cleanup to `master`.

## Review Focus

- `AGENTS.md` remains unchanged.
- Moved concept, source, preview, and test files have updated active references.
- Git-ignored generated files remain present in the worktree.
- No documentation links are left pointing to files made local-only.
- Push targets the latest remote `master` head.

## Tasks

1. Move root business, research, design-reference, and brand-preview files into their recommended folders; remove only byte-identical root SVG duplicates.
2. Add ignore rules for generated Graphify, AutoPilot diagnostic, and redundant visual QA outputs; untrack those files while retaining local copies.
3. Update active path references and revise the asset documentation.
4. Review the diff, verify ignored files remain on disk and `AGENTS.md` is unchanged, commit, then push to `master`.
