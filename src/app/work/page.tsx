"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";

export default function WorkPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#mine-yard");
  }, [router]);

  return (
    <WorkspaceView>
      <section className="route-screen" aria-live="polite">
        <ReadyNotice
          waiting
          title="광산으로 이동 중"
          copy="내 채굴장과 최근 정산이 있는 광산 홈으로 이동하고 있어요."
        />
      </section>
    </WorkspaceView>
  );
}
