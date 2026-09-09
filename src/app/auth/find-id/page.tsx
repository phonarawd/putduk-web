"use client";

import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG } from "@/lib/messages";

export default function FindIdPage() {
  const router = useRouter();
  const { showToast } = useGpt();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    showToast(MSG.featureSoonNext, "warning");
  }

  return (
    <RouteScreen>
      <section className="form-page-card">
        <RouteTop kicker="계정 찾기" title="아이디 찾기" copy="가입할 때 쓴 이메일로 아이디를 확인해 드려요." backPath="/login" />
        <ReadyNotice
          title="아직 준비 중인 기능이에요"
          copy="지금은 아이디를 바로 찾아 드리지 못해요. 로그인 화면에서 이메일을 다시 확인해 주세요."
        />
        <form className="stack-form" data-form="find-id" onSubmit={onSubmit}>
          <label className="form-field">
            <span>이메일</span>
            <input name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
          </label>
          <button className="form-primary" type="submit">
            아이디 확인하기
          </button>
        </form>
        <button className="route-back-link" type="button" onClick={() => router.push("/login")}>
          로그인으로 돌아가기
        </button>
      </section>
    </RouteScreen>
  );
}
