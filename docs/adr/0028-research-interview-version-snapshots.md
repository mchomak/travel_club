# 0028 — Preserve completed Research interviews as versioned snapshots

## Status

Accepted

## Context

Completed Research interviews can be edited after their initial completion. Updating the current respondent or answer records alone would erase what the researcher saw and recorded earlier. A historical record therefore needs to preserve the interview in its respondent context, including respondent profile fields, screening answers, question text, and interview answers.

One respondent may have multiple interviews. Versions are consequently numbered within an interview, while each snapshot also captures the respondent-level profile and screening information displayed with that interview. Existing completed interviews need a starting point in this history.

## Decision

Persist immutable, numbered, timestamped full snapshots scoped to an interview. A snapshot contains the respondent's profile/card fields (including name or pseudonym, age, city, category, and status), screening answers, question text, and that interview's answers. Enforce unique `(interview_id, version_number)` pairs.

Create version 1 when a new interview is completed. Backfill version 1 for every already-completed interview during migration, using its completion time, or its existing update time when no completion time is available. Build the backfilled snapshot from current respondent data, screening answers, interview answers, and the saved question snapshot.

An explicit save of a completed interview creates the next version and leaves the interview completed. The latest version is selected by default and may be edited; earlier versions are read-only. Unfinished interviews keep their existing autosave behavior. Completed interviews are edited manually and saved as a whole; ordinary per-answer autosave must not change them or bypass version creation.

Saving a new interview version is one transaction: validate submitted question codes against the interview's saved question snapshot; update current answer records and revisions; create the immutable full snapshot; and update interview and respondent timestamps. If any part fails, roll back the whole operation.

Saving respondent screening answers or category changes after any interview is completed also creates a new full snapshot for each of that respondent's completed interviews. Persist the respondent change and all affected snapshots in the same transaction; roll back the whole operation on failure. This keeps the history consistent with the respondent context shown for each interview.

## Rationale

A full snapshot preserves the complete context of a completed interview as it was recorded. It remains readable even when current respondent fields, screening answers, question wording, or interview answers later change. Interview-scoped numbering gives each interview its own ordered history when one respondent has multiple interviews.

Explicit saves make each edit to a completed interview an intentional historical event. Read-only historical views preserve earlier records, while autosave continues to support unfinished work without creating a version for every keystroke. Atomic writes ensure that the current records and their corresponding history cannot be left partly updated.

## Rejected alternatives

- Overwriting the prior completed interview state would destroy the history the version requirement is meant to preserve.
- Storing only answer changes or answer rows would omit respondent profile, screening answers, and question text needed to reconstruct the full questionnaire context.
- Autosaving individual edits to a completed interview would bypass the explicit save boundary and make its version history ambiguous.
- Updating screening answers or category without snapshotting every affected completed interview would leave respondent context in history inconsistent with the changed data.

## Domain terms

- **Completed interview:** an interview whose status is completed. Changes to it are saved explicitly as a new version.
- **Interview version:** an immutable, timestamped, numbered full snapshot attached to one interview. It includes respondent profile and screening context as well as the interview's question text and answers.
- **Latest version:** the newest snapshot for an interview, opened by default and available for editing through an explicit save that creates another version.
- **Historical version:** any earlier snapshot, available only for read-only viewing.

## Consequences

Persistence and API operations must preserve complete snapshots, interview-scoped numbering, timestamps, migration backfill, and the transaction boundaries above. Snapshot readers must serve the selected stored snapshot rather than reconstructing historical views from mutable current records. Changes to the fields captured in a snapshot require an explicit compatibility plan.
