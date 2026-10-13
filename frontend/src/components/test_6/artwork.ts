import { CanvasTexture, SRGBColorSpace } from "three";
import { BASE_TOKENS } from "../design-system/tokens";
const cloud = BASE_TOKENS.colors.cloud;
const ink = BASE_TOKENS.colors.ink;
const W = 1024, H = 1280;
export type Artwork = { cover: CanvasTexture; spreads: { left: CanvasTexture; right: CanvasTexture }[]; dispose(): void };

async function image(src: string): Promise<HTMLImageElement> {
  const photo = new Image();
  photo.src = src;
  await photo.decode();
  return photo;
}
function crop(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / photo.width, h / photo.height);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(photo, x + (w - photo.width * scale) / 2, y + (h - photo.height * scale) / 2, photo.width * scale, photo.height * scale);
  ctx.restore();
}
function page(draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas artwork unavailable");
  ctx.fillStyle = cloud; ctx.fillRect(0, 0, W, H);
  draw(ctx);
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}
function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = ink, serif = false, weight = 400) {
  ctx.font = `${weight} ${size}px "${serif ? "TC Lora" : "TC Golos"}"`; ctx.fillStyle = color; ctx.fillText(value, x, y);
}
function meta(ctx: CanvasRenderingContext2D, left: string, right: string, color = ink) {
  text(ctx, left, 62, 67, 18, color, false, 500);
  ctx.textAlign = "right"; text(ctx, right, 962, 67, 18, color); ctx.textAlign = "left";
  ctx.strokeStyle = color; ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(62, 88); ctx.lineTo(962, 88); ctx.stroke(); ctx.globalAlpha = 1;
}
export async function createArtwork(): Promise<Artwork> {
  const fonts = [new FontFace("TC Golos", 'url("/test/fonts/golos-text-latin.woff2")', { weight: "400 700" }),
    new FontFace("TC Lora", 'url("/test/fonts/lora-regular-latin.woff2")', { weight: "400 700" })];
  let photos: HTMLImageElement[];
  try {
    const loaded = await Promise.allSettled(fonts.map(async font => { await font.load(); document.fonts.add(font); }));
    if (loaded.some(result => result.status === "rejected")) throw new Error("Font loading failed");
    photos = await Promise.all([image("/test/shanghai-street.jpg"), image("/test_4/thailand-islands.jpg"), image("/test/shanghai-dumplings.jpg")]);
  } catch {
    fonts.forEach(font => document.fonts.delete(font));
    throw new Error("Не удалось загрузить локальные фотографии или шрифты журнала. Повторите загрузку сцены.");
  }
  const [city, islands, food] = photos;
  const cover = page(ctx => {
    meta(ctx, "FIELD NOTES / 2026", "CHINA ’26");
    text(ctx, "TRAVEL", 62, 276, 171, ink, false, 700); text(ctx, "CLUB", 62, 438, 171, ink, false, 700);
    crop(ctx, city, 62, 495, 900, 505);
    text(ctx, "BEIJING → SHANGHAI", 62, 1060, 23, ink, false, 500);
    text(ctx, "People make the journey.", 62, 1145, 39, ink, true);
    text(ctx, "AN INDEPENDENT TRAVEL JOURNAL", 62, 1218, 17);
  });
  const names = ["PEOPLE", "THAILAND ’26", "FIELD NOTES", "CHINA ’26"];
  const routes = ["PLACES / CULTURE / STORIES", "ISLANDS → BANGKOK", "THE ARCHIVE / 2025", "BEIJING → SHANGHAI"];
  const spreads = names.map((name, index) => ({
    left: page(ctx => {
      ctx.fillStyle = index === 1 ? BASE_TOKENS.colors.thailand : ink; ctx.fillRect(0, 0, W, H);
      meta(ctx, "TRAVEL CLUB / FIELD NOTES", `0${index + 1}`, cloud);
      if (index === 3) {
        text(ctx, "CHINA", 62, 342, 165, cloud, false, 600); text(ctx, "’26", 62, 527, 170, cloud, false, 600);
        text(ctx, "4 FRIENDS", 66, 619, 27, cloud, false, 500);
        text(ctx, "+ 2 LOCAL FRIENDS IN BEIJING", 66, 665, 19, cloud);
        text(ctx, "Different cities.", 62, 800, 52, cloud, true); text(ctx, "Familiar people.", 62, 865, 52, cloud, true);
        crop(ctx, food, 62, 935, 265, 194);
        text(ctx, "A FRIENDS’ JOURNEY", 363, 1003, 18, cloud); text(ctx, "BEFORE THE CLUB BEGAN", 363, 1035, 17, cloud);
      } else {
        const lines = index === 0 ? ["PEOPLE", "PLACES", "CULTURE", "STORIES"] : index === 1 ? ["THAILAND", "’26"] : ["FIELD", "NOTES", "2025"];
        lines.forEach((line, i) => text(ctx, line, 62, 305 + i * 162, index === 0 ? 115 : 139, cloud, false, 600));
        text(ctx, "Collected along the way.", 62, 1020, 43, cloud, true);
      }
      text(ctx, routes[index], 62, 1203, 22, cloud, false, 500);
    }),
    right: page(ctx => {
      meta(ctx, name, "TRAVEL CLUB");
      text(ctx, routes[index], 62, 169, 24, ink, false, 500);
      crop(ctx, index === 1 ? islands : city, 62, 218, 900, 735);
      text(ctx, index === 3 ? "Where matters." : "A place to remember.", 62, 1050, 43, ink, true);
      text(ctx, index === 3 ? "Who with matters more." : "A story to bring home.", 62, 1104, 43, ink, true);
      text(ctx, index === 3 ? "4 FRIENDS  +  2 LOCAL FRIENDS IN BEIJING" : "INDEPENDENT JOURNEYS / SHARED MEMORIES", 62, 1203, 18);
    }),
  }));
  return { cover, spreads, dispose() { cover.dispose(); spreads.forEach(spread => { spread.left.dispose(); spread.right.dispose(); }); fonts.forEach(font => document.fonts.delete(font)); } };
}
