import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Archive } from "./archive";
import { archiveRecords, type ArchiveRecord } from "./archive-data";

afterEach(cleanup);

it("renders every year descending, both record kinds, and only supplied story links", () => {
  const records: ArchiveRecord[] = [
    { ...archiveRecords[1], id: "older-note", year: 2024 },
    ...archiveRecords,
    { ...archiveRecords[0], id: "later-issue", year: 2027, kind: "issue", href: "/test_5" },
    { ...archiveRecords[2], id: "another-2026-note", year: 2026 },
  ];
  // Injection exercises future records without publishing fictional trips.
  render(<Archive records={records} />);
  const years = screen.getAllByRole("region", { name: /^\d{4}$/ }).map(region => region.getAttribute("aria-labelledby"));
  expect(years).toEqual(["archive-2027-title", "archive-2026-title", "archive-2025-title", "archive-2024-title"]);
  expect(screen.getAllByRole("article")).toHaveLength(8);
  const issue = within(screen.getByRole("region", { name: "2027" }));
  expect(issue.getByText("ISSUE", { exact: true })).toBeVisible();
  expect(issue.getByRole("link", { name: /Читать историю/ })).toHaveAttribute("href", "/test_5");
  const note = within(screen.getByRole("region", { name: "2024" }));
  expect(note.getByText("FIELD NOTE", { exact: true })).toBeVisible();
  expect(note.queryByRole("link")).not.toBeInTheDocument();
});
