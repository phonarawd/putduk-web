"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleContinueButton } from "@/components/gpt/GoogleContinueButton";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { TurnstileBox, hasTurnstileSiteKey } from "@/components/gpt/TurnstileBox";
import { useGpt } from "@/lib/gpt/GptContext";
import { login } from "@/lib/api";
import { MSG, toastFromError } from "@/lib/messages";

function passwordPoints(value: string) {
  return Array.from(value).length;
}

export default function LoginPage() {
  const router = useRouter();
  const { markPasswordAuth, navigateAfterAuth, showToast } = useGpt();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!loginId.trim()) {
      showToast(MSG.loginIdNeed, "warning");
      return;
    }
    if (passwordPoints(password) < 8) {
      showToast(MSG.passwordShort, "warning");
      return;
    }
    if (hasTurnstileSiteKey() && !turnstileToken) {
      showToast(MSG.challengeNeed, "warning");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await login(loginId, password, turnstileToken || undefined);
      markPasswordAuth();
      showToast(MSG.loginOk, "success");
      navigateAfterAuth("/");
    } catch (error: unknown) {
      setTurnstileToken("");
      setTurnstileReset((value) => value + 1);
      const payload = toastFromError(error, MSG.loginFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteScreen>
      <div className="auth-layout">
        <section className="auth-card">
          <RouteTop kicker="퍼뜩 시작" title="로그인" copy="아이디 또는 이메일로 들어와 주세요." backPath="/" />
          <form className="stack-form" data-form="login" noValidate onSubmit={onSubmit}>
            <label className="form-field">
              <span>아이디 또는 이메일</span>
              <input
                name="identifier"
                autoComplete="username"
                placeholder="아이디 또는 이메일"
                required
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>비밀번호</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                placeholder="8자 이상"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <TurnstileBox action="login" onToken={setTurnstileToken} resetNonce={turnstileReset} />
            <button className="form-primary" type="submit" disabled={busy}>
              로그인
            </button>
          </form>
          <GoogleContinueButton disabled={busy} />
          <div className="auth-links">
            <button type="button" onClick={() => router.push("/auth/find-id")}>
              아이디 찾기
            </button>
            <i></i>
            <button type="button" onClick={() => router.push("/auth/reset-password")}>
              비밀번호 재설정
            </button>
          </div>
          <p className="auth-switch">
            아직 계정이 없으신가요?{" "}
            <button type="button" onClick={() => router.push("/signup")}>
              회원가입
            </button>
          </p>
        </section>
        <aside className="auth-side-card">
          <span className="ai-avatar" aria-hidden="true">
            <img src="/putduk-mark.svg" alt="" />
          </span>
          <h2>다시 만나서 반가워요</h2>
          <p>로그인하면 퍼뜩이 내 금액과 오늘 기회를 보고 이어서 답해 드려요.</p>
        </aside>
      </div>
    </RouteScreen>
  );
}
