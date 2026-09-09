"use client";

import { useState } from "react";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import { validEmail } from "@/lib/gpt/validate";

export default function FindIdPage() {
  const { showToast } = useGpt();
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validEmail(email)) {
      showToast("🙏 이메일을 정확하게 입력해 주세요.", "error");
      return;
    }
    setResult(true);
    showToast("😊 아이디를 찾았어요.");
  }

  return (
    <RouteScreen>
      <section className="form-page-card">
        <RouteTop kicker="계정 찾기" title="아이디 찾기" copy="가입할 때 쓴 이메일로 아이디를 확인해 드려요." backPath="/login" />
        <form className="stack-form" data-form="find-id" onSubmit={onSubmit}>
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
          <button className="form-primary" type="submit">
            아이디 확인하기
          </button>
        </form>
        <div id="findIdResult" className="inline-result" hidden={!result}>
          <span>찾은 아이디</span>
          <strong>putduk4821</strong>
          <small>개인정보를 위해 일부만 안내될 수 있어요.</small>
        </div>
      </section>
    </RouteScreen>
  );
}
