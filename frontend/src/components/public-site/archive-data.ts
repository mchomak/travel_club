type ArchivePhoto = { src: string; alt: string; ratio: "landscape" | "portrait" | "square" };

export type ArchiveRecord = {
  id: string;
  year: number;
  kind: "field-note" | "issue";
  destination: string;
  route?: string;
  people?: string;
  summary: string;
  href?: string;
  photo: ArchivePhoto;
  detailPhoto?: ArchivePhoto;
};

// Completed journeys with friends. No official Issues or detail routes exist yet.
export const archiveRecords: readonly ArchiveRecord[] = [
  { id: "thailand-2026", year: 2026, kind: "field-note", destination: "Thailand", route: "ISLANDS → BANGKOK", people: "4 PEOPLE", summary: "Четверо. От островов до Бангкока. Два разных ритма одной поездки.", photo: { src: "/test_4/thailand-islands.jpg", alt: "Известняковые острова Таиланда и открытое море", ratio: "landscape" }, detailPhoto: { src: "/test_4/bangkok-night.jpg", alt: "Люди и огни вечерней улицы Бангкока", ratio: "portrait" } },
  { id: "china-2026", year: 2026, kind: "field-note", destination: "China", route: "BEIJING → SHANGHAI", people: "4 FRIENDS + 2 LOCAL FRIENDS IN BEIJING", summary: "Четверо прилетели из Москвы. Двое друзей ждали в Пекине. Два города, одна общая история.", photo: { src: "/test_4/beijing-hutong.jpg", alt: "Традиционный переулок Пекина с кирпичными домами", ratio: "portrait" } },
  { id: "china-2025", year: 2025, kind: "field-note", destination: "China", route: "BEIJING → SHANGHAI → SUZHOU → SANYA", people: "5 PEOPLE", summary: "Четыре города. Одна компания.", photo: { src: "/test/shanghai-street.jpg", alt: "Велосипедисты на перекрёстке Юньнань-роуд в Шанхае", ratio: "landscape" } },
  { id: "madagascar-2025", year: 2025, kind: "field-note", destination: "Madagascar", people: "2 PEOPLE", summary: "Двое. Большой остров.", photo: { src: "/test_4/madagascar-baobabs.jpg", alt: "Баобабы и песчаная дорога на Мадагаскаре", ratio: "portrait" } },
  { id: "thailand-2025", year: 2025, kind: "field-note", destination: "Thailand", route: "ISLANDS → BANGKOK", people: "SMALL COMPANY", summary: "От островов к большому городу.", photo: { src: "/test_4/thailand-boat.jpg", alt: "Деревянная лодка у известняковых скал Таиланда", ratio: "square" } },
];
