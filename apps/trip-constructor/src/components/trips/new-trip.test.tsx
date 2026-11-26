import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewTrip } from "./new-trip";
import { tripApi } from "@/lib/trips";
import type { TripDocument } from "@/lib/contracts";
const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); navigation.replace.mockReset(); });
test("clearing the title after cancelling navigation removes the unload warning", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const user = userEvent.setup();
  render(<NewTrip />);
  const title = screen.getByLabelText("Название поездки", { exact: true });
  const warns = () => !window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
  expect(warns()).toBe(false);
  await user.type(title, "Test trip");
  await waitFor(() => expect(warns()).toBe(true));
  await user.click(screen.getByRole("link", { name: "Все поездки" }));
  await user.clear(title);
  await waitFor(() => expect(warns()).toBe(false));
  await user.click(screen.getByText("Дополнительные параметры"));
  const cover = screen.getByRole("combobox", { name: "Фото обложки" });
  await user.selectOptions(cover, "tropical-coast");
  await waitFor(() => expect(warns()).toBe(true));
  await user.selectOptions(cover, "");
  await waitFor(() => expect(warns()).toBe(false));
});
test("creates a trip with an explicitly chosen cover photo", async () => {
  const create = vi.spyOn(tripApi, "create").mockResolvedValue({ id: "created" } as TripDocument);
  const user = userEvent.setup(); render(<NewTrip />);
  await user.type(screen.getByLabelText("Название поездки"), "Поездка");
  await user.click(screen.getByText("Дополнительные параметры"));
  const cover = screen.getByRole("combobox", { name: "Фото обложки" });
  expect(cover).toHaveValue("");
  await user.selectOptions(cover, "tropical-coast");
  await user.click(screen.getByRole("button", { name: "Создать поездку" }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
    cover_photo_id: "tropical-coast",
  })));
});
test("basic creation hides advanced fields, always creates a draft and resumes at transport", async () => {
  const create = vi.spyOn(tripApi, "create").mockResolvedValue({ id: "created" } as TripDocument);
  const user = userEvent.setup(); render(<NewTrip />);
  expect(screen.queryByLabelText("Статус")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Название для клиента", { exact: false })).not.toBeVisible();
  await user.type(screen.getByLabelText("Название поездки"), "Япония");
  await user.click(screen.getByRole("button", { name: "Создать поездку" }));
  await waitFor(() => expect(create).toHaveBeenCalledOnce());
  expect(create.mock.calls[0][0]).toMatchObject({ status: "draft", internal_title: "Япония" });
  expect(navigation.replace).toHaveBeenCalledWith("/admin/trips/created/builder?step=2");
});
