"use client";

import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG } from "@/lib/messages";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useGpt();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    showToast(MSG.featureSoonNext, "warning");
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
        <ReadyNotice
          title="아직 준비 중인 기능이에요"
          copy="지금은 새 비밀번호를 바로 저장할 수 없어요. 로그인 화면에서 다시 시도해 주세요."
        />
        <form className="stack-form" data-form="reset-password" onSubmit={onSubmit}>
          <label className="form-field">
            <span>아이디 또는 이메일</span>
            <input name="loginId" autoComplete="username" placeholder="putduk123 또는 name@example.com" required />
          </label>
          <label className="form-field">
            <span>새 비밀번호</span>
            <input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="8자 이상" required />
          </label>
          <label className="form-field">
            <span>새 비밀번호 확인</span>
            <input name="passwordConfirm" type="password" minLength={8} autoComplete="new-password" placeholder="한 번 더 입력" required />
          </label>
          <button className="form-primary" type="submit">
            새 비밀번호 저장하기
          </button>
        </form>
        <button className="route-back-link" type="button" onClick={() => router.push("/login")}>
          로그인으로 돌아가기
        </button>
      </section>
    </RouteScreen>
  );
}
