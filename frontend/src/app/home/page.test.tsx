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

test("home catalogs current project pages by theme and marks parallel experiments", async () => {
  const page = await HomePage();
  render(page);

  expect(screen.getByRole("heading", { name: "Работа клуба" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Исследования" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Основной публичный сайт" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Дизайн и редакционные эксперименты" })).toBeInTheDocument();

  const expectedPaths = [
    "/home", "/admin/trips", "/admin/trips/new", "/admin/account", "/admin/login",
    "/research", "/research/new", "/", "/formats", "/archive", "/start", "/thanks",
    "/legal", "/privacy", "/personal-data", "/payment", "/services/route", "/services/turnkey", "/tours",
    "/design-system", "/test", "/test_2", "/test_3", "/test_4", "/test_5", "/test_6",
    "/test_7", "/test_8", "/test_9", "/test_10", "/test_11", "/test_12", "/test_13",
  ];
  const actualPaths = screen.getAllByRole("link").map(link => link.getAttribute("href"));
  expect(actualPaths).toEqual(expectedPaths);
  expect(screen.getByRole("link", { name: /Поездки/ })).toHaveTextContent(/список поездок/i);
  const test12 = screen.getByRole("link", { name: /Эксперимент Travel Club 12/ });
  const test13 = screen.getByRole("link", { name: /Эксперимент Travel Club 13/ });
  expect(test12).toHaveAttribute("href", "/test_12");
  expect(test13).toHaveAttribute("href", "/test_13");
  expect(test12).toHaveTextContent("В параллельной сборке");
  expect(test13).toHaveTextContent("В параллельной сборке");
});
