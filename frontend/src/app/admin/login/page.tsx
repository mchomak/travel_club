import Link from "next/link";
import { Compass } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { safeAuthReturnTarget } from "@/lib/return-target";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <main className="grid min-h-dvh lg:grid-cols-[.9fr_1.1fr]">
    <section className="flex flex-col justify-between bg-accent p-7 text-white lg:p-14">
      <Link href="/" className="flex w-fit items-center gap-3 text-xl font-semibold"><Compass size={29} aria-hidden />Travel Club</Link>
      <div className="max-w-lg py-10 lg:py-24"><h1 className="text-3xl leading-tight font-medium lg:text-5xl">Каждая поездка<br />начинается с плана.</h1>
        <p className="mt-6 max-w-sm text-base leading-7 text-green-100/90">Рабочее пространство для маршрутов, деталей и заботы о путешественниках.</p></div>
      <p className="hidden text-sm text-green-100/80 lg:block">Внутренний кабинет команды</p>
    </section>
    <section className="flex items-center justify-center p-7 sm:p-12">
      <div className="w-full max-w-sm"><h2 className="text-3xl font-semibold tracking-tight">С возвращением</h2>
        <p className="mt-3 mb-9 text-muted">Войдите, чтобы продолжить работу с поездками.</p>
        <LoginForm next={safeAuthReturnTarget(next)} />
        <p className="mt-7 text-sm text-muted">Доступ открыт только команде Travel Club. Если не получается войти, обратитесь к администратору.</p>
      </div>
    </section>
  </main>;
}
