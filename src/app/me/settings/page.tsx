"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { SettingRow } from "@/components/gpt/SettingRow";
import { useGpt } from "@/lib/gpt/GptContext";
import { useVisualToggle } from "@/lib/gpt/useVisualToggle";

// GPT 짧은 경로 /settings → 이 레포에서는 /me/settings
export default function MeSettingsPage() {
  const { state, toggleBenefitNews, resetPractice } = useGpt();
  const [krwFirstOn, toggleKrwFirst] = useVisualToggle(true);
  const [celebrationOn, toggleCelebration] = useVisualToggle(true);

  return (
    <RouteScreen>
      <RouteTop kicker="내 데스크 환경" title="설정" copy="화면과 안내 방식을 편하게 맞춰 보세요." backPath="/me" />
      <section className="settings-card">
        <SettingRow title="큰 금액 먼저 보기" copy="테더를 크게, 원화를 작게 보여 드려요." checked={!krwFirstOn} onToggle={toggleKrwFirst} />
        <SettingRow
          title="짧은 축하 연출"
          copy="입금 확정과 정산 성공 때 짧게 축하해요."
          checked={celebrationOn}
          onToggle={toggleCelebration}
        />
        <SettingRow
          title="혜택·소식 받기"
          copy="새 혜택과 초대 소식을 받아요."
          checked={Boolean(state.benefitNews)}
          onToggle={toggleBenefitNews}
        />
      </section>
      <section className="danger-card">
        <div>
          <strong>대화 처음부터 시작</strong>
          <p>퍼뜩AI 대화만 지워요. 금액은 건드리지 않아요.</p>
        </div>
        <button type="button" onClick={resetPractice}>
          연습 초기화
        </button>
      </section>
    </RouteScreen>
  );
}
