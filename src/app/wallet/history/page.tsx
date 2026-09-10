"use client";

import { useEffect, useState } from "react";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { WalletSummaryStrip } from "@/components/gpt/WalletSummaryStrip";
import { formatTime } from "@/lib/gpt/format";
import { getLedgerJournals, journalSingleAmount, readJournals, type JournalRow } from "@/lib/api";
import { MSG } from "@/lib/messages";

function amountLabel(row: JournalRow) {
  const amount = journalSingleAmount(row);
  if (amount == null) return MSG.ledgerDetailNeed;
  if (amount === "0") return amount;
  return amount;
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
          rows.map((row) => (
            <article className="ledger-row" key={row.key}>
              <span className="ledger-icon" aria-hidden="true">
                ·
              </span>
              <div>
                <strong>{row.journalType || MSG.ledgerDetailNeed}</strong>
                <small>{row.createdAt ? formatTime(row.createdAt) : ""}</small>
              </div>
              <b>{amountLabel(row)}</b>
            </article>
          ))
        )}
      </section>
    </RouteScreen>
  );
}
