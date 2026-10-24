"use client";

import { useEffect, useRef, useState } from "react";
import { SPREADS } from "@/components/test_13/data";
import { MobileIssueSpread } from "@/components/test_mobile/issue-content";
import s from "./continuous-issue.module.css";

const chapterId = (index: number) => `issue-chapter-${index + 1}`;

export function ContinuousIssue() {
  const [activeIndex, setActiveIndex] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const chapters = chapterRefs.current.filter((chapter): chapter is HTMLElement => chapter !== null);
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        const current = entries
          .filter(entry => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
        if (!current) return;
        const index = Number((current.target as HTMLElement).dataset.chapterIndex);
        if (Number.isInteger(index)) setActiveIndex(index);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );

    chapters.forEach(chapter => observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={s.issue}>
      <nav className={s.navigation} aria-label="Chapter navigation">
        <div className={s.chapterLinks}>
          {SPREADS.map((spread, index) => (
            <a
              key={spread.title}
              href={`#${chapterId(index)}`}
              aria-current={activeIndex === index ? "location" : undefined}
            >
              {spread.navLabel}
            </a>
          ))}
        </div>
      </nav>

      <div className={s.reader}>
        {SPREADS.map((spread, index) => (
          <article
            key={spread.title}
            id={chapterId(index)}
            className={s.chapter}
            aria-label={spread.navLabel}
            data-chapter-index={index}
            ref={element => {
              chapterRefs.current[index] = element;
            }}
          >
            <MobileIssueSpread index={index} />
          </article>
        ))}
      </div>
    </main>
  );
}
