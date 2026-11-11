import { TripEditor } from "@/components/trips/trip-editor";
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <TripEditor id={id} />; }
