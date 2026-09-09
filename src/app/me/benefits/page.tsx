"use client";

import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";

// GPT 짧은 경로 /benefits → 이 레포에서는 /me/benefits
export default function MeBenefitsPage() {
  const router = useRouter();
  const { state } = useGpt();
  const bank = Number(state.bonusBank) || 0;

  return (
    <RouteScreen>
      <RouteTop kicker="받을 수 있는 혜택" title="혜택" copy="지금 내 계정에서 확인되는 혜택만 보여 드려요." backPath="/me" />
      <section className="benefit-hero">
        <span>친구 보너스</span>
        <strong>{bank}회</strong>
        <p>{bank ? "확정된 보너스가 오늘 기회에 반영돼요." : "친구가 첫 수익까지 마치면 혜택이 확정돼요."}</p>
      </section>
      <section className="benefit-list">
        <article>
          <span>1</span>
          <div>
            <strong>링크로 가입</strong>
            <small>추천 코드 연결</small>
          </div>
        </article>
        <article>
          <span>2</span>
          <div>
            <strong>첫 충전</strong>
            <small>운용 자본 시작 확인</small>
          </div>
        </article>
        <article>
          <span>3</span>
          <div>
            <strong>첫 수익</strong>
            <small>친구 보너스 확정</small>
          </div>
        </article>
      </section>
      <div className="plain-notice">
        <strong>바로 큰돈이 들어오는 혜택은 아니에요.</strong>
        <p>친구 수에는 제한이 없고, 확인된 단계에 따라 혜택이 열려요.</p>
      </div>
      <button className="form-primary route-cta" type="button" onClick={() => router.push("/invite")}>
        친구 초대하기
      </button>
    </RouteScreen>
  );
}
