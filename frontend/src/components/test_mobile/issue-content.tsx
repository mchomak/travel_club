import { MagazineSpread } from "@/components/test_13/spreads";
import s from "./issue-content.module.css";

export function MobileIssueSpread({ index, className }: { index: number; className?: string }) {
  return (
    <div className={[s.mobileIssue, className].filter(Boolean).join(" ")} data-mobile-issue="">
      <MagazineSpread index={index} reveal="static" />
    </div>
  );
}
