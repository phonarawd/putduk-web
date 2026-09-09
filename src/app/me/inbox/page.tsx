"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { SettingRow } from "@/components/gpt/SettingRow";
import { useGpt } from "@/lib/gpt/GptContext";

export default function MeInboxPage() {
  const { state, toggleNotifications, toggleSettlementAlerts, toggleWalletAlerts } = useGpt();

  return (
    <RouteScreen>
      <RouteTop kicker="내 데스크 소식" title="알림" copy="이 기기에서 어떤 소식을 강조할지 골라요." backPath="/me" />
      <section className="settings-card">
        <SettingRow
          title="기회 알림"
          copy="마감 임박과 새 기회를 이 기기에서 강조해요."
          checked={state.notificationsEnabled}
          onToggle={toggleNotifications}
        />
        <SettingRow
          title="정산 알림"
          copy="수익이 들어오면 이 기기에서 강조해요."
          checked={state.settlementAlerts}
          onToggle={toggleSettlementAlerts}
        />
        <SettingRow
          title="입출금 알림"
          copy="신청과 반영 상태가 바뀌면 이 기기에서 강조해요."
          checked={state.walletAlerts}
          onToggle={toggleWalletAlerts}
        />
        <p className="settings-note">이 설정은 이 기기에만 저장돼요. 실제 알림 보내기는 아직 준비 중이에요.</p>
      </section>
    </RouteScreen>
  );
}
