"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!loginId.trim()) {
      showToast("🙏 아이디 또는 이메일을 입력해 주세요.", "error");
      return;
    }
    if (password.length < 8) {
      showToast("🙏 새 비밀번호는 8자 이상 입력해 주세요.", "error");
      return;
    }
    if (password !== passwordConfirm) {
      showToast("🙏 새 비밀번호 확인이 서로 달라요.", "error");
      return;
    }
    showToast("✨ 새 비밀번호를 저장했어요!");
    router.push("/login");
  }

  return (
    <RouteScreen>
      <section className="form-page-card">
        <RouteTop
          kicker="계정 찾기"
          title="비밀번호 재설정"
          copy="아이디 또는 이메일을 확인한 뒤 새 비밀번호를 정해 주세요."
          backPath="/login"
        />
        <form className="stack-form" data-form="reset-password" onSubmit={onSubmit}>
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
            <span>새 비밀번호</span>
            <input
              name="password"
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
          <button className="form-primary" type="submit">
            새 비밀번호 저장하기
          </button>
        </form>
      </section>
    </RouteScreen>
  );
}
