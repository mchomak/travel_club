"use client";
import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useFormContext, type FieldPath } from "react-hook-form";
import type { ItemInput } from "@/lib/contracts";
import styles from "./event-editor.module.css";

export interface EventSectionDefinition<Id extends string = string> {
  id: Id;
  title: string;
  initiallyOpen?: boolean;
  fields: readonly (keyof ItemInput)[];
}

export function openEditorDetails(element?: Element | null) {
  let details = element?.closest("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details");
  }
}

export function EventEditorSection({ section, summary, children }: {
  section: EventSectionDefinition; summary: ReactNode; children: ReactNode;
}) {
  const { formState: { errors } } = useFormContext<ItemInput>();
  const hasError = section.fields.some(field => errors[field]);
  return <details data-editor-section={section.id} className={styles.section} open={section.initiallyOpen}>
    <summary><span>{section.title}</span><small>{hasError ? "Проверьте заполнение" : summary}</small></summary>
    {children}
  </details>;
}

type ShellProps = ComponentPropsWithoutRef<"form"> & { header?: ReactNode; actions: ReactNode; feedback?: ReactNode };

export function EventEditorShell({ header, actions, feedback, children, ...props }: ShellProps) {
  const ref = useRef<HTMLFormElement>(null);
  const { getFieldState, formState: { errors } } = useFormContext<ItemInput>();
  useEffect(() => {
    if (!Object.keys(errors).length || !ref.current) return;
    for (const element of ref.current.querySelectorAll<HTMLElement>("[name]")) {
      if (getFieldState(element.getAttribute("name") as FieldPath<ItemInput>).invalid) {
        openEditorDetails(element);
      }
    }
  }, [errors, getFieldState]);
  return <form {...props} ref={ref} onInvalidCapture={event => {
    if (event.target instanceof Element) openEditorDetails(event.target);
  }}>
    {header}
    {children}
    {feedback}
    {actions}
  </form>;
}
