import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RespondentList } from "@/lib/research";
import { RespondentListPage } from "./respondent-list";

const mocks = vi.hoisted(() => ({ push: vi.fn(), respondents: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({
  default: ({ href, onClick, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", {
      ...props,
      href,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          mocks.push(href);
          event.preventDefault();
        }
      },
    }, children),
}));
vi.mock("@/lib/research", () => ({
  ResearchApiError: class extends Error {},
  researchApi: { respondents: mocks.respondents },
}));

const result = {
  items: [{
    id: "respondent-1", name: "Мария", age_range: "18_22", city: "Казань",
    suggested_category: "travel_ready", final_category: "travel_ready", category_override: false,
    status: "completed", created_at: "2026-10-21T10:00:00Z", updated_at: "2026-10-21T10:00:00Z",
  }],
  total_count: 1, completed_count: 1, incomplete_count: 0, total: 1, page: 1, pages: 1,
} as unknown as RespondentList;

afterEach(() => { cleanup(); vi.clearAllMocks(); });
beforeEach(() => { mocks.respondents.mockResolvedValue(result); });

describe("Respondent list navigation", () => {
  it("opens the whole table row with mouse and keyboard and keeps the nested link single-action", async () => {
    const user = userEvent.setup();
    render(<RespondentListPage />);
    const row = await waitFor(() => screen.getByRole("row", { name: /Мария/ }));

    expect(within(row).getByText("18-22")).toBeInTheDocument();
    expect(row).toHaveAttribute("tabindex", "0");
    row.focus();
    expect(document.activeElement).toBe(row);
    await user.keyboard("{Enter}");
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/research/respondent-1");

    mocks.push.mockClear();
    row.focus();
    await user.keyboard(" ");
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/research/respondent-1");

    mocks.push.mockClear();
    await user.click(within(row).getByText("Казань"));
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/research/respondent-1");

    mocks.push.mockClear();
    const link = within(row).getByRole("link", { name: "Открыть карточку респондента Мария" });
    link.focus();
    await user.keyboard("{Enter}");
    expect(mocks.push).toHaveBeenCalledTimes(1);

    mocks.push.mockClear();
    await user.click(link);
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });
});
