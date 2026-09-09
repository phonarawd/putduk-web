"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGpt } from "@/lib/gpt/GptContext";

const AMBASSADOR_LABEL = "퍼뜩 공식 앰버서더";

export const AMBASSADOR_HERO = {
  src: "/assets/ambassadors/01_putduk_main_hero.png",
  width: 1672,
  height: 941,
  alt: "퍼뜩 공식 앰버서더가 휴대폰으로 리셀러 데스크를 보여주는 모습",
} as const;

export const AMBASSADOR_OPPORTUNITY = {
  src: "/assets/ambassadors/02_putduk_opportunity_ambassador.png",
  width: 1122,
  height: 1402,
  alt: "퍼뜩 공식 앰버서더가 오늘 기회와 잔여 자리를 안내하는 모습",
} as const;

export const AMBASSADOR_TRUST = {
  src: "/assets/ambassadors/03_putduk_trust_ambassador.png",
  width: 1122,
  height: 1402,
  alt: "퍼뜩 공식 앰버서더가 자본 잠금과 안전 중단을 안내하는 모습",
} as const;

function useImageFailed() {
  const [failed, setFailed] = useState(false);
  return { failed, onError: () => setFailed(true) };
}

// 로그인 전 홈의 기존 대표 비주얼 자리. 레이아웃·그리드는 그대로 두고 사진만 넣는다.
export function AmbassadorHero() {
  const { failed, onError } = useImageFailed();

  return (
    <div className="intro-visual" aria-label={AMBASSADOR_LABEL}>
      <div className={"ambassador-hero" + (failed ? " is-failed" : "")}>
        <div className="ambassador-hero-media">
          <img
            src={AMBASSADOR_HERO.src}
            width={AMBASSADOR_HERO.width}
            height={AMBASSADOR_HERO.height}
            alt={AMBASSADOR_HERO.alt}
            fetchPriority="high"
            decoding="async"
            onError={onError}
          />
        </div>
        <div className="ambassador-hero-copy">
          <span className="ambassador-label">{AMBASSADOR_LABEL}</span>
          <strong>기회는 퍼뜩, 결정은 내 손으로.</strong>
          <p>내 자본과 오늘 조건을 먼저 보고, 필요한 금액만 잠가 시작하세요.</p>
        </div>
      </div>

      <div className="money-flow">
        <article>
          <span>01</span>
          <div>
            <strong>내 자본 입금</strong>
            <small>원화로 쉽게 확인</small>
          </div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>02</span>
          <div>
            <strong>AI 시세 매칭</strong>
            <small>직접 입찰·판매 없음</small>
          </div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>03</span>
          <div>
            <strong>결과 정산</strong>
            <small>지갑에서 바로 확인</small>
          </div>
        </article>
      </div>
    </div>
  );
}

function scrollToOpportunity() {
  const target = document.getElementById("opportunity-title");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 로그인 후 홈: 오늘 기회(02) 또는 자본·잠금·안전 중단(03) 중 상황과 맞는 한 장만.
export function AmbassadorMoment() {
  const router = useRouter();
  const { selected, capitalModal, activeExecution } = useGpt();
  const { failed, onError } = useImageFailed();

  const showTrust =
    !selected.affordable ||
    capitalModal.open ||
    (activeExecution != null &&
      (activeExecution.status === "running" ||
        activeExecution.status === "rechecking" ||
        activeExecution.status === "safe_stop"));

  const photo = showTrust ? AMBASSADOR_TRUST : AMBASSADOR_OPPORTUNITY;
  const title = showTrust
    ? "필요한 금액만 잠기고, 조건이 달라지면 안전하게 멈춰요."
    : "지금 확인할 수 있는 조건을 비교해 보세요.";
  const action = showTrust ? "퍼뜩에게 물어보기" : "지금 기회 보기";

  return (
    <button
      type="button"
      className={"ambassador-moment" + (showTrust ? " is-trust" : " is-opportunity") + (failed ? " is-failed" : "")}
      aria-label={AMBASSADOR_LABEL + ". " + title}
      onClick={() => {
        if (showTrust) router.push("/ai");
        else scrollToOpportunity();
      }}
    >
      <span className="ambassador-moment-photo">
        <img
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          loading="lazy"
          decoding="async"
          onError={onError}
        />
      </span>
      <span className="ambassador-moment-copy">
        <small className="ambassador-label">{AMBASSADOR_LABEL}</small>
        <strong>{title}</strong>
        <em>{action}</em>
      </span>
      <span className="ask-ai-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}
