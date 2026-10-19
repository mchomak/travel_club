import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ResearchConfig, ResearchInterview, ResearchRespondent } from "@/lib/research";
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
