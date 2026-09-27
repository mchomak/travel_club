import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { LoginForm } from "./login-form";
import { authApi } from "@/lib/api";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("@/lib/api", () => ({ authApi: { login: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

test("failed login explains the error and preserves entered values", async () => {
  vi.mocked(authApi.login).mockRejectedValue(new Error("Неверный логин или пароль"));
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText("Логин"), { target: { value: "fixture-user" } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "FICTIONAL-ONLY" } });
  fireEvent.click(screen.getByRole("button", { name: /Войти в кабинет/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Неверный логин или пароль");
  expect(screen.getByLabelText("Логин")).toHaveValue("fixture-user");
  expect(screen.getByLabelText("Пароль")).toHaveValue("FICTIONAL-ONLY");
  await waitFor(() => expect(screen.getByRole("button", { name: /Войти в кабинет/ })).toBeEnabled());
  expect(replace).not.toHaveBeenCalled();
});
