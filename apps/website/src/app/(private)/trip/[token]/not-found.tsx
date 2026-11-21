import s from "../trip.module.css";

export default function NotFound() {
  return <section className={s.status}>
    <h1>Программа недоступна</h1>
    <p>Проверьте адрес или запросите актуальную ссылку у организатора поездки.</p>
  </section>;
}
