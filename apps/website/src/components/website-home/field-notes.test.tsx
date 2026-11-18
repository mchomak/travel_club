import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { FieldNote } from "./field-notes";
import photos from "./field-notes-photos.json";
import content from "./field-notes-content.json";

const editor = vi.hoisted(() => ({
  photos: { "archive-china": "blob:stored-china", "thailand-company": "blob:stored-thailand" } as Record<string, string>,
  openMenu: vi.fn(),
}));
vi.mock("./image-editor", () => ({ useImageEditor: () => editor }));
afterEach(() => { cleanup(); editor.openMenu.mockClear(); });

it("retains photo overrides and opens the editor for every China chapter", () => {
  const { container, getByRole } = render(<FieldNote country={0} />);
  const nav = getByRole("navigation", { name: /Главы CHINA/i });
  const chapters = [
    ["Обложка", "archive-china", "china.shanghai.panorama"],
    ["Монголия", "china-company", "china.mongolia.new_year"],
    ["Пекин", "china-beijing", "china.beijing.hutong"],
    ["Шанхай", "archive-china", "china.shanghai.panorama"],
    ["Сучжоу", "china-suzhou", "china.suzhou.canals"],
    ["Санья", "china-sanya", "china.hainan.sea"],
  ];
  for (const [label, slot, asset] of chapters) {
    fireEvent.click(within(nav).getByRole("button", { name: new RegExp(label, "i") }));
    const figure = container.querySelector(`[data-position="active"] [data-asset-id="${asset}"]`) as HTMLElement;
    expect(figure).not.toBeNull();
    const button = within(figure).getByRole("button", { name: /Заменить фото/i });
    fireEvent.click(button);
    expect(editor.openMenu).toHaveBeenLastCalledWith(slot, expect.any(Number), expect.any(Number), button);
  }
});

it("preserves each homepage China chapter and its conclusion", () => {
  const { container, getByRole } = render(<FieldNote country={0} />);
  const nav = getByRole("navigation", { name: /Главы CHINA/i });
  const labels = [/Обложка/i, /Монголия/i, /Пекин/i, /Шанхай/i, /Сучжоу/i, /Санья/i];
  expect(within(nav).getAllByRole("button")).toHaveLength(6);
  labels.forEach((label, index) => {
    fireEvent.click(within(nav).getByRole("button", { name: label }));
    const activeCopy = container.querySelector('[data-position="active"] h3')?.parentElement as HTMLElement;
    expect(within(activeCopy).getByRole("heading", { name: content[0][index].title })).toBeInTheDocument();
    for (const paragraph of content[0][index].paragraphs) {
      expect(within(activeCopy).getByText(paragraph, { exact: true })).toBeInTheDocument();
    }
    if (index === 0) {
      expect(within(activeCopy).getByText("Внутренняя Монголия → Пекин → Шанхай → Сучжоу → Санья")).toBeInTheDocument();
    }
    if (index === 5) {
      expect(within(activeCopy).getByText("От семейного Нового года во Внутренней Монголии до февральского моря на Хайнане — эту поездку мы запомним прежде всего людьми, которые открыли нам свою страну.")).toBeInTheDocument();
    }
  });
});

it("renders each China stock image and its description", () => {
  const stock = [
    ["Монголия", "china.mongolia.new_year"], ["Пекин", "china.beijing.hutong"],
    ["Шанхай", "china.shanghai.panorama"], ["Сучжоу", "china.suzhou.canals"],
    ["Санья", "china.hainan.sea"],
  ] as const;
  const savedShanghai = editor.photos["archive-china"];
  delete editor.photos["archive-china"];
  try {
    const { container, getByRole } = render(<FieldNote country={0} />);
    const nav = getByRole("navigation", { name: /Главы CHINA/i });
    for (const [label, id] of stock) {
      fireEvent.click(within(nav).getByRole("button", { name: new RegExp(label, "i") }));
      const photo = photos[id];
      expect(existsSync(join(process.cwd(), "public", photo.src!.slice(1)))).toBe(true);
      expect(container.querySelector(`[data-position="active"] [data-asset-id="${id}"] img`)).toHaveAttribute("alt", photo.alt);
      expect(within(container.querySelector(`[data-position="active"] [data-asset-id="${id}"]`) as HTMLElement).getByText(/иллюстративное фото/i)).toBeInTheDocument();
    }
  } finally { editor.photos["archive-china"] = savedShanghai; }
});
