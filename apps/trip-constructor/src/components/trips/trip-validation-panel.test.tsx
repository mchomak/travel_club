import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripValidationPanel, type ValidationIssue } from "./trip-validation-panel";

afterEach(cleanup);
const issues: ValidationIssue[] = [
  { id: "a", code: "missing_price", category: "Финансы", severity: "error", title: "Нет цены", message: "Укажите цену", path: "items[0].price", item_id: "item-1" },
  { id: "b", code: "missing_address", category: "Маршрут", severity: "warning", title: "Нет адреса", message: "Укажите адрес", path: "items[1].address", recommendation: "Добавьте адрес" },
];

test("shows counts and filters issues by severity and category", async () => {
  const user = userEvent.setup();
  render(<TripValidationPanel issues={issues} selectedIds={[]} />);
  expect(screen.getByText("Ошибки: 1")).toBeInTheDocument();
  expect(screen.getByText("Предупреждения: 1")).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Критичность"), "warning");
  expect(screen.queryByText("Нет цены")).not.toBeInTheDocument();
  expect(screen.getByText("Нет адреса")).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Категория"), "Финансы");
  expect(screen.getByText("Замечаний по выбранным фильтрам нет.")).toBeInTheDocument();
});

test("selection and navigation pass the selected issue to the parent", async () => {
  const user = userEvent.setup(), onSelect = vi.fn(), onNavigate = vi.fn();
  render(<TripValidationPanel issues={issues} selectedIds={["a"]} onSelect={onSelect} onNavigate={onNavigate} />);
  await user.click(screen.getByRole("checkbox", { name: "Выбрать: Нет адреса" }));
  expect(onSelect).toHaveBeenCalledWith(["a", "b"]);
  await user.click(screen.getByRole("button", { name: "Перейти к замечанию: Нет цены" }));
  expect(onNavigate).toHaveBeenCalledWith(issues[0]);
  await user.click(screen.getByRole("checkbox", { name: "Выбрать все замечания" }));
  expect(onSelect).toHaveBeenLastCalledWith(["a", "b"]);
});

test("unavailable actions are disabled and supplied actions are called", async () => {
  const user = userEvent.setup(), onRevalidate = vi.fn(), onGeneratePrompt = vi.fn();
  render(<TripValidationPanel issues={issues} selectedIds={["a"]} onRevalidate={onRevalidate} onGeneratePrompt={onGeneratePrompt} />);
  await user.click(screen.getByRole("button", { name: "Проверить снова" }));
  await user.click(screen.getByRole("button", { name: "Сформировать промпт" }));
  expect(onRevalidate).toHaveBeenCalledOnce();
  expect(onGeneratePrompt).toHaveBeenCalledWith(["a"]);
  expect(screen.getByRole("button", { name: "Скачать актуальный JSON" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Загрузить исправленный JSON" })).toBeDisabled();
});

test("ignore requires a reason and is available only for warnings and recommendations", async () => {
  const user = userEvent.setup(), onIgnore = vi.fn();
  render(<TripValidationPanel issues={issues} selectedIds={[]} onIgnore={onIgnore} />);
  expect(screen.queryByRole("button", { name: "Пропустить: Нет цены" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Пропустить: Нет адреса" }));
  const reason = screen.getByLabelText("Причина пропуска: Нет адреса");
  await user.type(reason, "   ");
  expect(screen.getByRole("button", { name: "Подтвердить пропуск" })).toBeDisabled();
  await user.type(reason, "Нет данных");
  await user.click(screen.getByRole("button", { name: "Подтвердить пропуск" }));
  expect(onIgnore).toHaveBeenCalledWith(issues[1], "Нет данных");
});
test("ignored issues are marked, filterable, restorable and excluded from selection and prompt", async () => {
  const user = userEvent.setup(), onSelect = vi.fn(), onRestore = vi.fn(), onGeneratePrompt = vi.fn();
  const ignored = { ...issues[1], ignored: true, ignore_reason: "Проверим позже" };
  render(<TripValidationPanel issues={[issues[0], ignored]} selectedIds={["a", "b"]} onSelect={onSelect} onRestore={onRestore} onGeneratePrompt={onGeneratePrompt} />);
  expect(screen.getByText("Активных замечаний: 1")).toBeInTheDocument();
  expect(screen.getByText(/Проверим позже/)).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: "Выбрать: Нет адреса" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Сформировать промпт" }));
  expect(onGeneratePrompt).toHaveBeenCalledWith(["a"]);
  await user.click(screen.getByRole("checkbox", { name: "Выбрать все замечания" }));
  expect(onSelect).toHaveBeenCalledWith([]);
  await user.selectOptions(screen.getByLabelText("Статус замечания"), "ignored");
  expect(screen.queryByText("Нет цены")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Восстановить: Нет адреса" }));
  expect(onRestore).toHaveBeenCalledWith(ignored);
});
test("stale results disable ignore and restore actions", () => {
  const ignored = { ...issues[1], id: "c", title: "Пропущено", ignored: true, ignore_reason: "Причина" };
  render(<TripValidationPanel issues={[...issues, ignored]} selectedIds={[]} stale onIgnore={vi.fn()} onRestore={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Пропустить: Нет адреса" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Восстановить: Пропущено" })).toBeDisabled();
});

import { tripApi, validationPrompt } from "@/lib/trips";
test("ignore and restore requests carry the current trip version", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response('{"version":4}', { status: 200, headers: { "Content-Type": "application/json" } }));
  try {
    await tripApi.ignoreValidationIssue("trip", "issue", 4, "Причина");
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/trips/trip/validation/ignore", expect.objectContaining({ method: "POST", body: JSON.stringify({ issue_id: "issue", version: 4, reason: "Причина" }) }));
    await tripApi.restoreValidationIssue("trip", "issue", 4);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/trips/trip/validation/ignore/issue?version=4", expect.objectContaining({ method: "DELETE" }));
  } finally { fetchMock.mockRestore(); }
});
test("prompt generation excludes ignored issues even if a caller supplies their IDs", () => {
  const prompt = validationPrompt({ items: [], days: [] } as never, [{ ...issues[1], ignored: true }], ["b"]);
  expect(prompt).not.toContain("Нет адреса");
});
