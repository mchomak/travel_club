import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { authApi } from "@/lib/api";
import { ChangePasswordForm } from "./change-password-form";

vi.mock("@/lib/api", () => ({ authApi: { changePassword: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

test("changes the password and clears both fields after success", async () => {
  vi.mocked(authApi.changePassword).mockResolvedValue(undefined);
  render(<ChangePasswordForm />);
  fireEvent.change(screen.getByLabelText("Текущий пароль"), { target: { value: "CURRENT-TEST-VALUE" } });
  fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TEST-ONLY-NEW-123" } });

  fireEvent.click(screen.getByRole("button", { name: "Сменить пароль" }));

  await waitFor(() => expect(authApi.changePassword).toHaveBeenCalledWith("CURRENT-TEST-VALUE", "TEST-ONLY-NEW-123"));
  expect(await screen.findByRole("status")).toHaveTextContent("Пароль успешно изменён");
  expect(screen.getByLabelText("Текущий пароль")).toHaveValue("");
  expect(screen.getByLabelText("Новый пароль")).toHaveValue("");
});

test("clears the current password and preserves the new value after an error", async () => {
  vi.mocked(authApi.changePassword).mockRejectedValue(new Error("Текущий пароль неверен"));
  render(<ChangePasswordForm />);
  fireEvent.change(screen.getByLabelText("Текущий пароль"), { target: { value: "WRONG-CURRENT-TEST" } });
  fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value: "TEST-ONLY-NEW-123" } });

  fireEvent.click(screen.getByRole("button", { name: "Сменить пароль" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Текущий пароль неверен");
  expect(screen.getByLabelText("Текущий пароль")).toHaveValue("");
  expect(screen.getByLabelText("Новый пароль")).toHaveValue("TEST-ONLY-NEW-123");
});

test("rejects new passwords outside the 12–1024 character range", async () => {
  render(<ChangePasswordForm />);
  fireEvent.change(screen.getByLabelText("Текущий пароль"), { target: { value: "CURRENT-TEST-VALUE" } });

  for (const value of ["SHORT-TEST", "x".repeat(1025)]) {
    fireEvent.change(screen.getByLabelText("Новый пароль"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Сменить пароль" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("от 12 до 1024 символов");
  }

  expect(authApi.changePassword).not.toHaveBeenCalled();
});
