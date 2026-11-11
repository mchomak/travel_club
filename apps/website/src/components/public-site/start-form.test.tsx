import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartForm } from "./start-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("Start form", () => {
  it("starts without a product on the general CTA and accepts the full product list", async () => {
    render(<StartForm source="home" />);
    const product = screen.getByLabelText("Что вам интересно?");
    expect(product).toHaveValue("");
    expect(product.querySelectorAll("option")).toHaveLength(6);
    expect(screen.getByRole("option", { name: "Moscow Guide — Гид по Москве" })).toHaveValue("moscow_guide");
    expect(screen.getByRole("option", { name: "Пока не определился" })).toHaveValue("undecided");
  });

  it("keeps validation errors on the form and focuses the product selector first", async () => {
    const user = userEvent.setup();
    render(<StartForm source="home" />);
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));
    const product = screen.getByLabelText("Что вам интересно?");
    expect(product).toHaveFocus();
    expect(product).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Выберите формат из списка.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("clears a contact when the preferred channel changes", async () => {
    const user = userEvent.setup();
    render(<StartForm source="formats" initialProduct="route" />);
    await user.selectOptions(screen.getByLabelText("Предпочтительный способ связи"), "telegram");
    await user.type(screen.getByLabelText("Контакт"), "@friend_name");
    await user.selectOptions(screen.getByLabelText("Предпочтительный способ связи"), "email");
    expect(screen.getByLabelText("Контакт")).toHaveValue("");
    expect(screen.getByLabelText("Контакт")).toHaveAttribute("placeholder", "name@example.com");
  });

  it("submits a validated application and navigates only with the opaque receipt token", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ lead_number: "TC-000123", receipt_token: "opaque-signed-token" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<StartForm source="formats" initialProduct="route" />);

    await user.selectOptions(screen.getByLabelText("Предпочтительный способ связи"), "email");
    await user.type(screen.getByLabelText("Контакт"), "Person+trip@EXAMPLE.com");
    await user.type(screen.getByLabelText("Как к вам обращаться? Необязательно"), "Alex");
    await user.type(screen.getByLabelText("Пара слов о поездке Необязательно"), "<script>alert(1)</script> мечта о Японии");
    await user.click(screen.getByRole("checkbox", { name: /Согласен/ }));
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/thanks?receipt=opaque-signed-token"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/leads");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(new Headers(init.headers).get("X-Requested-With")).toBe("TravelClub");
    expect(new Headers(init.headers).get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/iu);
    expect(JSON.parse(String(init.body))).toEqual({
      product_id: "route",
      contact_method: "email",
      contact_value: "Person+trip@example.com",
      name: "Alex",
      message: "<script>alert(1)</script> мечта о Японии",
      source: "formats",
      consent: true,
      website_honeypot: "",
    });
  });

  it("keeps entered values and never shows success when the API cannot save", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network unavailable")));
    render(<StartForm source="home" initialProduct="undecided" />);
    await user.selectOptions(screen.getByLabelText("Предпочтительный способ связи"), "telegram");
    await user.type(screen.getByLabelText("Контакт"), "@traveler");
    await user.click(screen.getByRole("checkbox", { name: /Согласен/ }));
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ваши ответы остались в форме");
    expect(screen.getByLabelText("Контакт")).toHaveValue("@traveler");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows actionable server email validation and keeps the entered address", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        code: "VALIDATION_ERROR",
        message: "Проверьте поля формы и попробуйте ещё раз",
        details: [{ field: "contact_value", message: "Проверьте контактные данные" }],
      }),
    }));
    render(<StartForm source="home" initialProduct="route" />);
    const contact = screen.getByLabelText("Контакт");
    await user.selectOptions(screen.getByLabelText("Предпочтительный способ связи"), "email");
    await user.type(contact, "name@.domain");
    await user.click(screen.getByRole("checkbox", { name: /Согласен/ }));
    await user.click(screen.getByRole("button", { name: "Отправить заявку" }));

    expect(await screen.findByText("Проверьте email: после @ укажите корректный домен, например name@example.com.")).toBeInTheDocument();
    expect(contact).toHaveValue("name@.domain");
    expect(contact).toHaveFocus();
    expect(contact).toHaveAttribute("aria-invalid", "true");
    expect(contact).toHaveAccessibleDescription("Проверьте email: после @ укажите корректный домен, например name@example.com.");
    expect(push).not.toHaveBeenCalled();
  });
});
