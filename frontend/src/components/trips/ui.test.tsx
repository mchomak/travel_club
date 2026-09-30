import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Modal } from "./ui";

afterEach(() => { cleanup(); vi.useRealTimers(); });

test.each(["overlay", "Escape", "close button"])("panel keeps content mounted during %s exit", method => {
  vi.useFakeTimers();
  const onClose = vi.fn();
  render(<Modal title="Редактирование" variant="panel" onClose={onClose}><p>Форма события</p></Modal>);
  if (method === "overlay") fireEvent.click(document.querySelector(".modal-overlay")!);
  if (method === "Escape") fireEvent.keyDown(document, { key: "Escape" });
  if (method === "close button") fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));

  expect(screen.getByText("Форма события")).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  expect(document.querySelector(".modal-panel")).toHaveAttribute("data-state", "closed");
  act(() => vi.advanceTimersByTime(240));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("controlled panel closes after exit and can reopen before the timer ends", () => {
  vi.useFakeTimers();
  const onClose = vi.fn();
  const view = (open: boolean) => <Modal title="Редактирование" variant="panel" open={open} onClose={onClose}><p>Форма события</p></Modal>;
  const { rerender } = render(view(true));
  rerender(view(false));
  expect(screen.getByText("Форма события")).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  rerender(view(true));
  act(() => vi.advanceTimersByTime(240));
  expect(onClose).not.toHaveBeenCalled();
  expect(document.querySelector(".modal-panel")).toHaveAttribute("data-state", "open");
  rerender(view(false));
  act(() => vi.advanceTimersByTime(240));
  expect(onClose).toHaveBeenCalledTimes(1);
});
