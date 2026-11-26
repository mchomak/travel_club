import { notFound } from "next/navigation";
import { EventPlayground } from "@/components/event-playground/event-playground";

export default function EventPlaygroundPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <EventPlayground />;
}
