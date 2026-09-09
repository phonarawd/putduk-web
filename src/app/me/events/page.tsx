"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";

const EVENTS = [
  { icon: "🎉", title: "첫 충전 이벤트", small: "첫 입금을 완료하면 보너스 기회가 열려요", date: "진행 중" },
  { icon: "💌", title: "친구 초대 이벤트", small: "초대한 친구가 늘수록 혜택이 커져요", date: "상시" },
  { icon: "🍂", title: "가을 시즌 기회 확대", small: "인기 카테고리 기회가 더 자주 열려요", date: "9월" },
];

// 이 레포에서 새로 추가한 화면 (GPT 원본에는 없음)
export default function MeEventsPage() {
  return (
    <RouteScreen>
      <RouteTop kicker="지금 진행 중" title="이벤트" copy="지금 참여할 수 있는 이벤트를 확인하세요." backPath="/me" />
      <section className="ledger-card">
        {EVENTS.map((item) => (
          <article className="ledger-row" key={item.title}>
            <span className="ledger-icon">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.small}</small>
            </div>
            <b>{item.date}</b>
          </article>
        ))}
      </section>
    </RouteScreen>
  );
}
