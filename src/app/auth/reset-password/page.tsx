"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { TurnstileBox, hasTurnstileSiteKey, preloadTurnstile } from "@/components/gpt/TurnstileBox";
import { useGpt } from "@/lib/gpt/GptContext";
import { completePasswordReset, requestPasswordReset } from "@/lib/api";
import { validEmail } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

preloadTurnstile();

function passwordPoints(value: string) {
  return Array.from(value).length;
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/auth/reset-password">) {
  const router = useRouter();
  const { showToast } = useGpt();
  const query = use(searchParams);
  const token = typeof query.token === "string" ? query.token : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeReset, setChallengeReset] = useState(0);
  const [busy, setBusy] = useState(false);

  async function onRequest(event: React.FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!validEmail(nextEmail)) {
      showToast(MSG.emailNeed, "warning");
      return;
    }
    if (hasTurnstileSiteKey() && !challengeToken) {
      showToast(MSG.challengeNeed, "warning");
      return;
    }
    if (busy) return;
    setBusy(true);
    const usedToken = challengeToken;
    try {
      await requestPasswordReset(nextEmail, usedToken);
      setChallengeToken("");
      setChallengeReset((value) => value + 1);
      showToast(MSG.resetRequestOk, "success");
    } catch (error: unknown) {
      setChallengeToken("");
      setChallengeReset((value) => value + 1);
      const payload = toastFromError(error, MSG.genericError);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  async function onComplete(event: React.FormEvent) {
    event.preventDefault();
    if (passwordPoints(password) < 8) {
      showToast(MSG.passwordShort, "warning");
      return;
    }
    if (password !== passwordConfirm) {
      showToast(MSG.passwordMismatch, "warning");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await completePasswordReset(token, password);
      showToast(MSG.resetOk, "success");
      router.push("/login");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.genericError);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteScreen>
      <section className="form-page-card">
        <RouteTop
          kicker="계정 찾기"
          title="비밀번호 재설정"
          copy={token ? "새 비밀번호를 정해 주세요." : "가입한 이메일로 재설정 안내를 보내 드려요."}
          backPath="/login"
        />
        {token ? (
          <form className="stack-form" data-form="reset-password-complete" onSubmit={onComplete}>
            <label className="form-field">
              <span>새 비밀번호</span>
              <input
                name="newPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="8자 이상"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>새 비밀번호 확인</span>
              <input
                name="passwordConfirm"
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="한 번 더 입력"
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </label>
            <button className="form-primary" type="submit" disabled={busy}>
              새 비밀번호 저장하기
            </button>
          </form>
        ) : (
          <form className="stack-form" data-form="reset-password-request" onSubmit={onRequest}>
            <label className="form-field">
              <span>이메일</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <TurnstileBox action="password-reset" onToken={setChallengeToken} resetNonce={challengeReset} />
            <button className="form-primary" type="submit" disabled={busy}>
              재설정 메일 받기
            </button>
          </form>
        )}
        <button className="route-back-link" type="button" onClick={() => router.push("/login")}>
          로그인으로 돌아가기
        </button>
      </section>
    </RouteScreen>
  );
}
