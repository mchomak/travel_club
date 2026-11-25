"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ItemInput } from "@/lib/contracts";
import { Field } from "./ui";
import { maxTextLength } from "./event-editor-validation";
import styles from "./flight-editor.module.css";

export function EventStagesSection({ typeChosen, persistedStages, title = "Этапы события", bookingHint, embedded = false }: {
  typeChosen: boolean;
  persistedStages?: ItemInput["stages"];
  title?: string;
  bookingHint?: string;
  embedded?: boolean;
}) {
  const { control, register, formState: { errors } } = useFormContext<ItemInput>();
  const { fields: stageFields, append: addStage, remove: removeStage, move: moveStage } = useFieldArray({ control, name: "stages", keyName: "formKey" });
  return <fieldset data-editor-section={embedded ? undefined : "stages"} className="form-section" disabled={!typeChosen} aria-label={title}>
      {!embedded && <h3>{title}</h3>}
      {bookingHint && <p className="field-hint">{bookingHint}</p>}
      <p className="field-hint">Части одного события показываются внутри него и не добавляют стоимость.</p>
      {stageFields.map((stage, index) => <div data-editor-stage={stage.id} className="form-grid" key={stage.formKey}>
        <Field label={`Название этапа ${index + 1}`} error={errors.stages?.[index]?.title?.message} wide><input {...register(`stages.${index}.title`, { required: "Укажите название этапа", validate: {
          length: maxTextLength(200),
          title: value => !!value?.trim() || persistedStages?.some(saved => saved.id === stage.id && saved.title === value) || "Укажите название этапа",
        } })} /></Field>
        <Field label={`Начало этапа ${index + 1}`}><input type="time" {...register(`stages.${index}.start_time`, { setValueAs: value => value || null })} /></Field>
        <Field label={`Окончание этапа ${index + 1}`}><input type="time" {...register(`stages.${index}.end_time`, { setValueAs: value => value || null })} /></Field>
        <Field label={`Описание этапа ${index + 1}`} error={errors.stages?.[index]?.notes?.message} wide><textarea rows={2} {...register(`stages.${index}.notes`, { validate: maxTextLength(10000) })} /></Field>
        <div className={styles.stageActions}><button type="button" className="secondary-button" disabled={index === 0} onClick={() => moveStage(index, index - 1)}>Поднять этап {index + 1}</button><button type="button" className="secondary-button" disabled={index === stageFields.length - 1} onClick={() => moveStage(index, index + 1)}>Опустить этап {index + 1}</button><button type="button" className="secondary-button" onClick={() => removeStage(index)}>Удалить этап {index + 1}</button></div>
      </div>)}
      <button type="button" className="secondary-button" disabled={stageFields.length >= 100} onClick={() => addStage({ id: crypto.randomUUID(), title: "", start_time: null, end_time: null, notes: "" })}>Добавить этап</button>
    </fieldset>;
}
