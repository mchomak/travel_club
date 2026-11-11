import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn() }));

vi.mock("@/lib/server-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/components/research/history-tracker", () => ({ ResearchHistoryTracker: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { ...props, href }, children),
}));

import ResearchLayout from "./layout";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
beforeEach(() => mocks.requireAdmin.mockResolvedValue(undefined));

describe("Research navigation", () => {
  it("keeps Constructor links on the shared origin when no URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONSTRUCTOR_URL", "");
    const layout = await ResearchLayout({ children: React.createElement("p", null, "Research page") });
    const { container } = render(layout);

    expect(Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual([
      "/research",
      "/research",
      "/home",
      "/admin/trips",
    ]);
    expect(screen.getByRole("link", { name: /TC Research/ })).toHaveAttribute("href", "/research");
  });

  it("sends Constructor navigation to NEXT_PUBLIC_CONSTRUCTOR_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONSTRUCTOR_URL", "https://constructor.example/");
    const layout = await ResearchLayout({ children: React.createElement("p", null, "Research page") });
    const { container } = render(layout);

    expect(Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual([
      "/research",
      "/research",
      "https://constructor.example/home",
      "https://constructor.example/admin/trips",
    ]);
  });
});
