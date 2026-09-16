"use client";

import { useRouter } from "next/navigation";
import { AmbassadorHero, AmbassadorMoment } from "@/components/gpt/AmbassadorVisual";
import { HomeBanners } from "@/components/gpt/PublishedCmsList";
import { OpportunitySection } from "@/components/gpt/OpportunitySection";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { hasOwnPrincipal, trialGrantKrw } from "@/lib/api";
import { formatKrw, formatMoneyPrimary, formatMoneySecondary, formatSignedMoneyPrimary } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG } from "@/lib/messages";
import { principalSuggestion } from "@/lib/gpt/opportunities";

function IntroScreen() {
  const router = useRouter();
  return (
    <section id="introScreen" className="intro-screen">
      <div className="shell intro-shell">
        <div className="intro-copy">
          <span className="intro-kicker">
            <i></i> 내 자본으로 시작하는 리셀 업무
          </span>
          <h1>
            직접 사고팔지 않아도,
            <br />
            <em>나만의 리셀 업무</em>가 시작됩니다.
          </h1>
          <p className="intro-lead">
            퍼뜩은 내 지갑과 오늘 기회를 함께 보고, 필요한 금액만 잠가 시세 매칭 업무를 진행하는 리셀러 데스크입니다.
          </p>

          <div className="capital-truth">
            <span className="truth-symbol" aria-hidden="true">
              ₮
            </span>
            <div>
              <strong>입금은 이용료가 아닙니다.</strong>
              <p>
                리셀 기회를 실행하기 위한 <b>내 운용 자본</b>이며, 선택한 금액만 잠깁니다.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button id="beginExperience" className="hero-button" type="button" onClick={() => router.push("/login")}>
              로그인하고 데스크 열기 <span aria-hidden="true">→</span>
            </button>
            <button className="intro-text-button" type="button" onClick={() => router.push("/signup")}>
              처음 오셨다면 회원가입
            </button>
          </div>
        </div>

        <AmbassadorHero />

        <section className="partner-wall" aria-labelledby="partner-title">
          <div className="partner-wall-heading">
            <span>공식 네트워크</span>
            <strong id="partner-title">퍼뜩 공식 협력 네트워크</strong>
          </div>
          <div className="partner-logos" aria-label="eBay, Amazon, 쿠팡, KREAM, Chrono24">
            <span className="partner-ebay">eBay</span>
            <span className="partner-amazon">
              amazon<i></i>
            </span>
            <span className="partner-coupang">coupang</span>
            <span className="partner-kream">KREAM</span>
            <span className="partner-chrono">Chrono24</span>
          </div>
        </section>
      </div>
    </section>
  );
}

function HomeWorkspace() {
  const router = useRouter();
  const { state, selected, refreshQuotes } = useGpt();
  const remainingTickets = state.trial.participationsRemaining;

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="home" aria-labelledby="home-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">리셀러 데스크</span>
            <h1 id="home-title">지금 고를 기회</h1>
            <p>
              {state.displayName ? `${state.displayName}님, 조건이 맞는 기회만 확인하세요.` : "조건이 맞는 기회만 확인하세요."}
            </p>
          </div>
          <button id="refreshQuotes" className="quiet-button" type="button" onClick={refreshQuotes}>
            기회 다시 보기 <span aria-hidden="true">↻</span>
          </button>
        </div>

        <button id="askPeotteokHome" className="ask-ai-card" type="button" onClick={() => router.push("/ai")}>
          <span className="ai-avatar small" aria-hidden="true">
            <img src="/putduk-mark.svg" alt="" />
          </span>
          <span className="ask-ai-copy">
            <small>내 자본과 오늘 일을 아는 개인 AI</small>
            <strong>퍼뜩에게 물어보기</strong>
            <em id="homeAiSuggestion">{principalSuggestion(state, selected)}</em>
          </span>
          <span className="ask-ai-arrow" aria-hidden="true">
            →
          </span>
        </button>

        <AmbassadorMoment />
        <HomeBanners />

        <section className="today-summary" aria-label="오늘의 기회와 자본 현황">
          <article className="ticket-card">
            <div className="summary-label">
              <span>체험 남은 참여</span>
              <b id="ticketSummary">
                {state.trial.maxParticipations != null
                  ? `전체 ${state.trial.maxParticipations}회 중`
                  : "체험 참여 횟수"}
              </b>
            </div>
            <div className="ticket-number">
              <strong id="remainingTickets">
                {!state.deskReady
                  ? "확인 중"
                  : remainingTickets != null
                    ? remainingTickets
                    : MSG.trialRemainingEmpty}
              </strong>
              <span>
                {!state.deskReady
                  ? "계정 값 확인"
                  : remainingTickets != null
                    ? "회 남음"
                    : "등급 횟수와는 달라요"}
              </span>
            </div>
            {state.trial.profitRemainingKrw != null ? (
              <p id="bonusMini">
                <b>체험 남은 수익 {formatKrw(state.trial.profitRemainingKrw)}</b>
              </p>
            ) : (
              <p id="bonusMini">등급 횟수는 내 등급에서 확인해요</p>
            )}
          </article>

          <ProfileCapitalCard />
        </section>

        <OpportunitySection />
      </section>
    </WorkspaceView>
  );
}

function ProfileCapitalCard() {
  const { state } = useGpt();
  const profitUsdt = state.profitUsdt;
  const profitKrw = state.profitKrw;
  const grantKrw = trialGrantKrw(state.trial);
  const trialUsdt = state.trial.trialPrincipalUsdt;
  const fxPending = state.trial.grantStatus === "failed_fx";
  const trialActive = state.trial.grantStatus === "active";
  const principalPrimary = formatMoneyPrimary(state.principalUsdt, state.principalKrw);
  const principalSecondary = formatMoneySecondary(state.principalUsdt, state.principalKrw);
  const trialPrimary = formatMoneyPrimary(trialUsdt, grantKrw);
  const trialSecondary = formatMoneySecondary(trialUsdt, grantKrw);
  const ready = state.deskReady;
  const ownPrincipal = hasOwnPrincipal(state.principalUsdt, state.principalKrw);
  const heroIsTrial = !ownPrincipal && grantKrw != null;
  return (
    <article className="capital-card">
      <div className="summary-label">
        <span>{heroIsTrial || fxPending ? "체험 원금 · 출금 불가" : "내 예치"}</span>
      </div>
      <strong id="availableCapital">
        {!ready
          ? "금액을 확인하고 있어요"
          : fxPending
            ? "준비 중"
            : heroIsTrial
              ? trialPrimary ?? "아직 표시할 금액이 없어요"
              : principalPrimary ?? "아직 표시할 금액이 없어요"}
      </strong>
      {ready && !fxPending && heroIsTrial && trialSecondary ? (
        <small id="availableUsdt">{trialSecondary}</small>
      ) : ready && !heroIsTrial && principalSecondary ? (
        <small id="availableUsdt">{principalSecondary}</small>
      ) : (
        <small>{fxPending ? "환율이 준비되면 원화로 보여 드려요" : "본인 예치와 체험은 따로 보여 드려요"}</small>
      )}
      {ready && trialActive && !heroIsTrial ? (
        <div className="capital-card-bottom">
          <span>체험 원금 · 출금 불가</span>
          <b>
            {trialPrimary ?? "아직 표시할 금액이 없어요"}
            {trialSecondary ? ` · ${trialSecondary}` : ""}
          </b>
        </div>
      ) : null}
      {ready && heroIsTrial && ownPrincipal ? (
        <div className="capital-card-bottom">
          <span>내 예치</span>
          <b>
            {principalPrimary}
            {principalSecondary ? ` · ${principalSecondary}` : ""}
          </b>
        </div>
      ) : null}
      <div className="capital-card-bottom">
        <span>출금 가능 수익</span>
        <b id="settledProfit">{ready ? formatSignedMoneyPrimary(profitUsdt, profitKrw) ?? "아직 표시할 금액이 없어요" : "금액을 확인하고 있어요"}</b>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { state, sessionReady } = useGpt();
  if (!sessionReady) {
    return (
      <section className="route-screen shell" aria-live="polite">
        <ReadyNotice waiting title={MSG.screenWait} copy={MSG.screenWaitCopy} />
      </section>
    );
  }
  return state.loggedIn ? <HomeWorkspace /> : <IntroScreen />;
}
