import { FINANCE_AUTHORITY_MARKS } from "@/lib/gpt/authorityMarks";

export function FinanceAuthorityMarks() {
  return (
    <section className="recognition-authority-board" aria-label="한국 금융·공공기관 공식 CI">
      <div className="recognition-authority-heading">
        <span>한국 금융·공공기관 공식 CI</span>
        <strong>인증·확인 마크</strong>
        <p>금융·공공 운영 기준 확인서에 연결된 국내 금융당국·공공기관의 공식 로고입니다.</p>
      </div>
      <ul className="recognition-authority-marks">
        {FINANCE_AUTHORITY_MARKS.map((mark) => (
          <li key={mark.id} className={"recognition-authority-mark is-" + mark.id}>
            <div className="recognition-authority-mark-logo">
              <img src={mark.logoSrc} alt={mark.logoAlt} loading="lazy" decoding="async" />
            </div>
            <strong>{mark.label}</strong>
            <span>{mark.caption}</span>
            <em>{mark.short} 확인</em>
          </li>
        ))}
      </ul>
      <p className="recognition-authority-source">
        각 로고는 해당 기관 공식 누리집에서 사용하는 CI 파일을 프로젝트에 저장해 표시합니다.
      </p>
    </section>
  );
}
