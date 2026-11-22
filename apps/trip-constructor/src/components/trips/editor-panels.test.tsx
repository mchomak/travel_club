import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayForm, Finances } from "./editor-panels";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";
import { calculateTrip } from "@/lib/pricing";

afterEach(cleanup);

test("reopens the selected day photo and allows removing it", async () => {
  const onSave = vi.fn(), user = userEvent.setup();
  const day = { ...emptyDay("2026-10-01"), photo_id: "thai-train" };
  render(<DayForm day={day} onSave={onSave} onCancel={() => {}} />);
  const photo = screen.getByRole("combobox", { name: "Фото дня" });
  expect(photo).toHaveValue("thai-train");
  await user.selectOptions(photo, "");
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ photo_id: null }));
});

test('pending transfer cost marks the estimate incomplete and opens the normal price editor',async()=>{
 const day=emptyDay('2026-10-01'),item={...newItem('transfer',day,'RUB',day.date),title:'Такси 1',included:false,price_pending:true};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]},open=vi.fn();
 render(<Finances trip={trip} calculation={calculateTrip(trip)} error={null} onChange={()=>{}} onRates={()=>{}} onOpenItem={open}/>);
 expect(screen.getByRole('status')).toHaveTextContent('Смета неполная');
 expect(screen.getByText(/Стоимость не указана/)).toBeVisible();
 await userEvent.click(screen.getByRole('button',{name:'Указать стоимость: Такси 1'}));
 expect(open).toHaveBeenCalledWith(item.id);
});

test("day saves an empty status", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "" }));
});

test("day saves a suggested status", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  const status = screen.getByLabelText("Статус дня");
  expect(document.querySelector('datalist#day-statuses option[value="День вылета"]')).toBeInTheDocument();
  await user.type(status, "День вылета");
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "День вылета" }));
});

test("day accepts a custom status and trims it on save", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  await user.type(screen.getByLabelText("Статус дня"), "  День на море  ");
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "День на море" }));
});

test("day rejects a status over 200 characters before onSave", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  fireEvent.change(screen.getByLabelText("Статус дня"), { target: { value: "x".repeat(201) } });
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText("Не больше 200 символов")).toBeInTheDocument();
});


test("uploads a day photo and saves its identifier", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "upload-0123456789abcdef0123456789abcdef" }), { status: 201, headers: { "Content-Type": "application/json" } }));
  try {
    render(<DayForm tripId="trip-1" day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
    await user.upload(screen.getByLabelText(/JPEG/), new File(["image"], "photo.jpg", { type: "image/jpeg" }));
    expect(await screen.findByRole("img")).toHaveAttribute("src", "/api/trips/trip-1/photos/upload-0123456789abcdef0123456789abcdef");
    await user.click(screen.getByRole("button", { name: /\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0435\u043d\u044c/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ photo_id: "upload-0123456789abcdef0123456789abcdef" }));
  } finally { fetchMock.mockRestore(); }
});
