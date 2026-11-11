import { ChangePasswordForm } from "./change-password-form";

export default function AccountPage() {
  return <section className="mx-auto max-w-2xl">
    <header className="page-heading">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Кабинет</p>
        <h1>Аккаунт</h1>
        <p>Обновите пароль, чтобы сохранить доступ к кабинету.</p>
      </div>
    </header>
    <div className="rounded-xl border border-line bg-paper p-5 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Сменить пароль</h2>
        <p className="mt-2 text-sm text-muted">Подтвердите текущий пароль и задайте новый.</p>
      </div>
      <ChangePasswordForm />
    </div>
  </section>;
}
