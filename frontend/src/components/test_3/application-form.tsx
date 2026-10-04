"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { applicationChoices } from "./content";
import styles from "./application-form.module.css";

type Field = "name" | "age" | "telegram" | "origin" | "company" | "interests" | "pace" | "priority";
type Values = { name: string; age: string; telegram: string; origin: string; company: string; interests: string[]; pace: string; priority: string };
const emptyValues: Values = { name: "", age: "", telegram: "", origin: "", company: "", interests: [], pace: "", priority: "" };

function errorsFor(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = "Напиши имя: от 2 до 80 символов.";
  if (!/^\d+$/.test(values.age) || Number(values.age) < 1 || Number(values.age) > 120) errors.age = "Укажи возраст целым числом от 1 до 120.";
  const telegram = values.telegram.trim().replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, "").replace(/\/$/, "");
  if (!/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram)) errors.telegram = "Укажи @username (5–32 символа) или ссылку https://t.me/username.";
  if (values.origin.trim().length < 2 || values.origin.trim().length > 100) errors.origin = "Напиши город, из которого планируешь лететь.";
  if (!values.company) errors.company = "Выбери, едешь один или с кем-то.";
  if (!values.interests.length) errors.interests = "Выбери хотя бы один интерес.";
  if (!values.pace) errors.pace = "Выбери комфортный темп.";
  if (!values.priority) errors.priority = "Выбери, что для тебя важнее.";
  return errors;
}

export function ApplicationForm() {
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [complete, setComplete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const wasComplete = useRef(false);
  useEffect(() => {
    if (complete) successRef.current?.focus();
    else if (wasComplete.current) formRef.current?.querySelector<HTMLInputElement>("[name=name]")?.focus();
    wasComplete.current = complete;
  }, [complete]);

  function update(field: Exclude<Field, "interests">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleInterest(value: string) {
    setValues((current) => ({ ...current, interests: current.interests.includes(value)
      ? current.interests.filter((interest) => interest !== value)
      : value === "всё вместе" ? [value] : [...current.interests.filter((interest) => interest !== "всё вместе"), value] }));
    setErrors((current) => ({ ...current, interests: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = errorsFor(values);
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setComplete(true);
  }

  function textField(field: "name" | "age" | "telegram" | "origin", label: string, placeholder: string, extra: { autoComplete?: string; inputMode?: "numeric"; maxLength?: number } = {}) {
    return <div className={styles.field}>
      <label htmlFor={`shanghai-${field}`}>{label}</label>
      <input id={`shanghai-${field}`} name={field} value={values[field]} placeholder={placeholder} onChange={(event) => update(field, event.target.value)} aria-required="true" aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `shanghai-${field}-error` : undefined} {...extra} />
      {errors[field] && <span id={`shanghai-${field}-error`} className={styles.error}>{errors[field]}</span>}
    </div>;
  }

  function radioGroup(field: "company" | "pace" | "priority", legend: string, options: readonly string[]) {
    return <fieldset className={styles.choiceGroup} aria-describedby={errors[field] ? `shanghai-${field}-error` : undefined}>
      <legend>{legend}</legend>
      <div className={styles.choices}>
        {options.map((option) => <label className={styles.choice} key={option}>
          <input type="radio" name={field} value={option} checked={values[field] === option} onChange={() => update(field, option)} aria-required="true" aria-invalid={Boolean(errors[field])} />
          <span>{option}</span>
        </label>)}
      </div>
      {errors[field] && <span id={`shanghai-${field}-error`} className={styles.error}>{errors[field]}</span>}
    </fieldset>;
  }

  if (complete) return <div className={styles.success} role="status">
    <span className={styles.successMark} aria-hidden="true">↗</span>
    <p className={styles.meta}>DEMO / APPLICATION PREVIEW</p>
    <h3 ref={successRef} tabIndex={-1}>Твой интерес отмечен.</h3>
    <p>Это демо: заявка никуда не отправлена, данные не сохранены. Место в группе не забронировано.</p>
    <button type="button" className={styles.editButton} onClick={() => setComplete(false)}>Вернуться к заявке ↗</button>
  </div>;

  return <form ref={formRef} className={styles.form} aria-label="Заявка в Шанхай" noValidate onSubmit={submit}>
    <p className={styles.demo}>Демо-форма. Можно проверить заявку; данные никуда не отправляются и не сохраняются.</p>
    <div className={styles.fields}>
      {textField("name", "Имя", "Как тебя зовут?", { autoComplete: "given-name", maxLength: 80 })}
      {textField("age", "Возраст", "Полных лет", { inputMode: "numeric", maxLength: 3 })}
      {textField("telegram", "Telegram", "@username или t.me/username", { autoComplete: "off", maxLength: 80 })}
      {textField("origin", "Откуда летишь?", "Твой город", { autoComplete: "address-level2", maxLength: 100 })}
    </div>
    {radioGroup("company", "Едешь один / с кем-то", applicationChoices.company)}
    <fieldset className={styles.choiceGroup} aria-describedby={errors.interests ? "shanghai-interests-error" : "shanghai-interests-hint"}>
      <legend>Что тебе интереснее?</legend>
      <p className={styles.hint} id="shanghai-interests-hint">Можно выбрать несколько вариантов.</p>
      <div className={styles.choices}>
        {applicationChoices.interests.map((interest) => <label className={styles.choice} key={interest}>
          <input type="checkbox" name="interests" value={interest} checked={values.interests.includes(interest)} onChange={() => toggleInterest(interest)} aria-invalid={Boolean(errors.interests)} />
          <span>{interest}</span>
        </label>)}
      </div>
      {errors.interests && <span id="shanghai-interests-error" className={styles.error}>{errors.interests}</span>}
    </fieldset>
    {radioGroup("pace", "Твой идеальный темп?", applicationChoices.pace)}
    {radioGroup("priority", "Что важнее?", applicationChoices.priority)}
    <div className={styles.submitRow}>
      <p>Все поля обязательны.<br />Заявка — знакомство, а не бронирование.</p>
      <button type="submit" className={styles.submitButton}>Подать заявку <span aria-hidden="true">↗</span></button>
    </div>
    {Object.values(errors).some(Boolean) && <p className={styles.summary} role="alert">Проверь отмеченные поля — до Шанхая осталось несколько ответов.</p>}
  </form>;
}
