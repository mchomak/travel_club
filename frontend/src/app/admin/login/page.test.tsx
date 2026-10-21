import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import LoginPage from "./page";

vi.mock("@/components/login-form", () => ({
  LoginForm: ({ next }: { next?: string }) => <div data-testid="login-form" data-next={next} />,
}));

test("login page passes the requested return target to the form", async () => {
  const page = await LoginPage({
    searchParams: Promise.resolve({ next: "/research/new?from=home" }),
  });
  render(page);

  expect(screen.getByTestId("login-form")).toHaveAttribute("data-next", "/research/new?from=home");
});
