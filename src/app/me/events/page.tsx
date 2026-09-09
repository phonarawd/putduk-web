"use client";

import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";

export default function MeEventsPage() {
  const router = useRouter();

  return (
    <RouteScreen>
      <RouteTop kicker="지금 진행 중" title="이벤트" copy="지금 참여할 수 있는 이벤트를 확인하세요." backPath="/me" />
      <ReadyNotice title="아직 확인할 이벤트가 없어요" copy="새 이벤트가 열리면 여기에서 보여 드려요. 홈에서 오늘 기회를 먼저 확인해 주세요.">
        <button className="form-primary" type="button" onClick={() => router.push("/")}>
          홈으로 가기
        </button>
      </ReadyNotice>
    </RouteScreen>
  );
}
