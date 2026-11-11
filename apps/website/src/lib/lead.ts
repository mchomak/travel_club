import { isWebsiteProductId, type LeadSource, type WebsiteProductId } from "./products";

export const CONTACT_METHODS = ["telegram", "email", "instagram", "phone"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export type LeadSubmission = {
  product_id: WebsiteProductId;
  contact_method: ContactMethod;
  contact_value: string;
  name: string | null;
  message: string | null;
  source: LeadSource;
  consent: true;
  website_honeypot: string;
};

export type LeadErrors = Partial<Record<"product_id" | "contact_method" | "contact_value" | "name" | "message" | "consent", string>>;

export class LeadRequestError extends Error {
  constructor(message: string, readonly fieldErrors: LeadErrors = {}) {
    super(message);
    this.name = "LeadRequestError";
  }
}

const CONTACT_LIMIT = 254;
const NAME_LIMIT = 120;
const MESSAGE_LIMIT = 2000;
const characterCount = (value: string) => Array.from(value.normalize("NFC")).length;

export function normalizeContact(method: ContactMethod, input: string): string {
  const value = input.trim().normalize("NFC");
  if (method === "telegram") {
    const profile = value.match(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([a-z][a-z0-9_]{4,31})\/?$/iu);
    return `@${(profile?.[1] ?? value.replace(/^@/u, "")).toLowerCase()}`;
  }
  if (method === "instagram") {
    const profile = value.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-z0-9._]{1,30})\/?$/iu);
    return `@${profile?.[1] ?? value.replace(/^@/u, "")}`;
  }
  if (method === "email") {
    const at = value.lastIndexOf("@");
    return at < 0 ? value : `${value.slice(0, at)}@${value.slice(at + 1).toLowerCase()}`;
  }
  return value.replace(/[\s().-]/gu, "");
}

export function validateLeadSubmission(input: {
  productId: unknown;
  contactMethod: ContactMethod;
  contact: string;
  name: string;
  message: string;
  consent: boolean;
}): LeadErrors {
  const errors: LeadErrors = {};
  const contact = input.contact.trim();

  if (!isWebsiteProductId(input.productId)) errors.product_id = "Выберите формат из списка.";
  if (!contact) errors.contact_value = "Укажите контакт, по которому с вами можно связаться.";
  else if (characterCount(contact) > CONTACT_LIMIT) errors.contact_value = `Сократите контакт до ${CONTACT_LIMIT} символов.`;
  else if (input.contactMethod === "email" && (!/^[^\s@]+@[^\s@]+$/u.test(contact) || contact.indexOf("@") !== contact.lastIndexOf("@"))) {
    errors.contact_value = "Проверьте адрес электронной почты.";
  } else if (input.contactMethod === "telegram" && !(
    /^@?[a-z][a-z0-9_]{4,31}$/iu.test(contact)
    || /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/[a-z][a-z0-9_]{4,31}\/?$/iu.test(contact)
  )) {
    errors.contact_value = "Укажите Telegram username: от 5 до 32 букв, цифр или подчёркиваний.";
  } else if (input.contactMethod === "instagram" && !(
    /^@?[a-z0-9](?:[a-z0-9._]{0,28}[a-z0-9])?$/iu.test(contact)
    || /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-z0-9](?:[a-z0-9._]{0,28}[a-z0-9])?\/?$/iu.test(contact)
  )) {
    errors.contact_value = "Укажите username Instagram: до 30 букв, цифр, точек или подчёркиваний.";
  } else if (input.contactMethod === "phone") {
    const digits = contact.replace(/\D/gu, "");
    if (!/^\+[1-9][\d\s().-]*$/u.test(contact) || digits.length < 7 || digits.length > 16) {
      errors.contact_value = "Укажите международный номер телефона с кодом страны.";
    }
  }

  if (characterCount(input.name.trim()) > NAME_LIMIT) errors.name = `Сократите имя до ${NAME_LIMIT} символов.`;
  if (characterCount(input.message.trim()) > MESSAGE_LIMIT) errors.message = `Сократите комментарий до ${MESSAGE_LIMIT} символов.`;
  if (!input.consent) errors.consent = "Подтвердите согласие на обработку персональных данных.";
  return errors;
}

export type CreatedLead = { lead_number: string; receipt_token: string };

function validationInstruction(field: keyof LeadErrors, method: ContactMethod): string {
  if (field === "contact_method") return "Выберите удобный способ связи из списка.";
  if (field === "contact_value") {
    return {
      email: "Проверьте email: после @ укажите корректный домен, например name@example.com.",
      telegram: "Проверьте Telegram username или ссылку на профиль.",
      instagram: "Проверьте username Instagram или ссылку на профиль.",
      phone: "Проверьте номер: нужен действующий международный номер с кодом страны.",
    }[method];
  }
  if (field === "name") return "Проверьте имя или оставьте это поле пустым.";
  if (field === "message") return "Уберите из комментария непечатаемые символы или очистите поле.";
  if (field === "product_id") return "Выберите формат поездки из списка.";
  return "Подтвердите согласие на обработку персональных данных.";
}

function validationFields(payload: unknown, method: ContactMethod): LeadErrors {
  if (!payload || typeof payload !== "object") return {};
  const result: LeadErrors = {};
  const details = (payload as { details?: unknown }).details;
  if (Array.isArray(details)) {
    const knownFields = new Set<keyof LeadErrors>(["product_id", "contact_method", "contact_value", "name", "message", "consent"]);
    for (const detail of details) {
      if (!detail || typeof detail !== "object" || !("field" in detail)) continue;
      const fieldPath = (detail as { field: unknown }).field;
      if (typeof fieldPath !== "string") continue;
      if (fieldPath === "_form") continue;
      const field = fieldPath.replace(/^(?:body|request)\./u, "") as keyof LeadErrors;
      if (knownFields.has(field) && !result[field]) result[field] = validationInstruction(field, method);
    }
  }
  return result;
}

export async function createLead(submission: LeadSubmission, idempotencyKey: string): Promise<CreatedLead> {
  let response: Response;
  try {
    response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey, "X-Requested-With": "TravelClub" },
      body: JSON.stringify(submission),
      credentials: "same-origin",
    });
  } catch {
    throw new Error("Не удалось связаться с сервисом. Ваши ответы остались в форме — попробуйте ещё раз.");
  }

  if (!response.ok) {
    if (response.status === 429) throw new LeadRequestError("Слишком много попыток подряд. Подождите немного и попробуйте ещё раз.");
    if (response.status === 413) throw new LeadRequestError("Форма получилась слишком большой. Уменьшите комментарий и повторите отправку.");
    if (response.status >= 500) throw new LeadRequestError("Не удалось сохранить заявку. Ваши ответы остались в форме — попробуйте ещё раз.");
    if (response.status === 422) {
      let errorPayload: unknown;
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = null;
      }
      const fieldErrors = validationFields(errorPayload, submission.contact_method);
      throw new LeadRequestError(
        Object.keys(fieldErrors).length > 0
          ? "Исправьте поле, отмеченное ниже, и отправьте заявку ещё раз."
          : "Не удалось проверить заявку. Проверьте обязательные поля и попробуйте ещё раз.",
        fieldErrors,
      );
    }
    throw new LeadRequestError("Не удалось отправить заявку. Проверьте поля формы и попробуйте ещё раз.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Сервис вернул неполный ответ. Ответьте на форму ещё раз чуть позже.");
  }
  if (!payload || typeof payload !== "object" || !("lead_number" in payload) || !("receipt_token" in payload)) {
    throw new Error("Сервис вернул неполный ответ. Ответьте на форму ещё раз чуть позже.");
  }
  const result = payload as { lead_number: unknown; receipt_token: unknown };
  if (typeof result.lead_number !== "string" || typeof result.receipt_token !== "string") {
    throw new Error("Сервис вернул неполный ответ. Ответьте на форму ещё раз чуть позже.");
  }
  return { lead_number: result.lead_number, receipt_token: result.receipt_token };
}

export async function verifyLeadReceipt(token: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/leads/receipt?token=${encodeURIComponent(token)}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("lead_number" in payload)) return null;
    const leadNumber = (payload as { lead_number: unknown }).lead_number;
    return typeof leadNumber === "string" ? leadNumber : null;
  } catch {
    return null;
  }
}
