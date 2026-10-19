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

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Screening form source details", () => {
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
    await user.type(lastTripOrganizer, "С друзьями");
    await user.click(screen.getByRole("button", { name: "Сохранить анкету" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      city: "Тверь",
      departure_city: "Москва",
      independent_trips_24m: "2",
      last_trip_organizer: "С друзьями",
    }), null));
  });
});
