import type { Metadata } from "next";
import { Archive } from "@/components/public-site/archive";

export const metadata: Metadata = { title: "Архив — Travel Club", description: "FIELD NOTES: поездки с друзьями в Таиланд, Китай и на Мадагаскар до публичного запуска клуба." };

export default function ArchivePage() { return <Archive />; }
