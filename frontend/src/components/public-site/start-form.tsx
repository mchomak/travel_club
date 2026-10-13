"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validateLead } from "../test/lead";
import shared from "./publication.module.css";
import s from "./start-form.module.css";

export type StartFormat = "route" | "complete" | "group";
const formats = [
  { id: "route", product: "plan", label: "Маршрут", note: "Программа для самостоятельной поездки" },
  { id: "complete", product: "turnkey", label: "Под ключ", note: "Подготовка и координация поездки" },
  { id: "group", product: "group", label: "В компании", note: "Общий маршрут и сопровождающий" },
] as const;
const initialFields = { destination: "", when: "", participants: "", budget: "", comment: "", contact: "" };
type FieldName = keyof typeof initialFields;
type FormErrors = Partial<Record<FieldName, string>>;
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const fields: { name: FieldName; label: string; placeholder: string; limit: number; multiline?: boolean }[] = [
  { name: "destination", label: "Куда хотите поехать?", placeholder: "Страна, город или «пока не знаю»", limit: 100 },
  { name: "when", label: "Когда?", placeholder: "Даты, сезон или «пока не решил»", limit: 100 },
  { name: "participants", label: "Количество человек", placeholder: "Например, 4", limit: 9 },
  { name: "budget", label: "Ориентировочный бюджет", placeholder: "Сумма и валюта, если уже знаете", limit: 100 },
  { name: "comment", label: "Комментарий / пожелания", placeholder: "Что хочется увидеть, попробовать или почувствовать?", limit: 2000, multiline: true },
  { name: "contact", label: "Ваш контакт — обязательно", placeholder: "@username, телефон или email", limit: 100 },
];

export function StartForm({ initialFormat = "route" }: { initialFormat?: StartFormat }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [format, setFormat] = useState<StartFormat>(initialFormat);
  const [values, setValues] = useState(initialFields);
  const [errors, setErrors] = useState<FormErrors>({});

  function update(name: FieldName, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated) return;
    const product = formats.find((item) => item.id === format)!.product;
    const leadErrors = validateLead({ product, destination: values.destination, when: values.when, contact: values.contact });
    const nextErrors: FormErrors = {};
    if (leadErrors.destination) nextErrors.destination = leadErrors.destination;
    if (leadErrors.when) nextErrors.when = leadErrors.when;
    const participants = values.participants.trim();
    if (participants && (!/^\d+$/u.test(participants) || !Number.isSafeInteger(Number(participants)) || Number(participants) <= 0)) {
      nextErrors.participants = "Укажите положительное целое число людей или оставьте поле пустым.";
    }
    if (leadErrors.contact) nextErrors.contact = leadErrors.contact;
    for (const field of fields) {
      if (values[field.name].trim().length > field.limit && !nextErrors[field.name]) {
        nextErrors[field.name] = `Сократите ответ — до ${field.limit} символов.`;
      }
    }
    setErrors(nextErrors);
    const firstInvalid = fields.find(({ name }) => nextErrors[name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid.name}"]`)?.focus();
      return;
    }
    router.push("/thanks");
  }

  return <div className={s.layout}>
    <aside className={s.aside} aria-labelledby="start-note-heading">
      <span className={`${shared.meta} ${shared.accent}`}>ПЕРВЫЙ ШАГ / ЗНАКОМСТВО</span>
      <h2 id="start-note-heading" className={shared.h3}>Не обязательно знать всё заранее.</h2>
      <p className={shared.body}>Направление, даты и бюджет могут появиться позже. Начать можно с желания куда-то поехать.</p>
      <p className={`${shared.caption} ${shared.muted}`}>Выберите близкий формат. В рабочей версии эти ответы станут началом разговора о вашей поездке.</p>
      <span className={`${shared.displayL} ${shared.accent} ${s.mark}`} aria-hidden="true">↗</span>
    </aside>
    <form ref={formRef} onSubmit={submit} noValidate aria-label="Начать историю" className={s.form}>
      <fieldset className={s.formats}>
        <legend className={`${shared.meta} ${s.legend}`}>01 / ВЫБЕРИТЕ ФОРМАТ</legend>
        <div className={s.formatOptions}>{formats.map((item) => <label key={item.id} className={s.formatOption}>
          <input type="radio" name="format" value={item.id} checked={format === item.id} onChange={() => setFormat(item.id)} />
          <span className={s.formatCopy}><span className={shared.h3}>{item.label}</span><span className={`${shared.caption} ${shared.muted}`}>{item.note}</span></span>
        </label>)}</div>
      </fieldset>
      <section className={s.details} aria-labelledby="trip-details-heading">
        <h2 id="trip-details-heading" className={shared.meta}>02 / ВАША ПОЕЗДКА</h2>
        <p className={`${shared.caption} ${shared.muted}`}>Все поля, кроме контакта, можно оставить пустыми.</p>
        <div className={s.fields}>{fields.map((field) => {
          const invalid = Boolean(errors[field.name]);
          const id = `start-${field.name}`;
          const controlProps = {
            id, name: field.name, value: values[field.name], placeholder: field.placeholder,
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field.name, event.target.value),
            maxLength: field.limit, className: shared.control, "aria-invalid": invalid,
            "aria-describedby": invalid ? `${id}-error` : field.name === "contact" ? `${id}-hint` : undefined,
          };
          return <div className={`${shared.field} ${field.multiline || field.name === "contact" ? s.wide : ""}`} key={field.name}>
            <label htmlFor={id} className={shared.fieldLabel}>{field.label}</label>
            {field.multiline ? <textarea {...controlProps} rows={4} /> : <input {...controlProps} type="text" inputMode={field.name === "participants" ? "numeric" : undefined} required={field.name === "contact"} autoComplete="off" autoCapitalize={field.name === "contact" ? "none" : undefined} spellCheck={field.name !== "contact"} />}
            {field.name === "contact" && <span id={`${id}-hint`} className={shared.fieldHint}>Telegram, телефон или email — как вам удобнее.</span>}
            {invalid && <span id={`${id}-error`} className={shared.fieldError} role="alert">{errors[field.name]}</span>}
          </div>;
        })}</div>
      </section>
      <div className={s.submit}>
        <p id="start-demo-note" className={`${shared.caption} ${shared.muted}`}>Тестовая форма. Данные не отправляются и не сохраняются.</p>
        <noscript><p className={shared.fieldHint}>Чтобы продолжить, включите JavaScript. Эта тестовая форма не отправляет данные.</p></noscript>
        <button type="submit" className={shared.buttonPrimary} aria-describedby="start-demo-note" disabled={!hydrated}>Продолжить<span aria-hidden="true">↗</span></button>
      </div>
    </form>
  </div>;
}
