"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { safeAuthReturnTarget } from "@/lib/return-target";
import styles from "./login-form.module.css";

export function LoginForm({ next = "/research" }: { next?: string }) {
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
      router.replace(safeAuthReturnTarget(next, "/research"));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось войти. Попробуйте ещё раз.");
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} className={styles.form} aria-describedby={error ? "login-error" : undefined}>
    <label className={styles.label} htmlFor="login">Логин
      <input className={styles.input} id="login" name="login" autoComplete="username" required maxLength={120}
        value={login} onChange={event => setLogin(event.target.value)} />
    </label>
    <label className={styles.label} htmlFor="password">Пароль
      <span className={styles.password}><input className={styles.input} id="password" name="password" type={visible ? "text" : "password"}
        autoComplete="current-password" required maxLength={1024} value={password} onChange={event => setPassword(event.target.value)} />
        <button type="button" className={styles.toggle} aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>
    </label>
    {error && <p id="login-error" role="alert" className={styles.error}>{error}</p>}
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Входим…" : <>Войти в исследования <ArrowRight size={18} aria-hidden /></>}
    </button>
  </form>;
}
