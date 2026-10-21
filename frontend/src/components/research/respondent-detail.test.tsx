import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ResearchConfig, ResearchInterview, ResearchInterviewVersion, ResearchInterviewVersions, ResearchQuestion, ResearchRespondent } from "@/lib/research";
import { researchApi } from "@/lib/research";
import { RespondentDetailPage } from "./respondent-detail";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "respondent-1" }), useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));

const readResearchData = <T,>(filename: string): T => JSON.parse(
  readFileSync(resolve(process.cwd(), `../backend/app/research_data/${filename}`), "utf8"),
) as T;
const config = {
  bank: readResearchData<ResearchConfig["bank"]>("questions.json"),
  scenarios: readResearchData<ResearchConfig["scenarios"]>("scenarios.json"),
  screening: readResearchData<ResearchConfig["screening"]>("screening.json"),
  classification: readResearchData<ResearchConfig["classification"]>("classification.json"),
  validation_issues: [],
  offers_enabled: false,
} satisfies ResearchConfig;
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

  it("blocks starting a draft interview when the loaded scenario list is empty", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondent);
    vi.mocked(researchApi.config).mockResolvedValueOnce({
      ...config,
      scenarios: { version: "2", scenarios: [] },
    });
    const startInterview = vi.spyOn(researchApi, "startInterview");

    render(<RespondentDetailPage />);

    expect(await screen.findByLabelText("Сценарий интервью")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сохранить выбор" })).toBeDisabled();
    expect(screen.getByText("Актуальный список сценариев недоступен. Сохранение нового выбора временно отключено.")).toBeInTheDocument();
    const startButton = screen.getByRole("button", { name: /Начать интервью/ });
    expect(startButton).toBeDisabled();
    expect(screen.getByText("Сначала загрузите корректный сценарий интервью, чтобы его начать.")).toBeInTheDocument();
    await userEvent.setup().click(startButton);
    expect(startInterview).not.toHaveBeenCalled();
  });

  it("blocks starting a draft interview when loading the current config fails", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondent);
    let rejectConfig!: (cause: Error) => void;
    const configRequest = new Promise<ResearchConfig>((_resolve, reject) => { rejectConfig = reject; });
    vi.mocked(researchApi.config).mockReturnValueOnce(configRequest);
    const startInterview = vi.spyOn(researchApi, "startInterview");

    render(<RespondentDetailPage />);

    await act(async () => {
      rejectConfig(new Error("Config unavailable"));
      await configRequest.catch(() => undefined);
    });
    const startButton = screen.getByRole("button", { name: /\u041d\u0430\u0447\u0430\u0442\u044c \u0438\u043d\u0442\u0435\u0440\u0432\u044c\u044e/ });
    expect(startButton).toBeDisabled();
    await userEvent.setup().click(startButton);
    expect(startInterview).not.toHaveBeenCalled();
  });

  it("blocks a locally selectable scenario when the loaded configuration has validation issues", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondent);
    vi.mocked(researchApi.config).mockResolvedValueOnce({
      ...config,
      bank: {
        ...config.bank,
        questions: [{ code: "G99", section: "G", text: "Вопрос из банка", type: "text" }],
      },
      scenarios: {
        version: "2",
        scenarios: [{ code: "trips_beginner", label: "Trips / Начинающий путешественник", question_codes: ["G99"] }],
      },
      validation_issues: ["missing scenarios: travel_design"],
    });
    const startInterview = vi.spyOn(researchApi, "startInterview");

    render(<RespondentDetailPage />);

    const startButton = await screen.findByRole("button", { name: /Начать интервью/ });
    expect(startButton).toBeDisabled();
    expect(screen.getByText("Текущая конфигурация вопросника неполная или содержит ошибки. Исправьте её, прежде чем начинать интервью.")).toBeInTheDocument();
    await userEvent.setup().click(startButton);
    expect(startInterview).not.toHaveBeenCalled();
  });

  it("starts a valid scenario with no preset questions", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondent);
    const emptyQuestionScenarioConfig: ResearchConfig = {
      ...config,
      scenarios: {
        ...config.scenarios,
        scenarios: config.scenarios.scenarios.map((scenario) => scenario.code === "trips_beginner"
          ? { ...scenario, question_codes: [] }
          : scenario),
      },
    };
    vi.mocked(researchApi.config).mockResolvedValueOnce(emptyQuestionScenarioConfig);
    const startInterview = vi.spyOn(researchApi, "startInterview").mockResolvedValueOnce({
      ...interview,
      status: "in_progress",
      question_snapshot: [],
    });

    render(<RespondentDetailPage />);

    const startButton = await screen.findByRole("button", { name: /Начать интервью/ });
    expect(startButton).toBeEnabled();
    await userEvent.setup().click(startButton);
    expect(startInterview).toHaveBeenCalledWith("interview-1");
    expect(await screen.findByText("Сценарий сохранён. Можно вести заметки по ходу разговора или внести их позже.")).toBeInTheDocument();
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

describe("Interview answer progress", () => {
  it("keeps trimmed progress after blur and a successful autosave clears the browser draft", async () => {
    vi.mocked(researchApi.respondent).mockResolvedValueOnce(respondentWithSavedQuestions);
    const saveAnswer = vi.spyOn(researchApi, "saveAnswer").mockImplementation(async (_interviewId, _code, answerText, revision) => ({
      answer_text: answerText, revision: revision + 1, updated_at: "2026-10-21T12:30:00Z",
    }));

    render(<RespondentDetailPage />);

    const progress = await screen.findByRole("progressbar", { name: "Заполнено вопросов" });
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    const answer = screen.getByLabelText("Ответ G02");
    fireEvent.change(answer, { target: { value: "  Новый ответ  " } });
    fireEvent.blur(answer);
    await waitFor(() => expect(saveAnswer).toHaveBeenCalledWith("interview-1", "G02", "  Новый ответ  ", 1, true));
    expect(progress).toHaveAttribute("aria-valuenow", "2");
    expect(localStorage.getItem("tc-research:answer:interview-1:G02")).toBeNull();

    fireEvent.change(answer, { target: { value: "   " } });
    fireEvent.blur(answer);
    await waitFor(() => expect(progress).toHaveAttribute("aria-valuenow", "1"));
    expect(saveAnswer).toHaveBeenLastCalledWith("interview-1", "G02", "   ", 2, true);
  });
});

describe("Completed interview versions", () => {
  it("opens the newest saved version by default with manual save controls", async () => {
    const completedInterview = {
      ...respondentWithSavedQuestions.interviews[0],
      status: "completed",
      completed_at: "2026-10-20T11:00:00Z",
    } as ResearchInterview;
    vi.mocked(researchApi.respondent).mockResolvedValueOnce({ ...respondentWithSavedQuestions, interviews: [completedInterview] });
    const versions = {
      items: [
        { id: "version-2", version_number: 2, created_at: "2026-10-21T12:30:00Z" },
        { id: "version-1", version_number: 1, created_at: "2026-10-20T11:00:00Z" },
      ],
      latest_version_number: 2,
    } satisfies ResearchInterviewVersions;
    vi.spyOn(researchApi, "interviewVersions").mockResolvedValueOnce(versions);
    const latest = {
      id: "version-2", interview_id: "interview-1", version_number: 2, created_at: "2026-10-21T12:30:00Z",
      snapshot: {
        respondent: {
          id: "respondent-1", name: "Алекс", age_range: "18_22", city: "Тверь", screening_answers: { city: "Тверь", age_range: "18_22" },
          research_goal: "trips", suggested_category: "trips_beginner", final_category: "trips_beginner", category_override: false,
        },
        interview: {
          id: "interview-1", status: "completed", scenario_code: "trips_beginner", scenario_version: "1",
          question_snapshot: savedQuestions,
          answers: { G01: { answer_text: "Последний сохранённый ответ", revision: 2, updated_at: "2026-10-21T12:30:00Z" }, G02: { answer_text: "", revision: 1, updated_at: "2026-10-20T11:00:00Z" } },
        },
      },
    } satisfies ResearchInterviewVersion;
    const readVersion = vi.spyOn(researchApi, "interviewVersion").mockResolvedValueOnce(latest);

    vi.mocked(researchApi.config).mockResolvedValueOnce({
      ...config,
      screening: { ...config.screening, fields: config.screening.fields.filter((field) => field.key !== "age_range") },
    });
    const { container } = render(<RespondentDetailPage />);

    const versionSelect = await screen.findByRole("combobox", { name: "Версия интервью" });
    expect(versionSelect).toHaveValue("version-2");
    expect(Array.from(versionSelect.querySelectorAll("option"), (option) => option.value)).toEqual(["version-2", "version-1"]);
    expect(screen.getByRole("heading", { name: "Алекс · Возраст: 18-22" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Ответ G01")).toHaveValue("Последний сохранённый ответ");
    const screeningAnswers = container.querySelector("details");
    if (!screeningAnswers) throw new Error("Screening answer details are missing.");
    const summary = screeningAnswers.querySelector("summary");
    if (!summary) throw new Error("Screening answer summary is missing.");
    fireEvent.click(summary);
    expect(within(screeningAnswers).getByText("18-22")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
    expect(readVersion).toHaveBeenCalledWith("interview-1", "version-2");
    await userEvent.setup().click(screen.getByRole("button", { name: "Закрыть" }));
    expect(push).toHaveBeenCalledWith("/research");
  });

  it("shows an earlier snapshot as read-only and keeps its profile values", async () => {
    const user = userEvent.setup();
    const completedInterview = {
      ...respondentWithSavedQuestions.interviews[0],
      status: "completed",
      completed_at: "2026-10-20T11:00:00Z",
    } as ResearchInterview;
    vi.mocked(researchApi.respondent).mockResolvedValueOnce({ ...respondentWithSavedQuestions, interviews: [completedInterview] });
    vi.spyOn(researchApi, "interviewVersions").mockResolvedValueOnce({
      items: [
        { id: "version-1", version_number: 1, created_at: "2026-10-20T11:00:00Z" },
        { id: "version-2", version_number: 2, created_at: "2026-10-21T12:30:00Z" },
      ], latest_version_number: 2,
    });
    const latest: ResearchInterviewVersion = {
      id: "version-2", interview_id: "interview-1", version_number: 2, created_at: "2026-10-21T12:30:00Z",
      snapshot: {
        respondent: { id: "respondent-1", name: "Алекс", age_range: "18_22", city: "Тверь", screening_answers: { city: "Тверь" }, research_goal: "trips", suggested_category: "trips_beginner", final_category: "trips_beginner", category_override: false },
        interview: { id: "interview-1", status: "completed", scenario_code: "trips_beginner", scenario_version: "1", question_snapshot: savedQuestions, answers: { G01: { answer_text: "Новый ответ", revision: 2, updated_at: "2026-10-21T12:30:00Z" }, G02: { answer_text: "", revision: 0, updated_at: null } } },
      },
    };
    const older: ResearchInterviewVersion = {
      ...latest,
      id: "version-1",
      version_number: 1,
      created_at: "2026-10-20T11:00:00Z",
      snapshot: {
        ...latest.snapshot,
        respondent: { ...latest.snapshot.respondent, city: "Старый город", screening_answers: { city: "Старый город" }, final_category: "travel_design", category_override: true },
        interview: { ...latest.snapshot.interview, answers: { G01: { answer_text: "Исторический ответ", revision: 1, updated_at: "2026-10-20T11:00:00Z" }, G02: { answer_text: "", revision: 0, updated_at: null } } },
      },
    };
    let resolveOlder!: (version: ResearchInterviewVersion) => void;
    vi.spyOn(researchApi, "interviewVersion").mockResolvedValueOnce(latest).mockReturnValueOnce(
      new Promise<ResearchInterviewVersion>((resolve) => { resolveOlder = resolve; }),
    );
    const saveAnswer = vi.spyOn(researchApi, "saveAnswer");

    render(<RespondentDetailPage />);

    const versionSelect = await screen.findByRole("combobox", { name: "Версия интервью" });
    await user.selectOptions(versionSelect, "version-1");

    const answer = await screen.findByLabelText("Ответ G01") as HTMLTextAreaElement;
    const latestAnswer = answer.value;
    expect(answer).toHaveAttribute("readonly");
    fireEvent.change(answer, { target: { value: "attempted edit during load" } });
    expect(answer).toHaveValue(latestAnswer);
    await act(async () => resolveOlder(older));
    const historicalAnswer = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
    await waitFor(() => expect(historicalAnswer).toHaveValue("Исторический ответ"));
    expect(historicalAnswer).toHaveAttribute("readonly");
    expect(screen.getAllByText("Старый город").length).toBeGreaterThan(0);
    expect(screen.getByText("Travel Design · выбрана вручную")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument();
    fireEvent.change(historicalAnswer, { target: { value: "Изменение запрещено" } });
    expect(historicalAnswer).toHaveValue("Исторический ответ");
    expect(saveAnswer).not.toHaveBeenCalled();
  });

  it("saves all answers as a new version once and updates the selected version", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const completedInterview = {
      ...respondentWithSavedQuestions.interviews[0], status: "completed", completed_at: "2026-10-20T11:00:00Z",
    } as ResearchInterview;
    vi.mocked(researchApi.respondent).mockResolvedValueOnce({ ...respondentWithSavedQuestions, interviews: [completedInterview] });
    vi.spyOn(researchApi, "interviewVersions").mockResolvedValueOnce({
      items: [{ id: "version-1", version_number: 1, created_at: "2026-10-20T11:00:00Z" }], latest_version_number: 1,
    });
    const versionOne: ResearchInterviewVersion = {
      id: "version-1", interview_id: "interview-1", version_number: 1, created_at: "2026-10-20T11:00:00Z",
      snapshot: {
        respondent: { id: "respondent-1", name: "Алекс", age_range: "18_22", city: "Тверь", screening_answers: { city: "Тверь" }, research_goal: "trips", suggested_category: "trips_beginner", final_category: "trips_beginner", category_override: false },
        interview: { id: "interview-1", status: "completed", scenario_code: "trips_beginner", scenario_version: "1", question_snapshot: savedQuestions, answers: { G01: { answer_text: "Первый ответ", revision: 1, updated_at: "2026-10-20T11:00:00Z" }, G02: { answer_text: "", revision: 1, updated_at: "2026-10-20T11:00:00Z" } } },
      },
    };
    const versionTwo: ResearchInterviewVersion = {
      ...versionOne,
      id: "version-2", version_number: 2, created_at: "2026-10-21T13:30:00Z",
      snapshot: { ...versionOne.snapshot, interview: { ...versionOne.snapshot.interview, answers: {
        G01: { answer_text: "Первый ответ", revision: 1, updated_at: "2026-10-20T11:00:00Z" },
        G02: { answer_text: "Новый ответ", revision: 2, updated_at: "2026-10-21T13:30:00Z" },
      } } },
    };
    vi.spyOn(researchApi, "interviewVersion").mockResolvedValueOnce(versionOne);
    let resolveCreation!: (version: ResearchInterviewVersion) => void;
    const createVersion = vi.spyOn(researchApi, "createInterviewVersion").mockReturnValueOnce(new Promise((resolve) => { resolveCreation = resolve; }));
    const saveAnswer = vi.spyOn(researchApi, "saveAnswer");

    render(<RespondentDetailPage />);

    const versionSelect = await screen.findByRole("combobox", { name: "Версия интервью" });
    fireEvent.change(screen.getByLabelText("Ответ G02"), { target: { value: "Новый ответ" } });
    expect(versionSelect).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(confirm).toHaveBeenCalledWith("Есть несохранённые изменения. Закрыть анкету без сохранения?");
    expect(push).not.toHaveBeenCalled();
    const saveButton = screen.getByRole("button", { name: "Сохранить" });
    await user.dblClick(saveButton);
    await waitFor(() => expect(createVersion).toHaveBeenCalledTimes(1));
    expect(createVersion).toHaveBeenCalledWith("interview-1", { G01: "Первый ответ", G02: "Новый ответ" });
    expect(saveAnswer).not.toHaveBeenCalled();

    await act(async () => resolveCreation(versionTwo));
    await screen.findByText(/Сохранена версия 2/);
    expect(versionSelect).toHaveValue("version-2");
    expect(Array.from(versionSelect.querySelectorAll("option"), (option) => option.value)).toEqual(["version-2", "version-1"]);
    expect(screen.getByText("Заполнено 2 из 2")).toBeInTheDocument();

    createVersion.mockRejectedValueOnce(new Error("Сервер временно недоступен. Повторите попытку."));
    fireEvent.change(screen.getByLabelText("Ответ G01"), { target: { value: "Текст останется на экране" } });
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Сервер временно недоступен. Повторите попытку.");
    expect(screen.getByLabelText("Ответ G01")).toHaveValue("Текст останется на экране");
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeEnabled();
  });
});
