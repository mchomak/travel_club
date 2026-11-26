import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import EventPlaygroundPage from "./page";

const notFound = vi.hoisted(() => vi.fn((): never => { throw new Error("not found"); }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/components/event-playground/event-playground", () => ({ EventPlayground: () => <div>Playground</div> }));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); notFound.mockClear(); });

test("renders the playground in development", () => {
  vi.stubEnv("NODE_ENV", "development");
  render(EventPlaygroundPage());
  expect(screen.getByText("Playground")).toBeInTheDocument();
  expect(notFound).not.toHaveBeenCalled();
});

test("returns not found outside development", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(() => EventPlaygroundPage()).toThrow("not found");
  expect(notFound).toHaveBeenCalledOnce();
});
