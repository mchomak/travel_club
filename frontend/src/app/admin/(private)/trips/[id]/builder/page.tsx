import { TripEditor } from "@/components/trips/trip-editor";
export default async function BuilderPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const requestedStep = typeof search.step === "string" ? Number(search.step) : 2;
  const initialStep = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 6 ? requestedStep : 2;
  const initialDay = typeof search.day === "string" ? search.day : undefined;
  return <TripEditor id={id} mode="builder" initialStep={initialStep} initialDay={initialDay} />;
}
