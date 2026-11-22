import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Page from "./page";

const token = "a".repeat(43);
const params = Promise.resolve({ token });
afterEach(() => vi.unstubAllGlobals());

test("shows an inclusive duration, guide navigation and an honest empty day", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Зимняя поездка", start_date: "2028-02-28", end_date: "2028-03-01",
    participants: 1, client_note: "", internal_title: "Рабочий черновик",
    days: [{ date: "2028-02-28", city: "Осака", title: "", items: [], client_note: "" }],
    general_items: [],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  expect(view.getByText("3 дня")).toBeVisible();
  expect(view.getByText("1 участник")).toBeVisible();
  expect(view.getByRole("button", { name: "Обзор поездки" })).toHaveAttribute("aria-current", "page");
  expect(view.getByRole("button", { name: /Практический план/ })).toBeEnabled();
  expect(view.getByRole("heading", { name: "О путешествии" })).toBeVisible();
  expect(view.getByRole("heading", { name: "Программа по дням" })).toBeVisible();
  expect(view.getByText("Описание этого дня пока не добавлено.")).toBeVisible();
  expect(container).not.toHaveTextContent(/Свободное время|Рабочий черновик/);
  expect(container.querySelector('img[src*="/photos/"]')).toBeNull();
});

test("normalizes locale-specific spaces in the date range for hydration", async () => {
  const formatter = vi.spyOn(Intl.DateTimeFormat.prototype, "formatRange").mockReturnValue("20–21 ноября 2026\u202fг.");
  try {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-21", participants: 1, days: [], general_items: [],
    })));
    const { container } = render(await Page({ params }));
    expect(within(container).getByText("20–21 ноября 2026 г.").textContent).toBe("20–21 ноября 2026 г.");
  } finally { formatter.mockRestore(); }
});

test("uses assigned catalogue photos and keeps day events in the practical plan", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Путешествие по Китаю", cover_photo_id: "shanghai-night",
    start_date: "2026-11-20", end_date: "2026-11-21", participants: 2, client_note: "",
    days: [
      { date: "2026-11-20", title: "Вдоль канала", city: "Сучжоу", photo_id: "suzhou-canal",
        client_note: "Day description", items: Array.from({ length: 5 }, (_, i) => ({ type: "excursion", title: `Прогулка ${i + 1}` })) },
      { date: "2026-11-21", title: "В Шанхае", city: "Шанхай", photo_id: "https://untrusted.example/photo", items: [] },
    ],
    general_items: [{ title: "Общее событие", type: "activity" }],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  expect(view.getByRole("img", { name: "Ночная панорама Шанхая с реки" })).toBeVisible();
  expect(view.getByRole("img", { name: "Лодки и дома у канала" })).toBeVisible();
  expect(view.getAllByRole("img")).toHaveLength(2);
  expect(container.innerHTML).not.toContain("untrusted.example");
  const day = within(view.getByRole("region", { name: "День 1" }));
  expect(day.getByText("Day description")).toBeVisible();
  expect(day.queryByRole("heading", { name: /3$/ })).not.toBeInTheDocument();
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  expect(view.getByRole("heading", { name: /5$/ })).toBeVisible();
  expect(view.getByRole("heading", { name: "Общее событие" })).toBeVisible();
});

test("provides a short cover excerpt and the complete long note in the overview", async () => {
  const note = "В первый день мы пройдём пешком от набережной до сада. ".repeat(6).trim();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Весенний маршрут", start_date: "2027-04-10", end_date: "2027-04-10",
    participants: 1, client_note: note, days: [], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  expect(within(container).getByText(note)).toBeVisible();
  expect(within(container).getByText(/^В первый день.*…$/).textContent!.length).toBeLessThanOrEqual(240);
});

test("reads the public itinerary anonymously and renders client fields, dated travel and hotel stays", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({
    client_title: "Поездка в Японию", start_date: "2026-11-20", end_date: "2026-11-23",
    participants: 2, client_note: "Возьмите паспорт", internal_note: "Секретный комментарий",
    days: [{ date: "2026-11-20", city: "Токио", title: "Вылет", client_note: "Встречаемся у выхода",
      items: [{ title: "Ночной рейс", description: "Прямой рейс", start_time: "23:20:00", end_time: "06:30:00",
        end_date: "2026-11-21", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 540,
        type: "flight", departure_city: "Москва", arrival_city: "Осака",
        client_note: "Ручная кладь", external_url: null },
        { type: "transfer", title: "Трансфер", departure_label: "Терминал 2", arrival_label: "Отель у реки" }] }],
    general_items: [{ type: "hotel", title: "Гостиница", check_in: "2026-11-21", check_out: "2026-11-23", check_in_time: "14:00:00", check_out_time: "11:00:00" }],
  }));
  vi.stubGlobal("fetch", fetcher);
  const { container } = render(await Page({ params }));
  const view = within(container);
  const [url, options] = fetcher.mock.calls[0];
  expect(new URL(url).pathname).toBe(`/api/public/trips/${token}`);
  expect(options).toMatchObject({ cache: "no-store", credentials: "omit", redirect: "error" });
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  for (const name of ["Поездка в Японию", "Ночной рейс", "Гостиница"]) expect(view.getByRole("heading", { name })).toBeVisible();
  fireEvent.click(view.getByText("Подробнее"));
  for (const note of ["Возьмите паспорт", "Встречаемся у выхода", "Ручная кладь"]) expect(view.getByText(note)).toBeVisible();
  expect(container).toHaveTextContent(/23:20 UTC\+03:00.*21 ноября.*06:30 UTC\+09:00/);
  expect(container).toHaveTextContent(/Заезд.*21 ноября.*14:00.*Выезд.*23 ноября.*11:00/);
  expect(container).toHaveTextContent("Москва → Осака");
  expect(container).toHaveTextContent("Терминал 2 → Отель у реки");
  expect(container).not.toHaveTextContent("Секретный комментарий");
  expect(container.innerHTML).not.toContain("private.example");
});

test("uses flight cities and hides unstructured locations even when cities are missing", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Перелёты", start_date: "2026-11-20", end_date: "2026-11-20",
    participants: 2, days: [], general_items: [
      { type: "flight", title: "Перелёт с городами", departure_city: "Москва", arrival_city: "Осака",
        location: "Санкт-Петербург — Токио", departure_label: "Прежний вокзал", arrival_label: "Прежняя станция" },
      { type: "flight", title: "Перелёт с одним городом", arrival_city: "Ханой", location: "Адлер — Пекин" },
      { type: "flight", title: "Перелёт без городов", location: "Место прошлой встречи" },
    ],
  })));
  const { container } = render(await Page({ params }));
  const [current, partial, withoutCities] = within(container).getAllByRole("listitem").map(item => within(item));
  expect(current.getByText("Москва → Осака")).toBeVisible();
  for (const text of ["Санкт-Петербург — Токио", "Прежний вокзал", "Прежняя станция"]) {
    expect(current.queryByText(text, { exact: false })).not.toBeInTheDocument();
  }
  expect(partial.getByText("Прибытие: Ханой")).toBeVisible();
  expect(partial.queryByText("Адлер — Пекин")).not.toBeInTheDocument();
  expect(withoutCities.getByRole("heading", { name: "Перелёт без городов" })).toBeVisible();
  expect(withoutCities.queryByText("Место прошлой встречи")).not.toBeInTheDocument();
});

test("shows destinations that belong to the current event type after a type change", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Наземная программа", start_date: "2026-11-20", end_date: "2026-11-21",
    participants: 2, days: [], general_items: [
      { type: "hotel", title: "Отель", location: "Набережная, 1", check_in: "2026-11-20", check_out: "2026-11-21",
        departure_city: "Старый город отправления", arrival_city: "Старый город прибытия",
        departure_label: "Старый терминал", arrival_label: "Старый вокзал" },
      ...["transfer", "train_bus", "rental"].map(type => ({
        type, title: `Поездка на транспорте (${type})`, location: "Через центр", departure_label: "Речной вокзал",
        arrival_label: "Музей", departure_city: "Старый город отправления", arrival_city: "Старый город прибытия",
      })),
    ],
  })));
  const { container } = render(await Page({ params }));
  const [hotel, ...transport] = within(container).getAllByRole("listitem").map(item => within(item));
  expect(hotel.getByText("Набережная, 1")).toBeVisible();
  expect(hotel.getByText(/Заезд.*Выезд/)).toBeVisible();
  expect(hotel.queryByText(/Старый/)).not.toBeInTheDocument();
  for (const item of transport) {
    expect(item.getByText("Речной вокзал → Музей")).toBeVisible();
    expect(item.getByText("Через центр")).toBeVisible();
    expect(item.queryByText(/Старый/)).not.toBeInTheDocument();
  }
});

test("an invalid or revoked link produces the same not-found outcome without rendering server detail", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response("private backend detail", { status: 404 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(Page({ params: Promise.resolve({ token: ".." }) })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  expect(fetcher).not.toHaveBeenCalled();
  await expect(Page({ params })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  expect(fetcher).toHaveBeenCalledOnce();
});


test("practical plan shows ordered events, both places and copy failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-20", participants: 2, client_note: "",
    days: [{ date: "2026-11-20", title: "День в пути", city: "Токио", items: [
      { type: "flight", title: "Рейс", start_time: "10:00:00", departure_city: "Токио", arrival_city: "Осака",
        map_place: { name: "Аэропорт отправления", latitude: 35.55, longitude: 139.78 },
        map_end_place: { name: "Аэропорт прибытия", latitude: 34.43, longitude: 135.24 }, external_url: "https://example.com/ticket" },
      { type: "meal", title: "Обед", description: "Без точки", stages: [{ id: "stage-1", title: "First stage", start_time: "12:00:00", end_time: "13:00:00", notes: "Stage note" }] }
    ] }], general_items: []
  })));
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  expect(view.queryByRole("heading", { name: "Программа по дням" })).not.toBeInTheDocument();
  expect(view.getByRole("heading", { name: "Рейс" })).toBeVisible();
  expect(view.getByRole("heading", { name: "Обед" })).toBeVisible();
  expect(view.getByText("First stage")).toBeVisible();
  expect(view.getByText("12:00 — 13:00")).toBeVisible();
  expect(view.getByText("Stage note")).toBeVisible();
  expect(view.getByRole("link", { name: /Открыть ресурс/ })).toHaveAttribute("href", "https://example.com/ticket");
  fireEvent.click(view.getByText(/Карта дня/));
  expect(view.getByText(/Прямые линии/)).toBeVisible();
  fireEvent.click(view.getAllByRole("button", { name: /Скопировать ссылку: Аэропорт прибытия/ })[0]);
  expect(await view.findByText(/Не удалось скопировать/)).toBeVisible();
});

test("places an overnight arrival on the next day and copies its coordinates", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-21", participants: 1,
    days: [
      { date: "2026-11-20", items: [{ type: "flight", title: "Ночной рейс", start_time: "23:00", end_time: "06:00", end_date: "2026-11-21", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 180, map_place: { name: "Вылет", latitude: 35, longitude: 139 }, map_end_place: { name: "Прилёт", latitude: 34, longitude: 135 } }] },
      { date: "2026-11-21", items: [{ type: "meal", title: "Завтрак", external_url: "javascript:alert(1)" }] },
    ], general_items: [],
  })));
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  const first = within(view.getByRole("region", { name: "Практический план: день 1" }));
  const second = within(view.getByRole("region", { name: "Практический план: день 2" }));
  expect(first.queryByRole("link", { name: /Открыть Прилёт/ })).not.toBeInTheDocument();
  expect(second.getByRole("link", { name: /Открыть Прилёт/ })).toBeVisible();
  expect(second.getByRole("heading", { name: "Завтрак" })).toBeVisible();
  expect(second.getByRole("heading", { name: "Прибытие: Ночной рейс" })).toBeVisible();
  expect(second.getByText("06:00")).toBeVisible();
  expect(second.queryByText(/UTC/)).not.toBeInTheDocument();
  expect(second.queryByRole("link", { name: /Открыть ресурс/ })).not.toBeInTheDocument();
  fireEvent.click(second.getAllByRole("button", { name: /Скопировать ссылку: Прилёт/ })[0]);
  expect(await second.findByText(/скопирована/)).toBeVisible();
  expect(writeText).toHaveBeenCalledWith("https://www.google.com/maps/search/?api=1&query=34%2C135");
});

test("places an undated hotel on its stay dates and retains other general items", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Поездка", start_date: "2026-11-20", end_date: "2026-11-21", participants: 1,
    days: [{ date: "2026-11-20", items: [] }, { date: "2026-11-21", items: [] }],
    general_items: [{ type: "hotel", title: "Отель", check_in: "2026-11-20", check_out: "2026-11-21", map_place: { name: "Отель у моря", latitude: 40, longitude: 30 } }, { type: "other", title: "Страховка" }],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  for (const day of [1, 2]) {
    const region = within(view.getByRole("region", { name: `Практический план: день ${day}` }));
    expect(region.getByRole("heading", { name: "Отель" })).toBeVisible();
    expect(region.getByRole("link", { name: /Открыть Отель у моря/ })).toBeVisible();
  }
  expect(view.getByRole("heading", { name: "Страховка" })).toBeVisible();
});

test("keeps departure before arrival even when local arrival time is earlier", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", items: [{ type: "flight", title: "Рейс", start_time: "14:00", end_time: "09:00", end_date: "2026-11-20", map_place: { name: "Отправление", latitude: 35, longitude: 139 }, map_end_place: { name: "Прибытие", latitude: 40, longitude: -73 } }] }], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  const departure = view.getByRole("link", { name: /Открыть Отправление/ }).closest("li")!;
  const arrival = view.getByRole("link", { name: /Открыть Прибытие/ }).closest("li")!;
  expect(departure).toHaveTextContent(/^1Отправление/);
  expect(arrival).toHaveTextContent(/^2Прибытие/);
});

test("offers place links for general events without inventing a day", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", items: [] }],
    general_items: [{ type: "activity", title: "Встреча", map_place: { name: "Площадь", latitude: 45, longitude: 30 }, map_end_place: { name: "Музей", latitude: 46, longitude: 31 } }],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  expect(view.getByRole("link", { name: /Открыть Площадь/ })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=45%2C30");
  expect(view.getByRole("link", { name: /Открыть Музей/ })).toBeVisible();
  expect(within(view.getByRole("region", { name: "Практический план: день 1" })).queryByText("Встреча")).not.toBeInTheDocument();
});

test("map tiles send only origin and report an unavailable basemap", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", items: [{ type: "activity", title: "Место", map_place: { name: "Парк", latitude: 45, longitude: 30 } }] }], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  await waitFor(() => expect(container.querySelector('img[src^="https://tile.openstreetmap.org/"]')).not.toBeNull());
  const tile = container.querySelector('img[src^="https://tile.openstreetmap.org/"]')!;
  expect(tile).toHaveAttribute("referrerpolicy", "origin");
  fireEvent.error(tile);
  expect(view.getByText(/Подложка карты недоступна/)).toBeVisible();
  expect(view.getByRole("link", { name: /Открыть Парк/ })).toHaveAttribute("rel", "noopener noreferrer");
});

test("connects map selection to events and groups unique public resources", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", items: [
      { type: "activity", title: "Музей", map_place: { name: "Музей", latitude: 45, longitude: 30 }, movement: { mode: "walk", duration_seconds: 3900 }, external_url: "https://example.com/tickets" },
      { type: "activity", title: "Галерея", external_url: "https://example.com/tickets" },
      { type: "hotel", title: "Отель", external_url: "javascript:alert(1)" },
    ] }], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  await waitFor(() => expect(view.getByRole("button", { name: "Выбрать место: Музей" })).toBeInTheDocument());
  fireEvent.click(view.getByRole("button", { name: "Выбрать место: Музей" }));
  expect(view.getByRole("button", { name: "Выбрать событие: Музей" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(view.getByRole("button", { name: "Выбрать событие: Галерея" }));
  expect(view.getByRole("button", { name: "Выбрать место: Музей" })).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(view.getByRole("button", { name: "Выбрать событие: Музей" }));
  expect(view.getByRole("button", { name: "Выбрать место: Музей" })).toHaveAttribute("aria-pressed", "true");
  expect(view.getByText("Пешком · 1 ч 5 мин")).toBeVisible();
  const resources = within(view.getByRole("region", { name: "Организация поездки" }));
  expect(resources.getByRole("heading", { name: "Экскурсии и активности" })).toBeVisible();
  expect(resources.getAllByRole("link")).toHaveLength(1);
  expect(resources.queryByRole("heading", { name: "Проживание" })).not.toBeInTheDocument();
});


test("omits matching flight UTC offsets but retains differing and partial offsets", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Flights", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1, days: [],
    general_items: [
      { type: "flight", title: "Same zone", start_time: "10:00", end_time: "12:00", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 180 },
      { type: "flight", title: "Different zones", start_time: "10:00", end_time: "12:00", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 540 },
      { type: "flight", title: "Partial zone", start_time: "10:00", end_time: "12:00", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: null },
    ],
  })));
  const { container } = render(await Page({ params }));
  const [same, different, partial] = within(container).getAllByRole("listitem");
  expect(same).toHaveTextContent("10:00 — 12:00");
  expect(same).not.toHaveTextContent("UTC");
  expect(different).toHaveTextContent("10:00 UTC+03:00 — 12:00 UTC+09:00");
  expect(partial).toHaveTextContent("10:00 UTC+03:00 — 12:00");
});


test("renders uploaded day photos through the token-scoped endpoint", async () => {
  const photoId = `upload-${"a".repeat(32)}`;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Trip", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", title: "Day", photo_id: photoId, items: [] }], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  expect(container.querySelector("img")).toHaveAttribute("src", `/api/public/trips/${token}/photos/${photoId}`);
});


test("shows published map, information and booking links in the practical event", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Trip", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", items: [{ type: "activity", title: "Visit", map_url: "https://example.com/map", external_url: "https://example.com/info", booking_url: "https://example.com/booking" }] }], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  const view = within(container);
  fireEvent.click(view.getByRole("button", { name: "Практический план" }));
  expect(view.getByRole("link", { name: /Карта/ })).toHaveAttribute("href", "https://example.com/map");
  expect(view.getByRole("link", { name: /Открыть ресурс/ })).toHaveAttribute("href", "https://example.com/info");
  expect(view.getByRole("link", { name: /Бронирование/ })).toHaveAttribute("href", "https://example.com/booking");
});
