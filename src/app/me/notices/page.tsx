"use client";

import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";

export default function MeNoticesPage() {
  const router = useRouter();

  return (
    <RouteScreen>
      <RouteTop kicker="내 데스크 소식" title="공지사항" copy="퍼뜩의 새 소식을 확인하세요." backPath="/me" />
      <ReadyNotice title="아직 확인할 공지가 없어요" copy="새 소식이 있으면 여기에서 보여 드려요. 궁금한 점은 고객지원에서 남겨 주세요.">
        <button className="form-primary" type="button" onClick={() => router.push("/me/support")}>
          고객지원 보기
        </button>
      </ReadyNotice>
    </RouteScreen>
  );
}
