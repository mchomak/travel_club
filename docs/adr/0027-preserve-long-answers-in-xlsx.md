# ADR 0027: Preserve long answers in XLSX exports

## Context

Excel limits a cell to 32,767 characters, while interview answers are unrestricted multi-line text and the export must not truncate them. The Answers sheet also represents one row per interview question.

## Decision

When an answer exceeds the cell limit, split it across additional `Answer Text (part N)` columns in the same row. Keep the original answer intact in PostgreSQL.

## Why

This preserves every character and the one-row-per-question layout. Truncating loses research data; splitting across rows weakens the row identity and requires reconstruction when analyzing the sheet.

## Consequences

Consumers that need the complete answer must concatenate the numbered part columns in order. The export may add columns when unusually long answers occur.
