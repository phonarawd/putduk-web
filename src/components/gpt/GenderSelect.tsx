"use client";

import type { Gender } from "@/lib/gpt/types";

interface GenderSelectProps {
  value: Gender;
  onChange: (value: "male" | "female") => void;
  /** field: "성별 필수" 라벨 포함 (가입/필수정보/본인확인), compact: 버튼만 (나 프로필) */
  variant?: "field" | "compact";
  group?: string;
}

// 성별은 모든 화면에서 같은 큰 버튼 컴포넌트를 쓴다. (원본 genderMarkup/renderProfileGender 그대로)
export function GenderSelect({ value, onChange, variant = "field", group = "gender" }: GenderSelectProps) {
  const buttons = (
    <div
      className={"gender-choice" + (variant === "compact" ? " compact-gender" : "")}
      data-gender-group={group}
      aria-label="성별 선택"
    >
      <button
        type="button"
        className={value === "male" ? "is-selected" : ""}
        aria-pressed={value === "male"}
        onClick={() => onChange("male")}
      >
        {value === "male" ? (
          <>
            <span aria-hidden="true">✓</span> 남성
          </>
        ) : (
          "남성"
        )}
      </button>
      <button
        type="button"
        className={value === "female" ? "is-selected" : ""}
        aria-pressed={value === "female"}
        onClick={() => onChange("female")}
      >
        {value === "female" ? (
          <>
            <span aria-hidden="true">✓</span> 여성
          </>
        ) : (
          "여성"
        )}
      </button>
    </div>
  );

  if (variant === "compact") return buttons;

  return (
    <div className="form-field gender-field">
      <span>
        성별 <b>필수</b>
      </span>
      {buttons}
    </div>
  );
}
