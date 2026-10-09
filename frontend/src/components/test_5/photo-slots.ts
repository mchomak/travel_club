import { images, type EditorialImage } from "./data";

export type PhotoSlot = { src: string; alt: string; aspectRatio: number; position?: string };
const original = (image: EditorialImage, aspectRatio: number, position = image.position): PhotoSlot => ({ src: image.src, alt: image.alt, aspectRatio, position });
const stock = (name: string, alt: string, aspectRatio: number, position = "50% 50%"): PhotoSlot => ({ src: `/test_4/${name}.jpg`, alt, aspectRatio, position });

// IDs describe each rendered frame, not an asset or a position in an array.
// Reusing a photograph always creates an independent slot.
export const photoSlots: Record<string, PhotoSlot> = {
  "living-cover-china": original(images.shanghai, 1.15),
  "living-spread-city": original(images.shanghaiStreet, 1.5),
  "living-detail-food": original(images.shanghaiFood, 1),
  "hero-table": original(images.hero, 2.1, "50% 43%"),
  "hero-ferry": original(images.ferry, .8),
  "thailand-26-islands": stock("thailand-islands", "Известняковые острова Таиланда в солнечном свете", 1.65),
  "thailand-26-bangkok": stock("bangkok-night", "Люди и огни вечерней улицы Бангкока", .68),
  "thailand-26-road": stock("thailand-road", "Дорога под густой зелёной кроной в Таиланде", 1.25),
  "thailand-26-boat": stock("thailand-boat", "Деревянная лодка у зелёных известняковых скал Таиланда", 1.5),
  "thailand-26-food": stock("bangkok-food", "Уличная кухня Бангкока, прилавок с едой и посетители", 1.1),
  "thailand-26-company": original(images.dinner, 1.8),
  "china-26-street": original(images.shanghaiStreet, 1.65),
  "china-26-beijing": stock("beijing-hutong", "Традиционный переулок Пекина с кирпичными домами", .75),
  "china-26-food": original(images.shanghaiFood, 1.4),
  "china-26-night": original(images.shanghai, 1),
  "china-26-alley": original(images.shanghaiAlley, .8),
  "archive-china-street": original(images.shanghaiStreet, 1.4),
  "archive-china-alley": original(images.shanghaiAlley, .85),
  "archive-china-night": original(images.shanghaiEvening, 1.45),
  "archive-madagascar-baobabs": stock("madagascar-baobabs", "Баобабы и песчаная дорога на Мадагаскаре", .85),
  "archive-madagascar-lemur": stock("madagascar-lemur", "Лемур на камнях среди зелени на Мадагаскаре", .75),
  "archive-madagascar-sunset": stock("madagascar-sunset", "Баобабы на Мадагаскаре в вечернем свете", 1.8),
  "archive-thailand-islands": stock("thailand-islands", "Зелёные острова Таиланда и открытое море", 1.6),
  "archive-thailand-food": stock("bangkok-food", "Уличная кухня Бангкока", 1.1),
  "archive-thailand-boat": stock("thailand-boat", "Лодка у известняковых скал Таиланда", 1.5),
  "pov-everyday": original(images.istanbulPeople, .67),
  "pov-tea": original(images.istanbulTea, .8),
  "pov-cafe-print": original(images.istanbulCafe, 1.3),
  "club-table": original(images.club, 1.65, "50% 50%"),
  "club-return": original(images.hero, 1.5),
};
