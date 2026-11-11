import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { safeAuthReturnTarget } from "@/lib/return-target";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Вход — TC Research", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <main className={styles.page}>
    <section className={styles.panel} aria-labelledby="login-title">
      <p className={styles.eyebrow}>TRAVEL CLUB · RESEARCH</p>
      <h1 id="login-title">Исследования начинаются с разговора.</h1>
      <p className={styles.description}>Закрытое пространство команды для работы с респондентами и интервью.</p>
      <LoginForm next={safeAuthReturnTarget(next, "/research")} />
      <p className={styles.note}>Доступ открыт только команде Travel Club. Если не получается войти, обратитесь к администратору.</p>
    </section>
  </main>;
}
