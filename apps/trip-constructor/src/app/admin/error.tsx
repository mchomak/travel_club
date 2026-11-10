"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-semibold">Не удалось открыть кабинет</h1><p className="my-5">Сервер временно недоступен. Попробуйте ещё раз.</p><button onClick={reset} className="primary-button">Повторить</button></main>;
}
