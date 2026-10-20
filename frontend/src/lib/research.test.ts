import { afterEach, describe, expect, it, vi } from "vitest";
import { ResearchApiError, researchApi } from "@/lib/research";

describe("research API network errors", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not claim a screening answer was saved to a browser draft", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));

    await expect(researchApi.updateScreening("respondent-1", { city: "Казань" }, "trips", false))
      .rejects.toMatchObject({
        status: 0,
        code: "NETWORK_ERROR",
        message: "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
      } satisfies Partial<ResearchApiError>);
  });

  it.each([
    [true, "Нет связи с сервером. Текст сохранён в черновике браузера."],
    [false, "Нет связи с сервером. Ответ пока есть только в памяти этой вкладки."],
  ] as const)("reports answer draft persistence accurately (draft stored: %s)", async (draftStored, message) => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));

    await expect(researchApi.saveAnswer("interview-1", "G01", "Заметка", 0, draftStored))
      .rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR", message });
  });
});
