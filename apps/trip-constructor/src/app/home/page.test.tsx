import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn(async () => undefined) }));
vi.mock("@/lib/server-auth", () => ({ requireAdmin }));
vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) =>
    <a href={href} className={className}>{children}</a>,
}));

import HomePage from "./page";

test("home does not render when the server-side admin check redirects", async () => {
  const authRedirect = new Error("redirect to login");
  requireAdmin.mockRejectedValueOnce(authRedirect);

  await expect(HomePage()).rejects.toBe(authRedirect);
  expect(requireAdmin).toHaveBeenCalledOnce();
});

test("home catalogs product pages without legacy experiment links", async () => {
  const page = await HomePage();
  render(page);

  expect(screen.getByRole("heading", { name: "Работа клуба" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Связанные приложения" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Основной публичный сайт" })).toBeInTheDocument();

  const expectedPaths = [
    "/home", "/admin/trips", "/admin/trips/new", "/admin/account", "/admin/login", "/research",
    "/", "/formats", "/archive", "/start", "/thanks", "/legal", "/privacy", "/personal-data",
    "/payment", "/services/route", "/services/turnkey", "/tours",
  ];
  const actualPaths = screen.getAllByRole("link").map(link => link.getAttribute("href"));
  expect(actualPaths).toEqual(expectedPaths);
  expect(screen.getByRole("link", { name: /Поездки/ })).toHaveTextContent(/список поездок/i);
  expect(actualPaths.some(path => path?.includes("test_") || path === "/test")).toBe(false);
});
