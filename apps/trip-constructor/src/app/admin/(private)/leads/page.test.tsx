import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("@/lib/leads", () => ({
  leadsRequest: vi.fn().mockResolvedValue({
    items: [],
    counts: { new: 0, in_progress: 0, closed: 0 },
  }),
}));

import LeadsPage from "./page";

test("renders readable Russian labels for the empty dashboard", async () => {
  render(await LeadsPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("heading", { name: "Заявки с сайта" })).toBeInTheDocument();
  expect(screen.getByText("Заявок на этой странице пока нет.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Яндекс Метрика/ })).toBeInTheDocument();
});
