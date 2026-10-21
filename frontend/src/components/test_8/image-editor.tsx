"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { cropPhoto, decodePhoto, type CropArea } from "./crop-photo";
import { loadPhoto, resetPhoto, savePhoto } from "./photo-store";
import { photoSlots } from "./photo-slots";
import s from "./image-editor.module.css";

type Menu = { slotId: string; x: number; y: number; trigger: HTMLElement };
type Draft = { slotId: string; source: string; width: number; height: number };
type EditorContext = { photos: Record<string, string>; openMenu: (slotId: string, x: number, y: number, trigger: HTMLElement) => void };
const Context = createContext<EditorContext | null>(null);

export function useImageEditor() {
  const context = useContext(Context);
  if (!context) throw new Error("EditableImage must be inside ImageEditorProvider.");
  return context;
}

function readableError(error: unknown, operation: "read" | "save" | "reset") {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "В браузере закончилось место. Фото не сохранено. Освободите место или выберите меньшее изображение.";
  }
  if (error instanceof DOMException) {
    return operation === "read"
      ? "Сохранённые фото недоступны. Разрешите этому сайту хранение данных и обновите страницу. Пока показаны исходные фото."
      : "Браузер не разрешил сохранить изменение. Разрешите этому сайту хранение данных и попробуйте снова. Прежнее фото сохранено.";
  }
  return error instanceof Error ? error.message : "Не удалось обработать фото. Попробуйте ещё раз.";
}

export function ImageEditorProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [menu, setMenu] = useState<Menu | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingSlot = useRef<string | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const urls = useRef(new Map<string, string>());
  const versions = useRef(new Map<string, number>());
  const selection = useRef(0);
  const saving = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    function cancelledPicker() {
      selection.current += 1;
      restoreFocus.current?.focus({ preventScroll: true });
    }
    input?.addEventListener("cancel", cancelledPicker);
    return () => input?.removeEventListener("cancel", cancelledPicker);
  }, []);

  const displayBlob = useCallback((slotId: string, blob?: Blob) => {
    const previous = urls.current.get(slotId);
    const source = blob ? URL.createObjectURL(blob) : undefined;
    if (source) urls.current.set(slotId, source);
    else urls.current.delete(slotId);
    setPhotos(current => {
      const next = { ...current };
      if (source) next[slotId] = source;
      else delete next[slotId];
      return next;
    });
    if (previous) URL.revokeObjectURL(previous);
  }, []);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    const activeUrls = urls.current;
    for (const slotId of Object.keys(photoSlots)) {
      const version = versions.current.get(slotId);
      loadPhoto(slotId).then(blob => {
        if (active && version === versions.current.get(slotId) && blob) displayBlob(slotId, blob);
      }).catch(error => {
        if (active) setNotice(readableError(error, "read"));
      });
    }
    return () => {
      active = false;
      mounted.current = false;
      selection.current += 1;
      for (const url of activeUrls.values()) URL.revokeObjectURL(url);
      activeUrls.clear();
    };
  }, [displayBlob]);

  useEffect(() => {
    if (!draft) return;
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      URL.revokeObjectURL(draft.source);
      restoreFocus.current?.focus({ preventScroll: true });
    };
  }, [draft]);

  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    function dismiss(event: Event) {
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape") return;
      if (event.type === "pointerdown" && menuRef.current?.contains(event.target as Node)) return;
      setMenu(null);
      if (event.type === "keydown") menu?.trigger.focus({ preventScroll: true });
    }
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", dismiss);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [menu]);

  function openMenu(slotId: string, x: number, y: number, trigger: HTMLElement) {
    if (saving.current || draft) return;
    restoreFocus.current = trigger;
    setMenu({ slotId, x: Math.max(8, Math.min(x, window.innerWidth - 268)), y: Math.max(8, Math.min(y, window.innerHeight - 108)), trigger });
  }

  async function selectFile(file?: File) {
    const slotId = pendingSlot.current;
    const token = ++selection.current;
    if (!file || !slotId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice("Выберите фотографию в формате JPG, PNG или WEBP.");
      restoreFocus.current?.focus({ preventScroll: true });
      return;
    }
    const source = URL.createObjectURL(file);
    try {
      const image = await decodePhoto(source);
      if (selection.current !== token) { URL.revokeObjectURL(source); return; }
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setArea(null);
      setEditorError(null);
      setNotice(null);
      setDraft({ slotId, source, width: image.naturalWidth, height: image.naturalHeight });
    } catch (error) {
      URL.revokeObjectURL(source);
      if (selection.current === token) {
        setNotice(readableError(error, "save"));
        restoreFocus.current?.focus({ preventScroll: true });
      }
    }
  }

  function cancel() {
    if (saving.current) return;
    selection.current += 1;
    setDraft(null);
  }

  async function save() {
    if (!draft || !area || saving.current) return;
    saving.current = true;
    setBusy(true);
    setEditorError(null);
    versions.current.set(draft.slotId, (versions.current.get(draft.slotId) ?? 0) + 1);
    try {
      const blob = await cropPhoto(draft.source, area);
      await savePhoto(draft.slotId, blob);
      if (!mounted.current) return;
      displayBlob(draft.slotId, blob);
      setDraft(null);
    } catch (error) {
      if (mounted.current) setEditorError(readableError(error, "save"));
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function reset(slotId: string) {
    if (saving.current) return;
    saving.current = true;
    setMenu(null);
    versions.current.set(slotId, (versions.current.get(slotId) ?? 0) + 1);
    try {
      await resetPhoto(slotId);
      displayBlob(slotId);
    } catch (error) {
      setNotice(readableError(error, "reset"));
    } finally {
      saving.current = false;
      restoreFocus.current?.focus({ preventScroll: true });
    }
  }

  return <Context.Provider value={{ photos, openMenu }}>
    {children}
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Выберите фото" onChange={event => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      void selectFile(file);
    }} />
    {menu && createPortal(<div ref={menuRef} className={s.menu} role="menu" aria-label="Фотография" style={{ left: menu.x, top: menu.y }} onKeyDown={event => {
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
      if (event.key === "Tab") setMenu(null);
    }}>
      <button type="button" role="menuitem" onClick={() => {
        pendingSlot.current = menu.slotId;
        setMenu(null);
        inputRef.current?.click();
      }}>Заменить фото</button>
      <button type="button" role="menuitem" disabled={!photos[menu.slotId]} onClick={() => void reset(menu.slotId)}>Вернуть исходное фото</button>
    </div>, document.body)}
    {draft && createPortal(<dialog ref={dialogRef} className={s.dialog} aria-labelledby="test-4-photo-title" aria-describedby="test-4-photo-instructions" onCancel={event => { event.preventDefault(); cancel(); }}>
      <header className={s.head}><div><span className={s.eyebrow}>TRAVEL CLUB / ФОТО НА ПОЛЯХ</span><h2 id="test-4-photo-title">Кадрирование фото</h2><p id="test-4-photo-instructions">Перетащите фото внутри рамки. Стрелки на клавиатуре тоже работают.</p></div><button type="button" className={s.close} aria-label="Закрыть редактор" disabled={busy} onClick={cancel}>×</button></header>
      <div className={s.cropStage} inert={busy}>
        <Cropper key={draft.source} image={draft.source} crop={crop} zoom={zoom} aspect={photoSlots[draft.slotId].aspectRatio} minZoom={1} maxZoom={4} zoomWithScroll={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={percent => {
          setArea({ x: percent.x * draft.width / 100, y: percent.y * draft.height / 100, width: percent.width * draft.width / 100, height: percent.height * draft.height / 100 });
        }} cropperProps={{ "aria-label": "Положение фото", "aria-describedby": "test-4-photo-instructions" }} />
      </div>
      <div className={s.zoom}><label htmlFor="test-4-photo-zoom">Масштаб</label><button type="button" aria-label="Уменьшить" disabled={busy || zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .1))}>−</button><input id="test-4-photo-zoom" type="range" min="1" max="4" step=".01" value={zoom} disabled={busy} onChange={event => setZoom(Number(event.target.value))} /><button type="button" aria-label="Увеличить" disabled={busy || zoom >= 4} onClick={() => setZoom(value => Math.min(4, value + .1))}>+</button><output htmlFor="test-4-photo-zoom">{Math.round(zoom * 100)}%</output></div>
      {editorError && <p className={s.error} role="alert">{editorError}</p>}
      <footer className={s.foot}><p>Фото сохраняется только в этом браузере. Другие устройства увидят исходную иллюстрацию.</p><div className={s.actions}><button type="button" disabled={busy} onClick={cancel}>Отмена</button><button type="button" className={s.save} disabled={!area || busy} onClick={() => void save()}>{busy ? "Сохраняем…" : "Сохранить фото"}</button></div></footer>
    </dialog>, document.body)}
    {notice && createPortal(<div className={s.notice} role="alert"><span>{notice}</span><button type="button" aria-label="Закрыть сообщение" onClick={() => setNotice(null)}>×</button></div>, document.body)}
  </Context.Provider>;
}
