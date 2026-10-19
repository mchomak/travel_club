import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ResearchConfig, ResearchInterview, ResearchQuestion, ResearchRespondent } from "@/lib/research";
import { researchApi } from "@/lib/research";
import { RespondentDetailPage } from "./respondent-detail";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "respondent-1" }), useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));

const screening = JSON.parse(
  readFileSync(resolve(process.cwd(), "../backend/app/research_data/screening.json"), "utf8"),
) as ResearchConfig["screening"];
const config = {
  bank: { bank_version: "1", questions: [], hypotheses: [] },
  scenarios: { version: "1", scenarios: [{ code: "trips_beginner", label: "Trips / Начинающий путешественник", question_codes: [] }] },
  screening,
  classification: {},
  validation_issues: [],
  offers_enabled: false,
} as ResearchConfig;
const interview = {
  id: "interview-1",
  respondent_id: "respondent-1",
  scenario_code: "trips_beginner",
  scenario_version: "1",
  bank_version: "1",
  status: "draft",
  question_snapshot: [],
  started_at: null,
  completed_at: null,
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-20T10:00:00Z",
  answers: {},
} as ResearchInterview;
const respondent = {
  id: "respondent-1",
  name: "Алекс",
  age_range: null,
  city: "Тверь",
  screening_answers: {
    name: "Алекс",
    city: "Тверь",
    departure_city: "Москва",
    independent_trips_24m: "2",
    last_trip_organizer: "С друзьями",
  },
  research_goal: null,
  suggested_category: "trips_beginner",
  final_category: "trips_beginner",
  category_override: false,
  recommendation: {
    suggested_category: "trips_beginner",
    alternative_category: "travel_design",
    scores: { trips_experienced: 0, trips_beginner: 0, travel_design: 0, travel_ready: 0 },
    suggested_score: 0,
    reasons: [],
    signal_strength: "low",
  },
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-20T10:00:00Z",
  interviews: [interview],
} as ResearchRespondent;

const savedQuestions: ResearchQuestion[] = [
  {
    code: "G01",
    section: "G",
    text: "Сохранённый текст вопроса",
    type: "text",
    follow_ups: ["Что вы помните?"],
    answer_guidance: "Сохранённая подсказка",
  },
  {
    code: "G02",
    section: "G",
    text: "Вопрос с пустым ответом",
    type: "text",
    answer_guidance: "Подсказка для пустого ответа",
  },
];
const respondentWithSavedQuestions = {
  ...respondent,
  interviews: [{
    ...interview,
    status: "in_progress",
    question_snapshot: savedQuestions,
    answers: {
      G01: { answer_text: "Ответ из старого интервью", revision: 1, updated_at: "2026-10-20T10:00:00Z" },
      G02: { answer_text: "", revision: 1, updated_at: "2026-10-20T10:00:00Z" },
    },
  }],
} as ResearchRespondent;

beforeEach(() => {
  vi.spyOn(researchApi, "respondent").mockResolvedValue(respondent);
  vi.spyOn(researchApi, "config").mockResolvedValue(config);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); push.mockClear(); });

describe("Respondent screening snapshot", () => {
  it("shows saved detail answers with their configured labels", async () => {
    const user = userEvent.setup();
    render(<RespondentDetailPage />);

    const profile = await screen.findByLabelText("Основная информация");
    await user.click(within(profile).getByText(/Все ответы анкеты/));

    expect(within(profile).getByText("Откуда обычно вылетаете в путешествия?")).toBeInTheDocument();
    expect(within(profile).getByText("Москва")).toBeInTheDocument();
    expect(within(profile).getByText("Бронировали сами, с друзьями или через организатора?")).toBeInTheDocument();
    expect(within(profile).getByText("С друзьями")).toBeInTheDocument();
  });
});

describe("Respondent interview snapshot fallback", () => {
  it("shows saved questions and answers when loading current config fails", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondentWithSavedQuestions);
    vi.mocked(researchApi.config).mockRejectedValueOnce(new Error("Config unavailable"));

    render(<RespondentDetailPage />);

    const savedQuestion = await screen.findByRole("heading", { name: "Сохранённый текст вопроса" });
    const savedCard = savedQuestion.closest("article");
    expect(savedCard).not.toBeNull();
    expect(within(savedCard as HTMLElement).getByText("G01")).toBeInTheDocument();
    expect(within(savedCard as HTMLElement).getByLabelText("Ответ G01")).toHaveValue("Ответ из старого интервью");
    expect(screen.getByRole("heading", { name: "Вопрос с пустым ответом" })).toBeInTheDocument();
    expect(screen.getByLabelText("Ответ G02")).toHaveValue("");
    await userEvent.setup().click(within(savedCard as HTMLElement).getByText("Подсказки интервьюеру"));
    expect(within(savedCard as HTMLElement).getByText("Сохранённая подсказка")).toBeInTheDocument();
    expect(within(savedCard as HTMLElement).getByText("Что вы помните?")).toBeInTheDocument();
    expect(screen.getByText(/Актуальная конфигурация не загружена/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Выбрать вопросы/ })).toBeDisabled();
  });

  it("shows saved questions when a loaded config has no scenarios and falls back to screening keys", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondentWithSavedQuestions);
    const selectableQuestion: ResearchQuestion = {
      code: "G99",
      section: "G",
      text: "Выбираемый вопрос из банка",
      type: "text",
    };
    vi.mocked(researchApi.config).mockResolvedValueOnce({
      bank: { bank_version: "2", questions: [selectableQuestion] },
    } as unknown as ResearchConfig);
    const appendQuestions = vi.spyOn(researchApi, "appendQuestions").mockResolvedValueOnce({
      ...respondentWithSavedQuestions.interviews[0],
      question_snapshot: [...savedQuestions, selectableQuestion],
    } as ResearchInterview);

    render(<RespondentDetailPage />);

    const savedQuestion = await screen.findByRole("heading", { name: "Сохранённый текст вопроса" });
    const savedCard = savedQuestion.closest("article");
    expect(savedCard).not.toBeNull();
    expect(within(savedCard as HTMLElement).getByText("G01")).toBeInTheDocument();
    expect(within(savedCard as HTMLElement).getByLabelText("Ответ G01")).toHaveValue("Ответ из старого интервью");
    expect(screen.getByLabelText("Ответ G02")).toHaveValue("");
    const profile = screen.getByLabelText("Основная информация");
    await userEvent.setup().click(within(profile).getByText(/Все ответы анкеты/));
    expect(within(profile).getByText("departure_city")).toBeInTheDocument();
    expect(within(profile).getByText("Москва")).toBeInTheDocument();
    expect(screen.getByText("Актуальная конфигурация анкеты недоступна. Изменение ответов анкеты временно отключено.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Изменить анкету" })).toBeDisabled();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Выбрать вопросы" }));
    await user.click(screen.getByLabelText(/G99/));
    const addQuestionButton = screen.getByRole("button", { name: "Добавить выбранные (1)" });
    await user.click(addQuestionButton);
    expect(appendQuestions).not.toHaveBeenCalled();
    expect(addQuestionButton).toBeDisabled();
    expect(screen.getByText("Актуальный список сценариев недоступен. Добавление вопросов временно отключено.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ответ G01")).toHaveValue("Ответ из старого интервью");
  });

  it("keeps draft scenario actions unavailable when the loaded scenario list is empty", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondent);
    vi.mocked(researchApi.config).mockResolvedValueOnce({
      ...config,
      scenarios: { version: "2", scenarios: [] },
    });

    render(<RespondentDetailPage />);

    expect(await screen.findByLabelText("Сценарий интервью")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сохранить выбор" })).toBeDisabled();
    expect(screen.getByText("Актуальный список сценариев недоступен. Сохранение нового выбора временно отключено.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Начать интервью/ })).toBeEnabled();
  });

  it("keeps the saved interview visible and blocks screening editing when screening fields are empty", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondentWithSavedQuestions);
    vi.mocked(researchApi.config).mockResolvedValueOnce({
      ...config,
      screening: { fields: [] },
    });

    render(<RespondentDetailPage />);

    expect(await screen.findByRole("heading", { name: "Сохранённый текст вопроса" })).toBeInTheDocument();
    expect(screen.getByLabelText("Ответ G01")).toHaveValue("Ответ из старого интервью");
    expect(screen.getByLabelText("Ответ G02")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Изменить анкету" })).toBeDisabled();
    expect(screen.getByText("Актуальная конфигурация анкеты недоступна. Изменение ответов анкеты временно отключено.")).toBeInTheDocument();
  });
});
