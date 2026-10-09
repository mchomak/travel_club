import Image from "next/image";
import styles from "./playground.module.css";
import { createPreviewVariables } from "./tokens";
import type { DestinationTheme, FrameRole, PlaygroundState } from "./tokens";

type GalleryFrameRole = Exclude<FrameRole, "hero">;
type PreviewPhoto = { src: string; alt: string };

const destinationCopy: Record<DestinationTheme, {
  title: string;
  city: string;
  routeContext: string;
  route: string;
  coordinates: string;
  heroSrc: string;
  secondarySrc: string;
  heroAlt: string;
  secondaryAlt: string;
  secondaryCaption: string;
  framePhotos: Record<GalleryFrameRole, PreviewPhoto>;
}> = {
  tc: {
    title: "TRAVEL CLUB",
    city: "ПУТЕШЕСТВИЯ В КОМПАНИИ",
    routeContext: "FIELD NOTE / 2026",
    route: "ДРУЗЬЯ · ДОРОГА · ОБЩИЕ ИСТОРИИ",
    coordinates: "FIELD NOTE 01 · TRAVEL CLUB",
    heroSrc: "/test/memory-dinner.jpg",
    secondarySrc: "/test/club-evening.jpg",
    heroAlt: "Друзья разговаривают за ужином при свете свечей",
    secondaryAlt: "Непринуждённый вечерний разговор друзей за столом под тёплым светом ламп",
    secondaryCaption: "РАЗГОВОРЫ ПОСЛЕ ДОЛГОГО ДНЯ",
    framePhotos: {
      landscape: { src: "/test/memory-dinner.jpg", alt: "Друзья разговаривают за ужином при свете свечей" },
      editorialLarge: { src: "/test/club-evening.jpg", alt: "Вечерний разговор друзей за столом" },
      editorialSmall: { src: "/test/memory-dinner.jpg", alt: "Друзья за ужином" },
      portrait: { src: "/test/club-evening.jpg", alt: "Друзья проводят вечер вместе" },
      square: { src: "/test/memory-dinner.jpg", alt: "Разговор за общим столом" },
    },
  },
  china: {
    title: "CHINA ’26",
    city: "ПЕКИН · КИТАЙ",
    routeContext: "ХАНЧЖОУ · КИТАЙ",
    route: "ПЕКИН — ХАНЧЖОУ — ШАНХАЙ",
    coordinates: "39°54′ N / 116°24′ E · ПЕКИН",
    heroSrc: "/test_4/beijing-hutong.jpg",
    secondarySrc: "/test/shanghai-street.jpg",
    heroAlt: "Улица старого Пекина",
    secondaryAlt: "Уличное движение на перекрёстке в Шанхае",
    secondaryCaption: "ШАНХАЙ / ДРУГОЙ РИТМ ГОРОДА",
    framePhotos: {
      landscape: { src: "/test/shanghai-dumplings.jpg", alt: "Сяолунбао в бамбуковой пароварке, шанхайская кухня" },
      editorialLarge: { src: "/test/shanghai-evening.jpg", alt: "Пешеходы на шанхайской улице вечером" },
      editorialSmall: { src: "/test/shanghai-street.jpg", alt: "Уличное движение на перекрёстке в Шанхае" },
      portrait: { src: "/test_4/beijing-hutong.jpg", alt: "Традиционный переулок Пекина" },
      square: { src: "/test/shanghai-night.jpg", alt: "Вечерняя улица Нанкин-роуд в Шанхае" },
    },
  },
  thailand: {
    title: "THAILAND ’26",
    city: "БАНГКОК · ТАИЛАНД",
    routeContext: "ЧИАНГМАЙ · ТАИЛАНД",
    route: "БАНГКОК — ЧИАНГМАЙ — ОСТРОВА",
    coordinates: "13°45′ N / 100°30′ E · БАНГКОК",
    heroSrc: "/test_4/bangkok-night.jpg",
    secondarySrc: "/test_4/thailand-boat.jpg",
    heroAlt: "Вечерняя улица Бангкока",
    secondaryAlt: "Деревянная лодка у известняковых скал Таиланда",
    secondaryCaption: "ОСТРОВА / ПОСЛЕ ГОРОДА",
    framePhotos: {
      landscape: { src: "/test_4/thailand-boat.jpg", alt: "Деревянная лодка у известняковых скал Таиланда" },
      editorialLarge: { src: "/test_4/bangkok-night.jpg", alt: "Люди и огни вечерней улицы Бангкока" },
      editorialSmall: { src: "/test_4/thailand-islands.jpg", alt: "Известняковые острова Таиланда в солнечном свете" },
      portrait: { src: "/test_4/thailand-road.jpg", alt: "Дорога под густой зелёной кроной в Таиланде" },
      square: { src: "/test_4/bangkok-food.jpg", alt: "Уличная кухня Бангкока" },
    },
  },
  madagascar: {
    title: "MADAGASCAR ’26",
    city: "МОРОНДАВА · МАДАГАСКАР",
    routeContext: "НОСИ-БЕ · МАДАГАСКАР",
    route: "АНТАНАНАРИВУ — МОРОНДАВА — НОСИ-БЕ",
    coordinates: "20°17′ S / 44°17′ E · МОРОНДАВА",
    heroSrc: "/test_4/madagascar-baobabs.jpg",
    secondarySrc: "/test_4/madagascar-lemur.jpg",
    heroAlt: "Баобабы на Мадагаскаре",
    secondaryAlt: "Лемур среди зелени на Мадагаскаре",
    secondaryCaption: "ДИКАЯ ПРИРОДА / МАДАГАСКАР",
    framePhotos: {
      landscape: { src: "/test_4/madagascar-sunset.jpg", alt: "Баобабы на Мадагаскаре в вечернем свете" },
      editorialLarge: { src: "/test_4/madagascar-baobabs.jpg", alt: "Баобабы и песчаная дорога на Мадагаскаре" },
      editorialSmall: { src: "/test_4/madagascar-lemur.jpg", alt: "Лемур среди зелени на Мадагаскаре" },
      portrait: { src: "/test_4/madagascar-baobabs.jpg", alt: "Баобабы вдоль дороги на Мадагаскаре" },
      square: { src: "/test_4/madagascar-lemur.jpg", alt: "Лемур на Мадагаскаре" },
    },
  },
};

const frameOrder: GalleryFrameRole[] = ["landscape", "editorialLarge", "editorialSmall", "portrait", "square"];

export default function PlaygroundPreview({ state, canvasWidth }: { state: PlaygroundState; canvasWidth: number }) {
  const { frames, layout } = state.tokens;
  const destination = destinationCopy[state.theme];
  return (
    <article
      className={styles.preview}
      role="region"
      aria-label="Live preview"
      data-testid="preview-canvas"
      style={{ ...createPreviewVariables(state), width: `${canvasWidth}px` }}
    >
      {state.showGrid && (
        <div
          className={styles.gridOverlay}
          aria-hidden="true"
          data-testid="grid-overlay"
          style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`, columnGap: `${layout.columnGutter}px` }}
        >
          {Array.from({ length: layout.columns }, (_, index) => <span key={index} />)}
        </div>
      )}
      <div className={styles.previewPage} data-testid="preview-page">
        <header className={styles.previewMasthead}>
          <p className={`${styles.roleDisplayXL} ${styles.mastheadText}`} data-testid="display-xl">TRAVEL CLUB</p>
          <div className={styles.mastheadRule}>
            <span className={styles.roleMetadata}>FIELD NOTES / 2026</span>
            <span className={styles.roleMetadata}>ПУТЕШЕСТВИЯ В КОМПАНИИ</span>
          </div>
        </header>

        <section className={styles.previewIntro}>
          <div className={styles.introMeta}>
            <span className={styles.roleMetadata} data-testid="theme-title">01 / {destination.title}</span>
            <span className={styles.roleMetadata} data-testid="theme-city">{destination.city}</span>
            <span className={styles.roleMetadata} data-testid="theme-route-context">{destination.routeContext}</span>
          </div>
          <h1 className={styles.roleH1} data-testid="role-h1">
            Куда — важно. <span className={styles.serifPhrase}>С кем — важнее.</span>
          </h1>
          <p className={styles.roleLead}>
            Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ.
          </p>
        </section>

        <figure className={styles.heroFigure}>
          <div className={styles.heroFrame} data-testid="frame-hero" style={{ aspectRatio: frames.hero.aspectRatio }}>
            <Image src={destination.heroSrc} alt={destination.heroAlt} fill sizes="(max-width: 760px) 100vw, 1440px" priority loading="eager" />
          </div>
          <figcaption className={styles.roleCaption}>
            <span data-testid="theme-route">{destination.route}</span>
            <span data-testid="theme-coordinates">{destination.coordinates}</span>
          </figcaption>
        </figure>

        <section className={styles.issueSection}>
          <div className={styles.issueHeading}>
            <span className={styles.roleMetadata}>СЛЕДУЮЩИЙ ВЫПУСК / 01</span>
            <p className={styles.roleDisplayL} data-testid="display-l">{destination.title}</p>
            <span className={styles.roleMetadata}>2026</span>
          </div>
          <div className={styles.issueGrid}>
            <div>
              <span className={styles.sectionIndex}>01 — МАРШРУТ</span>
              <h2 className={styles.roleH2}>Города разные. <span className={styles.serifStatement}>Люди — свои.</span></h2>
              <p className={styles.roleBody}>
                Небольшая группа, общий маршрут и сопровождающий. Мы оставляем в поездке место для разговоров и случайных поворотов.
              </p>
            </div>
            <figure className={styles.smallFigure}>
              <div className={styles.smallFrame} data-testid="frame-editorial-large" style={{ aspectRatio: frames.editorialLarge.aspectRatio }}>
                <Image src={destination.secondarySrc} alt={destination.secondaryAlt} fill sizes="(max-width: 760px) 70vw, 420px" loading="eager" />
              </div>
              <figcaption className={styles.roleCaption} data-testid="theme-secondary-caption">{destination.secondaryCaption}</figcaption>
            </figure>
          </div>

          <div className={styles.productList}>
            <article className={styles.productItem}>
              <span className={styles.productNumber}>01</span>
              <div><span className={styles.roleMetadata}>МАРШРУТ</span><p className={styles.roleH2}>Мы продумываем.<br />Вы путешествуете самостоятельно.</p></div>
              <span className={styles.productArrow} aria-hidden="true">→</span>
            </article>
            <article className={styles.productItem}>
              <span className={styles.productNumber}>02</span>
              <div><span className={styles.roleMetadata}>ПОД КЛЮЧ</span><p className={styles.roleBody}>Берём на себя организацию деталей и заботу о поездке.</p></div>
              <span className={styles.productArrow} aria-hidden="true">↗</span>
            </article>
            <article className={styles.productItem}>
              <span className={styles.productNumber}>03</span>
              <div><span className={styles.roleMetadata}>В КОМПАНИИ</span><p className={styles.roleBody}>Едем небольшой группой, чтобы делить впечатления.</p></div>
              <span className={styles.productArrow} aria-hidden="true">↗</span>
            </article>
          </div>

          <p className={styles.roleH3}>Меньше точек. Больше жизни.</p>
          <p className={styles.roleBodySmall}>Продуманные редакцией Travel Club.</p>

          <section className={styles.frameGallery} aria-label="Image frame examples">
            <div className={styles.frameGalleryHeading}>
              <span className={styles.roleMetadata}>IMAGES / FRAMES</span>
              <span className={styles.roleCaption}>OBJECT-FIT: COVER · FIXED RATIO</span>
            </div>
            <div className={styles.frameGrid}>
              {frameOrder.map((role) => (
                <figure className={styles.frameCard} key={role}>
                  <div className={styles.frameThumb} data-testid={`frame-${role}`} style={{ aspectRatio: frames[role].aspectRatio }}>
                    <Image src={destination.framePhotos[role].src} alt={destination.framePhotos[role].alt} fill sizes="(max-width: 760px) 50vw, 320px" loading="eager" />
                  </div>
                  <figcaption><span>{role.replace(/([A-Z])/g, " $1")}</span><span>{frames[role].aspectRatio.toFixed(2)} : 1</span></figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className={styles.formPreview} id="preview-story">
            <div className={styles.formIntro}>
              <span className={styles.roleMetadata}>FIELD NOTE / 2026</span>
              <h2 className={styles.roleH2}>Расскажите, что вам близко.</h2>
              <p className={styles.roleBodySmall}>Небольшая форма, чтобы начать разговор о поездке.</p>
            </div>
            <form className={styles.demoForm} onSubmit={(event) => event.preventDefault()}>
              <label>Ваше имя<input type="text" name="name" placeholder="Как к вам обращаться" /></label>
              <label>Формат поездки<select name="format" defaultValue="group"><option value="group">В компании</option><option value="custom">Индивидуальный маршрут</option></select></label>
              <label className={styles.formWide}>О пожеланиях<textarea name="note" placeholder="Место, сезон, ритм" rows={2} /></label>
              <label>Пример focus<input className={styles.focusExample} type="text" aria-label="Пример focus" readOnly value="Поле в фокусе" /></label>
              <label>Disabled<input type="text" aria-label="Disabled field example" disabled placeholder="Недоступно" /></label>
              <label className={styles.formWide}>Validation example<input type="email" aria-label="Email with error" aria-invalid="true" aria-describedby="email-error" readOnly value="mail@" /><small className={styles.errorText} id="email-error">Укажите полный адрес почты.</small></label>
              <button className={styles.roleButton} type="submit">Обсудить поездку <span aria-hidden="true">→</span></button>
            </form>
          </section>

          <div className={styles.previewFooter}>
            <span className={styles.roleMetadata}>FIELD NOTES / TRAVEL CLUB / 2026</span>
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
