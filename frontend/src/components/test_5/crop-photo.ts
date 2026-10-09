export type CropArea = { x: number; y: number; width: number; height: number };

export async function decodePhoto(source: string): Promise<HTMLImageElement> {
  const image = new window.Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error("Не удалось открыть изображение. Выберите другой JPG, PNG или WEBP.");
  }
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("Изображение пустое или повреждено.");
  return image;
}

export async function cropPhoto(source: string, area: CropArea): Promise<Blob> {
  const image = await decodePhoto(source);
  if (![area.x, area.y, area.width, area.height].every(Number.isFinite) || area.width <= 0 || area.height <= 0) {
    throw new Error("Рамка ещё не готова. Попробуйте сдвинуть фотографию.");
  }
  const scale = Math.min(1, 2400 / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Браузер не смог обработать фото. Попробуйте другой браузер.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Не удалось подготовить фото. Попробуйте другой файл.")), "image/webp", 0.94);
  });
}
