"use client";

import { useRouter } from "next/navigation";
import { AmbassadorHero, AmbassadorMoment } from "@/components/gpt/AmbassadorVisual";
import { OpportunitySection } from "@/components/gpt/OpportunitySection";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { formatKrw, formatSignedKrw, formatSignedUsdt, formatUsdt } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
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
  const { state, selected, tickets, refreshQuotes } = useGpt();

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="home" aria-labelledby="home-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">리셀러 데스크</span>
            <h1 id="home-title">지금 고를 기회</h1>
            <p>
              {state.resellerId || state.displayName || "리셀러"}님, 조건이 맞는 기회만 확인하세요.
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
            <strong>퍼뜩AI에게 물어보기</strong>
            <em id="homeAiSuggestion">{principalSuggestion(state, selected)}</em>
          </span>
          <span className="ask-ai-arrow" aria-hidden="true">
            →
          </span>
        </button>

        <AmbassadorMoment />

        <section className="today-summary" aria-label="오늘의 기회와 자본 현황">
          <article className="ticket-card">
            <div className="summary-label">
              <span>남은 참여</span>
              <b id="ticketSummary">
                {state.trial.maxParticipations != null
                  ? `전체 ${state.trial.maxParticipations}회 중`
                  : "계정에 정해진 횟수"}
              </b>
            </div>
            <div className="ticket-number">
              <strong id="remainingTickets">{state.trial.participationsRemaining ?? tickets.remaining}</strong>
              <span>회 남음</span>
            </div>
            {state.trial.profitRemainingKrw != null ? (
              <p id="bonusMini">
                <b>남은 수익 한도 {formatKrw(state.trial.profitRemainingKrw)}</b>
              </p>
            ) : (
              <p id="bonusMini">횟수는 화면에 정하지 않고, 계정 값을 그대로 보여 드려요</p>
            )}
          </article>

          <ProfileCapitalCard />
        </section>

        <section className="compact-network" aria-label="공식 협력 네트워크">
          <span>
            <i></i> 공식 협력 네트워크
          </span>
          <div>
            <b>eBay</b>
            <b>amazon</b>
            <b>쿠팡</b>
            <b>KREAM</b>
            <b>Chrono24</b>
          </div>
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
  return (
    <article className="capital-card">
      <div className="summary-label">
        <span>내 예치</span>
      </div>
      <strong id="availableCapital">{formatUsdt(state.principalUsdt)}</strong>
      {state.principalKrw != null ? <small id="availableUsdt">{formatKrw(state.principalKrw)}</small> : <small>본인 예치만 보여 드려요</small>}
      {state.trial.grantStatus === "active" ? (
        <div className="capital-card-bottom">
          <span>체험 원금 · 출금 불가</span>
          <b>{formatUsdt(state.trial.trialPrincipalUsdt)}</b>
        </div>
      ) : null}
      <div className="capital-card-bottom">
        <span>출금 가능 수익</span>
        <b id="settledProfit">
          {profitUsdt != null ? formatSignedUsdt(profitUsdt) : profitKrw != null ? formatSignedKrw(profitKrw) : formatSignedUsdt(0)}
        </b>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { state } = useGpt();
  return state.loggedIn ? <HomeWorkspace /> : <IntroScreen />;
}
