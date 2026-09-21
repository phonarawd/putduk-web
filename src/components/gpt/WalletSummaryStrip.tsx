"use client";

import { useEffect } from "react";
import { formatMoneyPrimary, formatMoneySecondary } from "@/lib/gpt/format";
import { useWallet } from "@/lib/wallet/WalletContext";

export function WalletSummaryStrip() {
  const wallet = useWallet();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void wallet.refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [wallet.refresh]);

  if (!wallet.ready) return null;

  if (!wallet.hasValues) {
    return (
      <section className="plain-notice">
        <strong>아직 표시할 금액이 없어요.</strong>
        <p>로그인 후 지갑 정보가 있으면 여기에 보여 드려요.</p>
      </section>
    );
  }

  const principalUsdt = wallet.balance.principalUsdt;
  const principalKrw = wallet.balance.principalKrw;
  const profitUsdt = wallet.withdrawable.profitUsdt;
  const profitKrw = wallet.withdrawable.profitKrw;
  const practiceUsdt = wallet.deposit.practiceUsdt;
  const practiceKrw = wallet.deposit.practiceKrw;
  const trialPrincipalUsdt = wallet.trial.principalUsdt;
  const trialPrincipalKrw = wallet.trial.principalKrw;

  return (
    <section className="route-wallet-strip">
      <div>
        <span>내 예치</span>
        <strong>{formatMoneyPrimary(principalUsdt, principalKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        {formatMoneySecondary(principalUsdt, principalKrw) ? (
          <small>{formatMoneySecondary(principalUsdt, principalKrw)}</small>
        ) : null}
      </div>
      {trialPrincipalKrw != null || trialPrincipalUsdt != null ? (
        <div>
          <span>체험 원금 · 출금 불가</span>
          <strong>
            {formatMoneyPrimary(trialPrincipalUsdt, trialPrincipalKrw) ?? "아직 표시할 금액이 없어요"}
            {formatMoneySecondary(trialPrincipalUsdt, trialPrincipalKrw)
              ? ` · ${formatMoneySecondary(trialPrincipalUsdt, trialPrincipalKrw)}`
              : ""}
          </strong>
        </div>
      ) : null}
      <div>
        <span>출금 가능 수익</span>
        <strong>{formatMoneyPrimary(profitUsdt, profitKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        {formatMoneySecondary(profitUsdt, profitKrw) ? <small>{formatMoneySecondary(profitUsdt, profitKrw)}</small> : null}
      </div>
      {wallet.balance.lockedUsdt != null || wallet.balance.lockedKrw != null ? (
        <div>
          <span>진행 중 잠금</span>
          <strong>{formatMoneyPrimary(wallet.balance.lockedUsdt, wallet.balance.lockedKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        </div>
      ) : null}
      {wallet.trial.lockedUsdt != null ? (
        <div>
          <span>체험 진행 중 잠금 · 출금 불가</span>
          <strong>{formatMoneyPrimary(wallet.trial.lockedUsdt, null) ?? "아직 표시할 금액이 없어요"}</strong>
        </div>
      ) : null}
      {practiceUsdt != null || practiceKrw != null ? (
        <div>
          <span>연습 · 사용 불가</span>
          <strong>{formatMoneyPrimary(practiceUsdt, practiceKrw) ?? "아직 표시할 금액이 없어요"}</strong>
        </div>
      ) : null}
    </section>
  );
}
