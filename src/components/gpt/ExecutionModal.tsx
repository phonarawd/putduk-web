"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EXECUTION_STEPS } from "@/lib/gpt/constants";
import { formatKrw, formatSignedKrw } from "@/lib/gpt/format";
import { isTerminal, useGpt } from "@/lib/gpt/GptContext";
import { opportunityById } from "@/lib/gpt/opportunities";
import type { ActiveExecution } from "@/lib/gpt/types";
import { useModalFocus } from "@/lib/gpt/useModalFocus";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ResultAmount({ execution }: { execution: ActiveExecution }) {
  const success = execution.status === "success";
  // 모션 축소 선호 시엔 처음부터 최종 값으로 시작해 애니메이션을 건너뛴다(effect에서 값을 되돌리지 않는다).
  const [display, setDisplay] = useState(() => (success && !prefersReducedMotion() ? 0 : execution.expectedProfitKrw));
  const animatedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!success || prefersReducedMotion()) return;
    if (animatedForRef.current === execution.tradeId) return;
    animatedForRef.current = execution.tradeId;
    const target = execution.expectedProfitKrw;
    const started = performance.now();
    const duration = 820;
    let frame = 0;
    function step(now: number) {
      const progress = Math.min(1, (now - started) / duration);
      const current = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      setDisplay(current);
      if (progress < 1) frame = window.requestAnimationFrame(step);
    }
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [success, execution.tradeId, execution.expectedProfitKrw]);

  if (!success) return <>잠근 금액 전액 반환</>;
  return <>{formatSignedKrw(display)}</>;
}

export function ExecutionModal() {
  const { state, activeExecution, celebrate, closeExecution, selectNextOpportunity } = useGpt();
  const containerRef = useRef<HTMLDivElement>(null);
  const open = Boolean(activeExecution);
  useModalFocus(open, containerRef);

  useEffect(() => {
    if (!activeExecution) return;
    const execution = activeExecution;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isTerminal(execution.status)) closeExecution("home");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeExecution, closeExecution]);

  if (!activeExecution) {
    return (
      <div id="executionModal" className="modal execution-modal" hidden>
        <div className="modal-backdrop execution-backdrop" />
        <section className="modal-card execution-modal-card" role="dialog" aria-modal="true" aria-labelledby="executionAsset" />
      </div>
    );
  }

  const opportunity = opportunityById(activeExecution.opportunityId, state.feed);
  const terminal = isTerminal(activeExecution.status);
  const success = activeExecution.status === "success";
  const safe = activeExecution.status === "safe_stop";
  const rechecking = activeExecution.status === "rechecking";

  return (
    <div id="executionModal" className="modal execution-modal" hidden={false}>
      <div className="modal-backdrop execution-backdrop" />
      <section
        ref={containerRef}
        className="modal-card execution-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="executionAsset"
      >
        <div id="celebrationBurst" className={"celebration-burst" + (celebrate ? " is-active" : "")} aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <div className="execution-top">
          <span id="executionStatus" className={"execution-status" + (success ? " is-success" : safe ? " is-safe" : "")}>
            <i></i> {success ? "정산 완료" : safe ? "안전 중단" : rechecking ? "조건 재확인" : "자동 처리 중"}
          </span>
          <span id="executionTradeId" className="execution-id">
            {activeExecution.tradeId}
          </span>
        </div>
        <div className="execution-heading">
          <span
            id="executionSymbol"
            className="execution-symbol"
            style={{ "--exec-one": opportunity.artOne, "--exec-two": opportunity.artTwo } as CSSProperties}
          >
            {opportunity.symbol}
          </span>
          <div>
            <h2 id="executionAsset">{activeExecution.title}</h2>
            <p id="executionRoute">
              {opportunity.lowMarket} → {opportunity.highMarket} · 조건 v{activeExecution.pricingVersion}
            </p>
          </div>
        </div>
        <div className="execution-progress-row">
          <span>AI 업무 진행</span>
          <strong id="executionProgressText">{activeExecution.progress}%</strong>
        </div>
        <div className="execution-progress">
          <span id="executionProgressBar" style={{ width: activeExecution.progress + "%" }} />
        </div>
        <ol id="executionStepList" className="execution-steps">
          {EXECUTION_STEPS.map((step, index) => {
            const done = success || (!terminal && index < activeExecution.stepIndex);
            const active = !terminal && index === activeExecution.stepIndex;
            const stopped = safe && index === activeExecution.stepIndex;
            const className = done ? "is-done" : stopped ? "is-safe" : active ? "is-active" : "";
            return (
              <li key={step.short} className={className}>
                <span>{done ? "✓" : stopped ? "!" : index + 1}</span>
                <strong>{step.short}</strong>
              </li>
            );
          })}
        </ol>
        <div className="execution-message">
          <span className="message-wave" aria-hidden="true" hidden={terminal}>
            <i></i><i></i><i></i>
          </span>
          <p id="executionMessage">{activeExecution.message}</p>
        </div>
        <div className="execution-amount">
          <span>이번 업무 자본</span>
          <strong id="executionAmount">{formatKrw(activeExecution.capitalKrw)}</strong>
        </div>
        <div id="executionResult" className={"execution-result" + (safe ? " is-safe" : "")} hidden={!terminal}>
          <span id="executionResultIcon" className="result-icon" aria-hidden="true">
            {success ? "✓" : "↩"}
          </span>
          <div>
            <span id="executionResultMeta">{success ? "정산 완료" : "안전 중단 완료"}</span>
            <h3 id="executionResultTitle">{success ? "✨ 리셀 업무 성공!" : "이번 기회는 안전하게 멈췄어요"}</h3>
            <p id="executionResultCopy">
              {success
                ? "사용한 자본은 돌아오고 수익이 내 지갑에 반영됐어요."
                : "가격 조건이 달라져 매칭하지 않았어요. 잠근 자본과 기회가 모두 돌아왔어요."}
            </p>
            <strong id="executionResultAmount">
              <ResultAmount execution={activeExecution} />
            </strong>
          </div>
        </div>
        <div className="modal-actions execution-actions">
          <button id="executionClose" className="modal-secondary" type="button" hidden={!terminal} onClick={() => closeExecution("me")}>
            기록 보기
          </button>
          <button id="executionNext" className="modal-primary" type="button" hidden={!terminal} onClick={selectNextOpportunity}>
            다음 기회 보기
          </button>
        </div>
      </section>
    </div>
  );
}
