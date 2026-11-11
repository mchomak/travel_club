import type { Metadata } from "next";
import { PublicPlaceholder } from "@/components/public-placeholder";

export const metadata: Metadata = {
  title: "Оплата путешествия — Travel Club",
  description: "Онлайн-оплата пока недоступна. Раздел появится, когда будут подготовлены безопасный способ оплаты и условия бронирования.",
  alternates: { canonical: "/payment" },
};

export default function PaymentPage() { return <PublicPlaceholder title="Оплата путешествия" description="Онлайн-оплата пока недоступна. Раздел появится, когда мы подготовим безопасный способ оплаты и условия бронирования." />; }
