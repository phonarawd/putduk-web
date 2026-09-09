"use client";

import { useEffect, useState } from "react";
import { emptyTrial, getHomeRead, getTrialState, getWalletBuckets, hasMoneyValues, readMoney, readTrialState, type MoneyRead } from "@/lib/api";
import { formatMoneyPrimary, formatMoneySecondary } from "@/lib/gpt/format";

export function WalletSummaryStrip() {
  const [money, setMoney] = useState<MoneyRead | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getHomeRead(), getWalletBuckets(), getTrialState()]).then(([home, buckets, trial]) => {
      if (cancelled) return;
      const trialState = trial.status === "fulfilled" ? readTrialState(trial.value) : emptyTrial();
      const next = readMoney(
        home.status === "fulfilled" ? home.value : null,
        buckets.status === "fulfilled" ? buckets.value : null,
        trialState,
      );
      setMoney(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !money) return null;

  if (!hasMoneyValues(money)) {
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
        <strong>{formatMoneyPrimary(money.principalUsdt, money.principalKrw)}</strong>
        {formatMoneySecondary(money.principalUsdt, money.principalKrw) ? (
          <small>{formatMoneySecondary(money.principalUsdt, money.principalKrw)}</small>
        ) : null}
      </div>
      {money.trialPrincipalUsdt ? (
        <div>
          <span>체험 원금 · 출금 불가</span>
          <strong>
            {formatMoneyPrimary(money.trialPrincipalUsdt, money.trialPrincipalKrw)}
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
          <strong>{formatMoneyPrimary(money.lockedUsdt, money.lockedKrw)}</strong>
        </div>
      ) : null}
      {money.practiceUsdt != null || money.practiceKrw != null ? (
        <div>
          <span>연습 · 사용 불가</span>
          <strong>{formatMoneyPrimary(money.practiceUsdt, money.practiceKrw)}</strong>
        </div>
      ) : null}
    </section>
  );
}
