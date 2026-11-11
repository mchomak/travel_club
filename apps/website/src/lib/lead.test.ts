import { afterEach, describe, expect, it, vi } from "vitest";
import { createLead, normalizeContact, validateLeadSubmission, verifyLeadReceipt, type LeadSubmission } from "./lead";
import { isWebsiteProductAvailable, isWebsiteProductId, WEBSITE_PRODUCTS, WEBSITE_PRODUCT_REGISTRY_VERSION } from "./products";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const validInput = {
  productId: "route",
  contactMethod: "email" as const,
  contact: "name+travel@пример.рф",
  name: "Алексей",
  message: "Хочу увидеть Японию весной ✈️",
  consent: true,
};

describe("Website lead data", () => {
  it("keeps supported product IDs centralized and ignores unknown or disabled options", () => {
    expect(WEBSITE_PRODUCT_REGISTRY_VERSION).toBe(1);
    expect(WEBSITE_PRODUCTS.map((product) => product.id)).toEqual(["route", "complete", "group", "moscow_guide", "undecided"]);
    expect(isWebsiteProductId("moscow_guide")).toBe(true);
    expect(isWebsiteProductId("Маршрут")).toBe(false);
    expect(isWebsiteProductId("tampered")).toBe(false);
    const route = WEBSITE_PRODUCTS.find((product) => product.id === "route");
    expect(route).toBeDefined();
    expect(isWebsiteProductAvailable("route", [{ ...route!, available: false }])).toBe(false);
  });

  it("accepts channel-specific contacts without assuming a Russian phone number", () => {
    expect(validateLeadSubmission({ ...validInput, contactMethod: "email", contact: "first.last+trip@sub.example.travel" })).toEqual({});
    expect(validateLeadSubmission({ ...validInput, contactMethod: "telegram", contact: "https://t.me/travel_friend" })).toEqual({});
    expect(validateLeadSubmission({ ...validInput, contactMethod: "instagram", contact: "instagram.com/travel.friend/" })).toEqual({});
    expect(validateLeadSubmission({ ...validInput, contactMethod: "phone", contact: "+1 (415) 555-2671" })).toEqual({});
  });

  it("normalizes contacts without changing their meaning", () => {
    expect(normalizeContact("email", " Person+trip@EXAMPLE.COM ")).toBe("Person+trip@example.com");
    expect(normalizeContact("telegram", "https://t.me/Travel_Friend")).toBe("@travel_friend");
    expect(normalizeContact("instagram", "instagram.com/travel.friend/")).toBe("@travel.friend");
    expect(normalizeContact("phone", "+1 (415) 555-2671")).toBe("+14155552671");
  });

  it("rejects missing, malformed, overly long and unapproved values", () => {
    expect(validateLeadSubmission({ ...validInput, productId: "forged" }).product_id).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, contact: "" }).contact_value).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, contactMethod: "email", contact: "a@@example.com" }).contact_value).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, contactMethod: "telegram", contact: "https://evil.example/@friend" }).contact_value).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, contactMethod: "instagram", contact: "javascript:alert(1)" }).contact_value).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, contactMethod: "phone", contact: "+7 900 123 45 67" }).contact_value).toBeFalsy();
    expect(validateLeadSubmission({ ...validInput, contact: "a".repeat(255) + "@example.com" }).contact_value).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, name: "a".repeat(121) }).name).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, message: "a".repeat(2001) }).message).toBeTruthy();
    expect(validateLeadSubmission({ ...validInput, consent: false }).consent).toBeTruthy();
  });

  it("returns only the receipt identity and never reads personal data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lead_number: "TC-000123" }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyLeadReceipt("signed token")).resolves.toBe("TC-000123");
    expect(fetchMock.mock.calls[0]?.[0]).toContain("token=signed%20token");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store", credentials: "same-origin" });
  });

  it("keeps an unavailable or expired receipt neutral", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(verifyLeadReceipt("expired")).resolves.toBeNull();
  });

  it("does not expose server details when saving fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const submission: LeadSubmission = {
      product_id: "route",
      contact_method: "email",
      contact_value: "person@example.com",
      name: null,
      message: null,
      source: "home",
      consent: true,
      telegram_details_consent_version: "telegram-details-v1",
      website_honeypot: "",
    };
    await expect(createLead(submission, "8f65fd78-0638-4087-8fd2-26b47102fdf8"))
      .rejects.toThrow("Не удалось сохранить заявку");
  });

  it("turns a generic server validation response into a channel-specific field instruction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        code: "VALIDATION_ERROR",
        message: "Проверьте поля формы и попробуйте ещё раз",
        details: [{ field: "contact_value", message: "Проверьте контактные данные" }],
      }),
    }));
    const submission: LeadSubmission = {
      product_id: "route",
      contact_method: "email",
      contact_value: "name@.domain",
      name: null,
      message: null,
      source: "home",
      consent: true,
      telegram_details_consent_version: "telegram-details-v1",
      website_honeypot: "",
    };
    await expect(createLead(submission, "8f65fd78-0638-4087-8fd2-26b47102fdf8"))
      .rejects.toMatchObject({
        message: "Исправьте поле, отмеченное ниже, и отправьте заявку ещё раз.",
        fieldErrors: { contact_value: "Проверьте email: после @ укажите корректный домен, например name@example.com." },
      });
  });

  it("keeps form-level server validation separate from the contact field", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        code: "VALIDATION_ERROR",
        message: "Проверьте поля формы и попробуйте ещё раз",
        details: [{ field: "_form", message: "Проверьте поля формы" }],
      }),
    }));
    const submission: LeadSubmission = {
      product_id: "route",
      contact_method: "email",
      contact_value: "person@example.com",
      name: null,
      message: null,
      source: "home",
      consent: true,
      telegram_details_consent_version: "telegram-details-v1",
      website_honeypot: "",
    };
    await expect(createLead(submission, "8f65fd78-0638-4087-8fd2-26b47102fdf8"))
      .rejects.toMatchObject({
        message: "Не удалось проверить заявку. Проверьте обязательные поля и попробуйте ещё раз.",
        fieldErrors: {},
      });
  });
});
