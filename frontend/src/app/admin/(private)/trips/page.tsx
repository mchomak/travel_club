import { Map } from "lucide-react";
export default function TripsPage() {
  return <><h1 className="text-3xl font-semibold">Поездки</h1><p className="mt-2 text-muted">Рабочие маршруты команды Travel Club</p>
    <section className="mt-10 flex min-h-80 flex-col items-center justify-center rounded-xl border border-line bg-paper p-8 text-center">
      <Map size={38} className="mb-5 text-accent" aria-hidden /><h2 className="text-xl font-semibold">Ваше пространство для путешествий</h2>
      <p className="mt-3 max-w-md text-muted">Здесь появится список маршрутов. Конструктор поездок готовится к открытию.</p>
    </section></>;
}
