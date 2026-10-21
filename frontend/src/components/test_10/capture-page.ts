/** Snapshot only the already rendered target leaf, so the curling back matches its live DOM. */
export async function capturePage(element: HTMLElement, signal: AbortSignal): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const images = [...element.querySelectorAll("img")];
  await Promise.all(images.map(image => image.decode()));
  const cache = new Map<string, Promise<string>>();
  function embed(url: string): Promise<string> {
    if (!cache.has(url)) cache.set(url, fetch(url, { signal }).then(response => {
      if (!response.ok) throw new Error(`Target asset unavailable: ${response.status}`);
      return response.blob();
    }).then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
    })));
    return cache.get(url)!;
  }
  const clone = element.cloneNode(true) as HTMLElement;
  const originalNodes = [element, ...element.querySelectorAll<HTMLElement>("*")];
  const clonedNodes = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  await Promise.all(originalNodes.map(async (original, i) => {
    const target = clonedNodes[i], computed = getComputedStyle(original);
    for (const property of computed) target.style.setProperty(property, computed.getPropertyValue(property));
    target.style.visibility = "visible"; target.style.animation = "none"; target.style.transition = "none";
    if (original instanceof HTMLImageElement && target instanceof HTMLImageElement) {
      target.removeAttribute("srcset"); target.removeAttribute("sizes"); target.setAttribute("src", await embed(original.currentSrc || original.src));
    }
  }));
  const width = element.offsetWidth, height = element.offsetHeight;
  Object.assign(clone.style, { position: "relative", left: "0", top: "0", width: `${width}px`, height: `${height}px`, margin: "0", transform: "none" });
  const fontFiles = [
    ["TC Golos", "golos-text-latin.woff2"], ["TC Golos", "golos-text-cyrillic.woff2"],
    ["TC Lora", "lora-regular-latin.woff2"], ["TC Lora", "lora-regular-cyrillic.woff2"],
  ];
  const faces = await Promise.all(fontFiles.map(async ([family, file]) => `@font-face{font-family:'${family}';src:url('${await embed(`/test/fonts/${file}`)}');font-weight:400 700;font-style:normal;unicode-range:${file.includes("cyrillic") ? "U+0400-052F,U+2116" : "U+0000-024F,U+2000-206F,U+20AC,U+2190-21FF"};}`));
  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${faces.join("")}</style>${markup}</div></foreignObject></svg>`;
  const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const canvas = document.createElement("canvas"); canvas.width = width * 2; canvas.height = height * 2;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Target artwork canvas unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  // A tainted canvas cannot become a WebGL texture: fail before creating the scene.
  context.getImageData(0, 0, 1, 1);
  return canvas;
}
