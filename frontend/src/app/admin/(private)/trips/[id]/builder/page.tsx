import { TripEditor } from "@/components/trips/trip-editor";
export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <TripEditor id={id} mode="builder" />; }
