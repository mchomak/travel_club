import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResearchApiError, researchApi } from "@/lib/research";
import { AnswerCard } from "./answer-card";
import styles from "./research.module.css";

describe("AnswerCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: true });
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
    await waitFor(() => expect(saveAnswer).toHaveBeenCalledWith("interview-1", "G01", "Путешествовали по Италии.", 0, true));
    expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();

    confirmSave({ answer_text: "Путешествовали по Италии.", revision: 1, updated_at: "2026-10-19T00:00:00Z" });
    expect(await screen.findByText("Сохранено")).toBeInTheDocument();
  });

  it("does not claim an offline draft was saved when browser storage rejects it", async () => {
    Object.defineProperty(window.navigator, "onLine", { configurable: true, value: false });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Storage full", "QuotaExceededError"); });
    vi.spyOn(researchApi, "saveAnswer").mockRejectedValue(new Error("should stay offline"));

    render(<AnswerCard interviewId="interview-storage-failure" question={{
      code: "G01", section: "general", text: "Расскажите о последнем путешествии.", type: "long_text",
      options: [], follow_ups: [], hypothesis_ids: [], interpretation: "", answer_guidance: "", bank_version: "1.0",
    }} initialAnswer={null} />);

    const answer = screen.getByLabelText("Ответ G01");
    fireEvent.change(answer, { target: { value: "Пока в памяти вкладки." } });
    expect(await screen.findByText("Нет связи · черновик недоступен")).toBeInTheDocument();
    expect(answer).toHaveValue("Пока в памяти вкладки.");
    expect(screen.queryByText("Нет связи · черновик сохранён")).not.toBeInTheDocument();
  });

  it("updates the parent progress when the interviewer chooses the server version", async () => {
    vi.spyOn(researchApi, "saveAnswer").mockRejectedValue(new ResearchApiError(409, "Changed elsewhere", "REVISION_CONFLICT", {
      current: { answer_text: "", revision: 2, updated_at: "2026-10-19T00:00:00Z" },
    }));
    function ProgressHarness() {
      const [answer, setAnswer] = useState("");
      return <>
        <p>{`Заполнено ${answer.trim() ? 1 : 0} из 1`}</p>
        <AnswerCard interviewId="interview-conflict" question={{
          code: "G01", section: "general", text: "Расскажите о последнем путешествии.", type: "long_text",
          options: [], follow_ups: [], hypothesis_ids: [], interpretation: "", answer_guidance: "", bank_version: "1.0",
        }} initialAnswer={null} onAnswerChange={(_, value) => setAnswer(value)} />
      </>;
    }

    render(<ProgressHarness />);
    fireEvent.change(screen.getByLabelText("Ответ G01"), { target: { value: "Локальный ответ" } });
    await screen.findByText("Конфликт версий");
    fireEvent.click(screen.getByRole("button", { name: "Взять серверную версию" }));

    expect(screen.getByLabelText("Ответ G01")).toHaveValue("");
    await waitFor(() => expect(screen.getByText("Заполнено 0 из 1")).toBeInTheDocument());
  });

  it("grows on input up to its maximum and scrolls beyond it", () => {
    vi.spyOn(researchApi, "saveAnswer").mockReturnValue(new Promise(() => undefined));

    render(<AnswerCard interviewId="interview-resize" question={{
      code: "G01", section: "general", text: "Расскажите о последнем путешествии.", type: "long_text",
      options: [], follow_ups: [], hypothesis_ids: [], interpretation: "", answer_guidance: "", bank_version: "1.0",
    }} initialAnswer={null} />);

    const answer = screen.getByLabelText("Ответ G01");
    let contentHeight = 212;
    Object.defineProperty(answer, "scrollHeight", { configurable: true, get: () => contentHeight });
    fireEvent.input(answer, { target: { value: "Несколько строк текста" } });

    expect(answer).toHaveStyle({ height: "212px", overflowY: "hidden" });

    contentHeight = 520;
    fireEvent.input(answer, { target: { value: "Очень длинный ответ" } });
    expect(answer).toHaveStyle({ height: "440px", overflowY: "auto" });

    contentHeight = 206;
    fireEvent(window, new Event("resize"));
    expect(answer).toHaveStyle({ height: "206px", overflowY: "hidden" });
  });

  it("keeps historical version answers read-only without autosaving them", () => {
    const saveAnswer = vi.spyOn(researchApi, "saveAnswer").mockReturnValue(new Promise(() => undefined));

    render(<AnswerCard interviewId="interview-history" question={{
      code: "G01", section: "general", text: "Расскажите о последнем путешествии.", type: "long_text",
      options: [], follow_ups: [], hypothesis_ids: [], interpretation: "", answer_guidance: "", bank_version: "1.0",
    }} initialAnswer={{ answer_text: "Ответ из старой версии", revision: 1, updated_at: "2026-10-20T10:00:00Z" }} saveMode="readonly" />);

    const answer = screen.getByLabelText("Ответ G01");
    expect(answer).toHaveValue("Ответ из старой версии");
    expect(answer).toHaveAttribute("readonly");
    fireEvent.change(answer, { target: { value: "Не должно измениться" } });
    expect(answer).toHaveValue("Ответ из старой версии");
    expect(saveAnswer).not.toHaveBeenCalled();
  });

  it("keeps interviewer hints in a single-line, keyboard-operable disclosure", async () => {
    render(<AnswerCard interviewId="interview-hints" question={{
      code: "G01", section: "general", text: "Расскажите о последнем путешествии.", type: "long_text",
      options: [], follow_ups: [], hypothesis_ids: [], interpretation: "", answer_guidance: "Длинная подсказка интервьюеру.", bank_version: "1.0",
    }} initialAnswer={null} />);

    const heading = screen.getByText("Подсказки интервьюеру");
    expect(heading).toHaveClass(styles.singleLineSummary);
    const disclosure = heading.closest("details");
    const summary = heading.closest("summary");
    expect(summary).toHaveAccessibleName("Подсказки интервьюеру");
    expect(summary?.tagName).toBe("SUMMARY");
    expect(disclosure).not.toHaveAttribute("open");
    summary?.focus();
    expect(document.activeElement).toBe(summary);
    await userEvent.setup().click(summary!);
    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByText("Длинная подсказка интервьюеру.")).toBeVisible();
  });
});
