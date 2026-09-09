"use client";

import type { CSSProperties } from "react";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { formatMoneyPrimary, formatSignedMoneyPrimary, formatTime } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import { opportunityById } from "@/lib/gpt/opportunities";

function statusLabel(status: string) {
  const value = status.toLowerCase();
  if (value === "success" || value === "completed" || value === "settled") return "정산 완료";
  if (value === "safe_stop") return "안전 중단";
  if (value === "failed" || value === "cancelled") return "중단";
  if (value === "running" || value === "pending" || value === "in_progress" || value === "open" || value === "active") {
    return "진행 중";
  }
  return status ? "처리 중" : "";
}

export default function WorkPage() {
  const { state } = useGpt();
  const trades = state.trades;

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work" aria-labelledby="work-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">참여와 정산</span>
            <h1 id="work-title">기록</h1>
            <p>참여한 일의 결과만 보여 드려요. 화면에 없는 숫자는 만들지 않아요.</p>
          </div>
          <span className="view-count">{trades.length}건</span>
        </div>

        <div id="historyList" className="history-list" aria-live="polite">
          {state.recordsError ? (
            <div className="history-empty">
              <span aria-hidden="true">!</span>
              <strong>기록을 가져오지 못했어요</strong>
              <p>잠시 후 다시 확인해 주세요.</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="history-empty">
              <span aria-hidden="true">✓</span>
              <strong>아직 기록이 없어요</strong>
              <p>{state.deskReady ? "첫 참여가 끝나면 여기에 모여요." : "기록을 확인하고 있어요."}</p>
            </div>
          ) : (
            trades.map((trade) => {
              const opportunity = opportunityById(trade.opportunityId, state.feed);
              const done = /success|completed|settled/i.test(trade.status);
              const profit = formatSignedMoneyPrimary(trade.settledProfitUsdt ?? null, trade.settledProfitKrw);
              return (
                <article className="history-row" key={trade.tradeId}>
                  <span
                    className="history-symbol"
                    style={{ "--row-one": opportunity.artOne, "--row-two": opportunity.artTwo } as CSSProperties}
                  >
                    {opportunity.symbol || "퍼"}
                  </span>
                  <div className="history-main">
                    <strong>{trade.title}</strong>
                    <small>
                      {statusLabel(trade.status)}
                      {trade.createdAt ? ` · ${formatTime(trade.createdAt)}` : ""}
                    </small>
                  </div>
                  <div className="history-result">
                    <strong className={done ? "" : "is-safe"}>
                      {profit ?? formatMoneyPrimary(null, trade.capitalKrw) ?? "아직 표시할 금액이 없어요"}
                    </strong>
                    <small>{done ? "지갑 반영" : "처리 결과"}</small>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </WorkspaceView>
  );
}
