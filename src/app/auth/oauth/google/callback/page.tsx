"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { googleCallbackOnce, needsCompleteProfile } from "@/lib/api";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG, userFacingError } from "@/lib/messages";

function readQueryValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default function GoogleCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const router = useRouter();
  const { markGoogleAuth } = useGpt();
  const query = use(searchParams);
  const code = readQueryValue(query.code);
  const state = readQueryValue(query.state);
  const missing = !code || !state;
  const [error, setError] = useState(missing ? MSG.googleCallbackNeed : "");

  useEffect(() => {
    if (missing) return;
    let cancelled = false;
    googleCallbackOnce(code, state)
      .then((data) => {
        if (cancelled) return;
        const needProfile = needsCompleteProfile(data) === true;
        markGoogleAuth(needProfile);
        router.replace(needProfile ? "/auth/complete-profile" : "/");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(userFacingError(caught, MSG.googleFail));
      });
    return () => {
      cancelled = true;
    };
  }, [code, missing, markGoogleAuth, router, state]);

  if (error) {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="view-kicker">구글 연결</span>
          <h1>{error}</h1>
          <button className="form-primary" type="button" onClick={() => router.replace("/login")}>
            로그인으로 돌아가기
          </button>
        </section>
      </RouteScreen>
    );
  }

  return (
    <RouteScreen>
      <section className="status-page-card" aria-live="polite">
        <span className="view-kicker">구글 연결</span>
        <h1>연결을 확인하고 있어요</h1>
        <p>화면을 닫지 말고 잠시만 기다려 주세요.</p>
      </section>
    </RouteScreen>
  );
}
