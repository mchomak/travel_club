import { expect, test, vi } from "vitest";
import type { TripDocument } from "./contracts";
import { calculateTrip } from "./pricing";
import { serializeTripExport } from "./trip-export";
import { emptyDay, newTrip } from "./trip-ui";

test("export embeds each uploaded photo for a portable import", async () => {
  const photoId = "upload-0123456789abcdef0123456789abcdef";
  const trip = { ...newTrip(), days: [{ ...emptyDay("2026-10-01"), photo_id: photoId }], items: [], rates: [] };
  const document = { ...trip, id: "trip-1", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(trip) } as TripDocument;
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("photo", { status: 200 }));
  try {
    const blob = await serializeTripExport(document);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob);
    });
    const result = JSON.parse(text);
    expect(result.trip.days[0].photo_id).toBe(photoId);
    expect(result.photos[photoId]).toBe("cGhvdG8=");
    expect(fetchMock).toHaveBeenCalledWith(`/api/trips/trip-1/photos/${photoId}`, expect.any(Object));
  } finally { fetchMock.mockRestore(); }
});

test("export without uploaded photos keeps the original v1 format", async () => {
  const trip = { ...newTrip(), days: [emptyDay("2026-10-01")], items: [], rates: [] };
  const document = { ...trip, id: "trip-1", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(trip) } as TripDocument;
  const blob = await serializeTripExport(document);
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob);
  });
  expect(Object.keys(JSON.parse(text)).sort()).toEqual(["format", "trip", "version"]);
});
