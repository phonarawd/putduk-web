"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { formatMoneyPrimary } from "@/lib/gpt/format";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { MSG } from "@/lib/messages";
import { useMining } from "@/lib/mining/MiningContext";
import {
  POSITION_STATUS_LABEL,
  SETTLEMENT_STATUS_LABEL,
  formatAssetAmount,
  formatMiningTime,
} from "@/lib/mining/presentation";
import type { MiningPosition } from "@/lib/mining/types";
import { useWallet } from "@/lib/wallet/WalletContext";

function MiningIntroScreen() {
  const router = useRouter();

  return (
    <section className="mining-intro-screen">
      <div className="shell mining-intro-shell">
        <div className="mining-intro-copy">
          <span className="mining-kicker">PUTDUK MINE OS</span>
          <h1>
            내 자본이 일하는
            <br />
            <em>나만의 디지털 광산</em>
          </h1>
          <p className="mining-intro-lead">
            광산별 운용 현황과 서버 기준 채굴 수익, 최근 정산을 한 화면에서 확인하세요.
            퍼뜩은 숫자를 임의로 만들지 않고 서버가 확정한 금융 상태를 그대로 보여 줍니다.
          </p>

          <div className="mining-truth">
            <span className="mining-truth-mark" aria-hidden="true">M</span>
            <div>
              <strong>수익과 정산의 기준은 서버입니다.</strong>
              <p>채굴 현황, 운용 원금, 출금 가능 수익은 연결된 지갑·광산 API의 최신 값을 기준으로 표시합니다.</p>
            </div>
          </div>

          <div className="mining-intro-actions">
            <button className="mining-primary-button" type="button" onClick={() => router.push("/login")}>
              로그인하고 광산 열기
            </button>
            <button className="mining-secondary-button" type="button" onClick={() => router.push("/signup")}>
              처음 오셨다면 회원가입
            </button>
          </div>
        </div>

        <aside className="mining-hero-panel" aria-label="퍼뜩 광산 이용 흐름">
          <small>MINERAL LUXURY</small>
          <strong>지갑에서 광산까지, 한 흐름으로 확인합니다.</strong>
          <div className="mining-flow">
            <article>
              <span>01</span>
              <div>
                <strong>자본 확인</strong>
                <em>내 지갑의 서버 기준 잔액</em>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <strong>광산 운용</strong>
                <em>현재 운용 중인 광산과 원금</em>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <strong>채굴·정산 확인</strong>
                <em>발생 수익과 최근 정산 상태</em>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}

function mineName(position: MiningPosition, mines: ReturnType<typeof useMining>["mines"]): string {
  return mines.find((mine) => mine.mineId === position.mineId)?.displayName ?? "광산";
}

function MiningHomeWorkspace() {
  const { displayName } = useGptSession();
  const mining = useMining();
  const wallet = useWallet();

  const activePositions = useMemo(
    () => mining.positions.filter((position) => position.status !== "ENDED"),
    [mining.positions],
  );
  const recentSettlements = useMemo(() => mining.settlements.slice(0, 3), [mining.settlements]);

  const summaryReady = mining.ready && mining.summary !== null;
  const activePrincipal = summaryReady
    ? formatAssetAmount(mining.summary?.activePrincipalAmount, mining.summary?.assetCode ?? "USDT")
    : null;
  const withdrawable = wallet.ready
    ? formatMoneyPrimary(wallet.withdrawable.profitUsdt, wallet.withdrawable.profitKrw)
    : null;
  const syncedAt = formatMiningTime(mining.liveProfit.syncedAt);

  const refreshAll = async () => {
    await Promise.all([mining.refresh(), wallet.refresh()]);
  };

  return (
    <WorkspaceView>
      <section className="app-view is-active mining-home" data-view="home" aria-labelledby="mining-home-title">
        <div className="view-intro mining-home-head">
          <div>
            <span className="view-kicker">PUTDUK MINE OS</span>
            <h1 id="mining-home-title">오늘의 채굴</h1>
            <p>{displayName ? `${displayName}님, 서버가 확인한 광산 현황입니다.` : "서버가 확인한 광산 현황입니다."}</p>
          </div>
          <button className="mining-refresh-button" type="button" onClick={() => void refreshAll()} disabled={mining.refreshing || wallet.refreshing}>
            {mining.refreshing || wallet.refreshing ? "동기화 중" : "최신 상태 보기"}
          </button>
        </div>

        <div className="mining-summary-grid" aria-label="오늘 채굴 요약">
          <article className="mining-summary-card is-accent">
            <small>오늘 채굴</small>
            <strong>
              {!mining.ready
                ? "확인 중"
                : mining.error
                  ? "확인 필요"
                  : mining.summary
                    ? mining.summary.activePositionCount > 0
                      ? `${mining.summary.activePositionCount}곳 채굴 중`
                      : "채굴 중인 광산 없음"
                    : "표시할 정보 없음"}
            </strong>
            <p>{syncedAt ? `서버 동기화 ${syncedAt}` : "서버 기준 상태"}</p>
          </article>

          <article className="mining-summary-card">
            <small>운용 중</small>
            <strong>
              {!mining.ready ? "확인 중" : mining.error ? "확인 필요" : activePrincipal ?? "표시할 정보 없음"}
            </strong>
            <p>현재 ACTIVE 운용 원금</p>
          </article>

          <article className="mining-summary-card">
            <small>출금 가능</small>
            <strong>
              {!wallet.ready ? "확인 중" : wallet.error ? "확인 필요" : withdrawable ?? "표시할 정보 없음"}
            </strong>
            <p>지갑 서버가 반환한 출금 가능 수익</p>
          </article>
        </div>

        {mining.error || wallet.error ? (
          <p className="mining-home-message" role="status">
            {mining.error ?? wallet.error} 숫자를 0으로 대신 표시하지 않았습니다. 최신 상태 보기를 다시 시도해 주세요.
          </p>
        ) : null}

        <section id="mine-yard" className="mining-home-section" aria-labelledby="mine-yard-title">
          <div className="mining-section-heading">
            <div>
              <h2 id="mine-yard-title">내 채굴장</h2>
              <p>현재 운용 중이거나 처리 중인 광산만 보여 드립니다.</p>
            </div>
            <p>{mining.ready && !mining.error ? `${activePositions.length}개 운용` : "서버 상태 기준"}</p>
          </div>

          {!mining.ready ? (
            <div className="mining-empty">내 채굴장을 확인하고 있어요.</div>
          ) : mining.error ? (
            <div className="mining-empty">광산 정보를 불러오지 못했습니다.</div>
          ) : activePositions.length === 0 ? (
            <div className="mining-empty">현재 운용 중인 광산이 없습니다.</div>
          ) : (
            <div className="mining-list">
              {activePositions.map((position) => {
                const accrued = formatAssetAmount(position.accruedProfitAmount, position.assetCode);
                const principal = formatAssetAmount(position.principalAmount, position.assetCode);
                const nextSettlement = formatMiningTime(position.nextSettlementAt);
                return (
                  <article key={position.positionId} className="mining-list-card">
                    <div className="mining-list-card-main">
                      <div className="mining-list-card-title">
                        <strong>{mineName(position, mining.mines)}</strong>
                        <span className="mining-state-pill">{POSITION_STATUS_LABEL[position.status]}</span>
                      </div>
                      <p>
                        운용 원금 {principal ?? "표시할 정보 없음"}
                        {nextSettlement ? ` · 다음 정산 ${nextSettlement}` : ""}
                      </p>
                    </div>
                    <div className="mining-list-card-value">
                      <strong>{accrued ?? "표시할 정보 없음"}</strong>
                      <small>서버 기준 발생 수익</small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mining-home-section" aria-labelledby="recent-settlement-title">
          <div className="mining-section-heading">
            <div>
              <h2 id="recent-settlement-title">최근 정산</h2>
              <p>최근 서버 정산 결과 3건을 보여 드립니다.</p>
            </div>
          </div>

          {!mining.ready ? (
            <div className="mining-empty">최근 정산을 확인하고 있어요.</div>
          ) : mining.error ? (
            <div className="mining-empty">정산 정보를 불러오지 못했습니다.</div>
          ) : recentSettlements.length === 0 ? (
            <div className="mining-empty">아직 표시할 정산 내역이 없습니다.</div>
          ) : (
            <div className="mining-list">
              {recentSettlements.map((settlement) => {
                const amount = formatAssetAmount(settlement.profitAmount, settlement.assetCode);
                const settledAt = formatMiningTime(settlement.periodEndAt);
                return (
                  <article key={settlement.settlementId} className="mining-list-card">
                    <div className="mining-list-card-main">
                      <div className="mining-list-card-title">
                        <strong>{SETTLEMENT_STATUS_LABEL[settlement.status]}</strong>
                        <span className="mining-state-pill">정산</span>
                      </div>
                      <p>{settledAt ?? "정산 시각 확인 중"}</p>
                    </div>
                    <div className="mining-list-card-value">
                      <strong>{amount ?? "표시할 정보 없음"}</strong>
                      <small>서버 정산 금액</small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </WorkspaceView>
  );
}

export default function HomePage() {
  const { sessionReady, loggedIn } = useGptSession();

  if (!sessionReady) {
    return (
      <section className="route-screen shell" aria-live="polite">
        <ReadyNotice waiting title={MSG.screenWait} copy={MSG.screenWaitCopy} />
      </section>
    );
  }

  return loggedIn ? <MiningHomeWorkspace /> : <MiningIntroScreen />;
}
