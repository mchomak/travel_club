"use client";
import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { ItemInput } from "@/lib/contracts";
import { localClockMicroseconds } from "@/lib/transport-schedule";
import { Field } from "./ui";
import { maxTextLength } from "./event-editor-validation";
import { validUrl } from "./event-editor-shared";
import styles from "./excursion-editor.module.css";

type Stage = NonNullable<ItemInput["stages"]>[number];

export function ExcursionStages({ persistedStages }: { persistedStages?: ItemInput["stages"] }) {
  const { control, register, getValues, formState: { errors } } = useFormContext<ItemInput>();
  const { fields, append, insert, remove, move } = useFieldArray({ control, name: "stages", keyName: "formKey" });
  const stages = useWatch({ control, name: "stages" }) ?? [];
  const [dayId, endDayId, eventStart, eventEnd] = useWatch({ control, name: ["day_id", "end_day_id", "start_time", "end_time"] });
  const eventStartClock = eventStart ? localClockMicroseconds(eventStart) : null;
  const eventEndClock = eventEnd ? localClockMicroseconds(eventEnd) : null;
  const ambiguousDays = (!!endDayId && endDayId !== dayId) || (eventStartClock !== null && eventEndClock !== null && eventEndClock <= eventStartClock);
  const [removing, setRemoving] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<string | null>(null);
  return <fieldset className={`form-section ${styles.program}`} aria-label="Программа экскурсии">
    <p className="field-hint">Этапы входят в одну экскурсию и не добавляют стоимость.</p>
    {!fields.length && <p className="field-hint">Добавьте этапы, чтобы составить программу экскурсии.</p>}
    <div className={styles.timeline}>{fields.map((field, index) => {
      const stage = stages[index] ?? field;
      const previous = stages[index - 1];
      const start = stage.start_time ? localClockMicroseconds(stage.start_time) : null;
      const end = stage.end_time ? localClockMicroseconds(stage.end_time) : null;
      const previousStart = previous?.start_time ? localClockMicroseconds(previous.start_time) : null;
      const previousEnd = previous?.end_time ? localClockMicroseconds(previous.end_time) : null;
      const invalidInterval = !ambiguousDays && start !== null && end !== null && end <= start;
      const outOfOrder = !ambiguousDays && previousStart !== null && start !== null && start < previousStart;
      const overlap = !ambiguousDays && previousEnd !== null && start !== null && start < previousEnd;
      const gap = !ambiguousDays && previousStart !== null && previousEnd !== null && start !== null && end !== null && previousEnd > previousStart && end > start && start > previousEnd;
      return <details key={field.formKey} data-editor-stage={field.id} className={styles.stage} open={newStage === field.id ? true : undefined} onToggle={event => {
        const current = event.currentTarget;
        if (current.open) current.parentElement?.querySelectorAll<HTMLDetailsElement>(":scope > details[open]").forEach(other => { if (other !== current) other.open = false; });
        else if (newStage === field.id) setNewStage(null);
      }}>
        <summary><span className={styles.number}>{index + 1}</span><span className={styles.stageSummary}>
          <strong>{stage.title?.trim() || "Новый этап"}</strong>
          <span>{[stage.start_time?.slice(0, 5), stage.end_time?.slice(0, 5)].filter(Boolean).join(" — ") || "Время не указано"}</span>
          {(stage.location || stage.notes) && <small>{stage.location || stage.notes}</small>}
          {(invalidInterval || outOfOrder || overlap || errors.stages?.[index]) && <small className={styles.warning}>{overlap ? "Время этапов пересекается" : "Проверьте этап"}</small>}
          {gap && <small>Между этапами есть свободное время</small>}
        </span></summary>
        <div className={`form-grid ${styles.stageFields}`}>
          {invalidInterval && <p className={`field-wide ${styles.warning}`}>Окончание этапа не позже начала. Проверьте время; переход через полночь не определяется автоматически.</p>}
          {outOfOrder && <p className={`field-wide ${styles.warning}`}>Этап начинается раньше предыдущего.</p>}
          {overlap && <p className={`field-wide ${styles.warning}`}>Время этапов пересекается.</p>}
          <Field label={`Название этапа ${index + 1}`} error={errors.stages?.[index]?.title?.message} wide><input {...register(`stages.${index}.title`, { required: "Укажите название этапа", validate: { length: maxTextLength(200), title: value => !!value?.trim() || persistedStages?.some(saved => saved.id === field.id && saved.title === value) || "Укажите название этапа" } })} /></Field>
          {(["start_time", "end_time"] as const).map(name => {
            const original = persistedStages?.find(saved => saved.id === field.id)?.[name];
            const precise = !!original && !/^\d{2}:\d{2}$/.test(original);
            return <Field key={name} label={`${name === "start_time" ? "Начало" : "Окончание"} этапа ${index + 1}`} error={errors.stages?.[index]?.[name]?.message}><input type={precise ? "text" : "time"} {...register(`stages.${index}.${name}`, { setValueAs: value => value || null, validate: value => !value || value === original || /^([01]\d|2[0-3]):[0-5]\d$/.test(value) || "Укажите время в формате ЧЧ:ММ." })} /></Field>;
          })}
          <Field label={`Место этапа ${index + 1}`} wide><input {...register(`stages.${index}.location`, { setValueAs: value => value || undefined, validate: maxTextLength(200) })} /></Field>
          <details className="field-wide"><summary>Адрес и карта</summary><div className="form-grid">
            <Field label={`Адрес этапа ${index + 1}`} wide><input {...register(`stages.${index}.address`, { setValueAs: value => value || undefined, validate: maxTextLength(500) })} /></Field>
            <Field label={`Ссылка на карту этапа ${index + 1}`} error={errors.stages?.[index]?.map_url?.message} wide><input type="url" {...register(`stages.${index}.map_url`, { setValueAs: value => value || undefined, validate: value => validUrl(value ?? null) })} /></Field>
          </div></details>
          <Field label={`Описание этапа ${index + 1}`} error={errors.stages?.[index]?.notes?.message} wide><textarea rows={2} {...register(`stages.${index}.notes`, { validate: maxTextLength(10000) })} /></Field>
          <div className={styles.stageActions}>
            <button type="button" className="secondary-button" disabled={index === 0} onClick={() => move(index, index - 1)}>Поднять этап {index + 1}</button>
            <button type="button" className="secondary-button" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>Опустить этап {index + 1}</button>
            <button type="button" className="secondary-button" disabled={fields.length >= 100} onClick={() => { const id = crypto.randomUUID(); setNewStage(id); insert(index + 1, { ...getValues(`stages.${index}`), id } as Stage); }}>Дублировать этап {index + 1}</button>
            <button type="button" className="secondary-button" onClick={() => setRemoving(field.id)}>Удалить этап {index + 1}</button>
          </div>
          {removing === field.id && <div className={`field-wide ${styles.confirm}`} role="group" aria-label={`Удаление этапа ${index + 1}`}><p>Удалить этот этап и его данные?</p><button type="button" className="danger-button" onClick={() => { remove(index); setRemoving(null); }}>Подтвердить удаление</button> <button type="button" className="secondary-button" onClick={() => setRemoving(null)}>Отмена удаления</button></div>}
        </div>
      </details>;
    })}</div>
    <button type="button" className="secondary-button" disabled={fields.length >= 100} onClick={() => { const id = crypto.randomUUID(); setNewStage(id); append({ id, title: "", start_time: null, end_time: null, notes: "" }); }}>Добавить этап</button>
  </fieldset>;
}
