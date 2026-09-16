"use client";

import { OpportunitySection } from "@/components/gpt/OpportunitySection";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { useGpt } from "@/lib/gpt/GptContext";

export default function WorkPage() {
  const { state, opportunities, refreshQuotes } = useGpt();

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work" aria-labelledby="work-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">기회 목록</span>
            <h1 id="work-title">기회</h1>
            <p>운영자가 공개한 상품만 보여 드려요. 완료한 업무와 정산은 나 → 내 기록에서 확인해요.</p>
          </div>
          <div className="header-actions">
            <span className="view-count">{state.deskReady ? `${opportunities.length}개` : "확인 중"}</span>
            <button id="refreshWorkOpportunities" className="quiet-button" type="button" onClick={refreshQuotes}>
              기회 다시 보기 <span aria-hidden="true">↻</span>
            </button>
          </div>
        </div>

        <OpportunitySection />
      </section>
    </WorkspaceView>
  );
}
