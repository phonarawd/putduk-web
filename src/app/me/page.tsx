"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { GenderSelect } from "@/components/gpt/GenderSelect";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { formatIssued, formatKrw, formatSignedKrw, formatTime, formatUsdt, formatSignedUsdt } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import { opportunityById } from "@/lib/gpt/opportunities";
import { emptyTrial, getHomeRead, getTrialState, getWalletBuckets, hasMoneyValues, readMoney, readTrialState, type MoneyRead } from "@/lib/api";

const MENU_ITEMS = [
  { icon: "₩", title: "입금", small: "운용 자본 넣기", path: "/wallet/deposit" },
  { icon: "↗", title: "출금", small: "수익 출금", path: "/wallet/withdraw" },
  { icon: "≡", title: "입출금 내역", small: "신청과 반영 기록", path: "/wallet/history" },
  { icon: "✓", title: "본인확인", small: "출금 전 확인", path: "/me/kyc" },
  { icon: "♢", title: "알림", small: "기회와 정산 소식", path: "/me/inbox" },
  { icon: "📢", title: "공지사항", small: "퍼뜩의 새 소식", path: "/me/notices" },
  { icon: "⚙", title: "설정", small: "내 데스크 환경", path: "/me/settings" },
  { icon: "★", title: "혜택", small: "현재 받을 혜택", path: "/me/benefits" },
  { icon: "🎉", title: "이벤트", small: "지금 진행 중인 이벤트", path: "/me/events" },
  { icon: "◆", title: "내 등급", small: "계정별 하루 기회", path: "/me/membership" },
  { icon: "?", title: "고객지원", small: "도움이 필요할 때", path: "/me/support" },
  { icon: "§", title: "약관과 정보", small: "정책과 고지", path: "/legal" },
  { icon: "₮", title: "테더 준비", small: "트론 전송 안내", path: "/wallet/usdt-guide" },
] as const;

export default function MePage() {
  const router = useRouter();
  const { state, chooseProfileGender, logout } = useGpt();
  const [money, setMoney] = useState<MoneyRead | null>(null);
  const [moneyReady, setMoneyReady] = useState(false);

  useEffect(() => {
    Promise.allSettled([getHomeRead(), getWalletBuckets(), getTrialState()]).then(([home, buckets, trial]) => {
      const next = readMoney(
        home.status === "fulfilled" ? home.value : null,
        buckets.status === "fulfilled" ? buckets.value : null,
        trial.status === "fulfilled" ? readTrialState(trial.value) : emptyTrial(),
      );
      setMoney(next);
      setMoneyReady(true);
    });
  }, []);

  const principalUsdt = money?.principalUsdt ?? 0;
  const profitUsdt = money?.profitUsdt;
  const profitKrw = money?.profitKrw;
  const practiceUsdt = money?.practiceUsdt;
  const practiceKrw = money?.practiceKrw;
  const trialPrincipal = money?.trialPrincipalUsdt ?? 0;

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="me" aria-labelledby="me-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">리셀러 카드와 지갑</span>
            <h1 id="me-title">나</h1>
            <p>내 정보, 운용 자본, 출금과 설정을 한곳에서 확인하세요.</p>
          </div>
        </div>

        <section className="profile-grid">
          <article className="profile-pass">
            <div className="pass-top">
              <span>퍼뜩 리셀러</span>
              <i></i>
            </div>
            <div className="profile-pass-main">
              <small>리셀러 ID</small>
              <strong id="profileResellerId">{state.resellerId || state.displayName || "아직 표시할 아이디가 없어요"}</strong>
              <span id="profileIssued">{state.issuedAt ? formatIssued(state.issuedAt) : ""}</span>
            </div>
            <div className="pass-bottom">
              <span>퍼뜩 매칭 데스크</span>
              <span>활동 중</span>
            </div>
          </article>

          <article className="wallet-overview">
            <div className="wallet-overview-head">
              <div>
                <span>내 운용 지갑</span>
                <strong id="profileTotal">{moneyReady ? formatUsdt(principalUsdt) : ""}</strong>
              </div>
            </div>
            {moneyReady && money && hasMoneyValues(money) ? (
              <>
                <div className="wallet-lines wallet-lines-four">
                  <div>
                    <span>내 예치</span>
                    <b id="profileCapital">{formatUsdt(principalUsdt)}</b>
                    {money.principalKrw != null ? <small>{formatKrw(money.principalKrw)}</small> : null}
                  </div>
                  {trialPrincipal ? (
                    <div>
                      <span>체험 원금 · 출금 불가</span>
                      <b>{formatUsdt(trialPrincipal)}</b>
                    </div>
                  ) : null}
                  <div>
                    <span>출금 가능 수익</span>
                    <b id="profileProfit">{profitUsdt != null ? formatSignedUsdt(profitUsdt) : profitKrw != null ? formatSignedKrw(profitKrw) : formatSignedUsdt(0)}</b>
                    {profitUsdt != null && profitKrw != null ? <small>{formatKrw(profitKrw)}</small> : null}
                  </div>
                  {money.lockedUsdt != null || money.lockedKrw != null ? (
                    <div>
                      <span>진행 중 잠금</span>
                      <b id="profileLocked">{money.lockedUsdt != null ? formatUsdt(money.lockedUsdt) : formatKrw(money.lockedKrw ?? 0)}</b>
                    </div>
                  ) : null}
                  {practiceUsdt != null || practiceKrw != null ? (
                    <div>
                      <span>연습 · 사용 불가</span>
                      <b id="profilePractice">{practiceUsdt != null ? formatUsdt(practiceUsdt) : formatKrw(practiceKrw ?? 0)}</b>
                    </div>
                  ) : null}
                </div>
                <p id="profileCapitalHint">체험 원금과 연습 잔액은 출금할 수 없어요.</p>
              </>
            ) : moneyReady ? (
              <p id="profileCapitalHint">로그인 후 지갑 정보가 있으면 여기에 보여 드려요.</p>
            ) : null}
          </article>
        </section>

        <MyRecords />

        <section className="me-menu" aria-label="나의 메뉴">
          {MENU_ITEMS.map((item) => (
            <button key={item.path} type="button" onClick={() => router.push(item.path)}>
              <span>{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.small}</small>
              </div>
              <i>→</i>
            </button>
          ))}
          <button type="button" onClick={() => router.push("/ai")}>
            <span className="menu-logo">
              <img src="/putduk-mark.svg" alt="" />
            </span>
            <div>
              <strong>퍼뜩AI에게 묻기</strong>
              <small>내 상황으로 질문</small>
            </div>
            <i>→</i>
          </button>
        </section>

        <section className="profile-edit-card">
          <div>
            <span className="view-kicker">내 표시 정보</span>
            <h2 id="profileDisplayName">{state.displayName} 리셀러님</h2>
            <p>이름은 데스크에 보이는 표시 이름이며 본인확인 실명이 아니에요.</p>
          </div>
          <GenderSelect
            variant="compact"
            group="profile"
            value={state.gender}
            onChange={(value) => chooseProfileGender(value)}
          />
        </section>

        <section className="profile-network">
          <div>
            <span className="view-kicker">공식 네트워크</span>
            <h2>퍼뜩 공식 협력 네트워크</h2>
          </div>
          <div className="partner-logos compact" aria-label="eBay, Amazon, 쿠팡, KREAM, Chrono24">
            <span className="partner-ebay">eBay</span>
            <span className="partner-amazon">
              amazon<i></i>
            </span>
            <span className="partner-coupang">coupang</span>
            <span className="partner-kream">KREAM</span>
            <span className="partner-chrono">Chrono24</span>
          </div>
        </section>

        <button id="logoutButton" className="logout-button" type="button" onClick={logout}>
          로그아웃
        </button>
      </section>
    </WorkspaceView>
  );
}

// 예전 GPT "기록" 뷰의 끝난 정산 목록. /work 가 "기회"로 바뀌면서 이 안으로 옮겼다.
function MyRecords() {
  const router = useRouter();
  const { state } = useGpt();
  const trades = state.trades;

  return (
    <>
      <div className="section-title-row">
        <div>
          <span className="view-kicker">끝난 매칭과 정산</span>
          <h2>내 기록</h2>
        </div>
        <span className="view-count">{trades.length}건</span>
      </div>
      <section className="record-summary" aria-label="정산 요약">
        <div>
          <span>누적 수익</span>
          <strong id="recordProfit">
            {state.profitUsdt != null
              ? formatSignedUsdt(state.profitUsdt)
              : state.profitKrw != null
                ? formatSignedKrw(state.profitKrw)
                : "아직 표시할 금액이 없어요"}
          </strong>
        </div>
        <div>
          <span>진행 중 잠금</span>
          <strong id="recordLocked">
            {state.lockedUsdt != null
              ? formatUsdt(state.lockedUsdt)
              : state.lockedKrw != null
                ? formatKrw(state.lockedKrw)
                : "아직 표시할 금액이 없어요"}
          </strong>
        </div>
        <button type="button" onClick={() => router.push("/wallet/history")}>
          입출금 내역 보기
        </button>
      </section>
      <div id="historyList" className="history-list" aria-live="polite">
        {trades.length === 0 ? (
          <div className="history-empty">
            <span aria-hidden="true">✓</span>
            <strong>첫 기록을 준비하고 있어요</strong>
            <p>기회를 확인하면 완료 결과가 여기에 모여요.</p>
          </div>
        ) : (
          trades.map((trade) => {
            const opportunity = opportunityById(trade.opportunityId, state.feed);
            const success = trade.status === "success";
            return (
              <article className="history-row" key={trade.tradeId}>
                <span
                  className="history-symbol"
                  style={{ "--row-one": opportunity.artOne, "--row-two": opportunity.artTwo } as CSSProperties}
                >
                  {opportunity.symbol}
                </span>
                <div className="history-main">
                  <strong>{trade.title}</strong>
                  <small>
                    {success ? "정산 완료" : "가격 움직임 · 안전 중단"} · {formatTime(trade.createdAt)}
                  </small>
                </div>
                <div className="history-result">
                  <strong className={success ? "" : "is-safe"}>
                    {success ? formatSignedKrw(trade.settledProfitKrw) : "잠금 반환"}
                  </strong>
                  <small>{success ? "지갑 반영" : "원금·기회 반환"}</small>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
