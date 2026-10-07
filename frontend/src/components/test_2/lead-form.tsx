"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { products, type ProductId } from "./data";
import { FormatMotif } from "./format-motif";
import { submitDemoLead, validateLead, type LeadErrors, type LeadResult, type SubmitLead } from "../test/lead";
import s from "./editorial.module.css";

export function LeadForm({ product, onProductChange, submitLead = submitDemoLead }: {
  product: ProductId; onProductChange: (product: ProductId) => void; submitLead?: SubmitLead;
}) {
  const [fields, setFields] = useState({ destination: "", when: "", contact: "" });
  const [errors, setErrors] = useState<LeadErrors>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [failure, setFailure] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (result) successRef.current?.focus(); }, [result]);

  function update(key: keyof typeof fields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const lead = { product, destination: fields.destination.trim(), when: fields.when.trim(), contact: fields.contact.trim() };
    const nextErrors = validateLead(lead);
    if (nextErrors.contact) nextErrors.contact = lead.contact
      ? "Проверьте контакт: имя в телеграме, номер телефона или электронную почту."
      : "Оставьте телеграм, телефон или электронную почту.";
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) {
      const field = Object.keys(nextErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      return;
    }
    setPending(true);
    try { setResult(await submitLead(lead)); }
    catch { setFailure("Не получилось отправить. Ваши поля сохранены — попробуйте ещё раз."); }
    finally { setPending(false); }
  }

  return <section className={s.lead} id="story" aria-labelledby="lead-heading">
    <div className={s.leadIntro}>
      <span className={s.meta}>НАЧНИТЕ СВОЮ ИСТОРИЮ</span>
      <h2 id="lead-heading">Начнём<br /><span>с разговора.</span></h2>
      <p>Можно без точного плана.<br />Достаточно желания куда-то поехать.</p>
      <span className={s.leadNumber} aria-hidden="true">↗</span>
    </div>
    {result ? <div className={s.success} role="status">
      <span className={s.meta}>{result.kind === "demo" ? "ДЕМОНСТРАЦИЯ ФОРМЫ" : "НАЧАЛО ВАШЕЙ ИСТОРИИ"}</span>
      <h3 ref={successRef} tabIndex={-1}>{result.kind === "demo" ? "Так начнётся наша история." : "Разговор скоро начнётся."}</h3>
      <p>{result.kind === "demo" ? "Это демонстрация формы. Данные не отправлены и нигде не сохранены. В рабочей версии здесь начнётся разговор с редакцией Travel Club." : "Заявка отправлена. Свяжемся с вами по указанному контакту."}</p>
      <button type="button" className={s.lightButton} onClick={() => {
        setResult(null); setFields({ destination: "", when: "", contact: "" });
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input[name="product"]')?.focus());
      }}>Попробовать ещё раз <span aria-hidden="true">↗</span></button>
    </div> : <form ref={formRef} onSubmit={submit} noValidate className={s.leadForm} aria-busy={pending}>
      <fieldset className={s.formatPicker} disabled={pending}>
        <legend>Что нужно?</legend>
        <div className={s.formatOptions}>{products.map((item) => <label key={item.id} data-format={item.id} className={`${s[`format${item.id[0].toUpperCase()}${item.id.slice(1)}`]} ${product === item.id ? s.selectedFormat : ""}`}>
          <input type="radio" name="product" value={item.id} checked={product === item.id} onChange={() => onProductChange(item.id)} />
          <FormatMotif id={item.id} /><span>{item.formLabel}</span><span aria-hidden="true">{product === item.id ? "↗" : "+"}</span>
        </label>)}</div>
      </fieldset>
      <div className={s.formFields}>
        <label><span>Куда?</span><input name="destination" placeholder="Страна, город или «не знаю»" value={fields.destination} onChange={(event) => update("destination", event.target.value)} disabled={pending} aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "destination-error" : undefined} maxLength={100} />{errors.destination && <span id="destination-error" className={s.fieldError}>{errors.destination}</span>}</label>
        <label><span>Когда?</span><input name="when" placeholder="Даты, сезон или «пока не решил»" value={fields.when} onChange={(event) => update("when", event.target.value)} disabled={pending} aria-invalid={Boolean(errors.when)} aria-describedby={errors.when ? "when-error" : undefined} maxLength={100} />{errors.when && <span id="when-error" className={s.fieldError}>{errors.when}</span>}</label>
        <label className={s.contactField}><span>Ваш контакт <span className={s.requiredText}>— обязательно</span></span><input name="contact" placeholder="@имя в телеграме, телефон или почта" autoComplete="off" autoCapitalize="none" spellCheck={false} value={fields.contact} onChange={(event) => update("contact", event.target.value)} disabled={pending} required aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? "contact-error" : "demo-note"} maxLength={100} />{errors.contact && <span id="contact-error" className={s.fieldError} role="alert">{errors.contact}</span>}</label>
      </div>
      {failure && <p className={s.fieldError} role="alert">{failure}</p>}
      <div className={s.formBottom}>
        <p id="demo-note">Тестовая версия: данные<br />не отправляются и не сохраняются.</p>
        <button type="submit" className={s.lightButton} disabled={pending}>{pending ? "Обрабатываем…" : "Обсудить поездку"}<span aria-hidden="true">↗</span></button>
      </div>
    </form>}
  </section>;
}
