import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./image-editor", () => ({ useImageEditor: () => ({ photos: {}, openMenu: vi.fn() }) }));
import { FieldNotesCarousel } from "./field-notes-carousel";

afterEach(cleanup);

describe("Field Notes carousels", () => {
  it("navigates chapters independently and stops at either end", () => {
    render(<><FieldNotesCarousel country={0} /><FieldNotesCarousel country={1} /></>);
    const china = screen.getByRole("region", { name: /China ’25/i });
    expect(within(china).getByRole("navigation", { name: /CHINA/i }).querySelectorAll("button")).toHaveLength(6);
    const thailand = screen.getByRole("region", { name: /Thailand ’26/i });
    expect(within(china).getByRole("button", { name: /назад/i })).toBeDisabled();
    fireEvent.click(within(china).getByRole("button", { name: /вперёд/i }));
    expect(within(china).getByText("02 / 06")).toBeInTheDocument();
    expect(within(thailand).getByText("01 / 07")).toBeInTheDocument();
    fireEvent.click(within(within(china).getByRole("navigation", { name: /CHINA/i })).getByRole("button", { name: /Санья/i }));
    expect(within(china).getByText("06 / 06")).toBeInTheDocument();
    fireEvent.keyDown(china, { key: "ArrowLeft" });
    expect(within(china).getByText("05 / 06")).toBeInTheDocument();
    fireEvent.keyDown(china, { key: "ArrowRight" });
    expect(within(china).getByRole("button", { name: /вперёд/i })).toBeDisabled();
  });
});


it("offers six chapter indicators for China", () => {
  render(<FieldNotesCarousel country={0} />);
  const china = screen.getByRole("region", { name: /China ’25/i });
  const indicators = within(china).getByRole("navigation", { name: /выбрать главу/i });
  expect(within(indicators).getAllByRole("button")).toHaveLength(6);
  expect(china.querySelectorAll('[data-position="after"][inert]')).toHaveLength(10);
  fireEvent.click(within(indicators).getByRole("button", { name: /санья/i }));
  expect(within(indicators).getByRole("button", { name: /санья/i })).toHaveAttribute("aria-current", "step");
});

it.each([[1, "thailand"], [2, "madagascar"]] as const)("links each redesigned trip to its full story", (country, slug) => {
  render(<FieldNotesCarousel country={country} />);
  expect(screen.getByRole("link", { name: /читать всю историю/i })).toHaveAttribute("href", `/stories/${slug}`);
  const navigation = screen.getByRole("navigation", { name: /главы/i });
  const chapters = within(navigation).getAllByRole("button");
  fireEvent.click(chapters[chapters.length - 1]);
  expect(chapters[chapters.length - 1]).toHaveAttribute("aria-current", "step");
  expect(screen.getByRole("button", { name: /вперёд/i })).toBeDisabled();
});

it("keeps focus on a photo control when an arrow key is pressed", () => {
  render(<FieldNotesCarousel country={1} />);
  const region = screen.getByRole("region", { name: /Thailand ’26/i });
  fireEvent.click(within(within(region).getByRole("navigation", { name: /главы/i })).getByRole("button", { name: /самуи/i }));
  const photoControl = within(region).getByRole("button", { name: /показать кнопку замены фото/i });
  photoControl.focus();
  fireEvent.keyDown(photoControl, { key: "ArrowRight" });
  expect(photoControl).toHaveFocus();
  expect(within(region).getByText("05 / 07")).toBeInTheDocument();
});

it.each([[1, "Thailand"], [2, "Madagascar"]] as const)("shows a different credited photo in every %s chapter", (country, name) => {
  render(<FieldNotesCarousel country={country} />);
  const region = screen.getByRole("region", { name: new RegExp(name, "i") });
  const chapters = within(within(region).getByRole("navigation", { name: /главы/i })).getAllByRole("button");
  const sources = chapters.map((button) => {
    fireEvent.click(button);
    expect(within(region).getByRole("link", { name: /лицензия/i })).toBeInTheDocument();
    return within(region).getByRole("img").getAttribute("src");
  });
  expect(new Set(sources).size).toBe(chapters.length);
});
