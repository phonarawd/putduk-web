"use client";

import { useEffect, useState } from "react";
import { emptyTrial, getHomeRead, getTrialState, getWalletBuckets, hasMoneyValues, readMoney, readTrialState, type MoneyRead } from "@/lib/api";
import { formatKrw, formatUsdt } from "@/lib/gpt/format";

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
        <strong>{formatUsdt(money.principalUsdt)}</strong>
        {money.principalKrw != null ? <small>{formatKrw(money.principalKrw)}</small> : null}
      </div>
      {money.trialPrincipalUsdt ? (
        <div>
          <span>체험 원금 · 출금 불가</span>
          <strong>{formatUsdt(money.trialPrincipalUsdt)}</strong>
        </div>
      ) : null}
      <div>
        <span>출금 가능 수익</span>
        <strong>{money.profitUsdt != null ? formatUsdt(money.profitUsdt) : money.profitKrw != null ? formatKrw(money.profitKrw) : formatUsdt(0)}</strong>
        {money.profitUsdt != null && money.profitKrw != null ? <small>{formatKrw(money.profitKrw)}</small> : null}
      </div>
      {money.lockedUsdt != null || money.lockedKrw != null ? (
        <div>
          <span>진행 중 잠금</span>
          <strong>{money.lockedUsdt != null ? formatUsdt(money.lockedUsdt) : formatKrw(money.lockedKrw ?? 0)}</strong>
        </div>
      ) : null}
      {money.practiceUsdt != null || money.practiceKrw != null ? (
        <div>
          <span>연습 · 사용 불가</span>
          <strong>{money.practiceUsdt != null ? formatUsdt(money.practiceUsdt) : formatKrw(money.practiceKrw ?? 0)}</strong>
        </div>
      ) : null}
    </section>
  );
}
