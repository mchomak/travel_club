import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationForm } from "./application-form";

afterEach(cleanup);

test("the application explains demo mode, validates empty fields and keeps typed values", async () => {
  render(<ApplicationForm />);
  expect(screen.getByText(/Демо-форма/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Аня" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "Подать заявку" }));
  expect(screen.getByLabelText("Имя")).toHaveValue("Аня");
  expect(screen.getByLabelText("Возраст")).toHaveFocus();
  expect(screen.getByText("Укажи возраст целым числом от 1 до 120.")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Твой интерес отмечен." })).not.toBeInTheDocument();
});

test("a complete application accepts a displayed t.me link, catchall interests replace individual choices, and edit keeps values", async () => {
  const user = userEvent.setup();
  render(<ApplicationForm />);
  for (const [label, value] of [["Имя", "Аня"], ["Возраст", "28"], ["Telegram", "t.me/anya_travel"], ["Откуда летишь?", "Москва"]]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  await user.click(screen.getByLabelText("Один / одна"));
  await user.click(screen.getByLabelText("еда"));
  await user.click(screen.getByLabelText("ночной город"));
  await user.click(screen.getByLabelText("всё вместе"));
  expect(screen.getByLabelText("еда")).not.toBeChecked();
  expect(screen.getByLabelText("ночной город")).not.toBeChecked();
  expect(screen.getByLabelText("всё вместе")).toBeChecked();
  await user.click(screen.getByLabelText("баланс"));
  await user.click(screen.getByLabelText("50 / 50"));
  await user.click(screen.getByRole("button", { name: "Подать заявку" }));
  expect(screen.getByRole("heading", { name: "Твой интерес отмечен." })).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("заявка никуда не отправлена, данные не сохранены");
  await user.click(screen.getByRole("button", { name: "Вернуться к заявке ↗" }));
  expect(screen.getByLabelText("Имя")).toHaveValue("Аня");
  expect(screen.getByLabelText("Имя")).toHaveFocus();
  expect(screen.getByLabelText("Telegram")).toHaveValue("t.me/anya_travel");
  expect(screen.getByLabelText("всё вместе")).toBeChecked();
});
