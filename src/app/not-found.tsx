"use client";

import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <RouteScreen>
      <section className="status-page-card">
        <span className="status-orb mail" aria-hidden="true">
          🔎
        </span>
        <span className="view-kicker">길을 잃었어요</span>
        <h1>없는 화면이에요</h1>
        <p>
          주소를 다시 확인해 주세요.
          <br />
          홈이나 로그인에서 다시 시작할 수 있어요.
        </p>
        <button className="form-primary" type="button" onClick={() => router.push("/")}>
          홈으로 가기
        </button>
        <button className="route-back-link" type="button" onClick={() => router.push("/login")}>
          로그인하기
        </button>
      </section>
    </RouteScreen>
  );
}
