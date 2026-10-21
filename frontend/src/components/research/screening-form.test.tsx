import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ResearchConfig } from "@/lib/research";
import { ScreeningForm } from "./screening-form";

const screening = JSON.parse(
  readFileSync(resolve(process.cwd(), "../backend/app/research_data/screening.json"), "utf8"),
) as ResearchConfig["screening"];

const officialMillionPlusCities = [
  "Волгоград",
  "Воронеж",
  "Екатеринбург",
  "Казань",
  "Краснодар",
  "Красноярск",
  "Москва",
  "Нижний Новгород",
  "Новосибирск",
  "Омск",
  "Пермь",
  "Ростов-на-Дону",
  "Самара",
  "Санкт-Петербург",
  "Уфа",
  "Челябинск",
];

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Screening form source details", () => {
  it("suggests Russian million-plus cities for both city fields and accepts custom text", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ScreeningForm config={{ screening } as ResearchConfig} onSubmit={onSubmit} />);

    const homeCity = screen.getByLabelText("Город проживания");
    const departureCity = screen.getByLabelText("Откуда обычно вылетаете в путешествия?");
    expect(homeCity).toHaveAttribute("list");
    expect(departureCity).toHaveAttribute("list", homeCity.getAttribute("list"));
    const cityOptions = document.getElementById(homeCity.getAttribute("list") ?? "") as HTMLDataListElement | null;
    expect(Array.from(cityOptions?.options ?? [], (option) => option.value)).toEqual(officialMillionPlusCities);
    expect(Array.from(cityOptions?.options ?? [], (option) => option.value)).toContain("Краснодар");

    await user.type(screen.getByLabelText("Имя респондента или псевдоним"), "Алекс");
    await user.type(homeCity, "Тверь");
    await user.type(departureCity, "Псков");
    await user.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ city: "Тверь", departure_city: "Псков" }), null));
  });

  it("collects an optional textarea answer configured in screening JSON", async () => {
    const field = screening.additional_fields?.find((candidate) => candidate.control === "textarea");
    expect(field).toBeDefined();
    if (!field) throw new Error("Expected screening JSON to define a textarea field");

    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ScreeningForm config={{ screening } as ResearchConfig} onSubmit={onSubmit} />);

    await user.click(screen.getByText("Дополнительный вопрос из исходной анкеты"));
    const answer = "В поездке решения принимаем вместе";
    const textarea = screen.getByRole("textbox", { name: field.label });

    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).not.toBeRequired();
    await user.type(textarea, answer);
    const requiredField = screening.fields.find((candidate) => candidate.required);
    if (requiredField) await user.type(screen.getByLabelText(requiredField.label), "Алекс");
    await user.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      [field.key]: answer,
    }), null));
  });

  it("collects departure city and last trip organizer as separate optional answers", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ScreeningForm config={{ screening } as ResearchConfig} onSubmit={onSubmit} />);

    const name = screen.getByLabelText("Имя респондента или псевдоним");
    const homeCity = screen.getByLabelText("Город проживания");
    const departureCity = screen.getByLabelText("Откуда обычно вылетаете в путешествия?");
    const lastTripOrganizer = screen.getByLabelText("Бронировали сами, с друзьями или через организатора?");

    expect(departureCity).not.toBeRequired();
    expect(lastTripOrganizer).not.toBeRequired();

    await user.type(name, "Алекс");
    await user.type(homeCity, "Тверь");
    await user.type(departureCity, "Москва");
    await user.selectOptions(screen.getByLabelText("Количество самостоятельных зарубежных путешествий за последние 24 месяца"), "2");
    await user.selectOptions(lastTripOrganizer, "with_friends");
    await user.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      city: "Тверь",
      departure_city: "Москва",
      independent_trips_24m: "2",
      last_trip_organizer: "with_friends",
    }), null));
  });

  it("displays and preserves existing free-text organizer answers", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const legacyAnswer = "Планировали поездку с друзьями и сами бронировали";
    render(<ScreeningForm config={{ screening } as ResearchConfig} initialAnswers={{ name: "Алекс", last_trip_organizer: legacyAnswer }} onSubmit={onSubmit} />);

    const organizer = screen.getByRole("combobox", { name: "Бронировали сами, с друзьями или через организатора?" });
    expect(organizer).toHaveValue(legacyAnswer);
    expect(screen.getByRole("option", { name: legacyAnswer })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ last_trip_organizer: legacyAnswer }), null));
  });

  it("allows details when the organizer answer is other", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ScreeningForm config={{ screening } as ResearchConfig} initialAnswers={{ name: "Алекс" }} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Бронировали сами, с друзьями или через организатора?" }), "other");
    await user.type(screen.getByRole("textbox", { name: "Бронировали сами, с друзьями или через организатора?: уточнение" }), "Через корпоративного менеджера");
    await user.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      last_trip_organizer: "other",
      last_trip_organizer_other_details: "Через корпоративного менеджера",
    }), null));
  });
});
