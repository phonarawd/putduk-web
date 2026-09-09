"use client";

import { useEffect, useState } from "react";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { WalletSummaryStrip } from "@/components/gpt/WalletSummaryStrip";
import { formatKrw, formatTime, formatUsdt } from "@/lib/gpt/format";
import { getLedgerJournals, journalDirection, journalHasAmount, readJournals, type JournalRow } from "@/lib/api";
import { MSG } from "@/lib/messages";

function amountLabel(row: JournalRow, direction: ReturnType<typeof journalDirection>) {
  if (!journalHasAmount(row)) return MSG.ledgerAmountEmpty;
  const prefix = direction === "in" ? "+" : direction === "out" ? "−" : "";
  if (row.amountKrw != null && row.amountKrw !== 0) return prefix + formatKrw(Math.abs(row.amountKrw));
  if (row.amountUsdt != null && row.amountUsdt !== 0) return prefix + formatUsdt(Math.abs(row.amountUsdt));
  return MSG.ledgerAmountEmpty;
}

export default function WalletHistoryPage() {
  const [rows, setRows] = useState<JournalRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  function loadRows() {
    getLedgerJournals()
      .then((data) => {
        setFailed(false);
        setRows(readJournals(data));
      })
      .catch(() => {
        setFailed(true);
        setRows([]);
      });
  }

  useEffect(() => {
    loadRows();
  }, []);

  return (
    <RouteScreen>
      <RouteTop kicker="지갑 기록" title="입출금 내역" copy="입금 신청, 출금 요청과 수익 반영 기록을 확인하세요." backPath="/me" />
      <WalletSummaryStrip />
      <section className="ledger-card">
        {rows == null ? (
          <div className="plain-notice">
            <strong>기록을 확인하고 있어요.</strong>
          </div>
        ) : failed ? (
          <div className="plain-notice">
            <strong>내역을 가져오지 못했어요.</strong>
            <p>잠시 후 다시 확인해 주세요.</p>
            <button type="button" className="text-action" onClick={loadRows}>
              {MSG.withdrawPolicyRetry}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="plain-notice">
            <strong>아직 입출금 기록이 없어요.</strong>
            <p>신청이 반영되면 여기에 모여요.</p>
          </div>
        ) : (
          rows.map((row) => {
            const direction = journalDirection(row);
            return (
              <article className="ledger-row" key={row.key}>
                <span className={"ledger-icon" + (direction === "in" ? " positive" : "")} aria-hidden="true">
                  {direction === "in" ? "↓" : direction === "out" ? "↑" : "·"}
                </span>
                <div>
                  <strong>{row.type}</strong>
                  <small>
                    {[row.status, row.date ? formatTime(row.date) : ""].filter(Boolean).join(" · ")}
                  </small>
                </div>
                <b className={direction === "in" ? "positive" : ""}>{amountLabel(row, direction)}</b>
                {journalHasAmount(row) && row.amountUsdt != null && row.amountKrw != null && row.amountUsdt !== 0 ? (
                  <small>
                    {(direction === "in" ? "+" : direction === "out" ? "−" : "") + formatUsdt(Math.abs(row.amountUsdt))}
                  </small>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </RouteScreen>
  );
}
