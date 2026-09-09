"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { GenderSelect } from "@/components/gpt/GenderSelect";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { TurnstileBox, hasTurnstileSiteKey } from "@/components/gpt/TurnstileBox";
import { useGpt } from "@/lib/gpt/GptContext";
import { birthDateFromPrefix, googleRedirectUrl, signup, startGoogle } from "@/lib/api";
import type { Gender } from "@/lib/gpt/types";
import { validBirthday, validEmail, validPhone, validUsername } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  const router = useRouter();
  const { submitClassicSignupProfile, showToast } = useGpt();
  const query = use(searchParams);
  const ref = typeof query.ref === "string" ? query.ref : "";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState(ref);
  const [requiredTerms, setRequiredTerms] = useState(false);
  const [benefitNews, setBenefitNews] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validUsername(username)) {
      showToast(MSG.usernameNeed, "warning");
      return;
    }
    if (!validEmail(email)) {
      showToast(MSG.emailNeed, "warning");
      return;
    }
    if (password.length < 8) {
      showToast(MSG.passwordShort, "warning");
      return;
    }
    if (password !== passwordConfirm) {
      showToast(MSG.passwordMismatch, "warning");
      return;
    }
    if (!displayName.trim() || !validBirthday(birthday) || !gender) {
      showToast(MSG.profileNeed, "warning");
      return;
    }
    if (phone && !validPhone(phone)) {
      showToast(MSG.phoneNeed, "warning");
      return;
    }
    if (!requiredTerms) {
      showToast(MSG.termsNeed, "warning");
      return;
    }
    if (hasTurnstileSiteKey() && !challengeToken) {
      showToast(MSG.challengeNeed, "warning");
      return;
    }
    try {
      await signup({
        username,
        email,
        password,
        passwordConfirm,
        declaredName: displayName.trim(),
        birthDate: birthDateFromPrefix(birthday),
        gender,
        phone: phone || undefined,
        inviteCode: inviteCode.trim() || undefined,
        turnstileToken: challengeToken || undefined,
      });
      submitClassicSignupProfile({ displayName, email, birthday, gender, phone, benefitNews });
      router.push("/auth/verify-email");
      showToast(MSG.signupOk, "success");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.signupFail);
      showToast(payload.message, payload.kind);
    }
  }

  async function onGoogle() {
    if (!requiredTerms) {
      showToast(MSG.termsNeed, "warning");
      return;
    }
    try {
      const data = await startGoogle();
      const url = googleRedirectUrl(data);
      if (!url) {
        showToast(MSG.googleUrlFail, "error");
        return;
      }
      window.location.href = url;
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.googleStartFail);
      showToast(payload.message, payload.kind);
    }
  }

  return (
    <RouteScreen>
      <section className="form-page-card wide-form-card">
        <RouteTop kicker="새 리셀러 시작" title="회원가입" copy="필요한 정보만 입력하면 내 리셀러 ID가 준비돼요." backPath="/login" />
        <form className="stack-form" data-form="signup" noValidate onSubmit={onSubmit}>
          <div className="form-grid two">
            <label className="form-field">
              <span>
                아이디 <b>필수</b>
              </span>
              <input
                name="username"
                autoComplete="username"
                placeholder="영문 소문자로 시작, 4~20자"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>
                이메일 <b>필수</b>
              </span>
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
            <label className="form-field">
              <span>
                비밀번호 <b>필수</b>
              </span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="8자 이상"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>
                비밀번호 확인 <b>필수</b>
              </span>
              <input
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="한 번 더 입력"
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
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
          </div>

          <GenderSelect value={gender} onChange={setGender} group="signup" />

          <div className="form-grid two">
            <label className="form-field">
              <span>
                휴대폰 <em>선택</em>
              </span>
              <input
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/[^0-9]/g, ""))}
              />
            </label>
            <label className="form-field">
              <span>
                초대 코드 <em>선택</em>
              </span>
              <input
                name="inviteCode"
                placeholder="추천 코드를 입력해 주세요"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </label>
          </div>

          <div className="agreement-box">
            <label>
              <input
                name="requiredTerms"
                type="checkbox"
                checked={requiredTerms}
                onChange={(event) => setRequiredTerms(event.target.checked)}
              />
              <span>
                <b>필수</b> 이용약관·개인정보 처리방침에 동의해요
              </span>
            </label>
            <div className="agreement-links">
              <button type="button" onClick={() => router.push("/legal/terms")}>
                이용약관 전체 보기
              </button>
              <button type="button" onClick={() => router.push("/legal/privacy")}>
                개인정보 처리방침 전체 보기
              </button>
            </div>
            <label>
              <input
                name="benefitNews"
                type="checkbox"
                checked={benefitNews}
                onChange={(event) => setBenefitNews(event.target.checked)}
              />
              <span>
                <b className="optional">선택</b> 혜택·소식 받기
              </span>
            </label>
          </div>
          <TurnstileBox onToken={setChallengeToken} />
          <button className="form-primary" type="submit">
            회원가입
          </button>
        </form>
        <div className="or-line">
          <span>또는</span>
        </div>
        <button className="google-button" type="button" onClick={onGoogle}>
          <span aria-hidden="true">G</span>구글로 계속하기
        </button>
        <p className="auth-switch">
          이미 계정이 있으신가요?{" "}
          <button type="button" onClick={() => router.push("/login")}>
            로그인
          </button>
        </p>
      </section>
    </RouteScreen>
  );
}
