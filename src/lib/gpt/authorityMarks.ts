export type AuthorityMark = {
  id: string;
  label: string;
  short: string;
  caption: string;
  logoSrc: string;
  logoAlt: string;
  sourceUrl: string;
};

export const FINANCE_AUTHORITY_MARKS: readonly AuthorityMark[] = [
  {
    id: "fsc",
    label: "금융위원회",
    short: "FSC",
    caption: "금융정책·감독",
    logoSrc: "/assets/authority-marks/fsc-official.png",
    logoAlt: "금융위원회 공식 로고",
    sourceUrl: "https://www.fsc.go.kr/fsc010101",
  },
  {
    id: "fss",
    label: "금융감독원",
    short: "FSS",
    caption: "금융감독·검사",
    logoSrc: "/assets/authority-marks/fss-official.png",
    logoAlt: "금융감독원 공식 CI",
    sourceUrl: "https://www.fss.or.kr/eng/main/contents.do?menuNo=400098",
  },
  {
    id: "kofiu",
    label: "금융정보분석원",
    short: "KoFIU",
    caption: "자금세탁방지·FIU",
    logoSrc: "/assets/authority-marks/kofiu-official.png",
    logoAlt: "금융정보분석원 공식 로고",
    sourceUrl: "https://www.kofiu.go.kr/kor/intro/ci.do",
  },
  {
    id: "kftc",
    label: "금융결제원",
    short: "KFTC",
    caption: "전자금융·결제",
    logoSrc: "/assets/authority-marks/kftc-official.png",
    logoAlt: "금융결제원 공식 로고",
    sourceUrl: "https://www.kftc.or.kr/",
  },
] as const;
