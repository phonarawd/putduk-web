"use client";

import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { MSG } from "@/lib/messages";

export default function MeBenefitsPage() {
  const router = useRouter();

  return (
    <RouteScreen>
      <RouteTop kicker="받을 수 있는 혜택" title="혜택" copy="지금 내 계정에서 확인되는 혜택만 보여 드려요." backPath="/me" />
      <ReadyNotice title={MSG.benefitsEmpty} copy={MSG.featureSoon} />
      <button className="form-primary route-cta" type="button" onClick={() => router.push("/invite")}>
        친구 초대하기
      </button>
    </RouteScreen>
  );
}
