"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import {
  googleCallback,
  googleRedirectUrl,
  login,
  needsCompleteProfile,
  sessionEmail,
  startGoogle,
} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { markPasswordAuth, markGoogleAuth, navigateAfterAuth, showToast } = useGpt();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    googleCallback(code)
      .then((data) => {
        const needsProfile = needsCompleteProfile(data);
        markGoogleAuth(needsProfile, sessionEmail(data) || undefined);
        if (needsProfile) router.replace("/auth/complete-profile");
        else navigateAfterAuth("/");
      })
      .catch((error: unknown) => {
        showToast(error instanceof Error ? error.message : "구글 로그인 실패", "error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!loginId.trim()) {
      showToast("🙏 아이디 또는 이메일을 입력해 주세요.", "error");
      return;
    }
    if (password.length < 8) {
      showToast("🙏 비밀번호는 8자 이상 입력해 주세요.", "error");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await login(loginId, password);
      markPasswordAuth();
      showToast("✨ 다시 만나서 반가워요!");
      navigateAfterAuth("/");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "로그인 실패", "error");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    try {
      const data = await startGoogle();
      const url = googleRedirectUrl(data);
      if (!url) {
        showToast("구글 주소를 받지 못했습니다", "error");
        return;
      }
      window.location.href = url;
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "구글 로그인 실패", "error");
    }
  }

  return (
    <RouteScreen>
      <div className="auth-layout">
        <section className="auth-card">
          <RouteTop kicker="리셀러 데스크 시작" title="로그인" copy="아이디 또는 이메일로 내 데스크에 들어가세요." backPath="/" />
          <form className="stack-form" data-form="login" noValidate onSubmit={onSubmit}>
            <label className="form-field">
              <span>아이디 또는 이메일</span>
              <input
                name="loginId"
                autoComplete="username"
                placeholder="putduk123 또는 name@example.com"
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
            <button className="form-primary" type="submit" disabled={busy}>
              로그인
            </button>
          </form>
          <div className="auth-links">
            <button type="button" onClick={() => router.push("/auth/find-id")}>
              아이디 찾기
            </button>
            <i></i>
            <button type="button" onClick={() => router.push("/auth/reset-password")}>
              비밀번호 재설정
            </button>
          </div>
          <div className="or-line">
            <span>또는</span>
          </div>
          <button className="google-button" type="button" onClick={onGoogle}>
            <span aria-hidden="true">G</span>구글로 계속하기
          </button>
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
          <h2>✨ 다시 만나서 반가워요!</h2>
          <p>로그인하면 퍼뜩AI가 내 자본, 오늘 기회, 진행 중인 업무를 보고 바로 이어서 답해 드려요.</p>
          <div>
            <span>공식 협력 네트워크</span>
            <strong>eBay · amazon · 쿠팡 · KREAM · Chrono24</strong>
          </div>
        </aside>
      </div>
    </RouteScreen>
  );
}
