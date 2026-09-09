"use client";

import { useEffect, useState } from "react";
import { hasMoneyValues, loadMoneyRead, type MoneyRead } from "@/lib/api";
import { formatMoneyPrimary, formatMoneySecondary } from "@/lib/gpt/format";

export function WalletSummaryStrip() {
  const [money, setMoney] = useState<MoneyRead | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMoneyRead()
      .then((next) => {
        if (cancelled) return;
        setMoney(next);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMoney(null);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  if (!money || !hasMoneyValues(money)) {
    return (
      <section className="plain-notice">
        <strong>아직 표시할 금액이 없어요.</strong>
        <p>로그인 후 지갑 정보가 있으면 여기에 보여 드려요.</p>
      </section>
    );
  }

  return (
    <section className="route-wallet-strip">
      <div>
        <span>내 예치</span>
        <strong>{formatMoneyPrimary(money.principalUsdt, money.principalKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        {formatMoneySecondary(money.principalUsdt, money.principalKrw) ? (
          <small>{formatMoneySecondary(money.principalUsdt, money.principalKrw)}</small>
        ) : null}
      </div>
      {money.trialPrincipalKrw != null || money.trialPrincipalUsdt != null ? (
        <div>
          <span>체험 원금 · 출금 불가</span>
          <strong>
            {formatMoneyPrimary(money.trialPrincipalUsdt, money.trialPrincipalKrw) ?? "아직 표시할 금액이 없어요"}
            {formatMoneySecondary(money.trialPrincipalUsdt, money.trialPrincipalKrw)
              ? ` · ${formatMoneySecondary(money.trialPrincipalUsdt, money.trialPrincipalKrw)}`
              : ""}
          </strong>
        </div>
      ) : null}
      <div>
        <span>출금 가능 수익</span>
        <strong>{formatMoneyPrimary(money.profitUsdt, money.profitKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        {formatMoneySecondary(money.profitUsdt, money.profitKrw) ? <small>{formatMoneySecondary(money.profitUsdt, money.profitKrw)}</small> : null}
      </div>
      {money.lockedUsdt != null || money.lockedKrw != null ? (
        <div>
          <span>진행 중 잠금</span>
          <strong>{formatMoneyPrimary(money.lockedUsdt, money.lockedKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        </div>
      ) : null}
      {money.practiceUsdt != null || money.practiceKrw != null ? (
        <div>
          <span>연습 · 사용 불가</span>
          <strong>{formatMoneyPrimary(money.practiceUsdt, money.practiceKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        </div>
      ) : null}
    </section>
  );
}
