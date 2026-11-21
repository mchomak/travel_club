import { notFound } from "next/navigation";
import { ItineraryUnavailable, TripItinerary, type PublicItinerary } from "../trip-itinerary";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();

  let trip: PublicItinerary | null = null;
  try {
    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${backend}/api/public/trips/${token}`, {
      cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (response.ok) trip = await response.json() as PublicItinerary;
    else if (response.status !== 404) throw new Error();
  } catch {
    return <ItineraryUnavailable />;
  }
  if (!trip) notFound();
  return <TripItinerary trip={trip} />;
}
