"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QrPreview } from "@/components/gpt/QrPreview";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { WalletSummaryStrip } from "@/components/gpt/WalletSummaryStrip";
import { copyTextToClipboard } from "@/lib/gpt/clipboard";
import { parseMoney } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import {
  getKrwDepositInstructions,
  getMyDepositAddress,
  newIdempotencyKey,
  readDepositAddress,
  readKrwInstructions,
  requestKrwDeposit,
} from "@/lib/api";

function KrwDepositPanel() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [amount, setAmount] = useState(0);
  const [depositor, setDepositor] = useState("");
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState<{ bank: string | null; account: string | null; holder: string | null; memo: string | null } | null>(null);

  useEffect(() => {
    getKrwDepositInstructions()
      .then((data) => setGuide(readKrwInstructions(data)))
      .catch(() => setGuide(null));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (amount <= 0 || !depositor.trim()) {
      showToast("🙏 입금 금액과 입금자 이름을 입력해 주세요.", "error");
      return;
    }
    setBusy(true);
    try {
      await requestKrwDeposit(amount, depositor.trim(), newIdempotencyKey());
      showToast("📝 원화 입금 신청을 보냈어요.");
      router.push("/wallet/history");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "입금 신청 실패", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-form wallet-panel" data-form="deposit-krw" onSubmit={onSubmit}>
      <div className="trust-banner">
        <span aria-hidden="true">₩</span>
        <div>
          <strong>입금은 이용료가 아니에요.</strong>
          <p>신청한 금액은 확인 후 내 운용 자본에 반영돼요. 카드결제는 받지 않아요.</p>
        </div>
      </div>
      <label className="form-field money-field">
        <span>입금할 금액</span>
        <div>
          <input
            id="depositAmount"
            name="amount"
            inputMode="numeric"
            required
            value={amount ? amount.toLocaleString("ko-KR") : ""}
            onChange={(event) => setAmount(parseMoney(event.target.value))}
          />
          <b>원</b>
        </div>
      </label>
      <label className="form-field">
        <span>입금자 이름</span>
        <input
          name="depositor"
          autoComplete="name"
          placeholder="송금할 때 쓰는 이름"
          required
          value={depositor}
          onChange={(event) => setDepositor(event.target.value)}
        />
      </label>
      <div className="account-preview">
        <span>입금 안내</span>
        {guide?.bank || guide?.account ? (
          <>
            <strong>
              {[guide.bank, guide.account].filter(Boolean).join(" ")}
            </strong>
            {guide.holder ? <small>예금주 {guide.holder}</small> : null}
            {guide.memo ? <small>{guide.memo}</small> : null}
          </>
        ) : (
          <strong>신청 후 전용 계좌를 안내해 드려요</strong>
        )}
      </div>
      <button className="form-primary" type="submit" disabled={busy}>
        원화 입금 신청
      </button>
    </form>
  );
}

function UsdtDepositPanel() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  useEffect(() => {
    getMyDepositAddress()
      .then((data) => {
        const found = readDepositAddress(data);
        setAddress(found?.address ?? null);
        setNetwork(found?.network ?? null);
      })
      .catch(() => {
        setAddress(null);
        setNetwork(null);
      });
  }, []);

  async function onCopy() {
    if (!address) return;
    const ok = await copyTextToClipboard(address);
    showToast(ok ? "😊 주소를 복사했어요" : "길게 눌러 복사해 주세요.", ok ? "normal" : "error");
  }

  return (
    <div className="wallet-panel">
      <div className="network-warning">
        <span aria-hidden="true">!</span>
        <div>
          <strong>트론(TRON)으로만 보내 주세요.</strong>
          <p>다른 전송망으로 보내면 금액을 찾기 어려울 수 있어요.</p>
        </div>
      </div>
      {address ? (
        <div className="usdt-deposit-grid">
          <QrPreview value={address} />
          <div className="address-card">
            <span>테더 입금 주소</span>
            <strong id="usdtAddress">{address}</strong>
            <button type="button" onClick={onCopy}>
              주소 복사
            </button>
            {network ? <small>{network}</small> : null}
          </div>
        </div>
      ) : (
        <div className="plain-notice">
          <strong>입금 주소가 아직 없어요.</strong>
          <p>로그인 후 주소가 발급되면 여기에 보여 드려요.</p>
        </div>
      )}
      <button className="text-action route-wide-action" type="button" onClick={() => router.push("/wallet/usdt-guide")}>
        테더 준비 방법 보기
      </button>
    </div>
  );
}

export default function WalletDepositPage() {
  const [mode, setMode] = useState<"krw" | "usdt">("krw");

  return (
    <RouteScreen>
      <RouteTop kicker="운용 자본" title="입금" copy="입금은 이용료가 아니라 내 리셀 업무에 쓰는 운용 자본이에요." backPath="/me" />
      <WalletSummaryStrip />
      <section className="form-page-card wallet-form-card">
        <div className="segmented-tabs" role="tablist" aria-label="입금 방법">
          <button type="button" className={mode === "krw" ? "is-selected" : ""} onClick={() => setMode("krw")}>
            원화
          </button>
          <button type="button" className={mode === "usdt" ? "is-selected" : ""} onClick={() => setMode("usdt")}>
            테더(USDT)
          </button>
        </div>
        {mode === "krw" ? <KrwDepositPanel /> : <UsdtDepositPanel />}
      </section>
    </RouteScreen>
  );
}
