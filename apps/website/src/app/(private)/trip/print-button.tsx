"use client";
import s from "./trip.module.css";

export function PrintButton() {
  return <button className={s.print} onClick={() => window.print()}>Распечатать программу</button>;
}
