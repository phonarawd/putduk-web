"use client";

import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { LEGAL_DOCUMENTS, type LegalDocType } from "@/lib/gpt/legalContent";

// /legal/terms /privacy /oss /license 네 화면이 함께 쓴다. (원본 legalDocumentTemplate 그대로)
export function LegalDocumentView({ type }: { type: LegalDocType }) {
  const doc = LEGAL_DOCUMENTS[type];
  return (
    <RouteScreen>
      <RouteTop kicker={doc.kicker} title={doc.title} copy={doc.intro} backPath="/legal" />
      <article className="legal-document">
        <div className="legal-updated">
          <span>운영 주체</span>
          <strong>PRE-OWNED WATCHES L.L.C · DET 1135431</strong>
        </div>
        {doc.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </section>
        ))}
        <div className="legal-end">
          <span className="brand-mark" aria-hidden="true">
            <img src="/putduk-mark.svg" alt="" />
          </span>
          <p>이 문서는 20대부터 70대까지 쉽게 읽을 수 있도록 짧은 문장으로 정리했습니다.</p>
        </div>
      </article>
    </RouteScreen>
  );
}
