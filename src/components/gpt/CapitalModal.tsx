"use client";

import { useEffect, useRef } from "react";
import { formatUsdt, parseMoney } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import { useModalFocus } from "@/lib/gpt/useModalFocus";

const PRESETS = [100000, 500000, 1000000, 5000000];

export function CapitalModal() {
  const { state, capitalModal, closeCapitalModal, setCapitalSelection, confirmCapital } = useGpt();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalFocus(capitalModal.open, containerRef);

  useEffect(() => {
    if (!capitalModal.open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCapitalModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [capitalModal.open, closeCapitalModal]);

  const isReplace = capitalModal.mode === "replace";
  const resultingCapital = isReplace ? capitalModal.selection : Number(state.principalUsdt) + capitalModal.selection;

  return (
    <div id="capitalModal" className="modal" hidden={!capitalModal.open}>
      <div className="modal-backdrop" onClick={closeCapitalModal} />
      <section
        ref={containerRef}
        className="modal-card capital-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capitalModalTitle"
      >
        <button className="modal-close" type="button" aria-label="가상 자본 설정 닫기" onClick={closeCapitalModal}>
          ×
        </button>
        <div className="issued-id">
          <span>나의 퍼뜩 리셀러 ID</span>
          <strong id="capitalResellerId">{state.resellerId}</strong>
          <i aria-hidden="true">발급 완료</i>
        </div>
        <span id="capitalModalEyebrow" className="modal-kicker">
          {isReplace ? "가상 자본 설정" : "가상 자본 늘리기"}
        </span>
        <h2 id="capitalModalTitle">{isReplace ? "얼마의 자본으로 연습할까요?" : "업무 자본을 얼마나 추가할까요?"}</h2>
        <p id="capitalModalCopy" className="modal-copy">
          {isReplace
            ? "실제 퍼뜩에서는 내 자본을 입금해 업무를 시작합니다. 여기서는 결제 없이 같은 흐름을 확인합니다."
            : "자본이 커지면 필요한 금액이 높은 기회도 비교할 수 있어요. 입금은 이용료가 아니라 운용 자본입니다."}
        </p>
        <div className="capital-presets" role="group" aria-label="가상 자본 금액 선택">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={capitalModal.selection === preset ? "is-selected" : ""}
              onClick={() => setCapitalSelection(preset)}
            >
              {(preset / 10000).toLocaleString("ko-KR")}만원
            </button>
          ))}
        </div>
        <label className="capital-input-wrap">
          <span>직접 입력</span>
          <div>
            <input
              id="capitalInput"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={capitalModal.selection ? capitalModal.selection.toLocaleString("ko-KR") : ""}
              onChange={(event) => setCapitalSelection(parseMoney(event.target.value))}
            />
            <b>원</b>
          </div>
        </label>
        <div className="capital-preview">
          <div>
            <span id="capitalChoiceLabel">{isReplace ? "선택한 가상 자본" : "추가 후 업무 가능 자본"}</span>
            <strong id="capitalTotalPreview">{formatUsdt(resultingCapital)}</strong>
          </div>
          <p id="capitalEligible">금액은 입금이 확인된 뒤 서버 숫자로만 보여 드려요.</p>
        </div>
        <div className="modal-actions">
          <button id="capitalCancel" className="modal-secondary" type="button" onClick={closeCapitalModal}>
            취소
          </button>
          <button
            id="capitalConfirm"
            className="modal-primary"
            type="button"
            disabled={capitalModal.selection < 10000}
            onClick={confirmCapital}
          >
            {isReplace ? "이 자본으로 시작하기" : "가상 자본 추가하기"}
          </button>
        </div>
      </section>
    </div>
  );
}
