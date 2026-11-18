import Image from "next/image";
import { useState } from "react";
import { FieldNotesCarouselCore } from "@/app/test_1/field-notes-carousel";
import type { CSSProperties } from "react";
import { useImageEditor } from "./image-editor";
import { EditorialSymbol } from "./editorial-symbol";
import editorStyles from "./image-editor.module.css";
import content from "./field-notes-content.json";
import photos from "./field-notes-photos.json";
import s from "./concept.module.css";
import f from "./field-notes.module.css";

type Photo = { id: string; ratio: string; caption: string; src: string | null; alt: string; objectPosition: string; temporary: boolean; attribution: string | null; sourceUrl: string | null };
type Chapter = { id: string; title: string; eyebrow: string; paragraphs: string[]; photos: { id: string }[] };
const manifest: Record<string, Photo> = photos;
const legacySlots: Record<string, string> = {
  "china.shanghai.panorama": "archive-china", "china.beijing.hutong": "china-beijing",
  "china.suzhou.canals": "china-suzhou", "china.hainan.sea": "china-sanya",
  "china.mongolia.new_year": "china-company", "madagascar.hero.baobabs": "archive-madagascar",
  "thailand.samui.hero": "thailand-islands", "thailand.samui.evening": "thailand-company",
  "thailand.samui.beach": "thailand-boat",
};
const routes = [
  "Внутренняя Монголия → Пекин → Шанхай → Сучжоу → Санья",
  "Пекин → Бангкок → юг Таиланда → Самуи → Пханган → Бангкок → Шанхай",
  "Антананариву → Анцирабе → западное побережье → горы / Фианаранцуа → восточное побережье → Сент-Мари → Антананариву",
];
const stops = ["Антананариву — начало пути", "Анцирабе — центральные районы", "Западное побережье — баобабы и Мозамбикский пролив", "Горы и Фианаранцуа", "Восточное побережье — путь на лодках", "Сент-Мари — остров и его история", "Возвращение в Антананариву"];

function Figure({ id, priority = false }: { id: string; priority?: boolean }) {
  const [editShown, setEditShown] = useState(false);
  const editor = useImageEditor();
  const photo = manifest[id];
  if (!photo) return null;
  const slot = legacySlots[id];
  const replacement = slot ? editor.photos[slot] : undefined;
  const source = replacement ?? photo.src;
  const chinaPlaceholder: Record<string, string> = { "china.mongolia.new_year": "Семейный стол в новогодний вечер · 4:3 · 1600×1200", "china.shanghai.panorama": "Огни ночного Шанхая · 16:9 · 1920×1080", "china.suzhou.canals": "Каналы и мосты Сучжоу · 16:9 · 1600×900", "china.hainan.sea": "Море у берегов Саньи · 21:9 или 16:9 · 2400×1100" };
  const chinaEmpty = id.startsWith("china.") && !source;
  return <figure className={`${f.figure} ${chinaEmpty ? f.chinaPlaceholder : ""}`} data-asset-id={id}>
    <div className={`${f.photo} ${slot ? editorStyles.frame : ""}`} style={chinaEmpty ? undefined : { aspectRatio: photo.ratio.replace(":", " / ") }} data-photo-slot={slot} data-edit-open={editShown} onContextMenu={slot ? event => { event.preventDefault(); const button = event.currentTarget.querySelector("button"); if (button) editor.openMenu(slot, event.clientX, event.clientY, button); } : undefined}>
      {source ? <Image src={source} alt={replacement ? "Фотография, добавленная пользователем" : photo.alt} fill sizes="(max-width: 768px) 92vw, 70vw" priority={priority} unoptimized={!!replacement} style={{ objectFit: "cover", objectPosition: replacement ? "center" : photo.objectPosition }} /> : <span aria-hidden="true">{chinaPlaceholder[id] ?? "FIELD NOTES / PHOTO"}</span>}
      {slot && <button type="button" className={editorStyles.imageTrigger} aria-label={editShown ? `Скрыть кнопку редактирования: ${photo.caption || id}` : `Показать кнопку редактирования: ${photo.caption || id}`} aria-pressed={editShown} onClick={() => setEditShown(shown => !shown)} />}
      {slot && <button type="button" className={editorStyles.editButton} aria-label={`Редактировать фото: ${photo.caption || id}`} onClick={event => { const box = event.currentTarget.getBoundingClientRect(); editor.openMenu(slot, box.right, box.bottom, event.currentTarget); }}>Фото <EditorialSymbol name="onward" /></button>}
    </div>
    <figcaption>{id.startsWith("china.") ? photo.caption : replacement ? "Фотография, добавленная пользователем" : photo.src ? photo.caption : "Место для авторской фотографии"}{id.startsWith("china.") && source && !replacement && photo.temporary && <span className={f.photoCredit}>Иллюстративное фото</span>}</figcaption>
  </figure>;
}

function Passport({ country }: { country: number }) {
  if (country === 0) return <div className={s.storyFooter}><a href="/archive">В архив путешествий →</a></div>;
  return <><dl className={f.passport}>
    <div><dt>Маршрут</dt><dd>{routes[country]}</dd></div>
    <div><dt>Год</dt><dd>{country === 1 ? "2026" : "2025"}</dd></div>
    <div><dt>Формат</dt><dd>{country === 2 ? "Кольцевое путешествие в компании опытных путешественников" : "Путешествие друзей"}</dd></div>
    {country !== 2 && <div><dt>Компания</dt><dd>{country === 0 ? "5 человек" : "4 человека"}</dd></div>}
  </dl><div className={s.storyFooter}><span>Поездки друзей, не коммерческие туры TC</span><a href="/archive">В архив путешествий →</a></div><p className={s.notice}>Фотографии временно иллюстративны и будут заменены кадрами поездки.</p></>;
}

function RouteDiagram() {
  return <div className={f.route} data-asset-id="madagascar.route.map"><div className={f.routeGraphic}><svg aria-hidden="true" viewBox="0 0 200 360" fill="none"><path d="M118 14C145 41 160 79 158 117C155 154 140 187 131 221C122 254 105 300 76 341C64 317 54 289 52 258C49 223 35 193 39 157C43 120 57 83 79 52C92 34 103 22 118 14Z" stroke="currentColor" strokeWidth="2"/><path d="M103 91L78 145L105 180L78 229L121 258L133 161L154 135" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"/></svg><span>СХЕМА МАРШРУТА / НЕ В МАСШТАБЕ</span></div><ol>{stops.map(stop => <li key={stop}>{stop}</li>)}</ol></div>;
}

function ChinaRoute() {
  return <nav className={f.chinaRoute} aria-label="Маршрут путешествия">
    <div className={f.chinaRouteHeading}><span>МАРШРУТ / 2025</span><span>С СЕВЕРА НА ЮГ</span></div>
    <div className={f.chinaRouteMap}>
      <svg viewBox="0 0 600 250" preserveAspectRatio="none" aria-hidden="true"><path d="M14 28 C95 28 110 80 160 80 S255 148 305 148 S425 208 475 208"/><path d="M305 148 C340 145 347 55 410 55" className={f.routeBranch}/></svg>
      <ol>
        <li className={f.stopMongolia}><a href="#cn-inner-mongolia"><span>01 </span>Внутренняя <br />Монголия</a></li>
        <li className={f.stopBeijing}><a href="#cn-beijing"><span>02 </span>Пекин</a></li>
        <li className={f.stopShanghai}><a href="#cn-shanghai"><span>03 </span>Шанхай</a></li>
        <li className={f.stopSuzhou}><a href="#cn-suzhou"><span>04 </span>Сучжоу <small>один день из Шанхая</small></a></li>
        <li className={f.stopSanya}><a href="#cn-hainan"><span>05 </span>Санья</a></li>
      </ol>
    </div>
  </nav>;
}

function ChapterView({ chapter, index, country }: { chapter: Chapter; index: number; country: number }) {
  const panorama = ["cn-shanghai", "cn-hainan", "th-road", "th-samui", "th-phangan", "mg-baobabs", "mg-boats", "mg-outro"].includes(chapter.id);
  const diptych = ["th-bangkok", "th-shanghai"].includes(chapter.id);
  const [first, ...rest] = chapter.photos;
  return <section className={`${f.chapter} ${panorama ? f.panoramic : ""}`} id={chapter.id} data-chapter={chapter.id}>
    {panorama && first && <Figure id={first.id} />}
    <div className={f.chapterGrid}>
      <div className={f.copy}>
        {country !== 0 && (chapter.eyebrow || chapter.id === "mg-route") && <p className={f.eyebrow}>{chapter.eyebrow || "01 / THE ROUTE"}</p>}
        {chapter.title && <h3>{chapter.title}</h3>}
        {chapter.id === "th-phangan" && <><p className={f.eyebrow}>FULL MOON PARTY / ПХАНГАН</p><div className={f.moons} aria-hidden="true"><i /><i /><i /><i /><i /></div></>}
        {chapter.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        {chapter.id === "mg-people" && <p className={f.pull}>Самые тёплые воспоминания не всегда помещаются на карте.</p>}
        {chapter.id === "th-beijing" && <p className={f.eyebrow}>BEIJING → BANGKOK → SOUTH</p>}
        {chapter.id === "mg-sainte-marie" && <p className={f.sidebar}>ИСТОРИЧЕСКАЯ ЗАМЕТКА / СЕНТ-МАРИ<br />Остров связан с историей пиратства в Индийском океане. Здесь сохранилось известное кладбище, которое часто называют Пиратским.</p>}
      </div>
      {!panorama && !diptych && first && <Figure id={first.id} />}
      {chapter.id === "mg-route" && <RouteDiagram />}
      {chapter.id === "mg-boats" && <div className={f.numbers}><div><strong>2 ДНЯ</strong></div><div><strong>9–11 ЧАСОВ</strong><p>Длительность отдельных лодочных переездов по рассказу</p></div></div>}
    </div>
    {(diptych ? chapter.photos : rest).length > 0 && <div className={f.gallery}>{(diptych ? chapter.photos : rest).map(photo => <Figure key={photo.id} id={photo.id} />)}</div>}
    {index === content[country].length - 1 && <Passport country={country} />}
  </section>;
}

function HomepageChina() {
  const editor = useImageEditor();
  const chapters: Chapter[] = content[0];
  return <FieldNotesCarouselCore country={0} editor={editor} chapterData={chapters.slice(0, 6)} photoData={manifest} ending={chapters[6].paragraphs} />;
}

export function FieldNote({ country }: { country: 0 | 1 | 2 }) {
  return country === 0 ? <HomepageChina /> : <StandardFieldNote country={country} />;
}

function StandardFieldNote({ country }: { country: 0 | 1 | 2 }) {
  const chapters: Chapter[] = content[country];
  const hero = chapters[0];
  const name = ["CHINA", "THAILAND", "MADAGASCAR"][country];
  const key = ["china", "thailand", "madagascar"][country];
  const mask = manifest["thailand.hero.mask"];
  const style = country === 1 && mask.src ? { "--field-note-mask-photo": `url("${mask.src}")`, "--field-note-mask-position": mask.objectPosition } as CSSProperties : undefined;
  return <section className={`${s[key]} ${country === 0 ? f.chinaStory : ""}`} id={`field-note-${key}`} data-design-section={key} aria-labelledby={`${key}-title`} style={style}>
    <div className={s.wrap}>
      <div className={s.sectionBar}><span>FIELD NOTES / {name} ’{country === 1 ? "26" : "25"}</span>{country !== 0 && <span>Путешествия друзей до запуска TC</span>}</div>
      {country === 1 ? <div className={s.thailandOpening}><div className={s.thaiArt}><div className={s.thaiStrips} aria-hidden="true"><i /><i /><i /></div><h2 className={s.thaiDisplay} data-asset-id="thailand.hero.mask" id="thailand-title" aria-label="THAILAND ’26"><span className={s.thaiWord} aria-hidden="true" /><span className={s.landWord} aria-hidden="true" /></h2></div><span className={s.thaiYear} aria-hidden="true">’26</span><div className={`${s.thaiOpeningNote} ${f.thaiIntro}`}><h3>{hero.title}</h3>{hero.paragraphs.map(p => <p key={p}>{p}</p>)}</div></div> : <><div className={`${s.countryTitle} ${country === 2 ? f.madagascarTitle : ""}`}><h2 id={`${key}-title`}>{name}</h2><span>’25</span></div><div className={f.heroGrid}><div className={f.copy}><h3>{hero.title}</h3>{hero.paragraphs.map(p => <p key={p}>{p}</p>)}</div>{country === 0 ? <ChinaRoute /> : hero.photos[0] && <Figure id={hero.photos[0].id} priority />}</div></>}
      {chapters.slice(1).map((chapter, i) => <ChapterView key={chapter.id} chapter={chapter} index={i + 1} country={country} />)}
    </div>
  </section>;
}
