"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { formatKrw, formatMoneyPrimary, formatMoneySecondary, formatSignedMoneyPrimary } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";

export function OpportunitySection() {
  const router = useRouter();
  const { state, selected, opportunities, selectOpportunity, openPreflight } = useGpt();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectedIndex = Math.max(0, opportunities.findIndex((item) => item.id === state.selectedId));
  const requiredPrimary = formatMoneyPrimary(selected.requiredUsdt, selected.requiredKrw);
  const requiredSecondary = formatMoneySecondary(selected.requiredUsdt, selected.requiredKrw);

  let statusClass = "availability-chip";
  let statusText = "참여 가능";
  let showStart = true;
  let startDisabled = false;
  let startLabel = "이 기회로 수익 벌기";
  let showCapitalCta = false;

  if (!selected.id) {
    statusClass = "availability-chip needs-capital";
    statusText = "아직 없음";
    showStart = false;
  } else if (selected.bucket === "nearMiss") {
    statusClass = "availability-chip needs-capital";
    statusText = "조금 더 필요";
    showStart = false;
    showCapitalCta = true;
  } else if (selected.bucket === "lockedHigh") {
    statusClass = "availability-chip needs-capital";
    statusText = "지금은 잠김";
    showStart = false;
    showCapitalCta = true;
  } else if (!selected.affordable) {
    statusClass = "availability-chip needs-capital";
    statusText = "참여 불가";
    showStart = false;
    showCapitalCta = true;
  } else if (state.trial.participationsRemaining === 0) {
    statusClass = "availability-chip needs-capital";
    statusText = "횟수 없음";
    startDisabled = true;
    startLabel = "남은 참여 횟수가 없어요";
  }

  if (!selected.id) {
    return (
      <section className="opportunity-section" aria-labelledby="opportunity-title">
        <div className="section-title-row">
          <div>
            <span className="view-kicker">추천 기회</span>
            <h2 id="opportunity-title">지금 확인할 기회</h2>
          </div>
        </div>
        <article className="featured-opportunity">
          <div className="opportunity-main">
            <h3>아직 확인할 기회가 없어요</h3>
            <p className="market-route">조건이 맞는 기회가 생기면 여기에 보여 드려요.</p>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="opportunity-section" aria-labelledby="opportunity-title">
      <div className="section-title-row">
        <div>
          <span className="view-kicker">{selected.trialEligible ? "체험 기회" : "추천 기회"}</span>
          <h2 id="opportunity-title">지금 확인할 기회</h2>
        </div>
      </div>

      <article id="featuredOpportunity" className="featured-opportunity">
        <div
          id="featuredArt"
          className={"product-art" + (selected.imageUrl ? " has-photo" : "")}
          aria-hidden="true"
          style={{ "--art-one": selected.artOne, "--art-two": selected.artTwo } as CSSProperties}
        >
          {selected.imageUrl ? <img src={selected.imageUrl} alt="" /> : <span id="featuredSymbol">{selected.symbol}</span>}
          {selected.imageUrl ? null : <small>{selected.trialEligible ? "체험" : "퍼뜩"}</small>}
        </div>
        <div className="opportunity-main">
          <div className="opportunity-meta">
            <span id="featuredCategory">{selected.category}</span>
            <span id="featuredStatus" className={statusClass}>
              {statusText}
            </span>
          </div>
          <h3 id="featuredTitle">{selected.title}</h3>
          {selected.lowMarket && selected.highMarket ? (
            <p id="featuredRoute" className="market-route">
              {selected.lowMarket} 낮은 시세 → {selected.highMarket} 높은 시세
            </p>
          ) : null}
          <div className="opportunity-numbers">
            <div>
              <span>필요한 금액</span>
              <strong id="featuredRequired">
                {requiredPrimary ?? "아직 표시할 금액이 없어요"}
              </strong>
              {requiredSecondary ? <small id="featuredRequiredUsdt">{requiredSecondary}</small> : null}
            </div>
            {selected.expectedUsdt != null || selected.expectedKrw ? (
              <div className="profit-number">
                <span>예상 수익</span>
                <strong id="featuredProfit">{formatSignedMoneyPrimary(selected.expectedUsdt, selected.expectedKrw)}</strong>
                {selected.duration ? <small id="featuredProfitRate">{selected.duration}</small> : null}
              </div>
            ) : null}
          </div>
          <div className="trust-line">
            <span aria-hidden="true">🛡️</span>
            <p>조건이 어긋나면 안전하게 멈출 수 있어요.</p>
          </div>
          <div className="opportunity-action">
            <button id="startMatch" className="primary-button" type="button" hidden={!showStart} disabled={startDisabled} onClick={openPreflight}>
              {startLabel}
            </button>
            <button
              id="openCapitalFromOpportunity"
              className="primary-button"
              type="button"
              hidden={!showCapitalCta}
              onClick={() => router.push("/wallet/deposit")}
            >
              예치를 더 넣으면 볼 수 있어요
            </button>
            {selected.lowMarket || selected.expectedUsdt != null || selected.requiredKrw != null ? (
              <button
                id="toggleDetails"
                className="detail-button"
                type="button"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen((value) => !value)}
              >
                자세히 <span aria-hidden="true">{detailsOpen ? "⌃" : "⌄"}</span>
              </button>
            ) : null}
          </div>
        </div>
      </article>

      <div id="opportunityDetails" className="opportunity-details" hidden={!detailsOpen}>
        {selected.lowMarket && selected.highMarket ? (
          <div className="market-compare">
            <article>
              <span>낮은 시세</span>
              <strong id="detailLow">{selected.requiredKrw != null ? formatKrw(selected.requiredKrw) : selected.lowMarket}</strong>
              <small id="detailLowMarket">{selected.lowMarket}</small>
            </article>
            <span className="compare-arrow" aria-hidden="true">
              →
            </span>
            <article>
              <span>높은 시세</span>
              <strong id="detailHigh">{selected.highMarket}</strong>
              <small id="detailHighMarket">{selected.highMarket}</small>
            </article>
          </div>
        ) : null}
        <p>화면에 없는 금액은 만들지 않아요. 실제 정산은 결과에 따라 달라질 수 있어요.</p>
      </div>

      <div className="other-opportunities-heading">
        <div>
          <strong>다른 기회</strong>
          <span id="opportunityPosition">
            {opportunities.length ? `${selectedIndex + 1} / ${opportunities.length}` : "0"}
          </span>
        </div>
        <p>기회를 보는 것만으로는 횟수가 줄지 않아요.</p>
      </div>
      <div id="opportunityRail" className="opportunity-rail" aria-live="polite">
        {opportunities.map((item) => {
          const isSelected = item.id === state.selectedId;
          const stateLabel =
            item.bucket === "affordable" ? "참여 가능" : item.bucket === "nearMiss" ? "조금 더 필요" : item.bucket === "lockedHigh" ? "잠김" : "";
          return (
            <button
              key={item.id}
              type="button"
              className={"opportunity-mini" + (isSelected ? " is-selected" : "") + (item.imageUrl ? " has-photo" : "")}
              style={{ "--mini-one": item.artOne, "--mini-two": item.artTwo } as CSSProperties}
              aria-pressed={isSelected}
              onClick={() => selectOpportunity(item.id)}
            >
              {item.imageUrl ? <img className="mini-photo" src={item.imageUrl} alt="" /> : null}
              <span className="mini-top">
                {item.imageUrl ? null : <span className="mini-symbol">{item.symbol}</span>}
                <span className="mini-lock">{stateLabel}</span>
              </span>
              <strong>{item.title}</strong>
              <span className="mini-money">
                <span>{formatMoneyPrimary(item.requiredUsdt, item.requiredKrw) ?? ""}</span>
                {formatSignedMoneyPrimary(item.expectedUsdt, item.expectedKrw) ? (
                  <b>{formatSignedMoneyPrimary(item.expectedUsdt, item.expectedKrw)}</b>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
