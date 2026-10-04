import type { ProductId } from "./data";

export type Lead = { product: ProductId; destination: string; when: string; contact: string };
export type LeadErrors = Partial<Record<keyof Lead, string>>;
export type LeadResult = { kind: "demo" | "sent" };
export type SubmitLead = (lead: Lead) => Promise<LeadResult>;

export function validateLead(lead: Lead): LeadErrors {
  const errors: LeadErrors = {};
  if (!["plan", "turnkey", "group"].includes(lead.product)) errors.product = "Выберите формат поездки.";
  const contact = lead.contact.trim();
  const email = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u.test(contact);
  const telegram = /^(?:@|(?:https?:\/\/)?t\.me\/)[a-z][a-z0-9_]{4,31}\/?$/i.test(contact);
  const digits = contact.replace(/\D/g, "");
  const phone = /^[+\d\s().-]+$/.test(contact) && digits.length >= 7 && digits.length <= 15;
  if (!contact) errors.contact = "Оставьте Telegram, телефон или email.";
  else if (!email && !telegram && !phone) errors.contact = "Проверьте контакт: @username, номер телефона или email.";
  if (lead.destination.trim().length > 100) errors.destination = "Укажите направление короче — до 100 символов.";
  if (lead.when.trim().length > 100) errors.when = "Укажите даты короче — до 100 символов.";
  return errors;
}

// Replace this adapter with the API call when the real request endpoint exists.
// The design route neither transmits nor stores personal information.
export const submitDemoLead: SubmitLead = async () => ({ kind: "demo" });
