import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/server-auth";
import styles from "@/components/research/research.module.css";
import { ResearchHistoryTracker } from "@/components/research/history-tracker";

export default async function ResearchLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const constructorOrigin = (process.env.NEXT_PUBLIC_CONSTRUCTOR_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:3101" : "")).replace(/\/$/, "");
  return <>
    <ResearchHistoryTracker />
    <div className={styles.root}>
    <header className={styles.shell}>
      <nav className={styles.topbar} aria-label="TC Research">
        <Link className={styles.brand} href="/research"><span className={styles.brandMark}>TC</span>TC Research</Link>
        <div className={styles.topLinks}><Link className={styles.topLink} href="/research">Респонденты</Link><a className={styles.topLink} href={`${constructorOrigin}/home`}>Главная</a><a className={styles.topLink} href={`${constructorOrigin}/admin/trips`}><ArrowLeft size={15} aria-hidden /> Travel Club</a></div>
      </nav>
    </header>
    <main className={styles.shell}>{children}</main>
    </div>
  </>;
}
