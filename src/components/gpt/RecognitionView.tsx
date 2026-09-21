"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import {
  RECOGNITION_CREDENTIALS,
  RECOGNITION_INTRO,
  recognitionCredential,
  type RecognitionCredential,
} from "@/lib/gpt/recognitionContent";
import { FinanceAuthorityMarks } from "@/components/gpt/FinanceAuthorityMarks";
import { useGptSession } from "@/lib/gpt/GptScopes";

function formatIssuedAt(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function RecognitionCertificate({ credential }: { credential: RecognitionCredential }) {
  return (
    <article className="recognition-certificate" aria-labelledby={"cert-title-" + credential.id}>
      <div className={"recognition-certificate-seal is-" + credential.seal} aria-hidden="true">
        <span>PUTDUK</span>
        <strong>OFFICIAL</strong>
      </div>

      <header className="recognition-certificate-head">
        <span className="recognition-certificate-chip">{credential.chip}</span>
        <h2 id={"cert-title-" + credential.id}>{credential.title}</h2>
        <p>{credential.summary}</p>
      </header>

      <dl className="recognition-certificate-meta">
        <div>
          <dt>발행 주체</dt>
          <dd>{credential.issuer}</dd>
        </div>
        <div>
          <dt>확인서 번호</dt>
          <dd>{credential.certificateNo}</dd>
        </div>
        <div>
          <dt>발행일</dt>
          <dd>{formatIssuedAt(credential.issuedAt)}</dd>
        </div>
        <div>
          <dt>확인 대상</dt>
          <dd>{credential.subject}</dd>
        </div>
      </dl>

      {credential.id === "finance-public" ? <FinanceAuthorityMarks /> : null}

      <div className="recognition-certificate-body">
        <h3>확인 내용</h3>
        <ul>
          {credential.statements.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <footer className="recognition-certificate-foot">
        <span>퍼뜩 리셀러 데스크</span>
        <strong>{credential.issuer}</strong>
      </footer>
    </article>
  );
}

export function RecognitionView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loggedIn } = useGptSession();
  const initialId = searchParams.get("doc");
  const [selectedId, setSelectedId] = useState(() => recognitionCredential(initialId).id);

  const selected = useMemo(() => recognitionCredential(selectedId), [selectedId]);

  return (
    <RouteScreen>
      <RouteTop
        kicker="운영 근거"
        title="공식 인정·운영 확인서"
        copy={RECOGNITION_INTRO}
        backPath="/legal"
      />

      <section className="recognition-picker" aria-label="확인서 목록">
        {RECOGNITION_CREDENTIALS.map((item) => {
          const active = item.id === selected.id;
          return (
            <button
              key={item.id}
              type="button"
              className={"recognition-picker-card" + (active ? " is-active" : "")}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                setSelectedId(item.id);
                router.replace("/legal/recognition?doc=" + item.id, { scroll: false });
              }}
            >
              <span>{item.chip}</span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
            </button>
          );
        })}
      </section>

      <section className="recognition-stage" aria-live="polite" aria-label="선택한 확인서">
        <RecognitionCertificate credential={selected} />
      </section>

      <div className="recognition-note">
        <p>
          확인서에 적힌 운영 주체와 등록 정보는{" "}
          <button type="button" onClick={() => router.push("/legal")}>
            약관과 정보
          </button>{" "}
          화면과 같습니다.
          {loggedIn ? (
            <>
              {" "}
              추가 문의는{" "}
              <button type="button" onClick={() => router.push("/me/support")}>
                고객지원
              </button>{" "}
              화면을 이용해 주세요.
            </>
          ) : (
            " 추가 문의는 로그인 후 고객지원 화면을 이용해 주세요."
          )}
        </p>
      </div>
    </RouteScreen>
  );
}
