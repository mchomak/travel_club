# Preserve uncertain publications during stalled-cycle recovery

## Context

The watchdog may end a worker after progress has stopped. A publication can already have started while its final outcome is still unknown. The active `reply_id` and `claim_token` are available inside the publish loop, so the supervisor needs a safe way to identify and persist that attempt before recovery.

## Decision

Before ending a stalled cycle, the supervisor takes a thread-safe snapshot of the active `{reply_id, claim_token}` and durably marks the existing publication as unconfirmed. If the database cannot confirm that update, the durable `submitting` state remains non-retriable until normal lease recovery. The attempt is never automatically resumed or submitted again.

## Why

This preserves the publication result as the source of truth when the worker stops at an ambiguous point. The specified alternatives—killing only the thread, automatically resubmitting, or bypassing the durable result—do not preserve that guarantee and are rejected.

## Consequences

The supervisor must coordinate a thread-safe snapshot with the publish loop and persist the unconfirmed state before ending the cycle. A failed database confirmation leaves the attempt non-retriable pending normal lease recovery. An uncertain publication may therefore remain unresolved until that recovery occurs, but it cannot create an automatic duplicate.
