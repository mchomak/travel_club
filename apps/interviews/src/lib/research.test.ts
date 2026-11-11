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

describe("research interview versions API", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads version metadata from the interview versions endpoint", async () => {
    const versions = {
      items: [{ id: "version-2", version_number: 2, created_at: "2026-10-21T12:30:00Z" }],
      latest_version_number: 2,
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true, status: 200, json: async () => versions,
    } as Response);

    await expect(researchApi.interviewVersions("interview-1")).resolves.toEqual(versions);
    expect(fetchSpy).toHaveBeenCalledWith("/api/research/interviews/interview-1/versions", expect.any(Object));
  });

  it("loads one immutable version snapshot by interview and version id", async () => {
    const version = {
      id: "version-2", interview_id: "interview-1", version_number: 2, created_at: "2026-10-21T12:30:00Z",
      snapshot: {
        respondent: { id: "respondent-1", name: "Алекс", age_range: "18_22", city: "Москва", screening_answers: {}, research_goal: "trips", suggested_category: "trips_beginner", final_category: "trips_beginner" },
        interview: { id: "interview-1", status: "completed", scenario_code: "trips_beginner", scenario_version: "1", question_snapshot: [], answers: {} },
      },
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true, status: 200, json: async () => version,
    } as Response);

    await expect(researchApi.interviewVersion("interview-1", "version-2")).resolves.toEqual(version);
    expect(fetchSpy).toHaveBeenCalledWith("/api/research/interviews/interview-1/versions/version-2", expect.any(Object));
  });

  it("creates a new version with the complete answer map", async () => {
    const created = {
      id: "version-3", interview_id: "interview-1", version_number: 3, created_at: "2026-10-21T13:30:00Z",
      snapshot: {
        respondent: { id: "respondent-1", name: "Алекс", age_range: "18_22", city: "Москва", screening_answers: {}, research_goal: "trips", suggested_category: "trips_beginner", final_category: "trips_beginner" },
        interview: { id: "interview-1", status: "completed", scenario_code: "trips_beginner", scenario_version: "1", question_snapshot: [], answers: { G01: { answer_text: "Обновлённый ответ", revision: 2, updated_at: "2026-10-21T13:30:00Z" }, G02: { answer_text: "", revision: 1, updated_at: "2026-10-21T12:30:00Z" } } },
      },
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true, status: 201, json: async () => created,
    } as Response);

    await expect(researchApi.createInterviewVersion("interview-1", { G01: "Обновлённый ответ", G02: "" })).resolves.toEqual(created);
    expect(fetchSpy).toHaveBeenCalledWith("/api/research/interviews/interview-1/versions", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ answers: { G01: "Обновлённый ответ", G02: "" } }),
    }));
  });
});
