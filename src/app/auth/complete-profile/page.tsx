"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import {
  birthDateFromPrefix,
  getSession,
  isAdultBirthDate,
  isIsoDate,
  saveProfile,
  sessionEmail,
  toE164,
} from "@/lib/api";
import { isStageBDisplayName, isStageBPhoneE164 } from "@/lib/contract-readers";
import { useGpt } from "@/lib/gpt/GptContext";
import { validBirthday, validEmail, validPhone } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { state, completeGoogleProfile, cancelGoogleOnboarding, navigateAfterAuth, showToast } = useGpt();

  const [email, setEmail] = useState(state.email);
  const [displayName, setDisplayName] = useState(state.displayName);
  const [birthday, setBirthday] = useState(state.birthday);
  const [phone, setPhone] = useState(() => {
    const digits = state.phone.replace(/[^0-9]/g, "");
    return validPhone(digits) ? digits : "";
  });
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
  }, [cancelGoogleOnboarding, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const birthDate = birthDateFromPrefix(birthday);
    const phoneE164 = toE164(phone);
    const nextEmail = email.trim().toLowerCase();
    if (
      !isStageBDisplayName(displayName) ||
      !validBirthday(birthday) ||
      !isIsoDate(birthDate) ||
      !validPhone(phone) ||
      !isStageBPhoneE164(phoneE164) ||
      !validEmail(nextEmail)
    ) {
      showToast(MSG.profileNeed, "warning");
      return;
    }
    if (!isAdultBirthDate(birthDate)) {
      showToast(MSG.ageNeed, "warning");
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        displayName: displayName.trim(),
        birthDate,
        phoneE164,
        email: nextEmail,
      });
      completeGoogleProfile({
        displayName: displayName.trim(),
        birthday,
        phone: phoneE164,
        email: nextEmail,
      });
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
          <label className="form-field">
            <span>
              이메일 <b>필수</b>
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
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
          <label className="form-field">
            <span>
              휴대폰 <b>필수</b>
            </span>
            <input
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01012345678"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, ""))}
            />
          </label>
          <button className="form-primary" type="submit" disabled={busy}>
            내 데스크 준비하기
          </button>
        </form>
      </section>
    </RouteScreen>
  );
}
