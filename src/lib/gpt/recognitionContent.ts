export type RecognitionSeal = "operator" | "platform" | "standards";

export type RecognitionCredential = {
  id: string;
  chip: string;
  title: string;
  summary: string;
  issuer: string;
  certificateNo: string;
  issuedAt: string;
  subject: string;
  statements: readonly string[];
  seal: RecognitionSeal;
};

export const RECOGNITION_INTRO =
  "퍼뜩 리셀러 데스크의 운영 주체와 운영 기준을 확인서 형식으로 정리했어요. 아래에서 항목을 누르면 바로 전체 확인서를 볼 수 있어요.";

export const RECOGNITION_CREDENTIALS: readonly RecognitionCredential[] = [
  {
    id: "operator-reg",
    chip: "운영 주체",
    title: "법인 등록 확인서",
    summary: "PRE-OWNED WATCHES L.L.C · DET 1135431",
    issuer: "PRE-OWNED WATCHES L.L.C",
    certificateNo: "DET-1135431",
    issuedAt: "2026-09-09",
    subject: "퍼뜩 리셀러 데스크 운영 주체",
    statements: [
      "퍼뜩 리셀러 데스크의 운영 주체는 PRE-OWNED WATCHES L.L.C입니다.",
      "등록 정보 DET 1135431은 이용약관·개인정보 처리방침·라이선스 고지에 동일하게 기재되어 있습니다.",
      "서비스 문의와 고객지원 요청은 앱의 고객지원 화면을 통해 운영 주체로 전달됩니다.",
    ],
    seal: "operator",
  },
  {
    id: "platform-kr",
    chip: "대한민국",
    title: "공식 플랫폼 운영 확인서",
    summary: "대한민국에서 공식 운영하는 퍼뜩 리셀러 데스크",
    issuer: "PRE-OWNED WATCHES L.L.C",
    certificateNo: "PUTDUK-KR-OP-2026",
    issuedAt: "2026-09-09",
    subject: "퍼뜩 · 대한민국 공식 플랫폼",
    statements: [
      "퍼뜩은 대한민국 이용자를 대상으로 리셀러 데스크 서비스를 공식 운영합니다.",
      "이용자는 본인 자본, 오늘 기회, 진행 중인 업무를 한 화면에서 확인할 수 있습니다.",
      "입금은 이용료가 아니라 리셀 기회 실행을 위한 운용 자본이며, 선택한 금액만 잠깁니다.",
      "조건이 맞지 않으면 업무를 안전하게 중단할 수 있도록 화면과 안내를 제공합니다.",
    ],
    seal: "platform",
  },
  {
    id: "finance-public",
    chip: "운영 기준",
    title: "금융·공공 운영 기준 확인서",
    summary: "자본·약관·고지 기준을 따르는 운영 확인",
    issuer: "PRE-OWNED WATCHES L.L.C",
    certificateNo: "PUTDUK-FP-OP-2026",
    issuedAt: "2026-09-09",
    subject: "금융·공공 운영 기준 준수",
    statements: [
      "이용자 자본은 본인 예치·잠금·출금 가능 수익으로 구분해 화면에 표시합니다.",
      "서버에 없는 금액이나 기회를 만들어 보여 주지 않으며, 확인되지 않은 값은 솔직하게 안내합니다.",
      "이용약관, 개인정보 처리방침, 오픈소스 고지, 라이선스·저작권 고지를 앱에서 열람할 수 있습니다.",
      "운영 주체와 등록 정보는 약관·정보 화면과 이 확인서에서 동일하게 확인할 수 있습니다.",
    ],
    seal: "standards",
  },
] as const;

export function recognitionCredential(id: string | null | undefined): RecognitionCredential {
  return RECOGNITION_CREDENTIALS.find((item) => item.id === id) ?? RECOGNITION_CREDENTIALS[0];
}
