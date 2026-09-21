"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useGptSession } from "@/lib/gpt/GptScopes";

interface RouteTopProps {
  kicker: string;
  title: string;
  copy: ReactNode;
  backPath?: string;
  onBack?: () => void;
  backLabel?: string;
}

// "이전 화면" 뒤로가기 + 제목 + 설명. 게이트/공개 라우트 화면 상단에 공통으로 쓴다. (원본 routeTop 그대로)
export function RouteTop({ kicker, title, copy, backPath, onBack, backLabel = "이전 화면" }: RouteTopProps) {
  const router = useRouter();
  const { loggedIn } = useGptSession();
  const handleBack = onBack ?? (() => router.push(backPath || (loggedIn ? "/me" : "/")));

  return (
    <div className="route-top">
      <button className="route-back" type="button" aria-label={backLabel} onClick={handleBack}>
        ←
      </button>
      <div>
        <span className="view-kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </div>
  );
}
