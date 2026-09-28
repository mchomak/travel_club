"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { newTrip } from "@/lib/trip-ui";
import { tripApi } from "@/lib/trips";
import { TripForm } from "./trip-form";

export function NewTrip() {
  const router = useRouter(), [initial] = useState(newTrip);
  const [dirty, setDirty] = useState(false), created = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { if (!created.current) { event.preventDefault(); event.returnValue = ""; } };
    const navigation = (event: MouseEvent) => {
      const leaveTarget = (event.target as Element).closest("a[href], [data-leave-editor]");
      if (leaveTarget && !created.current && !window.confirm("Есть несохранённые изменения. Покинуть поездку?")) { event.preventDefault(); event.stopPropagation(); }
    };
    const back = () => { if (!created.current && !window.confirm("Есть несохранённые изменения. Покинуть поездку?")) history.forward(); };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", back);
    document.addEventListener("click", navigation, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("popstate", back); document.removeEventListener("click", navigation, true); };
  }, [dirty]);
  return <div className="new-trip"><Link className="back-link" href="/admin/trips"><ArrowLeft size={17} aria-hidden />Все поездки</Link><div className="page-heading"><div><h1>Новая поездка</h1><p>Начнём с дат и участников. Детали маршрута можно добавить позже.</p></div></div><div className="paper-panel"><TripForm initial={initial} action="Создать поездку" onDirtyChange={setDirty} onSubmit={async input => { const document = await tripApi.create(input); created.current = true; router.replace(`/admin/trips/${document.id}`); }} /></div></div>;
}
