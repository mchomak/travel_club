"use client";

import { useRef, useState } from "react";
import { Ellipsis, Plus } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { ItemInput } from "@/lib/contracts";
import { maxTextLength } from "./event-editor-validation";
import { validUrl } from "./event-editor-shared";
import { Field } from "./ui";
import styles from "./compact-stages.module.css";

export function CompactStages({ persistedStages }: { persistedStages?: ItemInput["stages"] }) {
  const { control, register, formState: { errors } } = useFormContext<ItemInput>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "stages", keyName: "formKey" });
  const stages = useWatch({ control, name: "stages" }) ?? [];
  const [removing, setRemoving] = useState<string | null>(null);
  const newStage = useRef<string | null>(null);
  return <div className={styles.stages}>
    {fields.length === 0 && <p className={styles.empty}>Этапов пока нет</p>}
    {fields.map((field, index) => {
      const stage = stages[index] ?? field;
      const original = persistedStages?.find(entry => entry.id === field.id);
      const time = [stage.start_time?.slice(0, 5), stage.end_time?.slice(0, 5)].filter(Boolean).join(" — ") || "Время не указано";
      return <div className={styles.stage} key={field.formKey} data-editor-stage={field.id}>
        <details ref={element => { if (element && newStage.current === field.id) { element.open = true; newStage.current = null; } }}>
          <summary><span><strong>{stage.title?.trim() || "Новый этап"}</strong><small>{time}</small>{errors.stages?.[index] && <small className={styles.warning}>Проверьте этап</small>}</span></summary>
          <div className={`form-grid ${styles.fields}`}>
            <Field label={`Название этапа ${index + 1}`} error={errors.stages?.[index]?.title?.message} wide><input {...register(`stages.${index}.title`, { required: "Укажите название этапа", validate: { length: maxTextLength(200), title: value => !!value?.trim() || original?.title === value || "Укажите название этапа" } })} /></Field>
            {(["start_time", "end_time"] as const).map(name => {
              const saved = original?.[name];
              const precise = !!saved && !/^\d{2}:\d{2}$/.test(saved);
              return <Field key={name} label={`${name === "start_time" ? "Начало" : "Окончание"} этапа ${index + 1}`} error={errors.stages?.[index]?.[name]?.message}><input type={precise ? "text" : "time"} {...register(`stages.${index}.${name}`, { setValueAs: value => value || null, validate: value => !value || value === saved || /^([01]\d|2[0-3]):[0-5]\d$/.test(value) || "Укажите время в формате ЧЧ:ММ." })} /></Field>;
            })}
            <Field label={`Место этапа ${index + 1}`} wide><input {...register(`stages.${index}.location`, { setValueAs: value => value || (original?.location === "" ? "" : undefined), validate: maxTextLength(200) })} /></Field>
            <details className="field-wide"><summary>Адрес и карта</summary><div className="form-grid"><Field label={`Адрес этапа ${index + 1}`} wide><input {...register(`stages.${index}.address`, { setValueAs: value => value || (original?.address === "" ? "" : undefined), validate: maxTextLength(500) })} /></Field><Field label={`Ссылка на карту этапа ${index + 1}`} error={errors.stages?.[index]?.map_url?.message} wide><input type="url" {...register(`stages.${index}.map_url`, { setValueAs: value => value || (original?.map_url === null ? null : original?.map_url === "" ? "" : undefined), validate: value => validUrl(value ?? null) })} /></Field></div></details>
            <Field label={`Описание этапа ${index + 1}`} error={errors.stages?.[index]?.notes?.message} wide><textarea rows={2} {...register(`stages.${index}.notes`, { validate: maxTextLength(10000) })} /></Field>
          </div>
        </details>
        <details className={styles.menu}><summary aria-label={`Действия этапа ${index + 1}`}><Ellipsis size={18} aria-hidden /></summary><div><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)}>Поднять</button><button type="button" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>Опустить</button><button type="button" className="text-danger" onClick={event => { event.currentTarget.closest("details")!.open = false; setRemoving(field.id); }}>Удалить</button></div></details>
        {removing === field.id && <div className={styles.confirm} role="group" aria-label={`Удаление этапа ${index + 1}`}><p>Удалить этап и его данные?</p><button type="button" className="danger-button" onClick={() => { remove(index); setRemoving(null); }}>Удалить этап</button><button type="button" className="secondary-button" onClick={() => setRemoving(null)}>Отмена</button></div>}
      </div>;
    })}
    <button type="button" className="secondary-button" disabled={fields.length >= 100} onClick={() => { const id = crypto.randomUUID(); newStage.current = id; append({ id, title: "", start_time: null, end_time: null, notes: "" }); }}><Plus size={16} aria-hidden />Добавить этап</button>
  </div>;
}
