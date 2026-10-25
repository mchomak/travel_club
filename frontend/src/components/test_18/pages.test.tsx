import { describe, expect, it } from "vitest";
import { parsePageValues } from "./page-data";
import { renderToStaticMarkup } from "react-dom/server";
import { MagazineCover, MagazineSpread } from "../test_13/spreads";
import { PocketPage } from "./pages";

function documentOf(markup: string) {
  return new DOMParser().parseFromString(markup, "text/html");
}

function textNodes(document: Document) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const values: string[] = [];
  while (walker.nextNode()) {
    const value = walker.currentNode.textContent?.replace(/\s+/g, " ").trim();
    if (value) values.push(value);
  }
  return values;
}

function images(document: Document) {
  return [...new Set([...document.querySelectorAll("img")].map(image => `${image.getAttribute("src")}|${image.getAttribute("alt")}`))].sort();
}

describe("pocket publication query", () => {
  it("accepts exactly one decimal page in the finite edition", () => {
    expect(parsePageValues("15")).toBe(15);
    expect(parsePageValues("2")).toBe(2);
    for (const value of [undefined, "", "0", "16", "-2", "1.5", "2e0", "02", " 2", "2 ", "NaN", ["2"], ["2", "3"]]) {
      expect(parsePageValues(value)).toBe(1);
    }
  });
});

describe("pocket publication content", () => {
  it("preserves every source leaf's actual text nodes, unique images and destinations", () => {
    for (let page = 1; page <= 15; page++) {
      const source = documentOf(renderToStaticMarkup(page === 1 ? <MagazineCover /> : <MagazineSpread index={Math.floor((page - 2) / 2)} side={page % 2 === 0 ? "left" : "right"} />));
      const pocket = documentOf(renderToStaticMarkup(<PocketPage page={page} />));
      expect(pocket.querySelectorAll("article"), `page ${page}: current article`).toHaveLength(1);
      expect(pocket.querySelectorAll("h1[data-reader-heading][tabindex='-1']"), `page ${page}: focus heading`).toHaveLength(1);
      for (const text of textNodes(source)) expect(textNodes(pocket), `page ${page}: ${text}`).toContain(text);
      expect(images(pocket), `page ${page}: images`).toEqual(images(source));
      expect([...pocket.querySelectorAll("a")].map(link => link.getAttribute("href")).sort(), `page ${page}: destinations`).toEqual([...source.querySelectorAll("a")].map(link => link.getAttribute("href")).sort());
    }
  });
});
