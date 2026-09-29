import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemForm } from "./item-form";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";

afterEach(cleanup);

test("invalid end time stays editable and blocks saving", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const item = { ...newItem("flight", days[0], "RUB", days[0].date), start_time: "18:00", end_time: "21:00" };
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.selectOptions(screen.getByLabelText("Дата окончания"), days[0].id);
  await user.clear(screen.getByLabelText("Окончание по местному времени"));
  await user.type(screen.getByLabelText("Окончание по местному времени"), "17:00");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Окончание должно быть позже начала")).toBeInTheDocument();
  expect(screen.getByLabelText("Окончание по местному времени")).toHaveValue("17:00");

  await user.selectOptions(screen.getByLabelText("Дата окончания"), days[1].id);
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ end_day_id: days[1].id, start_time: "18:00", end_time: "17:00" }), undefined);
});

test("existing hotel keeps unspecified times until the user chooses them", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const item = newItem("hotel", days[0], "RUB", days[0].date);
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  expect(screen.getByLabelText("Время заселения")).toHaveValue("");
  expect(screen.getByLabelText("Время выселения")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in_time: null, check_out_time: null }), undefined);

  onSubmit.mockClear();
  await user.click(screen.getByRole("button", { name: "Подставить рекомендуемые часы" }));
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in_time: "15:00", check_out_time: "11:00" }), undefined);
});

test("external link requires http or https and opens safely", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = newItem("flight", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.type(screen.getByLabelText("Ссылка"), "javascript:alert(1)");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Введите полную ссылку http:// или https:// с адресом сайта")).toBeInTheDocument();

  await user.clear(screen.getByLabelText("Ссылка"));
  await user.type(screen.getByLabelText("Ссылка"), "https://example.com/ticket");
  const link = screen.getByRole("link", { name: "Открыть ссылку в новой вкладке" });
  expect(link).toHaveAttribute("href", "https://example.com/ticket");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ external_url: "https://example.com/ticket" }), undefined);
});

test("new hotel starts with suggested check-in and check-out times", () => {
  const day = emptyDay("2026-10-01");
  const item = newItem("hotel", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={() => {}} onCancel={() => {}} />);
  expect(screen.getByLabelText("Время заселения")).toHaveValue("15:00");
  expect(screen.getByLabelText("Время выселения")).toHaveValue("11:00");
});

test("legacy overnight event on the last trip day saves unrelated edits unchanged", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = { ...newItem("flight", day, "RUB", day.date), start_time: "22:00", end_time: "02:00" };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  expect(screen.getByText(/2 октября.*за пределами поездки/)).toBeInTheDocument();
  await user.clear(screen.getByLabelText("Название элемента"));
  await user.type(screen.getByLabelText("Название элемента"), "Ночной перелёт");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Ночной перелёт", day_id: day.id, end_day_id: null, start_time: "22:00", end_time: "02:00" }), undefined);

  onSubmit.mockClear();
  await user.clear(screen.getByLabelText("Окончание по местному времени"));
  await user.type(screen.getByLabelText("Окончание по местному времени"), "03:00");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Выберите дату окончания после даты начала")).toBeInTheDocument();
});
