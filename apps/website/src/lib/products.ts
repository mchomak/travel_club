import registry from "@shared/website-products.json";

const WEBSITE_PRODUCT_DETAILS = {
  route: { shortLabel: "Маршрут", description: "Программа для самостоятельной поездки" },
  complete: { shortLabel: "Под ключ", description: "Подготовка и координация поездки" },
  group: { shortLabel: "В компании", description: "Общий маршрут и сопровождающий" },
  moscow_guide: { shortLabel: "Гид по Москве", description: "Знакомство с Москвой" },
  undecided: { shortLabel: "Пока не определился", description: "Обсудим подходящий формат" },
} as const;

export type WebsiteProductId = (typeof registry.products)[number]["id"];
export type LeadSource = "home" | "formats" | "service" | "unknown";
export type WebsiteProduct = (typeof registry.products)[number] & {
  shortLabel: string;
  description: string;
};

export const WEBSITE_PRODUCT_REGISTRY_VERSION = registry.version;
export const WEBSITE_PRODUCTS: readonly WebsiteProduct[] = registry.products.map((product) => ({
  ...product,
  ...WEBSITE_PRODUCT_DETAILS[product.id as keyof typeof WEBSITE_PRODUCT_DETAILS],
}));

export function getAvailableWebsiteProducts(): readonly WebsiteProduct[] {
  return WEBSITE_PRODUCTS.filter((product) => product.available);
}

export function isWebsiteProductAvailable(
  value: unknown,
  products: readonly WebsiteProduct[] = WEBSITE_PRODUCTS,
): value is WebsiteProductId {
  return typeof value === "string" && products.some((product) => product.id === value && product.available);
}

export function isWebsiteProductId(value: unknown): value is WebsiteProductId {
  return isWebsiteProductAvailable(value);
}

export function isLeadSource(value: unknown): value is LeadSource {
  return value === "home" || value === "formats" || value === "service" || value === "unknown";
}
