"use client";

import { useRouter } from "next/navigation";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { useMining } from "@/lib/mining/MiningContext";
import {
  POSITION_STATUS_LABEL,
  SETTLEMENT_STATUS_LABEL,
  formatAssetAmount,
  formatMiningTime,
} from "@/lib/mining/presentation";
import type { MiningPosition, MiningSettlement } from "@/lib/mining/types";

function mineLabel(position: MiningPosition, mines: Map<string, string>) {
  return mines.get(position.mineId) ?? "광산";
}

function PositionHistoryCard({
  position,
  mineName,
}: {
  position: MiningPosition;
  mineName: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
            {POSITION_STATUS_LABEL[position.status]}
          </span>
          <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">{mineName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {position.currentDailyRate ? "현재 채굴률이 서버에서 제공됩니다." : "현재 채굴률을 확인할 수 없습니다."}
          </p>
        </div>
        <strong className="text-base font-black text-slate-950">
          {formatAssetAmount(position.principalAmount, position.assetCode) ?? "표시할 금액이 없어요"}
        </strong>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">운용 수익</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {formatAssetAmount(position.accruedProfitAmount, position.assetCode) ?? "표시할 금액이 없어요"}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">종료 시각</dt>
          <dd className="mt-1 font-bold text-slate-800">{formatMiningTime(position.endedAt) ?? "진행 중"}</dd>
        </div>
      </dl>
    </article>
  );
}

function SettlementHistoryCard({ settlement }: { settlement: MiningSettlement }) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800">
            {SETTLEMENT_STATUS_LABEL[settlement.status]}
          </span>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {formatMiningTime(settlement.periodEndAt) ?? "정산 시각 확인 중"}
          </p>
        </div>
        <strong className="text-lg font-black text-slate-950">
          {formatAssetAmount(settlement.profitAmount, settlement.assetCode) ?? "표시할 금액이 없어요"}
        </strong>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">정산 구간 시작</dt>
          <dd className="mt-1 font-bold text-slate-800">{formatMiningTime(settlement.periodStartAt) ?? "확인 중"}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">정산 구간 종료</dt>
          <dd className="mt-1 font-bold text-slate-800">{formatMiningTime(settlement.periodEndAt) ?? "확인 중"}</dd>
        </div>
      </dl>
    </article>
  );
}

export function MiningActivity() {
  const router = useRouter();
  const { loggedIn } = useGptSession();
  const mining = useMining();
  const mineNames = new Map(mining.mines.map((mine) => [mine.mineId, mine.displayName]));

  if (!loggedIn) {
    return (
      <section className="mx-auto w-full max-w-[900px] px-4 pb-16 pt-8 sm:px-6" aria-labelledby="activity-title">
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <span className="text-xs font-black tracking-[0.16em] text-amber-700">MINING ACTIVITY</span>
          <h1 id="activity-title" className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">채굴 활동</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">로그인하면 서버에 기록된 운용 상태와 정산 내역을 확인할 수 있어요.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-6 h-11 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white"
          >
            로그인하기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mine-client-shell mx-auto w-full max-w-[1080px] px-4 pb-16 pt-5 sm:px-6 lg:px-8" aria-labelledby="activity-title">
      <header className="flex flex-col gap-4 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black tracking-[0.16em] text-amber-700">MINING ACTIVITY</span>
          <h1 id="activity-title" className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">채굴 활동</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            서버가 반환한 운용 상태와 정산 기록을 그대로 보여 줍니다. 화면에서 수익을 합산하거나 정산 결과를 다시 계산하지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void mining.refresh()}
          disabled={mining.refreshing}
          className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-50"
        >
          {mining.refreshing ? "서버 확인 중" : "새로고침"}
        </button>
      </header>

      {mining.error ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900" role="alert">
          {mining.error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="settlement-history-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[0.12em] text-emerald-700">SERVER SETTLEMENTS</p>
              <h2 id="settlement-history-title" className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">정산 기록</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">최근 {mining.settlements.length}건</span>
          </div>

          {!mining.ready ? (
            <div className="rounded-2xl bg-white p-6 text-sm font-semibold text-slate-500">서버 기록을 확인하고 있어요.</div>
          ) : mining.settlements.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-sm leading-6 text-slate-500">아직 서버에 정산 기록이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {mining.settlements.map((settlement) => (
                <SettlementHistoryCard key={settlement.settlementId} settlement={settlement} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="position-history-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[0.12em] text-amber-700">SERVER POSITIONS</p>
              <h2 id="position-history-title" className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">운용 기록</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">최근 {mining.positions.length}건</span>
          </div>

          {!mining.ready ? (
            <div className="rounded-2xl bg-white p-6 text-sm font-semibold text-slate-500">운용 기록을 확인하고 있어요.</div>
          ) : mining.positions.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-sm leading-6 text-slate-500">아직 서버에 운용 기록이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {mining.positions.map((position) => (
                <PositionHistoryCard
                  key={position.positionId}
                  position={position}
                  mineName={mineLabel(position, mineNames)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
