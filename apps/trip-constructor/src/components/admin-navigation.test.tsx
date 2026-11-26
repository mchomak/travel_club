import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AdminNavigation } from "./admin-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/event-playground" }));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

test("shows the playground navigation only in development", () => {
  vi.stubEnv("NODE_ENV", "development");
  const { rerender } = render(<AdminNavigation />);
  expect(screen.getByRole("link", { name: "Event Editor Playground" })).toHaveAttribute("href", "/admin/event-playground");
  expect(screen.getByRole("link", { name: "Event Editor Playground" })).toHaveAttribute("aria-current", "page");
  vi.stubEnv("NODE_ENV", "production");
  rerender(<AdminNavigation />);
  expect(screen.queryByRole("link", { name: "Event Editor Playground" })).not.toBeInTheDocument();
});
