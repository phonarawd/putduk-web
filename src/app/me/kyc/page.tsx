"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { useGpt } from "@/lib/gpt/GptContext";
import {
  ApiError,
  getKycStatus,
  KYC_FILE_ACCEPT,
  kycFileIssue,
  kycPairIssue,
  readKycReason,
  readKycUiStatus,
  submitKyc,
  toE164,
  type KycUiStatus,
} from "@/lib/api";
import { validPhone } from "@/lib/gpt/validate";
import { MSG, toastFromError, userFacingError } from "@/lib/messages";

const ID_DOC_TYPES = [
  { idDocType: "kr_id", label: "주민등록증" },
  { idDocType: "driver", label: "운전면허" },
  { idDocType: "passport", label: "여권" },
] as const;

type PageStatus = "loading" | "error" | KycUiStatus | "form";

function fileHint(file: File | null) {
  if (!file) return null;
  const kb = Math.max(1, Math.round(file.size / 1024));
  const type = file.type || "";
  return `${file.name} · ${kb}KB${type ? ` · ${type}` : ""}`;
}

function FilePreview({ file }: { file: File | null }) {
  const url = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return "";
    return URL.createObjectURL(file);
  }, [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  if (!file) return null;
  return (
    <>
      <small>{fileHint(file)}</small>
      {url ? <img src={url} alt="" /> : null}
    </>
  );
}

export default function MeKycPage() {
  const router = useRouter();
  const { showToast } = useGpt();
  const [page, setPage] = useState<PageStatus>("loading");
  const [reason, setReason] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idDocType, setIdDocType] = useState<(typeof ID_DOC_TYPES)[number]["idDocType"]>("kr_id");
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function applyStatus(data: unknown) {
    const status = readKycUiStatus(data);
    if (!status) {
      setPage("error");
      setReason("");
      return;
    }
    setReason(readKycReason(data));
    setPage(status);
  }

  function fetchStatus() {
    return getKycStatus()
      .then(applyStatus)
      .catch(() => {
        setReason("");
        setPage("error");
      });
  }

  function loadStatus() {
    setPage("loading");
    void fetchStatus();
  }

  useEffect(() => {
    void fetchStatus();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!legalName.trim() || !validPhone(phone) || !birthDate) {
      showToast(MSG.kycNeed, "warning");
      return;
    }
    const pairIssue = kycPairIssue(idDoc, selfie);
    if (pairIssue) {
      showToast(userFacingError(pairIssue, MSG.kycNeedFiles), "warning");
      return;
    }
    setBusy(true);
    try {
      await submitKyc({
        legalName: legalName.trim(),
        phoneE164: toE164(phone),
        birthDate,
        idDocType,
        idDoc: idDoc as File,
        selfie: selfie as File,
      });
      const next = await getKycStatus();
      applyStatus(next);
      showToast(MSG.kycOk, "success");
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        await fetchStatus();
        return;
      }
      const payload = toastFromError(error, MSG.kycFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  if (page === "loading") {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="view-kicker">본인확인</span>
          <h1>상태를 확인하고 있어요</h1>
        </section>
      </RouteScreen>
    );
  }

  if (page === "error") {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="view-kicker">본인확인</span>
          <h1>{MSG.kycLoadFail}</h1>
          <button className="form-primary" type="button" onClick={loadStatus}>
            {MSG.withdrawPolicyRetry}
          </button>
        </section>
      </RouteScreen>
    );
  }

  if (page === "verified") {
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

  if (page === "pending") {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="status-orb mail" aria-hidden="true">
            📌
          </span>
          <span className="view-kicker">본인확인</span>
          <h1>{MSG.kycPending}</h1>
          <p>새로고침해도 서버에 있는 상태만 보여 드려요.</p>
          <button className="form-primary" type="button" onClick={() => router.push("/me")}>
            나로 돌아가기
          </button>
        </section>
      </RouteScreen>
    );
  }

  if (page === "rejected") {
    return (
      <RouteScreen>
        <section className="status-page-card">
          <span className="view-kicker">본인확인</span>
          <h1>{MSG.kycRejected}</h1>
          {reason ? <p>{reason}</p> : null}
          <button className="form-primary" type="button" onClick={() => setPage("form")}>
            다시 제출하기
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
          </div>
          <div className="form-field">
            <span>
              신분증 종류 <b>필수</b>
            </span>
            <div className="segmented-tabs three" role="radiogroup" aria-label="신분증 종류">
              {ID_DOC_TYPES.map((item) => (
                <button
                  key={item.idDocType}
                  type="button"
                  role="radio"
                  aria-checked={idDocType === item.idDocType}
                  className={idDocType === item.idDocType ? "is-selected" : ""}
                  onClick={() => setIdDocType(item.idDocType)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="idDocType" value={idDocType} />
          </div>
          <label className="form-field">
            <span>
              신분증 사진 <b>필수</b>
            </span>
            <input
              name="idDoc"
              type="file"
              accept={KYC_FILE_ACCEPT}
              required
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                const issue = kycFileIssue(file);
                if (file && issue) {
                  showToast(userFacingError(issue, MSG.kycNeedFiles), "warning");
                  event.target.value = "";
                  setIdDoc(null);
                  return;
                }
                setIdDoc(file);
              }}
            />
            <small>주민번호 뒤쪽이 보이지 않게 가려 주세요.</small>
            <FilePreview file={idDoc} />
          </label>
          <label className="form-field">
            <span>
              얼굴 사진 <b>필수</b>
            </span>
            <input
              name="selfie"
              type="file"
              accept={KYC_FILE_ACCEPT}
              required
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                const issue = kycFileIssue(file);
                if (file && issue) {
                  showToast(userFacingError(issue, MSG.kycNeedFiles), "warning");
                  event.target.value = "";
                  setSelfie(null);
                  return;
                }
                setSelfie(file);
              }}
            />
            <FilePreview file={selfie} />
          </label>
          <button className="form-primary" type="submit" disabled={busy}>
            본인확인 요청
          </button>
        </form>
      </section>
    </RouteScreen>
  );
}
