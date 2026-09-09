"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GenderSelect } from "@/components/gpt/GenderSelect";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { getSession, saveProfile, sessionEmail } from "@/lib/api";
import { useGpt } from "@/lib/gpt/GptContext";
import type { Gender } from "@/lib/gpt/types";
import { validBirthday } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { state, completeGoogleProfile, cancelGoogleOnboarding, navigateAfterAuth, showToast } = useGpt();

  const [email, setEmail] = useState(state.email && state.email !== "reseller@example.com" ? state.email : "");
  const [displayName, setDisplayName] = useState(state.displayName === "민준" ? "" : state.displayName);
  const [birthday, setBirthday] = useState(state.birthday === "900101" ? "" : state.birthday);
  const [gender, setGender] = useState<Gender>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession()
      .then((data) => {
        const next = sessionEmail(data);
        if (next) setEmail(next);
      })
      .catch(() => {});
  }, []);

  function backToLogin() {
    cancelGoogleOnboarding();
    router.replace("/login");
  }

  useEffect(() => {
    function onPopState() {
      cancelGoogleOnboarding();
      router.replace("/login");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!displayName.trim() || !validBirthday(birthday) || !gender) {
      showToast(MSG.profileNeed, "warning");
      return;
    }
    setBusy(true);
    try {
      await saveProfile(displayName.trim(), gender, birthday);
      completeGoogleProfile({ displayName: displayName.trim(), birthday, gender, phone: "" });
      showToast(MSG.profileSaved, "success");
      navigateAfterAuth("/");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.profileSaveFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteScreen>
      <section className="form-page-card">
        <div className="route-top">
          <button className="route-back" type="button" aria-label="구글 가입을 취소하고 로그인으로 돌아가기" onClick={backToLogin}>
            ←
          </button>
          <div>
            <span className="view-kicker">구글 첫 가입</span>
            <h1>필수정보 입력</h1>
            <p>이 정보가 있어야 내 데스크를 정확하게 준비할 수 있어요.</p>
          </div>
        </div>
        <form className="stack-form" data-form="complete-profile" noValidate onSubmit={onSubmit}>
          <label className="form-field readonly-field">
            <span>구글 이메일</span>
            <input value={email} readOnly aria-readonly="true" />
          </label>
          <label className="form-field">
            <span>
              이름 <b>필수</b>
            </span>
            <input
              name="displayName"
              autoComplete="name"
              placeholder="데스크에 보일 이름"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <small>표시 이름이며 본인확인 실명이 아니에요.</small>
          </label>
          <label className="form-field">
            <span>
              생년월일 앞자리 <b>필수</b>
            </span>
            <input
              name="birthday"
              inputMode="numeric"
              maxLength={6}
              placeholder="YYMMDD 6자리"
              required
              value={birthday}
              onChange={(event) => setBirthday(event.target.value.replace(/[^0-9]/g, ""))}
            />
          </label>
          <GenderSelect value={gender} onChange={setGender} group="complete" />
          <button className="form-primary" type="submit" disabled={busy}>
            내 데스크 준비하기
          </button>
        </form>
      </section>
    </RouteScreen>
  );
}
