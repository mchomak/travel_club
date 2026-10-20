# Check pooled database connections before reuse

## Context

After a page or worker failure, an idle PostgreSQL connection may no longer be usable. Both the worker and admin use SQLAlchemy engines, and reusing a closed connection can prevent a status write from succeeding.

## Decision

Configure both SQLAlchemy engines through the shared engine factory with connection pre-ping and connection recycling. Do not change the database schema for this behavior.

## Why

The selected approach checks a connection before reuse and recycles pooled connections. Continuing to reuse closed idle connections is the failure mode this decision addresses; a schema change is not needed for connection health.

## Consequences

Worker and admin engine configuration stays consistent through the shared factory. Connection health is handled at reuse time, with no schema migration.
