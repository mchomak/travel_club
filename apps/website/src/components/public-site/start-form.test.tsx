import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartForm } from "./start-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Start form", () => {
  it("keeps a missing contact on the form and focuses its actionable error", async () => {
    const user = userEvent.setup();
    render(<StartForm />);
    await user.click(screen.getByRole("button", { name: "Продолжить" }));
    const contact = screen.getByLabelText("Ваш контакт — обязательно");
    expect(contact).toHaveFocus();
    expect(contact).toHaveAttribute("aria-invalid", "true");
    expect(contact).toHaveAccessibleDescription("Оставьте Telegram, телефон или email.");
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects zero, negative, fractional, and nonnumeric participant counts before the contact", async () => {
    const user = userEvent.setup();
    render(<StartForm />);
    const participants = screen.getByLabelText("Количество человек");
    for (const value of ["0", "-2", "1.5", "1e2", "два"]) {
      await user.clear(participants);
      await user.type(participants, value);
      await user.click(screen.getByRole("button", { name: "Продолжить" }));
      expect(participants).toHaveFocus();
      expect(participants).toHaveAttribute("aria-invalid", "true");
      expect(participants).toHaveAccessibleDescription("Укажите положительное целое число людей или оставьте поле пустым.");
      expect(push).not.toHaveBeenCalled();
    }
  });

  it("rejects overlong optional text and contact even if the browser input bound is bypassed", async () => {
    const user = userEvent.setup();
    for (const [label, value, limit] of [
      ["Ориентировочный бюджет", "1".repeat(101), 100],
      ["Комментарий / пожелания", "а".repeat(2001), 2000],
      ["Ваш контакт — обязательно", `${"a".repeat(96)}@b.ru`, 100],
    ] as const) {
      render(<StartForm />);
      const field = screen.getByLabelText(label);
      fireEvent.change(screen.getByLabelText("Ваш контакт — обязательно"), { target: { value: "friend@example.com" } });
      fireEvent.change(field, { target: { value } });
      await user.click(screen.getByRole("button", { name: "Продолжить" }));
      expect(field).toHaveFocus();
      expect(field).toHaveAccessibleDescription(`Сократите ответ — до ${limit} символов.`);
      expect(push).not.toHaveBeenCalled();
      cleanup();
    }
  });
});
