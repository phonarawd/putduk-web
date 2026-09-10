"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { TurnstileBox, hasTurnstileSiteKey } from "@/components/gpt/TurnstileBox";
import { useGpt } from "@/lib/gpt/GptContext";
import { resendSignupEmail, verifyClassicSignup } from "@/lib/api";
import { MSG, toastFromError } from "@/lib/messages";

export default function VerifyEmailPage({ searchParams }: PageProps<"/auth/verify-email">) {
  const router = useRouter();
  const { state, markPasswordAuth, navigateAfterAuth, showToast } = useGpt();
  const query = use(searchParams);
  const linkToken =
    (typeof query.token === "string" && query.token) ||
    (typeof query.signupToken === "string" && query.signupToken) ||
    (typeof query.code === "string" && query.code) ||
    "";
  const [typedToken, setTypedToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const token = linkToken || typedToken;
  const startedLinkRef = useRef("");

  async function verifyWith(value: string) {
    if (busy) return;
    if (!value.trim()) {
      showToast(MSG.verifyNeed, "warning");
      return;
    }
    setBusy(true);
    try {
      await verifyClassicSignup(value.trim());
      markPasswordAuth();
      showToast(MSG.verifyOk, "success");
      navigateAfterAuth("/");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.verifyFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (busy) return;
    if (!state.email) {
      showToast(MSG.emailNeed, "warning");
      return;
    }
    if (hasTurnstileSiteKey() && !turnstileToken) {
      showToast(MSG.challengeNeed, "warning");
      return;
    }
    setBusy(true);
    try {
      await resendSignupEmail(state.email, turnstileToken || undefined);
      setTurnstileToken("");
      setTurnstileReset((value) => value + 1);
      showToast(MSG.resendOk, "success");
    } catch (error: unknown) {
      setTurnstileToken("");
      setTurnstileReset((value) => value + 1);
      const payload = toastFromError(error, MSG.genericError);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!linkToken || startedLinkRef.current === linkToken) return;
    startedLinkRef.current = linkToken;
    const timer = window.setTimeout(() => {
      void verifyWith(linkToken);
    }, 0);
    return () => window.clearTimeout(timer);
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
          링크를 누르면 바로 이어서 시작할 수 있어요.
        </p>
        {!linkToken ? (
          <label className="form-field">
            <span>메일에서 받은 인증 값</span>
            <input value={typedToken} onChange={(event) => setTypedToken(event.target.value)} placeholder="메일의 인증 링크를 그대로 열어 주세요" />
          </label>
        ) : null}
        <button className="form-primary" type="button" disabled={busy} onClick={() => void verifyWith(token)}>
          인증을 마쳤어요
        </button>
        {state.email ? (
          <>
            <TurnstileBox action="email-resend" onToken={setTurnstileToken} resetNonce={turnstileReset} />
            <button className="route-back-link" type="button" disabled={busy} onClick={() => void onResend()}>
              인증 메일 다시 받기
            </button>
          </>
        ) : null}
        <button className="route-back-link" type="button" onClick={() => router.push("/signup")}>
          이메일 다시 입력하기
        </button>
      </section>
    </RouteScreen>
  );
}
