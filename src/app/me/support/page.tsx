"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG } from "@/lib/messages";

const SUPPORT_TOPICS = [
  { key: "입금", icon: "₩", title: "입금 문의", small: "신청과 반영 확인" },
  { key: "출금", icon: "↗", title: "출금 문의", small: "본인확인과 상태" },
  { key: "업무", icon: "✓", title: "업무 문의", small: "기회와 정산 기록" },
] as const;

export default function MeSupportPage() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topic, setTopic] = useState("일반 문의");
  const [message, setMessage] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      showToast(MSG.supportNeed, "warning");
      return;
    }
    showToast(MSG.featureSoon, "warning");
  }

  return (
    <RouteScreen>
      <RouteTop kicker="도움이 필요할 때" title="고객지원" copy="어려운 말 없이 필요한 내용을 남겨 주세요." backPath="/me" />
      <ReadyNotice
        title="문의 접수는 아직 준비 중이에요"
        copy="내용은 적어 두실 수 있지만, 지금은 바로 접수되지 않아요. 입금·출금·기회 화면에서 상태를 먼저 확인해 주세요."
      />
      <section className="support-options">
        {SUPPORT_TOPICS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={selectedTopic === item.key ? "is-selected" : ""}
            onClick={() => {
              setSelectedTopic(item.key);
              setTopic(item.title);
            }}
          >
            <span>{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.small}</small>
            </div>
          </button>
        ))}
      </section>
      <section className="form-page-card">
        <form className="stack-form" data-form="support" onSubmit={onSubmit}>
          <label className="form-field">
            <span>문의 종류</span>
            <input id="supportTopic" name="topic" value={topic} readOnly />
          </label>
          <label className="form-field">
            <span>문의 내용</span>
            <textarea
              name="message"
              rows={5}
              placeholder="무엇이 궁금하신가요?"
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <button className="form-primary" type="submit">
            문의 남기기
          </button>
        </form>
      </section>
      <button className="text-action route-wide-action" type="button" onClick={() => router.push("/ai")}>
        퍼뜩AI에게 먼저 물어보기
      </button>
    </RouteScreen>
  );
}
