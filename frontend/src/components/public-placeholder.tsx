export function PublicPlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="max-w-2xl"><p className="mb-5 text-sm text-muted">Скоро в Travel Club</p><h1 className="text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1><p className="mt-7 text-lg leading-8 text-muted">{description}</p></section>;
}
