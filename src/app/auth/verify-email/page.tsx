"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { useGpt } from "@/lib/gpt/GptContext";
import { verifyClassicSignup } from "@/lib/api";

export default function VerifyEmailPage({ searchParams }: PageProps<"/auth/verify-email">) {
  const router = useRouter();
  const { state, markPasswordAuth, navigateAfterAuth, showToast } = useGpt();
  const query = use(searchParams);
  const linkToken =
    (typeof query.token === "string" && query.token) ||
    (typeof query.signupToken === "string" && query.signupToken) ||
    (typeof query.code === "string" && query.code) ||
    "";
  const [token, setToken] = useState(linkToken);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (linkToken) setToken(linkToken);
  }, [linkToken]);

  async function onVerified() {
    if (busy) return;
    if (!token.trim()) {
      showToast("메일 안의 인증 링크로 들어와 주세요.", "error");
      return;
    }
    setBusy(true);
    try {
      await verifyClassicSignup(token.trim());
      markPasswordAuth();
      showToast("이메일 확인이 끝났어요.");
      navigateAfterAuth("/");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "인증에 실패했어요.", "error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!linkToken) return;
    void onVerified();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkToken]);

  return (
    <RouteScreen>
      <section className="status-page-card">
        <span className="status-orb mail" aria-hidden="true">
          ✉
        </span>
        <span className="view-kicker">가입 마지막 단계</span>
        <h1>인증 메일을 보냈어요</h1>
        <p>
          <b>{state.email || "입력한 이메일"}</b>에서 인증 링크를 눌러 주세요.
          <br />
          링크를 누르면 데스크를 바로 열 수 있어요.
        </p>
        {!linkToken ? (
          <label className="form-field">
            <span>메일에서 받은 인증 값</span>
            <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="메일의 인증 링크를 그대로 열어 주세요" />
          </label>
        ) : null}
        <button className="form-primary" type="button" disabled={busy} onClick={onVerified}>
          인증을 마쳤어요
        </button>
        <button className="route-back-link" type="button" onClick={() => router.push("/signup")}>
          이메일 다시 입력하기
        </button>
      </section>
    </RouteScreen>
  );
}
