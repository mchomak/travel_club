"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CONTACT_METHODS, createLead, LeadRequestError, normalizeContact, validateLeadSubmission, type ContactMethod, type LeadErrors } from "../../lib/lead";
import { getAvailableWebsiteProducts, isWebsiteProductId, type LeadSource, type WebsiteProductId } from "../../lib/products";
import shared from "./publication.module.css";
import s from "./start-form.module.css";

const methods: { id: ContactMethod; label: string; placeholder: string; hint: string; type: "text" | "email" | "tel" }[] = [
  { id: "telegram", label: "Telegram", placeholder: "@username", hint: "Укажите username Telegram без ссылки на произвольный сайт.", type: "text" },
  { id: "email", label: "Email", placeholder: "name@example.com", hint: "Напишем на этот адрес, если вы выберете email.", type: "email" },
  { id: "instagram", label: "Instagram", placeholder: "username", hint: "Можно указать username без ссылки на профиль.", type: "text" },
  { id: "phone", label: "Телефон", placeholder: "+1 555 123 4567", hint: "Подойдёт международный номер с кодом страны.", type: "tel" },
];

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function StartForm({
  initialProduct,
  source,
}: {
  initialProduct?: WebsiteProductId;
  source: LeadSource;
}) {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyKey = useRef<string | null>(null);
  const [productId, setProductId] = useState<WebsiteProductId | "">(initialProduct ?? "");
  const [contactMethod, setContactMethod] = useState<ContactMethod | "">("");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<LeadErrors>({});
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearSubmissionState() {
    idempotencyKey.current = null;
    setSubmissionError("");
  }

  function setContactMethodValue(value: string) {
    clearSubmissionState();
    setContact("");
    setContactMethod(CONTACT_METHODS.includes(value as ContactMethod) ? (value as ContactMethod) : "");
    setErrors((previous) => ({ ...previous, contact_method: undefined, contact_value: undefined }));
  }

  function updateContact(value: string) {
    clearSubmissionState();
    setContact(value);
    setErrors((previous) => ({ ...previous, contact_value: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError("");
    const method = CONTACT_METHODS.includes(contactMethod as ContactMethod) ? (contactMethod as ContactMethod) : null;
    const nextErrors = validateLeadSubmission({
      productId,
      contactMethod: method ?? "telegram",
      contact,
      name,
      message,
      consent,
    });
    if (!method) nextErrors.contact_value = "Сначала выберите удобный способ связи.";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidId = nextErrors.product_id
        ? "lead-product"
        : nextErrors.contact_value
          ? method ? "lead-contact" : "lead-contact-method"
          : nextErrors.name
            ? "lead-name"
            : nextErrors.message
              ? "lead-message"
              : "lead-consent";
      formRef.current?.querySelector<HTMLElement>(`#${firstInvalidId}`)?.focus();
      return;
    }

    if (!isWebsiteProductId(productId) || !method) return;
    setIsSubmitting(true);
    try {
      const key = idempotencyKey.current ?? crypto.randomUUID();
      idempotencyKey.current = key;
      const created = await createLead({
        product_id: productId,
        contact_method: method,
        contact_value: normalizeContact(method, contact),
        name: name.trim() || null,
        message: message.trim() || null,
        source,
        consent: true,
        website_honeypot: honeypot,
      }, key);
      router.push(`/thanks?receipt=${encodeURIComponent(created.receipt_token)}`);
    } catch (error) {
      if (error instanceof LeadRequestError && Object.keys(error.fieldErrors).length > 0) {
        setErrors((previous) => ({ ...previous, ...error.fieldErrors }));
        setSubmissionError("");
        const firstError = (["product_id", "contact_method", "contact_value", "name", "message", "consent"] as const)
          .find((field) => error.fieldErrors[field]);
        const fieldIds = {
          product_id: "lead-product",
          contact_method: "lead-contact-method",
          contact_value: "lead-contact",
          name: "lead-name",
          message: "lead-message",
          consent: "lead-consent",
        } as const;
        if (firstError) formRef.current?.querySelector<HTMLElement>(`#${fieldIds[firstError]}`)?.focus();
      } else {
        setSubmissionError(error instanceof Error && error.message
          ? error.message
          : "Не удалось отправить заявку. Ваши ответы остались в форме — попробуйте ещё раз.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedMethod = methods.find(({ id }) => id === contactMethod);
  const productError = Boolean(errors.product_id);
  const methodError = Boolean(errors.contact_method || (errors.contact_value && !contactMethod));
  const contactError = Boolean(errors.contact_value && contactMethod);

  return <div className={s.layout}>
    <aside className={s.aside} aria-labelledby="start-note-heading">
      <span className={`${shared.meta} ${shared.accent}`}>ПЕРВЫЙ ШАГ / ЗНАКОМСТВО</span>
      <h2 id="start-note-heading" className={shared.h3}>Не обязательно знать всё заранее.</h2>
      <p className={shared.body}>Начать можно с интереса к поездке и удобного способа связи. Направление и даты обсудим позже.</p>
      <p className={`${shared.caption} ${shared.muted}`}>Выберите близкий формат или отметьте, что пока не определились.</p>
      <span className={`${shared.displayL} ${shared.accent} ${s.mark}`} aria-hidden="true">↗</span>
    </aside>

    <form ref={formRef} onSubmit={submit} noValidate aria-label="Заявка на поездку" className={s.form}>
      <section className={s.details} aria-labelledby="lead-details-heading">
        <h2 id="lead-details-heading" className={shared.meta}>01 / ФОРМАТ ПОЕЗДКИ</h2>
        <div className={`${shared.field} ${s.wide}`}>
          <label htmlFor="lead-product" className={shared.fieldLabel}>Что вам интересно?</label>
          <select
            id="lead-product"
            name="product_id"
            value={productId}
            required
            className={shared.control}
            aria-invalid={productError}
            aria-describedby={productError ? "lead-product-error" : undefined}
            onChange={(event) => {
              clearSubmissionState();
              setProductId(isWebsiteProductId(event.target.value) ? event.target.value : "");
              setErrors((previous) => ({ ...previous, product_id: undefined }));
            }}
          >
            <option value="">Выберите формат</option>
            {getAvailableWebsiteProducts().map((product) => (
              <option key={product.id} value={product.id}>{product.label}</option>
            ))}
          </select>
          {productError && <span id="lead-product-error" className={shared.fieldError} role="alert">{errors.product_id}</span>}
        </div>
      </section>

      <section className={s.details} aria-labelledby="contact-details-heading">
        <h2 id="contact-details-heading" className={shared.meta}>02 / КАК С ВАМИ СВЯЗАТЬСЯ</h2>
        <p className={`${shared.caption} ${shared.muted}`}>Оставьте один удобный контакт. Остальные поля можно пропустить.</p>
        <div className={s.fields}>
          <div className={shared.field}>
            <label htmlFor="lead-contact-method" className={shared.fieldLabel}>Предпочтительный способ связи</label>
            <select
              id="lead-contact-method"
              name="contact_method"
              value={contactMethod}
              required
              className={shared.control}
              aria-invalid={methodError}
              aria-describedby={methodError ? "lead-method-error" : undefined}
              onChange={(event) => setContactMethodValue(event.target.value)}
            >
              <option value="">Выберите способ связи</option>
              {methods.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
            {methodError && <span id="lead-method-error" className={shared.fieldError} role="alert">{errors.contact_method ?? errors.contact_value}</span>}
          </div>
          <div className={shared.field}>
            <label htmlFor="lead-contact" className={shared.fieldLabel}>Контакт</label>
            <input
              id="lead-contact"
              name="contact_value"
              value={contact}
              onChange={(event) => updateContact(event.target.value)}
              placeholder={selectedMethod?.placeholder ?? "Сначала выберите способ связи"}
              maxLength={508}
              className={shared.control}
              type={selectedMethod?.type ?? "text"}
              inputMode={contactMethod === "phone" ? "tel" : undefined}
              autoComplete={contactMethod === "email" ? "email" : contactMethod === "phone" ? "tel" : "off"}
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={!selectedMethod}
              aria-invalid={contactError}
              aria-describedby={contactError ? "lead-contact-error" : selectedMethod ? "lead-contact-hint" : undefined}
            />
            {selectedMethod && <span id="lead-contact-hint" className={shared.fieldHint}>{selectedMethod.hint}</span>}
            {contactError && <span id="lead-contact-error" className={shared.fieldError} role="alert">{errors.contact_value}</span>}
          </div>

          <div className={shared.field}>
            <label htmlFor="lead-name" className={shared.fieldLabel}>Как к вам обращаться? <span className={shared.muted}>Необязательно</span></label>
            <input id="lead-name" name="name" value={name} onChange={(event) => { clearSubmissionState(); setName(event.target.value); setErrors((previous) => ({ ...previous, name: undefined })); }} maxLength={240} className={shared.control} type="text" autoComplete="given-name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "lead-name-error" : undefined} />
            {errors.name && <span id="lead-name-error" className={shared.fieldError} role="alert">{errors.name}</span>}
          </div>

          <div className={`${shared.field} ${s.wide}`}>
            <label htmlFor="lead-message" className={shared.fieldLabel}>Пара слов о поездке <span className={shared.muted}>Необязательно</span></label>
            <textarea id="lead-message" name="message" value={message} onChange={(event) => { clearSubmissionState(); setMessage(event.target.value); setErrors((previous) => ({ ...previous, message: undefined })); }} maxLength={4000} rows={4} placeholder="Направление, идея или вопрос — если уже знаете" className={shared.control} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "lead-message-error" : undefined} />
            {errors.message && <span id="lead-message-error" className={shared.fieldError} role="alert">{errors.message}</span>}
          </div>
        </div>
      </section>

      <div className={s.consentBlock}>
        <div className={s.consentLabel}>
          <input
            id="lead-consent"
            type="checkbox"
            name="consent"
            required
            checked={consent}
            onChange={(event) => { clearSubmissionState(); setConsent(event.target.checked); setErrors((previous) => ({ ...previous, consent: undefined })); }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "lead-consent-error" : "lead-consent-note"}
          />
          <label htmlFor="lead-consent">Согласен(на) на обработку персональных данных, указанных в этой заявке.</label>
        </div>
        {errors.consent && <span id="lead-consent-error" className={shared.fieldError} role="alert">{errors.consent}</span>}
        <p id="lead-consent-note" className={`${shared.caption} ${shared.muted}`}>Документы: <a href="/personal-data">обработка персональных данных</a> и <a href="/privacy">конфиденциальность</a>. Не отправляйте в форме платёжные данные или документы.</p>
      </div>

      <label className={s.honeypot} aria-hidden="true" tabIndex={-1}>
        Оставьте это поле пустым
        <input name="website_honeypot" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </label>

      <div className={s.submit}>
        <div className={s.submitCopy}>
          <p id="lead-submit-note" className={`${shared.caption} ${shared.muted}`}>Заявка будет сохранена, и команда сможет связаться выбранным способом.</p>
          {submissionError && <p className={shared.fieldError} role="alert" aria-live="assertive">{submissionError}</p>}
        </div>
        <button type="submit" className={shared.buttonPrimary} aria-describedby="lead-submit-note" disabled={!hydrated || isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить заявку"}<span aria-hidden="true">↗</span>
        </button>
      </div>
      <noscript><p className={`${shared.caption} ${shared.fieldHint}`}>Чтобы отправить заявку, включите JavaScript. Сейчас данные не будут отправлены.</p></noscript>
    </form>
  </div>;
}
