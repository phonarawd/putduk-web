"use client";

import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";

const STEPS = [
  { title: "테더 금액을 준비해요", copy: "내 지갑에서 보낼 금액을 먼저 원화로 확인하세요." },
  { title: "트론(TRON)을 선택해요", copy: "퍼뜩에서는 트론 전송만 안내해요. 다른 전송망을 고르지 마세요." },
  { title: "주소를 다시 확인해요", copy: "앞뒤 글자가 같은지 확인한 뒤 보내세요." },
  { title: "반영을 기다려요", copy: "전송 확인이 끝나면 운용 자본에 표시돼요." },
];

export default function WalletUsdtGuidePage() {
  const router = useRouter();

  return (
    <RouteScreen>
      <RouteTop
        kicker="테더 준비"
        title="테더(USDT) 보내기 전 확인"
        copy="원화가 큰 기준이며 테더는 보조 금액으로 함께 보여 드려요."
        backPath="/me"
      />
      <section className="guide-grid">
        {STEPS.map((step, index) => (
          <article key={step.title}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.copy}</p>
            </div>
          </article>
        ))}
      </section>
      <div className="network-warning large-warning">
        <span aria-hidden="true">!</span>
        <div>
          <strong>잘못된 전송망으로 보내지 마세요.</strong>
          <p>주소와 전송망을 모두 확인한 뒤 직접 보내 주세요.</p>
        </div>
      </div>
      <button className="form-primary route-cta" type="button" onClick={() => router.push("/wallet/deposit")}>
        입금 화면으로 가기
      </button>
    </RouteScreen>
  );
}
