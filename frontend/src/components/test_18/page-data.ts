export const PAGE_COUNT = 15;

export function parsePageValues(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^(?:[1-9]|1[0-5])$/.test(value)) return 1;
  return Number(value);
}

export const CHAPTERS = [
  { label: "Услуги", start: 2, end: 3 },
  { label: "О нас", start: 4, end: 5 },
  { label: "Первая поездка", start: 6, end: 7 },
  { label: "Таиланд", start: 8, end: 9 },
  { label: "Китай", start: 10, end: 11 },
  { label: "Архив", start: 12, end: 13 },
  { label: "Начать", start: 14, end: 15 },
] as const;

export const PAGES: readonly { number: number; title: string; chapter: number | null }[] = [
  { number: 1, title: "Между строк — обложка", chapter: null },
  { number: 2, title: "Куда — важно. С кем — важнее.", chapter: 0 },
  { number: 3, title: "С нами в путь", chapter: 0 },
  { number: 4, title: "Василиса", chapter: 1 },
  { number: 5, title: "Рамиль", chapter: 1 },
  { number: 6, title: "Next Issue", chapter: 2 },
  { number: 7, title: "Следующая история — вместе.", chapter: 2 },
  { number: 8, title: "Thailand ’26", chapter: 3 },
  { number: 9, title: "Острова. И большой город.", chapter: 3 },
  { number: 10, title: "China ’26", chapter: 4 },
  { number: 11, title: "Дальше — вместе.", chapter: 4 },
  { number: 12, title: "Archive ’25", chapter: 5 },
  { number: 13, title: "То, что остаётся.", chapter: 5 },
  { number: 14, title: "Не только куда.", chapter: 6 },
  { number: 15, title: "Начнём с разговора.", chapter: 6 },
];
