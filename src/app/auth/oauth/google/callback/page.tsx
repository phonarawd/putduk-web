"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { googleCallbackOnce, googleComplete, needsCompleteProfile, readTermsPending, sessionEmail } from "@/lib/api";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG, userFacingError } from "@/lib/messages";

function readQueryValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default function GoogleCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const router = useRouter();
  const { markGoogleAuth, showToast } = useGpt();
  const query = use(searchParams);
  const code = readQueryValue(query.code);
  const state = readQueryValue(query.state);
  const missing = !code || !state;
  const [error, setError] = useState(missing ? MSG.googleCallbackNeed : "");
  const [pendingToken, setPendingToken] = useState("");
  const [requiredTerms, setRequiredTerms] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState("");
  const [privacyAcceptedAt, setPrivacyAcceptedAt] = useState("");
  const [benefitNews, setBenefitNews] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (missing) return;
    let cancelled = false;
    googleCallbackOnce(code, state)
      .then((data) => {
        if (cancelled) return;
        const needProfile = needsCompleteProfile(data) === true;
        markGoogleAuth(needProfile, sessionEmail(data));
        router.replace(needProfile ? "/auth/complete-profile" : "/");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        const token = readTermsPending(caught);
        if (token) {
          setPendingToken(token);
          return;
        }
        setError(userFacingError(caught, MSG.googleFail));
      });
    return () => {
      cancelled = true;
    };
  }, [code, missing, markGoogleAuth, router, state]);

  function onRequiredTerms(checked: boolean) {
    const now = new Date().toISOString();
    setRequiredTerms(checked);
    setTermsAcceptedAt(checked ? now : "");
    setPrivacyAcceptedAt(checked ? now : "");
  }

  async function onComplete(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!requiredTerms || !termsAcceptedAt || !privacyAcceptedAt) {
      showToast(MSG.termsNeed, "warning");
      return;
    }
    setBusy(true);
    try {
      const data = await googleComplete({
        pendingToken,
        termsAcceptedAt,
        privacyAcceptedAt,
        ...(benefitNews ? { marketingConsent: true } : {}),
        ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
      });
      const needProfile = needsCompleteProfile(data) === true;
      markGoogleAuth(needProfile, sessionEmail(data));
      router.replace(needProfile ? "/auth/complete-profile" : "/");
    } catch (caught: unknown) {
      setError(userFacingError(caught, MSG.googleFail));
      setPendingToken("");
    } finally {
      setBusy(false);
    }
  }

  if (pendingToken) {
    return (
      <RouteScreen>
        <section className="form-page-card">
          <span className="view-kicker">구글 연결</span>
          <h1>약관에 동의해 주세요</h1>
          <form className="stack-form" data-form="google-complete" onSubmit={onComplete}>
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
              약관에 동의하고 계속
            </button>
          </form>
        </section>
      </RouteScreen>
    );
  }

  if (error) {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="view-kicker">구글 연결</span>
          <h1>{error}</h1>
          <button className="form-primary" type="button" onClick={() => router.replace("/login")}>
            로그인으로 돌아가기
          </button>
        </section>
      </RouteScreen>
    );
  }

  return (
    <RouteScreen>
      <section className="status-page-card" aria-live="polite">
        <span className="view-kicker">구글 연결</span>
        <h1>연결을 확인하고 있어요</h1>
        <p>화면을 닫지 말고 잠시만 기다려 주세요.</p>
      </section>
    </RouteScreen>
  );
}
