import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PUBLIC_NAVIGATION_LINKS } from "./public-navigation";
import { SiteHeader } from "./site-header";

afterEach(cleanup);

describe("Public site header", () => {
  it("uses the shared destinations and the Travel Club home link", () => {
    render(<SiteHeader applyEditorialTokens />);

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-editorial-home", "website");
    const home = within(banner).getByRole("link", { name: "Travel Club — главная" });
    expect(home).toHaveAttribute("href", "/");

    const navigation = within(banner).getByRole("navigation", { name: "Основная навигация" });
    expect(within(navigation).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(
      PUBLIC_NAVIGATION_LINKS.map(link => link.href),
    );
  });

  it("keeps the language picker behavior without translating page content", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByText("RU", { selector: "summary" }));
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("link", { name: "Услуги" })).toHaveAttribute("href", "/formats");
    expect(screen.getByRole("link", { name: "О нас" })).toHaveAttribute("href", "/#point-of-view");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("EN", { selector: "summary" })).toHaveAttribute("aria-label", "Выбрать язык, сейчас: English");
  });
});
