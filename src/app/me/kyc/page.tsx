"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import { getKycStatus, readKycVerified, submitKyc, toE164 } from "@/lib/api";
import { validPhone } from "@/lib/gpt/validate";
import { MSG, toastFromError } from "@/lib/messages";

const ID_DOC_TYPES = [
  { idDocType: "kr_id", label: "주민등록증" },
  { idDocType: "driver", label: "운전면허" },
  { idDocType: "passport", label: "여권" },
] as const;

export default function MeKycPage() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idDocType, setIdDocType] = useState<(typeof ID_DOC_TYPES)[number]["idDocType"]>("kr_id");
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getKycStatus()
      .then((data) => setVerified(readKycVerified(data)))
      .catch(() => setVerified(false));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!legalName.trim() || !validPhone(phone) || !birthDate) {
      showToast(MSG.kycNeed, "warning");
      return;
    }
    if (!idDoc || !selfie) {
      showToast(MSG.kycNeedFiles, "warning");
      return;
    }
    setBusy(true);
    try {
      await submitKyc({
        legalName: legalName.trim(),
        phoneE164: toE164(phone),
        birthDate,
        idDocType,
        idDoc,
        selfie,
      });
      setSubmitted(true);
      showToast(MSG.kycOk, "success");
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.kycFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="status-orb verified" aria-hidden="true">
            ✓
          </span>
          <span className="view-kicker">본인확인</span>
          <h1>확인이 끝났어요</h1>
          <p>
            출금에 필요한 본인확인이 완료됐습니다.
            <br />
            주민번호는 받지 않아요.
          </p>
          <button className="form-primary" type="button" onClick={() => router.push("/wallet/withdraw")}>
            출금 화면으로 가기
          </button>
          <button className="text-action" type="button" onClick={() => router.push("/me")}>
            나로 돌아가기
          </button>
        </section>
      </RouteScreen>
    );
  }

  if (submitted) {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="status-orb mail" aria-hidden="true">
            📌
          </span>
          <span className="view-kicker">본인확인</span>
          <h1>요청을 보냈어요</h1>
          <p>
            확인이 끝나면 출금할 수 있어요.
            <br />
            지금은 결과를 기다리면 됩니다.
          </p>
          <button className="form-primary" type="button" onClick={() => router.push("/me")}>
            나로 돌아가기
          </button>
        </section>
      </RouteScreen>
    );
  }

  return (
    <RouteScreen>
      <RouteTop kicker="안전한 출금 준비" title="본인확인" copy="안내를 읽고 기본 정보와 확인 서류를 차례로 준비해 주세요." backPath="/me" />
      <section className="kyc-steps">
        <div className="is-active">
          <span>1</span>
          <strong>안내</strong>
        </div>
        <i></i>
        <div className="is-active">
          <span>2</span>
          <strong>서류</strong>
        </div>
        <i></i>
        <div>
          <span>3</span>
          <strong>확인</strong>
        </div>
      </section>
      <section className="form-page-card">
        <div className="plain-notice">
          <strong>주민번호는 입력하지 마세요.</strong>
          <p>이름, 휴대폰, 생년월일과 확인 서류만 받아요.</p>
        </div>
        <form className="stack-form" data-form="kyc" onSubmit={onSubmit}>
          <div className="form-grid two">
            <label className="form-field">
              <span>
                이름 <b>필수</b>
              </span>
              <input name="legalName" autoComplete="name" required value={legalName} onChange={(event) => setLegalName(event.target.value)} />
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
            <label className="form-field">
              <span>
                생년월일 <b>필수</b>
              </span>
              <input name="birthDate" type="date" required value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            </label>
            <label className="form-field">
              <span>
                신분증 종류 <b>필수</b>
              </span>
              <select
                name="idDocType"
                value={idDocType}
                onChange={(event) => setIdDocType(event.target.value as (typeof ID_DOC_TYPES)[number]["idDocType"])}
              >
                {ID_DOC_TYPES.map((item) => (
                  <option key={item.idDocType} value={item.idDocType}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="form-field">
            <span>
              신분증 사진 <b>필수</b>
            </span>
            <input
              name="idDoc"
              type="file"
              accept="image/*"
              required
              onChange={(event) => setIdDoc(event.target.files?.[0] ?? null)}
            />
            <small>주민번호 뒤쪽이 보이지 않게 가려 주세요.</small>
          </label>
          <label className="form-field">
            <span>
              얼굴 사진 <b>필수</b>
            </span>
            <input
              name="selfie"
              type="file"
              accept="image/*"
              required
              onChange={(event) => setSelfie(event.target.files?.[0] ?? null)}
            />
          </label>
          <button className="form-primary" type="submit" disabled={busy}>
            본인확인 요청
          </button>
        </form>
      </section>
    </RouteScreen>
  );
}
