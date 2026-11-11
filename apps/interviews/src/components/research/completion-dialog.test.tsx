import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletionDialog } from "./completion-dialog";

function DialogHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>Open completion</button>
    {open && <CompletionDialog returnFocusRef={triggerRef} onClose={() => setOpen(false)} onConfirm={() => undefined} />}
  </>;
}

describe("CompletionDialog", () => {
  it("moves focus in, traps keyboard navigation, closes on Escape, and restores focus", () => {
    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "Open completion" });
    fireEvent.click(trigger);

    const cancel = screen.getByRole("button", { name: "Отмена" });
    const confirm = screen.getByRole("button", { name: "Да, завершить" });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(confirm, { key: "Tab" });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(cancel, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
