"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { authApi } from "@/lib/api";

const PASSWORD_LENGTH_ERROR = "Новый пароль должен содержать от 12 до 1024 символов.";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const length = Array.from(newPassword).length;
    if (length < 12 || length > 1024) {
      setError(PASSWORD_LENGTH_ERROR);
      setSuccess("");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Пароль успешно изменён.");
    } catch (cause) {
      setCurrentPassword("");
      setError(cause instanceof Error ? cause.message : "Не удалось сменить пароль. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-5">
    <div>
      <label htmlFor="current-password" className="mb-2 block font-medium">Текущий пароль</label>
      <input
        id="current-password"
        name="current_password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={2048}
        value={currentPassword}
        disabled={pending}
        onChange={event => {
          setCurrentPassword(event.target.value);
          setError("");
          setSuccess("");
        }}
      />
    </div>
    <div>
      <label htmlFor="new-password" className="mb-2 block font-medium">Новый пароль</label>
      <input
        id="new-password"
        name="new_password"
        type="password"
        autoComplete="new-password"
        aria-describedby="new-password-hint"
        required
        maxLength={2048}
        value={newPassword}
        disabled={pending}
        onChange={event => {
          setNewPassword(event.target.value);
          setError("");
          setSuccess("");
        }}
      />
      <p id="new-password-hint" className="field-hint mt-2 text-sm text-muted">От 12 до 1024 символов.</p>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">{success}</p>}
    <button type="submit" className="primary-button w-full" disabled={pending}>
      <KeyRound size={18} aria-hidden />{pending ? "Меняем пароль…" : "Сменить пароль"}
    </button>
  </form>;
}
