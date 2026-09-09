"use client";

import { OpportunitySection } from "@/components/gpt/OpportunitySection";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { useGpt } from "@/lib/gpt/GptContext";

// GPT의 records(기록) 경로를 그대로 쓰되, 하단 탭 이름은 "기회"로 바꾸고
// 상품 목록이 있는 뷰(홈과 같은 추천 기회 카드+목록)로 연결한다.
// 끝난 정산(예전 "기록")은 /me 안의 "내 기록" 섹션으로 옮겼다.
export default function WorkPage() {
  const { state, refreshQuotes } = useGpt();

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work" aria-labelledby="work-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">리셀러 데스크</span>
            <h1 id="work-title">기회</h1>
            <p>
              {state.resellerId || state.displayName || "리셀러"}님, 조건이 맞는 기회만 확인하세요.
            </p>
          </div>
          <button className="quiet-button" type="button" onClick={refreshQuotes}>
            기회 다시 보기 <span aria-hidden="true">↻</span>
          </button>
        </div>

        <OpportunitySection />
      </section>
    </WorkspaceView>
  );
}
