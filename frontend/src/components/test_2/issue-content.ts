import { images } from "../test/data";

// Keep the experiment's art direction here. Photographs are immutable baseline assets.
export const livingIssue = {
  edition: "EDITION / 01",
  date: "OCT 2026",
  title: "TRAVEL CLUB",
  label: "LIVING ISSUE",
  statement: "Каждая поездка —\nновый выпуск.",
  coverLine: "С кем — важнее.",
  coverImage: images.ferry,
  coverCaption: "Между берегами. Среди своих.",
  spread: {
    number: "00",
    destination: "ISTANBUL",
    people: "8 PEOPLE / ONE STORY",
    headline: "Место за общим столом.",
    note: "У каждой поездки — свои люди, места и истории. Всё это становится выпуском Travel Club.",
    coordinates: "41°00′ N / 28°58′ E",
    image: images.hero,
    detailImage: images.istanbulTea,
    caption: "Куда — важно. С кем — важнее.",
    footnote: "Эскиз будущей поездки",
  },
};
