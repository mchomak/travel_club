import { images } from "../test/data";

// Keep the experiment's art direction here. Photographs are immutable baseline assets.
export const livingIssue = {
  edition: "ВЫПУСК / 01",
  date: "ОКТЯБРЬ 2026",
  title: "TRAVEL CLUB",
  label: "ЖИВОЙ ВЫПУСК",
  statement: "Каждая поездка —\nновый выпуск.",
  coverLine: "С кем — важнее.",
  coverImage: images.ferry,
  coverCaption: "Между берегами. Среди своих.",
  spread: {
    number: "00",
    destination: "СТАМБУЛ",
    people: "8 ЧЕЛОВЕК / ОДНА ИСТОРИЯ",
    headline: "Место за общим столом.",
    note: "У каждой поездки — свои люди, места и истории. Всё это становится выпуском Travel Club.",
    coordinates: "41°00′ с. ш. / 28°58′ в. д.",
    image: images.hero,
    detailImage: images.istanbulTea,
    caption: "Куда — важно. С кем — важнее.",
    footnote: "Эскиз будущей поездки",
  },
};
