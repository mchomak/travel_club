export type ResearchCategory = "trips_experienced" | "trips_beginner" | "travel_design" | "travel_ready";
export type InterviewStatus = "draft" | "in_progress" | "completed";

export interface ScreeningOption { value: string; label: string }
export interface ScreeningField {
  key: string; label: string; control: "text" | "select" | "radio"; required?: boolean;
  options?: ScreeningOption[]; details_key?: string; details_label?: string;
}
export interface ResearchQuestion {
  code: string; section: string; text: string; type: string; options?: unknown[];
  follow_ups?: string[]; hypothesis_ids?: string[]; interpretation?: string;
  answer_guidance?: string; bank_version?: string;
}
export interface ResearchScenario { code: ResearchCategory; label: string; question_codes: string[] }
export interface ResearchConfig {
  bank: { bank_version: string; questions: ResearchQuestion[]; hypotheses: { code: string; text?: string; description?: string }[] };
  scenarios: { version: string; scenarios: ResearchScenario[]; optional_modules?: { brand?: { question_codes?: string[] }; offers?: { enabled: boolean; question_codes?: string[] } } };
  screening: { fields: ScreeningField[]; additional_fields?: ScreeningField[] };
  classification: { categories?: { code: ResearchCategory; label?: string }[] };
  validation_issues: string[];
  offers_enabled: boolean;
}
export interface Recommendation {
  suggested_category: ResearchCategory; alternative_category: ResearchCategory; scores: Record<ResearchCategory, number>;
  suggested_score: number; reasons: string[]; signal_strength: "low" | "medium" | "high";
}
export interface AnswerVersion { answer_text: string; revision: number; updated_at: string }
export interface ResearchInterview {
  id: string; respondent_id: string; scenario_code: ResearchCategory; scenario_version: string;
  bank_version: string; status: InterviewStatus; question_snapshot: ResearchQuestion[];
  started_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
  answers: Record<string, AnswerVersion | null>;
}
export interface ResearchRespondent {
  id: string; name: string; age_range: string | null; city: string; screening_answers: Record<string, unknown>;
  research_goal: "trips" | "individual_services" | null; suggested_category: ResearchCategory; final_category: ResearchCategory;
  category_override: boolean; recommendation: Recommendation; created_at: string; updated_at: string;
  interviews: ResearchInterview[];
}
export interface RespondentSummary {
  id: string; name: string; age_range: string | null; city: string; suggested_category: ResearchCategory;
  final_category: ResearchCategory; category_override: boolean; status: InterviewStatus; created_at: string; updated_at: string;
}
export interface RespondentList {
  items: RespondentSummary[]; total: number; total_count: number; completed_count: number;
  incomplete_count: number; page: number; page_size: number; pages: number;
}
export interface AnswerDraft { answer_text: string; updated_at: string }

export class ResearchApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = "ResearchApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/research${path}`, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Requested-With": "TravelClub", ...options.headers },
    });
  } catch {
    throw new ResearchApiError(0, "Нет связи с сервером. Текст сохранён в черновике браузера.", "NETWORK_ERROR");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    const outer = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const detail = outer.detail && typeof outer.detail === "object" ? outer.detail as Record<string, unknown> : outer;
    throw new ResearchApiError(
      response.status,
      typeof detail.message === "string" ? detail.message : "Не удалось выполнить действие. Попробуйте ещё раз.",
      typeof detail.code === "string" ? detail.code : undefined,
      detail,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const researchApi = {
  config: () => request<ResearchConfig>("/config"),
  respondents: (params: URLSearchParams) => request<RespondentList>(`/respondents?${params}`),
  createRespondent: (screening_answers: Record<string, unknown>, research_goal?: "trips" | "individual_services") =>
    request<ResearchRespondent>("/respondents", { method: "POST", body: JSON.stringify({ screening_answers, research_goal }) }),
  respondent: (id: string) => request<ResearchRespondent>(`/respondents/${encodeURIComponent(id)}`),
  updateScreening: (id: string, screening_answers: Record<string, unknown>, research_goal: ResearchRespondent["research_goal"], apply_suggestion: boolean) =>
    request<ResearchRespondent>(`/respondents/${encodeURIComponent(id)}/screening`, { method: "PATCH", body: JSON.stringify({ screening_answers, research_goal, apply_suggestion }) }),
  updateCategory: (id: string, final_category: ResearchCategory) =>
    request<ResearchRespondent>(`/respondents/${encodeURIComponent(id)}/category`, { method: "PATCH", body: JSON.stringify({ final_category }) }),
  startInterview: (id: string) => request<ResearchInterview>(`/interviews/${encodeURIComponent(id)}/start`, { method: "POST" }),
  appendQuestions: (id: string, question_codes: string[]) =>
    request<ResearchInterview>(`/interviews/${encodeURIComponent(id)}/questions`, { method: "POST", body: JSON.stringify({ question_codes }) }),
  saveAnswer: (interviewId: string, code: string, answer_text: string, expected_revision: number) =>
    request<AnswerVersion>(`/interviews/${encodeURIComponent(interviewId)}/answers/${encodeURIComponent(code)}`, {
      method: "PUT", body: JSON.stringify({ answer_text, expected_revision }),
    }),
  completeInterview: (id: string) => request<ResearchInterview>(`/interviews/${encodeURIComponent(id)}/complete`, { method: "POST" }),
  export: async () => {
    const response = await fetch("/api/research/export.xlsx", { credentials: "same-origin", cache: "no-store", headers: { "X-Requested-With": "TravelClub" } });
    if (!response.ok) throw new ResearchApiError(response.status, "Не удалось подготовить Excel-файл.");
    return response.blob();
  },
};

function draftKey(interviewId: string, questionCode: string): string {
  return `tc-research:answer:${interviewId}:${questionCode}`;
}

export function readAnswerDraft(interviewId: string, questionCode: string): AnswerDraft | null {
  try {
    const value = window.localStorage.getItem(draftKey(interviewId, questionCode));
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<AnswerDraft>;
    return typeof parsed.answer_text === "string" && typeof parsed.updated_at === "string"
      ? { answer_text: parsed.answer_text, updated_at: parsed.updated_at }
      : null;
  } catch {
    return null;
  }
}

export function writeAnswerDraft(interviewId: string, questionCode: string, answer_text: string): void {
  try {
    window.localStorage.setItem(draftKey(interviewId, questionCode), JSON.stringify({ answer_text, updated_at: new Date().toISOString() }));
  } catch {
    // The controlled textarea still holds the text if browser storage is unavailable.
  }
}

export function clearAnswerDraft(interviewId: string, questionCode: string, savedText?: string): void {
  try {
    const current = readAnswerDraft(interviewId, questionCode);
    if (!current || savedText === undefined || current.answer_text === savedText) {
      window.localStorage.removeItem(draftKey(interviewId, questionCode));
    }
  } catch {
    // Browser storage cleanup is best effort; a later matching server load is authoritative.
  }
}

type AnswerFlusher = () => Promise<boolean>;
const answerFlushers = new Map<string, Set<AnswerFlusher>>();

export function registerAnswerFlusher(interviewId: string, flush: AnswerFlusher): () => void {
  const group = answerFlushers.get(interviewId) ?? new Set<AnswerFlusher>();
  group.add(flush);
  answerFlushers.set(interviewId, group);
  return () => {
    group.delete(flush);
    if (group.size === 0) answerFlushers.delete(interviewId);
  };
}

export async function flushPendingAnswers(interviewId: string): Promise<boolean> {
  const flushers = [...(answerFlushers.get(interviewId) ?? [])];
  const results = await Promise.all(flushers.map((flush) => flush()));
  return results.every(Boolean);
}
