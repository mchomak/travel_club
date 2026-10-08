import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PlaygroundShell from "./playground-shell";

describe("design system playground controls", () => {
  it("keeps an invalid HEX draft out of the preview and applies valid color and type edits", async () => {
    const user = userEvent.setup();
    render(<PlaygroundShell />);

    const preview = screen.getByRole("region", { name: "Live preview" });
    expect(preview.style.getPropertyValue("--tc-color-editorial-paper")).toBe("#f3f2ee");

    const paperHex = screen.getByRole("textbox", { name: "Editorial paper HEX" });
    await user.clear(paperHex);
    await user.type(paperHex, "#12GG00");
    expect(preview.style.getPropertyValue("--tc-color-editorial-paper")).toBe("#f3f2ee");

    await user.clear(paperHex);
    await user.type(paperHex, "#aabbcc");
    expect(preview.style.getPropertyValue("--tc-color-editorial-paper")).toBe("#aabbcc");

    const displaySize = screen.getByRole("spinbutton", { name: "DISPLAY XL desktop size" });
    await user.clear(displaySize);
    await user.type(displaySize, "160");
    expect(preview.style.getPropertyValue("--tc-type-display-xl-desktop-size")).toBe("160");
    expect(preview.style.getPropertyValue("--tc-type-display-xl-desktop-resolved-size")).toBe("clamp(60px, 12.7cqw, 160px)");
    expect(screen.getByRole("slider", { name: "DISPLAY XL desktop size range" })).toHaveValue("160");

    const mobileSize = screen.getByRole("spinbutton", { name: "DISPLAY XL mobile size" });
    await user.clear(mobileSize);
    await user.type(mobileSize, "50");
    expect(preview.style.getPropertyValue("--tc-type-display-xl-mobile-size")).toBe("50");
    expect(preview.style.getPropertyValue("--tc-type-display-xl-mobile-resolved-size")).toBe("12.82051282051282cqw");
  });
});
