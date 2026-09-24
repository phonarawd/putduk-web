"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { useMining } from "@/lib/mining/MiningContext";
import { newMiningIdempotencyKey } from "@/lib/mining/api";
import {
  MINING_LIVE_RESYNC_MS,
  presentLiveMiningProfit,
} from "@/lib/mining/presentation";
import type { MiningPosition, PositionStatus, TrialStatus } from "@/lib/mining/types";
import { useMiningPresentationClock } from "@/lib/mining/useMiningPresentationClock";

const liveResyncSeconds = MINING_LIVE_RESYNC_MS / 1_000;

type OperationKind = "start" | "increase" | "decrease" | "end";

type SelectedOperation = {
  kind: Exclude<OperationKind, "start">;
  position: MiningPosition;
};

type Confirmation = {
  kind: OperationKind;
  positionId: string | null;
  principalAmount: string | null;
  assetCode: string;
  idempotencyKey: string;
};

type MutationNotice = {
  kind: "network" | "server";
  message: string;
};

function positionStatusLabel(status: PositionStatus): string {
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

function trialStatusLabel(status: TrialStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "체험 시작 전";
    case "ACTIVE":
      return "체험 진행 중";
    case "COMPLETED":
      return "체험 완료";
    case "EXPIRED":
      return "체험 만료";
  }
}

function operationLabel(kind: OperationKind): string {
  switch (kind) {
    case "start":
      return "채굴 시작";
    case "increase":
      return "금액 늘리기";
    case "decrease":
      return "금액 줄이기";
    case "end":
      return "운용 종료";
  }
}

function amountLabel(value: string | null | undefined, assetCode: string): string {
  return value ? `${value} ${assetCode}` : "확인 중";
}

function formatDate(value: string | null): string {
  if (!value) return "확인 중";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isPositiveAmountText(value: string): boolean {
  const trimmed = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)) return false;
  return /[1-9]/.test(trimmed);
}

function mutationNotice(error: unknown): MutationNotice {
  if (error instanceof ApiError && error.status === 0) {
    return {
      kind: "network",
      message:
        "서버 응답을 확인하지 못했어요. 같은 확인 요청으로 다시 시도하면 동일한 요청 키를 재사용합니다.",
    };
  }
  return {
    kind: "server",
    message: error instanceof Error && error.message ? error.message : "요청을 처리하지 못했어요.",
  };
}

function PositionCard({
  position,
  disabled,
  onSelect,
  syncedAt,
  nowMs,
}: {
  position: MiningPosition;
  disabled: boolean;
  onSelect: (kind: SelectedOperation["kind"], position: MiningPosition) => void;
  syncedAt: string | null;
  nowMs: number | null;
}) {
  const liveProfit = presentLiveMiningProfit(position, syncedAt, nowMs);
  const isInterpolated = liveProfit.source === "interpolated";

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-600">{positionStatusLabel(position.status)}</p>
          <p className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
            {amountLabel(position.principalAmount, position.assetCode)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {position.assetCode}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">
            {isInterpolated ? "채굴 수익 · 표시용 예상" : "채굴 수익 · 서버 값"}
          </dt>
          <dd className="mt-1 break-words text-sm font-black text-slate-900">
            {amountLabel(liveProfit.amount, position.assetCode)}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">현재 일일율 · 서버 값</dt>
          <dd className="mt-1 break-words text-sm font-black text-slate-900">
            {position.currentDailyRate ?? "확인 중"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-1 text-xs leading-5 text-slate-500">
        <p>기준 시각 {formatDate(position.baselineAt)}</p>
        <p>다음 정산 {formatDate(position.nextSettlementAt)}</p>
        <p>
          {liveProfit.stale
            ? "서버 재동기화 대기 · 실제 수익과 정산은 서버 기준"
            : isInterpolated
              ? `서버 스냅샷 이후 표시용으로 흐르는 값 · ${liveResyncSeconds}초마다 재동기화`
              : "서버가 계산한 최신 채굴 수익"}
        </p>
        {position.endedAt ? <p>종료 시각 {formatDate(position.endedAt)}</p> : null}
      </div>

      {position.status === "ACTIVE" ? (
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect("increase", position)}
            className="rounded-xl border border-slate-200 px-2 py-3 text-xs font-black text-slate-700 transition hover:border-slate-300 disabled:cursor-wait disabled:opacity-50"
          >
            금액 늘리기
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect("decrease", position)}
            className="rounded-xl border border-slate-200 px-2 py-3 text-xs font-black text-slate-700 transition hover:border-slate-300 disabled:cursor-wait disabled:opacity-50"
          >
            금액 줄이기
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect("end", position)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-3 text-xs font-black text-rose-700 transition hover:border-rose-300 disabled:cursor-wait disabled:opacity-50"
          >
            운용 종료
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function MineDetail({ mineId }: { mineId: string }) {
  const { loggedIn } = useGptSession();
  const mining = useMining();
  const { loadMine, clearActiveMine } = mining;
  const presentationNowMs = useMiningPresentationClock();
  const [detailError, setDetailError] = useState<string | null>(null);
  const [startAmount, setStartAmount] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<SelectedOperation | null>(null);
  const [operationAmount, setOperationAmount] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<MutationNotice | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMine(mineId).catch((error: unknown) => {
      if (cancelled) return;
      setDetailError(error instanceof Error ? error.message : "광산 상세 정보를 불러오지 못했어요.");
    });
    return () => {
      cancelled = true;
      clearActiveMine();
    };
  }, [mineId, loadMine, clearActiveMine]);

  const mine =
    mining.activeMine?.mineId === mineId
      ? mining.activeMine
      : mining.mines.find((item) => item.mineId === mineId) ?? null;
  const positions = mining.positions.filter((position) => position.mineId === mineId);
  const activePositions = positions.filter((position) => position.status === "ACTIVE");
  const mutationBusy = mining.mutationPending !== null;

  function resetOperationEditor() {
    setSelectedOperation(null);
    setOperationAmount("");
    setConfirmation(null);
    setNotice(null);
  }

  function prepareStart() {
    if (!mine) return;
    if (!isPositiveAmountText(startAmount)) {
      setNotice({ kind: "server", message: "운용 금액을 숫자로 입력해 주세요." });
      return;
    }
    setNotice(null);
    setSuccessMessage(null);
    setConfirmation({
      kind: "start",
      positionId: null,
      principalAmount: startAmount.trim(),
      assetCode: mine.assetCode,
      idempotencyKey: newMiningIdempotencyKey(),
    });
  }

  function selectOperation(kind: SelectedOperation["kind"], position: MiningPosition) {
    setSelectedOperation({ kind, position });
    setOperationAmount("");
    setConfirmation(null);
    setNotice(null);
    setSuccessMessage(null);
  }

  function prepareSelectedOperation() {
    if (!selectedOperation) return;
    if (selectedOperation.kind !== "end" && !isPositiveAmountText(operationAmount)) {
      setNotice({ kind: "server", message: "변경할 금액을 숫자로 입력해 주세요." });
      return;
    }
    setNotice(null);
    setConfirmation({
      kind: selectedOperation.kind,
      positionId: selectedOperation.position.positionId,
      principalAmount: selectedOperation.kind === "end" ? null : operationAmount.trim(),
      assetCode: selectedOperation.position.assetCode,
      idempotencyKey: newMiningIdempotencyKey(),
    });
  }

  async function submitConfirmation() {
    if (!confirmation || !mine) return;
    setNotice(null);
    try {
      if (confirmation.kind === "start" && confirmation.principalAmount) {
        await mining.startPosition({
          mineId: mine.mineId,
          principalAmount: confirmation.principalAmount,
          assetCode: confirmation.assetCode,
          idempotencyKey: confirmation.idempotencyKey,
        });
      } else if (
        confirmation.kind === "increase" &&
        confirmation.positionId &&
        confirmation.principalAmount
      ) {
        await mining.increasePosition({
          positionId: confirmation.positionId,
          principalAmount: confirmation.principalAmount,
          assetCode: confirmation.assetCode,
          idempotencyKey: confirmation.idempotencyKey,
        });
      } else if (
        confirmation.kind === "decrease" &&
        confirmation.positionId &&
        confirmation.principalAmount
      ) {
        await mining.decreasePosition({
          positionId: confirmation.positionId,
          principalAmount: confirmation.principalAmount,
          assetCode: confirmation.assetCode,
          idempotencyKey: confirmation.idempotencyKey,
        });
      } else if (confirmation.kind === "end" && confirmation.positionId) {
        await mining.endPosition({
          positionId: confirmation.positionId,
          idempotencyKey: confirmation.idempotencyKey,
        });
      } else {
        throw new Error("요청 정보를 다시 확인해 주세요.");
      }

      setSuccessMessage(`${operationLabel(confirmation.kind)} 요청이 서버에 반영됐어요.`);
      if (confirmation.kind === "start") setStartAmount("");
      resetOperationEditor();
    } catch (error) {
      setNotice(mutationNotice(error));
    }
  }

  if (!mine && !detailError) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-slate-200 bg-white p-7 text-sm font-semibold text-slate-500">
          광산 상세 정보를 확인하고 있어요.
        </div>
      </section>
    );
  }

  if (!mine) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-7">
          <strong className="text-base font-black text-rose-900">광산을 불러오지 못했어요.</strong>
          <p className="mt-2 text-sm text-rose-700">{detailError}</p>
          <Link href="/work" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
            광산 목록으로
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mine-client-shell mx-auto w-full max-w-[1180px] px-4 pb-14 pt-4 sm:px-6 lg:px-8" aria-labelledby="mine-detail-title">
      <div className="py-4">
        <Link href="/work" className="text-sm font-bold text-slate-500 transition hover:text-slate-900">
          ← 광산 목록
        </Link>
      </div>

      <header className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.07)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <span className="text-xs font-black tracking-[0.16em] text-blue-600">MINE DETAIL</span>
            <h1 id="mine-detail-title" className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
              {mine.displayName}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{mine.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{mine.status}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">{mine.assetCode}</span>
          </div>
        </div>

        <dl className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">최소 운용</dt>
            <dd className="mt-1 break-words text-sm font-black text-slate-950">
              {amountLabel(mine.minPrincipalAmount, mine.assetCode)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">최대 운용</dt>
            <dd className="mt-1 break-words text-sm font-black text-slate-950">
              {amountLabel(mine.maxPrincipalAmount, mine.assetCode)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">현재 일일율 · 서버 값</dt>
            <dd className="mt-1 break-words text-sm font-black text-slate-950">
              {mine.currentDailyRate ?? "확인 중"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          운용 가능 여부와 금액 조건은 서버가 최종 확인합니다. 실시간처럼 흐르는 수익 표시는 마지막 서버 스냅샷 이후의 짧은 구간만 보간하며 실제 수익·정산·지갑 금액은 서버 응답이 기준입니다.
        </p>
      </header>

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900" role="status">
          {successMessage}
        </div>
      ) : null}

      {notice ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.kind === "network"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
          role="alert"
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="mine-positions-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-slate-400">MY POSITIONS</p>
              <h2 id="mine-positions-title" className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                내 운용
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">서버 동기화 {formatDate(mining.liveProfit.syncedAt)}</span>
          </div>

          {positions.length > 0 ? (
            <div className="space-y-3">
              {positions.map((position) => (
                <PositionCard
                  key={position.positionId}
                  position={position}
                  disabled={mutationBusy}
                  onSelect={selectOperation}
                  syncedAt={mining.liveProfit.syncedAt}
                  nowMs={presentationNowMs}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-7 text-center">
              <strong className="text-base font-black text-slate-900">이 광산의 운용 내역이 없어요.</strong>
              <p className="mt-2 text-sm text-slate-500">오른쪽에서 조건을 확인한 뒤 채굴을 시작할 수 있어요.</p>
            </div>
          )}
        </section>

        <aside className="space-y-4" aria-label="광산 운용 작업">
          {!loggedIn ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">채굴 시작</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">운용 요청은 로그인 후 진행할 수 있어요.</p>
              <Link href="/login" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
                로그인
              </Link>
            </div>
          ) : (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black tracking-[0.14em] text-amber-700">TRIAL MINING</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">24시간 체험 채굴</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-800">
                  {trialStatusLabel(mining.trial?.status ?? "NOT_STARTED")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                체험 원금과 수익 계산은 서버가 관리합니다. 체험 종료 시점과 수익 상한도 서버 설정을 기준으로 처리합니다.
              </p>
              {mining.trial?.grant?.amountKrw ? (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-500">체험 원금 기준</p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {mining.trial.grant.amountKrw.toLocaleString("ko-KR")} KRW
                  </p>
                </div>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-white p-3">
                  <p className="font-semibold text-slate-500">남은 횟수</p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {mining.trial?.remainingParticipations ?? 0}회
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <p className="font-semibold text-slate-500">체험 종료</p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {formatDate(mining.trial?.completesAt ?? null)}
                  </p>
                </div>
              </div>
              {mining.trial?.status === "ACTIVE" ? (
                <p className="mt-4 rounded-2xl border border-amber-100 bg-white px-3 py-3 text-xs leading-5 text-amber-900">
                  현재 이 계정에 진행 중인 체험 채굴이 있습니다. 실제 수익·정산 결과는 서버가 확정합니다.
                </p>
              ) : mining.trial?.status === "NOT_STARTED" &&
                (mining.trial?.remainingParticipations ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!mine) return;
                    setNotice(null);
                    setSuccessMessage(null);
                    void mining
                      .startTrial({
                        mineId: mine.mineId,
                        idempotencyKey: newMiningIdempotencyKey(),
                      })
                      .then(() => {
                        setSuccessMessage("체험 채굴을 시작했어요. 서버가 체험 시작 시각을 기준으로 관리합니다.");
                      })
                      .catch((error: unknown) => {
                        setNotice(mutationNotice(error));
                      });
                  }}
                  disabled={mutationBusy || mine.status !== "ACTIVE"}
                  className="mt-4 h-11 w-full rounded-2xl bg-amber-700 px-4 text-sm font-black text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {mine.status === "ACTIVE" ? "체험 채굴 시작" : "현재 신규 운용 불가"}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-xs font-black tracking-[0.14em] text-blue-600">START MINING</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">채굴 시작</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                금액을 입력한 뒤 조건 확인을 거쳐 서버에 운용 요청을 전송합니다.
              </p>
              <label className="mt-5 block text-xs font-bold text-slate-600" htmlFor="mining-start-amount">
                운용 금액 ({mine.assetCode})
              </label>
              <input
                id="mining-start-amount"
                inputMode="decimal"
                value={startAmount}
                onChange={(event) => {
                  setStartAmount(event.target.value);
                  setConfirmation(null);
                  setNotice(null);
                }}
                placeholder={mine.minPrincipalAmount ?? "운용 금액 입력"}
                disabled={mutationBusy || mine.status !== "ACTIVE"}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-bold text-slate-950 outline-none transition focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
              <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500">
                <span>최소 {amountLabel(mine.minPrincipalAmount, mine.assetCode)}</span>
                <span>최대 {amountLabel(mine.maxPrincipalAmount, mine.assetCode)}</span>
              </div>
              <button
                type="button"
                onClick={prepareStart}
                disabled={mutationBusy || mine.status !== "ACTIVE"}
                className="mt-5 h-11 w-full rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {mine.status === "ACTIVE" ? "조건 확인" : "현재 신규 운용 불가"}
              </button>
            </div>
          )}

          {selectedOperation ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black tracking-[0.14em] text-slate-400">POSITION ACTION</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                    {operationLabel(selectedOperation.kind)}
                  </h2>
                </div>
                <button type="button" onClick={resetOperationEditor} className="text-xs font-bold text-slate-500">
                  닫기
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                현재 운용 금액 {amountLabel(selectedOperation.position.principalAmount, selectedOperation.position.assetCode)}
              </p>

              {selectedOperation.kind !== "end" ? (
                <>
                  <label className="mt-5 block text-xs font-bold text-slate-600" htmlFor="mining-change-amount">
                    {selectedOperation.kind === "increase" ? "늘릴 금액" : "줄일 금액"} ({selectedOperation.position.assetCode})
                  </label>
                  <input
                    id="mining-change-amount"
                    inputMode="decimal"
                    value={operationAmount}
                    onChange={(event) => {
                      setOperationAmount(event.target.value);
                      setConfirmation(null);
                      setNotice(null);
                    }}
                    disabled={mutationBusy}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-bold text-slate-950 outline-none transition focus:border-blue-500 disabled:bg-slate-100"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    변경 후 운용 가능 범위는 서버가 최종 확인합니다. 화면에서 authoritative 결과 금액을 만들지 않습니다.
                  </p>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
                  운용 종료 시 서버가 정산 가능한 구간을 먼저 처리하고 운용 원금을 해제합니다. 완료 응답 전에는 화면 상태를 종료로 바꾸지 않습니다.
                </div>
              )}

              <button
                type="button"
                onClick={prepareSelectedOperation}
                disabled={mutationBusy}
                className="mt-5 h-11 w-full rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
              >
                {selectedOperation.kind === "end" ? "종료 조건 확인" : "조건 확인"}
              </button>
            </div>
          ) : null}

          {confirmation ? (
            <div className="rounded-[24px] border-2 border-blue-200 bg-blue-50 p-5" aria-live="polite">
              <p className="text-xs font-black tracking-[0.14em] text-blue-700">FINAL CONFIRM</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                {operationLabel(confirmation.kind)} 확인
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-slate-600">광산</dt>
                  <dd className="text-right font-black text-slate-950">{mine.displayName}</dd>
                </div>
                {confirmation.principalAmount ? (
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-slate-600">
                      {confirmation.kind === "start" ? "운용 금액" : "요청 금액"}
                    </dt>
                    <dd className="text-right font-black text-slate-950">
                      {amountLabel(confirmation.principalAmount, confirmation.assetCode)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-slate-600">처리 기준</dt>
                  <dd className="text-right font-black text-slate-950">서버 성공 응답</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-blue-900">
                네트워크가 끊겨 결과를 확인하지 못한 경우 이 확인 화면에서 다시 시도하면 같은 요청 키를 사용합니다.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={mutationBusy}
                  onClick={() => {
                    setConfirmation(null);
                    setNotice(null);
                  }}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:opacity-50"
                >
                  입력 수정
                </button>
                <button
                  type="button"
                  disabled={mutationBusy}
                  onClick={() => void submitConfirmation()}
                  className="h-11 rounded-2xl bg-blue-600 px-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {mutationBusy ? "서버 처리 중" : operationLabel(confirmation.kind)}
                </button>
              </div>
            </div>
          ) : null}

          {activePositions.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              이 광산에서 현재 운용 중인 건은 {activePositions.length}건입니다. 각 운용 카드의 작업 버튼으로 금액 변경 또는 종료를 요청하세요.
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
