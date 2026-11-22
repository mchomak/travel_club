import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ItineraryUnavailable, TripItinerary, type PublicItinerary } from "../../trip-itinerary";

export const dynamic = "force-dynamic";

const tripId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!tripId.test(id)) notFound();

  const session = (await cookies()).get("travel_session");
  if (!session?.value) notFound();

  let trip: PublicItinerary | null = null;
  try {
    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
    const response = await fetch(`${backend}/api/trips/${id}/public-preview`, {
      method: "GET", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { Cookie: `travel_session=${encodeURIComponent(session.value)}` },
    });
    if (response.ok) trip = await response.json() as PublicItinerary;
    else if (response.status !== 401 && response.status !== 404) throw new Error();
  } catch {
    return <ItineraryUnavailable />;
  }
  if (!trip) notFound();
  return <TripItinerary trip={trip} photoBase={`/api/trips/${id}/photos`} />;
}
