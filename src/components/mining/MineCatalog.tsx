"use client";

import Link from "next/link";
import { useMining } from "@/lib/mining/MiningContext";
import type { MineStatus } from "@/lib/mining/types";

function mineStatusLabel(status: MineStatus): string {
  switch (status) {
    case "ACTIVE":
      return "운용 가능";
    case "NEW_POSITIONS_PAUSED":
      return "신규 운용 일시중지";
    case "PAUSED":
      return "운용 일시중지";
    case "READY":
      return "준비 중";
    case "ENDED":
      return "운용 종료";
  }
}

function amountLabel(value: string | null, assetCode: string): string {
  return value ? `${value} ${assetCode}` : "제한 없음";
}

export function MineCatalog() {
  const mining = useMining();

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-3 sm:px-6 lg:px-8" aria-labelledby="mine-catalog-title">
      <header className="flex flex-col gap-4 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-black tracking-[0.16em] text-blue-600">MINING CATALOG</span>
          <h1 id="mine-catalog-title" className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
            광산
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            서버에 공개된 광산의 현재 상태와 운용 조건을 확인하고 상세 화면에서 채굴을 시작하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void mining.refresh()}
          disabled={mining.refreshing}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-wait disabled:opacity-60"
        >
          {mining.refreshing ? "새로고침 중" : "최신 상태 보기"}
        </button>
      </header>

      {mining.error ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
          {mining.error}
        </div>
      ) : null}

      {!mining.ready ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-7 text-sm font-semibold text-slate-500">
          광산 목록을 확인하고 있어요.
        </div>
      ) : mining.mines.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
          <strong className="text-base font-black text-slate-900">현재 공개된 광산이 없어요.</strong>
          <p className="mt-2 text-sm text-slate-500">운영자가 광산을 공개하면 이곳에 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mining.mines.map((mine) => {
            const hasMyActivePosition = mining.positions.some(
              (position) => position.mineId === mine.mineId && position.status === "ACTIVE",
            );
            return (
              <article
                key={mine.mineId}
                className="flex min-h-[300px] flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {mineStatusLabel(mine.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {mine.assetCode}
                  </span>
                </div>

                <div className="mt-5 flex-1">
                  <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">{mine.displayName}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {mine.description || "광산 상세 조건을 확인해 주세요."}
                  </p>

                  <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="text-xs font-semibold text-slate-500">최소 운용</dt>
                      <dd className="mt-1 break-words font-black text-slate-900">
                        {amountLabel(mine.minPrincipalAmount, mine.assetCode)}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="text-xs font-semibold text-slate-500">최대 운용</dt>
                      <dd className="mt-1 break-words font-black text-slate-900">
                        {amountLabel(mine.maxPrincipalAmount, mine.assetCode)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 rounded-2xl border border-slate-100 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">현재 일일율 · 서버 값</p>
                    <p className="mt-1 break-words text-sm font-black text-slate-900">
                      {mine.currentDailyRate ?? "확인 중"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-500">
                    {hasMyActivePosition ? "내 운용 진행 중" : "상세 조건 확인"}
                  </span>
                  <Link
                    href={`/work/${encodeURIComponent(mine.mineId)}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    광산 보기
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
