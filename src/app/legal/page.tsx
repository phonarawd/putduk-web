"use client";

import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";

const LEGAL_MENU = [
  { path: "/legal/recognition", title: "운영 정보 안내", copy: "운영 주체와 서비스 운영 기준 안내" },
  { path: "/legal/terms", title: "이용약관", copy: "앱이 하는 일, 충전, 기회 참여와 출금" },
  { path: "/legal/privacy", title: "개인정보 처리방침", copy: "모으는 정보, 쓰는 이유와 내 권리" },
  { path: "/legal/oss", title: "오픈소스 고지", copy: "화면에 사용한 공개 도구와 이용 조건" },
  { path: "/legal/license", title: "라이선스·저작권", copy: "앱 이름, 화면, 글, 로고와 상품 사진" },
] as const;

export default function LegalPage() {
  const router = useRouter();
  const { state } = useGpt();

  return (
    <RouteScreen>
      <RouteTop
        kicker="정책과 고지"
        title="약관과 정보"
        copy="퍼뜩을 이용할 때 알아야 할 내용을 쉬운 문장으로 정리했어요."
        backPath={state.loggedIn ? "/me" : "/"}
      />
      <section className="legal-menu">
        {LEGAL_MENU.map((item) => (
          <button key={item.path} type="button" onClick={() => router.push(item.path)}>
            <div>
              <strong>{item.title}</strong>
              <small>{item.copy}</small>
            </div>
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </section>
      <div className="operator-card">
        <span>운영 주체</span>
        <strong>PRE-OWNED WATCHES L.L.C</strong>
        <small>DET 1135431</small>
      </div>
    </RouteScreen>
  );
}
