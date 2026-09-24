"use client";

import { useMemo } from "react";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { useMining } from "@/lib/mining/MiningContext";
import {
  MINING_LIVE_RESYNC_MS,
  presentLiveMiningProfit,
} from "@/lib/mining/presentation";
import { useMiningPresentationClock } from "@/lib/mining/useMiningPresentationClock";
import type { MiningPosition, MiningSettlement, PositionStatus, SettlementStatus } from "@/lib/mining/types";
import { useWallet } from "@/lib/wallet/WalletContext";
import { formatKrw, formatUsdt } from "@/lib/gpt/format";

const amountFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});
const liveResyncSeconds = MINING_LIVE_RESYNC_MS / 1_000;

function formatAssetAmount(value: string | null | undefined, assetCode: string | null | undefined) {
  if (value == null || value === "") return "표시할 금액이 없어요";
  const numeric = Number(value);
  const formatted = Number.isFinite(numeric) ? amountFormatter.format(numeric) : value;
  return assetCode ? `${formatted} ${assetCode}` : formatted;
}

function formatDate(value: string | null) {
  if (!value) return "일정 확인 중";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "일정 확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function positionStatusLabel(status: PositionStatus) {
  switch (status) {
    case "START_PENDING":
      return "운용 시작 중";
    case "ACTIVE":
      return "운용 중";
    case "DECREASE_PENDING":
      return "감액 처리 중";
    case "END_PENDING":
      return "운용 종료 중";
    case "ENDED":
      return "운용 종료";
  }
}

function settlementStatusLabel(status: SettlementStatus) {
  switch (status) {
    case "CALC_PENDING":
      return "정산 계산 중";
    case "CALCULATED":
      return "정산 확인 중";
    case "LEDGER_POSTED":
      return "정산 완료";
    case "FAILED":
      return "정산 재확인 중";
    case "REVIEW_REQUIRED":
      return "정산 검토 중";
  }
}

function StatCard({
  label,
  value,
  detail,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  loading: boolean;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-6">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <strong className="mt-3 block break-words text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
        {loading ? "확인 중" : value}
      </strong>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function PositionCard({
  position,
  mineName,
  syncedAt,
  nowMs,
}: {
  position: MiningPosition;
  mineName: string;
  syncedAt: string | null;
  nowMs: number | null;
}) {
  const liveProfit = presentLiveMiningProfit(position, syncedAt, nowMs);
  const isInterpolated = liveProfit.source === "interpolated";

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-blue-600">{positionStatusLabel(position.status)}</p>
          <h3 className="mt-1 truncate text-lg font-black tracking-[-0.03em] text-slate-950">{mineName}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {position.assetCode}
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">운용 금액</dt>
          <dd className="mt-1 text-sm font-black text-slate-900">
            {formatAssetAmount(position.principalAmount, position.assetCode)}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">
            {isInterpolated ? "채굴 수익 · 표시용 예상" : "채굴 수익 · 서버 값"}
          </dt>
          <dd className="mt-1 text-sm font-black text-slate-900">
            {formatAssetAmount(liveProfit.amount, position.assetCode)}
          </dd>
        </div>
      </dl>
      <div className="mt-4 space-y-1 text-xs leading-5 text-slate-500">
        <p>다음 정산 {formatDate(position.nextSettlementAt)}</p>
        <p>
          {liveProfit.stale
            ? "서버 재동기화 대기 · 실제 수익과 정산은 서버 기준"
            : isInterpolated
              ? `서버 스냅샷 이후 표시용으로 흐르는 값 · ${liveResyncSeconds}초마다 재동기화`
              : "서버가 계산한 최신 채굴 수익"}
        </p>
      </div>
    </article>
  );
}

function SettlementRow({ settlement }: { settlement: MiningSettlement }) {
  return (
    <li className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-slate-900">{settlementStatusLabel(settlement.status)}</p>
        <p className="mt-1 text-xs text-slate-500">{formatDate(settlement.periodEndAt ?? settlement.periodStartAt)}</p>
      </div>
      <strong className="text-base font-black text-slate-950">
        {formatAssetAmount(settlement.profitAmount, settlement.assetCode)}
      </strong>
    </li>
  );
}

export function MiningHome() {
  const { displayName } = useGptSession();
  const mining = useMining();
  const wallet = useWallet();
  const presentationNowMs = useMiningPresentationClock();

  const mineNames = useMemo(
    () => new Map(mining.mines.map((mine) => [mine.mineId, mine.displayName])),
    [mining.mines],
  );

  const visiblePositions = mining.positions.slice(0, 3);
  const recentSettlements = mining.settlements.slice(0, 3);
  const summaryAsset = mining.summary?.assetCode ?? "USDT";
  const activePosition =
    mining.summary?.activePositionCount === 1
      ? mining.positions.find((position) => position.status === "ACTIVE")
      : undefined;
  const activePresentation = activePosition
    ? presentLiveMiningProfit(activePosition, mining.liveProfit.syncedAt, presentationNowMs)
    : null;
  const todayMiningValue =
    mining.summary?.activePositionCount === 0
      ? formatAssetAmount("0", summaryAsset)
      : mining.summary?.activePositionCount === 1 && activePosition && activePresentation
        ? formatAssetAmount(activePresentation.amount, activePosition.assetCode)
        : "광산별 확인";
  const todayMiningDetail =
    mining.summary?.activePositionCount === 0
      ? "운용 중인 채굴이 없어요"
      : mining.summary?.activePositionCount === 1 && activePosition && activePresentation
        ? activePresentation.stale
          ? "서버 재동기화 대기 · 실제 수익과 정산은 서버 기준"
          : activePresentation.source === "interpolated"
            ? `서버 스냅샷 기반 표시용 예상 · ${liveResyncSeconds}초마다 서버 재동기화`
            : "현재 정산 구간의 서버 채굴 수익"
        : "서버 수익은 아래 채굴장별로 표시해요";
  const loading = !mining.ready || !wallet.ready;
  const withdrawablePrimary =
    wallet.withdrawable.profitKrw != null
      ? formatKrw(wallet.withdrawable.profitKrw)
      : wallet.withdrawable.profitUsdt != null
        ? formatUsdt(wallet.withdrawable.profitUsdt)
        : "표시할 금액이 없어요";
  const withdrawableSecondary =
    wallet.withdrawable.profitKrw != null && wallet.withdrawable.profitUsdt != null
      ? formatUsdt(wallet.withdrawable.profitUsdt)
      : "출금 가능한 확정 수익";

  async function refreshHome() {
    await Promise.all([mining.refresh(), wallet.refresh()]);
  }

  return (
    <section className="mine-client-shell mx-auto w-full max-w-[1180px] px-4 pb-12 pt-3 sm:px-6 lg:px-8" aria-labelledby="mining-home-title">
      <header className="flex flex-col gap-4 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black tracking-[0.16em] text-blue-600">PUTDUK MINING</span>
          <h1 id="mining-home-title" className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {displayName ? `${displayName}님의 채굴 홈` : "나의 채굴 홈"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            서버 스냅샷을 기준으로 운용 상태를 확인하고, 채굴 수익은 짧은 구간만 표시용으로 부드럽게 보여드려요.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            서버 동기화 {formatDate(mining.liveProfit.syncedAt)} · 실제 수익·정산·출금 가능 금액은 서버 응답이 기준입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshHome()}
          disabled={mining.refreshing || wallet.refreshing}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-wait disabled:opacity-60"
        >
          {mining.refreshing || wallet.refreshing ? "새로고침 중" : "최신 상태 보기"}
        </button>
      </header>

      {mining.error || wallet.error ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
          {mining.error ?? wallet.error}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3" aria-label="채굴 요약">
        <StatCard
          label="오늘 채굴"
          value={todayMiningValue}
          detail={todayMiningDetail}
          loading={!mining.ready}
        />
        <StatCard
          label="운용 중"
          value={formatAssetAmount(mining.summary?.activePrincipalAmount, summaryAsset)}
          detail={mining.summary ? `운용 중인 채굴 ${mining.summary.activePositionCount}건` : "운용 상태 확인 중"}
          loading={!mining.ready}
        />
        <StatCard
          label="출금 가능"
          value={withdrawablePrimary}
          detail={withdrawableSecondary}
          loading={!wallet.ready}
        />
      </section>

      <section className="mt-8" aria-labelledby="my-mines-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.14em] text-slate-400">MY MINING</p>
            <h2 id="my-mines-title" className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">내 채굴장</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">최근 운용 {visiblePositions.length}건</span>
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">채굴장을 확인하고 있어요.</div>
        ) : visiblePositions.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {visiblePositions.map((position) => (
              <PositionCard
                key={position.positionId}
                position={position}
                mineName={mineNames.get(position.mineId) ?? "퍼뜩 광산"}
                syncedAt={mining.liveProfit.syncedAt}
                nowMs={presentationNowMs}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-7 text-center">
            <strong className="text-base font-black text-slate-900">아직 운용 중인 채굴장이 없어요.</strong>
            <p className="mt-2 text-sm text-slate-500">광산 메뉴에서 조건을 확인하고 실제 서버 운용을 시작할 수 있어요.</p>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="recent-settlements-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.14em] text-slate-400">SETTLEMENT</p>
            <h2 id="recent-settlements-title" className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">최근 정산</h2>
          </div>
          {mining.summary?.lastSettledAt ? (
            <span className="text-xs font-semibold text-slate-500">최근 {formatDate(mining.summary.lastSettledAt)}</span>
          ) : null}
        </div>

        {loading ? (
          <p className="py-6 text-sm font-semibold text-slate-500">정산 내역을 확인하고 있어요.</p>
        ) : recentSettlements.length > 0 ? (
          <ul className="mt-3">
            {recentSettlements.map((settlement) => (
              <SettlementRow key={settlement.settlementId} settlement={settlement} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm text-slate-500">아직 표시할 정산 내역이 없어요.</p>
        )}
      </section>
    </section>
  );
}
