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

afterEach(() => cleanup());
beforeEach(() => mocks.requireAdmin.mockResolvedValue(undefined));

describe("Research navigation", () => {
  it("links to the home hub while keeping the Research brand on one link", async () => {
    const layout = await ResearchLayout({ children: React.createElement("p", null, "Research page") });
    render(layout);

    expect(screen.getByRole("link", { name: "Главная" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("link", { name: /TC Research/ })).toHaveAttribute("href", "/research");
  });
});
