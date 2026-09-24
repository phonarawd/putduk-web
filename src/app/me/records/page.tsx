"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";

export default function MeRecordsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/activity");
  }, [router]);

  return (
    <RouteScreen>
      <section className="route-screen shell" aria-live="polite">
        <div className="history-empty">
          <span aria-hidden="true">↗</span>
          <strong>채굴 활동으로 이동하고 있어요.</strong>
          <p>기존 기록 주소는 유지하고 실제 채굴 활동 화면으로 연결합니다.</p>
        </div>
      </section>
    </RouteScreen>
  );
}
