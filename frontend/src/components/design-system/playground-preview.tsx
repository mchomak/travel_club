import Image from "next/image";
import styles from "./playground.module.css";
import { createPreviewVariables } from "./tokens";
import type { PlaygroundState } from "./tokens";

export default function PlaygroundPreview({ state }: { state: PlaygroundState }) {
  const { frames } = state.tokens;
  return (
    <article
      className={styles.preview}
      role="region"
      aria-label="Live preview"
      style={createPreviewVariables(state)}
    >
      <div className={styles.previewPage}>
        <header className={styles.previewMasthead}>
          <p className={`${styles.roleDisplayXL} ${styles.mastheadText}`}>TRAVEL CLUB</p>
          <div className={styles.mastheadRule}>
            <span className={styles.roleMetadata}>FIELD NOTES / 2026</span>
            <span className={styles.roleMetadata}>ПУТЕШЕСТВИЯ В КОМПАНИИ</span>
          </div>
        </header>

        <section className={styles.previewIntro}>
          <div className={styles.introMeta}>
            <span className={styles.roleMetadata}>01 / THAILAND ’26</span>
            <span className={styles.roleMetadata}>БАНГКОК · ТАИЛАНД</span>
          </div>
          <h1 className={styles.roleH1}>
            Куда — важно. <span className={styles.serifPhrase}>С кем — важнее.</span>
          </h1>
          <p className={styles.roleLead}>
            Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ.
          </p>
        </section>

        <figure className={styles.heroFigure}>
          <div className={styles.heroFrame}>
            <Image src={frames.hero.src} alt={frames.hero.alt} fill sizes="(max-width: 760px) 100vw, 900px" priority />
          </div>
          <figcaption className={styles.roleCaption}>
            <span>БАНГКОК / ПОСЛЕ ЗАКАТА</span>
            <span>13°45′ с. ш. / 100°30′ в. д.</span>
          </figcaption>
        </figure>

        <section className={styles.issueSection}>
          <div className={styles.issueHeading}>
            <span className={styles.roleMetadata}>СЛЕДУЮЩИЙ ВЫПУСК / 01</span>
            <p className={styles.roleDisplayL}>THAILAND ’26</p>
          </div>
          <div className={styles.issueGrid}>
            <div>
              <h2 className={styles.roleH2}>Города разные. <span className={styles.serifStatement}>Люди — свои.</span></h2>
              <p className={styles.roleBody}>
                Небольшая группа, общий маршрут и сопровождающий. Мы оставляем в поездке место для разговоров и случайных поворотов.
              </p>
            </div>
            <figure className={styles.smallFigure}>
              <div className={styles.smallFrame}>
                <Image src={frames.editorialLarge.src} alt={frames.editorialLarge.alt} fill sizes="(max-width: 760px) 70vw, 320px" />
              </div>
              <figcaption className={styles.roleCaption}>ГОРОД ПОСЛЕ ЗАКАТА / НА ПОЛЯХ ВЫПУСКА</figcaption>
            </figure>
          </div>
          <p className={styles.roleH3}>Меньше точек. Больше жизни.</p>
          <p className={styles.roleBodySmall}>Продуманные редакцией Travel Club.</p>
          <div className={styles.previewFooter}>
            <span className={styles.roleMetadata}>FIELD NOTE / 2026</span>
            <a className={styles.previewLink} href="#preview-story">
              <span className={styles.roleButton}>Обсудить поездку</span>
              <span className={styles.arrowMark} aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </article>
  );
}
