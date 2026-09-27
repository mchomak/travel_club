"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { newTrip } from "@/lib/trip-ui";
import { tripApi } from "@/lib/trips";
import { TripForm } from "./trip-form";

export function NewTrip() {
  const router = useRouter(), [initial] = useState(newTrip);
  return <div className="new-trip"><Link className="back-link" href="/admin/trips"><ArrowLeft size={17} aria-hidden />Все поездки</Link><div className="page-heading"><div><h1>Новая поездка</h1><p>Начнём с дат и участников. Детали маршрута можно добавить позже.</p></div></div><div className="paper-panel"><TripForm initial={initial} action="Создать поездку" onSubmit={async input => { const document = await tripApi.create(input); router.replace(`/admin/trips/${document.id}`); }} /></div></div>;
}
