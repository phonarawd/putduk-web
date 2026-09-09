"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";

const NOTICES = [
  { icon: "📢", title: "리셀러 데스크가 새로워졌어요", small: "화면과 속도를 다듬었어요", date: "9월 8일" },
  { icon: "🛠", title: "정기 점검 안내", small: "매주 화요일 새벽에 짧게 점검해요", date: "9월 3일" },
  { icon: "🤝", title: "공식 협력 네트워크 추가", small: "Chrono24가 새로 연결됐어요", date: "8월 27일" },
];

// 이 레포에서 새로 추가한 화면 (GPT 원본에는 없음)
export default function MeNoticesPage() {
  return (
    <RouteScreen>
      <RouteTop kicker="내 데스크 소식" title="공지사항" copy="퍼뜩의 새 소식을 확인하세요." backPath="/me" />
      <section className="ledger-card">
        {NOTICES.map((item) => (
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
