import { useId } from "react";
import { TRIAL_CARD_ART } from "@/lib/gpt/trialCard";

type TrialCardArtProps = {
  className?: string;
  decorative?: boolean;
};

// ZIP 카드는 PNG를 따로 참조한다. img로 SVG를 넣으면 도마뱀이 빠지므로 같은 그림을 인라인으로 그린다.
export function TrialCardArt({ className, decorative = false }: TrialCardArtProps) {
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const bgId = `${uid}-bg`;
  const bandId = `${uid}-band`;
  const shadowId = `${uid}-shadow`;
  const clipId = `${uid}-clip`;

  return (
    <svg
      className={className}
      viewBox="0 0 744 1039"
      role="img"
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : `${titleId} ${descId}`}
    >
      {decorative ? null : (
        <>
          <title id={titleId}>퍼뜩 체험 카드 — 오리지널 불꽃 도마뱀</title>
          <desc id={descId}>기존 캐릭터를 복제하지 않은 오리지널 주황색 불꽃 도마뱀 체험 카드</desc>
        </>
      )}
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff8ec" />
          <stop offset="0.55" stopColor="#ffe0a8" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
        <linearGradient id={bandId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff5c35" />
          <stop offset="1" stopColor="#ff9f43" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#692b16" floodOpacity="0.24" />
        </filter>
        <clipPath id={clipId}>
          <rect x="44" y="164" width="656" height="594" rx="28" />
        </clipPath>
      </defs>

      <rect x="16" y="16" width="712" height="1007" rx="42" fill="#351a16" filter={`url(#${shadowId})`} />
      <rect x="28" y="28" width="688" height="983" rx="34" fill={`url(#${bgId})`} stroke="#ffd97d" strokeWidth="5" />
      <path d="M28 62Q28 28 62 28h620q34 0 34 34v98H28z" fill={`url(#${bandId})`} />
      <circle cx="78" cy="94" r="28" fill="#fff1c7" opacity="0.96" />
      <path d="M68 94h20M78 84v20" stroke="#ff6339" strokeWidth="7" strokeLinecap="round" />
      <text x="122" y="84" fill="#fffaf0" fontFamily="Pretendard, Arial, sans-serif" fontSize="28" fontWeight="800">
        퍼뜩 체험 카드
      </text>
      <text
        x="122"
        y="119"
        fill="#ffe7bc"
        fontFamily="Pretendard, Arial, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="2"
      >
        FIRE TRAIL · ORIGINAL MASCOT
      </text>
      <text
        x="666"
        y="103"
        textAnchor="end"
        fill="#fffaf0"
        fontFamily="Pretendard, Arial, sans-serif"
        fontSize="19"
        fontWeight="700"
      >
        TRIAL
      </text>

      <rect x="44" y="164" width="656" height="594" rx="28" fill="#64251a" />
      <g clipPath={`url(#${clipId})`}>
        <image
          x="-20"
          y="134"
          width="808"
          height="808"
          preserveAspectRatio="xMidYMid slice"
          href={TRIAL_CARD_ART}
        />
        <rect x="44" y="164" width="656" height="594" fill="#ff8a3d" opacity="0.07" />
      </g>
      <rect
        x="44"
        y="164"
        width="656"
        height="594"
        rx="28"
        fill="none"
        stroke="#fff0c9"
        strokeOpacity="0.8"
        strokeWidth="4"
      />

      <text
        x="56"
        y="818"
        fill="#8e3b1d"
        fontFamily="Pretendard, Arial, sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="1"
      >
        PUTDUK ORIGINAL
      </text>
      <text x="56" y="870" fill="#3a1b16" fontFamily="Pretendard, Arial, sans-serif" fontSize="42" fontWeight="900">
        불꽃 꼬리 루미
      </text>
      <text x="56" y="904" fill="#75452e" fontFamily="Pretendard, Arial, sans-serif" fontSize="19" fontWeight="600">
        따뜻한 불씨로 첫 경험을 밝혀주는 안내자
      </text>

      <rect x="56" y="936" width="204" height="42" rx="21" fill="#fffaf0" opacity="0.88" />
      <text
        x="158"
        y="964"
        textAnchor="middle"
        fill="#b44926"
        fontFamily="Pretendard, Arial, sans-serif"
        fontSize="18"
        fontWeight="800"
      >
        체험 전용
      </text>
      <text
        x="682"
        y="964"
        textAnchor="end"
        fill="#8e3b1d"
        fontFamily="Pretendard, Arial, sans-serif"
        fontSize="18"
        fontWeight="800"
      >
        No. 001
      </text>
    </svg>
  );
}
