"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { WalletSummaryStrip } from "@/components/gpt/WalletSummaryStrip";
import { useGpt } from "@/lib/gpt/GptContext";
import {
  emptyTrial,
  getHomeRead,
  getKycStatus,
  getTrialState,
  getWalletBuckets,
  getWithdrawStepUpPolicy,
  newIdempotencyKey,
  readKycVerified,
  readMoney,
  readStepUpMethod,
  readTrialState,
  requestWithdraw,
  startWithdrawStepUp,
  verifyWithdrawStepUp,
  readChallengeId,
  readStepUpToken,
} from "@/lib/api";
import { formatUsdt } from "@/lib/gpt/format";
import { MSG, toastFromError } from "@/lib/messages";

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [verified, setVerified] = useState(false);
  const [profitUsdt, setProfitUsdt] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [stepMethod, setStepMethod] = useState<"pin" | "email_otp" | null>(null);
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [stepUpToken, setStepUpToken] = useState("");
  const [busy, setBusy] = useState<"challenge" | "verify" | "withdraw" | "">("");

  useEffect(() => {
    getKycStatus()
      .then((data) => setVerified(readKycVerified(data)))
      .catch(() => setVerified(false));
    Promise.allSettled([getHomeRead(), getWalletBuckets(), getTrialState()]).then(([home, buckets, trial]) => {
      const money = readMoney(
        home.status === "fulfilled" ? home.value : null,
        buckets.status === "fulfilled" ? buckets.value : null,
        trial.status === "fulfilled" ? readTrialState(trial.value) : emptyTrial(),
      );
      setProfitUsdt(money.profitUsdt);
    });
    getWithdrawStepUpPolicy()
      .then((data) => setStepMethod(readStepUpMethod(data)))
      .catch(() => setStepMethod(null));
  }, []);

  async function onChallenge() {
    if (busy || !stepMethod) return;
    setBusy("challenge");
    try {
      const data = await startWithdrawStepUp(stepMethod);
      const id = readChallengeId(data);
      if (id) setChallengeId(id);
      showToast(stepMethod === "email_otp" ? MSG.withdrawCodeSent : MSG.withdrawConfirmStart, stepMethod === "email_otp" ? "info" : "warning");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.withdrawConfirmFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy("");
    }
  }

  async function onVerify() {
    if (busy || !stepMethod) return;
    if (!code.trim()) {
      showToast(MSG.withdrawConfirmNeed, "warning");
      return;
    }
    setBusy("verify");
    try {
      const data = await verifyWithdrawStepUp(stepMethod, code.trim(), challengeId || undefined);
      const token = readStepUpToken(data);
      if (!token) {
        showToast(MSG.withdrawConfirmFail, "error");
        return;
      }
      setStepUpToken(token);
      showToast(MSG.withdrawConfirmOk, "success");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.withdrawConfirmFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy("");
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!verified) {
      showToast(MSG.withdrawNeedKyc, "security");
      return;
    }
    const amountUsdt = Number(amount);
    if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) {
      showToast(MSG.withdrawNeedAmount, "warning");
      return;
    }
    if (profitUsdt != null && amountUsdt > profitUsdt) {
      showToast(MSG.withdrawNeedBalance, "warning");
      return;
    }
    if (!destination.trim()) {
      showToast(MSG.withdrawNeedAddress, "warning");
      return;
    }
    if (!stepUpToken) {
      showToast(MSG.withdrawNeedConfirm, "security");
      return;
    }
    setBusy("withdraw");
    try {
      await requestWithdraw({
        mode: "profit",
        asset: "USDT",
        amountUsdt,
        destination: destination.trim(),
        idempotencyKey: newIdempotencyKey(),
        stepUpToken,
      });
      showToast(MSG.withdrawOk, "success");
      router.push("/wallet/history");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.withdrawFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy("");
    }
  }

  return (
    <RouteScreen>
      <RouteTop kicker="내 지갑" title="출금" copy="출금 가능한 수익만 테더로 받을 수 있어요. 체험 원금은 빼지 않아요." backPath="/me" />
      <WalletSummaryStrip />
      <section className="form-page-card wallet-form-card">
        <form className="stack-form wallet-panel" data-form="withdraw" onSubmit={onSubmit}>
          <div className="withdraw-limit">
            <span>출금 가능 수익</span>
            {profitUsdt != null ? (
              <strong>{formatUsdt(profitUsdt)}</strong>
            ) : (
              <strong>아직 표시할 금액이 없어요</strong>
            )}
            <small>체험 원금과 연습 잔액은 출금할 수 없어요.</small>
          </div>
          {!verified ? (
            <div className="kyc-needed">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>출금 전에 본인확인이 필요해요.</strong>
                <p>이름과 기본 정보만 확인하며 주민번호는 받지 않아요.</p>
              </div>
              <button type="button" onClick={() => router.push("/me/kyc")}>
                본인확인
              </button>
            </div>
          ) : (
            <div className="verified-line">✓ 본인확인이 끝났어요.</div>
          )}
          <label className="form-field">
            <span>출금할 테더</span>
            <input
              name="amountUsdt"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
            />
          </label>
          <label className="form-field">
            <span>받을 주소</span>
            <input
              name="destination"
              required
              placeholder="테더를 받을 주소"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            />
          </label>
          {stepMethod ? (
            <label className="form-field">
              <span>{stepMethod === "email_otp" ? "확인 코드" : "PIN 또는 코드"}</span>
              <input
                name="stepUpCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={stepMethod === "email_otp" ? "받은 코드" : "PIN 또는 코드"}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
          ) : null}
          <div className="agreement-links">
            {stepMethod === "email_otp" ? (
              <button type="button" disabled={!!busy} onClick={onChallenge}>
                코드 받기
              </button>
            ) : stepMethod ? (
              <button type="button" disabled={!!busy} onClick={onChallenge}>
                확인 시작
              </button>
            ) : null}
            <button type="button" disabled={!!busy || !stepMethod} onClick={onVerify}>
              코드 확인
            </button>
          </div>
          <button className="form-primary" type="submit" disabled={!verified || busy === "withdraw"}>
            출금 요청하기
          </button>
        </form>
      </section>
    </RouteScreen>
  );
}
