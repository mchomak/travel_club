"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { verifyLeadReceipt } from "../../lib/lead";
import s from "./publication.module.css";
import { EditorialLabel } from "./primitives";

type ReceiptState = { kind: "checking" } | { kind: "confirmed"; number: string } | { kind: "unverified" };

export function ThanksConfirmation({ token }: { token: string }) {
  const [receiptState, setReceiptState] = useState<{ token: string; receipt: ReceiptState }>(() => ({
    token,
    receipt: token ? { kind: "checking" } : { kind: "unverified" },
  }));
  const receipt = receiptState.token === token
    ? receiptState.receipt
    : token ? { kind: "checking" as const } : { kind: "unverified" as const };

  useEffect(() => {
    let active = true;
    if (!token) return () => { active = false; };
    void verifyLeadReceipt(token).then((number) => {
      if (active) setReceiptState({ token, receipt: number ? { kind: "confirmed", number } : { kind: "unverified" } });
    });
    return () => { active = false; };
  }, [token]);

  const isConfirmed = receipt.kind === "confirmed";
  const isChecking = receipt.kind === "checking";

  return <div className={`${s.container} ${s.noticePage}`}>
    <div className={s.noticeMark} aria-hidden="true">↗</div>
    <div className={s.noticeCopy} aria-live="polite" aria-busy={isChecking}>
      <EditorialLabel>{isConfirmed ? "ЗАЯВКА / ПРИНЯТА" : isChecking ? "ЗАЯВКА / ПРОВЕРКА" : "ЗАЯВКА / СТАТУС НЕИЗВЕСТЕН"}</EditorialLabel>
      <h1 className={s.h1}>{isConfirmed ? <>Спасибо<br />за обращение.</> : isChecking ? <>Проверяем<br />заявку.</> : <>Не удалось<br />проверить заявку.</>}</h1>
      {isConfirmed ? <>
        <p className={s.lead}>Заявка сохранена. Команда свяжется с вами выбранным способом.</p>
        <p className={`${s.small} ${s.muted}`}>Номер обращения: <strong>{receipt.number}</strong></p>
      </> : isChecking ? <p className={`${s.small} ${s.muted}`}>Проверяем подтверждение сохранения. Эта страница покажет успех только после ответа сервера.</p> : <p className={`${s.small} ${s.muted}`}>Не видим действующее подтверждение, поэтому не можем сообщить статус заявки. Если вы отправляли форму, сверьтесь с результатом отправки или обратитесь в Travel Club.</p>}
      {isConfirmed && <p className={`${s.small} ${s.muted}`}>Дальнейшие детали обсудим в выбранном канале связи. Срок ответа не обещаем заранее.</p>}
      <div className={s.actions}>
        <Link href="/" className={s.buttonPrimary}>На главную<span aria-hidden="true">↗</span></Link>
        <Link href="/archive" className={s.buttonSecondary}>В архив</Link>
      </div>
    </div>
  </div>;
}
