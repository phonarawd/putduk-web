"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { TurnstileBox, hasTurnstileSiteKey } from "@/components/gpt/TurnstileBox";
import { useGpt } from "@/lib/gpt/GptContext";
import { findId, readFoundUsername } from "@/lib/api";
import { validEmail } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

export default function FindIdPage() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!validEmail(nextEmail)) {
      showToast(MSG.emailNeed, "warning");
      return;
    }
    if (hasTurnstileSiteKey() && !turnstileToken) {
      showToast(MSG.challengeNeed, "warning");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const data = await findId(nextEmail, turnstileToken || undefined);
      const username = readFoundUsername(data);
      setFound(username);
      showToast(MSG.findIdOk, "success");
    } catch (error: unknown) {
      setTurnstileToken("");
      setTurnstileReset((value) => value + 1);
      const payload = toastFromError(error, MSG.genericError);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteScreen>
      <section className="form-page-card">
        <RouteTop kicker="계정 찾기" title="아이디 찾기" copy="가입할 때 쓴 이메일로 아이디를 확인해 드려요." backPath="/login" />
        {found ? (
          <div className="plain-notice">
            <strong>아이디</strong>
            <p>{found}</p>
          </div>
        ) : null}
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
            <TurnstileBox action="find-id" onToken={setTurnstileToken} resetNonce={turnstileReset} />
            <button className="form-primary" type="submit" disabled={busy}>
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
