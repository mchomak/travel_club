"use client";
import { Children, cloneElement, isValidElement, useId, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { X, AlertCircle, LoaderCircle } from "lucide-react";

export function TripProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
export function Field({ label, hint, error, children, wide }: { label: string; hint?: string; error?: string; children: ReactNode; wide?: boolean }) {
  const id = useId();
  const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return <div className={`field${wide ? " field-wide" : ""}`}><label htmlFor={id} className="field-label">{label}</label>{Children.map(children, child => isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(child) && ["input", "select", "textarea"].includes(String(child.type)) ? cloneElement(child, { id, "aria-describedby": described, "aria-invalid": !!error }) : child)}{hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}{error && <span id={`${id}-error`} className="field-error" role="alert">{error}</span>}</div>;
}
export function Modal({ title, description, open = true, onClose, children }: { title: string; description?: string; open?: boolean; onClose: () => void; children: ReactNode }) {
  const [returnFocus] = useState(() => typeof document === "undefined" ? null : document.activeElement as HTMLElement | null);
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose(); }}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content" aria-describedby={undefined} onCloseAutoFocus={e => { e.preventDefault(); returnFocus?.focus(); }} onInteractOutside={e => e.preventDefault()}><header className="modal-header"><div><Dialog.Title className="text-2xl font-semibold">{title}</Dialog.Title>{description && <Dialog.Description className="mt-2 text-sm text-muted">{description}</Dialog.Description>}</div><Dialog.Close className="icon-button" aria-label="Закрыть"><X size={20} /></Dialog.Close></header>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function Confirm({ title, children, action, onConfirm, onClose, busy = false }: { title: string; children: ReactNode; action: string; onConfirm: () => void; onClose: () => void; busy?: boolean }) {
  return <Modal title={title} onClose={onClose}><div className="modal-body"><div className="text-muted">{children}</div><div className="form-actions"><button className="secondary-button" onClick={onClose} disabled={busy}>Отмена</button><button className="danger-button" onClick={onConfirm} disabled={busy}>{action}</button></div></div></Modal>;
}
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) { return <div role="alert" className="error-notice"><AlertCircle size={20} aria-hidden /><div><p>{error instanceof Error ? error.message : "Не удалось загрузить данные. Попробуйте ещё раз."}</p>{retry && <button className="text-link mt-2" onClick={retry}>Повторить</button>}</div></div>; }
export function Loading({ children = "Загружаем поездку…" }: { children?: ReactNode }) { return <div role="status" className="flex items-center gap-3 py-12 text-muted"><LoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden />{children}</div>; }
