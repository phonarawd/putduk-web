"use client";

import { useEffect, useRef } from "react";
import { formatKrw, formatSignedKrw, formatSignedUsdt, formatUsdt } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import { useModalFocus } from "@/lib/gpt/useModalFocus";

export function PreflightModal() {
  const { selected, preflightOpen, closePreflight, confirmStart } = useGpt();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalFocus(preflightOpen, containerRef);

  useEffect(() => {
    if (!preflightOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePreflight();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [preflightOpen, closePreflight]);

  return (
    <div id="preflightModal" className="modal" hidden={!preflightOpen}>
      <div className="modal-backdrop" onClick={closePreflight} />
      <section
        ref={containerRef}
        className="modal-card preflight-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preflightTitle"
      >
        <button className="modal-close" type="button" aria-label="조건 확인 닫기" onClick={closePreflight}>
          ×
        </button>
        <span className="modal-kicker">참여 전 확인</span>
        <h2 id="preflightTitle">{selected.title}</h2>
        {selected.lowMarket && selected.highMarket ? (
          <p id="preflightRoute" className="preflight-route">
            {selected.lowMarket} → {selected.highMarket}
          </p>
        ) : null}
        <div className="preflight-money">
          <div>
            <span>이번 업무에 사용할 금액</span>
            <strong id="preflightAmount">
              {selected.requiredUsdt != null ? formatUsdt(selected.requiredUsdt) : "서버가 고른 금액"}
            </strong>
            {selected.requiredKrw != null ? <small id="preflightUsdt">{formatKrw(selected.requiredKrw)}</small> : null}
          </div>
          {selected.expectedUsdt != null || selected.expectedKrw ? (
            <div>
              <span>예상 수익</span>
              <strong id="preflightProfit">
                {selected.expectedUsdt != null ? formatSignedUsdt(selected.expectedUsdt) : formatSignedKrw(selected.expectedKrw)}
              </strong>
              <small>결과에 따라 달라질 수 있어요</small>
            </div>
          ) : null}
        </div>
        <div className="lock-explanation">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>쓸 금액은 서버가 고릅니다.</strong>
            <p id="preflightBalanceAfter">화면에서 체험/본인 예치를 고르지 않아도 돼요.</p>
          </div>
        </div>
        <div className="safe-stop-notice">
          <span aria-hidden="true">🛡️</span>
          <strong>조건이 어긋나면 안전하게 멈출 수 있어요.</strong>
          <p>결과는 퍼뜩이 확인하며, 안전 중단되면 잠근 금액이 돌아와요.</p>
        </div>
        <div className="modal-actions">
          <button id="preflightCancel" className="modal-secondary" type="button" onClick={closePreflight}>
            다시 보기
          </button>
          <button id="preflightConfirm" className="modal-primary" type="button" onClick={confirmStart}>
            이 기회로 수익 벌기
          </button>
        </div>
      </section>
    </div>
  );
}
