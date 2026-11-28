import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
const { openMenu } = vi.hoisted(() => ({ openMenu: vi.fn() }));
vi.mock("./image-editor", () => ({ useImageEditor: () => ({ photos: {}, openMenu }) }));
import { FieldNotesCarousel } from "./field-notes-carousel";

afterEach(() => {
  cleanup();
  openMenu.mockClear();
});

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


it.each([[0, 6], [1, 7], [2, 7]] as const)("keeps inactive chapter panels out of the reading order for trip %s", (country, chapterCount) => {
  render(<FieldNotesCarousel country={country} />);
  const region = screen.getByRole("region");
  const chapters = within(within(region).getByRole("navigation", { name: /главы/i })).getAllByRole("button");
  expect(chapters).toHaveLength(chapterCount);
  fireEvent.click(chapters[chapterCount - 1]);
  expect(chapters[chapterCount - 1]).toHaveAttribute("aria-current", "step");
  expect(region.querySelectorAll('[aria-hidden="true"][inert]')).toHaveLength((chapterCount - 1) * 2);
  expect(within(region).getAllByRole("heading", { level: 3 })).toHaveLength(1);
  expect(region.querySelectorAll("img")).toHaveLength(1);
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

it("supports arrow keys after tabbing to the chapter spread", async () => {
  const user = userEvent.setup();
  render(<FieldNotesCarousel country={0} />);
  const region = screen.getByRole("region");
  const spread = within(region).getByRole("group", { name: "Обложка" });
  const buttons = within(within(region).getByRole("navigation")).getAllByRole("button");
  buttons[buttons.length - 1].focus();
  await user.tab();
  expect(within(region).getByRole("button", { name: "Вперёд" })).toHaveFocus();
  await user.tab();
  expect(spread).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(within(region).getByRole("group", { name: "Внутренняя Монголия" })).toHaveFocus();
  expect(within(region).getByText("02 / 06")).toBeInTheDocument();
});

it("moves on a horizontal swipe and ignores vertical gestures", () => {
  render(<FieldNotesCarousel country={2} />);
  const region = screen.getByRole("region");
  const spread = within(region).getByRole("group", { name: "Обложка" });
  fireEvent.pointerDown(spread, { clientX: 150, clientY: 180 });
  fireEvent.pointerUp(spread, { clientX: 84, clientY: 102 });
  expect(within(region).getByText("01 / 07")).toBeInTheDocument();
  fireEvent.pointerDown(spread, { clientX: 150, clientY: 180 });
  fireEvent.pointerUp(spread, { clientX: 84, clientY: 168 });
  expect(within(region).getByText("02 / 07")).toBeInTheDocument();
});

it("opens the photo editor with the existing replacement slot and trigger", () => {
  render(<FieldNotesCarousel country={0} />);
  fireEvent.click(screen.getByRole("button", { name: "Показать кнопку замены фото" }));
  const edit = screen.getByRole("button", { name: "Заменить фото" });
  fireEvent.click(edit);
  expect(openMenu).toHaveBeenCalledWith("archive-china", 0, 0, edit);
});
