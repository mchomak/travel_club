"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    try {
      await authApi.login(login, password);
      router.replace("/admin/trips");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось войти. Попробуйте ещё раз.");
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} className="space-y-6" aria-describedby={error ? "login-error" : undefined}>
    <div><label htmlFor="login" className="mb-2 block font-medium">Логин</label>
      <input id="login" name="login" autoComplete="username" required maxLength={120}
        value={login} onChange={event => setLogin(event.target.value)} /></div>
    <div><label htmlFor="password" className="mb-2 block font-medium">Пароль</label>
      <div className="relative"><input id="password" name="password" type={visible ? "text" : "password"}
        autoComplete="current-password" required maxLength={1024} className="pr-14"
        value={password} onChange={event => setPassword(event.target.value)} />
        <button type="button" className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button></div></div>
    {error && <p id="login-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <button type="submit" className="primary-button w-full" disabled={pending}>
      {pending ? "Входим…" : <>Войти в кабинет <ArrowRight size={18} aria-hidden /></>}
    </button>
  </form>;
}
