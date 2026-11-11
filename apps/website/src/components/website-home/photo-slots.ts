export type PhotoSlot = { src: string; alt: string; aspectRatio: number; position?: string };

// Local snapshot: stable IDs, independent browser edits. Shared photo assets are read-only.
export const photoSlots: Record<string, PhotoSlot> = {
  "hero-terrace": {
    src: "/website/assets/photos/vietnam_mu_cang_chai.webp",
    alt: "Свет рассвета и люди на террасах Му Канг Чай",
    aspectRatio: 2560 / 1708,
    position: "50% 50%",
  },
  "hero-table": {
    "src": "/website/assets/photos/hero-table.jpg",
    "alt": "Компания за общим столом в стамбульском ресторане, отражение набережной в стекле",
    "aspectRatio": 2.1,
    "position": "50% 43%"
  },
  "hero-ferry": {
    "src": "/website/assets/photos/memory-ferry.jpg",
    "alt": "Силуэты пассажиров стамбульского парома у окна с видом на Галатский мост",
    "aspectRatio": 0.8,
    "position": "50% 55%"
  },
  "formats-table": {
    "src": "/website/assets/photos/club-evening.jpg",
    "alt": "Непринуждённый вечерний разговор друзей за столом под тёплым светом ламп",
    "aspectRatio": 1.65,
    "position": "50% 50%"
  },
  "next-table": {
    "src": "/website/assets/photos/together.webp",
    "alt": "Горный гребень в облаках. Иллюстративное фото Joseph Ruwa / Pexels, не анонс направления.",
    "aspectRatio": 1,
    "position": "43% 50%"
  },
  "thailand-islands": {
    "src": "/website/assets/photos/thailand-islands.jpg",
    "alt": "Известняковые острова Таиланда в солнечном свете",
    "aspectRatio": 1.65,
    "position": "50% 50%"
  },
  "thailand-company": {
    "src": "/website/assets/photos/memory-dinner.jpg",
    "alt": "Друзья разговаривают за ужином при свете свечей",
    "aspectRatio": 1.8,
    "position": "50% 50%"
  },
  "thailand-boat": {
    "src": "/website/assets/photos/thailand-boat.jpg",
    "alt": "Деревянная лодка у зелёных известняковых скал Таиланда",
    "aspectRatio": 1.5,
    "position": "50% 50%"
  },
  "china-street": {
    "src": "/website/assets/photos/shanghai-street.jpg",
    "alt": "Велосипедисты на перекрёстке Юньнань-роуд в Шанхае",
    "aspectRatio": 1.65,
    "position": "50% 50%"
  },
  "china-beijing": {
    "src": "/website/assets/photos/beijing-hutong.jpg",
    "alt": "Традиционный переулок Пекина с кирпичными домами",
    "aspectRatio": 0.75,
    "position": "50% 50%"
  },
  "china-company": {
    "src": "/website/assets/photos/memory-dinner.jpg",
    "alt": "Друзья разговаривают за ужином при свете свечей",
    "aspectRatio": 1.8,
    "position": "50% 50%"
  },
  "archive-china": {
    "src": "/website/assets/photos/shanghai-street.jpg",
    "alt": "Велосипедисты на перекрёстке Юньнань-роуд в Шанхае",
    "aspectRatio": 1.4,
    "position": "50% 50%"
  },
  "archive-madagascar": {
    "src": "/website/assets/photos/madagascar-baobabs.jpg",
    "alt": "Баобабы и песчаная дорога на Мадагаскаре",
    "aspectRatio": 1.4,
    "position": "50% 50%"
  },
  "archive-thailand": {
    "src": "/website/assets/photos/thailand-islands.jpg",
    "alt": "Зелёные острова Таиланда и открытое море",
    "aspectRatio": 1.6,
    "position": "50% 50%"
  },
  "approach-table": {
    "src": "/website/assets/photos/istanbul-cafe.jpg",
    "alt": "Витрина небольшой чайной в Арнавуткёе, Стамбул",
    "aspectRatio": 0.82,
    "position": "50% 50%"
  }
};
