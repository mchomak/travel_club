import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { researchApi } from "@/lib/research";
import { AnswerCard } from "./answer-card";

describe("AnswerCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("keeps a changed answer pending until PostgreSQL confirms it", async () => {
    let confirmSave!: (value: { answer_text: string; revision: number; updated_at: string }) => void;
    const saveAnswer = vi.spyOn(researchApi, "saveAnswer").mockReturnValue(new Promise((resolve) => { confirmSave = resolve; }));

    render(<AnswerCard interviewId="interview-1" question={{
      code: "G01",
      section: "general",
      text: "Расскажите о последнем путешествии.",
      type: "long_text",
      options: [],
      follow_ups: [],
      hypothesis_ids: ["H01"],
      interpretation: "",
      answer_guidance: "",
      bank_version: "1.0",
    }} initialAnswer={null} />);

    const answer = screen.getByLabelText("Ответ G01");
    fireEvent.change(answer, { target: { value: "Путешествовали по Италии." } });

    expect(screen.getByText(/Не сохранено|Сохраняется/)).toBeInTheDocument();
    await waitFor(() => expect(saveAnswer).toHaveBeenCalledWith("interview-1", "G01", "Путешествовали по Италии.", 0));
    expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();

    confirmSave({ answer_text: "Путешествовали по Италии.", revision: 1, updated_at: "2026-10-19T00:00:00Z" });
    expect(await screen.findByText("Сохранено")).toBeInTheDocument();
  });
});
