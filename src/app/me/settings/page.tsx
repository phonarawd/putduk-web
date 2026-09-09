"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { SettingRow } from "@/components/gpt/SettingRow";
import { useGpt } from "@/lib/gpt/GptContext";

export default function MeSettingsPage() {
  const { state, toggleBenefitNews, togglePreferKrwFirst, toggleCelebrateOn, resetPractice } = useGpt();

  return (
    <RouteScreen>
      <RouteTop kicker="내 데스크 환경" title="설정" copy="화면과 안내 방식을 편하게 맞춰 보세요." backPath="/me" />
      <section className="settings-card">
        <SettingRow
          title="원화를 먼저 보기"
          copy="큰 숫자는 원화, 작은 숫자는 테더로 보여 드려요."
          checked={state.preferKrwFirst}
          onToggle={togglePreferKrwFirst}
        />
        <SettingRow
          title="짧은 축하 연출"
          copy="결과가 확인되면 짧게 축하해요."
          checked={state.celebrateOn}
          onToggle={toggleCelebrateOn}
        />
        <SettingRow
          title="혜택·소식 받기"
          copy="새 혜택과 초대 소식을 이 기기에서 강조해요."
          checked={Boolean(state.benefitNews)}
          onToggle={toggleBenefitNews}
        />
        <p className="settings-note">이 설정은 이 기기에만 저장돼요.</p>
      </section>
      <section className="danger-card">
        <div>
          <strong>대화 처음부터 시작</strong>
          <p>퍼뜩AI 대화만 지워요. 금액은 건드리지 않아요.</p>
        </div>
        <button type="button" onClick={resetPractice} aria-label="퍼뜩AI 대화 지우기">
          대화 지우기
        </button>
      </section>
    </RouteScreen>
  );
}
