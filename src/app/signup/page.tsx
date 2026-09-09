"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import { birthDateFromPrefix, isAdultBirthDate, isIsoDate, signup, toE164 } from "@/lib/api";
import { validBirthday, validEmail, validPhone, validUsername } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

function passwordPoints(value: string) {
  return Array.from(value).length;
}

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
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState(ref);
  const [requiredTerms, setRequiredTerms] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState("");
  const [privacyAcceptedAt, setPrivacyAcceptedAt] = useState("");
  const [benefitNews, setBenefitNews] = useState(false);
  const [busy, setBusy] = useState(false);

  function onRequiredTerms(checked: boolean) {
    setRequiredTerms(checked);
    if (checked) {
      const at = new Date().toISOString();
      setTermsAcceptedAt(at);
      setPrivacyAcceptedAt(at);
    } else {
      setTermsAcceptedAt("");
      setPrivacyAcceptedAt("");
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextUsername = username.trim();
    const nextEmail = email.trim().toLowerCase();
    const nextName = displayName.trim();
    if (!validUsername(nextUsername)) {
      showToast(MSG.usernameNeed, "warning");
      return;
    }
    if (!validEmail(nextEmail)) {
      showToast(MSG.emailNeed, "warning");
      return;
    }
    if (passwordPoints(password) < 8) {
      showToast(MSG.passwordShort, "warning");
      return;
    }
    if (password !== passwordConfirm) {
      showToast(MSG.passwordMismatch, "warning");
      return;
    }
    if (!nextName || nextName.length > 60 || !validBirthday(birthday)) {
      showToast(MSG.nameBirthNeed, "warning");
      return;
    }
    const birthDate = birthDateFromPrefix(birthday);
    if (!isIsoDate(birthDate)) {
      showToast(MSG.nameBirthNeed, "warning");
      return;
    }
    if (!isAdultBirthDate(birthDate)) {
      showToast(MSG.ageNeed, "warning");
      return;
    }
    if (phone && !validPhone(phone)) {
      showToast(MSG.phoneNeed, "warning");
      return;
    }
    if (!requiredTerms || !termsAcceptedAt || !privacyAcceptedAt) {
      showToast(MSG.termsNeed, "warning");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await signup({
        username: nextUsername,
        email: nextEmail,
        password,
        passwordConfirm,
        declaredName: nextName,
        birthDate,
        termsAcceptedAt,
        privacyAcceptedAt,
        marketingConsent: benefitNews || undefined,
        referralCode: referralCode.trim() || undefined,
        phoneE164: phone ? toE164(phone) : undefined,
      });
      submitClassicSignupProfile({ displayName: nextName, email: nextEmail, birthday, gender: "", phone, benefitNews });
      router.push("/auth/verify-email");
      showToast(MSG.signupOk, "success");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.genericError);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteScreen>
      <section className="form-page-card wide-form-card">
        <RouteTop kicker="새 시작" title="회원가입" copy="필요한 정보만 입력하면 바로 시작할 수 있어요." backPath="/login" />
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
                placeholder="화면에 보일 이름"
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
                name="referralCode"
                placeholder="추천 코드를 입력해 주세요"
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value)}
              />
            </label>
          </div>

          <div className="agreement-box">
            <label>
              <input
                name="requiredTerms"
                type="checkbox"
                checked={requiredTerms}
                onChange={(event) => onRequiredTerms(event.target.checked)}
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
          <button className="form-primary" type="submit" disabled={busy}>
            회원가입
          </button>
        </form>
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
