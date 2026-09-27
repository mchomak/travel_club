import { TripPreview } from "@/components/trips/preview";
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <TripPreview id={id} />; }
