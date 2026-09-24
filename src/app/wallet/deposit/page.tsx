"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DepositQr } from "@/components/gpt/DepositQr";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { WalletSummaryStrip } from "@/components/gpt/WalletSummaryStrip";
import { copyTextToClipboard } from "@/lib/gpt/clipboard";
import { KRW_QUICK_AMOUNTS } from "@/lib/gpt/constants";
import { parseMoney } from "@/lib/gpt/format";
import { useCommonUi } from "@/lib/gpt/GptScopes";
import {
  getKrwDepositInstructions,
  getMyDepositAddress,
  isKrwConfigNotReady,
  newIdempotencyKey,
  readDepositAddress,
  readKrwInstructions,
  requestKrwDeposit,
} from "@/lib/api";
import { MSG, toastFromError } from "@/lib/messages";

const DEPOSIT_TABS = [
  { mode: "krw", id: "deposit-tab-krw", panelId: "deposit-panel-krw", label: "원화" },
  { mode: "usdt", id: "deposit-tab-usdt", panelId: "deposit-panel-usdt", label: "테더(USDT)" },
] as const;

type DepositMode = (typeof DEPOSIT_TABS)[number]["mode"];
type GuideState = "loading" | "success" | "empty" | "error";

function KrwDepositPanel() {
  const router = useRouter();
  const { showToast } = useCommonUi();
  const [amount, setAmount] = useState(0);
  const [depositor, setDepositor] = useState("");
  const [busy, setBusy] = useState(false);
  const [guideState, setGuideState] = useState<GuideState>("loading");
  const [guide, setGuide] = useState<ReturnType<typeof readKrwInstructions>>(null);

  function fetchGuide() {
    return getKrwDepositInstructions()
      .then((data) => {
        const next = readKrwInstructions(data);
        if (!next || !next.bankName || !next.accountNumber) {
          setGuide(next);
          setGuideState("empty");
          return;
        }
        setGuide(next);
        setGuideState("success");
      })
      .catch((error: unknown) => {
        setGuide(null);
        setGuideState(isKrwConfigNotReady(error) ? "empty" : "error");
      });
  }

  function loadGuide() {
    setGuideState("loading");
    void fetchGuide();
  }

  useEffect(() => {
    void fetchGuide();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (amount <= 0 || !depositor.trim()) {
      showToast(MSG.depositNeed, "warning");
      return;
    }
    setBusy(true);
    try {
      await requestKrwDeposit(amount, depositor.trim(), newIdempotencyKey());
      showToast(MSG.depositOk, "success");
      router.push("/wallet/history");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.depositFail);
      showToast(payload.message, payload.kind);
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
          <input id="depositAmount" name="amount" inputMode="numeric" required value={amount ? amount.toLocaleString("ko-KR") : ""} onChange={(event) => setAmount(parseMoney(event.target.value))} />
          <b>원</b>
        </div>
      </label>
      <div className="capital-presets" role="group" aria-label="빠른 금액">
        {KRW_QUICK_AMOUNTS.map((preset) => (
          <button key={preset} type="button" className={amount === preset ? "is-selected" : ""} onClick={() => setAmount(preset)}>
            {(preset / 10000).toLocaleString("ko-KR")}만원
          </button>
        ))}
      </div>
      <label className="form-field">
        <span>입금자 이름</span>
        <input name="depositor" autoComplete="name" placeholder="송금할 때 쓰는 이름" required value={depositor} onChange={(event) => setDepositor(event.target.value)} />
      </label>
      <div className="account-preview">
        <span>입금 안내</span>
        {guideState === "loading" ? <strong>입금 안내를 확인하고 있어요.</strong> : null}
        {guideState === "success" && guide ? (
          <>
            <strong>{[guide.bankName, guide.accountNumber].filter(Boolean).join(" ")}</strong>
            {guide.accountHolder ? <small>예금주 {guide.accountHolder}</small> : null}
            {guide.noticeKo ? <small>{guide.noticeKo}</small> : null}
          </>
        ) : null}
        {guideState === "empty" ? <strong>{MSG.depositGuideEmpty}</strong> : null}
        {guideState === "error" ? (
          <>
            <strong>{MSG.depositGuideFail}</strong>
            <button type="button" className="text-action" onClick={loadGuide}>{MSG.withdrawPolicyRetry}</button>
          </>
        ) : null}
      </div>
      <button className="form-primary" type="submit" disabled={busy}>원화 입금 신청</button>
    </form>
  );
}

function UsdtDepositPanel() {
  const router = useRouter();
  const { showToast } = useCommonUi();
  const [address, setAddress] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  useEffect(() => {
    getMyDepositAddress()
      .then((data) => {
        const found = readDepositAddress(data);
        setAddress(found?.address ?? null);
        setQrPayload(found?.qrPayload ?? null);
        setNetwork(found?.network ?? null);
      })
      .catch(() => {
        setAddress(null);
        setQrPayload(null);
        setNetwork(null);
      });
  }, []);

  async function onCopy() {
    if (!address) return;
    const ok = await copyTextToClipboard(address);
    showToast(ok ? MSG.copyOk : MSG.copyFail, ok ? "success" : "warning");
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
          <div className="qr-preview" data-qr-payload={qrPayload || address}><DepositQr payload={qrPayload || address} /></div>
          <div className="address-card">
            <span>테더 입금 주소</span>
            <strong id="usdtAddress">{address}</strong>
            <button type="button" onClick={onCopy}>주소 복사</button>
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
  const [mode, setMode] = useState<DepositMode>("krw");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectMode(next: DepositMode, focus = false) {
    setMode(next);
    if (focus) {
      const index = DEPOSIT_TABS.findIndex((tab) => tab.mode === next);
      tabRefs.current[index]?.focus();
    }
  }

  function onTabListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = DEPOSIT_TABS.findIndex((tab) => tab.mode === mode);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % DEPOSIT_TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + DEPOSIT_TABS.length) % DEPOSIT_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = DEPOSIT_TABS.length - 1;
    else return;
    event.preventDefault();
    selectMode(DEPOSIT_TABS[next].mode, true);
  }

  return (
    <RouteScreen>
      <RouteTop kicker="광산 운용 자본" title="입금" copy="입금은 이용료가 아니라 내 광산 운용을 위한 자본이에요." backPath="/me" />
      <WalletSummaryStrip />
      <section className="form-page-card wallet-form-card">
        <div className="segmented-tabs" role="tablist" aria-label="입금 방법" onKeyDown={onTabListKeyDown}>
          {DEPOSIT_TABS.map((tab, index) => (
            <button
              key={tab.id}
              id={tab.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              type="button"
              role="tab"
              aria-selected={mode === tab.mode}
              aria-controls={tab.panelId}
              tabIndex={mode === tab.mode ? 0 : -1}
              className={mode === tab.mode ? "is-selected" : ""}
              onClick={() => selectMode(tab.mode)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {DEPOSIT_TABS.map((tab) => (
          <div key={tab.panelId} id={tab.panelId} role="tabpanel" aria-labelledby={tab.id} hidden={mode !== tab.mode}>
            {tab.mode === "krw" ? <KrwDepositPanel /> : <UsdtDepositPanel />}
          </div>
        ))}
      </section>
    </RouteScreen>
  );
}
