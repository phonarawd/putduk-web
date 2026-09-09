"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { SettingRow } from "@/components/gpt/SettingRow";
import { useGpt } from "@/lib/gpt/GptContext";
import { useVisualToggle } from "@/lib/gpt/useVisualToggle";

// GPT 짧은 경로 /notifications → 이 레포에서는 /me/inbox
export default function MeInboxPage() {
  const { state, toggleNotifications } = useGpt();
  const [settlementOn, toggleSettlement] = useVisualToggle(true);
  const [walletOn, toggleWallet] = useVisualToggle(true);

  return (
    <RouteScreen>
      <RouteTop kicker="내 데스크 소식" title="알림" copy="기회, 정산과 지갑 소식을 필요한 만큼 받아보세요." backPath="/me" />
      <section className="settings-card">
        <SettingRow
          title="기회 알림"
          copy="마감 임박과 새 기회를 알려 드려요."
          checked={state.notificationsEnabled}
          onToggle={toggleNotifications}
        />
        <SettingRow title="정산 알림" copy="수익이 지갑에 들어오면 바로 알려 드려요." checked={settlementOn} onToggle={toggleSettlement} />
        <SettingRow title="입출금 알림" copy="신청과 반영 상태가 바뀌면 알려 드려요." checked={walletOn} onToggle={toggleWallet} />
        <p className="settings-note">알림을 꺼도 중요한 지갑 확인 안내는 데스크에서 볼 수 있어요.</p>
      </section>
    </RouteScreen>
  );
}
