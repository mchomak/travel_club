"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { ItemInput } from "@/lib/contracts";
import { mapsClient } from "@/lib/maps-client";
import { ItemForm } from "@/components/trips/item-form";
import { Modal } from "@/components/trips/ui";
import { base, trip as exampleTrip } from "./fixtures";
import styles from "./event-playground.module.css";

export function EventPlayground() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [item, setItem] = useState<ItemInput>(base);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    // This page is a separate dev-only surface. Block the editor's map service
    // while it is mounted; restore the shared client when leaving the page.
    const original = { ...mapsClient };
    Object.assign(mapsClient, {
      config: async () => ({ maps_key: null, search_enabled: false, routing_enabled: false }),
      search: async () => ({ places: [] }),
      searchCities: async () => ({ places: [] }),
      reverse: async () => { throw new Error("Карты недоступны в песочнице"); },
      resolveLink: async () => { throw new Error("Карты недоступны в песочнице"); },
      route: async () => ({ status: "unavailable", distance_m: null, duration_s: null, geometry: null, approximate: false, message: null }),
      retry: () => {},
    });
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => { window.clearTimeout(timer); Object.assign(mapsClient, original); };
  }, []);

  const localTrip = { ...exampleTrip, items: [item] };
  const close = () => setOpen(false);
  const reset = () => { setItem(base); setVersion(value => value + 1); setNotice(""); setOpen(true); };

  return <main className={styles.page}>
    <h1>Event Editor Playground</h1>
    <p>Демонстрационные данные. Изменения остаются только на этой странице; карты и сохранение на сервер отключены.</p>
    <div className={styles.actions}>
      <button className="primary-button" type="button" onClick={() => setOpen(true)}>Открыть редактор</button>
      <button className="secondary-button" type="button" onClick={reset}>Сбросить пример</button>
    </div>
    {notice && <p role="status">{notice}</p>}
    {ready && open && <Modal title="Редактирование элемента" variant="panel" onClose={close}>
      <ItemForm key={version} initial={item} trip={localTrip} useDialogHeading onCancel={close}
        onSubmit={value => { setItem(value); setVersion(current => current + 1); setNotice("Изменения сохранены только в песочнице."); close(); }} />
      <button type="button" className="item-panel-delete" onClick={() => { setNotice("Демонстрационное событие удалено из песочницы. Его можно восстановить кнопкой сброса."); close(); }}><Trash2 size={16} aria-hidden />Удалить элемент</button>
    </Modal>}
  </main>;
}
