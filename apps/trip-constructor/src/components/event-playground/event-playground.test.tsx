import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { EventPlayground } from "./event-playground";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("uses the real editor and keeps changes locally", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(<EventPlayground />);
  expect(await screen.findByRole("dialog", { name: "Редактирование элемента" })).toHaveClass("modal-panel");
  expect(screen.getByLabelText("Название элемента")).toHaveValue("Ночной поезд N085 Бангкок → Сураттхани");
  expect(screen.getByText("Общие данные")).toBeInTheDocument();
  expect(screen.getByText("Этапы события")).toBeInTheDocument();
  expect(screen.getAllByText(/6\s*300,00 THB/).length).toBeGreaterThan(0);
  const title = screen.getByLabelText("Название элемента");
  await userEvent.clear(title);
  await userEvent.type(title, "Тестовый поезд");
  await userEvent.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(await screen.findByRole("status")).toHaveTextContent("только в песочнице");
  await userEvent.click(screen.getByRole("button", { name: "Открыть редактор" }));
  expect(screen.getByLabelText("Название элемента")).toHaveValue("Тестовый поезд");
  expect(fetchSpy).not.toHaveBeenCalled();
});
